/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { join } from "path";
import cors from "cors";
import { md5 } from "js-md5";
import fs from "fs";
import { getServerConfig } from "./config";
import { cacheManager } from "./helpers/cache-manager";
import {
  applyRoundedCornersAndBorder,
  resizeImage,
} from "./helpers/image-processing";
import { imageToConfig, textToCommand } from "./helpers/ai-analysis";
import { generateImageWithGemini } from "./helpers/gemini-generation";
import {
  generateStaticImage,
  generateVideoAndFrames,
} from "./helpers/veo-generation";
import { generateImageWithImagen } from "./helpers/imagen-generation";
import { config } from "./helpers/ai-config-helper";
import { isLocalBackendEnabled, getLocalModelsServiceUrl } from "./config";
import { generateImageLocal, analyzeDrawingWithOllama, isOllamaAvailable } from "./helpers/local-models-client";

const { port } = getServerConfig();
const app = express();

// Error handling middleware (must have 4 parameters for Express to recognize as error handler)
const errorHandler = (err: Error, _req: Request, res: Response, _next: any) => {
  console.error("Error:", err);
  res.status(500).json({
    error: err.message || "Internal server error",
    timestamp: new Date().toISOString(),
  });
};

// Request validation middleware
const validateImageRequest = (req: Request, res: Response) => {
  if (!req.body.prompt) {
    res.status(400).json({ error: "Image data is required" });
    return false;
  }
  return true;
};

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create the 'generated' directory if it doesn't exist
fs.mkdir("generated", { recursive: true }, (err) => {
  if (err) {
    console.error("Error creating 'generated' directory:", err);
  }
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "living-canvas-server",
    timestamp: new Date().toISOString(),
  });
});

// Setup static file serving and index route
app.use(express.static("resources"));
app.use("/generated", express.static("generated"));

app.get("/test", (_req: Request, res: Response) => {
  res.send(`Hello world from real server this time! On port: ${port}`);
});

app.use(express.static("public/browser"));

app.use("/solution", express.static("solution"));
app.use("/external-assets", express.static("solution/external-assets"));
app.use("/src", express.static("solution/src"));
app.use("/shared-assets", express.static("solution/shared-assets"));

app.get("/resources/:file", async (req: Request, res: Response) => {
  try {
    const filePath = join(__dirname, "resources/", req.params.file);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Resource file not found" });
      return;
    }
    res.sendFile(filePath);
  } catch (error) {
    console.log("Error in resources", error);
    throw error;
  }
});

// Route for analysing images
app.post("/analyseImage", async (req: Request, res: Response) => {
  try {
    if (!validateImageRequest(req, res)) return;

    console.log("req body", req.body);

    const imageData = req.body.prompt || null;
    if (!imageData) {
      res.status(400).json({ error: "No image data provided" });
      return;
    }

    const trimmedData = imageData.slice(22);
    if (!trimmedData) {
      res.status(400).json({ error: "Invalid image data format" });
      return;
    }

    const response = await imageToConfig(trimmedData);
    
    console.log("response", response);

    // Check for inappropriate content in the response if safety settings are not triggered
    if (response.type && config.isInappropriateContent(response.type)) {
      return res.json(config.getSafetySettingsResponse());
    }

    res.send(response);
  } catch (error) {
    console.log("Error in analyseImage", error);
    throw new Error("Error in analyseImage");
  }
});

// New endpoint: Analyze drawing using Ollama LLaVA
app.post("/analyze-drawing", async (req: Request, res: Response) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: "No image data provided" });
    }

    console.log("Analyzing drawing with Ollama LLaVA...");

    // Check if Ollama is available
    const ollamaAvailable = await isOllamaAvailable();
    if (!ollamaAvailable) {
      console.warn("Ollama not available, returning error");
      return res.status(503).json({
        error: "Ollama service not available. Please start Ollama: 'ollama serve'",
        fallback: true,
      });
    }

    // Analyze drawing with Ollama
    const analysis = await analyzeDrawingWithOllama(imageData);

    console.log("Drawing analysis result:", analysis);

    // Check for inappropriate content
    if (config.isInappropriateContent(analysis.objectType)) {
      return res.json(config.getSafetySettingsResponse());
    }

    // Return structured analysis
    res.json({
      success: true,
      objectType: analysis.objectType,
      confidence: analysis.confidence,
      description: analysis.description,
      properties: analysis.properties,
    });
  } catch (error) {
    console.error("Error in analyze-drawing:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Error analyzing drawing",
      success: false,
    });
  }
});

// Route for checking error status
app.get("/checkError/:hash", (req: Request, res: Response) => {
  try {
    const hash = req.params.hash;
    if (!hash) {
      res.status(400).json({ error: "Hash parameter is required" });
      return;
    }

    const errorFile = join("generated", `error_${hash}.json`);

    if (fs.existsSync(errorFile)) {
      const errorData = JSON.parse(fs.readFileSync(errorFile, "utf8"));
      res.json(errorData);
    } else {
      res.status(404).send();
    }
  } catch (error) {
    console.log("Error in checkError", error);
    throw new Error("Error in checkError");
  }
});

// Route for checking frame status
app.get("/checkFrames/:hash", (req: Request, res: Response) => {
  try {
    const hash = req.params.hash;
    if (!hash) {
      res.status(400).json({ error: "Hash parameter is required" });
      return;
    }

    const framesDir = join("generated");
    const totalFrames = 4;
    let readyFrames = 0;

    for (let i = 0; i < totalFrames; i++) {
      const framePath = join(framesDir, `output_${hash}_frame${i}.png`);
      if (fs.existsSync(framePath)) {
        readyFrames++;
      }
    }

    res.json({
      ready: readyFrames === totalFrames,
      progress: readyFrames,
      total: totalFrames,
    });
  } catch (error) {
    console.log("Error in checkFrames", error);
    throw new Error("Error in checkFrames");
  }
});

app.post("/generateImage", async (req: Request, res: Response) => {
  try {
    console.log("🎨 IMAGE GENERATION ENDPOINT: Request received");

    const { prompt, imageData: inputImageData, backend, style } = req.body;

    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

		// Check for inappropriate content in the prompt
    if (config.isInappropriateContent(prompt)) {
      return res.json(config.getSafetySettingsResponse());
    }

    const objectType = prompt;
    const visualStylePrompt = style || "realistic";
    const hash = md5(objectType + visualStylePrompt + Date.now());

    console.log(`🎨 Generating image for: "${objectType}" (style: ${visualStylePrompt})`);

    const filename = `output_${hash}.png`;
    const filenameTemp = `output_${hash}_temp.png`;
    const filenameSmall = `output_${hash}_small.png`;

    const filepath = join("generated", filename);
    const filepathTemp = join("generated", filenameTemp);
    const filepathSmall = join("generated", filenameSmall);

    // Clean up any existing files
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      if (fs.existsSync(filepathTemp)) {
        fs.unlinkSync(filepathTemp);
      }
      if (fs.existsSync(filepathSmall)) {
        fs.unlinkSync(filepathSmall);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up existing files:", cleanupError);
    }
    
    if (backend === "local" || isLocalBackendEnabled()) {
      try {
        const serviceUrl = getLocalModelsServiceUrl();
        console.log(`⏳ Calling local SDXL service at: ${serviceUrl}`);
        
        const base64Image = await generateImageLocal(
          objectType,
          visualStylePrompt,
          filepath
        );

        console.log(`✅ SDXL generation complete, received ${base64Image.length} bytes`);
        
        // Save the base64 image to file
        const imageBuffer = Buffer.from(base64Image, "base64");
        fs.writeFileSync(filepath, imageBuffer);

        console.log(`⏳ Processing image (corners, border, resize)...`);
        // Process the image (rounded corners, border, resize)
        await applyRoundedCornersAndBorder(filepath, filepathTemp);
        await resizeImage(filepathTemp, filepathSmall);
        fs.copyFileSync(filepathSmall, filepath);

        const bitmap = fs.readFileSync(filepathSmall);
        const result = Buffer.from(bitmap).toString("base64");

        console.log(`✅ IMAGE GENERATION: Complete! Sending ${result.length} bytes to client`);
        res.send(result);
        return;
      } catch (error) {
        throw new Error(
          `Local model image generation failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } else if (backend === "veo") {
      try {
        const filenameOriginal = `output_${hash}_original.png`;
        const filepathOriginal = join("generated", filenameOriginal);

        const { processedImage } = await generateStaticImage(
          objectType,
          visualStylePrompt,
          filepath,
          filepathSmall,
          filepathOriginal
        );

        res.json({ hash, processedImage });

        // Start video generation in background
        generateVideoAndFrames(hash, filepathOriginal).catch((err) => {
          console.error("Error with video/frames generation:", err);
          // Create error file for frontend
          const errorFile = join("generated", `error_${hash}.json`);
          fs.writeFileSync(
            errorFile,
            JSON.stringify({
              error:
                err instanceof Error ? err.message : "Failed to generate video",
              timestamp: new Date().toISOString(),
            })
          );
        });

        fs.copyFileSync(filepathSmall, filepath);
        return;
      } catch (error) {
        throw new Error(
          `Veo image generation failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } else if (backend === "gemini") {
      await generateImageWithGemini(
        "gemini_generation",
        objectType,
        inputImageData || "",
        visualStylePrompt,
        filepath
      );
    } else if (backend === "imagen") {
      await generateImageWithImagen(
        "imagen_generation",
        objectType,
        visualStylePrompt,
        filepath
      );
    } else if (!backend) {
      // If no backend specified and local is enabled, use local
      if (isLocalBackendEnabled()) {
        try {
          const serviceUrl = getLocalModelsServiceUrl();
          console.log(`No backend specified, using local models: ${serviceUrl}`);
          
          const base64Image = await generateImageLocal(
            objectType,
            visualStylePrompt,
            filepath
          );

          const imageBuffer = Buffer.from(base64Image, "base64");
          fs.writeFileSync(filepath, imageBuffer);

          await applyRoundedCornersAndBorder(filepath, filepathTemp);
          await resizeImage(filepathTemp, filepathSmall);
          fs.copyFileSync(filepathSmall, filepath);

          const bitmap = fs.readFileSync(filepathSmall);
          const result = Buffer.from(bitmap).toString("base64");

          res.send(result);
          return;
        } catch (error) {
          throw new Error(
            `Local model image generation failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      } else {
        throw new Error("No backend specified and local backend not enabled");
      }
    } else {
      throw new Error(`Unsupported backend: ${backend}`);
    }

    if (!fs.existsSync(filepath)) {
      throw new Error(`Failed to create image file at ${filepath}`);
    }

    await applyRoundedCornersAndBorder(filepath, filepathTemp);

    if (!fs.existsSync(filepathTemp)) {
      throw new Error(`Failed to create temp image file at ${filepathTemp}`);
    }

    await resizeImage(filepathTemp, filepathSmall);

    if (!fs.existsSync(filepathSmall)) {
      throw new Error(`Failed to create small image file at ${filepathSmall}`);
    }

    fs.copyFileSync(filepathSmall, filepath);

    const bitmap = fs.readFileSync(filepathSmall);
    const result = Buffer.from(bitmap).toString("base64");
    res.send(result);
  } catch (error) {
    console.log("Error in generateImage", error);
    throw new Error("Error in generateImage");
  }
});

app.post("/textToCommand", async (req: Request, res: Response) => {
  try {
    const textCommand = req.body.command || null;
    const currentTargets = req.body.currentTargets || null;

    if (!textCommand) {
      res.status(400).json({ error: "Command text is required" });
      return;
    }

    console.log(
      "textToCommand: ",
      textCommand,
      " possible targets: ",
      currentTargets
    );

    const result = await textToCommand(textCommand, currentTargets);
    console.log(result);

    res.send(result);
  } catch (error) {
    console.log("Error in textToCommand", error);
    throw new Error("Error in textToCommand");
  }
});

// Apply error handling middleware last
app.use(errorHandler);

// Increase request timeout for image generation (can take 30+ seconds)
const server = app.listen(port, () => {
	console.log(
		`Application started and Listening on port ${port}. http://localhost:${port}/`
	);
});

// Set timeout to 5 minutes for long-running operations like image generation
server.requestTimeout = 300000; // 5 minutes in milliseconds
server.timeout = 300000; // 5 minutes
server.headersTimeout = 320000; // 5.3 minutes (must be >= requestTimeout)
