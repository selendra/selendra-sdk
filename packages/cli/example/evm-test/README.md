# evm-test

Selendra EVM Project

## Setup

```bash
npm install
cp .env.example .env
# Add your private key to .env
```

## Compile

```bash
npm run compile
# or
selendra compile
```

## Deploy

```bash
# Deploy to testnet
selendra deploy MyToken --network testnet

# Deploy to mainnet
selendra deploy MyToken --network selendra
```

## Test

```bash
npm test
```
