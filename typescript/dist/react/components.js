"use strict";
/**
 * React Components for Selendra SDK
 *
 * Premium React components that provide beautiful, accessible UI elements
 * for building dApps on Selendra. Built with performance, accessibility,
 * and developer experience in mind.
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
exports.ErrorBoundary = void 0;
exports.SelendraProvider = SelendraProvider;
exports.ThemeProvider = ThemeProvider;
exports.useTheme = useTheme;
exports.WalletConnector = WalletConnector;
exports.BalanceDisplay = BalanceDisplay;
exports.TransactionButton = TransactionButton;
exports.ConnectionStatus = ConnectionStatus;
exports.EventList = EventList;
exports.LoadingSpinner = LoadingSpinner;
exports.LoadingSkeleton = LoadingSkeleton;
const react_1 = __importStar(require("react"));
const sdk_1 = require("../sdk");
const types_1 = require("./types");
const hooks_1 = require("./hooks");
// Re-export SelendraProvider from the provider module
var provider_1 = require("./provider");
Object.defineProperty(exports, "SelendraProvider", { enumerable: true, get: function () { return provider_1.SelendraProvider; } });
/**
 * SelendraProvider - Main Context Provider
 *
 * Provides the Selendra SDK instance and connection management to all child
 * components. This is the root provider that should wrap your entire dApp.
 *
 * @example
 * ```typescript
 * function App() {
 *   return (
 *     <SelendraProvider initialConfig={{
 *       chainType: 'substrate',
 *       endpoint: 'wss://rpc.selendra.org'
 *     }}>
 *       <YourDApp />
 *     </SelendraProvider>
 *   );
 * }
 * ```
 */
function SelendraProvider({ children, initialConfig, autoConnect = false, errorFallback: ErrorFallback, loadingFallback: LoadingFallback, className, style }) {
    const [sdk, setSdk] = (0, react_1.useState)(null);
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    const [chainType, setChainType] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const connect = (0, react_1.useCallback)(async (config) => {
        try {
            setIsLoading(true);
            setError(null);
            const newSdk = new sdk_1.SelendraSDK(config);
            await newSdk.connect();
            setSdk(newSdk);
            setIsConnected(true);
            setChainType(config.chainType);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to connect');
            setError(error);
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    const disconnect = (0, react_1.useCallback)(async () => {
        try {
            if (sdk) {
                await sdk.disconnect();
            }
        }
        catch (err) {
            console.error('Error disconnecting:', err);
        }
        finally {
            setSdk(null);
            setIsConnected(false);
            setChainType(null);
        }
    }, [sdk]);
    const switchChain = (0, react_1.useCallback)(async (newChainType) => {
        if (!sdk || !initialConfig) {
            throw new Error('SDK not initialized or no initial config');
        }
        try {
            setIsLoading(true);
            setError(null);
            const newConfig = { ...initialConfig, chainType: newChainType };
            await disconnect();
            await connect(newConfig);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to switch chain');
            setError(error);
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    }, [sdk, initialConfig, disconnect, connect]);
    const refresh = (0, react_1.useCallback)(async () => {
        if (!sdk || !initialConfig) {
            throw new Error('SDK not initialized or no initial config');
        }
        try {
            setIsLoading(true);
            setError(null);
            await disconnect();
            await connect(initialConfig);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to refresh connection');
            setError(error);
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    }, [sdk, initialConfig, disconnect, connect]);
    // Auto-connect on mount
    (0, react_1.useEffect)(() => {
        if (autoConnect && initialConfig) {
            connect(initialConfig).catch(err => {
                console.error('Auto-connect failed:', err);
            });
        }
    }, [autoConnect, initialConfig, connect]);
    const contextValue = (0, react_1.useMemo)(() => ({
        sdk,
        isConnected,
        chainType,
        isLoading,
        error,
        connect,
        disconnect,
        switchChain,
        refresh
    }), [sdk, isConnected, chainType, isLoading, error, connect, disconnect, switchChain, refresh]);
    // Handle error state
    if (error && ErrorFallback) {
        return <ErrorFallback error={error} retry={() => refresh()}/>;
    }
    // Handle loading state
    if (isLoading && LoadingFallback) {
        return <LoadingFallback />;
    }
    return (<types_1.SelendraContext.Provider value={contextValue}>
      <div className={className} style={style}>
        {children}
      </div>
    </types_1.SelendraContext.Provider>);
}
/**
 * Theme Context and Provider
 */
const ThemeContext = (0, react_1.createContext)(null);
const defaultTheme = {
    colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        background: '#ffffff',
        foreground: '#111827',
        border: '#e5e7eb',
        muted: '#6b7280'
    },
    typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            md: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem'
        },
        fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700
        },
        lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75
        }
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem'
    },
    borderRadius: {
        none: '0',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
    },
    shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    },
    breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px'
    }
};
function ThemeProvider({ children, theme: customTheme, defaultMode = 'light', enableSystem = true }) {
    const [mode, setMode] = (0, react_1.useState)(defaultMode);
    const [theme, setTheme] = (0, react_1.useState)(() => ({
        ...defaultTheme,
        ...customTheme
    }));
    // Detect system theme preference
    (0, react_1.useEffect)(() => {
        if (enableSystem) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e) => {
                setMode(e.matches ? 'dark' : 'light');
            };
            setMode(mediaQuery.matches ? 'dark' : 'light');
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [enableSystem]);
    const toggleMode = (0, react_1.useCallback)(() => {
        setMode(prev => prev === 'light' ? 'dark' : 'light');
    }, []);
    const updateTheme = (0, react_1.useCallback)((newTheme) => {
        setTheme(prev => ({
            ...prev,
            ...newTheme,
            colors: { ...prev.colors, ...newTheme.colors },
            typography: { ...prev.typography, ...newTheme.typography },
            spacing: { ...prev.spacing, ...newTheme.spacing },
            borderRadius: { ...prev.borderRadius, ...newTheme.borderRadius },
            shadows: { ...prev.shadows, ...newTheme.shadows },
            breakpoints: { ...prev.breakpoints, ...newTheme.breakpoints }
        }));
    }, []);
    const value = (0, react_1.useMemo)(() => ({
        theme,
        mode,
        toggleMode,
        setTheme: updateTheme
    }), [theme, mode, toggleMode, updateTheme]);
    return (<ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>);
}
function useTheme() {
    const context = (0, react_1.useContext)(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
class ErrorBoundary extends react_1.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error, errorInfo: null };
    }
    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        this.props.onError?.(error, errorInfo);
    }
    render() {
        if (this.state.hasError && this.state.error) {
            const FallbackComponent = this.props.fallback || DefaultErrorFallback;
            return <FallbackComponent error={this.state.error} retry={() => this.setState({ hasError: false, error: null, errorInfo: null })}/>;
        }
        return this.props.children;
    }
}
exports.ErrorBoundary = ErrorBoundary;
function DefaultErrorFallback({ error, retry }) {
    return (<div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={retry} style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer'
        }}>
        Try Again
      </button>
    </div>);
}
/**
 * WalletConnector - Multi-Wallet Connection Component
 *
 * Provides a beautiful wallet connection interface supporting multiple
 * wallet providers with automatic detection and fallback options.
 *
 * @example
 * ```typescript
 * <WalletConnector
 *   wallets={['metamask', 'walletconnect', 'subwallet']}
 *   onConnect={(account) => console.log('Connected:', account)}
 *   buttonLabel="Connect Wallet"
 *   variant="primary"
 * />
 * ```
 */
function WalletConnector({ wallets = ['metamask', 'walletconnect', 'subwallet', 'talisman', 'polkadot-js'], onConnect, onDisconnect, onError, showWalletList = true, buttonLabel = 'Connect Wallet', buttonVariant = 'primary', buttonSize = 'md', className, style, ...props }) {
    const { sdk, isConnected, account, connect, disconnect } = (0, react_1.useContext)(types_1.SelendraContext);
    const { theme } = useTheme();
    const [isConnecting, setIsConnecting] = (0, react_1.useState)(false);
    const [showDropdown, setShowDropdown] = (0, react_1.useState)(false);
    const handleConnect = (0, react_1.useCallback)(async (walletType) => {
        try {
            setIsConnecting(true);
            setShowDropdown(false);
            // This would integrate with specific wallet connection logic
            const config = {
                chainType: 'substrate', // or detect based on wallet
                endpoint: 'wss://rpc.selendra.org',
                walletType
            };
            await connect(config);
            onConnect?.(account);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to connect wallet');
            onError?.(error);
        }
        finally {
            setIsConnecting(false);
        }
    }, [connect, account, onConnect, onError]);
    const handleDisconnect = (0, react_1.useCallback)(async () => {
        try {
            await disconnect();
            onDisconnect?.();
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to disconnect wallet');
            onError?.(error);
        }
    }, [disconnect, onDisconnect, onError]);
    const getVariantStyles = () => {
        const variants = {
            primary: {
                backgroundColor: theme.colors.primary,
                color: 'white',
                border: 'none'
            },
            secondary: {
                backgroundColor: theme.colors.secondary,
                color: 'white',
                border: 'none'
            },
            outline: {
                backgroundColor: 'transparent',
                color: theme.colors.primary,
                border: `1px solid ${theme.colors.primary}`
            },
            ghost: {
                backgroundColor: 'transparent',
                color: theme.colors.primary,
                border: '1px solid transparent'
            }
        };
        return variants[buttonVariant];
    };
    const getSizeStyles = () => {
        const sizes = {
            sm: { padding: '0.25rem 0.5rem', fontSize: '0.875rem' },
            md: { padding: '0.5rem 1rem', fontSize: '1rem' },
            lg: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' }
        };
        return sizes[buttonSize];
    };
    const walletOptions = [
        { id: 'metamask', name: 'MetaMask', icon: '🦊' },
        { id: 'walletconnect', name: 'WalletConnect', icon: '🔗' },
        { id: 'subwallet', name: 'SubWallet', icon: '🔷' },
        { id: 'talisman', name: 'Talisman', icon: '🎭' },
        { id: 'polkadot-js', name: 'Polkadot.js', icon: '🔌' }
    ].filter(wallet => wallets.includes(wallet.id));
    if (isConnected && account) {
        return (<div className={className} style={style} {...props}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <div style={{
                padding: '0.5rem 1rem',
                backgroundColor: theme.colors.success,
                color: 'white',
                borderRadius: theme.borderRadius.full,
                fontSize: '0.875rem'
            }}>
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </div>
          <button onClick={handleDisconnect} style={{
                padding: '0.5rem 1rem',
                backgroundColor: theme.colors.error,
                color: 'white',
                border: 'none',
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                fontSize: '0.875rem'
            }}>
            Disconnect
          </button>
        </div>
      </div>);
    }
    return (<div className={className} style={{ position: 'relative', ...style }} {...props}>
      <button onClick={() => showWalletList && setShowDropdown(!showDropdown)} disabled={isConnecting} style={{
            padding: getSizeStyles().padding,
            fontSize: getSizeStyles().fontSize,
            borderRadius: theme.borderRadius.md,
            cursor: isConnecting ? 'not-allowed' : 'pointer',
            opacity: isConnecting ? 0.7 : 1,
            transition: 'all 0.2s ease',
            ...getVariantStyles(),
            fontWeight: theme.typography.fontWeight.medium
        }}>
        {isConnecting ? 'Connecting...' : buttonLabel}
      </button>

      {showWalletList && showDropdown && (<div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: theme.spacing.sm,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.lg,
                boxShadow: theme.shadows.lg,
                zIndex: 1000
            }}>
          {walletOptions.map(wallet => (<button key={wallet.id} onClick={() => handleConnect(wallet.id)} style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${theme.colors.border}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    fontSize: theme.typography.fontSize.md
                }}>
              <span style={{ fontSize: '1.5rem' }}>{wallet.icon}</span>
              <span>{wallet.name}</span>
            </button>))}
        </div>)}
    </div>);
}
/**
 * BalanceDisplay - Formatted Balance Component
 *
 * Displays balance information with automatic formatting, currency conversion,
 * and customizable display options.
 *
 * @example
 * ```typescript
 * <BalanceDisplay
 *   address="0x123..."
 *   showUSD={true}
 *   showSymbol={true}
 *   decimals={4}
 * />
 * ```
 */
function BalanceDisplay({ address, showUSD = true, showSymbol = true, decimals = 6, formatter, loading = false, error, className, style, ...props }) {
    const { theme } = useTheme();
    const { balance, formatted, isLoading, error: balanceError } = (0, hooks_1.useBalance)(address);
    if (loading || isLoading) {
        return (<div className={className} style={style} {...props}>
        <div style={{
                width: '100px',
                height: '1.5rem',
                backgroundColor: theme.colors.muted,
                borderRadius: theme.borderRadius.md,
                animation: 'pulse 2s infinite'
            }}/>
      </div>);
    }
    if (error || balanceError || !balance) {
        return (<div className={className} style={style} {...props}>
        <span style={{ color: theme.colors.error }}>
          {error?.message || balanceError?.message || 'Balance unavailable'}
        </span>
      </div>);
    }
    const displayText = formatter
        ? formatter(balance)
        : `${formatted.native}${showSymbol ? ` ${formatted.symbol}` : ''}${showUSD && formatted.usd ? ` (${formatted.usd})` : ''}`;
    return (<div className={className} style={style} {...props}>
      <span style={{
            fontSize: theme.typography.fontSize.md,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.foreground
        }}>
        {displayText}
      </span>
    </div>);
}
/**
 * TransactionButton - One-Click Transaction Component
 *
 * Provides a button that handles transaction submission with built-in
 * loading states, progress tracking, and error handling.
 *
 * @example
 * ```typescript
 * <TransactionButton
 *   transaction={transferTx}
 *   label="Send 1 SEL"
 *   onSuccess={(tx) => console.log('Success:', tx.hash)}
 *   variant="primary"
 *   size="lg"
 * />
 * ```
 */
function TransactionButton({ transaction, options, label, loadingLabel = 'Submitting...', successLabel = 'Success!', onSuccess, onError, onPending, disabled, variant = 'primary', size = 'md', className, style, ...props }) {
    const { theme } = useTheme();
    const { submit, status, error } = useTransaction(options);
    const [showSuccess, setShowSuccess] = (0, react_1.useState)(false);
    const handleClick = (0, react_1.useCallback)(async () => {
        try {
            const result = await submit(transaction);
            if (status === 'included' || status === 'finalized') {
                setShowSuccess(true);
                onSuccess?.(result);
                setTimeout(() => setShowSuccess(false), 3000);
            }
            else if (status === 'pending') {
                onPending?.(result);
            }
        }
        catch (err) {
            onError?.(err instanceof Error ? err : new Error('Transaction failed'));
        }
    }, [submit, transaction, status, onSuccess, onError, onPending]);
    const getVariantStyles = () => {
        const variants = {
            primary: {
                backgroundColor: theme.colors.primary,
                color: 'white',
                border: 'none'
            },
            secondary: {
                backgroundColor: theme.colors.secondary,
                color: 'white',
                border: 'none'
            },
            outline: {
                backgroundColor: 'transparent',
                color: theme.colors.primary,
                border: `1px solid ${theme.colors.primary}`
            },
            ghost: {
                backgroundColor: 'transparent',
                color: theme.colors.primary,
                border: '1px solid transparent'
            },
            danger: {
                backgroundColor: theme.colors.error,
                color: 'white',
                border: 'none'
            }
        };
        return variants[variant];
    };
    const getSizeStyles = () => {
        const sizes = {
            sm: { padding: '0.25rem 0.5rem', fontSize: '0.875rem' },
            md: { padding: '0.5rem 1rem', fontSize: '1rem' },
            lg: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' }
        };
        return sizes[size];
    };
    const isDisabled = disabled || status === 'submitting' || status === 'pending';
    const displayLabel = showSuccess
        ? successLabel
        : status === 'submitting' || status === 'pending'
            ? loadingLabel
            : label;
    return (<button onClick={handleClick} disabled={isDisabled} className={className} style={{
            padding: getSizeStyles().padding,
            fontSize: getSizeStyles().fontSize,
            borderRadius: theme.borderRadius.md,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.6 : 1,
            transition: 'all 0.2s ease',
            ...getVariantStyles(),
            fontWeight: theme.typography.fontWeight.medium,
            ...style
        }} {...props}>
      {displayLabel}
    </button>);
}
/**
 * ConnectionStatus - Visual Connection Status Component
 *
 * Displays the current connection status with visual indicators,
 * chain information, and account details.
 *
 * @example
 * ```typescript
 * <ConnectionStatus
 *   indicator="dot"
 *   showChain={true}
 *   showAddress={true}
 *   compact={false}
 * />
 * ```
 */
function ConnectionStatus({ indicator = 'dot', showChain = true, showAddress = true, showBalance = false, compact = false, className, style, ...props }) {
    const { theme } = useTheme();
    const { isConnected, chainType, account, error } = (0, react_1.useContext)(types_1.SelendraContext);
    const { balance } = (0, hooks_1.useBalance)();
    const getStatusColor = () => {
        if (error)
            return theme.colors.error;
        if (isConnected)
            return theme.colors.success;
        return theme.colors.muted;
    };
    const renderIndicator = () => {
        const color = getStatusColor();
        switch (indicator) {
            case 'dot':
                return (<div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        marginRight: theme.spacing.sm
                    }}/>);
            case 'bar':
                return (<div style={{
                        width: '2px',
                        height: '1rem',
                        backgroundColor: color,
                        marginRight: theme.spacing.sm
                    }}/>);
            case 'text':
                return (<span style={{
                        color,
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.medium,
                        marginRight: theme.spacing.sm
                    }}>
            {isConnected ? 'Connected' : error ? 'Error' : 'Disconnected'}
          </span>);
            default:
                return null;
        }
    };
    if (compact) {
        return (<div className={className} style={{
                display: 'flex',
                alignItems: 'center',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.full,
                ...style
            }} {...props}>
        {renderIndicator()}
        {showChain && chainType && (<span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.foreground
                }}>
            {chainType}
          </span>)}
      </div>);
    }
    return (<div className={className} style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md,
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.lg,
            ...style
        }} {...props}>
      {renderIndicator()}

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        {showChain && chainType && (<div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.muted
            }}>
            Chain: {chainType}
          </div>)}

        {showAddress && account && (<div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.foreground,
                fontFamily: 'monospace'
            }}>
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </div>)}

        {showBalance && balance && (<div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.foreground
            }}>
            {(Number(balance.balance) / Math.pow(10, balance.decimals)).toFixed(4)} {balance.symbol}
          </div>)}
      </div>
    </div>);
}
/**
 * EventList - Real-Time Event Display Component
 *
 * Displays a list of blockchain events with real-time updates,
 * filtering, and customizable rendering.
 *
 * @example
 * ```typescript
 * <EventList
 *   maxEvents={50}
 *   showDetails={true}
 *   autoScroll={true}
 *   emptyState={() => <div>No events yet</div>}
 * />
 * ```
 */
function EventList({ events: propEvents, maxEvents = 100, showDetails = true, autoScroll = true, filter, renderEvent, emptyState: EmptyState, loading = false, className, style, ...props }) {
    const { theme } = useTheme();
    const { events: hookEvents, isLoading } = (0, hooks_1.useEvents)();
    const containerRef = (0, react_1.useRef)(null);
    const events = propEvents || hookEvents;
    const filteredEvents = (0, react_1.useMemo)(() => {
        return filter ? events.filter(filter) : events.slice(0, maxEvents);
    }, [events, filter, maxEvents]);
    // Auto-scroll to latest event
    (0, react_1.useEffect)(() => {
        if (autoScroll && containerRef.current && filteredEvents.length > 0) {
            containerRef.current.scrollTop = 0;
        }
    }, [filteredEvents, autoScroll]);
    const defaultEventRenderer = (event, index) => (<div key={`${event.id}-${index}`} style={{
            padding: theme.spacing.md,
            borderBottom: `1px solid ${theme.colors.border}`,
            backgroundColor: index === 0 ? theme.colors.background : 'transparent'
        }}>
      <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.xs
        }}>
        <span style={{
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.primary
        }}>
          {event.name}
        </span>
        <span style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.muted
        }}>
          {new Date(event.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {showDetails && event.data && (<div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.foreground,
                fontFamily: 'monospace',
                wordBreak: 'break-all'
            }}>
          {JSON.stringify(event.data, null, 2)}
        </div>)}
    </div>);
    if (loading || isLoading) {
        return (<div className={className} style={style} {...props}>
        <div style={{ padding: theme.spacing.lg, textAlign: 'center' }}>
          <div style={{
                width: '2rem',
                height: '2rem',
                border: `2px solid ${theme.colors.muted}`,
                borderTopColor: theme.colors.primary,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
            }}/>
        </div>
      </div>);
    }
    if (filteredEvents.length === 0) {
        if (EmptyState) {
            return <EmptyState />;
        }
        return (<div className={className} style={style} {...props}>
        <div style={{
                padding: theme.spacing.xl,
                textAlign: 'center',
                color: theme.colors.muted
            }}>
          No events to display
        </div>
      </div>);
    }
    return (<div ref={containerRef} className={className} style={{
            maxHeight: '400px',
            overflowY: 'auto',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.lg,
            backgroundColor: theme.colors.background,
            ...style
        }} {...props}>
      {filteredEvents.map((event, index) => renderEvent ? renderEvent(event, index) : defaultEventRenderer(event, index))}
    </div>);
}
/**
 * Loading Components
 */
function LoadingSpinner({ size = 'md', className, style }) {
    const { theme } = useTheme();
    const sizeMap = {
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem'
    };
    return (<div className={className} style={{
            width: sizeMap[size],
            height: sizeMap[size],
            border: `2px solid ${theme.colors.muted}`,
            borderTopColor: theme.colors.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            ...style
        }}/>);
}
function LoadingSkeleton({ variant = 'text', lines = 3, className, style }) {
    const { theme } = useTheme();
    const renderSkeleton = () => {
        switch (variant) {
            case 'text':
                return Array.from({ length: lines }).map((_, i) => (<div key={i} style={{
                        height: '1rem',
                        backgroundColor: theme.colors.muted,
                        borderRadius: theme.borderRadius.sm,
                        marginBottom: theme.spacing.sm,
                        width: i === lines - 1 ? '60%' : '100%'
                    }}/>));
            case 'button':
                return (<div style={{
                        height: '2.5rem',
                        backgroundColor: theme.colors.muted,
                        borderRadius: theme.borderRadius.md,
                        width: '120px'
                    }}/>);
            case 'card':
                return (<div style={{
                        padding: theme.spacing.lg,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.lg
                    }}>
            <div style={{
                        height: '1.5rem',
                        backgroundColor: theme.colors.muted,
                        borderRadius: theme.borderRadius.sm,
                        marginBottom: theme.spacing.md,
                        width: '40%'
                    }}/>
            <div style={{
                        height: '1rem',
                        backgroundColor: theme.colors.muted,
                        borderRadius: theme.borderRadius.sm,
                        marginBottom: theme.spacing.sm
                    }}/>
            <div style={{
                        height: '1rem',
                        backgroundColor: theme.colors.muted,
                        borderRadius: theme.borderRadius.sm,
                        width: '80%'
                    }}/>
          </div>);
            case 'list':
                return Array.from({ length: lines }).map((_, i) => (<div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: theme.spacing.md,
                        borderBottom: `1px solid ${theme.colors.border}`
                    }}>
            <div style={{
                        width: '2rem',
                        height: '2rem',
                        backgroundColor: theme.colors.muted,
                        borderRadius: theme.borderRadius.full,
                        marginRight: theme.spacing.md
                    }}/>
            <div style={{ flex: 1 }}>
              <div style={{
                        height: '1rem',
                        backgroundColor: theme.colors.muted,
                        borderRadius: theme.borderRadius.sm,
                        marginBottom: theme.spacing.xs,
                        width: '70%'
                    }}/>
              <div style={{
                        height: '0.75rem',
                        backgroundColor: theme.colors.muted,
                        borderRadius: theme.borderRadius.sm,
                        width: '40%'
                    }}/>
            </div>
          </div>));
            default:
                return (<div style={{
                        height: '1rem',
                        backgroundColor: theme.colors.muted,
                        borderRadius: theme.borderRadius.sm,
                        ...style
                    }}/>);
        }
    };
    return (<div className={className} style={style}>
      {renderSkeleton()}
    </div>);
}
// Add global styles for animations
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes pulse {
      50% { opacity: 0.5; }
    }
  `;
    document.head.appendChild(style);
}
//# sourceMappingURL=components.js.map