# GAMA Testing Environment

A testing environment for GAMA (General-purpose Audio-Language Model) optimized for GPUs with 6GB VRAM constraints.

## Quick Start

1. Create and activate virtual environment:
```powershell
py -3.9 -m venv gama_env_39
.\gama_env_39\Scripts\activate
```

2. Install dependencies:
```powershell
pip install -r requirements.txt
```

3. Run environment verification:
```powershell
python -m test_scripts.test_setup
```

## Documentation

- [Complete Setup Documentation](SETUP_DOCUMENTATION.md) - Detailed setup instructions, requirements, and troubleshooting
- [Implementation Status](IMPLEMENTATION_STATUS.md) - Current development status and planned features

## Features

- Environment verification and system checks
- Memory-optimized model configuration
- GPU compatibility testing
- Audio processing utilities
- Comprehensive testing framework

## Memory Optimizations

- Half-precision (FP16) computation
- 8-bit quantization
- Automatic memory mapping
- Memory usage monitoring
- Gradient checkpointing

## Requirements

- Python 3.9.5
- NVIDIA GPU with 6GB+ VRAM
- CUDA 11.6
- PyTorch 1.13.1+cu116

## Project Structure

```
gama_tests/
├── test_scripts/         # Testing code
│   ├── test_setup.py     # Environment verification
│   ├── model_config.py   # Model configuration
│   └── test_model.py     # Testing implementation
├── data/                # Test data
└── requirements.txt     # Dependencies
```

## License

This test environment is part of the audio-learning-hub project.