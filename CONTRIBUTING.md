# Contributing to Bugbook

Thanks for your interest in contributing to Bugbook! This document outlines how to get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/bugbook.git`
3. Install dependencies: `npm install`
4. Build the project: `npm run build`
5. Run tests: `npm test`

## Development

```bash
# Build the TypeScript
npm run build

# Run tests
npm test

# Run locally
node dist/index.js

# Or link globally for testing
npm link
bugbook
```

## Making Changes

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test your changes locally
4. Commit with a clear message: `git commit -m "Add: description of change"`
5. Push to your fork: `git push origin feature/your-feature-name`
6. Open a Pull Request

## Commit Message Format

- `Add:` for new features
- `Fix:` for bug fixes
- `Update:` for changes to existing features
- `Remove:` for removed features
- `Docs:` for documentation only changes

## Code Style

- Use TypeScript strict mode
- Use consistent color scheme (white/green/red only)
- Add JSDoc comments for exported functions
- Run `npm run build` to verify no TypeScript errors

## Reporting Issues

When reporting issues, please include:
- Your Node.js version (`node -v`)
- Your OS
- Steps to reproduce
- Expected vs actual behavior

## Questions?

Open an issue with your question and we'll help you out.
