/**
 * Factory functions for SDK creation
 * 
 * @module core/factory
 */

import { SelendraSDK } from './sdk.js';
import type { SDKConfig } from '../types/index.js';

/**
 * Create a new SelendraSDK instance
 * 
 * Factory function for creating SDK instances with configuration.
 * 
 * @param config - SDK configuration options
 * @returns {SelendraSDK} New SDK instance
 * 
 * @example
 * ```typescript
 * const sdk = createSDK({
 *   endpoint: 'wss://rpc.selendra.org',
 *   network: Network.Selendra,
 *   chainType: ChainType.Substrate
 * });
 * 
 * await sdk.connect();
 * ```
 */
export function createSDK(config?: SDKConfig): SelendraSDK {
  return new SelendraSDK(config);
}

/**
 * Create and connect a new SDK instance
 * 
 * Convenience function that creates an SDK instance and immediately
 * connects to the network.
 * 
 * @param config - SDK configuration options
 * @returns {Promise<SelendraSDK>} Connected SDK instance
 * 
 * @example
 * ```typescript
 * const sdk = await createAndConnect({
 *   endpoint: 'wss://rpc.selendra.org',
 * });
 * 
 * // SDK is already connected
 * console.log(sdk.connected); // true
 * ```
 */
export async function createAndConnect(config?: SDKConfig): Promise<SelendraSDK> {
  const sdk = new SelendraSDK(config);
  await sdk.connect();
  return sdk;
}

/**
 * Default SDK instance (not connected by default)
 * 
 * @example
 * ```typescript
 * import { sdk } from '@selendrajs/sdk-core';
 * 
 * await sdk.connect();
 * console.log(sdk.getConnectionInfo());
 * ```
 */
export const sdk = createSDK();
