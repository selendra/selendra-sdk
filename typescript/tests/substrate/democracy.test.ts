/**
 * Democracy/Governance API Tests
 */

import { DemocracyClient, Conviction } from '../../src/substrate/democracy';
import { ApiPromise } from '@polkadot/api';

const createMockApi = (overrides: any = {}) => {
  const mockApi = {
    query: {
      democracy: {
        referendumCount: jest.fn().mockResolvedValue({
          toNumber: () => 10,
        }),
        referendumInfoOf: jest.fn().mockResolvedValue({
          unwrap: () => ({
            isOngoing: true,
            asOngoing: {
              proposalHash: '0xproposalhash',
              end: { toNumber: () => 1000 },
              threshold: { toString: () => 'SimpleMajority' },
              tally: {
                ayes: { toString: () => '1000000000000000000' },
                nays: { toString: () => '500000000000000000' },
                turnout: { toString: () => '1500000000000000000' },
              },
            },
          }),
          isSome: true,
        }),
        publicProps: jest
          .fn()
          .mockResolvedValue([[{ toNumber: () => 0 }, '0xproposalhash', 'proposer_address']]),
        votingOf: jest.fn().mockResolvedValue({
          isDirect: true,
          asDirect: {
            votes: [
              [
                { toNumber: () => 0 },
                {
                  isStandard: true,
                  asStandard: {
                    vote: {
                      isAye: true,
                      conviction: { toNumber: () => 1 }, // Conviction.Locked2x
                    },
                    balance: { toString: () => '1000000000000000000' },
                  },
                },
              ],
            ],
          },
        }),
        ...overrides.democracy,
      },
    },
    consts: {
      democracy: {
        minimumDeposit: {
          toString: () => '100000000000000000',
        },
        votingPeriod: {
          toNumber: () => 28800,
        },
        enactmentPeriod: {
          toNumber: () => 28800,
        },
        ...overrides.consts?.democracy,
      },
    },
    tx: {
      democracy: {
        propose: jest.fn().mockReturnValue({
          signAndSend: jest.fn().mockImplementation((_signer: any, callback: any) => {
            if (callback)
              callback({
                status: { isFinalized: true, asFinalized: { toString: () => '0xblockhash' } },
                events: [],
                dispatchError: null,
              });
            return Promise.resolve('0xhash');
          }),
        }),
        second: jest.fn().mockReturnValue({
          signAndSend: jest.fn().mockImplementation((_signer: any, callback: any) => {
            if (callback)
              callback({
                status: { isFinalized: true, asFinalized: { toString: () => '0xblockhash' } },
                dispatchError: null,
              });
            return Promise.resolve('0xhash');
          }),
        }),
        vote: jest.fn().mockReturnValue({
          signAndSend: jest.fn().mockImplementation((_signer: any, callback: any) => {
            if (callback)
              callback({
                status: { isFinalized: true, asFinalized: { toString: () => '0xblockhash' } },
                dispatchError: null,
              });
            return Promise.resolve('0xhash');
          }),
        }),
        removeVote: jest.fn().mockReturnValue({
          signAndSend: jest.fn().mockImplementation((_signer: any, callback: any) => {
            if (callback)
              callback({
                status: { isFinalized: true, asFinalized: { toString: () => '0xblockhash' } },
                dispatchError: null,
              });
            return Promise.resolve('0xhash');
          }),
        }),
        delegate: jest.fn().mockReturnValue({
          signAndSend: jest.fn().mockImplementation((_signer: any, callback: any) => {
            if (callback)
              callback({
                status: { isFinalized: true, asFinalized: { toString: () => '0xblockhash' } },
                dispatchError: null,
              });
            return Promise.resolve('0xhash');
          }),
        }),
        undelegate: jest.fn().mockReturnValue({
          signAndSend: jest.fn().mockImplementation((_signer: any, callback: any) => {
            if (callback)
              callback({
                status: { isFinalized: true, asFinalized: { toString: () => '0xblockhash' } },
                dispatchError: null,
              });
            return Promise.resolve('0xhash');
          }),
        }),
        ...overrides.tx?.democracy,
      },
    },
    ...overrides,
  } as unknown as ApiPromise;

  return mockApi;
};

describe('DemocracyClient', () => {
  let democracyClient: DemocracyClient;
  let mockApi: ApiPromise;

  beforeEach(() => {
    mockApi = createMockApi();
    democracyClient = new DemocracyClient(mockApi);
  });

  describe('getReferendumCount', () => {
    it('should return referendum count', async () => {
      const count = await democracyClient.getReferendumCount();
      expect(count).toBe(10);
    });
  });

  describe('getReferendum', () => {
    it('should return referendum details', async () => {
      const referendum = await democracyClient.getReferendum(0);
      expect(referendum.index).toBe(0);
      expect(referendum.status).toBe('Ongoing');
      expect(referendum.proposalHash).toBe('0xproposalhash');
      expect(referendum.threshold).toBe('SimpleMajority');
      expect(referendum.ayes).toBe('1000000000000000000');
      expect(referendum.nays).toBe('500000000000000000');
    });

    it('should handle non-existent referendum', async () => {
      mockApi = createMockApi({
        democracy: {
          referendumInfoOf: jest.fn().mockResolvedValue({
            isNone: true,
          }),
        },
      });
      democracyClient = new DemocracyClient(mockApi);

      const referendum = await democracyClient.getReferendum(999);
      expect(referendum.index).toBe(999);
      expect(referendum.status).toBe('NotFound');
    });

    it('should handle finished referendum', async () => {
      mockApi = createMockApi({
        democracy: {
          referendumInfoOf: jest.fn().mockResolvedValue({
            unwrap: () => ({
              isOngoing: false,
              isFinished: true,
              asFinished: {
                approved: true,
                end: { toNumber: () => 1000 },
              },
            }),
            isSome: true,
          }),
        },
      });
      democracyClient = new DemocracyClient(mockApi);

      const referendum = await democracyClient.getReferendum(0);
      expect(referendum.status).toBe('Finished');
    });
  });

  describe('getActiveReferenda', () => {
    it('should return list of active referenda', async () => {
      const activeReferenda = await democracyClient.getActiveReferenda();
      expect(Array.isArray(activeReferenda)).toBe(true);
    });
  });

  describe('getPublicProposals', () => {
    it('should return list of public proposals', async () => {
      const proposals = await democracyClient.getPublicProposals();
      expect(proposals).toHaveLength(1);
      expect(proposals[0].index).toBe(0);
      expect(proposals[0].proposalHash).toBe('0xproposalhash');
      expect(proposals[0].proposer).toBe('proposer_address');
    });
  });

  describe('getVotingOf', () => {
    it('should return voting info for account', async () => {
      const vote = await democracyClient.getVotingOf(0, 'test_address');
      expect(vote).toBeDefined();
      expect(vote?.vote.aye).toBe(true);
      expect(vote?.balance).toBe('1000000000000000000');
    });

    it('should return null for delegating account', async () => {
      mockApi = createMockApi({
        democracy: {
          votingOf: jest.fn().mockResolvedValue({
            isDirect: false,
            isDelegating: true,
          }),
        },
      });
      democracyClient = new DemocracyClient(mockApi);

      const vote = await democracyClient.getVotingOf(0, 'test_address');
      expect(vote).toBeNull();
    });
  });

  describe('getMinimumDeposit', () => {
    it('should return minimum deposit', async () => {
      const deposit = await democracyClient.getMinimumDeposit();
      expect(deposit).toBe('100000000000000000');
    });
  });

  describe('getVotingPeriod', () => {
    it('should return voting period in blocks', async () => {
      const period = await democracyClient.getVotingPeriod();
      expect(period).toBe(28800);
    });
  });

  describe('getEnactmentPeriod', () => {
    it('should return enactment period in blocks', async () => {
      const period = await democracyClient.getEnactmentPeriod();
      expect(period).toBe(28800);
    });
  });

  describe('propose', () => {
    it('should submit a proposal successfully', async () => {
      const mockSigner = {} as any;
      const result = await democracyClient.propose(
        mockSigner,
        '0xproposalhash',
        '100000000000000000',
      );
      expect(result.blockHash).toBe('0xblockhash');
      expect(result.success).toBe(true);
    });
  });

  describe('second', () => {
    it('should second a proposal successfully', async () => {
      const mockSigner = {} as any;
      const result = await democracyClient.second(mockSigner, 0);
      expect(result.blockHash).toBe('0xblockhash');
      expect(result.success).toBe(true);
    });
  });

  describe('vote', () => {
    it('should vote on referendum successfully', async () => {
      const mockSigner = {} as any;
      const result = await democracyClient.vote(
        mockSigner,
        0,
        true,
        '1000000000000000000',
        Conviction.Locked2x,
      );
      expect(result.blockHash).toBe('0xblockhash');
      expect(result.success).toBe(true);
    });

    it('should handle all conviction types', async () => {
      const mockSigner = {} as any;
      const convictions = [
        Conviction.None,
        Conviction.Locked1x,
        Conviction.Locked2x,
        Conviction.Locked3x,
        Conviction.Locked4x,
        Conviction.Locked5x,
        Conviction.Locked6x,
      ];

      for (const conviction of convictions) {
        const result = await democracyClient.vote(
          mockSigner,
          0,
          true,
          '1000000000000000000',
          conviction,
        );
        expect(result.blockHash).toBe('0xblockhash');
      expect(result.success).toBe(true);
      }
    });
  });

  describe('removeVote', () => {
    it('should remove vote successfully', async () => {
      const mockSigner = {} as any;
      const result = await democracyClient.removeVote(mockSigner, 0);
      expect(result.blockHash).toBe('0xblockhash');
      expect(result.success).toBe(true);
    });
  });

  describe('delegate', () => {
    it('should delegate vote successfully', async () => {
      const mockSigner = {} as any;
      const result = await democracyClient.delegate(
        mockSigner,
        'delegate_address',
        Conviction.Locked1x,
        '1000000000000000000',
      );
      expect(result.blockHash).toBe('0xblockhash');
      expect(result.success).toBe(true);
    });
  });

  describe('undelegate', () => {
    it('should remove delegation successfully', async () => {
      const mockSigner = {} as any;
      const result = await democracyClient.undelegate(mockSigner);
      expect(result.blockHash).toBe('0xblockhash');
      expect(result.success).toBe(true);
    });
  });

  describe('Conviction enum', () => {
    it('should have correct conviction values', () => {
      expect(Conviction.None).toBe(0);
      expect(Conviction.Locked1x).toBe(1);
      expect(Conviction.Locked2x).toBe(2);
      expect(Conviction.Locked3x).toBe(3);
      expect(Conviction.Locked4x).toBe(4);
      expect(Conviction.Locked5x).toBe(5);
      expect(Conviction.Locked6x).toBe(6);
    });
  });
});
