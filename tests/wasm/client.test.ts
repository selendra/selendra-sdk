import { WasmClient } from '../../src/wasm/client';
import { TEST_CONFIG } from '../setup';

// Mock @polkadot/api
jest.mock('@polkadot/api', () => ({
  ApiPromise: {
    create: jest.fn().mockResolvedValue({
      disconnect: jest.fn(),
      query: {
        system: {
          account: jest.fn().mockResolvedValue({
            data: {
              free: { toString: () => '1000000000000000000' },
              reserved: { toString: () => '0' },
              miscFrozen: { toString: () => '0' },
              feeFrozen: { toString: () => '0' }
            },
            nonce: { toString: () => '42' }
          })
        }
      },
      rpc: {
        chain: {
          getBlockHash: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
          getBlock: jest.fn().mockResolvedValue({
            block: {
              header: {
                number: { toString: () => '12345' }
              }
            }
          })
        }
      },
      tx: {
        balances: {
          transfer: jest.fn().mockReturnValue({
            signAndSend: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
          })
        }
      },
      createType: jest.fn().mockReturnValue({
        toString: () => 'mock-type'
      })
    })
  },
  WsProvider: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    isConnected: jest.fn().mockReturnValue(true)
  })),
  Keyring: jest.fn().mockImplementation(() => ({
    addFromUri: jest.fn().mockReturnValue({
      address: TEST_CONFIG.ACCOUNT_ADDRESS,
      meta: { name: 'test' }
    })
  }))
}));

describe('WasmClient', () => {
  let client: WasmClient;

  beforeEach(async () => {
    client = new WasmClient(TEST_CONFIG.SUBSTRATE_WS_URL);
    await client.connect();
  });

  afterEach(async () => {
    await client.disconnect();
  });

  describe('constructor', () => {
    it('should initialize with WebSocket URL', () => {
      expect(client).toBeInstanceOf(WasmClient);
      expect((client as any).wsUrl).toBe(TEST_CONFIG.SUBSTRATE_WS_URL);
    });
  });

  describe('connect', () => {
    it('should connect to Substrate node', async () => {
      const newClient = new WasmClient(TEST_CONFIG.SUBSTRATE_WS_URL);
      await expect(newClient.connect()).resolves.not.toThrow();
      await newClient.disconnect();
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Substrate node', async () => {
      await expect(client.disconnect()).resolves.not.toThrow();
    });
  });

  describe('isConnected', () => {
    it('should return connection status', () => {
      expect(client.isConnected()).toBe(true);
    });
  });

  describe('getBalance', () => {
    it('should return balance for address', async () => {
      const balance = await client.getBalance(TEST_CONFIG.ACCOUNT_ADDRESS);
      
      expect(balance).toBe('1.0');
    });
  });

  describe('getNonce', () => {
    it('should return nonce for address', async () => {
      const nonce = await client.getNonce(TEST_CONFIG.ACCOUNT_ADDRESS);
      
      expect(nonce).toBe(42);
    });
  });

  describe('getBlockNumber', () => {
    it('should return current block number', async () => {
      const blockNumber = await client.getBlockNumber();
      
      expect(blockNumber).toBe(12345);
    });
  });

  describe('getBlockHash', () => {
    it('should return block hash for block number', async () => {
      const blockHash = await client.getBlockHash(12345);
      
      expect(blockHash).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    });
  });

  describe('transfer', () => {
    it('should transfer tokens between accounts', async () => {
      const keyring = (client as any).keyring;
      const sender = keyring.addFromUri('//Alice');
      
      const txHash = await client.transfer(
        sender,
        TEST_CONFIG.ACCOUNT_ADDRESS,
        '0.1'
      );
      
      expect(txHash).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    });
  });

  describe('createKeyring', () => {
    it('should create keyring instance', () => {
      const keyring = client.createKeyring();
      
      expect(keyring).toBeDefined();
      expect(typeof keyring.addFromUri).toBe('function');
    });
  });

  describe('createType', () => {
    it('should create type from registry', () => {
      const type = client.createType('u32', 42);
      
      expect(type).toBeDefined();
      expect(type.toString()).toBe('mock-type');
    });
  });
});