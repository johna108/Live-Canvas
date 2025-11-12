Project: solution-living-canvas — deep analysis (assistant memory)

Saved: 2025-11-11

Purpose
- Persistent analysis to help future work: architecture, key files, runtime commands, risks, and recommended next steps.

High-level overview
- **Game Concept:** Puzzle-based game where players draw on canvas to solve levels. AI recognizes drawings, generates visual representations, and creates physics-enabled game objects with properties matching the recognized object. For example: drawing "fire" → AI generates fire image → game object inherits fire properties (can melt ice when dropped on it).
- Monorepo-like layout with two main parts:
  - client/: Angular v19 application that embeds a Phaser (v3) game; game code lives in client/src/game (scenes, objects, main). Uses Angular CLI for dev and build. Handles drawing input, canvas recognition display, and game physics.
  - server/: Node + TypeScript Express server providing AI-backed image/video generation endpoints. Recognizes drawings via Gemini, generates images via Imagen/SDXL, creates video animations via Veo/frame-by-frame. Assigns physics properties based on AI recognition.
- Additional top-level material: README, license, example hosting config.

Key languages / frameworks / libs
- Client: Angular 19, TypeScript, Phaser 3, RxJS.
- Server: Node (TypeScript), Express, Google AI libs: @google/genai, @google-cloud/aiplatform, @google/cloud/vertexai, @google/generative-ai; image/video: sharp, ffmpeg-static; utilities: js-md5, dotenv, cors, body-parser.

Key Game Mechanics Implementation
- **Drawing Recognition Pipeline**: Client draws → canvas image → server analyzes via Gemini AI → identifies object type → returns properties
- **Object Property System**: Each recognized object type (fire, ice, water, wind, metal, wood, etc.) has associated properties:
  - **fire**: high temperature, flammable, melts ice, burns wood
  - **ice**: cold, slippery, can be melted by fire, solid/rigid
  - **water**: fluid, extinguishes fire, conducts electricity, freezes in cold
  - **wind**: invisible force, blows light objects, dissipates smoke
  - **stone/rock**: heavy, hard, breaks things on impact
  - **wood**: flammable, floats in water, breaks by fire/impact
- **Physics Interactions**: When game objects collide (fire touches ice, water touches fire, etc.), Phaser physics callbacks trigger appropriate responses:
  - Collision detection → property comparison → interaction function → visual/physics update
  - Example: `onCollisionFireIce(fireObject, iceObject) → iceObject.melt() → remove sprite → emit particles`
- **WorldObjectFactory** (client/src/game/objects/WorldObjectFactory.ts): Creates game objects with correct physics bodies, sprites, and interaction handlers based on AI-recognized properties
- **Puzzle Levels** (scenes like StagePuzzles, StageEarth, etc.): Fixed level layouts with pre-placed objects that can be interacted with by player-created objects

Important paths & files (quick map)
- server/app.ts — main Express app; exposes routes:
  - POST /analyseImage -> uses helpers/ai-analysis to return config from an image
  - POST /generateImage -> main image/video generation (supports backend param: veo/gemini/imagen)
  - POST /textToCommand -> uses ai-analysis.textToCommand
  - GET /checkFrames/:hash and GET /checkError/:hash -> status endpoints for async video/frame generation
  - static serving: resources, public/browser, solution/, external-assets, src/, shared-assets
- server/helpers/imagen-generation.ts — uses Vertex AI aiplatform PredictionServiceClient to generate images (imagen model). Contains generateImageBuffer and generateImageWithImagen.
- server/helpers/gemini-generation.ts — uses @google/genai (GoogleGenAI) to generate images via Gemini (chat style) and to send messages; caches results via cache-manager; responds to safety triggers and returns "__BLOCKED__" on safety.
- server/helpers/veo-generation.ts — orchestrates Veo pipeline: pulls an image from pool (uses imagen pool), pads to aspect ratio, calls GoogleGenAI.models.generateVideos to generate a short video, downloads video, extracts frames with ffmpeg, processes frames with rounded corners/border (image-processing.ts), caches frames.
- server/helpers/cache-manager.ts — central cache usage across helpers (not opened in this run but used extensively).
- server/helpers/ai-config-helper.ts and server/ai-config.json — define model IDs, prompts, safety settings, and helper functions (e.g., buildPrompt, getSafetySettings, isInappropriateContent).
- server/helpers/image-processing.ts — image utilities: applyRoundedCornersAndBorder, resizeImage (uses sharp).
- client/src/game/main.ts — Phaser Game config and scene list.
- client/src/game/objects/WorldObjectFactory.ts — Factory for creating game objects with properties based on AI recognition. Assigns collision handlers and physics bodies.
- client/src/game/objects/WorldObject.ts — Base class for game objects with properties (type, flammability, density, interaction handlers).
- client/src/game/objects/Water.ts — Special water object with fluid physics and interaction logic.
- client/src/game/scenes/StagePuzzles.ts — Main puzzle level scene; handles drawing input, AI analysis, object generation, physics interactions.
- client/src/game/scenes/StageEarth.ts, StageEarth2.ts, StageMoon.ts, StageSpace.ts — Puzzle level variations with different layouts and challenges.
- client/src/game/scenes/Boot.ts — Initial scene setup.
- client/src/game/scenes/Preloader.ts — Asset loading.

Runtime and build details
- Server package.json (server/package.json): scripts: dev (ts-node-dev), start (node dist/app.js), build (tsc). Dev recommended: run from server/ with `npm install` then `npm run dev`.
- Client package.json (client/package.json): Angular CLI scripts: start (ng serve), build (ng build). Dev: `npm install` in client/ then `npm start`.

Notable implementation details
- Multi-backend AI generation strategy: client or frontend likely chooses backend (veo/gemini/imagen). Server delegates generation to respective helpers and ensures result image saved to generated/ and small/resized versions created.
- Veo backend includes heavy video generation with polling and ffmpeg-based frame extraction. Video generation is backgrounded in generateImage route (non-blocking for the initial response).
- Caching: cache-manager is used for images and frames to avoid repeated AI calls. Cache keys include object type and visual style and a pool for imagen.
- Safety and moderation: ai-config-helper exposes safety settings and checks for inappropriate content. Gemini generation checks for finishReason === "SAFETY" and returns "__BLOCKED__".
- Several places write to generated/ and read from it; code creates generated dir at startup.

Potential risks, pitfalls, and items to validate
- Environment variables / API keys: server/helpers getGoogleCloudConfig and getServerConfig likely require projectId, location, apiKey, and other settings. Missing or misconfigured env will break AI calls. Add a .env.example.
- Native dependencies: sharp (native) may need system libs on Windows; although sharp ships prebuilt, ensure Node ABI matches. ffmpeg-static includes binaries but verify OS support.
- Node version: code uses global fetch in veo-generation to download video (`fetch(...)`). Node must be v18+ or polyfilled. Verify CI/host Node version.
- Long-running background tasks and concurrency: video generation uses polling and spawn of ffmpeg; with high concurrency you may exhaust CPU or disk. Consider queuing and rate limiting.
- Disk permissions and cleanup: generated/ can grow. No LRU or TTL present in code (cache-manager may manage it). Need disk cleanup strategy.
- Error propagation: app uses errorHandler but several catch blocks re-throw as new Error; that loses original stack in some cases. Also, some places write error files for frontend; ensure consistent error shapes.
- Safety filtering: Prompt-level checks use config.isInappropriateContent; verify it's comprehensive for both text and image inputs.
- Caching correctness: cache keys and pool logic in getOrCreateImagenPoolImage rely on consistent naming and pool size in cacheManager; ensure atomic creation to avoid races.

Recommended quick wins
- Add .env.example and document required env vars (GOOGLE_API_KEY, PROJECT_ID, LOCATION, NODE_ENV, PORT).
- Add a README/server-setup.md with explicit local run commands and Node version requirement (>=18.0.0).
- Ensure Node global fetch or add node-fetch dependency and explicit import to avoid runtime errors on older Node versions.
- Add a small cleanup/maintenance script to prune `generated/` files older than N days and a disk usage monitor.
- Add tests for helpers: a unit test for cache-manager and image-processing (mocking sharp) and basic integration test for /test, /analyseImage.

Suggested medium-term improvements
- Add a job/queue system (BullMQ or simple in-memory queue) to manage Veo/video generation workloads to avoid resource exhaustion.
- Add telemetry/monitoring around AI requests: count model calls, latency, failures, cache hit rates.
- Harden safety handling and add human review flagging for blocked items.
- Add rate limit or API key protections to public endpoints to prevent abuse.

Operational notes (how to run locally — high level)
- Server (dev):
  - cd server
  - npm install
  - create .env with required keys (see ai-config.json / config.ts for keys)
  - npm run dev
- Client (dev):
  - cd client
  - npm install
  - npm start

Game Flow (Puzzle Solving Mechanics)
1. **Player draws** on canvas in a puzzle level.
2. **Server analyzes drawing** via AI (Gemini):
   - POST /analyseImage sends canvas drawing to AI
   - AI recognizes what was drawn (e.g., "fire", "ice", "water", "wind")
   - Returns object type and properties needed
3. **Server generates visual**:
   - POST /generateImage with recognized object type
   - AI (Imagen/SDXL) creates high-fidelity image matching the object
   - Optional: Veo generates short video animation of the object
4. **Game creates physics object**:
   - Client receives generated image + properties
   - Phaser creates game object with physics body
   - Object inherits AI-recognized properties (fire → burns, ice → slippery, water → flows, etc.)
5. **Object interaction** (puzzle solving):
   - Player-created object falls/moves in the level
   - When object touches existing level objects, physics interactions occur
   - Example: Fire object touches ice block → ice melts (physics callback)
   - Example: Water touches fire → fire extinguishes
   - Example: Heavy object touches platform → breaks
6. **Level completion**: Player solves puzzle by creating correct object sequence with correct properties

Contract (for main generation endpoint)
- Input: POST /generateImage with JSON: { prompt: string, imageData?: string, backend: 'veo'|'gemini'|'imagen', style?: string, objectType: string }
- Input: POST /analyseImage with canvas image data; returns { objectType, properties: { ... } }
- Output: For image backends returns base64 string + metadata (properties). For video (Veo) returns { hash, processedImage, frames: [...] } with background frame generation. Errors returned as JSON or in error files.
- Error modes: rate limits, missing API keys, safety blocks (returns safety response), unrecognized object (returns generic), file I/O errors, ffmpeg failures.

Edge cases to consider
- Empty or malformed base64 imageData
- Backend unsupported value -> currently throws an error
- AI returns safety block -> Gemini returns "__BLOCKED__"; server checks config.isInappropriateContent for text
- Partial failures in background tasks (e.g., video generation fails) -> creates error_{hash}.json for frontend
- Cache corruption or stale cache entries

Files I considered most important
- server/app.ts
- server/helpers/{imagen-generation.ts, gemini-generation.ts, veo-generation.ts, image-processing.ts, cache-manager.ts, ai-config-helper.ts}
- client/src/game/main.ts and scene files under client/src/game/scenes
- client/package.json and server/package.json

Follow-ups I can do if you want
- Create a .env.example and a server README with explicit env var names and example values.
- Add a small health-check endpoint and a tiny disk cleanup script + npm script.
- Add a Node version check at startup and fail early with clear message.
- Run a static dependency/license audit and propose pinned versions for production.

Verification & assumptions
- I inspected key server helpers and main entries; I did not run the project. I assume cache-manager, ai-config-helper, and config.ts provide the expected env mapping and safety settings. I assume required Google credentials are not present in repo (they should not be).

Where saved
- This analysis was written to: .assistant_memory/analysis.md in the repository root.

Summary (one-liner)
- The project is a polished client/server app that integrates Phaser-based gameplay with multiple Google Generative AI backends for image and short video generation; it already has caching and moderation hooks but needs operational hardening (env docs, Node version checks, disk cleanup, queueing) before production use.

End of analysis.
