# Ollama Multimodal LLM Integration Plan

**Status:** Not Started  
**Created:** 2025-11-12

## Overview

Replace the current Mistral 7B text-only model with **Ollama's multimodal LLM** (LLaVA or Bakllava) to enable:
- Direct drawing analysis (vision understanding)
- Text generation (object descriptions, hints, narratives)
- Dynamic property inference
- Better recognition accuracy

## Why Ollama?

| Aspect | Current | Ollama Multimodal |
|--------|---------|-------------------|
| **Setup** | Complex (FastAPI + multiple models) | Simple (single `ollama run llava`) |
| **Vision** | No - uses template prompts | Yes - native image understanding |
| **Text** | Yes - Mistral 7B | Yes - same model |
| **Memory** | ~35GB (Mistral + SDXL) | ~20GB (one model) |
| **Speed** | Slow (separate services) | Faster (single service) |
| **API** | Custom HTTP wrapper | Standard Ollama API |

## Architecture

### Current Setup (To Replace)
```
Client
  ↓
Node Backend
  ├→ Python FastAPI (Mistral 7B) - text only
  └→ Python FastAPI (SDXL) - image generation
```

### New Setup (Proposed)
```
Client
  ↓
Node Backend
  ├→ Ollama (LLaVA/Bakllava) - vision + text
  └→ SDXL remains for high-quality image generation
  
OR (if we want to replace SDXL too)
  ↓
Ollama (LLaVA + image gen capability)
```

## Implementation Steps

### Phase 1: Install Ollama
```bash
# Download from ollama.ai
# Windows/Mac/Linux installer available

# Pull multimodal model
ollama pull llava  # 20GB, good balance
# OR
ollama pull bakllava  # Smaller, faster
# OR  
ollama pull minicpm-v  # Even smaller, multimodal

# Runs on port 11434 by default
```

### Phase 2: Update Python Service (Optional)
**Option A: Direct Ollama Calls** (Recommended)
- Remove `main.py` FastAPI wrapper
- Node backend calls Ollama API directly
- Simpler, fewer moving parts

**Option B: Keep Wrapper** (Current approach)
- Keep `main.py` as thin wrapper around Ollama
- Standardizes API across all services
- Better for extensibility

### Phase 3: New Endpoints

#### `/analyze-drawing` (Ollama Vision)
```
POST /analyze-drawing
Body: { image_base64: string }

Response: {
  object_type: "fire",
  confidence: 0.95,
  description: "A bright orange flame with flickering edges",
  suggested_properties: {
    burns: true,
    hot: 95,
    spreads: true
  },
  alternative_interpretations: ["candle", "torch"]
}
```

#### `/generate-hint` (Ollama Text)
```
POST /generate-hint
Body: { puzzle_description: string, objects_present: string[] }

Response: {
  hint: "Try using fire to melt the ice blocking your path",
  difficulty: "easy"
}
```

#### `/generate-narrative` (Ollama Text)
```
POST /generate-narrative  
Body: { object_type: string, visual_style: string }

Response: {
  name: "Mystical Fire Orb",
  lore: "A ancient flame that never dies...",
  interaction_text: "The fire spreads its warmth"
}
```

### Phase 4: Enhance Game Mechanics

**Dynamic Properties:**
- Fire drawn large → higher intensity
- Water drawn wavy → more fluid behavior  
- Stone drawn rough → heavier weight

**Smart Recognition:**
- "That looks like ice" vs "That's definitely ice"
- Suggest closest match if unsure
- Learn from corrections

**Contextual Hints:**
- Analyze level layout
- Suggest appropriate object types
- Generate dynamic difficulty

## Model Recommendations

### LLaVA (13B)
- **Size:** 20GB
- **Speed:** Medium
- **Quality:** Good for game
- **Best for:** Balance of capability and speed

### Bakllava (13B)  
- **Size:** 16GB
- **Speed:** Fast
- **Quality:** Good for game
- **Best for:** Faster inference, lower VRAM

### MiniCPM-V (8B)
- **Size:** 8GB
- **Speed:** Very fast
- **Quality:** Decent for game
- **Best for:** Limited VRAM, rapid prototyping

### Claude (via API) - NOT local
- **Size:** N/A (cloud)
- **Speed:** Medium
- **Quality:** Excellent
- **Best for:** If willing to use cloud for some features

## Benefits

✅ **Simpler Architecture** - One model instead of three  
✅ **Better Drawing Analysis** - Direct vision understanding  
✅ **Dynamic Content** - LLM-generated descriptions and hints  
✅ **Fewer Dependencies** - Just Ollama, no Python FastAPI needed  
✅ **Lower Resource Usage** - ~20GB instead of ~35GB  
✅ **Faster Development** - Standard Ollama API  
✅ **Offline Capable** - Fully local, zero cloud  

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Ollama crashes | Keep SDXL as fallback for images |
| Drawing recognition wrong | Include confidence score, allow user correction |
| LLM is slow | Use smaller model (MiniCPM), cache common results |
| VRAM too high | Use 7B version or quantized model |
| API format different | Abstract behind Node client wrapper |

## Timeline

- **Phase 1 (Install Ollama):** 15 minutes
- **Phase 2 (Update services):** 1-2 hours
- **Phase 3 (New endpoints):** 2-3 hours
- **Phase 4 (Enhancements):** 4-6 hours
- **Testing:** 1-2 hours

**Total:** 8-14 hours

## Next Steps

1. **Confirm approach** - Keep both (LLaVA for text, SDXL for images)?
2. **Choose model** - Which multimodal LLM?
3. **Install Ollama** - Get it running locally
4. **Test vision** - Verify it can analyze drawings
5. **Integrate** - Update Node backend to call Ollama
6. **Enhance** - Add dynamic properties and hints

---

## Code Examples

### Quick Ollama API Test
```bash
# Text generation
curl http://localhost:11434/api/generate \
  -X POST \
  -d '{
    "model": "llava",
    "prompt": "What is in this image?",
    "stream": false
  }'

# Vision analysis (LLaVA)
curl http://localhost:11434/api/generate \
  -X POST \
  -d '{
    "model": "llava",
    "prompt": "Analyze this drawing and tell me what object it depicts",
    "images": ["base64_encoded_image"],
    "stream": false
  }'
```

### Node.js Integration
```typescript
async function analyzeDrawingWithOllama(imageBase64: string) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: 'llava',
      prompt: 'What object is drawn here? Reply with just the object name.',
      images: [imageBase64],
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response; // "fire", "ice", "water", etc.
}
```

---

**Ready to proceed?** Let me know which approach you prefer and I'll implement it! 🚀
