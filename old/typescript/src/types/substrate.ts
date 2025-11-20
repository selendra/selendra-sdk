/**
 * Substrate-specific types for the Selendra SDK
 */

import type { Address, Balance, BlockHash, BlockNumber, Hash, Nonce, TransactionHash, SubstrateAddress } from './common';

/**
 * Substrate address format
 */
export type SubstrateAddressType = 'ss58' | 'hex' | 'publicKey';

/**
 * Substrate account information
 */
export interface SubstrateAccount {
  /** Account address */
  address: Address;
  /** Account public key */
  publicKey: string;
  /** Account nonce */
  nonce: Nonce;
  /** Account balance information */
  balance: AccountBalance;
  /** Account metadata */
  metadata?: AccountMetadata;
}

/**
 * Account balance information
 */
export interface AccountBalance {
  /** Free balance */
  free: Balance;
  /** Reserved balance */
  reserved: Balance;
  /** Misc frozen balance */
  miscFrozen: Balance;
  /** Fee frozen balance */
  feeFrozen: Balance;
  /** Total balance (free + reserved) */
  total: Balance;
  /** Available balance (free - frozen) */
  available: Balance;
}

/**
 * Account metadata
 */
export interface AccountMetadata {
  /** Account name */
  name?: string;
  /** Additional account information */
  info?: Record<string, unknown>;
}

/**
 * Substrate block interface
 */
export interface SubstrateBlock {
  /** Block hash */
  hash: BlockHash;
  /** Parent block hash */
  parentHash: BlockHash;
  /** Block number */
  number: BlockNumber;
  /** Block state root */
  stateRoot: Hash;
  /** Block extrinsics root */
  extrinsicsRoot: Hash;
  /** Block timestamp */
  timestamp: number;
  /** Block author/validator */
  author?: Address;
  /** Block extrinsics */
  extrinsics: SubstrateExtrinsic[];
  /** Block logs */
  logs: SubstrateLog[];
}

/**
 * Substrate extrinsic interface
 */
export interface SubstrateExtrinsic {
  /** Extrinsic hash */
  hash: TransactionHash;
  /** Extrinsic method */
  method: {
    /** Pallet name */
    pallet: string;
    /** Method name */
    method: string;
    /** Method parameters */
    args: unknown[];
  };
  /** Signer address */
  signer?: Address;
  /** Signature information */
  signature?: {
    /** Signature payload */
    signature: string;
    /** Signing data */
    signingPayload: string;
  };
  /** Extrinsic era information */
  era?: {
    /** Mortality period */
    mortalEra?: string;
    /** Immortal flag */
    immortalEra?: string;
  };
  /** Nonce */
  nonce?: Nonce;
  /** Tip included */
  tip?: Balance;
  /** Extrinsic success status */
  success: boolean;
  /** Extrinsic events */
  events: SubstrateEvent[];
  /** Block hash where extrinsic was included */
  blockHash: BlockHash;
  /** Block number where extrinsic was included */
  blockNumber: BlockNumber;
  /** Extrinsic index in block */
  index: number;
}

/**
 * Substrate event interface
 */
export interface SubstrateEvent {
  /** Event identifier */
  id: string;
  /** Event method information */
  method: {
    /** Pallet name */
    pallet: string;
    /** Method name */
    method: string;
    /** Event data */
    data: unknown[];
  };
  /** Event documentation */
  documentation: string[];
  /** Phase in which event was emitted */
  phase: {
    /** Phase type */
    isApplyExtrinsic: boolean;
    /** Phase type */
    isFinalization: boolean;
    /** Phase type */
    isInitialization: boolean;
    /** Extrinsic index if applicable */
    asApplyExtrinsic?: number;
  };
  /** Event topics */
  topics: Hash[];
  /** Block hash where event was emitted */
  blockHash: BlockHash;
  /** Block number where event was emitted */
  blockNumber: BlockNumber;
  /** Event index in block */
  index: number;
}

/**
 * Substrate log entry
 */
export interface SubstrateLog {
  /** Log type */
  type: string;
  /** Log data */
  data: unknown;
}

/**
 * Substrate storage query options
 */
export interface SubstrateStorageQuery {
  /** Pallet name */
  pallet: string;
  /** Storage item name */
  storage: string;
  /** Storage key parameters */
  params?: unknown[];
  /** Block hash to query at */
  at?: BlockHash;
}

/**
 * Substrate runtime version information
 */
export interface RuntimeVersion {
  /** Runtime spec name */
  specName: string;
  /** Runtime spec version */
  specVersion: number;
  /** Transaction version */
  transactionVersion: number;
  /** Runtime implementation version */
  implVersion: number;
  /** Runtime authoring version */
  authoringVersion: number;
  /** Runtime API versions */
  apis: RuntimeApiVersion[];
}

/**
 * Runtime API version
 */
export interface RuntimeApiVersion {
  /** API identifier */
  apiId: string;
  /** API version */
  version: number;
}

/**
 * Chain properties
 */
export interface ChainProperties {
  /** SS58 format */
  ss58Format?: number;
  /** Token decimals */
  tokenDecimals?: number[];
  /** Token symbols */
  tokenSymbol?: string[];
}

/**
 * Substrate call interface
 */
export interface SubstrateCall {
  /** Pallet name */
  pallet: string;
  /** Method name */
  method: string;
  /** Call parameters */
  args: unknown[];
}

/**
 * Substrate transaction options
 */
export interface SubstrateTransactionOptions {
  /** Sender address */
  signer?: Address;
  /** Transaction nonce */
  nonce?: Nonce;
  /** Tip amount */
  tip?: Balance;
  /** Mortality period */
  era?: {
    /** Era period in blocks */
    period?: number;
    /** Era mortality (mortal/immortal) */
    mortal?: boolean;
  };
  /** Block hash to build transaction against */
  at?: BlockHash;
}

/**
 * Substrate transaction result
 */
export interface SubstrateTransactionResult {
  /** Transaction hash */
  hash: TransactionHash;
  /** Block hash where transaction was included */
  blockHash?: BlockHash;
  /** Block number where transaction was included */
  blockNumber?: BlockNumber;
  /** Transaction success status */
  success: boolean;
  /** Transaction events */
  events: SubstrateEvent[];
  /** Transaction fee information */
  fee?: Balance;
  /** Error information if transaction failed */
  error?: string;
}

/**
 * Substrate wallet interface
 */
export interface SubstrateWallet {
  /** Wallet address */
  address: Address;
  /** Get wallet public key */
  getPublicKey(): Promise<string>;
  /** Get wallet nonce */
  getNonce(): Promise<Nonce>;
  /** Sign payload */
  signPayload(payload: SignerPayloadJSON): Promise<SignerResult>;
  /** Sign raw data */
  signRaw(raw: SignerRawPayload): Promise<SignerResult>;
}

/**
 * Signer payload JSON interface
 */
export interface SignerPayloadJSON {
  /** Spec version */
  specVersion: number;
  /** Transaction version */
  transactionVersion: number;
  /** Runtime version */
  runtimeVersion: number;
  /** Genesis hash */
  genesisHash: Hash;
  /** Block hash */
  blockHash: BlockHash;
  /** Era information */
  era: string;
  /** Signer nonce */
  nonce: string;
  /** Tip amount */
  tip: string;
  /** Call data */
  method: string;
  /** Signed extensions */
  signedExtensions: string[];
  /** Additional signed fields */
  signedFields: Record<string, unknown>;
}

/**
 * Signer result interface
 */
export interface SignerResult {
  /** Signature */
  signature: string;
  /** Signing payload */
  signingPayload: string;
  /** Signature type */
  signatureType: 'ed25519' | 'sr25519' | 'ecdsa';
}

/**
 * Signer raw payload interface
 */
export interface SignerRawPayload {
  /** Data to sign */
  data: string;
  /** Address type */
  addressType?: 'ed25519' | 'sr25519' | 'ecdsa';
}

/**
 * Substrate pallet interface
 */
export interface SubstratePallet {
  /** Pallet name */
  name: string;
  /** Pallet version */
  version?: number;
  /** Pallet calls */
  calls: Record<string, SubstrateCall>;
  /** Pallet storage */
  storage: Record<string, SubstrateStorage>;
  /** Pallet events */
  events: Record<string, SubstrateEvent>;
  /** Pallet constants */
  constants: Record<string, unknown>;
}

/**
 * Substrate storage interface
 */
export interface SubstrateStorage {
  /** Storage key prefix */
  prefix: string;
  /** Storage name */
  name: string;
  /** Storage type */
  type: {
    /** Plain storage type */
    Plain: string;
    /** Map storage type */
    Map: {
      /** Key type */
      key: string;
      /** Value type */
      value: string;
      /** Whether map is linked */
      isLinked: boolean;
    };
    /** Double map storage type */
    DoubleMap: {
      /** First key type */
      key1: string;
      /** Second key type */
      key2: string;
      /** Value type */
      value: string;
    };
  };
  /** Storage modifier */
  modifier: 'Optional' | 'Default' | 'Required';
  /** Storage documentation */
  documentation: string[];
  /** Storage default value */
  fallback: string;
}

/**
 * System pallet interface
 */
export interface SystemPallet {
  /** Get chain information */
  chain(): Promise<string>;
  /** Get runtime version */
  runtimeVersion(): Promise<RuntimeVersion>;
  /** Get properties */
  properties(): Promise<ChainProperties>;
  /** Get health information */
  health(): Promise<{
    /** Number of peers */
    peers: number;
    /** Sync status */
    isSyncing: boolean;
    /** Should have peers */
    shouldHavePeers: boolean;
  }>;
  /** Get network state */
  networkState(): Promise<NetworkState>;
}

/**
 * Network state information
 */
export interface NetworkState {
  /** Peer information */
  peerId: string;
  /** Network addresses */
  listenedAddresses: string[];
  /** External addresses */
  externalAddresses: string[];
  /** Connected peers */
  connectedPeers: ConnectedPeer[];
}

/**
 * Connected peer information
 */
export interface ConnectedPeer {
  /** Peer ID */
  peerId: string;
  /** Endpoint information */
  endpoint: string;
  /** Last ping time */
  pingTime?: number;
  /** Roles */
  roles: string;
  /** Protocol version */
  protocolVersion: number;
  /** Best hash */
  bestHash: Hash;
  /** Best number */
  bestNumber: BlockNumber;
}

/**
 * Staking information
 */
export interface StakingInfo {
  /** Total stake */
  totalStake: Balance;
  /** Validator stake */
  validatorStake: Balance;
  /** Nominator stake */
  nominatorStake: Balance;
  /** Minimum stake */
  minStake: Balance;
  /** Maximum nominators per validator */
  maxNominators: number;
  /** Bonding duration in eras */
  bondingDuration: number;
  /** Era length in blocks */
  eraLength: number;
  /** Session length in blocks */
  sessionLength: number;
}

/**
 * Substrate transaction interface for SDK
 */
export interface SubstrateTransaction {
  /** Transaction hash */
  hash: string;
  /** Sender address */
  from: SubstrateAddress;
  /** Recipient address */
  to: SubstrateAddress;
  /** Transfer amount */
  amount: string;
  /** Transaction status */
  status: 'pending' | 'success' | 'failed';
  /** Block number where transaction was included */
  blockNumber?: number;
  /** Block hash where transaction was included */
  blockHash?: string;
  /** Transaction nonce */
  nonce: string;
}