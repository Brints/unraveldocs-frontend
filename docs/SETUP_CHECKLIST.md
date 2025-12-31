# CI/CD Setup Checklist

Use this checklist to ensure your CI/CD pipeline is properly configured.

## ✅ Pre-Push Checklist

- [ ] All workflow files created in `.github/workflows/`
- [ ] Configuration files created (`.releaserc.json`, `.commitlintrc.json`, etc.)
- [ ] Documentation files created in `docs/`
- [ ] Templates created in `.github/`
- [ ] Dependencies installed (`pnpm install` completed)
- [ ] `package.json` updated with scripts and dependencies
- [ ] `README.md` updated with CI/CD information
- [ ] Reviewed all files for correctness

## 📤 Push and Configure

- [ ] Create feature branch: `git checkout -b feat/ci-cd-pipeline`
- [ ] Stage all files: `git add .`
- [ ] Commit with conventional format
- [ ] Push to GitHub: `git push origin feat/ci-cd-pipeline`
- [ ] Create Pull Request on GitHub

## ⚙️ GitHub Repository Settings

### Branch Protection (Settings → Branches)
- [ ] Create rule for `main` branch
- [ ] Enable "Require pull request reviews before merging"
- [ ] Enable "Require status checks to pass before merging"
  - [ ] Select CI workflow as required check
- [ ] Enable "Require conversation resolution before merging"
- [ ] Enable "Require linear history"
- [ ] Disable "Allow bypassing the above settings"

### Actions Permissions (Settings → Actions → General)
- [ ] Set "Actions permissions" to "Allow all actions and reusable workflows"
- [ ] Set "Workflow permissions" to "Read and write permissions"
- [ ] Enable "Allow GitHub Actions to create and approve pull requests"

### Code Security (Settings → Code security and analysis)
- [ ] Enable "Dependency graph"
- [ ] Enable "Dependabot alerts"
- [ ] Enable "Dependabot security updates"
- [ ] Enable "Dependabot version updates"

### Optional: Secrets (if publishing to npm)
- [ ] Add `NPM_TOKEN` secret (Settings → Secrets and variables → Actions)

## 🧪 Test the Workflows

### Test CI Workflow
- [ ] Push a commit to your feature branch
- [ ] Go to Actions tab
- [ ] Verify CI workflow runs successfully
- [ ] Check that all jobs (lint-and-test, build) pass

### Test PR Checks Workflow
- [ ] Create a pull request
- [ ] Verify PR checks workflow runs
- [ ] Ensure commit message validation works
- [ ] Ensure PR title validation works

### Test Auto-Labeler
- [ ] Check that your PR gets auto-labeled based on changed files
- [ ] Verify size label is applied (xs, s, m, l, xl)

### Test Release Workflow (After Merge)
- [ ] Merge PR to `main` branch
- [ ] Go to Actions tab
- [ ] Verify Release workflow runs
- [ ] Check that new version is created
- [ ] Verify CHANGELOG.md is updated
- [ ] Verify GitHub release is created
- [ ] Verify Git tag is created

## 📝 Update Documentation

- [ ] Replace `YOUR_ORG` with your GitHub username/org in:
  - [ ] `README.md` badges
  - [ ] `.github/dependabot.yml` reviewers
  - [ ] Documentation links

## 👥 Team Setup

- [ ] Share `docs/QUICK_START_CI_CD.md` with team
- [ ] Train team on conventional commits
- [ ] Set up code review process
- [ ] Establish branch naming conventions

## 🎯 Verify Everything Works

### Commits
- [ ] Test commitizen: `pnpm run commit`
- [ ] Verify commit messages are linted
- [ ] Ensure conventional format is enforced

### Workflows
- [ ] All workflows show up in Actions tab
- [ ] No syntax errors in workflow files
- [ ] Workflows run on correct triggers

### Automation
- [ ] Dependabot PRs are created (wait a few days)
- [ ] Labels are applied automatically
- [ ] CI runs on every PR

### Security
- [ ] CodeQL scans run successfully
- [ ] Dependency review works on PRs
- [ ] Security alerts appear in Security tab

### Quality
- [ ] Bundle size check runs on PRs
- [ ] Lighthouse tests run (if configured)
- [ ] Coverage reports are uploaded

## 🚀 Production Ready Checklist

- [ ] At least one successful release to `main`
- [ ] CHANGELOG.md is being updated automatically
- [ ] Version in package.json updates automatically
- [ ] GitHub releases are created with correct notes
- [ ] All team members understand the workflow
- [ ] Documentation is accessible to team
- [ ] Branch protection rules are enforced

## 📊 Monitoring Setup

- [ ] Bookmark GitHub Actions page
- [ ] Set up notifications for failed workflows
- [ ] Monitor Dependabot PRs regularly
- [ ] Review security alerts weekly
- [ ] Check performance reports from Lighthouse

## 🎓 Knowledge Transfer

- [ ] Document any custom configurations
- [ ] Share commit message examples
- [ ] Demonstrate PR creation process
- [ ] Show how to read workflow logs
- [ ] Explain versioning rules

## 🔄 Maintenance Tasks

### Weekly
- [ ] Review Dependabot PRs
- [ ] Check for failed workflows
- [ ] Review security alerts

### Monthly
- [ ] Review stale issues
- [ ] Update workflow versions if needed
- [ ] Check bundle size trends

### Quarterly
- [ ] Review and update documentation
- [ ] Audit workflow performance
- [ ] Update team on best practices

---

## 📝 Notes

Use this space to track any issues or customizations:

```
Date: ___________
Completed by: ___________
Notes:



```

---

## ✅ Final Sign-Off

- [ ] All workflows tested and working
- [ ] Repository properly configured
- [ ] Team trained on new process
- [ ] Documentation complete and accessible
- [ ] Monitoring in place

**Signed off by:** ___________  
**Date:** ___________

---

🎉 **Congratulations!** Your CI/CD pipeline is fully operational!

