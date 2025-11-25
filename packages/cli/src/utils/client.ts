/**
 * SDK Client Wrapper for CLI
 *
 * Provides a singleton-like interface to the Selendra SDK
 * for use across all CLI commands.
 */

import { ApiPromise, WsProvider } from "@polkadot/api";
import { ethers } from "ethers";
import chalk from "chalk";

/**
 * Network configuration
 */
export const Networks = {
  mainnet: {
    name: "Selendra Mainnet",
    wsRpc: "wss://rpc.selendra.org",
    httpRpc: "https://rpc.selendra.org",
    evmChainId: 1961,
    explorer: "https://explorer.selendra.org",
    faucet: null,
  },
  testnet: {
    name: "Selendra Testnet",
    wsRpc: "wss://rpc-testnet.selendra.org",
    httpRpc: "https://rpc-testnet.selendra.org",
    evmChainId: 1953,
    explorer: "https://testnet-explorer.selendra.org",
    faucet: "https://faucet.selendra.org",
  },
  local: {
    name: "Local Development",
    wsRpc: "ws://127.0.0.1:9944",
    httpRpc: "http://127.0.0.1:9944",
    evmChainId: 31337,
    explorer: null,
    faucet: null,
  },
} as const;

export type NetworkKey = keyof typeof Networks;
export type NetworkConfig = (typeof Networks)[NetworkKey];

/**
 * Get network configuration by key
 */
export function getNetwork(network: string): NetworkConfig {
  const key = network.toLowerCase() as NetworkKey;
  const config = Networks[key];

  if (!config) {
    throw new Error(
      `Unknown network: ${network}\n` +
        `Available networks: ${Object.keys(Networks).join(", ")}`
    );
  }

  return config;
}

/**
 * Substrate API client wrapper
 */
export class SubstrateClient {
  private api: ApiPromise | null = null;
  private network: NetworkConfig;

  constructor(network: NetworkKey | NetworkConfig) {
    this.network = typeof network === "string" ? getNetwork(network) : network;
  }

  /**
   * Connect to the Substrate node
   */
  async connect(): Promise<ApiPromise> {
    if (this.api?.isConnected) {
      return this.api;
    }

    const provider = new WsProvider(this.network.wsRpc);
    this.api = await ApiPromise.create({ provider });

    return this.api;
  }

  /**
   * Disconnect from the node
   */
  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
    }
  }

  /**
   * Get the current API instance
   */
  getApi(): ApiPromise {
    if (!this.api) {
      throw new Error("Not connected. Call connect() first.");
    }
    return this.api;
  }

  /**
   * Get chain information
   */
  async getChainInfo() {
    const api = await this.connect();

    const [chain, nodeName, nodeVersion, runtimeVersion] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version(),
      api.runtimeVersion,
    ]);

    return {
      chain: chain.toString(),
      nodeName: nodeName.toString(),
      nodeVersion: nodeVersion.toString(),
      specName: runtimeVersion.specName.toString(),
      specVersion: runtimeVersion.specVersion.toNumber(),
    };
  }

  /**
   * Get latest block info
   */
  async getLatestBlock() {
    const api = await this.connect();

    const header = await api.rpc.chain.getHeader();
    const blockHash = await api.rpc.chain.getBlockHash(header.number.unwrap());

    return {
      number: header.number.unwrap().toNumber(),
      hash: blockHash.toHex(),
    };
  }

  /**
   * Get account balance (native)
   */
  async getBalance(address: string) {
    const api = await this.connect();
    const account = await api.query.system.account(address);

    return {
      free: account.data.free.toString(),
      reserved: account.data.reserved.toString(),
      frozen: account.data.frozen?.toString() || "0",
    };
  }

  /**
   * Get network config
   */
  getNetworkConfig(): NetworkConfig {
    return this.network;
  }
}

/**
 * EVM client wrapper
 */
export class EVMClient {
  private provider: ethers.JsonRpcProvider;
  private network: NetworkConfig;

  constructor(network: NetworkKey | NetworkConfig) {
    this.network = typeof network === "string" ? getNetwork(network) : network;
    this.provider = new ethers.JsonRpcProvider(this.network.httpRpc);
  }

  /**
   * Get the provider instance
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  /**
   * Get a signer with the given private key
   */
  getSigner(privateKey: string): ethers.Wallet {
    return new ethers.Wallet(privateKey, this.provider);
  }

  /**
   * Get EVM balance
   */
  async getBalance(address: string): Promise<bigint> {
    return this.provider.getBalance(address);
  }

  /**
   * Get latest block number
   */
  async getBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  /**
   * Get gas price
   */
  async getGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || 0n;
  }

  /**
   * Get fee data
   */
  async getFeeData() {
    return this.provider.getFeeData();
  }

  /**
   * Get network config
   */
  getNetworkConfig(): NetworkConfig {
    return this.network;
  }
}

/**
 * Combined client for accessing both Substrate and EVM layers
 */
export class SelendraCliClient {
  public substrate: SubstrateClient;
  public evm: EVMClient;
  public network: NetworkConfig;

  constructor(network: NetworkKey = "mainnet") {
    const config = getNetwork(network);
    this.network = config;
    this.substrate = new SubstrateClient(config);
    this.evm = new EVMClient(config);
  }

  /**
   * Connect to both layers
   */
  async connect(): Promise<void> {
    await this.substrate.connect();
  }

  /**
   * Disconnect from both layers
   */
  async disconnect(): Promise<void> {
    await this.substrate.disconnect();
  }

  /**
   * Get comprehensive network status
   */
  async getStatus() {
    const [chainInfo, latestBlock, evmBlock, gasPrice] = await Promise.all([
      this.substrate.getChainInfo(),
      this.substrate.getLatestBlock(),
      this.evm.getBlockNumber(),
      this.evm.getGasPrice(),
    ]);

    return {
      network: this.network,
      chain: chainInfo,
      substrate: {
        block: latestBlock,
      },
      evm: {
        blockNumber: evmBlock,
        gasPrice: ethers.formatUnits(gasPrice, "gwei"),
      },
    };
  }
}

/**
 * Helper to get private key from environment
 */
export function getPrivateKey(): string {
  const privateKey =
    process.env.PRIVATE_KEY || process.env.SELENDRA_PRIVATE_KEY;

  if (!privateKey) {
    console.error(chalk.red("Private key not found"));
    console.log();
    console.log(
      chalk.yellow(
        "Set PRIVATE_KEY or SELENDRA_PRIVATE_KEY environment variable:"
      )
    );
    console.log(chalk.gray("  export PRIVATE_KEY=your_private_key"));
    console.log(chalk.gray("  or add it to .env file"));
    console.log();
    process.exit(1);
  }

  return privateKey;
}

/**
 * Format balance for display
 */
export function formatBalance(
  balance: bigint | string,
  decimals: number = 18
): string {
  const value = typeof balance === "string" ? BigInt(balance) : balance;
  return ethers.formatUnits(value, decimals);
}

/**
 * Parse balance from string
 */
export function parseBalance(amount: string, decimals: number = 18): bigint {
  return ethers.parseUnits(amount, decimals);
}
