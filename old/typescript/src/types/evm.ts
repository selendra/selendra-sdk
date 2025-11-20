/**
 * EVM-specific types for the Selendra SDK
 */

import type {
  Address,
  Balance,
  BlockHash,
  BlockNumber,
  ChainId,
  GasAmount,
  Nonce,
  TransactionHash,
} from './common';

/**
 * EVM transaction types
 */
export enum EvmTransactionType {
  LEGACY = '0x0',
  EIP_2930 = '0x1',
  EIP_1559 = '0x2',
}

/**
 * EVM transaction interface
 */
export interface EvmTransaction {
  /** Transaction hash */
  hash: TransactionHash;
  /** Sender address */
  from: Address;
  /** Recipient address */
  to?: Address;
  /** Transfer amount */
  amount: string;
  /** Transaction status */
  status: 'pending' | 'success' | 'failed';
  /** Block hash if included */
  blockHash?: BlockHash;
  /** Block number if included */
  blockNumber?: BlockNumber;
  /** Gas used */
  gasUsed?: string;
  /** Gas price */
  gasPrice?: string;
  /** Transaction nonce */
  nonce: string;
  /** Additional transaction data */
  input?: string;
  /** Value transferred (alias for amount) */
  value?: Balance;
  /** Gas limit */
  gas?: GasAmount;
  /** Maximum fee per gas (EIP-1559) */
  maxFeePerGas?: Balance;
  /** Maximum priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: Balance;
  /** Transaction type */
  type?: EvmTransactionType;
  /** Chain ID */
  chainId?: ChainId;
  /** Signature V component */
  v?: number;
  /** Signature R component */
  r?: string;
  /** Signature S component */
  s?: string;
}

/**
 * Legacy EVM transaction interface (for compatibility)
 */
export interface LegacyEvmTransaction {
  /** Transaction hash */
  hash: TransactionHash;
  /** Transaction nonce */
  nonce: Nonce;
  /** Block hash if included */
  blockHash?: BlockHash;
  /** Block number if included */
  blockNumber?: BlockNumber;
  /** Transaction index in block */
  transactionIndex?: number;
  /** Sender address */
  from: Address;
  /** Recipient address */
  to?: Address;
  /** Value transferred */
  value: Balance;
  /** Gas limit */
  gas: GasAmount;
  /** Gas price */
  gasPrice?: Balance;
  /** Maximum fee per gas (EIP-1559) */
  maxFeePerGas?: Balance;
  /** Maximum priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: Balance;
  /** Input data */
  input: string;
  /** Transaction type */
  type?: EvmTransactionType;
  /** Chain ID */
  chainId?: ChainId;
  /** Signature V component */
  v?: number;
  /** Signature R component */
  r?: string;
  /** Signature S component */
  s?: string;
}

/**
 * EVM transaction request
 */
export interface EvmTransactionRequest {
  /** Sender address */
  from?: Address;
  /** Recipient address */
  to?: Address;
  /** Value to transfer */
  value?: Balance;
  /** Transaction data */
  data?: string;
  /** Gas limit */
  gas?: GasAmount;
  /** Gas price */
  gasPrice?: Balance;
  /** Maximum fee per gas (EIP-1559) */
  maxFeePerGas?: Balance;
  /** Maximum priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: Balance;
  /** Transaction nonce */
  nonce?: Nonce;
  /** Transaction type */
  type?: EvmTransactionType;
  /** Chain ID */
  chainId?: number | bigint;
  /** Access list (EIP-2930) */
  accessList?: AccessListEntry[];
}

/**
 * EIP-2930 access list entry
 */
export interface AccessListEntry {
  /** Contract address */
  address: Address;
  /** Storage keys to include */
  storageKeys: string[];
}

/**
 * EVM block interface
 */
export interface EvmBlock {
  /** Block hash */
  hash: BlockHash;
  /** Parent block hash */
  parentHash: BlockHash;
  /** Block number */
  number: BlockNumber;
  /** Block timestamp */
  timestamp: number;
  /** Gas limit for block */
  gasLimit: GasAmount;
  /** Gas used in block */
  gasUsed: GasAmount;
  /** Base fee per gas (EIP-1559) */
  baseFeePerGas?: Balance;
  /** Block miner/validator address */
  miner?: Address;
  /** Extra data field */
  extraData: string;
  /** Logs bloom filter */
  logsBloom: string;
  /** Mix hash */
  mixHash: string;
  /** Nonce */
  nonce: string;
  /** Difficulty (pre-merge) */
  difficulty?: string;
  /** Total difficulty */
  totalDifficulty?: string;
  /** Size of block in bytes */
  size: number;
  /** State root */
  stateRoot: string;
  /** Transactions root */
  transactionsRoot: string;
  /** Receipts root */
  receiptsRoot: string;
  /** Uncle hashes */
  sha3Uncles: string;
  /** Transaction hashes (if not full transactions) */
  transactions?: TransactionHash[] | EvmTransaction[];
  /** Uncles */
  uncles: string[];
  /** Withdrawals (post-merge) */
  withdrawals?: Withdrawal[];
}

/**
 * Post-merge withdrawal
 */
export interface Withdrawal {
  /** Validator index */
  validatorIndex: number;
  /** Recipient address */
  address: Address;
  /** Amount in Gwei */
  amount: bigint;
}

/**
 * EVM log interface
 */
export interface EvmLog {
  /** Log address */
  address: Address;
  /** Topic list */
  topics: string[];
  /** Log data */
  data: string;
  /** Block hash */
  blockHash?: BlockHash;
  /** Block number */
  blockNumber?: BlockNumber;
  /** Transaction hash */
  transactionHash?: TransactionHash;
  /** Transaction index */
  transactionIndex?: number;
  /** Log index */
  logIndex?: number;
  /** Whether log was removed */
  removed?: boolean;
}

/**
 * EVM transaction receipt
 */
export interface EvmTransactionReceipt {
  /** Transaction hash */
  transactionHash: TransactionHash;
  /** Transaction index */
  transactionIndex: number;
  /** Block hash */
  blockHash: BlockHash;
  /** Block number */
  blockNumber: BlockNumber;
  /** Sender address */
  from: Address;
  /** Recipient address */
  to?: Address;
  /** Gas used */
  gasUsed: GasAmount;
  /** Cumulative gas used */
  cumulativeGasUsed: GasAmount;
  /** Effective gas price */
  effectiveGasPrice?: Balance;
  /** Contract address created (if any) */
  contractAddress?: Address;
  /** Logs emitted */
  logs: EvmLog[];
  /** Logs bloom filter */
  logsBloom: string;
  /** Transaction type */
  type?: EvmTransactionType;
  /** Status bit (1 for success, 0 for failure) */
  status?: number;
}

/**
 * EVM filter interface
 */
export interface EvmFilter {
  /** From block */
  fromBlock?: BlockNumber | 'earliest' | 'latest' | 'pending';
  /** To block */
  toBlock?: BlockNumber | 'earliest' | 'latest' | 'pending';
  /** Contract address */
  address?: Address | Address[];
  /** Topics to filter */
  topics?: (string | string[] | null)[];
}

/**
 * EVM call options
 */
export interface EvmCallOptions {
  /** Sender address */
  from?: Address;
  /** Contract address */
  to: Address;
  /** Call data */
  data?: string;
  /** Value to send */
  value?: Balance;
  /** Gas limit */
  gas?: GasAmount;
  /** Block number to call against */
  blockTag?: BlockNumber | 'earliest' | 'latest' | 'pending';
}

/**
 * EVM estimate gas options
 */
export interface EvmEstimateGasOptions {
  /** Sender address */
  from?: Address;
  /** Recipient address */
  to: Address;
  /** Transaction data */
  data?: string;
  /** Value to transfer */
  value?: Balance;
  /** Gas limit */
  gas?: GasAmount;
}

/**
 * EVM wallet interface
 */
export interface EvmWallet {
  /** Wallet address */
  address: Address;
  /** Get wallet balance */
  getBalance(): Promise<Balance>;
  /** Get transaction count */
  getTransactionCount(): Promise<number>;
  /** Sign transaction */
  signTransaction(transaction: EvmTransactionRequest): Promise<string>;
  /** Sign message */
  signMessage(message: string | Uint8Array): Promise<string>;
  /** Sign typed data */
  signTypedData(
    domain: TypedDataDomain,
    types: Record<string, TypedDataField[]>,
    value: Record<string, unknown>,
  ): Promise<string>;
}

/**
 * EIP-712 typed data domain
 */
export interface TypedDataDomain {
  name?: string;
  version?: string;
  chainId?: ChainId;
  verifyingContract?: Address;
  salt?: string;
}

/**
 * EIP-712 typed data field
 */
export interface TypedDataField {
  name: string;
  type: string;
}

/**
 * EVM contract interface
 */
export interface EvmContract {
  /** Contract address */
  address: Address;
  /** Contract ABI */
  abi: any[];
  /** Call contract method (read-only) */
  call(method: string, params: unknown[], overrides?: EvmCallOptions): Promise<unknown>;
  /** Send transaction to contract method */
  send(
    method: string,
    params: unknown[],
    overrides?: EvmTransactionRequest,
  ): Promise<TransactionHash>;
  /** Estimate gas for contract method call */
  estimateGas(
    method: string,
    params: unknown[],
    overrides?: EvmEstimateGasOptions,
  ): Promise<GasAmount>;
}

/**
 * ERC20 token contract interface
 */
export interface Erc20Contract extends EvmContract {
  /** Get token name */
  name(): Promise<string>;
  /** Get token symbol */
  symbol(): Promise<string>;
  /** Get token decimals */
  decimals(): Promise<number>;
  /** Get total supply */
  totalSupply(): Promise<Balance>;
  /** Get account balance */
  balanceOf(account: Address): Promise<Balance>;
  /** Get allowance */
  allowance(owner: Address, spender: Address): Promise<Balance>;
  /** Transfer tokens */
  transfer(to: Address, amount: Balance): Promise<TransactionHash>;
  /** Approve spending */
  approve(spender: Address, amount: Balance): Promise<TransactionHash>;
  /** Transfer from */
  transferFrom(from: Address, to: Address, amount: Balance): Promise<TransactionHash>;
}

/**
 * ERC721 NFT contract interface
 */
export interface Erc721Contract extends EvmContract {
  /** Get token owner */
  ownerOf(tokenId: bigint): Promise<Address>;
  /** Get token URI */
  tokenURI(tokenId: bigint): Promise<string>;
  /** Get account balance */
  balanceOf(account: Address): Promise<number>;
  /** Transfer token */
  transferFrom(from: Address, to: Address, tokenId: bigint): Promise<TransactionHash>;
  /** Safe transfer token */
  safeTransferFrom(
    from: Address,
    to: Address,
    tokenId: bigint,
    data?: string,
  ): Promise<TransactionHash>;
  /** Approve transfer */
  approve(approved: Address, tokenId: bigint): Promise<TransactionHash>;
  /** Set approval for all */
  setApprovalForAll(operator: Address, approved: boolean): Promise<TransactionHash>;
  /** Check if operator is approved */
  isApprovedForAll(owner: Address, operator: Address): Promise<boolean>;
}
