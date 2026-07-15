# Agent Preferences

## Autonomy
- Proceed with all file edits, builds, and git operations without asking for confirmation.
- Run `npm run build` after every code change to verify correctness.
- Commit and push to `master` when the user asks to upload or deploy.
- Deploy via `npm run build` then `npx gh-pages -d dist` when asked to deploy.

## Style
- Always use Firebase (never Supabase).
- Keep the hand-drawn UI style: wobbly borders, hard shadows, sticky notes.
- All UI text in Traditional Chinese (繁體中文).
- Match existing code style and conventions — do not introduce new libraries.

## Git
- Commit message format: `feat: <short description>` or `fix: <short description>`.
- Always stage specific files, never `git add .`.
