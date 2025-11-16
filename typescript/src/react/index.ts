/**
 * React integration for Selendra SDK
 *
 * Main entry point for React components and hooks.
 * Provides comprehensive React integration with the Selendra blockchain SDK.
 *
 * @author Selendra Development Team
 * @version 1.0.0
 */

// Re-export the main provider and context
export { SelendraProvider, useSelendraContext, useSelendra, SelendraContext } from './provider';

// Re-export types
export type { SelendraContextValue, SelendraProviderProps } from './provider';

// Re-export all hooks
export * from './hooks';

// Re-export Substrate-specific hooks
export * from './hooks-substrate';

// Re-export components
export * from './components';

// Note: Examples are available in src/react/examples/ but not exported
// to reduce bundle size. Import them directly if needed for development.

// Re-export SDK classes and types for React integration
export { SelendraSDK, createSDK, sdk } from '../sdk';
export { Network, ChainType } from '../types';
export type { SDKConfig } from '../types';

// Re-export all types from main types module
export type * from '../types';
