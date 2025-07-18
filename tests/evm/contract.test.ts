import { Contract } from '../../src/evm/contract';
import { ethers } from 'ethers';
import { TEST_CONFIG } from '../setup';

describe('Contract', () => {
  let contract: Contract;
  let mockProvider: any;
  let mockSigner: any;
  let mockContract: any;

  const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)'
  ];

  beforeEach(() => {
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: TEST_CONFIG.CHAIN_ID }),
      call: jest.fn().mockResolvedValue('0x0000000000000000000000000000000000000000000000000de0b6b3a7640000'),
      estimateGas: jest.fn().mockResolvedValue(ethers.BigNumber.from('50000')),
      getGasPrice: jest.fn().mockResolvedValue(ethers.utils.parseUnits('20', 'gwei')),
      getLogs: jest.fn().mockResolvedValue([
        {
          address: TEST_CONFIG.CONTRACT_ADDRESS,
          topics: [
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            '0x000000000000000000000000742d35cc6634c0532925a3b8d42c25f93c68c46f',
            '0x0000000000000000000000001234567890123456789012345678901234567890'
          ],
          data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
          blockNumber: 12345,
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        }
      ])
    };

    mockSigner = {
      getAddress: jest.fn().mockResolvedValue(TEST_CONFIG.ACCOUNT_ADDRESS),
      sendTransaction: jest.fn().mockResolvedValue({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        wait: jest.fn().mockResolvedValue({
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 12346,
          gasUsed: ethers.BigNumber.from('50000'),
          status: 1,
          logs: []
        })
      }),
      connect: jest.fn().mockReturnThis()
    };

    mockContract = {
      balanceOf: jest.fn().mockResolvedValue(ethers.utils.parseEther('1.0')),
      transfer: jest.fn().mockResolvedValue({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        wait: jest.fn().mockResolvedValue({
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 12346,
          gasUsed: ethers.BigNumber.from('50000'),
          status: 1,
          logs: []
        })
      }),
      allowance: jest.fn().mockResolvedValue(ethers.utils.parseEther('0.5')),
      approve: jest.fn().mockResolvedValue({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        wait: jest.fn().mockResolvedValue({
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 12346,
          gasUsed: ethers.BigNumber.from('50000'),
          status: 1,
          logs: []
        })
      }),
      estimateGas: {
        transfer: jest.fn().mockResolvedValue(ethers.BigNumber.from('50000')),
        approve: jest.fn().mockResolvedValue(ethers.BigNumber.from('45000'))
      },
      populateTransaction: {
        transfer: jest.fn().mockResolvedValue({
          to: TEST_CONFIG.CONTRACT_ADDRESS,
          data: '0xa9059cbb0000000000000000000000001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000016345785d8a0000'
        })
      },
      queryFilter: jest.fn().mockResolvedValue([
        {
          address: TEST_CONFIG.CONTRACT_ADDRESS,
          topics: [
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            '0x000000000000000000000000742d35cc6634c0532925a3b8d42c25f93c68c46f',
            '0x0000000000000000000000001234567890123456789012345678901234567890'
          ],
          data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
          blockNumber: 12345,
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          args: [
            TEST_CONFIG.ACCOUNT_ADDRESS,
            '0x1234567890123456789012345678901234567890',
            ethers.utils.parseEther('1.0')
          ]
        }
      ]),
      interface: {
        parseLog: jest.fn().mockReturnValue({
          name: 'Transfer',
          args: [
            TEST_CONFIG.ACCOUNT_ADDRESS,
            '0x1234567890123456789012345678901234567890',
            ethers.utils.parseEther('1.0')
          ]
        })
      }
    };

    contract = new Contract(TEST_CONFIG.CONTRACT_ADDRESS, ERC20_ABI, mockProvider, mockSigner);
    (contract as any).contract = mockContract;
  });

  describe('constructor', () => {
    it('should initialize with address, ABI, and provider', () => {
      expect(contract).toBeInstanceOf(Contract);
      expect((contract as any).address).toBe(TEST_CONFIG.CONTRACT_ADDRESS);
      expect((contract as any).abi).toEqual(ERC20_ABI);
    });
  });

  describe('call', () => {
    it('should call view function and return result', async () => {
      const result = await contract.call('balanceOf', [TEST_CONFIG.ACCOUNT_ADDRESS]);
      
      expect(mockContract.balanceOf).toHaveBeenCalledWith(TEST_CONFIG.ACCOUNT_ADDRESS);
      expect(result).toBe('1.0');
    });

    it('should throw error for non-existent function', async () => {
      await expect(contract.call('nonExistentFunction', [])).rejects.toThrow();
    });
  });

  describe('send', () => {
    it('should send transaction and return hash', async () => {
      const txHash = await contract.send('transfer', [
        '0x1234567890123456789012345678901234567890',
        ethers.utils.parseEther('0.1')
      ]);
      
      expect(mockContract.transfer).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        ethers.utils.parseEther('0.1')
      );
      expect(txHash).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    });

    it('should send transaction with custom gas settings', async () => {
      const txHash = await contract.send('transfer', [
        '0x1234567890123456789012345678901234567890',
        ethers.utils.parseEther('0.1')
      ], {
        gasLimit: 100000,
        gasPrice: ethers.utils.parseUnits('25', 'gwei')
      });
      
      expect(mockContract.transfer).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        ethers.utils.parseEther('0.1'),
        {
          gasLimit: 100000,
          gasPrice: ethers.utils.parseUnits('25', 'gwei')
        }
      );
      expect(txHash).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    });
  });

  describe('estimateGas', () => {
    it('should estimate gas for transaction', async () => {
      const gasEstimate = await contract.estimateGas('transfer', [
        '0x1234567890123456789012345678901234567890',
        ethers.utils.parseEther('0.1')
      ]);
      
      expect(mockContract.estimateGas.transfer).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        ethers.utils.parseEther('0.1')
      );
      expect(gasEstimate).toBe('50000');
    });
  });

  describe('populateTransaction', () => {
    it('should populate transaction data', async () => {
      const tx = await contract.populateTransaction('transfer', [
        '0x1234567890123456789012345678901234567890',
        ethers.utils.parseEther('0.1')
      ]);
      
      expect(mockContract.populateTransaction.transfer).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        ethers.utils.parseEther('0.1')
      );
      expect(tx.to).toBe(TEST_CONFIG.CONTRACT_ADDRESS);
      expect(tx.data).toBeDefined();
    });
  });

  describe('waitForTransaction', () => {
    it('should wait for transaction confirmation', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      const receipt = await contract.waitForTransaction(txHash);
      
      expect(receipt.transactionHash).toBe(txHash);
      expect(receipt.blockNumber).toBe(12346);
      expect(receipt.gasUsed).toBe('50000');
      expect(receipt.status).toBe(1);
    });
  });

  describe('getEvents', () => {
    it('should get events from contract', async () => {
      const events = await contract.getEvents('Transfer', {
        fromBlock: 12340,
        toBlock: 12350
      });
      
      expect(mockContract.queryFilter).toHaveBeenCalled();
      expect(events).toHaveLength(1);
      expect(events[0].address).toBe(TEST_CONFIG.CONTRACT_ADDRESS);
      expect(events[0].args).toHaveLength(3);
    });

    it('should get events with filters', async () => {
      const events = await contract.getEvents('Transfer', {
        fromBlock: 12340,
        toBlock: 12350,
        filters: {
          from: TEST_CONFIG.ACCOUNT_ADDRESS
        }
      });
      
      expect(mockContract.queryFilter).toHaveBeenCalled();
      expect(events).toHaveLength(1);
    });
  });

  describe('on', () => {
    it('should set up event listener', () => {
      const callback = jest.fn();
      
      contract.on('Transfer', callback);
      
      // Since we're mocking, we can't test the actual event emission
      // but we can verify the method doesn't throw
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('should remove event listener', () => {
      const callback = jest.fn();
      
      contract.on('Transfer', callback);
      contract.off('Transfer', callback);
      
      // Since we're mocking, we can't test the actual event emission
      // but we can verify the method doesn't throw
      expect(callback).not.toHaveBeenCalled();
    });
  });
});