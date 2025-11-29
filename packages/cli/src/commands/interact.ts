/**
 * Interact Command (TASK-007)
 *
 * Interactive contract REPL for reading and writing to contracts
 */

import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import fs from "fs/promises";
import path from "path";
import {
  isAddress,
  formatEther,
  parseEther,
  formatUnits,
  parseUnits,
  type Abi,
  type AbiFunction,
} from "viem";
import {
  EVMClient,
  getNetwork,
  NetworkKey,
  getPrivateKey,
} from "../utils/client.js";
import {
  printHeader,
  printKeyValue,
  printSuccess,
  printError,
  printWarning,
  printInfo,
  newLine,
} from "../utils/output.js";
import { promptNetwork, promptConfirm } from "../utils/prompts.js";

interface InteractOptions {
  network?: string;
  abi?: string;
}

interface ContractFunction {
  name: string;
  type: "read" | "write";
  inputs: { name: string; type: string }[];
  outputs: { name: string; type: string }[];
  stateMutability: string;
}

/**
 * Load ABI from file or artifact
 */
async function loadAbi(
  contractAddress: string,
  abiPath?: string
): Promise<Abi> {
  // If explicit ABI path provided
  if (abiPath) {
    try {
      const content = await fs.readFile(abiPath, "utf-8");
      const parsed = JSON.parse(content);
      // Handle both raw ABI arrays and artifact files
      return Array.isArray(parsed) ? parsed : parsed.abi;
    } catch (error: any) {
      throw new Error(`Failed to load ABI from ${abiPath}: ${error.message}`);
    }
  }

  // Try to find artifact in common locations
  const searchPaths = [
    // Hardhat artifacts
    path.join(process.cwd(), "artifacts", "**", "*.json"),
    // Foundry out
    path.join(process.cwd(), "out", "**", "*.json"),
    // deployments.json
    path.join(process.cwd(), "deployments.json"),
  ];

  // Check deployments.json first
  try {
    const deploymentsPath = path.join(process.cwd(), "deployments.json");
    const content = await fs.readFile(deploymentsPath, "utf-8");
    const deployments = JSON.parse(content);

    // Search for matching address in deployments
    for (const network of Object.values(deployments) as any[]) {
      for (const [contractName, data] of Object.entries(network) as any[]) {
        if (data.address?.toLowerCase() === contractAddress.toLowerCase()) {
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
            // Continue searching
          }
        }
      }
    }
  } catch {
    // No deployments.json, continue
  }

  throw new Error(
    "Could not find ABI. Please provide --abi path to the ABI JSON file."
  );
}

/**
 * Parse ABI into function list
 */
function parseFunctions(abi: Abi): ContractFunction[] {
  const functions: ContractFunction[] = [];

  for (const item of abi) {
    if (item.type === "function") {
      const fn = item as AbiFunction;
      functions.push({
        name: fn.name,
        type:
          fn.stateMutability === "view" || fn.stateMutability === "pure"
            ? "read"
            : "write",
        inputs: fn.inputs.map((i) => ({
          name: i.name || "param",
          type: i.type,
        })),
        outputs: (fn.outputs || []).map((o) => ({
          name: o.name || "result",
          type: o.type,
        })),
        stateMutability: fn.stateMutability,
      });
    }
  }

  return functions.sort((a, b) => {
    // Sort reads before writes, then alphabetically
    if (a.type !== b.type) return a.type === "read" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Format function signature for display
 */
function formatFunctionSignature(fn: ContractFunction): string {
  const inputs = fn.inputs.map((i) => `${i.type} ${i.name}`).join(", ");
  const outputs = fn.outputs.map((o) => o.type).join(", ");
  const returnType = outputs ? ` → ${outputs}` : "";
  const icon = fn.type === "read" ? "📖" : "✏️";
  return `${icon} ${fn.name}(${inputs})${returnType}`;
}

/**
 * Parse user input to typed value
 */
function parseInputValue(value: string, type: string): unknown {
  // Handle arrays
  if (type.endsWith("[]")) {
    try {
      return JSON.parse(value);
    } catch {
      return value.split(",").map((v) => v.trim());
    }
  }

  // Handle common types
  if (type === "bool") {
    return value.toLowerCase() === "true" || value === "1";
  }
  if (type.startsWith("uint") || type.startsWith("int")) {
    return BigInt(value);
  }
  if (type === "address") {
    return value as `0x${string}`;
  }
  if (type.startsWith("bytes")) {
    return value.startsWith("0x") ? value : `0x${value}`;
  }

  return value;
}

/**
 * Format output value for display
 */
function formatOutputValue(value: unknown, type: string): string {
  if (value === undefined || value === null) return "null";

  if (typeof value === "bigint") {
    // Check if it looks like a token amount (large number)
    if (value > 10n ** 15n) {
      return `${formatEther(value)} (${value.toString()})`;
    }
    return value.toString();
  }

  if (Array.isArray(value)) {
    return JSON.stringify(
      value.map((v) => formatOutputValue(v, "")),
      null,
      2
    );
  }

  if (typeof value === "object") {
    return JSON.stringify(
      value,
      (_, v) => (typeof v === "bigint" ? v.toString() : v),
      2
    );
  }

  return String(value);
}

/**
 * Interactive contract session
 */
async function runInteractiveSession(
  contractAddress: `0x${string}`,
  abi: Abi,
  network: ReturnType<typeof getNetwork>
) {
  const functions = parseFunctions(abi);
  const readFunctions = functions.filter((f) => f.type === "read");
  const writeFunctions = functions.filter((f) => f.type === "write");

  const evmClient = new EVMClient(network);
  const publicClient = evmClient.getProvider();

  let privateKey: `0x${string}` | null = null;

  printHeader(`Contract: ${contractAddress}`);
  printKeyValue("Network:", network.name);
  printKeyValue("Read Functions:", readFunctions.length.toString());
  printKeyValue("Write Functions:", writeFunctions.length.toString());
  newLine();

  console.log(chalk.gray("Type 'help' for commands, 'exit' to quit"));
  newLine();

  // Main REPL loop
  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Select action:",
        choices: [
          { name: "📖 Call read function", value: "read" },
          { name: "✏️  Call write function", value: "write" },
          new inquirer.Separator(),
          { name: "📋 List all functions", value: "list" },
          { name: "🔑 Set private key", value: "key" },
          { name: "❌ Exit", value: "exit" },
        ],
      },
    ]);

    if (action === "exit") {
      console.log(chalk.gray("Goodbye!"));
      break;
    }

    if (action === "list") {
      printHeader("Available Functions");
      console.log(chalk.bold.cyan("\nRead Functions:"));
      for (const fn of readFunctions) {
        console.log(chalk.gray("  " + formatFunctionSignature(fn)));
      }
      console.log(chalk.bold.yellow("\nWrite Functions:"));
      for (const fn of writeFunctions) {
        console.log(chalk.gray("  " + formatFunctionSignature(fn)));
      }
      newLine();
      continue;
    }

    if (action === "key") {
      try {
        privateKey = getPrivateKey();
        const account = evmClient.getAccount(privateKey);
        printSuccess(`Private key set. Address: ${account.address}`);
      } catch {
        const { key } = await inquirer.prompt([
          {
            type: "password",
            name: "key",
            message: "Enter private key:",
            mask: "*",
          },
        ]);
        if (key) {
          privateKey = (
            key.startsWith("0x") ? key : `0x${key}`
          ) as `0x${string}`;
          const account = evmClient.getAccount(privateKey);
          printSuccess(`Private key set. Address: ${account.address}`);
        }
      }
      continue;
    }

    // Select function
    const targetFunctions = action === "read" ? readFunctions : writeFunctions;

    if (targetFunctions.length === 0) {
      printWarning(`No ${action} functions available`);
      continue;
    }

    const { selectedFn } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedFn",
        message: "Select function:",
        choices: targetFunctions.map((fn) => ({
          name: formatFunctionSignature(fn),
          value: fn,
        })),
      },
    ]);

    // Collect inputs
    const args: unknown[] = [];
    for (const input of selectedFn.inputs) {
      const { value } = await inquirer.prompt([
        {
          type: "input",
          name: "value",
          message: `${input.name} (${input.type}):`,
        },
      ]);
      args.push(parseInputValue(value, input.type));
    }

    // Execute function
    const spinner = ora(`Calling ${selectedFn.name}...`).start();

    try {
      if (action === "read") {
        const result = await publicClient.readContract({
          address: contractAddress,
          abi,
          functionName: selectedFn.name,
          args,
        });

        spinner.succeed(`${selectedFn.name} completed`);
        newLine();

        printHeader("Result");
        console.log(
          chalk.green(
            formatOutputValue(result, selectedFn.outputs[0]?.type || "")
          )
        );
        newLine();
      } else {
        // Write function
        if (!privateKey) {
          spinner.fail("Private key required for write functions");
          printInfo("Use 'Set private key' option or set PRIVATE_KEY env var");
          continue;
        }

        const walletClient = evmClient.getWalletClient(privateKey);
        const account = evmClient.getAccount(privateKey);

        // Confirm transaction
        spinner.stop();
        const confirm = await promptConfirm(
          `Send transaction from ${account.address}?`
        );
        if (!confirm) {
          console.log(chalk.yellow("Transaction cancelled"));
          continue;
        }

        spinner.start("Sending transaction...");

        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi,
          functionName: selectedFn.name,
          args,
        });

        spinner.text = "Waiting for confirmation...";

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        spinner.succeed("Transaction confirmed!");
        newLine();

        printHeader("Transaction Details");
        printKeyValue("Hash:", hash);
        printKeyValue("Block:", receipt.blockNumber.toString());
        printKeyValue("Gas Used:", receipt.gasUsed.toString());

        if (network.explorer) {
          newLine();
          console.log(chalk.cyan(`${network.explorer}/tx/${hash}`));
        }
        newLine();
      }
    } catch (error: any) {
      spinner.fail(`${selectedFn.name} failed`);
      printError(error.message);
      newLine();
    }
  }
}

export async function interactCommand(
  contractAddress: string,
  options: InteractOptions
) {
  // Validate address
  if (!isAddress(contractAddress)) {
    console.error(chalk.red("Invalid contract address"));
    process.exit(1);
    return;
  }

  printHeader("Contract Interaction");

  // Select network
  let networkKey: NetworkKey;
  if (options.network) {
    networkKey = options.network as NetworkKey;
  } else {
    networkKey = await promptNetwork();
  }

  const network = getNetwork(networkKey);

  const spinner = ora("Loading contract ABI...").start();

  try {
    const abi = await loadAbi(contractAddress, options.abi);
    spinner.succeed(`Loaded ${abi.length} ABI entries`);

    await runInteractiveSession(contractAddress as `0x${string}`, abi, network);
  } catch (error: any) {
    spinner.fail("Failed to load contract");
    console.error(chalk.red("Error:"), error.message);
    process.exit(1);
  }
}
