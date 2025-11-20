import React, { useState } from 'react';
import { SelendraProvider, SelendraSDK } from '@selendrajs/sdk/react';
import { AccountManager } from './components/AccountManager';
import { BalanceDisplay } from './components/BalanceDisplay';
import { TransferForm } from './components/TransferForm';
import { TransactionHistory } from './components/TransactionHistory';
import { NetworkSelector } from './components/NetworkSelector';
import { useAccount } from './selendra-sdk/react';

const sdk = new SelendraSDK({
  network: 'testnet',
  wsEndpoint: 'wss://testnet-rpc.selendra.org',
  autoConnect: true
});

function WalletApp() {
  const { account, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'history'>('overview');

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Selendra Wallet
          </h1>
          <AccountManager />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              Selendra Wallet
            </h1>
            <div className="flex items-center space-x-4">
              <NetworkSelector />
              <AccountManager />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Account Balance
          </h2>
          <BalanceDisplay />
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'send', label: 'Send' },
                { id: 'history', label: 'History' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab('send')}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Send Tokens
                    </button>
                    <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                      Receive Tokens
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Activity
                  </h3>
                  <TransactionHistory limit={5} compact />
                </div>
              </div>
            )}

            {activeTab === 'send' && <TransferForm />}

            {activeTab === 'history' && <TransactionHistory />}
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <SelendraProvider sdk={sdk}>
      <WalletApp />
    </SelendraProvider>
  );
}

export default App;