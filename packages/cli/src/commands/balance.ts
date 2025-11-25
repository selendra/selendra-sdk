/**
 * Balance Command
 *
 * Query account balance (native SEL tokens)
 */

import chalk from "chalk";
import ora from "ora";
import { ethers } from "ethers";
import {
  EVMClient,
  SubstrateClient,
  getNetwork,
  NetworkKey,
  formatBalance,
} from "../utils/client.js";
import {
  printHeader,
  printKeyValue,
  printInfo,
  printTroubleshooting,
  newLine,
} from "../utils/output.js";

interface BalanceOptions {
  network: string;
  json?: boolean;
}

export async function balanceCommand(address: string, options: BalanceOptions) {
  const networkKey = options.network as NetworkKey;

  let network;
  try {
    network = getNetwork(networkKey);
  } catch {
    console.error(chalk.red(`Unknown network: ${options.network}`));
    console.log(chalk.gray("Available networks: mainnet, testnet, local"));
    return;
  }

  const spinner = ora(`Querying balance on ${network.name}...`).start();

  try {
    const evmClient = new EVMClient(network);

    // Check if it's an EVM address or Substrate address
    const isEvmAddress = address.startsWith("0x") && address.length === 42;

    let evmBalance: bigint | null = null;
    let substrateBalance: {
      free: string;
      reserved: string;
      frozen: string;
    } | null = null;

    // Get EVM balance if it's an EVM address
    if (isEvmAddress) {
      evmBalance = await evmClient.getBalance(address);
    }

    // Try to get Substrate balance
    try {
      const substrateClient = new SubstrateClient(network);
      substrateBalance = await substrateClient.getBalance(address);
      await substrateClient.disconnect();
    } catch {
      // Substrate node might not be available
    }

    spinner.succeed("Balance retrieved");

    // Output as JSON if requested
    if (options.json) {
      console.log(
        JSON.stringify(
          {
            address,
            network: network.name,
            evm: evmBalance
              ? {
                  balance: evmBalance.toString(),
                  formatted: formatBalance(evmBalance),
                }
              : null,
            substrate: substrateBalance
              ? {
                  free: substrateBalance.free,
                  reserved: substrateBalance.reserved,
                  frozen: substrateBalance.frozen,
                  freeFormatted: formatBalance(substrateBalance.free),
                }
              : null,
          },
          null,
          2
        )
      );
      return;
    }

    // Display balance
    printHeader("Account Balance");
    printKeyValue("Address:", address);
    printKeyValue("Network:", network.name);
    newLine();

    if (evmBalance !== null) {
      printHeader("EVM Balance");
      printKeyValue(
        "Balance:",
        `${formatBalance(evmBalance)} SEL`,
        chalk.green
      );
      printKeyValue("Wei:", evmBalance.toString(), chalk.gray);
      newLine();
    }

    if (substrateBalance) {
      printHeader("Substrate Balance");
      printKeyValue(
        "Free:",
        `${formatBalance(substrateBalance.free)} SEL`,
        chalk.green
      );
      printKeyValue(
        "Reserved:",
        `${formatBalance(substrateBalance.reserved)} SEL`,
        chalk.yellow
      );
      printKeyValue(
        "Frozen:",
        `${formatBalance(substrateBalance.frozen)} SEL`,
        chalk.gray
      );

      const total =
        BigInt(substrateBalance.free) + BigInt(substrateBalance.reserved);
      printKeyValue("Total:", `${formatBalance(total)} SEL`, chalk.white);
      newLine();
    }

    if (!substrateBalance && evmBalance !== null && evmBalance === 0n) {
      printInfo("Your balance is 0. Get testnet tokens:");
      console.log(chalk.cyan(`  selendra faucet ${address}`));
      newLine();
    }

    if (network.explorer) {
      console.log(chalk.gray("View on explorer:"));
      console.log(chalk.cyan(`${network.explorer}/address/${address}`));
      newLine();
    }
  } catch (error: any) {
    spinner.fail("Failed to query balance");
    console.error(chalk.red("Error:"), error.message);

    printTroubleshooting([
      "Check the address is valid",
      "Verify the network is operational",
      `Try: ${chalk.white("selendra status --network " + networkKey)}`,
    ]);

    process.exit(1);
  }
}
