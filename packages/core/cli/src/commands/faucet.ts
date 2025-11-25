import chalk from 'chalk';
import ora from 'ora';
import { ethers } from 'ethers';

const FAUCET_API = 'https://faucet.selendra.org/api/claim';
const TESTNET_RPC = 'https://rpc-testnet.selendra.org';

export async function faucetCommand(address: string) {
  // Validate address
  if (!ethers.isAddress(address)) {
    console.error(chalk.red('Invalid Ethereum address'));
    console.log(chalk.gray('Example: selendra faucet 0x742d35Cc6634C0532925a3b844Bc9e7595f3f4A'));
    process.exit(1);
    return;
  }

  console.log(chalk.bold.white('Requesting testnet tokens...'));
  console.log();
  console.log(`${chalk.cyan('Address:')} ${address}`);
  console.log(`${chalk.cyan('Network:')} Selendra Testnet`);
  console.log();

  const spinner = ora('Submitting faucet request...').start();

  try {
    // Note: This is a placeholder - actual faucet API would be implemented
    // For now, show the process
    await new Promise(resolve => setTimeout(resolve, 2000));

    spinner.warn('Faucet API integration pending');
    console.log();
    console.log(chalk.yellow('Manual Faucet Access'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log();
    console.log('Visit: ' + chalk.cyan('https://faucet.selendra.org'));
    console.log();
    console.log('Or join our Telegram:');
    console.log(chalk.cyan('https://t.me/selendranetwork'));
    console.log();
    console.log(chalk.gray('The CLI faucet integration is coming soon!'));
    console.log();

    // Check current balance
    const provider = new ethers.JsonRpcProvider(TESTNET_RPC);
    const balance = await provider.getBalance(address);
    
    console.log(chalk.bold.white('Current Balance'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log();
    console.log(`${chalk.green('Balance:')} ${ethers.formatEther(balance)} SEL`);
    console.log();

  } catch (error: any) {
    spinner.fail('Failed to request tokens');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}
