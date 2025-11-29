/**
 * Faucet Command
 *
 * Request testnet tokens via API
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
  printSuccess,
  printTroubleshooting,
  newLine,
} from "../utils/output.js";

/**
 * Faucet API configuration
 */
const FAUCET_CONFIG = {
  apiUrl: process.env.SELENDRA_FAUCET_API || "https://faucet-api.selendra.org",
  webUrl: "https://faucet.selendra.org",
  amount: "10", // Default amount in SEL
  cooldownMessage: "Please wait before requesting more tokens",
};

/**
 * Faucet API response interface
 */
interface FaucetResponse {
  success: boolean;
  txHash?: string;
  amount?: string;
  message?: string;
  error?: string;
  cooldownRemaining?: number;
}

/**
 * Request tokens from faucet API
 */
async function requestFromFaucet(address: string): Promise<FaucetResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(`${FAUCET_CONFIG.apiUrl}/drip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ address }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      return {
        success: false,
        error:
          (data.error as string) ||
          (data.message as string) ||
          `HTTP ${response.status}`,
        cooldownRemaining: data.cooldownRemaining as number | undefined,
      };
    }

    return {
      success: true,
      txHash: (data.txHash as string) || (data.hash as string),
      amount: (data.amount as string) || FAUCET_CONFIG.amount,
      message: data.message as string | undefined,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      return { success: false, error: "Request timed out" };
    }

    // Handle network errors - faucet API might not be available
    if (error.code === "ECONNREFUSED" || error.cause?.code === "ECONNREFUSED") {
      return { success: false, error: "Faucet API unavailable" };
    }

    return { success: false, error: error.message || "Unknown error" };
  }
}

/**
 * Format cooldown time
 */
function formatCooldown(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`;
  return `${Math.ceil(seconds / 3600)} hours`;
}

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

  // Check current balance first
  const spinner = ora("Checking current balance...").start();

  let currentBalance = 0n;
  try {
    const network = getNetwork("testnet");
    const evmClient = new EVMClient(network);
    currentBalance = await evmClient.getBalance(address as `0x${string}`);
    spinner.succeed("Balance retrieved");

    printKeyValue(
      "Current Balance:",
      `${formatBalance(currentBalance)} SEL`,
      chalk.cyan
    );
    newLine();
  } catch (error: any) {
    spinner.warn("Could not fetch current balance");
    newLine();
  }

  // Request from faucet API
  spinner.start("Submitting faucet request...");

  const result = await requestFromFaucet(address);

  if (result.success) {
    spinner.succeed("Tokens sent successfully!");
    newLine();

    printSuccess("Faucet request completed");
    newLine();

    printHeader("Transaction Details");
    printKeyValue("Amount:", `${result.amount} SEL`, chalk.green);
    if (result.txHash) {
      printKeyValue("Tx Hash:", result.txHash);

      const network = getNetwork("testnet");
      if (network.explorer) {
        newLine();
        console.log(chalk.gray("View transaction:"));
        console.log(chalk.cyan(`${network.explorer}/tx/${result.txHash}`));
      }
    }
    if (result.message) {
      newLine();
      printInfo(result.message);
    }

    newLine();

    // Check new balance after a short delay
    spinner.start("Verifying new balance...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      const network = getNetwork("testnet");
      const evmClient = new EVMClient(network);
      const newBalance = await evmClient.getBalance(address as `0x${string}`);
      spinner.succeed("Balance updated");

      newLine();
      printHeader("Updated Balance");
      printKeyValue(
        "Balance:",
        `${formatBalance(newBalance)} SEL`,
        chalk.green
      );

      if (newBalance > currentBalance) {
        const received = newBalance - currentBalance;
        printKeyValue(
          "Received:",
          `+${formatBalance(received)} SEL`,
          chalk.cyan
        );
      }

      newLine();
      printInfo("You're ready to deploy contracts on testnet!");
    } catch {
      spinner.info(
        "Balance update pending - transaction may take a moment to confirm"
      );
    }

    newLine();
  } else {
    // Handle faucet errors
    spinner.fail("Faucet request failed");
    newLine();

    if (result.cooldownRemaining) {
      printWarning(
        `Rate limited. Try again in ${formatCooldown(result.cooldownRemaining)}`
      );
      newLine();
    }

    // Check if it's a network/API availability issue
    const isApiUnavailable =
      result.error?.includes("unavailable") ||
      result.error?.includes("timeout") ||
      result.error?.includes("ECONNREFUSED");

    if (isApiUnavailable) {
      printHeader("Alternative Options");
      newLine();

      printInfo("The faucet API is currently unavailable. Try:");
      newLine();

      console.log(chalk.white("  1. Web Faucet:"));
      console.log(chalk.cyan(`     ${FAUCET_CONFIG.webUrl}`));
      newLine();

      console.log(chalk.white("  2. Community Channels:"));
      console.log(
        chalk.gray("     Telegram: ") +
          chalk.cyan("https://t.me/selendranetwork")
      );
      console.log(
        chalk.gray("     Discord:  ") +
          chalk.cyan("https://discord.gg/selendra")
      );
      newLine();

      printInfo("Ask for testnet tokens in our community!");
    } else {
      console.error(chalk.red("Error:"), result.error);
      newLine();

      printTroubleshooting([
        "Check if the address is correct",
        "Wait a few minutes if you recently requested tokens",
        `Visit ${FAUCET_CONFIG.webUrl} for manual requests`,
        "Join our community for support",
      ]);
    }

    newLine();

    // Still show current balance
    if (currentBalance > 0n) {
      printInfo(
        `You still have ${formatBalance(currentBalance)} SEL available`
      );
      newLine();
    }
  }
}
