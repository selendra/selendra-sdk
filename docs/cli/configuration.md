# CLI Configuration

The Selendra CLI supports project-level configuration through a config file.

## Configuration File

Create `selendra.config.ts` in your project root:

```typescript
import { defineConfig } from '@selendrajs/cli';

export default defineConfig({
  // Default network for commands
  defaultNetwork: 'testnet',
  
  // Network configurations
  networks: {
    mainnet: {
      rpc: 'https://rpc.selendra.org',
      chainId: 1961,
    },
    testnet: {
      rpc: 'https://rpc.testnet.selendra.org',
      chainId: 1953,
    },
    local: {
      rpc: 'http://localhost:8545',
      chainId: 1337,
    },
  },
  
  // Solidity compiler settings
  solidity: {
    version: '0.8.24',
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
  
  // Named accounts
  accounts: {
    deployer: '${DEPLOYER_KEY}',
    admin: '${ADMIN_KEY}',
  },
  
  // Deployed contract addresses
  contracts: {
    mainnet: {
      myToken: '0x...',
    },
    testnet: {
      myToken: '0x...',
    },
  },
});
```

## Environment Variables

The config file supports environment variable interpolation:

```typescript
accounts: {
  deployer: '${PRIVATE_KEY}',
}
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Private key for transactions |
| `SELENDRA_NETWORK` | Default network |

## Supported Config Files

The CLI looks for configuration in this order:

1. `selendra.config.ts`
2. `selendra.config.js`
3. `selendra.config.mjs`
4. `selendra.config.json`

## Full Configuration Reference

```typescript
interface SelendraConfig {
  // Default network
  defaultNetwork?: string;
  
  // Network configurations
  networks?: {
    [name: string]: {
      rpc: string;
      chainId: number;
      explorer?: string;
      accounts?: string[];
    };
  };
  
  // Solidity settings
  solidity?: {
    version: string;
    optimizer?: {
      enabled: boolean;
      runs: number;
    };
  };
  
  // Named accounts
  accounts?: {
    [name: string]: string;
  };
  
  // Deployed contracts
  contracts?: {
    [network: string]: {
      [name: string]: string;
    };
  };
  
  // Paths
  paths?: {
    sources: string;
    artifacts: string;
    cache: string;
    tests: string;
  };
}
```
