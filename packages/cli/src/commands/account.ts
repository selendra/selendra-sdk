/**
 * Account Command (TASK-013 Enhanced)
 *
 * Manage accounts and keys with import/export support
 */

import chalk from "chalk";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { english, generateMnemonic, mnemonicToAccount } from "viem/accounts";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeed } from "@scure/bip39";
import { Keyring } from "@polkadot/keyring";
import {
  mnemonicGenerate,
  cryptoWaitReady,
  mnemonicValidate,
} from "@polkadot/util-crypto";
import inquirer from "inquirer";
import {
  printHeader,
  printKeyValue,
  printWarning,
  printSuccess,
  printError,
  printInfo,
  printNextSteps,
  newLine,
} from "../utils/output.js";

// Keystore directory
const KEYSTORE_DIR = path.join(os.homedir(), ".selendra", "keystore");

interface StoredAccount {
  name: string;
  address: string;
  type: "evm" | "substrate";
  encrypted: string;
  iv: string;
  salt: string;
  createdAt: string;
}

interface KeystoreFile {
  version: 1;
  accounts: StoredAccount[];
}

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
      await importAccount();
      break;
    case "export":
      await exportAccount();
      break;
    case "delete":
      await deleteAccount();
      break;
    case "show":
      await showAccount();
      break;
    default:
      console.log(chalk.red(`Unknown action: ${action}`));
      console.log(
        chalk.gray(
          "Available actions: new, new-substrate, list, import, export, delete, show"
        )
      );
  }
}

/**
 * Ensure keystore directory exists
 */
async function ensureKeystoreDir(): Promise<void> {
  await fs.mkdir(KEYSTORE_DIR, { recursive: true });
}

/**
 * Get keystore file path
 */
function getKeystorePath(): string {
  return path.join(KEYSTORE_DIR, "accounts.json");
}

/**
 * Load keystore
 */
async function loadKeystore(): Promise<KeystoreFile> {
  try {
    const content = await fs.readFile(getKeystorePath(), "utf-8");
    return JSON.parse(content);
  } catch {
    return { version: 1, accounts: [] };
  }
}

/**
 * Save keystore
 */
async function saveKeystore(keystore: KeystoreFile): Promise<void> {
  await ensureKeystoreDir();
  await fs.writeFile(getKeystorePath(), JSON.stringify(keystore, null, 2), {
    mode: 0o600,
  });
}

/**
 * Encrypt private key with password
 */
function encryptPrivateKey(
  privateKey: string,
  password: string
): {
  encrypted: string;
  iv: string;
  salt: string;
} {
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    salt: salt.toString("hex"),
  };
}

/**
 * Decrypt private key with password
 */
function decryptPrivateKey(
  encrypted: string,
  iv: string,
  salt: string,
  password: string
): string {
  const key = crypto.pbkdf2Sync(
    password,
    Buffer.from(salt, "hex"),
    100000,
    32,
    "sha256"
  );
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    key,
    Buffer.from(iv, "hex")
  );

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Create a new EVM-compatible account
 */
async function createNewAccount() {
  printHeader("Creating New EVM Account");

  // Generate random wallet using viem
  const mnemonic = generateMnemonic(english);
  const account = mnemonicToAccount(mnemonic);
  const privateKey = generatePrivateKey();
  const accountFromKey = privateKeyToAccount(privateKey);

  printSuccess("Account created successfully!");
  newLine();

  printHeader("Account Details");
  printKeyValue("Address (EVM):", account.address);
  newLine();

  // Ask if user wants to save to keystore
  const { save } = await inquirer.prompt([
    {
      type: "confirm",
      name: "save",
      message: "Save account to local keystore?",
      default: true,
    },
  ]);

  if (save) {
    const { name, password, confirmPassword } = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Account name (alias):",
        default: `evm-${Date.now().toString(36)}`,
      },
      {
        type: "password",
        name: "password",
        message: "Encryption password:",
        mask: "*",
      },
      {
        type: "password",
        name: "confirmPassword",
        message: "Confirm password:",
        mask: "*",
      },
    ]);

    if (password !== confirmPassword) {
      printError("Passwords do not match!");
      return;
    }

    if (password.length < 8) {
      printError("Password must be at least 8 characters!");
      return;
    }

    const keystore = await loadKeystore();
    const { encrypted, iv, salt } = encryptPrivateKey(privateKey, password);

    keystore.accounts.push({
      name,
      address: accountFromKey.address,
      type: "evm",
      encrypted,
      iv,
      salt,
      createdAt: new Date().toISOString(),
    });

    await saveKeystore(keystore);
    printSuccess(`Account saved as '${name}'`);
    newLine();
  }

  printWarning("IMPORTANT: Save these credentials securely!");
  newLine();

  console.log(chalk.cyan("Private Key:"));
  console.log(chalk.gray(privateKey));
  newLine();

  console.log(chalk.cyan("Mnemonic (Seed Phrase):"));
  console.log(chalk.gray(mnemonic));
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
    "Get testnet tokens: selendra faucet " + account.address,
    "Check balance: selendra balance " + account.address,
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

  // Ask if user wants to save to keystore
  const { save } = await inquirer.prompt([
    {
      type: "confirm",
      name: "save",
      message: "Save account to local keystore?",
      default: true,
    },
  ]);

  if (save) {
    const { name, password, confirmPassword } = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Account name (alias):",
        default: `substrate-${Date.now().toString(36)}`,
      },
      {
        type: "password",
        name: "password",
        message: "Encryption password:",
        mask: "*",
      },
      {
        type: "password",
        name: "confirmPassword",
        message: "Confirm password:",
        mask: "*",
      },
    ]);

    if (password !== confirmPassword) {
      printError("Passwords do not match!");
      return;
    }

    if (password.length < 8) {
      printError("Password must be at least 8 characters!");
      return;
    }

    const keystore = await loadKeystore();
    const { encrypted, iv, salt } = encryptPrivateKey(mnemonic, password);

    keystore.accounts.push({
      name,
      address: pair.address,
      type: "substrate",
      encrypted,
      iv,
      salt,
      createdAt: new Date().toISOString(),
    });

    await saveKeystore(keystore);
    printSuccess(`Account saved as '${name}'`);
    newLine();
  }

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
 * Import an existing account
 */
async function importAccount() {
  printHeader("Import Account");

  const { importType } = await inquirer.prompt([
    {
      type: "list",
      name: "importType",
      message: "What would you like to import?",
      choices: [
        { name: "Private Key (EVM)", value: "privateKey" },
        { name: "Mnemonic/Seed Phrase (EVM)", value: "mnemonicEvm" },
        {
          name: "Mnemonic/Seed Phrase (Substrate)",
          value: "mnemonicSubstrate",
        },
      ],
    },
  ]);

  let address: string;
  let secretData: string;
  let accountType: "evm" | "substrate";

  if (importType === "privateKey") {
    const { privateKey } = await inquirer.prompt([
      {
        type: "password",
        name: "privateKey",
        message: "Private key (0x...):",
        mask: "*",
      },
    ]);

    try {
      const account = privateKeyToAccount(
        privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
      );
      address = account.address;
      secretData = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
      accountType = "evm";
    } catch (error) {
      printError("Invalid private key format!");
      return;
    }
  } else if (importType === "mnemonicEvm") {
    const { mnemonic } = await inquirer.prompt([
      {
        type: "password",
        name: "mnemonic",
        message: "Mnemonic phrase (12 or 24 words):",
        mask: "*",
      },
    ]);

    try {
      const account = mnemonicToAccount(mnemonic.trim());
      const seed = await mnemonicToSeed(mnemonic.trim());
      const hdKey = HDKey.fromMasterSeed(seed);
      const privateKey = hdKey.derive("m/44'/60'/0'/0/0").privateKey;
      if (!privateKey) throw new Error("Failed to derive private key");

      address = account.address;
      secretData = `0x${Buffer.from(privateKey).toString("hex")}`;
      accountType = "evm";
    } catch (error: any) {
      printError(`Invalid mnemonic: ${error.message}`);
      return;
    }
  } else {
    await cryptoWaitReady();

    const { mnemonic } = await inquirer.prompt([
      {
        type: "password",
        name: "mnemonic",
        message: "Mnemonic phrase (12 words):",
        mask: "*",
      },
    ]);

    if (!mnemonicValidate(mnemonic.trim())) {
      printError("Invalid mnemonic phrase!");
      return;
    }

    const keyring = new Keyring({ type: "sr25519", ss58Format: 204 });
    const pair = keyring.addFromMnemonic(mnemonic.trim());
    address = pair.address;
    secretData = mnemonic.trim();
    accountType = "substrate";
  }

  printKeyValue("Address:", address);
  newLine();

  const { name, password, confirmPassword } = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Account name (alias):",
      default: `imported-${Date.now().toString(36)}`,
    },
    {
      type: "password",
      name: "password",
      message: "Encryption password:",
      mask: "*",
    },
    {
      type: "password",
      name: "confirmPassword",
      message: "Confirm password:",
      mask: "*",
    },
  ]);

  if (password !== confirmPassword) {
    printError("Passwords do not match!");
    return;
  }

  if (password.length < 8) {
    printError("Password must be at least 8 characters!");
    return;
  }

  const keystore = await loadKeystore();
  const { encrypted, iv, salt } = encryptPrivateKey(secretData, password);

  keystore.accounts.push({
    name,
    address,
    type: accountType,
    encrypted,
    iv,
    salt,
    createdAt: new Date().toISOString(),
  });

  await saveKeystore(keystore);
  printSuccess(`Account '${name}' imported successfully!`);
}

/**
 * Export an account
 */
async function exportAccount() {
  printHeader("Export Account");

  const keystore = await loadKeystore();

  if (keystore.accounts.length === 0) {
    printInfo("No accounts saved in keystore.");
    console.log(chalk.gray("Use 'selendra account new' to create one."));
    return;
  }

  const { accountName } = await inquirer.prompt([
    {
      type: "list",
      name: "accountName",
      message: "Select account to export:",
      choices: keystore.accounts.map((a) => ({
        name: `${a.name} (${a.type}) - ${a.address.slice(0, 10)}...`,
        value: a.name,
      })),
    },
  ]);

  const account = keystore.accounts.find((a) => a.name === accountName);
  if (!account) {
    printError("Account not found!");
    return;
  }

  const { password } = await inquirer.prompt([
    {
      type: "password",
      name: "password",
      message: "Encryption password:",
      mask: "*",
    },
  ]);

  try {
    const decrypted = decryptPrivateKey(
      account.encrypted,
      account.iv,
      account.salt,
      password
    );

    printWarning("SECURITY WARNING: The following is your secret key!");
    newLine();

    if (account.type === "evm") {
      console.log(chalk.cyan("Private Key:"));
    } else {
      console.log(chalk.cyan("Mnemonic:"));
    }
    console.log(chalk.gray(decrypted));
    newLine();

    printWarning("Never share this with anyone!");
  } catch {
    printError("Invalid password!");
  }
}

/**
 * Delete an account
 */
async function deleteAccount() {
  printHeader("Delete Account");

  const keystore = await loadKeystore();

  if (keystore.accounts.length === 0) {
    printInfo("No accounts saved in keystore.");
    return;
  }

  const { accountName } = await inquirer.prompt([
    {
      type: "list",
      name: "accountName",
      message: "Select account to delete:",
      choices: keystore.accounts.map((a) => ({
        name: `${a.name} (${a.type}) - ${a.address.slice(0, 10)}...`,
        value: a.name,
      })),
    },
  ]);

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Are you sure you want to delete '${accountName}'? This cannot be undone!`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.gray("Cancelled."));
    return;
  }

  keystore.accounts = keystore.accounts.filter((a) => a.name !== accountName);
  await saveKeystore(keystore);
  printSuccess(`Account '${accountName}' deleted.`);
}

/**
 * Show account details
 */
async function showAccount() {
  printHeader("Account Details");

  const keystore = await loadKeystore();

  if (keystore.accounts.length === 0) {
    printInfo("No accounts saved in keystore.");
    console.log(chalk.gray("Use 'selendra account new' to create one."));
    return;
  }

  const { accountName } = await inquirer.prompt([
    {
      type: "list",
      name: "accountName",
      message: "Select account:",
      choices: keystore.accounts.map((a) => ({
        name: `${a.name} (${a.type}) - ${a.address.slice(0, 10)}...`,
        value: a.name,
      })),
    },
  ]);

  const account = keystore.accounts.find((a) => a.name === accountName);
  if (!account) {
    printError("Account not found!");
    return;
  }

  printKeyValue("Name:", account.name);
  printKeyValue(
    "Type:",
    account.type === "evm" ? "EVM (Ethereum-compatible)" : "Substrate (SS58)"
  );
  printKeyValue("Address:", account.address);
  printKeyValue("Created:", new Date(account.createdAt).toLocaleString());
  newLine();

  printNextSteps([
    `Check balance: selendra balance ${account.address}`,
    `Get testnet tokens: selendra faucet ${account.address}`,
    `Export keys: selendra account export`,
  ]);
}

/**
 * List saved accounts
 */
async function listAccounts() {
  printHeader("Saved Accounts");

  const keystore = await loadKeystore();

  if (keystore.accounts.length === 0) {
    printInfo("No accounts saved in keystore.");
    newLine();
    console.log(chalk.gray("Create a new account:"));
    console.log(chalk.cyan("  selendra account new            # EVM account"));
    console.log(
      chalk.cyan("  selendra account new-substrate  # Substrate account")
    );
    newLine();
    console.log(chalk.gray("Import an existing account:"));
    console.log(chalk.cyan("  selendra account import"));
    return;
  }

  console.log(
    chalk.gray(
      "─────────────────────────────────────────────────────────────────────"
    )
  );

  for (const account of keystore.accounts) {
    console.log(
      chalk.bold.cyan(account.name) + chalk.gray(` (${account.type})`)
    );
    console.log(chalk.white(`  ${account.address}`));
    console.log(
      chalk.gray(
        `  Created: ${new Date(account.createdAt).toLocaleDateString()}`
      )
    );
    console.log(chalk.gray("─".repeat(69)));
  }

  newLine();
  printKeyValue("Total Accounts:", keystore.accounts.length.toString());
  printKeyValue("Keystore Location:", KEYSTORE_DIR);
  newLine();

  console.log(chalk.gray("Manage accounts:"));
  console.log(chalk.cyan("  selendra account show    # View account details"));
  console.log(chalk.cyan("  selendra account export  # Export private key"));
  console.log(chalk.cyan("  selendra account delete  # Remove account"));
}
