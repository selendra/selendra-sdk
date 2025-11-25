/**
 * Account Command
 *
 * Manage accounts and keys
 */

import chalk from "chalk";
import { ethers } from "ethers";
import { Keyring } from "@polkadot/keyring";
import { mnemonicGenerate, cryptoWaitReady } from "@polkadot/util-crypto";
import {
  printHeader,
  printKeyValue,
  printWarning,
  printSuccess,
  printNextSteps,
  newLine,
} from "../utils/output.js";

export async function accountCommand(action: string) {
  switch (action) {
    case "new":
      await createNewAccount();
      break;
    case "new-substrate":
      await createSubstrateAccount();
      break;
    case "list":
      await listAccounts();
      break;
    case "import":
      console.log(chalk.yellow("Account import coming soon!"));
      console.log(chalk.gray("For now, use: selendra account new"));
      break;
    default:
      console.log(chalk.red(`Unknown action: ${action}`));
      console.log(
        chalk.gray("Available actions: new, new-substrate, list, import")
      );
  }
}

/**
 * Create a new EVM-compatible account
 */
async function createNewAccount() {
  printHeader("Creating New EVM Account");

  // Generate random wallet
  const wallet = ethers.Wallet.createRandom();

  printSuccess("Account created successfully!");
  newLine();

  printHeader("Account Details");
  printKeyValue("Address (EVM):", wallet.address);
  newLine();

  printWarning("IMPORTANT: Save these credentials securely!");
  newLine();

  console.log(chalk.cyan("Private Key:"));
  console.log(chalk.gray(wallet.privateKey));
  newLine();

  console.log(chalk.cyan("Mnemonic (Seed Phrase):"));
  console.log(chalk.gray(wallet.mnemonic?.phrase || "N/A"));
  newLine();

  console.log(chalk.gray("─".repeat(70)));
  newLine();

  printWarning("Never share your private key or seed phrase!");
  console.log(
    chalk.gray("   Anyone with access to these can control your funds.")
  );
  newLine();

  printNextSteps([
    "Save your seed phrase in a secure location",
    "Get testnet tokens: selendra faucet " + wallet.address,
    "Check balance: selendra balance " + wallet.address,
  ]);
}

/**
 * Create a new Substrate account
 */
async function createSubstrateAccount() {
  printHeader("Creating New Substrate Account");

  // Wait for crypto to be ready
  await cryptoWaitReady();

  // Generate mnemonic
  const mnemonic = mnemonicGenerate(12);

  // Create keyring and add account
  const keyring = new Keyring({ type: "sr25519", ss58Format: 204 }); // Selendra SS58 format
  const pair = keyring.addFromMnemonic(mnemonic);

  printSuccess("Account created successfully!");
  newLine();

  printHeader("Account Details");
  printKeyValue("Address (SS58):", pair.address);
  printKeyValue(
    "Public Key:",
    "0x" + Buffer.from(pair.publicKey).toString("hex")
  );
  printKeyValue("SS58 Format:", "204 (Selendra)");
  newLine();

  printWarning("IMPORTANT: Save these credentials securely!");
  newLine();

  console.log(chalk.cyan("Mnemonic (Seed Phrase):"));
  console.log(chalk.gray(mnemonic));
  newLine();

  console.log(chalk.gray("─".repeat(70)));
  newLine();

  printWarning("Never share your seed phrase!");
  console.log(
    chalk.gray("   Anyone with access to this can control your funds.")
  );
  newLine();

  printNextSteps([
    "Save your seed phrase in a secure location",
    "This address works with both Substrate and EVM (via unified accounts)",
    "Check balance: selendra balance " + pair.address,
  ]);
}

/**
 * List saved accounts (placeholder)
 */
async function listAccounts() {
  console.log(chalk.yellow("Account keystore coming soon!"));
  newLine();

  console.log(chalk.gray("For now, manage your accounts using:"));
  console.log(chalk.white("  • MetaMask (for EVM accounts)"));
  console.log(
    chalk.white("  • Polkadot.js Extension (for Substrate accounts)")
  );
  newLine();

  console.log(chalk.gray("Create a new account:"));
  console.log(chalk.cyan("  selendra account new            # EVM account"));
  console.log(
    chalk.cyan("  selendra account new-substrate  # Substrate account")
  );
  newLine();
}
