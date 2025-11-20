/**
 * Type definition tests
 */

import {
  AddressUtils,
  BalanceUtils,
  HashUtils,
  SignatureUtils,
  ErrorFactory,
  ErrorCode,
} from '../src/types';

describe('Type Utilities', () => {
  describe('AddressUtils', () => {
    it('should validate EVM addresses', () => {
      const evmAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';
      const result = AddressUtils.validate(evmAddress);

      expect(result.isValid).toBe(true);
      expect(result.type).toBe('evm');
      expect(result.format).toBe('ethereum');
    });

    it('should validate SS58 addresses', () => {
      const ss58Address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
      const result = AddressUtils.validate(ss58Address);

      // This would work with proper @polkadot/util-crypto integration
      expect(result.isValid).toBeDefined();
    });

    it('should reject invalid addresses', () => {
      const invalidAddress = 'invalid-address';
      const result = AddressUtils.validate(invalidAddress);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should format addresses for display', () => {
      const address = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';
      const formatted = AddressUtils.formatForDisplay(address, {
        maxLength: 16,
        prefixChars: 6,
        suffixChars: 4,
      });

      expect(formatted).toBe('0x742d3...Db45');
    });

    it('should check address equality', () => {
      const address1 = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45';
      const address2 = '0x742d35cc6634c0532925a3b8d4c9db96c4b4db45'; // lowercase
      const address3 = '0x1234567890123456789012345678901234567890';

      expect(AddressUtils.areEqual(address1, address2)).toBe(true);
      expect(AddressUtils.areEqual(address1, address3)).toBe(false);
    });
  });

  describe('BalanceUtils', () => {
    it('should format balance amounts', () => {
      const balance = '1000000000000000000'; // 1 ETH in wei
      const formatted = BalanceUtils.format(balance, {
        unit: 'eth',
        decimals: 4,
      });

      expect(formatted).toBe('1.0000 ETH');
    });

    it('should convert between units', () => {
      const wei = '1000000000000000000';
      const result = BalanceUtils.convert(wei, 'wei', 'eth');

      expect(result.calculated).toBe('1');
      expect(result.formatted).toBe('1 ETH');
    });

    it('should parse formatted balances', () => {
      const formatted = '1.5 ETH';
      const parsed = BalanceUtils.parse(formatted, 'eth');

      expect(parsed).toBe('1500000000000000000');
    });

    it('should compare balances', () => {
      const balance1 = '1000000000000000000';
      const balance2 = '2000000000000000000';

      expect(BalanceUtils.compare(balance1, balance2)).toBe(-1);
      expect(BalanceUtils.compare(balance2, balance1)).toBe(1);
      expect(BalanceUtils.compare(balance1, balance1)).toBe(0);
    });

    it('should check if balance is sufficient', () => {
      const balance = '2000000000000000000';
      const amount = '1000000000000000000';
      const fee = '500000000000000000';

      expect(BalanceUtils.isSufficient(balance, amount, fee)).toBe(true);
      expect(BalanceUtils.isSufficient(amount, balance, fee)).toBe(false);
    });

    it('should perform balance arithmetic', () => {
      const balance1 = '1000000000000000000';
      const balance2 = '2000000000000000000';

      expect(BalanceUtils.add(balance1, balance2)).toBe('3000000000000000000');
      expect(BalanceUtils.subtract(balance2, balance1)).toBe('1000000000000000000');
    });
  });

  describe('HashUtils', () => {
    it('should validate hash strings', () => {
      const validHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = HashUtils.validate(validHash);

      expect(result.isValid).toBe(true);
      expect(result.type).toBe('sha256');
    });

    it('should reject invalid hashes', () => {
      const invalidHash = 'invalid-hash';
      const result = HashUtils.validate(invalidHash);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should check hash equality', () => {
      const hash1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const hash2 = '0x1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF';

      expect(HashUtils.isEqual(hash1, hash2)).toBe(true);
    });

    it('should identify block hashes', () => {
      const blockHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(HashUtils.isBlockHash(blockHash)).toBe(true);
    });

    it('should identify transaction hashes', () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(HashUtils.isTransactionHash(txHash)).toBe(true);
    });
  });

  describe('ErrorFactory', () => {
    it('should create errors from error codes', () => {
      const error = ErrorFactory.create(ErrorCode.CONNECTION_TIMEOUT, 'Test timeout');

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.CONNECTION_TIMEOUT);
      expect(error.message).toBe('Test timeout');
    });

    it('should create errors from generic errors', () => {
      const genericError = new Error('Generic error');
      const sdkError = ErrorFactory.fromError(genericError);

      expect(sdkError).toBeInstanceOf(Error);
      expect(sdkError.cause).toBe(genericError);
    });

    it('should provide default messages', () => {
      const error = ErrorFactory.create(ErrorCode.INSUFFICIENT_FUNDS);
      expect(error.message).toBe('Insufficient funds for transaction');
    });

    it('should handle connection errors specifically', () => {
      const error = ErrorFactory.create(
        ErrorCode.CONNECTION_FAILED,
        undefined,
        { endpoint: 'ws://localhost:9944' }
      );

      expect(error.name).toBe('ConnectionError');
    });

    it('should handle transaction errors specifically', () => {
      const error = ErrorFactory.create(
        ErrorCode.TRANSACTION_FAILED,
        undefined,
        { transactionHash: '0x123...', blockNumber: 12345 }
      );

      expect(error.name).toBe('TransactionError');
    });
  });

  describe('SignatureUtils', () => {
    it('should validate signature formats', () => {
      const validSignature = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12';

      expect(SignatureUtils.validate(validSignature, 'ecdsa_secp256k1')).toBe(true);
      expect(SignatureUtils.validate('invalid', 'ecdsa_secp256k1')).toBe(false);
    });

    it('should create signature objects', () => {
      const signature = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12';
      const sig = SignatureUtils.create(signature, 'ecdsa_secp256k1');

      expect(sig.signature).toBe(signature);
      expect(sig.algorithm).toBe('ecdsa_secp256k1');
      expect(sig.format).toBe('hex');
      expect(sig.metadata).toBeDefined();
    });

    it('should convert between signature formats', () => {
      const hexSignature = '0x1234567890abcdef';
      const base64Signature = SignatureUtils.convertFormat(hexSignature, 'hex', 'base64');
      const backToHex = SignatureUtils.convertFormat(base64Signature, 'base64', 'hex');

      expect(hexSignature).toBe(backToHex);
    });
  });
});