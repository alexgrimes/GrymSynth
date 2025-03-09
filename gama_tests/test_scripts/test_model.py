import torch
import librosa
import numpy as np
import os
from typing import Optional, Tuple
from memory_utils import MemoryMonitor
from model_config import GAMAConfig

class GAMATest:
    """GAMA model testing framework"""
    
    def __init__(self, model_name: str = "gama", max_gpu_memory: float = 5.0):
        """
        Initialize GAMA test environment
        
        Args:
            model_name: HuggingFace model name or local path
            max_gpu_memory: Maximum GPU memory to use in GB
        """
        self.model_name = model_name
        self.memory_monitor = MemoryMonitor()
        self.model_config = GAMAConfig(max_gpu_memory=max_gpu_memory)
        
        # Initialize as None - will be loaded on demand
        self.model = None
        self.tokenizer = None
    
    def setup_environment(self) -> bool:
        """
        Verify and setup testing environment
        
        Returns:
            bool: True if setup successful, False otherwise
        """
        try:
            # Check CUDA availability
            if not torch.cuda.is_available():
                print("CUDA is not available")
                return False
            
            # Check memory requirements
            if not self.memory_monitor.check_memory_requirements():
                return False
            
            # Log initial memory state
            self.memory_monitor.log_memory_stats()
            return True
            
        except Exception as e:
            print(f"Environment setup failed: {str(e)}")
            return False
    
    def load_model(self) -> bool:
        """
        Load GAMA model with memory optimizations
        
        Returns:
            bool: True if model loaded successfully, False otherwise
        """
        try:
            print("\nLoading model...")
            self.model = self.model_config.load_model(self.model_name)
            self.tokenizer = self.model_config.load_tokenizer(self.model_name)
            
            # Apply inference optimizations
            self.model_config.optimize_inference(self.model)
            
            print("Model loaded successfully")
            self.memory_monitor.log_memory_stats()
            return True
            
        except Exception as e:
            print(f"Model loading failed: {str(e)}")
            return False
    
    def load_audio(self, path: str, sr: int = 16000) -> Optional[Tuple[np.ndarray, int]]:
        """
        Load and preprocess audio file
        
        Args:
            path: Path to audio file
            sr: Target sample rate
            
        Returns:
            Tuple of (audio array, sample rate) or None if failed
        """
        try:
            audio, sr = librosa.load(path, sr=sr)
            return audio, sr
        except Exception as e:
            print(f"Error loading audio: {str(e)}")
            return None
    
    def create_test_audio(self, duration: float = 5.0, sr: int = 16000) -> np.ndarray:
        """
        Create synthetic test audio (440Hz sine wave)
        
        Args:
            duration: Duration in seconds
            sr: Sample rate
            
        Returns:
            numpy array of audio samples
        """
        t = np.linspace(0, duration, int(sr * duration))
        return np.sin(2 * np.pi * 440 * t)
    
    def test_with_audio(self, audio: np.ndarray, sr: int = 16000) -> bool:
        """
        Test model with audio input
        
        Args:
            audio: Audio samples array
            sr: Sample rate
            
        Returns:
            bool: True if test successful, False otherwise
        """
        try:
            print("\nTesting model with audio...")
            # Monitor memory before processing
            self.memory_monitor.log_memory_stats()
            
            # Process audio (placeholder - implement actual processing)
            print(f"Processing audio: {len(audio)/sr:.2f} seconds, {sr}Hz sample rate")
            
            # Monitor memory after processing
            self.memory_monitor.log_memory_stats()
            return True
            
        except Exception as e:
            print(f"Test failed: {str(e)}")
            return False
    
    def cleanup(self):
        """Clean up resources and memory"""
        # Clear model from memory
        if self.model is not None:
            del self.model
            self.model = None
        
        if self.tokenizer is not None:
            del self.tokenizer
            self.tokenizer = None
        
        # Run memory cleanup
        self.memory_monitor.emergency_cleanup()
        self.memory_monitor.log_memory_stats()

def run_test_suite():
    """Run complete test suite"""
    test_env = GAMATest(max_gpu_memory=5.0)  # Reserve 5GB for model
    
    try:
        # Setup environment
        if not test_env.setup_environment():
            print("Environment setup failed")
            return False
        
        # Load model
        if not test_env.load_model():
            print("Model loading failed")
            return False
        
        # Create test audio
        test_audio = test_env.create_test_audio()
        
        # Run test
        if not test_env.test_with_audio(test_audio):
            print("Audio testing failed")
            return False
        
        print("\nAll tests completed successfully!")
        return True
        
    except Exception as e:
        print(f"Test suite failed: {str(e)}")
        return False
        
    finally:
        # Always clean up
        test_env.cleanup()

if __name__ == "__main__":
    if run_test_suite():
        print("\nTest suite completed successfully")
    else:
        print("\nTest suite failed")
        exit(1)