import { ethers } from 'ethers';
import chalk from 'chalk';
import ora from 'ora';

const NETWORKS = {
  mainnet: {
    name: 'Selendra Mainnet',
    rpc: 'https://rpc.selendra.org',
    chainId: 1961,
  },
  testnet: {
    name: 'Selendra Testnet',
    rpc: 'https://rpc-testnet.selendra.org',
    chainId: 1953,
  },
};

export async function statusCommand(options: { network: string }) {
  const networkKey = options.network as keyof typeof NETWORKS;
  const network = NETWORKS[networkKey];

  if (!network) {
    console.error(chalk.red(`Unknown network: ${options.network}`));
    console.log(chalk.gray('Available networks: mainnet, testnet'));
    return;
  }

  const spinner = ora(`Connecting to ${network.name}...`).start();

  try {
    const provider = new ethers.JsonRpcProvider(network.rpc);

    // Fetch network data
    const [blockNumber, gasPrice, feeData] = await Promise.all([
      provider.getBlockNumber(),
      provider.getFeeData().then(f => f.gasPrice),
      provider.getFeeData(),
    ]);

    spinner.succeed(`Connected to ${network.name}`);

    // Display network status
    console.log();
    console.log(chalk.bold.white('Network Status'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log();
    console.log(`${chalk.cyan('Network:')}      ${network.name}`);
    console.log(`${chalk.cyan('Chain ID:')}     ${network.chainId}`);
    console.log(`${chalk.cyan('RPC:')}          ${network.rpc}`);
    console.log();
    console.log(chalk.bold.white('Live Data'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log();
    console.log(`${chalk.green('Block Height:')} ${blockNumber.toLocaleString()}`);
    console.log(`${chalk.green('Gas Price:')}    ${ethers.formatUnits(gasPrice || 0n, 'gwei')} gwei`);
    
    if (feeData.maxFeePerGas) {
      console.log(`${chalk.green('Max Fee:')}      ${ethers.formatUnits(feeData.maxFeePerGas, 'gwei')} gwei`);
    }
    
    console.log();
    console.log(chalk.gray('Last updated: ' + new Date().toLocaleTimeString()));
    console.log();

  } catch (error: any) {
    spinner.fail('Failed to connect to network');
    console.error(chalk.red('Error:'), error.message);
    console.log();
    console.log(chalk.yellow('Troubleshooting:'));
    console.log(chalk.gray('• Check your internet connection'));
    console.log(chalk.gray('• Verify the network is operational'));
    console.log(chalk.gray(`• Try: ${chalk.white('selendra status --network testnet')}`));
    process.exit(1);
  }
}
