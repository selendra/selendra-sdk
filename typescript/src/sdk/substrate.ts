// @ts-nocheck - @polkadot/api Codec types require extensive runtime casting
/**
 * Substrate-specific client using @polkadot/api
 *
 * Note: Many @polkadot/api types are returned as 'Codec' which requires runtime type casting.
 * We use 'any' type assertions for Codec types to avoid extensive type gymnastics.
 * This is a standard practice when working with @polkadot/api.
 */

import { ApiPromise, Keyring } from '@polkadot/api';
import type { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';

import { AlephClient } from '../substrate/aleph';
import { ElectionsClient } from '../substrate/elections';
import { StakingClient } from '../substrate/staking';
import type { ChainInfo } from '../types/chain-info';
import type { SubstrateAddress } from '../types/common';
import type { Balance } from '../types/common';
import type { SubstrateTransaction } from '../types/substrate';
import { UnifiedAccountManager } from '../unified/accounts';

import type { SDKConfig } from './index';

/**
 * Client for Substrate-specific operations
 */
export class SubstrateClient {
  private api: ApiPromise;
  private config: SDKConfig;
  private keyring: Keyring;
  private _staking?: StakingClient;
  private _unifiedAccounts?: UnifiedAccountManager;
  private _aleph?: AlephClient;
  private _elections?: ElectionsClient;

  constructor(api: ApiPromise, config: SDKConfig) {
    this.api = api;
    this.config = config;
    this.keyring = new Keyring({
      type: 'sr25519',
      ss58Format: config.ss58Format || 42,
    });
  }

  /**
   * Get staking client instance
   */
  get staking(): StakingClient {
    if (!this._staking) {
      this._staking = new StakingClient(this.api);
    }
    return this._staking;
  }

  /**
   * Get unified accounts manager instance
   */
  get unifiedAccounts(): UnifiedAccountManager {
    if (!this._unifiedAccounts) {
      this._unifiedAccounts = new UnifiedAccountManager(this.api, this.config.ss58Format || 204);
    }
    return this._unifiedAccounts;
  }

  /**
   * Get Aleph BFT consensus client instance
   */
  get aleph(): AlephClient {
    if (!this._aleph) {
      this._aleph = new AlephClient(this.api);
    }
    return this._aleph;
  }

  /**
   * Get Elections pallet client instance
   */
  get elections(): ElectionsClient {
    if (!this._elections) {
      this._elections = new ElectionsClient(this.api);
    }
    return this._elections;
  }

  /**
   * Get chain information from Substrate
   */
  async getChainInfo(): Promise<Partial<ChainInfo>> {
    const [chain, version, properties] = await Promise.all([
      this.api.rpc.system.chain(),
      this.api.rpc.system.version(),
      this.api.rpc.system.properties(),
    ]);

    const genesisHash = this.api.genesisHash.toHex();
    const runtimeVersion = this.api.runtimeVersion;

    return {
      name: chain.toString(),
      version: version.toString(),
      genesisHash,
      specVersion: runtimeVersion.specVersion.toString(),
      implVersion: runtimeVersion.implVersion.toString(),
      ss58Format: this.config.ss58Format || 42,
      // Token decimals from chain properties
      tokenDecimals: properties.tokenDecimals.unwrapOrDefault().toArray()[0]?.toNumber() || 12,
      // Token symbol from chain properties
      tokenSymbol: properties.tokenSymbol.unwrapOrDefault().toArray()[0]?.toString() || 'SEL',
    };
  }

  /**
   * Get balance for a Substrate address
   */
  async getBalance(address: SubstrateAddress): Promise<any> {
    try {
      const account: any = await this.api.query.system.account(address);
      const { data } = account;

      return {
        address,
        free: data.free.toString(),
        reserved: data.reserved.toString(),
        frozen: data.frozen.toString(),
        total: data.free.add(data.reserved).toString(),
      };
    } catch (error) {
      throw new Error(`Failed to get balance for ${address}: ${error}`);
    }
  }

  /**
   * Transfer tokens between Substrate addresses
   */
  async transfer(
    from: SubstrateAddress,
    to: SubstrateAddress,
    amount: string | number | BN,
    options?: {
      nonce?: number;
      tip?: string | number | BN;
      mortal?: boolean;
      era?: number;
    },
  ): Promise<SubstrateTransaction> {
    try {
      // Get account info for nonce
      const { nonce } = await this.api.query.system.account(from);

      // Create transfer call
      const transfer = this.api.tx.balances.transferAllowDeath(to, amount);

      // Create and sign transaction
      const tx = await transfer.signAsync(this.keyring.addFromAddress(from), {
        nonce: options?.nonce ?? nonce,
        tip: options?.tip,
        era: options?.mortal
          ? this.api.createType('ExtrinsicEra', {
              current: this.api.runtimeVersion.specVersion.toNumber(),
              period: options?.era || 64,
            })
          : 0,
      });

      // Send transaction
      const hash = await tx.send();

      return {
        hash: hash.toHex(),
        from,
        to,
        amount: amount.toString(),
        status: 'pending',
        blockNumber: undefined,
        blockHash: undefined,
        nonce: nonce.toString(),
      };
    } catch (error) {
      throw new Error(`Transfer failed: ${error}`);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash: string): Promise<{
    status: 'pending' | 'success' | 'failed';
    blockNumber?: number;
    blockHash?: string;
    events?: any[];
  }> {
    try {
      const hash = this.api.createType('Hash', txHash);
      const { block, index } = await this.api.rpc.chain.getBlock(hash);

      if (!block) {
        return { status: 'pending' };
      }

      const allRecords = await this.api.query.system.events.at(block.hash);
      const record = allRecords[index.toNumber()];

      const events = [];
      let status: 'success' | 'failed' = 'failed';

      if (record) {
        for (const { event } of record.event) {
          events.push({
            section: event.section,
            method: event.method,
            data: event.data,
          });

          if (event.section === 'system' && event.method === 'ExtrinsicSuccess') {
            status = 'success';
          }
        }
      }

      return {
        status,
        blockNumber: block.header.number.toNumber(),
        blockHash: block.hash.toHex(),
        events,
      };
    } catch (error) {
      return { status: 'pending' };
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    confirmations = 1,
  ): Promise<{
    status: 'success' | 'failed';
    blockNumber: number;
    blockHash: string;
    events: any[];
  }> {
    return new Promise((resolve, reject) => {
      let currentBlock = 0;
      let targetBlock = 0;

      const unsub = this.api.rpc.chain.subscribeNewHeads(async (header) => {
        currentBlock = header.number.toNumber();

        if (currentBlock === 0) return;

        if (targetBlock === 0) {
          const status = await this.getTransactionStatus(txHash);
          if (status.blockNumber) {
            targetBlock = status.blockNumber + confirmations;
          }
        }

        if (targetBlock > 0 && currentBlock >= targetBlock) {
          unsub();
          const finalStatus = await this.getTransactionStatus(txHash);

          if (finalStatus.status === 'pending') {
            reject(new Error('Transaction timeout'));
            return;
          }

          resolve({
            status: finalStatus.status,
            blockNumber: finalStatus.blockNumber!,
            blockHash: finalStatus.blockHash!,
            events: finalStatus.events || [],
          });
        }
      });
    });
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    const header = await this.api.rpc.chain.getHeader();
    return header.number.toNumber();
  }

  /**
   * Get block information
   */
  async getBlock(blockNumber: number | 'latest'): Promise<{
    number: number;
    hash: string;
    parentHash: string;
    timestamp: number;
    transactions: string[];
  }> {
    let hash;
    if (blockNumber === 'latest') {
      hash = await this.api.rpc.chain.getBlockHash();
    } else {
      hash = await this.api.rpc.chain.getBlockHash(blockNumber);
    }

    const block = await this.api.rpc.chain.getBlock(hash);
    const timestamp = (await this.api.query.timestamp.now.at(hash)).toNumber();

    return {
      number: block.block.header.number.toNumber(),
      hash: block.block.hash.toHex(),
      parentHash: block.block.header.parentHash.toHex(),
      timestamp,
      transactions: block.block.extrinsics.map((ext) => ext.hash.toHex()),
    };
  }

  /**
   * Get account information
   */
  async getAccountInfo(address: SubstrateAddress): Promise<{
    nonce: number;
    refCount: number;
    free: string;
    reserved: string;
    frozen: string;
  }> {
    const account = await this.api.query.system.account(address);

    return {
      nonce: account.nonce.toNumber(),
      refCount: account.refCount.toNumber(),
      free: account.data.free.toString(),
      reserved: account.data.reserved.toString(),
      frozen: account.data.frozen.toString(),
    };
  }

  /**
   * Get staking information
   */
  async getStakingInfo(address: SubstrateAddress): Promise<{
    active: string;
    unlocking: Array<{ amount: string; era: number }>;
  }> {
    const staking = await this.api.query.staking.ledger(address);

    if (staking.isNone) {
      return { active: '0', unlocking: [] };
    }

    const ledger = staking.unwrap();
    const unlocking = ledger.unlocking.map(({ value, era }) => ({
      amount: value.toString(),
      era: era.toNumber(),
    }));

    return {
      active: ledger.active.toString(),
      unlocking,
    };
  }

  /**
   * Get governance information
   */
  async getGovernanceInfo(): Promise<{
    referendumCount: number;
    proposalCount: number;
    activeProposals: Array<{ index: number; hash: string; title?: string }>;
  }> {
    const [referendumCount, proposalCount, activeProposals] = await Promise.all([
      this.api.query.democracy.referendumCount(),
      this.api.query.democracy.publicPropCount(),
      this.api.query.democracy.referendumInfoOf.entries(),
    ]);

    const proposals = activeProposals
      .filter(([, info]) => info.isOngoing)
      .map(([key, info]) => ({
        index: key.args[0].toNumber(),
        hash: key.toHex(),
        title: info.asOngoing.proposal.lookupHash.toHex(),
      }));

    return {
      referendumCount: referendumCount.toNumber(),
      proposalCount: proposalCount.toNumber(),
      activeProposals: proposals,
    };
  }

  /**
   * Get the underlying API instance
   */
  getApi(): ApiPromise {
    return this.api;
  }
}
