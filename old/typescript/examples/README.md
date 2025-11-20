# Selendra SDK Examples

This directory contains comprehensive examples demonstrating various features of the Selendra SDK.

## Examples Overview

### 1. Staking Dashboard (`staking-dashboard.ts`)

Demonstrates comprehensive staking functionality:

- **Network Overview**: View current era, validator count, minimum stake requirements
- **Account Staking Info**: Check staking status for any address
- **Validator List**: Browse active validators and their commissions
- **Era Rewards**: Track reward points and top performers
- **Staking Operations**: Bond, nominate, unbond, claim rewards

**Run:**

```bash
ts-node examples/staking-dashboard.ts
```

**Key Features:**

- Real-time era and session tracking
- Validator performance metrics
- Reward distribution information
- Example staking transaction code

---

### 2. Validator Monitor (`validator-monitor.ts`)

Demonstrates validator and consensus monitoring:

- **Session Information**: Current session, progress, block count
- **Committee Details**: Active committee members and structure
- **Elections**: View committee seats, election mode, next era validators
- **Validator Performance**: Track uptime, block production, ban status
- **Aleph Protocol**: Finality version, inflation parameters, emergency finality

**Run:**

```bash
ts-node examples/validator-monitor.ts
```

**Key Features:**

- Real-time session progress tracking
- Validator performance history
- Committee composition analysis
- Consensus protocol parameters

**Monitoring Tips:**

- Check session progress to predict validator rotations
- Track validator uptime for performance analysis
- Monitor committee changes for network security

---

### 3. Governance Tracker (`governance-tracker.ts`)

Demonstrates democracy and governance features:

- **Active Referenda**: View ongoing votes with current tallies
- **Public Proposals**: Browse proposals awaiting referendum status
- **Voting System**: Submit votes with conviction multipliers
- **Proposal Submission**: Create and second proposals
- **Vote Delegation**: Delegate voting power to other accounts
- **Conviction Levels**: Understand lock periods and vote weights

**Run:**

```bash
ts-node examples/governance-tracker.ts
```

**Key Features:**

- Complete referendum lifecycle tracking
- Vote tallying and percentage calculations
- Conviction multiplier system (0.1x to 6x)
- Delegation management

**Conviction System:**
| Conviction | Multiplier | Lock Period |
|-----------|-----------|-------------|
| None | 0.1x | No lock |
| Locked1x | 1x | 1 enactment |
| Locked2x | 2x | 2 enactments |
| Locked3x | 3x | 4 enactments |
| Locked4x | 4x | 8 enactments |
| Locked5x | 5x | 16 enactments |
| Locked6x | 6x | 32 enactments |

**Example:** 100 SEL with Locked3x = 300 SEL voting power, locked for 4 enactment periods

---

### 4. Unified Accounts (`unified-accounts.ts`)

Demonstrates unified account management:

- **Address Conversion**: Convert between Substrate and EVM addresses
- **Address Validation**: Validate and identify address types
- **Unified Balance**: Query balances across Substrate and EVM layers
- **Batch Conversion**: Convert multiple addresses at once
- **On-Chain Mapping**: Query and manage address mappings
- **Account Claiming**: Claim EVM addresses with EIP-712 signatures

**Run:**

```bash
ts-node examples/unified-accounts.ts
```

**Key Features:**

- Bidirectional address conversion (Substrate ↔ EVM)
- Total balance aggregation across both VMs
- On-chain mapping verification
- EIP-712 signature-based claiming

**Use Cases:**

1. **Cross-VM DApp Development**: Single identity across Substrate and EVM
2. **User Experience**: Use MetaMask with Substrate accounts
3. **Asset Migration**: Move assets between VMs seamlessly

**Important Notes:**

- ⚠️ **Transfer assets BEFORE claiming** - mappings cannot be changed once created
- Storage fee required for claiming
- EIP-712 signatures ensure secure address ownership

---

### 5. React Hooks Example (`react-hooks-example.tsx`)

Demonstrates React integration with all SDK hooks:

- **useStaking**: Staking dashboard with real-time updates
- **useAleph**: Validator monitoring component
- **useElections**: Committee and elections tracking
- **useGovernance**: Referendum voting interface
- **useUnifiedAccounts**: Address conversion and balance display

**Setup:**

```bash
npm install react react-dom @types/react @types/react-dom
```

**Run:**

```bash
# In a React project
import { StakingDashboard, ValidatorMonitor, GovernanceTracker } from 'selendra-sdk/examples/react-hooks-example';
```

**Components:**

- `<StakingDashboard />` - Full staking interface
- `<ValidatorMonitor />` - Session and validator tracking
- `<GovernanceTracker />` - Referendum voting UI
- `<UnifiedAccountsDemo />` - Address conversion tool
- `<CompleteExampleApp />` - Integrated multi-tab application

**Features:**

- Auto-refresh with configurable intervals
- Loading and error states
- Transaction execution from UI
- Responsive design with CSS

---

## Running Examples

### Prerequisites

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build
```

### Run Individual Examples

```bash
# Staking dashboard
ts-node examples/staking-dashboard.ts

# Validator monitor
ts-node examples/validator-monitor.ts

# Governance tracker
ts-node examples/governance-tracker.ts

# Unified accounts
ts-node examples/unified-accounts.ts
```

### Network Configuration

All examples connect to Selendra mainnet by default:

```typescript
const sdk = await createSDK({
  network: 'mainnet' as any,
  endpoint: 'wss://rpc.selendra.org',
});
```

To use testnet:

```typescript
const sdk = await createSDK({
  network: 'testnet' as any,
  endpoint: 'wss://rpc-testnet.selendra.org',
});
```

---

## Example Patterns

### Basic Pattern

```typescript
import { createSDK } from '../src/sdk';

async function main() {
  const sdk = await createSDK({ network: 'mainnet' as any });
  await sdk.connect();

  // Use SDK features
  const api = (sdk as any).substrateApi;

  await sdk.disconnect();
}

main().catch(console.error);
```

### Transaction Pattern

```typescript
import { Keyring } from '@polkadot/keyring';

const keyring = new Keyring({ type: 'sr25519' });
const signer = keyring.addFromUri('//Alice');

const result = await staking.bond(signer, '1000000000000000000', 'Staked');
console.log('Transaction hash:', result.hash);
```

### React Hook Pattern

```typescript
import { useStaking } from 'selendra-sdk/react';

function MyComponent() {
  const { currentEra, validators, loading, error } = useStaking(api);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Era: {currentEra}</div>;
}
```

---

## Learning Path

**1. Start with Staking Dashboard** (`staking-dashboard.ts`)

- Learn basic SDK initialization
- Understand query patterns
- See transaction examples

**2. Explore Validator Monitor** (`validator-monitor.ts`)

- Advanced consensus queries
- Performance tracking
- Committee management

**3. Study Governance Tracker** (`governance-tracker.ts`)

- Democracy operations
- Vote submission
- Conviction mechanics

**4. Master Unified Accounts** (`unified-accounts.ts`)

- Cross-VM functionality
- Address conversion
- Balance aggregation

**5. Build with React Hooks** (`react-hooks-example.tsx`)

- Frontend integration
- State management
- User interactions

---

## API Documentation

For complete API documentation, see:

- [Staking API](../docs/api/staking.md)
- [Aleph Consensus API](../docs/api/aleph.md)
- [Elections API](../docs/api/elections.md)
- [Democracy API](../docs/api/democracy.md)
- [Unified Accounts API](../docs/api/unified-accounts.md)
- [React Hooks API](../docs/api/react-hooks.md)

---

## Troubleshooting

**Connection Issues:**

```typescript
// Use explicit endpoint
const sdk = await createSDK({
  network: 'mainnet' as any,
  endpoint: 'wss://rpc.selendra.org',
});
```

**Transaction Failures:**

```typescript
try {
  const result = await staking.bond(signer, amount, payee);
  console.log('Success:', result.hash);
} catch (error) {
  console.error('Transaction failed:', error.message);
}
```

**TypeScript Errors:**

```bash
# Ensure all dependencies are installed
npm install

# Rebuild TypeScript
npm run build
```

---

## Contributing

To add new examples:

1. Create a new `.ts` file in this directory
2. Follow the established pattern (imports, main function, error handling)
3. Add comprehensive comments explaining each feature
4. Include example output and usage instructions
5. Update this README with example details

---

## License

MIT License - see [LICENSE](../LICENSE) for details
