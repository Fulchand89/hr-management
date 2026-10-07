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

## 📱 Mobile & App Developer Documentation
Full OpenAPI / Swagger documentation with request bodies, schemas, and Postman import instructions is available in [SWAGGER_API_DOCS.md](./SWAGGER_API_DOCS.md).
