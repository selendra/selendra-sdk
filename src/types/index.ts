import { ethers } from 'ethers';
import { ApiPromise } from '@polkadot/api';

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
  provider?: ethers.Provider | any;
  substrateEndpoint?: string;
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
  hash: string;
  blockHash: string;
  blockNumber: number;
  status: 'success' | 'failed';
  events: any[];
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
  address: string;
  abi?: any[];
  bytecode?: string;
  metadata?: any;
}

export interface WalletConnection {
  address: string;
  chainId: number;
  connected: boolean;
  provider: any;
}

export interface EventSubscription {
  id: string;
  active: boolean;
  callback: (data: any) => void;
  unsubscribe: () => void;
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