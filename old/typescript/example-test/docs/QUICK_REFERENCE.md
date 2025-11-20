# Quick Reference

## 📂 Directory Structure (Clean & Organized)

```
src/
├── examples/
│   ├── core-sdk/        ✅ 4 examples (connect, disconnect, destroy, lifecycle)
│   ├── evm/             🔜 Wallet, Contract, Transaction, Events
│   ├── substrate/       🔜 Staking, Governance, Elections, Aleph
│   ├── unified/         🔜 Account mapping, Cross-chain
│   └── react/           🔜 Hooks
└── utils/               # Logger and helpers
```

## 🎯 Commands

```bash
# Run examples
npm run connect
npm run disconnect
npm run destroy
npm run lifecycle
npm run all

# Or use CLI
npm start
npm start connect
npm start all

# Development
npm run build
npm test
```

## ✅ Completed (4/200+)

From TESTING_CHECKLIST.md:
- [x] connect()
- [x] disconnect()
- [x] destroy()
- [x] lifecycle (bonus)

## 🔜 Next Examples to Add

Based on priority in TESTING_CHECKLIST.md:

### P0 - Critical
1. getAccount()
2. getBalance()
3. submitTransaction()
4. getCurrentBlock()
5. EVM wallet operations

### P1 - High Priority
6. Contract deployment
7. Contract interactions
8. Staking operations
9. Event subscriptions

## 📝 Files Overview

| File | Purpose |
|------|---------|
| `README.md` | Main documentation |
| `STRUCTURE.md` | Detailed directory organization |
| `TEMPLATE.md` | Template for new examples |
| `TESTING_CHECKLIST.md` | All 200+ functions to test |
| `src/examples/*/` | Organized examples by category |
| `src/utils/` | Shared utilities (Logger) |

## 🚀 Adding New Example (3 Steps)

1. **Create**: `src/examples/[category]/my-example.ts`
2. **Script**: Add to `package.json` scripts
3. **Run**: `npm run my-example`

## 💡 Pro Tips

- Use `Logger` utility for consistent output
- Follow the template in TEMPLATE.md
- Keep examples self-contained
- Always clean up resources
- Export functions for reuse
- Handle errors gracefully

## 📊 Progress Tracking

Total from TESTING_CHECKLIST.md: **200+ functions**
Completed: **4 examples**
Percentage: **2%**

Keep building! 🚀
