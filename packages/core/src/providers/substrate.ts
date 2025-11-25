/**
 * Substrate Provider
 * 
 * Provider implementation for Substrate-based chains using Polkadot.js API
 * 
 * @module providers/substrate
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import type { ISubmittableResult } from '@polkadot/types/types';
import { BaseProvider } from './base.js';
import type { SDKConfig } from '../types/index.js';

/**
 * Substrate chain provider
 */
export class SubstrateProvider extends BaseProvider {
  private api: ApiPromise | null = null;

  constructor(config: SDKConfig) {
    super(config);
  }

  /**
   * Connect to Substrate chain
   */
  async connect(): Promise<void> {
    if (this._isConnected || this.api) {
      this.log('Already connected');
      return;
    }

    if (!this.config.endpoint) {
      throw new Error('Substrate endpoint is required');
    }

    this.log('Connecting to Substrate chain...');

    try {
      // Create WebSocket provider with quiet mode
      const wsProvider = new WsProvider(
        this.config.endpoint,
        this.config.retryAttempts || 3,
        undefined,
        this.config.timeout || 30000
      );

      // Create API instance with timeout and suppress warnings
      this.api = await Promise.race([
        ApiPromise.create({ 
          provider: wsProvider,
          noInitWarn: true,  // Suppress initialization warnings
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Connection timeout')),
            this.config.timeout || 30000
          )
        ),
      ]);

      // Get chain info to verify connection
      const [chain, nodeName, nodeVersion] = await Promise.all([
        this.api.rpc.system.chain(),
        this.api.rpc.system.name(),
        this.api.rpc.system.version(),
      ]);

      this.log(`Connected to ${chain}, node: ${nodeName} v${nodeVersion}`);

      // Set up event listeners
      this.setupEventListeners();

      this._isConnected = true;
      this.emit('connected');
    } catch (error) {
      this.api = null;
      throw new Error(
        `Failed to connect to Substrate chain: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Disconnect from Substrate chain
   */
  async disconnect(): Promise<void> {
    if (!this.api) {
      this.log('Already disconnected');
      return;
    }

    this.log('Disconnecting from Substrate chain...');

    try {
      await this.api.disconnect();
      this.api = null;
      this._isConnected = false;
      this.emit('disconnected');
      this.log('Disconnected successfully');
    } catch (error) {
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Get Polkadot API instance
   */
  getClient(): ApiPromise | null {
    return this.api;
  }

  /**
   * Get API instance (alias for getClient)
   */
  getApi(): ApiPromise | null {
    return this.api;
  }

  /**
   * Set up event listeners for the API
   */
  private setupEventListeners(): void {
    if (!this.api) return;

    this.api.on('connected', () => {
      this.log('Substrate API connected');
      if (!this._isConnected) {
        this._isConnected = true;
        this.emit('connected');
      }
    });

    this.api.on('disconnected', () => {
      this.log('Substrate API disconnected');
      this._isConnected = false;
      this.emit('disconnected');
    });

    this.api.on('error', (error: any) => {
      this.log('Substrate API error:', error);
      this.emit('error', error);
    });
  }

  // ==========================================================================
  // Transfer Methods
  // ==========================================================================

  /**
   * Send native token transfer on Substrate chain
   * 
   * @param from - Sender's address or KeyringPair
   * @param to - Recipient's address
   * @param amount - Amount in planck (smallest unit)
   * @returns Transaction hash
   */
  async sendTransfer(from: any, to: string, amount: string | bigint): Promise<string> {
    if (!this.api) {
      throw new Error('API not connected');
    }

    try {
      this.log(`Sending transfer: ${amount} from ${from.address || from} to ${to}`);

      // Create transfer extrinsic
      const transfer = this.api.tx.balances.transferKeepAlive(to, amount);

      // Sign and send transaction
      const hash = await new Promise<string>((resolve, reject) => {
        transfer
          .signAndSend(from, (result: ISubmittableResult) => {
            const { status, dispatchError } = result;
            
            if (status.isInBlock) {
              this.log(`Transaction included in block: ${status.asInBlock.toString()}`);
            }

            if (status.isFinalized) {
              if (dispatchError) {
                if (dispatchError.isModule) {
                  const decoded = this.api!.registry.findMetaError(dispatchError.asModule);
                  const { docs, name, section } = decoded;
                  reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
                } else {
                  reject(new Error(dispatchError.toString()));
                }
              } else {
                this.log(`Transaction finalized: ${status.asFinalized.toString()}`);
                resolve(status.asFinalized.toString());
              }
            }
          })
          .catch(reject);
      });

      return hash;
    } catch (error) {
      this.log('Transfer error:', error);
      throw new Error(
        `Failed to send transfer: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Send transfer and return immediately with transaction hash (don't wait for finalization)
   * 
   * @param from - Sender's address or KeyringPair
   * @param to - Recipient's address
   * @param amount - Amount in planck (smallest unit)
   * @returns Transaction hash
   */
  async sendTransferNoWait(from: any, to: string, amount: string | bigint): Promise<string> {
    if (!this.api) {
      throw new Error('API not connected');
    }

    try {
      this.log(`Sending transfer (no wait): ${amount} from ${from.address || from} to ${to}`);

      // Create transfer extrinsic
      const transfer = this.api.tx.balances.transferKeepAlive(to, amount);

      // Sign and send, return hash immediately
      const hash = await transfer.signAndSend(from);
      
      this.log(`Transaction submitted: ${hash.toString()}`);
      return hash.toString();
    } catch (error) {
      this.log('Transfer error:', error);
      throw new Error(
        `Failed to send transfer: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Transfer all available balance (leaving only existential deposit)
   * 
   * @param from - Sender's address or KeyringPair
   * @param to - Recipient's address
   * @returns Transaction hash
   */
  async transferAll(from: any, to: string): Promise<string> {
    if (!this.api) {
      throw new Error('API not connected');
    }

    try {
      this.log(`Transferring all from ${from.address || from} to ${to}`);

      // Create transfer all extrinsic
      const transfer = this.api.tx.balances.transferAll(to, false); // false = keep account alive

      // Sign and send transaction
      const hash = await new Promise<string>((resolve, reject) => {
        transfer
          .signAndSend(from, (result: ISubmittableResult) => {
            const { status, dispatchError } = result;
            
            if (status.isFinalized) {
              if (dispatchError) {
                if (dispatchError.isModule) {
                  const decoded = this.api!.registry.findMetaError(dispatchError.asModule);
                  const { docs, name, section } = decoded;
                  reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
                } else {
                  reject(new Error(dispatchError.toString()));
                }
              } else {
                this.log(`Transaction finalized: ${status.asFinalized.toString()}`);
                resolve(status.asFinalized.toString());
              }
            }
          })
          .catch(reject);
      });

      return hash;
    } catch (error) {
      this.log('Transfer all error:', error);
      throw new Error(
        `Failed to transfer all: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

