/**
 * Global type declarations for browser environment
 */

import { EthereumProvider } from './blockchain';

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {};