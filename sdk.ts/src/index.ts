/**
 * Selendra SDK - TypeScript
 *
 * Main entry point - exports all public APIs
 *
 * @module @selendrajs/sdk-core
 * @author Selendra Team <team@selendra.org>
 * @license Apache-2.0
 * @version 1.0.0
 */

// Import logger FIRST to suppress warnings before anything else loads
import "./utils/logger.js";

// Export main SDK class and factory functions
export { SelendraSDK, createSDK, createAndConnect, sdk } from "./core/index.js";

// Export all types and enums
export type { SDKConfig, ConnectionInfo, SDKEvents } from "./types/index.js";
export { ChainType, Network } from "./types/index.js";

// Export providers for advanced usage
export {
  BaseProvider,
  SubstrateProvider,
  EvmProvider,
} from "./providers/index.js";
export type { BaseProviderEvents } from "./providers/index.js";

// Export Unified Accounts
export {
  UnifiedAccountsManager,
  UnifiedAccountSignature,
} from "./unified/index.js";
export type {
  EvmMappingResult,
  SubstrateMappingResult,
  MappingInfo,
  ClaimResult,
  ClaimEvent,
  EligibilityCheck,
  CostEstimate,
  TransactionOptions,
  EIP712Domain,
  ClaimMessage,
} from "./unified/index.js";
export { UnifiedAccountError } from "./unified/index.js";
export {
  calculateDefaultEvmAddress,
  calculateDefaultSubstrateAddress,
  isValidSubstrateAddress,
  isValidEvmAddress,
  getAddressType,
} from "./unified/index.js";

// Export utilities for advanced usage
export {
  Logger,
  mergeConfig,
  validateConfig,
  DEFAULT_CONFIG,
} from "./utils/index.js";
export { SelendraWallet, WalletUtils } from "./utils/index.js";
export type {
  WalletType,
  EncryptedJson,
  ProgressCallback,
} from "./utils/index.js";

// Export logger configuration
export {
  configureLogger,
  suppressNodeWarnings,
  getLoggerConfig,
  resetLogger,
} from "./utils/logger.js";
export type { LoggerConfig } from "./utils/logger.js";

// Export Pallets
export { BalancesManager, BalancesQueries } from "./pallets/balances/index.js";
export type {
  AccountData,
  BalanceLock,
  ReserveData,
  BalanceInfo,
  TransferParams,
  TransferAllParams,
  ForceTransferParams,
  SetBalanceParams,
  ForceUnreserveParams,
  FeeEstimate,
  TransferEvent,
  BalanceSetEvent,
  ReservedEvent,
  UnreservedEvent,
  DepositEvent,
  WithdrawEvent,
} from "./pallets/balances/index.js";

// Export Staking pallet
export {
  StakingManager,
  StakingQueries,
  RewardDestination,
} from "./pallets/staking/index.js";
export type {
  ValidatorPrefs,
  StakingLedger,
  UnlockChunk,
  ActiveEraInfo,
  EraRewardPoints,
  Exposure,
  IndividualExposure,
  Nominations,
  SlashingSpans,
  StakingInfo,
  BondParams,
  BondExtraParams,
  UnbondParams,
  WithdrawUnbondedParams,
  NominateParams,
  ValidateParams,
  SetPayeeParams,
  SetControllerParams,
  PayoutStakersParams,
  RebondParams,
  ChillOtherParams,
  ForceUnstakeParams,
  ForceNewEraParams,
  BondedEvent,
  UnbondedEvent,
  WithdrawnEvent,
  RewardedEvent,
  SlashedEvent,
  ChilledEvent,
  PayeeSetEvent,
  PendingRewards,
  EraRewards,
} from "./pallets/staking/index.js";

// Export Democracy pallet
export {
  DemocracyManager,
  DemocracyQueries,
  Conviction,
} from "./pallets/democracy/index.js";
export type {
  ReferendumInfo,
  ProposalInfo,
  VotingInfo,
  AccountVote,
  DemocracyConstants,
  ProposeParams,
  SecondParams,
  VoteParams as DemocracyVoteParams,
  DelegateParams,
  RemoveVoteParams,
  EmergencyCancelParams,
  ExternalProposeParams,
  FastTrackParams,
} from "./pallets/democracy/index.js";

// Export Council pallet
export { CouncilManager, CouncilQueries } from "./pallets/council/index.js";
export type {
  Votes,
  CouncilProposal,
  CouncilConstants,
  CouncilProposeParams,
  CouncilVoteParams,
  CouncilCloseParams,
  SetMembersParams,
} from "./pallets/council/index.js";

// Export Treasury pallet
export { TreasuryManager, TreasuryQueries } from "./pallets/treasury/index.js";
export type {
  TreasuryProposal,
  SpendStatus,
  TreasuryConstants,
  ProposeSpendParams,
  ApproveProposalParams,
  RejectProposalParams,
  SpendLocalParams,
} from "./pallets/treasury/index.js";

// Export Council Elections (Phragmen) pallet
export {
  ElectionsPhragmenManager,
  ElectionsPhragmenQueries,
} from "./pallets/elections-phragmen/index.js";
export type {
  SeatHolder,
  Voter,
  Candidate,
  Renouncing,
  ElectionsConstants,
  VoteParams as ElectionsVoteParams,
  SubmitCandidacyParams,
  RenounceCandidacyParams,
  RemoveMemberParams,
  CleanDefunctVotersParams,
} from "./pallets/elections-phragmen/index.js";

// Re-export commonly used types from dependencies for convenience
export type { ApiPromise } from "@polkadot/api";
export type { JsonRpcProvider } from "ethers";

/**
 * Default export for CommonJS compatibility
 */
export { SelendraSDK as default } from "./core/index.js";
