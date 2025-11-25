/**
 * Elections Pallet Module
 *
 * Selendra's custom validator elections pallet for managing the validator committee
 */

// Types
export type {
  CommitteeSeats,
  EraValidators,
  ValidatorRewardInfo,
  ValidatorSetInfo,
  ChangeValidatorsParams,
  SetElectionsOpennessParams,
  ValidatorSupport,
  ElectionResults,
  ChangeValidatorsEvent,
  ElectionsConfig,
  ValidatorEligibility,
} from "./types.js";

export { ElectionOpenness, ElectionsError } from "./types.js";

// Queries
export { ElectionsQueries } from "./queries.js";

// Client/Manager
export { ElectionsManager, type ElectionsTxResult } from "./client.js";
