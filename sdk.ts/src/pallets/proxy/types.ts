/**
 * Proxy Pallet Types
 *
 * Type definitions for Substrate's proxy pallet
 */

/**
 * Proxy types supported by Selendra runtime
 * Based on runtime configuration
 */
export type ProxyType =
  | "Any"
  | "NonTransfer"
  | "Governance"
  | "Staking"
  | "IdentityJudgement"
  | "Nomination";

/**
 * Proxy definition stored on-chain
 */
export interface ProxyDefinition {
  /** Delegate account */
  delegate: string;
  /** Type of proxy */
  proxyType: ProxyType;
  /** Block delay before proxy can act */
  delay: number;
}

/**
 * Full proxy info for an account
 */
export interface ProxyInfo {
  /** List of proxies */
  proxies: ProxyDefinition[];
  /** Deposit held for proxies */
  deposit: bigint;
}

/**
 * Announcement stored on-chain
 */
export interface Announcement {
  /** Real account that will execute */
  real: string;
  /** Call hash being announced */
  callHash: string;
  /** Block height of announcement */
  height: number;
}

/**
 * Full announcements info for an account
 */
export interface AnnouncementsInfo {
  /** List of announcements */
  announcements: Announcement[];
  /** Deposit held for announcements */
  deposit: bigint;
}

/**
 * Pure (anonymous) proxy info
 */
export interface PureProxyInfo {
  /** The pure proxy address */
  address: string;
  /** Account that controls the pure proxy */
  spawner: string;
  /** Proxy type */
  proxyType: ProxyType;
  /** Block number when created */
  height: number;
  /** Disambiguation index */
  index: number;
}

/**
 * Proxy pallet constants
 */
export interface ProxyConstants {
  /** Base deposit for creating proxy */
  proxyDepositBase: bigint;
  /** Factor per proxy for deposit */
  proxyDepositFactor: bigint;
  /** Maximum proxies per account */
  maxProxies: number;
  /** Maximum pending announcements */
  maxPending: number;
  /** Base deposit for announcements */
  announcementDepositBase: bigint;
  /** Factor per announcement for deposit */
  announcementDepositFactor: bigint;
}

/**
 * Result of proxy check
 */
export interface ProxyCheckResult {
  /** Whether the proxy relationship exists */
  isProxy: boolean;
  /** The proxy definition if found */
  definition?: ProxyDefinition;
  /** Whether the proxy can execute the given call type */
  canExecute: boolean;
}

/**
 * Proxy filter for call execution
 */
export interface ProxyFilter {
  /** Type of proxy required */
  proxyType: ProxyType;
  /** Optional specific call check */
  callType?: string;
}

/**
 * Proxy delegation request
 */
export interface ProxyDelegation {
  /** Delegate account */
  delegate: string;
  /** Type of proxy */
  proxyType: ProxyType;
  /** Optional delay */
  delay?: number;
}

/**
 * Account proxy summary
 */
export interface ProxySummary {
  /** Account address */
  account: string;
  /** Total proxies for this account */
  totalProxies: number;
  /** Proxies by type */
  byType: Record<ProxyType, string[]>;
  /** Total deposit locked */
  totalDeposit: bigint;
  /** Whether account is a pure proxy */
  isPure: boolean;
}

/**
 * Proxy call execution options
 */
export interface ProxyCallOptions {
  /** Force the call type (override inferred type) */
  forceProxyType?: ProxyType;
  /** Whether to announce before executing */
  announce?: boolean;
}

/**
 * Proxy types hierarchy (for checking permissions)
 */
export const PROXY_TYPE_HIERARCHY: Record<ProxyType, ProxyType[]> = {
  Any: [
    "Any",
    "NonTransfer",
    "Governance",
    "Staking",
    "IdentityJudgement",
    "Nomination",
  ],
  NonTransfer: [
    "NonTransfer",
    "Governance",
    "Staking",
    "IdentityJudgement",
    "Nomination",
  ],
  Governance: ["Governance"],
  Staking: ["Staking", "Nomination"],
  IdentityJudgement: ["IdentityJudgement"],
  Nomination: ["Nomination"],
};
