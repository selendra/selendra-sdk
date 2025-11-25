/**
 * useTransaction Hook
 *
 * React hook for managing blockchain transactions.
 *
 * @example
 * ```tsx
 * import { useTransaction } from '@selendrajs/sdk/react';
 *
 * function TransferForm() {
 *   const { status, execute, reset } = useTransaction();
 *
 *   const handleTransfer = async () => {
 *     await execute(async (sdk) => {
 *       return sdk.pallets.balances.manager.transfer(
 *         signer,
 *         signerAddress,
 *         { dest: recipient, value: amount }
 *       );
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleTransfer} disabled={status === 'pending'}>
 *         {status === 'pending' ? 'Sending...' : 'Send'}
 *       </button>
 *       {status === 'success' && <p>Transaction successful!</p>}
 *       {status === 'error' && <p>Transaction failed</p>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

import { useState, useCallback } from "react";
import { useSelendra } from "./useSelendra.js";
import type { SelendraSDK } from "../core/index.js";

/**
 * Transaction status
 */
export type TransactionStatus = "idle" | "pending" | "success" | "error";

/**
 * Transaction state
 */
export interface TransactionState {
  /** Transaction status */
  status: TransactionStatus;
  /** Transaction hash (if submitted) */
  txHash: string | null;
  /** Block hash (if finalized) */
  blockHash: string | null;
  /** Error (if failed) */
  error: Error | null;
  /** Events from the transaction */
  events: unknown[];
  /** Whether transaction is in flight */
  isPending: boolean;
  /** Whether transaction succeeded */
  isSuccess: boolean;
  /** Whether transaction failed */
  isError: boolean;
}

/**
 * Transaction result
 */
interface TxResult {
  txHash: string;
  blockHash?: string;
  events?: unknown[];
}

/**
 * Result type for useTransaction hook
 */
export interface UseTransactionResult extends TransactionState {
  /** Execute a transaction */
  execute: <T extends TxResult>(
    transaction: (sdk: SelendraSDK) => Promise<T>
  ) => Promise<T | null>;
  /** Reset transaction state */
  reset: () => void;
}

/**
 * Hook for managing transactions
 *
 * Provides transaction state management with status tracking,
 * error handling, and automatic state updates.
 *
 * @returns Transaction state and control functions
 *
 * @example
 * ```tsx
 * const { status, txHash, error, execute, reset } = useTransaction();
 *
 * // Execute a transfer
 * const result = await execute(async (sdk) => {
 *   return sdk.pallets.balances.manager.transfer(signer, address, {
 *     dest: recipient,
 *     value: amount
 *   });
 * });
 *
 * // Check status
 * if (status === 'success') {
 *   console.log('Transaction hash:', txHash);
 * }
 *
 * // Reset for next transaction
 * reset();
 * ```
 */
export function useTransaction(): UseTransactionResult {
  const { sdk, isConnected } = useSelendra();

  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [blockHash, setBlockHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [events, setEvents] = useState<unknown[]>([]);

  // Reset state
  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(null);
    setBlockHash(null);
    setError(null);
    setEvents([]);
  }, []);

  // Execute transaction
  const execute = useCallback(
    async <T extends TxResult>(
      transaction: (sdk: SelendraSDK) => Promise<T>
    ): Promise<T | null> => {
      if (!sdk || !isConnected) {
        const error = new Error("SDK not connected");
        setError(error);
        setStatus("error");
        return null;
      }

      // Reset state
      reset();
      setStatus("pending");

      try {
        const result = await transaction(sdk);

        setTxHash(result.txHash);
        setBlockHash(result.blockHash ?? null);
        setEvents(result.events ?? []);
        setStatus("success");

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setStatus("error");
        return null;
      }
    },
    [sdk, isConnected, reset]
  );

  return {
    status,
    txHash,
    blockHash,
    error,
    events,
    isPending: status === "pending",
    isSuccess: status === "success",
    isError: status === "error",
    execute,
    reset,
  };
}

/**
 * Hook for managing multiple transactions
 *
 * Useful for batch operations or multi-step processes.
 *
 * @returns Array of transaction states and batch control functions
 *
 * @example
 * ```tsx
 * const { transactions, executeBatch, reset } = useTransactions();
 *
 * const handleBatchTransfer = async () => {
 *   await executeBatch([
 *     (sdk) => sdk.pallets.balances.manager.transfer(signer, addr, { dest: 'a', value: '100' }),
 *     (sdk) => sdk.pallets.balances.manager.transfer(signer, addr, { dest: 'b', value: '200' }),
 *   ]);
 * };
 * ```
 */
export function useTransactions(): {
  transactions: TransactionState[];
  isAnyPending: boolean;
  isAllSuccess: boolean;
  hasAnyError: boolean;
  executeBatch: <T extends TxResult>(
    txs: Array<(sdk: SelendraSDK) => Promise<T>>
  ) => Promise<(T | null)[]>;
  reset: () => void;
} {
  const { sdk, isConnected } = useSelendra();

  const [transactions, setTransactions] = useState<TransactionState[]>([]);

  // Reset all
  const reset = useCallback(() => {
    setTransactions([]);
  }, []);

  // Execute batch
  const executeBatch = useCallback(
    async <T extends TxResult>(
      txs: Array<(sdk: SelendraSDK) => Promise<T>>
    ): Promise<(T | null)[]> => {
      if (!sdk || !isConnected) {
        const errorState: TransactionState = {
          status: "error",
          txHash: null,
          blockHash: null,
          error: new Error("SDK not connected"),
          events: [],
          isPending: false,
          isSuccess: false,
          isError: true,
        };
        setTransactions(txs.map(() => errorState));
        return txs.map(() => null);
      }

      // Initialize pending states
      const initialStates: TransactionState[] = txs.map(() => ({
        status: "pending",
        txHash: null,
        blockHash: null,
        error: null,
        events: [],
        isPending: true,
        isSuccess: false,
        isError: false,
      }));
      setTransactions(initialStates);

      // Execute all transactions
      const results: (T | null)[] = [];

      for (let i = 0; i < txs.length; i++) {
        try {
          const result = await txs[i](sdk);
          results.push(result);

          setTransactions((prev) => {
            const updated = [...prev];
            updated[i] = {
              status: "success",
              txHash: result.txHash,
              blockHash: result.blockHash ?? null,
              error: null,
              events: result.events ?? [],
              isPending: false,
              isSuccess: true,
              isError: false,
            };
            return updated;
          });
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          results.push(null);

          setTransactions((prev) => {
            const updated = [...prev];
            updated[i] = {
              status: "error",
              txHash: null,
              blockHash: null,
              error,
              events: [],
              isPending: false,
              isSuccess: false,
              isError: true,
            };
            return updated;
          });
        }
      }

      return results;
    },
    [sdk, isConnected]
  );

  return {
    transactions,
    isAnyPending: transactions.some((t) => t.isPending),
    isAllSuccess:
      transactions.length > 0 && transactions.every((t) => t.isSuccess),
    hasAnyError: transactions.some((t) => t.isError),
    executeBatch,
    reset,
  };
}
