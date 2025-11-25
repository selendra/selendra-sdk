/**
 * Balances Pallet Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { createMockApi, createMockSigner } from "../mocks/index.js";
import { BalancesQueries } from "../../src/pallets/balances/queries.js";
import { BalancesManager } from "../../src/pallets/balances/client.js";

describe("BalancesQueries", () => {
  let mockApi: ReturnType<typeof createMockApi>;
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
      expect(result.free).toBe("1000000000000000000");
      expect(result.reserved).toBe("0");
      expect(result.frozen).toBe("0");
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

      expect(result.free).toBe("0");
      expect(result.reserved).toBe("0");
    });
  });

  describe("totalIssuance", () => {
    it("should return total token issuance", async () => {
      mockApi.query.balances.totalIssuance.mockResolvedValue({
        toString: () => "1000000000000000000000",
      });

      const result = await queries.totalIssuance();

      expect(result).toBe("1000000000000000000000");
    });
  });

  describe("locks", () => {
    it("should return balance locks for account", async () => {
      const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

      mockApi.query.balances.locks.mockResolvedValue([
        {
          id: { toHuman: () => "staking" },
          amount: { toString: () => "500000000000000000" },
          reasons: { toString: () => "All" },
        },
      ]);

      const result = await queries.locks(address);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("staking");
      expect(result[0].amount).toBe("500000000000000000");
    });

    it("should return empty array for account with no locks", async () => {
      const address = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";

      mockApi.query.balances.locks.mockResolvedValue([]);

      const result = await queries.locks(address);

      expect(result).toHaveLength(0);
    });
  });

  describe("getBalance", () => {
    it("should return formatted balance info", async () => {
      const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

      mockApi.query.system.account.mockResolvedValue({
        data: {
          free: { toString: () => "1000000000000000000" },
          reserved: { toString: () => "100000000000000000" },
          frozen: { toString: () => "50000000000000000" },
          flags: { toString: () => "0" },
        },
      });

      mockApi.query.balances.locks.mockResolvedValue([]);

      const result = await queries.getBalance(address);

      expect(result).toBeDefined();
      expect(result.free).toBe("1000000000000000000");
      expect(result.reserved).toBe("100000000000000000");
      expect(result.frozen).toBe("50000000000000000");
    });
  });
});

describe("BalancesManager", () => {
  let mockApi: ReturnType<typeof createMockApi>;
  let manager: BalancesManager;
  let mockSigner: ReturnType<typeof createMockSigner>;

  beforeEach(() => {
    mockApi = createMockApi();
    manager = new BalancesManager(mockApi);
    mockSigner = createMockSigner();
  });

  describe("transfer", () => {
    it("should create transfer transaction", async () => {
      const dest = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";
      const value = "1000000000000000000";
      const signerAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

      const result = await manager.transfer(mockSigner, signerAddress, {
        dest,
        value,
      });

      expect(result).toBeDefined();
      expect(result.txHash).toBeDefined();
    });

    it("should validate positive value", async () => {
      const dest = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";
      const signerAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

      await expect(
        manager.transfer(mockSigner, signerAddress, {
          dest,
          value: "-100",
        })
      ).rejects.toThrow();
    });
  });

  describe("transferAll", () => {
    it("should create transfer all transaction", async () => {
      const dest = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";
      const signerAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

      const result = await manager.transferAll(mockSigner, signerAddress, {
        dest,
        keepAlive: true,
      });

      expect(result).toBeDefined();
      expect(result.txHash).toBeDefined();
    });
  });

  describe("transferKeepAlive", () => {
    it("should create keep-alive transfer transaction", async () => {
      const dest = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";
      const value = "1000000000000000000";
      const signerAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

      const result = await manager.transferKeepAlive(
        mockSigner,
        signerAddress,
        {
          dest,
          value,
        }
      );

      expect(result).toBeDefined();
      expect(result.txHash).toBeDefined();
    });
  });
});
