import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export async function compileCommand(options: { target?: string }) {
  console.log(chalk.bold.white('Compiling contracts...'));
  console.log();

  const target = options.target || 'evm';

  const spinner = ora('Detecting project type...').start();

  try {
    // Check for EVM project (Hardhat)
    const hasHardhat = await fileExists('hardhat.config.ts') || await fileExists('hardhat.config.js');
    
    // Check for WASM project (Cargo.toml)
    const hasCargo = await fileExists('Cargo.toml');

    if (target === 'evm' && hasHardhat) {
      spinner.text = 'Compiling EVM contracts with Hardhat...';
      await compileEVM();
      spinner.succeed('EVM contracts compiled successfully');
    } else if (target === 'wasm' && hasCargo) {
      spinner.text = 'Compiling WASM contracts with cargo-contract...';
      await compileWASM();
      spinner.succeed('WASM contracts compiled successfully');
    } else if (hasHardhat) {
      spinner.text = 'Compiling EVM contracts with Hardhat...';
      await compileEVM();
      spinner.succeed('EVM contracts compiled successfully');
    } else if (hasCargo) {
      spinner.text = 'Compiling WASM contracts with cargo-contract...';
      await compileWASM();
      spinner.succeed('WASM contracts compiled successfully');
    } else {
      spinner.fail('No project configuration found');
      console.log();
      console.log(chalk.yellow('No Hardhat or Cargo project detected'));
      console.log(chalk.gray('Initialize a project first:'));
      console.log(chalk.cyan('  selendra init my-project'));
      process.exit(1);
    }

    console.log();
    console.log(chalk.green('✓ Compilation complete'));
    console.log();
    console.log(chalk.gray('Next step:'));
    console.log(chalk.white('  selendra deploy <ContractName> --network testnet'));
    console.log();

  } catch (error: any) {
    spinner.fail('Compilation failed');
    console.error(chalk.red('Error:'), error.message);
    if (error.stdout) {
      console.log(error.stdout.toString());
    }
    process.exit(1);
  }
}

async function compileEVM() {
  try {
    execSync('npx hardhat compile', {
      stdio: 'inherit',
      encoding: 'utf-8',
    });
  } catch (error: any) {
    throw new Error('Hardhat compilation failed');
  }
}

async function compileWASM() {
  try {
    execSync('cargo contract build --release', {
      stdio: 'inherit',
      encoding: 'utf-8',
    });
  } catch (error: any) {
    throw new Error('cargo-contract build failed. Make sure cargo-contract is installed.');
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
