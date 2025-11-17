# @selendrajs/sdk

Complete TypeScript/JavaScript SDK for building on Selendra blockchain. Features full Substrate and EVM support with unified account management.

[![npm version](https://img.shields.io/npm/v/@selendrajs/sdk.svg)](https://www.npmjs.com/package/@selendrajs/sdk)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Tests](https://img.shields.io/badge/tests-147%20passing-brightgreen.svg)](https://github.com/selendra/selendra)

## Features

### Substrate Support

- **Staking**: Bond tokens, nominate validators, manage rewards
- **Aleph Consensus**: Session tracking, validator performance, finality monitoring
- **Elections**: Committee management, validator elections
- **Democracy**: Proposals, voting, conviction-based delegation

### EVM Support

- **Smart Contracts**: Deploy and interact with Solidity contracts
- **Accounts**: Create wallets, sign transactions, manage keys
- **Events**: Subscribe to contract events with type-safe parsing
- **Transactions**: Send ETH, call contracts, estimate gas

### Unified Accounts

- **Cross-Chain Addressing**: Convert between Substrate and EVM addresses
- **Balance Management**: Query balances across both layers
- **Account Claiming**: Link Substrate accounts to EVM addresses
- **Type Safety**: Full TypeScript support for all operations

### React Integration

- **Production-Ready Hooks**: `useBalance`, `useStaking`, `useContract`, and more
- **Context Provider**: Easy SDK integration with `SelendraProvider`
- **Auto-Refresh**: Configurable polling for real-time data
- **Error Handling**: Built-in error boundaries and loading states

### Developer Experience

- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Well Tested**: 147 tests passing across 7 test suites
- **Zero Dependencies Conflicts**: Compatible with modern React and Node.js
- **Tree-Shakeable**: Import only what you need

## ⚠️ Security Notice

**IMPORTANT:** Never commit private keys or sensitive data to version control. Use environment variables for secrets. See `.env.example` for configuration.

## Installation

```bash
npm install @selendrajs/sdk
```

## Quick Start

### Basic Usage

```typescript
import { SelendraSDK, Network, ChainType } from '@selendrajs/sdk';

// Initialize SDK
const sdk = new SelendraSDK({
  endpoint: 'https://rpc.selendra.org',
  network: Network.Selendra,
  chainType: ChainType.Substrate,
});

// Connect to blockchain
await sdk.connect();

// Query staking information
const validators = await sdk.substrate.staking.getValidators();
const currentEra = await sdk.substrate.staking.getCurrentEra();

// Convert between Substrate and EVM addresses
const evmAddress = sdk.unified.accounts.substrateToEvm('5GrwvaEF5C38WpsiP...');
const substrateAddress = sdk.unified.accounts.evmToSubstrate('0x742d35Cc6634C0532925a3b...');

// Check unified balance
const balance = await sdk.unified.accounts.getUnifiedBalance(evmAddress);
console.log(`Free: ${balance.free}, Total: ${balance.total}`);
```

### EVM Smart Contracts

```typescript
import { SelendraSDK } from '@selendrajs/sdk';

const sdk = new SelendraSDK({
  endpoint: 'https://rpc.selendra.org',
  chainType: ChainType.EVM,
});

await sdk.connect();

// Deploy a contract
const contract = await sdk.evm.contract.deploy(abi, bytecode, ['constructor', 'args']);

// Interact with contract
const result = await contract.read('balanceOf', [address]);
const tx = await contract.write('transfer', [recipient, amount]);

// Listen to events
contract.on('Transfer', (from, to, value) => {
  console.log(`Transfer: ${from} -> ${to}: ${value}`);
});
```

## React Integration

```tsx
import { SelendraProvider, useSelendraSDK, useBalance, useStaking } from '@selendrajs/sdk';

function App() {
  return (
    <SelendraProvider endpoint='https://rpc.selendra.org' network='mainnet' autoConnect>
      <Dashboard />
    </SelendraProvider>
  );
}

function Dashboard() {
  const { sdk, isConnected, chainInfo } = useSelendraSDK();
  const { balance, loading, error } = useBalance('5GrwvaEF5C38Wpsi...');
  const { data: staking } = useStaking('5GrwvaEF5C38Wpsi...', {
    refreshInterval: 12000, // Auto-refresh every 12s
  });

  if (!isConnected) return <div>Connecting...</div>;
  if (loading) return <div>Loading balance...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Chain: {chainInfo.name}</h2>
      <p>Balance: {balance?.formatted} SEL</p>
      <p>Staked: {staking?.bonded.formatted} SEL</p>
      <p>Validators: {staking?.nominators?.length || 0}</p>
    </div>
  );
}
```

### Available React Hooks

#### Core Hooks

- `useSelendraSDK()` - Access SDK instance and connection state
- `useBalance(address)` - Query account balance with auto-refresh
- `useAccount(address)` - Get account info and nonce
- `useTransaction()` - Submit and track transaction status
- `useContract(address, abi)` - Interact with smart contracts
- `useEvents(filters)` - Subscribe to blockchain events
- `useBlockSubscription()` - Listen to new blocks

#### Substrate Hooks

- `useStaking(address)` - Staking info, nominators, rewards
- `useAleph()` - Session info, validators, finality
- `useElections()` - Committee members, candidates
- `useGovernance()` - Active proposals, referenda, votes

#### Unified Account Hooks

- `useUnifiedAccounts(address)` - Cross-chain balance and conversion utilities

#### Utility Hooks

- `useDebounce(value, delay)` - Debounce state updates
- `useLocalStorage(key, defaultValue)` - Persistent state
- `usePrevious(value)` - Access previous render value
- `useIsMounted()` - Check component mount state

````

## API Reference

### Substrate APIs

#### StakingClient
```typescript
// Query staking information
const era = await sdk.substrate.staking.getCurrentEra();
const validators = await sdk.substrate.staking.getValidators();
const minBond = await sdk.substrate.staking.getMinNominatorBond();
const staking = await sdk.substrate.staking.getStakingInfo(address);

// Staking operations
const bondTx = await sdk.substrate.staking.bond(amount, rewardDestination);
const nominateTx = await sdk.substrate.staking.nominate([validator1, validator2]);
const unbondTx = await sdk.substrate.staking.unbond(amount);
````

#### AlephClient

```typescript
// Session and validator information
const session = await sdk.substrate.aleph.getCurrentSession();
const validators = await sdk.substrate.aleph.getActiveValidators();
const committee = await sdk.substrate.aleph.getSessionCommittee();
const performance = await sdk.substrate.aleph.getValidatorPerformance(address);

// Finality tracking
const finalizer = await sdk.substrate.aleph.getEmergencyFinalizer();
const version = await sdk.substrate.aleph.getFinalityVersion();
```

#### ElectionsClient

```typescript
// Elections and committee
const seats = await sdk.substrate.elections.getCommitteeSeats();
const currentEra = await sdk.substrate.elections.getCurrentEra();
const validators = await sdk.substrate.elections.getCurrentEraValidators();
const nextValidators = await sdk.substrate.elections.getNextEraValidators();

// Participate in elections
const changeTx = await sdk.substrate.elections.changeValidators(
  reserved,
  nonReserved,
  committeeSizeType,
);
```

#### DemocracyClient

```typescript
// Governance queries
const refCount = await sdk.substrate.democracy.getReferendumCount();
const referendum = await sdk.substrate.democracy.getReferendum(index);
const proposals = await sdk.substrate.democracy.getPublicProposals();
const votingInfo = await sdk.substrate.democracy.getVotingOf(address);

// Participate in governance
const proposeTx = await sdk.substrate.democracy.propose(proposal, value);
const voteTx = await sdk.substrate.democracy.vote(refIndex, vote);
const delegateTx = await sdk.substrate.democracy.delegate(to, conviction, balance);
```

### EVM APIs

#### EVMAccount

```typescript
// Create and manage accounts
const account = sdk.evm.account.createRandom();
const fromMnemonic = sdk.evm.account.fromMnemonic(mnemonic);
const fromPrivateKey = sdk.evm.account.fromPrivateKey(privateKey);

// Query account info
const balance = await account.getBalance();
const nonce = await account.getNonce();
const code = await account.getCode(contractAddress);

// Sign and send transactions
const signedTx = await account.signTransaction(txRequest);
const receipt = await account.sendTransaction(txRequest);
```

#### EVMContract

```typescript
// Deploy contracts
const contract = await sdk.evm.contract.deploy(abi, bytecode, constructorArgs);

// Read contract state
const result = await contract.read('balanceOf', [address]);
const symbol = await contract.read('symbol');

// Write to contract
const tx = await contract.write('transfer', [recipient, amount]);
const receipt = await tx.wait();

// Estimate gas
const gasEstimate = await contract.estimateGas('transfer', [recipient, amount]);

// Listen to events
contract.on('Transfer', (from, to, value, event) => {
  console.log(`${from} sent ${value} to ${to}`);
});

const events = await contract.getEvents('Transfer', {
  fromBlock: startBlock,
  toBlock: endBlock,
});
```

### Unified Account Management

```typescript
// Address conversion
const evmAddr = sdk.unified.accounts.substrateToEvm(substrateAddress);
const substrateAddr = sdk.unified.accounts.evmToSubstrate(evmAddress);

// Batch conversions
const evmAddresses = sdk.unified.accounts.batchConvert([substrate1, substrate2], 'toEvm');

// Address validation
const isValid = sdk.unified.accounts.validateAddress(address);

// Balance queries
const balance = await sdk.unified.accounts.getUnifiedBalance(address);
// Returns: { substrate: {...}, evm: {...}, total: BigInt, free: BigInt }

// On-chain mappings
const hasMapping = await sdk.unified.accounts.hasMappingOnChain(address);
const evmFromChain = await sdk.unified.accounts.getEvmAddressFromMapping(substrateAddr);

// Claim EVM address
const claimTx = await sdk.unified.accounts.claimDefaultEvmAddress();
const claimSpecificTx = await sdk.unified.accounts.claimEvmAddress(evmAddress, signature);
```

## Documentation

- **[API Reference](../docs/api/typescript.md)** - Complete API documentation
- **[React Hooks](../docs/api/react.md)** - React integration guide
- **[Getting Started](../docs/guides/getting-started.md)** - Quick start guide
- **[Examples](./examples/)** - Working code examples

## Network Configuration

### Mainnet

```typescript
const sdk = new SelendraSDK({
  endpoint: 'https://rpc.selendra.org', // or wss://rpc.selendra.org
  network: Network.Selendra,
  chainType: ChainType.Substrate,
});
```

### Alternative RPC

```typescript
const sdk = new SelendraSDK({
  endpoint: 'https://rpcx.selendra.org',
  network: Network.Selendra,
  chainType: ChainType.EVM,
});
```

Both HTTP endpoints (`https://rpc.selendra.org` and `https://rpcx.selendra.org`) support both Substrate and EVM operations.

### Testnet

```typescript
const sdk = new SelendraSDK({
  endpoint: 'https://rpc-testnet.selendra.org',
  network: Network.SelendraTestnet,
  chainType: ChainType.Substrate,
});
```

## Documentation

For comprehensive guides and examples, visit our documentation:

- **[Getting Started Guide](../docs/guides/getting-started.md)** - Setup and basic usage
- **[TypeScript API Reference](../docs/api/typescript.md)** - Complete API documentation
- **[React Hooks Guide](../docs/api/react.md)** - React integration and hooks
- **[EVM Support](./src/evm/README.md)** - Smart contract interaction
- **[React Components](./src/react/README.md)** - Component library and examples
- **[Code Examples](./examples/)** - Working code samples

### Example Projects

Check out complete working examples in the repository:

- **[Wallet App](./src/react/examples/wallet-app.tsx)** - Full-featured wallet with Substrate and EVM support
- **[DeFi Dashboard](./src/react/examples/defi-dashboard.tsx)** - Staking, governance, and yield farming
- **[NFT Marketplace](./src/react/examples/nft-marketplace.tsx)** - ERC-721 NFT trading platform
- **[Governance dApp](./src/react/examples/governance-dapp.tsx)** - Proposal voting and delegation

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/selendra/selendra.git
cd selendra/selendra-sdk/typescript

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Build
npm run build

# Build in watch mode
npm run build:watch

# Lint
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run lint:types
```

### Project Structure

```
typescript/
├── src/
│   ├── substrate/      # Substrate API clients
│   │   ├── staking.ts
│   │   ├── aleph.ts
│   │   ├── elections.ts
│   │   └── democracy.ts
│   ├── evm/           # EVM API clients
│   │   ├── account.ts
│   │   ├── contract.ts
│   │   ├── transaction.ts
│   │   └── events.ts
│   ├── unified/       # Cross-chain utilities
│   │   └── accounts.ts
│   ├── react/         # React hooks and components
│   │   ├── hooks.ts
│   │   ├── hooks-substrate.ts
│   │   ├── provider.tsx
│   │   └── components.tsx
│   ├── types/         # TypeScript type definitions
│   └── sdk/           # Core SDK implementation
├── tests/            # Test suites
├── examples/         # Example applications
└── dist/            # Compiled output
```

### Running Tests

The SDK has 147 passing tests across 7 test suites:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/substrate/staking.test.ts

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### Publishing

The package is published to npm as `@selendrajs/sdk`. To publish a new version:

```bash
# Update version in package.json
npm version patch|minor|major

# Run prepublish checks (clean, build, test)
npm run prepublishOnly

# Publish to npm
npm publish
```

## Requirements

- **Node.js**: 16.x or higher
- **TypeScript**: 5.x (for development)
- **React**: 16.8+ (for React hooks, peer dependency)

## Browser Support

The SDK works in all modern browsers that support:

- ES2020 JavaScript features
- WebAssembly
- WebSocket connections

For older browser support, use a transpiler like Babel with appropriate polyfills.

## Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Run linter (`npm run lint:fix`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Security

**⚠️ Important Security Notes:**

- Never commit private keys, mnemonics, or sensitive credentials
- Use environment variables for configuration
- Always validate user inputs
- Use HTTPS endpoints in production
- Keep dependencies updated

To report security vulnerabilities, please email security@selendra.org.

## Support

- **Documentation**: [docs.selendra.org](https://docs.selendra.org)
- **GitHub Issues**: [github.com/selendra/selendra/issues](https://github.com/selendra/selendra/issues)
- **Discord**: [discord.gg/selendra](https://discord.gg/selendra)
- **Twitter**: [@selendrachain](https://twitter.com/selendrachain)

## License

Apache License 2.0 - see [LICENSE](./LICENSE) file for details.

## Acknowledgments

Built with:

- [@polkadot/api](https://www.npmjs.com/package/@polkadot/api) - Substrate connectivity
- [ethers.js](https://www.npmjs.com/package/ethers) - Ethereum compatibility
- [React](https://reactjs.org/) - UI framework integration

---

**Made with ❤️ by the Selendra Team**
