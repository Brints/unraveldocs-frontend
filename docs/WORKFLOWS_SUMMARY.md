# Workflows Summary

This document provides an overview of all GitHub Actions workflows implemented in this project.

## 🔄 Core Workflows

### 1. CI Workflow (`ci.yml`)
**Triggers:** Push and PR to `main` and `develop` branches

**Jobs:**
- **Lint and Test**: Runs linting and unit tests with coverage
- **Build**: Creates development build
- **Build Production**: Creates optimized production build (main branch only)

**Features:**
- pnpm caching for faster builds
- Code coverage upload
- Build artifact retention (7 days for dev, 30 days for production)

---

### 2. Release Workflow (`release.yml`)
**Triggers:** Push to `main` branch

**What it does:**
- Analyzes commits using conventional commits
- Calculates next version number (semantic versioning)
- Generates/updates CHANGELOG.md
- Creates Git tag and GitHub release
- Updates package.json version

**Version Bumps:**
- `feat:` → Minor version (1.0.0 → 1.1.0)
- `fix:` → Patch version (1.0.0 → 1.0.1)
- `BREAKING CHANGE:` → Major version (1.0.0 → 2.0.0)

---

### 3. PR Checks Workflow (`pr-checks.yml`)
**Triggers:** Pull request events

**Validations:**
- Commit messages follow conventional commits format
- PR title follows semantic format
- Enforces commit standards across the project

---

## 🔒 Security Workflows

### 4. CodeQL Analysis (`codeql-analysis.yml`)
**Triggers:** Push, PR, and weekly schedule (Mondays)

**Features:**
- Static code analysis for JavaScript and TypeScript
- Security vulnerability detection
- Code quality checks
- Runs extended security queries

---

### 5. Dependency Review (`dependency-review.yml`)
**Triggers:** Pull requests

**Features:**
- Reviews dependency changes in PRs
- Fails on moderate+ severity vulnerabilities
- Posts summary comments on PRs

---

## 🤖 Automation Workflows

### 6. Auto Merge Dependabot (`auto-merge.yml`)
**Triggers:** Dependabot PRs

**Features:**
- Auto-approves patch and minor dependency updates
- Enables auto-merge for safe updates
- Requires CI to pass before merging

---

### 7. Auto Labeler (`labeler.yml`)
**Triggers:** PR and issue creation

**Features:**
- Automatically labels PRs based on file paths
- Labels PRs by size (xs, s, m, l, xl)
- Organizes issues and PRs by area and type

---

### 8. Stale Issues and PRs (`stale.yml`)
**Triggers:** Daily schedule

**Features:**
- Marks inactive issues stale after 60 days
- Marks inactive PRs stale after 30 days
- Closes stale items after warning period
- Exempts pinned and security items

---

## 📊 Quality Workflows

### 9. Lighthouse Performance (`lighthouse.yml`)
**Triggers:** PRs to main, weekly schedule, manual

**Features:**
- Runs Lighthouse performance audits
- Tests performance, accessibility, SEO
- Runs 3 times and averages results
- Posts results to PR

---

### 10. Bundle Size Check (`bundle-size.yml`)
**Triggers:** Pull requests

**Features:**
- Analyzes production bundle size
- Compares against base branch
- Comments size changes on PR
- Helps prevent bundle bloat

---

## 📦 Dependency Management

### Dependabot (`dependabot.yml`)
**Schedule:** Weekly (Mondays at 9:00 AM)

**Features:**
- Updates npm dependencies
- Updates GitHub Actions versions
- Groups Angular packages together
- Auto-creates PRs for updates
- Labels PRs appropriately

---

## 🏷️ Labeler Configuration (`labeler.yml`)

Automatically labels PRs based on file paths:

| Label | Applied When |
|-------|--------------|
| `area: auth` | Changes in auth-related files |
| `area: dashboard` | Changes in user/admin dashboard |
| `area: landing` | Changes in landing page |
| `area: shared` | Changes in shared components |
| `type: documentation` | Changes in docs or markdown files |
| `type: tests` | Changes in test files |
| `type: styles` | Changes in CSS/SCSS files |
| `type: config` | Changes in config files |
| `type: dependencies` | Changes in package files |
| `ui: components` | Changes in UI components |

---

## 🚀 Usage Guide

### For Developers

1. **Making Changes:**
   - Create feature branch from `develop`
   - Use conventional commits: `feat:`, `fix:`, etc.
   - CI runs automatically on push

2. **Pull Requests:**
   - CI validates build and tests
   - PR checks validate commit format
   - Auto-labeling organizes PR
   - Bundle size check shows impact

3. **Releases:**
   - Merge `develop` → `main` for release
   - Release workflow runs automatically
   - Version bumped based on commits
   - Changelog generated automatically

### For Maintainers

1. **Security:**
   - CodeQL runs weekly for security scans
   - Dependency review on all PRs
   - Dependabot creates security updates

2. **Automation:**
   - Dependabot PRs auto-merge if tests pass
   - Stale bot cleans up old issues/PRs
   - Auto-labeling reduces manual work

3. **Quality:**
   - Lighthouse ensures performance standards
   - Bundle size prevents bloat
   - Coverage reports track test quality

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `.releaserc.json` | Semantic release configuration |
| `.commitlintrc.json` | Commit message linting rules |
| `.versionrc.json` | Version bump configuration |
| `labeler.yml` | Auto-labeling rules |
| `dependabot.yml` | Dependency update schedule |

---

## 📈 Workflow Statuses

Add these badges to your README for status visibility:

```markdown
[![CI](https://github.com/YOUR_ORG/unraveldocs-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/unraveldocs-frontend/actions/workflows/ci.yml)
[![Release](https://github.com/YOUR_ORG/unraveldocs-frontend/actions/workflows/release.yml/badge.svg)](https://github.com/YOUR_ORG/unraveldocs-frontend/actions/workflows/release.yml)
[![CodeQL](https://github.com/YOUR_ORG/unraveldocs-frontend/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/YOUR_ORG/unraveldocs-frontend/actions/workflows/codeql-analysis.yml)
```

---

## 🛠️ Maintenance

### Weekly Tasks
- Review Dependabot PRs
- Check Lighthouse performance reports
- Review security alerts from CodeQL

### Monthly Tasks
- Review and close stale issues
- Update workflow versions if needed
- Review bundle size trends

### As Needed
- Adjust labeler rules for new areas
- Update dependency ignore rules
- Modify auto-merge criteria

---

## 🆘 Troubleshooting

### Workflow Fails

1. Check the Actions tab for logs
2. Review error messages
3. Ensure all required secrets are set
4. Verify branch protection rules

### Release Not Created

- Ensure commits follow conventional format
- Check that commits have version-bumping types
- Verify GITHUB_TOKEN has correct permissions

### Auto-merge Not Working

- Ensure branch protection allows auto-merge
- Check that CI passes successfully
- Verify Dependabot permissions

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)

---

**Note:** Replace `YOUR_ORG` with your actual GitHub organization/username in all workflow files and badges.

