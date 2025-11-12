# 🎯 Ollama Integration - Your Action Plan

## What We've Set Up

✅ **Ollama client functions** in `server/helpers/local-models-client.ts`:
- `analyzeDrawingWithOllama()` — Vision analysis of drawings
- `generateTextWithOllama()` — Text generation with LLaVA
- `isOllamaAvailable()` — Health check
- `getOllamaHealth()` — Get service status

✅ **Updated `.env`** with Ollama configuration:
```env
OLLAMA_URL=http://localhost:11434
OLLAMA_VISION_MODEL=llava:7b
OLLAMA_TEXT_MODEL=llava:7b
```

✅ **Created setup guide** in `docs/OLLAMA_SETUP.md`

---

## Your Next Steps (In Order)

### Step 1: Install Ollama ⬅️ **START HERE**
```bash
1. Download from ollama.ai
2. Run installer
3. Restart your computer
4. Verify: ollama --version
```

### Step 2: Pull LLaVA 7B Model
```bash
ollama pull llava:7b
```
(~10GB, takes 5-15 min)

### Step 3: Start Ollama Service
```bash
ollama serve
```
You should see:
```
Listening on 127.0.0.1:11434
```

### Step 4: Test It Works
Open new PowerShell:
```powershell
curl -X POST http://localhost:11434/api/generate `
  -H "Content-Type: application/json" `
  -d '{"model":"llava:7b","prompt":"2+2?","stream":false}' | ConvertFrom-Json
```

### Step 5: Tell Me It's Working
Say: **"✅ Ollama running with LLaVA 7B"**

Then I'll:
- Add `/analyze-drawing` endpoint to server
- Update client to use Ollama for drawing recognition
- Test end-to-end integration
- Make sure SDXL images still generate beautifully

---

## Timeline

| Step | Time | Status |
|------|------|--------|
| 1. Install Ollama | 10 min | ⏳ Your turn |
| 2. Pull LLaVA 7B | 10 min | ⏳ Your turn |
| 3. Start Ollama | 1 min | ⏳ Your turn |
| 4. Test Ollama | 2 min | ⏳ Your turn |
| 5. Server integration | 1 hour | ⏳ My turn |
| 6. Client integration | 1 hour | ⏳ My turn |
| 7. Testing | 30 min | ⏳ My turn |

**Total:** ~4 hours until fully working

---

## What Happens After

Once Ollama is running:

1. **You draw** an object on canvas
2. **Client sends** drawing (base64) to Node backend
3. **Node calls** Ollama LLaVA with image
4. **Ollama analyzes** and returns: object type, confidence, properties
5. **Server calls** SDXL to generate beautiful image
6. **Client creates** game object with inferred properties
7. **Game runs** with physics interactions

---

## Troubleshooting During Setup

**"ollama: command not found"**
- Restart PowerShell after install
- Or use full path: `C:\Users\YourUser\AppData\Local\Programs\Ollama\ollama.exe serve`

**Port 11434 in use**
```powershell
netstat -ano | findstr :11434
taskkill /PID <pid> /F
```

**LLaVA won't download**
- Check disk space (need ~10GB free)
- Check internet connection
- Check Ollama logs

**Out of memory**
- Close other apps
- LLaVA 7B needs ~8-10GB VRAM
- If still issues, enable GPU (see OLLAMA_SETUP.md)

---

## Files I've Already Updated

1. ✅ `server/helpers/local-models-client.ts` — Added Ollama functions
2. ✅ `server/.env` — Added Ollama config
3. ✅ `docs/OLLAMA_SETUP.md` — Created setup guide

## Files I'll Update When You Say It's Ready

1. `server/app.ts` — Add `/analyze-drawing` endpoint
2. `client/src/game/scenes/StagePuzzles.ts` — Use new analysis
3. `docker-compose.yml` — Add Ollama service

---

## Go! 🚀

Follow these steps to get Ollama running:

1. **Download Ollama** from ollama.ai
2. **Install** (restart computer after)
3. **Pull model**: `ollama pull llava:7b`
4. **Start**: `ollama serve`
5. **Tell me** when you see "Listening on 127.0.0.1:11434"

Then I'll finish the integration in ~2 hours!

---

**Need help?** Check `docs/OLLAMA_SETUP.md` for detailed troubleshooting.
