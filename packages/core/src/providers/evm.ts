/**
 * EVM Provider
 *
 * Handles connections to EVM-based chains using viem
 *
 * @module providers/evm
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  parseEther,
  parseUnits,
  formatUnits,
  encodeFunctionData,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Transport,
  type Address,
  type Hash,
  type Abi,
  getContract,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { BaseProvider } from "./base.js";
import type { SDKConfig } from "../types/index.js";

/**
 * Selendra chain definitions
 */
export const selendraMainnet: Chain = {
  id: 1961,
  name: "Selendra Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "Selendra",
    symbol: "SEL",
  },
  rpcUrls: {
    default: { http: ["https://rpc.selendra.org"] },
  },
  blockExplorers: {
    default: {
      name: "Selendra Explorer",
      url: "https://explorer.selendra.org",
    },
  },
};

export const selendraTestnet: Chain = {
  id: 1953,
  name: "Selendra Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Selendra",
    symbol: "SEL",
  },
  rpcUrls: {
    default: { http: ["https://rpc-testnet.selendra.org"] },
  },
  blockExplorers: {
    default: {
      name: "Selendra Explorer",
      url: "https://testnet-explorer.selendra.org",
    },
  },
  testnet: true,
};

/**
 * Gas estimation result for a single operation
 */
export interface GasEstimate {
  /** Estimated gas units required */
  gas: bigint;
  /** Estimated cost in wei */
  cost: bigint;
}

/**
 * Result from getGasCosts method
 */
export interface GasCostsResult {
  /** Current gas price in wei */
  gasPrice: bigint;
  /** Base fee per gas (EIP-1559 chains only) */
  baseFee?: bigint;
  /** Priority fee per gas (EIP-1559 chains only) */
  priorityFee?: bigint;
  /** Estimated costs for common operations */
  estimates: {
    /** Native token transfer (21000 gas) */
    transfer: GasEstimate;
    /** ERC20 token transfer (~65000 gas) */
    tokenTransfer: GasEstimate;
    /** Contract deployment (~500000 gas) */
    contractDeploy: GasEstimate;
  };
}

/**
 * EVM chain provider using viem
 */
export class EvmProvider extends BaseProvider {
  private publicClient: PublicClient<Transport, Chain> | null = null;
  private chain: Chain;

  constructor(config: SDKConfig) {
    super(config);
    // Determine chain based on endpoint or chainId
    this.chain = this.getChainFromConfig(config);
  }

  /**
   * Get chain configuration from SDK config
   */
  private getChainFromConfig(config: SDKConfig): Chain {
    const chainId = config.chainId;

    if (chainId === 1961) {
      return selendraMainnet;
    } else if (chainId === 1953) {
      return selendraTestnet;
    }

    // Check endpoint to determine chain
    if (config.endpoint?.includes("testnet")) {
      return selendraTestnet;
    }

    // Default to mainnet, but allow custom RPC
    return {
      ...selendraMainnet,
      rpcUrls: {
        default: { http: [config.endpoint || "https://rpc.selendra.org"] },
      },
    };
  }

  /**
   * Connect to EVM chain
   */
  async connect(): Promise<void> {
    if (this._isConnected || this.publicClient) {
      this.log("Already connected");
      return;
    }

    if (!this.config.endpoint) {
      throw new Error("EVM endpoint is required");
    }

    this.log("Connecting to EVM chain...");

    try {
      // Create viem public client
      this.publicClient = createPublicClient({
        chain: this.chain,
        transport: http(this.config.endpoint),
      });

      // Test connection by getting chain ID
      const chainId = await Promise.race([
        this.publicClient.getChainId(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Connection timeout")),
            this.config.timeout || 30000
          )
        ),
      ]);

      this.log(
        `Connected to EVM network: ${this.chain.name} (Chain ID: ${chainId})`
      );

      this._isConnected = true;
      this.emit("connected");
    } catch (error) {
      this.publicClient = null;
      throw new Error(
        `Failed to connect to EVM chain: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Disconnect from EVM chain
   */
  async disconnect(): Promise<void> {
    if (!this.publicClient) {
      this.log("Already disconnected");
      return;
    }

    this.log("Disconnecting from EVM chain...");

    try {
      this.publicClient = null;
      this._isConnected = false;
      this.emit("disconnected");
      this.log("Disconnected successfully");
    } catch (error) {
      this.emit("error", error as Error);
      throw error;
    }
  }

  /**
   * Get viem public client instance
   */
  getClient(): PublicClient<Transport, Chain> | null {
    return this.publicClient;
  }

  /**
   * Get provider instance (alias for getClient, for backwards compatibility)
   * @deprecated Use getClient() instead
   */
  getProvider(): PublicClient<Transport, Chain> | null {
    return this.publicClient;
  }

  /**
   * Get chain configuration
   */
  getChain(): Chain {
    return this.chain;
  }

  /**
   * Create a wallet client from private key
   */
  private createWalletClient(privateKey: string): WalletClient {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    return createWalletClient({
      account,
      chain: this.chain,
      transport: http(this.config.endpoint),
    });
  }

  /**
   * Get account from private key
   */
  private getAccount(privateKey: string): PrivateKeyAccount {
    return privateKeyToAccount(privateKey as `0x${string}`);
  }

  // ==========================================================================
  // Balance Methods
  // ==========================================================================

  /**
   * Get native balance for an address
   */
  async getBalance(address: string): Promise<bigint> {
    if (!this.publicClient) {
      throw new Error("Provider not connected");
    }
    return this.publicClient.getBalance({ address: address as Address });
  }

  // ==========================================================================
  // Transaction Methods
  // ==========================================================================

  /**
   * Send native token (SEL) transfer
   *
   * @param privateKey - Sender's private key
   * @param to - Recipient address
   * @param amount - Amount in SEL (will be converted to wei)
   * @returns Transaction hash
   */
  async sendTransfer(
    privateKey: string,
    to: string,
    amount: string
  ): Promise<string> {
    if (!this.publicClient) {
      throw new Error("Provider not connected");
    }

    try {
      const account = this.getAccount(privateKey);
      const walletClient = this.createWalletClient(privateKey);
      const amountWei = parseEther(amount);

      const hash = await walletClient.sendTransaction({
        account,
        chain: this.chain,
        to: to as Address,
        value: amountWei,
      });

      this.log(`Transaction sent: ${hash}`);

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
      });
      this.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return hash;
    } catch (error) {
      throw new Error(
        `Failed to send transfer: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Send ERC20 token transfer
   *
   * @param privateKey - Sender's private key
   * @param contractAddress - ERC20 token contract address
   * @param to - Recipient address
   * @param amount - Amount in token units (will be converted based on decimals)
   * @param decimals - Token decimals (default: 18)
   * @returns Transaction hash
   */
  async sendERC20Transfer(
    privateKey: string,
    contractAddress: string,
    to: string,
    amount: string,
    decimals: number = 18
  ): Promise<string> {
    if (!this.publicClient) {
      throw new Error("Provider not connected");
    }

    try {
      const account = this.getAccount(privateKey);
      const walletClient = this.createWalletClient(privateKey);
      const amountWei = parseUnits(amount, decimals);

      // ERC20 ABI for transfer function
      const erc20Abi = [
        {
          name: "transfer",
          type: "function",
          inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ name: "", type: "bool" }],
          stateMutability: "nonpayable",
        },
      ] as const;

      const hash = await walletClient.writeContract({
        account,
        chain: this.chain,
        address: contractAddress as Address,
        abi: erc20Abi,
        functionName: "transfer",
        args: [to as Address, amountWei],
      });

      this.log(`ERC20 transfer sent: ${hash}`);

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
      });
      this.log(`ERC20 transfer confirmed in block ${receipt.blockNumber}`);

      return hash;
    } catch (error) {
      throw new Error(
        `Failed to send ERC20 transfer: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Execute custom contract transaction
   *
   * @param privateKey - Sender's private key
   * @param contractAddress - Contract address
   * @param abi - Contract ABI
   * @param functionName - Function name to call
   * @param args - Function arguments
   * @param value - Native token value to send (in SEL, optional)
   * @returns Transaction hash
   */
  async executeContractTransaction(
    privateKey: string,
    contractAddress: string,
    abi: Abi,
    functionName: string,
    args: unknown[] = [],
    value?: string
  ): Promise<string> {
    if (!this.publicClient) {
      throw new Error("Provider not connected");
    }

    try {
      const account = this.getAccount(privateKey);
      const walletClient = this.createWalletClient(privateKey);

      const hash = await walletClient.writeContract({
        account,
        chain: this.chain,
        address: contractAddress as Address,
        abi,
        functionName,
        args,
        value: value ? parseEther(value) : undefined,
      });

      this.log(`Contract transaction sent: ${hash}`);

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
      });
      this.log(
        `Contract transaction confirmed in block ${receipt.blockNumber}`
      );

      return hash;
    } catch (error) {
      throw new Error(
        `Failed to execute contract transaction: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Call contract read-only function
   *
   * @param contractAddress - Contract address
   * @param abi - Contract ABI
   * @param functionName - Function name to call
   * @param args - Function arguments
   * @returns Function result
   */
  async callContractFunction(
    contractAddress: string,
    abi: Abi,
    functionName: string,
    args: unknown[] = []
  ): Promise<unknown> {
    if (!this.publicClient) {
      throw new Error("Provider not connected");
    }

    try {
      const result = await this.publicClient.readContract({
        address: contractAddress as Address,
        abi,
        functionName,
        args,
      });
      return result;
    } catch (error) {
      throw new Error(
        `Failed to call contract function: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Get ERC20 token balance
   *
   * @param contractAddress - ERC20 token contract address
   * @param account - Account address
   * @returns Token balance as string
   */
  async getERC20Balance(
    contractAddress: string,
    account: string
  ): Promise<string> {
    const erc20Abi = [
      {
        name: "balanceOf",
        type: "function",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
      },
    ] as const;

    const balance = await this.callContractFunction(
      contractAddress,
      erc20Abi,
      "balanceOf",
      [account]
    );

    return (balance as bigint).toString();
  }

  /**
   * Get ERC20 token info
   *
   * @param contractAddress - ERC20 token contract address
   * @returns Token info (name, symbol, decimals)
   */
  async getERC20Info(contractAddress: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
  }> {
    const erc20Abi = [
      {
        name: "name",
        type: "function",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
      },
      {
        name: "symbol",
        type: "function",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
      },
      {
        name: "decimals",
        type: "function",
        inputs: [],
        outputs: [{ name: "", type: "uint8" }],
        stateMutability: "view",
      },
    ] as const;

    const [name, symbol, decimals] = await Promise.all([
      this.callContractFunction(contractAddress, erc20Abi, "name"),
      this.callContractFunction(contractAddress, erc20Abi, "symbol"),
      this.callContractFunction(contractAddress, erc20Abi, "decimals"),
    ]);

    return {
      name: name as string,
      symbol: symbol as string,
      decimals: Number(decimals),
    };
  }

  // ==========================================================================
  // Gas Estimation Methods
  // ==========================================================================

  /**
   * Estimate gas for a transaction
   *
   * @param transaction - Transaction parameters
   * @returns Estimated gas as bigint
   */
  async estimateGas(transaction: {
    to: string;
    value?: bigint;
    data?: string;
    from?: string;
  }): Promise<bigint> {
    if (!this.publicClient) {
      throw new Error("Provider not connected");
    }

    try {
      const gas = await this.publicClient.estimateGas({
        to: transaction.to as Address,
        value: transaction.value,
        data: transaction.data as `0x${string}` | undefined,
        account: transaction.from as Address | undefined,
      });

      return gas;
    } catch (error) {
      throw new Error(
        `Failed to estimate gas: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Estimate gas for a contract function call
   *
   * @param contractAddress - Contract address
   * @param abi - Contract ABI
   * @param functionName - Function name to call
   * @param args - Function arguments
   * @param value - Native token value to send (optional)
   * @returns Estimated gas as bigint
   */
  async estimateContractGas(
    contractAddress: string,
    abi: Abi,
    functionName: string,
    args: unknown[] = [],
    value?: bigint
  ): Promise<bigint> {
    if (!this.publicClient) {
      throw new Error("Provider not connected");
    }

    try {
      const gas = await this.publicClient.estimateContractGas({
        address: contractAddress as Address,
        abi,
        functionName,
        args,
        value,
      });

      return gas;
    } catch (error) {
      throw new Error(
        `Failed to estimate contract gas: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Get current gas costs for common operations
   *
   * @returns Gas price information and estimated costs for common operations
   */
  async getGasCosts(): Promise<GasCostsResult> {
    if (!this.publicClient) {
      throw new Error("Provider not connected");
    }

    try {
      // Get current gas price
      const gasPrice = await this.publicClient.getGasPrice();

      // Try to get fee data (base fee + priority fee) for EIP-1559 chains
      let baseFee: bigint | undefined;
      let priorityFee: bigint | undefined;

      try {
        const block = await this.publicClient.getBlock();
        baseFee = block.baseFeePerGas ?? undefined;

        if (baseFee) {
          // Get max priority fee for EIP-1559
          priorityFee = await this.publicClient.estimateMaxPriorityFeePerGas();
        }
      } catch {
        // Chain might not support EIP-1559, continue with legacy gas price
      }

      // Common gas estimates (typical values)
      const TRANSFER_GAS = 21000n;
      const TOKEN_TRANSFER_GAS = 65000n;
      const CONTRACT_DEPLOY_GAS = 500000n;

      // Calculate costs using current gas price
      const effectiveGasPrice =
        baseFee && priorityFee ? baseFee + priorityFee : gasPrice;

      return {
        gasPrice,
        baseFee,
        priorityFee,
        estimates: {
          transfer: {
            gas: TRANSFER_GAS,
            cost: TRANSFER_GAS * effectiveGasPrice,
          },
          tokenTransfer: {
            gas: TOKEN_TRANSFER_GAS,
            cost: TOKEN_TRANSFER_GAS * effectiveGasPrice,
          },
          contractDeploy: {
            gas: CONTRACT_DEPLOY_GAS,
            cost: CONTRACT_DEPLOY_GAS * effectiveGasPrice,
          },
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get gas costs: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
