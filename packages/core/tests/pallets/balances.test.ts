/**
 * Balances Pallet Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { createMockApi, createMockSigner } from "../mocks/index.js";
import { BalancesQueries } from "../../src/pallets/balances/queries.js";
import { BalancesManager } from "../../src/pallets/balances/client.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

describe("BalancesQueries", () => {
  let mockApi: any;
  let queries: BalancesQueries;

  beforeEach(() => {
    mockApi = createMockApi();
    queries = new BalancesQueries(mockApi);
  });

  describe("account", () => {
    it("should return account data for valid address", async () => {
      const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

      mockApi.query.system.account.mockResolvedValue({
        data: {
          free: { toString: () => "1000000000000000000" },
          reserved: { toString: () => "0" },
          frozen: { toString: () => "0" },
          flags: { toString: () => "0" },
        },
      });

      const result = await queries.account(address);

      expect(result).toBeDefined();
      expect(result.free).toBe(BigInt("1000000000000000000"));
      expect(result.reserved).toBe(BigInt("0"));
      expect(result.frozen).toBe(BigInt("0"));
    });

    it("should return zero balances for non-existent account", async () => {
      const address = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";

      mockApi.query.system.account.mockResolvedValue({
        data: {
          free: { toString: () => "0" },
          reserved: { toString: () => "0" },
          frozen: { toString: () => "0" },
          flags: { toString: () => "0" },
        },
      });

      const result = await queries.account(address);

      expect(result.free).toBe(BigInt("0"));
      expect(result.reserved).toBe(BigInt("0"));
    });
  });

  describe("totalIssuance", () => {
    it("should return total token issuance", async () => {
      mockApi.query.balances.totalIssuance.mockResolvedValue({
        toString: () => "1000000000000000000000",
      });

      const result = await queries.totalIssuance();

      expect(result).toBe(BigInt("1000000000000000000000"));
    });
  });

  describe("locks", () => {
    it("should return balance locks for account", async () => {
      const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

      mockApi.query.balances.locks.mockResolvedValue([
        {
          id: { toHuman: () => "staking" },
          amount: { toString: () => "500000000000000000" },
          reasons: { isAll: true },
        },
      ]);

      const result = await queries.locks(address);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("staking");
      expect(result[0].amount).toBe(BigInt("500000000000000000"));
    });

    it("should return empty array for account with no locks", async () => {
      const address = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";

      mockApi.query.balances.locks.mockResolvedValue([]);

      const result = await queries.locks(address);

      expect(result).toHaveLength(0);
    });
  });

  describe("freeBalance", () => {
    it("should return free balance for account", async () => {
      const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

      mockApi.query.system.account.mockResolvedValue({
        data: {
          free: { toString: () => "1000000000000000000" },
          reserved: { toString: () => "100000000000000000" },
          frozen: { toString: () => "50000000000000000" },
          flags: { toString: () => "0" },
        },
      });

      const result = await queries.freeBalance(address);

      expect(result).toBe(BigInt("1000000000000000000"));
    });
  });
});

describe("BalancesManager", () => {
  let mockApi: any;
  let manager: BalancesManager;

  beforeEach(() => {
    mockApi = createMockApi();
    manager = new BalancesManager(mockApi);
  });

  describe("transfer", () => {
    it("should create transfer extrinsic", () => {
      const dest = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";
      const value = BigInt("1000000000000000000");

      const result = manager.transfer({ dest, value });

      expect(result).toBeDefined();
      // The result is a SubmittableExtrinsic
      expect(result.hash).toBeDefined();
    });
  });

  describe("transferAll", () => {
    it("should create transfer all extrinsic", () => {
      const dest = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";

      const result = manager.transferAll({ dest, keepAlive: true });

      expect(result).toBeDefined();
      expect(result.hash).toBeDefined();
    });
  });

  describe("transferKeepAlive", () => {
    it("should create keep-alive transfer extrinsic", () => {
      const dest = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";
      const value = BigInt("1000000000000000000");

      const result = manager.transferKeepAlive({ dest, value });

      expect(result).toBeDefined();
      expect(result.hash).toBeDefined();
    });
  });

  describe("queries accessor", () => {
    it("should provide access to queries", () => {
      expect(manager.queries).toBeDefined();
      expect(manager.queries).toBeInstanceOf(BalancesQueries);
    });
  });
});
