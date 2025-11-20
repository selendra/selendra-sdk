/**
 * React Hooks Usage Example
 * 
 * Demonstrates how to use Selendra SDK React hooks:
 * - useStaking: Staking operations and monitoring
 * - useAleph: Consensus and validator tracking
 * - useElections: Election and committee management
 * - useGovernance: Democracy proposals and voting
 * - useUnifiedAccounts: Address conversion and unified balances
 * 
 * @example
 * ```tsx
 * import { StakingDashboard } from './examples/react-hooks-example';
 * 
 * function App() {
 *   return <StakingDashboard />;
 * }
 * ```
 */

import React, { useEffect, useState } from 'react';
import { createSDK } from '../src/sdk';
import { useStaking, useAleph, useElections, useGovernance, useUnifiedAccounts } from '../src/react/hooks-substrate';
import { Conviction } from '../src/substrate/democracy';
import type { ApiPromise } from '@polkadot/api';

// ========== Staking Dashboard Component ==========

export function StakingDashboard() {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [userAddress] = useState('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

  const {
    currentEra,
    validators,
    stakingInfo,
    loading: stakingLoading,
    error: stakingError,
    refetch: refetchStaking,
  } = useStaking(api, userAddress);

  useEffect(() => {
    createSDK({ network: 'mainnet' as any, endpoint: 'wss://rpc.selendra.org' })
      .then((sdk) => sdk.connect())
      .then((sdk) => setApi((sdk as any).substrateApi))
      .catch(console.error);
  }, []);

  if (!api) return <div>Connecting to network...</div>;
  if (stakingLoading) return <div>Loading staking data...</div>;
  if (stakingError) return <div>Error: {stakingError.message}</div>;

  return (
    <div className="staking-dashboard">
      <h1>Staking Dashboard</h1>

      <section>
        <h2>Network Overview</h2>
        <p>Current Era: {currentEra}</p>
        <p>Active Validators: {validators?.length || 0}</p>
        <button onClick={refetchStaking}>Refresh</button>
      </section>

      {stakingInfo && (
        <section>
          <h2>Your Staking Info</h2>
          <p>Total Stake: {stakingInfo.totalStake} SEL</p>
          <p>Active Stake: {stakingInfo.activeStake} SEL</p>
          <p>Own Stake: {stakingInfo.ownStake} SEL</p>
          
          {stakingInfo.nominators.length > 0 && (
            <div>
              <h3>Nominators ({stakingInfo.nominators.length})</h3>
              <ul>
                {stakingInfo.nominators.map((nominator) => (
                  <li key={nominator.address}>
                    {nominator.address}: {nominator.stake} SEL
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section>
        <h2>Top Validators</h2>
        <ul>
          {validators?.slice(0, 5).map((validator) => (
            <li key={validator}>{validator}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ========== Validator Monitor Component ==========

export function ValidatorMonitor() {
  const [api, setApi] = useState<ApiPromise | null>(null);

  const {
    currentSession,
    sessionLength,
    sessionProgress,
    activeValidators,
    loading: alephLoading,
    error: alephError,
  } = useAleph(api, { refreshInterval: 10000 });

  const {
    committeeSeats,
    nextEraValidators,
    electionOpenness,
    stats,
    loading: electionsLoading,
  } = useElections(api);

  useEffect(() => {
    createSDK({ network: 'mainnet' as any, endpoint: 'wss://rpc.selendra.org' })
      .then((sdk) => sdk.connect())
      .then((sdk) => setApi((sdk as any).substrateApi))
      .catch(console.error);
  }, []);

  if (!api) return <div>Connecting...</div>;
  if (alephLoading || electionsLoading) return <div>Loading...</div>;
  if (alephError) return <div>Error: {alephError.message}</div>;

  return (
    <div className="validator-monitor">
      <h1>Validator Monitor</h1>

      <section>
        <h2>Session Info</h2>
        <p>Session: {currentSession}</p>
        <p>Length: {sessionLength} blocks</p>
        {sessionProgress && (
          <div>
            <p>Progress: {sessionProgress.current}/{sessionProgress.total}</p>
            <progress value={sessionProgress.current} max={sessionProgress.total} />
          </div>
        )}
        <p>Active Validators: {activeValidators?.length || 0}</p>
      </section>

      <section>
        <h2>Committee</h2>
        {committeeSeats && (
          <div>
            <p>Reserved Seats: {committeeSeats.reserved}</p>
            <p>Non-Reserved: {committeeSeats.nonReserved}</p>
            <p>Non-Reserved Finality: {committeeSeats.nonReservedFinality}</p>
          </div>
        )}
        <p>Election Mode: {electionOpenness}</p>
      </section>

      {nextEraValidators && (
        <section>
          <h2>Next Era</h2>
          <p>Reserved Validators: {nextEraValidators.reserved.length}</p>
          <p>Non-Reserved Validators: {nextEraValidators.nonReserved.length}</p>
          <p>Total: {stats?.total || 0}</p>
        </section>
      )}
    </div>
  );
}

// ========== Governance Tracker Component ==========

export function GovernanceTracker() {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [signer] = useState<any>(null); // Would come from wallet integration

  const {
    referendumCount,
    activeReferenda,
    publicProposals,
    minimumDeposit,
    votingPeriod,
    loading,
    error,
    propose,
    second,
    vote,
  } = useGovernance(api);

  useEffect(() => {
    createSDK({ network: 'mainnet' as any, endpoint: 'wss://rpc.selendra.org' })
      .then((sdk) => sdk.connect())
      .then((sdk) => setApi((sdk as any).substrateApi))
      .catch(console.error);
  }, []);

  const handleVote = async (refIndex: number, aye: boolean) => {
    if (!signer) {
      alert('Please connect wallet first');
      return;
    }

    try {
      const result = await vote(
        signer,
        refIndex,
        aye,
        '1000000000000000000', // 1 SEL
        Conviction.Locked2x
      );
      alert(`Voted successfully! Block: ${result.blockHash}`);
    } catch (err) {
      alert(`Vote failed: ${err}`);
    }
  };

  if (!api) return <div>Connecting...</div>;
  if (loading) return <div>Loading governance data...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="governance-tracker">
      <h1>Governance Tracker</h1>

      <section>
        <h2>Overview</h2>
        <p>Total Referenda: {referendumCount}</p>
        <p>Minimum Deposit: {minimumDeposit} SEL</p>
        <p>Voting Period: {votingPeriod} blocks</p>
      </section>

      <section>
        <h2>Active Referenda ({activeReferenda?.length || 0})</h2>
        {activeReferenda && activeReferenda.length > 0 ? (
          <div className="referenda-list">
            {activeReferenda.map((refIndex) => (
              <div key={refIndex} className="referendum-card">
                <h3>Referendum #{refIndex}</h3>
                <div className="vote-buttons">
                  <button onClick={() => handleVote(refIndex, true)}>
                    👍 Vote Aye
                  </button>
                  <button onClick={() => handleVote(refIndex, false)}>
                    👎 Vote Nay
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No active referenda</p>
        )}
      </section>

      <section>
        <h2>Public Proposals ({publicProposals?.length || 0})</h2>
        {publicProposals && publicProposals.length > 0 ? (
          <ul>
            {publicProposals.map((proposal) => (
              <li key={proposal.index}>
                Proposal #{proposal.index} by {proposal.proposer.slice(0, 10)}...
                <button onClick={() => signer && second(signer, proposal.index)}>
                  Second
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No public proposals</p>
        )}
      </section>

      <section>
        <h2>Conviction Levels</h2>
        <table>
          <thead>
            <tr>
              <th>Conviction</th>
              <th>Multiplier</th>
              <th>Lock Period</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>None</td>
              <td>0.1x</td>
              <td>No lock</td>
            </tr>
            <tr>
              <td>Locked1x</td>
              <td>1x</td>
              <td>1 enactment</td>
            </tr>
            <tr>
              <td>Locked2x</td>
              <td>2x</td>
              <td>2 enactments</td>
            </tr>
            <tr>
              <td>Locked3x</td>
              <td>3x</td>
              <td>4 enactments</td>
            </tr>
            <tr>
              <td>Locked4x</td>
              <td>4x</td>
              <td>8 enactments</td>
            </tr>
            <tr>
              <td>Locked5x</td>
              <td>5x</td>
              <td>16 enactments</td>
            </tr>
            <tr>
              <td>Locked6x</td>
              <td>6x</td>
              <td>32 enactments</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}

// ========== Unified Accounts Component ==========

export function UnifiedAccountsDemo() {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [substrateAddress, setSubstrateAddress] = useState('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
  const [evmAddress, setEvmAddress] = useState('');

  const {
    substrateToEvm,
    evmToSubstrate,
    validateAddress,
    getUnifiedBalance,
    balance,
    loading,
    error,
  } = useUnifiedAccounts(api, substrateAddress);

  useEffect(() => {
    createSDK({ network: 'mainnet' as any, endpoint: 'wss://rpc.selendra.org' })
      .then((sdk) => sdk.connect())
      .then((sdk) => setApi((sdk as any).substrateApi))
      .catch(console.error);
  }, []);

  const handleConvert = () => {
    if (substrateAddress) {
      const converted = substrateToEvm(substrateAddress);
      setEvmAddress(converted);
    }
  };

  const handleReverseConvert = () => {
    if (evmAddress) {
      const converted = evmToSubstrate(evmAddress);
      setSubstrateAddress(converted);
    }
  };

  if (!api) return <div>Connecting...</div>;

  return (
    <div className="unified-accounts-demo">
      <h1>Unified Accounts</h1>

      <section>
        <h2>Address Conversion</h2>
        <div>
          <label>Substrate Address:</label>
          <input
            type="text"
            value={substrateAddress}
            onChange={(e) => setSubstrateAddress(e.target.value)}
            placeholder="5GrwvaEF..."
          />
          <button onClick={handleConvert}>Convert to EVM</button>
        </div>

        <div>
          <label>EVM Address:</label>
          <input
            type="text"
            value={evmAddress}
            onChange={(e) => setEvmAddress(e.target.value)}
            placeholder="0x742d35..."
          />
          <button onClick={handleReverseConvert}>Convert to Substrate</button>
        </div>
      </section>

      <section>
        <h2>Address Validation</h2>
        <div>
          <input
            type="text"
            placeholder="Enter any address"
            onChange={(e) => {
              const validation = validateAddress(e.target.value);
              console.log('Validation:', validation);
            }}
          />
        </div>
      </section>

      <section>
        <h2>Unified Balance</h2>
        {loading ? (
          <p>Loading balance...</p>
        ) : error ? (
          <p>Error: {error.message}</p>
        ) : balance ? (
          <div>
            <h3>Substrate Balances:</h3>
            <p>Free: {balance.substrate.free} SEL</p>
            <p>Reserved: {balance.substrate.reserved} SEL</p>
            <p>Frozen: {balance.substrate.frozen} SEL</p>
            
            <h3>EVM Balance:</h3>
            <p>{balance.evm} SEL</p>
            
            <h3>Total:</h3>
            <p><strong>{balance.total} SEL</strong></p>
          </div>
        ) : (
          <p>Enter a valid address to see balance</p>
        )}
      </section>
    </div>
  );
}

// ========== Complete Example App ==========

export function CompleteExampleApp() {
  const [activeTab, setActiveTab] = useState<'staking' | 'validator' | 'governance' | 'accounts'>('staking');

  return (
    <div className="app">
      <nav className="tabs">
        <button onClick={() => setActiveTab('staking')} className={activeTab === 'staking' ? 'active' : ''}>
          Staking
        </button>
        <button onClick={() => setActiveTab('validator')} className={activeTab === 'validator' ? 'active' : ''}>
          Validators
        </button>
        <button onClick={() => setActiveTab('governance')} className={activeTab === 'governance' ? 'active' : ''}>
          Governance
        </button>
        <button onClick={() => setActiveTab('accounts')} className={activeTab === 'accounts' ? 'active' : ''}>
          Accounts
        </button>
      </nav>

      <main>
        {activeTab === 'staking' && <StakingDashboard />}
        {activeTab === 'validator' && <ValidatorMonitor />}
        {activeTab === 'governance' && <GovernanceTracker />}
        {activeTab === 'accounts' && <UnifiedAccountsDemo />}
      </main>

      <style>{`
        .app {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          border-bottom: 2px solid #e0e0e0;
        }

        .tabs button {
          padding: 10px 20px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 16px;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .tabs button:hover {
          background: #f5f5f5;
        }

        .tabs button.active {
          border-bottom-color: #007bff;
          font-weight: bold;
        }

        section {
          margin-bottom: 30px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        h1 {
          margin-top: 0;
        }

        button {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        button:hover {
          background: #0056b3;
        }

        input {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 100%;
          max-width: 500px;
          margin: 5px 0;
        }

        .referendum-card {
          padding: 15px;
          background: white;
          border-radius: 6px;
          margin-bottom: 15px;
        }

        .vote-buttons {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        th {
          background: #f0f0f0;
          font-weight: bold;
        }

        progress {
          width: 100%;
          height: 20px;
        }
      `}</style>
    </div>
  );
}

export default CompleteExampleApp;
