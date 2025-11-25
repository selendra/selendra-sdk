/**
 * Proxy Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for Substrate's proxy pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type { Signer } from "@polkadot/api/types";
import type {
  ProxyDefinition,
  ProxyInfo,
  AnnouncementsInfo,
  ProxyConstants,
  ProxyType,
  ProxyCheckResult,
  ProxySummary,
} from "./types.js";
import { ProxyQueries } from "./queries.js";

/**
 * Transaction result type
 */
export interface ProxyTxResult {
  /** Whether the transaction was successful */
  success: boolean;
  /** Transaction hash */
  txHash?: string;
  /** Block hash where tx was included */
  blockHash?: string;
  /** Error message if failed */
  error?: string;
  /** Events emitted */
  events?: any[];
  /** Pure proxy address if created */
  pureProxyAddress?: string;
}

/**
 * Proxy Manager - handles proxy pallet transactions
 */
export class ProxyManager {
  private queries: ProxyQueries;

  constructor(private api: ApiPromise) {
    this.queries = new ProxyQueries(api);
  }

  // ==========================================================================
  // Core Proxy Extrinsics
  // ==========================================================================

  /**
   * Execute a call as a proxy
   * @param real - The real account to execute as
   * @param forceProxyType - Force a specific proxy type
   * @param call - The call to execute
   * @param signer - Account signer (must be proxy)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async proxy(
    real: string,
    forceProxyType: ProxyType | null,
    call: string | any,
    signer: Signer,
    signerAddress: string
  ): Promise<ProxyTxResult> {
    try {
      const proxyType = forceProxyType ? { [forceProxyType]: null } : null;

      const tx = this.api.tx.proxy.proxy(real, proxyType, call);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Add a proxy for the signing account
   * @param delegate - Account to add as proxy
   * @param proxyType - Type of proxy
   * @param delay - Number of blocks to delay (0 for no delay)
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async addProxy(
    delegate: string,
    proxyType: ProxyType,
    delay: number,
    signer: Signer,
    signerAddress: string
  ): Promise<ProxyTxResult> {
    try {
      const tx = this.api.tx.proxy.addProxy(
        delegate,
        { [proxyType]: null },
        delay
      );
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Remove a proxy from the signing account
   * @param delegate - Account to remove as proxy
   * @param proxyType - Type of proxy to remove
   * @param delay - The delay value of the proxy
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async removeProxy(
    delegate: string,
    proxyType: ProxyType,
    delay: number,
    signer: Signer,
    signerAddress: string
  ): Promise<ProxyTxResult> {
    try {
      const tx = this.api.tx.proxy.removeProxy(
        delegate,
        { [proxyType]: null },
        delay
      );
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Remove all proxies for the signing account
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async removeProxies(
    signer: Signer,
    signerAddress: string
  ): Promise<ProxyTxResult> {
    try {
      const tx = this.api.tx.proxy.removeProxies();
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create an anonymous (pure) proxy account
   * @param proxyType - Type of proxy for the pure account
   * @param delay - Delay for the proxy
   * @param index - Disambiguation index (usually 0)
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result with pure proxy address
   */
  async createPure(
    proxyType: ProxyType,
    delay: number,
    index: number,
    signer: Signer,
    signerAddress: string
  ): Promise<ProxyTxResult> {
    try {
      const tx = this.api.tx.proxy.createPure(
        { [proxyType]: null },
        delay,
        index
      );
      return await this.signAndSend(tx, signer, signerAddress, true);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Kill a pure proxy account (returns deposit)
   * @param spawner - Account that created the pure proxy
   * @param proxyType - Type of proxy
   * @param index - Disambiguation index
   * @param height - Block height when created
   * @param extIndex - Extrinsic index when created
   * @param signer - Account signer (must be the pure proxy)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async killPure(
    spawner: string,
    proxyType: ProxyType,
    index: number,
    height: number,
    extIndex: number,
    signer: Signer,
    signerAddress: string
  ): Promise<ProxyTxResult> {
    try {
      const tx = this.api.tx.proxy.killPure(
        spawner,
        { [proxyType]: null },
        index,
        height,
        extIndex
      );
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==========================================================================
  // Announcement Extrinsics
  // ==========================================================================

  /**
   * Announce a proxy call (for delayed proxies)
   * @param real - The real account
   * @param callHash - Hash of the call to announce
   * @param signer - Account signer (must be proxy)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async announce(
    real: string,
    callHash: string,
    signer: Signer,
    signerAddress: string
  ): Promise<ProxyTxResult> {
    try {
      const tx = this.api.tx.proxy.announce(real, callHash);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Remove an announcement
   * @param real - The real account
   * @param callHash - Hash of the call to remove
   * @param signer - Account signer (must be proxy)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async removeAnnouncement(
    real: string,
    callHash: string,
    signer: Signer,
    signerAddress: string
  ): Promise<ProxyTxResult> {
    try {
      const tx = this.api.tx.proxy.removeAnnouncement(real, callHash);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Reject an announcement (called by real account)
   * @param delegate - The delegate that made the announcement
   * @param callHash - Hash of the call to reject
   * @param signer - Account signer (must be real account)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async rejectAnnouncement(
    delegate: string,
    callHash: string,
    signer: Signer,
    signerAddress: string
  ): Promise<ProxyTxResult> {
    try {
      const tx = this.api.tx.proxy.rejectAnnouncement(delegate, callHash);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute an announced proxy call
   * @param delegate - The delegate that announced
   * @param real - The real account
   * @param forceProxyType - Force a specific proxy type
   * @param call - The call to execute
   * @param signer - Account signer (can be anyone)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async proxyAnnounced(
    delegate: string,
    real: string,
    forceProxyType: ProxyType | null,
    call: string | any,
    signer: Signer,
    signerAddress: string
  ): Promise<ProxyTxResult> {
    try {
      const proxyType = forceProxyType ? { [forceProxyType]: null } : null;

      const tx = this.api.tx.proxy.proxyAnnounced(
        delegate,
        real,
        proxyType,
        call
      );
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==========================================================================
  // High-Level Helper Methods
  // ==========================================================================

  /**
   * Add multiple proxies in a batch
   * @param proxies - Array of proxy configurations
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async addProxies(
    proxies: Array<{
      delegate: string;
      proxyType: ProxyType;
      delay: number;
    }>,
    signer: Signer,
    signerAddress: string
  ): Promise<ProxyTxResult> {
    try {
      const calls = proxies.map((p) =>
        this.api.tx.proxy.addProxy(p.delegate, { [p.proxyType]: null }, p.delay)
      );

      const tx = this.api.tx.utility.batchAll(calls);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute a call through a chain of proxies
   * @param realAccount - The final real account
   * @param proxies - Array of intermediate proxies (from deepest to shallowest)
   * @param call - The call to execute
   * @param signer - Account signer (must be first proxy)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async nestedProxy(
    realAccount: string,
    proxies: Array<{ account: string; proxyType: ProxyType }>,
    call: string | any,
    signer: Signer,
    signerAddress: string
  ): Promise<ProxyTxResult> {
    try {
      // Build nested proxy calls from innermost to outermost
      let wrappedCall = call;

      // Reverse to go from deepest to shallowest
      const reversed = [...proxies].reverse();

      for (let i = 0; i < reversed.length; i++) {
        const proxy = reversed[i];
        const nextAccount = i === 0 ? realAccount : reversed[i - 1].account;

        wrappedCall = this.api.tx.proxy.proxy(
          nextAccount,
          { [proxy.proxyType]: null },
          wrappedCall
        );
      }

      return await this.signAndSend(wrappedCall, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==========================================================================
  // Query Passthrough (for convenience)
  // ==========================================================================

  /**
   * Get proxies for an account
   */
  async getProxies(account: string): Promise<ProxyInfo> {
    return this.queries.proxies(account);
  }

  /**
   * Get announcements for an account
   */
  async getAnnouncements(account: string): Promise<AnnouncementsInfo> {
    return this.queries.announcements(account);
  }

  /**
   * Check if account is a proxy
   */
  async isProxy(
    delegator: string,
    delegate: string,
    proxyType?: ProxyType
  ): Promise<ProxyCheckResult> {
    return this.queries.isProxy(delegator, delegate, proxyType);
  }

  /**
   * Get accounts this delegate can proxy for
   */
  async getProxiedAccounts(
    delegate: string
  ): Promise<Array<{ account: string; proxyType: ProxyType; delay: number }>> {
    return this.queries.getProxiedAccounts(delegate);
  }

  /**
   * Get proxy summary
   */
  async getProxySummary(account: string): Promise<ProxySummary> {
    return this.queries.getProxySummary(account);
  }

  /**
   * Get constants
   */
  getConstants(): ProxyConstants {
    return this.queries.getConstants();
  }

  /**
   * Calculate proxy deposit
   */
  calculateProxyDeposit(numProxies: number): bigint {
    return this.queries.calculateProxyDeposit(numProxies);
  }

  /**
   * Check if proxy type can execute
   */
  canProxyTypeExecute(hasType: ProxyType, needsType: ProxyType): boolean {
    return this.queries.canProxyTypeExecute(hasType, needsType);
  }

  // ==========================================================================
  // Call Building Helpers
  // ==========================================================================

  /**
   * Encode a call for use with proxy
   * @param section - Pallet name
   * @param method - Method name
   * @param args - Call arguments
   * @returns Encoded call data
   */
  encodeCall(section: string, method: string, args: any[]): string {
    const tx = (this.api.tx as any)[section][method](...args);
    return tx.method.toHex();
  }

  /**
   * Get call hash
   * @param call - Call data (encoded or extrinsic)
   * @returns Blake2 hash of the call
   */
  getCallHash(call: string | any): string {
    const data = typeof call === "string" ? call : call.method.toHex();
    return this.api.registry.hash(data).toHex();
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Sign and send a transaction
   */
  private async signAndSend(
    tx: any,
    signer: Signer,
    signerAddress: string,
    extractPureProxy: boolean = false
  ): Promise<ProxyTxResult> {
    return new Promise((resolve) => {
      tx.signAndSend(
        signerAddress,
        { signer },
        ({ status, events, dispatchError }: any) => {
          if (status.isInBlock || status.isFinalized) {
            if (dispatchError) {
              let errorMessage = "Transaction failed";

              if (dispatchError.isModule) {
                const decoded = this.api.registry.findMetaError(
                  dispatchError.asModule
                );
                errorMessage = `${decoded.section}.${
                  decoded.name
                }: ${decoded.docs.join(" ")}`;
              } else {
                errorMessage = dispatchError.toString();
              }

              resolve({
                success: false,
                txHash: tx.hash.toHex(),
                blockHash:
                  status.asInBlock?.toHex() || status.asFinalized?.toHex(),
                error: errorMessage,
                events: events?.map((e: any) => e.toHuman()),
              });
            } else {
              let pureProxyAddress: string | undefined;

              // Extract pure proxy address if requested
              if (extractPureProxy) {
                const pureEvent = events?.find(
                  (e: any) =>
                    e.event.section === "proxy" &&
                    e.event.method === "PureCreated"
                );

                if (pureEvent) {
                  pureProxyAddress = pureEvent.event.data.pure?.toString();
                }
              }

              resolve({
                success: true,
                txHash: tx.hash.toHex(),
                blockHash:
                  status.asInBlock?.toHex() || status.asFinalized?.toHex(),
                events: events?.map((e: any) => e.toHuman()),
                pureProxyAddress,
              });
            }
          }
        }
      ).catch((error: Error) => {
        resolve({
          success: false,
          error: error.message,
        });
      });
    });
  }
}
