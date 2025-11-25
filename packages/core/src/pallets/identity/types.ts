/**
 * Identity Pallet Types
 *
 * Type definitions for Substrate's identity pallet - on-chain identity management
 */

// ==========================================================================
// Identity Data Types
// ==========================================================================

/**
 * Identity data value types
 */
export type IdentityData =
  | { type: "None" }
  | { type: "Raw"; value: string }
  | { type: "BlakeTwo256"; hash: string }
  | { type: "Sha256"; hash: string }
  | { type: "Keccak256"; hash: string }
  | { type: "ShaThree256"; hash: string };

/**
 * Standard identity fields
 */
export interface IdentityInfo {
  /** Display name */
  display: IdentityData;
  /** Legal name */
  legal: IdentityData;
  /** Web URL */
  web: IdentityData;
  /** Riot/Matrix handle */
  riot: IdentityData;
  /** Email address */
  email: IdentityData;
  /** PGP fingerprint (20 bytes) */
  pgpFingerprint: string | null;
  /** Image URL or hash */
  image: IdentityData;
  /** Twitter handle */
  twitter: IdentityData;
  /** Additional fields */
  additional: Array<[IdentityData, IdentityData]>;
}

/**
 * Simplified identity info for setting identity
 */
export interface SimpleIdentityInfo {
  display?: string;
  legal?: string;
  web?: string;
  riot?: string;
  email?: string;
  pgpFingerprint?: string | null;
  image?: string;
  twitter?: string;
  additional?: Array<[string, string]>;
}

// ==========================================================================
// Registration & Judgement Types
// ==========================================================================

/**
 * Judgement types from registrars
 */
export enum Judgement {
  /** Registrar has no opinion */
  Unknown = "Unknown",
  /** Data could not be confirmed */
  OutOfDate = "OutOfDate",
  /** Data confirmed but not sure about identity */
  LowQuality = "LowQuality",
  /** Erroneous data (deposit slashed) */
  Erroneous = "Erroneous",
  /** Data confirmed (paid fee) */
  FeePaid = "FeePaid",
  /** Data confirmed to be owned by registrant */
  Reasonable = "Reasonable",
  /** Data confirmed to be legally owned */
  KnownGood = "KnownGood",
}

/**
 * Judgement request info
 */
export interface JudgementInfo {
  /** Registrar index */
  registrarIndex: number;
  /** Judgement type */
  judgement: Judgement;
  /** Fee paid (if applicable) */
  feePaid?: bigint;
}

/**
 * Full registration info for an identity
 */
export interface Registration {
  /** All judgements for this identity */
  judgements: JudgementInfo[];
  /** Total deposit held */
  deposit: bigint;
  /** Identity information */
  info: IdentityInfo;
}

/**
 * Registrar info
 */
export interface RegistrarInfo {
  /** Registrar account */
  account: string;
  /** Fee to request judgement */
  fee: bigint;
  /** Fields the registrar can judge */
  fields: string[];
}

// ==========================================================================
// Sub-Account Types
// ==========================================================================

/**
 * Sub-account data
 */
export interface SubAccountData {
  /** Data/name for sub-account */
  data: IdentityData;
}

/**
 * Sub-accounts info for an identity
 */
export interface SubsInfo {
  /** Total deposit for sub-accounts */
  deposit: bigint;
  /** List of sub-account addresses */
  subs: string[];
}

/**
 * Super account info
 */
export interface SuperInfo {
  /** Super (parent) account */
  superAccount: string;
  /** Sub-account data */
  data: IdentityData;
}

// ==========================================================================
// Extrinsic Parameters
// ==========================================================================

/**
 * Parameters for set_identity extrinsic
 */
export interface SetIdentityParams {
  /** Identity info to set */
  info: SimpleIdentityInfo;
}

/**
 * Parameters for set_subs extrinsic
 */
export interface SetSubsParams {
  /** Sub-accounts with their data */
  subs: Array<[string, IdentityData]>;
}

/**
 * Parameters for request_judgement extrinsic
 */
export interface RequestJudgementParams {
  /** Registrar index */
  registrarIndex: number;
  /** Maximum fee willing to pay */
  maxFee: bigint;
}

/**
 * Parameters for cancel_request extrinsic
 */
export interface CancelRequestParams {
  /** Registrar index */
  registrarIndex: number;
}

/**
 * Parameters for provide_judgement extrinsic
 */
export interface ProvideJudgementParams {
  /** Registrar index */
  registrarIndex: number;
  /** Target account */
  target: string;
  /** Judgement to provide */
  judgement: Judgement;
  /** Identity hash */
  identity: string;
}

/**
 * Parameters for add_sub extrinsic
 */
export interface AddSubParams {
  /** Sub-account address */
  sub: string;
  /** Data for sub-account */
  data: IdentityData;
}

/**
 * Parameters for rename_sub extrinsic
 */
export interface RenameSubParams {
  /** Sub-account address */
  sub: string;
  /** New data for sub-account */
  data: IdentityData;
}

/**
 * Parameters for remove_sub extrinsic
 */
export interface RemoveSubParams {
  /** Sub-account address to remove */
  sub: string;
}

/**
 * Parameters for set_fee extrinsic (registrar)
 */
export interface SetFeeParams {
  /** Registrar index */
  index: number;
  /** New fee */
  fee: bigint;
}

/**
 * Parameters for set_account_id extrinsic (registrar)
 */
export interface SetAccountIdParams {
  /** Registrar index */
  index: number;
  /** New account ID */
  new: string;
}

/**
 * Parameters for set_fields extrinsic (registrar)
 */
export interface SetFieldsParams {
  /** Registrar index */
  index: number;
  /** Fields to set */
  fields: string[];
}

/**
 * Parameters for add_registrar extrinsic (root)
 */
export interface AddRegistrarParams {
  /** Account to add as registrar */
  account: string;
}

/**
 * Parameters for kill_identity extrinsic (root)
 */
export interface KillIdentityParams {
  /** Target account */
  target: string;
}

// ==========================================================================
// Events
// ==========================================================================

/**
 * Event emitted when identity is set
 */
export interface IdentitySetEvent {
  who: string;
}

/**
 * Event emitted when identity is cleared
 */
export interface IdentityClearedEvent {
  who: string;
  deposit: bigint;
}

/**
 * Event emitted when identity is killed
 */
export interface IdentityKilledEvent {
  who: string;
  deposit: bigint;
}

/**
 * Event emitted when judgement is requested
 */
export interface JudgementRequestedEvent {
  who: string;
  registrarIndex: number;
}

/**
 * Event emitted when judgement request is cancelled
 */
export interface JudgementUnrequestedEvent {
  who: string;
  registrarIndex: number;
}

/**
 * Event emitted when judgement is given
 */
export interface JudgementGivenEvent {
  target: string;
  registrarIndex: number;
}

/**
 * Event emitted when registrar is added
 */
export interface RegistrarAddedEvent {
  registrarIndex: number;
}

/**
 * Event emitted when sub-identity is added
 */
export interface SubIdentityAddedEvent {
  sub: string;
  main: string;
  deposit: bigint;
}

/**
 * Event emitted when sub-identity is removed
 */
export interface SubIdentityRemovedEvent {
  sub: string;
  main: string;
  deposit: bigint;
}

/**
 * Event emitted when sub-identity is revoked
 */
export interface SubIdentityRevokedEvent {
  sub: string;
  main: string;
  deposit: bigint;
}

// ==========================================================================
// Errors
// ==========================================================================

/**
 * Identity pallet errors
 */
export enum IdentityError {
  /** Too many subs */
  TooManySubAccounts = "TooManySubAccounts",
  /** Account not found */
  NotFound = "NotFound",
  /** Not named (no identity) */
  NotNamed = "NotNamed",
  /** Empty index */
  EmptyIndex = "EmptyIndex",
  /** Fee changed since request */
  FeeChanged = "FeeChanged",
  /** No identity */
  NoIdentity = "NoIdentity",
  /** Sticky judgement */
  StickyJudgement = "StickyJudgement",
  /** Judgement given */
  JudgementGiven = "JudgementGiven",
  /** Invalid judgement */
  InvalidJudgement = "InvalidJudgement",
  /** Invalid index */
  InvalidIndex = "InvalidIndex",
  /** Invalid target */
  InvalidTarget = "InvalidTarget",
  /** Too many fields */
  TooManyFields = "TooManyFields",
  /** Too many registrars */
  TooManyRegistrars = "TooManyRegistrars",
  /** Already claimed */
  AlreadyClaimed = "AlreadyClaimed",
  /** Not sub */
  NotSub = "NotSub",
  /** Not owner */
  NotOwned = "NotOwned",
}

// ==========================================================================
// Query Results
// ==========================================================================

/**
 * Identity pallet constants
 */
export interface IdentityConstants {
  /** Basic deposit for identity */
  basicDeposit: bigint;
  /** Deposit per byte */
  byteDeposit: bigint;
  /** Sub-account deposit */
  subAccountDeposit: bigint;
  /** Maximum sub-accounts */
  maxSubAccounts: number;
  /** Maximum registrars */
  maxRegistrars: number;
  /** Maximum additional fields */
  maxAdditionalFields: number;
}

/**
 * Full identity information for display
 */
export interface FullIdentityInfo {
  /** Account address */
  account: string;
  /** Has identity */
  hasIdentity: boolean;
  /** Registration info */
  registration: Registration | null;
  /** Sub-accounts */
  subs: SubsInfo | null;
  /** Super account (if this is a sub) */
  super: SuperInfo | null;
  /** Display name (extracted) */
  displayName: string | null;
  /** Highest judgement */
  highestJudgement: Judgement | null;
  /** Is verified (has Reasonable or KnownGood judgement) */
  isVerified: boolean;
}
