/**
 * Identity Pallet Queries
 *
 * Query functions for Substrate's identity pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  Registration,
  RegistrarInfo,
  SubsInfo,
  SuperInfo,
  IdentityInfo,
  IdentityData,
  IdentityConstants,
  FullIdentityInfo,
  JudgementInfo,
  Judgement,
} from "./types.js";

/**
 * Identity Queries - read-only queries for identity pallet
 */
export class IdentityQueries {
  constructor(private api: ApiPromise) {}

  // ==========================================================================
  // Storage Queries
  // ==========================================================================

  /**
   * Get identity registration for an account
   * @param account - Account address
   * @returns Registration info or null if no identity
   */
  async identityOf(account: string): Promise<Registration | null> {
    const result = await this.api.query.identity.identityOf(account);
    if (!result || result.isEmpty) return null;

    const data = (result as any).unwrap ? (result as any).unwrap() : result;
    return this.parseRegistration(data);
  }

  /**
   * Get super (parent) account for a sub-account
   * @param account - Sub-account address
   * @returns Super account info or null
   */
  async superOf(account: string): Promise<SuperInfo | null> {
    const result = await this.api.query.identity.superOf(account);
    if (!result || result.isEmpty) return null;

    const data = (result as any).unwrap ? (result as any).unwrap() : result;
    const json = data.toJSON?.() || data;

    if (Array.isArray(json)) {
      return {
        superAccount: json[0],
        data: this.parseIdentityData(json[1]),
      };
    }

    return null;
  }

  /**
   * Get sub-accounts for an identity
   * @param account - Main account address
   * @returns Sub-accounts info
   */
  async subsOf(account: string): Promise<SubsInfo> {
    const result = await this.api.query.identity.subsOf(account);
    const json = result.toJSON?.() || result;

    if (Array.isArray(json)) {
      return {
        deposit: BigInt(json[0] || 0),
        subs: json[1] || [],
      };
    }

    return { deposit: 0n, subs: [] };
  }

  /**
   * Get all registrars
   * @returns Array of registrar info
   */
  async registrars(): Promise<Array<RegistrarInfo | null>> {
    const result = await this.api.query.identity.registrars();
    const json = result.toJSON?.() || result;

    if (!Array.isArray(json)) return [];

    return json.map((item: any, index: number) => {
      if (!item) return null;
      return {
        account: item.account,
        fee: BigInt(item.fee || 0),
        fields: item.fields || [],
      };
    });
  }

  // ==========================================================================
  // Derived Queries
  // ==========================================================================

  /**
   * Get full identity information for an account
   * @param account - Account address
   * @returns Complete identity info
   */
  async getFullIdentity(account: string): Promise<FullIdentityInfo> {
    const [registration, subs, superInfo] = await Promise.all([
      this.identityOf(account),
      this.subsOf(account),
      this.superOf(account),
    ]);

    const hasIdentity = registration !== null;
    const displayName = this.extractDisplayName(registration);
    const highestJudgement = this.getHighestJudgement(registration);
    const isVerified =
      highestJudgement === "Reasonable" || highestJudgement === "KnownGood";

    return {
      account,
      hasIdentity,
      registration,
      subs: subs.subs.length > 0 ? subs : null,
      super: superInfo,
      displayName,
      highestJudgement,
      isVerified,
    };
  }

  /**
   * Check if an account has an identity
   * @param account - Account address
   * @returns True if has identity
   */
  async hasIdentity(account: string): Promise<boolean> {
    const identity = await this.identityOf(account);
    return identity !== null;
  }

  /**
   * Check if an account is verified
   * @param account - Account address
   * @returns True if verified (has Reasonable or KnownGood judgement)
   */
  async isVerified(account: string): Promise<boolean> {
    const identity = await this.identityOf(account);
    if (!identity) return false;

    return identity.judgements.some(
      (j) => j.judgement === "Reasonable" || j.judgement === "KnownGood"
    );
  }

  /**
   * Get display name for an account
   * @param account - Account address
   * @returns Display name or null
   */
  async getDisplayName(account: string): Promise<string | null> {
    const identity = await this.identityOf(account);
    return this.extractDisplayName(identity);
  }

  /**
   * Get all sub-accounts for an identity
   * @param account - Main account address
   * @returns Array of sub-account addresses
   */
  async getSubAccounts(account: string): Promise<string[]> {
    const subs = await this.subsOf(account);
    return subs.subs;
  }

  /**
   * Get the main (super) account for a sub-account
   * @param account - Sub-account address
   * @returns Main account address or null
   */
  async getMainAccount(account: string): Promise<string | null> {
    const superInfo = await this.superOf(account);
    return superInfo?.superAccount || null;
  }

  /**
   * Get registrar by index
   * @param index - Registrar index
   * @returns Registrar info or null
   */
  async getRegistrar(index: number): Promise<RegistrarInfo | null> {
    const registrars = await this.registrars();
    if (index >= registrars.length) return null;
    return registrars[index];
  }

  /**
   * Get active registrars (non-null)
   * @returns Array of active registrars with their indices
   */
  async getActiveRegistrars(): Promise<
    Array<{ index: number; info: RegistrarInfo }>
  > {
    const registrars = await this.registrars();
    return registrars
      .map((info, index) => ({ index, info }))
      .filter(
        (r): r is { index: number; info: RegistrarInfo } => r.info !== null
      );
  }

  /**
   * Get identity constants
   * @returns Identity pallet constants
   */
  async getConstants(): Promise<IdentityConstants> {
    let basicDeposit = 10_000_000_000_000n; // 10 SEL default
    let byteDeposit = 100_000_000_000n; // 0.1 SEL default
    let subAccountDeposit = 2_000_000_000_000n; // 2 SEL default
    let maxSubAccounts = 100;
    let maxRegistrars = 20;
    let maxAdditionalFields = 100;

    try {
      const bd = (this.api.consts.identity as any)?.basicDeposit;
      if (bd) basicDeposit = BigInt(bd.toString());
    } catch {
      // Use default
    }

    try {
      const byd = (this.api.consts.identity as any)?.byteDeposit;
      if (byd) byteDeposit = BigInt(byd.toString());
    } catch {
      // Use default
    }

    try {
      const sad = (this.api.consts.identity as any)?.subAccountDeposit;
      if (sad) subAccountDeposit = BigInt(sad.toString());
    } catch {
      // Use default
    }

    try {
      const msa = (this.api.consts.identity as any)?.maxSubAccounts;
      if (msa) maxSubAccounts = parseInt(msa.toString(), 10);
    } catch {
      // Use default
    }

    try {
      const mr = (this.api.consts.identity as any)?.maxRegistrars;
      if (mr) maxRegistrars = parseInt(mr.toString(), 10);
    } catch {
      // Use default
    }

    try {
      const maf = (this.api.consts.identity as any)?.maxAdditionalFields;
      if (maf) maxAdditionalFields = parseInt(maf.toString(), 10);
    } catch {
      // Use default
    }

    return {
      basicDeposit,
      byteDeposit,
      subAccountDeposit,
      maxSubAccounts,
      maxRegistrars,
      maxAdditionalFields,
    };
  }

  /**
   * Estimate deposit needed for identity
   * @param info - Identity info to estimate
   * @returns Estimated deposit in native tokens
   */
  async estimateIdentityDeposit(info: {
    fieldsCount: number;
    additionalCount: number;
    totalBytes: number;
  }): Promise<bigint> {
    const constants = await this.getConstants();
    const bytesCost = BigInt(info.totalBytes) * constants.byteDeposit;
    return constants.basicDeposit + bytesCost;
  }

  // ==========================================================================
  // Subscription Methods
  // ==========================================================================

  /**
   * Subscribe to identity changes for an account
   * @param account - Account address
   * @param callback - Callback when identity changes
   * @returns Unsubscribe function
   */
  async subscribeToIdentity(
    account: string,
    callback: (registration: Registration | null) => void
  ): Promise<() => void> {
    const unsub = await this.api.query.identity.identityOf(
      account,
      (result: any) => {
        if (!result || result.isEmpty) {
          callback(null);
        } else {
          const data = result.unwrap ? result.unwrap() : result;
          callback(this.parseRegistration(data));
        }
      }
    );
    return unsub as unknown as () => void;
  }

  /**
   * Subscribe to registrars changes
   * @param callback - Callback when registrars change
   * @returns Unsubscribe function
   */
  async subscribeToRegistrars(
    callback: (registrars: Array<RegistrarInfo | null>) => void
  ): Promise<() => void> {
    const unsub = await this.api.query.identity.registrars((result: any) => {
      const json = result.toJSON?.() || result;
      if (!Array.isArray(json)) {
        callback([]);
        return;
      }

      const registrars = json.map((item: any) => {
        if (!item) return null;
        return {
          account: item.account,
          fee: BigInt(item.fee || 0),
          fields: item.fields || [],
        };
      });

      callback(registrars);
    });
    return unsub as unknown as () => void;
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Parse registration from raw result
   */
  private parseRegistration(result: any): Registration {
    const json = result.toJSON?.() || result;

    // Handle tuple format [registration, username] in newer runtime
    const regData = Array.isArray(json) ? json[0] : json;

    return {
      judgements: this.parseJudgements(regData?.judgements || []),
      deposit: BigInt(regData?.deposit || 0),
      info: this.parseIdentityInfo(regData?.info),
    };
  }

  /**
   * Parse judgements from raw result
   */
  private parseJudgements(judgements: any[]): JudgementInfo[] {
    if (!Array.isArray(judgements)) return [];

    return judgements.map((j) => {
      const [registrarIndex, judgement] = j;
      return {
        registrarIndex,
        judgement: this.parseJudgement(judgement),
        feePaid:
          typeof judgement === "object" && judgement?.FeePaid
            ? BigInt(judgement.FeePaid)
            : undefined,
      };
    });
  }

  /**
   * Parse single judgement
   */
  private parseJudgement(judgement: any): Judgement {
    if (typeof judgement === "string") {
      return judgement as Judgement;
    }

    if (typeof judgement === "object") {
      const key = Object.keys(judgement)[0];
      if (key) return key as Judgement;
    }

    return "Unknown" as Judgement;
  }

  /**
   * Parse identity info from raw result
   */
  private parseIdentityInfo(info: any): IdentityInfo {
    if (!info) {
      return {
        display: { type: "None" },
        legal: { type: "None" },
        web: { type: "None" },
        riot: { type: "None" },
        email: { type: "None" },
        pgpFingerprint: null,
        image: { type: "None" },
        twitter: { type: "None" },
        additional: [],
      };
    }

    return {
      display: this.parseIdentityData(info.display),
      legal: this.parseIdentityData(info.legal),
      web: this.parseIdentityData(info.web),
      riot: this.parseIdentityData(info.riot),
      email: this.parseIdentityData(info.email),
      pgpFingerprint: info.pgpFingerprint || null,
      image: this.parseIdentityData(info.image),
      twitter: this.parseIdentityData(info.twitter),
      additional: this.parseAdditionalFields(info.additional),
    };
  }

  /**
   * Parse identity data from raw result
   */
  private parseIdentityData(data: any): IdentityData {
    if (!data || data === "None") {
      return { type: "None" };
    }

    if (typeof data === "string") {
      return { type: "Raw", value: data };
    }

    if (typeof data === "object") {
      if (data.Raw !== undefined) {
        return { type: "Raw", value: this.decodeDataValue(data.Raw) };
      }
      if (data.raw !== undefined) {
        return { type: "Raw", value: this.decodeDataValue(data.raw) };
      }
      if (data.BlakeTwo256 !== undefined) {
        return { type: "BlakeTwo256", hash: data.BlakeTwo256 };
      }
      if (data.Sha256 !== undefined) {
        return { type: "Sha256", hash: data.Sha256 };
      }
      if (data.Keccak256 !== undefined) {
        return { type: "Keccak256", hash: data.Keccak256 };
      }
      if (data.ShaThree256 !== undefined) {
        return { type: "ShaThree256", hash: data.ShaThree256 };
      }
      if (data.None !== undefined || data.none !== undefined) {
        return { type: "None" };
      }
    }

    return { type: "None" };
  }

  /**
   * Parse additional fields from raw result
   */
  private parseAdditionalFields(
    additional: any
  ): Array<[IdentityData, IdentityData]> {
    if (!Array.isArray(additional)) return [];

    return additional.map((item) => {
      if (Array.isArray(item) && item.length >= 2) {
        return [
          this.parseIdentityData(item[0]),
          this.parseIdentityData(item[1]),
        ];
      }
      return [
        { type: "None" } as IdentityData,
        { type: "None" } as IdentityData,
      ];
    });
  }

  /**
   * Decode data value (hex or string)
   */
  private decodeDataValue(value: any): string {
    if (typeof value === "string") {
      if (value.startsWith("0x")) {
        return this.hexToString(value);
      }
      return value;
    }
    return String(value);
  }

  /**
   * Convert hex string to regular string
   */
  private hexToString(hex: string): string {
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    let str = "";
    for (let i = 0; i < cleanHex.length; i += 2) {
      const charCode = parseInt(cleanHex.substr(i, 2), 16);
      if (charCode === 0) break;
      str += String.fromCharCode(charCode);
    }
    return str;
  }

  /**
   * Extract display name from registration
   */
  private extractDisplayName(registration: Registration | null): string | null {
    if (!registration) return null;
    const display = registration.info.display;
    if (display.type === "Raw") {
      return display.value;
    }
    return null;
  }

  /**
   * Get highest judgement from registration
   */
  private getHighestJudgement(
    registration: Registration | null
  ): Judgement | null {
    if (!registration || registration.judgements.length === 0) return null;

    const priority: Record<Judgement, number> = {
      Unknown: 0,
      OutOfDate: 1,
      LowQuality: 2,
      FeePaid: 3,
      Erroneous: -1,
      Reasonable: 4,
      KnownGood: 5,
    };

    let highest: Judgement | null = null;
    let highestPriority = -2;

    for (const j of registration.judgements) {
      const p = priority[j.judgement] ?? 0;
      if (p > highestPriority) {
        highestPriority = p;
        highest = j.judgement;
      }
    }

    return highest;
  }
}
