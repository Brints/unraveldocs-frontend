# CI/CD and Semantic Versioning Documentation

This project uses GitHub Actions for Continuous Integration (CI) and Continuous Deployment (CD), along with semantic versioning for automated releases.

## Table of Contents

- [Overview](#overview)
- [Workflows](#workflows)
- [Semantic Versioning](#semantic-versioning)
- [Commit Convention](#commit-convention)
- [Making Changes](#making-changes)
- [Release Process](#release-process)
- [Configuration Files](#configuration-files)

## Overview

The project implements:

- **Continuous Integration**: Automated testing and building on every push and pull request
- **Semantic Versioning**: Automatic version bumping based on commit messages
- **Automated Releases**: Automatic changelog generation and GitHub releases
- **Pull Request Validation**: Ensures commits and PR titles follow conventions

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers**: Push to `main` or `develop`, Pull requests to `main` or `develop`

**Jobs**:

- **Lint and Test**: Runs linting and tests with code coverage
- **Build**: Creates a development build
- **Build Production**: Creates a production build (only on `main` branch)

### 2. Release Workflow (`.github/workflows/release.yml`)

**Triggers**: Push to `main` branch

**What it does**:
- Analyzes commit messages using conventional commits
- Determines the next version number
- Generates/updates CHANGELOG.md
- Creates a Git tag
- Creates a GitHub release
- Updates package.json version

### 3. PR Checks Workflow (`.github/workflows/pr-checks.yml`)

**Triggers**: Pull request opened, synchronized, or reopened

**What it does**:
- Validates commit messages follow conventional commits
- Ensures PR title follows semantic format

## Semantic Versioning

The project follows [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH (e.g., 1.2.3)
```

- **MAJOR** version when you make incompatible API changes (breaking changes)
- **MINOR** version when you add functionality in a backward compatible manner
- **PATCH** version when you make backward compatible bug fixes

### Version Bumping Rules

Based on commit messages:

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `feat:` | Minor (0.x.0) | 1.2.0 → 1.3.0 |
| `fix:` | Patch (0.0.x) | 1.2.0 → 1.2.1 |
| `BREAKING CHANGE:` | Major (x.0.0) | 1.2.0 → 2.0.0 |
| `docs:`, `style:`, `refactor:` | Patch (0.0.x) | 1.2.0 → 1.2.1 |
| `chore(deps):` | Patch (0.0.x) | 1.2.0 → 1.2.1 |

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Changes to build system or dependencies
- **ci**: Changes to CI configuration
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Examples

#### Feature (Minor Version Bump)

```bash
feat(auth): add Google OAuth integration

Implements Google OAuth 2.0 authentication flow for user login
and signup. Includes callback handler and token management.

Closes #123
```

#### Bug Fix (Patch Version Bump)

```bash
fix(dashboard): correct data loading race condition

Fixed race condition in dashboard data loading that caused
stale data to be displayed when switching between views.

Fixes #456
```

#### Breaking Change (Major Version Bump)

```bash
feat(api)!: redesign authentication API

BREAKING CHANGE: The authentication API has been completely
redesigned. The old `/auth/login` endpoint is now `/auth/signin`
and requires different request parameters.

Migration guide: see docs/migration/v2.0.0.md
```

Or alternatively:

```bash
feat(api): redesign authentication API

The authentication API has been completely redesigned.

BREAKING CHANGE: The old `/auth/login` endpoint is now `/auth/signin`
and requires different request parameters.
```

#### Documentation (Patch Version Bump)

```bash
docs(readme): update installation instructions

Added pnpm installation steps and updated Node.js version requirement.
```

## Making Changes

### Step 1: Create a Branch

```bash
git checkout -b feat/your-feature-name
```

Branch naming conventions:
- `feat/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/documentation-name` - Documentation updates
- `refactor/refactor-name` - Code refactoring
- `chore/task-name` - Maintenance tasks

### Step 2: Make Your Changes

Write your code following the project's coding standards.

### Step 3: Commit Using Commitizen (Recommended)

The project includes Commitizen for interactive commit creation:

```bash
# Stage your changes
git add .

# Use commitizen to create a conventional commit
pnpm run commit
```

This will guide you through creating a properly formatted commit message.

### Step 4: Push Your Changes

```bash
git push origin feat/your-feature-name
```

### Step 5: Create a Pull Request

Create a PR from your branch to `develop` (or `main` for hotfixes).

**Important**: PR title must follow the conventional commit format:

✅ Good:
```
feat(user-dashboard): add billing settings page
fix(auth): resolve token expiration issue
```

❌ Bad:
```
Added billing settings
Fix bug
Update dashboard
```

## Release Process

### Automatic Releases

Releases happen automatically when code is merged to the `main` branch:

1. Developer creates a feature branch from `develop`
2. Developer makes changes with conventional commits
3. Developer creates PR to `develop`
4. PR is reviewed and merged to `develop`
5. When ready for release, create PR from `develop` to `main`
6. Merge to `main` triggers the release workflow
7. Semantic-release analyzes commits since last release
8. New version is calculated based on commit types
9. CHANGELOG.md is updated
10. Git tag is created
11. GitHub release is published
12. package.json version is updated

### Manual Release (if needed)

To trigger a release manually:

1. Ensure you're on the `main` branch
2. Push to trigger the workflow:

```bash
git push origin main
```

### Pre-releases (Beta/Alpha)

Pre-releases can be created from the `develop` branch:

```bash
git push origin develop
```

This creates versions like `1.2.3-develop.1`

## Configuration Files

### `.releaserc.json`

Configures semantic-release behavior:
- Branch configuration
- Plugins for analysis, changelog, git, and GitHub
- Release rules for different commit types

### `.commitlintrc.json`

Configures commit message linting:
- Enforces conventional commit format
- Defines allowed commit types
- Sets message length limits

### `.github/workflows/ci.yml`

Defines CI pipeline:
- Runs on push and PR
- Executes tests and builds
- Caches dependencies for speed

### `.github/workflows/release.yml`

Defines release automation:
- Runs on push to `main`
- Executes semantic-release
- Creates tags and releases

### `.github/workflows/pr-checks.yml`

Validates pull requests:
- Checks commit message format
- Validates PR title format

## Best Practices

### 1. Commit Often

Make small, focused commits that do one thing well.

### 2. Write Descriptive Messages

The commit body should explain WHY, not just WHAT.

### 3. Use Scopes

Add scopes to make it clear which part of the codebase is affected:

```bash
feat(auth): add password reset
fix(dashboard): correct chart display
docs(api): update endpoint documentation
```

### 4. Reference Issues

Link commits to issues:

```bash
fix(auth): resolve token refresh issue

Fixes #123
Closes #124
```

### 5. Breaking Changes

Always document breaking changes in the commit footer:

```bash
BREAKING CHANGE: description of the breaking change
```

### 6. Squash and Merge

When merging PRs, use "Squash and merge" to keep a clean history.

## Troubleshooting

### Release Not Created

**Problem**: Pushed to `main` but no release was created

**Solutions**:
- Check that commits follow conventional format
- Verify GitHub token has correct permissions
- Check workflow logs in Actions tab

### Version Not Bumped

**Problem**: Version wasn't bumped as expected

**Solutions**:
- Verify commit type (only `feat`, `fix`, `BREAKING CHANGE` bump version)
- Check that commits since last release contain version-bumping types
- Review semantic-release logs

### CI Failing

**Problem**: CI workflow fails

**Solutions**:
- Check test failures in Actions tab
- Run tests locally: `pnpm test`
- Verify build succeeds: `pnpm run build`
- Check for linting errors: `pnpm run lint`

## Resources

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [Commitizen](https://github.com/commitizen/cz-cli)
- [GitHub Actions](https://docs.github.com/en/actions)

## Support

For questions or issues with the CI/CD pipeline, please:
1. Check this documentation
2. Review the workflow logs in GitHub Actions
3. Create an issue using the bug report template
4. Contact the DevOps team

