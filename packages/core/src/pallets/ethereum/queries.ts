/**
 * Ethereum Pallet Storage Queries
 *
 * Query functions for Ethereum pallet storage (Frontier)
 */

import type { ApiPromise } from "@polkadot/api";
import type {
  H256,
  U256,
  EthereumBlock,
  EthereumBlockHeader,
  EthereumTransaction,
  EthereumReceipt,
  BlockInfo,
  PendingInfo,
  TransactionInfo,
} from "./types.js";

/**
 * Ethereum storage queries
 */
export class EthereumQueries {
  constructor(private api: ApiPromise) {}

  /**
   * Get current Ethereum block from storage
   * @returns Current block or null
   */
  async currentBlock(): Promise<EthereumBlock | null> {
    const result = await this.api.query.ethereum.currentBlock();
    const block = result as any;

    if (!block || block.isNone) {
      return null;
    }

    return this.parseBlock(block.unwrap());
  }

  /**
   * Get current block receipts
   * @returns Array of receipts for current block
   */
  async currentReceipts(): Promise<EthereumReceipt[]> {
    const result = await this.api.query.ethereum.currentReceipts();
    const receipts = result as any;

    if (!receipts || receipts.isNone) {
      return [];
    }

    return receipts.unwrap().map((r: any) => this.parseReceipt(r));
  }

  /**
   * Get current transaction statuses
   * @returns Transaction statuses
   */
  async currentTransactionStatuses(): Promise<any[]> {
    const result = await this.api.query.ethereum.currentTransactionStatuses();
    const statuses = result as any;

    if (!statuses || statuses.isNone) {
      return [];
    }

    return statuses.unwrap().toArray();
  }

  /**
   * Get pending transactions (from runtime storage)
   * @returns Pending transaction info
   */
  async pending(): Promise<PendingInfo> {
    const result = await this.api.query.ethereum.pending();
    const pending = result as any;

    const transactions: EthereumTransaction[] = pending
      ? pending.map((tx: any) => this.parseTransaction(tx))
      : [];

    return {
      transactions,
      count: transactions.length,
    };
  }

  // ==========================================================================
  // RPC Helper Methods
  // ==========================================================================

  /**
   * Get block by hash using eth_getBlockByHash RPC
   * @param blockHash - Block hash
   * @param fullTransactions - Include full transactions or just hashes
   * @returns Block info or null
   */
  async getBlockByHash(
    blockHash: H256,
    fullTransactions = true
  ): Promise<BlockInfo | null> {
    try {
      if ((this.api.rpc as any).eth?.getBlockByHash) {
        const block = await (this.api.rpc as any).eth.getBlockByHash(
          blockHash,
          fullTransactions
        );

        if (!block) return null;

        return {
          block: this.parseRpcBlock(block),
          hash: blockHash,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get block by number using eth_getBlockByNumber RPC
   * @param blockNumber - Block number or 'latest', 'pending', 'earliest'
   * @param fullTransactions - Include full transactions or just hashes
   * @returns Block info or null
   */
  async getBlockByNumber(
    blockNumber: U256 | "latest" | "pending" | "earliest",
    fullTransactions = true
  ): Promise<BlockInfo | null> {
    try {
      if ((this.api.rpc as any).eth?.getBlockByNumber) {
        const block = await (this.api.rpc as any).eth.getBlockByNumber(
          typeof blockNumber === "bigint"
            ? `0x${blockNumber.toString(16)}`
            : blockNumber,
          fullTransactions
        );

        if (!block) return null;

        return {
          block: this.parseRpcBlock(block),
          hash: block.hash?.toString() as H256,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get transaction by hash using eth_getTransactionByHash RPC
   * @param txHash - Transaction hash
   * @returns Transaction info or null
   */
  async getTransactionByHash(txHash: H256): Promise<TransactionInfo | null> {
    try {
      if ((this.api.rpc as any).eth?.getTransactionByHash) {
        const tx = await (this.api.rpc as any).eth.getTransactionByHash(txHash);

        if (!tx) return null;

        return {
          transaction: this.parseRpcTransaction(tx),
          blockHash: tx.blockHash?.toString() as H256 | undefined,
          blockNumber: tx.blockNumber
            ? BigInt(tx.blockNumber.toString())
            : undefined,
          transactionIndex: tx.transactionIndex
            ? parseInt(tx.transactionIndex.toString(), 10)
            : undefined,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get transaction receipt by hash using eth_getTransactionReceipt RPC
   * @param txHash - Transaction hash
   * @returns Receipt or null
   */
  async getTransactionReceipt(txHash: H256): Promise<EthereumReceipt | null> {
    try {
      if ((this.api.rpc as any).eth?.getTransactionReceipt) {
        const receipt = await (this.api.rpc as any).eth.getTransactionReceipt(
          txHash
        );

        if (!receipt) return null;

        return this.parseRpcReceipt(receipt);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get current block number
   * @returns Current block number
   */
  async blockNumber(): Promise<U256> {
    try {
      if ((this.api.rpc as any).eth?.blockNumber) {
        const number = await (this.api.rpc as any).eth.blockNumber();
        return BigInt(number.toString());
      }

      // Fallback to substrate block number
      const header = await this.api.rpc.chain.getHeader();
      return BigInt(header.number.toString());
    } catch {
      return 0n;
    }
  }

  /**
   * Get logs using eth_getLogs RPC
   * @param filter - Log filter parameters
   * @returns Array of logs
   */
  async getLogs(filter: {
    fromBlock?: U256 | "latest" | "pending" | "earliest";
    toBlock?: U256 | "latest" | "pending" | "earliest";
    address?: string | string[];
    topics?: (string | string[] | null)[];
  }): Promise<any[]> {
    try {
      if ((this.api.rpc as any).eth?.getLogs) {
        const logs = await (this.api.rpc as any).eth.getLogs({
          fromBlock:
            typeof filter.fromBlock === "bigint"
              ? `0x${filter.fromBlock.toString(16)}`
              : filter.fromBlock,
          toBlock:
            typeof filter.toBlock === "bigint"
              ? `0x${filter.toBlock.toString(16)}`
              : filter.toBlock,
          address: filter.address,
          topics: filter.topics,
        });

        return logs.map((log: any) => ({
          address: log.address?.toString(),
          topics: log.topics?.map((t: any) => t.toString()),
          data: log.data?.toString(),
          blockNumber: log.blockNumber
            ? BigInt(log.blockNumber.toString())
            : undefined,
          blockHash: log.blockHash?.toString(),
          transactionHash: log.transactionHash?.toString(),
          transactionIndex: log.transactionIndex
            ? parseInt(log.transactionIndex.toString(), 10)
            : undefined,
          logIndex: log.logIndex
            ? parseInt(log.logIndex.toString(), 10)
            : undefined,
        }));
      }

      return [];
    } catch {
      return [];
    }
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Parse block from storage
   */
  private parseBlock(block: any): EthereumBlock {
    return {
      header: this.parseBlockHeader(block.header),
      transactions: block.transactions.map((tx: any) =>
        this.parseTransaction(tx)
      ),
      ommers: block.ommers?.map((h: any) => this.parseBlockHeader(h)) || [],
    };
  }

  /**
   * Parse block header from storage
   */
  private parseBlockHeader(header: any): EthereumBlockHeader {
    return {
      parentHash: header.parentHash?.toString() as H256,
      ommersHash: header.ommersHash?.toString() as H256,
      beneficiary: header.beneficiary?.toString(),
      stateRoot: header.stateRoot?.toString() as H256,
      transactionsRoot: header.transactionsRoot?.toString() as H256,
      receiptsRoot: header.receiptsRoot?.toString() as H256,
      logsBloom: header.logsBloom?.toString(),
      difficulty: BigInt(header.difficulty?.toString() || "0"),
      number: BigInt(header.number?.toString() || "0"),
      gasLimit: BigInt(header.gasLimit?.toString() || "0"),
      gasUsed: BigInt(header.gasUsed?.toString() || "0"),
      timestamp: BigInt(header.timestamp?.toString() || "0"),
      extraData: header.extraData?.toString(),
      mixHash: header.mixHash?.toString() as H256,
      nonce: header.nonce?.toString(),
      baseFeePerGas: header.baseFeePerGas
        ? BigInt(header.baseFeePerGas.toString())
        : undefined,
    };
  }

  /**
   * Parse transaction from storage
   */
  private parseTransaction(tx: any): EthereumTransaction {
    // Handle different transaction types
    if (tx.isLegacy || tx.legacy) {
      const legacy = tx.isLegacy ? tx.asLegacy : tx.legacy;
      return {
        type: "Legacy",
        transaction: {
          nonce: BigInt(legacy.nonce?.toString() || "0"),
          gasPrice: BigInt(legacy.gasPrice?.toString() || "0"),
          gasLimit: BigInt(legacy.gasLimit?.toString() || "0"),
          action: this.parseAction(legacy.action),
          value: BigInt(legacy.value?.toString() || "0"),
          input: legacy.input?.toString() || "0x",
          signature: {
            v: parseInt(legacy.signature?.v?.toString() || "0", 10),
            r: legacy.signature?.r?.toString() as H256,
            s: legacy.signature?.s?.toString() as H256,
          },
        },
      };
    }

    if (tx.isEIP2930 || tx.eip2930) {
      const eip2930 = tx.isEIP2930 ? tx.asEIP2930 : tx.eip2930;
      return {
        type: "EIP2930",
        transaction: {
          chainId: BigInt(eip2930.chainId?.toString() || "0"),
          nonce: BigInt(eip2930.nonce?.toString() || "0"),
          gasPrice: BigInt(eip2930.gasPrice?.toString() || "0"),
          gasLimit: BigInt(eip2930.gasLimit?.toString() || "0"),
          action: this.parseAction(eip2930.action),
          value: BigInt(eip2930.value?.toString() || "0"),
          input: eip2930.input?.toString() || "0x",
          accessList:
            eip2930.accessList?.map((item: any) => ({
              address: item.address?.toString(),
              storageKeys:
                item.storageKeys?.map((k: any) => k.toString()) || [],
            })) || [],
          oddYParity: eip2930.oddYParity,
          r: eip2930.r?.toString() as H256,
          s: eip2930.s?.toString() as H256,
        },
      };
    }

    if (tx.isEIP1559 || tx.eip1559) {
      const eip1559 = tx.isEIP1559 ? tx.asEIP1559 : tx.eip1559;
      return {
        type: "EIP1559",
        transaction: {
          chainId: BigInt(eip1559.chainId?.toString() || "0"),
          nonce: BigInt(eip1559.nonce?.toString() || "0"),
          maxPriorityFeePerGas: BigInt(
            eip1559.maxPriorityFeePerGas?.toString() || "0"
          ),
          maxFeePerGas: BigInt(eip1559.maxFeePerGas?.toString() || "0"),
          gasLimit: BigInt(eip1559.gasLimit?.toString() || "0"),
          action: this.parseAction(eip1559.action),
          value: BigInt(eip1559.value?.toString() || "0"),
          input: eip1559.input?.toString() || "0x",
          accessList:
            eip1559.accessList?.map((item: any) => ({
              address: item.address?.toString(),
              storageKeys:
                item.storageKeys?.map((k: any) => k.toString()) || [],
            })) || [],
          oddYParity: eip1559.oddYParity,
          r: eip1559.r?.toString() as H256,
          s: eip1559.s?.toString() as H256,
        },
      };
    }

    // Default to legacy format
    return {
      type: "Legacy",
      transaction: {
        nonce: 0n,
        gasPrice: 0n,
        gasLimit: 0n,
        action: { type: "Create" },
        value: 0n,
        input: "0x",
        signature: {
          v: 0,
          r: "0x" as H256,
          s: "0x" as H256,
        },
      },
    };
  }

  /**
   * Parse transaction action
   */
  private parseAction(
    action: any
  ): { type: "Call"; address: string } | { type: "Create" } {
    if (action?.isCall || action?.call) {
      const address = action.isCall ? action.asCall : action.call;
      return { type: "Call", address: address.toString() };
    }
    return { type: "Create" };
  }

  /**
   * Parse receipt from storage
   */
  private parseReceipt(receipt: any): EthereumReceipt {
    return {
      transactionHash: receipt.transactionHash?.toString() as H256,
      transactionIndex: parseInt(
        receipt.transactionIndex?.toString() || "0",
        10
      ),
      blockHash: receipt.blockHash?.toString() as H256,
      blockNumber: BigInt(receipt.blockNumber?.toString() || "0"),
      from: receipt.from?.toString(),
      to: receipt.to?.toString() || undefined,
      cumulativeGasUsed: BigInt(receipt.cumulativeGasUsed?.toString() || "0"),
      gasUsed: BigInt(receipt.gasUsed?.toString() || "0"),
      contractAddress: receipt.contractAddress?.toString() || undefined,
      logs:
        receipt.logs?.map((log: any) => ({
          address: log.address?.toString(),
          topics: log.topics?.map((t: any) => t.toString()) || [],
          data: log.data?.toString() || "0x",
        })) || [],
      logsBloom: receipt.logsBloom?.toString() || "",
      status: receipt.statusCode === 1 ? "Success" : "Failure",
      effectiveGasPrice: BigInt(receipt.effectiveGasPrice?.toString() || "0"),
      type: parseInt(receipt.type?.toString() || "0", 10),
    };
  }

  /**
   * Parse block from RPC response
   */
  private parseRpcBlock(block: any): EthereumBlock {
    return {
      header: {
        parentHash: block.parentHash?.toString() as H256,
        ommersHash: block.sha3Uncles?.toString() as H256,
        beneficiary: block.miner?.toString(),
        stateRoot: block.stateRoot?.toString() as H256,
        transactionsRoot: block.transactionsRoot?.toString() as H256,
        receiptsRoot: block.receiptsRoot?.toString() as H256,
        logsBloom: block.logsBloom?.toString(),
        difficulty: BigInt(block.difficulty?.toString() || "0"),
        number: BigInt(block.number?.toString() || "0"),
        gasLimit: BigInt(block.gasLimit?.toString() || "0"),
        gasUsed: BigInt(block.gasUsed?.toString() || "0"),
        timestamp: BigInt(block.timestamp?.toString() || "0"),
        extraData: block.extraData?.toString(),
        mixHash: block.mixHash?.toString() as H256,
        nonce: block.nonce?.toString(),
        baseFeePerGas: block.baseFeePerGas
          ? BigInt(block.baseFeePerGas.toString())
          : undefined,
      },
      transactions: Array.isArray(block.transactions)
        ? block.transactions.map((tx: any) =>
            typeof tx === "string"
              ? ({
                  type: "Legacy",
                  transaction: {
                    nonce: 0n,
                    gasPrice: 0n,
                    gasLimit: 0n,
                    action: { type: "Create" },
                    value: 0n,
                    input: "0x",
                    signature: { v: 0, r: "0x" as H256, s: "0x" as H256 },
                  },
                } as EthereumTransaction)
              : this.parseRpcTransaction(tx)
          )
        : [],
      ommers: [],
    };
  }

  /**
   * Parse transaction from RPC response
   */
  private parseRpcTransaction(tx: any): EthereumTransaction {
    const type = parseInt(tx.type?.toString() || "0", 16);

    if (type === 2) {
      // EIP-1559
      return {
        type: "EIP1559",
        transaction: {
          chainId: BigInt(tx.chainId?.toString() || "0"),
          nonce: BigInt(tx.nonce?.toString() || "0"),
          maxPriorityFeePerGas: BigInt(
            tx.maxPriorityFeePerGas?.toString() || "0"
          ),
          maxFeePerGas: BigInt(tx.maxFeePerGas?.toString() || "0"),
          gasLimit: BigInt(tx.gas?.toString() || "0"),
          action: tx.to
            ? { type: "Call", address: tx.to.toString() }
            : { type: "Create" },
          value: BigInt(tx.value?.toString() || "0"),
          input: tx.input?.toString() || "0x",
          accessList:
            tx.accessList?.map((item: any) => ({
              address: item.address?.toString(),
              storageKeys:
                item.storageKeys?.map((k: any) => k.toString()) || [],
            })) || [],
          oddYParity: false,
          r: tx.r?.toString() as H256,
          s: tx.s?.toString() as H256,
        },
      };
    }

    if (type === 1) {
      // EIP-2930
      return {
        type: "EIP2930",
        transaction: {
          chainId: BigInt(tx.chainId?.toString() || "0"),
          nonce: BigInt(tx.nonce?.toString() || "0"),
          gasPrice: BigInt(tx.gasPrice?.toString() || "0"),
          gasLimit: BigInt(tx.gas?.toString() || "0"),
          action: tx.to
            ? { type: "Call", address: tx.to.toString() }
            : { type: "Create" },
          value: BigInt(tx.value?.toString() || "0"),
          input: tx.input?.toString() || "0x",
          accessList:
            tx.accessList?.map((item: any) => ({
              address: item.address?.toString(),
              storageKeys:
                item.storageKeys?.map((k: any) => k.toString()) || [],
            })) || [],
          oddYParity: false,
          r: tx.r?.toString() as H256,
          s: tx.s?.toString() as H256,
        },
      };
    }

    // Legacy
    return {
      type: "Legacy",
      transaction: {
        nonce: BigInt(tx.nonce?.toString() || "0"),
        gasPrice: BigInt(tx.gasPrice?.toString() || "0"),
        gasLimit: BigInt(tx.gas?.toString() || "0"),
        action: tx.to
          ? { type: "Call", address: tx.to.toString() }
          : { type: "Create" },
        value: BigInt(tx.value?.toString() || "0"),
        input: tx.input?.toString() || "0x",
        signature: {
          v: parseInt(tx.v?.toString() || "0", 16),
          r: tx.r?.toString() as H256,
          s: tx.s?.toString() as H256,
        },
      },
    };
  }

  /**
   * Parse receipt from RPC response
   */
  private parseRpcReceipt(receipt: any): EthereumReceipt {
    return {
      transactionHash: receipt.transactionHash?.toString() as H256,
      transactionIndex: parseInt(
        receipt.transactionIndex?.toString() || "0",
        16
      ),
      blockHash: receipt.blockHash?.toString() as H256,
      blockNumber: BigInt(receipt.blockNumber?.toString() || "0"),
      from: receipt.from?.toString(),
      to: receipt.to?.toString() || undefined,
      cumulativeGasUsed: BigInt(receipt.cumulativeGasUsed?.toString() || "0"),
      gasUsed: BigInt(receipt.gasUsed?.toString() || "0"),
      contractAddress: receipt.contractAddress?.toString() || undefined,
      logs:
        receipt.logs?.map((log: any) => ({
          address: log.address?.toString(),
          topics: log.topics?.map((t: any) => t.toString()) || [],
          data: log.data?.toString() || "0x",
        })) || [],
      logsBloom: receipt.logsBloom?.toString() || "",
      status:
        parseInt(receipt.status?.toString() || "0", 16) === 1
          ? "Success"
          : "Failure",
      effectiveGasPrice: BigInt(receipt.effectiveGasPrice?.toString() || "0"),
      type: parseInt(receipt.type?.toString() || "0", 16),
    };
  }
}
