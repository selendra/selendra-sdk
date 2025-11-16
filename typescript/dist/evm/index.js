"use strict";
/**
 * EVM client implementation for the Selendra SDK
 * Comprehensive ethers.js v6 compatible EVM interface for Selendra network
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.EventParser = exports.EventFilters = exports.EventSubscriptionManager = exports.EventManager = exports.EventSubscription = exports.Interface = exports.ContractFactory = exports.ERC721Contract = exports.ERC20Contract = exports.Contract = exports.TransactionStatus = exports.TransactionUtils = exports.TransactionTracker = exports.TransactionBuilder = exports.TransactionManager = exports.WalletUtils = exports.MultiSigWallet = exports.ConnectedWallet = exports.SelendraWallet = exports.DEFAULT_TX_OVERRIDES = exports.GAS_ESTIMATION_DEFAULTS = exports.parseBalance = exports.formatBalance = exports.gweiToWei = exports.etherToWei = exports.weiToEther = exports.isValidTransactionHash = exports.isValidPrivateKey = exports.isValidEthereumAddress = exports.createDefaultEvmClientConfig = exports.getSelendraEvmConfig = exports.SELENDRA_EVM_NETWORKS = exports.createHttpProvider = exports.createWebSocketProvider = exports.createEvmClient = exports.HttpProvider = exports.WebSocketProvider = exports.SelendraEvmClient = void 0;
// Main client classes
var client_1 = require("./client");
Object.defineProperty(exports, "SelendraEvmClient", { enumerable: true, get: function () { return client_1.SelendraEvmClient; } });
Object.defineProperty(exports, "WebSocketProvider", { enumerable: true, get: function () { return client_1.WebSocketProvider; } });
Object.defineProperty(exports, "HttpProvider", { enumerable: true, get: function () { return client_1.HttpProvider; } });
Object.defineProperty(exports, "createEvmClient", { enumerable: true, get: function () { return client_1.createEvmClient; } });
Object.defineProperty(exports, "createWebSocketProvider", { enumerable: true, get: function () { return client_1.createWebSocketProvider; } });
Object.defineProperty(exports, "createHttpProvider", { enumerable: true, get: function () { return client_1.createHttpProvider; } });
// Configuration and utilities
var config_1 = require("./config");
Object.defineProperty(exports, "SELENDRA_EVM_NETWORKS", { enumerable: true, get: function () { return config_1.SELENDRA_EVM_NETWORKS; } });
Object.defineProperty(exports, "getSelendraEvmConfig", { enumerable: true, get: function () { return config_1.getSelendraEvmConfig; } });
Object.defineProperty(exports, "createDefaultEvmClientConfig", { enumerable: true, get: function () { return config_1.createDefaultEvmClientConfig; } });
Object.defineProperty(exports, "isValidEthereumAddress", { enumerable: true, get: function () { return config_1.isValidEthereumAddress; } });
Object.defineProperty(exports, "isValidPrivateKey", { enumerable: true, get: function () { return config_1.isValidPrivateKey; } });
Object.defineProperty(exports, "isValidTransactionHash", { enumerable: true, get: function () { return config_1.isValidTransactionHash; } });
Object.defineProperty(exports, "weiToEther", { enumerable: true, get: function () { return config_1.weiToEther; } });
Object.defineProperty(exports, "etherToWei", { enumerable: true, get: function () { return config_1.etherToWei; } });
Object.defineProperty(exports, "gweiToWei", { enumerable: true, get: function () { return config_1.gweiToWei; } });
Object.defineProperty(exports, "formatBalance", { enumerable: true, get: function () { return config_1.formatBalance; } });
Object.defineProperty(exports, "parseBalance", { enumerable: true, get: function () { return config_1.parseBalance; } });
Object.defineProperty(exports, "GAS_ESTIMATION_DEFAULTS", { enumerable: true, get: function () { return config_1.GAS_ESTIMATION_DEFAULTS; } });
Object.defineProperty(exports, "DEFAULT_TX_OVERRIDES", { enumerable: true, get: function () { return config_1.DEFAULT_TX_OVERRIDES; } });
// Account and wallet management
var account_1 = require("./account");
Object.defineProperty(exports, "SelendraWallet", { enumerable: true, get: function () { return account_1.SelendraWallet; } });
Object.defineProperty(exports, "ConnectedWallet", { enumerable: true, get: function () { return account_1.ConnectedWallet; } });
Object.defineProperty(exports, "MultiSigWallet", { enumerable: true, get: function () { return account_1.MultiSigWallet; } });
Object.defineProperty(exports, "WalletUtils", { enumerable: true, get: function () { return account_1.WalletUtils; } });
// Transaction management
var transaction_1 = require("./transaction");
Object.defineProperty(exports, "TransactionManager", { enumerable: true, get: function () { return transaction_1.TransactionManager; } });
Object.defineProperty(exports, "TransactionBuilder", { enumerable: true, get: function () { return transaction_1.TransactionBuilder; } });
Object.defineProperty(exports, "TransactionTracker", { enumerable: true, get: function () { return transaction_1.TransactionTracker; } });
Object.defineProperty(exports, "TransactionUtils", { enumerable: true, get: function () { return transaction_1.TransactionUtils; } });
Object.defineProperty(exports, "TransactionStatus", { enumerable: true, get: function () { return transaction_1.TransactionStatus; } });
// Contract interaction
var contract_1 = require("./contract");
Object.defineProperty(exports, "Contract", { enumerable: true, get: function () { return contract_1.Contract; } });
Object.defineProperty(exports, "ERC20Contract", { enumerable: true, get: function () { return contract_1.ERC20Contract; } });
Object.defineProperty(exports, "ERC721Contract", { enumerable: true, get: function () { return contract_1.ERC721Contract; } });
Object.defineProperty(exports, "ContractFactory", { enumerable: true, get: function () { return contract_1.ContractFactory; } });
Object.defineProperty(exports, "Interface", { enumerable: true, get: function () { return contract_1.Interface; } });
Object.defineProperty(exports, "EventSubscription", { enumerable: true, get: function () { return contract_1.EventSubscription; } });
// Events and subscriptions
var events_1 = require("./events");
Object.defineProperty(exports, "EventManager", { enumerable: true, get: function () { return events_1.EventManager; } });
Object.defineProperty(exports, "EventSubscriptionManager", { enumerable: true, get: function () { return events_1.EventSubscription; } });
Object.defineProperty(exports, "EventFilters", { enumerable: true, get: function () { return events_1.EventFilters; } });
Object.defineProperty(exports, "EventParser", { enumerable: true, get: function () { return events_1.EventParser; } });
// Types
__exportStar(require("./types"), exports);
// Default export for convenience
var client_2 = require("./client");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return client_2.SelendraEvmClient; } });
//# sourceMappingURL=index.js.map