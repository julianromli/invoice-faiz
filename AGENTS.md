# Repository Guidelines

## Project Structure & Module Organization
- pp/ hosts Next.js App Router routes, layouts, and server actions.
- components/ stores reusable client components; colocate variants in nested folders.
- lib/ contains TypeScript utilities such as utils.ts used by UI primitives.
- public/ serves static assets; keep exported icons and favicons here.
- .env.example documents required environment keys; mirror it in .env.local.

## Build, Test, and Development Commands
- un install installs dependencies; prefer Bun to stay aligned with the lockfile.
- un run dev starts the local dev server at http://localhost:3000.
- un run build compiles the production bundle within .next/.
- un run start serves the built application.
- un run lint runs the Next/ESLint suite; resolve warnings before opening a PR.

## Coding Style & Naming Conventions
- Write React components as typed function components with PascalCase filenames (e.g., InvoicePreview.tsx).
- Use 2-space indentation, TypeScript types, and double quotes per the existing sources.
- Compose Tailwind classes consistently and reuse helpers like cn for conditional styling.
- Export shared utilities from lib/ and avoid default exports for components.

## Testing Guidelines
- No automated suite exists yet; add Vitest + React Testing Library when covering business logic.
- Store tests near their subjects in __tests__/ folders and name files <feature>.test.tsx.
- For UI or PDF changes, include manual verification notes or screenshots in the PR description.

## Commit & Pull Request Guidelines
- Follow the short, present-tense pattern seen in history (e.g., Update README.md). Keep subjects under ~60 characters.
- Squash work-in-progress commits locally before pushing.
- Each PR should describe the change, reference related issues, and attach UI screenshots or sample PDFs when visuals shift.
- Confirm that un run lint and any added tests pass; note any skipped checks explicitly.

## Environment & Configuration Tips
- Never commit .env.local; instead, update .env.example when adding required keys.
- Regenerate API tokens only in development, and document usage in README.md or inline comments.
## Feature Notes
- /dashboard surfaces revenue analytics from local invoice history; metrics & filters are computed client-side via lib/analytics.
- Clipboard export uses html-to-image + utif; browsers that block TIFF fall back to PNG while keeping download available.
- Invoice history persists in lib/history with status tracking (paid, pending, overdue) and can be restored via useInvoiceHistory + InvoiceHistoryDialog on the new invoice flow.
- Invoice breakdown table on /dashboard now supports deleting invoices after confirmation, persisting via deleteInvoiceSnapshot.