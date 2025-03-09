import torch
import numpy as np
import time
import os
import sys
from pathlib import Path
from typing import Tuple

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import from our modules
from .model_config import load_audio_model, get_processor
from .memory_utils import MemoryMonitor, optimize_memory

def generate_test_audio(duration: float = 3.0, sample_rate: int = 16000) -> Tuple[np.ndarray, int]:
    """
    Generate a synthetic audio sample for testing
    
    Args:
        duration: Audio duration in seconds
        sample_rate: Audio sample rate in Hz
        
    Returns:
        tuple: (audio_data, sample_rate)
    """
    print(f"Generating {duration}s test audio at {sample_rate}Hz")
    
    # Create a simple sine wave
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio = np.sin(2 * np.pi * 440 * t)  # 440 Hz (A4 note)
    
    # Normalize
    audio = audio / np.max(np.abs(audio))
    
    return audio.astype(np.float32), sample_rate

def profile_memory_load() -> None:
    """Test audio model loading with detailed memory profiling"""
    print("\n=== Audio Model Memory Test ===\n")
    
    # Initialize memory monitor
    monitor = MemoryMonitor()
    
    # 1. Measure baseline memory
    initial_memory = torch.cuda.memory_allocated() / 1024**3
    print(f"Initial GPU memory: {initial_memory:.4f} GB")
    
    try:
        # 2. Track memory during model loading
        print("\nLoading Wav2Vec2 model...")
        start_time = time.time()
        
        with monitor:
            # Load model with memory tracking
            model = load_audio_model()
            processor = get_processor()
            
            # Get model size info
            param_count = sum(p.numel() for p in model.parameters())
            param_size = sum(p.nelement() * p.element_size() for p in model.parameters()) / 1024**3
            
        # Calculate loading time
        load_time = time.time() - start_time
        
        # 3. Report model statistics
        print("\n=== Model Loading Statistics ===")
        print(f"Loading time: {load_time:.2f} seconds")
        print(f"Parameter count: {param_count:,}")
        print(f"Parameter size: {param_size:.2f} GB")
        print(f"Peak GPU memory: {monitor.peak_allocated:.2f} GB")
        print(f"Memory overhead: {(monitor.peak_allocated - param_size):.2f} GB")
        print(f"VRAM utilization: {(monitor.peak_allocated / 6.0) * 100:.1f}%")
        
        # 4. Test audio processing
        test_audio_processing(model, processor)
        
        # 5. Cleanup
        cleanup_model(model)
        
    except Exception as e:
        print(f"\n=== Model Loading Failed ===")
        print(f"Error: {str(e)}")
        
        # Debug information
        print("\nDebug Information:")
        print(f"CUDA available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"GPU: {torch.cuda.get_device_name(0)}")
            print(f"Total VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
            print(f"Current memory: {torch.cuda.memory_allocated() / 1024**3:.2f} GB")
            print(f"Memory reserved: {torch.cuda.memory_reserved() / 1024**3:.2f} GB")
        raise

def test_audio_processing(model, processor) -> None:
    """
    Test processing audio with the model
    
    Args:
        model: Loaded audio model
        processor: Audio processor
    """
    print("\n=== Testing Audio Processing ===")
    
    try:
        # Create test audio
        audio, sample_rate = generate_test_audio()
        
        # Track memory during processing
        with MemoryMonitor() as monitor:
            print("Processing audio...")
            
            # Process audio with memory tracking
            input_values = processor(
                audio,
                sampling_rate=sample_rate,
                return_tensors="pt",
                padding=True
            ).input_values.to("cuda", dtype=torch.float16)
            
            # Generate transcription
            with torch.no_grad():
                logits = model(input_values).logits
                predicted_ids = torch.argmax(logits, dim=-1)
                transcription = processor.batch_decode(predicted_ids)
        
        # Report results
        print(f"\nTranscription: '{transcription[0]}'")
        print(f"Peak processing memory: {monitor.peak_allocated:.2f} GB")
        print("Audio processing completed successfully")
        
    except torch.cuda.OutOfMemoryError as e:
        print("\nOut of Memory Error during processing")
        print("Consider:")
        print("1. Using a shorter audio sample")
        print("2. Reducing batch size")
        print("3. Using more aggressive memory optimization")
        raise
        
    except Exception as e:
        print(f"Audio processing failed: {e}")
        raise

def cleanup_model(model):
    """
    Clean up model and free GPU memory
    
    Args:
        model: The model to cleanup
    """
    try:
        print("\nCleaning up resources...")
        
        # Move model to CPU
        model.cpu()
        del model
        
        # Force garbage collection
        import gc
        gc.collect()
        torch.cuda.empty_cache()
        
        # Log final memory state
        if torch.cuda.is_available():
            final_memory = torch.cuda.memory_allocated() / 1024**3
            print(f"Final GPU memory: {final_memory:.2f} GB")
            
    except Exception as e:
        print(f"Cleanup error: {e}")

if __name__ == "__main__":
    # Initial cleanup
    optimize_memory()
    
    print("\nGPU Information:")
    if torch.cuda.is_available():
        print(f"Device: {torch.cuda.get_device_name(0)}")
        print(f"CUDA Version: {torch.version.cuda}")
        print(f"PyTorch Version: {torch.__version__}")
        print(f"Total VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    else:
        print("No GPU available")
        sys.exit(1)
    
    # Run memory profiling test
    try:
        profile_memory_load()
        print("\n✅ Audio Model Test: PASSED")
        print("Model fits within 6GB VRAM constraint")
    except Exception as e:
        print(f"\n❌ Audio Model Test: FAILED")
        print(f"Error: {e}")
        print("Consider using the troubleshooting steps in the documentation")
        sys.exit(1)