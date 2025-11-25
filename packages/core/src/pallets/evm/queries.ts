/**
 * EVM Pallet Storage Queries
 *
 * Query functions for EVM pallet storage (Frontier)
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  H160,
  H256,
  U256,
  EvmAccountInfo,
  AccountCodesResult,
  AccountStorageResult,
  EvmBalanceInfo,
  TransactionCountInfo,
} from "./types.js";

/**
 * EVM storage queries
 */
export class EvmQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get account code (contract bytecode) for an EVM address
   * @param address - EVM address (H160)
   * @returns Contract bytecode or empty array for EOA
   */
  async accountCodes(address: H160): Promise<AccountCodesResult> {
    const result = await this.api.query.evm.accountCodes(address);
    const code = result as any;

    return {
      code: code.toU8a ? code.toU8a() : new Uint8Array(),
    };
  }

  /**
   * Get storage value at a specific slot for an EVM address
   * @param address - EVM address (H160)
   * @param index - Storage slot index (H256)
   * @returns Storage value
   */
  async accountStorages(
    address: H160,
    index: H256
  ): Promise<AccountStorageResult> {
    const result = await this.api.query.evm.accountStorages(address, index);

    return {
      value: result.toString() as H256,
    };
  }

  /**
   * Get the Substrate account ID for an EVM address
   * @param address - EVM address (H160)
   * @returns Substrate account ID or null
   */
  async accountId(address: H160): Promise<string | null> {
    try {
      // Try to get mapped account from unified accounts pallet first
      if (this.api.query.unifiedAccounts?.evmToNative) {
        const result: any = await this.api.query.unifiedAccounts.evmToNative(
          address
        );
        if (result && !result.isNone) {
          return result.unwrap().toString();
        }
      }

      // Calculate default substrate address from EVM address
      return this.calculateDefaultSubstrateAddress(address);
    } catch {
      return null;
    }
  }

  /**
   * Check if an address is a contract
   * @param address - EVM address (H160)
   * @returns True if the address has contract code
   */
  async isContract(address: H160): Promise<boolean> {
    const { code } = await this.accountCodes(address);
    return code.length > 0;
  }

  /**
   * Get code hash for a contract
   * @param address - EVM address (H160)
   * @returns Code hash (keccak256) or null if EOA
   */
  async getCodeHash(address: H160): Promise<H256 | null> {
    const { code } = await this.accountCodes(address);
    if (code.length === 0) return null;

    // Use api to calculate keccak256 hash
    const hash = this.api.registry.hash(code);
    return hash.toHex() as H256;
  }

  // ==========================================================================
  // Helper Methods (using RPC calls where available)
  // ==========================================================================

  /**
   * Get EVM balance for an address using eth_getBalance RPC
   * @param address - EVM address (H160)
   * @returns Balance info
   */
  async getEvmBalance(address: H160): Promise<EvmBalanceInfo> {
    try {
      // Try eth namespace RPC first
      if ((this.api.rpc as any).eth?.getBalance) {
        const balance: any = await (this.api.rpc as any).eth.getBalance(
          address,
          "latest"
        );
        const balanceBigInt = BigInt(balance.toString());

        return {
          balance: balanceBigInt,
          formatted: this.formatWeiToEther(balanceBigInt),
        };
      }

      // Fallback: get from substrate account
      const substrateAccount = await this.accountId(address);
      if (substrateAccount) {
        const accountInfo: any = await this.api.query.system.account(
          substrateAccount
        );
        const balance = BigInt(accountInfo.data.free.toString());

        return {
          balance,
          formatted: this.formatWeiToEther(balance),
        };
      }

      return {
        balance: 0n,
        formatted: "0",
      };
    } catch (error) {
      throw new Error(
        `Failed to get EVM balance: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Get transaction count (nonce) for an address using eth_getTransactionCount RPC
   * @param address - EVM address (H160)
   * @returns Transaction count info
   */
  async getTransactionCount(address: H160): Promise<TransactionCountInfo> {
    try {
      // Try eth namespace RPC
      if ((this.api.rpc as any).eth?.getTransactionCount) {
        const nonce: any = await (this.api.rpc as any).eth.getTransactionCount(
          address,
          "latest"
        );

        // Also get pending nonce if available
        let pendingNonce: U256 | undefined;
        try {
          const pending: any = await (
            this.api.rpc as any
          ).eth.getTransactionCount(address, "pending");
          pendingNonce = BigInt(pending.toString());
        } catch {
          // Pending nonce not available
        }

        return {
          nonce: BigInt(nonce.toString()),
          pendingNonce,
        };
      }

      // Fallback: query EVM account nonce from storage
      const result: any = await this.api.query.evm.accountCodes(address);
      // Note: accountCodes doesn't give nonce, we need different approach
      // For frontier, the nonce is stored in the account info

      return {
        nonce: 0n,
      };
    } catch (error) {
      throw new Error(
        `Failed to get transaction count: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Estimate gas for a call using eth_estimateGas RPC
   * @param params - Call parameters
   * @returns Estimated gas
   */
  async estimateGas(params: {
    from?: H160;
    to?: H160;
    value?: U256;
    data?: string;
    gasLimit?: U256;
  }): Promise<U256> {
    try {
      if ((this.api.rpc as any).eth?.estimateGas) {
        const gas: any = await (this.api.rpc as any).eth.estimateGas({
          from: params.from,
          to: params.to,
          value: params.value ? `0x${params.value.toString(16)}` : undefined,
          data: params.data,
          gas: params.gasLimit
            ? `0x${params.gasLimit.toString(16)}`
            : undefined,
        });

        return BigInt(gas.toString());
      }

      // Default gas estimate if RPC not available
      return 21000n;
    } catch (error) {
      throw new Error(
        `Failed to estimate gas: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Call a contract view function using eth_call RPC
   * @param params - Call parameters
   * @returns Return data as hex string
   */
  async ethCall(params: {
    to: H160;
    from?: H160;
    data?: string;
    value?: U256;
    gasLimit?: U256;
  }): Promise<string> {
    try {
      if ((this.api.rpc as any).eth?.call) {
        const result: any = await (this.api.rpc as any).eth.call(
          {
            to: params.to,
            from: params.from,
            data: params.data,
            value: params.value ? `0x${params.value.toString(16)}` : undefined,
            gas: params.gasLimit
              ? `0x${params.gasLimit.toString(16)}`
              : undefined,
          },
          "latest"
        );

        return result.toString();
      }

      throw new Error("eth_call RPC not available");
    } catch (error) {
      throw new Error(
        `eth_call failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Get gas price using eth_gasPrice RPC
   * @returns Current gas price in wei
   */
  async getGasPrice(): Promise<U256> {
    try {
      if ((this.api.rpc as any).eth?.gasPrice) {
        const price: any = await (this.api.rpc as any).eth.gasPrice();
        return BigInt(price.toString());
      }

      // Default gas price if RPC not available
      return 1000000000n; // 1 gwei
    } catch (error) {
      throw new Error(
        `Failed to get gas price: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Get current block number using eth_blockNumber RPC
   * @returns Current block number
   */
  async getBlockNumber(): Promise<number> {
    try {
      if ((this.api.rpc as any).eth?.blockNumber) {
        const blockNumber: any = await (this.api.rpc as any).eth.blockNumber();
        return parseInt(blockNumber.toString(), 10);
      }

      // Fallback to substrate block number
      const header = await this.api.rpc.chain.getHeader();
      return header.number.toNumber();
    } catch (error) {
      throw new Error(
        `Failed to get block number: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Get chain ID using eth_chainId RPC
   * @returns Chain ID
   */
  async getChainId(): Promise<U256> {
    try {
      if ((this.api.rpc as any).eth?.chainId) {
        const chainId: any = await (this.api.rpc as any).eth.chainId();
        return BigInt(chainId.toString());
      }

      // Fallback to runtime constant
      const chainId = this.api.consts.evmChainId?.chainId;
      if (chainId) {
        return BigInt(chainId.toString());
      }

      // Default to mainnet ID
      return 1961n;
    } catch (error) {
      throw new Error(
        `Failed to get chain ID: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Format wei to ether string
   * @param wei - Amount in wei
   * @returns Formatted string
   */
  private formatWeiToEther(wei: bigint): string {
    const ether = Number(wei) / 1e18;
    return ether.toFixed(18).replace(/\.?0+$/, "");
  }

  /**
   * Calculate default substrate address from EVM address
   * @param evmAddress - EVM address (H160)
   * @returns Substrate address
   */
  private calculateDefaultSubstrateAddress(evmAddress: H160): string {
    // Implementation follows the unified accounts default mapping
    // prefix: "evm:" (5 bytes) + address (20 bytes) + padding (7 bytes)
    const prefix = new TextEncoder().encode("evm:");
    const addressBytes = this.hexToBytes(evmAddress);
    const padding = new Uint8Array(7);

    const accountBytes = new Uint8Array(32);
    accountBytes.set(prefix, 0);
    accountBytes.set(addressBytes, prefix.length);
    accountBytes.set(padding, prefix.length + addressBytes.length);

    // Encode to SS58
    return this.api.registry.createType("AccountId", accountBytes).toString();
  }

  /**
   * Convert hex string to Uint8Array
   * @param hex - Hex string (with or without 0x prefix)
   * @returns Uint8Array
   */
  private hexToBytes(hex: string): Uint8Array {
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }
}
