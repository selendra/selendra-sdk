/**
 * Identity Pallet Client (Manager)
 *
 * Transaction/extrinsic functions for Substrate's identity pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type { Signer } from "@polkadot/api/types";
import type {
  SimpleIdentityInfo,
  IdentityData,
  Judgement,
  Registration,
  RegistrarInfo,
  SubsInfo,
  SuperInfo,
  FullIdentityInfo,
  IdentityConstants,
} from "./types.js";
import { IdentityQueries } from "./queries.js";

/**
 * Transaction result type
 */
export interface IdentityTxResult {
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
}

/**
 * Identity Manager - handles identity pallet transactions
 */
export class IdentityManager {
  private queries: IdentityQueries;

  constructor(private api: ApiPromise) {
    this.queries = new IdentityQueries(api);
  }

  // ==========================================================================
  // Identity Management Extrinsics
  // ==========================================================================

  /**
   * Set on-chain identity
   * @param info - Identity info to set
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async setIdentity(
    info: SimpleIdentityInfo,
    signer: Signer,
    signerAddress: string
  ): Promise<IdentityTxResult> {
    try {
      const identityInfo = this.buildIdentityInfo(info);
      const tx = this.api.tx.identity.setIdentity(identityInfo);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Clear identity and get deposit back
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async clearIdentity(
    signer: Signer,
    signerAddress: string
  ): Promise<IdentityTxResult> {
    try {
      const tx = this.api.tx.identity.clearIdentity();
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==========================================================================
  // Sub-Account Management
  // ==========================================================================

  /**
   * Set sub-accounts
   * @param subs - Array of [subAccount, data] tuples
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async setSubs(
    subs: Array<[string, string | IdentityData]>,
    signer: Signer,
    signerAddress: string
  ): Promise<IdentityTxResult> {
    try {
      const formattedSubs = subs.map(([account, data]) => [
        account,
        this.formatIdentityData(data),
      ]);
      const tx = this.api.tx.identity.setSubs(formattedSubs);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Add a sub-account
   * @param sub - Sub-account address
   * @param data - Data/name for sub-account
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async addSub(
    sub: string,
    data: string | IdentityData,
    signer: Signer,
    signerAddress: string
  ): Promise<IdentityTxResult> {
    try {
      const tx = this.api.tx.identity.addSub(
        sub,
        this.formatIdentityData(data)
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
   * Rename a sub-account
   * @param sub - Sub-account address
   * @param data - New data/name for sub-account
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async renameSub(
    sub: string,
    data: string | IdentityData,
    signer: Signer,
    signerAddress: string
  ): Promise<IdentityTxResult> {
    try {
      const tx = this.api.tx.identity.renameSub(
        sub,
        this.formatIdentityData(data)
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
   * Remove a sub-account
   * @param sub - Sub-account address to remove
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async removeSub(
    sub: string,
    signer: Signer,
    signerAddress: string
  ): Promise<IdentityTxResult> {
    try {
      const tx = this.api.tx.identity.removeSub(sub);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Quit being a sub-account (called by the sub)
   * @param signer - Account signer (the sub-account)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async quitSub(
    signer: Signer,
    signerAddress: string
  ): Promise<IdentityTxResult> {
    try {
      const tx = this.api.tx.identity.quitSub();
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==========================================================================
  // Judgement Operations
  // ==========================================================================

  /**
   * Request judgement from a registrar
   * @param registrarIndex - Index of the registrar
   * @param maxFee - Maximum fee willing to pay
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async requestJudgement(
    registrarIndex: number,
    maxFee: bigint,
    signer: Signer,
    signerAddress: string
  ): Promise<IdentityTxResult> {
    try {
      const tx = this.api.tx.identity.requestJudgement(
        registrarIndex,
        maxFee.toString()
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
   * Cancel a judgement request
   * @param registrarIndex - Index of the registrar
   * @param signer - Account signer
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async cancelRequest(
    registrarIndex: number,
    signer: Signer,
    signerAddress: string
  ): Promise<IdentityTxResult> {
    try {
      const tx = this.api.tx.identity.cancelRequest(registrarIndex);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==========================================================================
  // Registrar Operations (requires registrar privileges)
  // ==========================================================================

  /**
   * Provide judgement as a registrar
   * @param registrarIndex - Index of the registrar (your index)
   * @param target - Target account to judge
   * @param judgement - Judgement to provide
   * @param identity - Identity hash
   * @param signer - Account signer (must be registrar)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async provideJudgement(
    registrarIndex: number,
    target: string,
    judgement: Judgement,
    identity: string,
    signer: Signer,
    signerAddress: string
  ): Promise<IdentityTxResult> {
    try {
      const judgementValue = this.formatJudgement(judgement);
      const tx = this.api.tx.identity.provideJudgement(
        registrarIndex,
        target,
        judgementValue,
        identity
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
   * Set registrar fee
   * @param index - Registrar index
   * @param fee - New fee
   * @param signer - Account signer (must be registrar)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async setFee(
    index: number,
    fee: bigint,
    signer: Signer,
    signerAddress: string
  ): Promise<IdentityTxResult> {
    try {
      const tx = this.api.tx.identity.setFee(index, fee.toString());
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Set registrar account
   * @param index - Registrar index
   * @param newAccount - New account
   * @param signer - Account signer (must be registrar)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async setAccountId(
    index: number,
    newAccount: string,
    signer: Signer,
    signerAddress: string
  ): Promise<IdentityTxResult> {
    try {
      const tx = this.api.tx.identity.setAccountId(index, newAccount);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Set registrar fields
   * @param index - Registrar index
   * @param fields - Fields to set
   * @param signer - Account signer (must be registrar)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async setFields(
    index: number,
    fields: number,
    signer: Signer,
    signerAddress: string
  ): Promise<IdentityTxResult> {
    try {
      const tx = this.api.tx.identity.setFields(index, fields);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==========================================================================
  // Admin Operations (requires root/governance)
  // ==========================================================================

  /**
   * Add a registrar (requires ForceOrigin)
   * @param account - Account to add as registrar
   * @param signer - Account signer (must be root/governance)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async addRegistrar(
    account: string,
    signer: Signer,
    signerAddress: string
  ): Promise<IdentityTxResult> {
    try {
      const tx = this.api.tx.identity.addRegistrar(account);
      return await this.signAndSend(tx, signer, signerAddress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Kill an identity (requires ForceOrigin)
   * @param target - Target account to kill identity
   * @param signer - Account signer (must be root/governance)
   * @param signerAddress - Signer's address
   * @returns Transaction result
   */
  async killIdentity(
    target: string,
    signer: Signer,
    signerAddress: string
  ): Promise<IdentityTxResult> {
    try {
      const tx = this.api.tx.identity.killIdentity(target);
      return await this.signAndSend(tx, signer, signerAddress);
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
   * Get identity for an account
   */
  async getIdentity(account: string): Promise<Registration | null> {
    return this.queries.identityOf(account);
  }

  /**
   * Get full identity info
   */
  async getFullIdentity(account: string): Promise<FullIdentityInfo> {
    return this.queries.getFullIdentity(account);
  }

  /**
   * Check if account has identity
   */
  async hasIdentity(account: string): Promise<boolean> {
    return this.queries.hasIdentity(account);
  }

  /**
   * Check if account is verified
   */
  async isVerified(account: string): Promise<boolean> {
    return this.queries.isVerified(account);
  }

  /**
   * Get display name
   */
  async getDisplayName(account: string): Promise<string | null> {
    return this.queries.getDisplayName(account);
  }

  /**
   * Get sub-accounts
   */
  async getSubAccounts(account: string): Promise<string[]> {
    return this.queries.getSubAccounts(account);
  }

  /**
   * Get subs info
   */
  async getSubsInfo(account: string): Promise<SubsInfo> {
    return this.queries.subsOf(account);
  }

  /**
   * Get super account
   */
  async getSuperAccount(account: string): Promise<SuperInfo | null> {
    return this.queries.superOf(account);
  }

  /**
   * Get all registrars
   */
  async getRegistrars(): Promise<Array<RegistrarInfo | null>> {
    return this.queries.registrars();
  }

  /**
   * Get active registrars
   */
  async getActiveRegistrars(): Promise<
    Array<{ index: number; info: RegistrarInfo }>
  > {
    return this.queries.getActiveRegistrars();
  }

  /**
   * Get constants
   */
  async getConstants(): Promise<IdentityConstants> {
    return this.queries.getConstants();
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Build identity info object for extrinsic
   */
  private buildIdentityInfo(info: SimpleIdentityInfo): any {
    return {
      display: this.formatIdentityData(info.display),
      legal: this.formatIdentityData(info.legal),
      web: this.formatIdentityData(info.web),
      riot: this.formatIdentityData(info.riot),
      email: this.formatIdentityData(info.email),
      pgpFingerprint: info.pgpFingerprint || null,
      image: this.formatIdentityData(info.image),
      twitter: this.formatIdentityData(info.twitter),
      additional: (info.additional || []).map(([key, value]) => [
        this.formatIdentityData(key),
        this.formatIdentityData(value),
      ]),
    };
  }

  /**
   * Format identity data for extrinsic
   */
  private formatIdentityData(
    data: string | IdentityData | undefined
  ): { Raw: string } | { None: null } {
    if (!data) {
      return { None: null };
    }

    if (typeof data === "string") {
      return { Raw: data };
    }

    if (data.type === "None") {
      return { None: null };
    }

    if (data.type === "Raw") {
      return { Raw: data.value };
    }

    // For hash types, just return as-is
    return { None: null };
  }

  /**
   * Format judgement for extrinsic
   */
  private formatJudgement(judgement: Judgement): any {
    switch (judgement) {
      case "Unknown":
        return { Unknown: null };
      case "OutOfDate":
        return { OutOfDate: null };
      case "LowQuality":
        return { LowQuality: null };
      case "Erroneous":
        return { Erroneous: null };
      case "Reasonable":
        return { Reasonable: null };
      case "KnownGood":
        return { KnownGood: null };
      default:
        return { Unknown: null };
    }
  }

  /**
   * Sign and send a transaction
   */
  private async signAndSend(
    tx: any,
    signer: Signer,
    signerAddress: string
  ): Promise<IdentityTxResult> {
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
              resolve({
                success: true,
                txHash: tx.hash.toHex(),
                blockHash:
                  status.asInBlock?.toHex() || status.asFinalized?.toHex(),
                events: events?.map((e: any) => e.toHuman()),
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
