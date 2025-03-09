#!/usr/bin/env python
import torch
import logging
import json
from pathlib import Path
from typing import Optional, Dict, Any
from .model_config import ModelConfig
from .utils.audio import AudioProcessor
from .utils.memory import MemoryManager

class TestCases:
    """Test cases for GAMA model and utilities"""
    
    def __init__(
        self,
        output_dir: str = "test_output",
        target_gpu_memory: float = 5.5
    ):
        """
        Initialize test cases
        
        Args:
            output_dir: Directory for test outputs
            target_gpu_memory: Target GPU memory usage in GB
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
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
    
    def save_test_results(self, results: Dict[str, Any], test_name: str):
        """Save test results to JSON file"""
        output_file = self.output_dir / f"{test_name}_results.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        self.logger.info(f"Results saved to {output_file}")
    
    def test_memory_management(self) -> Dict[str, Any]:
        """Test memory management functionality"""
        self.logger.info("\nTesting Memory Management")
        self.logger.info("=" * 50)
        
        results = {
            'initial_state': {},
            'after_allocation': {},
            'final_state': {}
        }
        
        # Initial state
        initial_stats = self.memory_manager.get_memory_stats()
        results['initial_state'] = {
            'gpu_allocated': f"{initial_stats.gpu_allocated:.2f}GB",
            'gpu_cached': f"{initial_stats.gpu_cached:.2f}GB",
            'ram_used': f"{initial_stats.ram_used:.2f}GB"
        }
        
        # Test memory allocation
        with self.memory_manager.monitor_memory_usage("Test Allocation"):
            if torch.cuda.is_available():
                test_tensor = torch.zeros((1024, 1024, 128), device='cuda')
                allocation_stats = self.memory_manager.get_memory_stats()
                results['after_allocation'] = {
                    'gpu_allocated': f"{allocation_stats.gpu_allocated:.2f}GB",
                    'gpu_cached': f"{allocation_stats.gpu_cached:.2f}GB",
                    'ram_used': f"{allocation_stats.ram_used:.2f}GB"
                }
                del test_tensor
        
        # Final state
        final_stats = self.memory_manager.get_memory_stats()
        results['final_state'] = {
            'gpu_allocated': f"{final_stats.gpu_allocated:.2f}GB",
            'gpu_cached': f"{final_stats.gpu_cached:.2f}GB",
            'ram_used': f"{final_stats.ram_used:.2f}GB"
        }
        
        self.save_test_results(results, "memory_management")
        return results
    
    def test_audio_processing(self) -> Dict[str, Any]:
        """Test audio processing functionality"""
        self.logger.info("\nTesting Audio Processing")
        self.logger.info("=" * 50)
        
        results = {'audio_generation': {}, 'feature_extraction': {}}
        
        # Test audio generation
        audio, sr = self.audio_processor.create_test_signal(
            duration=5.0,
            frequency=440.0
        )
        
        results['audio_generation'] = {
            'duration': f"{len(audio)/sr:.2f}s",
            'sample_rate': sr,
            'memory_size': f"{audio.nbytes/1024/1024:.2f}MB"
        }
        
        # Test feature extraction
        features = self.audio_processor.extract_features(audio, sr)
        results['feature_extraction'] = {
            'shape': list(features.shape),
            'memory_size': f"{features.nbytes/1024/1024:.2f}MB"
        }
        
        self.save_test_results(results, "audio_processing")
        return results
    
    def test_model_loading(self, force_cpu: bool = False) -> Dict[str, Any]:
        """Test model loading with memory optimization"""
        self.logger.info("\nTesting Model Loading")
        self.logger.info("=" * 50)
        
        results = {
            'config': {},
            'memory_usage': {},
            'model_info': {}
        }
        
        # Get model configuration
        config = self.model_config.get_model_config()
        results['config'] = {k: str(v) for k, v in config.items()}
        
        try:
            # Load model
            model, tokenizer = self.model_config.load_model(force_cpu=force_cpu)
            
            # Get memory usage
            stats = self.memory_manager.get_memory_stats()
            results['memory_usage'] = {
                'gpu_allocated': f"{stats.gpu_allocated:.2f}GB",
                'gpu_cached': f"{stats.gpu_cached:.2f}GB",
                'ram_used': f"{stats.ram_used:.2f}GB"
            }
            
            # Get model info
            results['model_info'] = {
                'parameters': sum(p.numel() for p in model.parameters()),
                'device': str(next(model.parameters()).device),
                'dtype': str(next(model.parameters()).dtype)
            }
            
            del model, tokenizer
            
        except Exception as e:
            self.logger.error(f"Model loading failed: {str(e)}")
            results['error'] = str(e)
        
        self.save_test_results(results, "model_loading")
        return results
    
    def run_all_tests(self, force_cpu: bool = False) -> Dict[str, Any]:
        """Run all test cases"""
        self.logger.info("\nRunning All Tests")
        self.logger.info("=" * 50)
        
        results = {
            'memory_tests': self.test_memory_management(),
            'audio_tests': self.test_audio_processing(),
            'model_tests': self.test_model_loading(force_cpu=force_cpu)
        }
        
        self.save_test_results(results, "all_tests")
        return results

def main():
    """Run test cases"""
    tests = TestCases(output_dir="test_output")
    results = tests.run_all_tests(force_cpu=False)
    
    print("\nTest Results Summary:")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()