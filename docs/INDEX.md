# Documentation Index

## Getting Started

**New to Living Canvas?** [`GAME_MECHANICS.md`](./GAME_MECHANICS.md)
- How the game works (drawing → AI recognition → physics objects)
- Object types and their properties (fire, ice, water, wind, stone, wood, metal)
- How objects interact with each other
- Puzzle solving strategies
- Tips for clear drawings and better recognition

**Want to run the project?** [`SETUP.md`](./SETUP.md)
- Quick start with Docker (recommended) or local Python
- Prerequisites and system requirements
- Testing your setup
- Troubleshooting common issues
- Environment configuration
- Performance expectations

## API Reference

**Full API documentation:** [`API.md`](./API.md)
- All 5 endpoints with request/response examples
- Parameter reference tables
- cURL and Node.js code examples
- Error handling guide
- Performance optimization tips
- Models and VRAM requirements

## File Structure

This documentation folder consolidates all setup and reference information:

```
docs/
├── INDEX.md (this file)          # Navigation guide
├── GAME_MECHANICS.md              # How the game works
├── QUICKSTART.md                  # Quick setup with copy-paste commands
├── SETUP.md                       # Setup instructions & troubleshooting
└── API.md                         # Complete API reference
```

**Also see:** `TERMINAL_COMMANDS.md` at root level for quick copy-paste terminal commands

## What Was Changed

The Living Canvas project was upgraded to use **local open-source AI models** instead of Google Cloud services:

- **Text generation:** Mistral 7B (local, no API keys)
- **Image generation:** Stable Diffusion XL (local, no quotas)
- **Video generation:** Frame-by-frame SDXL (local, fully offline)

## Quick Decision Tree

**Question:** Which guide do I need?

- "I want to run it right now!" → [`QUICKSTART.md`](./QUICKSTART.md) or `TERMINAL_COMMANDS.md`
- "How does this game work?" → [`GAME_MECHANICS.md`](./GAME_MECHANICS.md)
- "What are the object types and properties?" → [`GAME_MECHANICS.md`](./GAME_MECHANICS.md)
- "How do I solve a puzzle?" → [`GAME_MECHANICS.md`](./GAME_MECHANICS.md)
- "I want to set up the project (detailed)" → [`SETUP.md`](./SETUP.md)
- "I want to call the API from code" → [`API.md`](./API.md)
- "The service won't start" → [`SETUP.md`](./SETUP.md) → Troubleshooting section
- "I want to know response format for image generation" → [`API.md`](./API.md) → Image Generation section
- "What are the system requirements?" → [`SETUP.md`](./SETUP.md) → Prerequisites section
- "How do I test if it's working?" → [`SETUP.md`](./SETUP.md) → Testing section

## Key Information

### System Requirements

- **Docker option (recommended):**
  - Docker + Docker Compose
  - 50GB+ free disk space (for model weights)
  - 24GB+ VRAM (for SDXL GPU acceleration)
  - 10Mbps+ internet (first-time model download)

- **Local Python option:**
  - Python 3.10+
  - Same disk/VRAM/internet requirements
  - Manual steps for model setup

### Service Ports

- **Angular client:** http://localhost:4200
- **Node.js backend:** http://localhost:3000
- **Python models service:** http://localhost:8000

### First-Time Setup Timeline

- Installation: 10-15 minutes (Docker) or 30 minutes (Local Python)
- Model download: 30-60 minutes (one-time, dependent on internet)
- First image generation: 45-60 seconds
- Subsequent generations: 5-10 seconds (models cached)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Angular Client (Port 4200)                              │
│ ├─ Phaser 3 Game Engine                                 │
│ └─ Makes requests to backend                            │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP
        ┌────────────▼────────────┐
        │ Node.js Backend (Port 3000)
        │ ├─ Express Server        │
        │ ├─ Request Processing    │
        │ └─ Calls AI Service      │
        └────────────┬─────────────┘
                     │ HTTP
        ┌────────────▼─────────────────────────────────────┐
        │ Python FastAPI Service (Port 8000)              │
        │ ├─ /text/generate (Mistral 7B)                  │
        │ ├─ /image/generate (SDXL)                       │
        │ ├─ /image/edit (img2img)                        │
        │ ├─ /video/generate-frames (SDXL)                │
        │ └─ Models cached to disk                        │
        └─────────────────────────────────────────────────┘
```

## Deployment

- **Development:** docker-compose up
- **Production:** Kubernetes or Docker Swarm
- **Models:** Cached locally (~50GB total)
- **GPU:** NVIDIA CUDA (recommended) or CPU fallback (slow)

## Support

If something isn't working:

1. Check troubleshooting table in [`SETUP.md`](./SETUP.md)
2. Verify ports are accessible: `http://localhost:8000/health`
3. Check model cache directory has space
4. Ensure GPU drivers are updated (if using CUDA)
5. Review service logs for detailed error messages

## Next Steps

After setup is complete:

1. Run the Angular client on http://localhost:4200
2. Test image generation in the web interface
3. Monitor performance metrics in [`SETUP.md`](./SETUP.md) → Performance Metrics
4. Read [`API.md`](./API.md) if integrating with other systems
