from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import numpy as np
import torch
import os
import logging
from transformers import Wav2Vec2Processor, Wav2Vec2Model

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Audio Learning Hub API")

# Model cache
loaded_models = {}

# Pydantic models for request/response validation
class AudioData(BaseModel):
    audio: List[float]
    sampleRate: int
    options: Dict[str, Any]

class ModelConfig(BaseModel):
    name: str
    path: str
    parameters: Dict[str, Any] = {}

class ProcessingResult(BaseModel):
    features: List[float]
    metadata: Dict[str, Any]

class HealthStatus(BaseModel):
    status: str
    models: List[str]
    gpu_available: bool
    memory_usage: float

# Model management functions
async def load_model_task(config: ModelConfig):
    """Background task to load a model."""
    try:
        logger.info(f"Loading model {config.name} from {config.path}")
        
        # Load processor and model
        processor = Wav2Vec2Processor.from_pretrained(config.path)
        model = Wav2Vec2Model.from_pretrained(config.path)
        
        # Move model to GPU if available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = model.to(device)
        
        # Store in cache
        loaded_models[config.name] = {
            "processor": processor,
            "model": model,
            "config": config
        }
        
        logger.info(f"Model {config.name} loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load model {config.name}: {str(e)}")

# API Endpoints
@app.get("/health", response_model=HealthStatus)
async def health_check():
    """Check the health status of the API and loaded models."""
    try:
        # Check GPU availability
        gpu_available = torch.cuda.is_available()
        
        # Get memory usage if GPU is available
        if gpu_available:
            memory_usage = torch.cuda.memory_allocated() / torch.cuda.max_memory_allocated() if torch.cuda.max_memory_allocated() > 0 else 0
        else:
            memory_usage = 0
            
        return {
            "status": "ok",
            "models": list(loaded_models.keys()),
            "gpu_available": gpu_available,
            "memory_usage": memory_usage
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.post("/models/load")
async def load_model(config: ModelConfig, background_tasks: BackgroundTasks):
    """Load a model asynchronously."""
    try:
        # If model is already loaded, return success
        if config.name in loaded_models:
            return {"success": True, "message": f"Model {config.name} already loaded"}
        
        # Add task to load model in background
        background_tasks.add_task(load_model_task, config)
        
        return {"success": True, "message": f"Model {config.name} loading started"}
    except Exception as e:
        logger.error(f"Failed to start model loading: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process/wav2vec2", response_model=ProcessingResult)
async def process_audio(data: AudioData):
    """Process audio using Wav2Vec2 model."""
    try:
        # Check if model is loaded
        model_name = data.options.get("model", "wav2vec2-base")
        if model_name not in loaded_models:
            # Try to load default model
            if model_name == "wav2vec2-base":
                await load_model_task(ModelConfig(
                    name="wav2vec2-base",
                    path="facebook/wav2vec2-base-960h"
                ))
                # Wait for model to load
                # In production, you'd want a better solution
                import time
                time.sleep(5)
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Model {model_name} not loaded. Please load it first."
                )
        
        # Get model and processor
        model_data = loaded_models[model_name]
        processor = model_data["processor"]
        model = model_data["model"]
        
        # Convert input to numpy array
        audio_np = np.array(data.audio, dtype=np.float32)
        
        # Process audio with Wav2Vec2
        inputs = processor(
            audio_np, 
            sampling_rate=data.sampleRate, 
            return_tensors="pt"
        )
        
        # Move inputs to same device as model
        device = next(model.parameters()).device
        inputs = {key: val.to(device) for key, val in inputs.items()}
        
        # Get model output
        with torch.no_grad():
            outputs = model(**inputs)
            
        # Get features from last hidden state
        features = outputs.last_hidden_state.mean(dim=1).squeeze().cpu().numpy()
        
        # Convert to list for JSON response
        features_list = features.tolist()
        
        return {
            "features": features_list,
            "metadata": {
                "model": model_name,
                "shape": list(features.shape),
                "timestamp": time.time()
            }
        }
    except Exception as e:
        logger.error(f"Processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)