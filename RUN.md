# 🚀 Run Karo / Run Instructions

## Quick Start (तुरंत चालू करो)

### Step 1: Install Dependencies (पहला कदम: Dependencies Install करो)
```bash
npm install
```

### Step 2: Run Development Server (Dev Server चालू करो)
```bash
npm run dev
```

✅ **Server will start at:** `http://localhost:3000/sapna/`

---

## All Available Commands (सभी Commands)

### Development Mode (Development में चलाओ)
```bash
npm run dev
```
- Opens at: `http://localhost:3000/sapna/`
- Hot reload enabled
- Best for development and testing

### Build for Production (Production के लिए Build)
```bash
npm run build
```
- Creates optimized build in `dist/` folder
- Ready for deployment

### Preview Production Build (Production Build Preview करो)
```bash
npm run preview
```
- Preview the built version locally before deployment

### Start Static Server (Static Server चालू करो)
```bash
npm start
```
- Serves the current directory

---

## Troubleshooting (अगर Problem हो तो)

### If dev server doesn't start:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### If port is already in use:
```bash
# Linux/Mac: Kill process on port 3000
kill $(lsof -t -i:3000)

# Windows: Kill process on port 3000
# First find the PID: netstat -ano | findstr :3000
# Then kill it: taskkill /PID <PID> /F

# Or use cross-platform tool (install first: npm install -g kill-port)
npx kill-port 3000

npm run dev
```

---

## Admin Login Credentials (Admin Login के लिए)

> ⚠️ **Note:** These are demo credentials for local testing only. This is a simulation/demo app.

- **Phone:** `admin` या `9999999999`
- **Password:** None needed

For production deployments, implement proper authentication and user management.

---

## API Key Setup (API Key कैसे Setup करें)

For full functionality, add your Google Gemini API key:

1. Get API key from: https://ai.google.dev
2. Set it in your environment or update the code

---

**Ready to go! बस `npm install` और `npm run dev` चलाओ!** 🎉
