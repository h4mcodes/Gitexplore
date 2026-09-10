# GitExplore — Skills & Tech Stack Reference

## 1. Project Identity & Vision

Project: **GitExplore**  
Identity: **Git Repository Intelligence & Management Platform**

### Product Vision
GitExplore exists to empower developers, engineering leads, and open-source contributors to quickly understand, analyze, and investigate Git repositories. Rather than acting merely as a cosmetic viewer, GitExplore provides actionable repository intelligence: uncovering commit lineage, branch divergence, author activity, and repository evolution through deterministic graph modeling and high-density developer tooling.

---

## 2. Core Problem We Are Solving

When developers onboard to unfamiliar codebases or review complex release branches, standard interfaces force them to context-switch across multiple web tabs, commit pages, and raw terminal commands. 

GitExplore directly addresses these core challenges:
- **Repository Architecture Discovery**: Quickly assessing active languages, stars, forks, issues, and activity recency.
- **Branch Topology & Switcher**: Inspecting branches, default branches, and protected status without leaving the repository view.
- **Commit History & Lineage**: Visualizing commit logs, authors, SHAs, and bidirectional parent-to-child relationships (DAGs) to identify merge commits and root origins.
- **Contribution Rhythm**: Analyzing 12-month contribution heatmaps and real-time event feeds to understand development cadence.

---

## 3. Technology Stack (Active & Verified)

Only active, verified technologies in the codebase are documented here:

### Frontend Core
- **React 19**: Component-based UI layer and reactive state management.
- **TypeScript 5 (Strict Mode)**: Strict compile-time typing for domain models, API schemas, and component interfaces.
- **Vite 6**: High-performance local development server and optimized production bundler.
- **React Router DOM 7**: Client-side single-page routing (`/` and `/profile/:username`).

### Styling & Interaction
- **Handcrafted CSS Material Design System**: Unified design system tokens, responsive grid layouts, and light frosted glass material styling in `src/index.css`.
- **Framer Motion**: Hardware-accelerated entrance transitions, accordion animations, and interactive feedback.
- **Lucide React**: Vector icons for Git branches, commits, forks, issues, external links, and navigation.

### Data, Security & Network
- **Native Fetch API**: Standard browser-native HTTP requests without external wrapper bloat.
- **GitHub REST API**: Public endpoints for users, repositories, branches, commits, comparisons, and events.
- **GitHub Contributions API**: Full 365-day historical contribution calendar integration.
- **In-Memory Caching & Request Deduplication**: Dynamic TTLs, in-flight promise sharing, and rate-limit tracking in `src/services/githubApi.ts`.
- **Security Sanitization**: Client-side URL validation and input sanitization in `src/services/security.ts`.

---

## 4. Current Verified Capabilities (Day 1 – 7)

### Day 1 — Foundation (Completed)
- Clean, responsive shell and component structure.
- Accessible glass design language (Linear × Vercel × GitHub aesthetics).
- Mobile-first responsive grid system.

### Day 2 — GitHub Profile Integration (Completed)
- Username search with instant validation and error messaging.
- Profile routing with dynamic parameters (`/profile/:username`).
- Real-time profile details (avatar, handle, bio, company, location, blog, join date, repository/follower stats).
- Skeleton loaders and resilient error handling.

### Day 3 — Repository Intelligence Foundation (Completed)
- Real-time repository exploration with multi-column responsive grid.
- Interactive search across repository names, descriptions, and languages.
- Dynamic language filter and multi-criteria sorting (Recently updated, Stars, Forks, Newest, Name).
- Real-time summary metrics (Total loaded projects, stars, forks).
- Incremental "Load More" pagination for large repository portfolios.

### Day 4 — Git History Intelligence (Completed)
- **Branch Explorer (`BranchExplorer.tsx`)**: Real branch fetching, default branch identification, protected status badges, and branch search.
- **Commit History Explorer (`CommitHistory.tsx`)**: Commit history inspection per branch with author details, commit messages, SHAs, and external GitHub links.
- **Bidirectional Commit Relationship Model (`buildCommitRelationshipModel`)**: Deterministic parent <-> child commit graph modeling, merge/root commit detection, and lineage inspection drawers.
- **12-Month Contribution Heatmap & Event Stream (`ContributionGraph.tsx`)**: Full 365-day calendar matrix across all 12 distinct months, rolling 72h event feed with direct commit navigation, and category filtering.

### Day 5 — Change Investigation (Completed)
- **Detailed Commit Inspection (`CommitInspection.tsx`)**: Deep modal view of commit metadata, author details, parent hashes, patch listings, and additions/deletions.
- **Code Diff Visualization (`DiffViewer.tsx`)**: Interactive diff renderer with side-by-side (split) and inline (unified) views, chunked line rendering, and syntax-aware diff highlights.
- **Branch Comparison (`BranchCompare.tsx`)**: Direct branch-to-branch divergence analysis showing ahead/behind counts, commit delta logs, and cumulative changed-file diffs.

### Day 6 — Reliability & Engineering (Completed)
- **API Caching & Request Deduplication**: In-memory caching with resource-specific TTLs (5m profiles, 3m repos, 15m immutable commits) and in-flight promise sharing.
- **Rate-Limit Resilience**: Centralized rate-limit tracker, header parser, and actionable reset countdown banners.
- **React Error Boundaries (`ErrorBoundary.tsx`)**: Component-level failure isolation with diagnostic logs, safe fallback UI, and recovery actions.
- **Offline / Degraded Mode (`NetworkStatusBanner.tsx`)**: Real-time browser connectivity detection with persistent reconnection alerts.
- **Input & URL Security Sanitization (`security.ts`)**: Protocol whitelisting (`http:`, `https:`) preventing `javascript:`, `data:`, and XSS injection vectors.

### Day 7 — Production Readiness (Completed)
- **CI/CD Quality Pipeline (`.github/workflows/ci.yml`)**: Automated GitHub Actions workflow enforcing `npm ci` and strict `npm run build` (`tsc -b && vite build`) validation.
- **Production Asset Optimization**: Verified production bundle generation, tree-shaking, and minification.
- **Documentation Synchronization**: Comprehensive `README.md`, updated engineering references, and clean repository hygiene.

---

## 5. Development Philosophy

1. **Problem-First Development**: Every component and function must solve a concrete developer pain point.
2. **Engineering Over Decoration**: Visual polish exists to enhance data clarity, not to serve as an end in itself.
3. **Flat & Simple Architecture**: Avoid premature state managers, factories, and unnecessary abstraction layers.
4. **Deterministic Real Data**: Build real models (e.g., DAG graphs, commit trees) using genuine API data.
5. **Zero-Fluff Dependencies**: Solve problems using React, TypeScript, and Native Web APIs before considering third-party packages.
6. **Performance & Reliability**: Keep initial bundle sizes small, avoid layout shifts (`CLS`), and eliminate GPU compositing thrashing during scrolling.

---

## 6. Completed Roadmap (Day 1 – 7)

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

## 7. Scope Control & Guardrails

Future coding agents must follow these strict guardrails:
- **Never Add "Feature Creep"**: Do not introduce random or unrequested features just to make the application appear larger.
- **Answer the Core Question**: Every proposed feature must answer: *"What real developer problem does this solve?"*
- **Preserve Day 1–7 Code**: Never delete, rewrite, or refactor working foundation code from completed milestones.
- **Preserve TypeScript Rigor**: Do not bypass typing with `any` or loose assertions.

---

## 8. Definition of Done

A feature is complete only when:
- It uses real data and models deterministic behavior.
- TypeScript compiles cleanly with zero errors (`tsc -b && vite build`).
- Loading, empty, and error states are handled gracefully.
- Responsive design works seamlessly across mobile, tablet, and desktop viewports.
- No unnecessary dependencies or architecture layers were introduced.
- Existing functionality remains fully operational.
