/**
 * Staking API Tests
 */

import { StakingClient } from '../../src/substrate/staking';
import { ApiPromise } from '@polkadot/api';

// Mock ApiPromise
const createMockApi = (overrides = {}) => {
  const mockApi = {
    query: {
      staking: {
        currentEra: jest.fn().mockResolvedValue({
          unwrap: () => ({ toNumber: () => 100 }),
          isSome: true,
        }),
        activeEra: jest.fn().mockResolvedValue({
          unwrap: () => ({
            index: { toNumber: () => 100 },
            start: { unwrap: () => ({ toNumber: () => 1000000 }) },
          }),
          isSome: true,
        }),
        validators: jest.fn().mockResolvedValue(['validator1', 'validator2', 'validator3']),
        validatorCount: jest.fn().mockResolvedValue({
          toNumber: () => 50,
        }),
        minValidatorBond: jest.fn().mockResolvedValue({
          toString: () => '1000000000000000000',
        }),
        minNominatorBond: jest.fn().mockResolvedValue({
          toString: () => '100000000000000000',
        }),
        erasRewardPoints: jest.fn().mockResolvedValue({
          total: { toNumber: () => 10000 },
          individual: {
            entries: () => [
              ['validator1', { toNumber: () => 100 }],
              ['validator2', { toNumber: () => 200 }],
            ],
          },
        }),
        ledger: jest.fn().mockResolvedValue({
          unwrap: () => ({
            stash: 'stash_address',
            total: { toString: () => '5000000000000000000' },
            active: { toString: () => '4000000000000000000' },
            unlocking: [],
          }),
          isSome: true,
        }),
        bonded: jest.fn().mockResolvedValue({
          unwrap: () => 'controller_address',
          isSome: true,
        }),
        nominators: jest.fn().mockResolvedValue({
          unwrap: () => ({
            targets: ['validator1', 'validator2'],
            submittedIn: { toNumber: () => 50 },
          }),
          isSome: true,
        }),
        payee: jest.fn().mockResolvedValue({
          unwrap: () => 'Staked',
          isSome: true,
        }),
        ...overrides.staking,
      },
      session: {
        currentIndex: jest.fn().mockResolvedValue({
          toNumber: () => 500,
        }),
        validators: jest.fn().mockResolvedValue(['validator1', 'validator2', 'validator3']),
        ...overrides.session,
      },
    },
    tx: {
      staking: {
        bond: jest.fn().mockReturnValue({
          signAndSend: jest.fn().mockImplementation((_signer, callback) => {
            if (callback) {
              callback({
                status: {
                  isInBlock: true,
                  isFinalized: true,
                  asFinalized: { toString: () => '0xblockhash' },
                },
                events: [],
                dispatchError: null,
              });
            }
            return Promise.resolve('0xhash');
          }),
          send: jest.fn().mockResolvedValue({ toHex: () => '0xhash' }),
        }),
        nominate: jest.fn().mockReturnValue({
          signAndSend: jest.fn().mockImplementation((_signer, callback) => {
            if (callback) {
              callback({
                status: {
                  isInBlock: true,
                  isFinalized: true,
                  asFinalized: { toString: () => '0xblockhash' },
                },
                events: [],
                dispatchError: null,
              });
            }
            return Promise.resolve('0xhash');
          }),
          send: jest.fn().mockResolvedValue({ toHex: () => '0xhash' }),
        }),
        unbond: jest.fn().mockReturnValue({
          signAndSend: jest.fn().mockImplementation((_signer, callback) => {
            if (callback) {
              callback({
                status: {
                  isInBlock: true,
                  isFinalized: true,
                  asFinalized: { toString: () => '0xblockhash' },
                },
                events: [],
                dispatchError: null,
              });
            }
            return Promise.resolve('0xhash');
          }),
          send: jest.fn().mockResolvedValue({ toHex: () => '0xhash' }),
        }),
        ...overrides.tx,
      },
    },
    consts: {
      session: {
        period: { toNumber: () => 1000 },
      },
      staking: {
        electionLookahead: { toNumber: () => 1000 },
        bondingDuration: { toNumber: () => 28 },
        slashRewardFraction: { toNumber: () => 1 },
        ...overrides.consts?.staking,
      },
      ...overrides.consts,
    },
    rpc: {
      chain: {
        getHeader: jest.fn().mockResolvedValue({
          number: { toNumber: () => 450000 },
        }),
        getBlockHash: jest.fn().mockResolvedValue('0xblockhash'),
      },
      ...overrides.rpc,
    },
    ...overrides,
  };

  return mockApi;
};

describe('StakingClient', () => {
  let stakingClient;
  let mockApi;

  beforeEach(() => {
    mockApi = createMockApi();
    stakingClient = new StakingClient(mockApi);
  });

  describe('getCurrentEra', () => {
    it('should return the current era', async () => {
      const era = await stakingClient.getCurrentEra();
      expect(era).toBe(100);
    });

    it('should handle missing era', async () => {
      mockApi = createMockApi({
        staking: {
          currentEra: jest.fn().mockResolvedValue({
            isNone: true,
          }),
        },
      });
      stakingClient = new StakingClient(mockApi);

      const era = await stakingClient.getCurrentEra();
      expect(era).toBe(0);
    });
  });

  describe('getActiveEra', () => {
    it('should return active era info', async () => {
      const activeEra = await stakingClient.getActiveEra();
      expect(activeEra).toEqual({
        index: 100,
        start: 1000000,
      });
    });

    it('should return null when no active era', async () => {
      mockApi = createMockApi({
        staking: {
          activeEra: jest.fn().mockResolvedValue({
            isNone: true,
            unwrap: () => null,
          }),
        },
      });
      stakingClient = new StakingClient(mockApi);

      const activeEra = await stakingClient.getActiveEra();
      expect(activeEra).toBeNull();
    });
  });

  describe('getValidators', () => {
    it('should return list of validators', async () => {
      const validators = await stakingClient.getValidators();
      expect(validators).toHaveLength(3);
      expect(validators).toContain('validator1');
    });
  });

  describe('getValidatorCount', () => {
    it('should return validator count', async () => {
      const count = await stakingClient.getValidatorCount();
      expect(count).toBe(50);
    });
  });

  describe('getMinValidatorBond', () => {
    it('should return minimum validator bond', async () => {
      const minBond = await stakingClient.getMinValidatorBond();
      expect(minBond).toBe('1000000000000000000');
    });
  });

  describe('getMinNominatorBond', () => {
    it('should return minimum nominator bond', async () => {
      const minBond = await stakingClient.getMinNominatorBond();
      expect(minBond).toBe('100000000000000000');
    });
  });

  describe('getEraRewardPoints', () => {
    it('should return era reward points', async () => {
      const points = await stakingClient.getEraRewardPoints(100);
      expect(points.total).toBe(10000);
      expect(points.individual).toBeInstanceOf(Map);
      expect(points.individual.size).toBe(2);
      expect(points.individual.get('validator1')).toBe(100);
      expect(points.individual.get('validator2')).toBe(200);
    });
  });

  describe('getStakingInfo', () => {
    it('should return staking info for an account', async () => {
      const info = await stakingClient.getStakingInfo('test_address');
      expect(info).toBeDefined();
      expect(info?.totalStake).toBe('5000000000000000000');
      expect(info?.activeStake).toBe('4000000000000000000');
    });

    it('should return null for non-staking account', async () => {
      mockApi = createMockApi({
        staking: {
          ledger: jest.fn().mockResolvedValue({
            isNone: true,
          }),
        },
      });
      stakingClient = new StakingClient(mockApi);

      const info = await stakingClient.getStakingInfo('test_address');
      expect(info).toBeNull();
    });
  });

  describe('bond', () => {
    it('should bond tokens successfully', async () => {
      const mockSigner = {};
      const result = await stakingClient.bond(mockSigner, '1000000000000000000', 'Staked');
      expect(result.hash).toBe('0xhash');
    });

    it('should handle transaction errors', async () => {
      mockApi = createMockApi({
        tx: {
          staking: {
            bond: jest.fn().mockReturnValue({
              signAndSend: jest.fn().mockImplementation(() => {
                throw new Error('Transaction failed');
              }),
              send: jest.fn().mockImplementation(() => {
                throw new Error('Transaction failed');
              }),
            }),
          },
        },
      });
      stakingClient = new StakingClient(mockApi);

      // Test with null signer to trigger send() path
      await expect(stakingClient.bond(null, '1000000000000000000', 'Staked')).rejects.toThrow(
        'Transaction failed',
      );
    });
  });

  describe('nominate', () => {
    it('should nominate validators successfully', async () => {
      const mockSigner = {};
      const validators = ['validator1', 'validator2'];
      const result = await stakingClient.nominate(mockSigner, validators);
      expect(result.hash).toBe('0xhash');
    });
  });

  describe('unbond', () => {
    it('should unbond tokens successfully', async () => {
      const mockSigner = {};
      const result = await stakingClient.unbond(mockSigner, '500000000000000000');
      expect(result.hash).toBe('0xhash');
    });
  });

  describe('Codec helper functions', () => {
    it('should handle Option types correctly', async () => {
      // Test with None option
      mockApi = createMockApi({
        staking: {
          currentEra: jest.fn().mockResolvedValue({
            isNone: true,
            isSome: false,
          }),
        },
      });
      stakingClient = new StakingClient(mockApi);
      const era = await stakingClient.getCurrentEra();
      expect(era).toBe(0);

      // Test with Some option
      mockApi = createMockApi({
        staking: {
          currentEra: jest.fn().mockResolvedValue({
            isNone: false,
            isSome: true,
            unwrap: () => ({ toNumber: () => 42 }),
          }),
        },
      });
      stakingClient = new StakingClient(mockApi);
      const era2 = await stakingClient.getCurrentEra();
      expect(era2).toBe(42);
    });
  });
});
