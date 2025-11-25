/**
 * Technical Committee client (manager)
 *
 * Provides methods to interact with the Technical Committee collective.
 */

import type { ApiPromise } from "@polkadot/api";
import type { Signer } from "@polkadot/types/types";
import type {
  TechCommitteeProposalParams,
  TechCommitteeVoteParams,
  TechCommitteeCloseParams,
  TechCommitteeSetMembersParams,
} from "./types.js";

/**
 * Result of a Technical Committee operation
 */
export interface TechCommitteeResult {
  success: boolean;
  blockHash?: string;
  txHash?: string;
  error?: string;
  proposalHash?: string;
  proposalIndex?: number;
}

/**
 * Technical Committee manager for submitting proposals and voting
 */
export class TechCommitteeManager {
  private api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  /**
   * Propose a call to be executed by the committee
   *
   * @param signer - The signer for the transaction
   * @param signerAddress - The address of the signer
   * @param params - Proposal parameters
   */
  async propose(
    signer: Signer,
    signerAddress: string,
    params: TechCommitteeProposalParams
  ): Promise<TechCommitteeResult> {
    return new Promise((resolve, reject) => {
      const tx = this.api.tx.technicalCommittee.propose(
        params.threshold,
        params.proposal,
        params.lengthBound
      );

      tx.signAndSend(
        signerAddress,
        { signer },
        ({ status, dispatchError, events }) => {
          if (status.isInBlock || status.isFinalized) {
            if (dispatchError) {
              if (dispatchError.isModule) {
                const decoded = this.api.registry.findMetaError(
                  dispatchError.asModule
                );
                resolve({
                  success: false,
                  error: `${decoded.section}.${
                    decoded.name
                  }: ${decoded.docs.join(" ")}`,
                  blockHash: status.isInBlock
                    ? status.asInBlock.toString()
                    : status.asFinalized.toString(),
                });
              } else {
                resolve({
                  success: false,
                  error: dispatchError.toString(),
                  blockHash: status.isInBlock
                    ? status.asInBlock.toString()
                    : status.asFinalized.toString(),
                });
              }
            } else {
              // Extract proposal info from events
              let proposalHash: string | undefined;
              let proposalIndex: number | undefined;

              events.forEach(({ event }) => {
                if (
                  event.section === "technicalCommittee" &&
                  event.method === "Proposed"
                ) {
                  proposalIndex = (
                    event.data as unknown as { proposalIndex: number }
                  ).proposalIndex;
                  proposalHash = (
                    event.data as unknown as { proposalHash: string }
                  ).proposalHash;
                }
              });

              resolve({
                success: true,
                blockHash: status.isInBlock
                  ? status.asInBlock.toString()
                  : status.asFinalized.toString(),
                txHash: tx.hash.toString(),
                proposalHash,
                proposalIndex,
              });
            }
          }
        }
      ).catch(reject);
    });
  }

  /**
   * Vote on a proposal
   *
   * @param signer - The signer for the transaction
   * @param signerAddress - The address of the signer
   * @param params - Vote parameters
   */
  async vote(
    signer: Signer,
    signerAddress: string,
    params: TechCommitteeVoteParams
  ): Promise<TechCommitteeResult> {
    return new Promise((resolve, reject) => {
      const tx = this.api.tx.technicalCommittee.vote(
        params.proposal,
        params.index,
        params.approve
      );

      tx.signAndSend(signerAddress, { signer }, ({ status, dispatchError }) => {
        if (status.isInBlock || status.isFinalized) {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = this.api.registry.findMetaError(
                dispatchError.asModule
              );
              resolve({
                success: false,
                error: `${decoded.section}.${decoded.name}: ${decoded.docs.join(
                  " "
                )}`,
                blockHash: status.isInBlock
                  ? status.asInBlock.toString()
                  : status.asFinalized.toString(),
              });
            } else {
              resolve({
                success: false,
                error: dispatchError.toString(),
                blockHash: status.isInBlock
                  ? status.asInBlock.toString()
                  : status.asFinalized.toString(),
              });
            }
          } else {
            resolve({
              success: true,
              blockHash: status.isInBlock
                ? status.asInBlock.toString()
                : status.asFinalized.toString(),
              txHash: tx.hash.toString(),
            });
          }
        }
      }).catch(reject);
    });
  }

  /**
   * Close a proposal (execute if approved or reject if voting ended)
   *
   * @param signer - The signer for the transaction
   * @param signerAddress - The address of the signer
   * @param params - Close parameters
   */
  async close(
    signer: Signer,
    signerAddress: string,
    params: TechCommitteeCloseParams
  ): Promise<TechCommitteeResult> {
    return new Promise((resolve, reject) => {
      const tx = this.api.tx.technicalCommittee.close(
        params.proposalHash,
        params.index,
        params.proposalWeightBound,
        params.lengthBound
      );

      tx.signAndSend(signerAddress, { signer }, ({ status, dispatchError }) => {
        if (status.isInBlock || status.isFinalized) {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = this.api.registry.findMetaError(
                dispatchError.asModule
              );
              resolve({
                success: false,
                error: `${decoded.section}.${decoded.name}: ${decoded.docs.join(
                  " "
                )}`,
                blockHash: status.isInBlock
                  ? status.asInBlock.toString()
                  : status.asFinalized.toString(),
              });
            } else {
              resolve({
                success: false,
                error: dispatchError.toString(),
                blockHash: status.isInBlock
                  ? status.asInBlock.toString()
                  : status.asFinalized.toString(),
              });
            }
          } else {
            resolve({
              success: true,
              blockHash: status.isInBlock
                ? status.asInBlock.toString()
                : status.asFinalized.toString(),
              txHash: tx.hash.toString(),
            });
          }
        }
      }).catch(reject);
    });
  }

  /**
   * Disapprove and close a proposal
   * Only callable by root origin
   *
   * @param signer - The signer for the transaction
   * @param signerAddress - The address of the signer
   * @param proposalHash - Hash of the proposal to disapprove
   */
  async disapproveProposal(
    signer: Signer,
    signerAddress: string,
    proposalHash: string
  ): Promise<TechCommitteeResult> {
    return new Promise((resolve, reject) => {
      const tx =
        this.api.tx.technicalCommittee.disapproveProposal(proposalHash);

      tx.signAndSend(signerAddress, { signer }, ({ status, dispatchError }) => {
        if (status.isInBlock || status.isFinalized) {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = this.api.registry.findMetaError(
                dispatchError.asModule
              );
              resolve({
                success: false,
                error: `${decoded.section}.${decoded.name}: ${decoded.docs.join(
                  " "
                )}`,
                blockHash: status.isInBlock
                  ? status.asInBlock.toString()
                  : status.asFinalized.toString(),
              });
            } else {
              resolve({
                success: false,
                error: dispatchError.toString(),
                blockHash: status.isInBlock
                  ? status.asInBlock.toString()
                  : status.asFinalized.toString(),
              });
            }
          } else {
            resolve({
              success: true,
              blockHash: status.isInBlock
                ? status.asInBlock.toString()
                : status.asFinalized.toString(),
              txHash: tx.hash.toString(),
            });
          }
        }
      }).catch(reject);
    });
  }

  /**
   * Set the members of the Technical Committee
   * Only callable by root origin
   *
   * @param signer - The signer for the transaction
   * @param signerAddress - The address of the signer
   * @param params - Set members parameters
   */
  async setMembers(
    signer: Signer,
    signerAddress: string,
    params: TechCommitteeSetMembersParams
  ): Promise<TechCommitteeResult> {
    return new Promise((resolve, reject) => {
      const tx = this.api.tx.technicalCommittee.setMembers(
        params.newMembers,
        params.prime,
        params.oldCount
      );

      tx.signAndSend(signerAddress, { signer }, ({ status, dispatchError }) => {
        if (status.isInBlock || status.isFinalized) {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = this.api.registry.findMetaError(
                dispatchError.asModule
              );
              resolve({
                success: false,
                error: `${decoded.section}.${decoded.name}: ${decoded.docs.join(
                  " "
                )}`,
                blockHash: status.isInBlock
                  ? status.asInBlock.toString()
                  : status.asFinalized.toString(),
              });
            } else {
              resolve({
                success: false,
                error: dispatchError.toString(),
                blockHash: status.isInBlock
                  ? status.asInBlock.toString()
                  : status.asFinalized.toString(),
              });
            }
          } else {
            resolve({
              success: true,
              blockHash: status.isInBlock
                ? status.asInBlock.toString()
                : status.asFinalized.toString(),
              txHash: tx.hash.toString(),
            });
          }
        }
      }).catch(reject);
    });
  }
}
