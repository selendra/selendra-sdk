import { faucetCommand } from '../faucet';

jest.mock('chalk', () => ({
  red: jest.fn((str) => str),
  gray: jest.fn((str) => str),
  cyan: jest.fn((str) => str),
  bold: {
    white: jest.fn((str) => str),
  },
}));

jest.mock('ethers', () => ({
  ethers: {
    isAddress: jest.fn((addr) => addr === '0x742d35Cc6634C0532925a3b844Bc9e7595f3f4A'),
    JsonRpcProvider: jest.fn(() => ({
      getBalance: jest.fn().mockResolvedValue(10000000000000000000n), // 10 ETH
    })),
    formatEther: jest.fn(() => '10.0'),
  },
}));

jest.mock('ora', () => {
  return () => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    info: jest.fn().mockReturnThis(),
  });
});

describe('faucetCommand', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should validate incorrect address', async () => {
    await faucetCommand('invalid-address');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid Ethereum address'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should accept valid address and start faucet request', async () => {
    const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f3f4A';
    
    // Start the command but don't wait for full completion (2s delay)
    const promise = faucetCommand(validAddress);
    
    // Give it a moment to start
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const calls = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
    expect(calls).toContain('Requesting testnet tokens...');
    expect(calls).toContain(validAddress);
    expect(calls).toContain('Address:');
  });
});
