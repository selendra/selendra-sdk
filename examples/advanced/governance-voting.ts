import { SelendraSDK } from '../../src';

/**
 * Governance and Voting Example
 * Demonstrates DAO governance, proposal creation, and voting mechanisms
 */

// Governance Contract ABI
const GOVERNANCE_ABI = [
  'function propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description) external returns (uint256)',
  'function castVote(uint256 proposalId, uint8 support) external',
  'function castVoteWithReason(uint256 proposalId, uint8 support, string reason) external',
  'function execute(address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, bytes32 descriptionHash) external',
  'function getVotes(address account, uint256 blockNumber) external view returns (uint256)',
  'function proposals(uint256 proposalId) external view returns (uint256 id, address proposer, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed)',
  'function state(uint256 proposalId) external view returns (uint8)',
  'function votingDelay() external view returns (uint256)',
  'function votingPeriod() external view returns (uint256)',
  'function proposalThreshold() external view returns (uint256)',
  'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description)',
  'event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 weight, string reason)'
];

// Governance Token ABI (for voting power)
const GOV_TOKEN_ABI = [
  'function delegate(address delegatee) external',
  'function delegates(address account) external view returns (address)',
  'function getCurrentVotes(address account) external view returns (uint256)',
  'function getPriorVotes(address account, uint256 blockNumber) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)'
];

// Treasury Contract ABI
const TREASURY_ABI = [
  'function balance() external view returns (uint256)',
  'function transferFunds(address to, uint256 amount) external',
  'function emergencyWithdraw() external'
];

async function governanceExample() {
  const sdk = new SelendraSDK({
    network: 'testnet'
  });

  try {
    await sdk.initialize();
    await sdk.connectWallet('metamask');

    const account = await sdk.evm.getAccount();
    console.log('🏛️ Connected account:', account);

    // Contract addresses (replace with actual deployed contracts)
    const governanceAddress = '0xGovernance...';
    const govTokenAddress = '0xGovToken...';
    const treasuryAddress = '0xTreasury...';

    // Example 1: Setup voting power
    await setupVotingPower(sdk, govTokenAddress, account);

    // Example 2: Create governance proposal
    await createProposal(sdk, governanceAddress, treasuryAddress, account);

    // Example 3: Vote on proposals
    await voteOnProposals(sdk, governanceAddress, account);

    // Example 4: Execute proposal
    await executeProposal(sdk, governanceAddress, treasuryAddress);

    // Example 5: Monitor governance activity
    await monitorGovernance(sdk, governanceAddress);

  } catch (error) {
    console.error('Governance example failed:', error);
  } finally {
    await sdk.disconnect();
  }
}

async function setupVotingPower(sdk: SelendraSDK, govTokenAddress: string, account: string) {
  console.log('\n🗳️ === Setting Up Voting Power ===');

  const govToken = sdk.evm.contract(govTokenAddress, GOV_TOKEN_ABI);

  try {
    // Check current token balance
    const balance = await govToken.read('balanceOf', [account]);
    console.log('Governance token balance:', sdk.utils.format.formatEther(balance));

    // Check current delegate
    const currentDelegate = await govToken.read('delegates', [account]);
    console.log('Current delegate:', currentDelegate);

    // Self-delegate to activate voting power
    if (currentDelegate.toLowerCase() !== account.toLowerCase()) {
      console.log('Self-delegating to activate voting power...');
      const delegateTx = await govToken.write('delegate', [account]);
      await sdk.evm.waitForTransaction(delegateTx);
      console.log('✅ Voting power activated');
    } else {
      console.log('✅ Voting power already active');
    }

    // Check voting power
    const votingPower = await govToken.read('getCurrentVotes', [account]);
    console.log('Current voting power:', sdk.utils.format.formatEther(votingPower));

  } catch (error) {
    console.error('Voting power setup failed:', error);
  }
}

async function createProposal(
  sdk: SelendraSDK,
  governanceAddress: string,
  treasuryAddress: string,
  account: string
) {
  console.log('\n📝 === Creating Governance Proposal ===');

  const governance = sdk.evm.contract(governanceAddress, GOVERNANCE_ABI);

  try {
    // Check proposal threshold
    const threshold = await governance.read('proposalThreshold');
    console.log('Proposal threshold:', sdk.utils.format.formatEther(threshold), 'tokens');

    // Example proposal: Transfer funds from treasury
    const targets = [treasuryAddress];
    const values = [0]; // No ETH value
    const signatures = ['transferFunds(address,uint256)'];
    const recipient = '0x742d35Cc6634C0532925a3b8D8432d462c0AaeFe';
    const amount = sdk.utils.format.parseEther('1000'); // 1000 tokens

    // Encode the function call
    const treasury = sdk.evm.contract(treasuryAddress, TREASURY_ABI);
    const calldata = treasury.encodeFunctionData('transferFunds', [recipient, amount]);
    const calldatas = [calldata];

    const description = 'Proposal #1: Allocate 1000 tokens from treasury for community development';

    console.log('Creating proposal...');
    console.log('Description:', description);
    console.log('Target:', targets[0]);
    console.log('Amount to transfer:', sdk.utils.format.formatEther(amount));

    const proposeTx = await governance.write('propose', [
      targets,
      values,
      signatures,
      calldatas,
      description
    ]);

    const receipt = await sdk.evm.waitForTransaction(proposeTx);
    console.log('✅ Proposal created, transaction:', proposeTx);

    // Parse proposal created event to get proposal ID
    const events = await governance.getEvents('ProposalCreated', {}, receipt.blockNumber, receipt.blockNumber);
    if (events.length > 0) {
      const proposalId = events[0].args.proposalId;
      console.log('📋 Proposal ID:', proposalId.toString());

      // Get proposal details
      const proposal = await governance.read('proposals', [proposalId]);
      console.log('Proposal details:', {
        id: proposal.id.toString(),
        proposer: proposal.proposer,
        startBlock: proposal.startBlock.toString(),
        endBlock: proposal.endBlock.toString()
      });
    }

  } catch (error) {
    console.error('Proposal creation failed:', error);
  }
}

async function voteOnProposals(sdk: SelendraSDK, governanceAddress: string, account: string) {
  console.log('\n🗳️ === Voting on Proposals ===');

  const governance = sdk.evm.contract(governanceAddress, GOVERNANCE_ABI);

  try {
    // Example: Vote on proposal ID 1
    const proposalId = 1;

    // Check proposal state
    const state = await governance.read('state', [proposalId]);
    console.log('Proposal state:', getProposalStateName(state));

    if (state !== 1) { // 1 = Active
      console.log('Proposal is not in voting phase');
      return;
    }

    // Get proposal details
    const proposal = await governance.read('proposals', [proposalId]);
    console.log('Voting on proposal:', {
      id: proposal.id.toString(),
      forVotes: sdk.utils.format.formatEther(proposal.forVotes),
      againstVotes: sdk.utils.format.formatEther(proposal.againstVotes),
      abstainVotes: sdk.utils.format.formatEther(proposal.abstainVotes)
    });

    // Cast vote (0 = Against, 1 = For, 2 = Abstain)
    const voteSupport = 1; // Vote FOR
    const reason = 'I support this proposal because it will benefit community development';

    console.log('Casting vote FOR the proposal...');
    const voteTx = await governance.write('castVoteWithReason', [proposalId, voteSupport, reason]);
    await sdk.evm.waitForTransaction(voteTx);
    console.log('✅ Vote cast successfully');

    // Check updated proposal state
    const updatedProposal = await governance.read('proposals', [proposalId]);
    console.log('Updated vote counts:', {
      forVotes: sdk.utils.format.formatEther(updatedProposal.forVotes),
      againstVotes: sdk.utils.format.formatEther(updatedProposal.againstVotes),
      abstainVotes: sdk.utils.format.formatEther(updatedProposal.abstainVotes)
    });

  } catch (error) {
    console.error('Voting failed:', error);
  }
}

async function executeProposal(
  sdk: SelendraSDK,
  governanceAddress: string,
  treasuryAddress: string
) {
  console.log('\n⚡ === Executing Proposal ===');

  const governance = sdk.evm.contract(governanceAddress, GOVERNANCE_ABI);

  try {
    const proposalId = 1;

    // Check if proposal is ready for execution
    const state = await governance.read('state', [proposalId]);
    console.log('Proposal state:', getProposalStateName(state));

    if (state !== 4) { // 4 = Succeeded
      console.log('Proposal is not ready for execution');
      return;
    }

    // Reconstruct the proposal parameters for execution
    const targets = [treasuryAddress];
    const values = [0];
    const signatures = ['transferFunds(address,uint256)'];
    const recipient = '0x742d35Cc6634C0532925a3b8D8432d462c0AaeFe';
    const amount = sdk.utils.format.parseEther('1000');

    const treasury = sdk.evm.contract(treasuryAddress, TREASURY_ABI);
    const calldata = treasury.encodeFunctionData('transferFunds', [recipient, amount]);
    const calldatas = [calldata];

    const description = 'Proposal #1: Allocate 1000 tokens from treasury for community development';
    const descriptionHash = sdk.utils.format.keccak256(sdk.utils.format.toUtf8Bytes(description));

    console.log('Executing proposal...');
    const executeTx = await governance.write('execute', [
      targets,
      values,
      signatures,
      calldatas,
      descriptionHash
    ]);

    await sdk.evm.waitForTransaction(executeTx);
    console.log('✅ Proposal executed successfully');

    // Verify execution
    const finalState = await governance.read('state', [proposalId]);
    console.log('Final proposal state:', getProposalStateName(finalState));

  } catch (error) {
    console.error('Proposal execution failed:', error);
  }
}

async function monitorGovernance(sdk: SelendraSDK, governanceAddress: string) {
  console.log('\n📡 === Monitoring Governance Activity ===');

  const governance = sdk.evm.contract(governanceAddress, GOVERNANCE_ABI);

  try {
    // Listen to proposal creation events
    governance.on('ProposalCreated', (proposalId, proposer, description, event) => {
      console.log('🆕 New Proposal Created:', {
        proposalId: proposalId.toString(),
        proposer,
        description: description.substring(0, 100) + '...',
        blockNumber: event.blockNumber
      });
    });

    // Listen to vote cast events
    governance.on('VoteCast', (voter, proposalId, support, weight, reason, event) => {
      const supportText = support === 0 ? 'AGAINST' : support === 1 ? 'FOR' : 'ABSTAIN';
      console.log('🗳️ Vote Cast:', {
        voter,
        proposalId: proposalId.toString(),
        support: supportText,
        weight: sdk.utils.format.formatEther(weight),
        reason: reason || 'No reason provided',
        blockNumber: event.blockNumber
      });
    });

    console.log('👂 Monitoring governance events... (Press Ctrl+C to stop)');

    // Example: Get historical voting data
    const fromBlock = await sdk.evm.getBlockNumber() - 1000; // Last 1000 blocks
    const toBlock = 'latest';

    const proposalEvents = await governance.getEvents('ProposalCreated', {}, fromBlock, toBlock);
    console.log(`📊 Found ${proposalEvents.length} proposals in the last 1000 blocks`);

    const voteEvents = await governance.getEvents('VoteCast', {}, fromBlock, toBlock);
    console.log(`📊 Found ${voteEvents.length} votes in the last 1000 blocks`);

  } catch (error) {
    console.error('Governance monitoring failed:', error);
  }
}

// Helper function to get proposal state name
function getProposalStateName(state: number): string {
  const states = [
    'Pending',
    'Active',
    'Canceled',
    'Defeated',
    'Succeeded',
    'Queued',
    'Expired',
    'Executed'
  ];
  return states[state] || `Unknown(${state})`;
}

// Advanced: Delegation management
async function manageDelegation(sdk: SelendraSDK, govTokenAddress: string) {
  console.log('\n👥 === Managing Delegation ===');

  const govToken = sdk.evm.contract(govTokenAddress, GOV_TOKEN_ABI);

  try {
    const account = await sdk.evm.getAccount();

    // Check current delegation
    const currentDelegate = await govToken.read('delegates', [account]);
    console.log('Current delegate:', currentDelegate);

    // Example: Delegate to a trusted validator or community member
    const trustedDelegate = '0xTrustedValidator...';
    
    if (currentDelegate.toLowerCase() !== trustedDelegate.toLowerCase()) {
      console.log(`Delegating voting power to ${trustedDelegate}...`);
      
      const delegateTx = await govToken.write('delegate', [trustedDelegate]);
      await sdk.evm.waitForTransaction(delegateTx);
      console.log('✅ Delegation updated');

      // Verify delegation
      const newDelegate = await govToken.read('delegates', [account]);
      console.log('New delegate:', newDelegate);
    }

    // Check delegated voting power
    const delegatedPower = await govToken.read('getCurrentVotes', [trustedDelegate]);
    console.log('Delegated voting power:', sdk.utils.format.formatEther(delegatedPower));

  } catch (error) {
    console.error('Delegation management failed:', error);
  }
}

// Example usage
governanceExample().catch(console.error);