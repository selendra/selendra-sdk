/**
 * Gas Command
 *
 * Show current gas prices and estimation for common operations
 */

import chalk from "chalk";
import ora from "ora";
import { formatGwei, formatUnits } from "viem";
import { EVMClient, getNetwork, NetworkKey } from "../utils/client.js";
import {
  printHeader,
  printKeyValue,
  printTroubleshooting,
  newLine,
} from "../utils/output.js";

interface GasOptions {
  network: string;
  json?: boolean;
}

/**
 * Gas estimates for common operations (in gas units)
 */
const GAS_ESTIMATES = {
  simpleTransfer: 21000n,
  tokenTransfer: 65000n,
  contractDeploy: 500000n,
} as const;

/**
 * Calculate cost in SEL for a given gas amount and gas price
 */
function calculateCost(gasUnits: bigint, gasPrice: bigint): bigint {
  return gasUnits * gasPrice;
}

/**
 * Format gas units with commas for display
 */
function formatGasUnits(gas: bigint): string {
  return Number(gas).toLocaleString();
}

/**
 * Format cost in SEL with appropriate precision
 */
function formatCostSEL(cost: bigint): string {
  const formatted = formatUnits(cost, 18);
  // Format to show significant digits without excessive trailing zeros
  const num = parseFloat(formatted);
  if (num === 0) return "0";
  if (num < 0.000001) return num.toExponential(2);
  if (num < 0.01) return num.toFixed(7);
  if (num < 1) return num.toFixed(6);
  return num.toFixed(4);
}

export async function gasCommand(options: GasOptions) {
  const networkKey = options.network as NetworkKey;

  let network;
  try {
    network = getNetwork(networkKey);
  } catch {
    console.error(chalk.red(`Unknown network: ${options.network}`));
    console.log(chalk.gray("Available networks: mainnet, testnet, local"));
    return;
  }

  const spinner = ora(`Fetching gas prices from ${network.name}...`).start();

  try {
    const evmClient = new EVMClient(network);

    // Fetch gas data
    const [gasPrice, block] = await Promise.all([
      evmClient.getGasPrice(),
      evmClient.getProvider().getBlock(),
    ]);

    // Calculate EIP-1559 values if available
    const baseFee = block.baseFeePerGas;
    const priorityFee = baseFee ? 1000000000n : undefined; // 1 gwei default priority fee
    const maxFee = baseFee ? baseFee * 2n + (priorityFee || 0n) : undefined;

    // Calculate estimated costs
    const simpleTransferCost = calculateCost(
      GAS_ESTIMATES.simpleTransfer,
      gasPrice
    );
    const tokenTransferCost = calculateCost(
      GAS_ESTIMATES.tokenTransfer,
      gasPrice
    );
    const contractDeployCost = calculateCost(
      GAS_ESTIMATES.contractDeploy,
      gasPrice
    );

    spinner.succeed("Gas prices retrieved");

    // Output as JSON if requested
    if (options.json) {
      const jsonOutput = {
        network: network.name,
        chainId: network.evmChainId,
        gasPrice: {
          wei: gasPrice.toString(),
          gwei: formatGwei(gasPrice),
        },
        eip1559: baseFee
          ? {
              baseFee: {
                wei: baseFee.toString(),
                gwei: formatGwei(baseFee),
              },
              priorityFee: {
                wei: priorityFee?.toString() || "0",
                gwei: priorityFee ? formatGwei(priorityFee) : "0",
              },
              maxFee: {
                wei: maxFee?.toString() || "0",
                gwei: maxFee ? formatGwei(maxFee) : "0",
              },
            }
          : null,
        estimates: {
          simpleTransfer: {
            gasUnits: GAS_ESTIMATES.simpleTransfer.toString(),
            costWei: simpleTransferCost.toString(),
            costSEL: formatCostSEL(simpleTransferCost),
          },
          tokenTransfer: {
            gasUnits: GAS_ESTIMATES.tokenTransfer.toString(),
            costWei: tokenTransferCost.toString(),
            costSEL: formatCostSEL(tokenTransferCost),
          },
          contractDeploy: {
            gasUnits: GAS_ESTIMATES.contractDeploy.toString(),
            costWei: contractDeployCost.toString(),
            costSEL: formatCostSEL(contractDeployCost),
          },
        },
        timestamp: new Date().toISOString(),
      };

      console.log(JSON.stringify(jsonOutput, null, 2));
      return;
    }

    // Display gas prices
    console.log();
    console.log(chalk.bold.white(`⛽ Gas Prices on ${network.name}`));
    console.log(chalk.gray("─".repeat(40)));

    printKeyValue("Gas Price:", `${formatGwei(gasPrice)} gwei`, chalk.green);

    if (baseFee) {
      printKeyValue("Base Fee:", `${formatGwei(baseFee)} gwei`, chalk.cyan);
      if (priorityFee) {
        printKeyValue(
          "Priority Fee:",
          `${formatGwei(priorityFee)} gwei`,
          chalk.cyan
        );
      }
      if (maxFee) {
        printKeyValue("Max Fee:", `${formatGwei(maxFee)} gwei`, chalk.gray);
      }
    } else {
      console.log(chalk.gray("  (Legacy gas pricing - EIP-1559 not active)"));
    }

    newLine();
    console.log(chalk.bold.white("📊 Estimated Costs"));
    console.log(chalk.gray("─".repeat(40)));

    // Simple Transfer
    console.log(
      chalk.cyan("Simple Transfer:".padEnd(20)) +
        chalk.green(`${formatCostSEL(simpleTransferCost)} SEL`.padEnd(18)) +
        chalk.gray(`(~${formatGasUnits(GAS_ESTIMATES.simpleTransfer)} gas)`)
    );

    // Token Transfer
    console.log(
      chalk.cyan("Token Transfer:".padEnd(20)) +
        chalk.green(`${formatCostSEL(tokenTransferCost)} SEL`.padEnd(18)) +
        chalk.gray(`(~${formatGasUnits(GAS_ESTIMATES.tokenTransfer)} gas)`)
    );

    // Contract Deploy
    console.log(
      chalk.cyan("Contract Deploy:".padEnd(20)) +
        chalk.green(`${formatCostSEL(contractDeployCost)} SEL`.padEnd(18)) +
        chalk.gray(`(~${formatGasUnits(GAS_ESTIMATES.contractDeploy)} gas)`)
    );

    newLine();
    console.log(chalk.gray("Last updated: " + new Date().toLocaleTimeString()));

    if (network.explorer) {
      newLine();
      console.log(chalk.gray("View gas tracker:"));
      console.log(chalk.cyan(`${network.explorer}/gastracker`));
    }

    newLine();
  } catch (error: any) {
    spinner.fail("Failed to fetch gas prices");
    console.error(chalk.red("Error:"), error.message);

    printTroubleshooting([
      "Check your internet connection",
      "Verify the network is operational",
      `Try: ${chalk.white("selendra status --network " + networkKey)}`,
    ]);

    process.exit(1);
  }
}
