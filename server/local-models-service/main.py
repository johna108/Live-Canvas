"""
Local Models Service - FastAPI microservice for local LLMs and image generation
Provides endpoints for text generation (Llama), image generation (SDXL), and video frames
"""

import os
import io
import base64
from typing import Optional
from pathlib import Path
import logging
import json
import requests

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging FIRST (before any logger calls)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set HuggingFace cache directory to avoid symlink issues on Windows
# Must be an absolute path
models_base = Path(os.getenv("MODELS_DIR", "./models")).resolve()
models_base.mkdir(parents=True, exist_ok=True)

if not os.getenv("HF_HOME"):
    hf_cache = models_base / "huggingface_cache"
    hf_cache.mkdir(parents=True, exist_ok=True)
    os.environ["HF_HOME"] = str(hf_cache)

logger.info(f"HuggingFace cache directory (HF_HOME): {os.getenv('HF_HOME')}")

# Disable symlinks warning on Windows
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

# Import FastAPI first
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Lazy imports for heavy dependencies will be loaded only when needed
# import torch
# from PIL import Image
# from diffusers import StableDiffusionXLPipeline, StableDiffusionXLImg2ImgPipeline
# from transformers import pipeline

app = FastAPI(title="Local Models Service", version="1.0.0")

# Global model instances (loaded on demand)
text_pipeline = None
image_pipeline = None
image_to_image_pipeline = None

# Lazy imports for heavy dependencies
torch = None
Image = None
StableDiffusionXLPipeline = None
StableDiffusionXLImg2ImgPipeline = None
pipeline = None

def _ensure_imports():
    """Lazy load heavy dependencies"""
    global torch, Image, StableDiffusionXLPipeline, StableDiffusionXLImg2ImgPipeline, pipeline
    
    if torch is None:
        logger.info("Loading PyTorch and diffusers libraries...")
        import torch as torch_module
        torch = torch_module
        
        from PIL import Image as Image_module
        Image = Image_module
        
        from diffusers import StableDiffusionXLPipeline as SDXL, StableDiffusionXLImg2ImgPipeline as SDXL_I2I
        StableDiffusionXLPipeline = SDXL
        StableDiffusionXLImg2ImgPipeline = SDXL_I2I
        
        from transformers import pipeline as pipeline_fn
        pipeline = pipeline_fn
        
        logger.info("✅ Heavy dependencies loaded")

# Device selection (lazy)
def get_device():
    """Get compute device"""
    _ensure_imports()
    cuda_available = torch.cuda.is_available()
    device = "cuda" if cuda_available else "cpu"
    logger.info(f"🔧 Device check: CUDA available = {cuda_available}, Using device = {device}")
    if cuda_available:
        logger.info(f"   GPU: {torch.cuda.get_device_name(0)}")
    return device

DEVICE = None  # Lazy initialization

# Model configurations
LLAMA_MODEL_NAME = os.getenv("LLAMA_MODEL_NAME", "mistralai/Mistral-7B-Instruct-v0.1")
SDXL_MODEL_NAME = os.getenv("SDXL_MODEL_NAME", "stabilityai/sdxl-turbo")
SDXL_REFINER_NAME = os.getenv("SDXL_REFINER_NAME", "stabilityai/stable-diffusion-xl-refiner-1.0")

# Model cache directory
MODELS_DIR = Path(os.getenv("MODELS_DIR", "./models"))
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Ollama configuration for image generation
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_IMAGE_MODEL = os.getenv("OLLAMA_IMAGE_MODEL", "bakllava")  # Or use "llava:7b-v1.6" for image understanding


def generate_image_with_ollama(prompt: str, negative_prompt: Optional[str] = None) -> str:
    """Generate image using Ollama with a vision model that can generate images"""
    try:
        logger.info(f"Requesting image generation from Ollama for: {prompt[:50]}...")
        
        # Try to use Ollama's generate endpoint if available
        # Note: Most Ollama models don't generate images directly
        # This is a placeholder for future Ollama image generation capabilities
        
        url = f"{OLLAMA_URL}/api/generate"
        
        # Create a detailed prompt for image generation
        full_prompt = f"Generate a detailed image description for: {prompt}"
        if negative_prompt:
            full_prompt += f" Avoid: {negative_prompt}"
        
        payload = {
            "model": OLLAMA_IMAGE_MODEL,
            "prompt": full_prompt,
            "stream": False,
        }
        
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        
        result = response.json()
        logger.info(f"Ollama response: {result.get('response', '')[:100]}...")
        
        return result.get('response', '')
    except Exception as e:
        logger.error(f"Error generating image with Ollama: {e}")
        raise


def get_text_pipeline():
    """Load or return cached text generation pipeline (Llama/Mistral)"""
    global text_pipeline
    if text_pipeline is None:
        _ensure_imports()
        device = get_device()
        logger.info(f"Loading text model: {LLAMA_MODEL_NAME}")
        try:
            text_pipeline = pipeline(
                "text-generation",
                model=LLAMA_MODEL_NAME,
                torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                device=0 if device == "cuda" else -1,  # -1 for CPU
            )
        except Exception as e:
            logger.error(f"Failed to load text model: {e}")
            raise
    return text_pipeline


def get_image_pipeline():
    """Load or return cached SDXL pipeline"""
    global image_pipeline
    if image_pipeline is None:
        _ensure_imports()
        device = get_device()
        logger.info(f"Loading image model: {SDXL_MODEL_NAME}")
        logger.info(f"HF_HOME cache: {os.getenv('HF_HOME')}")
        try:
            # First, try to load from local cache only (if it exists)
            # This prevents re-downloading on every request
            hf_home = Path(os.getenv('HF_HOME'))
            model_cache_path = hf_home / "models--stabilityai--sdxl-turbo"
            
            if model_cache_path.exists():
                logger.info(f"✅ Model cache found at {model_cache_path}, loading from cache...")
                image_pipeline = StableDiffusionXLPipeline.from_pretrained(
                    SDXL_MODEL_NAME,
                    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                    use_safetensors=True,
                    variant="fp16" if device == "cuda" else None,
                    local_files_only=True,  # Only use cached files
                )
            else:
                logger.info(f"Model not cached, downloading to {hf_home}...")
                image_pipeline = StableDiffusionXLPipeline.from_pretrained(
                    SDXL_MODEL_NAME,
                    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                    use_safetensors=True,
                    variant="fp16" if device == "cuda" else None,
                    local_files_only=False,  # Download if not cached
                )
            
            image_pipeline = image_pipeline.to(device)
            # Enable memory optimizations for both GPU and CPU
            image_pipeline.enable_attention_slicing()  # Works for both GPU and CPU
            
            if device == "cuda":
                logger.info("💾 Enabled attention slicing for GPU memory efficiency")
                # For GPU with limited VRAM (6GB RTX 4050), enable VAE slicing too
                try:
                    image_pipeline.enable_vae_slicing()
                    logger.info("💾 Enabled VAE slicing for additional GPU memory savings")
                except Exception as e:
                    logger.warning(f"Could not enable VAE slicing: {e}")
                
                # Enable sequential CPU offload for even more GPU memory savings
                # This moves activations to CPU between attention/feed-forward operations
                try:
                    image_pipeline.enable_sequential_cpu_offload()
                    logger.info("💾 Enabled sequential CPU offload for GPU memory optimization")
                except Exception as e:
                    logger.warning(f"Could not enable sequential CPU offload: {e}")
            else:
                # For CPU, try to enable more aggressive optimizations
                try:
                    image_pipeline.enable_sequential_cpu_offload()
                except Exception as e:
                    logger.warning(f"Could not enable CPU offload (accelerate may not be installed): {e}")
            
            logger.info(f"✅ Image model loaded and cached successfully")
        except Exception as e:
            logger.error(f"Failed to load image model: {e}")
            raise
    else:
        logger.info(f"✅ Using cached image model (no re-download)")
    return image_pipeline


def get_image_to_image_pipeline():
    """Load or return cached SDXL img2img pipeline"""
    global image_to_image_pipeline
    if image_to_image_pipeline is None:
        _ensure_imports()
        device = get_device()
        logger.info(f"Loading img2img model: {SDXL_MODEL_NAME}")
        try:
            # Check if model is cached
            hf_home = Path(os.getenv('HF_HOME'))
            model_cache_path = hf_home / "models--stabilityai--sdxl-turbo"
            
            if model_cache_path.exists():
                logger.info(f"✅ Model cache found, loading from cache...")
                image_to_image_pipeline = StableDiffusionXLImg2ImgPipeline.from_pretrained(
                    SDXL_MODEL_NAME,
                    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                    use_safetensors=True,
                    variant="fp16" if device == "cuda" else None,
                    local_files_only=True,
                )
            else:
                logger.info(f"Model not cached, downloading...")
                image_to_image_pipeline = StableDiffusionXLImg2ImgPipeline.from_pretrained(
                    SDXL_MODEL_NAME,
                    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
                    use_safetensors=True,
                    variant="fp16" if device == "cuda" else None,
                    local_files_only=False,
                )
            image_to_image_pipeline = image_to_image_pipeline.to(device)
            image_to_image_pipeline.enable_attention_slicing()
            if device == "cuda":
                try:
                    image_to_image_pipeline.enable_vae_slicing()
                except Exception as e:
                    logger.warning(f"Could not enable VAE slicing for img2img: {e}")
                
                # Enable sequential CPU offload for GPU memory optimization
                try:
                    image_to_image_pipeline.enable_sequential_cpu_offload()
                    logger.info("💾 Enabled sequential CPU offload for img2img GPU memory optimization")
                except Exception as e:
                    logger.warning(f"Could not enable sequential CPU offload for img2img: {e}")
            else:
                try:
                    image_to_image_pipeline.enable_sequential_cpu_offload()
                except Exception as e:
                    logger.warning(f"Could not enable CPU offload for img2img: {e}")
        except Exception as e:
            logger.error(f"Failed to load img2img model: {e}")
            raise
    return image_to_image_pipeline


# Request/Response Models
class TextGenerationRequest(BaseModel):
    prompt: str
    max_tokens: int = 256
    temperature: float = 0.7
    top_p: float = 0.95


class TextGenerationResponse(BaseModel):
    text: str
    prompt: str
    finish_reason: str


class ImageGenerationRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None
    style: Optional[str] = "realistic"
    num_inference_steps: int = 30
    guidance_scale: float = 7.5
    width: int = 1024
    height: int = 1024
    seed: Optional[int] = None


class ImageGenerationResponse(BaseModel):
    image_base64: str
    prompt: str


class ImageToImageRequest(BaseModel):
    prompt: str
    image_base64: str  # Base64 encoded input image
    negative_prompt: Optional[str] = None
    style: Optional[str] = "realistic"
    num_inference_steps: int = 20
    guidance_scale: float = 7.5
    strength: float = 0.8
    seed: Optional[int] = None


class VideoFramesRequest(BaseModel):
    prompt: str
    style: Optional[str] = "realistic"
    num_frames: int = 4
    num_inference_steps: int = 25
    guidance_scale: float = 7.5
    seed: Optional[int] = None


class VideoFramesResponse(BaseModel):
    frames: list[str]  # List of base64 encoded frames
    prompt: str


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "device": get_device(),
        "models_dir": str(MODELS_DIR),
    }


# Text Generation Endpoint
@app.post("/text/generate", response_model=TextGenerationResponse)
async def generate_text(request: TextGenerationRequest):
    """Generate text using Llama/Mistral model"""
    try:
        logger.info(f"Generating text for prompt: {request.prompt[:50]}...")
        
        pipe = get_text_pipeline()
        
        # Generate text
        result = pipe(
            request.prompt,
            max_new_tokens=request.max_tokens,
            temperature=request.temperature,
            top_p=request.top_p,
            do_sample=True,
        )
        
        generated_text = result[0]["generated_text"]
        
        return TextGenerationResponse(
            text=generated_text,
            prompt=request.prompt,
            finish_reason="stop",
        )
    except Exception as e:
        logger.error(f"Error in text generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Image Generation Endpoint
@app.post("/image/generate", response_model=ImageGenerationResponse)
async def generate_image(request: ImageGenerationRequest):
    """Generate image using Stable Diffusion XL-Turbo"""
    try:
        _ensure_imports()
        device = get_device()
        
        logger.info(f"🎨 IMAGE GENERATION: Generating image for prompt: {request.prompt[:50]}...")
        
        pipe = get_image_pipeline()
        logger.info(f"✅ Model pipeline ready")
        
        # Set seed for reproducibility
        if request.seed is not None:
            generator = torch.Generator(device=device).manual_seed(request.seed)
        else:
            generator = None
        
        # Build negative prompt
        neg_prompt = request.negative_prompt or "blurry, low quality, distorted"
        
        # Use fewer steps for SDXL-Turbo (1-4 steps) vs regular SDXL (20-50 steps)
        # SDXL-Turbo is optimized for speed, use 1-2 steps for 1-2 second generation
        num_steps = 1 if device == "cuda" else 2  # GPU: 1 step (~1sec), CPU: 2 steps (~5-10sec)
        guidance_scale = 0.0  # SDXL-Turbo doesn't use guidance, set to 0
        
        logger.info(f"⏳ Generating with SDXL-Turbo: {num_steps} step(s) on {device}")
        
        # Clear GPU cache before generation if using CUDA
        if device == "cuda":
            torch.cuda.empty_cache()
            logger.info("🧹 Cleared GPU cache before generation")
        
        # Generate image
        image = pipe(
            prompt=request.prompt,
            negative_prompt=neg_prompt,
            num_inference_steps=num_steps,
            guidance_scale=guidance_scale,
            width=request.width,
            height=request.height,
            generator=generator,
        ).images[0]
        
        # Clear GPU cache after generation if using CUDA
        if device == "cuda":
            torch.cuda.empty_cache()
            logger.info("🧹 Cleared GPU cache after generation")
        
        # Convert to base64
        img_io = io.BytesIO()
        image.save(img_io, format="PNG")
        img_io.seek(0)
        image_base64 = base64.b64encode(img_io.getvalue()).decode()
        
        logger.info(f"✅ Image generation complete! Generated {request.width}x{request.height} image")
        
        return ImageGenerationResponse(
            image_base64=image_base64,
            prompt=request.prompt,
        )
    except Exception as e:
        logger.error(f"❌ Error in image generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Ollama-based image generation endpoint (placeholder for future use)
@app.post("/image/generate-ollama", response_model=ImageGenerationResponse)
async def generate_image_ollama(request: ImageGenerationRequest):
    """Generate image using Ollama (when image generation models become available)"""
    try:
        _ensure_imports()
        device = get_device()
        
        logger.info(f"Generating image with Ollama for prompt: {request.prompt[:50]}...")
        
        # For now, fall back to SDXL as Ollama doesn't have native image generation
        # This endpoint is a placeholder for future Ollama image generation capabilities
        logger.warning("Ollama image generation not yet available, falling back to SDXL")
        
        pipe = get_image_pipeline()
        
        # Set seed for reproducibility
        if request.seed is not None:
            generator = torch.Generator(device=device).manual_seed(request.seed)
        else:
            generator = None
        
        # Build negative prompt
        neg_prompt = request.negative_prompt or "blurry, low quality, distorted"
        
        # Clear GPU cache before generation if using CUDA
        if device == "cuda":
            torch.cuda.empty_cache()
            logger.info("🧹 Cleared GPU cache before generation")
        
        # Generate image with SDXL
        image = pipe(
            prompt=request.prompt,
            negative_prompt=neg_prompt,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
            width=request.width,
            height=request.height,
            generator=generator,
        ).images[0]
        
        # Clear GPU cache after generation if using CUDA
        if device == "cuda":
            torch.cuda.empty_cache()
            logger.info("🧹 Cleared GPU cache after generation")
        
        # Convert to base64
        img_io = io.BytesIO()
        image.save(img_io, format="PNG")
        img_io.seek(0)
        image_base64 = base64.b64encode(img_io.getvalue()).decode()
        
        return ImageGenerationResponse(
            image_base64=image_base64,
            prompt=request.prompt,
        )
    except Exception as e:
        logger.error(f"Error in Ollama image generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Image to Image Endpoint
@app.post("/image/edit", response_model=ImageGenerationResponse)
async def edit_image(request: ImageToImageRequest):
    """Edit/transform image using Stable Diffusion XL img2img"""
    try:
        _ensure_imports()
        device = get_device()
        
        logger.info(f"Editing image with prompt: {request.prompt[:50]}...")
        
        # Decode input image
        img_data = base64.b64decode(request.image_base64)
        input_image = Image.open(io.BytesIO(img_data)).convert("RGB")
        
        pipe = get_image_to_image_pipeline()
        
        # Set seed
        if request.seed is not None:
            generator = torch.Generator(device=device).manual_seed(request.seed)
        else:
            generator = None
        
        # Generate edited image
        image = pipe(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt or "blurry, low quality",
            image=input_image,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
            strength=request.strength,
            generator=generator,
        ).images[0]
        
        # Convert to base64
        img_io = io.BytesIO()
        image.save(img_io, format="PNG")
        img_io.seek(0)
        image_base64 = base64.b64encode(img_io.getvalue()).decode()
        
        return ImageGenerationResponse(
            image_base64=image_base64,
            prompt=request.prompt,
        )
    except Exception as e:
        logger.error(f"Error in image editing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Video Frames Generation Endpoint
@app.post("/video/generate-frames", response_model=VideoFramesResponse)
async def generate_video_frames(request: VideoFramesRequest):
    """Generate multiple frames for video using SDXL with slight variations"""
    try:
        _ensure_imports()
        device = get_device()
        
        logger.info(f"Generating {request.num_frames} frames for prompt: {request.prompt[:50]}...")
        
        pipe = get_image_pipeline()
        frames = []
        
        # Generate frames with consistent seed but slight variations
        base_seed = request.seed or 42
        
        for i in range(request.num_frames):
            # Vary seed slightly for each frame to create motion variation
            frame_seed = base_seed + i
            generator = torch.Generator(device=device).manual_seed(frame_seed)
            
            logger.info(f"Generating frame {i+1}/{request.num_frames}")
            
            image = pipe(
                prompt=request.prompt,
                negative_prompt="blurry, low quality, distorted",
                num_inference_steps=request.num_inference_steps,
                guidance_scale=request.guidance_scale,
                generator=generator,
            ).images[0]
            
            # Convert to base64
            img_io = io.BytesIO()
            image.save(img_io, format="PNG")
            img_io.seek(0)
            frame_base64 = base64.b64encode(img_io.getvalue()).decode()
            frames.append(frame_base64)
        
        return VideoFramesResponse(
            frames=frames,
            prompt=request.prompt,
        )
    except Exception as e:
        logger.error(f"Error in video frame generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("SERVICE_PORT", 8000))
    # Increase timeout for long-running image generation (SDXL can take 30+ seconds)
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=port,
        timeout_keep_alive=300,  # 5 minutes keep-alive for long operations
    )
