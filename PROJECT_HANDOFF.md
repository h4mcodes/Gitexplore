# GitExplore — Project Handoff

This document is the source of truth for the completed GitExplore work. Read it together with `AGENTS.md` and `skills.md` before changing the application. Preserve the existing implementation unless a requested feature genuinely requires a change.

## Project at a glance

- **Product:** GitExplore, a frontend-only GitHub profile and repository explorer.
- **Runtime:** React 19, TypeScript, Vite, React Router DOM, Framer Motion, Lucide React, and the native Fetch API.
- **No backend, database, authentication, OAuth, API key, Axios, Redux, UI framework, or additional state library exists or is needed.**
- **Start locally:** `npm run dev`
- **Validate:** `npm run build` (runs TypeScript compilation and the Vite production build).
- **Routes:** `/` for the landing/search page and `/profile/:username` for a developer profile.

## Completed work

### Day 1 — UI foundation

- Vite/React/TypeScript application scaffolded.
- GitExplore navbar, branded hero, search form, responsive layout, ambient background, glass/frosted surfaces, and Framer Motion entrances added.
- The landing page includes a static visual dashboard preview. Its `ProfileCard`, `ContributionGraph`, and preview form of `RepoCard` are intentionally demo-only visual content; they do **not** make GitHub API calls.
- The footer’s former `UI foundation / 01` label was intentionally removed. Do not restore it unless requested.

### Day 2 — GitHub profile explorer

- Username search trims input, prevents empty submissions with an inline error, and navigates on form submit (including Enter) to `/profile/:username`.
- Real public GitHub profile data is requested with `fetchGithubUser`.
- The profile page supports skeleton loading, not-found, generic failure, retry, back navigation, GitHub profile links, optional website links, profile metadata, and responsive layouts.
- The profile API model is `GithubUser` in `src/types/github.ts`.

### Day 3 — Repository explorer (complete)

- Real public repositories are requested through `fetchGithubRepositories` in `src/services/githubApi.ts`.
- `GithubRepository` contains only the fields used by the UI: id, names, description, links, language, stars, forks, issues, visibility/private state, dates, and default branch.
- The service uses GitHub’s public `users/:username/repos` endpoint with `per_page=100&sort=updated`. The current explorer therefore operates on the first 100 repositories returned by GitHub, sorted by most recently updated. Repository stats are explicitly labelled as **loaded** values for this reason.
- Repository cards show name, optional description, language fallback, stars, forks, open issues, visibility, last updated date, optional homepage, and GitHub link.
- Homepage URLs without a protocol are normalized to `https://` before opening.
- Repository skeleton cards, a no-public-repositories state, and a retryable repository error state are implemented.
- Search works client-side against repository name, full name, description, and language. It trims whitespace and never triggers API requests.
- Language options are generated from the currently loaded repositories; they are not hardcoded. Repositories with no language still render using a fallback and simply do not create a language filter option.
- Sorting is client-side: recently updated, most stars, most forks, newest, and name.
- Search, language filtering, and sorting compose together without mutating the original fetched collection.
- No-results UI provides a clear-filter action.
- Only 12 filtered repositories render initially. **Load more** reveals another 12 without refetching and disappears when every matching repository is visible.
- Changing the search, language, sort, or clearing filters resets the visible batch to 12.
- Aggregate repository cards show loaded repository count, total stars, and total forks, calculated locally from the loaded collection.

## Important implementation map

| File | Responsibility / constraints |
| --- | --- |
| `src/main.tsx` | StrictMode entry point and global stylesheet import. |
| `src/App.tsx` | Only the two intended routes. Do not add routes without a product requirement. |
| `src/pages/Home.tsx` | Landing page, hero, search entry point, and static dashboard preview. |
| `src/pages/Profile.tsx` | Owns profile/repository request state and all repository explorer state. Raw Fetch code must not be placed here. |
| `src/services/githubApi.ts` | Sole home for GitHub REST requests and response validation. Exports `GithubApiError`, `fetchGithubUser`, and `fetchGithubRepositories`. |
| `src/types/github.ts` | Typed public GitHub API shapes. Avoid `any` and avoid bloating the types with unused API fields. |
| `src/components/SearchBar.tsx` | Search form, empty-input validation, and navigation. |
| `src/components/RepoCard.tsx` | Has two intentional modes: a static landing-page preview mode and a typed real-repository mode (`repository` + `index`). Preserve both when editing. |
| `src/components/StatsCard.tsx` | Reused for profile and repository aggregate statistics. |
| `src/components/Navbar.tsx` | Shared branded header. |
| `src/index.css` | All current styling, responsive rules, theme overrides, skeletons, repository cards, controls, and motion-support styling. |

## Current UI and styling facts

- Although early project notes mention a dark graphite direction, the **current rendered design is a light frosted blue/peach material theme**. The final `/* Light frosted material theme */` block near the end of `src/index.css` intentionally overrides the earlier dark foundation. Preserve the actual rendered light theme unless a redesign is explicitly requested.
- The application uses handcrafted class-based CSS in `src/index.css`; Tailwind is not configured in `package.json`. Do not introduce Tailwind setup or a second styling system without an explicit migration request.
- Existing visual language: translucent white-blue cards, controlled backdrop blur, fine low-contrast borders, muted blue typography, soft shadows, and restrained motion.
- Repository cards use a two-column grid on desktop and a single column at `680px` and below. Filter controls stack on small screens; aggregate cards stack at `450px` and below.
- Focus states exist for repository actions, the search field, selects, retry, clear, and load-more controls. Preserve semantic buttons and links.

## Data and error-flow rules

- API functions validate unknown JSON before returning typed data.
- `GithubApiError.kind` values are `not-found`, `unexpected`, and `network`.
- A missing GitHub user maps to the profile not-found state. Repository errors do **not** replace a successfully loaded profile; they show the repository retry state instead.
- Repository request and UI state must remain separate from the core profile state.
- Use public GitHub data only. Never introduce client-side secrets or invented authentication.
- Do not use browser `alert()` for errors.

### Day 4 — Git history intelligence (complete)

- **Branch Explorer (`BranchExplorer.tsx`)**: Fetches repository branches (`fetchGithubBranches`), marks default branch, highlights protected branches, and offers instant client-side search.
- **Commit History (`CommitHistory.tsx`)**: Fetches branch commits (`fetchGithubCommits`), author details, commit messages, SHAs, and timestamp formatting.
- **Bidirectional Parent-Child DAG Graph (`buildCommitRelationshipModel`)**: Deterministic graph modeling classifying merge commits, root commits, commit lineage, and interactive branch-out drawers.
- **Full 12-Month Contribution Calendar (`ContributionGraph.tsx`)**: Full 365-day calendar matrix across all 12 distinct months with intensity levels, rolling 72-hour activity feed, category filtering, and direct commit jump navigation.

### Day 5 — Change investigation (complete)

- **Commit Inspection (`CommitInspection.tsx`)**: Modal commit inspection reviewing commit metadata, parent hashes, patch summaries, and additions/deletions stats.
- **Code Diff Visualization (`DiffViewer.tsx`)**: Interactive diff renderer with side-by-side (split) and inline (unified) views, chunked line rendering, and syntax-aware diff highlights.
- **Branch Comparison (`BranchCompare.tsx`)**: Direct branch-to-branch divergence comparison showing ahead/behind counts, commit delta logs, and cumulative changed-file diffs.

### Day 6 — Reliability & engineering (complete)

- **API Caching & Request Deduplication**: In-memory caching with resource-specific TTLs (5m profiles, 3m repos, 15m immutable commits) and in-flight promise sharing in `src/services/githubApi.ts`.
- **Rate-Limit Resilience**: Centralized rate-limit tracker, header parser, and actionable reset countdown banners.
- **React Error Boundaries (`ErrorBoundary.tsx`)**: Component-level failure isolation with diagnostic logs, safe fallback UI, and recovery actions.
- **Offline / Degraded Mode (`NetworkStatusBanner.tsx`)**: Real-time browser connectivity detection with persistent reconnection alerts.
- **Input & URL Security Sanitization (`security.ts`)**: Protocol whitelisting (`http:`, `https:`) preventing `javascript:`, `data:`, and XSS injection vectors.

### Day 7 — Production readiness (complete)

- **CI/CD Quality Pipeline (`.github/workflows/ci.yml`)**: Automated GitHub Actions workflow enforcing `npm ci` and strict `npm run build` (`tsc -b && vite build`) validation.
- **Production Asset Optimization**: Verified production bundle generation, tree-shaking, and minification.
- **Documentation Synchronization**: Comprehensive `README.md`, updated engineering references, and clean repository hygiene.

## Important implementation map

| File | Responsibility / constraints |
| --- | --- |
| `src/main.tsx` | StrictMode entry point and global stylesheet import. |
| `src/App.tsx` | Global ErrorBoundary, NetworkStatusBanner, and client-side route definitions. |
| `src/pages/Home.tsx` | Landing page, hero, search entry point, and static dashboard preview. |
| `src/pages/Profile.tsx` | Owns profile/repository request state, filtering, sorting, pagination, and workbench orchestration. |
| `src/components/BranchCompare.tsx` | Branch-to-branch commit & file comparison. |
| `src/components/BranchExplorer.tsx` | Branch listing, search, switcher, and commit trigger. |
| `src/components/CommitHistory.tsx` | Branch commit log, DAG lineage inspection, and inspection trigger. |
| `src/components/CommitInspection.tsx` | Detailed commit modal and file patch review. |
| `src/components/ContributionGraph.tsx` | 12-month calendar heatmap matrix and 72h rolling event feed. |
| `src/components/DiffViewer.tsx` | Side-by-side and inline unified patch diff renderer. |
| `src/components/ErrorBoundary.tsx` | React error boundary with diagnostic feedback and recovery. |
| `src/components/GlassDropdown.tsx` | Reusable frosted glass dropdown. |
| `src/components/Navbar.tsx` | Shared branded header. |
| `src/components/NetworkStatusBanner.tsx` | Real-time offline/online connectivity detector. |
| `src/components/ProfileCard.tsx` | Profile preview primitive. |
| `src/components/RepoCard.tsx` | Repository intelligence card with embedded branch and history views. |
| `src/components/SearchBar.tsx` | Search form with empty-input validation and navigation. |
| `src/components/StatsCard.tsx` | Reused for profile and repository aggregate statistics. |
| `src/services/githubApi.ts` | Centralized GitHub REST API, in-memory caching, TTL management, and graph logic. |
| `src/services/security.ts` | URL sanitization and input validation utilities. |
| `src/types/github.ts` | Strict domain models and TypeScript interfaces. |
| `src/index.css` | Design system tokens, light frosted glass theme, responsive layout, and animations. |
| `.github/workflows/ci.yml` | GitHub Actions automated typecheck and build validation workflow. |
