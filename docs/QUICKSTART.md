# Quick Start: Running Living Canvas Locally

## Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Google Cloud Project** with API keys (optional, for cloud AI backend)

## Option 1: Run with Local AI Models (Recommended - No API Keys Needed)

This uses the local Mistral 7B and SDXL models you set up earlier.

### Step 1: Install Dependencies

```bash
# Terminal 1: Server setup
cd server
npm install

# Terminal 2: Client setup  
cd client
npm install
```

### Step 2: Start Services

```bash
# Terminal 1: Start Python models service
cd server/local-models-service
python main.py
# Output: Uvicorn running on http://localhost:8000

# Terminal 2: Start Node.js backend
cd server
npm run dev
# Output: Server running on http://localhost:3000

# Terminal 3: Start Angular client
cd client
npm start
# Output: Angular server running on http://localhost:4200
```

### Step 3: Open the Game

Navigate to **http://localhost:4200** in your browser and start playing!

---

## Option 2: Run with Google Cloud AI (Needs API Keys)

### Step 1: Get API Keys

1. Create a [Google Cloud Project](https://console.cloud.google.com)
2. Enable Vertex AI API
3. Create a service account with Vertex AI access
4. Download the JSON key file

### Step 2: Create .env File

Create `server/.env`:

```env
# Google Cloud Config
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
PROJECT_ID=your-project-id
LOCATION=us-central1
GOOGLE_API_KEY=your-gemini-api-key

# Server Config
NODE_ENV=development
PORT=3000

# AI Backend (use "google" for cloud, "local" for local models)
USE_LOCAL_BACKEND=false
LOCAL_MODELS_SERVICE_URL=http://localhost:8000
```

### Step 3: Start Services

```bash
# Terminal 1: Start Node.js backend
cd server
npm run dev

# Terminal 2: Start Angular client
cd client
npm start
```

### Step 4: Open the Game

Navigate to **http://localhost:4200**

---

## Testing the Setup

### Check Backend Health

```bash
curl http://localhost:3000/health
```

### Check Models Service (if using local AI)

```bash
curl http://localhost:8000/health
```

### Test Image Generation

```bash
# Local models
curl -X POST http://localhost:8000/image/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a red apple","num_inference_steps":20}'

# Or through Node backend
curl -X POST http://localhost:3000/generateImage \
  -H "Content-Type: application/json" \
  -d '{"prompt":"fire","backend":"local","style":"realistic"}'
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000/4200 already in use | Change ports in package.json or kill process on that port |
| Python service won't start | Ensure Python 3.10+, run `pip install -r requirements.txt` |
| Models won't download | Check internet connection and disk space (50GB needed) |
| "Cannot find module" error | Run `npm install` in both server and client folders |
| Google Cloud errors | Verify API keys and service account permissions |
| CORS errors | Check `LOCAL_MODELS_SERVICE_URL` in .env |

---

## Project Structure

```
server/
├── app.ts                          # Express app
├── helpers/
│   ├── gemini-generation.ts        # Text/image via Google
│   ├── imagen-generation.ts        # Image via Google
│   ├── veo-generation.ts           # Video via Google
│   ├── local-models-client.ts      # HTTP calls to Python service
│   └── ai-analysis.ts              # Drawing recognition
├── local-models-service/           # Python FastAPI service
│   ├── main.py                     # Mistral 7B + SDXL inference
│   └── requirements.txt
└── .env.example                    # Environment template

client/
├── src/
│   ├── app/
│   │   ├── app.component.ts        # Main Angular component
│   │   └── app.routes.ts           # Routing
│   ├── game/
│   │   ├── main.ts                 # Phaser game config
│   │   ├── objects/
│   │   │   ├── WorldObject.ts      # Base game object
│   │   │   ├── WorldObjectFactory.ts
│   │   │   └── Water.ts            # Special water object
│   │   └── scenes/
│   │       ├── StagePuzzles.ts     # Main puzzle level
│   │       ├── StageEarth.ts       # Earth theme level
│   │       ├── StageMoon.ts        # Moon theme level
│   │       └── ...
│   └── environments/
│       ├── environment.ts          # Production config
│       └── environment.development.ts
└── public/
    └── assets/                     # Game sprites and images
```

---

## Next Steps

1. **Test the game** — Draw objects and watch them get generated
2. **Explore puzzle levels** — See how objects interact
3. **Check the console** — Monitor recognition and generation logs
4. **Read GAME_MECHANICS.md** — Understand object properties and interactions

---

## Need Help?

- Server issues → Check `server` console for errors
- Client issues → Check browser console (F12 → Console tab)
- Models service → Check Python service output
- Game logic → See `client/src/game/scenes/StagePuzzles.ts`

Enjoy the game! 🎮✨
