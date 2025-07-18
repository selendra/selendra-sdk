# Contributing to Selendra SDK

We welcome contributions to the Selendra SDK! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/selendra-sdk`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm run test

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run typecheck
```

## Project Structure

```
src/
├── config/          # Network configurations
├── evm/             # EVM-related functionality
├── substrate/       # Substrate-related functionality
├── wallet/          # Wallet connection utilities
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
└── index.ts         # Main SDK export

examples/            # Usage examples
docs/               # Documentation
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow the existing code style
- Add type annotations for public APIs
- Use interfaces for complex types

### Code Style

- Use ESLint configuration provided
- 2 spaces for indentation
- Semicolons required
- Single quotes for strings
- Trailing commas in multiline structures

### Naming Conventions

- `camelCase` for variables and functions
- `PascalCase` for classes and interfaces
- `UPPER_SNAKE_CASE` for constants
- Descriptive names for functions and variables

## Testing

### Writing Tests

- Write tests for all new functionality
- Use Jest testing framework
- Place tests next to the code they test (`*.test.ts`)
- Aim for high test coverage

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Structure

```typescript
describe('ClassName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Test implementation
    });
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for all public methods
- Include parameter descriptions and return types
- Provide usage examples for complex functions

```typescript
/**
 * Transfer native tokens to another address
 * @param to - Recipient address
 * @param amount - Amount to transfer in Ether
 * @param options - Transaction options
 * @returns Transaction hash
 * @example
 * ```typescript
 * const hash = await sdk.evm.transfer('0x...', '1.0');
 * ```
 */
async transfer(to: string, amount: string, options?: TransactionOptions): Promise<string>
```

### README Updates

- Update README.md for new features
- Add examples for new functionality
- Keep installation and usage instructions current

## Submitting Changes

### Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

Examples:
```
feat(evm): add support for EIP-1559 transactions
fix(substrate): handle connection timeout errors
docs(readme): update installation instructions
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the guidelines above
3. Add or update tests as needed
4. Update documentation if necessary
5. Ensure all tests pass and linting is clean
6. Create a pull request with:
   - Clear title and description
   - Reference to related issues
   - List of changes made
   - Screenshots for UI changes (if applicable)

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

## Feature Requests

### Proposing New Features

1. Check existing issues and discussions
2. Create an issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Potential implementation approach
   - Breaking changes (if any)

### Feature Development

1. Discuss the feature in an issue first
2. Get approval from maintainers
3. Follow the development process above

## Bug Reports

### Reporting Bugs

1. Check existing issues first
2. Create a detailed bug report with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Code examples (if applicable)

### Bug Report Template

```markdown
**Bug Description**
Clear description of the bug

**To Reproduce**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., macOS 12.0]
- Node.js: [e.g., 18.0.0]
- SDK Version: [e.g., 1.0.0]

**Additional Context**
Any other relevant information
```

## Code Review

### Review Criteria

- Code quality and style
- Test coverage
- Documentation completeness
- Performance considerations
- Security implications
- Breaking changes

### Review Process

1. All PRs require review from maintainers
2. Address review feedback promptly
3. Maintain a respectful and constructive tone
4. Be open to suggestions and improvements

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

### Release Steps

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release branch
4. Test thoroughly
5. Create release PR
6. Merge and tag release
7. Publish to npm

## Community

### Communication

- [Discord](https://discord.gg/selendra) - General discussion
- [GitHub Issues](https://github.com/selendra/selendra-sdk/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/selendra/selendra-sdk/discussions) - Community Q&A

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Help

- Check the [documentation](./docs/)
- Look through existing [issues](https://github.com/selendra/selendra-sdk/issues)
- Ask in [Discord](https://discord.gg/selendra)
- Create a [discussion](https://github.com/selendra/selendra-sdk/discussions)

## Recognition

Contributors will be recognized in:
- Release notes
- Contributors list
- Special mentions for significant contributions

Thank you for contributing to Selendra SDK! 🚀