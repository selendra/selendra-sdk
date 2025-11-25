/**
 * Balances Pallet Demo
 * 
 * Demonstrates all Balances pallet functions
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { BalancesManager } from '../../src/pallets/balances/index.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from examples/.env (quiet mode)
dotenv.config({ path: join(dirname(__dirname), '.env'), quiet: true });

// Helper to format SEL amounts
function formatSEL(amount: bigint): string {
  const sel = Number(amount) / 1e18;
  return `${sel.toLocaleString()} SEL`;
}

async function main() {
  // Wait for crypto to be ready
  await cryptoWaitReady();
  
  console.log('🔗 Connecting to Selendra testnet...\n');
  
  // Connect to Selendra testnet (suppress init warnings)
  const provider = new WsProvider('wss://rpc-testnet.selendra.org');
  const api = await ApiPromise.create({ 
    provider,
    noInitWarn: true, // Suppress API initialization warnings
  });
  
  // Initialize Balances manager
  const balances = new BalancesManager(api);
  
  // Create accounts from environment variables
  const keyring = new Keyring({ type: 'sr25519' });
  
  // Get private key and addresses from .env
  const privateKey = process.env.SUBSTRATE_PRIVATE_KEY;
  const address1 = process.env.SUB_ADDRESS_1;
  const address2 = process.env.SUB_ADDRESS_2;
  
  if (!privateKey) {
    throw new Error('SUBSTRATE_PRIVATE_KEY not found in .env file');
  }
  if (!address1 || !address2) {
    throw new Error('SUB_ADDRESS_1 and SUB_ADDRESS_2 must be set in .env file');
  }
  
  // Import account from private key
  const alice = keyring.addFromUri(privateKey);
  
  console.log('👥 Accounts:');
  console.log(`Alice (Sender): ${alice.address}`);
  console.log(`Bob (Recipient): ${address2}\n`);
  
  // ============================================================================
  // Storage Queries
  // ============================================================================
  
  console.log('📊 STORAGE QUERIES\n');
  console.log('━'.repeat(80));
  
  // Total issuance
  const totalIssuance = await balances.queries.totalIssuance();
  console.log(`\n💰 Total Issuance: ${formatSEL(totalIssuance)}`);
  
  // Existential deposit
  const ed = await balances.getExistentialDeposit();
  console.log(`📌 Existential Deposit: ${formatSEL(ed)}`);
  
  // Account balance info
  console.log(`\n👤 Alice's Balance:`);
  const aliceBalance = await balances.getBalance(alice.address);
  console.log(`   Free: ${formatSEL(aliceBalance.free)}`);
  console.log(`   Reserved: ${formatSEL(aliceBalance.reserved)}`);
  console.log(`   Frozen: ${formatSEL(aliceBalance.frozen)}`);
  console.log(`   Locked: ${formatSEL(aliceBalance.locked)}`);
  console.log(`   Transferable: ${formatSEL(aliceBalance.transferable)}`);
  console.log(`   Total: ${formatSEL(aliceBalance.total)}`);
  
  console.log(`\n👤 Bob's Balance:`);
  const bobBalance = await balances.getBalance(address2);
  console.log(`   Free: ${formatSEL(bobBalance.free)}`);
  console.log(`   Reserved: ${formatSEL(bobBalance.reserved)}`);
  console.log(`   Transferable: ${formatSEL(bobBalance.transferable)}`);
  console.log(`   Total: ${formatSEL(bobBalance.total)}`);
  
  // Account locks
  const aliceLocks = await balances.queries.locks(alice.address);
  if (aliceLocks.length > 0) {
    console.log(`\n🔒 Alice's Locks:`);
    aliceLocks.forEach((lock, i) => {
      console.log(`   ${i + 1}. ${lock.id}: ${formatSEL(lock.amount)} (${lock.reasons})`);
    });
  } else {
    console.log(`\n🔒 Alice has no locks`);
  }
  
  // Named reserves
  const aliceReserves = await balances.queries.reserves(alice.address);
  if (aliceReserves.length > 0) {
    console.log(`\n💼 Alice's Reserves:`);
    aliceReserves.forEach((reserve, i) => {
      console.log(`   ${i + 1}. ${reserve.id}: ${formatSEL(reserve.amount)}`);
    });
  } else {
    console.log(`\n💼 Alice has no named reserves`);
  }
  
  // ============================================================================
  // Helper Functions
  // ============================================================================
  
  console.log('\n\n🛠️  HELPER FUNCTIONS\n');
  console.log('━'.repeat(80));
  
  // Check if accounts exist
  const aliceExists = await balances.accountExists(alice.address);
  const bobExists = await balances.accountExists(address2);
  console.log(`\n✓ Alice exists: ${aliceExists}`);
  console.log(`✓ Bob exists: ${bobExists}`);
  
  // Get transferable balances
  const aliceTransferable = await balances.getTransferableBalance(alice.address);
  console.log(`\n💸 Alice can transfer: ${formatSEL(aliceTransferable)}`);
  
  // Calculate max transferable (keeping alive)
  const aliceMaxTransfer = await balances.getMaxTransferable(alice.address, true);
  console.log(`💸 Alice max transfer (keep alive): ${formatSEL(aliceMaxTransfer)}`);
  
  // Estimate transfer fee
  const transferAmount = 1_000_000_000_000_000_000n; // 1 SEL
  const fee = await balances.estimateTransferFee(
    alice.address,
    address2,
    transferAmount
  );
  console.log(`\n⛽ Transfer fee estimate:`);
  console.log(`   Fee: ${formatSEL(fee.partialFee)}`);
  console.log(`   Weight: ${fee.weight.refTime.toString()} ref_time, ${fee.weight.proofSize.toString()} proof_size`);
  console.log(`   Class: ${fee.class}`);
  
  // ============================================================================
  // Extrinsics (Transactions)
  // ============================================================================
  
  console.log('\n\n📝 EXTRINSICS (TRANSACTIONS)\n');
  console.log('━'.repeat(80));
  
  // 1. Simple Transfer
  console.log('\n1️⃣  Simple Transfer (1 SEL)');
  const transferTx = balances.transfer({
    dest: address2,
    value: transferAmount,
  });
  
  console.log('   Signing and sending transaction...');
  await new Promise((resolve, reject) => {
    transferTx.signAndSend(alice, ({ status, events }) => {
      if (status.isInBlock) {
        console.log(`   ✓ Included in block: ${status.asInBlock.toHex()}`);
        
        events.forEach(({ event }) => {
          if (api.events.balances.Transfer.is(event)) {
            const [from, to, amount] = event.data;
            console.log(`   ✓ Transfer: ${from.toString().slice(0, 10)}... → ${to.toString().slice(0, 10)}... : ${formatSEL(BigInt(amount.toString()))}`);
          }
        });
        
        resolve(true);
      } else if (status.isFinalized) {
        console.log(`   ✓ Finalized in block: ${status.asFinalized.toHex()}`);
      }
    }).catch(reject);
  });
  
  // 2. Transfer Keep Alive
  console.log('\n2️⃣  Transfer Keep Alive (0.5 SEL)');
  const keepAliveTx = balances.transferKeepAlive({
    dest: address2,
    value: 500_000_000_000_000_000n, // 0.5 SEL
  });
  
  console.log('   Signing and sending transaction...');
  await new Promise((resolve, reject) => {
    keepAliveTx.signAndSend(alice, ({ status }) => {
      if (status.isInBlock) {
        console.log(`   ✓ Transfer keep alive successful`);
        resolve(true);
      }
    }).catch(reject);
  });
  
  // 3. Transfer All
  console.log('\n3️⃣  Transfer All (demonstration - not executing)');
  const transferAllTx = balances.transferAll({
    dest: address2,
    keepAlive: true,
  });
  console.log('   ✓ Transaction prepared (not sent to preserve account)');
  console.log(`   Would transfer all free balance to ${address2.slice(0, 10)}...`);
  
  // ============================================================================
  // Event Monitoring
  // ============================================================================
  
  console.log('\n\n📡 EVENT MONITORING\n');
  console.log('━'.repeat(80));
  console.log('\n👂 Listening for Transfer events for 10 seconds...\n');
  
  const unsubTransfer = await balances.onTransfer((event) => {
    console.log(`   🔔 Transfer detected:`);
    console.log(`      From: ${event.from.slice(0, 10)}...`);
    console.log(`      To: ${event.to.slice(0, 10)}...`);
    console.log(`      Amount: ${formatSEL(event.amount)}\n`);
  });
  
  // Listen for 10 seconds
  await new Promise(resolve => setTimeout(resolve, 10000));
  unsubTransfer();
  
  // ============================================================================
  // Summary
  // ============================================================================
  
  console.log('\n\n📋 FINAL BALANCES\n');
  console.log('━'.repeat(80));
  
  const aliceFinal = await balances.getBalance(alice.address);
  const bobFinal = await balances.getBalance(address2);
  
  console.log(`\n👤 Alice: ${formatSEL(aliceFinal.total)}`);
  console.log(`   Change: ${formatSEL(aliceFinal.total - aliceBalance.total)}`);
  
  console.log(`\n👤 Bob: ${formatSEL(bobFinal.total)}`);
  console.log(`   Change: ${formatSEL(bobFinal.total - bobBalance.total)}`);
  
  console.log('\n\n✅ Demo complete!\n');
  
  await api.disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
