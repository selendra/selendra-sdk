/**
 * XVM Pallet Types
 *
 * Type definitions for Cross-VM calls between WASM and EVM
 */

/**
 * XVM context specifying the target VM
 */
export enum XvmContext {
  /** Target is EVM contract */
  Evm = "Evm",
  /** Target is WASM/ink! contract */
  Wasm = "Wasm",
}

/**
 * XVM call target
 */
export interface XvmTarget {
  /** Target VM context */
  context: XvmContext;
  /** Target contract address (EVM address or Substrate account) */
  address: string;
}

/**
 * XVM call parameters
 */
export interface XvmCallParams {
  /** VM context (EVM or WASM) */
  context: XvmContext;
  /** Target contract address */
  to: string;
  /** Call input data */
  input: Uint8Array | string;
  /** Value to transfer (in native token) */
  value?: bigint;
  /** Optional metadata for the call */
  metadata?: Uint8Array | string;
}

/**
 * XVM call result
 */
export interface XvmCallResult {
  /** Whether the call succeeded */
  success: boolean;
  /** Return data from the call */
  data?: string;
  /** Error message if failed */
  error?: string;
  /** Gas used (for EVM calls) */
  gasUsed?: bigint;
  /** Events emitted */
  events: XvmEvent[];
}

/**
 * XVM event
 */
export interface XvmEvent {
  /** Event type */
  type: "XvmCall" | "XvmExecuted" | "XvmTransfer";
  /** Source VM */
  sourceContext: XvmContext;
  /** Target VM */
  targetContext: XvmContext;
  /** Call data or result */
  data: string;
}

/**
 * XVM pallet constants
 */
export interface XvmConstants {
  /** Maximum call depth */
  maxCallDepth: number;
  /** Maximum input size */
  maxInputSize: number;
}

/**
 * EVM to WASM call parameters
 */
export interface EvmToWasmParams {
  /** WASM contract address (SS58) */
  wasmContract: string;
  /** Call selector (4 bytes) */
  selector: string;
  /** Encoded arguments */
  args: Uint8Array | string;
  /** Value to transfer */
  value?: bigint;
}

/**
 * WASM to EVM call parameters
 */
export interface WasmToEvmParams {
  /** EVM contract address (0x...) */
  evmContract: string;
  /** Function selector (4 bytes) or full calldata */
  calldata: Uint8Array | string;
  /** Value to transfer (in wei) */
  value?: bigint;
  /** Gas limit for EVM execution */
  gasLimit?: bigint;
}

/**
 * XVM transaction result
 */
export interface XvmTxResult {
  /** Whether transaction succeeded */
  success: boolean;
  /** Block hash */
  blockHash: string;
  /** Transaction hash */
  txHash: string;
  /** Events from transaction */
  events: any[];
  /** Return data */
  returnData?: string;
}
