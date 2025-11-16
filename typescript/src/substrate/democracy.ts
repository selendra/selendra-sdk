/**
 * Democracy/Governance Client
 *
 * Provides APIs for interacting with Selendra's Democracy pallet.
 * Manages proposals, referenda, voting, and governance operations.
 *
 * @module substrate/democracy
 */

import { ApiPromise } from '@polkadot/api';
import type { Codec } from '@polkadot/types/types';

// Helper functions for Codec types (same pattern as staking.ts)
function isOptionNone(codec: Codec): boolean {
  return 'isNone' in codec && (codec as any).isNone === true;
}

function unwrapOption<T = any>(codec: Codec): T {
  if ('unwrap' in codec && typeof (codec as any).unwrap === 'function') {
    return (codec as any).unwrap() as T;
  }
  return codec as any;
}

function codecToNumber(codec: Codec): number {
  if ('toNumber' in codec && typeof (codec as any).toNumber === 'function') {
    return (codec as any).toNumber();
  }
  return Number(codec.toString());
}

/**
 * Referendum information
 */
export interface ReferendumInfo {
  index: number;
  status: 'Ongoing' | 'Finished' | 'NotFound';
  proposalHash?: string;
  end?: number;
  ayes?: string;
  nays?: string;
  threshold?: string;
}

/**
 * Proposal information
 */
export interface ProposalInfo {
  index: number;
  proposalHash: string;
  proposer: string;
  deposit: string;
  seconds: string[];
}

/**
 * Vote information
 */
export interface VoteInfo {
  account: string;
  vote: {
    aye: boolean;
    conviction: number;
  };
  balance: string;
}

/**
 * Democracy voting conviction levels
 */
export enum Conviction {
  None = 0,
  Locked1x = 1,
  Locked2x = 2,
  Locked3x = 3,
  Locked4x = 4,
  Locked5x = 5,
  Locked6x = 6,
}

/**
 * Client for interacting with Selendra's Democracy pallet
 *
 * @example
 * ```typescript
 * const democracy = sdk.substrate.democracy;
 *
 * // Get active referenda
 * const referenda = await democracy.getActiveReferenda();
 * console.log(`Active referenda: ${referenda.length}`);
 *
 * // Get referendum details
 * const ref = await democracy.getReferendum(0);
 * console.log(`Status: ${ref.status}, Ayes: ${ref.ayes}, Nays: ${ref.nays}`);
 *
 * // Vote on referendum
 * await democracy.vote(signer, 0, true, '1000000000000', Conviction.Locked1x);
 * ```
 */
export class DemocracyClient {
  private api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  /**
   * Get referendum information by index
   *
   * @param referendumIndex - Referendum index
   * @returns Referendum details
   */
  async getReferendum(referendumIndex: number): Promise<ReferendumInfo> {
    if (!this.api.query.democracy?.referendumInfoOf) {
      throw new Error('Democracy pallet not available');
    }

    const info = await this.api.query.democracy.referendumInfoOf(referendumIndex);

    if (isOptionNone(info)) {
      return {
        index: referendumIndex,
        status: 'NotFound',
      };
    }

    const data = unwrapOption(info);

    if (data.isOngoing) {
      const ongoing = data.asOngoing;
      return {
        index: referendumIndex,
        status: 'Ongoing',
        proposalHash: ongoing.proposalHash?.toString() || ongoing.proposal_hash?.toString(),
        end: codecToNumber(ongoing.end),
        ayes: ongoing.tally?.ayes?.toString() || '0',
        nays: ongoing.tally?.nays?.toString() || '0',
        threshold: ongoing.threshold?.toString(),
      };
    }

    if (data.isFinished) {
      const finished = data.asFinished;
      return {
        index: referendumIndex,
        status: 'Finished',
        end: codecToNumber(finished.end),
      };
    }

    return {
      index: referendumIndex,
      status: 'NotFound',
    };
  }

  /**
   * Get all active referendum indices
   *
   * @returns Array of active referendum indices
   */
  async getActiveReferenda(): Promise<number[]> {
    if (!this.api.query.democracy?.referendumCount) {
      return [];
    }

    const count = await this.api.query.democracy.referendumCount();
    const refCount = codecToNumber(count);

    const indices: number[] = [];
    for (let i = 0; i < refCount; i++) {
      const ref = await this.getReferendum(i);
      if (ref.status === 'Ongoing') {
        indices.push(i);
      }
    }

    return indices;
  }

  /**
   * Get public proposals (not yet referenda)
   *
   * @returns Array of public proposals
   */
  async getPublicProposals(): Promise<ProposalInfo[]> {
    if (!this.api.query.democracy?.publicProps) {
      return [];
    }

    const proposals = await this.api.query.democracy.publicProps();
    const proposalArray = proposals as any;

    return proposalArray.map((proposal: any) => ({
      index: codecToNumber(proposal[0]),
      proposalHash: proposal[1].toString(),
      proposer: proposal[2].toString(),
      deposit: '0', // Would need to query separately
      seconds: [],
    }));
  }

  /**
   * Get referendum count (total created)
   *
   * @returns Total referendum count
   */
  async getReferendumCount(): Promise<number> {
    if (!this.api.query.democracy?.referendumCount) {
      return 0;
    }

    const count = await this.api.query.democracy.referendumCount();
    return codecToNumber(count);
  }

  /**
   * Get account's voting record for a referendum
   *
   * @param referendumIndex - Referendum index
   * @param account - Account address
   * @returns Vote info or null if not voted
   */
  async getVotingOf(referendumIndex: number, account: string): Promise<VoteInfo | null> {
    if (!this.api.query.democracy?.votingOf) {
      return null;
    }

    const voting = await this.api.query.democracy.votingOf(account);

    if (isOptionNone(voting)) {
      return null;
    }

    const data = unwrapOption(voting);

    // Check if this is direct voting
    if (data.isDirect) {
      const direct = data.asDirect;
      const votes = direct.votes || [];

      for (const vote of votes) {
        const [refIndex, voteData] = vote;
        if (codecToNumber(refIndex) === referendumIndex) {
          return {
            account,
            vote: {
              aye: (voteData as any).isStandard ? (voteData as any).asStandard.vote.isAye : false,
              conviction: (voteData as any).isStandard
                ? codecToNumber((voteData as any).asStandard.vote.conviction)
                : 0,
            },
            balance: (voteData as any).isStandard
              ? (voteData as any).asStandard.balance.toString()
              : '0',
          };
        }
      }
    }

    return null;
  }

  /**
   * Get deposit for creating a proposal
   *
   * @returns Minimum deposit amount
   */
  async getMinimumDeposit(): Promise<string> {
    if (!this.api.consts.democracy?.minimumDeposit) {
      return '0';
    }

    const deposit = this.api.consts.democracy.minimumDeposit;
    return deposit.toString();
  }

  /**
   * Get voting period length (in blocks)
   *
   * @returns Voting period duration
   */
  async getVotingPeriod(): Promise<number> {
    if (!this.api.consts.democracy?.votingPeriod) {
      return 0;
    }

    const period = this.api.consts.democracy.votingPeriod;
    return codecToNumber(period);
  }

  /**
   * Get enactment period (delay before approved referendum executes)
   *
   * @returns Enactment period in blocks
   */
  async getEnactmentPeriod(): Promise<number> {
    if (!this.api.consts.democracy?.enactmentPeriod) {
      return 0;
    }

    const period = this.api.consts.democracy.enactmentPeriod;
    return codecToNumber(period);
  }

  // ========== Extrinsics ==========

  /**
   * Submit a proposal
   *
   * @param signer - Account signer
   * @param proposalHash - Hash of the proposal
   * @param value - Deposit amount
   * @returns Transaction result
   */
  async propose(
    signer: any,
    proposalHash: string,
    value: string,
  ): Promise<{
    blockHash: string;
    success: boolean;
    proposalIndex?: number;
    error?: string;
  }> {
    if (!this.api.tx.democracy?.propose) {
      throw new Error('Democracy pallet not available');
    }

    const tx = this.api.tx.democracy.propose(proposalHash, value);

    return new Promise((resolve, reject) => {
      tx.signAndSend(signer, ({ status, events, dispatchError }: any) => {
        if (dispatchError) {
          let errorMessage = 'Transaction failed';
          if (dispatchError.isModule) {
            const decoded = this.api.registry.findMetaError(dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
          } else {
            errorMessage = dispatchError.toString();
          }

          if (status.isFinalized) {
            resolve({
              blockHash: status.asFinalized.toString(),
              success: false,
              error: errorMessage,
            });
          } else {
            reject(new Error(errorMessage));
          }
          return;
        }

        if (status.isFinalized) {
          // Try to extract proposal index from events
          let proposalIndex: number | undefined;
          for (const event of events) {
            if (event.event.section === 'democracy' && event.event.method === 'Proposed') {
              proposalIndex = codecToNumber(event.event.data[0]);
              break;
            }
          }

          resolve({
            blockHash: status.asFinalized.toString(),
            success: true,
            proposalIndex,
          });
        }
      });
    });
  }

  /**
   * Second a proposal (support it to become a referendum)
   *
   * @param signer - Account signer
   * @param proposalIndex - Proposal index to second
   * @returns Transaction result
   */
  async second(
    signer: any,
    proposalIndex: number,
  ): Promise<{
    blockHash: string;
    success: boolean;
    error?: string;
  }> {
    if (!this.api.tx.democracy?.second) {
      throw new Error('Democracy pallet not available');
    }

    const tx = this.api.tx.democracy.second(proposalIndex);

    return new Promise((resolve, reject) => {
      tx.signAndSend(signer, ({ status, dispatchError }: any) => {
        if (dispatchError) {
          let errorMessage = 'Transaction failed';
          if (dispatchError.isModule) {
            const decoded = this.api.registry.findMetaError(dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
          } else {
            errorMessage = dispatchError.toString();
          }

          if (status.isFinalized) {
            resolve({
              blockHash: status.asFinalized.toString(),
              success: false,
              error: errorMessage,
            });
          } else {
            reject(new Error(errorMessage));
          }
          return;
        }

        if (status.isFinalized) {
          resolve({
            blockHash: status.asFinalized.toString(),
            success: true,
          });
        }
      });
    });
  }

  /**
   * Vote on a referendum
   *
   * @param signer - Account signer
   * @param referendumIndex - Referendum index
   * @param aye - True for aye, false for nay
   * @param balance - Vote weight (balance)
   * @param conviction - Vote conviction multiplier
   * @returns Transaction result
   */
  async vote(
    signer: any,
    referendumIndex: number,
    aye: boolean,
    balance: string,
    conviction: Conviction = Conviction.None,
  ): Promise<{
    blockHash: string;
    success: boolean;
    error?: string;
  }> {
    if (!this.api.tx.democracy?.vote) {
      throw new Error('Democracy pallet not available');
    }

    const vote = {
      Standard: {
        vote: {
          aye,
          conviction,
        },
        balance,
      },
    };

    const tx = this.api.tx.democracy.vote(referendumIndex, vote);

    return new Promise((resolve, reject) => {
      tx.signAndSend(signer, ({ status, dispatchError }: any) => {
        if (dispatchError) {
          let errorMessage = 'Transaction failed';
          if (dispatchError.isModule) {
            const decoded = this.api.registry.findMetaError(dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
          } else {
            errorMessage = dispatchError.toString();
          }

          if (status.isFinalized) {
            resolve({
              blockHash: status.asFinalized.toString(),
              success: false,
              error: errorMessage,
            });
          } else {
            reject(new Error(errorMessage));
          }
          return;
        }

        if (status.isFinalized) {
          resolve({
            blockHash: status.asFinalized.toString(),
            success: true,
          });
        }
      });
    });
  }

  /**
   * Remove a vote from a referendum
   *
   * @param signer - Account signer
   * @param referendumIndex - Referendum index
   * @returns Transaction result
   */
  async removeVote(
    signer: any,
    referendumIndex: number,
  ): Promise<{
    blockHash: string;
    success: boolean;
    error?: string;
  }> {
    if (!this.api.tx.democracy?.removeVote) {
      throw new Error('Democracy pallet not available');
    }

    const tx = this.api.tx.democracy.removeVote(referendumIndex);

    return new Promise((resolve, reject) => {
      tx.signAndSend(signer, ({ status, dispatchError }: any) => {
        if (dispatchError) {
          let errorMessage = 'Transaction failed';
          if (dispatchError.isModule) {
            const decoded = this.api.registry.findMetaError(dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
          } else {
            errorMessage = dispatchError.toString();
          }

          if (status.isFinalized) {
            resolve({
              blockHash: status.asFinalized.toString(),
              success: false,
              error: errorMessage,
            });
          } else {
            reject(new Error(errorMessage));
          }
          return;
        }

        if (status.isFinalized) {
          resolve({
            blockHash: status.asFinalized.toString(),
            success: true,
          });
        }
      });
    });
  }

  /**
   * Delegate voting power to another account
   *
   * @param signer - Account signer
   * @param target - Account to delegate to
   * @param conviction - Conviction level
   * @param balance - Amount to delegate
   * @returns Transaction result
   */
  async delegate(
    signer: any,
    target: string,
    conviction: Conviction,
    balance: string,
  ): Promise<{
    blockHash: string;
    success: boolean;
    error?: string;
  }> {
    if (!this.api.tx.democracy?.delegate) {
      throw new Error('Democracy pallet not available');
    }

    const tx = this.api.tx.democracy.delegate(target, conviction, balance);

    return new Promise((resolve, reject) => {
      tx.signAndSend(signer, ({ status, dispatchError }: any) => {
        if (dispatchError) {
          let errorMessage = 'Transaction failed';
          if (dispatchError.isModule) {
            const decoded = this.api.registry.findMetaError(dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
          } else {
            errorMessage = dispatchError.toString();
          }

          if (status.isFinalized) {
            resolve({
              blockHash: status.asFinalized.toString(),
              success: false,
              error: errorMessage,
            });
          } else {
            reject(new Error(errorMessage));
          }
          return;
        }

        if (status.isFinalized) {
          resolve({
            blockHash: status.asFinalized.toString(),
            success: true,
          });
        }
      });
    });
  }

  /**
   * Remove delegation
   *
   * @param signer - Account signer
   * @returns Transaction result
   */
  async undelegate(signer: any): Promise<{
    blockHash: string;
    success: boolean;
    error?: string;
  }> {
    if (!this.api.tx.democracy?.undelegate) {
      throw new Error('Democracy pallet not available');
    }

    const tx = this.api.tx.democracy.undelegate();

    return new Promise((resolve, reject) => {
      tx.signAndSend(signer, ({ status, dispatchError }: any) => {
        if (dispatchError) {
          let errorMessage = 'Transaction failed';
          if (dispatchError.isModule) {
            const decoded = this.api.registry.findMetaError(dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
          } else {
            errorMessage = dispatchError.toString();
          }

          if (status.isFinalized) {
            resolve({
              blockHash: status.asFinalized.toString(),
              success: false,
              error: errorMessage,
            });
          } else {
            reject(new Error(errorMessage));
          }
          return;
        }

        if (status.isFinalized) {
          resolve({
            blockHash: status.asFinalized.toString(),
            success: true,
          });
        }
      });
    });
  }
}
