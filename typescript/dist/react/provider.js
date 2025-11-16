"use strict";
/**
 * Selendra React Provider
 *
 * Comprehensive React provider component with error boundaries,
 * connection management, and context for the Selendra SDK.
 *
 * @author Selendra Development Team
 * @version 1.0.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelendraContext = void 0;
exports.SelendraProvider = SelendraProvider;
exports.useSelendraContext = useSelendraContext;
exports.useSelendra = useSelendra;
const react_1 = __importStar(require("react"));
const sdk_1 = require("../sdk");
/**
 * Error boundary component
 */
class SelendraErrorBoundary extends react_1.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Selendra Provider Error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError && this.state.error) {
            const FallbackComponent = this.props.fallback;
            return <FallbackComponent error={this.state.error} retry={this.props.onRetry}/>;
        }
        return this.props.children;
    }
}
/**
 * React context for Selendra SDK
 */
const SelendraContext = (0, react_1.createContext)(null);
exports.SelendraContext = SelendraContext;
/**
 * Selendra Provider Component
 */
function SelendraProvider({ children, endpoint, network = sdk_1.Network.Selendra, chainType = sdk_1.ChainType.Substrate, autoConnect = true, config = {}, errorFallback: ErrorFallbackComponent, loadingComponent: LoadingComponent, maxRetries = 3, retryDelay = 2000 }) {
    const [sdk, setSdk] = (0, react_1.useState)(null);
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    const [isConnecting, setIsConnecting] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [retryCount, setRetryCount] = (0, react_1.useState)(0);
    const sdkRef = (0, react_1.useRef)(null);
    const retryTimeoutRef = (0, react_1.useRef)(null);
    /**
     * Initialize SDK instance
     */
    const initializeSDK = (0, react_1.useCallback)(() => {
        try {
            const newSdk = new sdk_1.SelendraSDK()
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
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to initialize SDK');
            setError(error);
            return null;
        }
    }, [endpoint, network, chainType, config]);
    /**
     * Connect to the blockchain
     */
    const connect = (0, react_1.useCallback)(async () => {
        if (!sdkRef.current) {
            const newSdk = initializeSDK();
            if (!newSdk)
                return;
        }
        try {
            await sdkRef.current.connect();
        }
        catch (err) {
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
    const disconnect = (0, react_1.useCallback)(async () => {
        if (sdkRef.current) {
            try {
                await sdkRef.current.disconnect();
            }
            catch (err) {
                console.error('Disconnect error:', err);
            }
        }
    }, []);
    /**
     * Retry connection
     */
    const retry = (0, react_1.useCallback)(async () => {
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
    const refresh = (0, react_1.useCallback)(async () => {
        await disconnect();
        await connect();
    }, [disconnect, connect]);
    /**
     * Initialize SDK on mount
     */
    (0, react_1.useEffect)(() => {
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
    const contextValue = {
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
    const DefaultErrorFallback = ({ error, retry }) => (<div style={{
            padding: '20px',
            border: '1px solid #ff6b6b',
            borderRadius: '8px',
            backgroundColor: '#ffe0e0',
            color: '#d32f2f',
            margin: '10px'
        }}>
      <h3>Connection Error</h3>
      <p>{error.message}</p>
      <button onClick={retry} style={{
            padding: '8px 16px',
            backgroundColor: '#d32f2f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
        }}>
        Retry Connection
      </button>
    </div>);
    /**
     * Default loading component
     */
    const DefaultLoadingComponent = () => (<div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#666',
            margin: '10px'
        }}>
      <div>Connecting to Selendra...</div>
    </div>);
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
    return (<SelendraErrorBoundary fallback={ErrorFallbackComponent || DefaultErrorFallback} onRetry={retry}>
      <SelendraContext.Provider value={contextValue}>
        {children}
      </SelendraContext.Provider>
    </SelendraErrorBoundary>);
}
/**
 * Hook to use Selendra context
 */
function useSelendraContext() {
    const context = (0, react_1.useContext)(SelendraContext);
    if (!context) {
        throw new Error('useSelendraContext must be used within a SelendraProvider');
    }
    return context;
}
/**
 * Hook to use Selendra SDK (alias for useSelendraContext)
 */
function useSelendra() {
    return useSelendraContext();
}
//# sourceMappingURL=provider.js.map