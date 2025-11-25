/**
 * Nomination Pools Pallet Storage Queries
 *
 * Query functions for Nomination Pools pallet storage
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  PoolState,
  BondedPoolInfo,
  RewardPoolInfo,
  PoolMemberInfo,
  SubPoolsInfo,
  SubPool,
  PoolRoles,
  UnbondingEra,
  PoolInfoResult,
  MemberInfoResult,
  PoolsListResult,
  PoolConstants,
  PoolConfig,
} from "./types.js";

/**
 * Nomination Pools storage queries
 */
export class NominationPoolsQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get bonded pool info
   * @param poolId - Pool ID
   * @returns Bonded pool info or null
   */
  async getBondedPool(poolId: number): Promise<BondedPoolInfo | null> {
    const result = await this.api.query.nominationPools.bondedPools(poolId);
    const pool = result as any;

    if (!pool || pool.isNone) {
      return null;
    }

    const unwrapped = pool.unwrap ? pool.unwrap() : pool;

    return {
      id: poolId,
      points: BigInt(unwrapped.points?.toString() || "0"),
      state: this.parsePoolState(unwrapped.state),
      memberCounter: parseInt(unwrapped.memberCounter?.toString() || "0", 10),
      roles: this.parsePoolRoles(unwrapped.roles),
    };
  }

  /**
   * Get reward pool info
   * @param poolId - Pool ID
   * @returns Reward pool info or null
   */
  async getRewardPool(poolId: number): Promise<RewardPoolInfo | null> {
    const result = await this.api.query.nominationPools.rewardPools(poolId);
    const pool = result as any;

    if (!pool || pool.isNone) {
      return null;
    }

    const unwrapped = pool.unwrap ? pool.unwrap() : pool;

    return {
      poolId,
      lastRecordedRewardCounter: BigInt(
        unwrapped.lastRecordedRewardCounter?.toString() || "0"
      ),
      lastRecordedTotalPayouts: BigInt(
        unwrapped.lastRecordedTotalPayouts?.toString() || "0"
      ),
      totalRewardsClaimed: BigInt(
        unwrapped.totalRewardsClaimed?.toString() || "0"
      ),
      totalCommissionClaimed: BigInt(
        unwrapped.totalCommissionClaimed?.toString() || "0"
      ),
    };
  }

  /**
   * Get pool member info
   * @param account - Member account
   * @returns Pool member info or null
   */
  async getPoolMember(account: string): Promise<PoolMemberInfo | null> {
    const result = await this.api.query.nominationPools.poolMembers(account);
    const member = result as any;

    if (!member || member.isNone) {
      return null;
    }

    const unwrapped = member.unwrap ? member.unwrap() : member;

    return {
      account,
      poolId: parseInt(unwrapped.poolId?.toString() || "0", 10),
      points: BigInt(unwrapped.points?.toString() || "0"),
      lastRecordedRewardCounter: BigInt(
        unwrapped.lastRecordedRewardCounter?.toString() || "0"
      ),
      unbondingEras: this.parseUnbondingEras(unwrapped.unbondingEras),
    };
  }

  /**
   * Get sub pools storage for a pool
   * @param poolId - Pool ID
   * @returns Sub pools info or null
   */
  async getSubPools(poolId: number): Promise<SubPoolsInfo | null> {
    const result = await this.api.query.nominationPools.subPoolsStorage(poolId);
    const subPools = result as any;

    if (!subPools || subPools.isNone) {
      return null;
    }

    const unwrapped = subPools.unwrap ? subPools.unwrap() : subPools;

    const withEra = new Map<number, SubPool>();
    if (unwrapped.withEra) {
      for (const [era, pool] of unwrapped.withEra.entries()) {
        withEra.set(parseInt(era.toString(), 10), {
          points: BigInt(pool.points?.toString() || "0"),
          balance: BigInt(pool.balance?.toString() || "0"),
        });
      }
    }

    return {
      poolId,
      noEra: {
        points: BigInt(unwrapped.noEra?.points?.toString() || "0"),
        balance: BigInt(unwrapped.noEra?.balance?.toString() || "0"),
      },
      withEra,
    };
  }

  /**
   * Get pool metadata
   * @param poolId - Pool ID
   * @returns Metadata string or empty
   */
  async getPoolMetadata(poolId: number): Promise<string> {
    const result = await this.api.query.nominationPools.metadata(poolId);
    return result.toString();
  }

  /**
   * Get last pool ID
   * @returns Last pool ID
   */
  async getLastPoolId(): Promise<number> {
    const result = await this.api.query.nominationPools.lastPoolId();
    return parseInt(result.toString(), 10);
  }

  /**
   * Get minimum join bond
   * @returns Minimum join bond
   */
  async getMinJoinBond(): Promise<bigint> {
    const result = await this.api.query.nominationPools.minJoinBond();
    return BigInt(result.toString());
  }

  /**
   * Get minimum create bond
   * @returns Minimum create bond
   */
  async getMinCreateBond(): Promise<bigint> {
    const result = await this.api.query.nominationPools.minCreateBond();
    return BigInt(result.toString());
  }

  /**
   * Get maximum pools
   * @returns Maximum pools or null if unlimited
   */
  async getMaxPools(): Promise<number | null> {
    const result = await this.api.query.nominationPools.maxPools();
    const value = result as any;

    if (!value || value.isNone) {
      return null;
    }

    return parseInt((value.unwrap ? value.unwrap() : value).toString(), 10);
  }

  /**
   * Get maximum pool members
   * @returns Maximum members or null if unlimited
   */
  async getMaxPoolMembers(): Promise<number | null> {
    const result = await this.api.query.nominationPools.maxPoolMembers();
    const value = result as any;

    if (!value || value.isNone) {
      return null;
    }

    return parseInt((value.unwrap ? value.unwrap() : value).toString(), 10);
  }

  /**
   * Get maximum pool members per pool
   * @returns Maximum members per pool or null if unlimited
   */
  async getMaxPoolMembersPerPool(): Promise<number | null> {
    const result = await this.api.query.nominationPools.maxPoolMembersPerPool();
    const value = result as any;

    if (!value || value.isNone) {
      return null;
    }

    return parseInt((value.unwrap ? value.unwrap() : value).toString(), 10);
  }

  /**
   * Get counter for pool members
   * @returns Total pool members count
   */
  async getCounterForPoolMembers(): Promise<number> {
    const result = await this.api.query.nominationPools.counterForPoolMembers();
    return parseInt(result.toString(), 10);
  }

  /**
   * Get counter for bonded pools
   * @returns Total bonded pools count
   */
  async getCounterForBondedPools(): Promise<number> {
    const result = await this.api.query.nominationPools.counterForBondedPools();
    return parseInt(result.toString(), 10);
  }

  // ==========================================================================
  // High-Level Helper Methods
  // ==========================================================================

  /**
   * Get comprehensive pool info
   * @param poolId - Pool ID
   * @returns Pool info result
   */
  async getPoolInfo(poolId: number): Promise<PoolInfoResult> {
    const [bonded, reward, metadata] = await Promise.all([
      this.getBondedPool(poolId),
      this.getRewardPool(poolId),
      this.getPoolMetadata(poolId),
    ]);

    return {
      bonded,
      reward,
      metadata: metadata || undefined,
    };
  }

  /**
   * Get comprehensive member info
   * @param account - Member account
   * @returns Member info result
   */
  async getMemberInfo(account: string): Promise<MemberInfoResult> {
    const member = await this.getPoolMember(account);

    if (!member) {
      return {
        member: null,
        pendingRewards: 0n,
        claimable: 0n,
      };
    }

    // Calculate pending rewards
    const pendingRewards = await this.calculatePendingRewards(account);

    return {
      member,
      pendingRewards,
      claimable: pendingRewards,
    };
  }

  /**
   * Calculate pending rewards for a member
   * @param account - Member account
   * @returns Pending rewards amount
   */
  async calculatePendingRewards(account: string): Promise<bigint> {
    try {
      // Try to use the runtime API if available
      if ((this.api.call as any).nominationPoolsApi?.pendingRewards) {
        const rewards = await (
          this.api.call as any
        ).nominationPoolsApi.pendingRewards(account);
        return BigInt(rewards.toString());
      }

      // Manual calculation fallback
      const member = await this.getPoolMember(account);
      if (!member) return 0n;

      const rewardPool = await this.getRewardPool(member.poolId);
      if (!rewardPool) return 0n;

      // Calculate based on points and reward counter difference
      const counterDiff =
        rewardPool.lastRecordedRewardCounter - member.lastRecordedRewardCounter;

      if (counterDiff <= 0n) return 0n;

      // Pending = points * (currentCounter - lastRecordedCounter)
      return (member.points * counterDiff) / 1_000_000_000_000_000_000n; // Scale factor
    } catch {
      return 0n;
    }
  }

  /**
   * Get all bonded pools
   * @returns List of all bonded pools
   */
  async getAllPools(): Promise<PoolsListResult> {
    const lastPoolId = await this.getLastPoolId();
    const pools: BondedPoolInfo[] = [];

    for (let i = 1; i <= lastPoolId; i++) {
      const pool = await this.getBondedPool(i);
      if (pool) {
        pools.push(pool);
      }
    }

    return {
      pools,
      count: pools.length,
    };
  }

  /**
   * Get open pools (accepting new members)
   * @returns List of open pools
   */
  async getOpenPools(): Promise<PoolsListResult> {
    const allPools = await this.getAllPools();
    const openPools = allPools.pools.filter((pool) => pool.state === "Open");

    return {
      pools: openPools,
      count: openPools.length,
    };
  }

  /**
   * Get pool constants
   * @returns Pool constants
   */
  async getConstants(): Promise<PoolConstants> {
    const [
      minJoinBond,
      minCreateBond,
      maxPools,
      maxPoolMembers,
      maxPoolMembersPerPool,
    ] = await Promise.all([
      this.getMinJoinBond(),
      this.getMinCreateBond(),
      this.getMaxPools(),
      this.getMaxPoolMembers(),
      this.getMaxPoolMembersPerPool(),
    ]);

    // Get pallet ID from constants
    let palletId = "py/nopls"; // Default
    try {
      const pid = this.api.consts.nominationPools?.palletId;
      if (pid) {
        palletId = pid.toString();
      }
    } catch {
      // Use default
    }

    return {
      minJoinBond,
      minCreateBond,
      maxPools,
      maxPoolMembersPerPool,
      maxPoolMembers,
      palletId,
    };
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Parse pool state from chain format
   */
  private parsePoolState(state: any): PoolState {
    const stateStr = state?.toString?.() || state;

    if (stateStr === "Open" || state?.isOpen) {
      return PoolState.Open;
    }
    if (stateStr === "Blocked" || state?.isBlocked) {
      return PoolState.Blocked;
    }
    if (stateStr === "Destroying" || state?.isDestroying) {
      return PoolState.Destroying;
    }

    return PoolState.Open;
  }

  /**
   * Parse pool roles from chain format
   */
  private parsePoolRoles(roles: any): PoolRoles {
    return {
      root: roles?.root?.toString() || undefined,
      nominator: roles?.nominator?.toString() || undefined,
      bouncer:
        roles?.bouncer?.toString() ||
        roles?.stateToggler?.toString() ||
        undefined,
      depositor: roles?.depositor?.toString() || "",
    };
  }

  /**
   * Parse unbonding eras from chain format
   */
  private parseUnbondingEras(unbondingEras: any): UnbondingEra[] {
    if (!unbondingEras) return [];

    const eras: UnbondingEra[] = [];

    try {
      for (const [era, points] of unbondingEras.entries()) {
        eras.push({
          era: parseInt(era.toString(), 10),
          points: BigInt(points.toString()),
        });
      }
    } catch {
      // Handle different formats
      if (Array.isArray(unbondingEras)) {
        for (const item of unbondingEras) {
          if (item.era !== undefined && item.points !== undefined) {
            eras.push({
              era: parseInt(item.era.toString(), 10),
              points: BigInt(item.points.toString()),
            });
          }
        }
      }
    }

    return eras;
  }
}
