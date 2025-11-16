/**
 * Selendra React Provider
 *
 * Comprehensive React provider component with error boundaries,
 * connection management, and context for the Selendra SDK.
 *
 * @author Selendra Development Team
 * @version 1.0.0
 */
import { ReactNode } from 'react';
import { SelendraSDK, Network, ChainType, type SDKConfig } from '../sdk';
/**
 * Enhanced context value for Selendra Provider
 */
export interface SelendraContextValue {
    /** SDK instance */
    sdk: SelendraSDK | null;
    /** Connection status */
    isConnected: boolean;
    /** Connection in progress */
    isConnecting: boolean;
    /** Current network */
    network: Network | null;
    /** Current chain type */
    chainType: ChainType | null;
    /** Error state */
    error: Error | null;
    /** Connection function */
    connect: () => Promise<void>;
    /** Disconnect function */
    disconnect: () => Promise<void>;
    /** Retry connection */
    retry: () => Promise<void>;
    /** Refresh connection */
    refresh: () => Promise<void>;
}
/**
 * Props for SelendraProvider
 */
export interface SelendraProviderProps {
    /** Children components */
    children: ReactNode;
    /** SDK endpoint */
    endpoint?: string;
    /** Network to connect to */
    network?: Network;
    /** Chain type */
    chainType?: ChainType;
    /** Auto-connect on mount */
    autoConnect?: boolean;
    /** Additional SDK configuration */
    config?: Partial<SDKConfig>;
    /** Error boundary fallback component */
    errorFallback?: ComponentType<{
        error: Error;
        retry: () => void;
    }>;
    /** Loading component shown during connection */
    loadingComponent?: ComponentType;
    /** Maximum retry attempts */
    maxRetries?: number;
    /** Delay between retries (ms) */
    retryDelay?: number;
}
/**
 * React context for Selendra SDK
 */
declare const SelendraContext: any;
/**
 * Selendra Provider Component
 */
export declare function SelendraProvider({ children, endpoint, network, chainType, autoConnect, config, errorFallback: ErrorFallbackComponent, loadingComponent: LoadingComponent, maxRetries, retryDelay }: SelendraProviderProps): any;
/**
 * Hook to use Selendra context
 */
export declare function useSelendraContext(): SelendraContextValue;
/**
 * Hook to use Selendra SDK (alias for useSelendraContext)
 */
export declare function useSelendra(): SelendraContextValue;
export { SelendraContext };
//# sourceMappingURL=provider.d.ts.map