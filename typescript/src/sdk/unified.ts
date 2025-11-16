/**
 * Unified client for cross-chain operations
 */

import type {
  Address,
  Balance,
  ChainInfo,
  SelendraAddress,
  EvmAddress,
  SubstrateAddress
} from '../types';
import type { SubstrateClient } from './substrate';
import type { EvmClient } from './evm';

/**
 * Client for unified cross-chain operations
 */
export class UnifiedClient {
  private substrateClient: SubstrateClient;
  private evmClient: EvmClient;

  constructor(substrateClient: SubstrateClient, evmClient: EvmClient) {
    this.substrateClient = substrateClient;
    this.evmClient = evmClient;
  }

  /**
   * Get comprehensive chain information
   */
  async chainInfo(): Promise<ChainInfo> {
    const [substrateInfo, evmInfo] = await Promise.all([
      this.substrateClient.getChainInfo(),
      this.evmClient.getChainInfo()
    ]);

    // Merge information from both chains
    return {
      name: substrateInfo.name || evmInfo.name || 'Selendra',
      version: substrateInfo.version || 'unknown',
      chainId: evmInfo.chainId || substrateInfo.chainId || 'selendra',
      blockNumber: Math.max(substrateInfo.blockNumber || 0, evmInfo.blockNumber || 0),
      genesisHash: substrateInfo.genesisHash,
      specVersion: substrateInfo.specVersion,
      implVersion: substrateInfo.implVersion,
      ss58Format: substrateInfo.ss58Format || 42,
      tokenDecimals: substrateInfo.tokenDecimals || evmInfo.tokenDecimals || 12,
      tokenSymbol: substrateInfo.tokenSymbol || evmInfo.tokenSymbol || 'SEL',
      gasLimit: evmInfo.gasLimit
    };
  }

  /**
   * Get balance for any address type (Substrate or EVM)
   */
  async getBalance(address: Address): Promise<Balance> {
    if (this.isSubstrateAddress(address)) {
      return await this.substrateClient.getBalance(address as SubstrateAddress);
    } else if (this.isEvmAddress(address)) {
      return await this.evmClient.getBalance(address as EvmAddress);
    } else {
      throw new Error(`Invalid address format: ${address}`);
    }
  }

  /**
   * Transfer tokens between addresses (cross-chain support)
   */
  async transfer(
    from: Address,
    to: Address,
    amount: string | number,
    options?: {
      gasLimit?: string;
      gasPrice?: string;
      memo?: string;
      privateKey?: string; // Required for EVM transfers
    }
  ): Promise<{ hash: string; blockNumber?: number }> {
    const fromType = this.getAddressType(from);
    const toType = this.getAddressType(to);

    // Same-chain transfers
    if (fromType === toType) {
      if (fromType === 'substrate') {
        const result = await this.substrateClient.transfer(
          from as SubstrateAddress,
          to as SubstrateAddress,
          amount,
          {
            mortal: true,
            era: 64
          }
        );
        return { hash: result.hash };
      } else {
        if (!options?.privateKey) {
          throw new Error('Private key required for EVM transfers');
        }
        const result = await this.evmClient.transfer(
          from as EvmAddress,
          options.privateKey,
          to as EvmAddress,
          amount.toString(),
          {
            gasLimit: options.gasLimit,
            gasPrice: options.gasPrice
          }
        );
        return { hash: result.hash };
      }
    }

    // Cross-chain transfers (bridge)
    return await this.crossChainTransfer(from, to, amount, options);
  }

  /**
   * Get transaction status (works for both Substrate and EVM transactions)
   */
  async getTransactionStatus(txHash: string): Promise<{
    status: 'pending' | 'success' | 'failed';
    blockNumber?: number;
    blockHash?: string;
    gasUsed?: string;
    effectiveGasPrice?: string;
  }> {
    // Try both chains - one will succeed
    const [substrateStatus, evmStatus] = await Promise.allSettled([
      this.substrateClient.getTransactionStatus(txHash),
      this.evmClient.getTransactionStatus(txHash)
    ]);

    if (substrateStatus.status === 'fulfilled' && substrateStatus.value.status !== 'pending') {
      return {
        status: substrateStatus.value.status,
        blockNumber: substrateStatus.value.blockNumber,
        blockHash: substrateStatus.value.blockHash
      };
    }

    if (evmStatus.status === 'fulfilled' && evmStatus.value.status !== 'pending') {
      return {
        status: evmStatus.value.status,
        blockNumber: evmStatus.value.blockNumber,
        blockHash: evmStatus.value.blockHash,
        gasUsed: evmStatus.value.gasUsed,
        effectiveGasPrice: evmStatus.value.gasPrice
      };
    }

    return { status: 'pending' };
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    confirmations = 1
  ): Promise<{
    status: 'success' | 'failed';
    blockNumber: number;
    blockHash: string;
    gasUsed: string;
    effectiveGasPrice: string;
  }> {
    // Try Substrate first
    try {
      const result = await this.substrateClient.waitForTransaction(txHash, confirmations);
      return {
        status: result.status,
        blockNumber: result.blockNumber,
        blockHash: result.blockHash,
        gasUsed: '0', // Substrate doesn't have gas in the same way
        effectiveGasPrice: '0'
      };
    } catch {
      // Try EVM
      try {
        const result = await this.evmClient.waitForTransaction(txHash, confirmations);
        return {
          status: result.status,
          blockNumber: result.blockNumber,
          blockHash: result.blockHash,
          gasUsed: result.gasUsed,
          effectiveGasPrice: result.gasPrice
        };
      } catch (error) {
        throw new Error(`Transaction confirmation failed: ${error}`);
      }
    }
  }

  /**
   * Convert between different address formats
   */
  convertAddress(address: Address, targetFormat: 'substrate' | 'evm'): Address {
    if (this.isSubstrateAddress(address) && targetFormat === 'evm') {
      return this.substrateToEvmAddress(address as SubstrateAddress);
    } else if (this.isEvmAddress(address) && targetFormat === 'substrate') {
      return this.evmToSubstrateAddress(address as EvmAddress);
    } else {
      // Already in target format
      return address;
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    from: Address,
    to: Address,
    amount: string | number,
    data?: string
  ): Promise<string> {
    const fromType = this.getAddressType(from);
    const toType = this.getAddressType(to);

    if (fromType === 'evm' && toType === 'evm') {
      return await this.evmClient.estimateGas(
        from as EvmAddress,
        to as EvmAddress,
        amount.toString(),
        data
      );
    } else {
      // Substrate transactions don't use gas in the same way
      // Return a reasonable default
      return '2100000000000000'; // Default from network config
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    const [substrateBlock, evmBlock] = await Promise.all([
      this.substrateClient.getBlockNumber(),
      this.evmClient.getBlockNumber()
    ]);

    // Return the higher block number (more recent)
    return Math.max(substrateBlock, evmBlock);
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
    // Try to get block from both chains, return the one with more data
    try {
      return await this.substrateClient.getBlock(blockNumber);
    } catch {
      return await this.evmClient.getBlock(blockNumber);
    }
  }

  /**
   * Cross-chain transfer (bridge functionality)
   */
  private async crossChainTransfer(
    from: Address,
    to: Address,
    amount: string | number,
    options?: {
      gasLimit?: string;
      gasPrice?: string;
      memo?: string;
      privateKey?: string;
    }
  ): Promise<{ hash: string; blockNumber?: number }> {
    // This is a placeholder for bridge functionality
    // In a real implementation, this would interact with bridge contracts/pallets
    throw new Error('Cross-chain transfers not yet implemented. Please use same-chain transfers.');
  }

  /**
   * Check if address is a Substrate address
   */
  private isSubstrateAddress(address: string): boolean {
    // Substrate addresses start with a number and are longer than EVM addresses
    return /^[1-9][0-9]*[a-zA-Z0-9]+$/.test(address) && address.length > 40;
  }

  /**
   * Check if address is an EVM address
   */
  private isEvmAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get address type
   */
  private getAddressType(address: Address): 'substrate' | 'evm' {
    if (this.isSubstrateAddress(address)) {
      return 'substrate';
    } else if (this.isEvmAddress(address)) {
      return 'evm';
    } else {
      throw new Error(`Invalid address format: ${address}`);
    }
  }

  /**
   * Convert Substrate address to EVM address
   * This is a simplified conversion - real implementation would use proper conversion logic
   */
  private substrateToEvmAddress(substrateAddress: SubstrateAddress): EvmAddress {
    // Simplified conversion - real implementation would use H160 conversion
    // For now, return a placeholder that indicates the conversion
    const hash = require('crypto')
      .createHash('sha256')
      .update(substrateAddress)
      .digest('hex')
      .slice(0, 40);
    return `0x${hash}` as EvmAddress;
  }

  /**
   * Convert EVM address to Substrate address
   * This is a simplified conversion - real implementation would use proper conversion logic
   */
  private evmToSubstrateAddress(evmAddress: EvmAddress): SubstrateAddress {
    // Simplified conversion - real implementation would use SS58 encoding
    // For now, return a placeholder that indicates the conversion
    const cleanAddress = evmAddress.slice(2); // Remove 0x
    const hash = require('crypto')
      .createHash('sha256')
      .update(cleanAddress)
      .digest('hex')
      .slice(0, 48);
    return `5${hash}` as SubstrateAddress; // Prefix with SS58 format
  }
}