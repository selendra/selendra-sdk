/**
 * Contracts Pallet Types
 *
 * Type definitions for ink! smart contracts pallet
 */

/**
 * Gas and weight limits for contract execution
 */
export interface ContractGasLimit {
  /** Reference time weight */
  refTime: bigint;
  /** Proof size weight */
  proofSize: bigint;
}

/**
 * Storage deposit limit
 */
export type StorageDepositLimit = bigint | null;

/**
 * Contract determinism mode
 */
export enum Determinism {
  /** Requires deterministic execution */
  Enforced = "Enforced",
  /** Allows non-deterministic execution */
  Relaxed = "Relaxed",
}

/**
 * Contract info stored on-chain
 */
export interface ContractInfo {
  /** Trie ID for contract storage */
  trieId: string;
  /** Code hash of the deployed contract */
  codeHash: string;
  /** Storage bytes used */
  storageBytes: number;
  /** Storage items count */
  storageItems: number;
  /** Total deposit for storage */
  storageDeposit: bigint;
  /** Maximum deposit seen */
  storageDepositMax: bigint;
}

/**
 * Code storage info
 */
export interface CodeInfo {
  /** Owner of the code */
  owner: string;
  /** Deposit held for the code */
  deposit: bigint;
  /** Reference count (number of contracts using this code) */
  refcount: number;
  /** Determinism mode */
  determinism: Determinism;
  /** Code length in bytes */
  codeLen: number;
}

/**
 * Owner info for uploaded code
 */
export interface OwnerInfo {
  /** Owner account */
  owner: string;
  /** Deposit amount */
  deposit: bigint;
  /** Number of contracts instantiated from this code */
  refcount: number;
}

/**
 * Parameters for uploading code
 */
export interface UploadCodeParams {
  /** Contract WASM code */
  code: Uint8Array | string;
  /** Storage deposit limit (null for no limit) */
  storageDepositLimit?: StorageDepositLimit;
  /** Determinism requirement */
  determinism?: Determinism;
}

/**
 * Parameters for instantiating a contract
 */
export interface InstantiateParams {
  /** Value to transfer to new contract */
  value: bigint;
  /** Gas limit for instantiation */
  gasLimit: ContractGasLimit;
  /** Storage deposit limit */
  storageDepositLimit?: StorageDepositLimit;
  /** Code hash to instantiate from */
  codeHash: string;
  /** Constructor data/selector + args */
  data: Uint8Array | string;
  /** Salt for address derivation */
  salt?: Uint8Array | string;
}

/**
 * Parameters for instantiating with code upload
 */
export interface InstantiateWithCodeParams {
  /** Value to transfer to new contract */
  value: bigint;
  /** Gas limit for instantiation */
  gasLimit: ContractGasLimit;
  /** Storage deposit limit */
  storageDepositLimit?: StorageDepositLimit;
  /** Contract WASM code */
  code: Uint8Array | string;
  /** Constructor data/selector + args */
  data: Uint8Array | string;
  /** Salt for address derivation */
  salt?: Uint8Array | string;
}

/**
 * Parameters for calling a contract
 */
export interface ContractCallParams {
  /** Contract address */
  dest: string;
  /** Value to transfer */
  value: bigint;
  /** Gas limit for the call */
  gasLimit: ContractGasLimit;
  /** Storage deposit limit */
  storageDepositLimit?: StorageDepositLimit;
  /** Call data (selector + args) */
  data: Uint8Array | string;
}

/**
 * Dry run result for contract calls
 */
export interface DryRunResult {
  /** Whether the call succeeded */
  success: boolean;
  /** Return data from the call */
  data?: string;
  /** Gas consumed */
  gasConsumed: ContractGasLimit;
  /** Gas required (recommended) */
  gasRequired: ContractGasLimit;
  /** Storage deposit used */
  storageDeposit: {
    charge?: bigint;
    refund?: bigint;
  };
  /** Debug message if any */
  debugMessage?: string;
  /** Error if failed */
  error?: string;
  /** Execution result details */
  result?: {
    flags: number;
    data: string;
  };
}

/**
 * Contract instantiation result
 */
export interface InstantiationResult {
  /** Whether instantiation succeeded */
  success: boolean;
  /** Contract address */
  contractAddress?: string;
  /** Gas consumed */
  gasConsumed: ContractGasLimit;
  /** Storage deposit */
  storageDeposit: bigint;
  /** Error if failed */
  error?: string;
}

/**
 * Contract call result
 */
export interface ContractCallResult {
  /** Whether call succeeded */
  success: boolean;
  /** Return data */
  data?: string;
  /** Gas consumed */
  gasConsumed: ContractGasLimit;
  /** Events emitted */
  events: ContractEvent[];
  /** Error if failed */
  error?: string;
}

/**
 * Contract event
 */
export interface ContractEvent {
  /** Event topics */
  topics: string[];
  /** Event data */
  data: string;
  /** Contract that emitted the event */
  contract: string;
}

/**
 * Contracts pallet constants
 */
export interface ContractsConstants {
  /** Maximum code length */
  maxCodeLen: number;
  /** Schedule containing gas costs */
  schedule: {
    limits: {
      eventTopics: number;
      globals: number;
      locals: number;
      parameters: number;
      memoryPages: number;
      tableSize: number;
      brTableSize: number;
      subjectLen: number;
      payloadLen: number;
      runtimeMemory: number;
    };
  };
  /** Deposit per byte */
  depositPerByte: bigint;
  /** Deposit per item */
  depositPerItem: bigint;
  /** Default deposit limit */
  defaultDepositLimit: bigint;
  /** Max debug buffer length */
  maxDebugBufferLen: number;
  /** Code hash lockup deposit percent */
  codeHashLockupDepositPercent: number;
}

/**
 * Transaction result for contracts pallet
 */
export interface ContractsTxResult {
  /** Whether transaction succeeded */
  success: boolean;
  /** Block hash */
  blockHash: string;
  /** Transaction hash */
  txHash: string;
  /** Events from transaction */
  events: any[];
  /** Contract address (for instantiate) */
  contractAddress?: string;
  /** Code hash (for upload) */
  codeHash?: string;
  /** Return data */
  data?: string;
}
