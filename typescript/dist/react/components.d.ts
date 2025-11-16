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
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { SelendraProviderProps, WalletConnectorProps, BalanceDisplayProps, TransactionButtonProps, ConnectionStatusProps, EventListProps, ErrorBoundaryState, ThemeProviderProps } from './types';
export { SelendraProvider } from './provider';
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
export declare function SelendraProvider({ children, initialConfig, autoConnect, errorFallback: ErrorFallback, loadingFallback: LoadingFallback, className, style }: SelendraProviderProps): JSX.Element;
export declare function ThemeProvider({ children, theme: customTheme, defaultMode, enableSystem }: ThemeProviderProps): JSX.Element;
export declare function useTheme(): any;
/**
 * Error Boundary Component
 */
interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ComponentType<{
        error: Error;
        retry: () => void;
    }>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
export declare class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    render(): any;
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
export declare function WalletConnector({ wallets, onConnect, onDisconnect, onError, showWalletList, buttonLabel, buttonVariant, buttonSize, className, style, ...props }: WalletConnectorProps): JSX.Element;
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
export declare function BalanceDisplay({ address, showUSD, showSymbol, decimals, formatter, loading, error, className, style, ...props }: BalanceDisplayProps): JSX.Element;
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
export declare function TransactionButton({ transaction, options, label, loadingLabel, successLabel, onSuccess, onError, onPending, disabled, variant, size, className, style, ...props }: TransactionButtonProps): JSX.Element;
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
export declare function ConnectionStatus({ indicator, showChain, showAddress, showBalance, compact, className, style, ...props }: ConnectionStatusProps): JSX.Element;
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
export declare function EventList({ events: propEvents, maxEvents, showDetails, autoScroll, filter, renderEvent, emptyState: EmptyState, loading, className, style, ...props }: EventListProps): JSX.Element;
/**
 * Loading Components
 */
export declare function LoadingSpinner({ size, className, style }: {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    style?: React.CSSProperties;
}): any;
export declare function LoadingSkeleton({ variant, lines, className, style }: {
    variant?: 'text' | 'button' | 'card' | 'list' | 'custom';
    lines?: number;
    className?: string;
    style?: React.CSSProperties;
}): any;
//# sourceMappingURL=components.d.ts.map