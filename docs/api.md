# API Reference

## SelendraSDK

### Constructor

```typescript
new SelendraSDK(config: SelendraSDKConfig)
```

#### Parameters
- `config.network`: `'mainnet' | 'testnet' | NetworkConfig`
- `config.provider?`: Custom provider for EVM
- `config.substrateEndpoint?`: Custom Substrate endpoint

### Methods

#### `initialize(): Promise<void>`
Initialize SDK connections to blockchain networks.

#### `disconnect(): Promise<void>`
Disconnect from all network connections.

#### `getNetworkStatus(): Promise<NetworkStatus>`
Get comprehensive network status information.

#### `connectWallet(providerName?: string): Promise<WalletConnection>`
Connect to a wallet provider or auto-detect available wallets.

#### `getAccountInfo(address: string): Promise<AccountInfo>`
Get account information from both EVM and Substrate layers.

## EVM Module

### Constructor
```typescript
new EVM(networkConfig: NetworkConfig, provider?: any)
```

### Methods

#### Connection Methods

##### `connect(provider?: any): Promise<string>`
Connect to wallet and return account address.

##### `getAccount(): Promise<string>`
Get current connected account address.

#### Balance Methods

##### `getBalance(address?: string): Promise<string>`
Get native token balance in Wei.

##### `getFormattedBalance(address?: string, decimals?: number): Promise<string>`
Get formatted native token balance.

##### `getTokenBalance(tokenAddress: string, userAddress?: string): Promise<string>`
Get ERC-20 token balance.

##### `getFormattedTokenBalance(tokenAddress: string, userAddress?: string, decimals?: number): Promise<string>`
Get formatted ERC-20 token balance.

#### Transaction Methods

##### `transfer(to: string, amount: string, options?: TransactionOptions): Promise<string>`
Send native token transfer.

##### `sendTransaction(transaction: any, options?: TransactionOptions): Promise<string>`
Send custom transaction.

##### `waitForTransaction(hash: string, confirmations?: number): Promise<TransactionReceipt>`
Wait for transaction confirmation.

##### `getTransaction(hash: string): Promise<TransactionResponse>`
Get transaction details by hash.

##### `getTransactionReceipt(hash: string): Promise<TransactionReceipt>`
Get transaction receipt by hash.

#### Gas Methods

##### `getGasPrice(): Promise<string>`
Get current gas price.

##### `getGasPrices(): Promise<GasPriceInfo>`
Get gas price suggestions (slow, standard, fast, instant).

##### `estimateGas(transaction: any): Promise<string>`
Estimate gas for transaction.

#### Network Methods

##### `getBlockNumber(): Promise<number>`
Get current block number.

##### `getBlock(blockHashOrNumber: string | number): Promise<Block>`
Get block details.

##### `getNetwork(): Promise<Network>`
Get network information.

##### `switchNetwork(): Promise<void>`
Switch wallet to Selendra network.

#### Contract Methods

##### `contract(address: string, abi: any[]): EVMContract`
Create contract instance.

##### `erc20(address: string): ERC20Contract`
Create ERC-20 token contract instance.

##### `deployContract(abi: any[], bytecode: string, constructorArgs?: any[], options?: ContractCallOptions): Promise<{address: string, hash: string}>`
Deploy new contract.

#### Token Methods

##### `getTokenInfo(tokenAddress: string): Promise<TokenInfo>`
Get ERC-20 token information.

##### `transferToken(tokenAddress: string, to: string, amount: string, options?: ContractCallOptions): Promise<string>`
Transfer ERC-20 tokens.

##### `approveToken(tokenAddress: string, spender: string, amount: string, options?: ContractCallOptions): Promise<string>`
Approve ERC-20 token spending.

## EVMContract

### Constructor
```typescript
new EVMContract(provider: EVMProvider, address: string, abi: any[], signer?: Signer)
```

### Methods

#### `read(methodName: string, params?: any[]): Promise<any>`
Call read-only contract method.

#### `write(methodName: string, params?: any[], options?: ContractCallOptions): Promise<string>`
Call state-changing contract method.

#### `estimateGas(methodName: string, params?: any[], options?: ContractCallOptions): Promise<string>`
Estimate gas for contract method call.

#### `getEvents(eventName: string, filter?: any, fromBlock?: number, toBlock?: number): Promise<any[]>`
Get contract events.

#### `on(eventName: string, callback: Function): void`
Listen to contract events.

#### `off(eventName: string, callback?: Function): void`
Remove event listener.

## ERC20Contract

Extends `EVMContract` with ERC-20 specific methods:

#### `name(): Promise<string>`
Get token name.

#### `symbol(): Promise<string>`
Get token symbol.

#### `decimals(): Promise<number>`
Get token decimals.

#### `totalSupply(): Promise<string>`
Get total token supply.

#### `balanceOf(address: string): Promise<string>`
Get token balance of address.

#### `allowance(owner: string, spender: string): Promise<string>`
Get allowance amount.

#### `transfer(to: string, amount: string, options?: ContractCallOptions): Promise<string>`
Transfer tokens.

#### `approve(spender: string, amount: string, options?: ContractCallOptions): Promise<string>`
Approve token spending.

#### `transferFrom(from: string, to: string, amount: string, options?: ContractCallOptions): Promise<string>`
Transfer tokens from approved account.

## Substrate Module

### Constructor
```typescript
new Substrate(networkConfig: NetworkConfig, endpoint?: string)
```

### Methods

#### Connection Methods

##### `connect(): Promise<void>`
Connect to Substrate node.

##### `disconnect(): Promise<void>`
Disconnect from Substrate node.

##### `isConnected(): boolean`
Check if connected to Substrate.

#### Account Methods

##### `createAccountFromMnemonic(mnemonic: string): KeyringPair`
Create account from mnemonic phrase.

##### `createAccountFromSeed(seed: string): KeyringPair`
Create account from seed.

##### `getAccount(address: string): Promise<AccountInfo>`
Get account information.

##### `getBalance(address: string): Promise<string>`
Get account balance.

##### `getFormattedBalance(address: string, decimals?: number): Promise<string>`
Get formatted account balance.

#### Transaction Methods

##### `transfer(from: KeyringPair, to: string, amount: string): Promise<string>`
Transfer tokens.

##### `submitExtrinsic(extrinsic: any, account?: KeyringPair): Promise<string>`
Submit extrinsic to chain.

##### `estimateFee(extrinsic: any, address?: string): Promise<string>`
Estimate transaction fee.

#### Block Methods

##### `getBlockNumber(): Promise<number>`
Get current block number.

##### `getBlock(blockHashOrNumber?: string | number): Promise<Block>`
Get block details.

#### Chain Methods

##### `getRuntimeVersion(): Promise<RuntimeVersion>`
Get runtime version.

##### `getChainInfo(): Promise<ChainInfo>`
Get chain information.

##### `getNetworkProperties(): Promise<NetworkProperties>`
Get network properties.

#### Subscription Methods

##### `subscribeToBlocks(callback: (blockNumber: number) => void): Promise<() => void>`
Subscribe to new blocks.

##### `subscribeToBalance(address: string, callback: (balance: any) => void): Promise<() => void>`
Subscribe to balance changes.

#### Contract Methods

##### `contract(address: string, abi: any): SubstrateContract`
Create contract instance.

##### `deployContract(codeHash: string, abi: any, constructorParams?: any[], options?: any, account: KeyringPair): Promise<{address: string, hash: string}>`
Deploy contract.

## SubstrateContract

### Constructor
```typescript
new SubstrateContract(api: SubstrateAPI, address: string, abi: any)
```

### Methods

#### `query(methodName: string, options?: any, params?: any[]): Promise<any>`
Query contract (read-only).

#### `execute(methodName: string, account: KeyringPair, options?: any, params?: any[]): Promise<string>`
Execute contract method.

#### `estimateGas(methodName: string, options?: any, params?: any[]): Promise<string>`
Estimate gas for contract call.

## WalletManager

### Constructor
```typescript
new WalletManager(networkConfig: NetworkConfig)
```

### Methods

#### `getAvailableProviders(): string[]`
Get list of available wallet providers.

#### `connect(providerName: string): Promise<WalletConnection>`
Connect to specific wallet provider.

#### `disconnect(): Promise<void>`
Disconnect current wallet.

#### `autoConnect(): Promise<WalletConnection | null>`
Auto-detect and connect to available wallet.

#### `isConnected(): boolean`
Check if wallet is connected.

#### `getAccounts(): Promise<string[]>`
Get connected accounts.

#### `signMessage(message: string): Promise<string>`
Sign message with current wallet.

#### `signTransaction(transaction: any): Promise<any>`
Sign transaction with current wallet.

## WebSocketClient

### Constructor
```typescript
new WebSocketClient(url: string)
```

### Methods

#### `connect(): Promise<void>`
Connect to WebSocket server.

#### `disconnect(): void`
Disconnect from WebSocket server.

#### `subscribeToBlocks(callback: (block: any) => void): Promise<EventSubscription>`
Subscribe to new blocks.

#### `subscribeToPendingTransactions(callback: (tx: any) => void): Promise<EventSubscription>`
Subscribe to pending transactions.

#### `subscribeToAddressTransactions(addresses: string[], callback: (tx: any) => void): Promise<EventSubscription>`
Subscribe to address-specific transactions.

#### `subscribeToContractEvents(contractAddress: string, topics: string[], callback: (event: any) => void): Promise<EventSubscription>`
Subscribe to contract events.

## APIClient

### Constructor
```typescript
new APIClient(networkConfig: NetworkConfig)
```

### Methods

#### `getNetworkStats(): Promise<NetworkStats>`
Get network statistics.

#### `getValidators(): Promise<Validator[]>`
Get validator information.

#### `getTransaction(hash: string): Promise<Transaction>`
Get transaction by hash.

#### `getAccount(address: string): Promise<Account>`
Get account information.

#### `search(query: string): Promise<SearchResult>`
Search transactions, accounts, or blocks.

## FormatUtils

Static utility class for formatting blockchain data.

### Methods

#### `formatEther(value: string | number, decimals?: number): string`
Format Wei to Ether.

#### `parseEther(value: string): string`
Parse Ether to Wei.

#### `formatUnits(value: string | number, decimals?: number): string`
Format units with custom decimals.

#### `parseUnits(value: string, decimals?: number): string`
Parse units with custom decimals.

#### `formatAddress(address: string, startLength?: number, endLength?: number): string`
Format address for display.

#### `formatNumber(num: number | string, decimals?: number): string`
Format number with commas.

#### `isValidAddress(address: string): boolean`
Validate Ethereum address.

## Types

### NetworkConfig
```typescript
interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  wsUrl: string;
  explorerUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}
```

### TransactionOptions
```typescript
interface TransactionOptions {
  gasLimit?: string | number;
  gasPrice?: string | number;
  maxFeePerGas?: string | number;
  maxPriorityFeePerGas?: string | number;
  nonce?: number;
  value?: string | number;
}
```

### WalletConnection
```typescript
interface WalletConnection {
  address: string;
  chainId: number;
  connected: boolean;
  provider: any;
}
```