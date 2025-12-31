# UnraveldocsFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.12.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## 🔄 CI/CD and Versioning

This project uses automated CI/CD pipelines and semantic versioning.

### Making Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) for automatic versioning:

```bash
# Use commitizen for guided commits (recommended)
pnpm run commit

# Or write conventional commits manually
git commit -m "feat(auth): add login functionality"
git commit -m "fix(dashboard): correct data loading issue"
```

### Commit Types

- `feat:` - New feature (minor version bump)
- `fix:` - Bug fix (patch version bump)
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Test updates
- `build:` - Build system changes
- `ci:` - CI/CD changes
- `chore:` - Other changes

### Versioning

Versions follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version: Breaking changes (e.g., `feat!:` or `BREAKING CHANGE:`)
- **MINOR** version: New features (e.g., `feat:`)
- **PATCH** version: Bug fixes (e.g., `fix:`, `docs:`, `refactor:`)

Releases are automatically created when code is merged to the `main` branch.

### Quick Start Guide

For a complete guide on using the CI/CD pipeline, see:
- 📖 [Quick Start Guide](./docs/QUICK_START_CI_CD.md)
- 📚 [Detailed CI/CD Documentation](./docs/CI_CD_DOCUMENTATION.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./.github/CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Make your changes with conventional commits
4. Push to your fork: `git push origin feat/amazing-feature`
5. Open a Pull Request

### Code Quality

- All tests must pass: `pnpm test`
- Build must succeed: `pnpm run build`
- Follow conventional commit format
- Add tests for new features

## 📋 Available Scripts

```bash
pnpm start              # Start development server
pnpm run build          # Build for production
pnpm test               # Run unit tests
pnpm run test:ci        # Run tests in CI mode
pnpm run lint           # Lint code
pnpm run commit         # Create conventional commit
pnpm run semantic-release # Create release (automated in CI)
```

## 📁 Project Structure

```
src/
├── app/
│   ├── core/           # Core functionality (auth, interceptors)
│   ├── features/       # Feature modules (admin, user, etc.)
│   ├── shared/         # Shared components and services
│   └── environments/   # Environment configurations
├── assets/             # Static assets
└── docs/              # Documentation
```

## 📊 Workflows

- **CI**: Runs on every push and PR - lints, tests, and builds
- **Release**: Runs on push to main - creates releases automatically
- **PR Checks**: Validates commit messages and PR titles

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
