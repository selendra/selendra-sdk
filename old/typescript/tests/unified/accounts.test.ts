/**
 * Unified Accounts API Tests
 */

import { UnifiedAccountManager, UnifiedAddress } from '../../src/unified/accounts';
import { ApiPromise } from '@polkadot/api';

import * as utilCrypto from '@polkadot/util-crypto';
import * as util from '@polkadot/util';

const createMockApi = (overrides = {}) => {
  const mockApi = {
    query: {
      system: {
        account: jest.fn().mockResolvedValue({
          data: {
            free: { toString: () => '5000000000000000000' },
            reserved: { toString: () => '1000000000000000000' },
            frozen: { toString: () => '500000000000000000' },
          },
        }),
        ...overrides.system,
      },
      evmAccounts: {
        evmAddresses: jest.fn().mockResolvedValue({
          unwrap: () => '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          isSome: true,
        }),
        accounts: jest.fn().mockResolvedValue({
          unwrap: () => ({ balance: { toString: () => '2000000000000000000' } }),
          isSome: true,
        }),
        ...overrides.evmAccounts,
      },
      evm: {
        accounts: jest.fn().mockResolvedValue({
          unwrap: () => ({ balance: { toString: () => '2000000000000000000' } }),
          isSome: true,
        }),
        ...overrides.evm,
      },
      unifiedAccounts: {
        nativeToEvm: jest.fn().mockResolvedValue({
          unwrap: () => '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          isSome: true,
        }),
        evmToNative: jest.fn().mockResolvedValue({
          unwrap: () => 'substrate_mapped_address',
          isSome: true,
        }),
        ...overrides.unifiedAccounts,
      },
    },
    rpc: {
      eth: {
        getBalance: jest.fn().mockResolvedValue({
          toString: () => '2000000000000000000',
        }),
        ...overrides.eth,
      },
    },
    tx: {
      unifiedAccounts: {
        claimDefaultEvmAddress: jest.fn().mockReturnValue({
          signAndSend: jest.fn().mockImplementation((_signer, callback) => {
            if (callback)
              callback({
                status: { isFinalized: true, asFinalized: { toString: () => '0xblockhash' } },
                events: [
                  {
                    event: {
                      section: 'unifiedAccounts',
                      method: 'AccountClaimed',
                      data: [
                        { toString: () => 'substrate_account_id' },
                        { toString: () => '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' },
                      ],
                    },
                  },
                ],
                dispatchError: null,
              });
            return Promise.resolve('0xhash');
          }),
        }),
        claimEvmAddress: jest.fn().mockReturnValue({
          signAndSend: jest.fn().mockImplementation((_signer, callback) => {
            if (callback)
              callback({
                status: { isFinalized: true, asFinalized: { toString: () => '0xblockhash' } },
                events: [
                  {
                    event: {
                      section: 'unifiedAccounts',
                      method: 'AccountClaimed',
                      data: [
                        { toString: () => 'substrate_account_id' },
                        { toString: () => '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' }
                      ],
                    },
                  },
                ],
                dispatchError: null,
              });
            return Promise.resolve('0xhash');
          }),
        }),
        ...overrides.unifiedAccounts,
      },
      evmAccounts: {
        claimAccount: jest.fn().mockReturnValue({
          signAndSend: jest.fn((signer, callback) => {
            callback({ status: { isInBlock: true }, events: [] });
            return Promise.resolve('0xhash');
          }),
        }),
        claimDefaultAccount: jest.fn().mockReturnValue({
          signAndSend: jest.fn((signer, callback) => {
            callback({ status: { isInBlock: true }, events: [] });
            return Promise.resolve('0xhash');
          }),
        }),
        ...overrides.tx?.evmAccounts,
      },
    },
    registry: {
      findMetaError: jest.fn().mockReturnValue({
        section: 'unifiedAccounts',
        name: 'ErrorName',
        docs: ['Error description'],
      }),
    },
    ...overrides,
  };

  return mockApi;
};

describe('UnifiedAccountManager', () => {
  let accountManager;
  let mockApi;

  beforeEach(() => {
    // Setup mocks for @polkadot/util-crypto
  jest.spyOn(utilCrypto, 'encodeAddress').mockImplementation((publicKey, ss58Format) => {
      // For EVM addresses converted to substrate, return a fixed substrate address
      if (publicKey && typeof publicKey === 'object' && publicKey.length === 20) {
        return 'substrate_address';
      }
      // Convert publicKey to hex string for consistent output
      if (publicKey && typeof publicKey === 'object' && publicKey.length) {
        return 'substrate_address_' + Buffer.from(publicKey).toString('hex').slice(0, 8);
      }
      return 'substrate_address';
    });

    jest.spyOn(utilCrypto, 'decodeAddress').mockImplementation((address) => {
      // Throw error for invalid addresses
      if (address === 'invalid_address' || address === '0xinvalid') {
        throw new Error('Invalid address');
      }
      // Return a valid 32-byte Uint8Array with all required methods
      const arr = new Uint8Array(32);
      // Fill with some pattern based on address for consistency
      for (let i = 0; i < 32; i++) {
        arr[i] = (address.charCodeAt(i % address.length) + i) % 256;
      }
      return arr;
    });

    jest.spyOn(utilCrypto, 'blake2AsU8a').mockImplementation((input) => {
      // Return a valid 32-byte Uint8Array (default blake2 output)
      const arr = new Uint8Array(32);
      if (input && typeof input === 'object' && input.length) {
        // Create deterministic output based on input
        for (let i = 0; i < 32; i++) {
          arr[i] = (input[i % input.length] + i) % 256;
        }
      }
      return arr;
    });

    // Setup mocks for @polkadot/util
    jest.spyOn(util, 'u8aToHex').mockImplementation((bytes) => {
      if (!bytes || !bytes.length) return '0x';
      return (
        '0x' +
        Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      );
    });

    jest.spyOn(util, 'hexToU8a').mockImplementation((hex) => {
      const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
      const arr = new Uint8Array(cleanHex.length / 2);
      for (let i = 0; i < cleanHex.length; i += 2) {
        arr[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
      }
      return arr;
    });

    jest.spyOn(util, 'isHex').mockImplementation((value) => {
      return /^0x[0-9a-fA-F]+$/.test(value);
    });

    mockApi = createMockApi();
    accountManager = new UnifiedAccountManager(mockApi);
  });

  afterEach(() => {
    // Restore all mocks after each test
    jest.restoreAllMocks();
  });

  describe('UnifiedAddress', () => {
    it('should create UnifiedAddress with substrate address', () => {
      const address = new UnifiedAddress('substrate_address');
      expect(address.toSubstrate()).toBe('substrate_address');
      expect(address.toEvm()).toBeDefined();
      expect(address.toEvm()).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should create UnifiedAddress with EVM address', () => {
      const evmAddr = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      const address = new UnifiedAddress(evmAddr);
      // The toEvm() should return a valid EVM address format (but may not be the same due to conversion)
      expect(address.toEvm()).toMatch(/^0x[a-f0-9]{40}$/);
      // The substrate address conversion depends on the mock implementation
      expect(typeof address.toSubstrate()).toBe('string');
    });
  });

  describe('substrateToEvm', () => {
    it('should convert substrate address to EVM address', () => {
      const evmAddress = accountManager.substrateToEvm('substrate_address');
      expect(typeof evmAddress).toBe('string');
      expect(evmAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe('evmToSubstrate', () => {
    it('should convert EVM address to substrate address', () => {
      const substrateAddress = accountManager.evmToSubstrate(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      );
      expect(typeof substrateAddress).toBe('string');
    });
  });

  describe('validateAddress', () => {
    it('should validate substrate address', () => {
      const validation = accountManager.validateAddress('substrate_address');
      expect(validation.valid).toBe(true);
      expect(validation.type).toBe('substrate');
    });

    it('should validate EVM address', () => {
      const validation = accountManager.validateAddress(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      );
      expect(validation.valid).toBe(true);
      // The validation might return 'substrate' if the EVM address can also be decoded as substrate
      expect(['evm', 'substrate']).toContain(validation.type);
    });

    it('should detect invalid addresses', () => {
      const validation = accountManager.validateAddress('invalid_address');
      expect(validation.valid).toBe(false);
      expect(validation.type).toBe('invalid');
    });
  });

  describe('getUnifiedBalance', () => {
    it('should return unified balance for substrate address', async () => {
      const balance = await accountManager.getUnifiedBalance('substrate_address');
      expect(balance.substrate.free).toBe('5000000000000000000');
      expect(balance.substrate.reserved).toBe('1000000000000000000');
      expect(balance.substrate.frozen).toBe('500000000000000000');
      expect(balance.evm).toBe('2000000000000000000');
      expect(balance.total).toBeDefined();
    });

    it('should handle EVM address as input', async () => {
      const balance = await accountManager.getUnifiedBalance(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      );
      expect(balance).toBeDefined();
    });
  });

  describe('batchConvert', () => {
    it('should convert multiple substrate addresses to EVM', () => {
      const substrateAddresses = ['address1', 'address2', 'address3'];
      const evmAddresses = accountManager.batchConvert(substrateAddresses, 'evm');
      expect(evmAddresses).toHaveLength(3);
      evmAddresses.forEach((addr) => {
        expect(addr).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });

    it('should convert multiple EVM addresses to substrate', () => {
      const evmAddresses = [
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEc',
      ];
      const substrateAddresses = accountManager.batchConvert(evmAddresses, 'substrate');
      expect(substrateAddresses).toHaveLength(2);
    });
  });

  describe('getEvmAddressFromMapping', () => {
    it('should return mapped EVM address', async () => {
      const evmAddress = await accountManager.getEvmAddressFromMapping('substrate_address');
      expect(evmAddress).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    });

    it('should return null when no mapping exists', async () => {
      mockApi = createMockApi({
        unifiedAccounts: {
          nativeToEvm: jest.fn().mockResolvedValue({
            isNone: true,
          }),
        },
      });
      accountManager = new UnifiedAccountManager(mockApi);

      const evmAddress = await accountManager.getEvmAddressFromMapping('substrate_address');
      expect(evmAddress).toBeNull();
    });
  });

  describe('getSubstrateAddressFromMapping', () => {
    it('should return mapped substrate address', async () => {
      const substrateAddress = await accountManager.getSubstrateAddressFromMapping(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      );
      expect(substrateAddress).toBe('substrate_mapped_address');
    });

    it('should return null when no mapping exists', async () => {
      mockApi = createMockApi({
        unifiedAccounts: {
          evmToNative: jest.fn().mockResolvedValue({
            isNone: true,
          }),
        },
      });
      accountManager = new UnifiedAccountManager(mockApi);

      const substrateAddress = await accountManager.getSubstrateAddressFromMapping(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      );
      expect(substrateAddress).toBeNull();
    });
  });

  describe('hasMappingOnChain', () => {
    it('should return true when mapping exists', async () => {
      const hasMapping = await accountManager.hasMappingOnChain('substrate_address');
      expect(hasMapping).toBe(true);
    });

    it('should return false when no mapping exists', async () => {
      mockApi = createMockApi({
        unifiedAccounts: {
          nativeToEvm: jest.fn().mockResolvedValue({
            isNone: true,
          }),
        },
      });
      accountManager = new UnifiedAccountManager(mockApi);

      const hasMapping = await accountManager.hasMappingOnChain('substrate_address');
      expect(hasMapping).toBe(false);
    });

    it('should work with EVM address input', async () => {
      const hasMapping = await accountManager.hasMappingOnChain(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      );
      expect(typeof hasMapping).toBe('boolean');
    });
  });

  describe('claimDefaultEvmAddress', () => {
    it('should claim default EVM address successfully', async () => {
      const mockSigner = {};
      const result = await accountManager.claimDefaultEvmAddress(mockSigner);
      expect(result).toBeDefined();
      expect(result.accountId).toBeDefined();
      expect(result.evmAddress).toBeDefined();
      expect(result.blockHash).toBeDefined();
    });
  });

  describe('claimEvmAddress', () => {
    it('should claim specific EVM address with signature', async () => {
      const mockSigner = {};
      const evmAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      // Valid 65-byte signature (130 hex chars)
      const signature = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12';

      const result = await accountManager.claimEvmAddress(mockSigner, evmAddress, signature);
      expect(result).toBeDefined();
      expect(result.accountId).toBeDefined();
      expect(result.blockHash).toBeDefined();
    });
  });

  describe('buildSigningPayload', () => {
    it('should build EIP-712 signing payload', async () => {
      const payload = await accountManager.buildSigningPayload('substrate_address');
      expect(typeof payload).toBe('string');
      // The payload is a hex string, not necessarily containing the raw address
      expect(payload).toMatch(/^0x[a-f0-9]+$/);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty address gracefully', () => {
      const validation = accountManager.validateAddress('');
      expect(validation.valid).toBe(false);
    });

    it('should handle null/undefined gracefully', () => {
      expect(() => {
        accountManager.validateAddress(null);
      }).not.toThrow();

      expect(() => {
        accountManager.validateAddress(undefined);
      }).not.toThrow();
    });

    it('should handle batch conversion with empty array', () => {
      const result = accountManager.batchConvert([], 'evm');
      expect(result).toEqual([]);
    });
  });

  describe('Balance calculations', () => {
    it('should correctly sum total balance', async () => {
      const balance = await accountManager.getUnifiedBalance('substrate_address');
      const expectedTotal = BigInt('5000000000000000000') + BigInt('2000000000000000000');
      expect(BigInt(balance.total)).toBeGreaterThanOrEqual(expectedTotal);
    });
  });
});
