# Import core test functions
from .test_setup import test_environment as test_setup
from .test_setup import test_environment as monitor_gpu_memory  # Alias for backward compatibility

# Import model configuration functions
try:
    from .model_config import load_gama_optimized, check_gpu_compatibility
except ImportError:
    # Provide stub functions in case transformers isn't installed yet
    def load_gama_optimized():
        raise ImportError("transformers module not installed. Run 'pip install transformers'")
    
    def check_gpu_compatibility():
        raise ImportError("transformers module not installed. Run 'pip install transformers'")

# Import test model functions - make these optional
try:
    from .test_model import GAMATester
except ImportError:
    pass