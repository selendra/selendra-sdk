/**
 * EIP-712 Signature Utilities for Unified Accounts
 *
 * Implements the EIP-712 typed structured data signing scheme
 * for claiming unified accounts
 */

import { keccak256, toBytes, toHex, concat, pad, type Hex } from "viem";
import { privateKeyToAccount, signMessage } from "viem/accounts";
import { decodeAddress } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";
import type { EIP712Domain } from "./types.js";

/**
 * UnifiedAccountSignature
 *
 * Handles EIP-712 signature generation for unified account claims
 */
export class UnifiedAccountSignature {
  private domain: EIP712Domain;

  constructor(chainId: number, genesisHash: string) {
    this.domain = {
      name: "Selendra EVM Claim",
      version: "1",
      chainId,
      salt: genesisHash,
    };
  }

  /**
   * Build the EIP-712 domain separator
   *
   * @returns Domain separator as hex string
   */
  private buildDomainSeparator(): Hex {
    // Domain type hash
    const domainTypeHash = keccak256(
      toBytes(
        "EIP712Domain(string name,string version,uint256 chainId,bytes32 salt)"
      )
    );

    // Hash individual domain fields
    const nameHash = keccak256(toBytes(this.domain.name));
    const versionHash = keccak256(toBytes(this.domain.version));

    // Encode chain ID as 32 bytes
    const chainIdBytes = pad(toHex(this.domain.chainId), { size: 32 });

    // Concatenate all parts
    const encoded = concat([
      domainTypeHash,
      nameHash,
      versionHash,
      chainIdBytes,
      this.domain.salt as Hex,
    ]);

    return keccak256(encoded);
  }

  /**
   * Build the args hash for the claim message
   *
   * @param substrateAccountId - Encoded Substrate account ID
   * @returns Args hash as hex string
   */
  private buildArgsHash(substrateAccountId: Uint8Array): Hex {
    // Claim type hash
    const claimTypeHash = keccak256(toBytes("Claim(bytes substrateAddress)"));

    // Hash the substrate account ID
    const accountHash = keccak256(substrateAccountId);

    // Concatenate type hash and account hash
    const encoded = concat([claimTypeHash, accountHash]);

    return keccak256(encoded);
  }

  /**
   * Build the complete signing payload
   *
   * @param substrateAccountId - Substrate account address or raw bytes
   * @returns Signing payload as hex string
   */
  buildSigningPayload(substrateAccountId: string | Uint8Array): Hex {
    // Convert to bytes if string
    const accountBytes =
      typeof substrateAccountId === "string"
        ? decodeAddress(substrateAccountId)
        : substrateAccountId;

    // Build domain separator and args hash
    const domainSeparator = this.buildDomainSeparator();
    const argsHash = this.buildArgsHash(accountBytes);

    // EIP-712 payload: "\x19\x01" + domainSeparator + argsHash
    const payload = concat(["0x1901" as Hex, domainSeparator, argsHash]);

    return keccak256(payload);
  }

  /**
   * Generate EIP-712 signature for claiming
   *
   * @param substrateAccountId - Substrate account address
   * @param evmPrivateKey - EVM private key (0x-prefixed)
   * @returns Signature as hex string (65 bytes with recovery byte)
   */
  async signClaim(
    substrateAccountId: string,
    evmPrivateKey: string
  ): Promise<string> {
    // Build the signing payload
    const payload = this.buildSigningPayload(substrateAccountId);

    // Create account from private key
    const account = privateKeyToAccount(evmPrivateKey as `0x${string}`);

    // Sign the payload hash directly
    // EIP-712 signatures sign the pre-hashed message
    const signature = await account.signMessage({
      message: { raw: toBytes(payload) },
    });

    return signature;
  }

  /**
   * Verify a signature matches the expected EVM address
   *
   * @param substrateAccountId - Substrate account address
   * @param signature - EIP-712 signature
   * @param expectedEvmAddress - Expected EVM address
   * @returns true if signature is valid
   */
  async verifySignature(
    substrateAccountId: string,
    signature: string,
    expectedEvmAddress: string
  ): Promise<boolean> {
    try {
      const { recoverMessageAddress } = await import("viem");

      const payload = this.buildSigningPayload(substrateAccountId);

      // Recover the address from the signature
      const recoveredAddress = await recoverMessageAddress({
        message: { raw: toBytes(payload) },
        signature: signature as Hex,
      });

      // Compare addresses (case-insensitive)
      return (
        recoveredAddress.toLowerCase() === expectedEvmAddress.toLowerCase()
      );
    } catch (error) {
      console.error("Signature verification failed:", error);
      return false;
    }
  }

  /**
   * Get the EVM address from a private key
   *
   * @param evmPrivateKey - EVM private key
   * @returns EVM address
   */
  getEvmAddress(evmPrivateKey: string): string {
    const account = privateKeyToAccount(evmPrivateKey as `0x${string}`);
    return account.address;
  }
}
