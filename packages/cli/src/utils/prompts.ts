/**
 * CLI Prompt Utilities
 *
 * Provides consistent interactive prompts for CLI commands
 */

import inquirer from "inquirer";
import { Networks, NetworkKey } from "./client.js";

/**
 * Prompt to select a network
 */
export async function promptNetwork(
  defaultNetwork: NetworkKey = "testnet"
): Promise<NetworkKey> {
  const { network } = await inquirer.prompt([
    {
      type: "list",
      name: "network",
      message: "Select network:",
      default: defaultNetwork,
      choices: [
        {
          name: "Selendra Testnet (recommended for testing)",
          value: "testnet",
        },
        { name: "Selendra Mainnet (production)", value: "mainnet" },
        { name: "Local Development", value: "local" },
      ],
    },
  ]);
  return network;
}

/**
 * Prompt to confirm an action
 */
export async function promptConfirm(
  message: string,
  defaultValue: boolean = true
): Promise<boolean> {
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message,
      default: defaultValue,
    },
  ]);
  return confirm;
}

/**
 * Prompt for a text input
 */
export async function promptInput(
  message: string,
  defaultValue?: string
): Promise<string> {
  const { input } = await inquirer.prompt([
    {
      type: "input",
      name: "input",
      message,
      default: defaultValue,
    },
  ]);
  return input;
}

/**
 * Prompt for a password/secret input
 */
export async function promptPassword(message: string): Promise<string> {
  const { password } = await inquirer.prompt([
    {
      type: "password",
      name: "password",
      message,
      mask: "*",
    },
  ]);
  return password;
}

/**
 * Prompt for amount input with validation
 */
export async function promptAmount(
  message: string,
  symbol: string = "SEL"
): Promise<string> {
  const { amount } = await inquirer.prompt([
    {
      type: "input",
      name: "amount",
      message: `${message} (${symbol}):`,
      validate: (input: string) => {
        const num = parseFloat(input);
        if (isNaN(num) || num <= 0) {
          return "Please enter a valid positive number";
        }
        return true;
      },
    },
  ]);
  return amount;
}

/**
 * Prompt for address input with basic validation
 */
export async function promptAddress(message: string): Promise<string> {
  const { address } = await inquirer.prompt([
    {
      type: "input",
      name: "address",
      message,
      validate: (input: string) => {
        // Basic validation for both EVM and Substrate addresses
        if (input.startsWith("0x") && input.length === 42) {
          return true;
        }
        if (input.length === 48 || input.length === 47) {
          // Substrate SS58 address
          return true;
        }
        return "Please enter a valid address (EVM 0x... or Substrate)";
      },
    },
  ]);
  return address;
}

/**
 * Prompt to select from a list
 */
export async function promptSelect<T>(
  message: string,
  choices: { name: string; value: T }[]
): Promise<T> {
  const { selection } = await inquirer.prompt([
    {
      type: "list",
      name: "selection",
      message,
      choices,
    },
  ]);
  return selection;
}

/**
 * Prompt to select multiple items
 */
export async function promptCheckbox<T>(
  message: string,
  choices: { name: string; value: T; checked?: boolean }[]
): Promise<T[]> {
  const { selections } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selections",
      message,
      choices,
    },
  ]);
  return selections;
}

/**
 * Prompt for project template selection
 */
export async function promptProjectTemplate(): Promise<"evm" | "wasm"> {
  const { template } = await inquirer.prompt([
    {
      type: "list",
      name: "template",
      message: "Select project template:",
      choices: [
        { name: "EVM (Solidity + Hardhat)", value: "evm" },
        { name: "WASM (ink! + cargo-contract)", value: "wasm" },
      ],
    },
  ]);
  return template;
}

/**
 * Prompt for staking pool selection
 */
export async function promptPoolId(
  pools: { id: number; name: string }[]
): Promise<number> {
  const choices = pools.map((p) => ({
    name: `Pool #${p.id}: ${p.name}`,
    value: p.id,
  }));

  return promptSelect("Select nomination pool:", choices);
}
