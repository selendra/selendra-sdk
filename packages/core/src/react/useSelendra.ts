/**
 * useSelendra Hook
 *
 * Core hook for accessing the Selendra SDK in React components.
 *
 * @example
 * ```tsx
 * import { useSelendra } from '@selendrajs/sdk/react';
 *
 * function WalletInfo() {
 *   const { sdk, isConnected, connectionInfo, error } = useSelendra();
 *
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!isConnected) return <div>Connecting...</div>;
 *
 *   return (
 *     <div>
 *       <p>Chain: {connectionInfo?.chainName}</p>
 *       <p>Token: {connectionInfo?.tokenSymbol}</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

import { useContext } from "react";
import { SelendraContext } from "./provider.js";
import type { SelendraContextValue } from "./provider.js";

/**
 * Result type for useSelendra hook
 */
export type UseSelendraResult = SelendraContextValue;

/**
 * Hook to access the Selendra SDK
 *
 * Provides access to the SDK instance, connection state, and connection controls.
 *
 * @returns The Selendra context value
 * @throws Error if used outside of SelendraProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     sdk,           // SelendraSDK instance
 *     isConnected,   // boolean
 *     isConnecting,  // boolean
 *     error,         // Error | null
 *     connectionInfo,// ConnectionInfo | null
 *     connect,       // () => Promise<void>
 *     disconnect,    // () => Promise<void>
 *     reconnect,     // () => Promise<void>
 *   } = useSelendra();
 *
 *   // Use the SDK
 *   const handleQuery = async () => {
 *     if (sdk) {
 *       const balance = await sdk.query.balances.account(address);
 *       console.log(balance);
 *     }
 *   };
 * }
 * ```
 */
export function useSelendra(): UseSelendraResult {
  const context = useContext(SelendraContext);

  if (!context) {
    throw new Error(
      "useSelendra must be used within a SelendraProvider. " +
        "Wrap your application with <SelendraProvider> to use this hook."
    );
  }

  return context;
}
