import chalk from 'chalk';
import { ethers } from 'ethers';

export async function accountCommand(action: string) {
  switch (action) {
    case 'new':
      await createNewAccount();
      break;
    case 'list':
      await listAccounts();
      break;
    case 'import':
      console.log(chalk.yellow('Account import coming soon!'));
      console.log(chalk.gray('For now, use: selendra account new'));
      break;
    default:
      console.log(chalk.red(`Unknown action: ${action}`));
      console.log(chalk.gray('Available actions: new, list, import'));
  }
}

async function createNewAccount() {
  console.log(chalk.bold.white('Creating new Selendra account...'));
  console.log();

  // Generate random wallet
  const wallet = ethers.Wallet.createRandom();

  console.log(chalk.green('✓ Account created successfully!'));
  console.log();
  console.log(chalk.bold.white('Account Details'));
  console.log(chalk.gray('─'.repeat(70)));
  console.log();
  console.log(`${chalk.cyan('Address (EVM):')} ${wallet.address}`);
  console.log();
  console.log(chalk.bold.yellow('⚠️  IMPORTANT: Save these credentials securely!'));
  console.log();
  console.log(`${chalk.cyan('Private Key:')}`);
  console.log(chalk.gray(wallet.privateKey));
  console.log();
  console.log(`${chalk.cyan('Mnemonic (Seed Phrase):')}`);
  console.log(chalk.gray(wallet.mnemonic?.phrase || 'N/A'));
  console.log();
  console.log(chalk.gray('─'.repeat(70)));
  console.log();
  console.log(chalk.yellow('⚠️  Never share your private key or seed phrase!'));
  console.log(chalk.gray('   Anyone with access to these can control your funds.'));
  console.log();
}

async function listAccounts() {
  console.log(chalk.yellow('Account keystore coming soon!'));
  console.log();
  console.log(chalk.gray('For now, manage your accounts using:'));
  console.log(chalk.white('  • MetaMask (for EVM accounts)'));
  console.log(chalk.white('  • Polkadot.js (for Substrate accounts)'));
  console.log();
  console.log(chalk.gray('Create a new account:'));
  console.log(chalk.cyan('  selendra account new'));
  console.log();
}
