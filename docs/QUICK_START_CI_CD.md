# Quick Start Guide: CI/CD and Semantic Versioning

This guide will help you get started with the CI/CD pipeline and semantic versioning workflow.

## 🚀 Initial Setup

### 1. Install Dependencies

```bash
pnpm install
```

This will install all required dependencies including semantic-release and commitizen.

### 2. Configure Git Hooks (Optional but Recommended)

To automatically lint commit messages, you can set up Husky:

```bash
pnpm add -D husky
npx husky init
```

Then create `.husky/commit-msg`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit $1
```

## 📝 Making Your First Commit

### Option 1: Using Commitizen (Interactive - Recommended for Beginners)

```bash
# Stage your changes
git add .

# Run commitizen
pnpm run commit
```

Follow the prompts:
1. Select commit type (feat, fix, etc.)
2. Enter scope (optional)
3. Write a short description
4. Write longer description (optional)
5. List breaking changes (if any)
6. Reference issues (if any)

### Option 2: Manual Commit (For Experienced Users)

```bash
git add .
git commit -m "feat(dashboard): add user statistics widget"
```

## 🔄 Development Workflow

### Working on a New Feature

```bash
# Create a feature branch
git checkout -b feat/amazing-feature

# Make changes and commit
git add .
pnpm run commit  # or git commit -m "feat(scope): description"

# Push changes
git push origin feat/amazing-feature

# Create PR on GitHub
```

### Fixing a Bug

```bash
# Create a bugfix branch
git checkout -b fix/bug-description

# Make changes and commit
git add .
git commit -m "fix(component): resolve issue with data loading"

# Push changes
git push origin fix/bug-description

# Create PR on GitHub
```

## 🏷️ Understanding Version Bumps

| Your Commit | Current Version | New Version | Change Type |
|-------------|-----------------|-------------|-------------|
| `feat: new feature` | 1.2.3 | 1.3.0 | Minor |
| `fix: bug fix` | 1.2.3 | 1.2.4 | Patch |
| `feat!: breaking change` | 1.2.3 | 2.0.0 | Major |
| `docs: update docs` | 1.2.3 | 1.2.4 | Patch |

## ✅ Pre-Commit Checklist

Before committing, ensure:

- [ ] Code builds successfully: `pnpm run build`
- [ ] Tests pass: `pnpm test`
- [ ] Code is formatted: automatic with Prettier
- [ ] Commit message follows convention

## 🎯 Common Commit Types Quick Reference

```bash
# New feature
git commit -m "feat(auth): add login functionality"

# Bug fix
git commit -m "fix(dashboard): correct chart rendering"

# Documentation
git commit -m "docs(readme): update installation steps"

# Code refactoring
git commit -m "refactor(api): improve error handling"

# Performance improvement
git commit -m "perf(queries): optimize database queries"

# Tests
git commit -m "test(auth): add login component tests"

# Breaking change
git commit -m "feat(api)!: redesign authentication API

BREAKING CHANGE: Auth endpoints now require API key header"
```

## 🚢 Release Process

### Preparing a Release

1. Ensure all features are merged to `develop`
2. Test thoroughly
3. Create PR from `develop` to `main`
4. Get approval from team
5. Merge to `main`
6. **Automatic**: Release workflow runs
7. **Automatic**: New version published with changelog

### What Happens Automatically

When you merge to `main`:

1. ✅ CI runs tests and build
2. 📊 Analyzes all commits since last release
3. 🔢 Calculates new version number
4. 📝 Updates CHANGELOG.md
5. 🏷️ Creates Git tag
6. 📦 Publishes GitHub release
7. 🔄 Updates package.json version

## 🛠️ Troubleshooting

### "Commit message doesn't follow convention"

**Error**: PR checks fail with commit format error

**Fix**: Use `pnpm run commit` or follow the format:
```
type(scope): description
```

### "No release created"

**Reason**: No commits with `feat` or `fix` since last release

**Fix**: Ensure commits use version-bumping types (feat, fix, or BREAKING CHANGE)

### "Tests failing in CI"

**Check locally**:
```bash
pnpm test
pnpm run build
```

**Fix issues** and commit again:
```bash
git add .
git commit -m "fix(tests): resolve failing unit tests"
```

## 📚 Next Steps

1. Read [CI/CD Documentation](./CI_CD_DOCUMENTATION.md) for detailed information
2. Review [CONTRIBUTING.md](../.github/CONTRIBUTING.md) for contribution guidelines
3. Check [GitHub Actions](https://github.com/YOUR_ORG/unraveldocs-frontend/actions) to see workflows in action

## 💡 Tips

### Use Meaningful Scopes

Good scopes help understand what part of the app changed:
- `auth` - Authentication related
- `dashboard` - Dashboard features
- `api` - API integrations
- `ui` - UI components
- `docs` - Documentation

### Write Good Commit Messages

✅ **Good**:
```
feat(auth): add password reset via email

Implements password reset flow with email verification.
Users receive a time-limited reset link via email.

Closes #123
```

❌ **Bad**:
```
update code
fix stuff
WIP
```

### Commit Often

Make small, focused commits rather than large commits with many changes.

### Test Before Pushing

Always run tests locally before pushing:
```bash
pnpm test
pnpm run build
```

## 🎓 Learning Resources

- [Conventional Commits in 5 minutes](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)

## 🆘 Getting Help

- Check workflow logs in GitHub Actions tab
- Review error messages carefully
- Ask team members for help
- Create an issue if you find a bug in the CI/CD pipeline

---

**Ready to start?** Make your first commit with `pnpm run commit`! 🚀

