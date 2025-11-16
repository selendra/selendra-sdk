/**
 * Elections Pallet API Tests
 */

import { ElectionsClient } from '../../src/substrate/elections';
import { ApiPromise } from '@polkadot/api';

const createMockApi = (overrides: any = {}) => {
  const mockApi = {
    query: {
      elections: {
        committeeSize: jest.fn().mockResolvedValue({
          reserved: { toNumber: () => 4 },
          nonReserved: { toNumber: () => 8 },
          nonReservedFinality: { toNumber: () => 6 },
        }),
        nextEraReservedValidators: jest.fn().mockResolvedValue(['reserved1']),
        nextEraNonReservedValidators: jest.fn().mockResolvedValue(['nonreserved1', 'nonreserved2']),
        sessionValidatorBlockCount: jest.fn().mockResolvedValue({
          toNumber: () => 10,
        }),
        underperformedValidatorSessionCount: jest.fn().mockResolvedValue({
          toNumber: () => 0,
        }),
        currentEraValidators: jest.fn().mockResolvedValue({
          reserved: [{ toString: () => 'validator1' }],
          nonReserved: [{ toString: () => 'validator2' }, { toString: () => 'validator3' }],
        }),
        openness: jest.fn().mockResolvedValue({
          isPermissioned: true,
        }),
        ...overrides.elections,
      },
      staking: {
        currentEra: jest.fn().mockResolvedValue({
          unwrap: () => ({ toNumber: () => 100 }),
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
    consts: {
      elections: {
        electionOpenness: {
          toString: () => 'Permissioned',
        },
        ...overrides.consts?.elections,
      },
    },
    tx: {
      elections: {
        changeValidators: jest.fn().mockReturnValue({
          signAndSend: jest.fn().mockImplementation((_signer: any, callback: any) => {
            if (callback) {
              callback({
                status: { isFinalized: true, asFinalized: { toString: () => '0xblockhash' } },
                events: [],
                dispatchError: null,
              });
            }
            return Promise.resolve('0xhash');
          }),
        }),
        setElectionsOpenness: jest.fn().mockReturnValue({
          signAndSend: jest.fn().mockImplementation((_signer: any, callback: any) => {
            if (callback) {
              callback({
                status: { isFinalized: true, asFinalized: { toString: () => '0xblockhash' } },
                dispatchError: null,
              });
            }
            return Promise.resolve('0xhash');
          }),
        }),
        ...overrides.tx?.elections,
      },
    },
    ...overrides,
  } as unknown as ApiPromise;

  return mockApi;
};

describe('ElectionsClient', () => {
  let electionsClient: ElectionsClient;
  let mockApi: ApiPromise;

  beforeEach(() => {
    mockApi = createMockApi();
    electionsClient = new ElectionsClient(mockApi);
  });

  describe('getCommitteeSeats', () => {
    it('should return committee seat configuration', async () => {
      const seats = await electionsClient.getCommitteeSeats();
      expect(seats).toEqual({
        reserved: 4,
        nonReserved: 8,
        nonReservedFinality: 6,
      });
    });
  });

  describe('getCurrentEra', () => {
    it('should return current era', async () => {
      const era = await electionsClient.getCurrentEra();
      expect(era).toBe(100);
    });

    it('should return 0 when no current era', async () => {
      mockApi = createMockApi({
        staking: {
          currentEra: jest.fn().mockResolvedValue({
            isNone: true,
          }),
        },
      });
      electionsClient = new ElectionsClient(mockApi);

      const era = await electionsClient.getCurrentEra();
      expect(era).toBe(0);
    });
  });

  describe('getCurrentEraValidators', () => {
    it('should return current era validators', async () => {
      const validators = await electionsClient.getCurrentEraValidators();
      expect(validators.reserved).toBeDefined();
      expect(validators.nonReserved).toBeDefined();
      expect(validators.reserved).toContain('validator1');
    });
  });

  describe('getNextEraValidators', () => {
    it('should return next era validator sets', async () => {
      const validators = await electionsClient.getNextEraValidators();
      expect(validators.reserved).toHaveLength(1);
      expect(validators.nonReserved).toHaveLength(2);
      expect(validators.reserved).toContain('reserved1');
      expect(validators.nonReserved).toContain('nonreserved1');
    });
  });

  describe('getElectionOpenness', () => {
    it('should return election openness mode', async () => {
      const openness = await electionsClient.getElectionOpenness();
      expect(openness).toBe('Permissioned');
    });
  });

  describe('getValidatorStats', () => {
    it('should return validator statistics', async () => {
      const stats = await electionsClient.getValidatorStats();
      expect(stats.total).toBe(3);
      expect(stats.reserved).toBe(1);
      expect(stats.nonReserved).toBe(2);
    });
  });

  // getValidatorPerformance is in AlephClient, not ElectionsClient

  describe('changeValidators', () => {
    it('should change validators successfully', async () => {
      const mockSigner = {} as any;
      const reserved = ['reserved1'];
      const nonReserved = ['nonreserved1', 'nonreserved2'];
      const committee = ['committee1', 'committee2'];

      const result = await electionsClient.changeValidators(
        mockSigner,
        reserved,
        nonReserved,
        committee,
      );
      expect(result.blockHash).toBe('0xblockhash');
      expect(result.success).toBe(true);
    });

    it('should handle transaction errors', async () => {
      mockApi = createMockApi({
        tx: {
          elections: {
            changeValidators: jest.fn().mockReturnValue({
              signAndSend: jest.fn(() => {
                throw new Error('Transaction failed');
              }),
            }),
          },
        },
      });
      electionsClient = new ElectionsClient(mockApi);

      const mockSigner = {} as any;
      await expect(electionsClient.changeValidators(mockSigner, [], [], [])).rejects.toThrow(
        'Transaction failed',
      );
    });
  });

  describe('setElectionsOpenness', () => {
    it('should set elections openness successfully', async () => {
      const mockSigner = {} as any;
      const result = await electionsClient.setElectionsOpenness(mockSigner, 'Permissionless');
      expect(result.blockHash).toBe('0xblockhash');
      expect(result.success).toBe(true);
    });
  });

  // isValidatorUnderperforming is in AlephClient, not ElectionsClient

  describe('Option handling', () => {
    it('should handle Option.None for current era', async () => {
      mockApi = createMockApi({
        staking: {
          currentEra: jest.fn().mockResolvedValue({
            isNone: true,
            isSome: false,
          }),
        },
      });
      electionsClient = new ElectionsClient(mockApi);

      const era = await electionsClient.getCurrentEra();
      expect(era).toBe(0);
    });

    it('should handle Option.Some for current era', async () => {
      mockApi = createMockApi({
        staking: {
          currentEra: jest.fn().mockResolvedValue({
            isNone: false,
            isSome: true,
            unwrap: () => ({ toNumber: () => 42 }),
          }),
        },
      });
      electionsClient = new ElectionsClient(mockApi);

      const era = await electionsClient.getCurrentEra();
      expect(era).toBe(42);
    });
  });
});
