/**
 * Contracts Pallet Storage Queries
 *
 * Query functions for ink! smart contracts pallet
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  ContractInfo,
  CodeInfo,
  OwnerInfo,
  ContractsConstants,
  ContractGasLimit,
  DryRunResult,
  StorageDepositLimit,
  Determinism,
} from "./types.js";

/**
 * Contracts storage queries
 */
export class ContractsQueries {
  constructor(private api: ApiPromise) {}

  // ==========================================================================
  // Storage Queries
  // ==========================================================================

  /**
   * Get contract info for an address
   * @param address - Contract address
   * @returns Contract info or null if not a contract
   */
  async contractInfoOf(address: string): Promise<ContractInfo | null> {
    const result = await this.api.query.contracts.contractInfoOf(address);

    if (!result || (result as any).isNone) {
      return null;
    }

    const info = (result as any).unwrap ? (result as any).unwrap() : result;

    return {
      trieId: info.trieId?.toHex() || "",
      codeHash: info.codeHash?.toHex() || "",
      storageBytes: parseInt(info.storageBytes?.toString() || "0", 10),
      storageItems: parseInt(info.storageItems?.toString() || "0", 10),
      storageDeposit: BigInt(info.storageBaseDeposit?.toString() || "0"),
      storageDepositMax: BigInt(info.storageByteDeposit?.toString() || "0"),
    };
  }

  /**
   * Get code storage info for a code hash
   * @param codeHash - Code hash
   * @returns Code info or null if not found
   */
  async codeInfoOf(codeHash: string): Promise<CodeInfo | null> {
    const result = await this.api.query.contracts.codeInfoOf(codeHash);

    if (!result || (result as any).isNone) {
      return null;
    }

    const info = (result as any).unwrap ? (result as any).unwrap() : result;

    return {
      owner: info.owner?.toString() || "",
      deposit: BigInt(info.deposit?.toString() || "0"),
      refcount: parseInt(info.refcount?.toString() || "0", 10),
      determinism: info.determinism?.isEnforced
        ? ("Enforced" as Determinism)
        : ("Relaxed" as Determinism),
      codeLen: parseInt(info.codeLen?.toString() || "0", 10),
    };
  }

  /**
   * Get pristine code (original WASM) for a code hash
   * @param codeHash - Code hash
   * @returns Code bytes or null if not found
   */
  async pristineCode(codeHash: string): Promise<Uint8Array | null> {
    const result = await this.api.query.contracts.pristineCode(codeHash);

    if (!result || (result as any).isNone) {
      return null;
    }

    const code = (result as any).unwrap ? (result as any).unwrap() : result;
    return code.toU8a();
  }

  /**
   * Get owner info for a code hash (legacy)
   * @param codeHash - Code hash
   * @returns Owner info or null
   */
  async ownerInfoOf(codeHash: string): Promise<OwnerInfo | null> {
    // Try codeInfoOf first (newer API)
    const codeInfo = await this.codeInfoOf(codeHash);
    if (codeInfo) {
      return {
        owner: codeInfo.owner,
        deposit: codeInfo.deposit,
        refcount: codeInfo.refcount,
      };
    }

    // Fall back to ownerInfoOf if available
    try {
      const result = await (this.api.query.contracts as any).ownerInfoOf?.(
        codeHash
      );
      if (!result || (result as any).isNone) {
        return null;
      }

      const info = (result as any).unwrap ? (result as any).unwrap() : result;

      return {
        owner: info.owner?.toString() || "",
        deposit: BigInt(info.deposit?.toString() || "0"),
        refcount: parseInt(info.refcount?.toString() || "0", 10),
      };
    } catch {
      return null;
    }
  }

  /**
   * Get nonce for contract address derivation
   * @returns Current nonce value
   */
  async nonce(): Promise<bigint> {
    try {
      const result = await this.api.query.contracts.nonce();
      return BigInt(result.toString());
    } catch {
      return BigInt(0);
    }
  }

  /**
   * Get deletion queue length
   * @returns Number of contracts pending deletion
   */
  async deletionQueueCounter(): Promise<number> {
    try {
      const result = await this.api.query.contracts.deletionQueueCounter();
      return parseInt(result.toString(), 10);
    } catch {
      return 0;
    }
  }

  // ==========================================================================
  // Dry Run / Simulation
  // ==========================================================================

  /**
   * Dry run a contract call (simulate without executing)
   * @param origin - Origin account
   * @param dest - Contract address
   * @param value - Value to transfer
   * @param gasLimit - Gas limit
   * @param storageDepositLimit - Storage deposit limit
   * @param inputData - Call data
   * @returns Dry run result
   */
  async dryRunCall(
    origin: string,
    dest: string,
    value: bigint,
    gasLimit: ContractGasLimit | null,
    storageDepositLimit: StorageDepositLimit,
    inputData: Uint8Array | string
  ): Promise<DryRunResult> {
    try {
      const result = await this.api.call.contractsApi.call(
        origin,
        dest,
        value.toString(),
        gasLimit,
        storageDepositLimit?.toString() || null,
        inputData
      );

      const resultData = result as any;

      // Parse the result
      if (resultData.result?.isOk) {
        const execResult = resultData.result.asOk;
        return {
          success: !execResult.flags?.isRevert,
          data: execResult.data?.toHex(),
          gasConsumed: {
            refTime: BigInt(resultData.gasConsumed?.refTime?.toString() || "0"),
            proofSize: BigInt(
              resultData.gasConsumed?.proofSize?.toString() || "0"
            ),
          },
          gasRequired: {
            refTime: BigInt(resultData.gasRequired?.refTime?.toString() || "0"),
            proofSize: BigInt(
              resultData.gasRequired?.proofSize?.toString() || "0"
            ),
          },
          storageDeposit: {
            charge: resultData.storageDeposit?.isCharge
              ? BigInt(resultData.storageDeposit.asCharge.toString())
              : undefined,
            refund: resultData.storageDeposit?.isRefund
              ? BigInt(resultData.storageDeposit.asRefund.toString())
              : undefined,
          },
          result: {
            flags: execResult.flags?.toNumber() || 0,
            data: execResult.data?.toHex() || "0x",
          },
        };
      } else {
        return {
          success: false,
          gasConsumed: {
            refTime: BigInt(resultData.gasConsumed?.refTime?.toString() || "0"),
            proofSize: BigInt(
              resultData.gasConsumed?.proofSize?.toString() || "0"
            ),
          },
          gasRequired: {
            refTime: BigInt(resultData.gasRequired?.refTime?.toString() || "0"),
            proofSize: BigInt(
              resultData.gasRequired?.proofSize?.toString() || "0"
            ),
          },
          storageDeposit: {},
          error: resultData.result?.asErr?.toString() || "Call failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        gasConsumed: { refTime: BigInt(0), proofSize: BigInt(0) },
        gasRequired: { refTime: BigInt(0), proofSize: BigInt(0) },
        storageDeposit: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Dry run contract instantiation
   * @param origin - Origin account
   * @param value - Value to transfer
   * @param gasLimit - Gas limit
   * @param storageDepositLimit - Storage deposit limit
   * @param code - Code hash or WASM code
   * @param data - Constructor data
   * @param salt - Salt for address derivation
   * @returns Dry run result
   */
  async dryRunInstantiate(
    origin: string,
    value: bigint,
    gasLimit: ContractGasLimit | null,
    storageDepositLimit: StorageDepositLimit,
    code: { Upload: Uint8Array | string } | { Existing: string },
    data: Uint8Array | string,
    salt: Uint8Array | string = "0x"
  ): Promise<DryRunResult & { contractAddress?: string }> {
    try {
      const result = await this.api.call.contractsApi.instantiate(
        origin,
        value.toString(),
        gasLimit,
        storageDepositLimit?.toString() || null,
        code,
        data,
        salt
      );

      const resultData = result as any;

      if (resultData.result?.isOk) {
        const execResult = resultData.result.asOk;
        return {
          success: !execResult.result?.flags?.isRevert,
          contractAddress: execResult.accountId?.toString(),
          data: execResult.result?.data?.toHex(),
          gasConsumed: {
            refTime: BigInt(resultData.gasConsumed?.refTime?.toString() || "0"),
            proofSize: BigInt(
              resultData.gasConsumed?.proofSize?.toString() || "0"
            ),
          },
          gasRequired: {
            refTime: BigInt(resultData.gasRequired?.refTime?.toString() || "0"),
            proofSize: BigInt(
              resultData.gasRequired?.proofSize?.toString() || "0"
            ),
          },
          storageDeposit: {
            charge: resultData.storageDeposit?.isCharge
              ? BigInt(resultData.storageDeposit.asCharge.toString())
              : undefined,
            refund: resultData.storageDeposit?.isRefund
              ? BigInt(resultData.storageDeposit.asRefund.toString())
              : undefined,
          },
        };
      } else {
        return {
          success: false,
          gasConsumed: {
            refTime: BigInt(resultData.gasConsumed?.refTime?.toString() || "0"),
            proofSize: BigInt(
              resultData.gasConsumed?.proofSize?.toString() || "0"
            ),
          },
          gasRequired: {
            refTime: BigInt(resultData.gasRequired?.refTime?.toString() || "0"),
            proofSize: BigInt(
              resultData.gasRequired?.proofSize?.toString() || "0"
            ),
          },
          storageDeposit: {},
          error: resultData.result?.asErr?.toString() || "Instantiation failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        gasConsumed: { refTime: BigInt(0), proofSize: BigInt(0) },
        gasRequired: { refTime: BigInt(0), proofSize: BigInt(0) },
        storageDeposit: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Check if an address is a contract
   * @param address - Address to check
   * @returns True if address has contract code
   */
  async isContract(address: string): Promise<boolean> {
    const info = await this.contractInfoOf(address);
    return info !== null;
  }

  /**
   * Check if a code hash exists
   * @param codeHash - Code hash to check
   * @returns True if code exists
   */
  async codeExists(codeHash: string): Promise<boolean> {
    const info = await this.codeInfoOf(codeHash);
    return info !== null;
  }

  /**
   * Get all contracts using a specific code hash
   * @param codeHash - Code hash
   * @param limit - Maximum results
   * @returns List of contract addresses
   */
  async getContractsByCodeHash(
    codeHash: string,
    limit: number = 100
  ): Promise<string[]> {
    const contracts: string[] = [];

    try {
      const entries = await this.api.query.contracts.contractInfoOf.entries();

      for (const [key, value] of entries) {
        if (contracts.length >= limit) break;

        const info = (value as any).unwrap ? (value as any).unwrap() : value;
        if (info.codeHash?.toHex() === codeHash) {
          contracts.push(key.args[0].toString());
        }
      }
    } catch {
      // Storage iteration may not be available
    }

    return contracts;
  }

  /**
   * Get pallet constants
   * @returns Contracts constants
   */
  async getConstants(): Promise<ContractsConstants> {
    const defaultLimits = {
      eventTopics: 4,
      globals: 256,
      locals: 1024,
      parameters: 128,
      memoryPages: 16,
      tableSize: 4096,
      brTableSize: 256,
      subjectLen: 32,
      payloadLen: 16384,
      runtimeMemory: 1073741824,
    };

    let schedule = { limits: defaultLimits };
    let maxCodeLen = 125952;
    let depositPerByte = BigInt("0");
    let depositPerItem = BigInt("0");
    let defaultDepositLimit = BigInt("0");
    let maxDebugBufferLen = 2097152;
    let codeHashLockupDepositPercent = 30;

    try {
      const scheduleConst = this.api.consts.contracts?.schedule;
      if (scheduleConst) {
        const limits = (scheduleConst as any).limits;
        schedule = {
          limits: {
            eventTopics: parseInt(limits?.eventTopics?.toString() || "4", 10),
            globals: parseInt(limits?.globals?.toString() || "256", 10),
            locals: parseInt(limits?.locals?.toString() || "1024", 10),
            parameters: parseInt(limits?.parameters?.toString() || "128", 10),
            memoryPages: parseInt(limits?.memoryPages?.toString() || "16", 10),
            tableSize: parseInt(limits?.tableSize?.toString() || "4096", 10),
            brTableSize: parseInt(limits?.brTableSize?.toString() || "256", 10),
            subjectLen: parseInt(limits?.subjectLen?.toString() || "32", 10),
            payloadLen: parseInt(limits?.payloadLen?.toString() || "16384", 10),
            runtimeMemory: parseInt(
              limits?.runtimeMemory?.toString() || "1073741824",
              10
            ),
          },
        };
      }
    } catch {
      // Use defaults
    }

    try {
      const maxCode = this.api.consts.contracts?.maxCodeLen;
      if (maxCode) {
        maxCodeLen = parseInt(maxCode.toString(), 10);
      }
    } catch {
      // Use default
    }

    try {
      const perByte = this.api.consts.contracts?.depositPerByte;
      if (perByte) {
        depositPerByte = BigInt(perByte.toString());
      }
    } catch {
      // Use default
    }

    try {
      const perItem = this.api.consts.contracts?.depositPerItem;
      if (perItem) {
        depositPerItem = BigInt(perItem.toString());
      }
    } catch {
      // Use default
    }

    try {
      const debugLen = this.api.consts.contracts?.maxDebugBufferLen;
      if (debugLen) {
        maxDebugBufferLen = parseInt(debugLen.toString(), 10);
      }
    } catch {
      // Use default
    }

    return {
      schedule,
      maxCodeLen,
      depositPerByte,
      depositPerItem,
      defaultDepositLimit,
      maxDebugBufferLen,
      codeHashLockupDepositPercent,
    };
  }

  /**
   * Estimate gas for a contract call
   * @param origin - Caller account
   * @param dest - Contract address
   * @param value - Value to transfer
   * @param inputData - Call data
   * @returns Estimated gas limit
   */
  async estimateGas(
    origin: string,
    dest: string,
    value: bigint,
    inputData: Uint8Array | string
  ): Promise<ContractGasLimit> {
    const result = await this.dryRunCall(
      origin,
      dest,
      value,
      null,
      null,
      inputData
    );

    // Add 10% buffer to required gas
    return {
      refTime: (result.gasRequired.refTime * BigInt(110)) / BigInt(100),
      proofSize: (result.gasRequired.proofSize * BigInt(110)) / BigInt(100),
    };
  }

  /**
   * Calculate storage deposit for contract
   * @param storageBytes - Bytes to store
   * @param storageItems - Number of items
   * @returns Required deposit
   */
  async calculateStorageDeposit(
    storageBytes: number,
    storageItems: number
  ): Promise<bigint> {
    const constants = await this.getConstants();
    return (
      constants.depositPerByte * BigInt(storageBytes) +
      constants.depositPerItem * BigInt(storageItems)
    );
  }
}
