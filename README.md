# GitExplore — Git Repository Intelligence & Management Platform

[![CI Pipeline](https://github.com/h4mcodes/Gitexplore/actions/workflows/ci.yml/badge.svg)](https://github.com/h4mcodes/Gitexplore/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0_Strict-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **GitExplore** is a developer-focused repository intelligence and investigation platform. It eliminates the friction of navigating fragmented GitHub pages, branches, commit logs, and code diffs by consolidating deep repository analytics into a unified, high-density developer workbench.

---

## 1. The Core Problem We Solve

When developers explore unfamiliar codebases, triage regressions, or review complex release branches, standard web interfaces force them to constantly context-switch across multiple tabs:
- Jumping back and forth between commit histories, file lists, and diff pages.
- Manually tracing branch divergences and parent/child commit relationships.
- Losing context on why specific code changes occurred or which commits merged into a release.
- Navigating unoptimized interfaces under restrictive public API rate limits.

**GitExplore brings full Git repository intelligence into a single interface**, allowing engineers to inspect commit lineage DAGs, review unified and split diffs, compare branches, and track author contribution cadence without ever leaving the workbench.

---

## 2. Core Capabilities

### 🔍 Profile & Repository Intelligence
- **Real-Time Profile Discovery**: Live lookup for any public GitHub handle with metadata (avatar, bio, company, location, blog, creation date, public repo count, follower stats).
- **Multi-Column Repository Grid**: Responsive repository cards displaying primary languages, star counts, forks, open issue metrics, and last-updated timestamps.
- **Client-Side Search & Multi-Criteria Sorting**: Filter repositories by name, description, or language. Sort by recently updated, stars, forks, newest, or alphabetically.
- **Aggregate Metrics**: Real-time rollups of loaded repositories, aggregate stars, and total forks.
- **Incremental Pagination**: Efficient 12-item batch rendering with "Load more" pagination.

### 🌿 Branch & Commit Topology
- **Branch Explorer**: Instant branch listings per repository with default branch identification, protected branch badges, and real-time branch search.
- **Commit History & Lineage**: Branch-specific commit logs with author metadata, avatars, relative/absolute timestamps, and SHA jump links.
- **Deterministic Commit DAG Modeling**: Bidirectional parent $\leftrightarrow$ child commit relationship modeling. Automatically identifies **root commits**, **merge commits**, and provides interactive lineage exploration drawers.

### 🔬 Change Investigation & Diff Analysis
- **Detailed Commit Inspection**: Deep modal analysis displaying commit SHAs, parent hashes, committer details, and per-file change summaries.
- **Interactive Code Diff Viewer**: Side-by-side (split) and inline (unified) diff views with syntax-aware line additions/deletions highlighting and chunked rendering.
- **Branch Comparison**: Direct branch-to-branch divergence comparison showing ahead/behind counts, delta commit logs, and cumulative changed-file diffs.

### 📅 12-Month Contribution Rhythm & Event Feed
- **Full 365-Day Calendar Heatmap**: Complete 12-month contribution matrix with standardized intensity tiers.
- **Rolling 72-Hour Event Stream**: Live contributor activity stream with category filtering (Pushes, Pull Requests, Issues, Creates, Stars/Forks) and direct commit jump navigation.

### 🛡️ Reliability, Security & Performance
- **In-Memory Caching & Request Deduplication**: Resource-specific TTLs (5m profiles, 3m repos, 15m immutable commits) and in-flight promise sharing.
- **Rate-Limit Resilience**: Dynamic tracking of GitHub API rate limits (`x-ratelimit-*`) with actionable reset countdowns.
- **React Error Boundaries**: Component-level fault isolation with diagnostic logs and one-click recovery.
- **Network Connectivity Detection**: Real-time offline/online status banners.
- **Strict Security Sanitization**: URL protocol whitelisting (`http:`, `https:`) preventing `javascript:`, `data:`, and XSS injection vectors.

---

## 3. Technology Stack

- **Framework**: React 19
- **Language**: TypeScript 5 (Strict Mode, zero `any` policy)
- **Bundler & Dev Server**: Vite 6
- **Routing**: React Router DOM 7 (`/` and `/profile/:username`)
- **Styling**: Handcrafted CSS Design System with light frosted glass material tokens (`src/index.css`)
- **Motion & Icons**: Framer Motion & Lucide React
- **Network**: Native Fetch API (zero external HTTP wrapper bloat)
- **CI/CD**: GitHub Actions

---

## 4. Architecture & File Structure

```text
.github/
└── workflows/
    └── ci.yml                 # Automated build and typecheck CI workflow
src/
├── assets/                    # Static brand assets
├── components/
│   ├── BranchCompare.tsx      # Branch-to-branch commit & file comparison
│   ├── BranchExplorer.tsx     # Branch listing, search, and switcher
│   ├── CommitHistory.tsx      # Commit log, DAG relationship inspection
│   ├── CommitInspection.tsx   # Detailed single commit modal & patch review
│   ├── ContributionGraph.tsx  # 12-month heatmap matrix & 72h event feed
│   ├── DiffViewer.tsx         # Unified & split side-by-side diff renderer
│   ├── ErrorBoundary.tsx      # React error boundary with diagnostic recovery
│   ├── GlassDropdown.tsx      # Reusable accessible frosted glass dropdown
│   ├── Navbar.tsx             # Brand header and quick navigation
│   ├── NetworkStatusBanner.tsx# Real-time online/offline connectivity banner
│   ├── ProfileCard.tsx        # Profile preview primitive
│   ├── RepoCard.tsx           # Repository intelligence card
│   ├── SearchBar.tsx          # Username search input with validation
│   └── StatsCard.tsx          # Stat metric card
├── pages/
│   ├── Home.tsx               # Focused search hero landing page
│   └── Profile.tsx            # Centralized repository workbench
├── services/
│   ├── githubApi.ts           # Centralized GitHub REST API, caching & graph logic
│   └── security.ts            # URL sanitization & input safety utilities
├── types/
│   └── github.ts              # Strict TypeScript models & domain interfaces
├── App.tsx                    # Route definitions and global error handling
├── main.tsx                   # React root entrypoint
└── index.css                  # Design system tokens & utility styles
```

---

## 5. Getting Started

### Prerequisites
- **Node.js**: `v20+` or `v22+`
- **npm**: `v10+`

### Installation
```bash
# Clone repository
git clone https://github.com/h4mcodes/Gitexplore.git
cd Gitexplore

# Install dependencies
npm ci
```

### Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Production Build & Validation
```bash
npm run build
```
Executes TypeScript typechecking (`tsc -b`) followed by Vite production bundling.

### Local Preview of Production Build
```bash
npm run preview
```

---

## 6. CI/CD & Automated Quality Gates

GitExplore includes an automated GitHub Actions pipeline located at [`.github/workflows/ci.yml`](.github/workflows/ci.yml):
- **Triggers**: Every push to `main` and pull request targeting `main`.
- **Quality Gates**:
  1. Clean dependency lockfile resolution (`npm ci`)
  2. Strict TypeScript typechecking (`tsc -b`)
  3. Production asset compilation (`vite build`)

---

## 7. Known Limitations

- **GitHub REST API Rate Limits**: Public, unauthenticated client requests to GitHub's REST API are subject to GitHub's standard limit of 60 requests per hour per IP. GitExplore minimizes consumption via local in-memory caching and request deduplication.
- **Loaded Repositories Boundary**: Public repository exploration operates on the top 100 most recently updated repositories per developer.
- **Client-Side Architecture**: Designed as a zero-backend, zero-database client application for direct, private developer exploration.

---

## 8. Milestone Roadmap Status

```text
[✓] Day 1: Foundation (Project setup, UI system, responsive shell)
[✓] Day 2: GitHub Profile Integration (Real profile API, search, routing)
[✓] Day 3: Repository Intelligence Foundation (Repo explorer, filtering, sorting, stats)
[✓] Day 4: Git History Intelligence (Branches, commits, DAG relationships, activity)
[✓] Day 5: Change Investigation (Diff viewer, branch comparison, commit inspection)
[✓] Day 6: Reliability & Engineering (Caching, error boundaries, offline mode, perf optimization)
[✓] Day 7: Production Readiness (CI/CD pipeline, build audit, documentation, release validation)
```

---

## 9. License

MIT License. Designed and engineered for the developer community.
