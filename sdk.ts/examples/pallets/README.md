# Pallet Examples

Comprehensive demos for all Selendra SDK pallets using local node.

## Prerequisites

1. **Start a local Selendra node:**
   ```bash
   # Use Substrate node template or Selendra node
   ./target/release/selendra --dev --ws-port 9944
   ```

2. **Install dependencies:**
   ```bash
   cd examples
   npm install
   ```

## Running Examples

### Balances Pallet

Demonstrates all Balances pallet functions:
- Transfer operations (transfer, transferKeepAlive, transferAll)
- Force operations (forceTransfer, forceSetBalance, forceUnreserve)
- Balance queries (free, reserved, locked, total)
- Fee estimation
- Event listeners

```bash
npm run pallet:balances
```

**Configuration:**
- Endpoint: `ws://127.0.0.1:9944`
- Accounts: Alice, Bob (from `.env` file)

### Staking Pallet

Demonstrates all Staking pallet functions:

**Network Queries:**
- Current/Active era
- Bonding duration
- Min bond amounts
- Validator count

**Account Operations:**
- Bond/Unbond funds
- Nominate validators
- Validate (become validator)
- Chill (stop nominating/validating)
- Set reward destination

**Rewards:**
- Get pending rewards
- Payout stakers
- Track reward events

**Advanced:**
- Era reward points
- Validator exposure
- Slashing information
- Event listeners

```bash
npm run pallet:staking
```

**Configuration:**
- Endpoint: `ws://127.0.0.1:9944`
- Accounts: Alice, Bob, Charlie, Dave, Eve, Ferdie (test accounts)

## Test Accounts

Local development nodes come with pre-funded test accounts:

| Account | Address | 
|---------|---------|
| Alice   | 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY |
| Bob     | 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty |
| Charlie | 5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y |
| Dave    | 5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy |
| Eve     | 5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw |
| Ferdie  | 5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL |

Access via: `keyring.addFromUri('//Alice')`

## Structure

```
pallets/
├── balances-demo.ts    # Balances pallet examples
├── staking-demo.ts     # Staking pallet examples
└── README.md           # This file
```

## Notes

- **No Transactions Submitted:** Demos create transactions but don't submit them by default
- **Read-Only:** Most operations are queries that don't modify state
- **Event Listeners:** Demos show how to listen to chain events
- **Fee Estimation:** Shows how to calculate transaction fees

## Submitting Transactions

To actually submit transactions (modifies chain state), uncomment the `signAndSend` example:

```typescript
const unsub = await bondTx.signAndSend(alice, ({ status, events }) => {
  console.log('Transaction status:', status.type);

  if (status.isInBlock) {
    console.log('Included in block:', status.asInBlock.toHex());
    
    events.forEach(({ event }) => {
      if (event.section === 'staking' && event.method === 'Bonded') {
        console.log('Bonded event:', event.data.toString());
      }
    });
  }

  if (status.isFinalized) {
    console.log('Finalized in block:', status.asFinalized.toHex());
    unsub();
  }
});
```

## Troubleshooting

**Connection Error:**
```
Error: WebSocket connection failed
```
→ Make sure local node is running on `ws://127.0.0.1:9944`

**Account Not Found:**
```
Error: Unable to find mnemonic for Alice
```
→ Check `.env` file has correct account configuration

**Build Errors:**
```bash
# Rebuild SDK
cd ..
npm run build
cd examples
```

## Next Steps

- Check other pallet examples as they're added
- Read the [SDK Documentation](../../README.md)
- Explore the [source code](../../src/pallets/)
