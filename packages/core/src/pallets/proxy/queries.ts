/**
 * Proxy Pallet Queries
 *
 * Query functions for Substrate's proxy pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  ProxyDefinition,
  ProxyInfo,
  Announcement,
  AnnouncementsInfo,
  ProxyConstants,
  ProxyType,
  ProxyCheckResult,
  ProxySummary,
  PROXY_TYPE_HIERARCHY,
} from "./types.js";

/**
 * Proxy pallet queries
 */
export class ProxyQueries {
  constructor(private api: ApiPromise) {}

  // ==========================================================================
  // Core Storage Queries
  // ==========================================================================

  /**
   * Get proxies for an account
   * @param account - Account address
   * @returns Proxy info with proxies and deposit
   */
  async proxies(account: string): Promise<ProxyInfo> {
    try {
      const result = await this.api.query.proxy.proxies(account);
      const [proxies, deposit] = result as any;

      return {
        proxies: proxies.map((p: any) => ({
          delegate: p.delegate.toString(),
          proxyType: this.parseProxyType(p.proxyType),
          delay: p.delay.toNumber(),
        })),
        deposit: BigInt(deposit.toString()),
      };
    } catch (error) {
      console.error("Error querying proxies:", error);
      return { proxies: [], deposit: BigInt(0) };
    }
  }

  /**
   * Get announcements for an account
   * @param account - Account address (delegate)
   * @returns Announcements info
   */
  async announcements(account: string): Promise<AnnouncementsInfo> {
    try {
      const result = await this.api.query.proxy.announcements(account);
      const [announcements, deposit] = result as any;

      return {
        announcements: announcements.map((a: any) => ({
          real: a.real.toString(),
          callHash: a.callHash.toHex(),
          height: a.height.toNumber(),
        })),
        deposit: BigInt(deposit.toString()),
      };
    } catch (error) {
      console.error("Error querying announcements:", error);
      return { announcements: [], deposit: BigInt(0) };
    }
  }

  // ==========================================================================
  // Constants
  // ==========================================================================

  /**
   * Get proxy pallet constants
   */
  getConstants(): ProxyConstants {
    const proxyDepositBase = this.api.consts.proxy.proxyDepositBase;
    const proxyDepositFactor = this.api.consts.proxy.proxyDepositFactor;
    const maxProxies = this.api.consts.proxy.maxProxies;
    const maxPending = this.api.consts.proxy.maxPending;
    const announcementDepositBase =
      this.api.consts.proxy.announcementDepositBase;
    const announcementDepositFactor =
      this.api.consts.proxy.announcementDepositFactor;

    return {
      proxyDepositBase: BigInt(proxyDepositBase?.toString() ?? "0"),
      proxyDepositFactor: BigInt(proxyDepositFactor?.toString() ?? "0"),
      maxProxies: (maxProxies as any)?.toNumber() ?? 32,
      maxPending: (maxPending as any)?.toNumber() ?? 32,
      announcementDepositBase: BigInt(
        announcementDepositBase?.toString() ?? "0"
      ),
      announcementDepositFactor: BigInt(
        announcementDepositFactor?.toString() ?? "0"
      ),
    };
  }

  // ==========================================================================
  // High-Level Queries
  // ==========================================================================

  /**
   * Check if an account is a proxy for another account
   * @param delegator - The account that delegated (real account)
   * @param delegate - The account that received proxy rights
   * @param proxyType - Optional specific proxy type to check
   * @returns Proxy check result
   */
  async isProxy(
    delegator: string,
    delegate: string,
    proxyType?: ProxyType
  ): Promise<ProxyCheckResult> {
    const info = await this.proxies(delegator);

    const foundProxy = info.proxies.find((p) => {
      const delegateMatch = p.delegate === delegate;
      if (!proxyType) return delegateMatch;

      // Check if proxy type matches or is more permissive
      return delegateMatch && this.canProxyTypeExecute(p.proxyType, proxyType);
    });

    return {
      isProxy: !!foundProxy,
      definition: foundProxy,
      canExecute: !!foundProxy,
    };
  }

  /**
   * Get all accounts this account is a proxy for
   * @param delegate - Delegate account address
   * @returns List of accounts this delegate can proxy for
   */
  async getProxiedAccounts(
    delegate: string
  ): Promise<Array<{ account: string; proxyType: ProxyType; delay: number }>> {
    try {
      const entries = await this.api.query.proxy.proxies.entries();
      const result: Array<{
        account: string;
        proxyType: ProxyType;
        delay: number;
      }> = [];

      for (const [key, value] of entries) {
        const account = key.args[0].toString();
        const [proxies] = value as any;

        for (const proxy of proxies) {
          if (proxy.delegate.toString() === delegate) {
            result.push({
              account,
              proxyType: this.parseProxyType(proxy.proxyType),
              delay: proxy.delay.toNumber(),
            });
          }
        }
      }

      return result;
    } catch (error) {
      console.error("Error getting proxied accounts:", error);
      return [];
    }
  }

  /**
   * Get proxy summary for an account
   * @param account - Account address
   * @returns Proxy summary
   */
  async getProxySummary(account: string): Promise<ProxySummary> {
    const info = await this.proxies(account);

    const byType: Record<ProxyType, string[]> = {
      Any: [],
      NonTransfer: [],
      Governance: [],
      Staking: [],
      IdentityJudgement: [],
      Nomination: [],
    };

    for (const proxy of info.proxies) {
      byType[proxy.proxyType].push(proxy.delegate);
    }

    return {
      account,
      totalProxies: info.proxies.length,
      byType,
      totalDeposit: info.deposit,
      isPure: false, // Would need additional logic to determine
    };
  }

  /**
   * Get all proxies of a specific type
   * @param account - Account address
   * @param proxyType - Proxy type to filter by
   * @returns List of delegates with this proxy type
   */
  async getProxiesByType(
    account: string,
    proxyType: ProxyType
  ): Promise<ProxyDefinition[]> {
    const info = await this.proxies(account);
    return info.proxies.filter((p) => p.proxyType === proxyType);
  }

  /**
   * Check if there's a pending announcement
   * @param delegate - Delegate account
   * @param real - Real account
   * @param callHash - Call hash to check
   * @returns Whether the announcement exists
   */
  async hasAnnouncement(
    delegate: string,
    real: string,
    callHash: string
  ): Promise<boolean> {
    const info = await this.announcements(delegate);
    return info.announcements.some(
      (a) => a.real === real && a.callHash === callHash
    );
  }

  /**
   * Get all announcements from a delegate to a specific real account
   * @param delegate - Delegate account
   * @param real - Real account (optional filter)
   * @returns List of announcements
   */
  async getAnnouncementsFor(
    delegate: string,
    real?: string
  ): Promise<Announcement[]> {
    const info = await this.announcements(delegate);

    if (!real) {
      return info.announcements;
    }

    return info.announcements.filter((a) => a.real === real);
  }

  /**
   * Calculate deposit for creating proxies
   * @param numProxies - Number of proxies to create
   * @returns Required deposit
   */
  calculateProxyDeposit(numProxies: number): bigint {
    const constants = this.getConstants();
    return (
      constants.proxyDepositBase +
      constants.proxyDepositFactor * BigInt(numProxies)
    );
  }

  /**
   * Calculate deposit for announcements
   * @param numAnnouncements - Number of announcements
   * @returns Required deposit
   */
  calculateAnnouncementDeposit(numAnnouncements: number): bigint {
    const constants = this.getConstants();
    return (
      constants.announcementDepositBase +
      constants.announcementDepositFactor * BigInt(numAnnouncements)
    );
  }

  /**
   * Get all accounts with proxies (expensive query)
   * @param limit - Maximum number of accounts to return
   * @returns List of accounts with proxy info
   */
  async getAllProxyAccounts(
    limit?: number
  ): Promise<Array<{ account: string; proxyCount: number; deposit: bigint }>> {
    try {
      const entries = await this.api.query.proxy.proxies.entries();
      const result: Array<{
        account: string;
        proxyCount: number;
        deposit: bigint;
      }> = [];

      for (const [key, value] of entries) {
        if (limit && result.length >= limit) break;

        const account = key.args[0].toString();
        const [proxies, deposit] = value as any;

        if (proxies.length > 0) {
          result.push({
            account,
            proxyCount: proxies.length,
            deposit: BigInt(deposit.toString()),
          });
        }
      }

      return result;
    } catch (error) {
      console.error("Error getting all proxy accounts:", error);
      return [];
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Parse proxy type from codec
   */
  private parseProxyType(proxyType: any): ProxyType {
    const typeStr = proxyType.toString();

    // Handle various format possibilities
    if (typeStr === "Any" || proxyType.isAny) return "Any";
    if (typeStr === "NonTransfer" || proxyType.isNonTransfer)
      return "NonTransfer";
    if (typeStr === "Governance" || proxyType.isGovernance) return "Governance";
    if (typeStr === "Staking" || proxyType.isStaking) return "Staking";
    if (typeStr === "IdentityJudgement" || proxyType.isIdentityJudgement)
      return "IdentityJudgement";
    if (typeStr === "Nomination" || proxyType.isNomination) return "Nomination";

    return "Any"; // Default
  }

  /**
   * Check if a proxy type can execute calls requiring another type
   * @param hasType - The proxy type the account has
   * @param needsType - The proxy type needed for the call
   * @returns Whether the proxy can execute
   */
  canProxyTypeExecute(hasType: ProxyType, needsType: ProxyType): boolean {
    // "Any" can do anything
    if (hasType === "Any") return true;

    // Same type always works
    if (hasType === needsType) return true;

    // NonTransfer includes governance, staking, identity, nomination
    if (hasType === "NonTransfer") {
      return [
        "Governance",
        "Staking",
        "IdentityJudgement",
        "Nomination",
      ].includes(needsType);
    }

    // Staking includes nomination
    if (hasType === "Staking" && needsType === "Nomination") return true;

    return false;
  }

  /**
   * Get proxy type string for extrinsic
   */
  getProxyTypeValue(proxyType: ProxyType): any {
    return { [proxyType]: null };
  }

  /**
   * Validate proxy configuration
   */
  validateProxyConfig(
    delegates: Array<{ delegate: string; proxyType: ProxyType; delay?: number }>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const constants = this.getConstants();

    if (delegates.length > constants.maxProxies) {
      errors.push(`Maximum ${constants.maxProxies} proxies allowed`);
    }

    // Check for duplicates
    const seen = new Set<string>();
    for (const d of delegates) {
      const key = `${d.delegate}-${d.proxyType}`;
      if (seen.has(key)) {
        errors.push(`Duplicate proxy: ${d.delegate} with type ${d.proxyType}`);
      }
      seen.add(key);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
