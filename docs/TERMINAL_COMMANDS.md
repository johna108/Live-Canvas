# Terminal Commands to Run Living Canvas

## Quick Copy-Paste Setup (Local AI - No API Keys)

### Terminal 1: Python Models Service
```powershell
cd "c:\github\live canvas\solution-living-canvas\server\local-models-service"
python main.py
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### Terminal 2: Node.js Backend Server
```powershell
cd "c:\github\live canvas\solution-living-canvas\server"
npm install  # Only needed first time
npm run dev
```

**Expected Output:**
```
[nodemon] restarting due to changes...
Server is running on port 3000
```

### Terminal 3: Angular Client
```powershell
cd "c:\github\live canvas\solution-living-canvas\client"
npm install  # Only needed first time
npm start
```

**Expected Output:**
```
✔ Compiled successfully.
Application bundle generated successfully.
Local: http://localhost:4200
```

---

## Then Open Browser

Navigate to: **http://localhost:4200**

---

## First-Time Setup (Install Dependencies)

If you're running for the first time, install dependencies in both folders:

```powershell
# Install server dependencies
cd "c:\github\live canvas\solution-living-canvas\server"
npm install

# Install client dependencies
cd "c:\github\live canvas\solution-living-canvas\client"
npm install

# Install Python models service dependencies
cd "c:\github\live canvas\solution-living-canvas\server\local-models-service"
pip install -r requirements.txt
```

---

## Verify Services Are Running

Open new terminal and test each service:

```powershell
# Test Python service
curl http://localhost:8000/health

# Test Node backend
curl http://localhost:3000/health

# Test Angular client
# Just visit http://localhost:4200 in browser
```

---

## Stop Services

Press `Ctrl + C` in each terminal to stop.

---

## If Something Goes Wrong

**Port already in use:**
```powershell
# Find and kill process on port
netstat -ano | findstr :8000  # for Python
netstat -ano | findstr :3000  # for Node
netstat -ano | findstr :4200  # for Angular
```

**Module not found error:**
```powershell
# Clear node_modules and reinstall
rm -r node_modules
npm install
```

**Python service won't start:**
```powershell
# Check Python version
python --version  # Must be 3.10+

# Reinstall requirements
pip install -r requirements.txt --upgrade
```

---

## Tips

- Keep all three terminals open while testing
- Angular auto-recompiles on file save (no restart needed)
- Node backend auto-restarts on file save (ts-node-dev)
- Python service needs manual restart if you change code

Enjoy! 🎮
