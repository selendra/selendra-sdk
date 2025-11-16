"use strict";
/**
 * Selendra SDK - TypeScript
 *
 * A comprehensive SDK for interacting with the Selendra blockchain.
 *
 * @fileoverview Main entry point for the Selendra SDK
 * @author Selendra Team <team@selendra.org>
 * @license Apache-2.0
 * @version 0.1.0
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
exports.DEFAULT_SELENDRA_TESTNET_ENDPOINT = exports.DEFAULT_SELENDRA_ENDPOINT = exports.DEFAULT_TIMEOUT = exports.VERSION = exports.sdk = exports.createSDK = exports.Network = exports.SelendraSDK = void 0;
// Export main SDK class and network enum
var sdk_1 = require("./sdk");
Object.defineProperty(exports, "SelendraSDK", { enumerable: true, get: function () { return sdk_1.SelendraSDK; } });
Object.defineProperty(exports, "Network", { enumerable: true, get: function () { return sdk_1.Network; } });
Object.defineProperty(exports, "createSDK", { enumerable: true, get: function () { return sdk_1.createSDK; } });
Object.defineProperty(exports, "sdk", { enumerable: true, get: function () { return sdk_1.sdk; } });
// Export types
__exportStar(require("./types"), exports);
// Export working client implementations
__exportStar(require("./evm"), exports);
// Export React components and hooks
__exportStar(require("./react"), exports);
// Version information
exports.VERSION = '0.1.0';
/**
 * Default timeout for network operations (in milliseconds)
 */
exports.DEFAULT_TIMEOUT = 30000;
/**
 * Default RPC endpoint for Selendra mainnet
 */
exports.DEFAULT_SELENDRA_ENDPOINT = 'wss://rpc.selendra.org';
/**
 * Default RPC endpoint for Selendra testnet
 */
exports.DEFAULT_SELENDRA_TESTNET_ENDPOINT = 'wss://testnet-rpc.selendra.org';
//# sourceMappingURL=index.js.map