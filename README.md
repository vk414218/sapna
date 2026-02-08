
# 🚀 GeminiChat Pro - WhatsApp Clone with AI

> ⚡ **WANT TO RUN LOCALLY?** See [RUN.md](RUN.md) for quick local setup  
> ⚡ **READY TO DEPLOY?** See [QUICKSTART.md](QUICKSTART.md) for instant deployment

This project is a high-fidelity WhatsApp clone featuring real-time AI chat, an Admin Dashboard for surveillance simulations, and media sharing capabilities.

## 💻 Run Locally (Local पर चलाओ)

**Quick Start:**
```bash
npm install    # Install dependencies
npm run dev    # Start dev server at http://localhost:3000/sapna/
```

📖 **Full Instructions**: See [RUN.md](RUN.md) for detailed local setup guide

---

## 🌐 Deploy Your Own

**Live Demo**: `https://vk414218.github.io/sapna/` (after deployment)

### Quick Deploy Options:
1. **GitHub Pages** - Free hosting (See [QUICKSTART.md](QUICKSTART.md))
2. **Vercel** - Instant deployment (2 minutes)
3. **Netlify** - Drag and drop

📖 **Full Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions

---

## 🛠 Features
- **WhatsApp Web UI**: Pixel-perfect dark/light mode.
- **AI Integration**: Chat with Gemini AI built-in.
- **Admin HQ**: Monitor users, intercept messages, and request remote camera/screen access.
- **Media Support**: Voice notes, images, and simulated video calls.

---

## 🌍 How to Deploy (Step-by-Step)

### Option 1: Vercel (Recommended)
1. **Push to GitHub**: Upload all these files to a new GitHub repository.
2. **Import to Vercel**: Go to [vercel.com](https://vercel.com), click "Add New", and select your repo.
3. **Environment Variables**:
   - Go to the **Settings > Environment Variables** tab in Vercel.
   - Add a new key: `API_KEY`.
   - Value: Your Google Gemini API Key (Get it from [ai.google.dev](https://ai.google.dev)).
4. **Deploy**: Click "Deploy". Your live URL will be ready in seconds!

### Option 2: Netlify
1. Drag and drop the project folder into the Netlify dashboard.
2. Go to **Site Settings > Environment Variables**.
3. Add `API_KEY`.

---

## 🇮🇳 Deployment Kaise Kare (Hindi)

1. **GitHub par upload karein**: Saari files ko ek naye GitHub repository mein daalein.
2. **Vercel/Netlify se connect karein**: Vercel par jaa kar apna GitHub repo select karein.
3. **API Key daalein**: Vercel ki "Environment Variables" setting mein jaa kar `API_KEY` naam ka variable banayein aur apni Gemini API Key wahan paste karein.
4. **Deploy button dabayein**: Aapka link live ho jayega!

---

## 🔑 Admin Access
- **Login Phone**: `admin` or `9999999999`
- **Password**: None (Simulated authentication)

## ⚠️ Important Note
This app uses **LocalStorage** for data persistence. To test the Admin vs User interaction:
1. Open the Admin Panel in **Tab A**.
2. Open a normal User login in **Tab B** (same browser).
3. The Admin will immediately see the User's terminal active.

---
Built with ❤️ using Google Gemini API.
