/**
 * Technical Committee Pallet
 *
 * This module provides the API for interacting with the Technical Committee
 * collective pallet. The Technical Committee is a specialized group that
 * can make decisions with different voting thresholds.
 *
 * @module pallets/technical-committee
 *
 * @example
 * ```typescript
 * import { SelendraSDK } from '@selendra/sdk';
 *
 * const sdk = await SelendraSDK.create({ rpcUrl: 'wss://rpc.selendra.org' });
 * const techCommittee = sdk.pallets.technicalCommittee;
 *
 * // Get committee info
 * const info = await techCommittee.queries.getInfo();
 * console.log('Members:', info.members);
 * console.log('Proposals:', info.proposalCount);
 *
 * // Vote on a proposal (as committee member)
 * await techCommittee.manager.vote(signer, signerAddress, {
 *   proposal: proposalHash,
 *   index: 0,
 *   approve: true,
 * });
 * ```
 */

export * from "./types.js";
export * from "./queries.js";
export * from "./client.js";
