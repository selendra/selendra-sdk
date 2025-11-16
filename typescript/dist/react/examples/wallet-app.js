"use strict";
/**
 * Wallet Application Template
 *
 * A comprehensive wallet application template featuring send/receive functionality,
 * transaction history, portfolio tracking, and advanced wallet management on Selendra.
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
exports.WalletApp = WalletApp;
exports.WalletAppApp = WalletAppApp;
const react_1 = __importStar(require("react"));
const components_1 = require("../components");
const hooks_1 = require("../hooks");
const utils_1 = require("../utils");
/**
 * Send Transaction Component
 */
function SendTransaction({ onTransactionSent }) {
    const { account } = (0, hooks_1.useSelendraSDK)();
    const balance = (0, hooks_1.useBalance)();
    const [recipient, setRecipient] = (0, react_1.useState)('');
    const [amount, setAmount] = (0, react_1.useState)('');
    const [selectedToken, setSelectedToken] = (0, react_1.useState)('SEL');
    const [memo, setMemo] = (0, react_1.useState)('');
    const [showQRScanner, setShowQRScanner] = (0, react_1.useState)(false);
    const [errors, setErrors] = (0, react_1.useState)({});
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const tokens = [
        { symbol: 'SEL', name: 'Selendra', decimals: 18 },
        { symbol: 'USDT', name: 'Tether', decimals: 6 },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6 }
    ];
    const validateForm = () => {
        const newErrors = {};
        const addressValidation = (0, utils_1.validateAddress)(recipient, 'substrate');
        if (!addressValidation.isValid) {
            newErrors.recipient = addressValidation.errors[0];
        }
        const amountValidation = (0, utils_1.validateAmount)((parseFloat(amount || '0') * Math.pow(10, 18)).toString(), balance.balance, 18);
        if (!amountValidation.isValid) {
            newErrors.amount = amountValidation.errors[0];
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSend = async () => {
        if (!validateForm())
            return;
        try {
            setIsSubmitting(true);
            // Mock transaction - in real app, this would use the SDK
            const newTx = {
                hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                type: 'send',
                from: account.address,
                to: recipient,
                amount: (parseFloat(amount) * Math.pow(10, 18)).toString(),
                symbol: selectedToken,
                timestamp: Date.now(),
                status: 'pending'
            };
            onTransactionSent(newTx);
            // Reset form
            setRecipient('');
            setAmount('');
            setMemo('');
            setErrors({});
        }
        catch (error) {
            console.error('Transaction failed:', error);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleScanQR = (address) => {
        setRecipient(address);
        setShowQRScanner(false);
    };
    const handlePasteAddress = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setRecipient(text);
        }
        catch (error) {
            console.error('Failed to read clipboard:', error);
        }
    };
    return (<div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">Send</h2>

      <div className="space-y-4">
        {/* Token Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Asset</label>
          <div className="grid grid-cols-3 gap-2">
            {tokens.map((token) => (<button key={token.symbol} onClick={() => setSelectedToken(token.symbol)} className={`p-3 border rounded-lg text-center ${selectedToken === token.symbol
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:bg-gray-50'}`}>
                <div className="font-medium">{token.symbol}</div>
                <div className="text-xs text-gray-500">{token.name}</div>
                <div className="text-xs">
                  {(0, utils_1.formatBalance)({
                balance: balance.balance?.balance || '0',
                symbol: token.symbol,
                decimals: token.decimals
            })}
                </div>
              </button>))}
          </div>
        </div>

        {/* Recipient Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address
          </label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Enter address or ENS name" className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.recipient ? 'border-red-500' : ''}`}/>
              {errors.recipient && (<p className="text-red-500 text-xs mt-1">{errors.recipient}</p>)}
            </div>
            <button onClick={() => setShowQRScanner(!showQRScanner)} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" title="Scan QR Code">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
              </svg>
            </button>
            <button onClick={handlePasteAddress} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" title="Paste Address">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.amount ? 'border-red-500' : ''}`}/>
              {errors.amount && (<p className="text-red-500 text-xs mt-1">{errors.amount}</p>)}
            </div>
            <button onClick={() => setAmount((parseFloat(balance.balance?.balance || '0') / Math.pow(10, 18) * 0.5).toString())} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Half
            </button>
            <button onClick={() => setAmount((parseFloat(balance.balance?.balance || '0') / Math.pow(10, 18)).toString())} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Max
            </button>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Available: {(0, utils_1.formatBalance)(balance.balance)}
          </div>
        </div>

        {/* Memo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Memo (Optional)
          </label>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Add a note to this transaction" rows={2} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>

        {/* Send Button */}
        <button onClick={handleSend} disabled={isSubmitting || !recipient || !amount} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
          {isSubmitting ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Scan QR Code</h3>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                </svg>
              </div>
              <p>QR code scanner would be integrated here</p>
            </div>
            <div className="flex space-x-3 mt-4">
              <button onClick={() => setShowQRScanner(false)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
/**
 * Receive Component
 */
function Receive() {
    const { account } = (0, hooks_1.useSelendraSDK)();
    const [copied, setCopied] = (0, react_1.useState)(false);
    const handleCopyAddress = async () => {
        if (!account)
            return;
        try {
            await (0, utils_1.copyToClipboard)(account.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch (error) {
            console.error('Failed to copy address:', error);
        }
    };
    const qrCodeUrl = `selendra:${account?.address}`;
    return (<div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">Receive</h2>

      <div className="space-y-6">
        {/* QR Code */}
        <div className="text-center">
          <div className="inline-block bg-white p-4 rounded-lg border-2 border-gray-200">
            <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
              <div className="text-gray-500 text-center">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                </svg>
                <p>QR Code</p>
                <p className="text-xs">{account?.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Address
          </label>
          <div className="flex space-x-2">
            <input type="text" value={account?.address || ''} readOnly className="flex-1 px-3 py-2 border bg-gray-50 rounded-lg font-mono text-sm"/>
            <button onClick={handleCopyAddress} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Share Options */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Share</h3>
          <div className="flex space-x-2">
            <button className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Share via Email
            </button>
            <button className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Share via SMS
            </button>
          </div>
        </div>
      </div>
    </div>);
}
/**
 * Transaction History Component
 */
function TransactionHistory() {
    const [transactions, setTransactions] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [filter, setFilter] = (0, react_1.useState)('all');
    (0, react_1.useEffect)(() => {
        const loadTransactions = async () => {
            try {
                setIsLoading(true);
                // Mock transaction data - in real app, this would come from the blockchain
                const mockTransactions = Array.from({ length: 20 }, (_, i) => ({
                    hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                    type: ['send', 'receive', 'contract'][Math.floor(Math.random() * 3)],
                    from: `0x${Math.random().toString(16).substr(2, 40)}`,
                    to: `0x${Math.random().toString(16).substr(2, 40)}`,
                    amount: (Math.random() * 1000).toString(),
                    symbol: 'SEL',
                    timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
                    status: ['pending', 'included', 'finalized', 'failed'][Math.floor(Math.random() * 4)],
                    blockNumber: Math.floor(Math.random() * 1000000),
                    gasUsed: (Math.random() * 100000).toString(),
                    gasPrice: (Math.random() * 100).toString()
                }));
                setTransactions(mockTransactions);
            }
            catch (error) {
                console.error('Failed to load transactions:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadTransactions();
    }, []);
    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'all')
            return true;
        if (filter === 'sent')
            return tx.type === 'send';
        if (filter === 'received')
            return tx.type === 'receive';
        if (filter === 'pending')
            return tx.status === 'pending';
        return true;
    });
    const getTransactionIcon = (type) => {
        switch (type) {
            case 'send':
                return (<svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>);
            case 'receive':
                return (<svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18"/>
          </svg>);
            case 'contract':
                return (<svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>);
            default:
                return null;
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'text-yellow-500';
            case 'included': return 'text-blue-500';
            case 'finalized': return 'text-green-500';
            case 'failed': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };
    if (isLoading) {
        return <components_1.LoadingSkeleton variant="list" lines={10}/>;
    }
    return (<div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Transaction History</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All</option>
          <option value="sent">Sent</option>
          <option value="received">Received</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {filteredTransactions.length === 0 ? (<div className="text-center py-8 text-gray-500">
          No transactions found
        </div>) : (<div className="space-y-3">
          {filteredTransactions.map((tx) => (<div key={tx.hash} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              {getTransactionIcon(tx.type)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {tx.type === 'send' ? 'Sent' : tx.type === 'receive' ? 'Received' : 'Contract'} {tx.symbol}
                  </div>
                  <div className={`text-sm ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {(0, utils_1.formatTimestamp)(tx.timestamp, { relative: true })}
                </div>
                <div className="text-sm font-mono text-gray-600">
                  {(0, utils_1.formatAddress)(tx.type === 'send' ? tx.to : tx.from, 8)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {tx.type === 'send' ? '-' : '+'}
                  {(0, utils_1.formatBalance)({ balance: tx.amount, symbol: tx.symbol, decimals: 18 })}
                </div>
                <button onClick={() => window.open((0, utils_1.getExplorerUrl)('substrate', tx.hash), '_blank')} className="text-xs text-blue-600 hover:text-blue-800">
                  View on Explorer
                </button>
              </div>
            </div>))}
        </div>)}
    </div>);
}
/**
 * Portfolio Overview Component
 */
function PortfolioOverview() {
    const { account } = (0, hooks_1.useSelendraSDK)();
    const balance = (0, hooks_1.useBalance)();
    const [tokens, setTokens] = (0, react_1.useState)([]);
    const [totalValue, setTotalValue] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        const loadTokens = async () => {
            // Mock token data
            const mockTokens = [
                {
                    symbol: 'SEL',
                    name: 'Selendra',
                    balance: balance.balance?.balance || '0',
                    decimals: 18,
                    priceUSD: 1.50
                },
                {
                    symbol: 'USDT',
                    name: 'Tether',
                    balance: '500000000',
                    decimals: 6,
                    priceUSD: 1.00
                },
                {
                    symbol: 'USDC',
                    name: 'USD Coin',
                    balance: '750000000',
                    decimals: 6,
                    priceUSD: 1.00
                }
            ];
            setTokens(mockTokens);
            const total = mockTokens.reduce((sum, token) => {
                if (token.priceUSD) {
                    return sum + (parseFloat(token.balance) / Math.pow(10, token.decimals)) * token.priceUSD;
                }
                return sum;
            }, 0);
            setTotalValue(total);
        };
        loadTokens();
    }, [balance]);
    return (<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-600">Total Balance</h3>
          <span className="text-2xl">💰</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          ${totalValue.toFixed(2)}
        </div>
        <div className="text-sm text-green-600">
          +12.5% (24h)
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-600">SEL Balance</h3>
          <span className="text-2xl">🔷</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {(0, utils_1.formatBalance)(balance.balance)}
        </div>
        <div className="text-sm text-gray-600">
          ${(parseFloat(balance.balance?.balance || '0') / Math.pow(10, 18) * 1.50).toFixed(2)}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-600">Wallet Address</h3>
          <span className="text-2xl">👛</span>
        </div>
        <div className="text-sm font-mono text-gray-900">
          {(0, utils_1.formatAddress)(account?.address || '', 10)}
        </div>
        <button onClick={() => (0, utils_1.copyToClipboard)(account?.address || '')} className="text-sm text-blue-600 hover:text-blue-800">
          Copy Address
        </button>
      </div>
    </div>);
}
/**
 * Main Wallet App Component
 */
function WalletApp({ defaultAccount, showSend = true, showReceive = true, showHistory = true, showSettings = true, className, style }) {
    const { isConnected, account } = (0, hooks_1.useSelendraSDK)();
    const [activeTab, setActiveTab] = (0, react_1.useState)('overview');
    const [transactions, setTransactions] = (0, react_1.useState)([]);
    const handleTransactionSent = (tx) => {
        setTransactions(prev => [tx, ...prev]);
        setActiveTab('history');
    };
    if (!isConnected) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Selendra Wallet</h1>
          <p className="text-center text-gray-600 mb-8">
            Connect your wallet to access the Selenda wallet application
          </p>
          <div className="flex justify-center">
            <components_1.WalletConnector buttonLabel="Connect Wallet" variant="primary" size="lg"/>
          </div>
        </div>
      </div>);
    }
    const tabs = [
        { id: 'overview', label: 'Overview', icon: '🏠' },
        ...(showSend ? [{ id: 'send', label: 'Send', icon: '💸' }] : []),
        ...(showReceive ? [{ id: 'receive', label: 'Receive', icon: '📥' }] : []),
        ...(showHistory ? [{ id: 'history', label: 'History', icon: '📊' }] : []),
        ...(showSettings ? [{ id: 'settings', label: 'Settings', icon: '⚙️' }] : [])
    ];
    return (<div className={`min-h-screen bg-gray-50 ${className || ''}`} style={style}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Selendra Wallet</h1>
            </div>
            <div className="flex items-center space-x-4">
              <components_1.ConnectionStatus compact/>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (<div>
            <PortfolioOverview />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  {showSend && (<button onClick={() => setActiveTab('send')} className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                      <div className="text-2xl mb-2">💸</div>
                      <div className="font-medium">Send</div>
                    </button>)}
                  {showReceive && (<button onClick={() => setActiveTab('receive')} className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100">
                      <div className="text-2xl mb-2">📥</div>
                      <div className="font-medium">Receive</div>
                    </button>)}
                </div>
              </div>
              {showHistory && (<div>
                  <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                  <TransactionHistory />
                </div>)}
            </div>
          </div>)}

        {activeTab === 'send' && <SendTransaction onTransactionSent={handleTransactionSent}/>}
        {activeTab === 'receive' && <Receive />}
        {activeTab === 'history' && <TransactionHistory />}
        {activeTab === 'settings' && (<div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Dark Mode</div>
                  <div className="text-sm text-gray-500">Toggle dark theme</div>
                </div>
                <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                </button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Notifications</div>
                  <div className="text-sm text-gray-500">Receive transaction notifications</div>
                </div>
                <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                </button>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="font-medium mb-2">Currency</div>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                </select>
              </div>
            </div>
          </div>)}
      </main>
    </div>);
}
/**
 * Complete Wallet App with Providers
 */
function WalletAppApp(props) {
    return (<components_1.ErrorBoundary>
      <components_1.ThemeProvider>
        <components_1.SelendraProvider initialConfig={{
            chainType: 'substrate',
            endpoint: 'wss://rpc.selendra.org'
        }} autoConnect={false}>
          <WalletApp {...props}/>
        </components_1.SelendraProvider>
      </components_1.ThemeProvider>
    </components_1.ErrorBoundary>);
}
exports.default = WalletAppApp;
//# sourceMappingURL=wallet-app.js.map