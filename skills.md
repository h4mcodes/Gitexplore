# GitExplore — Skills & Tech Stack

## Project
GitExplore is a frontend GitHub Profile Explorer built with React and TypeScript. It searches GitHub developers and presents profile, repository, contribution, and analytics information.

## Core Stack

### React
**Role:** Frontend UI framework

Use React for components, reusable UI, page views, state, and rendering GitHub data.

### TypeScript
**Role:** Type safety

Use TypeScript for API response types, component props, state, and function signatures.

**Rule:** Avoid `any` unless technically unavoidable.

### Vite
**Role:** Development and production build tooling

Keep Vite configuration simple unless a real requirement needs customization.

### Tailwind CSS
**Role:** Styling and responsive design

Use Tailwind for layout, typography, spacing, responsive behavior, dark theme, glassmorphism, hover/focus states, and visual polish.

**Visual direction:** Linear × Vercel × GitHub.

- Deep black/graphite background
- Subtle blue/purple ambient glow
- Selective glassmorphism
- Translucent surfaces and backdrop blur
- Thin subtle borders and soft shadows
- Clean white/off-white typography
- GitHub green used sparingly
- Strong visual hierarchy
- Responsive desktop/tablet/mobile design

Avoid excessive neon, excessive glass, generic dashboards, clutter, and unnecessary effects.

### Framer Motion
**Role:** Animation

Use for subtle page/card entrances, transitions, hover interactions, and loading transitions.

Motion should improve perceived quality, not distract from content.

### Lucide React
**Role:** Icons

Use for search, navigation, external links, GitHub, location, website, repository, followers/following, and interface icons.

Do not add another icon library without a real requirement.

### React Router DOM
**Role:** Client-side routing

Required routes:

```text
/                  → Home
/profile/:username → GitHub Profile
```

Support direct profile URLs and browser navigation without creating unnecessary routes.

### GitHub REST API
**Role:** Public GitHub data source

Profile functionality should retrieve:

- Avatar
- Username
- Name
- Bio
- Location
- Company
- Website
- Followers
- Following
- Public repositories
- Account creation date
- GitHub profile URL

Later stages can add repositories, contributions, and analytics.

### Fetch API
**Role:** HTTP requests

Use native browser `fetch()` for GitHub API calls.

Do not add Axios unless a genuine requirement appears.

Keep API logic in:

```text
src/services/githubApi.ts
```

## Project Structure

Keep the architecture simple:

```text
src/
├── assets/
├── components/
│   ├── Navbar.tsx
│   ├── SearchBar.tsx
│   ├── ProfileCard.tsx
│   ├── RepoCard.tsx
│   ├── StatsCard.tsx
│   └── ContributionGraph.tsx
├── pages/
│   ├── Home.tsx
│   └── Profile.tsx
├── services/
│   └── githubApi.ts
├── types/
│   └── github.ts
├── App.tsx
├── main.tsx
└── index.css
```

Do not over-engineer the folder structure.

## Engineering Rules

### Components
- Keep components focused.
- Avoid giant components.
- Reuse components where appropriate.
- Keep API logic outside UI components.

### TypeScript
- Define interfaces/types for GitHub API responses.
- Avoid unnecessary `any`.
- Keep domain types organized.

### API
- Centralize GitHub requests.
- Handle loading, errors, invalid usernames, and unexpected responses.
- Never expose private secrets in frontend code.

### UI
- Maintain the established GitExplore visual language.
- Design responsively from the beginning.
- Use semantic HTML.
- Provide visible focus states.
- Keep interactive elements keyboard accessible.

### Error States
Handle:
1. Empty username
2. User not found
3. Network/API failure
4. Unexpected API response

Do not use browser `alert()` for application errors.

## Dependency Policy

### Required
- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- React Router DOM

### Native
- Fetch API

### Avoid
- Redux
- Axios
- UI component frameworks
- Multiple animation libraries
- Multiple icon libraries
- Backend frameworks
- Database libraries

Add dependencies only when they solve a real requirement.

## Development Scope

### Day 1
Setup, project structure, glassmorphism foundation, landing page, search UI, responsive foundation.

### Day 2
GitHub API, username search, profile route, real profile data, loading skeletons, errors, profile UI.

### Day 3
Repository explorer, repository cards, search/filter, sorting, load more.

### Day 4
Contribution/activity visualization.

### Day 5
Developer analytics.

### Day 6
UX polish, accessibility, responsive refinement, performance.

### Day 7
Production cleanup, README, deployment, final testing.

## Current Project Status

Day 2 is complete. The app has real GitHub profile search, profile routing, public profile data, loading and error states, external profile links, and responsive profile UI.

Next task: remove the demo dashboard preview card from the landing page at the start of Day 3. Do not remove it before that task or implement the remaining Day 3+ features early.

## Definition of Done

A feature is complete only when:

- It works with real data where applicable.
- TypeScript has no unnecessary `any`.
- Loading/error/empty states are handled.
- UI follows the GitExplore design system.
- It works on mobile and desktop.
- No unnecessary dependency was introduced.
- Code remains readable.
- Existing functionality is not broken.

## Engineering Principle

> Build simple. Keep responsibilities separated. Add complexity only when the project actually needs it.
