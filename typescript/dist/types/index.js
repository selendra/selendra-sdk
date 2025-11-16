"use strict";
/**
 * Common types used throughout the Selendra SDK
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
__exportStar(require("./network"), exports);
__exportStar(require("./address"), exports);
__exportStar(require("./hash"), exports);
__exportStar(require("./signature"), exports);
__exportStar(require("./error"), exports);
__exportStar(require("./chain-info"), exports);
// Platform-specific types
__exportStar(require("./evm"), exports);
__exportStar(require("./substrate"), exports);
//# sourceMappingURL=index.js.map