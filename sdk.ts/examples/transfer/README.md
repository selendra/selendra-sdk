# Transfer Examples

This directory contains examples demonstrating transaction capabilities of the Selendra SDK for both EVM and Substrate chains.

## Examples

### EVM Chain Examples

### 01. Native SEL Transfer (EVM)
**File:** `01-native-transfer.ts`

Demonstrates how to send native SEL tokens on the EVM chain.

```bash
npm run transfer:native
```

**Features:**
- Connect to Selendra EVM
- Check sender balance
- Send native SEL tokens
- Verify transaction with balance check

**Required Environment Variables:**
```bash
export PRIVATE_KEY="0x..."  # Your private key
```

---

### 02. ERC20 Token Transfer
**File:** `02-erc20-transfer.ts`

Shows how to transfer ERC20 tokens using custom contract addresses.

```bash
npm run transfer:erc20
```

**Features:**
- Get token information (name, symbol, decimals)
- Check token balance
- Transfer ERC20 tokens
- Verify transfer completion

**Required Environment Variables:**
```bash
export PRIVATE_KEY="0x..."           # Your private key
export TOKEN_CONTRACT="0x..."        # ERC20 contract address
```

---

### 03. Custom Contract Interaction
**File:** `03-contract-interaction.ts`

Demonstrates advanced contract interactions with custom ABIs.

```bash
npm run transfer:contract
```

**Features:**
- Read-only contract calls (no gas)
- Write transactions (state changes)
- Transactions with native token value
- Contract calls with parameters

**Example Use Cases:**
- Storage contracts (get/set values)
- DEX swaps with native tokens
- Reading contract state (reserves, balances)
- Any custom contract interaction

**Required Environment Variables:**
```bash
export PRIVATE_KEY="0x..."           # Your private key
export CONTRACT_ADDRESS="0x..."      # Smart contract address
```

---

### Substrate Chain Examples

### 04. Substrate Native Transfer
**File:** `04-substrate-transfer.ts`

Demonstrates how to send native SEL tokens on the Substrate chain.

```bash
npm run transfer:substrate
```

**Features:**
- Connect to Selendra Substrate
- Create keypair from seed/mnemonic
- Send native SEL tokens (in planck)
- Wait for transaction finalization
- Verify with balance checks

**Required Environment Variables:**
```bash
export SENDER_URI="//Alice"                    # Sender seed/mnemonic
export RECIPIENT="5FHneW46xGXgs5m..."          # Recipient address
```

**Notes:**
- Waits for finalization (12-60 seconds)
- Amount in planck (1 SEL = 10^18 planck)
- Uses Polkadot Keyring for signing

---

### 05. Substrate Transfer (No Wait)
**File:** `05-substrate-transfer-nowait.ts`

Send transfer without waiting for finalization.

```bash
npm run transfer:substrate-nowait
```

**Features:**
- Submit transaction immediately
- Returns transaction hash without waiting
- Useful for batch operations
- Continues execution without blocking

**Required Environment Variables:**
```bash
export SENDER_URI="//Alice"
export RECIPIENT="5FHneW46xGXgs5m..."
```

---

### 06. Substrate Transfer All
**File:** `06-substrate-transfer-all.ts`

Transfer all available balance while keeping account alive.

```bash
npm run transfer:substrate-all
```

**Features:**
- Transfer maximum available balance
- Leaves existential deposit
- Keeps account active
- Automatic fee calculation

**Required Environment Variables:**
```bash
export SENDER_URI="//Alice"
export RECIPIENT="5FHneW46xGXgs5m..."
```

---

## SDK Methods Used

### EVM Transfer Methods

#### `sendTransfer(privateKey, to, amount)` - EVM
Send native SEL tokens on EVM chain.

```typescript
const txHash = await sdk.sendTransfer(
  '0x...',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  '1.5' // Amount in SEL
);
```

### Substrate Transfer Methods

#### `sendTransfer(from, to, amount)` - Substrate
Send native SEL tokens on Substrate chain (waits for finalization).

```typescript
import { Keyring } from '@polkadot/api';
const keyring = new Keyring({ type: 'sr25519' });
const pair = keyring.addFromUri('//Alice');

const txHash = await sdk.sendTransfer(
  pair,
  '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  '1000000000000000000' // Amount in planck (1 SEL)
);
```

#### `sendTransferNoWait(from, to, amount)` - Substrate
Send transfer without waiting for finalization.

```typescript
const txHash = await sdk.sendTransferNoWait(
  pair,
  '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  '500000000000000000' // 0.5 SEL in planck
);
// Returns immediately with tx hash
```

#### `transferAll(from, to)` - Substrate
Transfer all available balance (keeps existential deposit).

```typescript
const txHash = await sdk.transferAll(
  pair,
  '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
);
```

### ERC20 Methods

#### `sendERC20Transfer(privateKey, contractAddress, to, amount, decimals)`
Transfer ERC20 tokens with custom contract.

```typescript
const txHash = await sdk.sendERC20Transfer(
  '0x...',
  '0x1234...', // Token contract
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  '100',
  18 // Token decimals
);
```

#### `executeContractTransaction(privateKey, contractAddress, abi, functionName, args, value?)`
Execute any contract transaction.

```typescript
const txHash = await sdk.executeContractTransaction(
  '0x...',
  '0x1234...',
  contractABI,
  'swap',
  [tokenIn, tokenOut, amountIn, amountOutMin],
  '0.1' // Optional SEL value
);
```

### Read-Only Methods

#### `callContractFunction(contractAddress, abi, functionName, args)`
Call contract function without gas cost.

```typescript
const value = await sdk.callContractFunction(
  '0x1234...',
  storageABI,
  'get',
  []
);
```

#### `getERC20Balance(contractAddress, account)`
Get ERC20 token balance.

```typescript
const balance = await sdk.getERC20Balance(
  '0x1234...',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
);
```

#### `getERC20Info(contractAddress)`
Get token metadata.

```typescript
const info = await sdk.getERC20Info('0x1234...');
console.log(info.name, info.symbol, info.decimals);
```

---

## Important Notes

### Security
⚠️ **NEVER commit private keys to version control!**

Always use environment variables:
```bash
# .env file (add to .gitignore)
PRIVATE_KEY=0x...
TOKEN_CONTRACT=0x...
CONTRACT_ADDRESS=0x...
```

### Gas Fees
All write transactions require gas fees in SEL:
- Native transfers: ~21,000 gas
- ERC20 transfers: ~50,000-70,000 gas
- Contract interactions: Variable (depends on complexity)

Ensure your wallet has sufficient SEL for gas fees.

### Transaction Confirmation
All transaction methods wait for confirmation:
```typescript
const txHash = await sdk.sendTransfer(...);
// Transaction is mined and confirmed when promise resolves
```

### ABI Format
Contract ABIs can be provided as:
- **Human-readable strings** (recommended for examples):
  ```typescript
  const abi = [
    'function transfer(address to, uint256 amount) public returns (bool)',
    'function balanceOf(address account) public view returns (uint256)'
  ];
  ```

- **Full JSON ABI** (for complex contracts):
  ```typescript
  const abi = [
    {
      "inputs": [{"type": "address", "name": "to"}],
      "name": "transfer",
      "outputs": [{"type": "bool"}],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
  ```

---

## Testing

Before running examples with real transactions:

1. **Use testnet first** (if available)
2. **Start with small amounts**
3. **Verify addresses carefully**
4. **Check contract addresses are correct**
5. **Ensure sufficient balance for gas**

---

## Common Issues

### "Insufficient balance"
- Check wallet has enough SEL for both transfer and gas
- Use `sdk.getFormattedBalance()` to verify

### "Contract not found"
- Verify contract address is correct
- Ensure contract is deployed on Selendra network

### "Transaction reverted"
- Check contract function parameters
- Verify you have necessary permissions/approvals
- Ensure contract logic conditions are met

### "Invalid private key"
- Private key must start with '0x'
- Must be 64 hex characters (+ '0x' prefix)

---

## Next Steps

- Explore [Balance Examples](../balance/) for checking balances
- See [Connection Examples](../connect/) for connection patterns
- Check [Main README](../README.md) for full SDK documentation
