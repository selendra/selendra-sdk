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
import { balanceCommand } from "./commands/balance.js";
import { transferCommand } from "./commands/transfer.js";
import { chainCommand, blockCommand } from "./commands/chain.js";
import { stakeCommand } from "./commands/stake.js";

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
  .argument("[number]", "Block number (latest if not specified)")
  .option(
    "-n, --network <network>",
    "Network to query (mainnet|testnet|local)",
    "mainnet"
  )
  .option("--json", "Output as JSON")
  .action(blockCommand);

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
// Parse and Execute
// ========================================

program.parseAsync(process.argv).catch((error: any) => {
  console.error(chalk.red("\nError:"), error.message);
  process.exit(1);
});
