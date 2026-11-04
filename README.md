<div align="center">

# 🎓 StudySphere AI
### *Next-Generation Intelligent Student Learning & Curriculum Intelligence Platform*

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Gen%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Graphics-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br/>

**StudySphere AI** is a full-stack, AI-orchestrated academic platform designed to empower university students. It combines deep multi-topic PDF parsing, dual-language comprehension (English & conversational Hinglish), adaptive weak-topic detection, dynamic monthly task scheduling, 1-Click Google OAuth, and interactive 3D visualizations into one distraction-free interface.

[Key Features](#-key-features) • [System Architecture](#-system-architecture) • [Tech Stack](#-technology-stack) • [Installation](#-getting-started) • [API Reference](#-backend-api-reference) • [Security](#-security--key-isolation)

---

</div>

## 🌟 Key Features

### 1. 📄 Smart Multi-Topic PDF Analyzer & Dynamic Explanations
- **Complete Document Breakdown**: Extracts text directly using a client-side `pdfjs-dist` worker, eliminating upload timeouts and protecting document privacy.
- **Deep Topic Extraction**: Automatically decomposes complex syllabus documents and lecture notes into comprehensive units, executive summaries, and granular subtopics.
- **Bilingual Comprehension (English & Hinglish)**: Toggle between precise academic English and natural, conversational Hinglish explanations with standard English technical terms.
- **Deepen Mode (Masterclass)**: One-click conceptual expansion that breaks down topics into history, mechanisms, mathematical formulations, and engineering trade-offs without cookie-cutter templates.
- **Laser-Focused Topic Quiz Generator**: Launch practice sets directly from any individual topic card with instant scoring, confetti celebrations, and answer rationales.
- **Safe IndexedDB Persistence**: Stores uploaded documents client-side in browser IndexedDB to prevent `localStorage` quota overflow.

### 2. 🤖 Curriculum-Aware AI Study Tutor
- **Multi-Model Neural Fallback**: Powered by `@google/genai` with automatic failover between `gemini-flash-lite-latest`, `gemini-3.1-flash-lite`, and `gemini-3.6-flash` for 100% uptime.
- **Adaptive Pedagogical Modes**:
  - **Beginner**: Intuitive real-world analogies, simplified foundations, and step-by-step guidance.
  - **Intermediate**: Detailed technical explanations, pseudocode, and system architectures.
  - **Exam Focused**: High-yield exam tips, standard definitions, marking scheme strategies, and common student traps.
- **LaTeX Math & Code Formatting**: Seamless rendering of mathematical formulas ($...$) and syntax-highlighted code blocks.

### 3. 🎯 Algorithmic Weak Topic Detection & Diagnostic Analytics
- **Performance Threshold Tracking**: Automatically analyzes quiz attempts and marks topics with accuracy $< 60\%$ as critical focus areas.
- **Targeted Remediation Engine**:
  - `[Ask AI]`: Opens the AI Tutor pre-prompted with the student's exact weak concept.
  - `[Review Notes]`: Instantly navigates to chapter summaries and architectural diagrams.
  - `[Retake Drill]`: Generates custom drill sets focused specifically on weak subtopics.
- **Visual Analytics**: Interactive radar charts and proficiency trends built with `Recharts`.

### 4. 📅 Dynamic Study Planner & Interactive Calendar
- **Live System-Date Synchronization**: Automatically aligns calendar dates, days, and months dynamically with zero hardcoded dates.
- **Interactive Day Inspector**: Click any calendar date to review scheduled sessions, check off completed goals, or delete tasks.
- **Flexible Filter Views**: Toggle between **Today's Focus**, **7-Day Rolling Horizon**, and full **Monthly Calendar**.
- **Progress Tracking**: Real-time progress bar reflecting daily and weekly task completion ratios.

### 5. 🔐 Enterprise-Grade Authentication & Security
- **1-Click Google OAuth**: Instant, frictionless sign-in powered by Supabase Auth with PKCE flow.
- **6-Digit Email OTP Verification**: Secure, passwordless or password-protected registration with automated token delivery.
- **Password Reset Workflows**: In-app OTP-based password recovery.
- **Dual-Engine Operation**: Seamlessly works with live Supabase PostgreSQL OR with the zero-config offline `DataStore` engine if credentials are omitted.

### 6. 👤 Personalized Student Profile Hub
- **Academic Context**: Manage university/institution, major, semester, and personal academic milestones.
- **Live Activity Metrics**: Tracks real-time completed study tasks, mastered subjects, average quiz accuracy, and study streaks.
- **In-App Account Controls**: Secure password updates, profile avatar customization, and session logout modals.

### 7. 🌐 3D Interactive Visualizations
- Built with **Three.js** to deliver hardware-accelerated, interactive 3D visual components:
  - `AITutorOrb3D`: Dynamic pulsing energy core representing active AI comprehension.
  - `LearningNetwork3D`: Interactive 3D nodal graph connecting concepts in real time.
  - `PDFScanner3D`: Holographic document scanning visualizer.

---

## 🏗️ System Architecture

```
                                  ┌────────────────────────┐
                                  │   Student Browser UI   │
                                  │  (React 19 + Three.js) │
                                  └───────────┬────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      │                                               │
             (HTTPS / Auth / Data)                                (REST API)
                      │                                               │
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │     Supabase Cloud      │                     │     Node.js Backend     │
         │  - PostgreSQL + RLS     │                     │     (Express 5 API)     │
         │  - Google OAuth (PKCE)  │                     └────────────┬────────────┘
         │  - JWT Auth & OTP Mail  │                                  │
         └─────────────────────────┘                     (Secure Server-to-Server)
                                                                      │
                                                                      ▼
                                                         ┌─────────────────────────┐
                                                         │    Google Gemini API    │
                                                         │   (Flash LLM Models)    │
                                                         └─────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Type-safe declarative UI components |
| **Build Tooling** | [Vite 8](https://vitejs.dev/) | Lightning-fast HMR and optimized asset bundling |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first responsive styling |
| **3D Rendering** | [Three.js](https://threejs.org/) | Custom WebGL interactive 3D cores and networks |
| **Icons & Animation** | [Lucide React](https://lucide.dev/) & [Framer Motion](https://www.framer.com/motion/) | Polished iconography and smooth UI transitions |
| **Charts & Graphs** | [Recharts](https://recharts.org/) | Dynamic analytics, radar performance, and progress trends |
| **PDF Processing** | [PDF.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`) | High-speed client-side and server-side PDF text extraction |
| **Backend Framework** | [Express 5](https://expressjs.com/) on [Node.js](https://nodejs.org/) | RESTful API server, security headers, and rate limiting |
| **AI Neural Engine** | [Google Gen AI SDK](https://www.npmjs.com/package/@google/genai) | Gemini Flash models for tutoring, summarization, and quizzing |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 15) | Relational database, Row-Level Security (RLS), Google OAuth |
| **Client Storage** | `IndexedDB` (`idb`) + `localStorage` | Offline resilience and zero-quota overflow PDF caching |

---

## 📁 Project Directory Structure

```
projectstudentsstudy/
├── docs_images/             # Architectural diagrams and application screenshots
├── public/                  # Static assets and favicon icons
├── scripts/                 # Maintenance, secret scanner, and schema seeders
│   ├── scan_secrets.cjs     # Automated security scanner for sensitive tokens
│   └── seedSupabase.cjs     # Curriculum seeder for Supabase PostgreSQL
├── server/
│   └── index.js             # Express backend (Gemini AI endpoints, rate limiting, CORS)
├── src/
│   ├── assets/              # Static media assets and SVGs
│   ├── components/
│   │   ├── 3d/              # Three.js 3D visualizers (Orbs, Networks, Scanners)
│   │   ├── common/          # Error boundaries and shared components
│   │   ├── layout/          # Header, Sidebar, and Modal components
│   │   └── search/          # Global search modal (Ctrl + K)
│   ├── context/
│   │   ├── AuthContext.tsx  # Authentication state, Google OAuth, and OTP handlers
│   │   └── ThemeContext.tsx # Application theme state
│   ├── lib/
│   │   ├── dataStore.ts     # Resilient offline data access layer
│   │   ├── pdfStorage.ts    # IndexedDB storage engine for large documents
│   │   ├── supabase.ts      # Supabase client initializer and storage keys
│   │   └── supabaseSync.ts  # Background database synchronization
│   ├── pages/
│   │   ├── Auth/            # Login, Register, and Forgot Password pages
│   │   ├── AITutorPage.tsx  # Conversational AI Tutor
│   │   ├── DashboardPage.tsx# Main student analytics dashboard
│   │   ├── PDFAnalyzerPage.tsx # PDF document extraction & Deepen masterclass
│   │   ├── ProfilePage.tsx  # Student profile, academic goals, and settings
│   │   ├── QuizGeneratorPage.tsx # Customized practice quiz suite
│   │   ├── StudyMaterialsPage.tsx# Lecture notes and downloads library
│   │   ├── StudyPlannerPage.tsx  # Dynamic calendar and task management
│   │   ├── SubjectDetailPage.tsx # Subject syllabus & chapter view
│   │   ├── SubjectLibraryPage.tsx# Course catalog explorer
│   │   ├── TeacherAdminPage.tsx  # Instructor curriculum editor
│   │   └── WeakTopicDetectionPage.tsx # Diagnostic weak-topic dashboard
│   ├── types/
│   │   └── index.ts         # Central TypeScript interfaces and data models
│   ├── App.tsx              # Router configuration and layout wrapper
│   └── main.tsx             # Application bootstrap entry point
├── .env.example             # Clean environment variables template
├── .gitignore               # Strict git ignore patterns for security
├── package.json             # Project dependencies and operational scripts
├── supabase_schema.sql      # Complete PostgreSQL DDL schema with RLS policies
└── vite.config.ts           # Vite build and plugin configurations
```

---

## 🔒 Security & Key Isolation

StudySphere enforces industry best practices for security and credentials isolation:

- **Server-Side API Key Isolation**: The Google Gemini API key (`AI_API_KEY`) is stored strictly on the Node.js backend server. It is **never** bundled or exposed to the client-side browser bundle.
- **Strict `.gitignore` Enforcement**: All `.env` and local credential files are permanently ignored by Git. A clean template ([`.env.example`](.env.example)) is provided for setup.
- **Row-Level Security (RLS)**: Every Supabase PostgreSQL table includes granular RLS policies ensuring students can only access and modify their own records.
- **Automated Secret Auditing**: Includes a pre-commit secret scanner script (`scripts/scan_secrets.cjs`) to verify zero credential leakage before pushing code.
- **HTTP Protection**: The Express server implements hardened HTTP security headers (`nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`) and origin-restricted CORS policies.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Google Gemini API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/)
- *(Optional)* **Supabase Account**: Free project from [Supabase](https://supabase.com/)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/ashishjain555/StudySphere.git
cd StudySphere
```

---

### Step 2: Install Dependencies
```bash
npm install
```

---

### Step 3: Configure Environment Variables
Copy the template file to create your local `.env`:
```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:
```env
# Google Gemini API Key for AI features (PDF Analyzer, Deepen, Quiz Gen, Tutor)
AI_API_KEY=your_google_gemini_api_key_here

# Backend Server Port
PORT=3001

# Optional Supabase Configuration (Leave blank to use built-in offline engine)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

> **Note**: If you leave Supabase values blank, StudySphere will automatically switch to its built-in offline `DataStore` engine so you can still run all features locally without any external setup!

---

### Step 4: Run the Application

#### Option A: Full Development Mode (Frontend + Backend Concurrently)
```bash
npm run dev
```
- **Frontend Web App**: [http://localhost:5173](http://localhost:5173)
- **Backend AI Engine**: [http://localhost:3001](http://localhost:3001)

#### Option B: Run Services Separately
If you prefer running frontend and backend in separate terminal tabs:
```bash
# Terminal 1: Start Express AI Server
npm run server

# Terminal 2: Start Vite Dev Server
npm run client
```

---

### Step 5: Production Build & Preview
To verify TypeScript types and generate an optimized production bundle:
```bash
npm run build
npm run preview
```

---

## 📡 Backend API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check returning server status, timestamp, and AI engine state. |
| `POST` | `/api/ai/chat` | Conversational study tutor with customizable pedagogical level and chat history. |
| `POST` | `/api/ai/analyze-pdf` | Comprehensive PDF document extraction returning executive summary and topic breakdown. |
| `POST` | `/api/ai/deepen-topic` | In-depth topic masterclass expansion with historical context and core mechanics. |
| `POST` | `/api/ai/generate-quiz` | Topic-specific diagnostic quiz generator with customizable question difficulty. |

---

## 👨‍💻 Author

**Ashish Jain**
- GitHub: [@ashishjain555](https://github.com/ashishjain555)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for full details.
