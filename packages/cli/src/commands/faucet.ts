/**
 * Faucet Command
 *
 * Request testnet tokens
 */

import chalk from "chalk";
import ora from "ora";
import { isAddress } from "viem";
import { EVMClient, getNetwork, formatBalance } from "../utils/client.js";
import {
  printHeader,
  printKeyValue,
  printWarning,
  printInfo,
  newLine,
} from "../utils/output.js";

const FAUCET_URL = "https://faucet.selendra.org";

export async function faucetCommand(address: string) {
  // Validate address
  if (!isAddress(address)) {
    console.error(chalk.red("Invalid Ethereum address"));
    console.log(
      chalk.gray(
        "Example: selendra faucet 0x742d35Cc6634C0532925a3b844Bc9e7595f3f4A"
      )
    );
    process.exit(1);
    return;
  }

  printHeader("Requesting Testnet Tokens");
  printKeyValue("Address:", address);
  printKeyValue("Network:", "Selendra Testnet");
  newLine();

  const spinner = ora("Submitting faucet request...").start();

  try {
    // Try to call faucet API (placeholder for actual implementation)
    // In production, this would make an API call to the faucet service
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // For now, show manual instructions
    spinner.warn("Automated faucet integration pending");
    newLine();

    printHeader("Manual Faucet Access");

    printInfo("Visit the faucet website:");
    console.log(chalk.cyan(`  ${FAUCET_URL}`));
    newLine();

    printInfo("Or join our community:");
    console.log(
      chalk.white("  Telegram: ") + chalk.cyan("https://t.me/selendranetwork")
    );
    console.log(
      chalk.white("  Discord:  ") + chalk.cyan("https://discord.gg/selendra")
    );
    newLine();

    console.log(chalk.gray("The CLI faucet integration is coming soon!"));
    newLine();

    // Check current balance
    spinner.start("Checking current balance...");

    const network = getNetwork("testnet");
    const evmClient = new EVMClient(network);
    const balance = await evmClient.getBalance(address as `0x${string}`);

    spinner.succeed("Balance retrieved");
    newLine();

    printHeader("Current Testnet Balance");
    printKeyValue("Balance:", `${formatBalance(balance)} SEL`, chalk.green);
    newLine();

    if (balance === 0n) {
      printWarning(
        "Your balance is 0. Visit the faucet to get testnet tokens."
      );
    } else {
      printInfo("You already have testnet tokens. Ready to deploy!");
    }

    newLine();
  } catch (error: any) {
    spinner.fail("Failed to process request");
    console.error(chalk.red("Error:"), error.message);
    process.exit(1);
  }
}
