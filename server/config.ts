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

import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" }); // Load .env.local first
dotenv.config(); // Then load .env as fallback

interface GoogleCloudConfig {
	projectId: string;
	location: string;
	apiKey: string;
	enabled: boolean;
}

interface ServerConfig {
	port: number;
	useLocalBackend: boolean;
	localModelsServiceUrl: string;
}

interface Config {
	googleCloud: GoogleCloudConfig;
	server: ServerConfig;
}

const config: Config = {
	// Google Cloud is optional - only required if not using local models
	googleCloud: {
		projectId: process.env.GOOGLE_CLOUD_PROJECT_ID ?? "",
		location: process.env.GOOGLE_CLOUD_LOCATION ?? "",
		apiKey: process.env.GOOGLE_API_KEY ?? "",
		enabled: !!(process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_LOCATION && process.env.GOOGLE_API_KEY),
	},
	server: {
		port: parseInt(process.env.PORT ?? "3000", 10),
		useLocalBackend: process.env.USE_LOCAL_BACKEND !== "false",
		localModelsServiceUrl: process.env.LOCAL_MODELS_SERVICE_URL ?? "http://localhost:8000",
	},
};

// Validation function to ensure required environment variables are set based on backend choice
function validateConfig(): void {
	// If using local backend, no Google Cloud config needed
	if (config.server.useLocalBackend) {
		console.log("✓ Using local models backend (Python service)");
		return;
	}

	// If using Google Cloud backend, require credentials
	const requiredVars = [
		{ name: "GOOGLE_CLOUD_PROJECT_ID", value: config.googleCloud.projectId },
		{ name: "GOOGLE_CLOUD_LOCATION", value: config.googleCloud.location },
		{ name: "GOOGLE_API_KEY", value: config.googleCloud.apiKey },
	];

	const missingVars = requiredVars.filter((v) => !v.value);

	if (missingVars.length > 0) {
		throw new Error(
			`Missing required environment variables for Google Cloud backend: ${missingVars
				.map((v) => v.name)
				.join(", ")}\n\nEither provide Google Cloud credentials or set USE_LOCAL_BACKEND=true to use local models.`
		);
	}

	console.log("✓ Using Google Cloud backend");
}

// Initialize config validation
validateConfig();

export const getGoogleCloudConfig = (): GoogleCloudConfig => config.googleCloud;
export const getServerConfig = (): ServerConfig => config.server;
export const isLocalBackendEnabled = (): boolean => config.server.useLocalBackend;
export const getLocalModelsServiceUrl = (): string => config.server.localModelsServiceUrl;
export { config };
