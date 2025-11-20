# Example Test Directory Structure

```
example-test/
├── src/
│   ├── index.ts                    # Main entry point with CLI
│   ├── examples/                   # All examples organized by category
│   │   ├── index.ts               # Re-export all examples
│   │   ├── core-sdk/              # Core SDK examples (connect, disconnect, etc.)
│   │   │   ├── index.ts
│   │   │   ├── connect.ts         ✅
│   │   │   ├── disconnect.ts      ✅
│   │   │   ├── destroy.ts         ✅
│   │   │   └── lifecycle.ts       ✅
│   │   ├── evm/                   # EVM module examples
│   │   │   ├── index.ts
│   │   │   ├── wallet/            # Wallet operations
│   │   │   ├── contract/          # Contract interactions
│   │   │   ├── transaction/       # Transaction management
│   │   │   └── events/            # Event handling
│   │   ├── substrate/             # Substrate module examples
│   │   │   ├── index.ts
│   │   │   ├── staking/           # Staking operations
│   │   │   ├── governance/        # Governance/Democracy
│   │   │   ├── elections/         # Elections
│   │   │   └── aleph/             # Aleph consensus
│   │   ├── unified/               # Unified accounts examples
│   │   │   ├── index.ts
│   │   │   ├── accounts.ts        # Account mapping
│   │   │   └── transfers.ts       # Cross-chain transfers
│   │   └── react/                 # React hooks examples
│   │       ├── index.ts
│   │       └── hooks/             # Hook examples
│   └── utils/                     # Shared utilities
│       ├── index.ts
│       └── logger.ts              # Console logging helpers
├── dist/                          # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

## Directory Organization

### `/src/examples/core-sdk/` ✅
Core SDK functionality:
- `connect.ts` - Network connection
- `disconnect.ts` - Network disconnection
- `destroy.ts` - Resource cleanup
- `lifecycle.ts` - Complete SDK lifecycle

### `/src/examples/evm/` 🔜
EVM-related examples:
- Wallet creation and management
- Smart contract deployment and interaction
- Transaction handling
- Event subscription

### `/src/examples/substrate/` 🔜
Substrate-related examples:
- Staking operations
- Governance and democracy
- Elections management
- Aleph consensus queries

### `/src/examples/unified/` 🔜
Unified account examples:
- Account mapping (EVM ↔ Substrate)
- Cross-chain operations
- Unified balance queries

### `/src/examples/react/` 🔜
React hooks examples:
- useBalance
- useStaking
- useContract
- useTransaction

### `/src/utils/`
Shared utilities:
- Logger for consistent output formatting
- Helper functions
- Common configurations

## Benefits of This Structure

1. **Scalability**: Easy to add new examples without cluttering
2. **Organization**: Examples grouped by SDK module
3. **Maintainability**: Clear separation of concerns
4. **Navigation**: Easy to find specific examples
5. **Modularity**: Each example is self-contained
6. **Reusability**: Shared utilities in one place

## Running Examples

```bash
# Core SDK examples
npm run connect
npm run disconnect
npm run destroy
npm run lifecycle
npm run all

# Future examples will follow the same pattern
# npm run evm:wallet
# npm run substrate:staking
# npm run unified:mapping
```

## Adding New Examples

1. Create file in appropriate category directory
2. Export the example function
3. Add to category's index.ts
4. Add npm script in package.json
5. Update main index.ts if needed
