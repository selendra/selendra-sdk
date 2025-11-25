/**
 * Example: Wallet Utilities Demo
 * 
 * Demonstrates all wallet creation and management functions
 */

import 'dotenv/config';
import { SelendraWallet, WalletUtils } from '@selendrajs/sdk';
import { cryptoWaitReady } from '@polkadot/util-crypto';

async function main() {
  console.log('=== Selendra Wallet Utilities Demo ===\n');

  // Initialize crypto
  await cryptoWaitReady();

  // 1. Generate Mnemonic
  console.log('1️⃣  Generate BIP-39 Mnemonic');
  const mnemonic = WalletUtils.generateMnemonic(12);
  console.log(`   Mnemonic: ${mnemonic}`);
  console.log(`   Valid: ${WalletUtils.validateMnemonic(mnemonic)}\n`);

  // 2. Create Random Wallet (EVM)
  console.log('2️⃣  Create Random EVM Wallet');
  const randomEvmWallet = SelendraWallet.createRandom('evm');
  console.log(`   Address: ${randomEvmWallet.getAddress()}`);
  console.log(`   Private Key: ${randomEvmWallet.getPrivateKey()}`);
  console.log(`   Public Key: ${randomEvmWallet.getPublicKey()}\n`);

  // 3. Create Random Wallet (Substrate)
  console.log('3️⃣  Create Random Substrate Wallet');
  const randomSubWallet = SelendraWallet.createRandom('substrate');
  console.log(`   Address: ${randomSubWallet.getAddress()}`);
  try {
    console.log(`   Private Key: ${randomSubWallet.getPrivateKey()}`);
  } catch (e) {
    console.log(`   Private Key: [Not extractable from mnemonic-derived account]`);
  }
  console.log(`   Public Key: ${randomSubWallet.getPublicKey()}\n`);

  // 4. Create from Mnemonic (EVM)
  console.log('4️⃣  Create EVM Wallet from Mnemonic');
  const evmFromMnemonic = SelendraWallet.fromMnemonic(mnemonic, undefined, 'evm');
  console.log(`   Address: ${evmFromMnemonic.getAddress()}`);
  console.log(`   Formatted: ${WalletUtils.formatAddress(evmFromMnemonic.getAddress())}\n`);

  // 5. Create from Mnemonic (Substrate)
  console.log('5️⃣  Create Substrate Wallet from Mnemonic');
  const subFromMnemonic = SelendraWallet.fromMnemonic(mnemonic, undefined, 'substrate');
  console.log(`   Address: ${subFromMnemonic.getAddress()}\n`);

  // 6. Create from Private Key
  console.log('6️⃣  Create Wallet from Private Key');
  const privateKey = randomEvmWallet.getPrivateKey();
  const walletFromKey = new SelendraWallet(privateKey, 'evm');
  console.log(`   Original: ${randomEvmWallet.getAddress()}`);
  console.log(`   Restored: ${walletFromKey.getAddress()}`);
  console.log(`   Match: ${randomEvmWallet.getAddress() === walletFromKey.getAddress()}\n`);

  // 7. Sign Message (EVM)
  console.log('7️⃣  Sign Message (EVM)');
  const message = 'Hello Selendra!';
  const evmSignature = await randomEvmWallet.signMessage(message);
  console.log(`   Message: ${message}`);
  console.log(`   Signature: ${evmSignature.slice(0, 20)}...${evmSignature.slice(-20)}\n`);

  // 8. Sign Message (Substrate)
  console.log('8️⃣  Sign Message (Substrate)');
  const subSignature = await randomSubWallet.signMessage(message);
  console.log(`   Message: ${message}`);
  console.log(`   Signature: ${subSignature.slice(0, 20)}...${subSignature.slice(-20)}\n`);

  // 9. Sign Typed Data (EIP-712)
  console.log('9️⃣  Sign Typed Data (EIP-712)');
  const domain = {
    name: 'Selendra Test',
    version: '1',
    chainId: 1961,
  };
  const types = {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
  };
  const value = {
    name: 'Alice',
    wallet: randomEvmWallet.getAddress(),
  };
  const typedSignature = await randomEvmWallet.signTypedData(domain, types, value);
  console.log(`   Domain: ${domain.name}`);
  console.log(`   Signature: ${typedSignature.slice(0, 20)}...${typedSignature.slice(-20)}\n`);

  // 10. Encrypt & Decrypt (EVM)
  console.log('🔟 Encrypt & Decrypt Wallet');
  const password = 'SecurePassword123!';
  console.log('   Encrypting EVM wallet...');
  const encrypted = await randomEvmWallet.encrypt(password, (percent: number) => {
    if (percent % 25 === 0) {
      console.log(`   Progress: ${percent}%`);
    }
  });
  console.log(`   Encrypted JSON length: ${encrypted.length} bytes`);
  
  console.log('   Decrypting wallet...');
  const decrypted = await SelendraWallet.fromEncryptedJson(encrypted, password, 'evm');
  console.log(`   Original Address: ${randomEvmWallet.getAddress()}`);
  console.log(`   Decrypted Address: ${decrypted.getAddress()}`);
  console.log(`   Match: ${randomEvmWallet.getAddress() === decrypted.getAddress()}\n`);

  // 11. Derive EVM Address from Substrate
  console.log('1️⃣1️⃣  Derive EVM Address from Substrate Account');
  const subAccount = randomSubWallet.getSubstrateAccount();
  if (subAccount) {
    try {
      const derivedEvmAddress = WalletUtils.deriveEvmAddress(subAccount);
      console.log(`   Substrate Address: ${subAccount.address}`);
      console.log(`   Derived EVM Address: ${derivedEvmAddress}\n`);
    } catch (e) {
      console.log(`   Note: Cannot derive EVM from mnemonic-based Substrate account`);
      console.log(`   (This works with seed-based accounts)\n`);
    }
  }

  // 12. Validation Functions
  console.log('1️⃣2️⃣  Validation Functions');
  const testEvmAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const testPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  console.log(`   Is valid EVM address: ${WalletUtils.isValidEvmAddress(testEvmAddress)}`);
  console.log(`   Is valid private key: ${WalletUtils.isValidPrivateKey(testPrivateKey)}`);
  console.log(`   Is valid private key (invalid): ${WalletUtils.isValidPrivateKey('invalid')}\n`);

  console.log('✅ All wallet utility functions demonstrated!\n');
  
  console.log('📝 Summary of Functions Tested:');
  console.log('   ✅ constructor(privateKey) - Create wallet from private key');
  console.log('   ✅ SelendraWallet.createRandom() - Create random wallet');
  console.log('   ✅ SelendraWallet.fromMnemonic(mnemonic, path?) - Create from mnemonic');
  console.log('   ✅ SelendraWallet.fromEncryptedJson(json, password) - Create from encrypted JSON');
  console.log('   ✅ getAddress() - Get wallet address');
  console.log('   ✅ getPrivateKey() - Get private key');
  console.log('   ✅ getPublicKey() - Get public key');
  console.log('   ✅ signMessage(message) - Sign message');
  console.log('   ✅ signTypedData(domain, types, value) - Sign typed data (EIP-712)');
  console.log('   ✅ encrypt(password, progressCallback?) - Encrypt wallet to JSON');
  console.log('   ✅ WalletUtils.generateMnemonic() - Generate mnemonic');
  console.log('   ✅ WalletUtils.validateMnemonic() - Validate mnemonic');
  console.log('   ✅ WalletUtils.deriveEvmAddress() - Derive EVM from Substrate');
  console.log('   ✅ WalletUtils.isValidEvmAddress() - Validate EVM address');
  console.log('   ✅ WalletUtils.isValidPrivateKey() - Validate private key');
  console.log('   ✅ WalletUtils.formatAddress() - Format address for display\n');

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
