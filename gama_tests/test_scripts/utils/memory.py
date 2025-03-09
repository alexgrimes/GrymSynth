#!/usr/bin/env python
import torch
import psutil
import gc
import time
import logging
from typing import Dict, Optional, Tuple, Any
from dataclasses import dataclass
from contextlib import contextmanager

@dataclass
class MemoryStats:
    """Container for memory statistics"""
    gpu_allocated: float  # GB
    gpu_cached: float    # GB
    gpu_max_allocated: float  # GB
    gpu_total: float    # GB
    ram_used: float     # GB
    ram_available: float  # GB
    ram_total: float    # GB

class MemoryManager:
    """Memory management and monitoring for GAMA model"""
    
    def __init__(self, target_gpu_memory: float = 5.5):
        """
        Initialize memory manager
        
        Args:
            target_gpu_memory: Target GPU memory usage in GB
        """
        self.target_gpu_memory = target_gpu_memory
        self.logger = logging.getLogger(__name__)
        self._setup_logging()
    
    def _setup_logging(self):
        """Configure logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    def get_memory_stats(self) -> MemoryStats:
        """Get current memory statistics"""
        stats = MemoryStats(
            gpu_allocated=0.0,
            gpu_cached=0.0,
            gpu_max_allocated=0.0,
            gpu_total=0.0,
            ram_used=psutil.virtual_memory().used / 1024**3,
            ram_available=psutil.virtual_memory().available / 1024**3,
            ram_total=psutil.virtual_memory().total / 1024**3
        )
        
        if torch.cuda.is_available():
            stats.gpu_allocated = torch.cuda.memory_allocated(0) / 1024**3
            stats.gpu_cached = torch.cuda.memory_reserved(0) / 1024**3
            stats.gpu_max_allocated = torch.cuda.max_memory_allocated(0) / 1024**3
            stats.gpu_total = torch.cuda.get_device_properties(0).total_memory / 1024**3
        
        return stats
    
    def print_memory_stats(self):
        """Print current memory statistics"""
        stats = self.get_memory_stats()
        
        print("\nMemory Usage Statistics:")
        print("-" * 40)
        
        if torch.cuda.is_available():
            print(f"GPU Memory:")
            print(f"  Allocated: {stats.gpu_allocated:.2f}GB")
            print(f"  Cached:    {stats.gpu_cached:.2f}GB")
            print(f"  Max Used:  {stats.gpu_max_allocated:.2f}GB")
            print(f"  Total:     {stats.gpu_total:.2f}GB")
        
        print(f"\nSystem Memory:")
        print(f"  Used:      {stats.ram_used:.2f}GB")
        print(f"  Available: {stats.ram_available:.2f}GB")
        print(f"  Total:     {stats.ram_total:.2f}GB")
    
    def clear_memory(self):
        """Clear unused memory"""
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()
    
    def check_memory_available(self, required_gb: float) -> Tuple[bool, float]:
        """
        Check if required memory is available
        
        Args:
            required_gb: Required memory in GB
            
        Returns:
            Tuple of (is_available, available_memory_gb)
        """
        if not torch.cuda.is_available():
            return False, 0.0
            
        stats = self.get_memory_stats()
        available = stats.gpu_total - stats.gpu_allocated
        return available >= required_gb, available
    
    @contextmanager
    def monitor_memory_usage(self, label: str = "Operation"):
        """
        Context manager to monitor memory usage during an operation
        
        Args:
            label: Label for the operation being monitored
        """
        start_stats = self.get_memory_stats()
        start_time = time.time()
        
        try:
            yield
        finally:
            end_stats = self.get_memory_stats()
            duration = time.time() - start_time
            
            memory_change = {
                'gpu_allocated': end_stats.gpu_allocated - start_stats.gpu_allocated,
                'gpu_cached': end_stats.gpu_cached - start_stats.gpu_cached,
                'ram_used': end_stats.ram_used - start_stats.ram_used
            }
            
            print(f"\nMemory Usage for {label}:")
            print(f"Duration: {duration:.2f}s")
            print(f"GPU Memory Change: {memory_change['gpu_allocated']:.2f}GB")
            print(f"GPU Cache Change: {memory_change['gpu_cached']:.2f}GB")
            print(f"RAM Usage Change: {memory_change['ram_used']:.2f}GB")
    
    def optimize_model_config(self) -> Dict[str, Any]:
        """
        Get optimized model configuration based on available memory
        
        Returns:
            Dictionary of model configuration options
        """
        stats = self.get_memory_stats()
        config = {
            'torch_dtype': torch.float16,
            'device_map': 'auto'
        }
        
        # Adjust settings based on available memory
        if stats.gpu_total < 8:  # Less than 8GB VRAM
            config.update({
                'load_in_8bit': True,
                'use_cache': False,
                'gradient_checkpointing': True
            })
        
        # Set maximum memory usage
        max_memory = min(stats.gpu_total - 0.5, self.target_gpu_memory)  # Leave 0.5GB buffer
        config['max_memory'] = {0: f"{max_memory:.1f}GB"}
        
        return config
    
    def get_optimal_batch_size(self, sample_batch_memory: float, target_memory: Optional[float] = None) -> int:
        """
        Calculate optimal batch size based on memory constraints
        
        Args:
            sample_batch_memory: Memory used by a sample batch (GB)
            target_memory: Target memory usage (GB), defaults to self.target_gpu_memory
            
        Returns:
            Optimal batch size
        """
        if target_memory is None:
            target_memory = self.target_gpu_memory
            
        stats = self.get_memory_stats()
        available_memory = min(
            stats.gpu_total - stats.gpu_allocated,
            target_memory
        )
        
        # Calculate batch size with 20% buffer
        optimal_batch_size = int((available_memory * 0.8) / sample_batch_memory)
        return max(1, optimal_batch_size)

def main():
    """Test memory management functionality"""
    manager = MemoryManager()
    
    print("Initial Memory State:")
    manager.print_memory_stats()
    
    # Test memory monitoring
    with manager.monitor_memory_usage("Test Allocation"):
        # Simulate memory allocation
        if torch.cuda.is_available():
            test_tensor = torch.zeros((1024, 1024, 128), device='cuda')
            time.sleep(1)
            del test_tensor
    
    print("\nFinal Memory State:")
    manager.print_memory_stats()

if __name__ == "__main__":
    main()