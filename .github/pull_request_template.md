# Pull Request

Thank you for contributing! Please fill out the template below to help us review quickly and accurately.

## Target Branch
<!-- Select the target branch for this PR -->
- [ ] `development` - Feature development and non-urgent fixes
- [ ] `staging` - Pre-production testing and validation
- [ ] `main` - Production release (requires approval from staging)

## Title Convention
Use Conventional Commits for the PR title:
- Example: `feat(ui): add maid search filters`
- Example: `fix(auth): handle login error`
- Breaking: `feat!: change profile schema` (and include BREAKING CHANGE in body)

## Summary
- What does this change do and why?
- Link related issue(s): Closes #

## Screenshots (UI changes)
- Before:
- After:

## Type of Change
- [ ] feat (feature)
- [ ] fix (bug fix)
- [ ] docs (documentation)
- [ ] chore (maintenance)
- [ ] refactor (no behavior change)
- [ ] test (tests / coverage)
- [ ] ci (CI/CD)
- [ ] build (tooling / config)
- [ ] deps (dependencies)

## Labels
Apply appropriate labels so Release Drafter can categorize and suggest version bumps:
- Common: `feat`, `fix`, `docs`, `test`, `ci`, `chore`, `refactor`, `deps`, `build`
- SemVer hints: `major` (breaking), `minor`, `patch`

## Checklist
- [ ] Title follows Conventional Commits
- [ ] Lint passes locally (`npm run lint`)
- [ ] Tests pass locally (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Docs/migrations/tests updated as needed
- [ ] Screenshots added for UI changes
- [ ] Labels applied (see above)

## Breaking Changes
- [ ] Yes
- [ ] No
If yes, describe impact and migration path. Include a footer line:

```
BREAKING CHANGE: <description>
```

## Testing Notes
- Steps to validate locally / in staging
- Edge cases verified

## Additional Context
- Anything else reviewers should know
