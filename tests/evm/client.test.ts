import { EVMClient } from '../../src/evm/client';
import { ethers } from 'ethers';
import { TEST_CONFIG } from '../setup';

describe('EVMClient', () => {
  let client: EVMClient;
  let mockProvider: any;
  let mockSigner: any;

  beforeEach(() => {
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: TEST_CONFIG.CHAIN_ID }),
      getBlockNumber: jest.fn().mockResolvedValue(12345),
      getBalance: jest.fn().mockResolvedValue(ethers.utils.parseEther('1.0')),
      getTransactionCount: jest.fn().mockResolvedValue(42),
      getGasPrice: jest.fn().mockResolvedValue(ethers.utils.parseUnits('20', 'gwei')),
      estimateGas: jest.fn().mockResolvedValue(ethers.BigNumber.from('21000')),
      sendTransaction: jest.fn().mockResolvedValue({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        wait: jest.fn().mockResolvedValue({
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 12346,
          gasUsed: ethers.BigNumber.from('21000'),
          status: 1
        })
      }),
      call: jest.fn().mockResolvedValue('0x0000000000000000000000000000000000000000000000000de0b6b3a7640000')
    };

    mockSigner = {
      getAddress: jest.fn().mockResolvedValue(TEST_CONFIG.ACCOUNT_ADDRESS),
      signMessage: jest.fn().mockResolvedValue('0xsignature'),
      sendTransaction: jest.fn().mockResolvedValue({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        wait: jest.fn().mockResolvedValue({
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 12346,
          gasUsed: ethers.BigNumber.from('21000'),
          status: 1
        })
      }),
      connect: jest.fn().mockReturnThis()
    };

    client = new EVMClient(TEST_CONFIG.RPC_URL, TEST_CONFIG.PRIVATE_KEY);
    (client as any).provider = mockProvider;
    (client as any).signer = mockSigner;
  });

  describe('constructor', () => {
    it('should initialize with RPC URL and private key', () => {
      expect(client).toBeInstanceOf(EVMClient);
      expect((client as any).provider).toBeDefined();
      expect((client as any).signer).toBeDefined();
    });

    it('should throw error with invalid private key', () => {
      expect(() => {
        new EVMClient(TEST_CONFIG.RPC_URL, 'invalid-key');
      }).toThrow();
    });
  });

  describe('getBalance', () => {
    it('should return balance for address', async () => {
      const balance = await client.getBalance(TEST_CONFIG.ACCOUNT_ADDRESS);
      
      expect(mockProvider.getBalance).toHaveBeenCalledWith(TEST_CONFIG.ACCOUNT_ADDRESS);
      expect(balance).toBe('1.0');
    });

    it('should return balance for current signer if no address provided', async () => {
      const balance = await client.getBalance();
      
      expect(mockSigner.getAddress).toHaveBeenCalled();
      expect(mockProvider.getBalance).toHaveBeenCalledWith(TEST_CONFIG.ACCOUNT_ADDRESS);
      expect(balance).toBe('1.0');
    });
  });

  describe('getTransactionCount', () => {
    it('should return transaction count for address', async () => {
      const count = await client.getTransactionCount(TEST_CONFIG.ACCOUNT_ADDRESS);
      
      expect(mockProvider.getTransactionCount).toHaveBeenCalledWith(TEST_CONFIG.ACCOUNT_ADDRESS);
      expect(count).toBe(42);
    });
  });

  describe('getBlockNumber', () => {
    it('should return current block number', async () => {
      const blockNumber = await client.getBlockNumber();
      
      expect(mockProvider.getBlockNumber).toHaveBeenCalled();
      expect(blockNumber).toBe(12345);
    });
  });

  describe('getGasPrice', () => {
    it('should return current gas price', async () => {
      const gasPrice = await client.getGasPrice();
      
      expect(mockProvider.getGasPrice).toHaveBeenCalled();
      expect(gasPrice).toBe('20');
    });
  });

  describe('estimateGas', () => {
    it('should estimate gas for transaction', async () => {
      const transaction = {
        to: TEST_CONFIG.CONTRACT_ADDRESS,
        data: '0x',
        value: ethers.utils.parseEther('0.1')
      };

      const gasEstimate = await client.estimateGas(transaction);
      
      expect(mockProvider.estimateGas).toHaveBeenCalledWith(transaction);
      expect(gasEstimate).toBe('21000');
    });
  });

  describe('sendTransaction', () => {
    it('should send transaction and return hash', async () => {
      const transaction = {
        to: TEST_CONFIG.CONTRACT_ADDRESS,
        value: ethers.utils.parseEther('0.1'),
        gasLimit: 21000,
        gasPrice: ethers.utils.parseUnits('20', 'gwei')
      };

      const txHash = await client.sendTransaction(transaction);
      
      expect(mockSigner.sendTransaction).toHaveBeenCalledWith(transaction);
      expect(txHash).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    });

    it('should throw error if transaction fails', async () => {
      const transaction = {
        to: TEST_CONFIG.CONTRACT_ADDRESS,
        value: ethers.utils.parseEther('0.1')
      };

      mockSigner.sendTransaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(client.sendTransaction(transaction)).rejects.toThrow('Transaction failed');
    });
  });

  describe('waitForTransaction', () => {
    it('should wait for transaction confirmation', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      const receipt = await client.waitForTransaction(txHash);
      
      expect(receipt.transactionHash).toBe(txHash);
      expect(receipt.blockNumber).toBe(12346);
      expect(receipt.gasUsed).toBe('21000');
      expect(receipt.status).toBe(1);
    });
  });

  describe('call', () => {
    it('should make contract call', async () => {
      const transaction = {
        to: TEST_CONFIG.CONTRACT_ADDRESS,
        data: '0x70a08231000000000000000000000000742d35cc6634c0532925a3b8d42c25f93c68c46f'
      };

      const result = await client.call(transaction);
      
      expect(mockProvider.call).toHaveBeenCalledWith(transaction);
      expect(result).toBe('0x0000000000000000000000000000000000000000000000000de0b6b3a7640000');
    });
  });

  describe('signMessage', () => {
    it('should sign message with signer', async () => {
      const message = 'Hello, Selendra!';
      
      const signature = await client.signMessage(message);
      
      expect(mockSigner.signMessage).toHaveBeenCalledWith(message);
      expect(signature).toBe('0xsignature');
    });
  });

  describe('getAddress', () => {
    it('should return signer address', async () => {
      const address = await client.getAddress();
      
      expect(mockSigner.getAddress).toHaveBeenCalled();
      expect(address).toBe(TEST_CONFIG.ACCOUNT_ADDRESS);
    });
  });
});