# AGENTS.md — GitExplore Coding Agent Instructions

## 1. Project Identity

Project: **GitExplore**

GitExplore is a frontend-only GitHub Profile Explorer built to look and behave like a polished developer product rather than a college/demo dashboard.

Primary stack:
- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- React Router DOM
- GitHub REST API
- Native Fetch API

Read `skills.md` before making significant implementation decisions. Treat it as the project's technology and design reference.

---

## 2. Agent Mission

You are the implementation agent for GitExplore.

Your job is to:
1. Implement requested features correctly.
2. Preserve the existing visual system.
3. Keep the architecture simple.
4. Use real GitHub data where the feature requires it.
5. Maintain TypeScript quality.
6. Avoid unnecessary dependencies and abstractions.
7. Never silently rewrite unrelated parts of the project.

Do not optimize for maximum code. Optimize for a clean, working product.

---

## 3. Scope Control

### Before changing code

First inspect:
- Existing project structure
- Relevant components
- Existing routes
- Existing services
- Existing types
- Existing styling
- `skills.md`

Only inspect files relevant to the current task.

### Important

Do **not** scan, rewrite, or refactor the entire repository for a small feature.

For example:
- A search feature should primarily affect the search UI, routing, API service, and relevant types.
- A profile feature should not trigger a redesign of unrelated repository/contribution components.
- A CSS adjustment should not cause unrelated TypeScript refactoring.

Keep changes localized.

---

## 4. Architecture

Use this simple structure:

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

Do not introduce feature folders, state-management layers, repositories, factories, hooks directories, or other architecture unless the existing application genuinely requires them.

Simple is intentional.

---

## 5. Coding Standards

### TypeScript

- Use strict, explicit types.
- Create interfaces/types for GitHub API data.
- Avoid `any`.
- Avoid unnecessary type assertions.
- Use meaningful names.
- Do not suppress TypeScript errors just to make the build pass.

### React

- Prefer functional components.
- Keep components focused.
- Avoid unnecessarily large components.
- Keep API/network logic out of presentation components.
- Use React hooks appropriately.
- Do not introduce global state management for local state problems.

### API

GitHub API calls belong in:

```text
src/services/githubApi.ts
```

Components should consume service functions rather than directly implementing API request logic.

Use the native Fetch API.

Do not add Axios unless explicitly requested or technically necessary.

### Routing

Use React Router DOM.

Current intended routes:

```text
/                  → Home
/profile/:username → Profile
```

Do not add routes without a product requirement.

---

## 6. UI / Design System

GitExplore should feel like:

> Linear × Vercel × GitHub

Visual direction:
- Deep black/graphite background
- Subtle blue/purple ambient lighting
- Selective glassmorphism
- Translucent cards
- Backdrop blur
- Thin low-contrast borders
- Soft shadows
- Clean white/off-white typography
- Restrained GitHub-green accents
- Strong spacing and hierarchy
- Responsive layouts

### Glassmorphism rule

Glass should create hierarchy, not cover everything.

Use:
- Main glass surfaces
- Secondary glass cards
- Subtle borders
- Controlled blur

Avoid:
- Every element being glass
- Heavy neon effects
- Excessive transparency
- Overly bright gradients
- Generic dashboard aesthetics

### Animation

Use Framer Motion for:
- Page entrance
- Card entrance
- Hover states
- Transitions
- Subtle loading transitions

Animations must be:
- Fast
- Smooth
- Subtle
- Functional

No unnecessary bouncing, spinning, or flashy animations.

---

## 7. Responsive Design

Every UI change must consider:

- Desktop
- Tablet
- Mobile

Do not treat mobile responsiveness as a final cleanup step.

Check:
- Text wrapping
- Card width
- Navigation
- Search input
- Buttons
- Grid layouts
- Avatar sizing
- Touch targets
- Horizontal overflow

Never introduce intentional horizontal scrolling on normal pages.

---

## 8. Accessibility

Maintain basic accessibility:

- Use semantic HTML.
- Buttons should be buttons.
- Links should be links.
- Images require useful `alt` text.
- Interactive elements need visible focus states.
- Keyboard navigation should work.
- Do not rely only on color to communicate state.
- Loading/error states should be understandable.

---

## 9. GitHub API Rules

For profile functionality, support data such as:

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

Handle:
- Empty username
- User not found
- Network/API failure
- Unexpected API response
- Loading state

Never expose private API keys or secrets in frontend source code.

Public GitHub API usage should not require inventing authentication.

---

## 10. Error Handling

Never use browser `alert()` for application errors.

Use the existing GitExplore visual language for:
- Error messages
- Empty states
- Loading states

Examples of intended messaging:

```text
Please enter a GitHub username.
```

```text
We couldn't find that GitHub profile.
```

```text
Something went wrong. Please try again.
```

Keep error messages short and actionable.

---

## 11. Dependency Policy

Do not install packages automatically just because they might be convenient.

Prefer the current stack.

Avoid adding:
- Redux
- Axios
- Another UI framework
- Another icon library
- Another animation library
- Backend frameworks
- Database libraries

Before adding a dependency, ask:

> Can the existing stack solve this cleanly?

If yes, do not add the dependency.

---

## 12. Feature Boundaries

Respect the current development stage.

### Day 1
Setup + glass UI foundation.

### Day 2
GitHub profile search and profile page.

### Day 3
Repository explorer.

### Day 4
Contributions/activity.

### Day 5
Developer analytics.

### Day 6
UX polish, accessibility, responsiveness, performance.

### Day 7
Production cleanup, README, deployment, final testing.

Do not implement future-day features unless explicitly requested.

### Current Project Status — September 4, 2026

Day 2 is complete. GitExplore now supports GitHub username search, profile routing, real public GitHub profile data, loading states, error states, profile links, and responsive profile UI.

The next planned task is to remove the demo dashboard preview card from the landing page. Treat that as the first Day 3 task and do not remove it or implement other Day 3 features early.

---

## 13. Current Day 2 Boundary

If the task is Day 2, focus only on:

- GitHub REST API integration
- Username search
- Enter-key search
- Profile route
- Real profile data
- Profile UI
- Loading skeleton
- Error states
- Back navigation
- External GitHub/website links
- TypeScript API types
- Responsive behavior

Do NOT implement:
- Repository explorer
- Contribution graph
- Analytics
- Charts
- Authentication
- Backend
- Database

---

## 14. Editing Strategy

Before editing:
1. Understand the existing implementation.
2. Identify the smallest set of files that need changes.
3. Preserve existing working behavior.
4. Implement the feature.
5. Run the project's available checks/build.
6. Fix issues caused by your changes.
7. Review the final diff mentally/file-by-file.

Do not perform unrelated cleanup during feature work.

---

## 15. Existing UI Preservation

When adding functionality to an existing UI:

**Preserve the current design unless the task explicitly asks for a redesign.**

Do not:
- Replace the whole page unnecessarily.
- Change established spacing randomly.
- Change the color system.
- Replace working components without reason.
- Remove animations that already work.
- Rewrite Tailwind classes just for personal preference.

New UI must look native to GitExplore.

---

## 16. Code Quality

Prefer:

```text
simple → readable → maintainable
```

over:

```text
abstract → clever → complicated
```

Avoid:
- Premature abstraction
- Duplicate API logic
- Giant components
- Deep prop chains when unnecessary
- Magic constants scattered throughout the code
- Dead code
- Commenting obvious code

Comments should explain **why**, not restate **what** the code does.

---

## 17. Validation

After implementation, verify as applicable:

### Build
- TypeScript compilation succeeds.
- Production build succeeds.

### UI
- Search works.
- Enter key works.
- Loading state appears.
- Error state appears.
- Profile data renders.
- Links work.
- Back navigation works.
- Mobile layout works.

### API
Test with:
- A known valid GitHub username.
- A nonexistent username.
- Empty input.
- Network/API failure if practical.

Do not claim a feature works unless it has been reasonably validated.

---

## 18. Git Discipline

Make changes in meaningful increments.

For the Day 2 milestone, the intended commit is:

```text
feat: add GitHub profile explorer
```

Do not create fake commits or artificial changes merely to generate GitHub contribution activity.

Git history should represent real work.

---

## 19. Agent Communication

Before implementation, briefly state:
- What you found.
- What files you expect to change.
- What you will not change.

During implementation:
- Stay within scope.
- Do not ask unnecessary questions when the requirement is already clear.
- If an assumption is required, choose the simplest reasonable implementation.

After implementation, report:
1. What was implemented.
2. Files changed.
3. Validation performed.
4. Any remaining limitation.

Keep reports concise.

---

## 20. Final Principle

> GitExplore is a polished frontend product, not an architecture showcase.

Build the smallest clean solution that produces a real, reliable, premium-looking experience.
