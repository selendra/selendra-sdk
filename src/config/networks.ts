import { NetworkConfig } from '../types';

export const MAINNET_CONFIG: NetworkConfig = {
  name: 'Selendra Mainnet',
  chainId: 1961,
  rpcUrl: 'https://rpc.selendra.org',
  wsUrl: 'wss://rpc.selendra.org',
  explorerUrl: 'https://explorer.selendra.org',
  currency: {
    name: 'Selendra',
    symbol: 'SEL',
    decimals: 18
  }
};

export const TESTNET_CONFIG: NetworkConfig = {
  name: 'Selendra Testnet',
  chainId: 1953,
  rpcUrl: 'https://rpc-testnet.selendra.org',
  wsUrl: 'wss://rpc-testnet.selendra.org',
  explorerUrl: 'https://explorer-testnet.selendra.org',
  currency: {
    name: 'Selendra',
    symbol: 'SEL',
    decimals: 18
  }
};

export const NETWORKS = {
  mainnet: MAINNET_CONFIG,
  testnet: TESTNET_CONFIG
};

export const getNetworkConfig = (network: string | NetworkConfig): NetworkConfig => {
  if (typeof network === 'object') {
    return network;
  }
  
  const config = NETWORKS[network as keyof typeof NETWORKS];
  if (!config) {
    throw new Error(`Unsupported network: ${network}`);
  }
  
  return config;
};

export const SUBSTRATE_ENDPOINTS = {
  mainnet: 'wss://substrate.selendra.org',
  testnet: 'wss://substrate-testnet.selendra.org'
};

export const API_ENDPOINTS = {
  mainnet: 'https://api.selendra.org/v1',
  testnet: 'https://api-testnet.selendra.org/v1'
};

export const FAUCET_ENDPOINTS = {
  testnet: 'https://faucet.selendra.org'
};

export const DEFAULT_GAS_LIMITS = {
  transfer: 21000,
  contractCall: 500000,
  contractDeploy: 2000000
};

export const GAS_PRICE_LEVELS = {
  slow: 1.0,
  standard: 1.2,
  fast: 1.5,
  instant: 2.0
};