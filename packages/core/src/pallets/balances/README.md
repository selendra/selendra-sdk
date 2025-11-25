# Balances Pallet

Complete TypeScript implementation for the Selendra Balances pallet (pallet-balances).

## Features

✅ **All Extrinsics (Transactions)**
- `transfer()` - Transfer balance to another account
- `transferKeepAlive()` - Transfer, ensuring sender stays above existential deposit
- `transferAll()` - Transfer all free balance
- `forceTransfer()` - Root-only forced transfer (sudo)
- `forceUnreserve()` - Root-only unreserve balance (sudo)
- `setBalance()` - Root-only set balance (sudo)

✅ **All Storage Queries**
- `totalIssuance()` - Get total issuance of native token
- `account()` - Get account balance information
- `locks()` - Get account locks
- `reserves()` - Get named reserves
- `freeBalance()` - Get free balance
- `reservedBalance()` - Get reserved balance
- `frozenBalance()` - Get frozen balance

✅ **Helper Functions**
- `getBalance()` - Get complete balance information
- `getLockedBalance()` - Get total locked balance
- `getReservedBalance()` - Get reserved balance
- `getTransferableBalance()` - Get transferable balance
- `estimateTransferFee()` - Estimate transfer fee
- `getExistentialDeposit()` - Get existential deposit
- `accountExists()` - Check if account exists
- `getMaxTransferable()` - Calculate maximum transferable amount

✅ **Event Monitoring**
- `onTransfer()` - Listen for Transfer events
- `onBalanceSet()` - Listen for BalanceSet events
- `onReserved()` - Listen for Reserved events
- `onUnreserved()` - Listen for Unreserved events
- `onDeposit()` - Listen for Deposit events
- `onWithdraw()` - Listen for Withdraw events

## Installation

```bash
npm install @selendrajs/sdk-core
```

## Usage

### Basic Setup

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api';
import { BalancesManager } from '@selendrajs/sdk-core';

// Connect to Selendra
const provider = new WsProvider('wss://rpc-testnet.selendra.org');
const api = await ApiPromise.create({ provider });

// Initialize Balances manager
const balances = new BalancesManager(api);
```

### Query Balances

```typescript
// Get complete balance info
const balanceInfo = await balances.getBalance(address);
console.log('Free:', balanceInfo.free);
console.log('Reserved:', balanceInfo.reserved);
console.log('Locked:', balanceInfo.locked);
console.log('Transferable:', balanceInfo.transferable);
console.log('Total:', balanceInfo.total);

// Get specific balance types
const free = await balances.queries.freeBalance(address);
const reserved = await balances.getReservedBalance(address);
const transferable = await balances.getTransferableBalance(address);

// Get total issuance
const totalIssuance = await balances.queries.totalIssuance();

// Get existential deposit
const ed = await balances.getExistentialDeposit();
```

### Transfer Balance

```typescript
import { Keyring } from '@polkadot/keyring';

const keyring = new Keyring({ type: 'sr25519' });
const alice = keyring.addFromUri('//Alice');

// Simple transfer
const tx = balances.transfer({
  dest: bobAddress,
  value: 1_000_000_000_000_000_000n, // 1 SEL
});

await tx.signAndSend(alice, ({ status, events }) => {
  if (status.isInBlock) {
    console.log('Transfer included in block');
    
    events.forEach(({ event }) => {
      if (api.events.balances.Transfer.is(event)) {
        const [from, to, amount] = event.data;
        console.log(`Transferred ${amount} from ${from} to ${to}`);
      }
    });
  }
});

// Transfer keep alive (keeps sender above ED)
const keepAliveTx = balances.transferKeepAlive({
  dest: bobAddress,
  value: 500_000_000_000_000_000n, // 0.5 SEL
});

await keepAliveTx.signAndSend(alice);

// Transfer all
const transferAllTx = balances.transferAll({
  dest: bobAddress,
  keepAlive: true, // Keep sender alive
});

await transferAllTx.signAndSend(alice);
```

### Estimate Fees

```typescript
// Estimate transfer fee
const fee = await balances.estimateTransferFee(
  aliceAddress,
  bobAddress,
  1_000_000_000_000_000_000n
);

console.log('Fee:', fee.partialFee);
console.log('Weight:', fee.weight);
console.log('Class:', fee.class);

// Calculate max transferable (accounting for fees and ED)
const maxTransfer = await balances.getMaxTransferable(aliceAddress, true);
console.log('Can transfer up to:', maxTransfer);
```

### Monitor Events

```typescript
// Listen for all transfers
const unsubscribe = await balances.onTransfer((event) => {
  console.log('Transfer detected:');
  console.log('From:', event.from);
  console.log('To:', event.to);
  console.log('Amount:', event.amount);
});

// Stop listening
unsubscribe();

// Listen for balance changes
await balances.onBalanceSet((event) => {
  console.log(`Balance set for ${event.who}`);
  console.log(`Free: ${event.free}, Reserved: ${event.reserved}`);
});

// Listen for reserves
await balances.onReserved((event) => {
  console.log(`${event.amount} reserved for ${event.who}`);
});

await balances.onUnreserved((event) => {
  console.log(`${event.amount} unreserved for ${event.who}`);
});
```

### Check Account Status

```typescript
// Check if account exists (has balance above ED)
const exists = await balances.accountExists(address);

// Get locks
const locks = await balances.queries.locks(address);
locks.forEach(lock => {
  console.log(`Lock ${lock.id}: ${lock.amount} (${lock.reasons})`);
});

// Get named reserves
const reserves = await balances.queries.reserves(address);
reserves.forEach(reserve => {
  console.log(`Reserve ${reserve.id}: ${reserve.amount}`);
});
```

### Admin Functions (Sudo)

```typescript
// Force transfer (sudo only)
const forceTx = balances.forceTransfer({
  source: aliceAddress,
  dest: bobAddress,
  value: 1_000_000_000_000_000_000n,
});

await forceTx.signAndSend(sudoAccount);

// Set balance (sudo only)
const setBalanceTx = balances.setBalance({
  who: targetAddress,
  newFree: 10_000_000_000_000_000_000n,
  newReserved: 0n,
});

await setBalanceTx.signAndSend(sudoAccount);

// Force unreserve (sudo only)
const unreserveTx = balances.forceUnreserve({
  who: targetAddress,
  amount: 1_000_000_000_000_000_000n,
});

await unreserveTx.signAndSend(sudoAccount);
```

## Types

### BalanceInfo

```typescript
interface BalanceInfo {
  free: bigint;          // Free balance
  reserved: bigint;      // Reserved balance
  frozen: bigint;        // Frozen balance
  locked: bigint;        // Locked balance (max of all locks)
  transferable: bigint;  // Transferable balance
  total: bigint;         // Total balance (free + reserved)
}
```

### TransferParams

```typescript
interface TransferParams {
  dest: string;    // Destination address
  value: bigint;   // Amount to transfer
}
```

### FeeEstimate

```typescript
interface FeeEstimate {
  partialFee: bigint;  // Estimated fee
  weight: {
    refTime: bigint;
    proofSize: bigint;
  };
  class: 'Normal' | 'Operational' | 'Mandatory';
}
```

## Example

See [examples/pallets/balances-demo.ts](../../../examples/pallets/balances-demo.ts) for a complete example demonstrating all features.

**Setup:**
1. Copy `examples/.env.example` to `examples/.env`
2. Add your Substrate private key and addresses
3. Run the demo:

```bash
npm run balances:demo
```

## Reference

- **Pallet:** `pallet-balances`
- **Priority:** 🔴 P0 - Critical
- **Status:** ✅ Complete
- **Functions:** 25+ (6 extrinsics, 10 queries, 9 helpers)
- **Events:** 6 event listeners

## Related

- [Unified Accounts](../unified-accounts/) - Link Substrate and EVM accounts
- [Staking](../staking/) - Stake and earn rewards (coming soon)
