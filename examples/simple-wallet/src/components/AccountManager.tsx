import React, { useState } from 'react';
import { useAccount } from '@selendrajs/sdk/react';
import { validateAddress } from '../utils/validation';

export const AccountManager: React.FC = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState({
    mnemonic: '',
    privateKey: '',
    name: ''
  });

  const {
    account,
    accounts,
    isConnected,
    connect,
    disconnect,
    createAccount,
    importAccountFromMnemonic,
    importAccountFromPrivateKey
  } = useAccount();

  const handleCreateAccount = async () => {
    try {
      await createAccount({
        name: `Account ${accounts.length + 1}`,
        type: 'both'
      });
      setShowCreate(false);
    } catch (error) {
      console.error('Failed to create account:', error);
      alert('Failed to create account. Please try again.');
    }
  };

  const handleImportMnemonic = async () => {
    if (!importData.mnemonic.trim()) {
      alert('Please enter a valid mnemonic phrase');
      return;
    }

    try {
      await importAccountFromMnemonic(importData.mnemonic.trim(), {
        name: importData.name || `Imported Account ${accounts.length + 1}`,
        type: 'both'
      });
      setImportData({ mnemonic: '', privateKey: '', name: '' });
      setShowImport(false);
    } catch (error) {
      console.error('Failed to import account:', error);
      alert('Failed to import account. Please check your mnemonic and try again.');
    }
  };

  const handleImportPrivateKey = async () => {
    if (!importData.privateKey.trim() || !validateAddress(importData.privateKey)) {
      alert('Please enter a valid private key');
      return;
    }

    try {
      await importAccountFromPrivateKey(importData.privateKey.trim(), {
        name: importData.name || `Imported Account ${accounts.length + 1}`,
        type: 'both'
      });
      setImportData({ mnemonic: '', privateKey: '', name: '' });
      setShowImport(false);
    } catch (error) {
      console.error('Failed to import account:', error);
      alert('Failed to import account. Please check your private key and try again.');
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowCreate(true)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Create New Wallet
        </button>

        <button
          onClick={() => setShowImport(true)}
          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Import Existing Wallet
        </button>

        {/* Create Account Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Create New Wallet</h3>
              <p className="text-gray-600 mb-6">
                This will generate a new wallet with a unique recovery phrase.
                Save this phrase securely as it's the only way to restore your wallet.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAccount}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Wallet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Account Modal */}
        {showImport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Import Wallet</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name (Optional)
                </label>
                <input
                  type="text"
                  value={importData.name}
                  onChange={(e) => setImportData({ ...importData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My Wallet"
                />
              </div>

              <div className="mb-6">
                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={() => setImportData({ ...importData, privateKey: '' })}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                      !importData.privateKey
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Recovery Phrase
                  </button>
                  <button
                    onClick={() => setImportData({ ...importData, mnemonic: '' })}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                      importData.privateKey
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Private Key
                  </button>
                </div>

                {!importData.privateKey ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recovery Phrase (12 or 24 words)
                    </label>
                    <textarea
                      value={importData.mnemonic}
                      onChange={(e) => setImportData({ ...importData, mnemonic: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="word1 word2 word3 ..."
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Private Key
                    </label>
                    <input
                      type="password"
                      value={importData.privateKey}
                      onChange={(e) => setImportData({ ...importData, privateKey: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0x..."
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowImport(false);
                    setImportData({ mnemonic: '', privateKey: '', name: '' });
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={!importData.privateKey ? handleImportMnemonic : handleImportPrivateKey}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Import Wallet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="text-sm text-gray-600">
        {account?.name && <span className="font-medium">{account.name}</span>}
        <div className="text-xs text-gray-500">
          {account?.address.slice(0, 8)}...{account?.address.slice(-8)}
        </div>
      </div>

      {accounts.length > 1 && (
        <select
          value={account?.address}
          onChange={(e) => {
            // Switch account logic would go here
            console.log('Switch to account:', e.target.value);
          }}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          {accounts.map((acc) => (
            <option key={acc.address} value={acc.address}>
              {acc.name || acc.address.slice(0, 8)}
            </option>
          ))}
        </select>
      )}

      <button
        onClick={disconnect}
        className="text-sm bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
};