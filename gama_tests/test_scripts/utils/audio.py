#!/usr/bin/env python
import numpy as np
import librosa
import soundfile as sf
from pathlib import Path
import logging
from typing import Optional, Tuple, Dict, Any
from dataclasses import dataclass
from .memory import MemoryManager, monitor_memory_usage

@dataclass
class AudioInfo:
    """Container for audio file information"""
    duration: float
    sample_rate: int
    channels: int
    samples: int
    format: str
    max_amplitude: float
    rms: float
    file_size: int

class AudioProcessor:
    """Audio processing utilities with memory optimization"""
    
    def __init__(
        self,
        target_sample_rate: int = 16000,
        memory_manager: Optional[MemoryManager] = None
    ):
        """
        Initialize audio processor
        
        Args:
            target_sample_rate: Target sample rate for processing
            memory_manager: Optional memory manager instance
        """
        self.target_sr = target_sample_rate
        self.memory_manager = memory_manager or MemoryManager()
        self.logger = logging.getLogger(__name__)
        self._setup_logging()
    
    def _setup_logging(self):
        """Configure logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    def get_audio_info(self, file_path: str) -> AudioInfo:
        """
        Get detailed information about an audio file
        
        Args:
            file_path: Path to audio file
            
        Returns:
            AudioInfo object containing file information
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Audio file not found: {path}")
            
        # Get basic file info without loading entire file
        with sf.SoundFile(file_path) as f:
            duration = float(len(f)) / f.samplerate
            channels = f.channels
            format = f.format
            file_size = path.stat().st_size
        
        # Load audio for detailed analysis
        audio, sr = self.load_audio(file_path, duration=min(duration, 10))
        
        return AudioInfo(
            duration=duration,
            sample_rate=sr,
            channels=channels,
            samples=len(audio),
            format=format,
            max_amplitude=float(np.max(np.abs(audio))),
            rms=float(np.sqrt(np.mean(audio**2))),
            file_size=file_size
        )
    
    def load_audio(
        self,
        file_path: str,
        duration: Optional[float] = None,
        offset: float = 0.0
    ) -> Tuple[np.ndarray, int]:
        """
        Load audio file with memory optimization
        
        Args:
            file_path: Path to audio file
            duration: Optional duration to load (seconds)
            offset: Start time offset (seconds)
            
        Returns:
            Tuple of (audio_data, sample_rate)
        """
        with self.memory_manager.monitor_memory_usage("Audio Loading"):
            audio, sr = librosa.load(
                file_path,
                sr=self.target_sr,
                duration=duration,
                offset=offset
            )
            
            self.logger.info(
                f"Loaded audio: {len(audio)/sr:.2f}s @ {sr}Hz "
                f"({audio.nbytes/1024/1024:.1f}MB)"
            )
            
            return audio, sr
    
    def save_audio(
        self,
        audio: np.ndarray,
        file_path: str,
        sample_rate: Optional[int] = None
    ):
        """
        Save audio data to file
        
        Args:
            audio: Audio data
            file_path: Output file path
            sample_rate: Sample rate (if None, uses target_sr)
        """
        sr = sample_rate or self.target_sr
        with self.memory_manager.monitor_memory_usage("Audio Saving"):
            sf.write(file_path, audio, sr)
    
    def extract_features(
        self,
        audio: np.ndarray,
        sr: int,
        feature_type: str = 'mel',
        **kwargs
    ) -> np.ndarray:
        """
        Extract audio features with memory optimization
        
        Args:
            audio: Audio data
            sr: Sample rate
            feature_type: Type of features ('mel' or 'mfcc')
            **kwargs: Additional arguments for feature extraction
            
        Returns:
            Feature matrix
        """
        with self.memory_manager.monitor_memory_usage(f"{feature_type} Feature Extraction"):
            if feature_type == 'mel':
                features = librosa.feature.melspectrogram(y=audio, sr=sr, **kwargs)
            elif feature_type == 'mfcc':
                features = librosa.feature.mfcc(y=audio, sr=sr, **kwargs)
            else:
                raise ValueError(f"Unsupported feature type: {feature_type}")
                
            return features
    
    def create_test_signal(
        self,
        duration: float = 5.0,
        frequency: float = 440.0,
        amplitude: float = 1.0
    ) -> Tuple[np.ndarray, int]:
        """
        Create a test sine wave signal
        
        Args:
            duration: Duration in seconds
            frequency: Frequency in Hz
            amplitude: Signal amplitude
            
        Returns:
            Tuple of (audio_data, sample_rate)
        """
        t = np.linspace(0, duration, int(self.target_sr * duration))
        audio = amplitude * np.sin(2 * np.pi * frequency * t)
        return audio, self.target_sr
    
    def create_test_suite(
        self,
        output_dir: str,
        durations: list[float] = [1.0, 5.0, 10.0],
        frequencies: list[float] = [440.0, 880.0]
    ):
        """
        Create a suite of test audio files
        
        Args:
            output_dir: Output directory
            durations: List of durations in seconds
            frequencies: List of frequencies in Hz
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        for duration in durations:
            for freq in frequencies:
                audio, sr = self.create_test_signal(
                    duration=duration,
                    frequency=freq
                )
                
                filename = f"test_tone_{freq}hz_{duration}s.wav"
                self.save_audio(audio, output_path / filename)

def main():
    """Test audio processing functionality"""
    processor = AudioProcessor()
    
    print("Creating test audio...")
    audio, sr = processor.create_test_signal(duration=5.0)
    
    print("\nExtracting features...")
    features = processor.extract_features(audio, sr)
    
    print("\nFeature shape:", features.shape)
    print("Memory usage:")
    processor.memory_manager.print_memory_stats()

if __name__ == "__main__":
    main()