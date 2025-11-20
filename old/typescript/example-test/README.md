# Selendra SDK Examples

This directory contains practical code examples demonstrating the Selendra SDK functionality.

## 📁 Project Structure

```
example-test/
├── src/
│   ├── index.ts                    # Main CLI entry point
│   ├── examples/                   # Organized examples by category
│   │   ├── core-sdk/              ✅ Core SDK (4 examples)
│   │   ├── evm/                   🔜 EVM module
│   │   ├── substrate/             🔜 Substrate module
│   │   ├── unified/               🔜 Unified accounts
│   │   └── react/                 🔜 React hooks
│   └── utils/                      # Shared utilities
├── TESTING_CHECKLIST.md           # Complete testing checklist
├── STRUCTURE.md                   # Detailed structure documentation
└── TEMPLATE.md                    # Template for new examples
```

See [STRUCTURE.md](./STRUCTURE.md) for detailed directory organization.

## ✅ Implemented Examples

### Core SDK (`src/examples/core-sdk/`)
- [x] **connect.ts** - Connect to the network
- [x] **disconnect.ts** - Disconnect from the network  
- [x] **destroy.ts** - Clean up SDK resources
- [x] **lifecycle.ts** - Complete SDK lifecycle

## 🚀 Quick Start

### Run Individual Examples

```bash
npm run connect      # Connect example
npm run disconnect   # Disconnect example
npm run destroy      # Destroy example
npm run lifecycle    # Full lifecycle
npm run all          # Run all core SDK examples
```

### Using CLI

```bash
npm start            # Show available examples
npm start connect    # Run specific example
npm start all        # Run all examples
```

## 📋 From TESTING_CHECKLIST.md

Progress on Core SDK functions:
- [x] `connect()` - Connect to the network ✅
- [x] `disconnect()` - Disconnect from the network ✅
- [x] `destroy()` - Clean up SDK resources ✅

**Next**: Continue with remaining 200+ functions from the checklist.

## 🎯 Adding New Examples

1. See [TEMPLATE.md](./TEMPLATE.md) for example template
2. Create file in appropriate category directory
3. Follow the naming conventions
4. Add npm script to package.json
5. Test your example

Example:
```bash
# Create new example
touch src/examples/core-sdk/get-balance.ts

# Add npm script
"get-balance": "ts-node src/examples/core-sdk/get-balance.ts"

# Run it
npm run get-balance
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run TypeScript directly
npm start <example>

# Build to JavaScript
npm run build

# Run compiled code
npm test
```

## 📚 Documentation

- **TESTING_CHECKLIST.md** - Complete list of 200+ functions to test
- **STRUCTURE.md** - Directory organization and benefits
- **TEMPLATE.md** - Template for creating new examples
- **README.md** - This file

## 🗂️ Category Organization

### Core SDK
Basic SDK operations: connect, disconnect, destroy, lifecycle

### EVM (Coming Soon)
- Wallet operations
- Contract interactions
- Transactions
- Event handling

### Substrate (Coming Soon)
- Staking
- Governance
- Elections
- Aleph consensus

### Unified (Coming Soon)
- Account mapping
- Cross-chain transfers
- Unified balances

### React (Coming Soon)
- React hooks
- Component examples

## 💡 Benefits of This Structure

✅ **Scalable** - Easy to add hundreds of examples without mess
✅ **Organized** - Examples grouped by SDK module
✅ **Clean** - No clutter, everything in its place
✅ **Maintainable** - Clear separation of concerns
✅ **Discoverable** - Easy to find what you need

## 🎓 Learning Path

1. Start with **core-sdk/** examples (✅ complete)
2. Move to **evm/** for smart contracts
3. Explore **substrate/** for chain features
4. Check **unified/** for cross-chain operations
5. Try **react/** for UI integration

## 📦 Requirements

- Node.js v24+ (via nvm)
- TypeScript
- @selendrajs/sdk package
- ts-node for development

## 🤝 Contributing

When adding new examples:
1. Follow the directory structure
2. Use the Logger utility
3. Handle errors properly
4. Clean up resources
5. Make it runnable standalone
6. Export for reuse

---

**Total Examples**: 4 / 200+ (from TESTING_CHECKLIST.md)
**Status**: 🟢 Active Development
**Last Updated**: November 18, 2025
