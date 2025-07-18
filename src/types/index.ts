import { ethers } from 'ethers';
import {
  EthereumProvider,
  TransactionRequest,
  TransactionResponse,
  TransactionReceipt,
  SubstrateKeyringPair,
  SubstrateAccount,
  SubstrateExtrinsic,
  SubstrateEventRecord,
  HexString,
  Address,
  Hash
} from './blockchain';
// ApiPromise and SelendraSDKError types available for advanced integrations
// import { ApiPromise } from '@polkadot/api';
// import { SelendraSDKError } from './errors';

export interface NetworkConfig {
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

export interface SelendraSDKConfig {
  network: 'mainnet' | 'testnet' | NetworkConfig;
  provider?: ethers.Provider | ethers.Eip1193Provider;
  substrateEndpoint?: string;
  logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  retryConfig?: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
  };
}

export interface TransactionOptions {
  gasLimit?: string | number;
  gasPrice?: string | number;
  maxFeePerGas?: string | number;
  maxPriorityFeePerGas?: string | number;
  nonce?: number;
  value?: string | number;
}

export interface ContractCallOptions extends TransactionOptions {
  from?: string;
}

export interface EVMTransactionResult {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: number;
  blockNumber: number;
  blockHash: string;
}

export interface SubstrateTransactionResult {
  hash: Hash;
  blockHash: Hash;
  blockNumber: number;
  status: 'success' | 'failed';
  events: SubstrateEventRecord[];
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

export interface AccountBalance {
  address: string;
  balance: string;
  formattedBalance: string;
  symbol: string;
}

export interface ContractMetadata {
  address: Address;
  abi?: unknown[];
  bytecode?: string;
  metadata?: Record<string, unknown>;
}

export interface WalletConnection {
  address: Address;
  chainId: number;
  connected: boolean;
  provider: EthereumProvider | SubstrateKeyringPair | ethers.Provider | ethers.Eip1193Provider;
  walletType: 'metamask' | 'walletconnect' | 'polkadotjs' | 'custom';
}

export interface EventSubscription<T = unknown> {
  id: string;
  active: boolean;
  callback: (data: T) => void;
  unsubscribe: () => Promise<void>;
  isActive: () => boolean;
}

export interface NetworkStats {
  blockNumber: number;
  blockTime: number;
  gasPrice: string;
  validators: number;
  totalTransactions: number;
  networkUptime: number;
}

export interface GasPriceInfo {
  slow: string;
  standard: string;
  fast: string;
  instant: string;
}

export type NetworkType = 'mainnet' | 'testnet';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';
export type ContractType = 'evm' | 'substrate';

export interface ChainInfo {
  chainId: number;
  networkVersion: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}