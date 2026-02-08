# 🚀 Deployment Guide - GeminiChat Pro

This guide provides step-by-step instructions to deploy your WhatsApp clone with AI integration.

## 📋 Deployment Options

### Option 1: GitHub Pages (Free - Recommended for this project)

#### Live Link: `https://vk414218.github.io/sapna/`

#### Setup Instructions:

1. **Enable GitHub Pages**:
   - Go to your repository: https://github.com/vk414218/sapna
   - Click on **Settings** > **Pages** (in the left sidebar)
   - Under "Build and deployment":
     - Source: Select "GitHub Actions"
   - Click **Save**

2. **Add API Key as Secret**:
   - In your repository, go to **Settings** > **Secrets and variables** > **Actions**
   - Click **New repository secret**
   - Name: `GEMINI_API_KEY`
   - Value: Your Google Gemini API Key (get it from [ai.google.dev](https://ai.google.dev))
   - Click **Add secret**

3. **Trigger Deployment**:
   - The GitHub Actions workflow is already set up in `.github/workflows/deploy.yml`
   - Push any commit to the `main` or `master` branch, OR
   - Go to **Actions** tab and manually trigger the "Deploy to GitHub Pages" workflow

4. **Access Your Live Site**:
   - After deployment completes (2-3 minutes), visit:
   - **https://vk414218.github.io/sapna/**

---

### Option 2: Vercel (Easiest Setup)

#### Setup Instructions:

1. **Sign up at Vercel**:
   - Go to https://vercel.com
   - Sign in with your GitHub account

2. **Import Repository**:
   - Click **"Add New"** > **"Project"**
   - Select the `vk414218/sapna` repository
   - Click **Import**

3. **Configure Build Settings**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variable**:
   - In the deployment configuration page
   - Add environment variable:
     - Key: `GEMINI_API_KEY`
     - Value: Your Google Gemini API Key
   - Click **Deploy**

5. **Get Your Live Link**:
   - Vercel will provide a URL like: `https://sapna-xyz.vercel.app`
   - You can also add a custom domain

---

### Option 3: Netlify

#### Setup Instructions:

1. **Sign up at Netlify**:
   - Go to https://netlify.com
   - Sign in with your GitHub account

2. **Import Repository**:
   - Click **"Add new site"** > **"Import an existing project"**
   - Select GitHub and authorize
   - Choose the `vk414218/sapna` repository

3. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Add environment variable:
     - Key: `GEMINI_API_KEY`
     - Value: Your Google Gemini API Key

4. **Deploy**:
   - Click **"Deploy site"**
   - Netlify will provide a URL like: `https://sapna-xyz.netlify.app`

---

## 🔧 Local Development

To run the project locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:3000
```

---

## 🔑 Getting Your Gemini API Key

1. Visit https://ai.google.dev
2. Sign in with your Google account
3. Click **"Get API Key"**
4. Create a new API key or use an existing one
5. Copy the key and add it to your deployment platform's environment variables

---

## 📝 Notes

- **Admin Access**: Use phone `admin` or `9999999999` with no password
- **API Key**: The app will use the environment variable `GEMINI_API_KEY` or `API_KEY`
- **LocalStorage**: Data is stored in browser's local storage
- **Testing**: Open admin panel in one tab and user login in another tab (same browser)

---

## 🌐 Quick Deploy Commands

### For GitHub Pages:
```bash
# Ensure you're on main/master branch
git checkout main

# Push changes to trigger deployment
git push origin main

# Check deployment status at:
# https://github.com/vk414218/sapna/actions
```

---

## ✅ Deployment Checklist

- [ ] GitHub repository is set up correctly
- [ ] GitHub Pages is enabled in Settings
- [ ] API key is added as a repository secret
- [ ] GitHub Actions workflow is in place
- [ ] Build completes successfully
- [ ] Live site is accessible
- [ ] Admin and user login work correctly
- [ ] AI chat functionality works

---

## 🆘 Troubleshooting

**Build fails?**
- Check that all dependencies are in package.json
- Ensure Node version is 18 or higher

**API not working?**
- Verify the API key is correctly added as a secret/environment variable
- Check API key is valid at ai.google.dev
- Open browser console to check for errors

**404 errors on GitHub Pages?**
- Ensure GitHub Pages is set to "GitHub Actions" source
- Check that the base path is correct in vite.config.ts

---

**Need help?** Check the repository issues or create a new one!
