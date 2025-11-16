"use strict";
/**
 * Network-related types for the Selendra SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NETWORKS = exports.NetworkFeature = exports.NetworkProtocol = exports.NetworkType = void 0;
exports.getNetworkConfig = getNetworkConfig;
exports.getMainnetNetworks = getMainnetNetworks;
exports.getTestnetNetworks = getTestnetNetworks;
exports.getEvmNetworks = getEvmNetworks;
exports.getSubstrateNetworks = getSubstrateNetworks;
/**
 * Network type enumeration
 */
var NetworkType;
(function (NetworkType) {
    NetworkType["MAINNET"] = "mainnet";
    NetworkType["TESTNET"] = "testnet";
    NetworkType["DEVELOPMENT"] = "development";
    NetworkType["LOCAL"] = "local";
})(NetworkType || (exports.NetworkType = NetworkType = {}));
/**
 * Network protocol types
 */
var NetworkProtocol;
(function (NetworkProtocol) {
    NetworkProtocol["SUBSTRATE"] = "substrate";
    NetworkProtocol["EVM"] = "evm";
    NetworkProtocol["HYBRID"] = "hybrid";
})(NetworkProtocol || (exports.NetworkProtocol = NetworkProtocol = {}));
/**
 * Network features
 */
var NetworkFeature;
(function (NetworkFeature) {
    NetworkFeature["EVM"] = "evm";
    NetworkFeature["SUBSTRATE"] = "substrate";
    NetworkFeature["STAKING"] = "staking";
    NetworkFeature["GOVERNANCE"] = "governance";
    NetworkFeature["TREASURY"] = "treasury";
    NetworkFeature["IDENTITY"] = "identity";
    NetworkFeature["PROXY"] = "proxy";
    NetworkFeature["MULTISIG"] = "multisig";
    NetworkFeature["NFTS"] = "nfts";
    NetworkFeature["DEFI"] = "defi";
    NetworkFeature["BRIDGE"] = "bridge";
})(NetworkFeature || (exports.NetworkFeature = NetworkFeature = {}));
/**
 * Known network configurations
 */
exports.NETWORKS = {
    selendra_mainnet: {
        networkId: 'selendra_mainnet',
        type: NetworkType.MAINNET,
        protocol: NetworkProtocol.HYBRID,
        chainId: 'selendra',
        name: 'Selendra Mainnet',
        description: 'The Selendra main network with both EVM and Substrate support',
        rpcEndpoints: [
            'https://rpc.selendra.org',
            'https://rpc1.selendra.org',
            'https://rpc2.selendra.org'
        ],
        wsEndpoints: [
            'wss://rpc.selendra.org',
            'wss://rpc1.selendra.org',
            'wss://rpc2.selendra.org'
        ],
        blockExplorer: 'https://explorer.selendra.org',
        defaultGasLimit: '2100000000000000',
        defaultGasPrice: '1000000000',
        metadata: {
            nativeCurrency: {
                symbol: 'SEL',
                name: 'Selendra',
                decimals: 12
            },
            features: [
                NetworkFeature.EVM,
                NetworkFeature.SUBSTRATE,
                NetworkFeature.STAKING,
                NetworkFeature.GOVERNANCE,
                NetworkFeature.TREASURY,
                NetworkFeature.IDENTITY,
                NetworkFeature.PROXY,
                NetworkFeature.MULTISIG,
                NetworkFeature.NFTS,
                NetworkFeature.DEFI,
                NetworkFeature.BRIDGE
            ]
        }
    },
    selendra_testnet: {
        networkId: 'selendra_testnet',
        type: NetworkType.TESTNET,
        protocol: NetworkProtocol.HYBRID,
        chainId: 'selendra_testnet',
        name: 'Selendra Testnet',
        description: 'The Selendra test network for development and testing',
        rpcEndpoints: [
            'https://testnet-rpc.selendra.org',
            'https://testnet-rpc1.selendra.org'
        ],
        wsEndpoints: [
            'wss://testnet-rpc.selendra.org',
            'wss://testnet-rpc1.selendra.org'
        ],
        blockExplorer: 'https://testnet-explorer.selendra.org',
        defaultGasLimit: '2100000000000000',
        defaultGasPrice: '1000000000',
        metadata: {
            nativeCurrency: {
                symbol: 'tSEL',
                name: 'Test Selendra',
                decimals: 12
            },
            features: [
                NetworkFeature.EVM,
                NetworkFeature.SUBSTRATE,
                NetworkFeature.STAKING,
                NetworkFeature.GOVERNANCE,
                NetworkFeature.IDENTITY,
                NetworkFeature.PROXY,
                NetworkFeature.MULTISIG,
                NetworkFeature.NFTS,
                NetworkFeature.DEFI
            ]
        }
    },
    localhost: {
        networkId: 'localhost',
        type: NetworkType.DEVELOPMENT,
        protocol: NetworkProtocol.HYBRID,
        chainId: 'localhost',
        name: 'Local Development',
        description: 'Local development network',
        rpcEndpoints: [
            'http://localhost:9933',
            'http://127.0.0.1:9933'
        ],
        wsEndpoints: [
            'ws://localhost:9944',
            'ws://127.0.0.1:9944'
        ],
        defaultGasLimit: '2100000000000000',
        defaultGasPrice: '1000000000',
        metadata: {
            nativeCurrency: {
                symbol: 'DEV',
                name: 'Development Token',
                decimals: 12
            },
            features: [
                NetworkFeature.EVM,
                NetworkFeature.SUBSTRATE,
                NetworkFeature.STAKING,
                NetworkFeature.GOVERNANCE
            ]
        }
    }
};
/**
 * Get network configuration by ID
 */
function getNetworkConfig(networkId) {
    return exports.NETWORKS[networkId];
}
/**
 * Get all mainnet networks
 */
function getMainnetNetworks() {
    return Object.values(exports.NETWORKS).filter(network => network.type === NetworkType.MAINNET);
}
/**
 * Get all testnet networks
 */
function getTestnetNetworks() {
    return Object.values(exports.NETWORKS).filter(network => network.type === NetworkType.TESTNET);
}
/**
 * Get all EVM-enabled networks
 */
function getEvmNetworks() {
    return Object.values(exports.NETWORKS).filter(network => network.features.includes(NetworkFeature.EVM));
}
/**
 * Get all Substrate-enabled networks
 */
function getSubstrateNetworks() {
    return Object.values(exports.NETWORKS).filter(network => network.features.includes(NetworkFeature.SUBSTRATE));
}
//# sourceMappingURL=network.js.map