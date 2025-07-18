/**
 * Comprehensive blockchain-specific type definitions
 * This file contains proper TypeScript interfaces to replace 'any' types
 */

import { BigNumberishish } from 'ethers';

// ========================================
// EVM/Ethereum Types
// ========================================

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  isConnected?: () => boolean;
  selectedAddress?: string;
  networkVersion?: string;
  chainId?: string;
}

export interface TransactionRequest {
  to?: string;
  from?: string;
  value?: string | BigNumberishish;
  data?: string;
  gasLimit?: string | BigNumberish;
  gasPrice?: string | BigNumberish;
  maxFeePerGas?: string | BigNumberish;
  maxPriorityFeePerGas?: string | BigNumberish;
  nonce?: number;
  type?: number;
}

export interface TransactionResponse {
  hash: string;
  to?: string;
  from: string;
  nonce: number;
  gasLimit: BigNumberish;
  gasPrice?: BigNumberish;
  data: string;
  value: BigNumberish;
  chainId: number;
  confirmations: number;
  blockNumber?: number;
  blockHash?: string;
  timestamp?: number;
  wait: (confirmations?: number) => Promise<TransactionReceipt>;
}

export interface TransactionReceipt {
  to?: string;
  from: string;
  contractAddress?: string;
  transactionIndex: number;
  gasUsed: BigNumberish;
  logsBloom: string;
  blockHash: string;
  transactionHash: string;
  logs: Array<{
    blockNumber: number;
    blockHash: string;
    transactionIndex: number;
    removed: boolean;
    address: string;
    data: string;
    topics: string[];
    transactionHash: string;
    logIndex: number;
  }>;
  blockNumber: number;
  confirmations: number;
  cumulativeGasUsed: BigNumberish;
  effectiveGasPrice: BigNumberish;
  status?: number;
  type: number;
  byzantium: boolean;
}

export interface ContractInterface {
  functions: Record<string, {
    inputs: Array<{ name: string; type: string; internalType?: string }>;
    outputs: Array<{ name: string; type: string; internalType?: string }>;
    stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  }>;
  events: Record<string, {
    inputs: Array<{ name: string; type: string; indexed: boolean; internalType?: string }>;
  }>;
}

export interface ContractCallOptions {
  gasLimit?: string | BigNumberish;
  gasPrice?: string | BigNumberish;
  value?: string | BigNumberishish;
  nonce?: number;
  from?: string;
}

export interface EventFilter {
  address?: string | string[];
  topics?: Array<string | string[] | null>;
  fromBlock?: number | string;
  toBlock?: number | string;
}

export interface LogDescription {
  eventFragment: {
    name: string;
    inputs: Array<{ name: string; type: string; indexed: boolean }>;
  };
  name: string;
  signature: string;
  topic: string;
  args: Array<unknown>;
}

// ========================================
// Substrate/Polkadot Types
// ========================================

export interface SubstrateKeyringPair {
  address: string;
  publicKey: Uint8Array;
  sign: (data: Uint8Array) => Uint8Array;
  verify: (message: Uint8Array, signature: Uint8Array) => boolean;
  meta: {
    name?: string;
    source?: string;
    whenCreated?: number;
  };
}

export interface SubstrateAccount {
  address: string;
  meta: {
    genesisHash?: string;
    name?: string;
    source?: string;
  };
  type?: string;
}

export interface SubstrateExtrinsic {
  method: {
    section: string;
    method: string;
    args: unknown[];
  };
  signature?: {
    signer: string;
    signature: string;
    era: unknown;
    nonce: number;
    tip: string;
  };
  isSigned: boolean;
  hash: string;
  toHex: () => string;
  signAndSend: (
    account: SubstrateKeyringPair | string,
    options?: SubstrateSigningOptions
  ) => Promise<string>;
}

export interface SubstrateSigningOptions {
  signer?: {
    signPayload?: (payload: SubstrateSignerPayload) => Promise<SubstrateSignerResult>;
    signRaw?: (raw: SubstrateSignerRaw) => Promise<SubstrateSignerResult>;
  };
  era?: number | [number, number];
  nonce?: number;
  tip?: string | number;
  assetId?: number;
  blockHash?: string;
}

export interface SubstrateSignerPayload {
  address: string;
  blockHash: string;
  blockNumber: string;
  era: string;
  genesisHash: string;
  method: string;
  nonce: string;
  specVersion: string;
  tip: string;
  transactionVersion: string;
  signedExtensions: string[];
  version: number;
}

export interface SubstrateSignerRaw {
  address: string;
  data: string;
  type: 'bytes' | 'payload';
}

export interface SubstrateSignerResult {
  id: number;
  signature: string;
}

export interface SubstrateRuntimeVersion {
  specName: string;
  implName: string;
  specVersion: number;
  implVersion: number;
  transactionVersion: number;
  apis: Array<[string, number]>;
}

export interface SubstrateChainProperties {
  ss58Format?: number;
  tokenDecimals?: number[];
  tokenSymbol?: string[];
}

export interface SubstrateBlockHeader {
  parentHash: string;
  number: number;
  stateRoot: string;
  extrinsicsRoot: string;
  digest: {
    logs: Array<{
      type: string;
      value: unknown;
    }>;
  };
}

export interface SubstrateBlock {
  header: SubstrateBlockHeader;
  extrinsics: SubstrateExtrinsic[];
}

export interface SubstrateEventRecord {
  phase: {
    applyExtrinsic?: number;
    finalization?: boolean;
    initialization?: boolean;
  };
  event: {
    section: string;
    method: string;
    data: unknown[];
    index: string;
  };
  topics: string[];
}

// ========================================
// Contract Types (Substrate)
// ========================================

export interface SubstrateContractMetadata {
  source: {
    hash: string;
    language: string;
    compiler: string;
    wasm?: string;
  };
  contract: {
    name: string;
    version: string;
    authors: string[];
  };
  spec: {
    constructors: SubstrateContractConstructor[];
    docs: string[];
    events: SubstrateContractEvent[];
    messages: SubstrateContractMessage[];
  };
  storage?: {
    struct: {
      fields: Array<{
        name: string;
        layout: unknown;
        type: number;
      }>;
    };
  };
  types: SubstrateContractTypeSpec[];
}

export interface SubstrateContractConstructor {
  args: SubstrateContractArg[];
  docs: string[];
  label: string;
  payable: boolean;
  selector: string;
}

export interface SubstrateContractMessage {
  args: SubstrateContractArg[];
  docs: string[];
  label: string;
  mutates: boolean;
  payable: boolean;
  returnType?: {
    displayName: string[];
    type: number;
  };
  selector: string;
}

export interface SubstrateContractEvent {
  args: Array<{
    docs: string[];
    indexed: boolean;
    label: string;
    type: {
      displayName: string[];
      type: number;
    };
  }>;
  docs: string[];
  label: string;
}

export interface SubstrateContractArg {
  label: string;
  type: {
    displayName: string[];
    type: number;
  };
}

export interface SubstrateContractTypeSpec {
  id: number;
  type: {
    def: unknown;
    params?: Array<{
      name: string;
      type: number;
    }>;
    path?: string[];
  };
}

export interface ContractCallResult {
  gasConsumed: string;
  gasRequired: string;
  output: unknown;
  result: {
    Ok?: unknown;
    Err?: {
      Module?: {
        index: number;
        error: number;
      };
      BadOrigin?: null;
      CannotLookup?: null;
      Other?: string;
    };
  };
  debugMessage: string;
}

export interface ContractInstantiateResult {
  gasConsumed: string;
  gasRequired: string;
  result: {
    Ok?: {
      accountId: string;
      result: {
        Ok?: unknown;
        Err?: unknown;
      };
    };
    Err?: unknown;
  };
  debugMessage: string;
}

// ========================================
// Network and Configuration Types
// ========================================

export interface NetworkEndpoint {
  url: string;
  type: 'http' | 'ws' | 'wss' | 'https';
  timeout?: number;
  retries?: number;
}

export interface ChainInfo {
  chainId: number;
  name: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  explorerUrl?: string;
  testnet?: boolean;
}

// ========================================
// Utility Types
// ========================================

export type HexString = `0x${string}`;
export type Address = string;
export type Hash = HexString;
export type BlockNumber = number | 'latest' | 'earliest' | 'pending';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// ========================================
// Wallet and Connection Types
// ========================================

export interface WalletCapabilities {
  signMessage: boolean;
  signTransaction: boolean;
  signTypedData: boolean;
  switchNetwork: boolean;
  addNetwork: boolean;
  watchAsset: boolean;
}

export interface NetworkParameters {
  chainId: HexString;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[];
}

// ========================================
// Event and Subscription Types
// ========================================

export interface SubscriptionOptions {
  fromBlock?: BlockNumber;
  toBlock?: BlockNumber;
  confirmations?: number;
  timeout?: number;
}

export interface BlockSubscription {
  blockNumber: number;
  blockHash: string;
  timestamp: number;
  transactionCount: number;
}

export interface TransactionSubscription {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

// Re-export commonly used external types
export type { BigNumberish } from 'ethers';