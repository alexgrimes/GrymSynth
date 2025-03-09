import torch
from transformers import Wav2Vec2ForCTC, AutoProcessor, AutoModelForAudioClassification
import os
from .memory_utils import MemoryMonitor

def check_gpu_compatibility():
    """
    Check if GPU is compatible with model requirements
    """
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA not available")
    
    vram = torch.cuda.get_device_properties(0).total_memory / 1024**3
    if vram < 5.5:  # Allow some margin below 6GB
        raise RuntimeError(f"Insufficient VRAM: {vram:.1f}GB available, need at least 5.5GB")
    
    print(f"GPU compatibility check passed: {vram:.1f}GB VRAM available")
    return True

def load_audio_model(model_choice="facebook/wav2vec2-large-robust-ft-swbd-300h"):
    """
    Load audio model with memory optimizations for 6GB VRAM
    
    Args:
        model_choice: Model identifier (default: facebook/wav2vec2-large-robust-ft-swbd-300h)
        
    Available models:
    - "facebook/wav2vec2-large-robust-ft-swbd-300h" (Large model, better quality)
    - "facebook/wav2vec2-base-960h" (Base model, faster)
    - "MIT/ast-finetuned-audioset-10-10-0.4593" (Audio classification)
    """
    # Ensure GPU is compatible
    check_gpu_compatibility()
    
    # Model identifier
    model_id = model_choice
    
    print(f"Loading model: {model_id}")
    
    # Handle potential model loading issues
    try:
        # Determine model type
        if "ast" in model_id.lower():
            model_class = AutoModelForAudioClassification
        else:
            model_class = Wav2Vec2ForCTC

        # Load model with optimizations
        model = model_class.from_pretrained(
            model_id,
            torch_dtype=torch.float16  # Use half precision
        )
        
        # Move to GPU and ensure half precision
        model = model.to("cuda").half()
        
        # Set to evaluation mode
        model.eval()
        
        return model
        
    except Exception as e:
        print(f"Error loading model: {e}")
        print("\nTroubleshooting:")
        print(f"1. Ensure '{model_id}' model is available for download")
        print("2. Check internet connection")
        print("3. Try loading with fewer optimizations if VRAM is insufficient")
        
        # Try with fallback model if specified model fails
        fallback_model = "facebook/wav2vec2-base-960h"
        fallback_msg = f"\nAttempting with fallback model: {fallback_model}"
        print(fallback_msg)
        
        try:
            # Try with minimal configuration
            model = Wav2Vec2ForCTC.from_pretrained(
                fallback_model,
                torch_dtype=torch.float16
            ).to("cuda").half()
            model.eval()
            return model
        except Exception as fallback_e:
            print(f"Fallback loading also failed: {fallback_e}")
            raise

def get_processor(model_id="facebook/wav2vec2-large-robust-ft-swbd-300h"):
    """
    Load the processor for the specified audio model
    """
    return AutoProcessor.from_pretrained(model_id)

def memory_stats():
    """Get current GPU memory statistics"""
    if not torch.cuda.is_available():
        return None
        
    return {
        "allocated": torch.cuda.memory_allocated() / 1024**3,
        "reserved": torch.cuda.memory_reserved() / 1024**3,
        "max_allocated": torch.cuda.max_memory_allocated() / 1024**3,
        "max_reserved": torch.cuda.max_memory_reserved() / 1024**3
    }