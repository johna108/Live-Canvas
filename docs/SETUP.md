# Setup Guide: Local LLMs for Living Canvas

## Quick Start (Choose One)

### Option A: Docker (Recommended — Easiest)
```bash
docker-compose up --build
# In another terminal:
cd client && npm install && npm start
# Open http://localhost:4200
```

### Option B: Local Python Setup
```bash
# Terminal 1: Python service
cd server/local-models-service
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py

# Terminal 2: Node server
cd server
npm install
npm run dev

# Terminal 3: Angular client
cd client
npm install
npm start
```

## Prerequisites

- **Docker** (recommended) from https://www.docker.com/products/docker-desktop
- **OR Python 3.10+** from https://www.python.org/downloads/
- **Node.js 18+** (check: `node --version`)
- **50GB free disk space** for model cache
- **Good internet** (first download: 15GB, takes 10-30 min)

## What Gets Deployed

| Service | Port | Purpose |
|---------|------|---------|
| Angular Client | 4200 | User interface |
| Node.js Server | 3000 | Backend API |
| Python Service | 8000 | AI models (text, image, video) |

## Testing

```bash
# Check if service is running
curl http://localhost:8000/health

# Test Node server
curl http://localhost:3000/test

# Test text generation
curl -X POST http://localhost:8000/text/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello"}'
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000/8000 in use | Kill process: `lsof -i :3000` then `kill -9 <PID>` |
| Docker not found | Install from docker.com |
| Python not found | Install from python.org |
| Models downloading slowly | Normal! ~15GB takes 10-30 min, happens only once |
| CUDA out of memory | Reduce `num_inference_steps` in requests (20 instead of 30) |
| Can't connect to service | Check if Docker/Python services are running |

## Environment Variables

### Server (.env in /server)
```
NODE_ENV=development
PORT=3000
LOCAL_MODELS_SERVICE_URL=http://localhost:8000
USE_LOCAL_BACKEND=true
```

### Models Service (.env in /server/local-models-service)
```
SERVICE_PORT=8000
LLAMA_MODEL_NAME=mistralai/Mistral-7B-Instruct-v0.1
SDXL_MODEL_NAME=stabilityai/stable-diffusion-xl-base-1.0
MODELS_DIR=./models
```

## Performance

- **First run:** 45-60 minutes (models download ~15GB)
- **Subsequent runs:** 5 minutes (uses cached models)
- **Per image:** 30-60 seconds on GPU (with RTX 3090/4090)
- **Per image (CPU-only):** 5-10 minutes (not recommended)

## What Changed From Google Cloud

| Aspect | Google Cloud | Local |
|--------|--------------|-------|
| Cost | Per API call | Free |
| Internet | Always required | Required once |
| Privacy | Data to Google | All local |
| Speed | Variable | 30-60s per image (GPU) |
| Customization | Limited | Full control |

## API Endpoints

### Text Generation
```
POST /text/generate
{ "prompt": "Tell me a joke", "max_tokens": 100 }
```

### Image Generation
```
POST /image/generate
{ 
  "prompt": "A beautiful sunset", 
  "num_inference_steps": 30,
  "guidance_scale": 7.5
}
```

### Video Frames
```
POST /video/generate-frames
{
  "prompt": "A spinning cube",
  "num_frames": 4
}
```

## File Structure

```
solution-living-canvas/
├── docs/                          (All documentation)
│   ├── SETUP.md                  (This file)
│   └── API.md                    (API reference)
├── server/
│   ├── local-models-service/     (Python FastAPI)
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   ├── helpers/
│   │   └── local-models-client.ts
│   └── .env.example
├── client/
│   └── ... (Angular app)
├── docker-compose.yml
└── .assistant_memory/            (Feature tracking only)
```

## Next Steps

1. Choose setup method (Docker or Local Python)
2. Install prerequisites
3. Run the appropriate commands
4. Wait for models to download (first time only)
5. Open http://localhost:4200
6. Generate images/text!

## Support

- Check the Troubleshooting section above
- See API.md for endpoint details
- Check docker-compose logs: `docker-compose logs -f`
