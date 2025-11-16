"use strict";
/**
 * Common types used throughout the Selendra SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionStatus = void 0;
/**
 * Transaction status enumeration
 */
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["INCLUDED"] = "included";
    TransactionStatus["FINALIZED"] = "finalized";
    TransactionStatus["FAILED"] = "failed";
    TransactionStatus["REJECTED"] = "rejected";
    TransactionStatus["UNKNOWN"] = "unknown";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
//# sourceMappingURL=common.js.map