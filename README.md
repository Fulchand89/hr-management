# 🏢 HR Management Portal (Monorepo)

Comprehensive Human Resource Management System (HRMS) featuring Employee Directory, Attendance Tracking (Geolocation Punch In/Out & Multi-Break), Leave Management, Role-Based Access Control, Realtime Notifications, and Analytics Dashboards.

---

## 📁 Project Architecture

```text
hr-management/
├── client/                 # Frontend Web Application (React, Vite, Tailwind/Lucide)
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── server/                 # Backend REST API Service (Node.js, Express, Sequelize/PostgreSQL)
│   ├── src/
│   ├── server.js
│   └── package.json
├── SWAGGER_API_DOCS.md     # Detailed OpenAPI & Mobile App Integration Guide
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- npm or yarn

---

### 2. Backend Setup (`server/`)
```bash
cd server
npm install

# Setup environment variables
cp .env.example .env       # Configure your DB and JWT secret in .env

# Run migrations and seed data
node migrate.js
node seed.js

# Start backend server
npm run dev
```
* **Base API URL:** `http://localhost:5000/api/v1`
* **Swagger Interactive Docs:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
* **Raw OpenAPI Specification:** [http://localhost:5000/api/docs.json](http://localhost:5000/api/docs.json)

---

### 3. Frontend Setup (`client/`)
```bash
cd client
npm install

# Start Vite development server
npm run dev
```
* **Frontend Portal:** [http://localhost:5173](http://localhost:5173)

---

## ⚡ Deployment on Vercel

### Option A: One-Click Fullstack Deployment (Recommended)
Deploy both the React frontend and Express serverless API together in **one single Vercel project**:
1. Push your latest code to GitHub:
   ```bash
   git add .
   git commit -m "fix(vercel): configure clean serverless rewrites and api endpoint"
   git push origin main
   ```
2. Go to **[vercel.com](https://vercel.com)** -> Click **Add New Project** -> Import `hr-management`.
3. In Project Settings:
   - **Root Directory**: `./` (Leave default, do **NOT** change to `client`)
   - **Framework Preset**: Other / Vite
   - **Environment Variables**: Leave `VITE_API_URL` empty (it automatically routes to `/api/v1` via Vercel rewrites).
4. Click **Deploy**.
   * Frontend SPA is built into static assets from `client/dist`.
   * Backend REST API runs as a serverless function via `api/index.js`.
   * Automatically connects to the cloud Hostinger MySQL database.

---

### Option B: Frontend on Vercel + Backend on Render / Railway / Hostinger
If you deployed only the `client/` folder on Vercel, or set Vercel Root Directory to `client`:
1. Deploy your backend on Render, Railway, or VPS.
2. In your Vercel Project Dashboard:
   - Go to **Settings** -> **Environment Variables**.
   - Add: `VITE_API_URL` = `https://your-backend-api.onrender.com/api/v1`
3. Go to **Deployments** -> Click **...** (three dots) -> **Redeploy** (Required because Vite compiles env variables into the JavaScript bundle at build time).

---

### 🔍 Troubleshooting "API server endpoint not found (404)"
If you see `API server endpoint not found (404)` on login:
1. **If using Option A (Fullstack)**: Ensure Vercel's **Root Directory** is `./` (NOT `client`), and that `VITE_API_URL` is NOT set to an unreachable external domain in Vercel environment variables.
2. **If using Option B (Separate Backend)**: Ensure `VITE_API_URL` is set in Vercel Environment Variables and you did a **Redeploy** after setting it.
3. Test your live backend health directly in your browser: `https://<your-domain>/api/v1/health` or `https://<your-backend>/api/v1/health`.

---

## 📱 Mobile & App Developer Documentation
Full OpenAPI / Swagger documentation with request bodies, schemas, and Postman import instructions is available in [SWAGGER_API_DOCS.md](./SWAGGER_API_DOCS.md).
