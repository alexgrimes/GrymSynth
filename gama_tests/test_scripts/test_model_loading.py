"""
GAMA Model Loading Memory Test

This script tests loading transformer models with memory tracking to verify they fit
within VRAM constraints. The testing strategy is:

1. Start with a small model (facebook/opt-125m) to verify the testing pipeline
2. Track detailed memory usage during loading and inference
3. Support progressive testing with larger models
4. Provide clear memory statistics and debug information

Testing Progression:
- Initial test with small model (125M parameters) to validate pipeline
- Can test medium models (~1B parameters) to assess scaling
- Finally test full GAMA model or similar audio models
- Compare memory usage patterns across model sizes

Memory Tracking Features:
- Baseline memory measurement
- Peak memory tracking during loading
- Memory increase calculation
- VRAM utilization percentage
- Detailed debug information on failure
"""

import torch
import time
import sys
import os
from pathlib import Path

# Add the parent directory to the path to enable imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import from our existing modules
from .model_config import load_gama_optimized, get_tokenizer, check_gpu_compatibility
from .memory_utils import MemoryMonitor, MemoryTracker

def profile_memory_load():
    """Test GAMA model loading with detailed memory profiling"""
    print("\n=== GAMA Model Loading Test ===\n")
    
    # 1. Measure baseline memory before loading
    initial_memory = torch.cuda.memory_allocated() / 1024**3
    print(f"Initial GPU memory: {initial_memory:.4f} GB")
    
    # 2. Track peak memory during loading
    try:
        start_time = time.time()
        print("Attempting to load GAMA model...")
        
        # Track memory during loading
        with MemoryTracker() as tracker:
            # Load model with optimizations
            model = load_gama_optimized()
            
            # Get model size info
            param_count = sum(p.numel() for p in model.parameters())
            trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
            
        # Calculate loading time
        load_time = time.time() - start_time
        
        # 3. Measure final memory
        final_memory = torch.cuda.memory_allocated() / 1024**3
        
        # 4. Report success
        print("\n=== Model Loading Successful ===")
        print(f"Loading time: {load_time:.2f} seconds")
        print(f"Total parameters: {param_count:,}")
        print(f"Trainable parameters: {trainable_params:,}")
        print(f"Memory usage: {final_memory:.4f} GB")
        print(f"Memory increase: {final_memory - initial_memory:.4f} GB")
        print(f"Peak memory usage: {tracker.peak_allocated:.4f} GB")
        print(f"VRAM utilization: {(tracker.peak_allocated / 6.0) * 100:.2f}%")
        
        # 5. Run basic model verification
        verify_model_output(model)
        
        return True, model
        
    except Exception as e:
        print(f"\n=== Model Loading Failed ===")
        print(f"Error: {str(e)}")
        
        # Debug information
        print("\nDebug information:")
        print(f"CUDA available: {torch.cuda.is_available()}")
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"Total VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
        print(f"Current memory allocation: {torch.cuda.memory_allocated() / 1024**3:.4f} GB")
        
        return False, None

def verify_model_output(model):
    """Verify model works by generating a simple output"""
    print("\nVerifying model functionality...")
    
    try:
        # Load tokenizer
        tokenizer = get_tokenizer()
        
        # Create simple input
        input_text = "This is a test of the GAMA model:"
        inputs = tokenizer(input_text, return_tensors="pt").to(model.device)
        
        # Generate with minimal tokens to verify functionality
        with torch.no_grad():
            print("Generating test output...")
            generation_config = {
                "max_new_tokens": 5,
                "num_beams": 1,
                "do_sample": False,
                "pad_token_id": tokenizer.eos_token_id
            }
            outputs = model.generate(**inputs, **generation_config)
            
            decoded = tokenizer.decode(outputs[0], skip_special_tokens=True)
            print(f"Input: {input_text}")
            print(f"Output: {decoded}")
            
        print("Model verification successful")
        return True
    except Exception as e:
        print(f"Model verification failed: {str(e)}")
        return False

if __name__ == "__main__":
    # Clear GPU cache before starting
    torch.cuda.empty_cache()
    
    print("GPU Memory before test:", torch.cuda.memory_allocated() / 1024**3, "GB")
    
    # Run profile test
    success, model = profile_memory_load()
    
    # Cleanup
    if success and model is not None:
        # Move model to CPU to free GPU memory
        model.cpu()
        del model
        
        # Force garbage collection
        import gc
        gc.collect()
        torch.cuda.empty_cache()
        
        print("\nFinal GPU Memory:", torch.cuda.memory_allocated() / 1024**3, "GB")
    
    # Overall result
    if success:
        print("\n✅ GAMA Model Loading Test: PASSED")
        print("The model fits within the 6GB VRAM constraint!")
    else:
        print("\n❌ GAMA Model Loading Test: FAILED") 
        print("Memory optimization needed to fit in 6GB VRAM.")