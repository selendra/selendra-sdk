import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';

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

export async function deployCommand(contractName: string, options: { network?: string }) {
  console.log(chalk.bold.white('Deploying contract...'));
  console.log();

  // Select network
  let networkKey = options.network as keyof typeof NETWORKS;
  if (!networkKey) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'network',
        message: 'Select network:',
        choices: [
          { name: 'Selendra Testnet (recommended)', value: 'testnet' },
          { name: 'Selendra Mainnet', value: 'mainnet' },
        ],
      },
    ]);
    networkKey = answers.network;
  }

  const network = NETWORKS[networkKey];

  // Get private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error(chalk.red('Private key not found'));
    console.log();
    console.log(chalk.yellow('Set PRIVATE_KEY environment variable:'));
    console.log(chalk.gray('  export PRIVATE_KEY=your_private_key'));
    console.log(chalk.gray('  or add it to .env file'));
    console.log();
    process.exit(1);
  }

  const spinner = ora('Loading contract artifacts...').start();

  try {
    // Find contract artifact
    const artifactPath = await findContractArtifact(contractName);
    const artifact = JSON.parse(await fs.readFile(artifactPath, 'utf-8'));

    spinner.text = `Connecting to ${network.name}...`;
    const provider = new ethers.JsonRpcProvider(network.rpc);
    const wallet = new ethers.Wallet(privateKey, provider);

    spinner.text = 'Getting gas estimate...';
    const balance = await provider.getBalance(wallet.address);
    
    console.log();
    spinner.info(`Deploying from: ${wallet.address}`);
    console.log(chalk.gray(`Balance: ${ethers.formatEther(balance)} SEL`));
    console.log();

    // Confirm deployment
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Deploy ${contractName} to ${network.name}?`,
        default: true,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Deployment cancelled'));
      return;
    }

    spinner.start('Deploying contract...');

    // Deploy contract
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy();
    
    spinner.text = 'Waiting for deployment confirmation...';
    await contract.waitForDeployment();

    const address = await contract.getAddress();

    spinner.succeed('Contract deployed successfully!');
    console.log();
    console.log(chalk.green('✓ Deployment complete'));
    console.log();
    console.log(chalk.bold.white('Contract Details'));
    console.log(chalk.gray('─'.repeat(70)));
    console.log();
    console.log(`${chalk.cyan('Contract:')}    ${contractName}`);
    console.log(`${chalk.cyan('Address:')}     ${chalk.white(address)}`);
    console.log(`${chalk.cyan('Network:')}     ${network.name}`);
    console.log(`${chalk.cyan('Chain ID:')}    ${network.chainId}`);
    console.log();
    console.log(chalk.gray('─'.repeat(70)));
    console.log();
    console.log(chalk.gray('View on explorer:'));
    if (networkKey === 'mainnet') {
      console.log(chalk.cyan(`https://explorer.selendra.org/address/${address}`));
    } else {
      console.log(chalk.cyan(`https://testnet-explorer.selendra.org/address/${address}`));
    }
    console.log();

  } catch (error: any) {
    spinner.fail('Deployment failed');
    console.error(chalk.red('Error:'), error.message);
    console.log();
    
    if (error.message.includes('insufficient funds')) {
      console.log(chalk.yellow('Insufficient funds'));
      console.log(chalk.gray('Get testnet tokens:'));
      console.log(chalk.white('  selendra faucet <your_address>'));
    } else if (error.message.includes('nonce')) {
      console.log(chalk.yellow('Nonce error - try again in a moment'));
    }
    
    process.exit(1);
  }
}

async function findContractArtifact(contractName: string): Promise<string> {
  // Try Hardhat artifacts path
  const hardhatPath = path.join(
    process.cwd(),
    'artifacts',
    'contracts',
    `${contractName}.sol`,
    `${contractName}.json`
  );

  try {
    await fs.access(hardhatPath);
    return hardhatPath;
  } catch {
    throw new Error(
      `Contract artifact not found: ${contractName}\\n` +
      `Run 'selendra compile' first`
    );
  }
}
