/**
 * Interactive Tutorials Command (TASK-015)
 *
 * Provides guided learning experiences for Selendra development
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import * as fs from "fs";
import * as path from "path";
import { createPublicClient, http, parseEther, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Tutorial progress storage
const PROGRESS_FILE = path.join(
  process.env.HOME || "~",
  ".selendra",
  "tutorial-progress.json"
);

interface TutorialProgress {
  completedTutorials: string[];
  currentTutorial: string | null;
  currentStep: number;
  startedAt: string;
  lastUpdated: string;
}

interface TutorialStep {
  title: string;
  description: string;
  type: "info" | "quiz" | "code" | "command" | "demo";
  content?: string;
  code?: string;
  command?: string;
  quiz?: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  };
  validation?: () => Promise<boolean>;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: string;
  prerequisites: string[];
  steps: TutorialStep[];
}

// ============================================
// Tutorial Definitions
// ============================================

const tutorials: Tutorial[] = [
  {
    id: "getting-started",
    title: "Getting Started with Selendra",
    description:
      "Learn the basics of Selendra blockchain and how to use the CLI",
    difficulty: "beginner",
    duration: "15 min",
    prerequisites: [],
    steps: [
      {
        title: "Welcome to Selendra!",
        description: "Introduction to the Selendra blockchain ecosystem",
        type: "info",
        content: `
${chalk.cyan.bold("Welcome to Selendra!")}

Selendra is a high-performance blockchain that combines the best of both worlds:

${chalk.yellow("•")} ${chalk.bold(
          "EVM Compatibility"
        )} - Deploy Solidity smart contracts
${chalk.yellow("•")} ${chalk.bold(
          "Substrate Runtime"
        )} - Access Polkadot ecosystem features
${chalk.yellow("•")} ${chalk.bold(
          "Unified Accounts"
        )} - One account for both EVM and Substrate

${chalk.dim("Networks:")}
  • ${chalk.green("Mainnet")} - Production network (Chain ID: 1961)
  • ${chalk.blue("Testnet")} - Development network (Chain ID: 1953)

In this tutorial, you'll learn how to:
  1. Check network status
  2. Create an account
  3. Get testnet tokens
  4. Make your first transaction
`,
      },
      {
        title: "Check Network Status",
        description: "Learn how to check if the network is healthy",
        type: "command",
        command: "selendra status --network testnet",
        content: `
${chalk.cyan.bold("Checking Network Status")}

Before interacting with the blockchain, it's good practice to check the network status.

Run the following command to see the current state of the Selendra testnet:

${chalk.bgGray.white(" selendra status --network testnet ")}

This will show you:
  • Current block number
  • Network latency
  • Sync status
  • Chain information
`,
      },
      {
        title: "Understanding Accounts",
        description: "Learn about Selendra's unified account system",
        type: "quiz",
        quiz: {
          question:
            "What makes Selendra accounts special compared to other blockchains?",
          options: [
            "They only work with EVM",
            "They have unified accounts that work with both EVM and Substrate",
            "They require separate accounts for each feature",
            "They don't support smart contracts",
          ],
          correct: 1,
          explanation:
            "Selendra uses a unified account system where a single account (derived from your private key) can interact with both EVM smart contracts and Substrate pallets!",
        },
      },
      {
        title: "Create Your First Account",
        description: "Generate a new Selendra account",
        type: "command",
        command: "selendra account new",
        content: `
${chalk.cyan.bold("Creating an Account")}

Let's create your first Selendra account. This will generate:
  • A private key (keep this secret!)
  • An EVM address (0x...)
  • A Substrate address (sel...)

Run this command:

${chalk.bgGray.white(" selendra account new ")}

${chalk.red.bold("⚠️  IMPORTANT:")} Save your private key securely. 
Anyone with your private key can access your funds!
`,
      },
      {
        title: "Get Testnet Tokens",
        description: "Request tokens from the testnet faucet",
        type: "info",
        content: `
${chalk.cyan.bold("Getting Testnet Tokens")}

To interact with the testnet, you need SEL tokens for gas fees.

Use the faucet command with your address:

${chalk.bgGray.white(" selendra faucet <your-address> ")}

The faucet will send you some testnet SEL tokens. These tokens have no real value
and are only for testing purposes.

${chalk.yellow(
  "Note:"
)} The faucet has rate limits. You can request tokens once per hour.
`,
      },
      {
        title: "Check Your Balance",
        description: "Verify that you received testnet tokens",
        type: "command",
        command: "selendra balance <address> --network testnet",
        content: `
${chalk.cyan.bold("Checking Balance")}

After requesting from the faucet, check your balance:

${chalk.bgGray.white(" selendra balance <your-address> --network testnet ")}

You should see your SEL token balance displayed.
`,
      },
      {
        title: "Congratulations!",
        description: "You've completed the Getting Started tutorial",
        type: "info",
        content: `
${chalk.green.bold("🎉 Congratulations!")}

You've completed the "Getting Started with Selendra" tutorial!

${chalk.cyan("What you learned:")}
  ✓ How to check network status
  ✓ Understanding unified accounts
  ✓ Creating a new account
  ✓ Getting testnet tokens
  ✓ Checking balances

${chalk.cyan("Next steps:")}
  • Try the "Your First Smart Contract" tutorial
  • Explore the SDK documentation
  • Join the Selendra Discord community

Run ${chalk.bgGray.white(" selendra learn ")} to see more tutorials!
`,
      },
    ],
  },
  {
    id: "first-contract",
    title: "Your First Smart Contract",
    description:
      "Deploy and interact with an ERC-20 token contract on Selendra",
    difficulty: "beginner",
    duration: "25 min",
    prerequisites: ["getting-started"],
    steps: [
      {
        title: "Introduction to Smart Contracts",
        description: "What are smart contracts and how do they work?",
        type: "info",
        content: `
${chalk.cyan.bold("Smart Contracts on Selendra")}

A smart contract is a self-executing program that runs on the blockchain.
On Selendra, you can write smart contracts in Solidity (for EVM) or ink! (for Wasm).

In this tutorial, we'll focus on ${chalk.bold(
          "Solidity"
        )} and create an ERC-20 token.

${chalk.yellow("What is ERC-20?")}
ERC-20 is a standard for fungible tokens. It defines:
  • Total supply
  • Balances for each address
  • Transfer functionality
  • Approval and allowance system

Popular ERC-20 tokens include USDC, USDT, and DAI.
`,
      },
      {
        title: "Initialize a New Project",
        description: "Create a new Selendra project",
        type: "command",
        command: "selendra init my-token --template evm",
        content: `
${chalk.cyan.bold("Creating a New Project")}

Let's initialize a new EVM project with Hardhat:

${chalk.bgGray.white(" selendra init my-token --template evm ")}

This will create a project structure with:
  • contracts/ - Your Solidity contracts
  • scripts/ - Deployment scripts
  • test/ - Test files
  • hardhat.config.ts - Hardhat configuration
`,
      },
      {
        title: "Understanding the Token Contract",
        description: "Explore the ERC-20 contract code",
        type: "code",
        code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("My Token", "MTK") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}`,
        content: `
${chalk.cyan.bold("The Token Contract")}

Here's a simple ERC-20 token contract using OpenZeppelin:

${chalk.dim("Key components:")}
  • ${chalk.yellow("ERC20")} - Base contract from OpenZeppelin
  • ${chalk.yellow("constructor")} - Sets name, symbol, and mints initial supply
  • ${chalk.yellow("_mint")} - Creates tokens for the deployer

The contract inherits all ERC-20 functions:
  • transfer(), balanceOf(), approve(), transferFrom()
`,
      },
      {
        title: "Compile the Contract",
        description: "Compile your Solidity code",
        type: "command",
        command: "selendra compile",
        content: `
${chalk.cyan.bold("Compiling the Contract")}

Before deploying, we need to compile the Solidity code to bytecode:

${chalk.bgGray.white(" selendra compile ")}

This will:
  1. Check for syntax errors
  2. Compile to EVM bytecode
  3. Generate ABI (Application Binary Interface)
  4. Create TypeScript types (optional)
`,
      },
      {
        title: "Deploy to Testnet",
        description: "Deploy your token to Selendra testnet",
        type: "command",
        command: "selendra deploy MyToken --network testnet --args 1000000",
        content: `
${chalk.cyan.bold("Deploying to Testnet")}

Now let's deploy your token with an initial supply of 1,000,000 tokens:

${chalk.bgGray.white(
  " selendra deploy MyToken --network testnet --args 1000000 "
)}

${chalk.yellow("Requirements:")}
  • Set PRIVATE_KEY environment variable
  • Have testnet SEL for gas fees

${chalk.dim("The deploy command will:")}
  1. Estimate gas costs
  2. Send the deployment transaction
  3. Wait for confirmation
  4. Output the contract address
`,
      },
      {
        title: "Interact with Your Token",
        description: "Call functions on your deployed token",
        type: "info",
        content: `
${chalk.cyan.bold("Interacting with the Token")}

Now that your token is deployed, you can interact with it!

${chalk.yellow("Check your token balance:")}
${chalk.bgGray.white(" selendra interact <contract-address> ")}

In the interactive REPL, try:
  > balanceOf(<your-address>)
  > totalSupply()
  > name()
  > symbol()

${chalk.yellow("Transfer tokens:")}
  > transfer(<recipient>, 1000000000000000000)
  
${chalk.dim("(That's 1 token with 18 decimals)")}
`,
      },
      {
        title: "Verify Your Contract",
        description: "Verify source code on the block explorer",
        type: "command",
        command: "selendra verify <address> MyToken --network testnet",
        content: `
${chalk.cyan.bold("Verifying Your Contract")}

Verification makes your contract's source code visible on the block explorer.
This builds trust with your users!

${chalk.bgGray.white(
  " selendra verify <contract-address> MyToken --network testnet "
)}

After verification, anyone can:
  • Read your contract's source code
  • Verify it matches the deployed bytecode
  • Interact with it through the explorer UI
`,
      },
      {
        title: "Congratulations!",
        description: "You've deployed your first smart contract!",
        type: "info",
        content: `
${chalk.green.bold("🎉 Congratulations!")}

You've deployed your first smart contract on Selendra!

${chalk.cyan("What you accomplished:")}
  ✓ Initialized a new project
  ✓ Understood ERC-20 tokens
  ✓ Compiled a Solidity contract
  ✓ Deployed to testnet
  ✓ Interacted with your token
  ✓ Verified the source code

${chalk.cyan("Ideas to explore:")}
  • Add custom functions to your token
  • Create an NFT (ERC-721) contract
  • Build a simple DeFi protocol

Keep building! 🚀
`,
      },
    ],
  },
  {
    id: "defi-basics",
    title: "DeFi Basics on Selendra",
    description: "Learn about liquidity pools, swaps, and yield farming",
    difficulty: "intermediate",
    duration: "30 min",
    prerequisites: ["first-contract"],
    steps: [
      {
        title: "What is DeFi?",
        description: "Understanding Decentralized Finance",
        type: "info",
        content: `
${chalk.cyan.bold("Decentralized Finance (DeFi)")}

DeFi refers to financial services built on blockchain technology,
operating without traditional intermediaries like banks.

${chalk.yellow("Key DeFi Concepts:")}

${chalk.bold("1. Automated Market Makers (AMMs)")}
   Instead of order books, AMMs use liquidity pools and 
   mathematical formulas to determine prices.

${chalk.bold("2. Liquidity Pools")}
   Users deposit token pairs into pools and earn fees
   from traders who swap tokens.

${chalk.bold("3. Yield Farming")}
   Strategies to maximize returns by providing liquidity
   across multiple protocols.

${chalk.bold("4. Lending/Borrowing")}
   Deposit collateral to borrow assets, or lend assets
   to earn interest.
`,
      },
      {
        title: "AMM Mathematics",
        description: "Understanding the constant product formula",
        type: "quiz",
        quiz: {
          question: "What formula do most AMMs like Uniswap use for pricing?",
          options: [
            "x + y = k (Constant Sum)",
            "x * y = k (Constant Product)",
            "x / y = k (Constant Ratio)",
            "x ^ y = k (Constant Power)",
          ],
          correct: 1,
          explanation:
            "Most AMMs use x * y = k, where x and y are the reserves of two tokens and k is a constant. This ensures the product of reserves stays the same after each trade, creating a price curve.",
        },
      },
      {
        title: "Liquidity Pool Example",
        description: "How a simple swap works",
        type: "code",
        code: `// Simplified AMM swap calculation
function getAmountOut(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint
): bigint {
    // Apply 0.3% fee
    const amountInWithFee = amountIn * 997n;
    
    // x * y = k formula
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * 1000n + amountInWithFee;
    
    return numerator / denominator;
}

// Example: Swap 1 SEL for USDC
// Pool has 10,000 SEL and 20,000 USDC
const amountOut = getAmountOut(
    parseEther("1"),      // 1 SEL in
    parseEther("10000"),  // 10,000 SEL reserve
    parseEther("20000")   // 20,000 USDC reserve
);
// Result: ~1.99 USDC (minus slippage and fees)`,
        content: `
${chalk.cyan.bold("How Swaps Work")}

When you swap tokens in an AMM:

1. You send Token A to the pool
2. The pool calculates Token B output using x * y = k
3. A small fee (usually 0.3%) goes to liquidity providers
4. You receive Token B

${chalk.yellow("Slippage:")}
Large trades move the price more, resulting in worse rates.
This is called "price impact" or "slippage."
`,
      },
      {
        title: "Providing Liquidity",
        description: "How to become a liquidity provider",
        type: "info",
        content: `
${chalk.cyan.bold("Becoming a Liquidity Provider (LP)")}

When you provide liquidity:

${chalk.yellow("1. Deposit Tokens")}
   You must deposit equal value of both tokens
   Example: 100 SEL + 200 USDC

${chalk.yellow("2. Receive LP Tokens")}
   You get LP tokens representing your share
   These can be used for yield farming

${chalk.yellow("3. Earn Fees")}
   Every swap pays ~0.3% fee
   Distributed to LPs proportionally

${chalk.yellow("4. Impermanent Loss")}
   If prices change, your position may be worth
   less than just holding the tokens

${chalk.red("⚠️ Risk Warning:")}
Impermanent loss can exceed trading fee earnings!
Always understand the risks before providing liquidity.
`,
      },
      {
        title: "Staking on Selendra",
        description: "Native staking vs DeFi staking",
        type: "info",
        content: `
${chalk.cyan.bold("Staking on Selendra")}

Selendra offers multiple ways to stake:

${chalk.yellow("1. Native Staking (Substrate)")}
   • Nominate validators
   • Secure the network
   • Earn ~12-15% APY
   • Command: ${chalk.bgGray.white(" selendra stake info ")}

${chalk.yellow("2. Nomination Pools")}
   • Pool tokens with others
   • Lower minimum stake required
   • Command: ${chalk.bgGray.white(" selendra stake pools ")}

${chalk.yellow("3. DeFi Staking")}
   • Provide liquidity to DEXes
   • Stake LP tokens for rewards
   • Variable APY based on demand

Each method has different risk/reward profiles.
Native staking is generally safer but has unlock periods.
`,
      },
      {
        title: "Congratulations!",
        description: "You understand DeFi basics",
        type: "info",
        content: `
${chalk.green.bold("🎉 Congratulations!")}

You've learned the fundamentals of DeFi on Selendra!

${chalk.cyan("Key takeaways:")}
  ✓ AMMs use x * y = k for pricing
  ✓ Liquidity providers earn trading fees
  ✓ Impermanent loss is a key risk
  ✓ Native staking secures the network
  ✓ DeFi offers various yield opportunities

${chalk.cyan("Advanced topics to explore:")}
  • Flash loans
  • Concentrated liquidity (Uniswap v3 style)
  • Cross-chain DeFi
  • MEV protection

Stay safe and DYOR! 🛡️
`,
      },
    ],
  },
  {
    id: "nft-creation",
    title: "Creating NFTs on Selendra",
    description: "Build and deploy an NFT collection",
    difficulty: "intermediate",
    duration: "35 min",
    prerequisites: ["first-contract"],
    steps: [
      {
        title: "What are NFTs?",
        description: "Understanding Non-Fungible Tokens",
        type: "info",
        content: `
${chalk.cyan.bold("Non-Fungible Tokens (NFTs)")}

NFTs are unique digital assets on the blockchain.
Unlike ERC-20 tokens, each NFT is distinct and non-interchangeable.

${chalk.yellow("Common NFT Standards:")}

${chalk.bold("ERC-721")} - Basic NFT standard
  • Each token has a unique ID
  • One token per ID
  • Standard functions: ownerOf, transferFrom, approve

${chalk.bold("ERC-1155")} - Multi-token standard
  • Supports both fungible and non-fungible tokens
  • More gas efficient for batch operations
  • Used for game items, tickets, etc.

${chalk.yellow("NFT Use Cases:")}
  • Digital art and collectibles
  • Gaming items and characters
  • Event tickets and memberships
  • Real-world asset tokenization
  • Identity and credentials
`,
      },
      {
        title: "NFT Contract Structure",
        description: "Understanding ERC-721 contracts",
        type: "code",
        code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    
    constructor() ERC721("My NFT Collection", "MNFT") Ownable(msg.sender) {}
    
    function mint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
    
    // Required overrides for ERC721URIStorage
    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}`,
        content: `
${chalk.cyan.bold("NFT Contract Breakdown")}

${chalk.yellow("Key Components:")}

${chalk.bold("ERC721")} - Base NFT functionality
${chalk.bold("ERC721URIStorage")} - Store metadata URI for each token
${chalk.bold("Ownable")} - Restrict minting to owner

${chalk.bold("mint() function:")}
  1. Gets next available token ID
  2. Creates the NFT for recipient
  3. Associates metadata URI with token

The ${chalk.yellow("tokenURI")} typically points to JSON metadata
containing the image URL, name, description, and attributes.
`,
      },
      {
        title: "NFT Metadata",
        description: "Understanding NFT metadata standards",
        type: "code",
        code: `{
  "name": "Cool NFT #1",
  "description": "A very cool NFT on Selendra",
  "image": "ipfs://QmXxx.../image.png",
  "external_url": "https://myproject.com/nft/1",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Blue"
    },
    {
      "trait_type": "Rarity",
      "value": "Legendary"
    },
    {
      "display_type": "number",
      "trait_type": "Power",
      "value": 95
    }
  ]
}`,
        content: `
${chalk.cyan.bold("NFT Metadata Standards")}

Metadata is stored off-chain (typically on IPFS) and describes the NFT.

${chalk.yellow("Standard Fields:")}
  • ${chalk.bold("name")} - Name of the NFT
  • ${chalk.bold("description")} - Description text
  • ${chalk.bold("image")} - URL to the image/media
  • ${chalk.bold("attributes")} - Traits and properties

${chalk.yellow("Storage Options:")}
  • ${chalk.bold("IPFS")} - Decentralized, permanent (recommended)
  • ${chalk.bold("Arweave")} - Permanent storage with upfront payment
  • ${chalk.bold("Centralized")} - Your own servers (not recommended)

${chalk.red(
  "⚠️ Warning:"
)} If metadata hosting goes down, NFTs lose their content!
Always use decentralized storage for important collections.
`,
      },
      {
        title: "Quiz: NFT Standards",
        description: "Test your understanding",
        type: "quiz",
        quiz: {
          question: "What's the main difference between ERC-721 and ERC-1155?",
          options: [
            "ERC-721 is newer than ERC-1155",
            "ERC-1155 supports both fungible and non-fungible tokens",
            "ERC-721 is more gas efficient",
            "ERC-1155 can only hold one token type",
          ],
          correct: 1,
          explanation:
            "ERC-1155 is a multi-token standard that can represent both fungible tokens (like ERC-20) and non-fungible tokens (like ERC-721) in a single contract, making it more versatile and gas-efficient for games and collections.",
        },
      },
      {
        title: "Deploying Your NFT",
        description: "Deploy the NFT contract",
        type: "command",
        command: "selendra deploy MyNFT --network testnet",
        content: `
${chalk.cyan.bold("Deploying Your NFT Collection")}

Deploy your NFT contract to testnet:

${chalk.bgGray.white(" selendra deploy MyNFT --network testnet ")}

After deployment, you can:
  1. Mint NFTs to addresses
  2. Set metadata URIs
  3. Transfer and trade NFTs

${chalk.yellow("Minting an NFT:")}
Use the interact command to call the mint function:

${chalk.bgGray.white(" selendra interact <contract-address> ")}
> mint("0x...", "ipfs://QmMetadataHash...")
`,
      },
      {
        title: "Congratulations!",
        description: "You've learned NFT development",
        type: "info",
        content: `
${chalk.green.bold("🎉 Congratulations!")}

You've learned how to create NFTs on Selendra!

${chalk.cyan("What you learned:")}
  ✓ ERC-721 and ERC-1155 standards
  ✓ NFT contract structure
  ✓ Metadata standards and storage
  ✓ Minting and deploying NFTs

${chalk.cyan("Ideas to explore:")}
  • Add a whitelist for pre-sale minting
  • Implement reveal mechanics
  • Create royalty distributions (ERC-2981)
  • Build an NFT marketplace

Happy creating! 🎨
`,
      },
    ],
  },
];

// ============================================
// Progress Management
// ============================================

function loadProgress(): TutorialProgress {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    }
  } catch {
    // Ignore errors
  }
  return {
    completedTutorials: [],
    currentTutorial: null,
    currentStep: 0,
    startedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}

function saveProgress(progress: TutorialProgress): void {
  try {
    const dir = path.dirname(PROGRESS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    progress.lastUpdated = new Date().toISOString();
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (error) {
    // Silently fail
  }
}

function getTutorialStatus(
  tutorialId: string,
  progress: TutorialProgress
): string {
  if (progress.completedTutorials.includes(tutorialId)) {
    return chalk.green("✓ Completed");
  }
  if (progress.currentTutorial === tutorialId) {
    return chalk.yellow(`🔄 In Progress (Step ${progress.currentStep + 1})`);
  }
  return chalk.dim("○ Not Started");
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "beginner":
      return chalk.green(difficulty);
    case "intermediate":
      return chalk.yellow(difficulty);
    case "advanced":
      return chalk.red(difficulty);
    default:
      return difficulty;
  }
}

// ============================================
// Tutorial Runner
// ============================================

async function runTutorialStep(
  step: TutorialStep,
  stepNumber: number,
  totalSteps: number
): Promise<boolean> {
  console.clear();
  console.log(
    chalk.dim(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  );
  console.log(
    chalk.cyan.bold(`Step ${stepNumber}/${totalSteps}: ${step.title}`)
  );
  console.log(
    chalk.dim(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  );
  console.log();

  // Show description
  console.log(chalk.dim(step.description));
  console.log();

  // Show content based on type
  if (step.content) {
    console.log(step.content);
    console.log();
  }

  if (step.code) {
    console.log(
      chalk.dim("┌─────────────────────────────────────────────────┐")
    );
    console.log(chalk.yellow(step.code));
    console.log(
      chalk.dim("└─────────────────────────────────────────────────┘")
    );
    console.log();
  }

  // Handle quiz type
  if (step.type === "quiz" && step.quiz) {
    const { quiz } = step;
    console.log(chalk.yellow.bold("📝 Quiz Time!"));
    console.log();
    console.log(chalk.white.bold(quiz.question));
    console.log();

    const { answer } = await inquirer.prompt([
      {
        type: "list",
        name: "answer",
        message: "Select your answer:",
        choices: quiz.options.map((opt, i) => ({
          name: opt,
          value: i,
        })),
      },
    ]);

    console.log();
    if (answer === quiz.correct) {
      console.log(chalk.green.bold("✓ Correct!"));
    } else {
      console.log(chalk.red.bold("✗ Not quite right."));
    }
    console.log();
    console.log(chalk.cyan("Explanation: ") + quiz.explanation);
    console.log();
  }

  // Navigation options
  const choices = [
    { name: "Continue →", value: "next" },
    { name: "← Previous", value: "prev" },
    { name: "Exit Tutorial", value: "exit" },
  ];

  if (stepNumber === 1) {
    choices.splice(1, 1); // Remove "Previous" on first step
  }

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices,
    },
  ]);

  return action === "next"
    ? true
    : action === "prev"
    ? false
    : (null as unknown as boolean);
}

async function runTutorial(tutorial: Tutorial): Promise<void> {
  const progress = loadProgress();

  // Check prerequisites
  for (const prereq of tutorial.prerequisites) {
    if (!progress.completedTutorials.includes(prereq)) {
      const prereqTutorial = tutorials.find((t) => t.id === prereq);
      console.log();
      console.log(
        chalk.yellow("⚠️  This tutorial requires completing:"),
        chalk.cyan(prereqTutorial?.title || prereq)
      );
      console.log();
      const { proceed } = await inquirer.prompt([
        {
          type: "confirm",
          name: "proceed",
          message: "Continue anyway?",
          default: false,
        },
      ]);
      if (!proceed) return;
    }
  }

  // Set current tutorial
  progress.currentTutorial = tutorial.id;
  let currentStep =
    progress.currentTutorial === tutorial.id ? progress.currentStep : 0;

  while (currentStep < tutorial.steps.length) {
    const step = tutorial.steps[currentStep];
    const result = await runTutorialStep(
      step,
      currentStep + 1,
      tutorial.steps.length
    );

    if (result === null) {
      // Exit requested
      progress.currentStep = currentStep;
      saveProgress(progress);
      console.log();
      console.log(chalk.yellow("Progress saved. See you next time!"));
      return;
    } else if (result) {
      // Next step
      currentStep++;
    } else if (currentStep > 0) {
      // Previous step
      currentStep--;
    }

    progress.currentStep = currentStep;
    saveProgress(progress);
  }

  // Tutorial completed
  if (!progress.completedTutorials.includes(tutorial.id)) {
    progress.completedTutorials.push(tutorial.id);
  }
  progress.currentTutorial = null;
  progress.currentStep = 0;
  saveProgress(progress);
}

// ============================================
// Main Menu
// ============================================

async function showMainMenu(): Promise<void> {
  const progress = loadProgress();

  console.clear();
  console.log(
    chalk.cyan.bold(`
  ╔═══════════════════════════════════════════════════════╗
  ║        🎓 Selendra Interactive Tutorials 🎓           ║
  ╚═══════════════════════════════════════════════════════╝
`)
  );

  console.log(
    chalk.dim("  Learn Selendra development through interactive tutorials\n")
  );

  // Show progress
  const completed = progress.completedTutorials.length;
  const total = tutorials.length;
  const progressBar =
    "█".repeat(Math.floor((completed / total) * 20)) +
    "░".repeat(20 - Math.floor((completed / total) * 20));

  console.log(
    chalk.dim("  Progress: ") +
      chalk.cyan(`[${progressBar}] ${completed}/${total} completed`)
  );
  console.log();

  // Tutorial choices
  const choices = tutorials.map((t) => ({
    name: `${t.title} ${chalk.dim(`(${t.duration})`)} - ${getDifficultyColor(
      t.difficulty
    )} ${getTutorialStatus(t.id, progress)}`,
    value: t.id,
  }));

  choices.push(
    { name: chalk.dim("─────────────────────────────"), value: "separator" },
    { name: chalk.red("Exit"), value: "exit" }
  );

  if (completed > 0) {
    choices.splice(choices.length - 2, 0, {
      name: chalk.yellow("Reset Progress"),
      value: "reset",
    });
  }

  const { selection } = await inquirer.prompt([
    {
      type: "list",
      name: "selection",
      message: "Select a tutorial:",
      choices: choices.filter((c) => c.value !== "separator"),
      pageSize: 12,
    },
  ]);

  if (selection === "exit") {
    console.log(chalk.cyan("\nHappy learning! 📚\n"));
    return;
  }

  if (selection === "reset") {
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Are you sure you want to reset all progress?",
        default: false,
      },
    ]);
    if (confirm) {
      saveProgress({
        completedTutorials: [],
        currentTutorial: null,
        currentStep: 0,
        startedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });
      console.log(chalk.green("\nProgress reset!\n"));
    }
    await showMainMenu();
    return;
  }

  const tutorial = tutorials.find((t) => t.id === selection);
  if (tutorial) {
    await runTutorial(tutorial);
    await showMainMenu();
  }
}

// ============================================
// Command Export
// ============================================

export async function learnCommand(
  topic?: string,
  options: { list?: boolean; reset?: boolean } = {}
): Promise<void> {
  if (options.list) {
    console.log(chalk.cyan.bold("\n📚 Available Tutorials:\n"));
    const progress = loadProgress();
    for (const tutorial of tutorials) {
      console.log(
        `  ${chalk.yellow(tutorial.id)} - ${tutorial.title} ${chalk.dim(
          `(${tutorial.duration})`
        )}`
      );
      console.log(
        `    ${getDifficultyColor(tutorial.difficulty)} | ${getTutorialStatus(
          tutorial.id,
          progress
        )}`
      );
      console.log(`    ${chalk.dim(tutorial.description)}`);
      console.log();
    }
    return;
  }

  if (options.reset) {
    saveProgress({
      completedTutorials: [],
      currentTutorial: null,
      currentStep: 0,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    });
    console.log(chalk.green("\n✓ Tutorial progress reset!\n"));
    return;
  }

  if (topic) {
    const tutorial = tutorials.find(
      (t) =>
        t.id === topic || t.title.toLowerCase().includes(topic.toLowerCase())
    );
    if (tutorial) {
      await runTutorial(tutorial);
    } else {
      console.log(chalk.red(`\nTutorial not found: ${topic}`));
      console.log(chalk.dim("Use --list to see available tutorials\n"));
    }
    return;
  }

  // Show main menu
  await showMainMenu();
}

export default learnCommand;
