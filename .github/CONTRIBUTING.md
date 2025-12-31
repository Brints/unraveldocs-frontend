# Contributing to UnravelDocs Frontend

Thank you for your interest in contributing to UnravelDocs Frontend! This document provides guidelines and instructions for contributing.

## 🌟 Getting Started

### Prerequisites

- Node.js 22.15.1 or higher
- pnpm 10.23.0 or higher

### Setting Up the Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/unraveldocs-frontend.git
   cd unraveldocs-frontend
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Start the development server:
   ```bash
   pnpm start
   ```

## 📝 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This leads to more readable messages and allows us to generate changelogs automatically.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Examples

```
feat(auth): add Google OAuth integration

Implements Google OAuth 2.0 authentication flow for user login
and signup. Includes callback handler and token management.

Closes #123
```

```
fix(dashboard): correct data loading issue

Fixed race condition in dashboard data loading that caused
stale data to be displayed.

Fixes #456
```

```
docs(readme): update installation instructions

Added pnpm installation steps and updated Node.js version requirement.
```

## 🔀 Pull Request Process

1. **Create a branch** from `develop`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Commit your changes** using conventional commits

4. **Push to your fork**:
   ```bash
   git push origin feat/your-feature-name
   ```

5. **Create a Pull Request** to the `develop` branch

6. **Ensure all checks pass**:
   - CI build succeeds
   - All tests pass
   - Code follows style guidelines
   - Commit messages follow conventions

7. **Wait for review** and address any feedback

### PR Title Format

PR titles must follow the same format as commit messages:

```
<type>(<scope>): <subject>
```

Example: `feat(user-dashboard): add billing settings page`

## 🧪 Testing

- Run tests: `pnpm test`
- Run tests in watch mode: `pnpm run watch`
- Ensure all new features have corresponding tests

## 🎨 Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Run prettier before committing (configured in package.json)
- Use meaningful variable and function names
- Add comments for complex logic

## 📚 Documentation

- Update documentation for any changed functionality
- Add JSDoc comments for public APIs
- Update README.md if necessary

## 🐛 Bug Reports

Use the bug report template when creating issues. Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details

## 💡 Feature Requests

Use the feature request template when suggesting new features. Include:
- Clear description of the feature
- Use cases and benefits
- Possible implementation approach

## 📋 Code Review Guidelines

When reviewing pull requests:
- Be constructive and respectful
- Check for code quality and best practices
- Verify tests are adequate
- Ensure documentation is updated
- Verify conventional commit format

## 🔐 Security

If you discover a security vulnerability, please email security@unraveldocs.com instead of creating a public issue.

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## 🙏 Thank You!

Your contributions make this project better. We appreciate your time and effort!

