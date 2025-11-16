import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useTransaction } from '@selendrajs/sdk/react';
import { useSwap } from '../../hooks/useSwap';
import { useTokens } from '../../hooks/useTokens';
import { TokenSelector } from './TokenSelector';
import { TradeDetails } from './TradeDetails';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { formatAmount, parseAmount } from '../../utils/formatters';
import { validateAmount } from '../../utils/validation';
import { Loader2, ArrowDownUp, Settings } from 'lucide-react';

interface SwapFormProps {
  onSwapComplete?: (txHash: string) => void;
}

export const SwapForm: React.FC<SwapFormProps> = ({ onSwapComplete }) => {
  const { account, isConnected } = useAccount();
  const { send, isLoading: isTxLoading } = useTransaction();
  const { tokens, searchTokens } = useTokens();

  const {
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    loading,
    error,
    priceImpact,
    bestRoute,
    setTokenIn,
    setTokenOut,
    setAmountIn,
    setAmountOut,
    executeSwap,
    refreshQuote
  } = useSwap();

  const [showSettings, setShowSettings] = useState(false);
  const [showTokenSelector, setShowTokenSelector] = useState<'from' | 'to' | null>(null);
  const [settings, setSettings] = useState({
    slippage: 0.5,
    deadline: 20, // minutes
    autoRouter: true
  });

  // Handle input changes
  const handleAmountInChange = useCallback(async (value: string) => {
    setAmountIn(value);
    if (value && tokenIn && tokenOut) {
      await refreshQuote(value, tokenIn, tokenOut);
    } else {
      setAmountOut('');
    }
  }, [setAmountIn, setAmountOut, tokenIn, tokenOut, refreshQuote]);

  const handleAmountOutChange = useCallback(async (value: string) => {
    setAmountOut(value);
    if (value && tokenIn && tokenOut) {
      // Calculate input amount based on output
      // This would be implemented in the swap hook
    } else {
      setAmountIn('');
    }
  }, [setAmountIn, setAmountOut, tokenIn, tokenOut]);

  // Handle token selection
  const handleTokenSelect = (token: any, type: 'from' | 'to') => {
    if (type === 'from') {
      setTokenIn(token);
    } else {
      setTokenOut(token);
    }
    setShowTokenSelector(null);
  };

  // Swap tokens direction
  const handleSwapDirection = () => {
    const newTokenIn = tokenOut;
    const newTokenOut = tokenIn;
    const newAmountIn = amountOut;
    const newAmountOut = amountIn;

    setTokenIn(newTokenIn);
    setTokenOut(newTokenOut);
    setAmountIn(newAmountIn);
    setAmountOut(newAmountOut);

    // Refresh quote with new tokens
    if (newAmountIn && newTokenIn && newTokenOut) {
      refreshQuote(newAmountIn, newTokenIn, newTokenOut);
    }
  };

  // Execute swap
  const handleSwap = async () => {
    if (!account || !tokenIn || !tokenOut || !amountIn) return;

    try {
      const tx = await executeSwap(settings.slippage);

      if (onSwapComplete) {
        onSwapComplete(tx.hash);
      }

      // Reset form
      setAmountIn('');
      setAmountOut('');
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  // Validate swap
  const canSwap = isConnected &&
                 tokenIn &&
                 tokenOut &&
                 amountIn &&
                 amountOut &&
                 !loading &&
                 !isTxLoading &&
                 validateAmount(amountIn, tokenIn.balance, tokenIn.decimals) === null;

  // Search tokens
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (searchQuery) {
      const results = searchTokens(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults(tokens.slice(0, 10)); // Show first 10 tokens
    }
  }, [searchQuery, tokens, searchTokens]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Swap</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slippage Tolerance (%)
              </label>
              <Input
                type="number"
                value={settings.slippage}
                onChange={(value) => setSettings({ ...settings, slippage: parseFloat(value) || 0 })}
                min="0"
                max="50"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Deadline (min)
              </label>
              <Input
                type="number"
                value={settings.deadline}
                onChange={(value) => setSettings({ ...settings, deadline: parseInt(value) || 20 })}
                min="1"
                max="60"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.autoRouter}
                onChange={(e) => setSettings({ ...settings, autoRouter: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Auto Router (Best Price)</span>
            </label>
          </div>
        </div>
      )}

      {/* Swap Form */}
      <div className="space-y-4">
        {/* From Token */}
        <div className="relative">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">You sell</span>
              {tokenIn && (
                <span className="text-sm text-gray-600">
                  Balance: {formatAmount(tokenIn.balance, tokenIn.decimals)}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <Input
                  type="number"
                  value={amountIn}
                  onChange={handleAmountInChange}
                  placeholder="0.00"
                  disabled={loading}
                  className="text-2xl font-semibold"
                />
              </div>
              <button
                onClick={() => setShowTokenSelector('from')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {tokenIn ? (
                  <>
                    <img
                      src={tokenIn.logoURI}
                      alt={tokenIn.symbol}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="font-medium">{tokenIn.symbol}</span>
                  </>
                ) : (
                  <span className="text-gray-600">Select token</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center -my-2">
          <button
            onClick={handleSwapDirection}
            className="p-2 bg-white border-2 border-gray-200 rounded-full hover:border-gray-300 transition-colors"
            disabled={!tokenIn || !tokenOut}
          >
            <ArrowDownUp className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* To Token */}
        <div className="relative">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">You buy</span>
              {tokenOut && (
                <span className="text-sm text-gray-600">
                  Balance: {formatAmount(tokenOut.balance, tokenOut.decimals)}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <Input
                  type="number"
                  value={amountOut}
                  onChange={handleAmountOutChange}
                  placeholder="0.00"
                  disabled={loading}
                  className="text-2xl font-semibold"
                />
              </div>
              <button
                onClick={() => setShowTokenSelector('to')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {tokenOut ? (
                  <>
                    <img
                      src={tokenOut.logoURI}
                      alt={tokenOut.symbol}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="font-medium">{tokenOut.symbol}</span>
                  </>
                ) : (
                  <span className="text-gray-600">Select token</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Trade Details */}
        {tokenIn && tokenOut && amountIn && amountOut && (
          <TradeDetails
            tokenIn={tokenIn}
            tokenOut={tokenOut}
            amountIn={parseAmount(amountIn, tokenIn.decimals)}
            amountOut={parseAmount(amountOut, tokenOut.decimals)}
            priceImpact={priceImpact}
            route={bestRoute}
            loading={loading}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Swap Button */}
        {!isConnected ? (
          <Button
            onClick={() => {/* Connect wallet logic */}}
            className="w-full"
            variant="primary"
          >
            Connect Wallet
          </Button>
        ) : (
          <Button
            onClick={handleSwap}
            disabled={!canSwap}
            loading={isTxLoading}
            className="w-full"
            variant="primary"
          >
            {isTxLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Swapping...
              </>
            ) : (
              'Swap'
            )}
          </Button>
        )}
      </div>

      {/* Token Selector Modal */}
      {showTokenSelector && (
        <TokenSelector
          tokens={searchResults}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onSelect={(token) => handleTokenSelect(token, showTokenSelector)}
          onClose={() => {
            setShowTokenSelector(null);
            setSearchQuery('');
          }}
          selectedToken={showTokenSelector === 'from' ? tokenIn : tokenOut}
        />
      )}
    </div>
  );
};