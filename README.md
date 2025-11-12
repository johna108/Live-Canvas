# Living Canvas: An Interactive AI-Powered Game with Local AI Models

An interactive web-based puzzle game where users draw objects that come to life with physics-based interactions. Powered by **fully local, offline-first AI models** - no cloud dependencies or API keys required.

**Learn more:** https://developers.google.com/solutions/learn/living-canvas

## 🎮 Game Overview

Living Canvas is a creative puzzle game where:
1. **Draw** objects on the canvas (fire, water, rocks, etc.)
2. **AI recognizes** your drawing using local vision model (Ollama LLaVA 7B)
3. **Images generated** using local image model (SDXL-Turbo on GPU)
4. **Physics simulated** with interactive game mechanics
5. **Solve puzzles** by using object properties creatively

## ✨ Key Features

- ✅ **Fully Offline** - No internet required after initial model download
- ✅ **GPU Accelerated** - NVIDIA CUDA support for fast generation (~3 seconds/image)
- ✅ **Local Vision AI** - Ollama LLaVA 7B for drawing analysis
- ✅ **Local Image Gen** - SDXL-Turbo for high-quality image synthesis
- ✅ **Physics Engine** - Matter.js with 20+ interactive properties
- ✅ **Multiple Art Styles** - Realistic, Cartoon, Pixellated, Mask
- ✅ **Browser-Based** - No installation needed for gameplay

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for server and client)
- Python 3.8+ (for image generation service)
- 16GB+ RAM (8GB minimum for GPU, 24GB+ for CPU)
- Optional: NVIDIA GPU (RTX 4050+) for faster image generation

### Running with Docker (Recommended)
```bash
docker-compose up
```
Access at `http://localhost:4200`

### Running Locally

**1. Start Python Image Generation Service:**
```bash
cd server/local-models-service
pip install -r requirements.txt
python main.py
# Service will start at http://localhost:8000
```

**2. Start Node.js Backend (in new terminal):**
```bash
cd server
npm install
npm run dev
# Server will start at http://localhost:3000
```

**3. Start Ollama Vision Service (in new terminal):**
```bash
ollama run llava:7b
# Service will start at http://localhost:11434
```

**4. Start Angular Frontend (in new terminal):**
```bash
cd client
npm install
ng serve
# App will be available at http://localhost:4200
```

## 📋 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Browser (Angular 19)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Game Canvas (Phaser 3) + Drawing Interface          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ↓ REST API (Draw) ↓ POST /analyze-drawing
┌─────────────────────────────────────────────────────────────┐
│           Node.js Express Server (localhost:3000)            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Request Orchestration & Game Logic                  │  │
│  │ Timeouts: 180-300 seconds for long operations      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
    ↓           ↓              ↓
    │           │              │
    ↓           ↓              ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐
│   Ollama     │ │ Python Fast  │ │ HuggingFace Model Cache  │
│  LLaVA 7B    │ │  API SDXL    │ │ (~9.45 GB, cached)       │
│  Drawing     │ │  Turbo GPU   │ │                          │
│  Analysis    │ │  Image Gen   │ │ - SDXL-Turbo fp16        │
│              │ │              │ │ - VAE, Text Encoder      │
│ 2-3 seconds  │ │ 2-3 seconds  │ │                          │
│  (CPU)       │ │  (GPU)       │ │ Downloaded once,         │
│              │ │              │ │ cached for reuse         │
└──────────────┘ └──────────────┘ └──────────────────────────┘
```

## 🎯 Game Mechanics

### Object Properties System

Each generated object gets 20+ properties that affect gameplay:

| Category | Properties |
|----------|-----------|
| **Movement** | walks, drives, flies, hovers, propelled |
| **Physics** | falls, floats, heavy, solid, drips, douses |
| **Effects** | burns, explodes, blows, lightning, heal |
| **Materials** | wooden, metal, ice, magnetic |
| **Special** | user_generated_obj, generating |

### Example Objects

- **Fire/Candle**: `burns=true, falls=true, solid=true`
- **Water**: `drips=true, douses=true, falls=true, solid=false`
- **Cloud**: `floats=true, falls=false, solid=false`
- **Rock**: `falls=true, heavy=true, solid=true`
- **Wind**: `blows=true, falls=false, solid=false`

### Puzzle Types

1. **Fire Slope** - Use gravity to slide objects
2. **Windy** - Navigate wind-blown objects
3. **Ice** - Slippery surfaces challenge
4. **Metal** - Magnetic field puzzles
5. **Rain** - Water accumulation mechanics
6. **Lightning** - Electrical effects
7. **Balance** - Weight distribution puzzles

## 🔧 Performance

| Metric | Value |
|--------|-------|
| **Total Pipeline** | 5-7 seconds (analyze + generate + render) |
| **Ollama Analysis** | 2-3 seconds (CPU) |
| **SDXL Generation** | 2-3 seconds (GPU: RTX 4050) |
| **Model Download** | 15-30 minutes (first time only) |
| **Model Cache Size** | ~9.45 GB (one-time download) |
| **Runtime Memory** | 4-5 GB GPU + system RAM |

### GPU vs CPU

- **GPU (RTX 4050)**: 2.95 seconds per image ⚡
- **CPU**: 29+ seconds per image 🐢
- **Speed Improvement**: 10x faster with GPU

## 📦 Technology Stack

### Frontend
- **Framework**: Angular 19
- **Game Engine**: Phaser 3
- **Canvas**: HTML5 Canvas
- **Physics**: Matter.js

### Backend
- **Server**: Node.js + Express.js
- **Image Generation**: Python FastAPI
- **Vision Analysis**: Ollama LLaVA 7B
- **Image Model**: SDXL-Turbo
- **Deep Learning**: PyTorch 2.5.1 + CUDA 12.1

### Infrastructure
- **Caching**: HuggingFace local cache
- **Containerization**: Docker & Docker Compose
- **Package Management**: npm, pip, pnpm

## 🎨 Art Styles

Switch between visual styles for the same object:
- **Realistic** - Photorealistic rendering
- **Cartoon** - Stylized cartoon art
- **Pixellated** - Retro pixel art
- **Mask** - Puzzle game masks

## 📚 Project Structure

```
solution-living-canvas/
├── client/                          # Angular game frontend
│   ├── src/game/                   # Phaser game scenes & objects
│   │   ├── scenes/                 # Game stages (Earth, Moon, Space, etc.)
│   │   ├── objects/                # WorldObject physics properties
│   │   └── LivingCanvas.ts         # Main game orchestration
│   └── src/app/                    # Angular components
│
├── server/                          # Node.js backend
│   ├── app.ts                      # Express server & routes
│   ├── config.ts                   # Configuration management
│   ├── helpers/                    # Utility functions
│   │   ├── local-models-client.ts  # SDXL-Turbo integration
│   │   ├── cache-manager.ts        # Model caching logic
│   │   └── image-processing.ts     # Image transformations
│   └── local-models-service/       # Python FastAPI service
│       ├── main.py                 # SDXL-Turbo API endpoints
│       ├── Dockerfile              # Container image
│       └── requirements.txt         # Python dependencies
│
├── docker-compose.yml              # Multi-service orchestration
├── METHODOLOGY.md                  # Detailed technical breakdown
└── README.md                        # This file
```

## 🔐 No Cloud Dependencies

Unlike the original implementation, this version requires **zero cloud services**:

- ❌ No Google Cloud Project needed
- ❌ No Gemini API key required
- ❌ No Imagen 3 billing
- ❌ No Veo video generation service
- ✅ Everything runs locally on your machine

## 🛠️ Development

### Build Client
```bash
cd client
npm run build
```

### Build Server
```bash
cd server
npm run build
```

### Run Tests
```bash
cd client
npm test

cd server
npm test
```

## 📖 Documentation

- **[METHODOLOGY.md](./METHODOLOGY.md)** - Complete technical architecture
- **[QUICKSTART.md](./docs/QUICKSTART.md)** - Detailed setup guide
- **[docs/](./docs/)** - Additional documentation

## 🐛 Troubleshooting

### "CUDA out of memory"
- Enable GPU memory optimizations (attention slicing, VAE slicing)
- Reduce image resolution (512x512 vs 1024x1024)
- Use CPU fallback (slower but works)

### "Model not found"
- First run will download ~9.45 GB of models
- Check internet connection
- Verify HF_HOME directory has write permissions

### "Port already in use"
- Change port in environment variables
- Or kill existing process: `lsof -i :3000`

## 🚀 Deployment

### Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Kubernetes
See `docker-compose.yml` for service configuration to convert to K8s manifests.

### Manual
Follow the "Running Locally" section above.

## 📝 License

Licensed under the Apache License 2.0. See [LICENSE.txt](./LICENSE.txt)

## 👨‍💻 Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📧 Support

This is a demonstration project. For issues, please:
1. Check [METHODOLOGY.md](./METHODOLOGY.md) for architecture details
2. Review terminal logs for error messages
3. Ensure all services are running on correct ports

---

**Built with ❤️ for creative AI gaming**

