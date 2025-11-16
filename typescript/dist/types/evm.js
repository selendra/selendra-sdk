"use strict";
/**
 * EVM-specific types for the Selendra SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvmTransactionType = void 0;
/**
 * EVM transaction types
 */
var EvmTransactionType;
(function (EvmTransactionType) {
    EvmTransactionType["LEGACY"] = "0x0";
    EvmTransactionType["EIP_2930"] = "0x1";
    EvmTransactionType["EIP_1559"] = "0x2";
})(EvmTransactionType || (exports.EvmTransactionType = EvmTransactionType = {}));
//# sourceMappingURL=evm.js.map