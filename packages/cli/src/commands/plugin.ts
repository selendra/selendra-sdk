/**
 * Plugin System Command (TASK-017)
 *
 * Allows third-party CLI plugins for extensibility
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawn } from "child_process";

// Plugin storage paths
const SELENDRA_HOME = path.join(process.env.HOME || "~", ".selendra");
const PLUGINS_DIR = path.join(SELENDRA_HOME, "plugins");
const PLUGINS_CONFIG = path.join(SELENDRA_HOME, "plugins.json");
const PLUGIN_REGISTRY_URL =
  process.env.SELENDRA_PLUGIN_REGISTRY ||
  "https://raw.githubusercontent.com/selendra/selendra-sdk/main/plugins/registry.json";

// ============================================
// Types
// ============================================

interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  main: string;
  commands: PluginCommand[];
  hooks?: PluginHooks;
  dependencies?: Record<string, string>;
  selendraVersion?: string;
}

interface PluginCommand {
  name: string;
  description: string;
  arguments?: PluginArgument[];
  options?: PluginOption[];
}

interface PluginArgument {
  name: string;
  description: string;
  required?: boolean;
  default?: string;
}

interface PluginOption {
  flags: string;
  description: string;
  default?: string | boolean;
}

interface PluginHooks {
  preCompile?: string;
  postCompile?: string;
  preDeploy?: string;
  postDeploy?: string;
  preTest?: string;
  postTest?: string;
}

interface InstalledPlugin {
  name: string;
  version: string;
  description: string;
  installedAt: string;
  enabled: boolean;
  source: "npm" | "local" | "git";
  path: string;
}

interface PluginsConfig {
  plugins: InstalledPlugin[];
  lastUpdated: string;
}

interface RegistryPlugin {
  name: string;
  package: string;
  description: string;
  author: string;
  version: string;
  downloads: number;
  rating: number;
  tags: string[];
}

interface PluginRegistry {
  version: string;
  plugins: RegistryPlugin[];
  featured: string[];
}

// ============================================
// Plugin Management
// ============================================

function ensurePluginsDir(): void {
  if (!fs.existsSync(PLUGINS_DIR)) {
    fs.mkdirSync(PLUGINS_DIR, { recursive: true });
  }
}

function loadPluginsConfig(): PluginsConfig {
  try {
    if (fs.existsSync(PLUGINS_CONFIG)) {
      return JSON.parse(fs.readFileSync(PLUGINS_CONFIG, "utf-8"));
    }
  } catch {
    // Ignore errors
  }
  return {
    plugins: [],
    lastUpdated: new Date().toISOString(),
  };
}

function savePluginsConfig(config: PluginsConfig): void {
  try {
    ensurePluginsDir();
    config.lastUpdated = new Date().toISOString();
    fs.writeFileSync(PLUGINS_CONFIG, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(chalk.red("Failed to save plugins config"));
  }
}

function getPluginPath(pluginName: string): string {
  return path.join(PLUGINS_DIR, pluginName);
}

async function fetchRegistry(): Promise<PluginRegistry | null> {
  try {
    const response = await fetch(PLUGIN_REGISTRY_URL);
    if (response.ok) {
      return (await response.json()) as PluginRegistry;
    }
  } catch {
    // Silently fail
  }
  return null;
}

function loadPluginManifest(pluginPath: string): PluginManifest | null {
  try {
    const manifestPath = path.join(pluginPath, "package.json");
    if (fs.existsSync(manifestPath)) {
      const pkg = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      // Extract selendra plugin config
      const selendraConfig = pkg.selendra || {};
      return {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description || "",
        author:
          typeof pkg.author === "string" ? pkg.author : pkg.author?.name || "",
        license: pkg.license || "MIT",
        main: pkg.main || "index.js",
        commands: selendraConfig.commands || [],
        hooks: selendraConfig.hooks,
        dependencies: pkg.dependencies,
        selendraVersion: selendraConfig.selendraVersion,
      };
    }
  } catch {
    // Ignore errors
  }
  return null;
}

// ============================================
// Plugin Commands
// ============================================

async function installPlugin(
  source: string,
  options: { local?: boolean; git?: boolean }
): Promise<void> {
  const spinner = ora("Installing plugin...").start();

  try {
    ensurePluginsDir();

    let pluginPath: string;
    let installSource: "npm" | "local" | "git";
    let pluginName: string;

    if (options.local) {
      // Install from local path
      installSource = "local";
      const sourcePath = path.resolve(source);

      if (!fs.existsSync(sourcePath)) {
        spinner.fail(`Path not found: ${sourcePath}`);
        return;
      }

      const manifest = loadPluginManifest(sourcePath);
      if (!manifest) {
        spinner.fail("Invalid plugin: missing package.json");
        return;
      }

      pluginName = manifest.name.replace(/^@selendra\/plugin-/, "");
      pluginPath = getPluginPath(pluginName);

      // Copy plugin files
      if (fs.existsSync(pluginPath)) {
        fs.rmSync(pluginPath, { recursive: true });
      }
      fs.cpSync(sourcePath, pluginPath, { recursive: true });
    } else if (options.git) {
      // Install from git repository
      installSource = "git";
      pluginName = path
        .basename(source, ".git")
        .replace(/^selendra-plugin-/, "");
      pluginPath = getPluginPath(pluginName);

      spinner.text = "Cloning repository...";
      if (fs.existsSync(pluginPath)) {
        fs.rmSync(pluginPath, { recursive: true });
      }
      execSync(`git clone ${source} ${pluginPath}`, { stdio: "pipe" });
    } else {
      // Install from npm
      installSource = "npm";
      pluginName = source.replace(/^@selendra\/plugin-/, "");
      pluginPath = getPluginPath(pluginName);

      spinner.text = "Downloading from npm...";
      if (fs.existsSync(pluginPath)) {
        fs.rmSync(pluginPath, { recursive: true });
      }
      fs.mkdirSync(pluginPath, { recursive: true });

      // Use npm pack and extract
      const npmPackage = source.startsWith("@")
        ? source
        : `@selendrajs/plugin-${source}`;

      execSync(`npm pack ${npmPackage} --pack-destination ${pluginPath}`, {
        stdio: "pipe",
        cwd: pluginPath,
      });

      // Extract the tarball
      const tarballs = fs
        .readdirSync(pluginPath)
        .filter((f) => f.endsWith(".tgz"));
      if (tarballs.length > 0) {
        execSync(`tar -xzf ${tarballs[0]} --strip-components=1`, {
          cwd: pluginPath,
        });
        fs.unlinkSync(path.join(pluginPath, tarballs[0]));
      }
    }

    // Install dependencies
    spinner.text = "Installing dependencies...";
    const manifestPath = path.join(pluginPath, "package.json");
    if (fs.existsSync(manifestPath)) {
      try {
        execSync("npm install --production", {
          cwd: pluginPath,
          stdio: "pipe",
        });
      } catch {
        // Some plugins may not have dependencies
      }
    }

    // Load and validate manifest
    const manifest = loadPluginManifest(pluginPath);
    if (!manifest) {
      spinner.fail("Invalid plugin: missing or invalid package.json");
      fs.rmSync(pluginPath, { recursive: true });
      return;
    }

    // Update plugins config
    const config = loadPluginsConfig();
    const existingIndex = config.plugins.findIndex(
      (p) => p.name === manifest.name
    );

    const pluginInfo: InstalledPlugin = {
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      installedAt: new Date().toISOString(),
      enabled: true,
      source: installSource,
      path: pluginPath,
    };

    if (existingIndex >= 0) {
      config.plugins[existingIndex] = pluginInfo;
    } else {
      config.plugins.push(pluginInfo);
    }

    savePluginsConfig(config);

    spinner.succeed(
      chalk.green(`Installed ${chalk.cyan(manifest.name)}@${manifest.version}`)
    );

    // Show available commands
    if (manifest.commands && manifest.commands.length > 0) {
      console.log();
      console.log(chalk.dim("New commands available:"));
      for (const cmd of manifest.commands) {
        console.log(
          `  ${chalk.cyan(`selendra ${cmd.name}`)} - ${cmd.description}`
        );
      }
    }
  } catch (error: any) {
    spinner.fail(`Failed to install plugin: ${error.message}`);
  }
}

async function uninstallPlugin(pluginName: string): Promise<void> {
  const config = loadPluginsConfig();
  const plugin = config.plugins.find(
    (p) =>
      p.name === pluginName ||
      p.name === `@selendrajs/plugin-${pluginName}` ||
      p.name.endsWith(`/${pluginName}`)
  );

  if (!plugin) {
    console.log(chalk.red(`Plugin not found: ${pluginName}`));
    return;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Uninstall ${chalk.cyan(plugin.name)}?`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.dim("Cancelled"));
    return;
  }

  const spinner = ora("Uninstalling plugin...").start();

  try {
    // Remove plugin directory
    if (fs.existsSync(plugin.path)) {
      fs.rmSync(plugin.path, { recursive: true });
    }

    // Update config
    config.plugins = config.plugins.filter((p) => p.name !== plugin.name);
    savePluginsConfig(config);

    spinner.succeed(chalk.green(`Uninstalled ${chalk.cyan(plugin.name)}`));
  } catch (error: any) {
    spinner.fail(`Failed to uninstall: ${error.message}`);
  }
}

async function listPlugins(options: { available?: boolean }): Promise<void> {
  if (options.available) {
    // Show plugins from registry
    const spinner = ora("Fetching plugin registry...").start();
    const registry = await fetchRegistry();

    if (!registry) {
      spinner.info("Could not fetch registry. Showing sample plugins...");
      console.log();
      console.log(chalk.cyan.bold("Available Plugins:"));
      console.log();

      // Show sample plugins
      const samplePlugins = [
        {
          name: "hardhat-bridge",
          description: "Bridge Hardhat projects to Selendra CLI",
          tags: ["tooling", "hardhat"],
        },
        {
          name: "foundry-bridge",
          description: "Bridge Foundry projects to Selendra CLI",
          tags: ["tooling", "foundry"],
        },
        {
          name: "ipfs-deploy",
          description: "Deploy frontend to IPFS after contract deployment",
          tags: ["deployment", "ipfs"],
        },
        {
          name: "gas-reporter",
          description: "Generate gas usage reports for deployments",
          tags: ["analysis", "gas"],
        },
        {
          name: "contract-sizer",
          description: "Show contract bytecode sizes",
          tags: ["analysis", "optimization"],
        },
        {
          name: "coverage",
          description: "Code coverage for Solidity tests",
          tags: ["testing", "coverage"],
        },
      ];

      for (const plugin of samplePlugins) {
        console.log(`  ${chalk.yellow(`@selendrajs/plugin-${plugin.name}`)}`);
        console.log(`    ${plugin.description}`);
        console.log(
          `    ${chalk.dim("Tags:")} ${plugin.tags
            .map((t) => chalk.cyan(t))
            .join(", ")}`
        );
        console.log();
      }

      console.log(
        chalk.dim(
          "Install with: selendra plugin install @selendrajs/plugin-<name>"
        )
      );
      return;
    }

    spinner.succeed("Fetched plugin registry");
    console.log();
    console.log(chalk.cyan.bold("📦 Available Plugins:"));
    console.log();

    if (registry.featured && registry.featured.length > 0) {
      console.log(chalk.yellow.bold("⭐ Featured:"));
      for (const name of registry.featured) {
        const plugin = registry.plugins.find((p) => p.name === name);
        if (plugin) {
          console.log(
            `  ${chalk.cyan(plugin.package)} - ${plugin.description}`
          );
        }
      }
      console.log();
    }

    console.log(chalk.bold("All Plugins:"));
    for (const plugin of registry.plugins) {
      console.log(`  ${chalk.yellow(plugin.package)} v${plugin.version}`);
      console.log(`    ${plugin.description}`);
      console.log(
        `    ${chalk.dim("By:")} ${plugin.author} | ${chalk.dim(
          "Downloads:"
        )} ${plugin.downloads}`
      );
      console.log();
    }
    return;
  }

  // Show installed plugins
  const config = loadPluginsConfig();

  if (config.plugins.length === 0) {
    console.log();
    console.log(chalk.yellow("No plugins installed."));
    console.log();
    console.log(chalk.dim("Install a plugin with:"));
    console.log(chalk.dim("  selendra plugin install <plugin-name>"));
    console.log();
    console.log(chalk.dim("See available plugins:"));
    console.log(chalk.dim("  selendra plugin list --available"));
    return;
  }

  console.log();
  console.log(chalk.cyan.bold("📦 Installed Plugins:"));
  console.log();

  for (const plugin of config.plugins) {
    const status = plugin.enabled
      ? chalk.green("● enabled")
      : chalk.dim("○ disabled");

    console.log(
      `  ${chalk.yellow(plugin.name)} ${chalk.dim(`v${plugin.version}`)}`
    );
    console.log(`    ${plugin.description}`);
    console.log(
      `    ${status} | ${chalk.dim("Source:")} ${plugin.source} | ${chalk.dim(
        "Installed:"
      )} ${new Date(plugin.installedAt).toLocaleDateString()}`
    );
    console.log();
  }
}

async function enablePlugin(pluginName: string): Promise<void> {
  const config = loadPluginsConfig();
  const plugin = config.plugins.find(
    (p) => p.name === pluginName || p.name.includes(pluginName)
  );

  if (!plugin) {
    console.log(chalk.red(`Plugin not found: ${pluginName}`));
    return;
  }

  plugin.enabled = true;
  savePluginsConfig(config);
  console.log(chalk.green(`✓ Enabled ${chalk.cyan(plugin.name)}`));
}

async function disablePlugin(pluginName: string): Promise<void> {
  const config = loadPluginsConfig();
  const plugin = config.plugins.find(
    (p) => p.name === pluginName || p.name.includes(pluginName)
  );

  if (!plugin) {
    console.log(chalk.red(`Plugin not found: ${pluginName}`));
    return;
  }

  plugin.enabled = false;
  savePluginsConfig(config);
  console.log(chalk.yellow(`○ Disabled ${chalk.cyan(plugin.name)}`));
}

async function updatePlugin(pluginName?: string): Promise<void> {
  const config = loadPluginsConfig();
  const pluginsToUpdate = pluginName
    ? config.plugins.filter(
        (p) => p.name === pluginName || p.name.includes(pluginName)
      )
    : config.plugins.filter((p) => p.source === "npm");

  if (pluginsToUpdate.length === 0) {
    console.log(
      chalk.yellow(
        pluginName ? `Plugin not found: ${pluginName}` : "No plugins to update"
      )
    );
    return;
  }

  for (const plugin of pluginsToUpdate) {
    if (plugin.source === "local") {
      console.log(
        chalk.dim(`Skipping ${plugin.name} (local plugin, update manually)`)
      );
      continue;
    }

    const spinner = ora(`Updating ${plugin.name}...`).start();

    try {
      // Re-install the plugin to get latest version
      await installPlugin(plugin.name, {});
      spinner.succeed(`Updated ${chalk.cyan(plugin.name)}`);
    } catch (error: any) {
      spinner.fail(`Failed to update ${plugin.name}: ${error.message}`);
    }
  }
}

async function showPluginInfo(pluginName: string): Promise<void> {
  const config = loadPluginsConfig();
  const plugin = config.plugins.find(
    (p) => p.name === pluginName || p.name.includes(pluginName)
  );

  if (!plugin) {
    console.log(chalk.red(`Plugin not found: ${pluginName}`));
    return;
  }

  const manifest = loadPluginManifest(plugin.path);

  console.log();
  console.log(chalk.cyan.bold(`📦 ${plugin.name}`));
  console.log(chalk.dim("─".repeat(50)));
  console.log();
  console.log(`${chalk.dim("Version:")} ${plugin.version}`);
  console.log(`${chalk.dim("Description:")} ${plugin.description}`);
  console.log(`${chalk.dim("Source:")} ${plugin.source}`);
  console.log(`${chalk.dim("Path:")} ${plugin.path}`);
  console.log(
    `${chalk.dim("Installed:")} ${new Date(
      plugin.installedAt
    ).toLocaleString()}`
  );
  console.log(
    `${chalk.dim("Status:")} ${
      plugin.enabled ? chalk.green("enabled") : chalk.dim("disabled")
    }`
  );

  if (manifest) {
    console.log(`${chalk.dim("Author:")} ${manifest.author}`);
    console.log(`${chalk.dim("License:")} ${manifest.license}`);

    if (manifest.commands && manifest.commands.length > 0) {
      console.log();
      console.log(chalk.yellow.bold("Commands:"));
      for (const cmd of manifest.commands) {
        console.log(`  ${chalk.cyan(cmd.name)} - ${cmd.description}`);
        if (cmd.arguments) {
          for (const arg of cmd.arguments) {
            const required = arg.required ? chalk.red("*") : "";
            console.log(
              `    ${chalk.dim(`<${arg.name}>`)}${required} ${arg.description}`
            );
          }
        }
        if (cmd.options) {
          for (const opt of cmd.options) {
            console.log(`    ${chalk.dim(opt.flags)} ${opt.description}`);
          }
        }
      }
    }

    if (manifest.hooks) {
      console.log();
      console.log(chalk.yellow.bold("Hooks:"));
      for (const [hook, script] of Object.entries(manifest.hooks)) {
        console.log(`  ${chalk.cyan(hook)} → ${script}`);
      }
    }
  }
  console.log();
}

async function createPlugin(pluginName: string): Promise<void> {
  const normalizedName = pluginName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^selendra-plugin-/, "")
    .replace(/^@selendra\/plugin-/, "");

  const fullName = `@selendrajs/plugin-${normalizedName}`;
  const pluginDir = path.join(
    process.cwd(),
    `selendra-plugin-${normalizedName}`
  );

  if (fs.existsSync(pluginDir)) {
    console.log(chalk.red(`Directory already exists: ${pluginDir}`));
    return;
  }

  console.log();
  console.log(chalk.cyan.bold(`Creating Selendra plugin: ${fullName}`));
  console.log();

  // Prompt for details
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "description",
      message: "Plugin description:",
      default: `A Selendra CLI plugin`,
    },
    {
      type: "input",
      name: "author",
      message: "Author:",
      default: process.env.USER || "Developer",
    },
    {
      type: "checkbox",
      name: "hooks",
      message: "Which hooks should the plugin use?",
      choices: [
        { name: "preCompile", value: "preCompile" },
        { name: "postCompile", value: "postCompile" },
        { name: "preDeploy", value: "preDeploy" },
        { name: "postDeploy", value: "postDeploy" },
        { name: "preTest", value: "preTest" },
        { name: "postTest", value: "postTest" },
      ],
    },
    {
      type: "confirm",
      name: "addCommand",
      message: "Add a custom command?",
      default: true,
    },
  ]);

  let commandName = "";
  let commandDescription = "";
  if (answers.addCommand) {
    const cmdAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Command name:",
        default: normalizedName,
      },
      {
        type: "input",
        name: "description",
        message: "Command description:",
        default: `Run ${normalizedName} plugin`,
      },
    ]);
    commandName = cmdAnswers.name;
    commandDescription = cmdAnswers.description;
  }

  const spinner = ora("Creating plugin structure...").start();

  try {
    fs.mkdirSync(pluginDir, { recursive: true });

    // Create package.json
    const packageJson = {
      name: fullName,
      version: "0.1.0",
      description: answers.description,
      author: answers.author,
      license: "MIT",
      main: "dist/index.js",
      types: "dist/index.d.ts",
      files: ["dist"],
      scripts: {
        build: "tsc",
        dev: "tsc --watch",
        prepublishOnly: "npm run build",
      },
      selendra: {
        selendraVersion: ">=0.2.0",
        commands: answers.addCommand
          ? [
              {
                name: commandName,
                description: commandDescription,
                arguments: [],
                options: [],
              },
            ]
          : [],
        hooks: answers.hooks.reduce(
          (acc: Record<string, string>, hook: string) => {
            acc[hook] = `./dist/hooks/${hook}.js`;
            return acc;
          },
          {}
        ),
      },
      dependencies: {},
      devDependencies: {
        typescript: "^5.3.0",
        "@types/node": "^20.0.0",
      },
      peerDependencies: {
        "@selendrajs/cli": ">=0.2.0",
      },
    };

    fs.writeFileSync(
      path.join(pluginDir, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );

    // Create tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        declaration: true,
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
      },
      include: ["src/**/*"],
    };

    fs.writeFileSync(
      path.join(pluginDir, "tsconfig.json"),
      JSON.stringify(tsconfig, null, 2)
    );

    // Create src directory
    fs.mkdirSync(path.join(pluginDir, "src"), { recursive: true });

    // Create main index.ts
    const indexContent = `/**
 * ${fullName}
 * 
 * ${answers.description}
 */

import type { PluginContext } from './types.js';

export interface ${toPascalCase(normalizedName)}Options {
  // Add your plugin options here
}

export async function activate(context: PluginContext): Promise<void> {
  console.log('${fullName} activated');
}

export async function deactivate(): Promise<void> {
  console.log('${fullName} deactivated');
}
`;

    fs.writeFileSync(path.join(pluginDir, "src", "index.ts"), indexContent);

    // Create types.ts
    const typesContent = `/**
 * Plugin types
 */

export interface PluginContext {
  /**
   * The Selendra CLI version
   */
  version: string;

  /**
   * The current working directory
   */
  cwd: string;

  /**
   * Network configuration
   */
  network: {
    name: string;
    rpc: string;
    chainId: number;
  };

  /**
   * Logger utilities
   */
  logger: {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    success(message: string): void;
  };
}

export interface HookContext extends PluginContext {
  /**
   * Arguments passed to the hook
   */
  args: Record<string, unknown>;

  /**
   * Results from previous hooks
   */
  results: Record<string, unknown>;
}
`;

    fs.writeFileSync(path.join(pluginDir, "src", "types.ts"), typesContent);

    // Create command file if needed
    if (answers.addCommand) {
      fs.mkdirSync(path.join(pluginDir, "src", "commands"), {
        recursive: true,
      });

      const commandContent = `/**
 * ${commandName} command
 */

import type { PluginContext } from '../types.js';

export interface ${toPascalCase(commandName)}Options {
  // Add command options here
}

export async function ${toCamelCase(commandName)}Command(
  context: PluginContext,
  args: string[],
  options: ${toPascalCase(commandName)}Options
): Promise<void> {
  context.logger.info('Running ${commandName} command');
  
  // Implement your command logic here
  console.log('Arguments:', args);
  console.log('Options:', options);
  
  context.logger.success('Done!');
}
`;

      fs.writeFileSync(
        path.join(pluginDir, "src", "commands", `${commandName}.ts`),
        commandContent
      );
    }

    // Create hooks if needed
    if (answers.hooks.length > 0) {
      fs.mkdirSync(path.join(pluginDir, "src", "hooks"), { recursive: true });

      for (const hook of answers.hooks) {
        const hookContent = `/**
 * ${hook} hook
 */

import type { HookContext } from '../types.js';

export async function ${hook}(context: HookContext): Promise<void> {
  context.logger.info('Running ${hook} hook');
  
  // Implement your hook logic here
  
  context.logger.success('${hook} completed');
}

export default ${hook};
`;

        fs.writeFileSync(
          path.join(pluginDir, "src", "hooks", `${hook}.ts`),
          hookContent
        );
      }
    }

    // Create README.md
    const readmeContent = `# ${fullName}

${answers.description}

## Installation

\`\`\`bash
selendra plugin install ${fullName}
\`\`\`

Or for local development:

\`\`\`bash
selendra plugin install ./path/to/plugin --local
\`\`\`

## Usage

${
  answers.addCommand
    ? `### Command

\`\`\`bash
selendra ${commandName}
\`\`\`
`
    : ""
}

${
  answers.hooks.length > 0
    ? `### Hooks

This plugin provides the following hooks:

${answers.hooks.map((h: string) => `- \`${h}\``).join("\n")}
`
    : ""
}

## Development

\`\`\`bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Watch for changes
npm run dev
\`\`\`

## License

MIT
`;

    fs.writeFileSync(path.join(pluginDir, "README.md"), readmeContent);

    // Create .gitignore
    fs.writeFileSync(
      path.join(pluginDir, ".gitignore"),
      `node_modules/
dist/
*.log
.DS_Store
`
    );

    spinner.succeed(chalk.green(`Created plugin at ${pluginDir}`));

    console.log();
    console.log(chalk.cyan("Next steps:"));
    console.log(`  1. cd ${path.basename(pluginDir)}`);
    console.log("  2. npm install");
    console.log("  3. npm run build");
    console.log("  4. selendra plugin install . --local");
    console.log();
  } catch (error: any) {
    spinner.fail(`Failed to create plugin: ${error.message}`);
  }
}

// ============================================
// Helper Functions
// ============================================

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// ============================================
// Plugin Loader for CLI
// ============================================

export function loadInstalledPlugins(program: Command): void {
  const config = loadPluginsConfig();

  for (const plugin of config.plugins) {
    if (!plugin.enabled) continue;

    try {
      const manifest = loadPluginManifest(plugin.path);
      if (!manifest || !manifest.commands) continue;

      for (const cmd of manifest.commands) {
        const pluginCommand = program
          .command(cmd.name)
          .description(`${cmd.description} ${chalk.dim("[plugin]")}`);

        // Add arguments
        if (cmd.arguments) {
          for (const arg of cmd.arguments) {
            const argStr = arg.required ? `<${arg.name}>` : `[${arg.name}]`;
            pluginCommand.argument(argStr, arg.description, arg.default);
          }
        }

        // Add options
        if (cmd.options) {
          for (const opt of cmd.options) {
            pluginCommand.option(opt.flags, opt.description, opt.default);
          }
        }

        // Set action handler
        pluginCommand.action(async (...args: any[]) => {
          try {
            const mainPath = path.join(
              plugin.path,
              manifest.main.replace(/\.ts$/, ".js")
            );
            const pluginModule = await import(mainPath);

            // Try to find command handler
            const handlerName = `${toCamelCase(cmd.name)}Command`;
            const handler =
              pluginModule[handlerName] ||
              pluginModule.default ||
              pluginModule.run;

            if (typeof handler === "function") {
              const context = {
                version: "0.2.1",
                cwd: process.cwd(),
                network: {
                  name: "mainnet",
                  rpc: "https://rpc.selendra.org",
                  chainId: 1961,
                },
                logger: {
                  info: (msg: string) => console.log(chalk.blue("ℹ"), msg),
                  warn: (msg: string) => console.log(chalk.yellow("⚠"), msg),
                  error: (msg: string) => console.log(chalk.red("✗"), msg),
                  success: (msg: string) => console.log(chalk.green("✓"), msg),
                },
              };

              await handler(context, args.slice(0, -1), args[args.length - 1]);
            }
          } catch (error: any) {
            console.error(
              chalk.red(`Plugin error (${plugin.name}):`),
              error.message
            );
          }
        });
      }
    } catch {
      // Skip plugins that fail to load
    }
  }
}

// ============================================
// Command Export
// ============================================

export async function pluginCommand(
  action: string,
  target?: string,
  options: { local?: boolean; git?: boolean; available?: boolean } = {}
): Promise<void> {
  switch (action) {
    case "install":
    case "add":
      if (!target) {
        console.log(chalk.red("Please specify a plugin to install"));
        console.log(chalk.dim("Usage: selendra plugin install <plugin-name>"));
        return;
      }
      await installPlugin(target, options);
      break;

    case "uninstall":
    case "remove":
    case "rm":
      if (!target) {
        console.log(chalk.red("Please specify a plugin to uninstall"));
        return;
      }
      await uninstallPlugin(target);
      break;

    case "list":
    case "ls":
      await listPlugins(options);
      break;

    case "enable":
      if (!target) {
        console.log(chalk.red("Please specify a plugin to enable"));
        return;
      }
      await enablePlugin(target);
      break;

    case "disable":
      if (!target) {
        console.log(chalk.red("Please specify a plugin to disable"));
        return;
      }
      await disablePlugin(target);
      break;

    case "update":
    case "upgrade":
      await updatePlugin(target);
      break;

    case "info":
    case "show":
      if (!target) {
        console.log(chalk.red("Please specify a plugin"));
        return;
      }
      await showPluginInfo(target);
      break;

    case "create":
    case "new":
      if (!target) {
        const { name } = await inquirer.prompt([
          {
            type: "input",
            name: "name",
            message: "Plugin name:",
            validate: (input) =>
              input.length > 0 ? true : "Please enter a name",
          },
        ]);
        target = name;
      }
      await createPlugin(target!);
      break;

    default:
      console.log(chalk.cyan.bold("\n📦 Selendra Plugin Manager\n"));
      console.log("Usage: selendra plugin <command> [options]\n");
      console.log("Commands:");
      console.log("  install <plugin>   Install a plugin");
      console.log("  uninstall <plugin> Remove a plugin");
      console.log("  list              List installed plugins");
      console.log("  list --available  List available plugins");
      console.log("  enable <plugin>   Enable a plugin");
      console.log("  disable <plugin>  Disable a plugin");
      console.log("  update [plugin]   Update plugin(s)");
      console.log("  info <plugin>     Show plugin details");
      console.log("  create [name]     Create a new plugin");
      console.log();
      console.log("Options:");
      console.log("  --local           Install from local path");
      console.log("  --git             Install from git repository");
      console.log();
  }
}

export default pluginCommand;
