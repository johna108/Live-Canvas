# Speed Optimization for Living Canvas

## Overview

Switched from **SDXL 1.0** to **SDXL-Turbo** for dramatically faster image generation.

## Speed Comparison

| Model | Steps | GPU Time | CPU Time | Quality |
|-------|-------|----------|----------|---------|
| **SDXL 1.0** | 20-50 | 10-20s | 60-120s | Highest |
| **SDXL-Turbo** | 1-2 | 1-2s | 5-10s | High |
| **LCM** | 4-8 | 3-5s | 15-20s | Medium-High |

## What Changed

### 1. Model Update
- **Before:** `stabilityai/stable-diffusion-xl-base-1.0`
- **After:** `stabilityai/sdxl-turbo`

### 2. Generation Parameters
```python
# SDXL-Turbo optimizations
num_inference_steps = 1 if DEVICE == "cuda" else 2
guidance_scale = 0.0  # SDXL-Turbo doesn't use guidance
```

### 3. Timeout Reduction
- **Before:** 300 seconds (5 minutes)
- **After:** 60 seconds (1 minute) - still plenty for turbo

## Performance Gains

### Timeline Example (Drawing to Display)

**Before (SDXL 1.0):**
```
1. Ollama Analysis:        2-3s
2. Prompt Enhancement:     1-2s
3. SDXL Generation:        30-60s ← SLOW
4. Image Processing:       1-2s
─────────────────────────────────
Total: ~35-70 seconds
```

**After (SDXL-Turbo):**
```
1. Ollama Analysis:        2-3s
2. Prompt Enhancement:     1-2s
3. SDXL-Turbo Generation:  1-10s ← FAST!
4. Image Processing:       1-2s
─────────────────────────────────
Total: ~6-18 seconds
```

## Quality vs Speed Trade-off

SDXL-Turbo sacrifices some detail for speed, but:
- ✅ Still produces good quality images
- ✅ Results are suitable for game assets
- ✅ Perfect for real-time user feedback
- ⚠️ May have slightly less detail than SDXL 1.0

## GPU Support

- **With GPU (CUDA):** ~1-2 seconds per image
- **CPU Only:** ~5-10 seconds per image
- **Ollama Analysis:** 2-3 seconds (independent of hardware)

## If You Need Even Faster...

1. **LCM (Latent Consistency Model):** 4-8 steps, 3-5s on GPU
   - Set: `SDXL_MODEL_NAME=stabilityai/lcm`

2. **Smaller Models:** TinySD, miniSD (~2-3s on CPU)
   - Trade quality for speed

3. **Async Generation:** Queue images in background
   - Display placeholder while generating

## Configuration

To revert to SDXL 1.0 (slower but higher quality):
```bash
# In server/.env or set environment variable
SDXL_MODEL_NAME=stabilityai/stable-diffusion-xl-base-1.0
```

Then restart the Python service to reload the model.

## Notes

- SDXL-Turbo model is smaller (~6GB vs 14GB for SDXL 1.0)
- Faster model download and loading
- Requires one-time model download from Hugging Face
- First generation may be slightly slower (model warmup)

## For Tomorrow's Demo

With SDXL-Turbo:
- ✅ Drawing recognition: 2-3 seconds
- ✅ Image generation: 1-10 seconds
- ✅ Total flow: 6-18 seconds (interactive feel)
- ✅ No timeout errors
- ✅ Smooth user experience
