/**
 * Selendra SDK Error Classes (TASK-012)
 *
 * Comprehensive error handling for the SDK
 */

/**
 * Base error class for all Selendra SDK errors
 */
export class SelendraError extends Error {
  /** Error code for programmatic handling */
  public readonly code: string;
  /** Original error that caused this error */
  public readonly cause?: Error;
  /** Additional context/details */
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    options?: {
      cause?: Error;
      details?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = "SelendraError";
    this.code = code;
    this.cause = options?.cause;
    this.details = options?.details;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SelendraError);
    }
  }

  /**
   * Convert error to JSON for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      cause: this.cause?.message,
      stack: this.stack,
    };
  }

  /**
   * Format error for display
   */
  toString(): string {
    let str = `[${this.code}] ${this.message}`;
    if (this.cause) {
      str += `\n  Caused by: ${this.cause.message}`;
    }
    return str;
  }
}

/**
 * Connection/Network errors
 */
export class ConnectionError extends SelendraError {
  constructor(
    message: string,
    options?: { cause?: Error; details?: Record<string, unknown> }
  ) {
    super(message, "CONNECTION_ERROR", options);
    this.name = "ConnectionError";
  }
}

export class NetworkUnavailableError extends ConnectionError {
  public readonly networkName: string;

  constructor(networkName: string, options?: { cause?: Error }) {
    super(`Network '${networkName}' is unavailable`, {
      cause: options?.cause,
      details: { networkName },
    });
    this.name = "NetworkUnavailableError";
    this.networkName = networkName;
  }
}

export class RpcError extends ConnectionError {
  public readonly rpcUrl: string;
  public readonly rpcCode?: number;

  constructor(
    message: string,
    rpcUrl: string,
    options?: { cause?: Error; rpcCode?: number }
  ) {
    super(message, {
      cause: options?.cause,
      details: { rpcUrl, rpcCode: options?.rpcCode },
    });
    this.name = "RpcError";
    this.rpcUrl = rpcUrl;
    this.rpcCode = options?.rpcCode;
  }
}

/**
 * Transaction errors
 */
export class TransactionError extends SelendraError {
  constructor(
    message: string,
    code: string = "TRANSACTION_ERROR",
    options?: { cause?: Error; details?: Record<string, unknown> }
  ) {
    super(message, code, options);
    this.name = "TransactionError";
  }
}

export class InsufficientFundsError extends TransactionError {
  public readonly required: bigint;
  public readonly available: bigint;

  constructor(
    required: bigint,
    available: bigint,
    options?: { cause?: Error }
  ) {
    super(
      `Insufficient funds: required ${required.toString()}, available ${available.toString()}`,
      "INSUFFICIENT_FUNDS",
      {
        cause: options?.cause,
        details: {
          required: required.toString(),
          available: available.toString(),
        },
      }
    );
    this.name = "InsufficientFundsError";
    this.required = required;
    this.available = available;
  }
}

export class GasEstimationError extends TransactionError {
  constructor(
    message: string,
    options?: { cause?: Error; details?: Record<string, unknown> }
  ) {
    super(message, "GAS_ESTIMATION_ERROR", options);
    this.name = "GasEstimationError";
  }
}

export class TransactionRevertedError extends TransactionError {
  public readonly txHash: string;
  public readonly reason?: string;

  constructor(txHash: string, reason?: string, options?: { cause?: Error }) {
    super(
      reason
        ? `Transaction reverted: ${reason}`
        : `Transaction reverted: ${txHash}`,
      "TRANSACTION_REVERTED",
      {
        cause: options?.cause,
        details: { txHash, reason },
      }
    );
    this.name = "TransactionRevertedError";
    this.txHash = txHash;
    this.reason = reason;
  }
}

export class TransactionTimeoutError extends TransactionError {
  public readonly txHash?: string;
  public readonly timeoutMs: number;

  constructor(timeoutMs: number, txHash?: string, options?: { cause?: Error }) {
    super(
      txHash
        ? `Transaction ${txHash} timed out after ${timeoutMs}ms`
        : `Transaction timed out after ${timeoutMs}ms`,
      "TRANSACTION_TIMEOUT",
      {
        cause: options?.cause,
        details: { txHash, timeoutMs },
      }
    );
    this.name = "TransactionTimeoutError";
    this.txHash = txHash;
    this.timeoutMs = timeoutMs;
  }
}

export class NonceTooLowError extends TransactionError {
  public readonly nonce: number;

  constructor(nonce: number, options?: { cause?: Error }) {
    super(`Nonce too low: ${nonce}`, "NONCE_TOO_LOW", {
      cause: options?.cause,
      details: { nonce },
    });
    this.name = "NonceTooLowError";
    this.nonce = nonce;
  }
}

/**
 * Contract errors
 */
export class ContractError extends SelendraError {
  constructor(
    message: string,
    code: string = "CONTRACT_ERROR",
    options?: { cause?: Error; details?: Record<string, unknown> }
  ) {
    super(message, code, options);
    this.name = "ContractError";
  }
}

export class ContractNotFoundError extends ContractError {
  public readonly address: string;

  constructor(address: string, options?: { cause?: Error }) {
    super(`Contract not found at ${address}`, "CONTRACT_NOT_FOUND", {
      cause: options?.cause,
      details: { address },
    });
    this.name = "ContractNotFoundError";
    this.address = address;
  }
}

export class ContractCallError extends ContractError {
  public readonly contractAddress: string;
  public readonly functionName: string;

  constructor(
    contractAddress: string,
    functionName: string,
    message: string,
    options?: { cause?: Error }
  ) {
    super(message, "CONTRACT_CALL_ERROR", {
      cause: options?.cause,
      details: { contractAddress, functionName },
    });
    this.name = "ContractCallError";
    this.contractAddress = contractAddress;
    this.functionName = functionName;
  }
}

export class AbiNotFoundError extends ContractError {
  public readonly contractName?: string;
  public readonly address?: string;

  constructor(options: {
    contractName?: string;
    address?: string;
    cause?: Error;
  }) {
    const identifier = options.contractName || options.address || "unknown";
    super(`ABI not found for contract: ${identifier}`, "ABI_NOT_FOUND", {
      cause: options.cause,
      details: {
        contractName: options.contractName,
        address: options.address,
      },
    });
    this.name = "AbiNotFoundError";
    this.contractName = options.contractName;
    this.address = options.address;
  }
}

/**
 * Account/Wallet errors
 */
export class AccountError extends SelendraError {
  constructor(
    message: string,
    code: string = "ACCOUNT_ERROR",
    options?: { cause?: Error; details?: Record<string, unknown> }
  ) {
    super(message, code, options);
    this.name = "AccountError";
  }
}

export class AccountNotFoundError extends AccountError {
  public readonly accountIdentifier: string;

  constructor(accountIdentifier: string, options?: { cause?: Error }) {
    super(`Account not found: ${accountIdentifier}`, "ACCOUNT_NOT_FOUND", {
      cause: options?.cause,
      details: { accountIdentifier },
    });
    this.name = "AccountNotFoundError";
    this.accountIdentifier = accountIdentifier;
  }
}

export class InvalidPrivateKeyError extends AccountError {
  constructor(
    message: string = "Invalid private key format",
    options?: { cause?: Error }
  ) {
    super(message, "INVALID_PRIVATE_KEY", { cause: options?.cause });
    this.name = "InvalidPrivateKeyError";
  }
}

export class InvalidMnemonicError extends AccountError {
  constructor(
    message: string = "Invalid mnemonic phrase",
    options?: { cause?: Error }
  ) {
    super(message, "INVALID_MNEMONIC", { cause: options?.cause });
    this.name = "InvalidMnemonicError";
  }
}

export class SigningError extends AccountError {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, "SIGNING_ERROR", { cause: options?.cause });
    this.name = "SigningError";
  }
}

/**
 * Validation errors
 */
export class ValidationError extends SelendraError {
  public readonly field?: string;

  constructor(message: string, field?: string, options?: { cause?: Error }) {
    super(message, "VALIDATION_ERROR", {
      cause: options?.cause,
      details: { field },
    });
    this.name = "ValidationError";
    this.field = field;
  }
}

export class InvalidAddressError extends ValidationError {
  public readonly address: string;

  constructor(address: string, options?: { cause?: Error }) {
    super(`Invalid address: ${address}`, "address", { cause: options?.cause });
    this.name = "InvalidAddressError";
    this.address = address;
  }
}

export class InvalidAmountError extends ValidationError {
  public readonly amount: string;

  constructor(amount: string, message?: string, options?: { cause?: Error }) {
    super(message || `Invalid amount: ${amount}`, "amount", {
      cause: options?.cause,
    });
    this.name = "InvalidAmountError";
    this.amount = amount;
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends SelendraError {
  constructor(
    message: string,
    options?: { cause?: Error; details?: Record<string, unknown> }
  ) {
    super(message, "CONFIGURATION_ERROR", options);
    this.name = "ConfigurationError";
  }
}

export class MissingConfigError extends ConfigurationError {
  public readonly configKey: string;

  constructor(configKey: string, options?: { cause?: Error }) {
    super(`Missing required configuration: ${configKey}`, {
      cause: options?.cause,
      details: { configKey },
    });
    this.name = "MissingConfigError";
    this.configKey = configKey;
  }
}

/**
 * Substrate-specific errors
 */
export class SubstrateError extends SelendraError {
  constructor(
    message: string,
    code: string = "SUBSTRATE_ERROR",
    options?: { cause?: Error; details?: Record<string, unknown> }
  ) {
    super(message, code, options);
    this.name = "SubstrateError";
  }
}

export class ExtrinsicFailedError extends SubstrateError {
  public readonly module?: string;
  public readonly errorName?: string;

  constructor(
    message: string,
    options?: { module?: string; errorName?: string; cause?: Error }
  ) {
    super(message, "EXTRINSIC_FAILED", {
      cause: options?.cause,
      details: { module: options?.module, errorName: options?.errorName },
    });
    this.name = "ExtrinsicFailedError";
    this.module = options?.module;
    this.errorName = options?.errorName;
  }
}

/**
 * Error helper functions
 */

/**
 * Check if error is a Selendra error
 */
export function isSelendraError(error: unknown): error is SelendraError {
  return error instanceof SelendraError;
}

/**
 * Check if error matches a specific code
 */
export function hasErrorCode(error: unknown, code: string): boolean {
  return isSelendraError(error) && error.code === code;
}

/**
 * Wrap an unknown error in a SelendraError
 */
export function wrapError(
  error: unknown,
  fallbackMessage: string = "An unexpected error occurred"
): SelendraError {
  if (isSelendraError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new SelendraError(
      error.message || fallbackMessage,
      "UNKNOWN_ERROR",
      {
        cause: error,
      }
    );
  }

  return new SelendraError(
    typeof error === "string" ? error : fallbackMessage,
    "UNKNOWN_ERROR"
  );
}

/**
 * Parse RPC error and return appropriate error class
 */
export function parseRpcError(error: unknown, rpcUrl?: string): SelendraError {
  if (isSelendraError(error)) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);

  // Check for common patterns
  if (message.includes("insufficient funds")) {
    return new InsufficientFundsError(0n, 0n, {
      cause: error instanceof Error ? error : undefined,
    });
  }

  if (message.includes("nonce too low")) {
    return new NonceTooLowError(0, {
      cause: error instanceof Error ? error : undefined,
    });
  }

  if (message.includes("execution reverted")) {
    return new TransactionRevertedError("unknown", message, {
      cause: error instanceof Error ? error : undefined,
    });
  }

  if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
    return new TransactionTimeoutError(30000, undefined, {
      cause: error instanceof Error ? error : undefined,
    });
  }

  if (
    message.includes("connection") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND")
  ) {
    return new ConnectionError(message, {
      cause: error instanceof Error ? error : undefined,
    });
  }

  if (rpcUrl) {
    return new RpcError(message, rpcUrl, {
      cause: error instanceof Error ? error : undefined,
    });
  }

  return wrapError(error);
}
