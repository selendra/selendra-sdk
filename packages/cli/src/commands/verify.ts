/**
 * Verify Command
 *
 * Verify smart contracts on Selendra Explorer
 */

import chalk from "chalk";
import ora from "ora";
import { isAddress, type Abi } from "viem";
import fs from "fs/promises";
import path from "path";
import { getNetwork, NetworkKey } from "../utils/client.js";
import {
  printHeader,
  printKeyValue,
  printSuccess,
  printWarning,
  printInfo,
  printTroubleshooting,
  newLine,
} from "../utils/output.js";
import { promptNetwork, promptConfirm } from "../utils/prompts.js";

/**
 * Explorer API configuration
 */
const EXPLORER_API = {
  mainnet: "https://explorer.selendra.org/api",
  testnet: "https://testnet-explorer.selendra.org/api",
};

interface VerifyOptions {
  network?: string;
  compiler?: string;
  optimization?: boolean;
  runs?: string;
  constructor?: string;
  license?: string;
}

interface CompilerInput {
  language: string;
  sources: Record<string, { content: string }>;
  settings: {
    optimizer?: {
      enabled: boolean;
      runs: number;
    };
    outputSelection: Record<string, Record<string, string[]>>;
  };
}

interface VerifyResponse {
  success: boolean;
  result?: string;
  message?: string;
  error?: string;
}

/**
 * Common license types for Solidity contracts
 */
const LICENSE_TYPES: Record<string, string> = {
  UNLICENSED: "1",
  MIT: "2",
  "GPL-2.0": "3",
  "GPL-3.0": "4",
  "LGPL-2.1": "5",
  "LGPL-3.0": "6",
  "BSD-2-Clause": "7",
  "BSD-3-Clause": "8",
  "MPL-2.0": "9",
  "OSL-3.0": "10",
  "Apache-2.0": "11",
  "AGPL-3.0": "12",
  "BSL-1.1": "13",
};

/**
 * Read contract source file
 */
async function readContractSource(contractPath: string): Promise<string> {
  try {
    return await fs.readFile(contractPath, "utf-8");
  } catch {
    throw new Error(`Could not read contract source: ${contractPath}`);
  }
}

/**
 * Find contract artifact and source
 */
async function findContractFiles(
  contractName: string
): Promise<{ artifact: any; sourcePath: string }> {
  // Common paths for Hardhat
  const hardhatArtifact = path.join(
    process.cwd(),
    "artifacts",
    "contracts",
    `${contractName}.sol`,
    `${contractName}.json`
  );
  const hardhatSource = path.join(
    process.cwd(),
    "contracts",
    `${contractName}.sol`
  );

  // Common paths for Foundry
  const foundryArtifact = path.join(
    process.cwd(),
    "out",
    `${contractName}.sol`,
    `${contractName}.json`
  );
  const foundrySource = path.join(process.cwd(), "src", `${contractName}.sol`);

  // Check Hardhat paths
  try {
    await fs.access(hardhatArtifact);
    await fs.access(hardhatSource);
    const artifact = JSON.parse(await fs.readFile(hardhatArtifact, "utf-8"));
    return { artifact, sourcePath: hardhatSource };
  } catch {
    // Try Foundry paths
  }

  // Check Foundry paths
  try {
    await fs.access(foundryArtifact);
    await fs.access(foundrySource);
    const artifact = JSON.parse(await fs.readFile(foundryArtifact, "utf-8"));
    return { artifact, sourcePath: foundrySource };
  } catch {
    // Continue to error
  }

  throw new Error(
    `Could not find contract files for ${contractName}.\n` +
      "Make sure the contract is compiled and source is in contracts/ or src/"
  );
}

/**
 * Get compiler version from artifact
 */
function getCompilerVersion(artifact: any): string {
  // Hardhat stores it in metadata
  if (artifact.metadata) {
    try {
      const metadata =
        typeof artifact.metadata === "string"
          ? JSON.parse(artifact.metadata)
          : artifact.metadata;
      return metadata.compiler?.version || "0.8.20";
    } catch {
      // Fall through
    }
  }

  // Foundry stores differently
  if (artifact.rawMetadata) {
    try {
      const metadata = JSON.parse(artifact.rawMetadata);
      return metadata.compiler?.version || "0.8.20";
    } catch {
      // Fall through
    }
  }

  return "0.8.20"; // Default
}

/**
 * Extract license from source
 */
function extractLicense(source: string): string {
  const licenseMatch = source.match(/\/\/\s*SPDX-License-Identifier:\s*(\S+)/i);
  if (licenseMatch) {
    return licenseMatch[1];
  }
  return "UNLICENSED";
}

/**
 * Verify contract via explorer API
 */
async function verifyViaApi(params: {
  apiUrl: string;
  address: string;
  contractName: string;
  sourceCode: string;
  compilerVersion: string;
  optimizationUsed: boolean;
  runs: number;
  constructorArgs?: string;
  licenseType: string;
}): Promise<VerifyResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    // Build form data for explorer API
    const formData = new URLSearchParams();
    formData.append("module", "contract");
    formData.append("action", "verifysourcecode");
    formData.append("contractaddress", params.address);
    formData.append("sourceCode", params.sourceCode);
    formData.append("codeformat", "solidity-single-file");
    formData.append("contractname", params.contractName);
    formData.append("compilerversion", `v${params.compilerVersion}`);
    formData.append("optimizationUsed", params.optimizationUsed ? "1" : "0");
    formData.append("runs", params.runs.toString());
    formData.append("licenseType", params.licenseType);

    if (params.constructorArgs) {
      formData.append("constructorArguements", params.constructorArgs);
    }

    const response = await fetch(params.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = (await response.json()) as Record<string, unknown>;

    if (
      data.status === "1" ||
      (data.result as string)?.toLowerCase().includes("success")
    ) {
      return {
        success: true,
        result: data.result as string,
        message: (data.message as string) || "Verification submitted",
      };
    }

    return {
      success: false,
      error:
        (data.result as string) ||
        (data.message as string) ||
        "Verification failed",
    };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      return { success: false, error: "Request timed out" };
    }

    if (error.code === "ECONNREFUSED" || error.cause?.code === "ECONNREFUSED") {
      return { success: false, error: "Explorer API unavailable" };
    }

    return { success: false, error: error.message || "Unknown error" };
  }
}

/**
 * Check verification status
 */
async function checkVerificationStatus(
  apiUrl: string,
  guid: string
): Promise<VerifyResponse> {
  try {
    const params = new URLSearchParams({
      module: "contract",
      action: "checkverifystatus",
      guid: guid,
    });

    const response = await fetch(`${apiUrl}?${params}`);
    const data = (await response.json()) as Record<string, unknown>;

    if (data.status === "1") {
      return { success: true, result: data.result as string };
    }

    // Still pending
    if ((data.result as string)?.includes("Pending")) {
      return { success: false, message: "Verification pending..." };
    }

    return {
      success: false,
      error: (data.result as string) || "Unknown status",
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifyCommand(
  contractAddress: string,
  contractName: string,
  options: VerifyOptions
) {
  // Validate address
  if (!isAddress(contractAddress)) {
    console.error(chalk.red("Invalid contract address"));
    console.log(
      chalk.gray(
        "Example: selendra verify 0x123... MyContract --network testnet"
      )
    );
    process.exit(1);
    return;
  }

  printHeader("Contract Verification");

  // Select network
  let networkKey: NetworkKey;
  if (options.network) {
    networkKey = options.network as NetworkKey;
  } else {
    networkKey = await promptNetwork();
  }

  if (networkKey === "local") {
    console.error(
      chalk.red("Contract verification not available for local network")
    );
    process.exit(1);
    return;
  }

  const network = getNetwork(networkKey);
  const apiUrl =
    networkKey === "mainnet" ? EXPLORER_API.mainnet : EXPLORER_API.testnet;

  printKeyValue("Contract:", contractAddress);
  printKeyValue("Name:", contractName);
  printKeyValue("Network:", network.name);
  newLine();

  const spinner = ora("Loading contract files...").start();

  try {
    // Find contract files
    const { artifact, sourcePath } = await findContractFiles(contractName);
    const sourceCode = await readContractSource(sourcePath);

    // Get compiler settings
    const compilerVersion = options.compiler || getCompilerVersion(artifact);
    const optimizationUsed = options.optimization !== false; // Default true
    const runs = parseInt(options.runs || "200", 10);
    const license = options.license || extractLicense(sourceCode);
    const licenseType = LICENSE_TYPES[license] || "1";

    spinner.succeed("Contract files loaded");
    newLine();

    printHeader("Verification Settings");
    printKeyValue("Source File:", path.basename(sourcePath));
    printKeyValue("Compiler:", `v${compilerVersion}`);
    printKeyValue(
      "Optimization:",
      optimizationUsed ? `Enabled (${runs} runs)` : "Disabled"
    );
    printKeyValue("License:", license);
    newLine();

    if (options.constructor) {
      printKeyValue("Constructor Args:", options.constructor);
      newLine();
    }

    // Confirm verification
    const confirm = await promptConfirm(
      `Submit verification for ${contractName}?`,
      true
    );

    if (!confirm) {
      console.log(chalk.yellow("Verification cancelled"));
      return;
    }

    spinner.start("Submitting verification request...");

    // Submit verification
    const result = await verifyViaApi({
      apiUrl,
      address: contractAddress,
      contractName,
      sourceCode,
      compilerVersion,
      optimizationUsed,
      runs,
      constructorArgs: options.constructor,
      licenseType,
    });

    if (result.success) {
      spinner.succeed("Verification submitted!");
      newLine();

      // If we got a GUID, poll for status
      if (result.result && result.result.length > 20) {
        spinner.start("Checking verification status...");

        // Poll status a few times
        for (let i = 0; i < 5; i++) {
          await new Promise((resolve) => setTimeout(resolve, 3000));

          const status = await checkVerificationStatus(apiUrl, result.result);
          if (status.success) {
            spinner.succeed("Contract verified successfully!");
            break;
          } else if (status.error && !status.message) {
            spinner.warn(`Verification: ${status.error}`);
            break;
          }
          // Still pending, continue
        }
      }

      newLine();
      printSuccess("Verification Complete");
      newLine();

      printHeader("Verified Contract");
      printKeyValue("Address:", contractAddress, chalk.white);
      printKeyValue("Name:", contractName);
      printKeyValue("Network:", network.name);
      newLine();

      if (network.explorer) {
        console.log(chalk.gray("View verified contract:"));
        console.log(
          chalk.cyan(`${network.explorer}/address/${contractAddress}#code`)
        );
        newLine();
      }

      printInfo("Users can now read your contract source on the explorer!");
      newLine();
    } else {
      spinner.fail("Verification failed");
      newLine();

      const isApiUnavailable =
        result.error?.includes("unavailable") ||
        result.error?.includes("timeout");

      if (isApiUnavailable) {
        printWarning("Explorer API is currently unavailable");
        newLine();

        printHeader("Manual Verification");
        printInfo("Visit the explorer to verify manually:");
        console.log(
          chalk.cyan(`${network.explorer}/address/${contractAddress}#code`)
        );
        newLine();

        console.log(chalk.gray("Steps:"));
        console.log(chalk.white("  1. Click 'Verify & Publish'"));
        console.log(
          chalk.white("  2. Select compiler version: " + compilerVersion)
        );
        console.log(chalk.white("  3. Paste your contract source code"));
        console.log(chalk.white("  4. Submit for verification"));
        newLine();
      } else {
        console.error(chalk.red("Error:"), result.error);
        newLine();

        printTroubleshooting([
          "Ensure the source code matches exactly what was deployed",
          "Check the compiler version matches",
          "Verify optimizer settings match deployment",
          "If using imports, flatten the contract first",
          `Try manual verification at ${network.explorer}`,
        ]);
      }

      process.exit(1);
    }
  } catch (error: any) {
    spinner.fail("Verification failed");
    console.error(chalk.red("Error:"), error.message);
    newLine();

    if (error.message.includes("Could not find")) {
      printTroubleshooting([
        "Run 'selendra compile' first",
        `Ensure ${contractName}.sol exists in contracts/ or src/`,
        "Check the contract name matches the file name",
      ]);
    }

    process.exit(1);
  }
}
