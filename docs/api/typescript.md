# TypeScript SDK API Reference

API documentation for Selendra TypeScript SDK v1.0.0.

** Implementation Status:**
-  **Substrate APIs**: 100%  and production-ready
-  **React Hooks**: 100%  and production-ready
-  **Unified Accounts**: 95% 
-  **EVM APIs**: 50%  - marked with [ BETA]
-  **Rust SDK**: 58%  - separate documentation needed

[![npm version](https://img.shields.io/npm/v/@selendrajs/sdk.svg)](https://www.npmjs.com/package/@selendrajs/sdk)
[![Tests](https://img.shields.io/badge/tests-90%2F110%20passing-green.svg)](https://github.com/selendra/selendra)

## SelendraSDK

Main SDK class with builder pattern for configuration.

```typescript
const sdk = new SelendraSDK()
  .withEndpoint("https://rpc.selendra.org")
  .withNetwork(Network.Selendra)
  .withChainType(ChainType.Substrate);

await sdk.connect();
```

### Core Methods

- `connect(): Promise<void>` - Connect to network
- `disconnect(): Promise<void>` - Disconnect and cleanup
- `isConnected(): boolean` - Check connection status
- `getApi(): ApiPromise` - Get Polkadot.js API instance
- `createAccount(mnemonic?: string): Account` - Create/restore account
- `getBalance(address: string): Promise<Balance>` - Query balance
- `chainInfo(): Promise<ChainInfo>` - Get chain info

## Substrate APIs

### StakingClient

```typescript
const staking = new StakingClient(api);

// Query
const validators = await staking.getValidators();
const era = await staking.getCurrentEra();
const info = await staking.getStakingInfo(address);

// Transactions
await staking.bond(signer, amount, controller);
await staking.nominate(signer, [validator1, validator2]);
await staking.unbond(signer, amount);
await staking.withdrawUnbonded(signer);
await staking.chill(signer);
await staking.validate(signer, { commission: 10 });
```

### AlephClient

```typescript
const aleph = new AlephClient(api);

const session = await aleph.getCurrentSession();
const validators = await aleph.getSessionValidators();
const authorities = await aleph.getAuthorities();
const finalized = await aleph.getFinalizedBlockNumber();
```

### ElectionsClient

```typescript
const elections = new ElectionsClient(api);

const members = await elections.getMembers();
const runnersUp = await elections.getRunnersUp();

await elections.vote(signer, [candidate1, candidate2], amount);
await elections.submitCandidacy(signer);
```

### DemocracyClient

```typescript
const democracy = new DemocracyClient(api);

const referendums = await democracy.getReferendums();
const proposals = await democracy.getProposals();

await democracy.propose(signer, proposalHash, value);
await democracy.vote(signer, refIndex, { aye: true });
await democracy.delegate(signer, target, conviction);
```

## Unified Accounts

```typescript
const accounts = new UnifiedAccountManager(api);

// Convert addresses
const evmAddr = accounts.substrateToEvm("5GrwvaEF...");
const subAddr = accounts.evmToSubstrate("0x742d35Cc...");

// Validate
const validation = accounts.validateAddress(address);

// On-chain mapping
const mapped = await accounts.getEvmAddressFromMapping(substrateAddr);
await accounts.claimDefaultEvmAddress(signer);

// Balance
const balance = await accounts.getUnifiedBalance(address);
```

## React Hooks

```tsx
import {
  useSelendra,
  useBalance,
  useAccount,
  useTransaction,
} from "@selendrajs/sdk";

function Component() {
  const { isConnected, connect } = useSelendra();
  const { balance } = useBalance(address);
  const { account } = useAccount();
  const { submit } = useTransaction();
}
```

### Available Hooks

- `useSelendra()` - Connection management
- `useBalance(address)` - Real-time balance
- `useAccount()` - Account management
- `useTransaction()` - Transaction submission
- `useContract(address)` - Contract interaction
- `useEvents()` - Event subscription
- `useBlockSubscription()` - Block updates

## Types

### Network

```typescript
enum Network {
  Selendra = "selendra",
  Custom = "custom",
}
```

### ChainType

```typescript
enum ChainType {
  Substrate = "substrate",
  EVM = "evm",
}
```

### Balance

```typescript
interface Balance {
  free: BN;
  reserved: BN;
  frozen: BN;
}
```

### Validator

```typescript
interface Validator {
  address: string;
  commission: number;
  blocked: boolean;
  total: BN;
}
```

For more examples, see [examples directory](../../typescript/examples/).

async connect(): Promise<void>

````

**Example**

```typescript
try {
  await sdk.connect();
  console.log("Connected to Selendra!");
} catch (error) {
  console.error("Connection failed:", error);
}
````

#### disconnect()

Disconnects from the network.

```typescript
async disconnect(): Promise<void>
```

#### getChainInfo()

Gets information about the current chain.

```typescript
async getChainInfo(): Promise<ChainInfo>
```

**Returns**

```typescript
interface ChainInfo {
  chainName: string;
  chainId: number;
  version: string;
  specVersion: number;
  implVersion: number;
}
```

#### getAccounts()

Gets all available accounts.

```typescript
async getAccounts(): Promise<Account[]>
```

**Returns**

```typescript
interface Account {
  address: string;
  name?: string;
  type: "substrate" | "evm";
  publicKey: string;
}
```

---

## Substrate APIs

The SDK provides  APIs for interacting with Selendra's Substrate pallets.

### Staking API

 staking operations for nominators and validators.

#### StakingClient

```typescript
import { StakingClient } from "@selendrajs/sdk";

const api = sdk.getApi(); // Get Polkadot.js API
const staking = new StakingClient(api);
```

#### Query Methods

##### getValidators()

Get all active validators.

```typescript
async getValidators(): Promise<ValidatorInfo[]>
```

**Returns**

```typescript
interface ValidatorInfo {
  address: string;
  commission: number;
  blocked: boolean;
  totalStake: string;
  ownStake: string;
  nominators: string[];
}
```

**Example**

```typescript
const validators = await staking.getValidators();
console.log(`Active validators: ${validators.length}`);
validators.forEach((v) => {
  console.log(`${v.address}: ${v.totalStake} total stake`);
});
```

##### getNominators()

Get all nominators.

```typescript
async getNominators(): Promise<NominatorInfo[]>
```

**Returns**

```typescript
interface NominatorInfo {
  address: string;
  targets: string[];
  stake: string;
}
```

##### getNominatorsByTarget()

Get nominators for a specific validator.

```typescript
async getNominatorsByTarget(validatorAddress: string): Promise<string[]>
```

##### getCurrentEra()

Get current era information.

```typescript
async getCurrentEra(): Promise<EraInfo>
```

**Returns**

```typescript
interface EraInfo {
  index: number;
  start: number;
  duration: number;
}
```

##### getStakingInfo()

Get detailed staking information for an address.

```typescript
async getStakingInfo(address: string): Promise<StakingInfo>
```

**Returns**

```typescript
interface StakingInfo {
  address: string;
  staked: string;
  unlocking: UnlockingChunk[];
  available: string;
  isValidator: boolean;
  isNominator: boolean;
  nominations: string[];
}

interface UnlockingChunk {
  value: string;
  era: number;
}
```

##### calculateRewards()

Calculate staking rewards for an address.

```typescript
async calculateRewards(address: string): Promise<RewardInfo>
```

**Returns**

```typescript
interface RewardInfo {
  total: string;
  pending: string;
  claimed: string;
  lastEra: number;
}
```

##### isValidator()

Check if an address is a validator.

```typescript
async isValidator(address: string): Promise<boolean>
```

##### isNominator()

Check if an address is a nominator.

```typescript
async isNominator(address: string): Promise<boolean>
```

#### Transaction Methods

##### bond()

Bond tokens for staking.

```typescript
async bond(
  signer: any,
  amount: string,
  controller: string
): Promise<TransactionResult>
```

**Parameters**

- `signer` - Polkadot.js signer
- `amount` - Amount to bond (in smallest unit)
- `controller` - Controller account address

**Example**

```typescript
const result = await staking.bond(
  signer,
  "1000000000000", // 1 token with 12 decimals
  "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
);
console.log("Bonded! Block:", result.blockHash);
```

##### nominate()

Nominate validators.

```typescript
async nominate(
  signer: any,
  targets: string[]
): Promise<TransactionResult>
```

**Parameters**

- `signer` - Polkadot.js signer
- `targets` - Array of validator addresses to nominate

**Example**

```typescript
await staking.nominate(signer, [
  "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
]);
```

##### unbond()

Start unbonding tokens.

```typescript
async unbond(
  signer: any,
  amount: string
): Promise<TransactionResult>
```

**Example**

```typescript
await staking.unbond(signer, "500000000000");
```

##### withdrawUnbonded()

Withdraw unbonded tokens after the unbonding period.

```typescript
async withdrawUnbonded(signer: any): Promise<TransactionResult>
```

##### chill()

Stop nominating (become inactive).

```typescript
async chill(signer: any): Promise<TransactionResult>
```

##### validate()

Register as a validator.

```typescript
async validate(
  signer: any,
  preferences: ValidatorPreferences
): Promise<TransactionResult>
```

**Parameters**

```typescript
interface ValidatorPreferences {
  commission: number; // 0-100
  blocked: boolean;
}
```

**Example**

```typescript
await staking.validate(signer, {
  commission: 10, // 10%
  blocked: false,
});
```

---

### Aleph Consensus API

Query Aleph BFT consensus state and session information.

#### AlephClient

```typescript
import { AlephClient } from "@selendrajs/sdk";

const aleph = new AlephClient(api);
```

#### Methods

##### getCurrentSession()

Get current session information.

```typescript
async getCurrentSession(): Promise<SessionInfo>
```

**Returns**

```typescript
interface SessionInfo {
  index: number;
  start: number;
  length: number;
  progress: number;
}
```

##### getSessionLength()

Get session duration in blocks.

```typescript
async getSessionLength(): Promise<number>
```

##### getSessionValidators()

Get validators for the current session.

```typescript
async getSessionValidators(): Promise<string[]>
```

##### getNextSessionValidators()

Get validators for the next session.

```typescript
async getNextSessionValidators(): Promise<string[]>
```

##### getAuthorities()

Get current consensus authorities.

```typescript
async getAuthorities(): Promise<Authority[]>
```

**Returns**

```typescript
interface Authority {
  address: string;
  weight: number;
}
```

##### isCurrentAuthority()

Check if an address is currently an authority.

```typescript
async isCurrentAuthority(address: string): Promise<boolean>
```

##### getFinalizedBlockNumber()

Get the latest finalized block number.

```typescript
async getFinalizedBlockNumber(): Promise<number>
```

##### getFinalityStatus()

Get finality status information.

```typescript
async getFinalityStatus(): Promise<FinalityStatus>
```

**Returns**

```typescript
interface FinalityStatus {
  finalizedBlock: number;
  currentBlock: number;
  lag: number;
}
```

---

### Elections API

Interact with the elections pallet for phragmén elections.

#### ElectionsClient

```typescript
import { ElectionsClient } from "@selendrajs/sdk";

const elections = new ElectionsClient(api);
```

#### Query Methods

##### getMembers()

Get elected council members.

```typescript
async getMembers(): Promise<Member[]>
```

**Returns**

```typescript
interface Member {
  address: string;
  stake: string;
  backers: number;
}
```

##### getRunnersUp()

Get runners-up (candidates who almost won).

```typescript
async getRunnersUp(): Promise<RunnerUp[]>
```

**Returns**

```typescript
interface RunnerUp {
  address: string;
  stake: string;
}
```

##### getCandidates()

Get all current candidates.

```typescript
async getCandidates(): Promise<string[]>
```

#### Transaction Methods

##### vote()

Vote for candidates.

```typescript
async vote(
  signer: any,
  candidates: string[],
  amount: string
): Promise<TransactionResult>
```

**Parameters**

- `signer` - Polkadot.js signer
- `candidates` - Array of candidate addresses (max 16)
- `amount` - Voting power (bonded amount)

**Example**

```typescript
await elections.vote(
  signer,
  [
    "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
  ],
  "1000000000000"
);
```

##### removeVoter()

Remove your vote and unbond voting power.

```typescript
async removeVoter(signer: any): Promise<TransactionResult>
```

##### submitCandidacy()

Submit candidacy for elections.

```typescript
async submitCandidacy(signer: any): Promise<TransactionResult>
```

##### renounceCandidacy()

Renounce your candidacy.

```typescript
async renounceCandidacy(signer: any): Promise<TransactionResult>
```

---

### Democracy API

Submit and vote on governance proposals.

#### DemocracyClient

```typescript
import { DemocracyClient } from "@selendrajs/sdk";

const democracy = new DemocracyClient(api);
```

#### Query Methods

##### getReferendums()

Get all active referendums.

```typescript
async getReferendums(): Promise<Referendum[]>
```

**Returns**

```typescript
interface Referendum {
  index: number;
  proposalHash: string;
  end: number;
  threshold: "SuperMajorityApprove" | "SuperMajorityAgainst" | "SimpleMajority";
  delay: number;
  tally: {
    ayes: string;
    nays: string;
    turnout: string;
  };
}
```

##### getProposals()

Get all proposals.

```typescript
async getProposals(): Promise<Proposal[]>
```

**Returns**

```typescript
interface Proposal {
  index: number;
  proposalHash: string;
  proposer: string;
  deposit: string;
  seconds: string[];
}
```

##### getPublicProps()

Get public proposals.

```typescript
async getPublicProps(): Promise<PublicProposal[]>
```

#### Transaction Methods

##### propose()

Submit a new proposal.

```typescript
async propose(
  signer: any,
  proposalHash: string,
  value: string
): Promise<TransactionResult>
```

**Parameters**

- `signer` - Polkadot.js signer
- `proposalHash` - Hash of the proposal
- `value` - Deposit amount

**Example**

```typescript
const hash = "0x1234..."; // Proposal preimage hash
await democracy.propose(signer, hash, "10000000000000");
```

##### second()

Second an existing proposal.

```typescript
async second(
  signer: any,
  proposalIndex: number
): Promise<TransactionResult>
```

##### vote()

Vote on a referendum.

```typescript
async vote(
  signer: any,
  referendumIndex: number,
  vote: Vote
): Promise<TransactionResult>
```

**Parameters**

```typescript
interface Vote {
  aye: boolean;
  conviction?:
    | "None"
    | "Locked1x"
    | "Locked2x"
    | "Locked3x"
    | "Locked4x"
    | "Locked5x"
    | "Locked6x";
}
```

**Example**

```typescript
await democracy.vote(signer, 0, {
  aye: true,
  conviction: "Locked1x",
});
```

##### removeVote()

Remove your vote from a referendum.

```typescript
async removeVote(
  signer: any,
  referendumIndex: number
): Promise<TransactionResult>
```

##### delegate()

Delegate your voting power.

```typescript
async delegate(
  signer: any,
  to: string,
  conviction: DelegationConviction
): Promise<TransactionResult>
```

**Parameters**

```typescript
interface DelegationConviction {
  conviction:
    | "None"
    | "Locked1x"
    | "Locked2x"
    | "Locked3x"
    | "Locked4x"
    | "Locked5x"
    | "Locked6x";
  balance: string;
}
```

##### undelegate()

Remove delegation.

```typescript
async undelegate(signer: any): Promise<TransactionResult>
```

---

## Unified Accounts API

Seamlessly convert between Substrate SS58 and EVM H160 addresses.

### UnifiedAccountManager

```typescript
import { UnifiedAccountManager } from "@selendrajs/sdk";

const accounts = new UnifiedAccountManager(api);
```

### UnifiedAddress Class

Create unified addresses that work on both chains.

```typescript
import { UnifiedAddress } from "@selendrajs/sdk";

const address = new UnifiedAddress(
  "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  204 // SS58 prefix (optional, defaults to 204)
);

console.log("Substrate:", address.toSubstrate());
console.log("EVM:", address.toEvm());
```

### Methods

#### substrateToEvm()

Convert Substrate address to EVM format.

```typescript
substrateToEvm(address: string): string
```

**Example**

```typescript
const evmAddr = accounts.substrateToEvm(
  "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
);
console.log(evmAddr); // 0x...
```

#### evmToSubstrate()

Convert EVM address to Substrate format.

```typescript
evmToSubstrate(address: string, ss58Prefix?: number): string
```

**Example**

```typescript
const substrateAddr = accounts.evmToSubstrate(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  204
);
console.log(substrateAddr); // 5...
```

#### validateAddress()

Validate and detect address type.

```typescript
validateAddress(address: string): ValidationResult
```

**Returns**

```typescript
interface ValidationResult {
  valid: boolean;
  type: "substrate" | "evm" | "invalid";
}
```

**Example**

```typescript
const result = accounts.validateAddress("5GrwvaEF...");
if (result.valid) {
  console.log(`Valid ${result.type} address`);
}
```

#### getUnifiedBalance()

Get total balance across both chains.

```typescript
async getUnifiedBalance(address: string): Promise<UnifiedBalance>
```

**Returns**

```typescript
interface UnifiedBalance {
  substrate: string;
  evm: string;
  total: string;
}
```

**Example**

```typescript
const balance = await accounts.getUnifiedBalance("5GrwvaEF...");
console.log(`Total: ${balance.total}`);
console.log(`Substrate: ${balance.substrate}`);
console.log(`EVM: ${balance.evm}`);
```

#### getEvmAddressFromMapping()

Get mapped EVM address for a Substrate address (if claimed on-chain).

```typescript
async getEvmAddressFromMapping(
  substrateAddress: string
): Promise<string | null>
```

#### getSubstrateAddressFromMapping()

Get mapped Substrate address for an EVM address (if claimed on-chain).

```typescript
async getSubstrateAddressFromMapping(
  evmAddress: string
): Promise<string | null>
```

#### hasMappingOnChain()

Check if an address has an on-chain mapping.

```typescript
async hasMappingOnChain(address: string): Promise<boolean>
```

#### claimDefaultEvmAddress()

Claim your default EVM address on-chain.

```typescript
async claimDefaultEvmAddress(signer: any): Promise<ClaimResult>
```

**Returns**

```typescript
interface ClaimResult {
  accountId: string;
  evmAddress: string;
  blockHash: string;
}
```

**Example**

```typescript
const result = await accounts.claimDefaultEvmAddress(signer);
console.log(`Claimed EVM address: ${result.evmAddress}`);
```

#### claimEvmAddress()

Claim a specific EVM address with signature proof.

```typescript
async claimEvmAddress(
  signer: any,
  evmAddress: string,
  signature: string
): Promise<ClaimResult>
```

#### buildSigningPayload()

Build EIP-712 signing payload for claiming an EVM address.

```typescript
async buildSigningPayload(substrateAddress: string): Promise<string>
```

#### batchConvertSubstrateToEvm()

Batch convert multiple Substrate addresses to EVM.

```typescript
batchConvertSubstrateToEvm(addresses: string[]): string[]
```

#### batchConvertEvmToSubstrate()

Batch convert multiple EVM addresses to Substrate.

```typescript
batchConvertEvmToSubstrate(
  addresses: string[],
  ss58Prefix?: number
): string[]
```

---

## React Hooks

### SelendraSDKOptions

Configuration options for the SDK.

```typescript
interface SelendraSDKOptions {
  network?: "mainnet" | "testnet" | "custom";
  wsEndpoint?: string;
  httpEndpoint?: string;
  defaultAccount?: string;
  autoConnect?: boolean;
  connectionTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}
```

### NetworkConfig

Network-specific configuration.

```typescript
interface NetworkConfig {
  name: string;
  chainId: number;
  wsEndpoint: string;
  httpEndpoint: string;
  blockTime: number;
  decimals: number;
  tokenSymbol: string;
}
```

## Account Management

### createAccount()

Creates a new account with a randomly generated mnemonic.

```typescript
async createAccount(options?: CreateAccountOptions): Promise<CreatedAccount>
```

#### Parameters

- `options` (optional) - Account creation options

```typescript
interface CreateAccountOptions {
  type?: "substrate" | "evm" | "both";
  name?: string;
  password?: string;
  derivationPath?: string;
}
```

#### Returns

```typescript
interface CreatedAccount {
  mnemonic: string;
  address: string;
  publicKey: string;
  type: "substrate" | "evm" | "both";
}
```

**Example**

```typescript
const account = await sdk.createAccount({
  type: "both",
  name: "My Wallet",
});

console.log("Mnemonic:", account.mnemonic);
console.log("Address:", account.address);
```

### importAccountFromMnemonic()

Imports an account from a mnemonic phrase.

```typescript
async importAccountFromMnemonic(
  mnemonic: string,
  options?: ImportAccountOptions
): Promise<Account>
```

**Example**

```typescript
const account = await sdk.importAccountFromMnemonic("word1 word2 word3 ...", {
  type: "substrate",
  derivationPath: "//m/44'/354'/0'/0'/0'",
});
```

### importAccountFromPrivateKey()

Imports an account from a private key.

```typescript
async importAccountFromPrivateKey(
  privateKey: string,
  options?: ImportAccountOptions
): Promise<Account>
```

### getBalance()

Gets the balance of an account.

```typescript
async getBalance(address: string): Promise<Balance>
```

#### Returns

```typescript
interface Balance {
  free: bigint;
  reserved: bigint;
  frozen: bigint;
  total: bigint;
  tokenSymbol: string;
  decimals: number;
}
```

**Example**

```typescript
const balance = await sdk.getBalance(
  "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
);
console.log(`Free balance: ${balance.free} ${balance.tokenSymbol}`);
```

## Transactions

### transfer()

Transfers tokens to another address.

```typescript
async transfer(options: TransferOptions): Promise<Transaction>
```

#### Parameters

```typescript
interface TransferOptions {
  to: string;
  amount: bigint | string | number;
  from?: string;
  memo?: string;
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}
```

#### Returns

```typescript
interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: bigint;
  blockNumber?: number;
  status: "pending" | "included" | "finalized" | "failed";
  events: TransactionEvent[];
}
```

**Example**

```typescript
const tx = await sdk.transfer({
  to: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  amount: BigInt("1000000000000"), // 1 SEL (assuming 12 decimals)
  memo: "Payment for services",
});

console.log("Transaction hash:", tx.hash);
console.log("Status:", tx.status);
```

### sendTransaction()

Sends a custom transaction.

```typescript
async sendTransaction(options: SendTransactionOptions): Promise<Transaction>
```

#### Parameters

```typescript
interface SendTransactionOptions {
  from?: string;
  to?: string;
  data?: string;
  value?: bigint;
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
}
```

### estimateGas()

Estimates gas required for a transaction.

```typescript
async estimateGas(options: SendTransactionOptions): Promise<bigint>
```

### getTransaction()

Gets transaction details by hash.

```typescript
async getTransaction(hash: string): Promise<Transaction | null>
```

### getTransactionReceipt()

Gets transaction receipt.

```typescript
async getTransactionReceipt(hash: string): Promise<TransactionReceipt | null>
```

#### Returns

```typescript
interface TransactionReceipt {
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  blockNumber: number;
  from: string;
  to: string;
  gasUsed: bigint;
  logs: Log[];
  status: "success" | "failure";
}
```

## Smart Contracts

### Contract

Class for interacting with smart contracts.

```typescript
new Contract(address: string, abi: any[], sdk: SelendraSDK)
```

#### Example

```typescript
const contract = new Contract("0x1234...abcd", abi, sdk);
```

### contract.call()

Reads data from a contract view function.

```typescript
async call(functionName: string, ...args: any[]): Promise<any>
```

**Example**

```typescript
const balance = await contract.call("balanceOf", "0xAddress...");
console.log("Token balance:", balance);
```

### contract.send()

Writes data to a contract function.

```typescript
async send(
  functionName: string,
  options?: SendOptions,
  ...args: any[]
): Promise<Transaction>
```

#### Parameters

```typescript
interface SendOptions {
  from?: string;
  value?: bigint;
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
}
```

**Example**

```typescript
const tx = await contract.send(
  "transfer",
  { from: "0xMyAddress...", value: BigInt("1000000000000") },
  "0xRecipientAddress...",
  BigInt("1000000000000")
);
```

### deployContract()

Deploys a new smart contract.

```typescript
async deployContract(options: DeployOptions): Promise<DeployedContract>
```

#### Parameters

```typescript
interface DeployOptions {
  bytecode: string;
  abi: any[];
  constructorArgs?: any[];
  from?: string;
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
}
```

#### Returns

```typescript
interface DeployedContract {
  address: string;
  transactionHash: string;
  blockNumber?: number;
}
```

**Example**

```typescript
const deployed = await sdk.deployContract({
  bytecode: "0x6080604052348015...",
  abi: erc20ABI,
  constructorArgs: ["My Token", "MTK", 18],
  from: "0xMyAddress...",
});

console.log("Contract deployed at:", deployed.address);
```

## EVM Compatibility

### getEvmAccount()

Gets EVM account information.

```typescript
async getEvmAccount(address: string): Promise<EvmAccount>
```

#### Returns

```typescript
interface EvmAccount {
  address: string;
  nonce: number;
  balance: bigint;
  codeHash: string;
  storageRoot: string;
}
```

### getEvmTransactionCount()

Gets the number of transactions sent from an address.

```typescript
async getEvmTransactionCount(address: string): Promise<number>
```

### getEvmBlock()

Gets block information.

```typescript
async getEvmBlock(blockHashOrNumber: string | number): Promise<EvmBlock>
```

### sendEvmTransaction()

Sends an EVM transaction.

```typescript
async sendEvmTransaction(
  tx: EvmTransactionRequest
): Promise<EvmTransaction>
```

#### Parameters

```typescript
interface EvmTransactionRequest {
  from: string;
  to?: string;
  data?: string;
  value?: bigint;
  gas?: bigint;
  maxPriorityFeePerGas?: bigint;
  maxFeePerGas?: bigint;
  nonce?: number;
}
```

## Substrate Integration

### query()

Queries Substrate storage.

```typescript
async query(pallet: string, storage: string, ...args: any[]): Promise<any>
```

**Example**

```typescript
const systemAccount = await sdk.query(
  "System",
  "Account",
  "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
);

console.log("Account info:", systemAccount.toHuman());
```

### tx()

Creates a Substrate transaction.

```typescript
tx(pallet: string, method: string, ...args: any[]): SubmittableExtrinsic
```

**Example**

```typescript
const transferTx = sdk.tx(
  "Balances",
  "transfer",
  "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  BigInt("1000000000000")
);

const hash = await transferTx.signAndSend("my-mnemonic");
console.log("Transaction hash:", hash.toHex());
```

### getRuntimeVersion()

Gets the current runtime version.

```typescript
async getRuntimeVersion(): Promise<RuntimeVersion>
```

### subscribeToHeads()

Subscribes to new block headers.

```typescript
async subscribeToHeads(
  callback: (header: Header) => void
): Promise<() => void>
```

**Example**

```typescript
const unsubscribe = await sdk.subscribeToHeads((header) => {
  console.log("New block:", header.number.toNumber());
});

// Later: unsubscribe();
```

## Utilities

### formatBalance()

Formats a balance value to human-readable format.

```typescript
formatBalance(balance: bigint | string | number, decimals?: number): string
```

**Example**

```typescript
const formatted = sdk.formatBalance(BigInt("1000000000000"), 12);
console.log(formatted); // "1,000.000000000000"
```

### parseBalance()

Parses a human-readable balance to bigint.

```typescript
parseBalance(balance: string, decimals?: number): bigint
```

### addressToEvm()

Converts Substrate address to EVM address.

```typescript
addressToEvm(substrateAddress: string): string
```

### evmToAddress()

Converts EVM address to Substrate address.

```typescript
evmToAddress(evmAddress: string): string
```

### validateAddress()

Validates an address format.

```typescript
validateAddress(address: string): 'substrate' | 'evm' | 'invalid'
```

### getFeeEstimate()

Gets current fee estimates.

```typescript
async getFeeEstimate(): Promise<FeeEstimate>
```

#### Returns

```typescript
interface FeeEstimate {
  slow: {
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    estimatedTime: number; // seconds
  };
  average: FeeTier;
  fast: FeeTier;
}

interface FeeTier {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedTime: number;
}
```

## React Components

### SelendraProvider

React context provider for the SDK.

```typescript
<SelendraProvider sdk={sdk}>
  <App />
</SelendraProvider>
```

### useSelendra()

Hook to access the SDK instance.

```typescript
const sdk = useSelendra();
```

### useAccount()

Hook to manage account state.

```typescript
interface UseAccountReturn {
  account: Account | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  balance: Balance | null;
}

const { account, isConnected, connect, disconnect, balance } = useAccount();
```

### useBalance()

Hook to get account balance.

```typescript
const { balance, loading, error } = useBalance(address);
```

### useTransaction()

Hook to send transactions.

```typescript
interface UseTransactionReturn {
  send: (options: SendTransactionOptions) => Promise<Transaction>;
  transaction: Transaction | null;
  loading: boolean;
  error: Error | null;
}

const { send, transaction, loading, error } = useTransaction();
```

**Example**

```typescript
const { send, loading, error } = useTransaction();

const handleTransfer = async () => {
  try {
    const tx = await send({
      to: recipient,
      amount: BigInt("1000000000000"),
    });
    console.log("Transaction sent:", tx.hash);
  } catch (err) {
    console.error("Transfer failed:", err);
  }
};
```

## Types

### Account

```typescript
interface Account {
  address: string;
  name?: string;
  type: "substrate" | "evm";
  publicKey: string;
}
```

### Balance

```typescript
interface Balance {
  free: bigint;
  reserved: bigint;
  frozen: bigint;
  total: bigint;
  tokenSymbol: string;
  decimals: number;
}
```

### Transaction

```typescript
interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount?: bigint;
  data?: string;
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
  blockNumber?: number;
  blockHash?: string;
  status: "pending" | "included" | "finalized" | "failed";
  events: TransactionEvent[];
  timestamp?: number;
}
```

### ChainInfo

```typescript
interface ChainInfo {
  chainName: string;
  chainId: number;
  version: string;
  specVersion: number;
  implVersion: number;
  tokenDecimals: number;
  tokenSymbol: string;
}
```

### Network

```typescript
type Network = "mainnet" | "testnet" | "custom";
```

### EventType

```typescript
type EventType =
  | "transfer"
  | "contract.deployed"
  | "contract.interaction"
  | "block"
  | "error"
  | "connected"
  | "disconnected";
```

### EventData

```typescript
interface EventData {
  type: EventType;
  data: any;
  timestamp: number;
}
```

## Error Handling

### SelendraError

Base error class for SDK errors.

```typescript
class SelendraError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string, details?: any);
}
```

### Common Error Codes

- `CONNECTION_ERROR` - Network connection failed
- `INVALID_ADDRESS` - Address format is invalid
- `INSUFFICIENT_BALANCE` - Not enough balance for operation
- `TRANSACTION_FAILED` - Transaction execution failed
- `CONTRACT_ERROR` - Smart contract interaction failed
- `TIMEOUT` - Operation timed out

**Example**

```typescript
try {
  await sdk.transfer({ to, amount });
} catch (error) {
  if (error instanceof SelendraError) {
    switch (error.code) {
      case "INSUFFICIENT_BALANCE":
        console.error("Not enough balance!");
        break;
      case "INVALID_ADDRESS":
        console.error("Invalid recipient address!");
        break;
      default:
        console.error("Transfer failed:", error.message);
    }
  }
}
```

---

This API reference covers all major functionality of the Selendra TypeScript SDK. For more specific examples and use cases, check out our [examples directory](../../examples/) and [tutorials](../tutorials/).
