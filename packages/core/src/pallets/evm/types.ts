/**
 * EVM Pallet Types
 *
 * Type definitions for the EVM pallet (Frontier)
 */

// =============================================================================
// Core Types
// =============================================================================

/**
 * H160 - 20 byte Ethereum address
 */
export type H160 = string;

/**
 * H256 - 32 byte hash
 */
export type H256 = string;

/**
 * U256 - 256 bit unsigned integer (as bigint)
 */
export type U256 = bigint;

/**
 * EVM account information
 */
export interface EvmAccountInfo {
  /** Account nonce */
  nonce: U256;
  /** Account balance in wei */
  balance: U256;
}

/**
 * EVM account code (contract bytecode)
 */
export interface EvmAccountCode {
  /** Contract bytecode */
  code: Uint8Array;
  /** Code hash */
  codeHash: H256;
}

/**
 * EVM account storage slot
 */
export interface EvmStorageSlot {
  /** Storage key */
  key: H256;
  /** Storage value */
  value: H256;
}

/**
 * Access list entry for EIP-2930
 */
export interface AccessListItem {
  /** Contract address */
  address: H160;
  /** Storage keys to access */
  storageKeys: H256[];
}

/**
 * EVM execution info
 */
export interface EvmExecutionInfo {
  /** Exit reason */
  exitReason: ExitReason;
  /** Return value from execution */
  value: Uint8Array;
  /** Gas used */
  usedGas: U256;
  /** Logs emitted */
  logs: EvmLog[];
}

/**
 * EVM exit reason
 */
export type ExitReason =
  | { Succeed: SucceedReason }
  | { Error: ErrorReason }
  | { Revert: RevertReason }
  | { Fatal: FatalReason };

export type SucceedReason = "Stopped" | "Returned" | "Suicided";
export type ErrorReason =
  | "StackUnderflow"
  | "StackOverflow"
  | "InvalidJump"
  | "InvalidRange"
  | "DesignatedInvalid"
  | "CallTooDeep"
  | "CreateCollision"
  | "CreateContractLimit"
  | "OutOfOffset"
  | "OutOfGas"
  | "OutOfFund"
  | "PCUnderflow"
  | "CreateEmpty"
  | "Other";
export type RevertReason = "Reverted";
export type FatalReason =
  | "NotSupported"
  | "UnhandledInterrupt"
  | "CallErrorAsFatal"
  | "Other";

/**
 * EVM log entry
 */
export interface EvmLog {
  /** Contract address that emitted the log */
  address: H160;
  /** Log topics (indexed parameters) */
  topics: H256[];
  /** Log data (non-indexed parameters) */
  data: Uint8Array;
}

// =============================================================================
// Extrinsic Parameter Types
// =============================================================================

/**
 * Parameters for EVM call
 */
export interface EvmCallParams {
  /** Source address (caller) */
  source: H160;
  /** Target contract address */
  target: H160;
  /** Call input data */
  input: Uint8Array | string;
  /** Value to transfer in wei */
  value: U256;
  /** Gas limit */
  gasLimit: U256;
  /** Max fee per gas (EIP-1559) */
  maxFeePerGas: U256;
  /** Max priority fee per gas (EIP-1559) - optional */
  maxPriorityFeePerGas?: U256;
  /** Nonce - optional, will be fetched if not provided */
  nonce?: U256;
  /** Access list (EIP-2930) - optional */
  accessList?: AccessListItem[];
}

/**
 * Parameters for EVM create (deploy contract)
 */
export interface EvmCreateParams {
  /** Source address (deployer) */
  source: H160;
  /** Contract initialization code */
  init: Uint8Array | string;
  /** Value to transfer in wei */
  value: U256;
  /** Gas limit */
  gasLimit: U256;
  /** Max fee per gas (EIP-1559) */
  maxFeePerGas: U256;
  /** Max priority fee per gas (EIP-1559) - optional */
  maxPriorityFeePerGas?: U256;
  /** Nonce - optional */
  nonce?: U256;
  /** Access list (EIP-2930) - optional */
  accessList?: AccessListItem[];
}

/**
 * Parameters for EVM create2 (deploy with salt)
 */
export interface EvmCreate2Params extends EvmCreateParams {
  /** Salt for create2 address derivation */
  salt: H256;
}

/**
 * Parameters for withdrawing from EVM
 */
export interface EvmWithdrawParams {
  /** EVM address to withdraw from */
  address: H160;
  /** Amount to withdraw */
  value: U256;
}

// =============================================================================
// Query Types
// =============================================================================

/**
 * Account codes query result
 */
export interface AccountCodesResult {
  /** Contract bytecode or empty if EOA */
  code: Uint8Array;
}

/**
 * Account storage query result
 */
export interface AccountStorageResult {
  /** Storage value at the given key */
  value: H256;
}

// =============================================================================
// Helper Types
// =============================================================================

/**
 * Contract deployment result
 */
export interface DeploymentResult {
  /** Deployed contract address */
  contractAddress: H160;
  /** Transaction hash */
  transactionHash: H256;
  /** Gas used */
  gasUsed: U256;
  /** Block number */
  blockNumber: number;
}

/**
 * Contract call result
 */
export interface CallResult {
  /** Return data from call */
  returnData: Uint8Array;
  /** Gas used */
  gasUsed: U256;
  /** Logs emitted */
  logs: EvmLog[];
}

/**
 * Gas estimation result
 */
export interface GasEstimate {
  /** Estimated gas required */
  gas: U256;
  /** Storage deposit required (if any) */
  storageDeposit?: U256;
}

/**
 * EVM balance info
 */
export interface EvmBalanceInfo {
  /** Balance in wei */
  balance: U256;
  /** Balance formatted as string (in SEL/ETH) */
  formatted: string;
}

/**
 * Transaction count (nonce) info
 */
export interface TransactionCountInfo {
  /** Current nonce */
  nonce: U256;
  /** Pending nonce (including pending transactions) */
  pendingNonce?: U256;
}

// =============================================================================
// Event Types
// =============================================================================

/**
 * EVM log event (emitted on successful execution)
 */
export interface LogEvent {
  /** Contract address */
  address: H160;
  /** Log topics */
  topics: H256[];
  /** Log data */
  data: Uint8Array;
}

/**
 * EVM created event (contract deployment)
 */
export interface CreatedEvent {
  /** Deployed contract address */
  address: H160;
}

/**
 * EVM executed event
 */
export interface ExecutedEvent {
  /** Target address */
  address: H160;
}

/**
 * EVM balance deposit event
 */
export interface BalanceDepositEvent {
  /** Sender address */
  sender: H160;
  /** Target address */
  address: H160;
  /** Amount deposited */
  value: U256;
}

/**
 * EVM balance withdraw event
 */
export interface BalanceWithdrawEvent {
  /** Sender address */
  sender: H160;
  /** Source address */
  address: H160;
  /** Amount withdrawn */
  value: U256;
}
