/**
 * Unified Accounts Example
 *
 * Demonstrates unified account management:
 * - Substrate <-> EVM address conversion
 * - Unified balance queries
 * - Account claiming with EIP-712 signatures
 * - Address validation
 *
 * @example
 * ```bash
 * ts-node examples/unified-accounts.ts
 * ```
 */

import { createSDK } from '../src/sdk';
import { UnifiedAccountManager } from '../src/unified/accounts';

async function main() {
  console.log('🔗 Selendra Unified Accounts\n');

  // Initialize SDK
  const sdk = await createSDK({
    network: 'mainnet' as any,
    endpoint: 'wss://rpc.selendra.org',
  });

  await sdk.connect();
  console.log('✅ Connected to Selendra mainnet\n');

  const api = (sdk as any).substrateApi;
  const unifiedAccounts = new UnifiedAccountManager(api);

  // ========== Address Conversion ==========
  console.log('🔄 Address Conversion:');
  console.log('━'.repeat(60));

  // Example Substrate address (Alice)
  const substrateAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  console.log(`Substrate Address: ${substrateAddress}`);

  // Convert to EVM
  const evmAddress = unifiedAccounts.substrateToEvm(substrateAddress);
  console.log(`EVM Address:       ${evmAddress}`);

  // Convert back to Substrate
  const convertedBack = unifiedAccounts.evmToSubstrate(evmAddress);
  console.log(`Converted Back:    ${convertedBack}`);
  console.log('');

  // ========== Address Validation ==========
  console.log('✅ Address Validation:');
  console.log('━'.repeat(60));

  const addresses = [
    '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', // Valid Substrate
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Valid EVM
    'invalid_address', // Invalid
  ];

  addresses.forEach((addr) => {
    const validation = unifiedAccounts.validateAddress(addr);
    const emoji = validation.valid ? '✅' : '❌';
    console.log(`${emoji} ${addr.slice(0, 20)}... → ${validation.type}`);
  });
  console.log('');

  // ========== Unified Balance ==========
  console.log('💰 Unified Balance Query:');
  console.log('━'.repeat(60));

  try {
    const balance = await unifiedAccounts.getUnifiedBalance(substrateAddress);

    console.log('Substrate Balances:');
    console.log(`  Free:     ${balance.substrate.free} SEL`);
    console.log(`  Reserved: ${balance.substrate.reserved} SEL`);
    console.log(`  Frozen:   ${balance.substrate.frozen} SEL`);
    console.log('');
    console.log(`EVM Balance: ${balance.evm} SEL`);
    console.log(`Total:       ${balance.total} SEL`);
  } catch (error) {
    console.log(`⚠️  Could not fetch unified balance: ${error}`);
  }
  console.log('');

  // ========== Batch Conversion ==========
  console.log('📦 Batch Conversion:');
  console.log('━'.repeat(60));

  const substrateAddresses = [
    '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
  ];

  console.log('Converting 3 Substrate addresses to EVM...\n');
  const evmAddresses = unifiedAccounts.batchConvert(substrateAddresses, 'evm');

  substrateAddresses.forEach((sub, i) => {
    console.log(`${i + 1}. Substrate: ${sub.slice(0, 10)}...`);
    console.log(`   EVM:       ${evmAddresses[i]}`);
  });
  console.log('');

  // ========== On-Chain Mapping Queries ==========
  console.log('🗺️  On-Chain Mapping Queries:');
  console.log('━'.repeat(60));

  try {
    // Check if address has on-chain mapping
    const hasMapping = await unifiedAccounts.hasMappingOnChain(substrateAddress);
    console.log(`Has On-Chain Mapping: ${hasMapping ? '✅ Yes' : '❌ No'}`);

    if (hasMapping) {
      // Query the mapped EVM address
      const mappedEvm = await unifiedAccounts.getEvmAddressFromMapping(substrateAddress);
      console.log(`Mapped EVM Address: ${mappedEvm || 'None'}`);

      if (mappedEvm) {
        // Query reverse mapping
        const mappedSubstrate = await unifiedAccounts.getSubstrateAddressFromMapping(mappedEvm);
        console.log(`Reverse Mapping: ${mappedSubstrate || 'None'}`);
      }
    }
  } catch (error) {
    console.log(`⚠️  Could not query mappings: ${error}`);
  }
  console.log('');

  // ========== Account Claiming ==========
  console.log('🔐 Account Claiming (EIP-712):');
  console.log('━'.repeat(60));
  console.log(`
To claim an EVM address for your Substrate account:

1. Build the signing payload:
\`\`\`typescript
const payload = await unifiedAccounts.buildSigningPayload(substrateAddress);
console.log('Payload to sign:', payload);
\`\`\`

2. Sign with MetaMask (or other EVM wallet):
\`\`\`javascript
const signature = await ethereum.request({
  method: 'personal_sign',
  params: [payload, evmAddress]
});
\`\`\`

3. Submit claim transaction:
\`\`\`typescript
const result = await unifiedAccounts.claimEvmAddress(
  signer,           // Substrate signer
  evmAddress,       // EVM address to claim
  signature         // EIP-712 signature
);
console.log('Claimed:', result.blockHash);
\`\`\`

OR claim default EVM address (no signature needed):
\`\`\`typescript
const result = await unifiedAccounts.claimDefaultEvmAddress(signer);
console.log('Claimed default:', result.evmAddress);
\`\`\`

⚠️  WARNING:
- Transfer XC20 assets and staking rewards BEFORE claiming
- Once claimed, mapping CANNOT be changed
- Storage fee is required for claiming
  `);

  // ========== Use Cases ==========
  console.log('💡 Unified Accounts Use Cases:');
  console.log('━'.repeat(60));
  console.log(`
1. Cross-VM DApp Development:
   - Accept payments in both Substrate and EVM formats
   - Single identity across both VMs
   - Unified balance management

2. User Experience:
   - Users can use MetaMask with Substrate accounts
   - No need to manage multiple addresses
   - Seamless interaction with both ecosystems

3. Asset Migration:
   - Move assets between Substrate and EVM layers
   - Unified balance queries simplify accounting
   - Address conversion for cross-VM transfers

Example Integration:
\`\`\`typescript
// In your DApp
const { substrateToEvm, getUnifiedBalance } = useUnifiedAccounts();

// Convert user's Substrate address
const evmAddr = substrateToEvm(userAddress);

// Show unified balance
const balance = await getUnifiedBalance(userAddress);
console.log(\`Total: \${balance.total} SEL\`);
\`\`\`
  `);

  await sdk.disconnect();
  console.log('\n✅ Disconnected from network');
}

// Run the example
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { main as unifiedAccounts };
