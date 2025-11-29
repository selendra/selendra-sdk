# Installation

This guide covers all the installation options for the Selendra SDK and CLI.

## SDK Installation

### npm

```bash
npm install @selendrajs/sdk
```

### yarn

```bash
yarn add @selendrajs/sdk
```

### pnpm

```bash
pnpm add @selendrajs/sdk
```

## CLI Installation

### Global Installation (Recommended)

Install the CLI globally to use it from anywhere:

```bash
npm install -g @selendrajs/cli
```

### Local Installation

Or install it locally in your project:

```bash
npm install -D @selendrajs/cli
```

Then run it with npx:

```bash
npx selendra --help
```

## Shell Completions

Enable tab completion for better CLI experience:

### Bash

```bash
# Add to ~/.bashrc
source <(selendra completions bash)

# Or save to file
selendra completions bash > ~/.selendra/completions/selendra.bash
echo 'source ~/.selendra/completions/selendra.bash' >> ~/.bashrc
```

### Zsh

```bash
# Add to ~/.zshrc
source <(selendra completions zsh)

# Or install to fpath
selendra completions zsh > ~/.selendra/completions/_selendra
echo 'fpath=(~/.selendra/completions $fpath)' >> ~/.zshrc
```

## Peer Dependencies

The SDK has optional peer dependencies based on your use case:

### For React Applications

```bash
npm install @tanstack/react-query wagmi
```

### For Substrate Features

```bash
npm install @polkadot/api @polkadot/extension-dapp
```

## Verification

Verify your installation:

```bash
# Check CLI version
selendra --version

# Check network connectivity
selendra status --network testnet
```

## TypeScript Configuration

For TypeScript projects, ensure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true
  }
}
```

## Environment Variables

Create a `.env` file for configuration:

```bash
# Private key for signing transactions
PRIVATE_KEY=0x...

# Default network
SELENDRA_NETWORK=testnet

# Custom RPC endpoints (optional)
SELENDRA_RPC_MAINNET=https://rpc.selendra.org
SELENDRA_RPC_TESTNET=https://rpc.testnet.selendra.org
```

::: warning
Never commit your `.env` file to version control. Add it to `.gitignore`.
:::

## Troubleshooting

### "Module not found" errors

Make sure you're using a compatible Node.js version:

```bash
node --version  # Should be 18.0.0 or higher
```

### TypeScript errors

Ensure you have the latest TypeScript:

```bash
npm install -D typescript@latest
```

### Permission errors (CLI)

On Unix systems, you may need sudo for global install:

```bash
sudo npm install -g @selendrajs/cli
```

Or configure npm to use a different directory:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```
