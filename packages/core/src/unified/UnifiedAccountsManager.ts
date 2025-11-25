/**
 * Unified Accounts Manager
 * 
 * Manages bidirectional mappings between Substrate and EVM addresses
 */

import type { ApiPromise } from '@polkadot/api';
import type { KeyringPair } from '@polkadot/keyring/types';
import { Keyring } from '@polkadot/api';
import { ethers } from 'ethers';
import { u8aToHex } from '@polkadot/util';
import { SubstrateProvider } from '../providers/substrate.js';
import { EvmProvider } from '../providers/evm.js';
import { UnifiedAccountSignature } from './signature.js';
import {
  calculateDefaultEvmAddress,
  calculateDefaultSubstrateAddress,
  getAddressType,
  formatBalance,
} from './utils.js';
import type {
  EvmMappingResult,
  SubstrateMappingResult,
  MappingInfo,
  ClaimResult,
  ClaimEvent,
  EligibilityCheck,
  CostEstimate,
  TransactionOptions,
} from './types.js';
import { UnifiedAccountError } from './types.js';

export class UnifiedAccountsManager {
  private substrateProvider: SubstrateProvider;
  private evmProvider: EvmProvider;
  private signatureHelper: UnifiedAccountSignature;
  private chainId: number;
  private ss58Prefix: number;
  
  constructor(
    substrateProvider: SubstrateProvider,
    evmProvider: EvmProvider,
    chainId: number,
    ss58Prefix: number = 204
  ) {
    this.substrateProvider = substrateProvider;
    this.evmProvider = evmProvider;
    this.chainId = chainId;
    this.ss58Prefix = ss58Prefix;
    
    // Initialize signature helper (will be set after connection)
    this.signatureHelper = null as any;
  }
  
  /**
   * Initialize the signature helper with genesis hash
   * Should be called after substrate provider is connected
   */
  async initialize(): Promise<void> {
    const api = this.ensureApi();
    const genesisHash = api.genesisHash.toHex();
    this.signatureHelper = new UnifiedAccountSignature(this.chainId, genesisHash);
  }
  
  /**
   * Ensure API is available and connected
   * @private
   */
  private ensureApi(): ApiPromise {
    const api = this.substrateProvider.getApi();
    if (!api) {
      throw new Error('Substrate provider not connected. Call sdk.connect() first.');
    }
    return api;
  }
  
  // ========================================================================
  // QUERY METHODS (Read-Only)
  // ========================================================================
  
  /**
   * Get the EVM address mapped to a Substrate account
   * 
   * @param accountId - Substrate account address
   * @returns Mapping result with EVM address
   */
  async getEvmAddressForSubstrate(accountId: string): Promise<EvmMappingResult> {
    const api = this.ensureApi();
    
    // Query NativeToEvm storage
    const mapped = await api.query.unifiedAccounts.nativeToEvm(accountId) as any;
    
    // Calculate default address
    const defaultAddress = calculateDefaultEvmAddress(accountId);
    
    return {
      evmAddress: mapped.isSome ? mapped.unwrap().toHex() : null,
      isMapped: mapped.isSome,
      isDefault: false,
      defaultAddress,
    };
  }
  
  /**
   * Get the Substrate address mapped to an EVM address
   * 
   * @param evmAddress - EVM address
   * @returns Mapping result with Substrate address
   */
  async getSubstrateAddressForEvm(evmAddress: string): Promise<SubstrateMappingResult> {
    const api = this.ensureApi();
    
    // Query EvmToNative storage
    const mapped = await api.query.unifiedAccounts.evmToNative(evmAddress) as any;
    
    // Calculate default address
    const defaultAddress = calculateDefaultSubstrateAddress(evmAddress, this.ss58Prefix);
    
    return {
      substrateAddress: mapped.isSome ? mapped.unwrap().toString() : null,
      isMapped: mapped.isSome,
      isDefault: false,
      defaultAddress,
    };
  }
  
  /**
   * Get the default EVM address for a Substrate account (without checking mapping)
   * 
   * @param accountId - Substrate account address
   * @returns Default EVM address
   */
  getDefaultEvmAddress(accountId: string): string {
    return calculateDefaultEvmAddress(accountId);
  }
  
  /**
   * Get the default Substrate address for an EVM address (without checking mapping)
   * 
   * @param evmAddress - EVM address
   * @returns Default Substrate address
   */
  getDefaultSubstrateAddress(evmAddress: string): string {
    return calculateDefaultSubstrateAddress(evmAddress, this.ss58Prefix);
  }
  
  /**
   * Check if an address has a mapping
   * 
   * @param address - Substrate or EVM address
   * @returns true if mapping exists
   */
  async isMapped(address: string): Promise<boolean> {
    const addressType = getAddressType(address);
    
    if (addressType === 'substrate') {
      const result = await this.getEvmAddressForSubstrate(address);
      return result.isMapped;
    } else if (addressType === 'evm') {
      const result = await this.getSubstrateAddressForEvm(address);
      return result.isMapped;
    }
    
    throw new Error(UnifiedAccountError.INVALID_ADDRESS);
  }
  
  /**
   * Get comprehensive mapping information for an address
   * 
   * @param address - Substrate or EVM address
   * @returns Detailed mapping information
   */
  async getMappingInfo(address: string): Promise<MappingInfo> {
    const addressType = getAddressType(address);
    
    if (!addressType) {
      throw new Error(UnifiedAccountError.INVALID_ADDRESS);
    }
    
    if (addressType === 'substrate') {
      const result = await this.getEvmAddressForSubstrate(address);
      return {
        address,
        mappedTo: result.evmAddress,
        isMapped: result.isMapped,
        defaultMapping: result.defaultAddress,
        type: 'substrate',
      };
    } else {
      const result = await this.getSubstrateAddressForEvm(address);
      return {
        address,
        mappedTo: result.substrateAddress,
        isMapped: result.isMapped,
        defaultMapping: result.defaultAddress,
        type: 'evm',
      };
    }
  }
  
  /**
   * Get the storage fee required for claiming
   * 
   * @returns Storage fee in planck
   */
  async getStorageFee(): Promise<bigint> {
    const api = this.ensureApi();
    const fee = api.consts.unifiedAccounts.accountMappingStorageFee;
    return BigInt(fee.toString());
  }
  
  // ========================================================================
  // TRANSACTION METHODS (Write)
  // ========================================================================
  
  /**
   * Claim a unified account with custom EVM address
   * 
   * @param substrateAccount - Substrate account (KeyringPair)
   * @param evmPrivateKey - Optional EVM private key (if not provided, derives from substrate)
   * @param options - Transaction options
   * @returns Claim result
   */
  async claimEvmAddress(
    substrateAccount: KeyringPair,
    evmPrivateKey?: string,
    options: TransactionOptions = {}
  ): Promise<ClaimResult> {
    // Pre-flight checks
    const eligibility = await this.checkClaimEligibility(substrateAccount.address);
    
    if (!eligibility.eligible) {
      throw new Error(`Cannot claim: ${eligibility.reasons.join(', ')}`);
    }
    
    // Determine EVM private key
    let actualEvmPrivateKey: string;
    
    if (evmPrivateKey) {
      // User provided specific EVM private key
      actualEvmPrivateKey = evmPrivateKey;
    } else {
      // Derive EVM private key from Substrate account
      actualEvmPrivateKey = this.deriveEvmKeyFromSubstrate(substrateAccount);
    }
    
    // Get EVM address from private key
    const evmWallet = new ethers.Wallet(actualEvmPrivateKey);
    const evmAddress = evmWallet.address;
    
    // Generate EIP-712 signature
    const signature = await this.signatureHelper.signClaim(
      substrateAccount.address,
      actualEvmPrivateKey
    );
    
    // Build extrinsic
    const api = this.ensureApi();
    const tx = api.tx.unifiedAccounts.claimEvmAddress(evmAddress, signature);
    
    // Sign and send
    return this.sendClaimTransaction(tx, substrateAccount, evmAddress, options);
  }
  
  /**
   * Claim default EVM address for Substrate account
   * 
   * @param substrateAccount - Substrate account (KeyringPair)
   * @param options - Transaction options
   * @returns Claim result
   */
  async claimDefaultEvmAddress(
    substrateAccount: KeyringPair,
    options: TransactionOptions = {}
  ): Promise<ClaimResult> {
    // Pre-flight checks
    const eligibility = await this.checkClaimEligibility(substrateAccount.address);
    
    if (!eligibility.eligible) {
      throw new Error(`Cannot claim: ${eligibility.reasons.join(', ')}`);
    }
    
    // Build extrinsic
    const api = this.ensureApi();
    const tx = api.tx.unifiedAccounts.claimDefaultEvmAddress();
    
    // Calculate what the default EVM address will be
    const defaultEvmAddress = this.getDefaultEvmAddress(substrateAccount.address);
    
    // Sign and send
    return this.sendClaimTransaction(tx, substrateAccount, defaultEvmAddress, options);
  }
  
  /**
   * Generate EIP-712 signature for claiming (without sending transaction)
   * 
   * @param substrateAccountId - Substrate account address
   * @param evmPrivateKey - EVM private key
   * @returns Signature hex string
   */
  async generateClaimSignature(
    substrateAccountId: string,
    evmPrivateKey: string
  ): Promise<string> {
    return this.signatureHelper.signClaim(substrateAccountId, evmPrivateKey);
  }
  
  // ========================================================================
  // UTILITY METHODS
  // ========================================================================
  
  /**
   * Check if an account is eligible to claim
   * 
   * @param address - Substrate address
   * @returns Eligibility check result
   */
  async checkClaimEligibility(address: string): Promise<EligibilityCheck> {
    const api = this.ensureApi();
    const reasons: string[] = [];
    
    // Check if already mapped
    const mappingResult = await this.getEvmAddressForSubstrate(address);
    const hasMapping = mappingResult.isMapped;
    
    if (hasMapping) {
      reasons.push('Address already has a mapping. Mappings are permanent and cannot be changed.');
    }
    
    // Check balance
    const accountData = await api.query.system.account(address) as any;
    const currentBalance = BigInt(accountData.data.free.toString());
    const storageFeeRequired = await this.getStorageFee();
    
    if (currentBalance < storageFeeRequired) {
      reasons.push(
        `Insufficient balance: has ${formatBalance(currentBalance)} SEL, ` +
        `needs ${formatBalance(storageFeeRequired)} SEL for storage fee`
      );
    }
    
    return {
      eligible: reasons.length === 0,
      reasons,
      requirements: {
        hasMapping,
        sufficientBalance: currentBalance >= storageFeeRequired,
        storageFeeRequired,
        currentBalance,
      },
    };
  }
  
  /**
   * Estimate the cost of claiming
   * 
   * @returns Cost estimate
   */
  async estimateClaimCost(): Promise<CostEstimate> {
    const api = this.ensureApi();
    const storageFee = await this.getStorageFee();
    
    // Get payment info for the extrinsic
    const dummyAccount = new Keyring({ type: 'sr25519' }).addFromUri('//Alice');
    const tx = api.tx.unifiedAccounts.claimDefaultEvmAddress();
    const paymentInfo = await tx.paymentInfo(dummyAccount);
    
    return {
      storageFee,
      estimatedTxFee: BigInt(paymentInfo.partialFee.toString()),
      estimatedTotal: storageFee + BigInt(paymentInfo.partialFee.toString()),
    };
  }
  
  // ========================================================================
  // PRIVATE HELPER METHODS
  // ========================================================================
  
  /**
   * Derive EVM private key from Substrate account
   * 
   * @param account - Substrate KeyringPair
   * @returns EVM private key as hex string
   */
  private deriveEvmKeyFromSubstrate(account: KeyringPair): string {
    try {
      // Derive a child key for EVM use
      const evmAccount = account.derive('//evm');
      
      // Get the seed/secret from the derived account
      // @ts-ignore - secretKey exists but not in types
      const seed = evmAccount.secretKey || evmAccount.seed;
      
      if (!seed || seed.length !== 32) {
        throw new Error('Invalid seed length for EVM key derivation (expected 32 bytes)');
      }
      
      return '0x' + Buffer.from(seed).toString('hex');
    } catch (error) {
      throw new Error(
        `${UnifiedAccountError.SEED_DERIVATION_FAILED}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Send claim transaction and parse results
   * 
   * @param tx - Transaction to send
   * @param account - Substrate account
   * @param evmAddress - Expected EVM address
   * @param options - Transaction options
   * @returns Claim result
   */
  private async sendClaimTransaction(
    tx: any,
    account: KeyringPair,
    evmAddress: string,
    options: TransactionOptions
  ): Promise<ClaimResult> {
    const api = this.ensureApi();
    const waitForFinalization = options.waitForFinalization !== false;
    
    return new Promise((resolve, reject) => {
      tx.signAndSend(
        account,
        { tip: options.tip ? options.tip.toString() : undefined, nonce: options.nonce },
        async ({ status, events, dispatchError, txHash }: any) => {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs}`));
            } else {
              reject(new Error(dispatchError.toString()));
            }
            return;
          }
          
          const shouldResolve = (waitForFinalization && status.isFinalized) ||
                               (!waitForFinalization && status.isInBlock);
          
          if (shouldResolve) {
            try {
              const result = await this.parseClaimResult(
                events,
                txHash.toHex(),
                status.asFinalized?.toHex() || status.asInBlock?.toHex(),
                account.address,
                evmAddress
              );
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }
        }
      ).catch(reject);
    });
  }
  
  /**
   * Parse claim transaction events and build result
   * 
   * @param events - Transaction events
   * @param txHash - Transaction hash
   * @param blockHash - Block hash
   * @param substrateAddress - Substrate address
   * @param evmAddress - EVM address
   * @returns Parsed claim result
   */
  private async parseClaimResult(
    events: any[],
    txHash: string,
    blockHash: string | undefined,
    substrateAddress: string,
    evmAddress: string
  ): Promise<ClaimResult> {
    const claimEvents: ClaimEvent[] = [];
    let storageFee = 0n;
    let transactionFee = 0n;
    
    // Parse events
    for (const { event } of events) {
      // AccountClaimed event
      if (event.section === 'unifiedAccounts' && event.method === 'AccountClaimed') {
        claimEvents.push({
          type: 'AccountClaimed',
          accountId: event.data[0].toString(),
          evmAddress: event.data[1].toHex(),
        });
      }
      
      // Transaction fee
      if (event.section === 'transactionPayment' && event.method === 'TransactionFeePaid') {
        transactionFee = BigInt(event.data[1].toString());
      }
    }
    
    // Get storage fee
    storageFee = await this.getStorageFee();
    
    return {
      success: true,
      txHash,
      blockHash,
      events: claimEvents,
      mapping: {
        substrate: substrateAddress,
        evm: evmAddress,
      },
      fee: {
        storageFee,
        transactionFee,
        total: storageFee + transactionFee,
      },
    };
  }
}
