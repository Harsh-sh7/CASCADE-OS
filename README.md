# CASCADE_OS

> **A neuro-adaptive cognitive routing system for humans who don't work on a rigid schedule.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://www.mongodb.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)

---

## Why I Built This

I built CASCADE OS because I was tired of productivity tools that assume you're a robot.

Every to-do list, calendar app, and time-blocker on the market is built for the same fictional person: someone with steady energy, uninterrupted attention, and the executive function of a Fortune 500 CEO. They all assume you wake up at the same time, work the same number of hours, feel the same every day, and simply need a pretty list to check off.

I don't work that way. A lot of people don't.

Some days I wake up with 2 hours of sleep and trying to force a "deep work block" at 9 AM isn't discipline — it's self-destruction. Some days my environment is a warzone of noise and interruptions, and no amount of Pomodoro timers will fix that. Some days the most important thing I can do is rest, but every productivity app I've ever used penalizes me for that with guilt-inducing overdue tasks.

**The real problem isn't task management. It's bandwidth management.**

Cognitive bandwidth — the actual raw capacity your brain has at any given moment — is the only resource that truly matters. It's dynamic, it's affected by sleep, stress, environment, health, and social factors, and it fluctuates wildly. No existing tool actually tracks or responds to it.

So I built one that does.

CASCADE OS treats your brain like a system. It detects bottlenecks, identifies cascading failure loops, and routes you to the single highest-leverage action given your *current* state — not your ideal state. It is shame-free by design. If you can't act today, the backlog dissolves. The system recovers with you.

---

## What I Built

CASCADE OS is a full-stack web application — a **neuro-adaptive cognitive routing system** built as an operating system metaphor. You are not a user. You are an operator. The system runs diagnostics on your state every morning, synthesizes a recommendation, and tells you exactly one thing to do — and exactly why.

### Core Concept: The Bottleneck Engine

Everything in CASCADE OS revolves around one idea: **the Theory of Constraints applied to human cognition**.

At any given moment, your life has exactly one bottleneck — the single domain that, if you fix it, cascades the most positive improvement downstream. It could be sleep, energy, attention, health, money, relationships, or learning. The engine's job is to find it.

It doesn't give you a task list. It gives you a leverage point.

### System Modes

The engine operates in four modes, automatically selected based on your state:

| Mode | Trigger | Action |
|---|---|---|
| **FIX** | Normal state, one clear bottleneck | Optimize the highest-leverage domain |
| **CONTAINMENT** | Energy or time critically low | Stop decay, don't try to improve |
| **TRIAGE** | 3+ domains in distress simultaneously | Survival only — pick the one that stops the bleeding |
| **RECOVERY** | Cognitive bandwidth ≤ 2/10 | Override everything. One directive: lie down, drink water, shut down |

### Features

**Morning Check-In (Intake)**
A 7-question diagnostic that takes 60 seconds. You rate your Sleep, Energy, Focus, Stress, Time, Health, and Social domains on a 5-point scale. You also flag whether your environment is actively distracting and whether you feel mentally paralyzed. This is your daily state baseline.

**Bottleneck Dashboard**
The main view. After your intake, the engine runs a full analysis and presents:
- The single highest-leverage action for today
- The bottleneck domain that's blocking you
- The structural gains and costs of the action
- Why this action was chosen over all others
- What to delay, delegate, or drop entirely

**Failure Loop Detection**
The engine scans your state for known cascading failure patterns — e.g., "Low sleep → Low focus → No output → More stress → Worse sleep." When a loop is active, it targets the *break point* of the loop, not just the symptom. Loops tracked include: Sleep-Focus Loop, Isolation Loop, Financial Stress Loop, Burnout Spiral, and more.

**Decision Triage (Do / Delay / Delegate / Drop)**
Every analysis outputs a structured decision quad — the one thing to execute today, what to push to tomorrow, what to hand off, and what to eliminate entirely.

**Evening Check-In & Outcome Tracking**
At the end of the day, you do a second 8-domain check-in. The system computes the `outcomeDelta` — how much each domain moved — and marks the day as a success or failure. This data feeds the learning system.

**Adaptive Intelligence Layer (Personalization)**
After you accumulate enough history, the engine stops being generic and becomes *personal*. Using Exponential Moving Averages (EMA), it tracks:
- **Adherence**: How often you actually follow a given domain's recommendations
- **Effectiveness**: How well those interventions actually improve your state
- **RC Multipliers**: How long recovery actually takes for you specifically

These personal weights adjust the engine's Leverage Ratio calculations, so over time, it stops recommending things that don't work for you and doubles down on things that do.

**K-Nearest Neighbors (KNN) ML Layer**
Once you have 7+ days of history, a pure TypeScript KNN engine activates:
- **Success Predictor**: Given today's state, what's the probability this intervention will work, based on your most similar past days?
- **Recovery Time Predictor**: How long will it take to fix the bottleneck, given your personal recovery patterns?
- **Failure Predictor**: What's the probability you'll skip the recommendation, based on similar past days?

The final composite ML score = `adjustedLR × P(success) × (1 − P(failure))`

**Pattern Detection**
Runs over the last 14 days of logs to surface systemic insights:
- **Ignore Pattern**: If you've skipped 3+ recommendations, the system flags it and reduces difficulty
- **Loop Repetition**: If the same failure loop fires 4+ times in 2 weeks, it's classified as chronic
- **Recurring Bottleneck**: If the same domain blocks you 5+/7 days, you're stagnating
- **Domain Correlation**: Detects causality (e.g., low sleep is statistically killing your focus)

**Rule Engine (Governability Layer)**
A transparent, deterministic layer on top of the ML engine. Rules are prioritized:
1. **Recovery Rules** (highest): e.g., sleep < 4 → no deep work before 11 AM
2. **Protection Rules**: e.g., low energy + low time → reduce scope, not increase effort
3. **Optimization Rules**: e.g., energy ≥ 7 + attention ≥ 7 → execute hardest task NOW
4. **Custom System Policies**: User-defined conditional rules (if [domain] [op] [value] → [action])

**Simulation Engine**
A "what-if" tool. You dial up or down any domain state and see how the analysis would change in real-time — before your day even begins.

**Progress & History**
Charts of your domain states over time, your success rate, streak counters, and a full log of every past day's analysis and outcomes.

**Gamification**
Because systems need feedback loops:
- **XP**: Earned by checking in, following actions, breaking loops, making correct predictions
- **Levels**: Observer → Operator → Architect → System Administrator → Cascade Master
- **Badges**: First Fix, Loop Breaker, Counterintuitive, Ghost Protocol, Comeback Kid
- **Streaks**: Consecutive day chains with XP bonuses

**Ghost Protocol**
If you ignore 3+ consecutive recommendations, the system admits it's wrong. Confidence drops to LOW. The engine switches to a zero-pressure directive: do *anything* that feels easy. It stops trying to optimize and starts trying to re-establish trust with you.

**Notifications**
- **Email (Daily Brief)**: A styled HTML email sent every morning with your bottleneck, action, gains, costs, and operator stats. Supports Gmail SMTP (sends to any address) with Resend as fallback.
- **Telegram Bot**: Sends a formatted Markdown brief to your Telegram chat. Same information, mobile-first.

**Authentication**
Google OAuth and Magic Link email login via NextAuth.js. The admin panel has a separate hardened auth flow with a security question backed by environment variables (never exposed to the client).

**Subscription Tiers**
FREE / PRO / POWER plans with feature gating via a server-side subscription guard.

---

## How I Built It

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + custom mono-spaced design system |
| Animation | Framer Motion |
| Database | MongoDB Atlas via Mongoose |
| Auth | NextAuth.js (Google OAuth + Magic Link) |
| Email | Nodemailer (Gmail SMTP) + Resend |
| Notifications | Telegram Bot API |
| Charts | Recharts |
| Deployment | Vercel |

### Architecture

```
cascade-os/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── login/                      # Auth flow
│   ├── dashboard/
│   │   ├── page.tsx                # Bottleneck dashboard (main view)
│   │   ├── checkin/                # Morning intake (7-domain questionnaire)
│   │   │   └── evening/            # Evening check-in (outcome tracking)
│   │   ├── intake/                 # First-time intake
│   │   ├── simulation/             # What-if scenario engine
│   │   ├── map/                    # Domain dependency graph
│   │   ├── history/                # Past log viewer
│   │   ├── progress/               # Analytics & charts
│   │   ├── loops/                  # Failure loop viewer
│   │   ├── decisions/              # Decision triage view
│   │   ├── resources/              # Resources reference
│   │   ├── settings/               # User settings
│   │   ├── graph/                  # Domain graph explorer
│   │   └── rules/                  # Custom policies manager
│   └── api/
│       ├── checkin/                # Morning & evening check-in handlers
│       ├── dashboard/              # Dashboard data aggregator
│       ├── followup/               # Action follow-through tracking
│       ├── feedback/               # Thumbs up/down feedback
│       ├── history/                # Log retrieval
│       ├── patterns/               # Pattern detection endpoint
│       ├── rules/                  # Custom policy CRUD
│       ├── simulate-impact/        # Simulation engine API
│       ├── subscription/           # Plan management
│       ├── cron/                   # Scheduled jobs (notifications, model updates)
│       ├── notifications/          # Notification triggers
│       ├── user/                   # User profile management
│       └── auth/                   # NextAuth handlers
├── lib/
│   ├── engine/
│   │   ├── engine.ts               # Core orchestrator (runFullAnalysis)
│   │   ├── bottleneck.ts           # Constraint detection
│   │   ├── adaptive.ts             # Personalization layer (EMA)
│   │   ├── patterns.ts             # Historical pattern detection
│   │   ├── recommendation.ts       # Contextual intervention generator
│   │   ├── decisions.ts            # Decision triage + day classification
│   │   ├── rules.ts                # Rule engine (recovery/protection/optimization)
│   │   ├── loops.ts                # Failure loop detection
│   │   ├── insights.ts             # Insight generation
│   │   └── graph.ts                # Domain node graph
│   ├── ml/
│   │   ├── knn.ts                  # K-Nearest Neighbors (success/failure/recovery)
│   │   └── generateSyntheticData.ts# Synthetic training data generator
│   ├── models/
│   │   ├── User.ts                 # User schema (model, gamification, policies, insights)
│   │   └── DailyLog.ts             # Daily log schema (states, analysis, outcomes)
│   ├── auth.ts                     # NextAuth configuration
│   ├── db.ts                       # MongoDB connection handler
│   ├── gamification.ts             # XP, levels, badges, streaks
│   ├── notifications.ts            # Email (HTML) + Telegram brief generators
│   └── subscriptionGuard.ts        # Feature gating by plan
└── components/
    ├── SidebarNav.tsx              # Dashboard navigation
    └── ui/                         # Shared UI primitives
```

### The Engine Flow

Every morning, after you submit your intake, this is what happens:

```
1. Compute Neuro-Adaptive State
   cognitiveBandwidth = (energy + attention) / 2 − mentalOverloadPenalty
   sensoryLoad        = environmentNoisy ? 8 : 2
   executiveFriction  = 10 − cognitiveBandwidth

2. Detect Bottleneck
   → Which single domain has the highest leverage ratio?
   → If sensoryLoad > 7: bottleneck override → "attention"

3. Classify Day & Set Mode
   → FIX / CONTAINMENT / TRIAGE / RECOVERY

4. Detect Active Failure Loops
   → Scan state against known loop signatures
   → If TRIAGE mode + active loops: target loop's break point

5. Apply Rule Engine
   → Recovery rules (hard constraints)
   → Protection rules (guardrails)
   → Optimization rules (peak state detection)
   → Custom user policies

6. Adaptive Intelligence Layer (if userModel exists)
   adjustedLR = baseLR × adherence[domain] × effectiveness[domain]
   → Score all domains → rank by finalScore

7. KNN Prediction (if ≥ 7 historical logs)
   → P(success | current state) via Euclidean distance
   → P(failure) → likelihood of skipping
   → Final ML score = adjustedLR × P(success) × (1 − P(failure))

8. Generate Recommendation
   → Contextual intervention for target node
   → If RECOVERY: hardcoded emergency directive

9. Ghost Protocol Check
   → If ignoredCount ≥ 3 or calibrationNeeded: confidence → LOW

10. Generate Insights
    → Cross-reference historical patterns

11. Generate Decision Triad
    → DO (one action) / DELAY / DELEGATE / DROP

12. Compose System Message
    → Human-readable diagnosis of the day

13. Persist to DailyLog → Trigger notifications
```

### Design Philosophy

The UI is intentionally built in a terminal / operating system aesthetic — monospace font, black background, zinc color palette, uppercase labels with wide letter-spacing. This is intentional. The product metaphor is a mission-critical system dashboard, not a wellness app. The language reinforces this: you don't "log in," you execute `Sys_Init`. You don't "complete a task," you "close a loop." The goal was to make you feel like an operator of your own cognitive system, not a patient managing symptoms.

---

## Setup & Running Locally

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Google OAuth credentials (for Google login)
- Optional: Gmail app password, Resend API key, Telegram bot token

### 1. Clone the repository

```bash
git clone https://github.com/Harsh-sh7/CASCADE-OS.git
cd CASCADE-OS
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/cascade-os

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email (Magic Link + Daily Brief)
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=CASCADE OS <noreply@yourdomain.com>

# Resend (for daily brief emails)
RESEND_API_KEY=

# Gmail SMTP (alternative to Resend — sends to any address)
GMAIL_USER=
GMAIL_APP_PASSWORD=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=

# Cron security
CRON_SECRET=your-secret-cron-token

# Admin
ADMIN_PASSWORD=
SECURITY_ANSWER=
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. First use

1. Sign in with Google or via Magic Link
2. Complete the morning intake (7 domains + environment check)
3. You'll land on the Bottleneck Dashboard with your first analysis
4. Mark whether you followed the action in the evening
5. Do the Evening Check-In to record outcome deltas
6. After 7+ days, the KNN ML layer activates and the system starts personalizing

---

## Environment Variables Reference

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | ✅ | Database connection string |
| `NEXTAUTH_URL` | ✅ | App URL for NextAuth redirects |
| `NEXTAUTH_SECRET` | ✅ | JWT signing secret |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth app ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth app secret |
| `EMAIL_SERVER_*` | ✅ | SMTP settings for Magic Link |
| `EMAIL_FROM` | ✅ | Sender address |
| `RESEND_API_KEY` | Optional | Resend email API for daily briefs |
| `GMAIL_USER` | Optional | Gmail account for SMTP delivery |
| `GMAIL_APP_PASSWORD` | Optional | Gmail app password (not your login password) |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram bot for daily briefs |
| `CRON_SECRET` | Optional | Authorization header for cron endpoints |
| `ADMIN_PASSWORD` | Optional | Admin dashboard password |
| `SECURITY_ANSWER` | Optional | Forgot password security question answer |
| `DEV_EMAIL_OVERRIDE` | Optional | Override all email recipients in dev |

---

## Key Concepts Glossary

| Term | Definition |
|---|---|
| **Bottleneck** | The single domain (out of 8) whose improvement cascades the most benefit to all others right now |
| **Leverage Ratio (LR)** | A score quantifying how much fixing a domain will improve the overall system |
| **Adjusted LR** | LR modified by personal adherence × effectiveness history |
| **Cognitive Bandwidth** | `(energy + attention) / 2` — your actual available mental capacity |
| **Sensory Load** | External environmental friction (noisy environment = 8/10 load) |
| **Executive Friction** | `10 − cognitiveBandwidth` — how hard it is to start anything |
| **Failure Loop** | A self-reinforcing negative cycle (e.g., poor sleep → poor focus → worse output → more stress → worse sleep) |
| **Loop Break Point** | The specific domain in a loop that, if fixed, collapses the entire cycle |
| **Ghost Protocol** | Emergency mode when the system admits it's been consistently wrong about you |
| **EMA (Exponential Moving Average)** | The smoothing algorithm used to update adherence, effectiveness, and RC multipliers over time |
| **RC Multiplier** | Recovery Cost multiplier — how long it personally takes you to recover a given domain |
| **KNN** | K-Nearest Neighbors — the ML algorithm comparing today's state to your 5 most similar past days |
| **Outcome Delta** | The change in each domain's score from morning to evening |

---

## Roadmap

- [ ] Native mobile app (React Native)
- [ ] Weekly synthesis report (auto-generated)
- [ ] Calendar integration (block time based on state)
- [ ] Voice check-in
- [ ] Multi-user (shared household/team routing)
- [ ] Wearable integration (heart rate, HRV for automatic state sensing)

---

## License

MIT — use it, fork it, build on it. Credit appreciated but not required.

---

*CASCADE_OS // V1.0.0-NEURO // END OF LINE*
