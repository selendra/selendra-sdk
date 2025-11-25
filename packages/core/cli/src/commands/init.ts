import chalk from 'chalk';
import inquirer from 'inquirer';
import ora, { Ora } from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export async function initCommand(projectName: string, options: { template?: string }) {
  console.log(chalk.bold.white('Creating new Selendra project...'));
  console.log();

  // Determine template
  let template = options.template;
  if (!template) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Select project template:',
        choices: [
          { name: 'EVM (Solidity + Hardhat)', value: 'evm' },
          { name: 'WASM (ink! + cargo-contract)', value: 'wasm' },
        ],
      },
    ]);
    template = answers.template;
  }

  const projectPath = path.join(process.cwd(), projectName);

  // Check if directory exists
  try {
    await fs.access(projectPath);
    console.error(chalk.red(`Directory ${projectName} already exists`));
    process.exit(1);
  } catch {
    // Directory doesn't exist, continue
  }

  const spinner = ora('Creating project structure...').start();

  try {
    // Create project directory
    await fs.mkdir(projectPath, { recursive: true });

    if (template === 'evm') {
      await createEVMProject(projectPath, projectName, spinner);
    } else {
      await createWASMProject(projectPath, projectName, spinner);
    }

    spinner.succeed('Project created successfully!');
    console.log();
    console.log(chalk.green('✓ Project initialized'));
    console.log();
    console.log(chalk.bold.white('Next steps:'));
    console.log(chalk.gray('  1. ') + chalk.white(`cd ${projectName}`));
    console.log(chalk.gray('  2. ') + chalk.white('npm install'));
    console.log(chalk.gray('  3. ') + chalk.white('selendra compile'));
    console.log(chalk.gray('  4. ') + chalk.white('selendra deploy --network testnet'));
    console.log();
  } catch (error: any) {
    spinner.fail('Failed to create project');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

async function createEVMProject(projectPath: string, projectName: string, spinner: Ora) {
  // Create directories
  await fs.mkdir(path.join(projectPath, 'contracts'), { recursive: true });
  await fs.mkdir(path.join(projectPath, 'scripts'), { recursive: true });
  await fs.mkdir(path.join(projectPath, 'test'), { recursive: true });

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: 'Selendra EVM project',
    scripts: {
      compile: 'hardhat compile',
      test: 'hardhat test',
      deploy: 'hardhat run scripts/deploy.ts',
    },
    devDependencies: {
      '@nomicfoundation/hardhat-toolbox': '^4.0.0',
      hardhat: '^2.19.0',
      typescript: '^5.3.0',
      '@types/node': '^20.0.0',
    },
  };

  await fs.writeFile(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: "es2020",
      module: "commonjs",
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      strict: true,
      skipLibCheck: true,
      resolveJsonModule: true
    }
  };

  await fs.writeFile(
    path.join(projectPath, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );

  // Create hardhat.config.ts
  const hardhatConfig = `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    selendra: {
      url: "https://rpc.selendra.org",
      chainId: 1961,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    testnet: {
      url: "https://rpc-testnet.selendra.org",
      chainId: 1953,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;
`;

  await fs.writeFile(path.join(projectPath, 'hardhat.config.ts'), hardhatConfig);

  // Create sample contract
  const sampleContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MyToken {
    string public name = "MyToken";
    string public symbol = "MTK";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10**18;
    
    mapping(address => uint256) public balanceOf;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
}
`;

  await fs.writeFile(path.join(projectPath, 'contracts', 'MyToken.sol'), sampleContract);

  // Create deploy script
  const deployScript = `import { ethers } from "hardhat";

async function main() {
  console.log("Deploying MyToken...");

  const MyToken = await ethers.getContractFactory("MyToken");
  const token = await MyToken.deploy();

  await token.waitForDeployment();

  console.log(\`MyToken deployed to: \${await token.getAddress()}\`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`;

  await fs.writeFile(path.join(projectPath, 'scripts', 'deploy.ts'), deployScript);

  // Create .env.example
  const envExample = `# Private key for deployment (DO NOT commit this file with real keys!)
PRIVATE_KEY=your_private_key_here
`;

  await fs.writeFile(path.join(projectPath, '.env.example'), envExample);

  // Create .gitignore
  const gitignore = `node_modules/
artifacts/
cache/
typechain-types/
.env
coverage/
`;

  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);

  // Create README
  const readme = `# ${projectName}

Selendra EVM Project

## Setup

\`\`\`bash
npm install
cp .env.example .env
# Add your private key to .env
\`\`\`

## Compile

\`\`\`bash
npm run compile
# or
selendra compile
\`\`\`

## Deploy

\`\`\`bash
# Deploy to testnet
selendra deploy MyToken --network testnet

# Deploy to mainnet
selendra deploy MyToken --network selendra
\`\`\`

## Test

\`\`\`bash
npm test
\`\`\`
`;

  await fs.writeFile(path.join(projectPath, 'README.md'), readme);

  spinner.text = 'Installing dependencies...';
}

async function createWASMProject(projectPath: string, projectName: string, spinner: Ora) {
  // Create Cargo.toml
  const cargoToml = `[package]
name = "${projectName}"
version = "0.1.0"
edition = "2021"

[dependencies]
ink = { version = "4.3", default-features = false }

[lib]
path = "lib.rs"
crate-type = ["cdylib"]

[features]
default = ["std"]
std = ["ink/std"]

[[bin]]
name = "${projectName}"
path = "main.rs"
`;

  await fs.writeFile(path.join(projectPath, 'Cargo.toml'), cargoToml);

  // Create sample ink! contract
  const sampleContract = `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod ${projectName.replace(/-/g, '_')} {
    #[ink(storage)]
    pub struct MyContract {
        value: bool,
    }

    impl MyContract {
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { value: init_value }
        }

        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new(Default::default())
        }

        #[ink(message)]
        pub fn flip(&mut self) {
            self.value = !self.value;
        }

        #[ink(message)]
        pub fn get(&self) -> bool {
            self.value
        }
    }
}
`;

  await fs.writeFile(path.join(projectPath, 'lib.rs'), sampleContract);

  // Create README
  const readme = `# ${projectName}

Selendra WASM Project (ink!)

## Build

\`\`\`bash
cargo contract build
\`\`\`

## Test

\`\`\`bash
cargo test
\`\`\`

## Deploy

\`\`\`bash
cargo contract upload --suri //Alice
cargo contract instantiate --suri //Alice --constructor new --args false
\`\`\`
`;

  await fs.writeFile(path.join(projectPath, 'README.md'), readme);

  spinner.text = 'WASM project created';
}
