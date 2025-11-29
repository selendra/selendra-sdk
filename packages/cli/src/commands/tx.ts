/**
 * Transaction Lookup Command
 *
 * Query transaction details by hash (EVM)
 */

import chalk from "chalk";
import ora from "ora";
import { formatUnits, formatGwei } from "viem";
import {
  EVMClient,
  getNetwork,
  NetworkKey,
  formatBalance,
} from "../utils/client.js";
import {
  printHeader,
  printKeyValue,
  printTroubleshooting,
  newLine,
} from "../utils/output.js";

interface TxOptions {
  network: string;
  json?: boolean;
}

/**
 * Format timestamp from block
 */
function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toISOString().replace("T", " ").replace(".000Z", " UTC");
}

/**
 * Get transaction status display
 */
function getStatusDisplay(status: "success" | "reverted"): string {
  if (status === "success") {
    return chalk.green("✓ Success");
  }
  return chalk.red("✗ Failed");
}

/**
 * Get explorer URL for transaction
 */
function getExplorerUrl(hash: string, explorer: string | null): string | null {
  if (!explorer) return null;
  return `${explorer}/tx/${hash}`;
}

export async function txCommand(hash: string, options: TxOptions) {
  const networkKey = options.network as NetworkKey;

  // Validate hash format
  if (!hash.startsWith("0x") || hash.length !== 66) {
    console.error(chalk.red("Invalid transaction hash"));
    console.log(
      chalk.gray("Transaction hash must be 66 characters starting with 0x")
    );
    console.log(chalk.gray("Example: 0x1234...abcd"));
    return;
  }

  let network;
  try {
    network = getNetwork(networkKey);
  } catch {
    console.error(chalk.red(`Unknown network: ${options.network}`));
    console.log(chalk.gray("Available networks: mainnet, testnet, local"));
    return;
  }

  const spinner = ora(`Fetching transaction on ${network.name}...`).start();

  try {
    const evmClient = new EVMClient(network);
    const provider = evmClient.getProvider();

    // Fetch transaction and receipt in parallel
    const [tx, receipt] = await Promise.all([
      provider.getTransaction({ hash: hash as `0x${string}` }),
      provider.getTransactionReceipt({ hash: hash as `0x${string}` }),
    ]);

    if (!tx) {
      spinner.fail("Transaction not found");
      console.log();
      console.log(chalk.yellow("The transaction may be:"));
      console.log(chalk.gray("  • Still pending"));
      console.log(chalk.gray("  • On a different network"));
      console.log(chalk.gray("  • Invalid hash"));
      return;
    }

    // Get block for timestamp
    let blockTimestamp: bigint | null = null;
    if (tx.blockNumber) {
      const block = await provider.getBlock({ blockNumber: tx.blockNumber });
      blockTimestamp = block?.timestamp ?? null;
    }

    spinner.succeed("Transaction found");

    // Calculate fee
    const gasUsed = receipt?.gasUsed ?? 0n;
    const effectiveGasPrice = receipt?.effectiveGasPrice ?? tx.gasPrice ?? 0n;
    const fee = gasUsed * effectiveGasPrice;

    // Determine status
    const status = receipt?.status === "success" ? "success" : "reverted";

    // Build result object
    const result = {
      hash: tx.hash,
      status: status,
      blockNumber: tx.blockNumber ? Number(tx.blockNumber) : null,
      timestamp: blockTimestamp ? Number(blockTimestamp) : null,
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      valueFormatted: formatBalance(tx.value),
      gasUsed: gasUsed.toString(),
      gasPrice: effectiveGasPrice.toString(),
      gasPriceGwei: formatGwei(effectiveGasPrice),
      fee: fee.toString(),
      feeFormatted: formatBalance(fee),
      nonce: tx.nonce,
      input: tx.input,
      network: network.name,
      explorer: getExplorerUrl(hash, network.explorer),
    };

    // Output as JSON if requested
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    // Display transaction details
    console.log();
    console.log(chalk.bold.white("📋 Transaction Details"));
    console.log(chalk.gray("─".repeat(60)));
    console.log();

    printKeyValue("Hash:", tx.hash);
    printKeyValue("Status:", getStatusDisplay(status));
    printKeyValue(
      "Block:",
      tx.blockNumber
        ? Number(tx.blockNumber).toLocaleString()
        : chalk.yellow("Pending")
    );
    if (blockTimestamp) {
      printKeyValue("Timestamp:", formatTimestamp(blockTimestamp));
    }

    newLine();
    printKeyValue("From:", tx.from);
    printKeyValue("To:", tx.to ?? chalk.gray("Contract Creation"));
    printKeyValue("Value:", `${formatBalance(tx.value)} SEL`, chalk.green);

    newLine();
    printKeyValue("Gas Used:", gasUsed.toLocaleString());
    printKeyValue("Gas Price:", `${formatGwei(effectiveGasPrice)} gwei`);
    printKeyValue("Fee:", `${formatBalance(fee)} SEL`, chalk.yellow);

    if (tx.nonce !== undefined) {
      newLine();
      printKeyValue("Nonce:", tx.nonce.toString());
    }

    // Show input data indicator
    if (tx.input && tx.input !== "0x") {
      newLine();
      printKeyValue(
        "Input Data:",
        chalk.gray(
          `${tx.input.slice(0, 20)}... (${(tx.input.length - 2) / 2} bytes)`
        )
      );
    }

    // Explorer link
    const explorerUrl = getExplorerUrl(hash, network.explorer);
    if (explorerUrl) {
      newLine();
      console.log(chalk.gray("View on Explorer:"));
      console.log(chalk.cyan(explorerUrl));
    }

    newLine();
  } catch (error: any) {
    spinner.fail("Failed to fetch transaction");
    console.error(chalk.red("Error:"), error.message);

    printTroubleshooting([
      "Check the transaction hash is correct",
      "Verify you are using the correct network",
      `Try: ${chalk.white("selendra status --network " + networkKey)}`,
    ]);

    process.exit(1);
  }
}
