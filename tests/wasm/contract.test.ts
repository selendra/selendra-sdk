import { WasmContract } from '../../src/wasm/contract';
import { TEST_CONFIG } from '../setup';

// Mock @polkadot/api-contract
jest.mock('@polkadot/api-contract', () => ({
  ContractPromise: jest.fn().mockImplementation(() => ({
    query: {
      balanceOf: jest.fn().mockResolvedValue({
        result: {
          isOk: true,
          value: {
            toString: () => '1000000000000000000'
          }
        },
        gasConsumed: { toString: () => '100000' },
        gasRequired: { toString: () => '100000' }
      }),
      transfer: jest.fn().mockResolvedValue({
        result: {
          isOk: true,
          value: null
        },
        gasConsumed: { toString: () => '150000' },
        gasRequired: { toString: () => '150000' }
      })
    },
    tx: {
      transfer: jest.fn().mockReturnValue({
        signAndSend: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
      }),
      approve: jest.fn().mockReturnValue({
        signAndSend: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
      })
    }
  })),
  Abi: jest.fn().mockImplementation(() => ({
    constructors: [],
    messages: [
      {
        identifier: 'balanceOf',
        isPayable: false,
        isMutating: false
      },
      {
        identifier: 'transfer',
        isPayable: false,
        isMutating: true
      }
    ]
  }))
}));

describe('WasmContract', () => {
  let contract: WasmContract;
  let mockApi: any;
  let mockKeyring: any;

  beforeEach(() => {
    mockApi = {
      registry: {
        createType: jest.fn().mockReturnValue({
          toString: () => 'mock-type'
        })
      },
      tx: {
        contracts: {
          call: jest.fn().mockReturnValue({
            signAndSend: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
          })
        }
      }
    };

    mockKeyring = {
      addFromUri: jest.fn().mockReturnValue({
        address: TEST_CONFIG.ACCOUNT_ADDRESS,
        meta: { name: 'test' }
      })
    };

    const mockAbi = {
      constructors: [],
      messages: [
        {
          identifier: 'balanceOf',
          isPayable: false,
          isMutating: false
        },
        {
          identifier: 'transfer',
          isPayable: false,
          isMutating: true
        }
      ]
    };

    contract = new WasmContract(
      TEST_CONFIG.WASM_CONTRACT_ADDRESS,
      mockAbi,
      mockApi
    );
  });

  describe('constructor', () => {
    it('should initialize with address, ABI, and API', () => {
      expect(contract).toBeInstanceOf(WasmContract);
      expect((contract as any).address).toBe(TEST_CONFIG.WASM_CONTRACT_ADDRESS);
      expect((contract as any).abi).toBeDefined();
      expect((contract as any).api).toBe(mockApi);
    });
  });

  describe('query', () => {
    it('should query contract function', async () => {
      const result = await contract.query(
        'balanceOf',
        mockKeyring.addFromUri('//Alice'),
        [TEST_CONFIG.ACCOUNT_ADDRESS],
        { gasLimit: 100000 }
      );
      
      expect(result.isOk).toBe(true);
      expect(result.value).toBe('1.0');
      expect(result.gasConsumed).toBe('100000');
    });

    it('should handle query with default options', async () => {
      const result = await contract.query(
        'balanceOf',
        mockKeyring.addFromUri('//Alice'),
        [TEST_CONFIG.ACCOUNT_ADDRESS]
      );
      
      expect(result.isOk).toBe(true);
      expect(result.value).toBe('1.0');
    });
  });

  describe('tx', () => {
    it('should execute contract transaction', async () => {
      const txHash = await contract.tx(
        'transfer',
        mockKeyring.addFromUri('//Alice'),
        [TEST_CONFIG.ACCOUNT_ADDRESS, '1000000000000000000'],
        { gasLimit: 150000 }
      );
      
      expect(txHash).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    });

    it('should execute transaction with default options', async () => {
      const txHash = await contract.tx(
        'transfer',
        mockKeyring.addFromUri('//Alice'),
        [TEST_CONFIG.ACCOUNT_ADDRESS, '1000000000000000000']
      );
      
      expect(txHash).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    });
  });

  describe('estimateGas', () => {
    it('should estimate gas for transaction', async () => {
      const gasEstimate = await contract.estimateGas(
        'transfer',
        mockKeyring.addFromUri('//Alice'),
        [TEST_CONFIG.ACCOUNT_ADDRESS, '1000000000000000000']
      );
      
      expect(gasEstimate).toBe('150000');
    });
  });

  describe('getAddress', () => {
    it('should return contract address', () => {
      const address = contract.getAddress();
      
      expect(address).toBe(TEST_CONFIG.WASM_CONTRACT_ADDRESS);
    });
  });

  describe('getAbi', () => {
    it('should return contract ABI', () => {
      const abi = contract.getAbi();
      
      expect(abi).toBeDefined();
      expect(abi.messages).toHaveLength(2);
    });
  });

  describe('hasMethod', () => {
    it('should return true for existing method', () => {
      const hasMethod = contract.hasMethod('balanceOf');
      
      expect(hasMethod).toBe(true);
    });

    it('should return false for non-existing method', () => {
      const hasMethod = contract.hasMethod('nonExistentMethod');
      
      expect(hasMethod).toBe(false);
    });
  });

  describe('isPayable', () => {
    it('should return false for non-payable method', () => {
      const isPayable = contract.isPayable('balanceOf');
      
      expect(isPayable).toBe(false);
    });
  });

  describe('isMutating', () => {
    it('should return false for view method', () => {
      const isMutating = contract.isMutating('balanceOf');
      
      expect(isMutating).toBe(false);
    });

    it('should return true for mutating method', () => {
      const isMutating = contract.isMutating('transfer');
      
      expect(isMutating).toBe(true);
    });
  });
});