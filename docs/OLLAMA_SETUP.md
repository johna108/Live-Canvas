# 🚀 Ollama + LLaVA 7B Setup Guide

## Step 1: Install Ollama

### Windows
1. Download from [ollama.ai](https://ollama.ai)
2. Run the installer
3. Restart your computer
4. Open PowerShell and verify:
```powershell
ollama --version
```

### Mac
```bash
# Download from ollama.ai or use Homebrew
brew install ollama
```

### Linux
```bash
curl https://ollama.ai/install.sh | sh
```

---

## Step 2: Pull LLaVA 7B Model

```bash
ollama pull llava:7b
```

**What to expect:**
```
pulling manifest
pulling 8603f7f2a7e3... 100% ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
pulling 93f2e7f0a7b2... 100% ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
pulling e3f8d4b1a2c3... 100% ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
verifying sha256 digest
writing manifest
success
```

**Size:** ~10GB (fits on most laptops)  
**Time:** 5-15 minutes depending on internet

---

## Step 3: Start Ollama Service

```bash
ollama serve
```

**Expected output:**
```
time=2025-11-12T18:00:00.000Z level=INFO msg="Listening on 127.0.0.1:11434"
```

✅ Ollama is now running on `http://localhost:11434`

---

## Step 4: Test Ollama with LLaVA

Open a **new PowerShell terminal** and test:

### Text Generation
```powershell
curl -X POST http://localhost:11434/api/generate `
  -H "Content-Type: application/json" `
  -d '{
    "model": "llava:7b",
    "prompt": "What is 2+2?",
    "stream": false
  }' | ConvertFrom-Json | Select-Object response
```

**Expected response:**
```
response: "2 + 2 = 4"
```

### Vision Analysis (Test Drawing Recognition)
```powershell
# First, create a test image (or use an existing one)
# For testing, we'll use a simple prompt first
curl -X POST http://localhost:11434/api/generate `
  -H "Content-Type: application/json" `
  -d '{
    "model": "llava:7b",
    "prompt": "Describe a drawing of fire in one word",
    "stream": false
  }' | ConvertFrom-Json | Select-Object response
```

---

## Step 5: Verify Everything Works

```powershell
# Test Ollama is running
curl http://localhost:11434/api/tags | ConvertFrom-Json | Select-Object models

# Should show: llava:7b in the list
```

---

## Next: Integration with Living Canvas

Once Ollama is running, the server will:

1. **Send drawing** to Ollama LLaVA
2. **Get object recognition** (fire, ice, water, etc.)
3. **Extract properties** from LLM response
4. **Create game object** with inferred properties
5. **Generate SDXL image** for beautiful visuals

---

## Troubleshooting

### "ollama command not found"
```powershell
# Add to PATH or restart PowerShell
# Or use full path: C:\Users\<username>\AppData\Local\Programs\Ollama\ollama.exe serve
```

### Port 11434 already in use
```powershell
# Kill process on port 11434
netstat -ano | findstr :11434
taskkill /PID <PID> /F

# Or use different port
ollama serve --address 127.0.0.1:11435
```

### LLaVA 7B won't download
```powershell
# Check disk space (need ~10GB free)
# Check internet connection
# Try again or pull smaller model:
ollama pull llava:latest-7b
```

### Out of memory
```powershell
# LLaVA 7B needs ~10GB VRAM
# If you get OOM errors, you might need:
# - Close other apps
# - Use GPU acceleration (see below)
```

### Enable GPU Acceleration (Optional but Recommended)

**NVIDIA GPU:**
```powershell
# Install CUDA from nvidia.com
# Ollama will auto-detect and use GPU
# Verify:
ollama show llava:7b | findstr gpu_layers
```

**AMD GPU:**
```powershell
# Install ROCm from amd.com
# Set environment variable:
[Environment]::SetEnvironmentVariable("OLLAMA_CUDA", "1")
```

---

## Quick Start Checklist

- [ ] Ollama installed
- [ ] LLaVA 7B downloaded (~10GB)
- [ ] `ollama serve` running on port 11434
- [ ] Text generation test works
- [ ] Vision analysis test works
- [ ] Ready for server integration

---

## Performance Expectations

| Operation | Time | Notes |
|-----------|------|-------|
| **First startup** | 30-60 sec | Model loads into memory |
| **Subsequent runs** | 1-3 sec | Model already loaded |
| **Drawing analysis** | 2-5 sec | Depends on drawing complexity |
| **VRAM usage** | ~8-10GB | 7B model size |
| **CPU usage** | High | While analyzing |

---

## Next Steps

Once you have Ollama running:

1. Tell me "✅ Ollama running"
2. I'll update the server to call Ollama
3. I'll create the `/analyze-drawing` endpoint
4. Client will use it for drawing recognition
5. Beautiful SDXL images will still generate as before

---

## Useful Ollama Commands

```bash
# List all models
ollama list

# Show model details
ollama show llava:7b

# Remove a model
ollama rm llava:7b

# Run interactive chat
ollama run llava:7b

# Copy/tag a model
ollama cp llava:7b llava:7b-backup
```

---

## API Documentation

### Generate Endpoint (Text)
```
POST http://localhost:11434/api/generate

{
  "model": "llava:7b",
  "prompt": "Your prompt here",
  "stream": false,
  "temperature": 0.7
}

Response: { "response": "...", "done": true, ... }
```

### Generate Endpoint (Vision)
```
POST http://localhost:11434/api/generate

{
  "model": "llava:7b",
  "prompt": "What is in this image?",
  "images": ["base64_encoded_image"],
  "stream": false
}

Response: { "response": "...", "done": true, ... }
```

---

Let me know when Ollama is running! 🚀
