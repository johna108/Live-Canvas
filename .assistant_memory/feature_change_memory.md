Feature change memory — place for future feature analyses and updates

Created: 2025-11-12

Purpose
- This file is a dedicated assistant memory for all future feature requests, feature analyses, and change records.
- Do NOT modify `.assistant_memory/analysis.md`. Use this file for new features and ongoing changes to those features.

Policy (how I'll use this file)
- Whenever you ask me to add a new feature or functionality, I will create a new entry in this file describing the feature, the planned changes, affected files, and a small contract (inputs/outputs, success criteria).
- If you later ask to change something for the same feature, I will update only the existing entry for that feature (preserving history) rather than creating a duplicate entry.
- For unrelated new features, I will append new entries below.
- Each entry will include a short changelog (date, what changed, who asked).

Entry template (used for each feature)
- Feature ID: <short-id>
- Name: <human-friendly name>
- Created: <ISO date>
- Status: proposed | in-progress | completed | blocked
- Description: <detailed description of the feature or change requested>
- Files touched (planned):
  - <path/to/file> — purpose
- Inputs / Outputs / Contract:
  - Inputs: <shape>
  - Outputs: <shape>
  - Errors: <expected error modes>
- Edge cases & considerations: <list>
- Dev steps I will take (brief): <list>
- Tests: <basic tests to add>
- Follow-ups / Next steps: <list>
- Change log:
  - <date> - <what changed> (assistant)

---

## Feature ID: OLLAMA_MULTIMODAL_LLM

- **Name:** Replace Mistral + SDXL with Ollama Multimodal LLM
- **Created:** 2025-11-12
- **Status:** proposed
- **Description:** Replace the current architecture (Mistral 7B for text, SDXL for images) with a single Ollama-hosted multimodal LLM (LLaVA, Bakllava, or MiniCPM-V). Benefits: single model instead of three, native vision understanding of drawings, dynamic property inference, simpler architecture, lower resource usage (~20GB vs ~35GB).

- **Files to touch (planned):**
  - server/local-models-service/main.py — Replace FastAPI wrapper or simplify to Ollama proxy
  - server/helpers/local-models-client.ts — Update to call Ollama API directly or via wrapper
  - server/app.ts — Add new endpoints: /analyze-drawing, /generate-hint, /generate-narrative
  - client/src/game/scenes/StagePuzzles.ts — Use new vision analysis endpoint
  - docker-compose.yml — Add Ollama service alongside existing stack

- **Inputs / Outputs / Contract:**
  - Input: Drawing (base64 image) + drawing context
  - Output: Object type, confidence score, suggested properties, alternative interpretations
  - New endpoint: POST /analyze-drawing → { object_type, confidence, description, properties }
  - Client sends drawing → Node calls Ollama → Returns structured recognition data
  - Error modes: Ollama unavailable, recognition confidence too low, model timeout

- **Edge cases & considerations:**
  - Ollama must be running on port 11434 (configurable)
  - Model size 8-20GB depending on choice (LLaVA, Bakllava, MiniCPM-V)
  - First load ~30-60 sec, cached after that
  - Vision quality depends on model (LLaVA better, MiniCPM faster)
  - Can fallback to template prompts if Ollama unavailable
  - User might draw ambiguous objects → need confidence + alternatives

- **Dev steps I will take (brief):**
  1. Install and test Ollama locally with chosen model
  2. Update local-models-service to proxy/wrap Ollama or remove if direct API calls
  3. Add /analyze-drawing endpoint using Ollama vision capability
  4. Add /generate-hint and /generate-narrative endpoints for game content
  5. Update client drawing analysis to use new vision endpoint
  6. Add Ollama service to docker-compose.yml
  7. Test end-to-end drawing recognition and dynamic property generation
  8. Benchmark vs current setup (speed, memory, accuracy)

- **Tests:** 
  - Draw objects → verify correct recognition
  - Test confidence scoring (clear drawing vs ambiguous)
  - Verify fallback if Ollama down
  - Performance: time from drawing to recognition
  - Generate hints for different puzzles
  - Create dynamic narratives for objects

- **Follow-ups / Next steps:**
  - Consider fine-tuning Ollama model on game-specific objects
  - Add user feedback loop (correct/incorrect recognition)
  - Generate puzzle descriptions dynamically
  - Create AI game master that adjusts difficulty
  - Extended lore generation for game world

- **Change log:**
  - 2025-11-12 - User requested Ollama integration; created detailed plan
  - Waiting for confirmation on approach and model choice before implementation

---

## Feature ID: LOCAL_LLM_MIGRATION

- **Name:** Replace Google Cloud AI with Local LLMs (Llama + SDXL + Video generation)
- **Created:** 2025-11-12
- **Status:** completed
- **Description:** User wants to replace all Google Cloud generative AI services (Gemini, Imagen, Veo) with self-hosted local models (Llama 2/3 for text, Stable Diffusion XL for images, frame-by-frame generation for video). No Google Cloud dependencies. Fully offline capable.
- **Files touched (planned):**
  - server/local-models-service/ (new) — FastAPI Python microservice for SDXL, Llama, video generation
  - server/helpers/imagen-generation.ts — replace with HTTP calls to local service
  - server/helpers/gemini-generation.ts — replace with HTTP calls to local service
  - server/helpers/veo-generation.ts — replace with HTTP calls to local service
  - server/helpers/ai-config-helper.ts — add local backend selection logic
  - server/ai-config.json — add local model configuration
  - server/app.ts — add config to select backend (google vs local)
  - .env.example (new) — local service URLs and model params
  - docker-compose.yml (new) — run Python + Node + optional cache
  - SETUP_LOCAL_MODELS.md (new) — user manual with copy-paste commands

- **Inputs / Outputs / Contract:**
  - Old contract (Google): POST /generateImage → Google Cloud APIs → file in generated/ + base64 response
  - New contract (Local): POST /generateImage → HTTP calls to FastAPI → file in generated/ + base64 response
  - Client code unchanged; server swaps backend via config flag
  - Inputs: Same as before (prompt, backend, style, imageData)
  - Outputs: Same as before (base64 image or {hash, processedImage} for video)
  - Errors: Same error handling; local service returns JSON error responses

- **Edge cases & considerations:**
  - GPU vs CPU: SDXL requires GPU for acceptable speed; CPU-only is slow. Llama can run on CPU with quantization.
  - Model downloads: First run downloads ~15–25GB of model weights; ensure disk space and patience.
  - Concurrency: SDXL generation is slow (~30–60s per image on GPU); queue system recommended for heavy load.
  - Memory: 24GB VRAM typical for SDXL; 8–16GB for Llama. Can quantize to reduce.
  - Video generation: frame-by-frame + interpolation; slow but local and reliable.

- **Dev steps I will take (brief):**
  1. Create server/local-models-service/ with FastAPI, main routes for text/image/video
  2. Add requirements.txt with diffusers, transformers, llama-cpp-python, accelerate
  3. Create Dockerfile for the Python service
  4. Modify server/helpers/*-generation.ts to use HTTP client instead of Google APIs
  5. Add ai-config.json local backend section
  6. Create docker-compose.yml
  7. Write SETUP_LOCAL_MODELS.md with manual steps (download models, set env, run docker-compose)

- **Tests:** Manual testing via curl/Postman to /text/generate, /image/generate, /video/generate endpoints once service is up.

- **Follow-ups / Next steps:**
  - Add queue system (BullMQ) if high concurrency needed
  - Add model caching layer (Redis) for common prompts
  - Add NSFW classifier for safety
  - Monitor GPU/CPU usage and add auto-scaling hints

- **Change log:**
  - 2025-11-12 - Feature requested by user; marked in-progress. Building Python service + integration layer now.
  - 2025-11-12 (completed) - Built complete local models architecture:
    - Created server/local-models-service/ with FastAPI app (main.py) providing /text/generate, /image/generate, /image/edit, /video/generate-frames endpoints
    - Added requirements.txt with diffusers, transformers, torch, etc.
    - Created Dockerfile for Python service with health checks
    - Created server/helpers/local-models-client.ts with HTTP client functions (generateImageLocal, generateTextLocal, generateVideoFramesLocal)
    - Created docker-compose.yml orchestrating both services
    - Created SETUP_LOCAL_MODELS.md with comprehensive setup guide (Docker option + Local Python option)
    - Created server/.env.example with LOCAL_MODELS_SERVICE_URL and USE_LOCAL_BACKEND flags
    - Created server/Dockerfile.local for Node dev setup
    - Added test_service.py for validating the models service
    - Ready for user to test: User can now run docker-compose up to start local pipeline
  - 2025-11-12 (documentation reorganization) - User requested consolidating all MD files to single folder and keeping memory files only for features:
    - Created docs/ folder for all documentation
    - Created docs/SETUP.md consolidating setup, prerequisites, testing, troubleshooting from scattered files
    - Created docs/API.md comprehensive API reference with all 5 endpoints, examples, parameters, performance tips
    - Deleted 10 redundant root-level files: COMPLETE_SUMMARY.txt, DELIVERY_CHECKLIST.md, DOCUMENTATION_INDEX.md, LOCAL_LLMS_SUMMARY.md, MANUAL_STEPS.md, QUICK_REFERENCE.md, README_FIRST.md, SETUP_LOCAL_MODELS.md, START_HERE_LOCAL_LLMS.md, YOU_ARE_ALL_SET.md
    - Root repository is now clean with only essential config/code files and docs/ folder
    - Memory files remain in .assistant_memory/ exclusively for feature tracking (not general docs)
  - 2025-11-12 (server config fix) - Fixed server to not require Google Cloud credentials:
    - Made Google Cloud variables optional in config.ts
    - Set USE_LOCAL_BACKEND=true as default
    - Added handler for "local" backend in app.ts
    - Created server/.env with sensible defaults
    - Server now starts successfully without credentials
