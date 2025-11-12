# API Reference

## Base URLs

- **Production:** http://localhost:3000
- **Models Service:** http://localhost:8000

## Text Generation

Generates text using Mistral 7B model.

```
POST /text/generate
Content-Type: application/json

{
  "prompt": "Tell me a funny joke",
  "max_tokens": 256,
  "temperature": 0.7,
  "top_p": 0.95
}
```

**Response:**
```json
{
  "text": "Why did the AI go to school? To improve its learning model!",
  "prompt": "Tell me a funny joke",
  "finish_reason": "stop"
}
```

## Image Generation

Generates images using Stable Diffusion XL.

```
POST /image/generate
Content-Type: application/json

{
  "prompt": "A beautiful sunset over mountains",
  "negative_prompt": "blurry, low quality",
  "style": "realistic",
  "num_inference_steps": 30,
  "guidance_scale": 7.5,
  "width": 1024,
  "height": 1024,
  "seed": null
}
```

**Response:**
```json
{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "prompt": "A beautiful sunset over mountains"
}
```

## Image Editing

Edit/transform an image using img2img.

```
POST /image/edit
Content-Type: application/json

{
  "prompt": "Turn it into a painting",
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "negative_prompt": "blurry, low quality",
  "style": "realistic",
  "num_inference_steps": 20,
  "guidance_scale": 7.5,
  "strength": 0.8,
  "seed": null
}
```

**Response:**
```json
{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "prompt": "Turn it into a painting"
}
```

## Video Frame Generation

Generate multiple frames for video animation.

```
POST /video/generate-frames
Content-Type: application/json

{
  "prompt": "A spinning cube",
  "style": "realistic",
  "num_frames": 4,
  "num_inference_steps": 25,
  "guidance_scale": 7.5,
  "seed": null
}
```

**Response:**
```json
{
  "frames": [
    "iVBORw0KGgoAAAANSUhEUgAA...",
    "iVBORw0KGgoAAAANSUhEUgAA...",
    ...
  ],
  "prompt": "A spinning cube"
}
```

## Health Check

Check if the service is running and healthy.

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "device": "cuda",
  "models_dir": "./models"
}
```

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message explaining what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` — Success
- `400` — Bad request (invalid parameters)
- `500` — Server error (model failed, out of memory, etc.)

## Parameters

### Common Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | What to generate |
| `num_inference_steps` | integer | 30 | Quality vs speed (20-50, higher = better) |
| `guidance_scale` | float | 7.5 | How closely to follow prompt (5-15) |
| `seed` | integer | null | For reproducibility (omit for random) |

### Text-Specific

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max_tokens` | integer | 256 | Maximum output length |
| `temperature` | float | 0.7 | Creativity (0.1-2.0) |
| `top_p` | float | 0.95 | Diversity (0-1) |

### Image-Specific

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `negative_prompt` | string | null | What NOT to generate |
| `style` | string | "realistic" | Style hint |
| `width` | integer | 1024 | Image width in pixels |
| `height` | integer | 1024 | Image height in pixels |

### Video-Specific

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `num_frames` | integer | 4 | Number of frames to generate |

## Examples

### cURL: Text Generation
```bash
curl -X POST http://localhost:8000/text/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is machine learning?",
    "max_tokens": 100
  }'
```

### cURL: Image Generation
```bash
curl -X POST http://localhost:8000/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cat wearing sunglasses",
    "num_inference_steps": 20
  }' > response.json

# Extract image from response
python3 -c "
import json, base64
with open('response.json') as f:
    data = json.load(f)
    with open('output.png', 'wb') as img:
        img.write(base64.b64decode(data['image_base64']))
"
```

### Node.js: Text Generation
```typescript
const response = await fetch('http://localhost:8000/text/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Hello",
    max_tokens: 100
  })
});

const data = await response.json();
console.log(data.text);
```

## Performance Tips

- **Faster images:** Use `num_inference_steps: 20` instead of 30 (2x faster)
- **Better quality:** Use `guidance_scale: 10-12` (higher = more detailed)
- **Reproducible:** Use same `seed` to get same output
- **Memory:** Reduce `width/height` to 512 if running out of VRAM
- **Batch:** Generate frames separately, not all at once

## Rate Limiting

No built-in rate limiting. For production, add:
- Reverse proxy (nginx)
- API gateway (Kong, Tyk)
- Queue system (BullMQ)

## Models Used

- **Text:** Mistral 7B Instruct v0.1
- **Image:** Stable Diffusion XL Base 1.0
- **Download size:** ~15GB total
- **VRAM needed:** 24GB (recommended)

## See Also

- SETUP.md — How to set up and run
- Local models service docs: server/local-models-service/README.md
