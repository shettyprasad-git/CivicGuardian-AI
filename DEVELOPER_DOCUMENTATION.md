# CivicGuardian AI — Developer Documentation

Welcome to the **CivicGuardian AI** developer documentation. This document is a comprehensive technical guide detailing the architecture, stack, state management, database schemas, APIs, and development workflows of the application.

---

## 1. System Architecture & Overview

**CivicGuardian AI** is a modern, full-stack, intelligent civic issue tracking and reporting platform. It allows citizens to report local infrastructure issues (like potholes, broken streetlights, or waste pileups), get them instantly analyzed and prioritized by AI, and track their lifecycle from reporting to resolution.

```
                  ┌───────────────────────────────┐
                  │          React Client         │
                  │   (Vite, Tailwind, Leaflet)   │
                  └───────────────┬───────────────┘
                                  │
                    HTTPS Requests│Proxy APIs
                                  ▼
                  ┌───────────────────────────────┐
                  │         Express Server        │
                  │        (server.ts / Node)     │
                  └───────┬───────────────┬───────┘
                          │               │
            Firestore SDK │               │ Gemini SDK
                          ▼               ▼
         ┌───────────────────┐     ┌───────────────┐
         │ Firebase Database │     │ Google Gemini │
         │   (Cloud Storage) │     │     Flash     │
         └───────────────────┘     └───────────────┘
```

### Core Architecture Components:
1. **Frontend**: Client-side single-page application built using **React 19**, **Vite 8**, and **React Router v7**. Rendered layouts and controls are styled with **Tailwind CSS v4** (utilizing a high-contrast Neo-Brutalist design aesthetic).
2. **Backend**: An **Express** (v5) application serving as a server-side API proxy. This isolates the Gemini LLM credentials and processes resource-heavy analytics/image analysis in a secure context.
3. **Database & Auth**: Powered by **Firebase Firestore** and **Firebase Authentication** for persistent real-time cloud data, cross-device syncing, and secure user profiles.
4. **Interactive Mapping**: **Leaflet** coupled with **React Leaflet** using **OpenStreetMap** tile layers. Completely decoupled from Google Maps with no API billing or keys required.

---

## 2. Technology Stack & Dependencies

Here is a catalog of the primary dependencies used in CivicGuardian AI:

### Frontend
- **React (v19.2)** & **React DOM**: Component-based user interface rendering engine.
- **Vite (v8.1)**: Blazing-fast bundler and development server.
- **Tailwind CSS (v4.3)**: Inline-utility classes with modern CSS variables.
- **React Router DOM (v7.18)**: Robust client-side routing.
- **Leaflet (v1.9)** & **React Leaflet (v5.0)**: Smooth, API-key-free interactive map rendering.
- **Motion (v12.4)**: Custom transition animations and interactive micro-states.
- **Lucide React (v1.21)**: Extensive, clean visual icon system.
- **Recharts (v3.9)**: Declarative, highly-polished analytics charts.
- **clsx** & **tailwind-merge**: Seamless dynamic Tailwind class resolution.

### Backend & AI
- **Express (v5.2)**: Lightweight server-side route handler.
- **@google/genai (v2.10)**: Official, modern Google SDK for interfacing with Gemini models.
- **esbuild**: Handles bundling and compilation of the TypeScript backend into production-optimized CJS format.
- **tsx**: Executable execution model for running backend TypeScript files in real-time.
- **dotenv**: Environment variable injection.

### Persistence
- **Firebase (v12.15)**: Integrated cloud-database solutions including Firestore and Google/Anonymous Authentication.

---

## 3. Directory Layout

The directory layout of the repository conforms to highly modular React guidelines:

```
├── .env.example                # Blueprint for required secrets (GEMINI_API_KEY)
├── DEVELOPER_DOCUMENTATION.md  # (This file) Complete technical documentation
├── package.json                # Dependencies, scripts, and build system configurations
├── server.ts                   # Backend Express entry point & Gemini API proxy routes
├── vite.config.ts              # Configuration for Vite and Tailwind integration
├── src
│   ├── App.tsx                 # Main client application router & setup
│   ├── firebase.ts             # Firebase Auth, Firestore, and Analytics initialization
│   ├── index.css               # Global stylesheets importing Tailwind CSS v4 and Google Fonts
│   ├── main.tsx                # React virtual DOM entry point
│   ├── types.ts                # Shared TypeScript contracts and interfaces
│   ├── components
│   │   ├── ui                  # Atomic UI elements
│   │   │   ├── Badge.tsx       # Custom pill tag styled with border borders
│   │   │   ├── Button.tsx      # Responsive button variations
│   │   │   └── Card.tsx        # Framed container styled with shadow accents
│   │   ├── AIRecommendations.tsx # Dashboard AI prediction section
│   │   ├── Chatbot.tsx         # Overlay interactive civic guide chatbot
│   │   ├── ConfirmDialog.tsx   # Customizable confirmation modal
│   │   ├── HighlightText.tsx   # Real-time search terms highlighting utility
│   │   ├── Layout.tsx          # Master navigation panel and shell layout
│   │   └── StatusTimeline.tsx  # Dynamic interactive status tracker line
│   ├── context
│   │   └── ReportsContext.tsx  # React Context facilitating report sharing, syncing & guest storage
│   ├── pages
│   │   ├── Analytics.tsx       # AI Insights page with charting and predictive trend charts
│   │   ├── Dashboard.tsx       # Live feed displaying, searching, filtering, and upvoting reports
│   │   ├── Home.tsx            # Application landing page showcasing core platform features
│   │   ├── Login.tsx           # Authentication page for credentials & guest entries
│   │   ├── MapView.tsx         # Leaflet-based geolocated map of all city reports
│   │   └── ReportIssue.tsx     # Smart multi-step issue reporter with live AI analysis
│   ├── services
│   │   ├── db.ts               # Core database utilities
│   │   └── ReportService.ts    # Unified Firestore / LocalStorage API wrapper for reports
│   └── utils
│       ├── device.ts           # Unique hardware/anonymous browser fingerprinting generator
│       ├── distance.ts         # Haversine-based geographic coordinate distance calculators
│       └── geocoding.ts        # Coordinates-to-address geocoding logic
```

---

## 4. Key Data Contracts (`/src/types.ts`)

The application enforces strong type safety. Below are the key data interfaces:

### Report Interface
```typescript
export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
export type IssueStatus = 'Reported' | 'AI Verified' | 'Community Verified' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';

export interface Locality {
  area: string;
  city: string;
  state: string;
  country: string;
  formatted: string;
}

export interface Report {
  id: string;
  reportId?: string; // Human-readable ID, e.g., "CG-2026-0001"
  userId: string;
  userName: string;
  userPhoto?: string;
  category: string;
  severity: Severity;
  status: IssueStatus;
  suggestedDepartment: string;
  suggestedPriority: string;
  summary: string;
  description: string;
  impact: string;
  action: string;
  location: { lat: number; lng: number };
  locality?: Locality;
  imageUrl: string;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  votes: number;
  upvotedBy?: string[]; // Array of voter/device IDs to prevent duplicate votes
  aiConfidence?: number;
  priorityScore?: number;
  reasoning?: string;
}
```

---

## 5. Backend API Endpoints (`/server.ts`)

The Express backend serves as a secure bridge between the user and Google's Gemini models. It exposes three primary endpoints:

### 1. `POST /api/analyze-issue`
Analyzes an uploaded civic issue image to automatically categorize, evaluate severity, and generate structured metadata.
- **Request Body**: `{ imageBase64: "data:image/jpeg;base64,..." }`
- **Model Used**: `gemini-2.5-flash` with JSON output formatting config.
- **Response Schema**:
  ```json
  {
    "category": "Pothole",
    "severity": "High",
    "priorityScore": 7.5,
    "confidence": 92,
    "description": "Deep asphalt failure on main lane...",
    "department": "Roads & Transportation",
    "estimatedResolutionTime": "3-5 Business Days",
    "recommendedAction": "Immediate barricade placement...",
    "reasoning": "Located on major arterial road with elevated collision risk.",
    "factors": { "roadSafetyRisk": 8, "trafficImpact": 7, "communityImpact": 6, "issueSize": 5, "waterDamage": 2, "locationImportance": 8 }
  }
  ```

### 2. `POST /api/chat`
Serves the CivicGuardian AI Chatbot, allowing users to ask natural language questions about civic issues, regulations, or reporting.
- **Request Body**: `{ messages: [{ role: "user", text: "..." }] }`
- **Model Used**: `gemini-2.5-flash`
- **Grounding**: Features Google Search tool integrations (`tools: [{ googleSearch: {} }]`) to answer questions with real-time local intelligence.

### 3. `POST /api/analyze-trends`
Aggregates active city reports and provides predictive heatmaps and departmental directives.
- **Request Body**: `{ reports: [...] }`
- **Model Used**: `gemini-2.5-flash` with JSON output formatting config.
- **Response Schema**:
  ```json
  {
    "mostAffectedLocality": "District 7",
    "trendingIssue": "Garbage Collection",
    "departmentsNeedingAttention": ["Sanitation", "Water Works"],
    "predictedFutureHotspot": "Main Avenue Overpass",
    "recommendations": ["Optimize route patterns", "Deploy mobile response units"]
  }
  ```

---

## 6. Frontend Core Integrations

### Leaflet Map (`/src/pages/MapView.tsx`)
The previous Google Maps SDK dependency has been completely stripped and replaced with **Leaflet** + **React Leaflet** using OpenStreetMap tiles.
- **Tile URL**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Features**:
  1. **Geolocated Center**: Accesses the HTML5 browser Geolocation API to highlight the user's active coordinate.
  2. **Auto-fit Bounds**: Uses a nested `<MapController>` leveraging the Leaflet `map.fitBounds()` API to automatically calculate bounding boxes containing all visible markers.
  3. **Visual Pin Indicators**: Markers are custom rendered as dynamic vector SVG points containing distinct color-coded weights:
     - **Critical**: Deep Red (`#ef4444`)
     - **High**: Vivid Orange (`#f97316`)
     - **Medium**: Bright Yellow (`#eab308`)
     - **Resolved / Low**: Forest Green (`#6BCB77`)
  4. **Interactive Popups**: Clicking a marker opens a clean Neo-Brutalist Leaflet popup containing thumbnail previews, upvote trackers, dynamic distance measurements (calculated locally via the Haversine formula in `/src/utils/distance.ts`), and deep-links for nested actions.

### Report Context & Guest Syncing (`/src/context/ReportsContext.tsx`)
Allows seamless offline-to-online workflows:
- Users reporting without an account (Guest Mode) have their issues saved instantly to the client's local storage (`localStorage`).
- When a user signs in, both cloud reports fetched from Firestore and locally compiled guest reports are merged seamlessly in real-time, displaying a unified live view without losing local efforts.

---

## 7. Deployment & Build System

The build system is designed to bundle both client static assets and server scripts into production-ready artifacts compatible with container engines.

### Scripts Setup
```json
"scripts": {
  "dev": "tsx server.ts",
  "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
  "start": "node dist/server.cjs"
}
```

### Build Optimization Phase
1. **Frontend Compilation**: `vite build` bundles standard client modules into highly optimized static index/JS/CSS bundles compiled inside the `/dist` directory.
2. **Backend Compilation**: `esbuild server.ts` bundles the backend into a single, fully self-contained CommonJS file located at `/dist/server.cjs`.
   - *Why CJS?*: Compiling the TypeScript server into CommonJS (`.cjs`) resolves relative imports at build-time. This completely avoids Node's strict runtime ES Module directory resolution check, resulting in ultra-fast cold starts on Cloud containers.
   - *External Packages*: `--packages=external` keeps large third-party node modules (like Express or Firebase-Admin) from bloating the bundled code.
3. **Execution**: The server automatically boots up via `node dist/server.cjs` binding to Host `0.0.0.0` and Port `3000`. In development, `Vite Dev Middleware` is mounted, routing client-side assets instantly on a single integrated port. In production, static asset routing serves `/dist/index.html` on any standard fallback route.

---

## 8. Developer Setup & Commands

To get up and running locally, execute the following commands:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file at the root directory of the project:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

3. **Run Dev Environment**
   Boots both the Express backend and Vite frontend proxy on http://localhost:3000:
   ```bash
   npm run dev
   ```

4. **Verify Types & Compile**
   Compiles static files and builds the server bundle for production deployment:
   ```bash
   npm run build
   ```

5. **Start Production Server**
   ```bash
   npm run start
   ```

---
*Created and maintained for developers of CivicGuardian AI. Safeguarding communities, together.*
