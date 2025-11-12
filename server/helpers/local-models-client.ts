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

import fs from "fs";
import path from "path";
import http from "http";
import https from "https";
import { URL } from "url";

/**
 * Helper function to make HTTP POST requests
 */
async function makeRequest<T>(
  url: string,
  body: Record<string, any>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";
    const client = isHttps ? https : http;
    const bodyStr = JSON.stringify(body);

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(bodyStr),
      },
    };

    const req = client.request(urlObj, options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data) as T);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

/**
 * Helper function to make HTTP GET requests
 */
async function makeGetRequest<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";
    const client = isHttps ? https : http;

    const req = client.request(urlObj, { method: "GET" }, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data) as T);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

interface TextGenerationRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}

interface TextGenerationResponse {
  text: string;
  prompt: string;
  finish_reason: string;
}

interface ImageGenerationRequest {
  prompt: string;
  negative_prompt?: string;
  style?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  width?: number;
  height?: number;
  seed?: number;
}

interface ImageGenerationResponse {
  image_base64: string;
  prompt: string;
}

interface VideoFramesRequest {
  prompt: string;
  style?: string;
  num_frames?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
}

interface VideoFramesResponse {
  frames: string[];
  prompt: string;
}

/**
 * Generate text using local Llama/Mistral model
 */
export async function generateTextLocal(
  prompt: string,
  maxTokens: number = 256
): Promise<string> {
  try {
    const request: TextGenerationRequest = {
      prompt,
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 0.95,
    };

    const response = await fetch(`${LOCAL_MODELS_SERVICE_URL}/text/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as TextGenerationResponse;
    return data.text;
  } catch (error) {
    console.error("Error in generateTextLocal:", error);
    throw error;
  }
}

/**
 * Generate image using local SDXL model
 */
export async function generateImageLocal(
  objectType: string,
  visualStyle: string,
  filepath: string
): Promise<string> {
  try {
    // First, try to enhance the prompt using Ollama
    let enhancedPrompt = `A beautiful ${visualStyle} style image of a ${objectType}`;
    
    try {
      if (await isOllamaAvailable()) {
        const enhancePrompt = `Create a detailed visual description for generating an image of a ${objectType} in ${visualStyle} style. Be specific about details like color, texture, lighting, and composition. Keep it to 1-2 sentences.`;
        const enhanced = await generateTextWithOllama(enhancePrompt, 100);
        if (enhanced && enhanced.length > 0) {
          enhancedPrompt = enhanced.trim();
          console.log(`Enhanced prompt with Ollama: ${enhancedPrompt.substring(0, 100)}...`);
        }
      }
    } catch (error) {
      console.log(`Ollama enhancement failed, using default prompt: ${error}`);
      // Fall back to default prompt
    }

    const request: ImageGenerationRequest = {
      prompt: enhancedPrompt,
      negative_prompt: "blurry, low quality, distorted",
      style: visualStyle,
      num_inference_steps: 4,  // SDXL-Turbo: 1-4 steps (fast), overridden by server
      guidance_scale: 0.0,      // SDXL-Turbo doesn't use guidance
      width: 1024,
      height: 1024,
    };

    console.log(`⏳ SDXL-Turbo: Generating fast image with prompt: "${request.prompt.substring(0, 50)}..."`);

    const response = await fetch(`${LOCAL_MODELS_SERVICE_URL}/image/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      // SDXL-Turbo can take 60-120+ seconds on CPU (cached model ~60-90s, first run slower)
      signal: AbortSignal.timeout(999000), // 3 minutes max for safety
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ SDXL HTTP Error: ${response.status}`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as ImageGenerationResponse;
    
    console.log(`✅ SDXL: Image generated successfully (${data.image_base64.length} bytes)`);
    
    // Save image from base64
    const buffer = Buffer.from(data.image_base64, "base64");
    fs.writeFileSync(filepath, buffer);

    if (!fs.existsSync(filepath)) {
      throw new Error(`Failed to save image to ${filepath}`);
    }

    console.log(`✅ Image saved to ${filepath}`);
    return data.image_base64;
  } catch (error) {
    console.error("Error in generateImageLocal:", error);
    throw error;
  }
}

/**
 * Generate image from another image (img2img)
 */
export async function editImageLocal(
  prompt: string,
  imageBase64: string,
  filepath: string,
  strength: number = 0.8
): Promise<string> {
  try {
    // Remove data URI prefix if present
    let cleanBase64 = imageBase64;
    if (imageBase64.startsWith("data:image/")) {
      cleanBase64 = imageBase64.split(",")[1];
    }

    const request = {
      prompt,
      image_base64: cleanBase64,
      strength,
      num_inference_steps: 20,
      guidance_scale: 7.5,
    };

    console.log(`Editing image with prompt: ${prompt.substring(0, 50)}...`);

    const response = await fetch(`${LOCAL_MODELS_SERVICE_URL}/image/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as ImageGenerationResponse;
    
    // Save image
    const buffer = Buffer.from(data.image_base64, "base64");
    fs.writeFileSync(filepath, buffer);

    console.log(`Saved edited image to ${filepath}`);
    return filepath;
  } catch (error) {
    console.error("Error in editImageLocal:", error);
    throw error;
  }
}

/**
 * Generate video frames using local SDXL
 */
export async function generateVideoFramesLocal(
  objectType: string,
  visualStyle: string,
  hash: string,
  outputDir: string = "generated"
): Promise<void> {
  try {
    const request: VideoFramesRequest = {
      prompt: `A beautiful ${visualStyle} style short animation of a ${objectType}, gently moving or floating in place`,
      style: visualStyle,
      num_frames: 4,
      num_inference_steps: 25,
      guidance_scale: 7.5,
    };

    console.log(`Generating ${request.num_frames} frames for ${objectType}...`);

    const response = await fetch(`${LOCAL_MODELS_SERVICE_URL}/video/generate-frames`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as VideoFramesResponse;

    // Save frames
    for (let i = 0; i < data.frames.length; i++) {
      const framePath = path.join(outputDir, `output_${hash}_frame${i}.png`);
      const buffer = Buffer.from(data.frames[i], "base64");
      fs.writeFileSync(framePath, buffer);
      console.log(`Saved frame ${i} to ${framePath}`);
    }

    console.log(`Generated ${data.frames.length} frames successfully`);
  } catch (error) {
    console.error("Error in generateVideoFramesLocal:", error);
    throw error;
  }
}

/**
 * Check if local service is available
 */
export async function isLocalServiceAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${LOCAL_MODELS_SERVICE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get service health info
 */
export async function getLocalServiceHealth(): Promise<any> {
  try {
    const response = await fetch(`${LOCAL_MODELS_SERVICE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error getting service health:", error);
    throw error;
  }
}

/**
 * ===== OLLAMA INTEGRATION =====
 * Direct integration with Ollama for vision and text analysis
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || "llava:7b";
const OLLAMA_TEXT_MODEL = process.env.OLLAMA_TEXT_MODEL || "llava:7b";
const LOCAL_MODELS_SERVICE_URL = process.env.LOCAL_MODELS_SERVICE_URL || "http://localhost:8000";

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  images?: string[];
  stream: boolean;
  temperature?: number;
  top_p?: number;
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
}

/**
 * Analyze a drawing using Ollama LLaVA vision
 * Returns recognized object type and properties
 */
export async function analyzeDrawingWithOllama(
  imageBase64: string
): Promise<{
  objectType: string;
  confidence: number;
  description: string;
  properties: Record<string, any>;
}> {
  try {
    // Remove data URI prefix if present
    let cleanBase64 = imageBase64;
    if (imageBase64.startsWith("data:image/")) {
      cleanBase64 = imageBase64.split(",")[1];
    }

    const analysisPrompt = `You are a game object recognition system. Analyze this drawing and identify what object it depicts.

IMPORTANT: Reply in this EXACT format:
OBJECT: [name]
CONFIDENCE: [0.0-1.0]
DESCRIPTION: [brief description]
PROPERTIES: [comma-separated property words like: hot, cold, heavy, light, flammable, metallic, fluid, etc.]

Only use one line for each field.`;

    const request: OllamaGenerateRequest = {
      model: OLLAMA_VISION_MODEL,
      prompt: analysisPrompt,
      images: [cleanBase64],
      stream: false,
      temperature: 0.3, // Lower temperature for consistent object identification
    };

    console.log("Analyzing drawing with Ollama LLaVA...");

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as OllamaGenerateResponse;
    const responseText = data.response;

    // Parse the structured response
    const objectMatch = responseText.match(/OBJECT:\s*(.+?)(?:\n|$)/i);
    const confidenceMatch = responseText.match(
      /CONFIDENCE:\s*([\d.]+)(?:\n|$)/i
    );
    const descriptionMatch = responseText.match(
      /DESCRIPTION:\s*(.+?)(?:\n|$)/i
    );
    const propertiesMatch = responseText.match(
      /PROPERTIES:\s*(.+?)(?:\n|$)/i
    );

    const objectType = objectMatch
      ? objectMatch[1].trim().toLowerCase()
      : "unknown";
    const confidence = confidenceMatch
      ? Math.min(1, Math.max(0, parseFloat(confidenceMatch[1])))
      : 0.5;
    const description = descriptionMatch ? descriptionMatch[1].trim() : objectType;
    const propertiesStr = propertiesMatch ? propertiesMatch[1].trim() : "";

    // Convert property words to object properties
    const properties = parsePropertiesFromString(
      objectType,
      propertiesStr,
      confidence
    );

    console.log(`Drawing recognized as: ${objectType} (confidence: ${confidence})`);

    return {
      objectType,
      confidence,
      description,
      properties,
    };
  } catch (error) {
    console.error("Error analyzing drawing with Ollama:", error);
    throw error;
  }
}

/**
 * Generate text using Ollama
 */
export async function generateTextWithOllama(
  prompt: string,
  maxTokens: number = 256
): Promise<string> {
  try {
    const request: OllamaGenerateRequest = {
      model: OLLAMA_TEXT_MODEL,
      prompt,
      stream: false,
      temperature: 0.7,
    };

    console.log("Generating text with Ollama...");

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as OllamaGenerateResponse;
    return data.response;
  } catch (error) {
    console.error("Error generating text with Ollama:", error);
    throw error;
  }
}

/**
 * Check if Ollama is available
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get Ollama service health
 */
export async function getOllamaHealth(): Promise<any> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = (await response.json()) as any;
    return {
      status: "ok",
      models: data.models || [],
      url: OLLAMA_BASE_URL,
    };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      url: OLLAMA_BASE_URL,
    };
  }
}

/**
 * Helper function to convert property words to game object properties
 */
function parsePropertiesFromString(
  objectType: string,
  propertiesStr: string,
  confidence: number
): Record<string, any> {
  const properties = {
    floats: false,
    hovers: false,
    falls: true,
    drips: false,
    douses: false,
    solid: true,
    heavy: false,
    burns: false,
    explodes: false,
    flies: false,
    wooden: false,
    metal: false,
    ice: false,
    blows: false,
  };

  const words = propertiesStr.toLowerCase().split(",").map((w) => w.trim());

  // Map recognized words to properties
  words.forEach((word) => {
    switch (word) {
      case "hot":
      case "fire":
      case "burn":
      case "flammable":
        properties.burns = true;
        break;
      case "cold":
      case "frozen":
      case "ice":
        properties.ice = true;
        break;
      case "heavy":
      case "dense":
      case "dense":
        properties.heavy = true;
        break;
      case "light":
      case "floats":
      case "buoyant":
        properties.floats = true;
        properties.heavy = false;
        properties.falls = false;
        break;
      case "fluid":
      case "flows":
      case "water":
        properties.drips = true;
        properties.douses = true;
        break;
      case "metal":
      case "metallic":
        properties.metal = true;
        properties.heavy = true;
        break;
      case "wood":
      case "wooden":
        properties.wooden = true;
        break;
      case "wind":
      case "air":
      case "blows":
        properties.blows = true;
        properties.solid = false;
        break;
      case "explosion":
      case "explosive":
        properties.explodes = true;
        break;
      case "flying":
      case "flies":
        properties.flies = true;
        properties.falls = false;
        break;
    }
  });

  // Type-specific overrides based on object recognition
  if (objectType === "fire") {
    properties.burns = true;
    properties.solid = true;  // Fire needs physics to fall with gravity
    properties.falls = true;  // Fire falls due to gravity
  } else if (objectType === "candle") {
    properties.burns = true;  // Candles produce fire/light
    properties.solid = true;
    properties.falls = true;
  } else if (objectType === "flame") {
    properties.burns = true;  // Flames are fire
    properties.solid = true;
    properties.falls = true;
  } else if (objectType === "ice") {
    properties.ice = true;
  } else if (objectType === "water") {
    properties.drips = true;
    properties.douses = true;
    properties.falls = true;  // Water falls due to gravity
  } else if (objectType === "wind") {
    properties.blows = true;
    properties.solid = false;
    properties.falls = false;  // Wind doesn't fall
  }

  return properties;
}
