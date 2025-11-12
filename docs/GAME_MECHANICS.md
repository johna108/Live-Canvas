# Living Canvas — Game Mechanics Guide

## Overview

**Living Canvas** is an AI-powered puzzle game where players solve levels by drawing objects. The AI recognizes drawings, generates realistic images, and creates physics-enabled game objects that interact based on their physical properties.

**Core Loop:**
1. **Draw** an object on the canvas
2. **AI recognizes** what you drew (fire, ice, water, etc.)
3. **Server generates** a high-fidelity image of that object
4. **Game creates** a physics object with real-world properties
5. **Interact** with level objects to solve the puzzle

## How It Works

### Step 1: Drawing Recognition

When you draw on the canvas:
- Your drawing is sent to the server as an image
- Gemini AI analyzes the drawing to recognize the object type
- Server returns the recognized type and its properties

**Example:**
```
User draws: ~~~> (wavy lines)
AI recognizes: Water
Properties: { fluid: true, temperature: 0°C, conducts electricity, can freeze }
```

### Step 2: Image Generation

Once recognized, the server generates a realistic image:
- **Imagen/SDXL:** Creates high-fidelity static image (2-5 seconds)
- **Veo:** Creates short video animation (10-30 seconds for a few frames)
- Image is cached to avoid regenerating the same objects

**Result:** Beautiful, realistic rendering of the object

### Step 3: Physics Object Creation

The game creates a Phaser physics object with:
- The generated image as the sprite
- A physics body matching the object's shape/density
- Collision handlers for interactions with level objects
- Animation system for the generated video (if available)

### Step 4: Interactions

When your created object collides with existing level objects:
- **Fire + Ice** → Ice melts, disappears, emits particles
- **Water + Fire** → Fire extinguishes
- **Heavy Rock + Platform** → Platform breaks
- **Wind + Light Object** → Object is blown away
- **Metal + Electricity** → Conduct and spread damage

## Object Types & Properties

### Fire 🔥
- **Properties:** Hot, flammable, rises upward
- **Can melt:** Ice, snow, wax
- **Can burn:** Wood, paper, fabric
- **Interaction:** Extinguished by water

### Ice ❄️
- **Properties:** Cold, slippery, brittle
- **Can freeze:** Water into solid ice
- **Interaction:** Melts from fire or heat
- **Effect:** Reduces friction (object slides)

### Water 💧
- **Properties:** Fluid, flows downward, conductive
- **Can conduct:** Electricity through liquid
- **Can freeze:** Into ice in cold temperatures
- **Can extinguish:** Fire
- **Effect:** Dissolves some materials

### Wind 💨
- **Properties:** Invisible force, pushes objects
- **Can blow:** Light objects (feathers, paper, sand)
- **Can dissipate:** Smoke, gas
- **Effect:** Applies directional force

### Stone/Rock 🪨
- **Properties:** Heavy, hard, dense
- **Can break:** Fragile objects on impact
- **Can crush:** Lighter materials
- **Effect:** Applies downward force

### Wood 🪵
- **Properties:** Light, buoyant, combustible
- **Can float:** In water
- **Can burn:** From fire
- **Can break:** Under heavy impacts
- **Effect:** Absorbs impact energy

### Metal ⚙️
- **Properties:** Dense, hard, conductive
- **Can conduct:** Electricity
- **Can rust:** In water/moisture
- **Effect:** Indestructible to most forces

## Level Design

Each puzzle level has:
- **Fixed objects** already placed (platforms, targets, obstacles)
- **Challenge:** Use the right sequence of drawn objects to complete the goal
- **Goal examples:**
  - Melt ice blocking a path (draw fire)
  - Break wooden structure (draw something heavy or fire)
  - Conduct electricity to activate a device (draw metal bridge)
  - Light a dark area (draw fire or sun)

## Tips for Solving Puzzles

### Analyze the Level
- What objects are already placed?
- What properties would affect them?
- What's the goal (reach, light, activate, etc.)?

### Experiment with Objects
- Try different drawings to see what's recognized
- Some objects might not work if unclear
- Watch how recognized objects interact with level elements

### Use Physics
- Heavy objects fall and apply force
- Light objects float on water
- Fire rises and spreads heat
- Wind applies directional force

### Common Strategies
- **Melting:** Draw fire on ice
- **Breaking:** Draw heavy object (rock) above wooden structure
- **Conducting:** Draw metal to connect electricity
- **Fluid Flow:** Use water to carry light objects

## Technical Details

### Drawing Recognition Accuracy

The AI recognizes drawings based on:
- **Visual features:** Shape, size, proportions
- **Context:** Where it's placed in the level
- **Clarity:** More distinct drawings → better recognition
- **Style:** Sketchy, cartoon, realistic all work

**Tips for clear drawings:**
- Draw larger shapes (fills more canvas)
- Use simple, recognizable shapes
- Think about the object's basic form
- Avoid mixing multiple objects in one drawing

### Generation Speed

- **Image generation:** 2-5 seconds (already cached models)
- **First image of a type:** Longer on first use (model loading)
- **Video generation:** 10-30 seconds (generates multiple frames)

### Quality Settings

The game supports different visual styles:
- **Realistic:** Detailed, photorealistic rendering
- **Cartoon:** Stylized, vibrant appearance
- **Pixelated:** Retro, low-resolution style

Choose based on your preference or puzzle aesthetic.

## Advanced Mechanics (for future levels)

### Chaining Reactions
Multiple objects create cascading effects:
```
Water → flows down → hits ice → ice melts → water continues → extinguishes fire
```

### Compound Objects
Some puzzles might allow:
- Multiple simultaneous objects
- Stacking for weight/pressure
- Layering for visual effects

### Environmental Effects
- Temperature affects water → freezes in cold, boils in heat
- Humidity affects fire → burns easier in dry, extinguishes in wet
- Time-based effects → objects change over time

## Troubleshooting

**Drawing not recognized?**
- Try drawing more clearly with distinct shapes
- Make sure it's recognizable (clear outline)
- Check if the object is common (animals, nature, tools work better)

**Physics not working as expected?**
- Object properties depend on correct AI recognition
- Unclear drawings → generic properties
- Ensure the recognized type matches what you intended

**Level too hard?**
- Analyze what objects already exist in the level
- Think about what their properties are
- Try drawing objects that would interact with them

## Next Steps

Try a puzzle level and start drawing! The game guides you through the first few levels with hints about what objects to create.

Have fun solving puzzles with AI! 🎮✨
