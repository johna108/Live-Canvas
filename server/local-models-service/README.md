# Local Models Service README

This is a FastAPI microservice that provides local alternatives to Google Cloud AI services:

- **Text Generation**: Replaces Gemini (uses Mistral/Llama models)
- **Image Generation**: Replaces Imagen (uses Stable Diffusion XL)
- **Video Frame Generation**: Replaces Veo (generates frames with SDXL)

## API Endpoints

### Health Check
```
GET /health
```
Returns service status and device info.

### Text Generation
```
POST /text/generate

Body:
{
  "prompt": "Tell me a joke",
  "max_tokens": 256,
  "temperature": 0.7,
  "top_p": 0.95
}

Response:
{
  "text": "...",
  "prompt": "Tell me a joke",
  "finish_reason": "stop"
}
```

### Image Generation
```
POST /image/generate

Body:
{
  "prompt": "A beautiful sunset",
  "negative_prompt": "blurry, low quality",
  "style": "realistic",
  "num_inference_steps": 30,
  "guidance_scale": 7.5,
  "width": 1024,
  "height": 1024,
  "seed": null
}

Response:
{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "prompt": "A beautiful sunset"
}
```

### Image-to-Image (Edit)
```
POST /image/edit

Body:
{
  "prompt": "Turn it into a painting",
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "strength": 0.8,
  "num_inference_steps": 20
}

Response:
{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "prompt": "Turn it into a painting"
}
```

### Video Frame Generation
```
POST /video/generate-frames

Body:
{
  "prompt": "A spinning cube",
  "style": "realistic",
  "num_frames": 4,
  "num_inference_steps": 25,
  "guidance_scale": 7.5,
  "seed": null
}

Response:
{
  "frames": [
    "iVBORw0KGgoAAAANSUhEUgAA...",
    "iVBORw0KGgoAAAANSUhEUgAA...",
    ...
  ],
  "prompt": "A spinning cube"
}
```

## Configuration

See `.env.example` for all available settings:
- `SERVICE_PORT`: Port to run the service on (default: 8000)
- `LLAMA_MODEL_NAME`: HuggingFace model ID for text generation
- `SDXL_MODEL_NAME`: HuggingFace model ID for image generation
- `MODELS_DIR`: Directory where models are cached

## Running

### Option 1: Docker (Recommended)

```bash
docker build -t local-models-service .
docker run --gpus all -p 8000:8000 local-models-service
```

### Option 2: Local Python

```bash
pip install -r requirements.txt
python main.py
```

## Testing

```bash
python test_service.py
```

Or use curl:
```bash
curl -X GET http://localhost:8000/health
curl -X POST http://localhost:8000/text/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "max_tokens": 50}'
```

## Performance Notes

- First run downloads ~15-25GB of model weights to `MODELS_DIR`
- SDXL generation takes ~30-60s on GPU, much slower on CPU
- Text generation with Mistral 7B takes ~5-10s per prompt
- Video frames generation is slow; use sparingly

## Hardware Requirements

- **GPU (Recommended)**: NVIDIA GPU with 24GB VRAM (RTX 3090, 4090, A5000, etc.)
- **CPU Only**: Will work but generation is very slow (not recommended)
- **Memory**: 24GB VRAM for SDXL + 8GB for Llama
- **Disk**: ~50GB for model cache

## Notes

- Models are cached in `MODELS_DIR` after first download
- Service requires CUDA-capable GPU for reasonable performance
- Can quantize models to reduce memory footprint (not implemented yet)
