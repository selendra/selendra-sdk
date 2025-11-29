/**
 * Project Configuration (TASK-008)
 *
 * Support for selendra.config.ts project files
 */

import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import { pathToFileURL } from "url";

/**
 * Network configuration
 */
export interface NetworkConfig {
  /** RPC URL for the network */
  rpc: string;
  /** Chain ID */
  chainId?: number;
  /** Block explorer URL */
  explorer?: string;
  /** Is this a testnet? */
  testnet?: boolean;
}

/**
 * Compiler configuration
 */
export interface CompilerConfig {
  /** Solidity version */
  version?: string;
  /** Optimizer settings */
  optimizer?: {
    enabled: boolean;
    runs: number;
  };
  /** EVM version target */
  evmVersion?: string;
  /** Via IR compilation */
  viaIR?: boolean;
}

/**
 * Deployment configuration
 */
export interface DeployConfig {
  /** Default network for deployment */
  defaultNetwork?: string;
  /** Gas price strategy */
  gasPrice?: "auto" | "fast" | "standard" | "slow" | number;
  /** Gas limit multiplier */
  gasMultiplier?: number;
  /** Confirmation blocks to wait */
  confirmations?: number;
  /** Verification API key */
  verifyApiKey?: string;
}

/**
 * Account configuration
 */
export interface AccountConfig {
  /** Default account alias to use */
  defaultAccount?: string;
  /** Hardware wallet support */
  hardwareWallet?: "ledger" | "trezor" | null;
  /** HD derivation path */
  derivationPath?: string;
}

/**
 * Main project configuration
 */
export interface SelendraConfig {
  /** Project name */
  name?: string;
  /** Networks configuration */
  networks?: Record<string, NetworkConfig>;
  /** Solidity compiler settings */
  solidity?: CompilerConfig;
  /** Deployment settings */
  deploy?: DeployConfig;
  /** Account settings */
  accounts?: AccountConfig;
  /** Contract source paths */
  paths?: {
    sources?: string;
    artifacts?: string;
    cache?: string;
    tests?: string;
  };
  /** Plugin configurations */
  plugins?: string[];
}

/**
 * Default configuration
 */
export const defaultConfig: SelendraConfig = {
  name: "selendra-project",
  networks: {
    mainnet: {
      rpc: "https://rpc.selendra.org",
      chainId: 1961,
      explorer: "https://explorer.selendra.org",
      testnet: false,
    },
    testnet: {
      rpc: "https://rpc.testnet.selendra.org",
      chainId: 1953,
      explorer: "https://explorer.testnet.selendra.org",
      testnet: true,
    },
    local: {
      rpc: "http://localhost:9944",
      chainId: 1953,
      testnet: true,
    },
  },
  solidity: {
    version: "0.8.24",
    optimizer: {
      enabled: true,
      runs: 200,
    },
    evmVersion: "london",
    viaIR: false,
  },
  deploy: {
    defaultNetwork: "testnet",
    gasPrice: "auto",
    gasMultiplier: 1.2,
    confirmations: 2,
  },
  accounts: {
    defaultAccount: undefined,
    hardwareWallet: null,
    derivationPath: "m/44'/60'/0'/0/0",
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
    tests: "./test",
  },
  plugins: [],
};

/**
 * Configuration file names to search for
 */
const CONFIG_FILES = [
  "selendra.config.ts",
  "selendra.config.js",
  "selendra.config.mjs",
  "selendra.config.json",
];

/**
 * Find configuration file in project
 */
export async function findConfigFile(
  startDir: string = process.cwd()
): Promise<string | null> {
  let currentDir = startDir;

  while (currentDir !== path.dirname(currentDir)) {
    for (const configFile of CONFIG_FILES) {
      const configPath = path.join(currentDir, configFile);
      try {
        await fs.access(configPath);
        return configPath;
      } catch {
        // File doesn't exist, continue
      }
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}

/**
 * Load configuration from file
 */
export async function loadConfig(configPath?: string): Promise<SelendraConfig> {
  const resolvedPath = configPath || (await findConfigFile());

  if (!resolvedPath) {
    return defaultConfig;
  }

  try {
    const ext = path.extname(resolvedPath);

    if (ext === ".json") {
      const content = await fs.readFile(resolvedPath, "utf-8");
      const config = JSON.parse(content);
      return mergeConfig(defaultConfig, config);
    }

    if (ext === ".ts" || ext === ".mjs" || ext === ".js") {
      // Dynamic import for ESM modules
      const fileUrl = pathToFileURL(resolvedPath).href;
      const module = await import(fileUrl);
      const config = module.default || module;
      return mergeConfig(defaultConfig, config);
    }

    console.warn(chalk.yellow(`Unsupported config file format: ${ext}`));
    return defaultConfig;
  } catch (error: any) {
    console.warn(
      chalk.yellow(
        `Failed to load config from ${resolvedPath}: ${error.message}`
      )
    );
    return defaultConfig;
  }
}

/**
 * Deep merge configuration objects
 */
function mergeConfig(
  base: SelendraConfig,
  override: Partial<SelendraConfig>
): SelendraConfig {
  const result: SelendraConfig = { ...base };

  for (const key of Object.keys(override) as (keyof SelendraConfig)[]) {
    const baseValue = base[key];
    const overrideValue = override[key];

    if (
      typeof baseValue === "object" &&
      baseValue !== null &&
      typeof overrideValue === "object" &&
      overrideValue !== null &&
      !Array.isArray(baseValue)
    ) {
      (result as any)[key] = { ...baseValue, ...overrideValue };
    } else if (overrideValue !== undefined) {
      (result as any)[key] = overrideValue;
    }
  }

  return result;
}

/**
 * Get network configuration
 */
export function getNetworkConfig(
  config: SelendraConfig,
  networkName: string
): NetworkConfig | null {
  return config.networks?.[networkName] || null;
}

/**
 * Generate default config file content
 */
export function generateConfigTemplate(): string {
  return `import { defineConfig } from "@selendrajs/cli";

export default defineConfig({
  // Project name
  name: "my-selendra-project",

  // Network configurations
  networks: {
    mainnet: {
      rpc: "https://rpc.selendra.org",
      chainId: 1961,
      explorer: "https://explorer.selendra.org",
      testnet: false,
    },
    testnet: {
      rpc: "https://rpc.testnet.selendra.org",
      chainId: 1953,
      explorer: "https://explorer.testnet.selendra.org",
      testnet: true,
    },
    local: {
      rpc: "http://localhost:9944",
      chainId: 1953,
      testnet: true,
    },
  },

  // Solidity compiler settings
  solidity: {
    version: "0.8.24",
    optimizer: {
      enabled: true,
      runs: 200,
    },
    evmVersion: "london",
    viaIR: false,
  },

  // Deployment settings
  deploy: {
    defaultNetwork: "testnet",
    gasPrice: "auto",
    gasMultiplier: 1.2,
    confirmations: 2,
    // verifyApiKey: process.env.VERIFY_API_KEY,
  },

  // Account settings
  accounts: {
    // defaultAccount: "deployer",
    // hardwareWallet: "ledger",
    derivationPath: "m/44'/60'/0'/0/0",
  },

  // Project paths
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
    tests: "./test",
  },

  // Plugins (future support)
  plugins: [],
});
`;
}

/**
 * Type-safe config helper for TypeScript configs
 */
export function defineConfig(config: SelendraConfig): SelendraConfig {
  return config;
}

/**
 * Initialize config file in project
 */
export async function initConfig(
  projectDir: string = process.cwd(),
  format: "ts" | "js" | "json" = "ts"
): Promise<string> {
  const configName = `selendra.config.${format}`;
  const configPath = path.join(projectDir, configName);

  // Check if config already exists
  try {
    await fs.access(configPath);
    throw new Error(`Configuration file already exists: ${configPath}`);
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  let content: string;

  if (format === "json") {
    content = JSON.stringify(
      {
        name: "my-selendra-project",
        networks: defaultConfig.networks,
        solidity: defaultConfig.solidity,
        deploy: defaultConfig.deploy,
        paths: defaultConfig.paths,
      },
      null,
      2
    );
  } else if (format === "js") {
    content = `/** @type {import('@selendrajs/cli').SelendraConfig} */
module.exports = ${JSON.stringify(
      {
        name: "my-selendra-project",
        networks: defaultConfig.networks,
        solidity: defaultConfig.solidity,
        deploy: defaultConfig.deploy,
        paths: defaultConfig.paths,
      },
      null,
      2
    )};
`;
  } else {
    content = generateConfigTemplate();
  }

  await fs.writeFile(configPath, content, "utf-8");
  return configPath;
}

/**
 * Validate configuration
 */
export function validateConfig(config: SelendraConfig): string[] {
  const errors: string[] = [];

  // Validate networks
  if (config.networks) {
    for (const [name, network] of Object.entries(config.networks)) {
      if (!network.rpc) {
        errors.push(`Network '${name}' is missing 'rpc' URL`);
      }
    }
  }

  // Validate solidity
  if (config.solidity?.version) {
    const versionRegex = /^0\.\d+\.\d+$/;
    if (!versionRegex.test(config.solidity.version)) {
      errors.push(
        `Invalid Solidity version format: ${config.solidity.version}`
      );
    }
  }

  // Validate paths
  if (config.paths) {
    for (const [name, pathValue] of Object.entries(config.paths)) {
      if (
        pathValue &&
        !pathValue.startsWith("./") &&
        !pathValue.startsWith("/")
      ) {
        errors.push(`Path '${name}' should be a relative or absolute path`);
      }
    }
  }

  return errors;
}
