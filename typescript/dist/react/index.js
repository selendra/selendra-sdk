"use strict";
/**
 * React integration for Selendra SDK
 *
 * Main entry point for React components and hooks.
 * Provides comprehensive React integration with the Selendra blockchain SDK.
 *
 * @author Selendra Development Team
 * @version 1.0.0
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
exports.sdk = exports.createSDK = exports.ChainType = exports.Network = exports.SelendraSDK = exports.SelendraContext = exports.useSelendra = exports.useSelendraContext = exports.SelendraProvider = void 0;
// Re-export the main provider and context
var provider_1 = require("./provider");
Object.defineProperty(exports, "SelendraProvider", { enumerable: true, get: function () { return provider_1.SelendraProvider; } });
Object.defineProperty(exports, "useSelendraContext", { enumerable: true, get: function () { return provider_1.useSelendraContext; } });
Object.defineProperty(exports, "useSelendra", { enumerable: true, get: function () { return provider_1.useSelendra; } });
Object.defineProperty(exports, "SelendraContext", { enumerable: true, get: function () { return provider_1.SelendraContext; } });
// Re-export all hooks
__exportStar(require("./hooks"), exports);
// Re-export components
__exportStar(require("./components"), exports);
// Re-export examples for developers
__exportStar(require("./examples"), exports);
// Re-export SDK classes and types for React integration
var sdk_1 = require("../sdk");
Object.defineProperty(exports, "SelendraSDK", { enumerable: true, get: function () { return sdk_1.SelendraSDK; } });
Object.defineProperty(exports, "Network", { enumerable: true, get: function () { return sdk_1.Network; } });
Object.defineProperty(exports, "ChainType", { enumerable: true, get: function () { return sdk_1.ChainType; } });
Object.defineProperty(exports, "createSDK", { enumerable: true, get: function () { return sdk_1.createSDK; } });
Object.defineProperty(exports, "sdk", { enumerable: true, get: function () { return sdk_1.sdk; } });
// Re-export all types from main types module
__exportStar(require("../types"), exports);
//# sourceMappingURL=index.js.map