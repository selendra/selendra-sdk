/**
 * React Integration Types for Selendra SDK
 *
 * Comprehensive type definitions for React hooks, components, and utilities
 * that provide premium developer experience for building dApps on Selendra.
 *
 * @author Selendra Development Team
 * @version 1.0.0
 */

import { ReactNode, ComponentType, HTMLAttributes, CSSProperties } from 'react';
import { SelendraEvmClient, type SelendraEvmConfig } from '../evm';
import type { Address, Balance } from '../types/common';
import type {
  AccountInfo,
  BalanceInfo,
  TransactionInfo,
  ContractInfo,
  EventSubscription,
  EventData,
} from '../types/sdk-types';

// Re-export consolidated types for convenience
export type {
  AccountInfo,
  BalanceInfo,
  TransactionInfo,
  ContractInfo,
  EventSubscription,
  EventData,
};

/**
 * React Context and Provider Types
 */

export interface SelendraContextValue {
  /** EVM Client instance */
  client: SelendraEvmClient | null;
  /** Connection status */
  isConnected: boolean;
  /** Current network */
  network: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Connection attempt function */
  connect: (config: SelendraEvmConfig) => Promise<void>;
  /** Disconnect function */
  disconnect: () => Promise<void>;
  /** Switch network function */
  switchNetwork: (network: string) => Promise<void>;
  /** Refresh connection */
  refresh: () => Promise<void>;
}

export interface SelendraProviderProps {
  /** Children components */
  children: ReactNode;
  /** Initial configuration */
  initialConfig?: SelendraEvmConfig;
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Error boundary fallback */
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
  /** Loading fallback */
  loadingFallback?: ComponentType;
  /** Provider className */
  className?: string;
  /** Provider styles */
  style?: CSSProperties;
}

/**
 * Hook Return Types
 */

export interface UseSelendraSDKReturn extends SelendraContextValue {}

export interface UseBalanceOptions {
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
  /** Include USD conversion */
  includeUSD?: boolean;
  /** Include token metadata */
  includeMetadata?: boolean;
  /** Enable real-time updates */
  realTime?: boolean;
}

export interface UseBalanceReturn {
  /** Balance information */
  balance: BalanceInfo | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refresh balance */
  refresh: () => Promise<void>;
  /** Balance formatted for display */
  formatted: {
    /** Native balance formatted */
    native: string;
    /** USD value formatted */
    usd?: string;
    /** Token symbol */
    symbol: string;
    /** Decimal places */
    decimals: number;
  };
  /** Balance in smallest unit */
  wei: string;
}

export interface UseAccountOptions {
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
  /** Include balance information */
  includeBalance?: boolean;
  /** Include transaction history */
  includeHistory?: boolean;
  /** History limit */
  historyLimit?: number;
}

export interface UseAccountReturn {
  /** Account information */
  account: AccountInfo | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refresh account */
  refresh: () => Promise<void>;
  /** Transaction history */
  transactions: TransactionInfo[];
  /** Has balance info */
  hasBalance: boolean;
}

export interface UseTransactionOptions {
  /** Auto-sign transactions */
  autoSign?: boolean;
  /** Wait for inclusion */
  waitForInclusion?: boolean;
  /** Wait for finality */
  waitForFinality?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Show progress notifications */
  showProgress?: boolean;
}

export interface UseTransactionReturn {
  /** Submit transaction */
  submit: (tx: any, options?: UseTransactionOptions) => Promise<TransactionInfo>;
  /** Current transaction status */
  status: 'idle' | 'submitting' | 'pending' | 'included' | 'finalized' | 'failed';
  /** Current transaction */
  transaction: TransactionInfo | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Cancel current transaction */
  cancel: () => void;
  /** Reset state */
  reset: () => void;
}

export interface UseContractOptions {
  /** Auto-load contract */
  autoLoad?: boolean;
  /** Contract ABI (if EVM) */
  abi?: any;
  /** Contract metadata (if Substrate) */
  metadata?: any;
  /** Cache contract instance */
  cache?: boolean;
}

export interface UseContractReturn {
  /** Contract information */
  contract: ContractInfo | null;
  /** Contract instance */
  instance: any;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Call read method */
  read: (method: string, ...args: any[]) => Promise<any>;
  /** Call write method */
  write: (method: string, ...args: any[]) => Promise<TransactionInfo>;
  /** Estimate gas (EVM only) */
  estimateGas: (method: string, ...args: any[]) => Promise<string>;
  /** Get contract events */
  getEvents: (eventName?: string) => Promise<any[]>;
}

export interface UseEventsOptions {
  /** Event filters */
  filters?: {
    /** Contract address (for contract events) */
    contract?: string;
    /** Event name */
    name?: string;
    /** From block */
    fromBlock?: number;
    /** To block */
    toBlock?: number;
    /** Address filter */
    address?: string;
  };
  /** Real-time subscription */
  realTime?: boolean;
  /** Maximum events to keep */
  maxEvents?: number;
  /** Auto-purge old events */
  autoPurge?: boolean;
}

export interface UseEventsReturn {
  /** Current events */
  events: EventSubscription[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Subscribe to events */
  subscribe: (callback: (event: EventSubscription) => void) => () => void;
  /** Unsubscribe all */
  unsubscribeAll: () => void;
  /** Clear events */
  clear: () => void;
  /** Event count */
  count: number;
  /** Last event */
  lastEvent: EventSubscription | null;
}

export interface UseBlockSubscriptionOptions {
  /** Auto-subscribe on mount */
  autoSubscribe?: boolean;
  /** Include block details */
  includeDetails?: boolean;
  /** Include extrinsics */
  includeExtrinsics?: boolean;
  /** Include events */
  includeEvents?: boolean;
}

export interface UseBlockSubscriptionReturn {
  /** Current block number */
  blockNumber: number | null;
  /** Current block hash */
  blockHash: string | null;
  /** Block details */
  block: any | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Subscribe to blocks */
  subscribe: (callback: (block: any) => void) => () => void;
  /** Unsubscribe */
  unsubscribe: () => void;
  /** Is subscribed */
  isSubscribed: boolean;
  /** Block timestamp */
  timestamp: number | null;
}

/**
 * Component Props Types
 */

export interface WalletConnectorProps extends HTMLAttributes<HTMLDivElement> {
  /** Available wallet types */
  wallets?: ('metamask' | 'walletconnect' | 'subwallet' | 'talisman' | 'polkadot-js')[];
  /** onConnect callback */
  onConnect?: (account: AccountInfo) => void;
  /** onDisconnect callback */
  onDisconnect?: () => void;
  /** onError callback */
  onError?: (error: Error) => void;
  /** Show wallet list */
  showWalletList?: boolean;
  /** Custom button label */
  buttonLabel?: string;
  /** Custom button variant */
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Custom button size */
  buttonSize?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

export interface BalanceDisplayProps extends HTMLAttributes<HTMLDivElement> {
  /** Address to show balance for */
  address?: string;
  /** Show USD value */
  showUSD?: boolean;
  /** Show token symbol */
  showSymbol?: boolean;
  /** Custom decimals */
  decimals?: number;
  /** Custom formatter */
  formatter?: (balance: BalanceInfo) => string;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: Error;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

export interface TransactionButtonProps extends HTMLAttributes<HTMLButtonElement> {
  /** Transaction to execute */
  transaction: any;
  /** Transaction options */
  options?: UseTransactionOptions;
  /** Button label */
  label?: string;
  /** Loading label */
  loadingLabel?: string;
  /** Success label */
  successLabel?: string;
  /** onSuccess callback */
  onSuccess?: (tx: TransactionInfo) => void;
  /** onError callback */
  onError?: (error: Error) => void;
  /** onPending callback */
  onPending?: (tx: TransactionInfo) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

export interface ConnectionStatusProps extends HTMLAttributes<HTMLDivElement> {
  /** Custom status indicator */
  indicator?: 'dot' | 'bar' | 'text' | 'custom';
  /** Show chain name */
  showChain?: boolean;
  /** Show address */
  showAddress?: boolean;
  /** Show balance */
  showBalance?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

export interface EventListProps extends HTMLAttributes<HTMLDivElement> {
  /** Events to display */
  events?: EventData[];
  /** Max events to show */
  maxEvents?: number;
  /** Show event details */
  showDetails?: boolean;
  /** Auto-scroll to latest */
  autoScroll?: boolean;
  /** Event filter */
  filter?: (event: EventData) => boolean;
  /** Custom event renderer */
  renderEvent?: (event: EventData, index: number) => ReactNode;
  /** Empty state component */
  emptyState?: ComponentType;
  /** Loading state */
  loading?: boolean;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

/**
 * Utility Types
 */

export interface FormatterOptions {
  /** Number of decimal places */
  decimals?: number;
  /** Show commas */
  showCommas?: boolean;
  /** Abbreviate large numbers */
  abbreviate?: boolean;
  /** Custom prefix */
  prefix?: string;
  /** Custom suffix */
  suffix?: string;
  /** Currency symbol */
  currency?: string;
}

export interface ValidationRule {
  /** Rule name */
  name: string;
  /** Validation function */
  validate: (value: any) => boolean;
  /** Error message */
  message: string;
}

export interface ValidationResult {
  /** Is valid */
  isValid: boolean;
  /** Error messages */
  errors: string[];
  /** Warnings */
  warnings: string[];
}

export interface ToastOptions {
  /** Toast type */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Toast title */
  title: string;
  /** Toast message */
  message?: string;
  /** Auto-dismiss after ms */
  autoDismiss?: number;
  /** Show close button */
  closable?: boolean;
  /** Position */
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
}

export interface ErrorBoundaryState {
  /** Has error */
  hasError: boolean;
  /** Error object */
  error: Error | null;
  /** Error info */
  errorInfo: any;
}

export interface LoadingState {
  /** Is loading */
  loading: boolean;
  /** Loading message */
  message?: string;
  /** Progress percentage */
  progress?: number;
  /** Skeleton variant */
  skeleton?: 'text' | 'button' | 'card' | 'list' | 'custom';
}

/**
 * Theme and Styling Types
 */

export interface SelendraTheme {
  /** Color palette */
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    foreground: string;
    border: string;
    muted: string;
  };
  /** Typography */
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  /** Spacing */
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  /** Border radius */
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  /** Shadows */
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  /** Breakpoints */
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}

export interface ThemeProviderProps {
  /** Custom theme */
  theme?: Partial<SelendraTheme>;
  /** Children components */
  children: ReactNode;
  /** Default theme mode */
  defaultMode?: 'light' | 'dark';
  /** Enable system theme detection */
  enableSystem?: boolean;
}

/**
 * Example Template Types
 */

export interface DeFiDashboardTemplateProps {
  /** Default address */
  defaultAddress?: string;
  /** Show portfolio section */
  showPortfolio?: boolean;
  /** Show trading section */
  showTrading?: boolean;
  /** Show liquidity section */
  showLiquidity?: boolean;
  /** Show staking section */
  showStaking?: boolean;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

export interface NFTMarketplaceTemplateProps {
  /** Collection address */
  collectionAddress?: string;
  /** Show gallery view */
  showGallery?: boolean;
  /** Show list view */
  showList?: boolean;
  /** Enable filters */
  enableFilters?: boolean;
  /** Items per page */
  itemsPerPage?: number;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

export interface WalletTemplateProps {
  /** Default account */
  defaultAccount?: string;
  /** Show send functionality */
  showSend?: boolean;
  /** Show receive functionality */
  showReceive?: boolean;
  /** Show history */
  showHistory?: boolean;
  /** Show settings */
  showSettings?: boolean;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

export interface GovernanceTemplateProps {
  /** Show proposals */
  showProposals?: boolean;
  /** Show voting */
  showVoting?: boolean;
  /** Show treasury */
  showTreasury?: boolean;
  /** Show council */
  showCouncil?: boolean;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}
