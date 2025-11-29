/**
 * Selendra SDK - TypeScript
 *
 * Main entry point - exports all public APIs
 *
 * @module @selendrajs/sdk
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
export type {
  BaseProviderEvents,
  GasEstimate,
  GasCostsResult,
} from "./providers/index.js";

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

// Export Multicall utility
export {
  Multicall,
  createMulticall,
  batchERC20Balances,
  batchERC20Info,
  MULTICALL3_ADDRESS,
  MULTICALL3_ABI,
} from "./utils/index.js";
export type {
  MulticallRequest,
  MulticallResult,
  MulticallOptions,
} from "./utils/index.js";

// Export logger configuration
export {
  configureLogger,
  suppressNodeWarnings,
  getLoggerConfig,
  resetLogger,
} from "./utils/logger.js";
export type { LoggerConfig } from "./utils/logger.js";

// Export error classes (TASK-012)
export {
  SelendraError,
  ConnectionError,
  NetworkUnavailableError,
  RpcError,
  TransactionError,
  InsufficientFundsError,
  GasEstimationError,
  TransactionRevertedError,
  TransactionTimeoutError,
  NonceTooLowError,
  ContractError,
  ContractNotFoundError,
  ContractCallError,
  AbiNotFoundError,
  AccountError,
  AccountNotFoundError,
  InvalidPrivateKeyError,
  InvalidMnemonicError,
  SigningError,
  ValidationError,
  InvalidAddressError,
  InvalidAmountError,
  ConfigurationError,
  MissingConfigError,
  SubstrateError,
  ExtrinsicFailedError,
  isSelendraError,
  hasErrorCode,
  wrapError,
  parseRpcError,
} from "./errors/index.js";

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

// Export EVM pallet (Frontier)
export { EvmManager, EvmQueries } from "./pallets/evm/index.js";
export type {
  H160,
  H256,
  U256,
  EvmCallParams,
  EvmCreateParams,
  EvmCreate2Params,
  AccessListItem,
  EvmLog,
  ExitReason as EvmExitReason,
  EvmAccountInfo,
  AccountCodesResult,
  AccountStorageResult,
  EvmBalanceInfo,
  TransactionCountInfo,
  EvmTxResult,
  EvmCallResult,
  EvmCreateResult,
  DeployContractOptions,
  CallContractOptions,
} from "./pallets/evm/index.js";

// Export Ethereum pallet (Frontier)
export { EthereumManager, EthereumQueries } from "./pallets/ethereum/index.js";
export type {
  LegacyTransaction,
  EIP2930Transaction,
  EIP1559Transaction,
  EIP4844Transaction,
  EthereumTransaction,
  TransactionAction,
  AccessListEntry,
  EthereumSignature,
  EthereumBlockHeader,
  EthereumBlock,
  ReceiptStatus,
  ReceiptLog,
  EthereumReceipt,
  TransactParams,
  EthereumTxOptions,
  EthereumExecutedEvent,
  ExitReason as EthereumExitReason,
  BlockInfo,
  PendingInfo,
  TransactionInfo,
  EthereumTxResult,
} from "./pallets/ethereum/index.js";

// Export Session pallet
export { SessionManager, SessionQueries } from "./pallets/session/index.js";
export type {
  SessionKeys,
  RawSessionKeys,
  QueuedKeyInfo,
  SessionInfo,
  SessionProgress,
  ValidatorSessionInfo,
  SetKeysParams,
  PurgeKeysParams,
  NewSessionEvent,
  ValidatorsResult,
  CurrentIndexResult,
  NextKeysResult,
  QueuedKeysResult,
  SessionConstants,
} from "./pallets/session/index.js";

// Export Nomination Pools pallet
export {
  NominationPoolsManager,
  NominationPoolsQueries,
} from "./pallets/nomination-pools/index.js";
export { PoolState } from "./pallets/nomination-pools/index.js";
export type {
  BondedPoolInfo,
  PoolRoles,
  RewardPoolInfo,
  PoolMemberInfo,
  UnbondingEra,
  SubPoolsInfo,
  SubPool,
  PoolConfig,
  PoolCommission,
  CommissionChangeRate,
  CreatePoolParams,
  JoinPoolParams,
  BondExtraParams as PoolBondExtraParams,
  BondExtraSource,
  UnbondParams as PoolUnbondParams,
  WithdrawUnbondedParams as PoolWithdrawUnbondedParams,
  PoolWithdrawUnbondedParams as PoolWithdrawUnbondedParamsExtended,
  SetMetadataParams,
  NominatePoolParams,
  SetStateParams,
  ChillPoolParams,
  UpdateRolesParams,
  SetCommissionParams,
  ClaimCommissionParams,
  PoolCreatedEvent,
  MemberJoinedEvent,
  PayoutEvent,
  UnbondedEvent as PoolUnbondedEvent,
  WithdrawnEvent as PoolWithdrawnEvent,
  PoolInfoResult,
  MemberInfoResult,
  PoolsListResult,
  PoolConstants,
} from "./pallets/nomination-pools/index.js";

// Export Aleph pallet (Selendra consensus)
export { AlephManager, AlephQueries } from "./pallets/aleph/index.js";
export type {
  AuthorityInfo,
  AlephSessionInfo,
  FinalityState,
  BlockTimingInfo,
  AlephConstants,
  SessionChangeData,
  EraChangeData,
  FinalityData,
} from "./pallets/aleph/index.js";

// Export Elections pallet (Selendra validator elections)
export {
  ElectionsManager,
  ElectionsQueries,
  ElectionOpenness,
  ElectionsError,
} from "./pallets/elections/index.js";
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
  ElectionsTxResult,
} from "./pallets/elections/index.js";

// Export Committee Management pallet (Selendra ban/performance management)
export {
  CommitteeManagementManager,
  CommitteeManagementQueries,
  BanReasonType,
  CommitteeManagementError,
  DEFAULT_BAN_CONFIG,
  DEFAULT_LENIENT_THRESHOLD,
} from "./pallets/committee-management/index.js";
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
  CommitteeManagementTxResult,
} from "./pallets/committee-management/index.js";

// Export Identity pallet
export { IdentityManager, IdentityQueries } from "./pallets/identity/index.js";
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
  IdentityTxResult,
} from "./pallets/identity/index.js";

// Export Multisig pallet
export { MultisigManager, MultisigQueries } from "./pallets/multisig/index.js";
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
  MultisigTxResult,
} from "./pallets/multisig/index.js";

// Export Proxy pallet
export { ProxyManager, ProxyQueries } from "./pallets/proxy/index.js";
export { PROXY_TYPE_HIERARCHY } from "./pallets/proxy/index.js";
export type {
  ProxyType,
  ProxyDefinition,
  ProxyInfo,
  Announcement,
  AnnouncementsInfo,
  PureProxyInfo,
  ProxyConstants,
  ProxyCheckResult,
  ProxyFilter,
  ProxyDelegation,
  ProxySummary,
  ProxyCallOptions,
  ProxyTxResult,
} from "./pallets/proxy/index.js";

// Export Vesting pallet
export { VestingManager, VestingQueries } from "./pallets/vesting/index.js";
export {
  calculateEndBlock,
  calculateVestedAt,
  calculateLockedAt,
} from "./pallets/vesting/index.js";
export type {
  VestingSchedule,
  VestingInfo,
  VestingStatus,
  VestingParams,
  VestingConstants,
  VestingScheduleWithInfo,
  VestingAccountInfo,
  MergeSchedulesParams,
  VestingEventType,
  VestingEvent,
  VestedTransferParams,
  VestingTxResult,
} from "./pallets/vesting/index.js";

// Export Utility pallet
export { UtilityManager, UtilityQueries } from "./pallets/utility/index.js";
export type {
  BatchCallItem,
  BatchResult,
  BatchCallResult,
  UtilityConstants,
  DispatchWeight,
  DerivativeOptions,
  DispatchAsOptions,
  DispatchOrigin,
  BatchType,
  BatchExecutionOptions,
  CallInfo,
  BatchSummary,
  UtilityEventType,
  UtilityEvent,
  UtilityTxResult,
} from "./pallets/utility/index.js";

// ============================================================================
// P3 Priority Pallets - Smart Contracts & Advanced Features
// ============================================================================

// Export Contracts pallet (ink! smart contracts)
export {
  ContractsManager,
  ContractsQueries,
  Determinism,
} from "./pallets/contracts/index.js";
export type {
  ContractGasLimit,
  StorageDepositLimit,
  ContractInfo,
  CodeInfo,
  OwnerInfo,
  UploadCodeParams,
  InstantiateParams,
  InstantiateWithCodeParams,
  ContractCallParams,
  DryRunResult,
  InstantiationResult,
  ContractCallResult,
  ContractEvent,
  ContractsConstants,
  ContractsTxResult,
} from "./pallets/contracts/index.js";

// Export XVM pallet (Cross-Virtual Machine calls)
export { XvmManager, XvmQueries, XvmContext } from "./pallets/xvm/index.js";
export type {
  XvmTarget,
  XvmCallParams,
  XvmCallResult,
  XvmEvent,
  XvmConstants,
  EvmToWasmParams,
  WasmToEvmParams,
  XvmTxResult,
} from "./pallets/xvm/index.js";

// Export Dynamic EVM Base Fee pallet
export {
  DynamicEvmBaseFeeManager,
  DynamicEvmBaseFeeQueries,
} from "./pallets/dynamic-evm-base-fee/index.js";
export type {
  BaseFeeConfig,
  BaseFeeThreshold,
  BaseFeePerGas,
  FeeHistoryEntry,
  DynamicBaseFeeConstants,
  DynamicBaseFeeTxResult,
} from "./pallets/dynamic-evm-base-fee/index.js";

// Export Ethereum Checked pallet
export {
  EthereumCheckedManager,
  EthereumCheckedQueries,
} from "./pallets/ethereum-checked/index.js";
export type {
  CheckedEthereumTx,
  AccessListItem as EthCheckedAccessListItem,
  TxValidationResult,
  CheckedTxReceipt,
  TxLog,
  EthereumCheckedConstants,
  EthereumCheckedTxResult,
} from "./pallets/ethereum-checked/index.js";

// Export Scheduler pallet
export {
  SchedulerManager,
  SchedulerQueries,
} from "./pallets/scheduler/index.js";
export type {
  ScheduledCall,
  ScheduleOrigin,
  AgendaEntry,
  ScheduleParams,
  ScheduleNamedParams,
  SchedulerConstants,
  SchedulerTxResult,
} from "./pallets/scheduler/index.js";

// Export Preimage pallet
export { PreimageManager, PreimageQueries } from "./pallets/preimage/index.js";
export type {
  PreimageStatus,
  PreimageInfo,
  PreimageData,
  PreimageConstants,
  PreimageTxResult,
} from "./pallets/preimage/index.js";

// Export Operations pallet (Selendra account maintenance)
export {
  OperationsManager,
  OperationsQueries,
} from "./pallets/operations/index.js";
export type {
  AccountConsumers,
  AccountBalanceDetails,
  AccountValidation,
  FixConsumersResult,
  BatchFixResult,
  OperationsConstants,
  ConsumerEvent,
} from "./pallets/operations/index.js";

// ============================================================================
// P4 Priority Pallets - Administration & Safety
// ============================================================================

// Export Sudo pallet (privileged operations)
export { SudoManager, SudoQueries } from "./pallets/sudo/index.js";
export type {
  SudoKey,
  SudoCallParams,
  SudoAsParams,
  SetKeyParams,
  SudoTxResult,
  SudoEventType,
  SudoEvent,
  SudoConstants,
} from "./pallets/sudo/index.js";

// Export Safe Mode pallet (emergency network protection)
export { SafeModeManager, SafeModeQueries } from "./pallets/safe-mode/index.js";
export type {
  SafeModeStatus,
  SafeModeConfig,
  SafeModeConstants,
  SafeModeEventType,
  SafeModeEvent,
  SafeModeTxResult,
} from "./pallets/safe-mode/index.js";

// Export Tx Pause pallet (transaction pausing)
export { TxPauseManager, TxPauseQueries } from "./pallets/tx-pause/index.js";
export type {
  FullTransactionName,
  PausedTransaction,
  TxPauseConfig,
  TxPauseConstants,
  TxPauseEventType,
  TxPauseEvent,
  TxPauseTxResult,
} from "./pallets/tx-pause/index.js";

// Export Technical Committee pallet (governance collective)
export {
  TechCommitteeManager,
  TechCommitteeQueries,
} from "./pallets/technical-committee/index.js";
export type {
  ProposalHash,
  ProposalIndex,
  TechCommitteeVote,
  TechCommitteeMember,
  TechCommitteeProposalStatus,
  TechCommitteeInfo,
  TechCommitteeProposalParams,
  TechCommitteeVoteParams,
  TechCommitteeCloseParams,
  TechCommitteeSetMembersParams,
} from "./pallets/technical-committee/index.js";
export type { TechCommitteeResult } from "./pallets/technical-committee/client.js";

// Re-export commonly used types from dependencies for convenience
export type { ApiPromise } from "@polkadot/api";
export type {
  PublicClient,
  WalletClient,
  Chain,
  Transport,
  Account,
} from "viem";

/**
 * Default export for CommonJS compatibility
 */
export { SelendraSDK as default } from "./core/index.js";
