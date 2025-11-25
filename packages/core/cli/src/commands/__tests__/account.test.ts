import { accountCommand } from '../account';
import { ethers } from 'ethers';

jest.mock('chalk', () => ({
  red: jest.fn((str) => str),
  gray: jest.fn((str) => str),
  yellow: jest.fn((str) => str),
  cyan: jest.fn((str) => str),
  green: jest.fn((str) => str),
  white: jest.fn((str) => str),
  bold: {
    white: jest.fn((str) => str),
    yellow: jest.fn((str) => str),
  },
}));

describe('accountCommand', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a new account with valid address and private key', async () => {
    await accountCommand('new');

    // Check if console.log was called
    expect(consoleLogSpy).toHaveBeenCalled();

    // Capture calls
    const calls = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
    
    // Verify output contains address, private key, and mnemonic
    expect(calls).toContain('Address (EVM):');
    expect(calls).toContain('Private Key:');
    expect(calls).toContain('Mnemonic (Seed Phrase):');
    expect(calls).toContain('0x'); // Address format
  });

  it('should show placeholder for list command', async () => {
    await accountCommand('list');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Account keystore coming soon!'));
  });

  it('should show placeholder for import command', async () => {
    await accountCommand('import');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Account import coming soon!'));
  });
});
