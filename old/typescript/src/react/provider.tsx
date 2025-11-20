/**
 * Selendra React Provider
 *
 * Comprehensive React provider component with error boundaries,
 * connection management, and context for the Selendra SDK.
 *
 * @author Selendra Development Team
 * @version 1.0.0
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  Component,
  ComponentType,
  ErrorInfo
} from 'react';

import { SelendraSDK } from '../sdk';
import { Network, ChainType } from '../types';
import type { SDKConfig } from '../types';

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
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
  /** Loading component shown during connection */
  loadingComponent?: ComponentType;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Delay between retries (ms) */
  retryDelay?: number;
}

/**
 * Error boundary component props
 */
interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback: ComponentType<{ error: Error; retry: () => void }>;
  onRetry: () => void;
}

/**
 * Error boundary component state
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component
 */
class SelendraErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare state: ErrorBoundaryState;
  declare props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Selendra Provider Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent error={this.state.error} retry={this.props.onRetry} />;
    }

    return this.props.children;
  }
}

/**
 * React context for Selendra SDK
 */
const SelendraContext = createContext<SelendraContextValue | null>(null);

/**
 * Selendra Provider Component
 */
export function SelendraProvider({
  children,
  endpoint,
  network = Network.Selendra,
  chainType = ChainType.Substrate,
  autoConnect = true,
  config = {},
  errorFallback: ErrorFallbackComponent,
  loadingComponent: LoadingComponent,
  maxRetries = 3,
  retryDelay = 2000
}: SelendraProviderProps) {
  const [sdk, setSdk] = useState<SelendraSDK | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const sdkRef = useRef<SelendraSDK | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize SDK instance
   */
  const initializeSDK = useCallback(() => {
    try {
      const newSdk = new SelendraSDK()
        .withEndpoint(endpoint || 'wss://rpc.selendra.org')
        .withNetwork(network)
        .withChainType(chainType)
        .withOptions({
          timeout: 30000,
          retryAttempts: 3,
          retryDelay: 1000,
          ...config
        });

      sdkRef.current = newSdk;
      setSdk(newSdk);

      // Set up event listeners
      newSdk.on('connecting', () => {
        setIsConnecting(true);
        setError(null);
      });

      newSdk.on('connected', () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        setRetryCount(0);
      });

      newSdk.on('disconnected', () => {
        setIsConnected(false);
        setIsConnecting(false);
      });

      newSdk.on('error', (err) => {
        setError(err instanceof Error ? err : new Error('Connection error'));
        setIsConnecting(false);
        setIsConnected(false);
      });

      return newSdk;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize SDK');
      setError(error);
      return null;
    }
  }, [endpoint, network, chainType, config]);

  /**
   * Connect to the blockchain
   */
  const connect = useCallback(async () => {
    if (!sdkRef.current) {
      const newSdk = initializeSDK();
      if (!newSdk) return;
    }

    try {
      await sdkRef.current!.connect();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Connection failed');
      setError(error);

      // Auto-retry if within limits
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        retryTimeoutRef.current = setTimeout(() => {
          connect();
        }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      }
    }
  }, [initializeSDK, retryCount, maxRetries, retryDelay]);

  /**
   * Disconnect from the blockchain
   */
  const disconnect = useCallback(async () => {
    if (sdkRef.current) {
      try {
        await sdkRef.current.disconnect();
      } catch (err) {
        console.error('Disconnect error:', err);
      }
    }
  }, []);

  /**
   * Retry connection
   */
  const retry = useCallback(async () => {
    setRetryCount(0);
    setError(null);

    // Clear any existing timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    await connect();
  }, [connect]);

  /**
   * Refresh connection
   */
  const refresh = useCallback(async () => {
    await disconnect();
    await connect();
  }, [disconnect, connect]);

  /**
   * Initialize SDK on mount
   */
  useEffect(() => {
    const newSdk = initializeSDK();

    if (autoConnect && newSdk) {
      connect();
    }

    return () => {
      // Cleanup on unmount
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      disconnect();
    };
  }, []);

  /**
   * Context value
   */
  const contextValue: SelendraContextValue = {
    sdk,
    isConnected,
    isConnecting,
    network,
    chainType,
    error,
    connect,
    disconnect,
    retry,
    refresh
  };

  /**
   * Default error fallback component
   */
  const DefaultErrorFallback: ComponentType<{ error: Error; retry: () => void }> = ({ error, retry }) => (
    <div style={{
      padding: '20px',
      border: '1px solid #ff6b6b',
      borderRadius: '8px',
      backgroundColor: '#ffe0e0',
      color: '#d32f2f',
      margin: '10px'
    }}>
      <h3>Connection Error</h3>
      <p>{error.message}</p>
      <button
        onClick={retry}
        style={{
          padding: '8px 16px',
          backgroundColor: '#d32f2f',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        Retry Connection
      </button>
    </div>
  );

  /**
   * Default loading component
   */
  const DefaultLoadingComponent: ComponentType = () => (
    <div style={{
      padding: '20px',
      textAlign: 'center',
      color: '#666',
      margin: '10px'
    }}>
      <div>Connecting to Selendra...</div>
    </div>
  );

  /**
   * Render loading state
   */
  if (isConnecting && LoadingComponent) {
    return <LoadingComponent />;
  }

  if (isConnecting) {
    return <DefaultLoadingComponent />;
  }

  /**
   * Render with error boundary
   */
  return (
    <SelendraErrorBoundary
      fallback={ErrorFallbackComponent || DefaultErrorFallback}
      onRetry={retry}
    >
      <SelendraContext.Provider value={contextValue}>
        {children}
      </SelendraContext.Provider>
    </SelendraErrorBoundary>
  );
}

/**
 * Hook to use Selendra context
 */
export function useSelendraContext(): SelendraContextValue {
  const context = useContext(SelendraContext);
  if (!context) {
    throw new Error('useSelendraContext must be used within a SelendraProvider');
  }
  return context;
}

/**
 * Hook to use Selendra SDK (alias for useSelendraContext)
 */
export function useSelendra(): SelendraContextValue {
  return useSelendraContext();
}

// Export the context for advanced use cases
export { SelendraContext };