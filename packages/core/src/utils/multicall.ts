/**
 * Multicall Utility
 *
 * Batch multiple contract calls into a single RPC request using Multicall3
 *
 * @module utils/multicall
 */

import {
  type PublicClient,
  type Abi,
  type Address,
  encodeFunctionData,
  decodeFunctionResult,
} from "viem";

/**
 * Multicall3 contract address (deployed at same address on all EVM chains)
 * https://www.multicall3.com/
 */
export const MULTICALL3_ADDRESS =
  "0xcA11bde05977b3631167028862bE2a173976CA11" as const;

/**
 * Multicall3 ABI (subset for aggregate functions)
 */
export const MULTICALL3_ABI = [
  {
    name: "aggregate3",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "calls",
        type: "tuple[]",
        components: [
          { name: "target", type: "address" },
          { name: "allowFailure", type: "bool" },
          { name: "callData", type: "bytes" },
        ],
      },
    ],
    outputs: [
      {
        name: "returnData",
        type: "tuple[]",
        components: [
          { name: "success", type: "bool" },
          { name: "returnData", type: "bytes" },
        ],
      },
    ],
  },
  {
    name: "aggregate3Value",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "calls",
        type: "tuple[]",
        components: [
          { name: "target", type: "address" },
          { name: "allowFailure", type: "bool" },
          { name: "value", type: "uint256" },
          { name: "callData", type: "bytes" },
        ],
      },
    ],
    outputs: [
      {
        name: "returnData",
        type: "tuple[]",
        components: [
          { name: "success", type: "bool" },
          { name: "returnData", type: "bytes" },
        ],
      },
    ],
  },
  {
    name: "getBlockNumber",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "blockNumber", type: "uint256" }],
  },
  {
    name: "getCurrentBlockTimestamp",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "timestamp", type: "uint256" }],
  },
  {
    name: "getEthBalance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
] as const;

/**
 * Single call in a multicall batch
 */
export interface MulticallRequest<TAbi extends Abi = Abi> {
  /** Contract address to call */
  address: Address;
  /** Contract ABI */
  abi: TAbi;
  /** Function name to call */
  functionName: string;
  /** Function arguments */
  args?: readonly unknown[] | unknown[];
  /** Allow this call to fail without reverting the batch */
  allowFailure?: boolean;
}

/**
 * Result of a single call in a multicall batch
 */
export interface MulticallResult<T = unknown> {
  /** Whether the call succeeded */
  success: boolean;
  /** Decoded result (if successful) */
  result?: T;
  /** Error message (if failed) */
  error?: string;
  /** Raw return data */
  returnData: `0x${string}`;
}

/**
 * Options for multicall execution
 */
export interface MulticallOptions {
  /** Custom Multicall3 address (default: standard address) */
  multicallAddress?: Address;
  /** Block number to execute at (default: latest) */
  blockNumber?: bigint;
  /** Whether to use tryAggregate (allows partial failures) */
  allowFailure?: boolean;
}

/**
 * Aggregate3 call structure
 */
interface Aggregate3Call {
  target: Address;
  allowFailure: boolean;
  callData: `0x${string}`;
}

/**
 * Aggregate3 result structure
 */
interface Aggregate3Result {
  success: boolean;
  returnData: `0x${string}`;
}

/**
 * Multicall utility class for batching contract reads
 */
export class Multicall {
  private client: PublicClient;
  private multicallAddress: Address;

  constructor(client: PublicClient, multicallAddress?: Address) {
    this.client = client;
    this.multicallAddress = multicallAddress || MULTICALL3_ADDRESS;
  }

  /**
   * Execute multiple contract calls in a single RPC request
   *
   * @param calls - Array of call requests
   * @param options - Execution options
   * @returns Array of results in the same order as calls
   *
   * @example
   * ```typescript
   * const multicall = new Multicall(client);
   *
   * const results = await multicall.call([
   *   {
   *     address: '0x...',
   *     abi: erc20Abi,
   *     functionName: 'balanceOf',
   *     args: [userAddress],
   *   },
   *   {
   *     address: '0x...',
   *     abi: erc20Abi,
   *     functionName: 'symbol',
   *   },
   * ]);
   * ```
   */
  async call<TRequests extends MulticallRequest[]>(
    calls: TRequests,
    options: MulticallOptions = {}
  ): Promise<MulticallResult[]> {
    if (calls.length === 0) {
      return [];
    }

    const allowFailure = options.allowFailure ?? true;

    // Encode all calls
    const encodedCalls: Aggregate3Call[] = calls.map((call) => ({
      target: call.address,
      allowFailure: call.allowFailure ?? allowFailure,
      callData: encodeFunctionData({
        abi: call.abi,
        functionName: call.functionName,
        args: call.args as unknown[] || [],
      }),
    }));

    try {
      // Use raw call to avoid TypeScript issues with readContract
      const data = encodeFunctionData({
        abi: MULTICALL3_ABI,
        functionName: "aggregate3",
        args: [encodedCalls],
      });

      const rawResult = await this.client.call({
        to: this.multicallAddress,
        data,
        blockNumber: options.blockNumber,
      });

      if (!rawResult.data) {
        throw new Error("No data returned from multicall");
      }

      // Decode the aggregate3 result
      const decoded = decodeFunctionResult({
        abi: MULTICALL3_ABI,
        functionName: "aggregate3",
        data: rawResult.data,
      });

      const results = decoded as Aggregate3Result[];

      // Decode individual results
      return results.map((result, index) => {
        const call = calls[index];

        if (!result.success) {
          return {
            success: false,
            error: "Call reverted",
            returnData: result.returnData,
          };
        }

        try {
          const decodedResult = decodeFunctionResult({
            abi: call.abi,
            functionName: call.functionName,
            data: result.returnData,
          });

          return {
            success: true,
            result: decodedResult,
            returnData: result.returnData,
          };
        } catch (error: any) {
          return {
            success: false,
            error: `Decode failed: ${error.message}`,
            returnData: result.returnData,
          };
        }
      });
    } catch (error: any) {
      // If multicall fails entirely, try to provide useful error
      throw new Error(
        `Multicall failed: ${error.message}. ` +
          `Multicall3 may not be deployed on this chain.`
      );
    }
  }

  /**
   * Get ETH balance for an address via Multicall3
   *
   * @param address - Address to check
   * @returns Balance in wei
   */
  async getEthBalance(address: Address): Promise<bigint> {
    const result = await this.client.readContract({
      address: this.multicallAddress,
      abi: MULTICALL3_ABI,
      functionName: "getEthBalance",
      args: [address],
    });

    return result as bigint;
  }

  /**
   * Get ETH balances for multiple addresses in a single call
   *
   * @param addresses - Array of addresses
   * @returns Array of balances in wei
   */
  async getEthBalances(addresses: Address[]): Promise<bigint[]> {
    if (addresses.length === 0) {
      return [];
    }

    const encodedCalls: Aggregate3Call[] = addresses.map((address) => ({
      target: this.multicallAddress,
      allowFailure: false,
      callData: encodeFunctionData({
        abi: MULTICALL3_ABI,
        functionName: "getEthBalance",
        args: [address],
      }),
    }));

    // Use raw call
    const data = encodeFunctionData({
      abi: MULTICALL3_ABI,
      functionName: "aggregate3",
      args: [encodedCalls],
    });

    const rawResult = await this.client.call({
      to: this.multicallAddress,
      data,
    });

    if (!rawResult.data) {
      throw new Error("No data returned from multicall");
    }

    const decoded = decodeFunctionResult({
      abi: MULTICALL3_ABI,
      functionName: "aggregate3",
      data: rawResult.data,
    });

    const results = decoded as Aggregate3Result[];

    return results.map((result) => {
      if (!result.success) {
        return 0n;
      }
      // Decode uint256 from bytes
      return BigInt(result.returnData);
    });
  }

  /**
   * Get current block number via Multicall3
   */
  async getBlockNumber(): Promise<bigint> {
    const result = await this.client.readContract({
      address: this.multicallAddress,
      abi: MULTICALL3_ABI,
      functionName: "getBlockNumber",
    });

    return result as bigint;
  }

  /**
   * Get current block timestamp via Multicall3
   */
  async getBlockTimestamp(): Promise<bigint> {
    const result = await this.client.readContract({
      address: this.multicallAddress,
      abi: MULTICALL3_ABI,
      functionName: "getCurrentBlockTimestamp",
    });

    return result as bigint;
  }

  /**
   * Check if Multicall3 is deployed on this chain
   */
  async isDeployed(): Promise<boolean> {
    try {
      const code = await this.client.getCode({
        address: this.multicallAddress,
      });
      return code !== undefined && code !== "0x";
    } catch {
      return false;
    }
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a multicall instance from a public client
 *
 * @param client - Viem public client
 * @param multicallAddress - Optional custom Multicall3 address
 * @returns Multicall instance
 *
 * @example
 * ```typescript
 * const client = createPublicClient({ chain, transport: http() });
 * const multicall = createMulticall(client);
 *
 * const results = await multicall.call([
 *   { address: token1, abi: erc20Abi, functionName: 'balanceOf', args: [user] },
 *   { address: token2, abi: erc20Abi, functionName: 'balanceOf', args: [user] },
 * ]);
 * ```
 */
export function createMulticall(
  client: PublicClient,
  multicallAddress?: Address
): Multicall {
  return new Multicall(client, multicallAddress);
}

/**
 * Batch multiple ERC20 balance checks into a single call
 *
 * @param client - Viem public client
 * @param tokens - Array of token addresses
 * @param account - Account to check balances for
 * @returns Array of balances in token units (bigint)
 *
 * @example
 * ```typescript
 * const balances = await batchERC20Balances(client, [token1, token2, token3], userAddress);
 * // Returns [balance1, balance2, balance3]
 * ```
 */
export async function batchERC20Balances(
  client: PublicClient,
  tokens: Address[],
  account: Address
): Promise<(bigint | null)[]> {
  const erc20BalanceOfAbi = [
    {
      name: "balanceOf",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "balance", type: "uint256" }],
    },
  ] as const;

  const multicall = createMulticall(client);

  const calls: MulticallRequest[] = tokens.map((token) => ({
    address: token,
    abi: erc20BalanceOfAbi,
    functionName: "balanceOf",
    args: [account],
    allowFailure: true,
  }));

  const results = await multicall.call(calls);

  return results.map((result) =>
    result.success ? (result.result as bigint) : null
  );
}

/**
 * Batch multiple ERC20 token info calls
 *
 * @param client - Viem public client
 * @param tokens - Array of token addresses
 * @returns Array of token info { name, symbol, decimals } or null if failed
 */
export async function batchERC20Info(
  client: PublicClient,
  tokens: Address[]
): Promise<({ name: string; symbol: string; decimals: number } | null)[]> {
  const erc20InfoAbi = [
    {
      name: "name",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "string" }],
    },
    {
      name: "symbol",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "string" }],
    },
    {
      name: "decimals",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "uint8" }],
    },
  ] as const;

  const multicall = createMulticall(client);

  // Build calls: 3 calls per token (name, symbol, decimals)
  const calls: MulticallRequest[] = [];
  for (const token of tokens) {
    calls.push(
      {
        address: token,
        abi: erc20InfoAbi,
        functionName: "name",
        allowFailure: true,
      },
      {
        address: token,
        abi: erc20InfoAbi,
        functionName: "symbol",
        allowFailure: true,
      },
      {
        address: token,
        abi: erc20InfoAbi,
        functionName: "decimals",
        allowFailure: true,
      }
    );
  }

  const results = await multicall.call(calls);

  // Process results in groups of 3
  const tokenInfos: ({ name: string; symbol: string; decimals: number } | null)[] =
    [];

  for (let i = 0; i < tokens.length; i++) {
    const nameResult = results[i * 3];
    const symbolResult = results[i * 3 + 1];
    const decimalsResult = results[i * 3 + 2];

    if (
      nameResult.success &&
      symbolResult.success &&
      decimalsResult.success
    ) {
      tokenInfos.push({
        name: nameResult.result as string,
        symbol: symbolResult.result as string,
        decimals: Number(decimalsResult.result),
      });
    } else {
      tokenInfos.push(null);
    }
  }

  return tokenInfos;
}
