/**
 * Governance dApp Template
 *
 * A comprehensive governance application template featuring proposal system,
 voting interface, treasury management, and council oversight on Selendra.
 *
 * @author Selendra Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  SelendraProvider,
  ThemeProvider,
  WalletConnector,
  BalanceDisplay,
  ConnectionStatus,
  TransactionButton,
  LoadingSkeleton,
  ErrorBoundary
} from '../components';
import {
  useSelendraSDK,
  useBalance,
  useAccount,
  useTransaction
} from '../hooks';
import {
  formatBalance,
  formatTimestamp,
  formatAddress,
  formatTxHash,
  getExplorerUrl,
  copyToClipboard,
  truncateString
} from '../utils';
import { GovernanceTemplateProps } from '../types';

interface Proposal {
  id: string;
  title: string;
  description: string;
  type: 'treasury' | 'council' | 'democracy' | 'technical';
  author: string;
  status: 'active' | 'pending' | 'executed' | 'rejected' | 'expired';
  createdAt: number;
  endsAt: number;
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  totalVotingPower: string;
  threshold: string;
  content: any;
  executionBlock?: number;
}

interface CouncilMember {
  address: string;
  name?: string;
  votingPower: string;
  lastVote?: number;
}

interface TreasuryProposal {
  id: string;
  beneficiary: string;
  amount: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  proposedAt: number;
  proposedBy: string;
}

interface Vote {
  proposalId: string;
  voter: string;
  decision: 'aye' | 'nay' | 'abstain';
  conviction?: number;
  timestamp: number;
  votingPower: string;
}

/**
 * Proposal Card Component
 */
function ProposalCard({ proposal, onVote }: {
  proposal: Proposal;
  onVote: (proposalId: string, vote: 'aye' | 'nay' | 'abstain') => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedVote, setSelectedVote] = useState<'aye' | 'nay' | 'abstain' | null>(null);

  const totalVotes = parseFloat(proposal.votesFor) + parseFloat(proposal.votesAgainst) + parseFloat(proposal.votesAbstain);
  const votesForPercent = totalVotes > 0 ? (parseFloat(proposal.votesFor) / totalVotes) * 100 : 0;
  const votesAgainstPercent = totalVotes > 0 ? (parseFloat(proposal.votesAgainst) / totalVotes) * 100 : 0;
  const votesAbstainPercent = totalVotes > 0 ? (parseFloat(proposal.votesAbstain) / totalVotes) * 100 : 0;

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'executed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: Proposal['type']) => {
    switch (type) {
      case 'treasury': return '💰';
      case 'council': return '🏛️';
      case 'democracy': return '🗳️';
      case 'technical': return '⚙️';
      default: return '📋';
    }
  };

  const handleVote = () => {
    if (selectedVote) {
      onVote(proposal.id, selectedVote);
      setHasVoted(true);
    }
  };

  const timeRemaining = proposal.endsAt - Date.now();
  const isExpired = timeRemaining <= 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{getTypeIcon(proposal.type)}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                {proposal.status}
              </span>
              <span className="text-sm text-gray-500">#{proposal.id}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {proposal.title}
            </h3>
            <p className="text-gray-600 text-sm">
              {isExpanded ? proposal.description : truncateString(proposal.description, 200)}
            </p>
            {proposal.description.length > 200 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 hover:text-blue-800 text-sm mt-1"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>

        {/* Voting Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>For: {formatBalance({ balance: proposal.votesFor, decimals: 18, symbol: 'SEL' } as any)}</span>
            <span>Against: {formatBalance({ balance: proposal.votesAgainst, decimals: 18, symbol: 'SEL' } as any)}</span>
            <span>Abstain: {formatBalance({ balance: proposal.votesAbstain, decimals: 18, symbol: 'SEL' } as any)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 flex">
            <div
              className="bg-green-500 h-2 rounded-l-full"
              style={{ width: `${votesForPercent}%` }}
            />
            <div
              className="bg-red-500 h-2"
              style={{ width: `${votesAgainstPercent}%` }}
            />
            <div
              className="bg-gray-400 h-2 rounded-r-full"
              style={{ width: `${votesAbstainPercent}%` }}
            />
          </div>
        </div>

        {/* Time Remaining */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          <span>Created by {formatAddress(proposal.author, 6)}</span>
          {!isExpired ? (
            <span className="text-yellow-600">
              Ends in {formatTimestamp(proposal.endsAt, { relative: true })}
            </span>
          ) : (
            <span className="text-red-600">Voting ended</span>
          )}
        </div>

        {/* Voting Interface */}
        {proposal.status === 'active' && !isExpired && !hasVoted && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Cast Your Vote</h4>
            <div className="flex space-x-2 mb-3">
              <button
                onClick={() => setSelectedVote('aye')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 ${
                  selectedVote === 'aye'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                👍 For
              </button>
              <button
                onClick={() => setSelectedVote('nay')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 ${
                  selectedVote === 'nay'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:border-red-300'
                }`}
              >
                👎 Against
              </button>
              <button
                onClick={() => setSelectedVote('abstain')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 ${
                  selectedVote === 'abstain'
                    ? 'border-gray-500 bg-gray-50 text-gray-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                🤷 Abstain
              </button>
            </div>
            <button
              onClick={handleVote}
              disabled={!selectedVote}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Submit Vote
            </button>
          </div>
        )}

        {hasVoted && (
          <div className="border-t pt-4">
            <div className="text-center text-green-600 font-medium">
              ✓ You have voted on this proposal
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4 mt-4">
          <span>Threshold: {formatBalance({ balance: proposal.threshold, decimals: 18, symbol: 'SEL' } as any)}</span>
          <button
            onClick={() => window.open(getExplorerUrl('substrate', proposal.id), '_blank')}
            className="text-blue-600 hover:text-blue-800"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Create Proposal Component
 */
function CreateProposal({ onProposalCreated }: {
  onProposalCreated: (proposal: Proposal) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Proposal['type']>('council');
  const [amount, setAmount] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Mock proposal creation - in real app, this would use the SDK
      const newProposal: Proposal = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        description,
        type,
        author: '0x1234567890abcdef', // This would be the connected account
        status: 'pending',
        createdAt: Date.now(),
        endsAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        votesFor: '0',
        votesAgainst: '0',
        votesAbstain: '0',
        totalVotingPower: '1000000000000000000000',
        threshold: '500000000000000000000',
        content: {
          amount,
          beneficiary
        }
      };

      onProposalCreated(newProposal);

      // Reset form
      setTitle('');
      setDescription('');
      setType('council');
      setAmount('');
      setBeneficiary('');
    } catch (error) {
      console.error('Failed to create proposal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">Create Proposal</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proposal Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Proposal['type'])}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="council">Council Motion</option>
            <option value="treasury">Treasury Proposal</option>
            <option value="democracy">Democracy Referendum</option>
            <option value="technical">Technical Committee</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description of your proposal"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Detailed explanation of your proposal"
          />
        </div>

        {type === 'treasury' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (SEL)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                step="0.001"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beneficiary Address
              </label>
              <input
                type="text"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
              />
            </div>
          </>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => {
              setTitle('');
              setDescription('');
              setAmount('');
              setBeneficiary('');
            }}
            className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title || !description}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Proposal'}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Council Overview Component
 */
function CouncilOverview() {
  const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCouncilMembers = async () => {
      try {
        setIsLoading(true);

        // Mock council data - in real app, this would come from the blockchain
        const mockCouncil: CouncilMember[] = [
          {
            address: '0x1234567890abcdef1234567890abcdef12345678',
            name: 'Validator Alpha',
            votingPower: '150000000000000000000',
            lastVote: Date.now() - 2 * 24 * 60 * 60 * 1000
          },
          {
            address: '0x2345678901bcdef1234567890bcdef1234567890',
            name: 'Validator Beta',
            votingPower: '120000000000000000000',
            lastVote: Date.now() - 1 * 24 * 60 * 60 * 1000
          },
          {
            address: '0x3456789012cdef1234567890cdef123456789012',
            votingPower: '100000000000000000000'
          }
        ];

        setCouncilMembers(mockCouncil);
      } catch (error) {
        console.error('Failed to load council members:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCouncilMembers();
  }, []);

  if (isLoading) {
    return <LoadingSkeleton variant="list" lines={5} />;
  }

  const totalVotingPower = councilMembers.reduce(
    (sum, member) => sum + parseFloat(member.votingPower),
    0
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">Council Members</h2>

      <div className="mb-6">
        <div className="text-lg font-semibold text-gray-900">
          {councilMembers.length} Active Members
        </div>
        <div className="text-sm text-gray-600">
          Total Voting Power: {formatBalance({ balance: totalVotingPower.toString(), decimals: 18, symbol: 'SEL' } as any)}
        </div>
      </div>

      <div className="space-y-4">
        {councilMembers.map((member, index) => (
          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">
                  {member.name?.[0] || formatAddress(member.address, 2)[0]}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {member.name || formatAddress(member.address, 8)}
                </div>
                <div className="text-sm text-gray-500">
                  Voting Power: {formatBalance({ balance: member.votingPower, decimals: 18, symbol: 'SEL' } as any)}
                </div>
              </div>
            </div>
            <div className="text-right">
              {member.lastVote && (
                <div className="text-sm text-gray-500">
                  Last vote: {formatTimestamp(member.lastVote, { relative: true })}
                </div>
              )}
              <div className="text-sm font-medium text-blue-600">
                {((parseFloat(member.votingPower) / totalVotingPower) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Treasury Overview Component
 */
function TreasuryOverview() {
  const [treasuryBalance, setTreasuryBalance] = useState('0');
  const [proposals, setProposals] = useState<TreasuryProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTreasuryData = async () => {
      try {
        setIsLoading(true);

        // Mock treasury data - in real app, this would come from the blockchain
        const mockProposals: TreasuryProposal[] = [
          {
            id: '1',
            beneficiary: '0x1234567890abcdef1234567890abcdef12345678',
            amount: '500000000000000000000',
            reason: 'Community event funding',
            status: 'pending',
            proposedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
            proposedBy: '0x2345678901bcdef1234567890bcdef1234567890'
          },
          {
            id: '2',
            beneficiary: '0x3456789012cdef1234567890cdef123456789012',
            amount: '1000000000000000000000',
            reason: 'Development grant',
            status: 'approved',
            proposedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
            proposedBy: '0x4567890123def0123456789012def01234567890'
          }
        ];

        setTreasuryBalance('25000000000000000000000'); // 25,000 SEL
        setProposals(mockProposals);
      } catch (error) {
        console.error('Failed to load treasury data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTreasuryData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="list" lines={3} />
      </div>
    );
  }

  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const approvedProposals = proposals.filter(p => p.status === 'approved');
  const totalRequested = proposals.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">Treasury</h2>

      {/* Treasury Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {formatBalance({ balance: treasuryBalance, decimals: 18, symbol: 'SEL' } as any)}
          </div>
          <div className="text-sm text-gray-600">Current Balance</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{pendingProposals.length}</div>
          <div className="text-sm text-gray-600">Pending Proposals</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {formatBalance({ balance: totalRequested.toString(), decimals: 18, symbol: 'SEL' } as any)}
          </div>
          <div className="text-sm text-gray-600">Total Requested</div>
        </div>
      </div>

      {/* Recent Proposals */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Proposals</h3>
        <div className="space-y-3">
          {proposals.slice(0, 5).map((proposal) => (
            <div key={proposal.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">
                  {proposal.reason}
                </div>
                <div className="text-sm text-gray-500">
                  To: {formatAddress(proposal.beneficiary, 6)}
                </div>
                <div className="text-sm text-gray-500">
                  Proposed by {formatAddress(proposal.proposedBy, 6)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">
                  {formatBalance({ balance: proposal.amount, decimals: 18, symbol: 'SEL' } as any)}
                </div>
                <div className={`text-sm px-2 py-1 rounded-full inline-block ${
                  proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                  proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {proposal.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Governance dApp Component
 */
export function GovernanceDApp({
  showProposals = true,
  showVoting = true,
  showTreasury = true,
  showCouncil = true,
  className,
  style
}: GovernanceTemplateProps): JSX.Element {
  const { isConnected, account } = useSelendraSDK();
  const [activeTab, setActiveTab] = useState<'proposals' | 'create' | 'treasury' | 'council'>('proposals');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'executed' | 'rejected'>('active');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProposals = async () => {
      try {
        setIsLoading(true);

        // Mock proposal data - in real app, this would come from the blockchain
        const mockProposals: Proposal[] = Array.from({ length: 15 }, (_, i) => ({
          id: (i + 1).toString(),
          title: `Proposal #${i + 1}: ${['Increase Treasury Budget', 'Upgrade Runtime', 'Add New Validator', 'Community Grants Program', 'Security Audit Funding'][i % 5]}`,
          description: `This proposal aims to ${['improve the network security', 'enhance developer experience', 'support community growth', 'optimize performance', 'increase transparency'][i % 5]}. The implementation will benefit all stakeholders and contribute to the long-term success of the Selendra ecosystem.`,
          type: ['treasury', 'council', 'democracy', 'technical'][i % 4] as any,
          author: `0x${Math.random().toString(16).substr(2, 40)}`,
          status: ['active', 'pending', 'executed', 'rejected'][i % 4] as any,
          createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          endsAt: Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000,
          votesFor: (Math.random() * 1000000000000000000000).toString(),
          votesAgainst: (Math.random() * 500000000000000000000).toString(),
          votesAbstain: (Math.random() * 200000000000000000000).toString(),
          totalVotingPower: '5000000000000000000000',
          threshold: '2500000000000000000000',
          content: {}
        }));

        setProposals(mockProposals);
      } catch (error) {
        console.error('Failed to load proposals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isConnected) {
      loadProposals();
    }
  }, [isConnected]);

  const handleVote = async (proposalId: string, vote: 'aye' | 'nay' | 'abstain') => {
    try {
      console.log('Voting on proposal:', proposalId, vote);
      // Implement voting logic here
    } catch (error) {
      console.error('Voting failed:', error);
    }
  };

  const handleProposalCreated = (newProposal: Proposal) => {
    setProposals(prev => [newProposal, ...prev]);
    setActiveTab('proposals');
  };

  const filteredProposals = proposals.filter(proposal => {
    if (filter === 'all') return true;
    return proposal.status === filter;
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Selendra Governance</h1>
          <p className="text-center text-gray-600 mb-8">
            Connect your wallet to participate in Selendra governance
          </p>
          <div className="flex justify-center">
            <WalletConnector
              buttonLabel="Connect Wallet"
              variant="primary"
              size="lg"
            />
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'proposals', label: 'Proposals', icon: '📋' },
    { id: 'create', label: 'Create', icon: '✏️' },
    ...(showTreasury ? [{ id: 'treasury', label: 'Treasury', icon: '💰' }] : []),
    ...(showCouncil ? [{ id: 'council', label: 'Council', icon: '🏛️' }] : [])
  ];

  return (
    <div className={`min-h-screen bg-gray-50 ${className || ''}`} style={style}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Selendra Governance</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectionStatus compact />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'proposals' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Governance Proposals</h2>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Proposals</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="executed">Executed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <LoadingSkeleton key={i} variant="card" />
                ))}
              </div>
            ) : filteredProposals.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">No proposals found</div>
                <p className="text-gray-400">Try adjusting your filters or create a new proposal</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onVote={handleVote}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <CreateProposal onProposalCreated={handleProposalCreated} />
        )}

        {activeTab === 'treasury' && showTreasury && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TreasuryOverview />
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Treasury Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Spent (30d)</span>
                  <span className="font-medium">5,000 SEL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Proposals</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-medium text-green-600">85%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Processing Time</span>
                  <span className="font-medium">3.2 days</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'council' && showCouncil && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CouncilOverview />
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Council Activity</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Proposals Created (30d)</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Votes Cast (30d)</span>
                  <span className="font-medium">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Attendance Rate</span>
                  <span className="font-medium text-green-600">92%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Conviction</span>
                  <span className="font-medium">3.4x</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Complete Governance dApp with Providers
 */
export function GovernanceDAppApp(props: GovernanceTemplateProps): JSX.Element {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SelendraProvider
          initialConfig={{
            chainType: 'substrate',
            endpoint: 'wss://rpc.selendra.org'
          }}
          autoConnect={false}
        >
          <GovernanceDApp {...props} />
        </SelendraProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default GovernanceDAppApp;