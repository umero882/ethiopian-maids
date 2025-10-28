# Contributing

Thanks for helping improve Ethio‑Maids! This project uses Conventional Commits, labels drive release notes, and we publish prereleases only during the dev/staging phase.

## Pull Requests
- Use Conventional Commit titles, e.g. `feat: add maid search filters`, `fix: handle login error`.
- Keep PRs focused and small; include screenshots for UI changes.
- Ensure CI passes: run `npm run lint`, `npm test`, and `npm run build` locally when possible.

## Labels (drive release notes + version bump)
Apply labels so Release Drafter can categorize changes and suggest SemVer bumps:
- Feature: `feat` (minor)
- Fix: `fix` (patch)
- Docs: `docs`
- Tests: `test`
- CI/CD: `ci`
- Maintenance: `chore`
- Refactor: `refactor`
- Dependencies: `deps`
- Build tooling: `build`
- Breaking change: add `major` (or use `!` in the PR title / add “BREAKING CHANGE” in the description)

Notes:
- An autolabeler applies common labels based on PR title and changed paths; please double‑check and adjust if needed.
- Adding `major`/`minor`/`patch` labels overrides the default version calculation.

## Prerelease Flow (no official releases yet)
We maintain checkpoint prereleases (alpha) and defer official releases.

1) Bump prerelease version
- Option A (npm): `npm version prerelease --preid=alpha`
- Option B (manual): update `package.json` version, commit, and create a tag.

2) Tag the prerelease (with a leading `v`)
```bash
git tag -a v0.x.y-alpha.N -m "Pre-release checkpoint v0.x.y-alpha.N"
git push origin v0.x.y-alpha.N
```

3) Draft notes
- Release Drafter automatically updates a draft prerelease from merged PRs and labels.
- Do not publish an official release; keep it as a prerelease while in staging.

## Coding Style
- Run `npm run format` (Prettier) and fix ESLint warnings or justify them.
- Components: `PascalCase.jsx`; helpers/services: `camelCase.js`.

## Security
- Do not commit secrets. Copy `.env.local.example` → `.env.local`.
- Validate config: `npm run config:validate`. Audit: `npm run security:audit`.

## Questions
Open a discussion or issue if anything is unclear about labels, prereleases, or the CI process.

