/**
 * Transfer Command
 *
 * Transfer SEL tokens between accounts
 */

import chalk from "chalk";
import ora from "ora";
import { isAddress, parseEther, formatEther } from "viem";
import {
  EVMClient,
  getNetwork,
  NetworkKey,
  getPrivateKey,
  formatBalance,
  parseBalance,
} from "../utils/client.js";
import {
  printHeader,
  printKeyValue,
  printSuccess,
  printWarning,
  printTroubleshooting,
  newLine,
} from "../utils/output.js";
import {
  promptConfirm,
  promptNetwork,
  promptAmount,
} from "../utils/prompts.js";

interface TransferOptions {
  network?: string;
  amount?: string;
}

export async function transferCommand(to: string, options: TransferOptions) {
  // Validate recipient address
  if (!isAddress(to)) {
    console.error(chalk.red("Invalid recipient address"));
    console.log(chalk.gray("Use a valid EVM address (0x...)"));
    process.exit(1);
    return;
  }

  // Get network
  let networkKey: NetworkKey;
  if (options.network) {
    networkKey = options.network as NetworkKey;
  } else {
    networkKey = await promptNetwork();
  }

  const network = getNetwork(networkKey);

  // Get amount
  let amount: string;
  if (options.amount) {
    amount = options.amount;
  } else {
    amount = await promptAmount("Enter amount to transfer");
  }

  // Get private key
  const privateKey = getPrivateKey();

  const spinner = ora("Preparing transfer...").start();

  try {
    const evmClient = new EVMClient(network);
    const account = evmClient.getAccount(privateKey);
    const publicClient = evmClient.getProvider();
    const walletClient = evmClient.getWalletClient(privateKey);

    // Get balances and gas info
    const [senderBalance, gasPrice] = await Promise.all([
      evmClient.getBalance(account.address),
      evmClient.getGasPrice(),
    ]);

    const amountWei = parseBalance(amount);
    const estimatedGas = 21000n; // Standard ETH transfer
    const estimatedFee = gasPrice * estimatedGas;
    const totalCost = amountWei + estimatedFee;

    spinner.succeed("Transfer prepared");
    newLine();

    printHeader("Transfer Details");
    printKeyValue("From:", account.address);
    printKeyValue("To:", to);
    printKeyValue("Amount:", `${amount} SEL`);
    printKeyValue("Network:", network.name);
    newLine();

    printKeyValue("Your Balance:", `${formatBalance(senderBalance)} SEL`);
    printKeyValue(
      "Est. Gas Fee:",
      `${formatBalance(estimatedFee)} SEL`,
      chalk.gray
    );
    printKeyValue(
      "Total Cost:",
      `${formatBalance(totalCost)} SEL`,
      chalk.yellow
    );
    newLine();

    // Check sufficient balance
    if (senderBalance < totalCost) {
      printWarning("Insufficient balance for this transfer");
      console.log(chalk.gray(`Need at least ${formatBalance(totalCost)} SEL`));
      console.log(chalk.gray(`You have ${formatBalance(senderBalance)} SEL`));
      process.exit(1);
      return;
    }

    // Confirm transfer
    const confirm = await promptConfirm(`Send ${amount} SEL to ${to}?`, true);

    if (!confirm) {
      console.log(chalk.yellow("Transfer cancelled"));
      return;
    }

    spinner.start("Sending transaction...");

    // Send transaction using viem
    const hash = await walletClient.sendTransaction({
      to: to as `0x${string}`,
      value: amountWei,
    });

    spinner.text = "Waiting for confirmation...";
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    spinner.succeed("Transfer successful!");
    newLine();

    printSuccess("Transfer complete");
    newLine();

    printHeader("Transaction Details");
    printKeyValue("Tx Hash:", hash);
    printKeyValue("Block:", receipt.blockNumber?.toString() || "N/A");
    printKeyValue("Gas Used:", receipt.gasUsed?.toString() || "N/A");
    printKeyValue(
      "Status:",
      receipt.status === "success" ? "Success" : "Failed",
      receipt.status === "success" ? chalk.green : chalk.red
    );
    newLine();

    if (network.explorer) {
      console.log(chalk.gray("View on explorer:"));
      console.log(chalk.cyan(`${network.explorer}/tx/${hash}`));
      newLine();
    }
  } catch (error: any) {
    spinner.fail("Transfer failed");
    console.error(chalk.red("Error:"), error.message);
    newLine();

    if (error.message.includes("insufficient funds")) {
      printWarning("Insufficient funds");
      printTroubleshooting([
        "Check your balance: selendra balance <address>",
        "Get testnet tokens: selendra faucet <address>",
      ]);
    } else if (error.message.includes("nonce")) {
      printWarning("Nonce error - transaction may have been sent already");
    }

    process.exit(1);
  }
}
