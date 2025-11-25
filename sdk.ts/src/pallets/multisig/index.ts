/**
 * Multisig Pallet Module
 *
 * Provides multi-signature account functionality for Selendra
 */

// Export types
export type {
  Timepoint,
  MultisigInfo,
  MultisigAccount,
  MultisigCall,
  PendingMultisig,
  MultisigResult,
  MultisigConstants,
  MultisigStatus,
  ApprovalStatus,
  MultisigOperationDetails,
} from "./types.js";

// Export queries
export { MultisigQueries } from "./queries.js";

// Export client/manager
export { MultisigManager } from "./client.js";
export type { MultisigTxResult } from "./client.js";
