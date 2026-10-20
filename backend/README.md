# CozyNest — Your Family, Beautifully Organized 🏡✨

> **"A little space for everything that matters."**

CozyNest is a production-ready, full-stack family lifestyle and expense management web application. It combines shared household financial organization with private, individual spaces for daily scheduling, personal notes, and procedural ambient relaxation soundscapes.

Designed with a warm, minimalist pastel aesthetic (**Plus Jakarta Sans**, rounded cards, soft shadows, glassmorphism, micro-interactions), CozyNest feels like a cozy digital sanctuary for every family member—parents, teens, and children alike.

---

## 🌟 Key Highlights

- **Shared Family Finances**:
  - Log, filter, sort, and tag household expenses across 23 default categories or custom family categories.
  - Integer minor-unit financial precision (zero JavaScript floating-point errors).
  - Multi-family workspace switching and member role management (Admin vs. Member).
  - Family monthly budget targets with visual progress alerts (50%, 75%, 90%, 100%).
  - Shareable invitation codes for secure family onboarding.
- **Interactive Financial Analytics**:
  - Category breakdown donut charts with live segment filtering.
  - 6-month & 12-month spending trend graphs with current month highlighting.
  - Member contribution comparisons and budget vs. actual progress indicators.
  - Mathematically sound financial insights (highest spending category, budget velocity, month-over-month variances).
- **Strict Privacy Architecture (Owner-Only Isolation)**:
  - **Private Daily Schedule**: Visual daily timeline, categorized events, recurrence patterns, and completion toggles. Inaccessible to other family members and family admins.
  - **Private Notes**: Rich-text markdown notes with debounced autosave, color accents, pinning, tagging, and search. Inaccessible to other family members and family admins.
  - **Money Tracker (Lent & Borrowed)**: Track personal receivables and payables, maintain immutable partial repayment records, and generate one-click friendly reminder messages.
- **Persistent Reminders & Notifications**:
  - Background scheduler (60-second cycle) persisting reminders across server restarts.
  - In-app notification center with read/unread tracking and badge counts.
  - Option to convert paid bill reminders directly into family expenses without duplication.
- **Relax & Unwind Sanctuary (Procedural Audio Engine)**:
  - 100% legal, synthesized soundscapes powered directly by the **Web Audio API** (Rain, Ocean Waves, Brown/Pink Noise, Zen Bells, Wind, Cozy Fireplace, Music Box, Meditation Drone).
  - Works offline without broken external streaming links or 404 assets.
  - Floating persistent audio bar across route navigation.
  - Sleep timer (5m, 15m, 30m, 45m, 60m) with gentle fadeout.
  - Interactive multi-track ambient mixer.
- **Family Inclusivity & Personalization**:
  - Child-friendly mode toggle (simplifies navigation, enlarges touch targets, highlights schedule and relaxation).
  - Light & dark theme support with custom pastel color tokens.

---

## 🏗️ Architecture (2 Folders: Frontend & Backend)

```text
peacemaker/
├── backend/               # Express + Node.js + TypeScript (Self-contained)
│   ├── api/
│   │   └── index.ts       # Vercel serverless function entrypoint
│   ├── src/
│   │   ├── config/        # Environment and MongoDB Atlas connection
│   │   ├── controllers/   # Auth, Family, Expenses, Analytics, Money Tracker, etc.
│   │   ├── jobs/          # Persistent background reminder scheduler & DB seeder
│   │   ├── middleware/    # JWT auth, privacy scoping, rate limiter, error handling
│   │   ├── models/        # Mongoose schemas with indexes and strict validation
│   │   ├── routes/        # Versioned REST API routes (/api/v1/...)
│   │   ├── services/      # External integrations (TheMealDB, Jamendo, Wger, etc.)
│   │   ├── shared/        # Constants, schemas, types, and financial helpers
│   │   └── tests/         # Automated security, privacy, and precision tests
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json        # Backend Vercel serverless configuration
├── frontend/              # React + Vite + TypeScript (Self-contained)
│   ├── public/            # Static assets, icons, manifest
│   ├── scripts/           # Asset helper scripts (PWA icon generator)
│   ├── src/
│   │   ├── components/    # Reusable UI & features (Health, Relax, Layout, Modals)
│   │   ├── pages/         # 16+ full-featured application views
│   │   ├── services/      # Axios API client, Procedural Audio Engine
│   │   ├── shared/        # Constants, schemas, types, and financial helpers
│   │   ├── stores/        # Zustand (authStore, themeStore, audioStore)
│   │   └── styles/        # Tailwind design system & pastel theme tokens
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json        # Frontend Vercel SPA routing configuration
├── .env.example           # Environment template
├── .gitignore             # Repository gitignore
└── package.json           # Root package.json with workspaces & concurrently
```

---

## 🚀 Quickstart & Local Development

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB Atlas**: A valid MongoDB Atlas connection string (defaults to `expenseall` database)

### 1. Installation

From the repository root:

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `backend/.env`:

```bash
cp .env.example backend/.env
```

Ensure `backend/.env` has your MongoDB connection URI and secrets:

```dotenv
PORT=5005
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/expenseall?retryWrites=true&w=majority
MONGODB_DB_NAME=expenseall
JWT_SECRET=super_secret_cozynest_key_2026
SESSION_SECRET=super_secret_cozynest_session_2026
FRONTEND_URL=http://localhost:5175
COOKIE_SECURE=false

VITE_API_BASE_URL=http://localhost:5005/api/v1
VITE_APP_NAME=CozyNest
```

*(Note: If port 5000 is used by macOS AirPlay Receiver, port 5005 is configured by default).*

### 3. Database Seeding

Populate default categories and demo family data:

```bash
npm run seed
```

**Demo Account Credentials:**
- **Email:** `demo@cozynest.app`
- **Password:** `cozy123456`
- **Family:** `The Happy Home`

### 4. Running Concurrently

Run both backend and frontend concurrently with a single command:

```bash
npm run dev
```

- **Frontend**: [http://localhost:5175](http://localhost:5175)
- **Backend API**: [http://localhost:5005/api/v1](http://localhost:5005/api/v1)
- **Health Check**: [http://localhost:5005/api/health](http://localhost:5005/api/health)

---

## 🧪 Automated Testing

Run the full integration, security, and financial precision test suite:

```bash
npm run test
```

### Test Suite Coverage:
1. **Financial Minor-Unit Precision**: Verifies exact minor integer conversions without floating-point inaccuracies.
2. **Password Hashing & Authentication**: Validates bcrypt password hashing and rejection of invalid credentials.
3. **Strict Privacy Enforcement**: Ensures User A cannot access User B's private notes, daily schedule, or money tracker transactions under any circumstance.
4. **Money Tracker Repayments**: Verifies balance calculation and that recorded repayments do not mutate the original principal.
5. **Family Shared Workspace Access**: Verifies authorized members can view shared family expenses while blocking external users.

---

## ☁️ Deployment Guide

### Deploying to Vercel (Hosting Frontend & Backend Separately)

You can host both projects independently from the same GitHub repository:

#### 1. Backend Project Deployment on Vercel
1. In the Vercel Dashboard, click **Add New** > **Project** and import your repository (`peacemaker`).
2. Set **Root Directory** to `backend`.
3. In **Environment Variables**, configure:
   - `MONGODB_URI`: Your MongoDB Atlas URI
   - `MONGODB_DB_NAME`: `expenseall`
   - `JWT_SECRET`: Random 64-char string
   - `SESSION_SECRET`: Random 64-char string
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `https://<your-frontend-project>.vercel.app`
4. Click **Deploy**. Vercel will detect `backend/api/index.ts` and deploy the Express serverless API. Note your backend URL (e.g., `https://my-cozynest-backend.vercel.app`).

#### 2. Frontend Project Deployment on Vercel
1. In the Vercel Dashboard, click **Add New** > **Project** and import the same repository.
2. Set **Root Directory** to `frontend`.
3. Framework Preset will auto-detect as **Vite**.
4. In **Environment Variables**, configure:
   - `VITE_API_BASE_URL`: `https://<your-backend-project>.vercel.app/api/v1`
   - `VITE_APP_NAME`: `CozyNest`
5. Click **Deploy**. `frontend/vercel.json` automatically ensures all client-side routes (SPA) load correctly without 404s.

### Deploying to Render / Railway / Docker
For standalone containerized or Node server deployments:

```bash
# Build production bundles
npm run build

# Start backend server
npm start
```

---

## 🔒 Security & Privacy Guarantees

1. **Authentication**: Bcrypt password hashing (cost factor 10) and secure Bearer/cookie session management.
2. **Server-Side Authorization**: Every protected endpoint queries resources scoped by both user ID and family membership ID.
3. **Input Sanitization**: All request bodies validated against strict Zod schemas on both client and server.
4. **NoSQL Injection Protection**: MongoDB queries use explicit keys with parameterized parameters.
5. **Rate Limiting**: Express rate limiters protect authentication and sensitive endpoints from brute-force attempts.

---

## 📄 License

MIT License. Designed with care for families everywhere. 🌸
