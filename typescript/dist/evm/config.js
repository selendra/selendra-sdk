"use strict";
/**
 * EVM configuration for the Selendra SDK
 * Provides Selendra-specific EVM network configurations and settings
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TX_OVERRIDES = exports.GAS_ESTIMATION_DEFAULTS = exports.SELENDRA_EVM_NETWORKS = void 0;
exports.getSelendraEvmConfig = getSelendraEvmConfig;
exports.createDefaultEvmClientConfig = createDefaultEvmClientConfig;
exports.isValidEthereumAddress = isValidEthereumAddress;
exports.isValidPrivateKey = isValidPrivateKey;
exports.isValidTransactionHash = isValidTransactionHash;
exports.weiToEther = weiToEther;
exports.etherToWei = etherToWei;
exports.gweiToWei = gweiToWei;
exports.formatBalance = formatBalance;
exports.parseBalance = parseBalance;
/**
 * Predefined Selendra network configurations
 */
exports.SELENDRA_EVM_NETWORKS = {
    mainnet: {
        chainId: 1961,
        chainName: 'Selendra Mainnet',
        nativeCurrency: {
            name: 'Selendra',
            symbol: 'SEL',
            decimals: 18
        },
        rpcUrls: {
            default: {
                http: ['https://rpc.selendra.org'],
                webSocket: ['wss://rpc.selendra.org']
            },
            public: {
                http: ['https://rpc.selendra.org'],
                webSocket: ['wss://rpc.selendra.org']
            }
        },
        blockExplorerUrls: [
            {
                name: 'Selendra Explorer',
                url: 'https://explorer.selendra.org'
            }
        ],
        gasConfig: {
            gasMultiplier: 1.2,
            maxGasLimit: 10000000,
            minGasLimit: 21000,
            defaultGasPrice: '10000000000', // 10 gwei
            maxGasPrice: '1000000000000' // 1000 gwei
        },
        defaultTransactionType: '0x2',
        constants: {
            maxPriorityFeePerGas: '2000000000', // 2 gwei
            baseFeeMultiplier: 1.5
        },
        features: {
            eip1559: true,
            eip2930: true,
            batchTransactions: true,
            contractEvents: true
        }
    },
    testnet: {
        chainId: 1962,
        chainName: 'Selendra Testnet',
        nativeCurrency: {
            name: 'Selendra Test',
            symbol: 'tSEL',
            decimals: 18
        },
        rpcUrls: {
            default: {
                http: ['https://testnet-rpc.selendra.org'],
                webSocket: ['wss://testnet-rpc.selendra.org']
            },
            public: {
                http: ['https://testnet-rpc.selendra.org'],
                webSocket: ['wss://testnet-rpc.selendra.org']
            }
        },
        blockExplorerUrls: [
            {
                name: 'Selendra Testnet Explorer',
                url: 'https://testnet-explorer.selendra.org'
            }
        ],
        gasConfig: {
            gasMultiplier: 1.1,
            maxGasLimit: 8000000,
            minGasLimit: 21000,
            defaultGasPrice: '1000000000', // 1 gwei
            maxGasPrice: '100000000000' // 100 gwei
        },
        defaultTransactionType: '0x2',
        constants: {
            maxPriorityFeePerGas: '1000000000', // 1 gwei
            baseFeeMultiplier: 1.2
        },
        features: {
            eip1559: true,
            eip2930: true,
            batchTransactions: true,
            contractEvents: true
        }
    }
};
/**
 * Get Selendra EVM configuration by network name or chain ID
 */
function getSelendraEvmConfig(networkOrChainId) {
    // Try to find by network name first
    if (typeof networkOrChainId === 'string') {
        const config = exports.SELENDRA_EVM_NETWORKS[networkOrChainId];
        if (config) {
            return config;
        }
    }
    // Try to find by chain ID
    const chainId = typeof networkOrChainId === 'number' ? networkOrChainId : parseInt(networkOrChainId);
    for (const config of Object.values(exports.SELENDRA_EVM_NETWORKS)) {
        if (config.chainId === chainId) {
            return config;
        }
    }
    throw new Error(`Unknown Selendra network or chain ID: ${networkOrChainId}`);
}
/**
 * Create default EVM client configuration
 */
function createDefaultEvmClientConfig(overrides = {}) {
    const network = overrides.network || 'mainnet';
    const networkConfig = getSelendraEvmConfig(network);
    return {
        network,
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 1000,
        debug: false,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'selendra-sdk-evm/1.0.0'
        },
        gasConfig: {
            gasMultiplier: 1.2,
            maxGasLimit: networkConfig.gasConfig.maxGasLimit,
            minGasLimit: networkConfig.gasConfig.minGasLimit,
            defaultGasPrice: networkConfig.gasConfig.defaultGasPrice,
            maxGasPrice: networkConfig.gasConfig.maxGasPrice,
            ...overrides.gasConfig
        },
        preferredTransactionType: networkConfig.defaultTransactionType,
        enableBatching: networkConfig.features.batchTransactions,
        confirmations: 1,
        pollingInterval: 2000,
        maxPollingDuration: 300000, // 5 minutes
        enableSubscriptions: true,
        ...overrides
    };
}
/**
 * Validate Ethereum address format
 */
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}
/**
 * Validate private key format
 */
function isValidPrivateKey(privateKey) {
    return /^0x[a-fA-F0-9]{64}$/.test(privateKey);
}
/**
 * Validate transaction hash format
 */
function isValidTransactionHash(hash) {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
}
/**
 * Convert wei to ether
 */
function weiToEther(wei) {
    const weiValue = typeof wei === 'string' ? BigInt(wei) : typeof wei === 'number' ? BigInt(Math.floor(wei)) : wei;
    const etherValue = Number(weiValue) / 1e18;
    return etherValue.toString();
}
/**
 * Convert ether to wei
 */
function etherToWei(ether) {
    const etherValue = typeof ether === 'number' ? ether : parseFloat(ether);
    const weiValue = Math.floor(etherValue * 1e18);
    return weiValue.toString();
}
/**
 * Convert gwei to wei
 */
function gweiToWei(gwei) {
    const gweiValue = typeof gwei === 'number' ? gwei : parseFloat(gwei);
    const weiValue = Math.floor(gweiValue * 1e9);
    return weiValue.toString();
}
/**
 * Format balance for display
 */
function formatBalance(balance, decimals = 18, symbol) {
    const balanceValue = typeof balance === 'string' ? BigInt(balance) : balance;
    const divisor = BigInt(10 ** decimals);
    const whole = balanceValue / divisor;
    const fractional = balanceValue % divisor;
    const result = `${whole}.${fractional.toString().padStart(decimals, '0').replace(/0+$/, '')}`;
    return symbol ? `${result} ${symbol}` : result;
}
/**
 * Parse balance string to wei
 */
function parseBalance(balance, decimals = 18) {
    const [whole, fractional = '0'] = balance.split('.');
    const fractionalPadded = fractional.padEnd(decimals, '0').slice(0, decimals);
    const wholeWei = BigInt(whole) * BigInt(10 ** decimals);
    const fractionalWei = BigInt(fractionalPadded);
    return (wholeWei + fractionalWei).toString();
}
/**
 * Gas estimation defaults
 */
exports.GAS_ESTIMATION_DEFAULTS = {
    // Standard transfer gas limit
    SIMPLE_TRANSFER: 21000,
    // Token transfer gas limit
    TOKEN_TRANSFER: 65000,
    // Contract deployment gas limit
    CONTRACT_DEPLOYMENT: 2000000,
    // Complex contract interaction gas limit
    CONTRACT_INTERACTION: 200000,
    // Maximum reasonable gas limit
    MAX_GAS_LIMIT: 15000000
};
/**
 * Default transaction overrides
 */
exports.DEFAULT_TX_OVERRIDES = {
    gasLimit: 'auto',
    gasPrice: 'auto',
    maxFeePerGas: 'auto',
    maxPriorityFeePerGas: 'auto',
    type: 'auto'
};
//# sourceMappingURL=config.js.map