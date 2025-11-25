/**
 * Enumerations for the Selendra SDK
 * 
 * @module types/enums
 */

/**
 * Chain protocol type (Substrate vs EVM)
 */
export enum ChainType {
  Substrate = 'substrate',
  EVM = 'evm',
}

/**
 * Network enumeration
 */
export enum Network {
  Selendra = 'selendra',
  SelendraTestnet = 'selendra-testnet',
  SelendraDevnet = 'selendra-devnet',
  Custom = 'custom',
}
