/**
 * Status Command
 *
 * Show network status and statistics
 */

import chalk from "chalk";
import ora from "ora";
import { ethers } from "ethers";
import {
  EVMClient,
  SubstrateClient,
  getNetwork,
  NetworkKey,
} from "../utils/client.js";
import {
  printHeader,
  printKeyValue,
  printTroubleshooting,
  newLine,
} from "../utils/output.js";

interface StatusOptions {
  network: string;
  json?: boolean;
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

    // Fetch EVM data
    const [blockNumber, feeData] = await Promise.all([
      evmClient.getBlockNumber(),
      evmClient.getFeeData(),
    ]);

    spinner.succeed(`Connected to ${network.name}`);

    // Output as JSON if requested
    if (options.json) {
      console.log(
        JSON.stringify(
          {
            network: {
              name: network.name,
              chainId: network.evmChainId,
              rpc: network.httpRpc,
            },
            evm: {
              blockNumber,
              gasPrice: feeData.gasPrice?.toString(),
              maxFeePerGas: feeData.maxFeePerGas?.toString(),
            },
          },
          null,
          2
        )
      );
      return;
    }

    // Display network status
    printHeader("Network Status");
    printKeyValue("Network:", network.name);
    printKeyValue("Chain ID:", network.evmChainId.toString());
    printKeyValue("RPC:", network.httpRpc);
    printKeyValue("WebSocket:", network.wsRpc);

    printHeader("Live Data (EVM)");
    printKeyValue("Block Height:", blockNumber.toLocaleString(), chalk.green);
    printKeyValue(
      "Gas Price:",
      `${ethers.formatUnits(feeData.gasPrice || 0n, "gwei")} gwei`,
      chalk.green
    );

    if (feeData.maxFeePerGas) {
      printKeyValue(
        "Max Fee:",
        `${ethers.formatUnits(feeData.maxFeePerGas, "gwei")} gwei`,
        chalk.green
      );
    }

    if (network.explorer) {
      newLine();
      printKeyValue("Explorer:", network.explorer);
    }

    newLine();
    console.log(chalk.gray("Last updated: " + new Date().toLocaleTimeString()));
    newLine();

    // Try to get Substrate data (non-blocking)
    try {
      spinner.start("Fetching Substrate chain info...");
      const substrateClient = new SubstrateClient(network);

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
      printKeyValue("Spec:", `${chainInfo.specName} v${chainInfo.specVersion}`);
      printKeyValue("Block:", latestBlock.number.toLocaleString(), chalk.green);
      printKeyValue("Hash:", latestBlock.hash.slice(0, 18) + "...", chalk.gray);
      newLine();
    } catch {
      spinner.info("Substrate node unavailable (EVM-only mode)");
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
