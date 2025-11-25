/**
 * Identity Pallet Module
 *
 * Provides on-chain identity management for accounts on Selendra
 */

// Export types
export type {
  IdentityInfo,
  SimpleIdentityInfo,
  IdentityData,
  Registration,
  RegistrarInfo,
  SubsInfo,
  SuperInfo,
  Judgement,
  FullIdentityInfo,
  IdentityConstants,
} from "./types.js";

// Export queries
export { IdentityQueries } from "./queries.js";

// Export client/manager
export { IdentityManager } from "./client.js";
export type { IdentityTxResult } from "./client.js";
