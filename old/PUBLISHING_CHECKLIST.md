# npm Publishing Checklist

Quick reference for publishing @selendrajs/sdk to npm.

## 🚀 First-Time Publishing

```bash
# 1. Login to npm
npm login

# 2. Verify credentials
npm whoami
npm org ls selendrajs

# 3. Navigate to package
cd /home/user0/projects/selendra-biz/selendra/selendra-sdk/typescript

# 4. Install dependencies (if needed)
npm install

# 5. Run checks
npm run build
npm test

# Optional: Check linting (has warnings, won't block)
npm run lint

# 6. Preview what will be published
npm pack --dry-run

# 7. PUBLISH!
npm publish

# 8. Verify
npm view @selendrajs/sdk
```

Visit: https://www.npmjs.com/package/@selendrajs/sdk

## 📦 Future Updates

```bash
cd /home/user0/projects/selendra-biz/selendra/selendra-sdk/typescript

# Bump version (choose one)
npm version patch   # 1.0.0 → 1.0.1 (bug fixes)
npm version minor   # 1.0.0 → 1.1.0 (new features)
npm version major   # 1.0.0 → 2.0.0 (breaking changes)

# Publish
npm publish

# Push tags
git push && git push --tags
```

## ✅ Pre-Publish Checklist

- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Linting checked (`npm run lint` - warnings OK)
- [ ] CHANGELOG.md updated
- [ ] README.md updated (if needed)
- [ ] Version bumped in package.json
- [ ] Git changes committed
- [ ] Reviewed `npm pack --dry-run` output

## ⚠️ Common Issues

**Not logged in:**

```bash
npm logout
npm login
```

**Build errors:**

```bash
npm run clean
npm install
npm run build
```

**Permission denied:**

```bash
npm org ls selendrajs  # Verify membership
npm publish --access public  # Force public
```

**Package already exists:**

```bash
npm version patch  # Bump version first
npm publish
```

## 📖 Full Guide

See [PUBLISHING.md](./PUBLISHING.md) for complete documentation.
