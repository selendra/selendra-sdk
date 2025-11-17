# Publishing Selendra SDK to npm

This guide walks you through publishing `@selendrajs/sdk` to npm for the first time.

## Prerequisites

✅ You're an admin of the [@selendrajs organization](https://www.npmjs.com/org/selendrajs) on npm
✅ Node.js 16+ installed
✅ Git repository is clean (all changes committed)

## Step-by-Step Publishing Guide

### 1. Login to npm

First, authenticate with npm using your npm account:

```bash
npm login
```

You'll be prompted for:

- **Username**: Your npm username
- **Password**: Your npm password
- **Email**: Your npm email (must be public)
- **OTP**: Two-factor authentication code (if enabled)

**Verify you're logged in:**

```bash
npm whoami
# Should display your npm username
```

**Verify organization access:**

```bash
npm org ls selendrajs
# Should show you as an admin/member
```

### 2. Prepare the Package

Navigate to the TypeScript SDK directory:

```bash
cd /home/user0/projects/selendra-biz/selendra/selendra-sdk/typescript
```

**Install dependencies** (if not already installed):

```bash
npm install
```

**Run pre-publish checks:**

```bash
# Build the package (must pass)
npm run build

# Run tests (must pass)
npm test

# Check linting (optional - has warnings but won't block publish)
npm run lint
```

Build and tests must pass before publishing.

### 3. Verify Package Contents

Check what will be published (dry-run):

```bash
npm pack --dry-run
```

This shows:

- Files that will be included
- Package size
- Any warnings

**Review the dist/ folder:**

```bash
ls -la dist/
```

Should contain:

- `index.js` - Main entry point
- `index.d.ts` - TypeScript declarations
- Other compiled `.js` and `.d.ts` files

### 4. Check Package Tarball (Optional but Recommended)

Create a local tarball to inspect:

```bash
npm pack
```

This creates `selendrajs-sdk-1.0.0.tgz`. Extract and inspect:

```bash
tar -xzf selendrajs-sdk-1.0.0.tgz
ls -la package/
```

**Clean up after inspection:**

```bash
rm -rf package selendrajs-sdk-1.0.0.tgz
```

### 5. Publish to npm

**For first-time publication (v1.0.0):**

```bash
npm publish
```

The `prepublishOnly` script will automatically run:

1. Clean old builds (`npm run clean`)
2. Lint code (`npm run lint`)
3. Run tests (`npm run test`)
4. Build fresh (`npm run build`)
5. Publish to npm

**If you encounter any errors**, fix them and try again.

### 6. Verify Publication

**Check on npm:**

```bash
npm view @selendrajs/sdk
```

**Visit the npm page:**

- Package: https://www.npmjs.com/package/@selendrajs/sdk
- Organization: https://www.npmjs.com/org/selendrajs

**Test installation in a new project:**

```bash
mkdir test-sdk && cd test-sdk
npm init -y
npm install @selendrajs/sdk
node -e "const sdk = require('@selendrajs/sdk'); console.log('SDK loaded:', !!sdk.SelendraSDK)"
```

### 7. Add npm Badge to README

After successful publication, the npm badge in your README will work:

[![npm version](https://img.shields.io/npm/v/@selendrajs/sdk.svg)](https://www.npmjs.com/package/@selendrajs/sdk)

## Publishing Updates (Future Releases)

### Version Bump

Use semantic versioning (MAJOR.MINOR.PATCH):

**Patch release (bug fixes): 1.0.0 → 1.0.1**

```bash
npm version patch
```

**Minor release (new features, backward compatible): 1.0.0 → 1.1.0**

```bash
npm version minor
```

**Major release (breaking changes): 1.0.0 → 2.0.0**

```bash
npm version major
```

This automatically:

1. Updates `package.json` version
2. Creates a git commit
3. Creates a git tag

**Then publish:**

```bash
npm publish
git push && git push --tags
```

### Publishing a Beta/Pre-release

For testing before stable release:

```bash
# Update to beta version
npm version 1.1.0-beta.0

# Publish with beta tag
npm publish --tag beta
```

Users install with:

```bash
npm install @selendrajs/sdk@beta
```

## Troubleshooting

### Error: "You must sign up for private packages"

**Solution:** Package.json already has `"access": "public"` in `publishConfig`, so this shouldn't happen. If it does:

```bash
npm publish --access public
```

### Error: "You do not have permission to publish"

**Solution:** Verify you're a member of @selendrajs organization:

```bash
npm org ls selendrajs
```

If not listed, contact the organization admin to add you.

### Error: "Package already exists"

**Solution:** The package name is taken. Since you own @selendrajs, this means it's already published. Use `npm version` to bump the version instead.

### Error: "Need auth" or "Authentication error"

**Solution:** Login again:

```bash
npm logout
npm login
```

### Tests Failing During Publish

The `prepublishOnly` script runs tests. To skip tests (NOT recommended):

```bash
npm publish --ignore-scripts
```

Better: Fix the tests before publishing.

### Build Failures

Clean and rebuild:

```bash
npm run clean
npm install
npm run build
npm publish
```

## Best Practices

### Before Every Publish

1. ✅ Update CHANGELOG.md with changes
2. ✅ Update version in package.json (or use `npm version`)
3. ✅ Run full test suite (`npm test`)
4. ✅ Check TypeScript compilation (`npm run lint:types`)
5. ✅ Build fresh (`npm run build`)
6. ✅ Test package locally (`npm pack` and install in test project)
7. ✅ Commit all changes
8. ✅ Tag release in git

### After Publishing

1. ✅ Verify on npmjs.com
2. ✅ Test installation: `npm install @selendrajs/sdk`
3. ✅ Push git tags: `git push --tags`
4. ✅ Create GitHub release
5. ✅ Update documentation
6. ✅ Announce to community (Discord, Twitter, etc.)

## Package.json Key Fields

Your package is correctly configured:

```json
{
  "name": "@selendrajs/sdk", // Scoped to @selendrajs org
  "version": "1.0.0", // Semantic version
  "main": "dist/index.js", // Entry point for Node.js
  "types": "dist/index.d.ts", // TypeScript declarations
  "files": ["dist", "src", "README.md", "LICENSE"], // What gets published
  "publishConfig": {
    "access": "public", // Public package (not private)
    "registry": "https://registry.npmjs.org/"
  }
}
```

## Quick Command Reference

```bash
# First time setup
npm login                              # Login to npm
npm whoami                             # Verify login
npm org ls selendrajs                  # Check org membership

# Before publishing
npm run lint                           # Lint code
npm test                               # Run tests
npm run build                          # Build package
npm pack --dry-run                     # Preview package

# Publish
npm publish                            # Publish to npm
npm publish --tag beta                 # Publish beta version
npm publish --access public            # Force public (if needed)

# After publishing
npm view @selendrajs/sdk               # View published package
npm info @selendrajs/sdk               # Detailed package info

# Version management
npm version patch                      # Bump patch version
npm version minor                      # Bump minor version
npm version major                      # Bump major version
npm version 1.0.1                      # Set specific version

# Maintenance
npm unpublish @selendrajs/sdk@1.0.0    # Unpublish (within 72hrs only!)
npm deprecate @selendrajs/sdk@1.0.0 "message" # Deprecate version
npm dist-tag add @selendrajs/sdk@1.1.0 latest # Set latest tag
```

## Additional Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [npm Scoped Packages](https://docs.npmjs.com/cli/v8/using-npm/scope)
- [Semantic Versioning](https://semver.org/)
- [npm CLI Documentation](https://docs.npmjs.com/cli/v8/commands/npm-publish)

## Support

If you encounter issues:

1. Check npm status: https://status.npmjs.org/
2. Review npm documentation: https://docs.npmjs.com/
3. Ask in Selendra Discord: https://discord.gg/selendra
4. GitHub Issues: https://github.com/selendra/selendra-sdk/issues
