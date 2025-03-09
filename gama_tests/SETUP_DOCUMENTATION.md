# GAMA Testing Environment Setup Documentation

## Overview
This document outlines the setup and verification process for the GAMA (General-purpose Audio-Language Model) testing environment, specifically optimized for GPUs with 6GB VRAM constraints.

## System Requirements

### Hardware Requirements
- NVIDIA GPU with at least 6GB VRAM (Verified with RTX 2060)
- CUDA-compatible graphics driver
- Minimum 8GB system RAM recommended

### Software Requirements
- Python 3.9.5
- CUDA 11.6
- PyTorch 1.13.1+cu116
- Operating System: Windows 10/11 (64-bit)

## Environment Setup

### 1. Virtual Environment Creation
```powershell
# Create Python 3.9 virtual environment
py -3.9 -m venv gama_env_39

# Activate environment
.\gama_env_39\Scripts\activate
```

### 2. PyTorch Installation
PyTorch must be installed with CUDA support. Using local wheels:
```powershell
# Install PyTorch components
pip install pytorch_wheels/torch-1.13.1+cu116-cp39-cp39-win_amd64.whl
pip install pytorch_wheels/torchvision-0.14.1+cu116-cp39-cp39-win_amd64.whl
pip install pytorch_wheels/torchaudio-0.13.1+cu116-cp39-cp39-win_amd64.whl
```

### 3. Dependencies Installation
Required packages for GAMA testing:
```powershell
pip install transformers librosa soundfile
```

Additional dependencies from requirements.txt:
```powershell
pip install -r requirements.txt
```

## Directory Structure
```
gama_tests/
├── test_scripts/               # Core testing modules
│   ├── __init__.py            # Module initialization and imports
│   ├── test_setup.py          # Environment verification
│   ├── model_config.py        # Model configuration
│   └── test_model.py          # Testing implementation
├── data/                      # Test data directory
│   ├── samples/              # Audio samples
│   └── test_cases/          # Test suite data
└── requirements.txt          # Package dependencies
```

## Component Documentation

### 1. test_setup.py
- **Purpose**: Environment verification and system checks
- **Key Functions**:
  - `test_environment()`: Verifies Python, PyTorch, CUDA, and GPU setup
  - Checks VRAM availability and GPU capabilities
  - Reports detailed system information

### 2. __init__.py
- **Purpose**: Module initialization and import management
- **Features**:
  - Graceful handling of optional dependencies
  - Backward compatibility aliases
  - Error handling for missing packages

### 3. model_config.py
- **Purpose**: GAMA model configuration
- **Memory Optimizations**:
  - Half-precision (FP16) computation
  - 8-bit quantization
  - Automatic memory mapping
  - Memory usage monitoring
  - Gradient checkpointing

## Verification Steps

### 1. Basic Environment Check
```powershell
cd gama_tests
python -m test_scripts.test_setup
```

Expected output should show:
- Python version confirmation
- PyTorch with CUDA support
- GPU detection and memory information
- CUDA version verification

### 2. Verification Results
Current environment verification shows:
- PyTorch 1.13.1+cu116 installed ✓
- CUDA 11.6 available and working ✓
- NVIDIA GeForce RTX 2060 detected ✓
- 6GB VRAM available ✓
- Memory management operational ✓

## Troubleshooting

### Common Issues

1. **CUDA Not Available**
```powershell
# Check NVIDIA driver
nvidia-smi

# Verify CUDA installation
nvcc --version

# Check PyTorch CUDA support
python -c "import torch; print(torch.cuda.is_available())"
```

2. **Import Errors**
- Ensure all required packages are installed
- Check virtual environment activation
- Verify Python version compatibility

3. **Memory Issues**
- Monitor GPU memory usage with test_setup.py
- Ensure no other processes are using GPU memory
- Check CUDA compatibility with installed PyTorch version

## Maintenance

### Regular Updates
1. Keep dependencies updated within tested version constraints
2. Monitor VRAM usage patterns
3. Update test cases as needed

### Version Control
- Main dependencies are version-locked in requirements.txt
- PyTorch/CUDA versions are specifically matched
- System-specific configurations are documented

## Next Steps
After successful setup verification:
1. Run complete test suite
2. Monitor memory usage during extended testing
3. Verify audio processing capabilities
4. Test model loading and inference

## Support
For issues and updates, refer to:
- Project documentation in /docs
- Requirements and compatibility in requirements.txt
- Test logs in test_output/