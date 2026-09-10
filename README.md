# GitExplore

A fast, lightweight web workbench for exploring GitHub repositories, commit graphs, diffs, and developer activity in one place.

[![CI Pipeline](https://github.com/h4mcodes/Gitexplore/actions/workflows/ci.yml/badge.svg)](https://github.com/h4mcodes/Gitexplore/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0_Strict-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Why I Built This

When you're trying to understand a new repository or trace changes on GitHub, you usually end up with 10 different tabs open: one for the commit log, one for the file tree, one for the diff, and another for branch comparisons. It's easy to lose track of how commits connect or where a branch actually diverged.

GitExplore puts that workflow onto a single screen. You can search any GitHub user, browse their repositories, inspect branch histories, see parent/child commit graphs, review code diffs (side-by-side or unified), and compare branches without opening a dozen tabs.

---

## Features

### 👤 Profile & Repositories
- **User Lookup**: Search any public GitHub username to see their bio, stats, and repositories.
- **Filtering & Sorting**: Filter repos by language or search by name/description. Sort by stars, forks, recent updates, creation date, or name.
- **Overview Stats**: Quick summary cards showing total stars, forks, and repository counts.

### 🌿 Branches & Commit Lineage
- **Branch Browser**: Switch between branches, see default branch badges, and check protected status.
- **Commit History**: Clean commit list with author avatars, timestamps, commit messages, and SHA links.
- **Commit Relationship Graph (DAG)**: Visualizes parent and child relationships for each commit, automatically highlighting root commits and merge commits.

### 🔍 Diffs & Code Investigation
- **Commit Inspector**: Modal view showing everything that changed in a commit — authors, parent hashes, affected files, additions, and deletions.
- **Interactive Diff Viewer**: Toggle between unified (inline) and split (side-by-side) diffs with syntax highlighting.
- **Branch Comparison**: Compare two branches to see ahead/behind commit counts and the cumulative file diff.

### 📊 12-Month Heatmap & Activity Stream
- **Contribution Calendar**: Full 365-day grid showing daily contribution levels across all 12 months.
- **72-Hour Event Feed**: Rolling list of recent pushes, pull requests, issues, and star events with direct links to the relevant repository and commits.

### ⚡ Performance & Reliability
- **In-Memory Caching**: Caches GitHub API responses with smart TTLs (e.g. 15 mins for immutable commit details) and shares in-flight requests to save rate limits.
- **Rate Limit Tracking**: Tracks GitHub API limits (`x-ratelimit-*`) and shows a reset countdown if the unauthenticated 60 req/hr cap is reached.
- **Error Boundaries & Offline Detection**: Recovers gracefully from unexpected render issues and alerts you when your network goes offline.
- **Safe URLs**: Validates and sanitizes external links to keep navigation safe.

---

## Tech Stack

- **Frontend**: React 19, TypeScript (Strict Mode)
- **Tooling**: Vite 6, React Router 7
- **UI & Icons**: Vanilla CSS design tokens with frosted glass surfaces, Framer Motion, Lucide React
- **Data**: Native Fetch API with the public GitHub REST API (no backend or database required)
- **CI/CD**: GitHub Actions

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+

### Setup

```bash
# Clone the repository
git clone https://github.com/h4mcodes/Gitexplore.git
cd Gitexplore

# Install dependencies
npm ci

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
# Typecheck and build with Vite
npm run build

# Preview the production build locally
npm run preview
```

---

## Project Structure

```text
.github/
└── workflows/
    └── ci.yml                 # Build & TypeScript validation on push/PR
src/
├── components/
│   ├── BranchCompare.tsx      # Branch-to-branch comparison & diffs
│   ├── BranchExplorer.tsx     # Branch switcher & search
│   ├── CommitHistory.tsx      # Commit logs & DAG lineage drawer
│   ├── CommitInspection.tsx   # Single commit modal & patch details
│   ├── ContributionGraph.tsx  # 12-month heatmap & 72h event feed
│   ├── DiffViewer.tsx         # Unified & split diff renderer
│   ├── ErrorBoundary.tsx      # React error boundary with retry
│   ├── GlassDropdown.tsx      # Custom glass dropdown
│   ├── Navbar.tsx             # Top navigation bar
│   ├── NetworkStatusBanner.tsx# Offline/online status toast
│   ├── ProfileCard.tsx        # Profile preview card
│   ├── RepoCard.tsx           # Repository intelligence card
│   ├── SearchBar.tsx          # Search input with validation
│   └── StatsCard.tsx          # Metric cards (repos, stars, forks)
├── pages/
│   ├── Home.tsx               # Landing search page
│   └── Profile.tsx            # Main workbench page
├── services/
│   ├── githubApi.ts           # GitHub REST API client & caching logic
│   └── security.ts            # URL sanitization helpers
├── types/
│   └── github.ts              # TypeScript interfaces
├── App.tsx                    # Route definitions
├── main.tsx                   # React entry point
└── index.css                  # Design system tokens & layout styles
```

---

## Limitations

- **GitHub API Rate Limits**: Public requests are limited to 60 per hour per IP address by GitHub. In-memory caching helps keep request counts low.
- **Repository Scope**: The explorer currently loads the top 100 most recently updated public repositories for any given user.

---

## License

[MIT](LICENSE)
