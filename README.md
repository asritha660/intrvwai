# IntrvwAI - AI-Powered Mock Interview Platform

A production-grade mock interview platform where engineers practice technical interviews with an AI that thinks like a senior engineer.

## What It Does

Walk into a real interview room with a live code editor, countdown timer, and an AI interviewer that asks you questions the moment you hit start. Explain your approach, get pushed back with follow-ups, write your solution, get scored out of 100.

4 interview tracks - DSA, System Design, Backend Engineering, Behavioral. Multiple difficulty levels. AI that never repeats a question across rounds. Dashboard tracking your score, streak, and skill breakdown per category.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

### Installation

```bash
# Clone the repo
git clone https://github.com/asritha660/intrvwai.git
cd intrvwai

# Install dependencies
npm install
```

### Running Locally

Create a `.env` file in the root folder:
```
ANTHROPIC_API_KEY=your_api_key_here
```

Start the proxy server in one terminal:
```bash
node server.cjs
```

Start the frontend in another terminal:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
intrvwai/
├── src/
│   ├── App.tsx          # Full React frontend
│   └── main.tsx         # Entry point
├── server.cjs           # Express proxy server
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Roadmap

This is a 5 phase build.

**Phase 1 — Complete**
React frontend, AI interviewer powered by Claude API, live code editor, countdown timer, auth with localStorage, personal dashboard with score and skill tracking, 4 interview tracks, multiple difficulty levels, no repeated questions across rounds.

**Phase 2 — In Progress**
Real backend with Node.js, PostgreSQL, JWT authentication, and WebSocket real-time collaborative editing.

**Phase 3 — Planned**
Sandboxed Docker code execution engine with hidden test cases and a multi-language runner.

**Phase 4 — Planned**
Kafka event-driven architecture, performance analytics dashboard, and AI-generated insights on weak areas.

**Phase 5 — Planned**
Kubernetes deployment, load testing, Prometheus and Grafana monitoring, GitHub Actions CI/CD pipeline.

---

## Tech Stack

**Frontend**
React 18, TypeScript, Vite

**Backend (Phase 1)**
Node.js, Express, CORS proxy

**Planned (Phase 2+)**
PostgreSQL, Redis, Docker, Kubernetes, AWS (EC2, RDS, ElastiCache), Kafka, WebSocket, Prometheus, Grafana, GitHub Actions

**AI**
Anthropic Claude API

---

## System Architecture

```
┌─────────────────────────────────────────────┐
│              Client (React)                  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│               API Gateway                    │
└──┬──────────┬──────────┬────────────────────┘
   │          │          │
┌──▼──┐  ┌───▼───┐  ┌───▼──────┐
│Auth │  │Interview│ │AI Feedback│
│ Svc │  │  Svc   │ │   Svc    │
└──┬──┘  └───┬───┘  └───┬──────┘
   │          │          │
┌──▼──────────▼──────────▼──────┐
│   PostgreSQL + Redis + Kafka   │
└───────────────────────────────┘
```

---

## Author

**Asritha Penumalli**
MS Computer Science — University of Central Florida (GPA: 3.97)

[LinkedIn](https://linkedin.com/in/Asritha-valli-Penumalli) · [GitHub](https://github.com/asritha660)
