/**
 * Standardized response types for consistent API responses
 */

export interface SDKResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: number;
    requestId?: string;
    networkId?: number;
    blockNumber?: number;
  };
}

export interface TransactionResponse {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed?: string;
  gasPrice?: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  blockHash?: string;
  confirmations?: number;
  timestamp?: number;
  logs?: any[];
}

export interface BalanceResponse {
  address: string;
  balance: string;
  formattedBalance: string;
  symbol: string;
  decimals: number;
  timestamp: number;
}

export interface ContractCallResponse<T = any> {
  result: T;
  gasUsed?: string;
  blockNumber: number;
  timestamp: number;
}

export interface TokenInfoResponse {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  verified: boolean;
  metadata?: {
    description?: string;
    image?: string;
    website?: string;
  };
}

export interface NetworkStatusResponse {
  chainId: number;
  name: string;
  blockNumber: number;
  blockTime: number;
  gasPrice: string;
  isHealthy: boolean;
  lastUpdate: number;
}

export interface EstimateGasResponse {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedCost: string;
  estimatedCostUSD?: string;
}

export interface SwapQuoteResponse {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  amountOutMin: string;
  priceImpact: number;
  fee: string;
  route: string[];
  estimatedGas: string;
  validUntil: number;
}

export interface LiquidityPoolResponse {
  address: string;
  token0: TokenInfoResponse;
  token1: TokenInfoResponse;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
  fee: string;
  volume24h?: string;
  tvl?: string;
  apr?: string;
}