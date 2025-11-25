/**
 * Committee Management Pallet Module
 *
 * Selendra's committee management pallet for validator bans, performance tracking,
 * and session/era management
 */

// Types
export type {
  BanReason,
  BanInfo,
  ProductionBanConfig,
  FinalityBanConfig,
  SessionValidators,
  CurrentAndNextSessionValidators,
  ValidatorBlockCount,
  ValidatorPerformance,
  ValidatorReward,
  SetProductionBanConfigParams,
  SetFinalityBanConfigParams,
  BanFromCommitteeParams,
  CancelBanParams,
  SetLenientThresholdParams,
  SetBanConfigEvent,
  SetFinalityBanConfigEvent,
  BanValidatorsEvent,
  CommitteeManagementConfig,
  BannedValidatorsInfo,
} from "./types.js";

export {
  BanReasonType,
  CommitteeManagementError,
  DEFAULT_BAN_CONFIG,
  DEFAULT_LENIENT_THRESHOLD,
} from "./types.js";

// Queries
export { CommitteeManagementQueries } from "./queries.js";

// Client/Manager
export {
  CommitteeManagementManager,
  type CommitteeManagementTxResult,
} from "./client.js";
