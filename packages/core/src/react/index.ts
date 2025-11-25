/**
 * React Hooks for Selendra SDK
 *
 * Provides React bindings for the Selendra SDK.
 * Includes hooks for connecting, querying, and submitting transactions.
 *
 * @packageDocumentation
 */

// Export context and provider
export { SelendraProvider, SelendraContext } from "./provider.js";
export type {
  SelendraProviderProps,
  SelendraContextValue,
} from "./provider.js";

// Export core hooks
export { useSelendra } from "./useSelendra.js";
export { useBalance } from "./useBalance.js";
export { useTransaction, useTransactions } from "./useTransaction.js";

// Export hook types
export type { UseSelendraResult } from "./useSelendra.js";
export type { UseBalanceResult, BalanceState } from "./useBalance.js";
export type {
  UseTransactionResult,
  TransactionState,
  TransactionStatus,
} from "./useTransaction.js";

// Note: useStaking, useGovernance, and useNominationPools are temporarily
// disabled pending API updates. They will be re-enabled in a future release.
