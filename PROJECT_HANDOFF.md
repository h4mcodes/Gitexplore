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

## Known boundary and future work

- The completed Day 3 scope ends at the repository explorer. Do not add contribution heatmaps, activity charts, analytics, commit history, authentication, backend services, databases, AI features, or deployment work unless specifically requested.
- The existing landing-page dashboard preview remains static. It is not a real contribution graph or analytics feature.
- If a future requirement needs every repository beyond GitHub’s 100-item page limit, extend `fetchGithubRepositories` with explicit pagination and revisit wording/statistics that currently say “loaded.” Do not silently claim totals represent every repository for users with more than 100.

## Change discipline for the next agent

1. Read `AGENTS.md`, `skills.md`, and this file before implementation.
2. Inspect only files relevant to the requested change; do not rewrite the project for a small feature.
3. Keep raw network logic in `src/services/githubApi.ts` and typed API shapes in `src/types/github.ts`.
4. Preserve the two existing routes, the profile flow, the real repository flow, and the visual system.
5. Prefer React local state and the installed dependencies. Do not add packages merely for convenience.
6. Do not change or remove the static home preview unless the request explicitly names it.
7. For UI work, check desktop and mobile behavior, long text, missing repository fields, loading, empty, and error cases as relevant.
8. Run `npm run build` and `git diff --check` after implementation. Do not claim validation that was not performed.
9. Do not create commits, push, or modify unrelated files without explicit user direction.

## Recent validated milestones

- `3c2f5e2` — repository API feature.
- `bfccda6` — real repository rendering, loading/error/empty states, and responsive cards.
- `97ee0d1` — client-side repository search, language filter, and sorting.
- `a58b7c4` — 12-item load more, repository aggregate stats, and Day 3 polish.
- The latest completed production validation was `npm run build`; it passed after the Day 3 final milestone.

## Current handoff state

The working tree was clean when this handoff document was created, apart from this new file. The complete existing product behavior is intentional. Treat this as a continuation project, not a fresh scaffold.
