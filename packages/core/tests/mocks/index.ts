/**
 * Mock Providers for Testing
 *
 * Provides mock implementations of SDK providers for unit testing.
 *
 * @packageDocumentation
 */

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { ISubmittableResult } from "@polkadot/types/types";

/**
 * Mock API response builder
 */
export interface MockApiResponse<T = unknown> {
  /** Response value */
  value: T;
  /** Whether to throw an error */
  shouldThrow?: boolean;
  /** Error to throw */
  error?: Error;
  /** Delay in ms before responding */
  delay?: number;
}

/**
 * Create a mock Polkadot API for testing
 */
export function createMockApi(
  overrides: Partial<MockApiConfig> = {}
): MockedApi {
  const config: MockApiConfig = {
    chainName: "Selendra Test",
    tokenSymbol: "SEL",
    tokenDecimals: 18,
    ss58Format: 42,
    genesisHash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    runtimeVersion: { specName: "selendra", specVersion: 1 },
    ...overrides,
  };

  const mockRegistry = {
    chainSS58: config.ss58Format,
    chainDecimals: [config.tokenDecimals],
    chainTokens: [config.tokenSymbol],
  };

  const mockRpc = {
    chain: {
      getBlockHash: jest.fn().mockResolvedValue(config.genesisHash),
      getBlock: jest.fn().mockResolvedValue({
        block: {
          header: {
            number: { toNumber: () => 1 },
            hash: { toString: () => config.genesisHash },
          },
        },
      }),
      subscribeFinalizedHeads: jest
        .fn()
        .mockReturnValue(Promise.resolve(() => {})),
    },
    system: {
      chain: jest.fn().mockResolvedValue(config.chainName),
      name: jest.fn().mockResolvedValue("selendra-node"),
      version: jest.fn().mockResolvedValue("1.0.0"),
      chainType: jest.fn().mockResolvedValue({ isLive: true }),
      properties: jest.fn().mockResolvedValue({
        ss58Format: { toNumber: () => config.ss58Format },
        tokenDecimals: { toHuman: () => [config.tokenDecimals] },
        tokenSymbol: { toHuman: () => [config.tokenSymbol] },
      }),
    },
    state: {
      getMetadata: jest.fn().mockResolvedValue({}),
    },
  };

  const mockQuery = createMockQueryHandlers(config);
  const mockTx = createMockTxHandlers(config);
  const mockConsts = createMockConstHandlers(config);

  const mockApi = {
    isReady: Promise.resolve(),
    isConnected: true,
    registry: mockRegistry,
    genesisHash: { toString: () => config.genesisHash },
    runtimeVersion: config.runtimeVersion,
    rpc: mockRpc,
    query: mockQuery,
    tx: mockTx,
    consts: mockConsts,
    derive: {
      staking: {
        accounts: jest.fn().mockResolvedValue([]),
      },
      balances: {
        all: jest.fn().mockResolvedValue({
          freeBalance: { toString: () => "1000000000000000000" },
          reservedBalance: { toString: () => "0" },
          availableBalance: { toString: () => "1000000000000000000" },
          lockedBalance: { toString: () => "0" },
          vestingLocked: { toString: () => "0" },
        }),
      },
    },
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
    createType: jest.fn((type: string, value: unknown) => ({
      toHuman: () => value,
      toString: () => String(value),
      toHex: () => `0x${String(value)}`,
    })),
  } as unknown as MockedApi;

  return mockApi;
}

/**
 * Mock API configuration
 */
export interface MockApiConfig {
  chainName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  ss58Format: number;
  genesisHash: string;
  runtimeVersion: { specName: string; specVersion: number };
}

/**
 * Mocked API type
 */
export type MockedApi = ApiPromise & {
  _mockConfig?: MockApiConfig;
};

/**
 * Create mock query handlers
 */
function createMockQueryHandlers(config: MockApiConfig) {
  const createMockValue = <T>(value: T) => ({
    toHuman: () => value,
    toString: () => String(value),
    toNumber: () => (typeof value === "number" ? value : 0),
    unwrap: () => value,
    unwrapOr: (def: T) => value ?? def,
    isSome: value !== null && value !== undefined,
    isNone: value === null || value === undefined,
  });

  return {
    system: {
      account: jest.fn().mockResolvedValue({
        nonce: createMockValue(0),
        data: {
          free: createMockValue("1000000000000000000"),
          reserved: createMockValue("0"),
          frozen: createMockValue("0"),
          flags: createMockValue("0"),
        },
      }),
      number: jest.fn().mockResolvedValue(createMockValue(1)),
      blockHash: jest
        .fn()
        .mockResolvedValue(createMockValue(config.genesisHash)),
    },
    balances: {
      totalIssuance: jest
        .fn()
        .mockResolvedValue(createMockValue("1000000000000000000000")),
      locks: jest.fn().mockResolvedValue([]),
      reserves: jest.fn().mockResolvedValue([]),
      existentialDeposit: jest
        .fn()
        .mockResolvedValue(createMockValue("1000000000000")),
    },
    staking: {
      bonded: jest.fn().mockResolvedValue(createMockValue(null)),
      ledger: jest.fn().mockResolvedValue(createMockValue(null)),
      nominators: jest.fn().mockResolvedValue(createMockValue(null)),
      validators: jest.fn().mockResolvedValue(createMockValue(null)),
      activeEra: jest
        .fn()
        .mockResolvedValue(createMockValue({ index: 100, start: 1000 })),
      currentEra: jest.fn().mockResolvedValue(createMockValue(100)),
      minNominatorBond: jest
        .fn()
        .mockResolvedValue(createMockValue("10000000000000000")),
      minValidatorBond: jest
        .fn()
        .mockResolvedValue(createMockValue("100000000000000000")),
    },
    democracy: {
      referendumCount: jest.fn().mockResolvedValue(createMockValue(0)),
      publicProps: jest.fn().mockResolvedValue([]),
      nextExternal: jest.fn().mockResolvedValue(createMockValue(null)),
    },
    council: {
      members: jest.fn().mockResolvedValue([]),
      proposals: jest.fn().mockResolvedValue([]),
    },
    treasury: {
      proposalCount: jest.fn().mockResolvedValue(createMockValue(0)),
      proposals: jest.fn().mockResolvedValue(createMockValue(null)),
    },
    session: {
      validators: jest.fn().mockResolvedValue([]),
      currentIndex: jest.fn().mockResolvedValue(createMockValue(1)),
    },
    sudo: {
      key: jest.fn().mockResolvedValue(createMockValue(null)),
    },
    safeMode: {
      enteredUntil: jest.fn().mockResolvedValue(createMockValue(null)),
    },
    txPause: {
      pausedTransactions: jest.fn().mockResolvedValue(createMockValue(null)),
    },
    identity: {
      identityOf: jest.fn().mockResolvedValue(createMockValue(null)),
      superOf: jest.fn().mockResolvedValue(createMockValue(null)),
      subsOf: jest.fn().mockResolvedValue(createMockValue([0, []])),
      registrars: jest.fn().mockResolvedValue([]),
    },
    nominationPools: {
      lastPoolId: jest.fn().mockResolvedValue(createMockValue(0)),
      poolMembers: jest.fn().mockResolvedValue(createMockValue(null)),
      bondedPools: jest.fn().mockResolvedValue(createMockValue(null)),
      minJoinBond: jest
        .fn()
        .mockResolvedValue(createMockValue("10000000000000000")),
      minCreateBond: jest
        .fn()
        .mockResolvedValue(createMockValue("100000000000000000")),
    },
    contracts: {
      contractInfoOf: jest.fn().mockResolvedValue(createMockValue(null)),
      codeInfoOf: jest.fn().mockResolvedValue(createMockValue(null)),
    },
    scheduler: {
      agenda: jest.fn().mockResolvedValue([]),
      lookup: jest.fn().mockResolvedValue(createMockValue(null)),
    },
    preimage: {
      preimageFor: jest.fn().mockResolvedValue(createMockValue(null)),
      statusFor: jest.fn().mockResolvedValue(createMockValue(null)),
    },
  };
}

/**
 * Create mock transaction handlers
 */
function createMockTxHandlers(_config: MockApiConfig) {
  const createMockTx = () => {
    const mockSignAndSend = jest
      .fn()
      .mockImplementation(
        (_signer: unknown, callback?: (result: ISubmittableResult) => void) => {
          // Simulate transaction lifecycle
          setTimeout(() => {
            callback?.({
              status: { isReady: true, isInBlock: false, isFinalized: false },
              events: [],
            } as unknown as ISubmittableResult);
          }, 10);

          setTimeout(() => {
            callback?.({
              status: { isReady: false, isInBlock: true, isFinalized: false },
              events: [],
              txHash: { toString: () => "0x1234567890abcdef" },
            } as unknown as ISubmittableResult);
          }, 20);

          setTimeout(() => {
            callback?.({
              status: { isReady: false, isInBlock: false, isFinalized: true },
              events: [],
              txHash: { toString: () => "0x1234567890abcdef" },
            } as unknown as ISubmittableResult);
          }, 30);

          return Promise.resolve(() => {});
        }
      );

    return {
      signAndSend: mockSignAndSend,
      toHex: () => "0xmocktxhex",
      hash: { toString: () => "0xmockhash" },
    } as unknown as SubmittableExtrinsic<"promise">;
  };

  const createMockPallet = () =>
    new Proxy(
      {},
      {
        get: () => jest.fn().mockReturnValue(createMockTx()),
      }
    );

  return {
    balances: createMockPallet(),
    staking: createMockPallet(),
    democracy: createMockPallet(),
    council: createMockPallet(),
    treasury: createMockPallet(),
    session: createMockPallet(),
    nominationPools: createMockPallet(),
    identity: createMockPallet(),
    multisig: createMockPallet(),
    proxy: createMockPallet(),
    vesting: createMockPallet(),
    utility: createMockPallet(),
    contracts: createMockPallet(),
    xvm: createMockPallet(),
    dynamicEvmBaseFee: createMockPallet(),
    ethereumChecked: createMockPallet(),
    scheduler: createMockPallet(),
    preimage: createMockPallet(),
    operations: createMockPallet(),
    sudo: createMockPallet(),
    safeMode: createMockPallet(),
    txPause: createMockPallet(),
  };
}

/**
 * Create mock constant handlers
 */
function createMockConstHandlers(_config: MockApiConfig) {
  const createMockConst = <T>(value: T) => ({
    toHuman: () => value,
    toString: () => String(value),
    toNumber: () => (typeof value === "number" ? value : 0),
  });

  return {
    balances: {
      existentialDeposit: createMockConst("1000000000000"),
      maxLocks: createMockConst(50),
      maxReserves: createMockConst(50),
    },
    staking: {
      bondingDuration: createMockConst(28),
      sessionsPerEra: createMockConst(6),
      maxNominations: createMockConst(16),
    },
    democracy: {
      launchPeriod: createMockConst(50400),
      votingPeriod: createMockConst(50400),
      enactmentPeriod: createMockConst(50400),
      minimumDeposit: createMockConst("10000000000000000"),
    },
    contracts: {
      depositPerByte: createMockConst("1000000"),
      depositPerItem: createMockConst("1000000"),
    },
    scheduler: {
      maxScheduledPerBlock: createMockConst(50),
    },
  };
}

/**
 * Create a mock signer for testing
 */
export function createMockSigner() {
  return {
    signPayload: jest.fn().mockResolvedValue({ signature: "0x00" }),
    signRaw: jest.fn().mockResolvedValue({ signature: "0x00" }),
  };
}

/**
 * Create a mock EVM provider for testing
 */
export function createMockEvmProvider() {
  return {
    getBalance: jest.fn().mockResolvedValue(BigInt("1000000000000000000")),
    getTransactionCount: jest.fn().mockResolvedValue(0),
    getCode: jest.fn().mockResolvedValue("0x"),
    call: jest.fn().mockResolvedValue("0x"),
    estimateGas: jest.fn().mockResolvedValue(BigInt(21000)),
    getGasPrice: jest.fn().mockResolvedValue(BigInt("1000000000")),
    getBlockNumber: jest.fn().mockResolvedValue(1),
    sendTransaction: jest.fn().mockResolvedValue({
      hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      wait: jest.fn().mockResolvedValue({
        status: 1,
        blockNumber: 1,
        transactionHash:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      }),
    }),
  };
}

export default {
  createMockApi,
  createMockSigner,
  createMockEvmProvider,
};
