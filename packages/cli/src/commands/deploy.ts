/**
 * Deploy Command
 *
 * Deploy smart contracts to Selendra networks
 */

import chalk from "chalk";
import ora from "ora";
import { ethers } from "ethers";
import fs from "fs/promises";
import path from "path";
import {
  EVMClient,
  getNetwork,
  NetworkKey,
  getPrivateKey,
} from "../utils/client.js";
import {
  printHeader,
  printKeyValue,
  printSuccess,
  printWarning,
  printTroubleshooting,
  newLine,
} from "../utils/output.js";
import { promptNetwork, promptConfirm } from "../utils/prompts.js";

interface DeployOptions {
  network?: string;
  args?: string;
  gas?: string;
}

export async function deployCommand(
  contractName: string,
  options: DeployOptions
) {
  printHeader("Deploying Contract");

  // Select network
  let networkKey: NetworkKey;
  if (options.network) {
    networkKey = options.network as NetworkKey;
  } else {
    networkKey = await promptNetwork();
  }

  const network = getNetwork(networkKey);

  // Get private key
  const privateKey = getPrivateKey();

  const spinner = ora("Loading contract artifacts...").start();

  try {
    // Find contract artifact
    const artifactPath = await findContractArtifact(contractName);
    const artifact = JSON.parse(await fs.readFile(artifactPath, "utf-8"));

    spinner.text = `Connecting to ${network.name}...`;

    const evmClient = new EVMClient(network);
    const wallet = evmClient.getSigner(privateKey);

    spinner.text = "Getting deployment info...";
    const balance = await evmClient.getBalance(wallet.address);

    spinner.succeed("Ready to deploy");
    newLine();

    printKeyValue("Contract:", contractName);
    printKeyValue("Network:", network.name);
    printKeyValue("Chain ID:", network.evmChainId.toString());
    printKeyValue("Deployer:", wallet.address);
    printKeyValue("Balance:", `${ethers.formatEther(balance)} SEL`);
    newLine();

    // Parse constructor args if provided
    let constructorArgs: any[] = [];
    if (options.args) {
      try {
        constructorArgs = JSON.parse(options.args);
      } catch {
        constructorArgs = options.args.split(",").map((arg) => arg.trim());
      }
      printKeyValue("Constructor Args:", JSON.stringify(constructorArgs));
      newLine();
    }

    // Confirm deployment
    const confirm = await promptConfirm(
      `Deploy ${contractName} to ${network.name}?`,
      true
    );

    if (!confirm) {
      console.log(chalk.yellow("Deployment cancelled"));
      return;
    }

    spinner.start("Deploying contract...");

    // Deploy contract
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      wallet
    );
    const contract = await factory.deploy(...constructorArgs);

    spinner.text = "Waiting for deployment confirmation...";
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    const deployTx = contract.deploymentTransaction();

    spinner.succeed("Contract deployed successfully!");
    newLine();

    printSuccess("Deployment complete");
    newLine();

    printHeader("Contract Details");
    printKeyValue("Contract:", contractName);
    printKeyValue("Address:", address, chalk.white);
    printKeyValue("Network:", network.name);
    printKeyValue("Chain ID:", network.evmChainId.toString());

    if (deployTx) {
      printKeyValue("Tx Hash:", deployTx.hash);
      printKeyValue("Gas Used:", deployTx.gasLimit?.toString() || "N/A");
    }

    newLine();

    if (network.explorer) {
      console.log(chalk.gray("View on explorer:"));
      console.log(chalk.cyan(`${network.explorer}/address/${address}`));
      newLine();
    }

    // Save deployment info
    await saveDeployment(contractName, {
      address,
      network: networkKey,
      chainId: network.evmChainId,
      txHash: deployTx?.hash,
      deployedAt: new Date().toISOString(),
      constructorArgs,
    });

    console.log(chalk.gray("Deployment saved to deployments.json"));
    newLine();
  } catch (error: any) {
    spinner.fail("Deployment failed");
    console.error(chalk.red("Error:"), error.message);
    newLine();

    if (error.message.includes("insufficient funds")) {
      printWarning("Insufficient funds for deployment");
      console.log(chalk.gray("Get testnet tokens:"));
      console.log(chalk.white("  selendra faucet <your_address>"));
    } else if (error.message.includes("nonce")) {
      printWarning("Nonce error - try again in a moment");
    } else if (error.message.includes("artifact not found")) {
      printTroubleshooting([
        `Run 'selendra compile' first`,
        `Make sure ${contractName}.sol exists in contracts/`,
        "Check the contract name matches the file name",
      ]);
    }

    process.exit(1);
  }
}

/**
 * Find contract artifact file
 */
async function findContractArtifact(contractName: string): Promise<string> {
  const searchPaths = [
    // Hardhat
    path.join(
      process.cwd(),
      "artifacts",
      "contracts",
      `${contractName}.sol`,
      `${contractName}.json`
    ),
    // Foundry
    path.join(
      process.cwd(),
      "out",
      `${contractName}.sol`,
      `${contractName}.json`
    ),
    // Direct path
    path.join(process.cwd(), `${contractName}.json`),
  ];

  for (const artifactPath of searchPaths) {
    try {
      await fs.access(artifactPath);
      return artifactPath;
    } catch {
      continue;
    }
  }

  throw new Error(
    `Contract artifact not found: ${contractName}\n` +
      `Run 'selendra compile' first`
  );
}

/**
 * Save deployment info to file
 */
async function saveDeployment(
  contractName: string,
  deployment: {
    address: string;
    network: string;
    chainId: number;
    txHash?: string;
    deployedAt: string;
    constructorArgs: any[];
  }
): Promise<void> {
  const deploymentsPath = path.join(process.cwd(), "deployments.json");

  let deployments: Record<string, any> = {};
  try {
    const existing = await fs.readFile(deploymentsPath, "utf-8");
    deployments = JSON.parse(existing);
  } catch {
    // File doesn't exist, start fresh
  }

  if (!deployments[deployment.network]) {
    deployments[deployment.network] = {};
  }

  deployments[deployment.network][contractName] = deployment;

  await fs.writeFile(deploymentsPath, JSON.stringify(deployments, null, 2));
}
