import { SelendraSDK } from '../../src/index';
import { TEST_CONFIG } from '../setup';

describe('SelendraSDK Integration Tests', () => {
  let sdk: SelendraSDK;

  beforeEach(() => {
    sdk = new SelendraSDK({
      rpcUrl: TEST_CONFIG.RPC_URL,
      wsUrl: TEST_CONFIG.SUBSTRATE_WS_URL,
      privateKey: TEST_CONFIG.PRIVATE_KEY,
      network: 'testnet'
    });
  });

  afterEach(async () => {
    if (sdk.wasm && sdk.wasm.isConnected()) {
      await sdk.wasm.disconnect();
    }
  });

  describe('initialization', () => {
    it('should initialize all components', () => {
      expect(sdk).toBeInstanceOf(SelendraSDK);
      expect(sdk.evm).toBeDefined();
      expect(sdk.wasm).toBeDefined();
      expect(sdk.wallet).toBeDefined();
      expect(sdk.config).toBeDefined();
      expect(sdk.utils).toBeDefined();
    });

    it('should initialize with default config', () => {
      const defaultSdk = new SelendraSDK();
      
      expect(defaultSdk.config.network).toBe('testnet');
      expect(defaultSdk.config.rpcUrl).toBe('https://rpc-testnet.selendra.org');
      expect(defaultSdk.config.wsUrl).toBe('wss://rpc-testnet.selendra.org:9944');
    });
  });

  describe('EVM integration', () => {
    it('should interact with EVM client', async () => {
      // Mock the provider methods
      const mockProvider = {
        getBalance: jest.fn().mockResolvedValue('1000000000000000000'),
        getTransactionCount: jest.fn().mockResolvedValue(42),
        getBlockNumber: jest.fn().mockResolvedValue(12345)
      };
      
      (sdk.evm as any).provider = mockProvider;
      
      const balance = await sdk.evm.getBalance(TEST_CONFIG.ACCOUNT_ADDRESS);
      expect(balance).toBe('1.0');
      
      const nonce = await sdk.evm.getTransactionCount(TEST_CONFIG.ACCOUNT_ADDRESS);
      expect(nonce).toBe(42);
      
      const blockNumber = await sdk.evm.getBlockNumber();
      expect(blockNumber).toBe(12345);
    });

    it('should create EVM contract instance', () => {
      const abi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function transfer(address to, uint256 amount) returns (bool)'
      ];
      
      const contract = sdk.evm.contract(TEST_CONFIG.CONTRACT_ADDRESS, abi);
      
      expect(contract).toBeDefined();
      expect((contract as any).address).toBe(TEST_CONFIG.CONTRACT_ADDRESS);
      expect((contract as any).abi).toEqual(abi);
    });
  });

  describe('WASM integration', () => {
    it('should connect to substrate node', async () => {
      // Mock the API
      const mockApi = {
        isConnected: true,
        disconnect: jest.fn(),
        query: {
          system: {
            account: jest.fn().mockResolvedValue({
              data: {
                free: { toString: () => '1000000000000000000' }
              }
            })
          }
        }
      };
      
      (sdk.wasm as any).api = mockApi;
      
      await sdk.wasm.connect();
      
      expect(sdk.wasm.isConnected()).toBe(true);
      
      const balance = await sdk.wasm.getBalance(TEST_CONFIG.ACCOUNT_ADDRESS);
      expect(balance).toBe('1.0');
    });

    it('should create WASM contract instance', async () => {
      const abi = {
        constructors: [],
        messages: [
          { identifier: 'balanceOf', isPayable: false, isMutating: false },
          { identifier: 'transfer', isPayable: false, isMutating: true }
        ]
      };
      
      const mockApi = { registry: { createType: jest.fn() } };
      (sdk.wasm as any).api = mockApi;
      
      const contract = sdk.wasm.contract(TEST_CONFIG.WASM_CONTRACT_ADDRESS, abi);
      
      expect(contract).toBeDefined();
      expect((contract as any).address).toBe(TEST_CONFIG.WASM_CONTRACT_ADDRESS);
      expect((contract as any).abi).toEqual(abi);
    });
  });

  describe('Wallet integration', () => {
    it('should detect available wallets', () => {
      // Mock window.ethereum
      Object.defineProperty(window, 'ethereum', {
        value: { isMetaMask: true },
        writable: true
      });
      
      const wallets = sdk.wallet.detectWallets();
      
      expect(wallets).toContain('MetaMask');
    });

    it('should manage wallet connections', async () => {
      const mockProvider = {
        request: jest.fn().mockResolvedValue([TEST_CONFIG.ACCOUNT_ADDRESS]),
        on: jest.fn(),
        removeListener: jest.fn()
      };
      
      Object.defineProperty(window, 'ethereum', {
        value: mockProvider,
        writable: true
      });
      
      const address = await sdk.wallet.connect('MetaMask');
      
      expect(address).toBe(TEST_CONFIG.ACCOUNT_ADDRESS);
      expect(sdk.wallet.isConnected()).toBe(true);
      expect(sdk.wallet.getCurrentWallet()).toBe('MetaMask');
    });
  });

  describe('Utility functions', () => {
    it('should provide utility functions', () => {
      expect(sdk.utils.formatEther).toBeDefined();
      expect(sdk.utils.parseEther).toBeDefined();
      expect(sdk.utils.formatUnits).toBeDefined();
      expect(sdk.utils.parseUnits).toBeDefined();
      expect(sdk.utils.isAddress).toBeDefined();
      expect(sdk.utils.getAddress).toBeDefined();
      expect(sdk.utils.keccak256).toBeDefined();
      expect(sdk.utils.solidityKeccak256).toBeDefined();
    });

    it('should format and parse ether correctly', () => {
      const ether = '1.5';
      const wei = sdk.utils.parseEther(ether);
      const formatted = sdk.utils.formatEther(wei);
      
      expect(formatted).toBe('1.5');
    });

    it('should validate addresses', () => {
      expect(sdk.utils.isAddress(TEST_CONFIG.ACCOUNT_ADDRESS)).toBe(true);
      expect(sdk.utils.isAddress('invalid-address')).toBe(false);
    });

    it('should compute keccak256 hash', () => {
      const hash = sdk.utils.keccak256('Hello, Selendra!');
      
      expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe('Configuration', () => {
    it('should allow configuration updates', () => {
      sdk.updateConfig({
        network: 'mainnet',
        rpcUrl: 'https://rpc.selendra.org'
      });
      
      expect(sdk.config.network).toBe('mainnet');
      expect(sdk.config.rpcUrl).toBe('https://rpc.selendra.org');
    });

    it('should provide network presets', () => {
      const testnetConfig = sdk.getNetworkConfig('testnet');
      const mainnetConfig = sdk.getNetworkConfig('mainnet');
      
      expect(testnetConfig.rpcUrl).toBe('https://rpc-testnet.selendra.org');
      expect(mainnetConfig.rpcUrl).toBe('https://rpc.selendra.org');
    });
  });

  describe('Error handling', () => {
    it('should handle EVM errors gracefully', async () => {
      const mockProvider = {
        getBalance: jest.fn().mockRejectedValue(new Error('Network error'))
      };
      
      (sdk.evm as any).provider = mockProvider;
      
      await expect(sdk.evm.getBalance(TEST_CONFIG.ACCOUNT_ADDRESS)).rejects.toThrow('Network error');
    });

    it('should handle WASM errors gracefully', async () => {
      const mockApi = {
        query: {
          system: {
            account: jest.fn().mockRejectedValue(new Error('Connection error'))
          }
        }
      };
      
      (sdk.wasm as any).api = mockApi;
      
      await expect(sdk.wasm.getBalance(TEST_CONFIG.ACCOUNT_ADDRESS)).rejects.toThrow('Connection error');
    });

    it('should handle wallet errors gracefully', async () => {
      const mockProvider = {
        request: jest.fn().mockRejectedValue(new Error('User rejected'))
      };
      
      Object.defineProperty(window, 'ethereum', {
        value: mockProvider,
        writable: true
      });
      
      await expect(sdk.wallet.connect('MetaMask')).rejects.toThrow('User rejected');
    });
  });

  describe('Cross-VM compatibility', () => {
    it('should handle cross-VM asset transfers', async () => {
      // Mock both EVM and WASM clients
      const mockEvmProvider = {
        sendTransaction: jest.fn().mockResolvedValue({
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          wait: jest.fn().mockResolvedValue({
            status: 1,
            transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
          })
        })
      };
      
      const mockWasmApi = {
        tx: {
          balances: {
            transfer: jest.fn().mockReturnValue({
              signAndSend: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
            })
          }
        }
      };
      
      (sdk.evm as any).signer = { sendTransaction: mockEvmProvider.sendTransaction };
      (sdk.wasm as any).api = mockWasmApi;
      
      // Test EVM transaction
      const evmTx = await sdk.evm.sendTransaction({
        to: TEST_CONFIG.CONTRACT_ADDRESS,
        value: '1000000000000000000'
      });
      
      expect(evmTx).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      
      // Test WASM transaction
      const keyring = sdk.wasm.createKeyring();
      const sender = keyring.addFromUri('//Alice');
      
      const wasmTx = await sdk.wasm.transfer(
        sender,
        TEST_CONFIG.ACCOUNT_ADDRESS,
        '1.0'
      );
      
      expect(wasmTx).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    });
  });
});