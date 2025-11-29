/**
 * Status Command (TASK-016 Enhanced)
 *
 * Show network status, health metrics, and statistics
 */

import chalk from "chalk";
import ora from "ora";
import { formatGwei, formatEther } from "viem";
import {
  EVMClient,
  SubstrateClient,
  getNetwork,
  NetworkKey,
} from "../utils/client.js";
import {
  printHeader,
  printKeyValue,
  printSuccess,
  printWarning,
  printInfo,
  printTroubleshooting,
  newLine,
} from "../utils/output.js";

interface StatusOptions {
  network: string;
  json?: boolean;
  health?: boolean;
  watch?: boolean;
}

interface NetworkHealth {
  status: "healthy" | "degraded" | "down";
  evmConnected: boolean;
  substrateConnected: boolean;
  blockTime: number | null;
  tps: number | null;
  peerCount: number | null;
  finalized: boolean;
  syncStatus: "synced" | "syncing" | "stalled";
  latency: number;
}

/**
 * Calculate TPS from recent blocks
 */
async function calculateTPS(
  evmClient: EVMClient,
  blockCount: number = 10
): Promise<number | null> {
  try {
    const publicClient = evmClient.getProvider();
    const latestBlock = await publicClient.getBlock({
      includeTransactions: false,
    });

    if (!latestBlock.number || latestBlock.number < BigInt(blockCount)) {
      return null;
    }

    const olderBlock = await publicClient.getBlock({
      blockNumber: latestBlock.number - BigInt(blockCount),
      includeTransactions: false,
    });

    const timeDiff = Number(latestBlock.timestamp - olderBlock.timestamp);
    if (timeDiff === 0) return null;

    // Get transaction counts for blocks in range
    let totalTxs = 0;
    const blocks = await Promise.all(
      Array.from({ length: blockCount }, (_, i) =>
        publicClient.getBlock({
          blockNumber: latestBlock.number! - BigInt(i),
          includeTransactions: false,
        })
      )
    );

    for (const block of blocks) {
      totalTxs += block.transactions.length;
    }

    return totalTxs / timeDiff;
  } catch {
    return null;
  }
}

/**
 * Measure RPC latency
 */
async function measureLatency(evmClient: EVMClient): Promise<number> {
  const start = Date.now();
  try {
    await evmClient.getBlockNumber();
    return Date.now() - start;
  } catch {
    return -1;
  }
}

/**
 * Get network health metrics
 */
async function getNetworkHealth(
  evmClient: EVMClient,
  substrateClient: SubstrateClient | null
): Promise<NetworkHealth> {
  const health: NetworkHealth = {
    status: "down",
    evmConnected: false,
    substrateConnected: false,
    blockTime: null,
    tps: null,
    peerCount: null,
    finalized: false,
    syncStatus: "stalled",
    latency: -1,
  };

  // Check EVM
  try {
    const latency = await measureLatency(evmClient);
    health.latency = latency;
    health.evmConnected = latency > 0;

    if (health.evmConnected) {
      const publicClient = evmClient.getProvider();

      // Get block time
      const latestBlock = await publicClient.getBlock();
      const prevBlock = await publicClient.getBlock({
        blockNumber: latestBlock.number! - 1n,
      });
      health.blockTime = Number(latestBlock.timestamp - prevBlock.timestamp);

      // Calculate TPS
      health.tps = await calculateTPS(evmClient);
    }
  } catch {
    health.evmConnected = false;
  }

  // Check Substrate
  if (substrateClient) {
    try {
      const chainInfo = await substrateClient.getChainInfo();
      health.substrateConnected = true;
      health.finalized = true; // Selendra uses finality
      health.syncStatus = "synced";
    } catch {
      health.substrateConnected = false;
    }
  }

  // Determine overall status
  if (health.evmConnected && health.substrateConnected) {
    health.status = "healthy";
  } else if (health.evmConnected || health.substrateConnected) {
    health.status = "degraded";
  } else {
    health.status = "down";
  }

  return health;
}

/**
 * Display health status with color coding
 */
function displayHealthStatus(health: NetworkHealth): void {
  printHeader("Network Health");

  // Overall status
  const statusColors: Record<string, (text: string) => string> = {
    healthy: chalk.green,
    degraded: chalk.yellow,
    down: chalk.red,
  };
  const statusIcons: Record<string, string> = {
    healthy: "✓",
    degraded: "⚠",
    down: "✗",
  };

  console.log(
    statusColors[health.status](
      `${statusIcons[health.status]} Status: ${health.status.toUpperCase()}`
    )
  );
  newLine();

  // Connection status
  console.log(chalk.gray("Connections:"));
  console.log(
    `  EVM RPC:       ${
      health.evmConnected
        ? chalk.green("✓ Connected")
        : chalk.red("✗ Disconnected")
    }`
  );
  console.log(
    `  Substrate RPC: ${
      health.substrateConnected
        ? chalk.green("✓ Connected")
        : chalk.red("✗ Disconnected")
    }`
  );
  newLine();

  // Performance metrics
  console.log(chalk.gray("Performance:"));

  if (health.latency > 0) {
    const latencyColor =
      health.latency < 100
        ? chalk.green
        : health.latency < 500
        ? chalk.yellow
        : chalk.red;
    console.log(`  Latency:       ${latencyColor(`${health.latency}ms`)}`);
  }

  if (health.blockTime !== null) {
    console.log(`  Block Time:    ${chalk.white(`${health.blockTime}s`)}`);
  }

  if (health.tps !== null) {
    console.log(`  TPS:           ${chalk.white(health.tps.toFixed(2))}`);
  }

  console.log(
    `  Sync Status:   ${
      health.syncStatus === "synced"
        ? chalk.green("Synced")
        : chalk.yellow(health.syncStatus)
    }`
  );
  console.log(
    `  Finality:      ${
      health.finalized ? chalk.green("✓ Enabled") : chalk.yellow("⚠ Disabled")
    }`
  );
  newLine();
}

export async function statusCommand(options: StatusOptions) {
  const networkKey = options.network as NetworkKey;

  let network;
  try {
    network = getNetwork(networkKey);
  } catch {
    console.error(chalk.red(`Unknown network: ${options.network}`));
    console.log(chalk.gray("Available networks: mainnet, testnet, local"));
    return;
  }

  const spinner = ora(`Connecting to ${network.name}...`).start();

  try {
    // Initialize clients
    const evmClient = new EVMClient(network);
    let substrateClient: SubstrateClient | null = null;

    // Try Substrate connection
    try {
      substrateClient = new SubstrateClient(network);
      await substrateClient.getChainInfo(); // Test connection
    } catch {
      substrateClient = null;
    }

    // Get health metrics if requested
    if (options.health) {
      spinner.text = "Analyzing network health...";
      const health = await getNetworkHealth(evmClient, substrateClient);
      spinner.succeed(`Network health analyzed`);

      if (options.json) {
        console.log(JSON.stringify(health, null, 2));
        if (substrateClient) await substrateClient.disconnect();
        return;
      }

      displayHealthStatus(health);

      if (substrateClient) await substrateClient.disconnect();
      return;
    }

    // Fetch EVM data
    const [blockNumber, feeData] = await Promise.all([
      evmClient.getBlockNumber(),
      evmClient.getFeeData(),
    ]);

    spinner.succeed(`Connected to ${network.name}`);

    // Output as JSON if requested
    if (options.json) {
      const data: any = {
        network: {
          name: network.name,
          chainId: network.evmChainId,
          rpc: network.httpRpc,
        },
        evm: {
          blockNumber: Number(blockNumber),
          gasPrice: feeData.gasPrice?.toString(),
          maxFeePerGas: feeData.maxFeePerGas?.toString(),
        },
      };

      // Add Substrate data if available
      if (substrateClient) {
        try {
          const chainInfo = await substrateClient.getChainInfo();
          const latestBlock = await substrateClient.getLatestBlock();
          data.substrate = {
            chain: chainInfo.chain,
            nodeName: chainInfo.nodeName,
            nodeVersion: chainInfo.nodeVersion,
            specName: chainInfo.specName,
            specVersion: chainInfo.specVersion,
            blockNumber: latestBlock.number,
            blockHash: latestBlock.hash,
          };
        } catch {
          // Skip substrate data
        }
      }

      console.log(JSON.stringify(data, null, 2));
      if (substrateClient) await substrateClient.disconnect();
      return;
    }

    // Display network status
    printHeader("Network Status");
    printKeyValue("Network:", network.name);
    printKeyValue("Chain ID:", network.evmChainId.toString());
    printKeyValue("RPC:", network.httpRpc);
    printKeyValue("WebSocket:", network.wsRpc);

    printHeader("Live Data (EVM)");
    printKeyValue(
      "Block Height:",
      Number(blockNumber).toLocaleString(),
      chalk.green
    );
    printKeyValue(
      "Gas Price:",
      `${formatGwei(feeData.gasPrice || 0n)} gwei`,
      chalk.green
    );

    if (feeData.maxFeePerGas) {
      printKeyValue(
        "Max Fee:",
        `${formatGwei(feeData.maxFeePerGas)} gwei`,
        chalk.green
      );
    }

    // Calculate and show TPS
    const tps = await calculateTPS(evmClient);
    if (tps !== null) {
      printKeyValue("TPS (avg):", tps.toFixed(2), chalk.cyan);
    }

    // Show latency
    const latency = await measureLatency(evmClient);
    if (latency > 0) {
      const latencyColor =
        latency < 100 ? chalk.green : latency < 500 ? chalk.yellow : chalk.red;
      printKeyValue("RPC Latency:", `${latency}ms`, latencyColor);
    }

    if (network.explorer) {
      newLine();
      printKeyValue("Explorer:", network.explorer);
    }

    newLine();
    console.log(chalk.gray("Last updated: " + new Date().toLocaleTimeString()));
    newLine();

    // Get Substrate data
    if (substrateClient) {
      try {
        spinner.start("Fetching Substrate chain info...");

        const [chainInfo, latestBlock] = await Promise.all([
          substrateClient.getChainInfo(),
          substrateClient.getLatestBlock(),
        ]);

        await substrateClient.disconnect();
        spinner.succeed("Substrate data fetched");

        printHeader("Substrate Chain");
        printKeyValue("Chain:", chainInfo.chain);
        printKeyValue("Node:", chainInfo.nodeName);
        printKeyValue("Version:", chainInfo.nodeVersion);
        printKeyValue(
          "Spec:",
          `${chainInfo.specName} v${chainInfo.specVersion}`
        );
        printKeyValue(
          "Block:",
          latestBlock.number.toLocaleString(),
          chalk.green
        );
        printKeyValue(
          "Hash:",
          latestBlock.hash.slice(0, 18) + "...",
          chalk.gray
        );
        newLine();

        // Show validator info hint
        printInfo("For detailed health metrics, use: selendra status --health");
        newLine();
      } catch {
        spinner.info("Substrate node unavailable (EVM-only mode)");
        if (substrateClient) await substrateClient.disconnect();
      }
    }

    // Watch mode
    if (options.watch) {
      printInfo("Watching for updates... (Ctrl+C to stop)");
      newLine();

      const interval = setInterval(async () => {
        try {
          const newBlockNumber = await evmClient.getBlockNumber();
          const newFeeData = await evmClient.getFeeData();

          console.log(
            chalk.gray(new Date().toLocaleTimeString()) +
              " Block: " +
              chalk.green(Number(newBlockNumber).toLocaleString()) +
              " | Gas: " +
              chalk.yellow(`${formatGwei(newFeeData.gasPrice || 0n)} gwei`)
          );
        } catch (error) {
          console.log(chalk.red("Error fetching update"));
        }
      }, 3000);

      process.on("SIGINT", () => {
        clearInterval(interval);
        console.log(chalk.gray("\nStopped watching"));
        process.exit(0);
      });

      // Keep alive
      await new Promise(() => {});
    }
  } catch (error: any) {
    spinner.fail("Failed to connect to network");
    console.error(chalk.red("Error:"), error.message);

    printTroubleshooting([
      "Check your internet connection",
      "Verify the network is operational",
      `Try: ${chalk.white("selendra status --network testnet")}`,
    ]);

    process.exit(1);
  }
}
