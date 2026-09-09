# AGENTS.md — GitExplore Coding Agent Instructions

## 1. Project Identity & Direction

Project: **GitExplore**  
Identity: **Git Repository Intelligence & Management Platform**

GitExplore has evolved beyond a design-centric profile viewer into a serious developer platform built to solve real-world problems around exploring, analyzing, investigating, and managing Git repositories.

The product priority order is strictly:

```text
REAL PROBLEM
    ↓
USEFUL FUNCTIONALITY
    ↓
ENGINEERING SOLUTION
    ↓
GIT / REPOSITORY INTELLIGENCE
    ↓
PERFORMANCE + RELIABILITY
    ↓
UI POLISH
```

> **Mandatory Rule:** Do NOT revert GitExplore to the old design-centric GitHub profile explorer roadmap. The current source of truth is the problem-solving Git Repository Intelligence & Management Platform roadmap.

---

## 2. Core Problem We Are Solving

Developers working with unfamiliar, active, or complex repositories must manually navigate fragmented GitHub pages, branches, commit logs, and code diffs. This creates friction when trying to understand:

- How a repository evolved over time
- Where branches diverged and why
- How commits are bidirectionally related (parent <-> child DAG)
- What actually changed between commits and branches
- Why specific architectural or code changes occurred
- How team or contributor activity is structured

GitExplore progressively provides a centralized, high-density developer workbench for investigating and understanding repository intelligence.

*Note: Clearly distinguish implemented features from future roadmap items. Do not document planned functionality as completed.*

---

## 3. Agent Mission & Behavioral Rules

You are the implementation agent for GitExplore.

Your responsibilities:
1. **Solve Real Developer Problems**: Prioritize useful functionality, correctness, and developer utility over cosmetic decoration.
2. **Preserve Existing Working Code**: Day 1 through Day 4 implementations are complete and functional. Never delete, restart, or rewrite working functionality.
3. **Keep Architecture Simple**: Do not introduce unnecessary abstraction layers, external state management, or heavy frameworks.
4. **Use Real GitHub Data**: Work with real API data and model deterministic relationships.
5. **Maintain Strict TypeScript Quality**: Strict typing without `any` or suppressions.
6. **Strict Scope Control**: Implement only the requested feature. Do not refactor unrelated files.
7. **No Unnecessary Dependencies**: Leverage the existing stack before considering any new package.

---

## 4. Current Implementation Status (Day 1 – 4 Verified)

The codebase is the source of truth. The following milestones are implemented and verified:

### Day 1 — Foundation (Completed)
- React + TypeScript + Vite architecture
- Fast, accessible layout with dark/graphite and light frosted glass material themes
- Component foundation and responsive shell

### Day 2 — GitHub Profile Integration (Completed)
- Real GitHub profile REST API integration (`fetchGithubUser`)
- Username search with Enter-key and button triggers
- Client-side profile routing (`/profile/:username`)
- Real profile metadata (avatar, name, bio, company, location, blog, joined date, counts)
- Loading skeletons, empty states, and short actionable error messages

### Day 3 — Repository Intelligence Foundation (Completed)
- Repository REST API integration (`fetchGithubRepositories`)
- Multi-column repository grid with detailed cards (stars, forks, open issues, language, updated timestamps, external links)
- Real-time repository search filtering by name, description, and language
- Custom glass dropdowns for language filtering and multi-criteria sorting (Recently updated, Stars, Forks, Newest, Name)
- Real-time aggregate repository statistics (Loaded projects, Total stars, Total forks)
- Incremental loading ("Load more" pagination)

### Day 4 — Git History Intelligence (Completed)
- **Branch Explorer (`BranchExplorer.tsx`)**: Real-time branch fetching (`fetchGithubBranches`), default branch pinning, protected branch badges, instant branch search filtering.
- **Commit History Explorer (`CommitHistory.tsx`)**: Commit history fetching by branch (`fetchGithubCommits`), author metadata, avatars, timestamps, and commit SHA jump links.
- **Commit Relationship Graph Modeling (`buildCommitRelationshipModel`)**: Bidirectional parent-to-child DAG graph representation, merge commit identification, root commit detection, and interactive lineage inspection drawers.
- **Full 12-Month Contribution Calendar & Stream (`ContributionGraph.tsx`)**: Full 365-day contribution calendar matrix across all 12 distinct months (`fetchGithubContributions`), live event stream (`fetchGithubUserEvents`), category filtering (Pushes, PRs, Issues, Creates, Stars/Forks), and commit expanders.

---

## 5. Development Roadmap (Day 1 – 7)

```text
[✓] Day 1: Foundation (Project setup, UI system, responsive shell)
[✓] Day 2: GitHub Profile Integration (Real profile API, search, routing)
[✓] Day 3: Repository Intelligence Foundation (Repo explorer, filtering, sorting, stats)
[✓] Day 4: Git History Intelligence (Branches, commits, DAG relationships, activity)
[✓] Day 5: Change Investigation (Diff viewer, branch comparison, commit inspection)
[✓] Day 6: Reliability & Engineering (Caching, error boundaries, offline mode, perf optimization)
[ ] Day 7: Production Readiness (Planned)
```

### Day 5 — Change Investigation (Completed)
- Detailed commit inspection and patch review
- Code diff visualization and side-by-side / inline views
- Commit-to-commit and branch comparison
- Changed file trees and additions/deletions analysis
- Investigation workflows to trace why code changes occurred

### Day 6 — Reliability & Engineering (Completed)
- API request caching with TTLs and in-flight deduplication
- Rate-limit tracking and resilience banners
- React Error Boundaries with diagnostics and component recovery
- Offline/Degraded mode banner with real-time connectivity detection
- Security sanitization for URLs and user inputs
- Performance optimization: memoized diff card rendering, parsed patch caching, large diff chunking, and DAG graph memoization

### Day 7 — Production Readiness (Planned)
- CI/CD automation pipelines
- Production build validation and deployment
- Architecture and developer documentation
- Live demonstration workflows and final validation

---

## 6. Architecture & File Structure

Keep the architecture lean and flat:

```text
src/
├── assets/
├── components/
│   ├── BranchExplorer.tsx     # Branch listing, search, and switcher
│   ├── CommitHistory.tsx      # Commit log, DAG relationship inspection
│   ├── ContributionGraph.tsx  # 12-month heatmap matrix & event feed
│   ├── GlassDropdown.tsx      # Reusable accessible glass dropdown
│   ├── Navbar.tsx             # Brand header and quick navigation
│   ├── ProfileCard.tsx        # Profile preview primitive
│   ├── RepoCard.tsx           # Repository intelligence card
│   ├── SearchBar.tsx          # Username search input
│   └── StatsCard.tsx          # Stat metric card
├── pages/
│   ├── Home.tsx               # Focused search hero landing page
│   └── Profile.tsx            # Centralized repository workbench
├── services/
│   └── githubApi.ts           # Centralized GitHub REST API & graph logic
├── types/
│   └── github.ts              # Strict TypeScript models & interfaces
├── App.tsx                    # Route definitions
├── main.tsx                   # React root entrypoint
└── index.css                  # Design system tokens & utility styles
```

Do not introduce global state stores (Redux/Zustand), feature modules, or class repositories unless genuinely required.

---

## 7. Coding Standards & Technical Guidelines

### TypeScript
- Strict, explicit typing across all interfaces and functions.
- Every API response must map to a defined model in `src/types/github.ts`.
- Zero tolerance for `any` or unchecked type assertions.
- Do not suppress compiler errors with `@ts-ignore` or `@ts-nocheck`.

### React
- Functional components with strict single responsibilities.
- Keep API and network logic centralized in `src/services/githubApi.ts`.
- Prefer React standard hooks (`useState`, `useMemo`, `useEffect`, `useCallback`).
- Avoid premature component splitting or giant monolithic files.

### Styling & Design System
- Maintain the established **Linear × Vercel × GitHub** visual language.
- Use selective glassmorphism, translucent card surfaces, subtle borders, and balanced contrast.
- Ensure all interactive elements have visible focus-visible rings and smooth transitions.
- Eliminate layout shifts (`CLS`) and avoid nested `transform` GPU layers during scroll.

### API & Network
- Native Fetch API only (no Axios).
- Handle 404 (not found), network failures, empty collections, and rate limits gracefully.
- Never hardcode or expose private API tokens in client-side code.

### Error Handling
- Never use browser `alert()`.
- Use contextual, short, actionable in-UI error banners with retry capabilities.

---

## 8. Preservation & Editing Strategy

Before editing:
1. Inspect only the relevant files for the current task.
2. Formulate the minimal set of changes needed.
3. Preserve all existing working behavior from previous days.
4. Implement the feature simply and cleanly.
5. Verify build (`tsc -b && vite build`) with zero errors.
6. Verify UI behavior across mobile, tablet, and desktop viewports.

---

## 9. Final Principle

> **GitExplore is an engineering platform that solves real Git investigation problems with speed, precision, and reliable data.**
