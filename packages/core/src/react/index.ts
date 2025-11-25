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
export { useStaking } from "./useStaking.js";
export { useTransaction, useTransactions } from "./useTransaction.js";
export { useGovernance } from "./useGovernance.js";
export { useNominationPools } from "./useNominationPools.js";

// Export hook types
export type { UseSelendraResult } from "./useSelendra.js";
export type { UseBalanceResult, BalanceState } from "./useBalance.js";
export type { UseStakingResult, StakingState } from "./useStaking.js";
export type {
  UseTransactionResult,
  TransactionState,
  TransactionStatus,
} from "./useTransaction.js";
export type { UseGovernanceResult, GovernanceState } from "./useGovernance.js";
export type {
  UseNominationPoolsResult,
  PoolsState,
} from "./useNominationPools.js";
