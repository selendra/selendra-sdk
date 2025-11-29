/**
 * Logs Command (TASK-010)
 *
 * Query and filter contract event logs
 */

import chalk from "chalk";
import ora from "ora";
import fs from "fs/promises";
import path from "path";
import {
  isAddress,
  parseAbiItem,
  decodeEventLog,
  formatEther,
  type Abi,
  type Log,
} from "viem";
import { EVMClient, getNetwork, NetworkKey } from "../utils/client.js";
import {
  printHeader,
  printKeyValue,
  printSuccess,
  printWarning,
  printInfo,
  printJson,
  newLine,
} from "../utils/output.js";

interface LogsOptions {
  network?: string;
  event?: string;
  fromBlock?: string;
  toBlock?: string;
  abi?: string;
  watch?: boolean;
  json?: boolean;
  limit?: string;
}

/**
 * Load ABI from file
 */
async function loadAbi(abiPath: string): Promise<Abi> {
  try {
    const content = await fs.readFile(abiPath, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : parsed.abi;
  } catch (error: any) {
    throw new Error(`Failed to load ABI: ${error.message}`);
  }
}

/**
 * Try to find ABI for a contract address
 */
async function findAbiForAddress(address: string): Promise<Abi | null> {
  // Check deployments.json
  try {
    const deploymentsPath = path.join(process.cwd(), "deployments.json");
    const content = await fs.readFile(deploymentsPath, "utf-8");
    const deployments = JSON.parse(content);

    for (const network of Object.values(deployments) as any[]) {
      for (const [contractName, data] of Object.entries(network) as any[]) {
        if (data.address?.toLowerCase() === address.toLowerCase()) {
          // Found contract, now find its artifact
          const artifactPath = path.join(
            process.cwd(),
            "artifacts",
            "contracts",
            `${contractName}.sol`,
            `${contractName}.json`
          );
          try {
            const artifact = JSON.parse(
              await fs.readFile(artifactPath, "utf-8")
            );
            return artifact.abi;
          } catch {
            // Continue
          }
        }
      }
    }
  } catch {
    // No deployments.json
  }

  return null;
}

/**
 * Format event log for display
 */
function formatEventLog(
  log: Log,
  decoded: { eventName: string; args: Record<string, unknown> } | null,
  showJson: boolean
): void {
  if (showJson) {
    console.log(
      JSON.stringify(
        {
          blockNumber: Number(log.blockNumber),
          transactionHash: log.transactionHash,
          logIndex: log.logIndex,
          address: log.address,
          eventName: decoded?.eventName,
          args: decoded?.args
            ? Object.fromEntries(
                Object.entries(decoded.args).map(([k, v]) => [
                  k,
                  typeof v === "bigint" ? v.toString() : v,
                ])
              )
            : null,
          topics: log.topics,
          data: log.data,
        },
        null,
        2
      )
    );
    return;
  }

  console.log(chalk.gray("─".repeat(60)));

  if (decoded) {
    console.log(
      chalk.bold.cyan(`Event: ${decoded.eventName}`) +
        chalk.gray(` @ block ${log.blockNumber}`)
    );

    for (const [key, value] of Object.entries(decoded.args || {})) {
      let displayValue: string;
      if (typeof value === "bigint") {
        displayValue =
          value > 10n ** 15n
            ? `${formatEther(value)} (${value})`
            : value.toString();
      } else if (typeof value === "object") {
        displayValue = JSON.stringify(value);
      } else {
        displayValue = String(value);
      }
      console.log(chalk.gray(`  ${key}: `) + chalk.white(displayValue));
    }
  } else {
    console.log(
      chalk.bold.yellow(`Unknown Event`) +
        chalk.gray(` @ block ${log.blockNumber}`)
    );
    console.log(chalk.gray("  Topics:"));
    for (const topic of log.topics) {
      console.log(chalk.gray(`    ${topic}`));
    }
    if (log.data && log.data !== "0x") {
      console.log(chalk.gray(`  Data: ${log.data.slice(0, 66)}...`));
    }
  }

  console.log(chalk.gray(`  Tx: ${log.transactionHash?.slice(0, 18)}...`));
}

/**
 * Get event signature from ABI
 */
function getEventFromAbi(
  abi: Abi,
  eventName: string
): { name: string; inputs: readonly any[] } | null {
  for (const item of abi) {
    if (item.type === "event" && item.name === eventName) {
      return item as { name: string; inputs: readonly any[] };
    }
  }
  return null;
}

export async function logsCommand(
  contractAddress: string,
  options: LogsOptions
) {
  // Validate address
  if (!isAddress(contractAddress)) {
    console.error(chalk.red("Invalid contract address"));
    process.exit(1);
    return;
  }

  const networkKey = (options.network || "mainnet") as NetworkKey;
  const network = getNetwork(networkKey);

  if (!options.json) {
    printHeader("Contract Event Logs");
    printKeyValue("Contract:", contractAddress);
    printKeyValue("Network:", network.name);
    if (options.event) {
      printKeyValue("Event Filter:", options.event);
    }
    newLine();
  }

  const spinner = ora("Fetching logs...").start();

  try {
    const evmClient = new EVMClient(network);
    const publicClient = evmClient.getProvider();

    // Load ABI if provided or try to find it
    let abi: Abi | null = null;
    if (options.abi) {
      abi = await loadAbi(options.abi);
    } else {
      abi = await findAbiForAddress(contractAddress);
    }

    // Determine block range
    const latestBlock = await publicClient.getBlockNumber();
    const fromBlock = options.fromBlock
      ? BigInt(options.fromBlock)
      : latestBlock - 10000n; // Default to last 10000 blocks
    const toBlock = options.toBlock ? BigInt(options.toBlock) : latestBlock;

    // Build event filter
    let eventSignature: `0x${string}` | undefined;
    let eventAbi: { name: string; inputs: readonly any[] } | null = null;

    if (options.event && abi) {
      eventAbi = getEventFromAbi(abi, options.event);
      if (!eventAbi) {
        spinner.warn(`Event '${options.event}' not found in ABI`);
      }
    }

    // Fetch logs
    const logs = await publicClient.getLogs({
      address: contractAddress as `0x${string}`,
      fromBlock,
      toBlock,
    });

    const limit = options.limit ? parseInt(options.limit) : 50;
    const filteredLogs = logs.slice(-limit);

    spinner.succeed(
      `Found ${logs.length} logs (showing last ${filteredLogs.length})`
    );

    if (!options.json) {
      newLine();
      printKeyValue("Block Range:", `${fromBlock} → ${toBlock}`);
      printKeyValue("Total Logs:", logs.length.toString());
      newLine();
    }

    if (filteredLogs.length === 0) {
      printWarning("No events found in the specified range");
      newLine();
      printInfo("Try expanding the block range:");
      console.log(
        chalk.gray(
          `  selendra logs ${contractAddress} --from-block ${
            latestBlock - 50000n
          }`
        )
      );
      return;
    }

    // Process and display logs
    for (const log of filteredLogs) {
      let decoded: { eventName: string; args: Record<string, unknown> } | null =
        null;

      if (abi) {
        try {
          const result = decodeEventLog({
            abi,
            data: log.data,
            topics: log.topics,
          });
          const args = result.args;
          decoded = {
            eventName: result.eventName || "Unknown",
            args:
              typeof args === "object" && args !== null && !Array.isArray(args)
                ? (args as unknown as Record<string, unknown>)
                : {},
          };
        } catch {
          // Could not decode, show raw
        }
      }

      // Filter by event name if specified
      if (options.event && decoded?.eventName !== options.event) {
        continue;
      }

      formatEventLog(log, decoded, !!options.json);
    }

    if (!options.json) {
      newLine();
    }

    // Watch mode
    if (options.watch) {
      if (!options.json) {
        printInfo("Watching for new events... (Ctrl+C to stop)");
        newLine();
      }

      const unwatch = publicClient.watchEvent({
        address: contractAddress as `0x${string}`,
        onLogs: (newLogs) => {
          for (const log of newLogs) {
            let decoded: {
              eventName: string;
              args: Record<string, unknown>;
            } | null = null;

            if (abi) {
              try {
                const result = decodeEventLog({
                  abi,
                  data: log.data,
                  topics: log.topics,
                });
                const args = result.args;
                decoded = {
                  eventName: result.eventName || "Unknown",
                  args:
                    typeof args === "object" &&
                    args !== null &&
                    !Array.isArray(args)
                      ? (args as unknown as Record<string, unknown>)
                      : {},
                };
              } catch {
                // Could not decode
              }
            }

            if (options.event && decoded?.eventName !== options.event) {
              return;
            }

            formatEventLog(log, decoded, !!options.json);
          }
        },
      });

      // Keep process running
      process.on("SIGINT", () => {
        unwatch();
        console.log(chalk.gray("\nStopped watching"));
        process.exit(0);
      });

      // Keep alive
      await new Promise(() => {});
    }
  } catch (error: any) {
    spinner.fail("Failed to fetch logs");
    console.error(chalk.red("Error:"), error.message);
    process.exit(1);
  }
}
