# WorthWhile Campus Intelligence — Production Deployment Guide

This guide details the architectural fixes and exact steps to deploy the WorthWhile project to production across Vercel (Frontend) and Render (Express + SQLite Backend).

---

## 1. Root Cause Summary of Previous 404 Errors

| Symptom | Root Cause | Implemented Solution |
| :--- | :--- | :--- |
| **404 on `/api/*` endpoints** (`/api/events`, `/api/user/profile`, etc.) | Vercel was deployed as a static-only frontend (`vite build`). Vercel does not run long-running Express servers or persistent SQLite databases out of the box. | Decoupled architecture: Frontend on Vercel connects to the Express backend via `VITE_API_URL` (or proxy rewrite). Backend updated with robust CORS, dynamic `PORT`, and health check. |
| **404 on Event Images** (`campus_tech_salon...`, `student_workshop...`, etc.) | Images were referenced in JSX using literal string paths (`/src/assets/images/...`), which only Vite dev server intercepts. In `vite build`, unreferenced raw paths are not copied to `dist/`. | Images are now imported via standard Vite ESM imports (`import img from '...'`), copied into `public/images/`, `public/src/assets/images/`, and served statically by both Vite and Express as defense-in-depth. |
| **Hardcoded Port 3000** | `server.ts` was hardcoded to `const PORT = 3000;`, causing port bind timeouts on hosting platforms like Render. | Updated `server.ts` to use `process.env.PORT` dynamically with fallback to `3000`. |
| **Missing CORS in Express** | Cross-origin requests from Vercel domain (`*.vercel.app`) to backend would be blocked by the browser. | Integrated `cors` middleware in `server.ts` supporting configured origins and `*.vercel.app`. |
| **Destructive Re-seeding Risk** | `seed.ts` contained a forced reseed flag that could wipe user data on server boot. | Guarded `seedDatabase()` against destructive table truncation in production. |

---

## 2. Step 1: Deploy Backend to Render (Free Tier Supported)

Render provides native Node.js 22 runtime and optional persistent disk storage for SQLite.

### Option A: 1-Click Blueprint (Recommended)
1. Sign in to [Render](https://dashboard.render.com/).
2. Click **New +** > **Blueprint**.
3. Select your GitHub repository: `https://github.com/gaurikadhamija/worthwhile-iiitd`.
4. Render will read `render.yaml` automatically and configure the service.
5. Click **Apply**.

### Option B: Manual Web Service Setup
1. On the Render Dashboard, click **New +** > **Web Service**.
2. Connect repository: `gaurikadhamija/worthwhile-iiitd`.
3. Configure the following fields:
   - **Name**: `worthwhile-api`
   - **Region**: Any (e.g., *Oregon (US West)* or *Frankfurt*)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. In **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `NODE_VERSION`: `22`
   - `CORS_ORIGIN`: `*` (or your Vercel URL: `https://your-app.vercel.app`)
   - `WORTHWHILE_DB_PATH`: `./data/campus_events.db`
   - `ALLOW_DEMO_IDENTITY`: `false`
   - `ALLOW_DATABASE_RESET`: `false`
5. *(Optional for long-term database persistence)*:
   Under **Disks**, add a Persistent Disk mounted at `/data`, and set `WORTHWHILE_DB_PATH` to `/data/campus_events.db`.
6. Click **Create Web Service**.
7. Once deployed, copy your backend URL (e.g. `https://worthwhile-api.onrender.com`).

---

## 3. Step 2: Configure Frontend on Vercel

1. Open your project on [Vercel](https://vercel.com/dashboard).
2. Navigate to **Settings** > **Environment Variables**.
3. Add the following variable:
   - **Key**: `VITE_API_URL`
   - **Value**: Your Render backend URL (e.g. `https://worthwhile-api.onrender.com`)
   - **Environments**: Select *Production*, *Preview*, and *Development*.
4. Click **Save**.
5. Go to the **Deployments** tab on Vercel.
6. Click the three dots `...` on the latest deployment and select **Redeploy** (ensure *Use existing Build Cache* is unchecked so Vite picks up the new environment variable).

---

## 4. Step 3: Verification Checklist

Once both services are deployed, verify every endpoint using `curl` or your browser:

### 1. Backend Health Check
```bash
curl -I https://<YOUR_RENDER_BACKEND>/api/health
```
*Expected response*: HTTP 200 with JSON payload:
```json
{
  "status": "healthy",
  "app": "WorthWhile Campus Event Discovery",
  "database": "sqlite-node-22"
}
```

### 2. Events & Recommendations APIs
```bash
curl https://<YOUR_RENDER_BACKEND>/api/events
curl https://<YOUR_RENDER_BACKEND>/api/events/recommended
curl https://<YOUR_RENDER_BACKEND>/api/notifications
```
*Expected response*: HTTP 200 with populated event records.

### 3. Static Image Delivery
Test directly in your browser:
- `https://<YOUR_VERCEL_DOMAIN>/assets/student_workshop_...jpg`
- `https://<YOUR_VERCEL_DOMAIN>/images/student_workshop_...jpg`
- `https://<YOUR_VERCEL_DOMAIN>/images/campus_tech_salon_...jpg`
- `https://<YOUR_VERCEL_DOMAIN>/images/campus_quad_arch_...jpg`
- `https://<YOUR_VERCEL_DOMAIN>/images/worthwhile_coffee_preview_...jpg`

All images will load cleanly with HTTP 200.

---

## 5. Local Development & AI Studio Preview

- In **Google AI Studio** and local development, running `npm run dev` starts the integrated Express + Vite dev server.
- The dev server mounts API routes under `/api` and serves Vite with React on port 3000 seamlessly.
