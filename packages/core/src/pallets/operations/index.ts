/**
 * Operations Pallet
 *
 * Provides account maintenance utilities for fixing consumer counter issues.
 * This is a custom Selendra pallet that helps maintain account state integrity.
 *
 * The consumer counter can become misaligned due to various edge cases in:
 * - Reserved/frozen balance changes
 * - Contract account creation
 * - Staking bonding
 * - Session key registration
 *
 * @packageDocumentation
 */

export * from "./types.js";
export * from "./queries.js";
export * from "./client.js";
