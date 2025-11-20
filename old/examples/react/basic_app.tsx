/**
 * Basic React application example for the Selendra SDK
 *
 * This example demonstrates how to use the Selendra SDK with React
 * to create a simple wallet interface.
 */

import React, { useState, useEffect } from 'react';
import { SelendraProvider, useSelendra, Network } from '@selendrajs/sdk/react';

function App() {
  return (
    <SelendraProvider endpoint="wss://rpc.selendra.org" network={Network.Selendra}>
      <WalletApp />
    </SelendraProvider>
  );
}

function WalletApp() {
  const { sdk, isConnected, isLoading } = useSelendra();
  const [account, setAccount] = useState<any>(null);
  const [balance, setBalance] = useState<string>('0');
  const [chainInfo, setChainInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && sdk) {
      initializeWallet();
    }
  }, [isConnected, sdk]);

  const initializeWallet = async () => {
    try {
      // Get chain info
      const info = await sdk.chainInfo();
      setChainInfo(info);
    } catch (err) {
      setError('Failed to fetch chain info');
    }
  };

  const createWallet = async () => {
    if (!sdk) return;

    try {
      const newAccount = sdk.createAccount();
      setAccount(newAccount);

      // Get account balance
      const accountBalance = await sdk.getBalance(newAccount.address);
      setBalance(accountBalance.toString());
    } catch (err) {
      setError('Failed to create wallet');
    }
  };

  const refreshBalance = async () => {
    if (!sdk || !account) return;

    try {
      const accountBalance = await sdk.getBalance(account.address);
      setBalance(accountBalance.toString());
    } catch (err) {
      setError('Failed to fetch balance');
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <h1>Loading Selendra SDK...</h1>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="error">
        <h1>Failed to connect to Selendra network</h1>
        <p>Please check your connection and try again.</p>
      </div>
    );
  }

  return (
    <div className="wallet-app">
      <h1>Selendra SDK - React Example</h1>

      {error && <div className="error-message">{error}</div>}

      {chainInfo && (
        <div className="chain-info">
          <h2>Network Information</h2>
          <p>Chain: {chainInfo.name}</p>
          <p>Version: {chainInfo.version}</p>
          <p>Chain ID: {chainInfo.chainId}</p>
        </div>
      )}

      <div className="wallet-section">
        <h2>Wallet</h2>
        {!account ? (
          <button onClick={createWallet}>Create New Wallet</button>
        ) : (
          <div className="wallet-details">
            <p><strong>Address:</strong> {account.address}</p>
            <p><strong>Balance:</strong> {balance} SEL</p>
            <button onClick={refreshBalance}>Refresh Balance</button>
          </div>
        )}
      </div>

      <style jsx>{`
        .wallet-app {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        .loading, .error {
          text-align: center;
          padding: 40px;
        }

        .chain-info, .wallet-section {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }

        .error-message {
          background: #fee;
          color: #c00;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }

        .wallet-details {
          background: #fff;
          padding: 15px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }

        button {
          background: #0070f3;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }

        button:hover {
          background: #0051cc;
        }

        p {
          margin: 10px 0;
          word-break: break-all;
        }
      `}</style>
    </div>
  );
}

export default App;