# 🚀 Production Deployment Guide for DearYou Birthday Platform

This guide provides step-by-step instructions to deploy your full-stack Birthday platform into production with a permanent, public HTTPS domain (including Google Cloud Run for `*.run.app` URLs, Render, Railway, or Vercel).

---

## 📋 1. Pre-Deployment Checklist & Environment Variables

Before deploying, ensure you have your production credentials ready.

### Environment Variables Needed

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Web server port | `3000` (or injected by host) |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dearyou?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for signing authentication tokens | Any long random string (e.g. `openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | Token validity period | `7d` |
| `GEMINI_API_KEY` | Google Gemini AI API key for wish generation | `AIzaSy...` |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary Cloud Name (from Cloudinary dashboard) | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `abCdeFgh...` |
| `CLIENT_URL` | Public production URL of your app | `https://your-app.run.app` |

> ⚠️ **Important MongoDB Atlas Network Setting:**
> In your [MongoDB Atlas Dashboard](https://cloud.mongodb.com) -> **Network Access**, ensure IP `0.0.0.0/0` (Allow Access from Anywhere) is added to the IP Access List so your cloud server can connect to the database.

---

## 🌟 2. Deployment Option A: Google Cloud Run (Recommended for `*.run.app` links)

Google Cloud Run builds and runs your container in a serverless environment and gives you a permanent Google URL like:
`https://dearyou-sfudonjdzllafgeqh4dwgv-823121863188.asia-southeast1.run.app`

### Steps:

1. **Install Google Cloud CLI (`gcloud`)** or open [Google Cloud Shell](https://shell.cloud.google.com).
2. **Login and set your project:**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_GCP_PROJECT_ID
   ```
3. **Deploy directly from your source directory:**
   Run this single command inside the `Happy-birthday` directory:
   ```bash
   gcloud run deploy dearyou-birthday \
     --source . \
     --platform managed \
     --region asia-southeast1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production,PORT=8080 \
     --set-env-vars MONGODB_URI="your_mongodb_uri" \
     --set-env-vars JWT_SECRET="your_jwt_secret" \
     --set-env-vars GEMINI_API_KEY="your_gemini_key" \
     --set-env-vars CLOUDINARY_CLOUD_NAME="your_cloud_name" \
     --set-env-vars CLOUDINARY_API_KEY="your_api_key" \
     --set-env-vars CLOUDINARY_API_SECRET="your_api_secret"
   ```
4. Cloud Run will build the multi-stage `Dockerfile`, push it to Artifact Registry, and output your live permanent HTTPS URL!

---

## 🚀 3. Deployment Option B: Render.com (Easiest Free / Low-Cost Host)

[Render](https://render.com) offers seamless Git-based deployment with automated SSL.

### Single-Service Deployment (Frontend + Backend in One Docker Container):

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "feat: prepare production deployment"
   git push origin main
   ```
2. **Open Render Dashboard:**
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repository.
3. **Configure the Web Service:**
   - **Name:** `dearyou-birthday`
   - **Region:** Singapore / Frankfurt / Oregon (nearest to your audience)
   - **Language:** **Docker** (Render will automatically detect `Dockerfile`)
   - **Branch:** `main`
   - **Instance Type:** Free or Starter ($7/mo)
4. **Add Environment Variables:**
   Under the **Environment** tab in Render, add:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `your_mongodb_uri`
   - `JWT_SECRET` = `your_jwt_secret`
   - `GEMINI_API_KEY` = `your_gemini_key`
   - `CLOUDINARY_CLOUD_NAME` = `your_cloud_name`
   - `CLOUDINARY_API_KEY` = `your_api_key`
   - `CLOUDINARY_API_SECRET` = `your_api_secret`
5. Click **Create Web Service**.
6. Render will build the frontend & backend and give you a live URL like:
   `https://dearyou-birthday.onrender.com`

---

## ⚡ 4. Deployment Option C: Railway.app

[Railway](https://railway.app) is another ultra-fast platform that automatically detects your Dockerfile.

1. Install Railway CLI or go to [railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your repository.
4. Railway will detect `Dockerfile` automatically.
5. In **Variables**, add all the environment variables from Section 1.
6. In **Settings** -> **Networking**, click **Generate Domain**.
7. Your app is immediately live with HTTPS!

---

## 🌐 5. Deployment Option D: Decoupled (Vercel Frontend + Render Backend)

If you prefer deploying the React frontend on Vercel and the Express backend on Render:

### Backend (Render):
- **Root Directory:** `server`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment Variables:** Add `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `CLOUDINARY_*`, `CLIENT_URL=https://your-frontend.vercel.app`.

### Frontend (Vercel):
- **Root Directory:** `client`
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- In `client/vite.config.ts`, update the proxy or create an environment variable `VITE_API_URL` pointing to your Render backend URL.

---

## 🛠️ 6. Local Production Build Test

You can test the exact production build locally before deploying to the cloud:

1. **Build client:**
   ```bash
   cd client
   npm run build
   cd ..
   ```
2. **Build server:**
   ```bash
   cd server
   npm run build
   ```
3. **Run in production mode:**
   ```bash
   set NODE_ENV=production
   set PORT=3000
   node dist/index.js
   ```
4. Open `http://localhost:3000` in your browser. The Express server will serve both the React client and API endpoints seamlessly without Vite dev server.

---

## 📱 7. What Happens in Production with Links & QR Codes?

Once deployed to your production domain (e.g. `https://your-app.com`):
- **Share Links:** Automatically generate as `https://your-app.com/birthday/<slug>`
- **Contributor Invites:** Automatically generate as `https://your-app.com/contribute/<token>`
- **Mobile QR Codes:** Will instantly scan and open on any mobile phone on 4G/5G anywhere in the world!
- **Tunnels (`localtunnel`/`cloudflared`):** Are automatically disabled in production mode (`NODE_ENV=production`), so your app runs directly on high-speed cloud servers.
