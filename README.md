# Suez Canal Bank (SCB) — Engineering Project Control & Management System (EPCMS)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.33-C5F74F.svg)](https://orm.drizzle.team/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-v5-FF4154.svg)](https://tanstack.com/query)
[![Vitest](https://img.shields.io/badge/Vitest-36_Tests_Passing-6E9F18.svg)](https://vitest.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)

> **EPCMS** is an enterprise-grade project control and governance platform engineered specifically for **Suez Canal Bank's Engineering & Real Estate Department**. It monitors capital branch developments, ATM site rollouts, core infrastructure renovations, and long-lead material procurement across Egypt with immutable schedule tracking, automated financial risk derivation, and bank-grade audit surveillance.

---

## 🏛️ Key Architectural Invariants & Guarantees

### 1. Three-Layer Baseline Immutability
Committed milestone baseline dates are permanent contractual references and cannot be altered or overwritten. This invariant is enforced at three distinct architectural levels:

```
[Layer 1: Frontend & Zod]  -->  [Layer 2: Express Service]  -->  [Layer 3: PostgreSQL Trigger]
updateMilestoneSchema.strict()   if ('baselineDate' in input)      prevent_baseline_overwrite()
omits baselineDate; UI excludes  logs BASELINE_ATTEMPT audit;      BEFORE UPDATE trigger raises
baseline input completely (422)  throws 403 Forbidden Error        SQL exception (Aborts Tx)
```

1. **Layer 1 (Schema Defense):** `@scb/shared`'s `updateMilestoneSchema` strictly omits `baselineDate` with `.strict()`. Sending `baselineDate` triggers a `422 Unprocessable Entity`. In the UI, the Edit Milestone modal never renders an editable baseline input.
2. **Layer 2 (Service Defense):** The Express milestone service inspects update payloads directly. If `baselineDate` is present (bypassing validation), it records a high-priority `BASELINE_ATTEMPT` entry in the `audit_log` table with user identity and throws a `403 Forbidden` error.
3. **Layer 3 (Database Engine Defense):** A raw SQL `BEFORE UPDATE` trigger (`prevent_baseline_overwrite`) prevents `OLD.baseline_date` from being altered, aborting any direct SQL overwrite attempt with a `BASELINE_IMMUTABLE` database exception.

### 2. Pure-Function Auto-Derived RAG Status
Project health (Red / Amber / Green) is **never stored in the database** to prevent cache staleness. It is derived on-the-fly via pure function `calculateRAG()`:
* **Schedule Component:**
  * $\le 7$ days max delay across tasks $\implies$ `GREEN`
  * $8$ to $21$ days max delay $\implies$ `AMBER`
  * $> 21$ days max delay $\implies$ `RED`
* **Cost Component:**
  * Project in execution (`finalCost = null`) $\implies$ `GREEN` (per banking specification)
  * Cost overrun $\le 5\%$ $\implies$ `GREEN`
  * Cost overrun $> 5\%$ and $\le 15\%$ $\implies$ `AMBER`
  * Cost overrun $> 15\%$ $\implies$ `RED`
* **Overall Rating:** $\max(\text{Schedule Risk}, \text{Cost Risk})$ (Worst-case aggregation).

### 3. Database-Generated Columns
State is computed at the database engine level and exposed as read-only fields:
* **`procurement_items.remaining_quantity`**: `tender_quantity - allocated_quantity - delivered_quantity`
* **`contractor_scores.overall_score`**: Exact arithmetic mean of the 6 mandatory sub-scores:
  $$\text{overallScore} = \text{ROUND}\left(\frac{\text{schedule} + \text{quality} + \text{resources} + \text{safety} + \text{coordination} + \text{docs}}{6.0}, 1\right)$$
* **`milestones.delay_days`**: `EXTRACT(DAY FROM (COALESCE(forecast_date, CURRENT_DATE) - baseline_date))`

### 4. Strict Middleware Chain
Every API request traverses an ordered security pipeline:
$$\text{cors} \longrightarrow \text{helmet} \longrightarrow \text{rateLimiter} \longrightarrow \text{cookieParser} \longrightarrow \text{authenticate} \longrightarrow \text{authorize} \longrightarrow \text{validate} \longrightarrow \text{controller}$$

### 5. Role-Based Access Control (RBAC)
* **`ADMIN`:** Full CRUD permissions across projects, milestones, procurement, contractor evaluations, and exclusive access to the Institutional Audit Trail.
* **`VIEWER`:** Read-only access to executive dashboards, projects, procurement trackers, and contractor scorecards.

---

## 🎨 Suez Canal Bank Brand Design System

The frontend strictly implements Suez Canal Bank's corporate brand palette:

| Token Name | Hex Code | Purpose |
|------------|----------|---------|
| `scb-blue` | `#0047BA` | Primary brand blue, headers, active navigation, primary CTAs |
| `scb-blue-hover` | `#003896` | Hover state for buttons and interactive items |
| `scb-blue-light` | `#EBF2FF` | Pill badges, light backgrounds, table highlights |
| `scb-dark` | `#4A4F54` | Primary typography, headers, metric values |
| `scb-warm` | `#D6D1CA` | High-density card borders, table dividers, inputs |
| `scb-offwhite` | `#F5F3F0` | Application canvas background |
| `status-green` | `#22C55E` | RAG on-track indicator, approved status |
| `status-amber` | `#F59E0B` | RAG caution indicator, warning threshold |
| `status-red` | `#EF4444` | RAG critical alert, overdue milestones, depleted items |

---

## 📁 Repository Structure

```
SCB/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Automated CI/CD (lint, typecheck, Vitest, Playwright, build)
├── packages/
│   └── shared/                    # Shared TypeScript package (@scb/shared)
│       ├── src/
│       │   ├── constants/         # RAG thresholds, statuses, user roles
│       │   ├── schemas/           # Zod schemas (auth, project, milestone, procurement, contractor, audit)
│       │   └── types/             # Shared TypeScript types derived via z.infer
│       └── package.json
├── apps/
│   ├── server/                    # Express 5 REST API (@scb/server)
│   │   ├── src/
│   │   │   ├── config/            # Environment & PostgreSQL connection config
│   │   │   ├── db/
│   │   │   │   ├── schema/        # Drizzle ORM schema definitions & generated columns
│   │   │   │   ├── triggers/      # Layer 3 PostgreSQL baseline immutability triggers
│   │   │   │   └── seed/          # Realistic banking seed dataset
│   │   │   ├── lib/               # AppError, pure ragCalculator, pino logger
│   │   │   ├── middleware/        # cors, helmet, rateLimiter, auth, rbac, validate, errorHandler
│   │   │   ├── modules/           # Controller-Service-Repository domain modules
│   │   │   │   ├── auth/          # Authentication & JWT session
│   │   │   │   ├── projects/      # Project portfolio CRUD & RAG calculation
│   │   │   │   ├── milestones/    # Schedule control & Layer 2 baseline defense
│   │   │   │   ├── procurement/   # Material inventory & generated remaining quantity
│   │   │   │   ├── contractors/   # 6-score performance evaluations
│   │   │   │   ├── dashboard/     # Portfolio KPI aggregation & chart datasets
│   │   │   │   └── audit/         # Compliance logging & BASELINE_ATTEMPT tracking
│   │   │   └── __tests__/         # Vitest invariant & unit test suites (36 tests)
│   │   └── package.json
│   └── client/                    # React 18 / Vite / Tailwind SPA (@scb/client)
│       ├── e2e/                   # Playwright End-to-End test suites
│       ├── src/
│       │   ├── api/               # TanStack Query v5 data hooks
│       │   ├── components/
│       │   │   ├── auth/          # ProtectedRoute, AdminRoute
│       │   │   ├── dashboard/     # KPICard, RAGDonutChart, MilestoneStatusBarChart, OverdueMilestonesTable
│       │   │   ├── layout/        # Collapsible Sidebar, TopHeader, PageShell
│       │   │   └── ui/            # Button, Badge, Card, DataTable, Modal, ProgressBar, Skeleton, Toast
│       │   ├── context/           # AuthContext, ToastContext
│       │   ├── lib/               # Axios instance (withCredentials: true), formatters (EGP currency, dates)
│       │   └── pages/             # LoginPage, DashboardPage, ProjectsListPage, ProjectDetailPage,
│       │                          # ProcurementPage, ContractorsPage, AuditLogPage, NotFoundPage
│       └── package.json
├── package.json                   # Monorepo workspaces configuration
└── tsconfig.base.json             # Shared strict TypeScript base config
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v20.x or higher
* **npm**: v10.x or higher
* **PostgreSQL**: v16.x (running locally or via Docker)

### 1. Installation
Clone the repository and install dependencies across all workspaces:

```bash
git clone https://github.com/mohamedbadawy/SCB.git
cd SCB
npm install
```

### 2. Configure Environment Variables
Copy the example environment configuration into the server application:

```bash
cp .env.example apps/server/.env
```

Ensure your `DATABASE_URL` in `apps/server/.env` points to your PostgreSQL instance:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/scb_epcms
PORT=3001
NODE_ENV=development
JWT_SECRET=super-secure-scb-banking-jwt-secret-key-at-least-32-chars
JWT_EXPIRES_IN=28800
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
```

### 3. Initialize Database, Triggers & Seed Data

```bash
# 1. Build the shared schema package
npm run build -w packages/shared

# 2. Push Drizzle schema to PostgreSQL (creates tables & generated columns)
npm run db:push -w apps/server

# 3. Apply the Layer 3 baseline immutability SQL trigger
npm run db:trigger -w apps/server

# 4. Seed development dataset (5 projects, 18 milestones, 10 procurement items, 5 contractors, 2 users)
npm run db:seed -w apps/server
```

### 4. Start Development Servers

Run the backend API and frontend client concurrently:

```bash
# Terminal 1: Start Express API Server (:3001)
npm run dev -w apps/server

# Terminal 2: Start Vite React SPA (:5173)
npm run dev -w apps/client
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Pre-Configured Demo Credentials

The seed script creates two institutional accounts for testing role boundaries:

| Role | Email | Password | Access Capabilities |
|------|-------|----------|---------------------|
| **System Administrator** | `admin@scb.com` | `Admin@1234` | Full CRUD, Project/Milestone Management, Procurement Allocation, Contractor Scoring, Audit Trail Explorer |
| **Project Viewer** | `viewer@scb.com` | `Viewer@1234` | Read-only Portfolio Dashboard, View Projects, View Procurement & Scorecards (Audit Log restricted) |

*Note: The login page includes quick demo buttons to auto-populate credentials with one click.*

---

## 🧪 Testing & Verification

### Backend Invariant Tests (Vitest)
Executes all 36 unit and invariant tests covering RAG boundary thresholds, baseline attack resistance, generated column mathematics, and middleware security:

```bash
npm run test -w apps/server
```

**Test Coverage Summary:**
* `baseline-immutability.test.ts`: Verifies Layer 1 Zod rejection, Layer 2 service interception & audit, and Layer 3 SQL trigger.
* `rag-calculator.test.ts`: Verifies 14 boundary test cases (delays $\le 7$d, $8-21$d, $>21$d; overruns $\le 5\%$, $5-15\%$, $>15\%$; null final costs).
* `generated-columns.test.ts`: Verifies formulas for `remainingQuantity`, `overallScore` mean, and `delayDays`.
* `middleware-chain.test.ts`: Verifies 401 unauthenticated, 403 role unauthorized, 422 schema validation, and error formatting.

### Full Monorepo Compilation & Build Check
```bash
# Builds @scb/shared, type-checks apps/server, and generates production bundle for apps/client
npm run build -w packages/shared && npx tsc --noEmit --project apps/server/tsconfig.json && npm run build -w apps/client
```

### End-to-End UI Tests (Playwright)
```bash
npm run test:e2e -w apps/client
```

---

## 📡 API Reference Overview

All endpoints are mounted under `/api/v1` and use `httpOnly` JWT cookies for session authentication:

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/v1/auth/login` | Public | Authenticates credentials and issues `httpOnly` cookie |
| `POST` | `/api/v1/auth/logout` | Public | Clears session cookie |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieves active user session & role |
| `GET` | `/api/v1/dashboard/summary` | Authenticated | Portfolio KPI counts (Projects, Overdue, Avg Score, At-Risk Items) |
| `GET` | `/api/v1/dashboard/charts` | Authenticated | Pre-shaped Recharts datasets (RAG distribution, Milestone status, Overdue tasks) |
| `GET` | `/api/v1/projects` | Authenticated | Paginated project list with auto-derived `ragStatus` |
| `GET` | `/api/v1/projects/:id` | Authenticated | Detailed project metadata and derived metrics |
| `POST` | `/api/v1/projects` | `ADMIN` | Creates a new engineering project |
| `PATCH` | `/api/v1/projects/:id` | `ADMIN` | Updates project details or financial settlements |
| `DELETE` | `/api/v1/projects/:id` | `ADMIN` | Deletes a project |
| `GET` | `/api/v1/projects/:id/milestones` | Authenticated | Retrieves milestones for a specific project |
| `POST` | `/api/v1/projects/:id/milestones` | `ADMIN` | Creates a milestone with locked baseline date |
| `PATCH` | `/api/v1/milestones/:id` | `ADMIN` | Updates milestone (forecast/status only — baseline date rejected) |
| `DELETE` | `/api/v1/milestones/:id` | `ADMIN` | Deletes a milestone |
| `GET` | `/api/v1/procurement` | Authenticated | Cross-project material tracker with generated `remainingQuantity` |
| `POST` | `/api/v1/projects/:id/procurement` | `ADMIN` | Allocates a material/equipment item to a project |
| `PATCH` | `/api/v1/procurement/:id` | `ADMIN` | Updates quantities or delivery status |
| `GET` | `/api/v1/contractors` | Authenticated | Directory of contractor evaluations with generated `overallScore` |
| `POST` | `/api/v1/contractors` | `ADMIN` | Creates evaluation across the 6 sub-scores |
| `PATCH` | `/api/v1/contractors/:id` | `ADMIN` | Updates evaluation sub-scores |
| `GET` | `/api/v1/audit` | `ADMIN` | Paginated audit trail records (filterable by `BASELINE_ATTEMPT`, `CREATE`, etc.) |

---

## 🔒 Security & Compliance Notes

1. **Token Storage:** JWT tokens are stored exclusively in secure, `httpOnly`, `sameSite: 'strict'` cookies to protect against Cross-Site Scripting (XSS).
2. **Rate Limiting:** Global rate limiting is configured at 100 requests per 15 minutes per IP.
3. **Surveillance & Auditing:** Any attempt to manipulate committed baseline dates is intercepted, blocked, and permanently recorded in the `audit_log` table with action `BASELINE_ATTEMPT`.
4. **Header Protection:** Helmet headers enforce Content-Security-Policy, prevent MIME-sniffing, and disable frame embedding.

---

## 📄 License

Internal Proprietary Software — **Suez Canal Bank (SCB)**. All rights reserved.
