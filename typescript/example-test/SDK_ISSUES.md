# SDK Issues & Findings

## Issue #1: getBalance() EVM Address Support

### Summary
The `getBalance()` method fails when querying EVM addresses while connected to a Substrate endpoint.

### Error Details
```
Error: createType(Vec<StorageKey>):: createType(Lookup0):: Invalid AccountId provided, expected 32 bytes, found 20
```

### Root Cause
The SDK's `getBalance()` method in `src/sdk.ts` uses `this.config.chainType` to determine which API to use:

```typescript
async getBalance(address: string, options = {}): Promise<BalanceInfo> {
  this.ensureConnected();

  if (this.config.chainType === ChainType.EVM && this.evmClient) {
    return await this.evmClient.getBalanceInfo(address, options);
  }

  // Substrate balance
  if (this.api) {
    const account: any = await this.api.query.system.account(address);
    // ...
  }
}
```

**Problem**: 
- The SDK is connected with `chainType: ChainType.Substrate`
- When an EVM address (20 bytes, e.g., `0xdc755dBB3BD4AcF914cE1646B06FeF6f854f1756`) is passed
- The method still uses `this.api.query.system.account(address)` 
- Substrate expects 32-byte SS58 addresses, not 20-byte EVM addresses
- This causes the error

### Expected Behavior
The SDK should:
1. **Auto-detect** the address type (EVM vs Substrate) based on format
2. **Route to appropriate API** regardless of initial connection type
3. **Support unified accounts** - allow querying both address types in a single connection

### Workaround
Connect with both Substrate and EVM clients, or use the `UnifiedAddress` class from `src/unified/accounts.ts`.

### Suggested Fix

#### Option 1: Auto-detect address type
```typescript
async getBalance(address: string, options = {}): Promise<BalanceInfo> {
  this.ensureConnected();

  // Auto-detect address type
  const isEvmAddress = /^0x[0-9a-fA-F]{40}$/.test(address);

  if (isEvmAddress && this.evmClient) {
    return await this.evmClient.getBalanceInfo(address, options);
  }

  if (this.config.chainType === ChainType.EVM && this.evmClient) {
    return await this.evmClient.getBalanceInfo(address, options);
  }

  // Substrate balance
  if (this.api) {
    const account: any = await this.api.query.system.account(address);
    // ...
  }
}
```

#### Option 2: Initialize both clients
Allow SDK to connect to both Substrate and EVM simultaneously:

```typescript
async connect(): Promise<void> {
  // Connect to Substrate
  await this.connectSubstrate();
  
  // Also initialize EVM client if EVM endpoint is provided
  if (this.config.evmEndpoint) {
    await this.connectEVM();
  }
}
```

#### Option 3: Use UnifiedAddress
Leverage the existing `UnifiedAddress` class to convert between formats:

```typescript
async getBalance(address: string, options = {}): Promise<BalanceInfo> {
  this.ensureConnected();

  const isEvmAddress = /^0x[0-9a-fA-F]{40}$/.test(address);

  if (isEvmAddress) {
    // Convert EVM address to Substrate for querying
    const unifiedAddr = new UnifiedAddress(address);
    const substrateAddr = unifiedAddr.getSubstrate();
    
    if (this.api) {
      const account: any = await this.api.query.system.account(substrateAddr);
      // ...
    }
  }
  
  // Regular flow for Substrate addresses
  // ...
}
```

### Impact
- **Severity**: Medium
- **Affected Functions**: `getBalance()`, potentially `getAccount()` and other address-based queries
- **User Impact**: Users cannot query EVM addresses when connected to Substrate
- **Workaround Available**: Yes (connect with EVM client or convert addresses manually)

### Testing Status
- ✅ Substrate address balance queries work correctly
- ❌ EVM address balance queries fail with "Invalid AccountId" error
- ⏳ Mixed address type queries not yet tested

### Related Files
- `typescript/src/sdk.ts` - Main SDK class with `getBalance()` method
- `typescript/src/evm/client.ts` - EVM client with `getBalanceInfo()` method
- `typescript/src/unified/accounts.ts` - UnifiedAddress class for address conversion
- `typescript/example-test/src/examples/core-sdk/get-balance.ts` - Test demonstrating the issue

### Next Steps
1. Discuss with team which fix option to implement
2. Add address type detection utility
3. Update `getBalance()` and similar methods
4. Add comprehensive tests for mixed address types
5. Document behavior in API reference

---

**Reported**: November 18, 2025
**Reporter**: SDK Testing Team
**Status**: Identified - Awaiting Fix
