# NPM Package Publishing Guide

This guide will walk you through the process of building, testing, and publishing the Selendra SDK to npm.

## Prerequisites

1. **Node.js** (version 16 or higher)
2. **npm** account and access token
3. **Git** repository properly configured
4. **TypeScript** and build tools installed

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file for testing:

```bash
# .env
PRIVATE_KEY=0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
RPC_URL=https://rpc-testnet.selendra.org
SUBSTRATE_WS_URL=wss://rpc-testnet.selendra.org:9944
```

### 3. NPM Configuration

Login to npm:

```bash
npm login
```

Or set up authentication token:

```bash
npm config set //registry.npmjs.org/:_authToken <YOUR_TOKEN>
```

## Development Workflow

### 1. Code Development

```bash
# Start development mode with hot reload
npm run dev

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run typecheck
```

### 2. Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run CI tests (for automation)
npm run test:ci
```

### 3. Building

```bash
# Build the package
npm run build

# Build in development mode (with watch)
npm run build:dev
```

## Pre-Publishing Checklist

### 1. Code Quality

- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Code coverage is adequate (`npm run test:coverage`)
- [ ] Documentation is up to date

### 2. Version Management

Update the version in `package.json`:

```json
{
  "version": "1.0.0"
}
```

Or use npm version commands:

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major
```

### 3. Package Configuration

Ensure `package.json` is properly configured:

```json
{
  "name": "@selendrajs/sdk",
  "version": "1.0.0",
  "description": "Official TypeScript SDK for Selendra Network",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public"
  }
}
```

### 4. Documentation

Update the main `README.md`:

```markdown
# Selendra SDK

Official TypeScript SDK for interacting with Selendra Network.

## Installation

```bash
npm install @selendrajs/sdk
```

## Quick Start

```typescript
import { SelendraSDK } from '@selendrajs/sdk';

const sdk = new SelendraSDK({
  rpcUrl: 'https://rpc-testnet.selendra.org',
  network: 'testnet'
});

// EVM interactions
const balance = await sdk.evm.getBalance('0x...');

// WASM interactions
await sdk.wasm.connect();
const wasmBalance = await sdk.wasm.getBalance('5G...');
```

## Features

- ✅ EVM support with ethers.js integration
- ✅ WebAssembly (Substrate) support
- ✅ Wallet management (MetaMask, WalletConnect)
- ✅ Cross-VM compatibility
- ✅ TypeScript support
- ✅ Comprehensive testing

## Documentation

Visit [https://docs.selendra.org](https://docs.selendra.org) for detailed documentation.
```

## Publishing Process

### 1. Pre-publish Validation

The `prepublishOnly` script will run automatically before publishing:

```bash
npm run prepublishOnly
```

This runs:
- Linting
- Type checking
- Tests with coverage
- Build

### 2. Dry Run

Test the publishing process without actually publishing:

```bash
npm publish --dry-run
```

This will show you:
- What files will be included
- Package size
- Any warnings or errors

### 3. Publish to npm

#### For Public Package

```bash
npm publish
```

#### For Scoped Package

```bash
npm publish --access public
```

#### For Beta/Pre-release

```bash
# For beta version
npm publish --tag beta

# For next version
npm publish --tag next
```

### 4. Post-publish Verification

1. Check the package on npm:
   ```bash
   npm view @selendrajs/sdk
   ```

2. Test installation:
   ```bash
   npm install @selendrajs/sdk
   ```

3. Verify in a test project:
   ```typescript
   import { SelendraSDK } from '@selendrajs/sdk';
   console.log(SelendraSDK);
   ```

## Continuous Integration

### GitHub Actions

Create `.github/workflows/publish.yml`:

```yaml
name: Publish Package

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test:ci
        
      - name: Build package
        run: npm run build
        
      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Test Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
        
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run type checking
        run: npm run typecheck
        
      - name: Run tests
        run: npm run test:ci
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## Package Maintenance

### 1. Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update all dependencies
npm update

# Update specific dependency
npm install ethers@latest
```

### 2. Security Audits

```bash
# Run security audit
npm audit

# Fix security vulnerabilities
npm audit fix
```

### 3. Performance Monitoring

Monitor package performance:

```bash
# Check bundle size
npm run build
ls -la dist/

# Analyze bundle
npx bundlesize
```

## Troubleshooting

### Common Issues

1. **Authentication Error**
   ```bash
   npm whoami
   npm login
   ```

2. **Version Conflict**
   ```bash
   npm version patch
   git push origin main --tags
   ```

3. **Build Failures**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

4. **Test Failures**
   ```bash
   npm run test:coverage
   # Check coverage report in coverage/lcov-report/index.html
   ```

### Publishing Errors

1. **Package Already Exists**
   - Update version number
   - Use `npm version` command

2. **Access Denied**
   - Check npm authentication
   - Verify package scope permissions

3. **File Size Too Large**
   - Check `.npmignore` file
   - Remove unnecessary files from `files` array

## Best Practices

### 1. Semantic Versioning

- **Patch** (x.x.X): Bug fixes
- **Minor** (x.X.x): New features (backward compatible)
- **Major** (X.x.x): Breaking changes

### 2. Documentation

- Keep README.md updated
- Include code examples
- Document breaking changes
- Maintain changelog

### 3. Testing

- Maintain high test coverage (>80%)
- Test all public APIs
- Include integration tests
- Test in different environments

### 4. Security

- Regular security audits
- Keep dependencies updated
- Use npm audit
- Follow security best practices

## Helpful Commands

```bash
# Package information
npm view @selendrajs/sdk

# Download statistics
npm view @selendrajs/sdk --json

# Check what files will be published
npm pack --dry-run

# Unpublish a version (within 72 hours)
npm unpublish @selendrajs/sdk@1.0.0

# Deprecate a version
npm deprecate @selendrajs/sdk@1.0.0 "This version has been deprecated"
```

## Support

For issues related to publishing:
- Check [npm documentation](https://docs.npmjs.com/)
- Visit [npm support](https://www.npmjs.com/support)
- Ask in [npm community](https://npm.community/)

For SDK-specific issues:
- Create an issue on [GitHub](https://github.com/selendra/selendra-sdk/issues)
- Join our [Discord](https://discord.gg/selendra)
- Visit [Selendra Documentation](https://docs.selendra.org)