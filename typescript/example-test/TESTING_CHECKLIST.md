# TypeScript SDK Testing Checklist

## Overview
This checklist provides a comprehensive list of all functions in the Selendra TypeScript SDK that require testing.

---

## 1. Core SDK (`src/sdk.ts`, `src/sdk/index.ts`)

### Main SDK Class (`SelendraSDK`)
- [x] `connect()` - Connect to the network
- [x] `disconnect()` - Disconnect from the network
- [x] `destroy()` - Clean up SDK resources
- [x] `getAccount(address?)` - Get account information
- [-] `getBalance(address?, chainType?)` - Get account balance (substrate work but EVM balance query not fully implemented: Error: createType(Vec<StorageKey>):: createType(Lookup0):: Invalid AccountId provided, expected 32 bytes, found 20)
- [ ] `submitTransaction(tx, options?)` - Submit a transaction
- [ ] `getTransactionHistory(address, limit?)` - Get transaction history
- [ ] `getContract(address, abi, chainType?)` - Get contract instance
- [ ] `getContractInstance(address, chainType?)` - Get contract by address
- [ ] `getCurrentBlock()` - Get current block information
- [ ] `createSDK(config)` - Factory function for SDK creation

### SDK Helpers
- [ ] `chainInfo()` - Get chain information
- [ ] `transfer(to, amount, options)` - Transfer funds
- [ ] `getTransactionStatus(txHash)` - Get transaction status
- [ ] `waitForTransaction(txHash, timeout?)` - Wait for transaction confirmation
- [ ] `getApi()` - Get Polkadot API instance
- [ ] `getEvmProvider()` - Get EVM provider
- [ ] `estimateGas(tx)` - Estimate gas for transaction
- [ ] `getBlockNumber()` - Get current block number
- [ ] `getBlock(blockNumber)` - Get block by number

---

## 2. EVM Module (`src/evm/`)

### EVM Client (`client.ts`)
- [ ] `getNetwork()` - Get network information
- [ ] `getBlockNumber()` - Get current block number
- [ ] `getBlock(blockHashOrNumber, includeTransactions?)` - Get block details
- [ ] `getTransaction(hash)` - Get transaction by hash
- [ ] `getTransactionReceipt(hash)` - Get transaction receipt
- [ ] `sendTransaction(signedTransaction)` - Send signed transaction
- [ ] `call(transaction, blockTag?)` - Execute read-only call
- [ ] `estimateGas(transaction)` - Estimate gas cost
- [ ] `getGasPrice()` - Get current gas price
- [ ] `getMaxFeePerGas()` - Get max fee per gas (EIP-1559)
- [ ] `getMaxPriorityFeePerGas()` - Get max priority fee per gas
- [ ] `getBalance(address, blockTag?)` - Get ETH balance
- [ ] `getTransactionCount(address, blockTag?)` - Get nonce
- [ ] `getCode(address, blockTag?)` - Get contract bytecode
- [ ] `getStorageAt(address, position, blockTag?)` - Get storage value
- [ ] `getLogs(filter)` - Get event logs
- [ ] `subscribe(type, params?)` - Subscribe to events (WebSocket)
- [ ] `unsubscribe(subscriptionId)` - Unsubscribe from events
- [ ] `getContract(address, abi)` - Create contract instance
- [ ] `getERC20Contract(address)` - Create ERC20 contract instance
- [ ] `getERC721Contract(address)` - Create ERC721 contract instance
- [ ] `getContractFactory(abi, bytecode)` - Create contract factory
- [ ] `send(method, params?)` - Send JSON-RPC request
- [ ] `sendBatch(requests)` - Batch send multiple requests

### EVM Account/Wallet (`account.ts`)

#### SelendraWallet
- [ ] `constructor(privateKey)` - Create wallet from private key
- [ ] `SelendraWallet.createRandom()` - Create random wallet
- [ ] `SelendraWallet.fromMnemonic(mnemonic, path?)` - Create from mnemonic
- [ ] `SelendraWallet.fromEncryptedJson(json, password)` - Create from encrypted JSON
- [ ] `getAddress()` - Get wallet address
- [ ] `getPrivateKey()` - Get private key
- [ ] `getPublicKey()` - Get public key
- [ ] `getBalance(blockTag?)` - Get wallet balance
- [ ] `getTransactionCount(blockTag?)` - Get transaction count
- [ ] `signTransaction(transaction)` - Sign transaction
- [ ] `signMessage(message)` - Sign message
- [ ] `signTypedData(domain, types, value)` - Sign typed data (EIP-712)
- [ ] `encrypt(password, progressCallback?)` - Encrypt wallet to JSON

#### ConnectedWallet
- [ ] `getBalance(blockTag?)` - Get balance
- [ ] `getTransactionCount(blockTag?)` - Get nonce
- [ ] `sendTransaction(signedTransaction)` - Send transaction
- [ ] `signAndSendTransaction(transaction)` - Sign and send transaction
- [ ] `call(to, data)` - Execute read-only call
- [ ] `estimateGas(transaction)` - Estimate gas

#### WalletUtils
- [ ] `generateMnemonic()` - Generate BIP-39 mnemonic
- [ ] `validateMnemonic(mnemonic)` - Validate mnemonic
- [ ] `encryptKey(privateKey, password)` - Encrypt private key
- [ ] `decryptKey(encryptedKey, password)` - Decrypt private key

#### MultiSigWallet
- [ ] Test multi-signature wallet functionality

### EVM Contract (`contract.ts`)

#### Contract
- [ ] `call(methodName, args, options?)` - Call read-only method
- [ ] `send(methodName, args, options?)` - Send transaction
- [ ] `estimateGas(methodName, args, options?)` - Estimate gas
- [ ] `getPastEvents(eventName, filter?)` - Get past events
- [ ] `Contract.deploy(abi, bytecode, args, client)` - Deploy contract
- [ ] `getBytecode()` - Get contract bytecode
- [ ] `exists()` - Check if contract exists
- [ ] Event subscription methods

#### Interface
- [ ] `parseFragment(fragment)` - Parse ABI fragment
- [ ] `getFunction(name)` - Get function fragment
- [ ] `getEvent(name)` - Get event fragment
- [ ] `encodeFunctionData(name, args)` - Encode function call
- [ ] `decodeFunctionResult(name, data)` - Decode function result
- [ ] `encodeEventLog(name, values)` - Encode event log
- [ ] `decodeEventLog(name, data, topics)` - Decode event log

#### ERC20Contract
- [ ] `name()` - Get token name
- [ ] `symbol()` - Get token symbol
- [ ] `decimals()` - Get token decimals
- [ ] `totalSupply()` - Get total supply
- [ ] `balanceOf(account)` - Get balance
- [ ] `allowance(owner, spender)` - Get allowance
- [ ] `transfer(to, amount)` - Transfer tokens
- [ ] `approve(spender, amount)` - Approve spending
- [ ] `transferFrom(from, to, amount)` - Transfer from
- [ ] `getFormattedBalance(account)` - Get formatted balance

#### ERC721Contract
- [ ] `ownerOf(tokenId)` - Get token owner
- [ ] `tokenURI(tokenId)` - Get token URI
- [ ] `balanceOf(account)` - Get NFT balance
- [ ] `transferFrom(from, to, tokenId)` - Transfer NFT
- [ ] `safeTransferFrom(from, to, tokenId, data?)` - Safe transfer NFT
- [ ] `approve(approved, tokenId)` - Approve NFT
- [ ] `setApprovalForAll(operator, approved)` - Set approval for all
- [ ] `isApprovedForAll(owner, operator)` - Check approval

#### ContractFactory
- [ ] `deploy(...args)` - Deploy new contract

### EVM Transaction (`transaction.ts`)

#### TransactionManager
- [ ] `estimateGas(tx)` - Estimate gas for transaction
- [ ] `buildTransaction(tx, options)` - Build transaction object
- [ ] `sendTransaction(signedTx, tracker?)` - Send transaction
- [ ] `cancelTransaction(txHash, fromAddress)` - Cancel pending transaction
- [ ] `speedUpTransaction(txHash)` - Speed up transaction
- [ ] `getGasPrice()` - Get gas price
- [ ] `getMaxFeePerGas()` - Get max fee per gas
- [ ] `getMaxPriorityFeePerGas()` - Get max priority fee per gas
- [ ] `supportsEIP1559()` - Check EIP-1559 support

#### TransactionBuilder
- [ ] Build and validate transactions
- [ ] Set gas parameters
- [ ] Set nonce
- [ ] Sign transactions

#### TransactionTracker
- [ ] `waitForConfirmation()` - Wait for confirmation
- [ ] Track transaction status
- [ ] Handle reorgs
- [ ] `updateStatus()` - Update transaction status

### EVM Events (`events.ts`)

#### EventSubscription
- [ ] `start()` - Start event subscription
- [ ] `stop()` - Stop event subscription
- [ ] Event filtering
- [ ] Event parsing

#### EventManager
- [ ] `subscribe(filter, callback, contracts?)` - Subscribe to events
- [ ] `subscribeContract(contract, eventName, callback)` - Subscribe to contract events
- [ ] `query(filter, contracts?)` - Query past events
- [ ] `getTransactionEvents(txHash, contracts?)` - Get transaction events
- [ ] `unsubscribeAll()` - Unsubscribe from all events

### EVM Config (`config.ts`)
- [ ] `getSelendraEvmConfig(network)` - Get EVM network config
- [ ] `createDefaultEvmClientConfig(config?)` - Create default client config
- [ ] `isValidEthereumAddress(address)` - Validate Ethereum address
- [ ] `isValidPrivateKey(key)` - Validate private key
- [ ] `etherToWei(value)` - Convert ether to wei
- [ ] `weiToEther(value)` - Convert wei to ether

---

## 3. Substrate Module (`src/substrate/`)

### Substrate Client (`sdk/substrate.ts`)
- [ ] `getChainInfo()` - Get chain information
- [ ] `getBalance(address)` - Get balance
- [ ] `transfer(from, to, amount, signer)` - Transfer funds
- [ ] `getTransactionStatus(txHash)` - Get transaction status
- [ ] `waitForTransaction(txHash, timeout?)` - Wait for transaction
- [ ] `getBlockNumber()` - Get block number
- [ ] `getBlock(blockNumber)` - Get block
- [ ] `getAccountInfo(address)` - Get account info
- [ ] `getStakingInfo(address)` - Get staking info
- [ ] `getGovernanceInfo()` - Get governance info

### Staking (`staking.ts`)

#### StakingClient
- [ ] `bond(controller, value, payee, options?)` - Bond tokens
- [ ] `bondExtra(value, options?)` - Bond additional tokens
- [ ] `unbond(value, options?)` - Unbond tokens
- [ ] `withdrawUnbonded(numSlashingSpans, options?)` - Withdraw unbonded
- [ ] `nominate(targets, options?)` - Nominate validators
- [ ] `chill(options?)` - Stop nominating
- [ ] `validate(commission, blocked, options?)` - Declare validator intent
- [ ] `setPayee(payee, options?)` - Set reward destination
- [ ] `setController(controller, options?)` - Set controller account
- [ ] `rebond(value, options?)` - Rebond tokens
- [ ] `payoutStakers(validatorStash, era, options?)` - Payout staking rewards
- [ ] `getStakingLedger(address)` - Get staking ledger
- [ ] `getBonded(address)` - Get bonded controller
- [ ] `getValidatorPrefs(address)` - Get validator preferences
- [ ] `getRewardDestination(address)` - Get reward destination
- [ ] `getNominators(address)` - Get nominators
- [ ] `getActiveEra()` - Get active era
- [ ] `getCurrentEra()` - Get current era
- [ ] `getEraRewardPoints(era)` - Get era reward points
- [ ] `getErasTotalStake(era)` - Get era total stake
- [ ] `getErasValidatorReward(era)` - Get era validator reward
- [ ] `getSlashingSpans(address)` - Get slashing spans

### Aleph (`aleph.ts`)

#### AlephClient
- [ ] `getFinalityVersion()` - Get finality version
- [ ] `getSessionCommittee(sessionIndex)` - Get session committee
- [ ] `getCurrentSession()` - Get current session
- [ ] `getAbftScores(sessionIndex)` - Get ABFT scores
- [ ] `getBanInfo(validator)` - Get ban information
- [ ] `getValidatorBlockCount(validator)` - Get validator block count
- [ ] `getUnderperformedSessionCount(validator)` - Get underperformed session count
- [ ] `getValidatorPerformance(validator)` - Get validator performance
- [ ] `isValidatorBanned(validator)` - Check if validator is banned
- [ ] `getActiveValidators()` - Get active validators
- [ ] `getNextSessionValidators()` - Get next session validators
- [ ] `getValidatorHistory(validator, sessions?)` - Get validator history

### Elections (`elections.ts`)

#### ElectionsClient
- [ ] `getCommitteeSeats()` - Get committee seats
- [ ] `getNextEraCommitteeSeats()` - Get next era committee seats
- [ ] `getNextEraReservedValidators()` - Get next era reserved validators
- [ ] `getNextEraNonReservedValidators()` - Get next era non-reserved validators
- [ ] `getNextEraValidators()` - Get next era validators
- [ ] `getElectionOpenness()` - Get election openness
- [ ] `getTotalValidatorCount()` - Get total validator count
- [ ] `isReservedValidator(address)` - Check if reserved validator
- [ ] `isNonReservedValidator(address)` - Check if non-reserved validator
- [ ] `getCurrentEra()` - Get current era
- [ ] `getCurrentEraValidators()` - Get current era validators
- [ ] `changeValidators(reserved, nonReserved, committeeSize, signer)` - Change validators
- [ ] `setElectionsOpenness(openness, signer)` - Set election openness
- [ ] `getValidatorStats()` - Get validator statistics

### Democracy/Governance (`democracy.ts`)

#### DemocracyClient
- [ ] `getReferendum(referendumIndex)` - Get referendum info
- [ ] `getActiveReferenda()` - Get active referenda
- [ ] `getPublicProposals()` - Get public proposals
- [ ] `getReferendumCount()` - Get referendum count
- [ ] `getVotingOf(referendumIndex, account)` - Get voting info
- [ ] `getMinimumDeposit()` - Get minimum deposit
- [ ] `getVotingPeriod()` - Get voting period
- [ ] `getEnactmentPeriod()` - Get enactment period
- [ ] `propose(proposal, value, signer)` - Submit proposal
- [ ] `second(proposalIndex, signer)` - Second proposal
- [ ] `vote(referendumIndex, vote, conviction, signer)` - Vote on referendum
- [ ] `removeVote(referendumIndex, signer)` - Remove vote
- [ ] `delegate(to, conviction, balance, signer)` - Delegate voting power
- [ ] `undelegate(signer)` - Remove delegation

---

## 4. Unified Module (`src/unified/`)

### Unified Accounts (`accounts.ts`)

#### UnifiedAccountsClient
- [ ] `getUnifiedBalance(address)` - Get unified balance (both chains)
- [ ] `hasUnifiedBalance(address)` - Check if has unified balance
- [ ] `getSubstrateAddressFromMapping(evmAddress)` - Get Substrate address from mapping
- [ ] `getEvmAddressFromMapping(substrateAddress)` - Get EVM address from mapping
- [ ] `hasMappingOnChain(address)` - Check if mapping exists on chain
- [ ] `claimDefaultEvmAddress(signer)` - Claim default EVM address
- [ ] `claimEvmAddress(signer, evmAddress, evmSignature)` - Claim specific EVM address
- [ ] `buildSigningPayload(substrateAddress)` - Build signing payload

### Unified Client (`sdk/unified.ts`)

#### UnifiedClient
- [ ] `chainInfo()` - Get chain info
- [ ] `getBalance(address)` - Get balance (auto-detect chain)
- [ ] `transfer(from, to, amount, options)` - Transfer (auto-detect chain)
- [ ] `getTransactionStatus(txHash)` - Get transaction status
- [ ] `waitForTransaction(txHash, timeout?)` - Wait for transaction
- [ ] `estimateGas(tx)` - Estimate gas
- [ ] `getBlockNumber()` - Get block number
- [ ] `getBlock(blockNumber)` - Get block
- [ ] `crossChainTransfer(from, to, amount, options)` - Cross-chain transfer

---

## 5. React Hooks (`src/react/`)

### Core Hooks (`hooks.ts`)
- [ ] `useSelendraSDK()` - Access SDK instance
- [ ] `useBalance(address?, options?)` - Get and track balance
- [ ] `useAccount(options?)` - Get account info and transactions
- [ ] `useTransaction(options?)` - Submit and track transactions
- [ ] `useContract(address, options?)` - Interact with contracts
- [ ] `useEvents(options?)` - Subscribe to events
- [ ] `useBlockSubscription(callback, options?)` - Subscribe to new blocks
- [ ] `useDebounce(value, delay)` - Debounce value
- [ ] `useLocalStorage(key, initialValue)` - Local storage hook
- [ ] `usePrevious(value)` - Get previous value
- [ ] `useIsMounted()` - Check if component is mounted
- [ ] `useMultiBalance(addresses)` - Get multiple balances
- [ ] `useMultiContract(contracts)` - Interact with multiple contracts
- [ ] `useBatchTransactions(options?)` - Batch transactions

### Substrate Hooks (`hooks-substrate.ts`)
- [ ] `useStaking(options?)` - Staking operations
- [ ] `useAleph(options?)` - Aleph consensus info
- [ ] `useElections(options?)` - Elections operations
- [ ] `useUnifiedAccounts()` - Unified account management
- [ ] `useGovernance(options?)` - Governance operations

### Provider & Context (`provider.tsx`)
- [ ] `SelendraProvider` - Context provider component
- [ ] `useSelendraContext()` - Access context
- [ ] Context initialization
- [ ] Connection management

---

## 6. Types Module (`src/types/`)

### Address (`address.ts`)
- [ ] Address validation functions
- [ ] Address conversion functions
- [ ] Address formatting functions

### Balance (`balance.ts`)
- [ ] Balance conversion functions
- [ ] Balance formatting functions
- [ ] Currency calculations

### Hash (`hash.ts`)

#### HashUtils
- [ ] `HashUtils.generate(data, algorithm)` - Generate hash
- [ ] `sha256(data)` - SHA-256 hash
- [ ] `keccak256(data)` - Keccak-256 hash
- [ ] `blake2_256(data)` - Blake2-256 hash
- [ ] Hash validation
- [ ] Hash comparison

### Signature (`signature.ts`)

#### SignatureUtils
- [ ] `SignatureUtils.verify(message, signature, publicKey, algorithm)` - Verify signature
- [ ] `SignatureUtils.createMultiSignature(signatures, threshold)` - Create multi-signature
- [ ] `SignatureUtils.verifyMultiSignature(message, multiSig, publicKeys, threshold)` - Verify multi-signature
- [ ] `verifyWithAlgorithm(message, signature, publicKey, algorithm)` - Verify with specific algorithm
- [ ] `recoverAddress(message, signature)` - Recover address from signature
- [ ] `combineSignatures(signatures)` - Combine multiple signatures

### Error (`error.ts`)

#### SelendraError
- [ ] `constructor(message, code, context?, cause?)` - Create error
- [ ] `toJSON()` - Convert to JSON
- [ ] `isRecoverable()` - Check if error is recoverable
- [ ] `shouldRetry()` - Check if should retry

#### Specific Errors
- [ ] `ConnectionError` - Connection errors
- [ ] `NetworkError` - Network errors
- [ ] `TransactionError` - Transaction errors
- [ ] `ContractError` - Contract errors
- [ ] `ValidationError` - Validation errors
- [ ] `ConfigurationError` - Configuration errors
- [ ] `TimeoutError` - Timeout errors
- [ ] `RateLimitError` - Rate limit errors
- [ ] `getRetryDelay()` - Get retry delay

### Network (`network.ts`)
- [ ] `getNetworkConfig(networkId)` - Get network config
- [ ] `getMainnetNetworks()` - Get mainnet networks
- [ ] `getTestnetNetworks()` - Get testnet networks
- [ ] `getEvmNetworks()` - Get EVM networks
- [ ] `getSubstrateNetworks()` - Get Substrate networks

### Connection (`connection.ts`)

#### ConnectionManager
- [ ] `connect()` - Connect to network
- [ ] `disconnect()` - Disconnect from network
- [ ] `getSubstrateApi()` - Get Substrate API
- [ ] `getEvmProvider()` - Get EVM provider
- [ ] `connectSubstrate()` - Connect to Substrate
- [ ] `connectEvm()` - Connect to EVM

---

## 7. Utilities & Helpers

### Conversion Utils
- [ ] Address conversion (EVM ↔ Substrate)
- [ ] Unit conversion (Wei, Gwei, Ether)
- [ ] Number formatting
- [ ] Hex encoding/decoding

### Crypto Utils
- [ ] Key generation
- [ ] Key derivation
- [ ] Encryption/decryption
- [ ] Random generation

### Validation Utils
- [ ] Address validation
- [ ] Private key validation
- [ ] Transaction validation
- [ ] ABI validation

### Retry Utils
- [ ] Retry logic with backoff
- [ ] Timeout handling
- [ ] Error recovery

### Logger Utils
- [ ] Debug logging
- [ ] Error logging
- [ ] Transaction logging

---

## 8. Integration Tests

### End-to-End Scenarios
- [ ] Complete wallet lifecycle (create, fund, transfer, check balance)
- [ ] Contract deployment and interaction
- [ ] Staking flow (bond, nominate, unbond, withdraw)
- [ ] Governance flow (propose, second, vote)
- [ ] Cross-chain transfers
- [ ] Event subscription and processing
- [ ] Multi-signature operations
- [ ] React component integration

### Performance Tests
- [ ] Batch operations performance
- [ ] Concurrent request handling
- [ ] Large data set processing
- [ ] Memory leak detection
- [ ] WebSocket stability

### Error Handling
- [ ] Network disconnection
- [ ] Invalid inputs
- [ ] Transaction failures
- [ ] Timeout scenarios
- [ ] Rate limiting
- [ ] Chain reorganizations

---

## Testing Priority Levels

### **P0 - Critical (Must Test)**
- Core SDK initialization and connection
- Balance queries and transfers
- Transaction submission and confirmation
- Contract read/write operations
- Error handling and recovery

### **P1 - High Priority**
- All EVM wallet operations
- Staking operations
- Event subscriptions
- React hooks
- Address validation and conversion

### **P2 - Medium Priority**
- Governance operations
- Aleph consensus queries
- Elections management
- Unified accounts
- Advanced contract features

### **P3 - Low Priority**
- Utility functions
- Helper methods
- Debug features
- Edge cases

---

## Test Coverage Goals

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: All critical user flows
- **E2E Tests**: Key scenarios on testnet
- **Performance Tests**: Load and stress testing
- **Security Tests**: Input validation, injection prevention

---

## Notes

- Each function should have:
  - ✅ Unit tests with valid inputs
  - ✅ Unit tests with invalid inputs
  - ✅ Error case handling
  - ✅ Edge case testing
  - ✅ Integration tests (where applicable)

- Test environments:
  - Local development chain
  - Testnet
  - Mock providers

- Use test fixtures and factories for consistency
- Implement CI/CD for automated testing
- Regular regression testing

---

**Last Updated**: November 18, 2025
**Total Functions to Test**: 200+ functions across all modules
