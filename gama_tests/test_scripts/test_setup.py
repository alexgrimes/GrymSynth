import torch
import sys
import platform
import os

def test_environment():
    """Basic environment verification"""
    print("\nSystem Information:")
    print(f"Python version: {sys.version}")
    print(f"Platform: {platform.platform()}")
    
    print("\nPyTorch Setup:")
    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        print("\nGPU Information:")
        print(f"GPU device: {torch.cuda.get_device_name(0)}")
        try:
            print(f"CUDA version: {torch.version.cuda}")
        except AttributeError:
            print("CUDA version information not available")
        
        # Memory info
        print("\nGPU Memory:")
        memory_total = torch.cuda.get_device_properties(0).total_memory / 1024**3
        memory_allocated = torch.cuda.memory_allocated(0) / 1024**3
        print(f"Total memory: {memory_total:.2f}GB")
        print(f"Currently allocated: {memory_allocated:.2f}GB")

if __name__ == "__main__":
    test_environment()