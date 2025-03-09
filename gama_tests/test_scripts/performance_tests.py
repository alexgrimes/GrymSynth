#!/usr/bin/env python
import time
import torch
import numpy as np
import logging
import json
from pathlib import Path
from typing import Dict, Any, List
from .model_config import ModelConfig
from .utils.audio import AudioProcessor
from .utils.memory import MemoryManager

class PerformanceTests:
    """Performance and stress testing for GAMA environment"""
    
    def __init__(
        self,
        output_dir: str = "test_output/performance",
        target_gpu_memory: float = 5.5,
        test_duration: int = 300  # 5 minutes default
    ):
        """
        Initialize performance tests
        
        Args:
            output_dir: Directory for test outputs
            target_gpu_memory: Target GPU memory usage in GB
            test_duration: Duration for long-running tests (seconds)
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.test_duration = test_duration
        self.memory_manager = MemoryManager(target_gpu_memory=target_gpu_memory)
        self.audio_processor = AudioProcessor(memory_manager=self.memory_manager)
        self.model_config = ModelConfig(target_gpu_memory=target_gpu_memory)
        
        self.logger = logging.getLogger(__name__)
        self._setup_logging()
    
    def _setup_logging(self):
        """Configure logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    def save_results(self, results: Dict[str, Any], test_name: str):
        """Save test results to JSON file"""
        output_file = self.output_dir / f"{test_name}_results.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        self.logger.info(f"Results saved to {output_file}")
    
    def memory_stress_test(self, iterations: int = 100) -> Dict[str, Any]:
        """
        Run memory stress test
        
        Args:
            iterations: Number of memory allocation iterations
            
        Returns:
            Dictionary of test results
        """
        self.logger.info("\nRunning Memory Stress Test")
        self.logger.info("=" * 50)
        
        results = {
            'iterations': iterations,
            'memory_usage': [],
            'timing': []
        }
        
        try:
            for i in range(iterations):
                start_time = time.time()
                
                # Create and delete tensors of increasing size
                size = 1000 * (i + 1)
                with self.memory_manager.monitor_memory_usage(f"Iteration {i+1}"):
                    if torch.cuda.is_available():
                        tensor = torch.zeros((size, size), device='cuda')
                        del tensor
                
                # Record memory stats
                stats = self.memory_manager.get_memory_stats()
                results['memory_usage'].append({
                    'iteration': i + 1,
                    'gpu_allocated': float(stats.gpu_allocated),
                    'gpu_cached': float(stats.gpu_cached),
                    'ram_used': float(stats.ram_used)
                })
                
                # Record timing
                results['timing'].append(time.time() - start_time)
                
                if (i + 1) % 10 == 0:
                    self.logger.info(f"Completed {i + 1}/{iterations} iterations")
                
        except Exception as e:
            self.logger.error(f"Stress test failed: {str(e)}")
            results['error'] = str(e)
        
        self.save_results(results, "memory_stress")
        return results
    
    def audio_processing_benchmark(self, max_duration: int = 60) -> Dict[str, Any]:
        """
        Benchmark audio processing performance
        
        Args:
            max_duration: Maximum test duration in seconds
            
        Returns:
            Dictionary of benchmark results
        """
        self.logger.info("\nRunning Audio Processing Benchmark")
        self.logger.info("=" * 50)
        
        results = {
            'durations': [],
            'feature_extraction': [],
            'memory_usage': []
        }
        
        # Test different audio durations
        durations = [1, 5, 10, 30, 60]
        durations = [d for d in durations if d <= max_duration]
        
        for duration in durations:
            self.logger.info(f"\nTesting {duration}s audio...")
            
            # Generate test audio
            audio, sr = self.audio_processor.create_test_signal(duration=duration)
            
            # Time feature extraction
            start_time = time.time()
            features = self.audio_processor.extract_features(audio, sr)
            processing_time = time.time() - start_time
            
            # Record stats
            stats = self.memory_manager.get_memory_stats()
            results['durations'].append(duration)
            results['feature_extraction'].append(processing_time)
            results['memory_usage'].append({
                'duration': duration,
                'gpu_allocated': float(stats.gpu_allocated),
                'gpu_cached': float(stats.gpu_cached),
                'ram_used': float(stats.ram_used)
            })
            
            self.logger.info(f"Processing time: {processing_time:.2f}s")
            self.logger.info(f"Feature shape: {features.shape}")
        
        self.save_results(results, "audio_benchmark")
        return results
    
    def long_running_test(self) -> Dict[str, Any]:
        """
        Run long-running stability test
        
        Returns:
            Dictionary of test results
        """
        self.logger.info("\nRunning Long-Running Stability Test")
        self.logger.info("=" * 50)
        
        results = {
            'duration': self.test_duration,
            'iterations': 0,
            'memory_usage': [],
            'errors': []
        }
        
        start_time = time.time()
        iteration = 0
        
        try:
            while time.time() - start_time < self.test_duration:
                iteration += 1
                
                # Process test audio
                audio, sr = self.audio_processor.create_test_signal(duration=5.0)
                features = self.audio_processor.extract_features(audio, sr)
                
                # Record memory stats every 10 iterations
                if iteration % 10 == 0:
                    stats = self.memory_manager.get_memory_stats()
                    results['memory_usage'].append({
                        'iteration': iteration,
                        'time': time.time() - start_time,
                        'gpu_allocated': float(stats.gpu_allocated),
                        'gpu_cached': float(stats.gpu_cached),
                        'ram_used': float(stats.ram_used)
                    })
                    
                    self.logger.info(
                        f"Iteration {iteration}, "
                        f"Time: {(time.time() - start_time)/60:.1f}m"
                    )
                
        except Exception as e:
            self.logger.error(f"Long-running test failed: {str(e)}")
            results['errors'].append(str(e))
        
        results['iterations'] = iteration
        self.save_results(results, "long_running")
        return results
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all performance tests"""
        self.logger.info("\nRunning All Performance Tests")
        self.logger.info("=" * 50)
        
        results = {
            'stress_test': self.memory_stress_test(),
            'audio_benchmark': self.audio_processing_benchmark(),
            'long_running': self.long_running_test()
        }
        
        self.save_results(results, "all_performance_tests")
        return results

def main():
    """Run performance tests"""
    tests = PerformanceTests(
        output_dir="test_output/performance",
        test_duration=300  # 5 minutes
    )
    results = tests.run_all_tests()
    
    print("\nPerformance Test Results Summary:")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()