/**
 * Nomination Pools Pallet Types
 *
 * Type definitions for the Nomination Pools pallet
 * Enables users to pool their stake together
 */

// =============================================================================
// Pool State Types
// =============================================================================

/**
 * Pool state
 */
export enum PoolState {
  /** Pool is active and accepting joins */
  Open = "Open",
  /** Pool is blocked from new joins */
  Blocked = "Blocked",
  /** Pool is being destroyed */
  Destroying = "Destroying",
}

/**
 * Bonded pool information
 */
export interface BondedPoolInfo {
  /** Pool ID */
  id: number;
  /** Total points in the pool */
  points: bigint;
  /** Pool state */
  state: PoolState;
  /** Number of members */
  memberCounter: number;
  /** Pool roles */
  roles: PoolRoles;
}

/**
 * Pool roles
 */
export interface PoolRoles {
  /** Account that can manage pool state */
  root?: string;
  /** Account that can nominate validators */
  nominator?: string;
  /** Account that can toggle pool open/blocked */
  bouncer?: string;
  /** Account that deposited the initial stake */
  depositor: string;
}

/**
 * Reward pool information
 */
export interface RewardPoolInfo {
  /** Pool ID */
  poolId: number;
  /** Last recorded reward counter */
  lastRecordedRewardCounter: bigint;
  /** Last recorded total payouts */
  lastRecordedTotalPayouts: bigint;
  /** Total rewards claimed */
  totalRewardsClaimed: bigint;
  /** Total commissions claimed */
  totalCommissionClaimed: bigint;
}

/**
 * Pool member information
 */
export interface PoolMemberInfo {
  /** Member account */
  account: string;
  /** Pool ID */
  poolId: number;
  /** Member's points in the pool */
  points: bigint;
  /** Member's share of rewards counter */
  lastRecordedRewardCounter: bigint;
  /** Unbonding eras */
  unbondingEras: UnbondingEra[];
}

/**
 * Unbonding era info
 */
export interface UnbondingEra {
  /** Era index */
  era: number;
  /** Points being unbonded */
  points: bigint;
}

/**
 * Sub pools storage
 */
export interface SubPoolsInfo {
  /** Pool ID */
  poolId: number;
  /** No-era pool (fully unbonded) */
  noEra: SubPool;
  /** Era-based unbonding pools */
  withEra: Map<number, SubPool>;
}

/**
 * Sub pool
 */
export interface SubPool {
  /** Points in sub pool */
  points: bigint;
  /** Balance in sub pool */
  balance: bigint;
}

// =============================================================================
// Pool Configuration Types
// =============================================================================

/**
 * Pool configuration
 */
export interface PoolConfig {
  /** Minimum join bond */
  minJoinBond: bigint;
  /** Minimum create bond */
  minCreateBond: bigint;
  /** Maximum number of pools */
  maxPools?: number;
  /** Maximum members per pool */
  maxPoolMembers?: number;
  /** Maximum members across all pools */
  maxPoolMembersPerPool?: number;
  /** Global max commission */
  globalMaxCommission?: number;
}

/**
 * Pool commission configuration
 */
export interface PoolCommission {
  /** Current commission percentage (0-100) */
  current?: number;
  /** Maximum commission */
  max?: number;
  /** Commission change rate */
  changeRate?: CommissionChangeRate;
  /** Throttle from (block number) */
  throttleFrom?: number;
}

/**
 * Commission change rate
 */
export interface CommissionChangeRate {
  /** Maximum increase per change */
  maxIncrease: number;
  /** Minimum delay between changes */
  minDelay: number;
}

// =============================================================================
// Extrinsic Parameters
// =============================================================================

/**
 * Parameters for creating a pool
 */
export interface CreatePoolParams {
  /** Initial stake amount */
  amount: bigint;
  /** Root account (can manage pool) */
  root: string;
  /** Nominator account (can nominate) */
  nominator: string;
  /** Bouncer account (can toggle state) */
  bouncer: string;
}

/**
 * Parameters for joining a pool
 */
export interface JoinPoolParams {
  /** Amount to stake */
  amount: bigint;
  /** Pool ID to join */
  poolId: number;
}

/**
 * Parameters for bonding extra
 */
export interface BondExtraParams {
  /** Extra amount to bond */
  extra: BondExtraSource;
}

/**
 * Source for extra bond
 */
export type BondExtraSource =
  | { type: "FreeBalance"; amount: bigint }
  | { type: "Rewards" };

/**
 * Parameters for unbonding
 */
export interface UnbondParams {
  /** Member account */
  memberAccount: string;
  /** Points to unbond */
  unbondingPoints: bigint;
}

/**
 * Parameters for withdrawing unbonded
 */
export interface WithdrawUnbondedParams {
  /** Member account */
  memberAccount: string;
  /** Number of slashing spans */
  numSlashingSpans: number;
}

/**
 * Parameters for pool withdraw unbonded
 */
export interface PoolWithdrawUnbondedParams {
  /** Pool ID */
  poolId: number;
  /** Number of slashing spans */
  numSlashingSpans: number;
}

/**
 * Parameters for setting pool metadata
 */
export interface SetMetadataParams {
  /** Pool ID */
  poolId: number;
  /** Metadata bytes */
  metadata: string;
}

/**
 * Parameters for nominating
 */
export interface NominatePoolParams {
  /** Pool ID */
  poolId: number;
  /** Validators to nominate */
  validators: string[];
}

/**
 * Parameters for setting pool state
 */
export interface SetStateParams {
  /** Pool ID */
  poolId: number;
  /** New state */
  state: PoolState;
}

/**
 * Parameters for chilling a pool
 */
export interface ChillPoolParams {
  /** Pool ID */
  poolId: number;
}

/**
 * Parameters for updating roles
 */
export interface UpdateRolesParams {
  /** Pool ID */
  poolId: number;
  /** New root (optional) */
  newRoot?: string | "Remove" | "Noop";
  /** New nominator (optional) */
  newNominator?: string | "Remove" | "Noop";
  /** New bouncer (optional) */
  newBouncer?: string | "Remove" | "Noop";
}

/**
 * Parameters for setting commission
 */
export interface SetCommissionParams {
  /** Pool ID */
  poolId: number;
  /** New commission (optional, null to remove) */
  newCommission?: { commission: number; payee: string } | null;
}

/**
 * Parameters for claiming commission
 */
export interface ClaimCommissionParams {
  /** Pool ID */
  poolId: number;
}

// =============================================================================
// Event Types
// =============================================================================

/**
 * Pool created event
 */
export interface PoolCreatedEvent {
  /** Depositor account */
  depositor: string;
  /** Pool ID */
  poolId: number;
}

/**
 * Member joined event
 */
export interface MemberJoinedEvent {
  /** Member account */
  member: string;
  /** Pool ID */
  poolId: number;
  /** Amount bonded */
  bonded: bigint;
  /** Points received */
  joined: boolean;
}

/**
 * Payout event
 */
export interface PayoutEvent {
  /** Member account */
  member: string;
  /** Pool ID */
  poolId: number;
  /** Payout amount */
  payout: bigint;
}

/**
 * Unbonded event
 */
export interface UnbondedEvent {
  /** Member account */
  member: string;
  /** Pool ID */
  poolId: number;
  /** Points unbonded */
  points: bigint;
  /** Balance unbonded */
  balance: bigint;
  /** Era when unbonding completes */
  era: number;
}

/**
 * Withdrawn event
 */
export interface WithdrawnEvent {
  /** Member account */
  member: string;
  /** Pool ID */
  poolId: number;
  /** Points withdrawn */
  points: bigint;
  /** Balance withdrawn */
  balance: bigint;
}

// =============================================================================
// Query Result Types
// =============================================================================

/**
 * Pool info result
 */
export interface PoolInfoResult {
  /** Pool bonded info */
  bonded: BondedPoolInfo | null;
  /** Pool reward info */
  reward: RewardPoolInfo | null;
  /** Pool metadata */
  metadata?: string;
  /** Pool nominations */
  nominations?: string[];
}

/**
 * Member info result
 */
export interface MemberInfoResult {
  /** Member info if found */
  member: PoolMemberInfo | null;
  /** Pending rewards */
  pendingRewards: bigint;
  /** Claimable balance */
  claimable: bigint;
}

/**
 * Pools list result
 */
export interface PoolsListResult {
  /** List of pools */
  pools: BondedPoolInfo[];
  /** Total count */
  count: number;
}

/**
 * Pool constants
 */
export interface PoolConstants {
  /** Minimum join bond */
  minJoinBond: bigint;
  /** Minimum create bond */
  minCreateBond: bigint;
  /** Maximum pools */
  maxPools: number | null;
  /** Maximum members per pool */
  maxPoolMembersPerPool: number | null;
  /** Maximum members total */
  maxPoolMembers: number | null;
  /** Pallet ID */
  palletId: string;
}
