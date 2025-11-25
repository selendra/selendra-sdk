# EVM Transfer & Contract Transaction Implementation

## Overview

Added comprehensive EVM transaction capabilities to the Selendra SDK, including:
- Native SEL token transfers
- ERC20 token transfers with custom contracts
- Generic smart contract interactions
- Read-only contract calls

## Implementation Summary

### 1. New Provider Methods (src/providers/evm.ts)

Added 6 new methods to `EvmProvider` class:

#### Transaction Methods
- **`sendTransfer(privateKey, to, amount)`** - Send native SEL tokens
- **`sendERC20Transfer(privateKey, contractAddress, to, amount, decimals)`** - Transfer ERC20 tokens
- **`executeContractTransaction(privateKey, contractAddress, abi, functionName, args, value?)`** - Execute any contract transaction

#### Read-Only Methods
- **`callContractFunction(contractAddress, abi, functionName, args)`** - Call contract without gas
- **`getERC20Balance(contractAddress, account)`** - Get token balance
- **`getERC20Info(contractAddress)`** - Get token metadata (name, symbol, decimals)

### 2. SDK Wrapper Methods (src/core/sdk.ts)

Added corresponding wrapper methods to `SelendraSDK` class:
- All 6 provider methods exposed at SDK level
- Type-safe with proper validation
- Chain type checking (EVM only)
- Comprehensive JSDoc documentation

### 3. Example Files (examples/transfer/)

Created 3 comprehensive examples:

#### 01-native-transfer.ts
- Native SEL token transfer
- Balance checking before/after
- Transaction confirmation
- Gas calculation

#### 02-erc20-transfer.ts
- ERC20 token transfers
- Token information retrieval
- Custom contract addresses
- Balance verification

#### 03-contract-interaction.ts
- Read-only contract calls
- Write transactions
- Transactions with value
- Multiple ABI examples (Storage, DEX)

### 4. Documentation

- **examples/transfer/README.md** - Complete transfer examples guide
- **examples/README.md** - Updated with transfer section
- **examples/package.json** - Added npm scripts

## API Reference

### Transfer Methods

```typescript
// Native SEL transfer
const txHash = await sdk.sendTransfer(
  '0x...',                                      // privateKey
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // to
  '1.5'                                         // amount in SEL
);

// ERC20 transfer
const txHash = await sdk.sendERC20Transfer(
  '0x...',                                      // privateKey
  '0x1234...',                                  // contractAddress
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // to
  '100',                                        // amount
  18                                            // decimals
);

// Custom contract transaction
const txHash = await sdk.executeContractTransaction(
  '0x...',                                      // privateKey
  '0x1234...',                                  // contractAddress
  contractABI,                                  // abi
  'functionName',                               // functionName
  [arg1, arg2],                                 // args
  '0.1'                                         // value (optional)
);
```

### Read-Only Methods

```typescript
// Call contract function (no gas)
const result = await sdk.callContractFunction(
  '0x1234...',                                  // contractAddress
  contractABI,                                  // abi
  'functionName',                               // functionName
  [arg1, arg2]                                  // args
);

// Get ERC20 balance
const balance = await sdk.getERC20Balance(
  '0x1234...',                                  // contractAddress
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'  // account
);

// Get ERC20 info
const info = await sdk.getERC20Info('0x1234...');
console.log(info.name, info.symbol, info.decimals);
```

## NPM Scripts

```bash
# Native transfer
npm run transfer:native

# ERC20 transfer
npm run transfer:erc20

# Contract interaction
npm run transfer:contract
```

## Environment Variables

```bash
# Required for all transfers
export PRIVATE_KEY="0x..."

# Required for ERC20 transfers
export TOKEN_CONTRACT="0x..."

# Required for contract interactions
export CONTRACT_ADDRESS="0x..."
```

## Technical Details

### Transaction Flow
1. **Wallet Creation** - ethers.Wallet from private key + provider
2. **Transaction Preparation** - Format parameters, convert amounts
3. **Transaction Execution** - Send transaction via wallet
4. **Confirmation** - Wait for transaction to be mined (tx.wait())
5. **Return Hash** - Return transaction hash to caller

### Amount Conversion
- Native SEL: Uses `ethers.parseEther()` to convert SEL to wei
- ERC20: Uses `BigInt(amount * 10^decimals)` for token units
- Custom contracts: Caller responsible for parameter formatting

### Error Handling
- Provider validation (must be connected)
- Chain type validation (EVM only)
- Transaction errors caught and logged
- User-friendly error messages

### Gas Estimation
- Automatic gas estimation by ethers.js
- No manual gas limit configuration needed
- Gas price determined by network

## Code Structure

```
sdk.ts/
├── src/
│   ├── core/
│   │   └── sdk.ts           # 6 new wrapper methods
│   └── providers/
│       └── evm.ts           # 6 new provider methods (~180 lines)
└── examples/
    ├── transfer/
    │   ├── 01-native-transfer.ts
    │   ├── 02-erc20-transfer.ts
    │   ├── 03-contract-interaction.ts
    │   └── README.md
    ├── package.json         # Updated with scripts
    └── README.md            # Updated with transfer section
```

## Testing

All examples include:
- Connection verification
- Balance checking
- Transaction execution
- Result verification
- Proper cleanup (destroy SDK)

## Security Notes

⚠️ **NEVER commit private keys!**

- Use environment variables
- Add `.env` to `.gitignore`
- Use testnet for testing
- Start with small amounts

## Future Enhancements

Potential additions:
- Substrate transfer methods
- Transaction status tracking
- Gas price configuration
- Batch transactions
- Event listening for transactions
- Transaction retry logic

## Compilation

All code compiles without errors:
```bash
npm run build  # Main SDK
cd examples && npm run build  # Examples
```

## Summary

✅ **6 new methods** in EvmProvider  
✅ **6 wrapper methods** in SelendraSDK  
✅ **3 comprehensive examples** with documentation  
✅ **NPM scripts** for easy testing  
✅ **Type-safe** TypeScript implementation  
✅ **Production-ready** with error handling  

The SDK now supports complete EVM transaction workflows including native transfers, ERC20 tokens, and arbitrary smart contract interactions.
