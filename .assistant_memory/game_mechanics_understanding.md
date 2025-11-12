# Understanding: Living Canvas Game Mechanics

**Updated:** 2025-11-12

## What I Now Understand

Living Canvas is **not just a generative AI demo** — it's a **physics-based puzzle game** where:

### Core Gameplay Loop

1. **Player draws** an object on the canvas (fire, ice, water, rock, etc.)
2. **AI recognizes** the drawing via Gemini
3. **Server generates** a realistic image/animation of that object
4. **Game instantiates** a physics-enabled game object with properties matching the recognized type
5. **Physics interactions** occur when the created object touches existing level objects

### The Key Innovation: Property-Driven Interactions

Each object type has **real-world properties** that determine interactions:

- **Fire 🔥** melts ice, burns wood, rises upward
- **Ice ❄️** is slippery, can be melted, freezes water
- **Water 💧** extinguishes fire, is conductive, flows downward
- **Stone 🪨** is heavy, breaks things on impact
- **Wind 💨** applies directional force to light objects
- **Wood 🪵** floats in water, burns from fire, breaks under impact
- **Metal ⚙️** is conductive, indestructible, conducts electricity

### Puzzle Solving

Each level contains **fixed objects** (platforms, walls, targets, obstacles) that the player must interact with using the **right sequence of drawn objects**.

**Examples:**
- "Melt the ice blocking the path" → Draw fire → Fire melts ice → Path opens
- "Break the wooden structure" → Draw a heavy rock → Rock falls and breaks wood
- "Activate the electrical device" → Draw a metal bridge → Metal conducts electricity
- "Light up a dark area" → Draw fire/sun to illuminate the space

### Technical Implementation

**Client Side (Phaser 3 Game Engine):**
- Handles drawing input and canvas capture
- Creates physics bodies with collision detection
- Implements interaction callbacks (fire+ice → melt, water+fire → extinguish, etc.)
- `WorldObjectFactory` creates game objects with correct properties
- `WorldObject` base class defines interaction handlers

**Server Side (Node.js Express):**
- `/analyseImage` — Sends drawing to Gemini, gets object type + properties
- `/generateImage` — Generates image via Imagen/SDXL or video via Veo
- Returns image data + metadata for the client to create the physics object

**Game Scenes:**
- `StagePuzzles` — Main puzzle level with drawing input and interaction logic
- `StageEarth`, `StageMoon`, `StageSpace`, etc. — Level variations with different challenges
- Each scene pre-defines existing objects and their properties

### Why AI is Critical

1. **Recognition accuracy** → determines if correct object is created
2. **Generation quality** → realism makes interactions feel natural
3. **Property assignment** → AI-inferred properties drive puzzle solutions

## Files Most Important for Game Mechanics

**Client (Game Logic):**
- `client/src/game/objects/WorldObject.ts` — Base object class with properties
- `client/src/game/objects/WorldObjectFactory.ts` — Creates objects with correct properties + collision handlers
- `client/src/game/objects/Water.ts` — Special fluid physics for water
- `client/src/game/scenes/StagePuzzles.ts` — Main puzzle logic: drawing input → recognition → object creation → interaction handling
- `client/src/game/main.ts` — Game configuration and scene management

**Server (AI Pipeline):**
- `server/app.ts` routes:
  - `POST /analyseImage` → identifies object from drawing
  - `POST /generateImage` → creates realistic visual
- `server/helpers/ai-analysis.ts` — Gemini integration for recognition
- `server/helpers/imagen-generation.ts`, `veo-generation.ts` — Visual generation

## What This Means for Development

**When adding new features:**
1. Define the new object type and its **properties** (flammability, density, conductivity, etc.)
2. Add **collision handler** in WorldObject or WorldObjectFactory
3. Ensure **AI prompts** guide recognition and generation correctly
4. Test **physics interactions** between object pairs

**Example: Adding "Snow"**
1. Update AI config with snow properties: cold, accumulates, melts from heat
2. Create collision handler: `onCollisionSnowFire() → snow melts like ice`
3. Test recognition: draw snow → AI recognizes → game creates snow object
4. Verify interaction: snow + fire → melts and disappears

## Memory Updated

- `.assistant_memory/analysis.md` now includes:
  - Game concept and core loop
  - Property-based interaction system
  - Game mechanics implementation details
  - Updated file importance map

## Documentation Created

- `docs/GAME_MECHANICS.md` — Complete player/developer guide to:
  - How the game works (step-by-step)
  - Object types and their properties
  - Interaction examples
  - Puzzle-solving strategies
  - Technical details (recognition accuracy, generation speed)
  - Troubleshooting

---

**I now understand Living Canvas is a sophisticated interactive physics game where AI-generated objects with real-world properties are used to solve environmental puzzles. It's far more than a demo — it's a complete game system.** 🎮
