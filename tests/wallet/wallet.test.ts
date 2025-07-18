import { WalletManager } from '../../src/wallet/wallet';
import { TEST_CONFIG, generateRandomAddress } from '../setup';

// Mock wallet providers
const mockMetaMaskProvider = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  selectedAddress: TEST_CONFIG.ACCOUNT_ADDRESS,
  networkVersion: '1337',
  chainId: '0x539'
};

// Mock WalletConnect provider (available for future WalletConnect integration tests)
// const mockWalletConnectProvider = {
//   request: jest.fn(),
//   on: jest.fn(),
//   removeListener: jest.fn(),
//   accounts: [TEST_CONFIG.ACCOUNT_ADDRESS],
//   chainId: 1337,
//   connect: jest.fn().mockResolvedValue(undefined),
//   disconnect: jest.fn().mockResolvedValue(undefined)
// };

// Mock window.ethereum
Object.defineProperty(window, 'ethereum', {
  value: mockMetaMaskProvider,
  writable: true
});

describe('WalletManager', () => {
  let walletManager: WalletManager;

  beforeEach(() => {
    walletManager = new WalletManager();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize WalletManager', () => {
      expect(walletManager).toBeInstanceOf(WalletManager);
      expect(walletManager.isConnected()).toBe(false);
    });
  });

  describe('detectWallets', () => {
    it('should detect MetaMask wallet', () => {
      const wallets = walletManager.detectWallets();
      
      expect(wallets).toContain('MetaMask');
      expect(wallets.length).toBeGreaterThan(0);
    });

    it('should return empty array when no wallets detected', () => {
      // Temporarily remove window.ethereum
      const originalEthereum = window.ethereum;
      delete (window as any).ethereum;
      
      const wallets = walletManager.detectWallets();
      
      expect(wallets).toEqual([]);
      
      // Restore window.ethereum
      (window as any).ethereum = originalEthereum;
    });
  });

  describe('connect', () => {
    it('should connect to MetaMask wallet', async () => {
      mockMetaMaskProvider.request.mockResolvedValue([TEST_CONFIG.ACCOUNT_ADDRESS]);
      
      const address = await walletManager.connect('MetaMask');
      
      expect(mockMetaMaskProvider.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts'
      });
      expect(address).toBe(TEST_CONFIG.ACCOUNT_ADDRESS);
      expect(walletManager.isConnected()).toBe(true);
      expect(walletManager.getCurrentWallet()).toBe('MetaMask');
    });

    it('should handle connection rejection', async () => {
      mockMetaMaskProvider.request.mockRejectedValue(new Error('User rejected'));
      
      await expect(walletManager.connect('MetaMask')).rejects.toThrow('User rejected');
      expect(walletManager.isConnected()).toBe(false);
    });

    it('should throw error for unsupported wallet', async () => {
      await expect(walletManager.connect('UnsupportedWallet')).rejects.toThrow(
        'Wallet UnsupportedWallet is not supported'
      );
    });
  });

  describe('disconnect', () => {
    it('should disconnect from current wallet', async () => {
      // First connect
      mockMetaMaskProvider.request.mockResolvedValue([TEST_CONFIG.ACCOUNT_ADDRESS]);
      await walletManager.connect('MetaMask');
      
      // Then disconnect
      await walletManager.disconnect();
      
      expect(walletManager.isConnected()).toBe(false);
      expect(walletManager.getCurrentWallet()).toBeNull();
      expect(walletManager.getCurrentAccount()).toBeNull();
    });
  });

  describe('getAccounts', () => {
    it('should return accounts from connected wallet', async () => {
      const accounts = [TEST_CONFIG.ACCOUNT_ADDRESS, generateRandomAddress()];
      mockMetaMaskProvider.request.mockResolvedValue(accounts);
      
      await walletManager.connect('MetaMask');
      const result = await walletManager.getAccounts();
      
      expect(mockMetaMaskProvider.request).toHaveBeenCalledWith({
        method: 'eth_accounts'
      });
      expect(result).toEqual(accounts);
    });

    it('should throw error when not connected', async () => {
      await expect(walletManager.getAccounts()).rejects.toThrow(
        'No wallet connected'
      );
    });
  });

  describe('getBalance', () => {
    it('should return balance for connected account', async () => {
      mockMetaMaskProvider.request
        .mockResolvedValueOnce([TEST_CONFIG.ACCOUNT_ADDRESS])
        .mockResolvedValueOnce('0xde0b6b3a7640000'); // 1 ETH in wei
      
      await walletManager.connect('MetaMask');
      const balance = await walletManager.getBalance();
      
      expect(mockMetaMaskProvider.request).toHaveBeenCalledWith({
        method: 'eth_getBalance',
        params: [TEST_CONFIG.ACCOUNT_ADDRESS, 'latest']
      });
      expect(balance).toBe('1.0');
    });

    it('should return balance for specific address', async () => {
      const address = generateRandomAddress();
      mockMetaMaskProvider.request
        .mockResolvedValueOnce([TEST_CONFIG.ACCOUNT_ADDRESS])
        .mockResolvedValueOnce('0x1bc16d674ec80000'); // 0.5 ETH in wei
      
      await walletManager.connect('MetaMask');
      const balance = await walletManager.getBalance(address);
      
      expect(mockMetaMaskProvider.request).toHaveBeenCalledWith({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      expect(balance).toBe('0.5');
    });
  });

  describe('sendTransaction', () => {
    it('should send transaction through connected wallet', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      mockMetaMaskProvider.request
        .mockResolvedValueOnce([TEST_CONFIG.ACCOUNT_ADDRESS])
        .mockResolvedValueOnce(txHash);
      
      await walletManager.connect('MetaMask');
      
      const transaction = {
        to: generateRandomAddress(),
        value: '0xde0b6b3a7640000', // 1 ETH
        gasLimit: '0x5208' // 21000
      };
      
      const result = await walletManager.sendTransaction(transaction);
      
      expect(mockMetaMaskProvider.request).toHaveBeenCalledWith({
        method: 'eth_sendTransaction',
        params: [{
          from: TEST_CONFIG.ACCOUNT_ADDRESS,
          ...transaction
        }]
      });
      expect(result).toBe(txHash);
    });

    it('should throw error when not connected', async () => {
      const transaction = {
        to: generateRandomAddress(),
        value: '0xde0b6b3a7640000'
      };
      
      await expect(walletManager.sendTransaction(transaction)).rejects.toThrow(
        'No wallet connected'
      );
    });
  });

  describe('signMessage', () => {
    it('should sign message with connected wallet', async () => {
      const message = 'Hello, Selendra!';
      const signature = '0xsignature';
      mockMetaMaskProvider.request
        .mockResolvedValueOnce([TEST_CONFIG.ACCOUNT_ADDRESS])
        .mockResolvedValueOnce(signature);
      
      await walletManager.connect('MetaMask');
      const result = await walletManager.signMessage(message);
      
      expect(mockMetaMaskProvider.request).toHaveBeenCalledWith({
        method: 'personal_sign',
        params: [message, TEST_CONFIG.ACCOUNT_ADDRESS]
      });
      expect(result).toBe(signature);
    });

    it('should throw error when not connected', async () => {
      await expect(walletManager.signMessage('test')).rejects.toThrow(
        'No wallet connected'
      );
    });
  });

  describe('switchNetwork', () => {
    it('should switch to different network', async () => {
      mockMetaMaskProvider.request
        .mockResolvedValueOnce([TEST_CONFIG.ACCOUNT_ADDRESS])
        .mockResolvedValueOnce(undefined);
      
      await walletManager.connect('MetaMask');
      await walletManager.switchNetwork('0x1'); // Ethereum mainnet
      
      expect(mockMetaMaskProvider.request).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }]
      });
    });

    it('should add network if not found', async () => {
      mockMetaMaskProvider.request
        .mockResolvedValueOnce([TEST_CONFIG.ACCOUNT_ADDRESS])
        .mockRejectedValueOnce({ code: 4902 }) // Unrecognized chain ID
        .mockResolvedValueOnce(undefined);
      
      await walletManager.connect('MetaMask');
      await walletManager.switchNetwork('0x7a1', {
        chainName: 'Selendra Testnet',
        nativeCurrency: {
          name: 'Selendra',
          symbol: 'SEL',
          decimals: 18
        },
        rpcUrls: ['https://rpc-testnet.selendra.org'],
        blockExplorerUrls: ['https://explorer-testnet.selendra.org']
      });
      
      expect(mockMetaMaskProvider.request).toHaveBeenCalledWith({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x7a1',
          chainName: 'Selendra Testnet',
          nativeCurrency: {
            name: 'Selendra',
            symbol: 'SEL',
            decimals: 18
          },
          rpcUrls: ['https://rpc-testnet.selendra.org'],
          blockExplorerUrls: ['https://explorer-testnet.selendra.org']
        }]
      });
    });
  });

  describe('getChainId', () => {
    it('should return current chain ID', async () => {
      mockMetaMaskProvider.request
        .mockResolvedValueOnce([TEST_CONFIG.ACCOUNT_ADDRESS])
        .mockResolvedValueOnce('0x1');
      
      await walletManager.connect('MetaMask');
      const chainId = await walletManager.getChainId();
      
      expect(mockMetaMaskProvider.request).toHaveBeenCalledWith({
        method: 'eth_chainId'
      });
      expect(chainId).toBe('0x1');
    });
  });

  describe('event handlers', () => {
    it('should handle account change events', async () => {
      mockMetaMaskProvider.request.mockResolvedValue([TEST_CONFIG.ACCOUNT_ADDRESS]);
      
      await walletManager.connect('MetaMask');
      
      const newAccount = generateRandomAddress();
      const onAccountChange = jest.fn();
      walletManager.on('accountChange', onAccountChange);
      
      // Simulate account change
      const accountChangeHandler = mockMetaMaskProvider.on.mock.calls.find(
        call => call[0] === 'accountsChanged'
      )[1];
      
      accountChangeHandler([newAccount]);
      
      expect(onAccountChange).toHaveBeenCalledWith(newAccount);
    });

    it('should handle chain change events', async () => {
      mockMetaMaskProvider.request.mockResolvedValue([TEST_CONFIG.ACCOUNT_ADDRESS]);
      
      await walletManager.connect('MetaMask');
      
      const onChainChange = jest.fn();
      walletManager.on('chainChange', onChainChange);
      
      // Simulate chain change
      const chainChangeHandler = mockMetaMaskProvider.on.mock.calls.find(
        call => call[0] === 'chainChanged'
      )[1];
      
      chainChangeHandler('0x1');
      
      expect(onChainChange).toHaveBeenCalledWith('0x1');
    });

    it('should handle disconnect events', async () => {
      mockMetaMaskProvider.request.mockResolvedValue([TEST_CONFIG.ACCOUNT_ADDRESS]);
      
      await walletManager.connect('MetaMask');
      
      const onDisconnect = jest.fn();
      walletManager.on('disconnect', onDisconnect);
      
      // Simulate disconnect
      const disconnectHandler = mockMetaMaskProvider.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )[1];
      
      disconnectHandler();
      
      expect(onDisconnect).toHaveBeenCalled();
      expect(walletManager.isConnected()).toBe(false);
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all event listeners', async () => {
      mockMetaMaskProvider.request.mockResolvedValue([TEST_CONFIG.ACCOUNT_ADDRESS]);
      
      await walletManager.connect('MetaMask');
      
      const onAccountChange = jest.fn();
      const onChainChange = jest.fn();
      
      walletManager.on('accountChange', onAccountChange);
      walletManager.on('chainChange', onChainChange);
      
      walletManager.removeAllListeners();
      
      expect(mockMetaMaskProvider.removeListener).toHaveBeenCalledTimes(3); // accountsChanged, chainChanged, disconnect
    });
  });
});