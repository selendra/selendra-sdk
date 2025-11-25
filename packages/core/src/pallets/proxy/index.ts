/**
 * Proxy Pallet Module
 *
 * Provides proxy account functionality for Selendra
 */

// Export types
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
} from "./types.js";

export { PROXY_TYPE_HIERARCHY } from "./types.js";

// Export queries
export { ProxyQueries } from "./queries.js";

// Export client/manager
export { ProxyManager } from "./client.js";
export type { ProxyTxResult } from "./client.js";
