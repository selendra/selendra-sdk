#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { statusCommand } from './commands/status.js';
import { accountCommand } from './commands/account.js';
import { faucetCommand } from './commands/faucet.js';
import { initCommand } from './commands/init.js';
import { compileCommand } from './commands/compile.js';
import { deployCommand } from './commands/deploy.js';

const program = new Command();

program
  .name('selendra')
  .description('CLI tool for Selendra blockchain development')
  .version('0.1.0');

// Initialize project
program
  .command('init')
  .description('Initialize a new Selendra project')
  .argument('<project-name>', 'Name of the project')
  .option('-t, --template <template>', 'Template to use (evm|wasm)')
  .action(initCommand);

// Compile contracts
program
  .command('compile')
  .description('Compile smart contracts')
  .option('--target <target>', 'Target platform (evm|wasm)')
  .action(compileCommand);

// Deploy contracts
program
  .command('deploy')
  .description('Deploy smart contract')
  .argument('<contract>', 'Contract name to deploy')
  .option('-n, --network <network>', 'Network to deploy to (mainnet|testnet)')
  .action(deployCommand);

// Network status
program
  .command('status')
  .description('Show network status and statistics')
  .option('-n, --network <network>', 'Network to query (mainnet|testnet)', 'mainnet')
  .action(statusCommand);

// Account management
program
  .command('account')
  .description('Manage accounts and keys')
  .argument('[action]', 'Action to perform (new|list|import)', 'list')
  .action(accountCommand);

// Faucet
program
  .command('faucet')
  .description('Request testnet tokens')
  .argument('<address>', 'Address to send tokens to')
  .action(faucetCommand);

// Error handling
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error: any) {
  if (error.code !== 'commander.help' && error.code !== 'commander.version') {
    console.error(chalk.red('\nError:'), error.message);
    process.exit(1);
  }
}
