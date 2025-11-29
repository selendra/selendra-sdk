#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import dotenv from "dotenv";

// Load environment variables silently
dotenv.config({ debug: false });

// Import commands
import { statusCommand } from "./commands/status.js";
import { accountCommand } from "./commands/account.js";
import { faucetCommand } from "./commands/faucet.js";
import { initCommand } from "./commands/init.js";
import { compileCommand } from "./commands/compile.js";
import { deployCommand } from "./commands/deploy.js";
import { verifyCommand } from "./commands/verify.js";
import { balanceCommand } from "./commands/balance.js";
import { transferCommand } from "./commands/transfer.js";
import { chainCommand } from "./commands/chain.js";
import { blockCommand } from "./commands/block.js";
import { stakeCommand } from "./commands/stake.js";
import { txCommand } from "./commands/tx.js";
import { gasCommand } from "./commands/gas.js";
import { logsCommand } from "./commands/logs.js";
import { interactCommand } from "./commands/interact.js";
import { abiCommand, abiSubcommands } from "./commands/abi.js";
import { learnCommand } from "./commands/learn.js";
import { pluginCommand, loadInstalledPlugins } from "./commands/plugin.js";

// Import configuration utilities
import { defineConfig, type SelendraConfig } from "./utils/config.js";
export { defineConfig, type SelendraConfig };

const program = new Command();

program
  .name("selendra")
  .description("CLI tool for Selendra blockchain development")
  .version("0.2.1");

// ========================================
// Project Commands
// ========================================

// Initialize project
program
  .command("init")
  .description("Initialize a new Selendra project")
  .argument("<project-name>", "Name of the project")
  .option("-t, --template <template>", "Template to use (evm|wasm)")
  .action(initCommand);

// Compile contracts
program
  .command("compile")
  .description("Compile smart contracts")
  .option("--target <target>", "Target platform (evm|wasm)")
  .action(compileCommand);

// Deploy contracts
program
  .command("deploy")
  .description("Deploy smart contract")
  .argument("<contract>", "Contract name to deploy")
  .option(
    "-n, --network <network>",
    "Network to deploy to (mainnet|testnet|local)"
  )
  .option(
    "--args <args>",
    "Constructor arguments (JSON array or comma-separated)"
  )
  .option("--gas <gas>", "Gas limit")
  .action(deployCommand);

// Verify contracts
program
  .command("verify")
  .description("Verify smart contract source on explorer")
  .argument("<address>", "Contract address to verify")
  .argument("<contract>", "Contract name (e.g., MyContract)")
  .option(
    "-n, --network <network>",
    "Network to verify on (mainnet|testnet)",
    "mainnet"
  )
  .option("--compiler <version>", "Compiler version (e.g., 0.8.20)")
  .option("--optimization", "Enable optimization (default: true)")
  .option("--runs <runs>", "Optimization runs (default: 200)")
  .option("--constructor <args>", "ABI-encoded constructor arguments")
  .option("--license <license>", "SPDX license identifier")
  .action(verifyCommand);

// ========================================
// Network Commands
// ========================================

// Network status
program
  .command("status")
  .description("Show network status and statistics")
  .option(
    "-n, --network <network>",
    "Network to query (mainnet|testnet|local)",
    "mainnet"
  )
  .option("--json", "Output as JSON")
  .option("--health", "Show detailed health metrics")
  .option("-w, --watch", "Watch for updates")
  .action(statusCommand);

// Chain info
program
  .command("chain")
  .description("Show chain information")
  .option(
    "-n, --network <network>",
    "Network to query (mainnet|testnet|local)",
    "mainnet"
  )
  .option("--json", "Output as JSON")
  .action(chainCommand);

// Block info
program
  .command("block")
  .description("Show block information")
  .argument("[identifier]", "Block number, hash, or 'latest' (default: latest)")
  .option(
    "-n, --network <network>",
    "Network to query (mainnet|testnet|local)",
    "mainnet"
  )
  .option("--json", "Output as JSON")
  .option("--txs", "Include transaction details")
  .action(blockCommand);

// Transaction lookup
program
  .command("tx")
  .description("Look up transaction details by hash")
  .argument("<hash>", "Transaction hash (0x...)")
  .option(
    "-n, --network <network>",
    "Network to query (mainnet|testnet|local)",
    "mainnet"
  )
  .option("--json", "Output as JSON")
  .action(txCommand);

// Gas estimation
program
  .command("gas")
  .description("Show current gas prices and estimation")
  .option(
    "-n, --network <network>",
    "Network to query (mainnet|testnet|local)",
    "mainnet"
  )
  .option("--json", "Output as JSON")
  .action(gasCommand);

// Event logs
program
  .command("logs")
  .description("Query contract event logs")
  .argument("<address>", "Contract address to query logs for")
  .option(
    "-n, --network <network>",
    "Network to query (mainnet|testnet|local)",
    "mainnet"
  )
  .option("-e, --event <event>", "Filter by event name")
  .option("--from-block <block>", "Start block number")
  .option("--to-block <block>", "End block number")
  .option("--abi <path>", "Path to ABI file for decoding")
  .option("-w, --watch", "Watch for new events")
  .option("--json", "Output as JSON")
  .option("-l, --limit <limit>", "Maximum logs to show", "50")
  .action(logsCommand);

// Interactive contract
program
  .command("interact")
  .description("Interactive contract REPL")
  .argument("<address>", "Contract address")
  .option("-a, --abi <path>", "Path to ABI file")
  .option(
    "-n, --network <network>",
    "Network to use (mainnet|testnet|local)",
    "mainnet"
  )
  .action(interactCommand);

// ABI management
const abiProg = program.command("abi").description("Manage contract ABIs");

abiProg
  .command("export")
  .description("Export ABI from compiled contract")
  .argument("<contract>", "Contract name")
  .option("-o, --output <path>", "Output file path")
  .action(abiSubcommands.export);

abiProg
  .command("import")
  .description("Import ABI from file or verified contract")
  .argument("<source>", "ABI file path or contract address")
  .option("-n, --name <name>", "Name to save ABI as")
  .option("--network <network>", "Network for fetching from explorer")
  .action(abiSubcommands.import);

abiProg
  .command("list")
  .description("List saved ABIs")
  .action(abiSubcommands.list);

abiProg
  .command("types")
  .description("Generate TypeScript types from ABI")
  .argument("<abi>", "ABI name or path")
  .option("-o, --output <path>", "Output file path")
  .action(abiSubcommands.types);

// ========================================
// Account Commands
// ========================================

// Account management
program
  .command("account")
  .description("Manage accounts and keys")
  .argument(
    "[action]",
    "Action to perform (new|new-substrate|list|import)",
    "list"
  )
  .action(accountCommand);

// Balance
program
  .command("balance")
  .description("Check account balance")
  .argument("<address>", "Address to check")
  .option(
    "-n, --network <network>",
    "Network to query (mainnet|testnet|local)",
    "mainnet"
  )
  .option("--json", "Output as JSON")
  .action(balanceCommand);

// Transfer
program
  .command("transfer")
  .description("Transfer SEL tokens")
  .argument("<to>", "Recipient address")
  .option("-n, --network <network>", "Network to use (mainnet|testnet|local)")
  .option("-a, --amount <amount>", "Amount to transfer in SEL")
  .action(transferCommand);

// Faucet
program
  .command("faucet")
  .description("Request testnet tokens")
  .argument("<address>", "Address to send tokens to")
  .action(faucetCommand);

// ========================================
// Staking Commands
// ========================================

// Staking
program
  .command("stake")
  .description("Staking and nomination pools")
  .argument("[action]", "Action: info|pools|join|claim|unbond", "info")
  .option("-n, --network <network>", "Network to use (mainnet|testnet|local)")
  .option("-p, --pool <pool>", "Pool ID")
  .option("-a, --amount <amount>", "Amount to stake")
  .action(stakeCommand);

// ========================================
// Learning & Plugins
// ========================================

// Interactive tutorials
program
  .command("learn")
  .description("Interactive tutorials for learning Selendra")
  .argument("[topic]", "Tutorial topic to start")
  .option("-l, --list", "List available tutorials")
  .option("--reset", "Reset tutorial progress")
  .action(learnCommand);

// Plugin management
const pluginProg = program.command("plugin").description("Manage CLI plugins");

pluginProg
  .command("install")
  .description("Install a plugin")
  .argument("<source>", "Plugin name, path, or git URL")
  .option("--local", "Install from local path")
  .option("--git", "Install from git repository")
  .action((source: string, options: any) => pluginCommand("install", source, options));

pluginProg
  .command("uninstall")
  .description("Uninstall a plugin")
  .argument("<plugin>", "Plugin name to uninstall")
  .action((plugin: string) => pluginCommand("uninstall", plugin));

pluginProg
  .command("list")
  .description("List plugins")
  .option("-a, --available", "Show available plugins")
  .action((options: any) => pluginCommand("list", undefined, options));

pluginProg
  .command("enable")
  .description("Enable a plugin")
  .argument("<plugin>", "Plugin name")
  .action((plugin: string) => pluginCommand("enable", plugin));

pluginProg
  .command("disable")
  .description("Disable a plugin")
  .argument("<plugin>", "Plugin name")
  .action((plugin: string) => pluginCommand("disable", plugin));

pluginProg
  .command("update")
  .description("Update plugins")
  .argument("[plugin]", "Plugin to update (updates all if omitted)")
  .action((plugin?: string) => pluginCommand("update", plugin));

pluginProg
  .command("info")
  .description("Show plugin information")
  .argument("<plugin>", "Plugin name")
  .action((plugin: string) => pluginCommand("info", plugin));

pluginProg
  .command("create")
  .description("Create a new plugin")
  .argument("[name]", "Plugin name")
  .action((name?: string) => pluginCommand("create", name));

// Load installed plugins
try {
  loadInstalledPlugins(program);
} catch {
  // Silently ignore plugin loading errors
}

// ========================================
// Parse and Execute
// ========================================

program.parseAsync(process.argv).catch((error: any) => {
  console.error(chalk.red("\nError:"), error.message);
  process.exit(1);
});
