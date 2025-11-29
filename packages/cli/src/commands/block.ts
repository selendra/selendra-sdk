/**
 * Block Explorer Command
 *
 * Query block details by number, hash, or 'latest'
 */

import chalk from "chalk";
import ora from "ora";
import { formatUnits, formatGwei, type Block, type Transaction } from "viem";
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
  formatAddress,
} from "../utils/output.js";

interface BlockOptions {
  network: string;
  json?: boolean;
  txs?: boolean;
}

/**
 * Format timestamp with relative time
 */
function formatTimestamp(timestamp: bigint): {
  formatted: string;
  relative: string;
} {
  const date = new Date(Number(timestamp) * 1000);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let relative: string;
  if (diffSeconds < 60) {
    relative = `${diffSeconds} seconds ago`;
  } else if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60);
    relative = `${mins} minute${mins > 1 ? "s" : ""} ago`;
  } else if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    relative = `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffSeconds / 86400);
    relative = `${days} day${days > 1 ? "s" : ""} ago`;
  }

  const formatted = date
    .toISOString()
    .replace("T", " ")
    .replace(".000Z", " UTC");

  return { formatted, relative };
}

/**
 * Format gas usage percentage
 */
function formatGasUsage(gasUsed: bigint, gasLimit: bigint): string {
  if (gasLimit === 0n) return "0%";
  const percentage = (Number(gasUsed) / Number(gasLimit)) * 100;
  return `${percentage.toFixed(1)}%`;
}

/**
 * Format large numbers with commas
 */
function formatNumber(num: bigint | number): string {
  return Number(num).toLocaleString();
}

/**
 * Determine if input is a block hash
 */
function isBlockHash(input: string): boolean {
  return input.startsWith("0x") && input.length === 66;
}

/**
 * Determine if input is a block number
 */
function isBlockNumber(input: string): boolean {
  return /^\d+$/.test(input);
}

/**
 * Get explorer URL for block
 */
function getExplorerUrl(
  blockNumber: bigint,
  explorer: string | null
): string | null {
  if (!explorer) return null;
  return `${explorer}/block/${blockNumber}`;
}

/**
 * Format transaction summary for display
 */
function formatTransactionSummary(tx: Transaction, index: number): string {
  const from = formatAddress(tx.from, 6);
  const to = tx.to ? formatAddress(tx.to, 6) : chalk.gray("Contract Creation");

  // Format value
  let valueDisplay: string;
  if (tx.value > 0n) {
    const value = formatBalance(tx.value);
    const numValue = parseFloat(value);
    valueDisplay =
      numValue < 0.0001 ? "<0.0001 SEL" : `${numValue.toFixed(4)} SEL`;
  } else if (tx.input && tx.input !== "0x") {
    valueDisplay = chalk.gray("Contract Call");
  } else {
    valueDisplay = chalk.gray("0 SEL");
  }

  const txHash = formatAddress(tx.hash, 8);
  const num = String(index + 1).padStart(3, " ");

  return `${chalk.gray(num + ".")} ${chalk.cyan(
    txHash
  )} ${from} → ${to} (${valueDisplay})`;
}

export async function blockCommand(
  blockIdentifier: string | undefined,
  options: BlockOptions
) {
  const networkKey = options.network as NetworkKey;

  // Default to 'latest' if no identifier provided
  const identifier = blockIdentifier || "latest";

  let network;
  try {
    network = getNetwork(networkKey);
  } catch {
    console.error(chalk.red(`Unknown network: ${options.network}`));
    console.log(chalk.gray("Available networks: mainnet, testnet, local"));
    return;
  }

  const spinner = ora(`Fetching block on ${network.name}...`).start();

  try {
    const evmClient = new EVMClient(network);
    const provider = evmClient.getProvider();

    let block: Block<bigint, boolean, "safe"> | null = null;
    let transactions: Transaction[] = [];

    // Determine how to fetch the block
    if (identifier.toLowerCase() === "latest") {
      // Fetch latest block
      block = await provider.getBlock({
        blockTag: "latest",
        includeTransactions: options.txs || false,
      });
    } else if (isBlockHash(identifier)) {
      // Fetch by hash
      block = await provider.getBlock({
        blockHash: identifier as `0x${string}`,
        includeTransactions: options.txs || false,
      });
    } else if (isBlockNumber(identifier)) {
      // Fetch by number
      const blockNumber = BigInt(identifier);
      block = await provider.getBlock({
        blockNumber,
        includeTransactions: options.txs || false,
      });
    } else {
      spinner.fail("Invalid block identifier");
      console.log();
      console.log(chalk.yellow("Valid formats:"));
      console.log(chalk.gray("  • Block number: selendra block 1000000"));
      console.log(chalk.gray("  • Block hash: selendra block 0xabc123..."));
      console.log(chalk.gray("  • Latest block: selendra block latest"));
      return;
    }

    if (!block) {
      spinner.fail("Block not found");
      console.log();
      console.log(
        chalk.yellow(
          "The block may not exist or the network may be unreachable."
        )
      );
      return;
    }

    // Extract transactions if included
    if (options.txs && block.transactions) {
      // When includeTransactions is true, transactions is Transaction[]
      // When false, it's string[] (hashes only)
      if (
        block.transactions.length > 0 &&
        typeof block.transactions[0] !== "string"
      ) {
        transactions = block.transactions as unknown as Transaction[];
      }
    }

    spinner.succeed("Block retrieved");

    // Format timestamp
    const { formatted: timestampFormatted, relative: timestampRelative } =
      formatTimestamp(block.timestamp);

    // Calculate gas usage
    const gasUsedPercent = formatGasUsage(block.gasUsed, block.gasLimit);

    // Build result object for JSON output
    const result = {
      number: Number(block.number),
      hash: block.hash,
      parentHash: block.parentHash,
      timestamp: Number(block.timestamp),
      timestampFormatted,
      transactions: {
        count: block.transactions?.length ?? 0,
        hashes: options.txs
          ? transactions.map((tx) => tx.hash)
          : typeof block.transactions?.[0] === "string"
          ? (block.transactions as string[])
          : [],
      },
      gasUsed: block.gasUsed.toString(),
      gasLimit: block.gasLimit.toString(),
      gasUsedPercent,
      baseFeePerGas: block.baseFeePerGas?.toString() ?? null,
      miner: block.miner,
      nonce: block.nonce,
      difficulty: block.difficulty?.toString() ?? null,
      size: block.size?.toString() ?? null,
      extraData: block.extraData,
      network: network.name,
      explorer: getExplorerUrl(block.number!, network.explorer),
    };

    // Output as JSON if requested
    if (options.json) {
      // Include full transaction details if --txs flag is set
      if (options.txs && transactions.length > 0) {
        (result as any).transactionDetails = transactions.map((tx) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value.toString(),
          valueFormatted: formatBalance(tx.value),
          gas: tx.gas?.toString(),
          gasPrice: tx.gasPrice?.toString(),
          nonce: tx.nonce,
          input: tx.input,
        }));
      }
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    // Display block details
    console.log();
    console.log(chalk.bold.white(`🧱 Block #${formatNumber(block.number!)}`));
    console.log(chalk.gray("─".repeat(60)));
    console.log();

    printKeyValue("Hash:", block.hash!);
    printKeyValue("Parent Hash:", block.parentHash.slice(0, 22) + "...");
    printKeyValue(
      "Timestamp:",
      `${timestampFormatted} (${chalk.green(timestampRelative)})`
    );

    newLine();
    printKeyValue(
      "Transactions:",
      formatNumber(block.transactions?.length ?? 0)
    );
    printKeyValue(
      "Gas Used:",
      `${formatNumber(block.gasUsed)} / ${formatNumber(
        block.gasLimit
      )} (${chalk.yellow(gasUsedPercent)})`
    );

    if (block.baseFeePerGas) {
      printKeyValue("Base Fee:", `${formatGwei(block.baseFeePerGas)} gwei`);
    }

    newLine();
    printKeyValue("Miner/Validator:", block.miner);

    if (block.size) {
      printKeyValue("Size:", `${formatNumber(block.size)} bytes`);
    }

    if (block.nonce) {
      printKeyValue("Nonce:", block.nonce);
    }

    // Show transactions if --txs flag is set
    if (options.txs && transactions.length > 0) {
      newLine();
      console.log(chalk.bold.white(`📝 Transactions (${transactions.length})`));
      console.log(chalk.gray("─".repeat(60)));
      console.log();

      // Limit display to first 20 transactions
      const displayLimit = 20;
      const displayTransactions = transactions.slice(0, displayLimit);

      for (let i = 0; i < displayTransactions.length; i++) {
        console.log(formatTransactionSummary(displayTransactions[i], i));
      }

      if (transactions.length > displayLimit) {
        newLine();
        console.log(
          chalk.gray(
            `  ... and ${transactions.length - displayLimit} more transactions`
          )
        );
      }
    } else if (options.txs && (block.transactions?.length ?? 0) > 0) {
      // If --txs was requested but we only have hashes
      newLine();
      console.log(
        chalk.bold.white(`📝 Transactions (${block.transactions!.length})`)
      );
      console.log(chalk.gray("─".repeat(60)));
      console.log();

      const hashes = block.transactions as string[];
      const displayLimit = 10;
      const displayHashes = hashes.slice(0, displayLimit);

      displayHashes.forEach((hash, i) => {
        const num = String(i + 1).padStart(3, " ");
        console.log(`${chalk.gray(num + ".")} ${chalk.cyan(hash)}`);
      });

      if (hashes.length > displayLimit) {
        newLine();
        console.log(
          chalk.gray(
            `  ... and ${hashes.length - displayLimit} more transactions`
          )
        );
      }
    }

    // Explorer link
    const explorerUrl = getExplorerUrl(block.number!, network.explorer);
    if (explorerUrl) {
      newLine();
      console.log(chalk.gray("View on Explorer:"));
      console.log(chalk.cyan(explorerUrl));
    }

    newLine();
  } catch (error: any) {
    spinner.fail("Failed to fetch block");
    console.error(chalk.red("Error:"), error.message);

    printTroubleshooting([
      "Check the block number or hash is correct",
      "Verify you are using the correct network",
      `Try: ${chalk.white("selendra status --network " + networkKey)}`,
      "For latest block: selendra block latest",
    ]);

    process.exit(1);
  }
}
