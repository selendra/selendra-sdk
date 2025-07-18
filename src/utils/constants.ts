/**
 * SDK Constants and default values
 */

// Default gas limits for different operations
export const DEFAULT_GAS_LIMITS = {
  TRANSFER: 21000,
  ERC20_TRANSFER: 65000,
  ERC20_APPROVE: 45000,
  CONTRACT_CALL: 500000,
  CONTRACT_DEPLOY: 2000000,
  UNISWAP_SWAP: 150000,
  ADD_LIQUIDITY: 200000,
  REMOVE_LIQUIDITY: 180000,
  MULTICALL: 750000
} as const;

// Gas price levels (multipliers for base gas price)
export const GAS_PRICE_LEVELS = {
  SLOW: 1.0,
  STANDARD: 1.2,
  FAST: 1.5,
  INSTANT: 2.0
} as const;

// Network configurations
export const SUPPORTED_NETWORKS = {
  MAINNET: {
    chainId: 1961,
    name: 'Selendra Mainnet',
    rpcUrl: 'https://rpc.selendra.org',
    wsUrl: 'wss://rpc.selendra.org',
    explorerUrl: 'https://explorer.selendra.org',
    currency: {
      name: 'Selendra',
      symbol: 'SEL',
      decimals: 18
    }
  },
  TESTNET: {
    chainId: 1953,
    name: 'Selendra Testnet',
    rpcUrl: 'https://rpc-testnet.selendra.org',
    wsUrl: 'wss://rpc-testnet.selendra.org',
    explorerUrl: 'https://explorer-testnet.selendra.org',
    currency: {
      name: 'Selendra',
      symbol: 'SEL',
      decimals: 18
    }
  }
} as const;

// API endpoints
export const API_ENDPOINTS = {
  MAINNET: 'https://api.selendra.org/v1',
  TESTNET: 'https://api-testnet.selendra.org/v1'
} as const;

// Substrate endpoints
export const SUBSTRATE_ENDPOINTS = {
  MAINNET: 'wss://substrate.selendra.org',
  TESTNET: 'wss://substrate-testnet.selendra.org'
} as const;

// Faucet endpoints (testnet only)
export const FAUCET_ENDPOINTS = {
  TESTNET: 'https://faucet.selendra.org'
} as const;

// Common contract addresses (will be populated as contracts are deployed)
export const COMMON_CONTRACTS = {
  MAINNET: {
    // WSEL: '0x...',
    // USDC: '0x...',
    // DEX_ROUTER: '0x...',
    // MULTICALL: '0x...'
  },
  TESTNET: {
    // WSEL: '0x...',
    // USDC: '0x...',
    // DEX_ROUTER: '0x...',
    // MULTICALL: '0x...'
  }
} as const;

// Token decimals for common tokens
export const COMMON_TOKEN_DECIMALS = {
  ETH: 18,
  WETH: 18,
  SEL: 18,
  WSEL: 18,
  USDC: 6,
  USDT: 6,
  DAI: 18,
  WBTC: 8
} as const;

// Maximum values for validation
export const MAX_VALUES = {
  GAS_LIMIT: 30000000, // 30M gas (typical block limit)
  GAS_PRICE: '1000000000000', // 1000 gwei
  SLIPPAGE: 50, // 50%
  DEADLINE_HOURS: 24, // 24 hours
  UINT256_MAX: '115792089237316195423570985008687907853269984665640564039457584007913129639935'
} as const;

// Minimum values for validation
export const MIN_VALUES = {
  GAS_LIMIT: 21000,
  GAS_PRICE: '1000000000', // 1 gwei
  AMOUNT: '1', // 1 wei
  SLIPPAGE: 0.01 // 0.01%
} as const;

// Time constants
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  AVERAGE_BLOCK_TIME: 6000, // 6 seconds
  DEFAULT_DEADLINE: 30 * 60, // 30 minutes in seconds
  WEBSOCKET_TIMEOUT: 10000, // 10 seconds
  TRANSACTION_TIMEOUT: 300000 // 5 minutes
} as const;

// Event topics for common contracts
export const EVENT_TOPICS = {
  ERC20_TRANSFER: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  ERC20_APPROVAL: '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
  ERC721_TRANSFER: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  SWAP: '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822'
} as const;

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Wallet not connected. Please connect a wallet first.',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction.',
  INVALID_ADDRESS: 'Invalid Ethereum address format.',
  INVALID_AMOUNT: 'Invalid amount. Must be a positive number.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  CONTRACT_NOT_FOUND: 'Contract not found at the specified address.',
  INVALID_SLIPPAGE: 'Invalid slippage. Must be between 0.01% and 50%.',
  EXPIRED_DEADLINE: 'Transaction deadline has expired.',
  UNSUPPORTED_NETWORK: 'Unsupported network. Please switch to a supported network.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully.',
  TRANSACTION_SENT: 'Transaction sent successfully.',
  TRANSACTION_CONFIRMED: 'Transaction confirmed.',
  SWAP_COMPLETED: 'Token swap completed successfully.',
  LIQUIDITY_ADDED: 'Liquidity added successfully.',
  LIQUIDITY_REMOVED: 'Liquidity removed successfully.',
  APPROVAL_SET: 'Token approval set successfully.',
  NFT_MINTED: 'NFT minted successfully.'
} as const;

// Regular expressions for validation
export const REGEX_PATTERNS = {
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  TRANSACTION_HASH: /^0x[a-fA-F0-9]{64}$/,
  PRIVATE_KEY: /^0x[a-fA-F0-9]{64}$/,
  MNEMONIC: /^(\w+\s){11}\w+$|^(\w+\s){23}\w+$/,
  URL: /^https?:\/\/.+/,
  WEBSOCKET_URL: /^wss?:\/\/.+/,
  NUMBER: /^\d+(\.\d+)?$/,
  HEX: /^0x[a-fA-F0-9]+$/
} as const;

// Feature flags (can be used to enable/disable features)
export const FEATURE_FLAGS = {
  ENABLE_WEBSOCKETS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_DEBUG_LOGS: false,
  ENABLE_RETRY_LOGIC: true,
  ENABLE_GAS_OPTIMIZATION: true,
  ENABLE_MULTICALL: true,
  ENABLE_SUBSTRATE: true
} as const;

// SDK metadata
export const SDK_INFO = {
  NAME: 'Selendra SDK',
  VERSION: '1.0.1',
  USER_AGENT: 'SelendraSDK/1.0.1',
  GITHUB_URL: 'https://github.com/selendra/selendra-sdk',
  DOCS_URL: 'https://docs.selendra.org/sdk',
  SUPPORT_EMAIL: 'support@selendra.org'
} as const;