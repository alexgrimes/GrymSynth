import torch
import psutil
import os
import gc
import time
from typing import Dict, Optional

class MemoryMonitor:
    """Memory monitoring and management utilities for GAMA model"""
    
    def __init__(self, device=0, log_interval=1.0):
        """
        Initialize memory monitor
        
        Args:
            device: CUDA device ID (default: 0)
            log_interval: Logging interval in seconds (default: 1.0)
        """
        self.device = device
        self.log_interval = log_interval
        self.peak_allocated = 0
        self.peak_reserved = 0
        self.monitoring = False
        
    @staticmethod
    def get_system_memory() -> Dict[str, float]:
        """Get system memory usage in GB"""
        vm = psutil.virtual_memory()
        return {
            'total': vm.total / (1024**3),
            'available': vm.available / (1024**3),
            'used': vm.used / (1024**3),
            'percent': vm.percent
        }
    
    @staticmethod
    def get_gpu_memory() -> Optional[Dict[str, float]]:
        """Get GPU memory usage in GB"""
        if not torch.cuda.is_available():
            return None
            
        try:
            return {
                'allocated': torch.cuda.memory_allocated() / (1024**3),
                'reserved': torch.cuda.memory_reserved() / (1024**3),
                'max_allocated': torch.cuda.max_memory_allocated() / (1024**3)
            }
        except Exception:
            return None

    def start_monitoring(self):
        """Start continuous memory monitoring"""
        self.monitoring = True
        self.peak_allocated = 0
        self.peak_reserved = 0
        
        # Reset stats
        if torch.cuda.is_available():
            torch.cuda.reset_peak_memory_stats(self.device)
        
        print("\n--- Starting Memory Monitoring ---")
        self._log_current_usage()
        return self
    
    def stop_monitoring(self):
        """Stop continuous memory monitoring"""
        self.monitoring = False
        print("\n--- Memory Monitoring Stopped ---")
        self._log_current_usage()
        print(f"Peak allocated: {self.peak_allocated:.2f}GB")
        print(f"Peak reserved: {self.peak_reserved:.2f}GB")
    
    def _log_current_usage(self):
        """Log current GPU memory usage"""
        if not torch.cuda.is_available():
            print("No GPU available")
            return
            
        # Convert bytes to GB
        allocated = torch.cuda.memory_allocated(self.device) / 1024**3
        reserved = torch.cuda.memory_reserved(self.device) / 1024**3
        
        # Update peak values
        self.peak_allocated = max(self.peak_allocated, allocated)
        self.peak_reserved = max(self.peak_reserved, reserved)
        
        print(f"GPU memory: {allocated:.2f}GB allocated, {reserved:.2f}GB reserved")
    
    @staticmethod
    def optimize_memory_usage():
        """Perform memory optimization"""
        # Clear Python garbage collector
        gc.collect()
        
        # Clear PyTorch CUDA cache
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            
        # Suggest process memory to OS for release
        if hasattr(torch.cuda, 'empty_cache'):
            torch.cuda.empty_cache()
    
    @staticmethod
    def check_memory_requirements(required_gpu_memory: float = 6.0) -> bool:
        """
        Check if system meets memory requirements
        
        Args:
            required_gpu_memory: Required GPU memory in GB (default: 6.0)
            
        Returns:
            bool: True if requirements are met, False otherwise
        """
        if not torch.cuda.is_available():
            print("CUDA is not available")
            return False
            
        total_gpu_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        
        if total_gpu_memory < required_gpu_memory:
            print(f"Insufficient GPU memory: {total_gpu_memory:.1f}GB available, {required_gpu_memory}GB required")
            return False
            
        return True
    
    def log_memory_stats(self, log_file: str = "memory_usage.log"):
        """Log current memory statistics to file"""
        system_memory = self.get_system_memory()
        gpu_memory = self.get_gpu_memory()
        
        with open(log_file, 'a') as f:
            f.write("\n=== Memory Statistics ===\n")
            f.write(f"System Memory:\n")
            for key, value in system_memory.items():
                f.write(f"  {key}: {value:.2f} GB\n")
            
            if gpu_memory:
                f.write(f"\nGPU Memory:\n")
                for key, value in gpu_memory.items():
                    f.write(f"  {key}: {value:.2f} GB\n")
            
            f.write("=" * 30 + "\n")
    
    @staticmethod
    def emergency_cleanup():
        """Emergency memory cleanup when running low on memory"""
        # Force garbage collection
        gc.collect()
        
        # Clear CUDA cache
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            
        # Clear unused memory pools
        if hasattr(torch.cuda, 'empty_cache'):
            torch.cuda.empty_cache()
            
        # Suggest memory release to OS
        if hasattr(psutil, 'Process'):
            try:
                p = psutil.Process(os.getpid())
                p.memory_info()
            except Exception:
                pass

    def __enter__(self):
        """Context manager support"""
        return self.start_monitoring()
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.stop_monitoring()

def optimize_memory():
    """Helper function to optimize memory usage"""
    MemoryMonitor.optimize_memory_usage()