# selendra learn

Interactive tutorials for learning Selendra development.

## Usage

```bash
selendra learn [topic] [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `topic` | Optional topic to learn about |

## Options

| Option | Description |
|--------|-------------|
| `--list` | List available tutorials |
| `--reset` | Reset tutorial progress |
| `-h, --help` | Display help |

## Available Tutorials

### Getting Started (Beginner)
Duration: ~15 min

Learn the basics of Selendra:
- Network overview
- Creating accounts
- Getting testnet tokens
- Making transactions

### Your First Smart Contract (Beginner)
Duration: ~25 min

Deploy your first ERC-20 token:
- Solidity basics
- Compiling contracts
- Deploying to testnet
- Contract interaction

### DeFi Basics (Intermediate)
Duration: ~30 min

Learn about DeFi on Selendra:
- AMM mechanics
- Liquidity pools
- Yield farming
- Native staking

### Creating NFTs (Intermediate)
Duration: ~35 min

Build an NFT collection:
- ERC-721 standard
- NFT metadata
- IPFS storage
- Minting and trading

## Examples

```bash
# Start interactive tutorial menu
selendra learn

# Start specific tutorial
selendra learn "getting-started"
selendra learn "first-contract"

# List all tutorials
selendra learn --list

# Reset progress
selendra learn --reset
```

## Progress Tracking

Your tutorial progress is saved in `~/.selendra/tutorial-progress.json`.

Progress includes:
- Completed tutorials
- Current step in active tutorial
- Quiz answers
