/**
 * Selendra Provider Component
 *
 * Provides Selendra SDK context to React components.
 *
 * @example
 * ```tsx
 * import { SelendraProvider } from '@selendrajs/sdk/react';
 *
 * function App() {
 *   return (
 *     <SelendraProvider config={{ rpcUrl: 'wss://rpc.selendra.org' }}>
 *       <YourApp />
 *     </SelendraProvider>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { SelendraSDK, createSDK } from "../core/index.js";
import type { SDKConfig, ConnectionInfo } from "../types/index.js";

/**
 * Selendra context value interface
 */
export interface SelendraContextValue {
  /** The SDK instance (null if not connected) */
  sdk: SelendraSDK | null;
  /** Whether the SDK is connected */
  isConnected: boolean;
  /** Whether the SDK is connecting */
  isConnecting: boolean;
  /** Connection error if any */
  error: Error | null;
  /** Connection information */
  connectionInfo: ConnectionInfo | null;
  /** Connect to the chain */
  connect: () => Promise<void>;
  /** Disconnect from the chain */
  disconnect: () => Promise<void>;
  /** Reconnect to the chain */
  reconnect: () => Promise<void>;
}

/**
 * Selendra provider props
 */
export interface SelendraProviderProps {
  /** SDK configuration */
  config: SDKConfig;
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Children components */
  children: ReactNode;
  /** Callback when connected */
  onConnected?: (sdk: SelendraSDK) => void;
  /** Callback when disconnected */
  onDisconnected?: () => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

/**
 * React context for Selendra SDK
 */
export const SelendraContext = createContext<SelendraContextValue | null>(null);

/**
 * Selendra Provider Component
 *
 * Wraps your application to provide Selendra SDK access to all child components.
 *
 * @example
 * ```tsx
 * import { SelendraProvider, useSelendra } from '@selendrajs/sdk/react';
 *
 * // Wrap your app
 * function App() {
 *   return (
 *     <SelendraProvider
 *       config={{ rpcUrl: 'wss://rpc.selendra.org' }}
 *       autoConnect
 *       onConnected={(sdk) => console.log('Connected!', sdk)}
 *     >
 *       <WalletComponent />
 *     </SelendraProvider>
 *   );
 * }
 *
 * // Use in child components
 * function WalletComponent() {
 *   const { sdk, isConnected } = useSelendra();
 *
 *   if (!isConnected) return <div>Connecting...</div>;
 *
 *   return <div>Connected to {sdk.connectionInfo?.chainName}</div>;
 * }
 * ```
 */
export function SelendraProvider({
  config,
  autoConnect = true,
  children,
  onConnected,
  onDisconnected,
  onError,
}: SelendraProviderProps): React.ReactElement {
  const [sdk, setSdk] = useState<SelendraSDK | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);

  // Connect function
  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      const newSdk = createSDK(config);
      await newSdk.connect();

      setSdk(newSdk);
      setIsConnected(true);
      setConnectionInfo(newSdk.getConnectionInfo());
      onConnected?.(newSdk);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setIsConnecting(false);
    }
  }, [config, isConnecting, isConnected, onConnected, onError]);

  // Disconnect function
  const disconnect = useCallback(async () => {
    if (!sdk) return;

    try {
      await sdk.disconnect();
      setSdk(null);
      setIsConnected(false);
      setConnectionInfo(null);
      onDisconnected?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    }
  }, [sdk, onDisconnected, onError]);

  // Reconnect function
  const reconnect = useCallback(async () => {
    await disconnect();
    await connect();
  }, [disconnect, connect]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !sdk && !isConnecting) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (sdk) {
        sdk.disconnect().catch(console.error);
      }
    };
  }, [autoConnect]); // eslint-disable-line react-hooks/exhaustive-deps

  const value: SelendraContextValue = {
    sdk,
    isConnected,
    isConnecting,
    error,
    connectionInfo,
    connect,
    disconnect,
    reconnect,
  };

  return (
    <SelendraContext.Provider value={value}>
      {children}
    </SelendraContext.Provider>
  );
}

/**
 * Hook to access Selendra context (internal use)
 * @internal
 */
export function useSelendraContext(): SelendraContextValue {
  const context = useContext(SelendraContext);

  if (!context) {
    throw new Error("useSelendraContext must be used within a SelendraProvider");
  }

  return context;
}
