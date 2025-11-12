# Server Configuration Fix — Local Models Support

**Fixed:** November 12, 2025

## What Was Changed

The server was requiring Google Cloud credentials even when not using Google Cloud services. This has been fixed to make Google Cloud optional.

### Changes Made

1. **`server/config.ts`** ✅
   - Made Google Cloud variables optional (only required when `USE_LOCAL_BACKEND=false`)
   - Added `useLocalBackend` config flag
   - Added `localModelsServiceUrl` config option
   - Added `enabled` flag to Google Cloud config
   - Updated validation to only require Google Cloud creds if using Google Cloud backend
   - Added new exports: `isLocalBackendEnabled()`, `getLocalModelsServiceUrl()`

2. **`server/app.ts`** ✅
   - Added import for local models client
   - Added imports for config functions
   - Added handler for `backend === "local"` in `/generateImage` endpoint
   - Added auto-fallback to local backend if no backend specified and local is enabled
   - Image generation now seamlessly integrates with local models service

3. **`server/.env`** ✅ (Created)
   - Set `USE_LOCAL_BACKEND=true` by default
   - Set `LOCAL_MODELS_SERVICE_URL=http://localhost:8000`
   - Google Cloud variables are commented out
   - Users can uncomment to use Google Cloud if desired

## How It Works Now

### Default Behavior (Local Models)
```env
USE_LOCAL_BACKEND=true
LOCAL_MODELS_SERVICE_URL=http://localhost:8000
```
- Server starts without needing Google Cloud credentials
- All image generation requests use local Mistral 7B + SDXL
- No API keys or quotas needed

### Optional Google Cloud Fallback
```env
USE_LOCAL_BACKEND=false
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_API_KEY=your-api-key
```
- Server validates Google Cloud credentials
- Image generation uses Gemini/Imagen/Veo

## Testing

The server should now start without errors:

```bash
cd server
npm run dev
```

Expected output:
```
✓ Using local models backend (Python service)
[ts-node-dev] watching...
Server is running on port 3000
```

## Backend Priority

The image generation now follows this priority:

1. If client sends `backend: "local"` → Use local models
2. If `USE_LOCAL_BACKEND=true` (default) → Use local models
3. If client sends `backend: "gemini"/"imagen"/"veo"` → Use Google Cloud
4. If `USE_LOCAL_BACKEND=false` → Use Google Cloud (requires credentials)

## Files Modified

```
server/
├── config.ts          ← Made Google Cloud optional
├── app.ts             ← Added local backend handler
└── .env              ← New file with local defaults
```

## No Breaking Changes

- Existing Google Cloud credentials still work
- Clients can still request specific backends
- Falls back to local models gracefully if Google Cloud not configured
