/**
 * Aleph Consensus API Tests
 */

import { AlephClient } from '../../src/substrate/aleph';
import { ApiPromise } from '@polkadot/api';

const createMockApi = (overrides = {}) => {
  const mockApi = {
    query: {
      system: {
        number: jest.fn().mockResolvedValue({
          toNumber: () => 450450,
        }),
        ...overrides.system,
      },
      session: {
        currentIndex: jest.fn().mockResolvedValue({
          toNumber: () => 500,
        }),
        validators: jest.fn().mockResolvedValue(['validator1', 'validator2', 'validator3']),
        ...overrides.session,
      },
      aleph: {
        sessionPeriod: jest.fn().mockResolvedValue({
          toNumber: () => 900,
        }),
        authorities: jest.fn().mockResolvedValue(['validator1', 'validator2', 'validator3']),
        emergencyFinalizer: jest.fn().mockResolvedValue({
          unwrap: () => 'emergency_finalizer_address',
          isSome: true,
        }),
        queuedEmergencyFinalizer: jest.fn().mockResolvedValue({
          isNone: true,
        }),
        scheduledFinalityVersionChange: jest.fn().mockResolvedValue({
          isNone: true,
        }),
        finalityScheduledVersionChange: jest.fn().mockResolvedValue({
          isNone: true,
        }),
        sessionValidatorBlockCount: {
          entries: jest.fn().mockResolvedValue([
            [{ args: [500, 'validator1'] }, { toNumber: () => 10 }],
            [{ args: [500, 'validator2'] }, { toNumber: () => 8 }],
            [{ args: [500, 'validator3'] }, { toNumber: () => 12 }],
          ]),
        },
        finalityVersion: jest.fn().mockResolvedValue({ toNumber: () => 1 }),
        bannedMembers: jest.fn().mockResolvedValue([]),
        bannedValidators: jest.fn().mockResolvedValue({
          isNone: true,
        }),
        sessionValidatorBlockCount: jest.fn().mockResolvedValue({
          toNumber: () => 10,
        }),
        underperformedValidatorSessionCount: jest.fn().mockResolvedValue({
          toNumber: () => 2,
        }),
        ...overrides.aleph,
      },
      authorship: {
        author: jest.fn().mockResolvedValue('validator1'),
        ...overrides.authorship,
      },
    },
    tx: {
      aleph: {
        setEmergencyFinalizer: jest.fn().mockReturnValue({
          signAndSend: jest.fn().mockImplementation((_signer, callback) => {
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
        scheduleFinalityVersionChange: jest.fn().mockReturnValue({
          signAndSend: jest.fn().mockImplementation((_signer, callback) => {
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
        ...overrides.tx?.aleph,
      },
    },
    consts: {
      session: {
        period: { toNumber: () => 900 },
        ...overrides.consts?.session,
      },
      aleph: {
        sessionPeriod: { toNumber: () => 600 },
        finalityDelay: { toNumber: () => 2 },
        ...overrides.consts?.aleph,
      },
      ...overrides.consts,
    },
    ...overrides,
  };

  return mockApi;
};

describe('AlephClient', () => {
  let alephClient;
  let mockApi;

  beforeEach(() => {
    mockApi = createMockApi();
    alephClient = new AlephClient(mockApi);
  });

  describe('getCurrentSession', () => {
    it('should return the current session index', async () => {
      const session = await alephClient.getCurrentSession();
      expect(session).toBe(500);
    });
  });

  describe('getSessionLength', () => {
    it('should return the session length in blocks', async () => {
      const length = await alephClient.getSessionLength();
      expect(length).toBe(900);
    });
  });

  describe('getSessionProgress', () => {
    it('should calculate session progress correctly', async () => {
      // Mock block number
      mockApi = createMockApi({
        system: {
          number: jest.fn().mockResolvedValue({
            toNumber: () => 450450, // 500 * 900 + 450
          }),
        },
      });
      alephClient = new AlephClient(mockApi);

      const progress = await alephClient.getSessionProgress();
      expect(progress.current).toBe(450);
      expect(progress.total).toBe(900);
      expect(progress.remaining).toBe(450);
    });
  });

  describe('getActiveValidators', () => {
    it('should return list of active validators', async () => {
      const validators = await alephClient.getActiveValidators();
      expect(validators).toHaveLength(3);
      expect(validators).toContain('validator1');
    });
  });

  describe('getSessionCommittee', () => {
    it('should return session committee info', async () => {
      const committee = await alephClient.getSessionCommittee(500);
      expect(committee.validators).toHaveLength(3);
      expect(committee.size).toBe(3);
      expect(committee.validators).toContain('validator1');
    });
  });

  describe('getEmergencyFinalizer', () => {
    it('should return emergency finalizer address', async () => {
      const finalizer = await alephClient.getEmergencyFinalizer();
      expect(finalizer).toBe('emergency_finalizer_address');
    });

    it('should return null when no emergency finalizer', async () => {
      mockApi = createMockApi({
        aleph: {
          emergencyFinalizer: jest.fn().mockResolvedValue({
            isNone: true,
          }),
        },
      });
      alephClient = new AlephClient(mockApi);

      const finalizer = await alephClient.getEmergencyFinalizer();
      expect(finalizer).toBeNull();
    });
  });

  describe('getQueuedEmergencyFinalizer', () => {
    it('should return queued emergency finalizer', async () => {
      mockApi = createMockApi({
        aleph: {
          queuedEmergencyFinalizer: jest.fn().mockResolvedValue({
            unwrap: () => 'queued_finalizer_address',
            isSome: true,
          }),
        },
      });
      alephClient = new AlephClient(mockApi);

      const finalizer = await alephClient.getQueuedEmergencyFinalizer();
      expect(finalizer).toBe('queued_finalizer_address');
    });

    it('should return null when no queued finalizer', async () => {
      const finalizer = await alephClient.getQueuedEmergencyFinalizer();
      expect(finalizer).toBeNull();
    });
  });

  describe('getScheduledFinalityVersionChange', () => {
    it('should return scheduled finality version change', async () => {
      mockApi = createMockApi({
        aleph: {
          finalityScheduledVersionChange: jest.fn().mockResolvedValue({
            unwrap: () => ({
              versionIncoming: { toNumber: () => 2 },
              session: { toNumber: () => 600 },
            }),
            isSome: true,
          }),
        },
      });
      alephClient = new AlephClient(mockApi);

      const change = await alephClient.getScheduledFinalityVersionChange();
      expect(change).toEqual({
        version: 2,
        session: 600,
      });
    });

    it('should return null when no scheduled change', async () => {
      const change = await alephClient.getScheduledFinalityVersionChange();
      expect(change).toBeNull();
    });
  });

  describe('getValidatorPerformance', () => {
    it('should calculate validator performance', async () => {
      mockApi = createMockApi({
        aleph: {
          sessionForValidatorPerformance: jest.fn().mockResolvedValue({
            toNumber: () => 495,
          }),
        },
        session: {
          currentIndex: jest.fn().mockResolvedValue({
            toNumber: () => 500,
          }),
        },
        rpc: {
          chain: {
            getBlockHash: jest.fn().mockResolvedValue('0xblockhash'),
          },
        },
      });

      // Mock author queries for blocks
      (mockApi).query.authorship = {
        author: jest.fn().mockImplementation((blockHash) => {
          return Promise.resolve('validator1');
        }),
      };

      alephClient = new AlephClient(mockApi);

      const performance = await alephClient.getValidatorPerformance('validator1');
      expect(performance.sessions).toBeGreaterThan(0);
      expect(performance.uptime).toBeGreaterThanOrEqual(0);
      expect(performance.uptime).toBeLessThanOrEqual(100);
    });
  });

  describe('setEmergencyFinalizer', () => {
    it('should set emergency finalizer successfully', async () => {
      const mockSigner = {};
      const result = await alephClient.setEmergencyFinalizer(mockSigner, 'new_finalizer_address');
      expect(result.blockHash).toBe('0xblockhash');
      expect(result.success).toBe(true);
    });
  });

  describe('scheduleFinalityVersionChange', () => {
    it('should schedule finality version change', async () => {
      const mockSigner = {};
      const result = await alephClient.scheduleFinalityVersionChange(mockSigner, 2, 600);
      expect(result.blockHash).toBe('0xblockhash');
      expect(result.success).toBe(true);
    });
  });

  describe('isValidatorBanned', () => {
    it('should return false for non-banned validator', async () => {
      mockApi = createMockApi({
        aleph: {
          bannedValidators: jest.fn().mockResolvedValue({
            isNone: true,
          }),
        },
      });
      alephClient = new AlephClient(mockApi);

      const isBanned = await alephClient.isValidatorBanned('validator1');
      expect(isBanned).toBe(false);
    });

    it('should return true for banned validator', async () => {
      mockApi = createMockApi({
        aleph: {
          bannedValidators: jest.fn().mockResolvedValue({
            isNone: false,
            unwrap: () => ({
              reason: 'Slashing',
              start: { toNumber: () => 1000 },
              length: { toNumber: () => 100 },
            }),
          }),
        },
      });
      alephClient = new AlephClient(mockApi);

      const isBanned = await alephClient.isValidatorBanned('validator1');
      expect(isBanned).toBe(true);
    });
  });

  describe('getValidatorHistory', () => {
    it('should return empty array when no history available', async () => {
      const history = await alephClient.getValidatorHistory('validator1', 5);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('getFinalityVersion', () => {
    it('should return finality version', async () => {
      mockApi = createMockApi({
        aleph: {
          finalityVersion: jest.fn().mockResolvedValue({
            toNumber: () => 1,
          }),
        },
      });
      alephClient = new AlephClient(mockApi);

      const version = await alephClient.getFinalityVersion();
      expect(version.version).toBe(1);
    });
  });
});
