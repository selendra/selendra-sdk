/**
 * SDK Core Unit Tests
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { createMockApi } from "../mocks/index.js";
import { SelendraSDK } from "../../src/core/index.js";
import type { SDKConfig } from "../../src/types/index.js";

describe("SelendraSDK", () => {
  const testConfig: SDKConfig = {
    rpcUrl: "wss://test.selendra.org",
    evmRpcUrl: "https://evm-test.selendra.org",
  };

  describe("createSDK", () => {
    it("should create SDK instance with valid config", () => {
      const sdk = new SelendraSDK(testConfig);

      expect(sdk).toBeDefined();
      expect(sdk.isConnected).toBe(false);
    });

    it("should throw for missing rpcUrl", () => {
      expect(() => {
        new SelendraSDK({} as SDKConfig);
      }).toThrow();
    });
  });

  describe("getConnectionInfo", () => {
    it("should return null when not connected", () => {
      const sdk = new SelendraSDK(testConfig);

      const info = sdk.getConnectionInfo();

      expect(info).toBeNull();
    });
  });

  describe("isConnected", () => {
    it("should return false initially", () => {
      const sdk = new SelendraSDK(testConfig);

      expect(sdk.isConnected).toBe(false);
    });
  });
});

describe("SDK Utilities", () => {
  describe("Address Validation", () => {
    it("should validate Substrate addresses", () => {
      const validAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
      const isValid = /^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(validAddress);

      expect(isValid).toBe(true);
    });

    it("should validate EVM addresses", () => {
      const validAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f3e7dE";
      const isValid = /^0x[a-fA-F0-9]{40}$/.test(validAddress);

      expect(isValid).toBe(true);
    });

    it("should reject invalid addresses", () => {
      const invalidAddress = "invalid_address";
      const isSubstrate = /^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(invalidAddress);
      const isEvm = /^0x[a-fA-F0-9]{40}$/.test(invalidAddress);

      expect(isSubstrate).toBe(false);
      expect(isEvm).toBe(false);
    });
  });

  describe("Balance Formatting", () => {
    it("should format large balances correctly", () => {
      const balance = "1000000000000000000"; // 1 SEL with 18 decimals
      const decimals = 18;

      const formatted = formatBalance(balance, decimals);

      expect(formatted).toBe("1");
    });

    it("should format small balances correctly", () => {
      const balance = "123456789012345678"; // 0.123... SEL
      const decimals = 18;

      const formatted = formatBalance(balance, decimals);

      expect(formatted).toBe("0.123456789012345678");
    });

    it("should handle zero balance", () => {
      const balance = "0";
      const decimals = 18;

      const formatted = formatBalance(balance, decimals);

      expect(formatted).toBe("0");
    });
  });
});

// Helper function for tests
function formatBalance(value: string, decimals: number): string {
  if (value === "0") return "0";

  const paddedValue = value.padStart(decimals + 1, "0");
  const integerPart = paddedValue.slice(0, -decimals) || "0";
  const decimalPart = paddedValue.slice(-decimals).replace(/0+$/, "");

  return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
}
