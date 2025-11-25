/**
 * Balances Pallet Types
 * 
 * Type definitions for the Balances pallet (pallet-balances)
 */

/**
 * Account balance information
 */
export interface AccountData {
  /** Free (transferable) balance */
  free: bigint;
  /** Reserved balance (locked for specific purposes) */
  reserved: bigint;
  /** Frozen balance (cannot be transferred) */
  frozen: bigint;
  /** Flags for the account */
  flags: bigint;
}

/**
 * Balance lock information
 */
export interface BalanceLock {
  /** Lock identifier */
  id: string;
  /** Locked amount */
  amount: bigint;
  /** Reasons for locking */
  reasons: LockReasons;
}

/**
 * Reasons for balance locks
 */
export enum LockReasons {
  /** Locked for fee payment */
  Fee = 'Fee',
  /** Locked for miscellaneous reasons */
  Misc = 'Misc',
  /** Locked for all reasons */
  All = 'All',
}

/**
 * Named reserve information
 */
export interface ReserveData {
  /** Reserve identifier */
  id: string;
  /** Reserved amount */
  amount: bigint;
}

/**
 * Withdrawal reasons
 */
export enum WithdrawReasons {
  TransactionPayment = 'TransactionPayment',
  Transfer = 'Transfer',
  Reserve = 'Reserve',
  Fee = 'Fee',
  Tip = 'Tip',
}

/**
 * Existential deposit requirement
 */
export interface ExistentialDeposit {
  /** Minimum balance to keep account alive */
  amount: bigint;
}

/**
 * Transfer parameters
 */
export interface TransferParams {
  /** Destination account */
  dest: string;
  /** Amount to transfer */
  value: bigint;
}

/**
 * Transfer all parameters
 */
export interface TransferAllParams {
  /** Destination account */
  dest: string;
  /** Whether to keep sender account alive */
  keepAlive: boolean;
}

/**
 * Force transfer parameters (sudo only)
 */
export interface ForceTransferParams {
  /** Source account */
  source: string;
  /** Destination account */
  dest: string;
  /** Amount to transfer */
  value: bigint;
}

/**
 * Set balance parameters (sudo only)
 */
export interface SetBalanceParams {
  /** Account to set balance for */
  who: string;
  /** New free balance */
  newFree: bigint;
  /** New reserved balance */
  newReserved: bigint;
}

/**
 * Force unreserve parameters (sudo only)
 */
export interface ForceUnreserveParams {
  /** Account to unreserve from */
  who: string;
  /** Amount to unreserve */
  amount: bigint;
}

/**
 * Balance info combining all balance types
 */
export interface BalanceInfo {
  /** Free balance */
  free: bigint;
  /** Reserved balance */
  reserved: bigint;
  /** Frozen balance */
  frozen: bigint;
  /** Locked balance (sum of all locks) */
  locked: bigint;
  /** Transferable balance (free - max(frozen, locked)) */
  transferable: bigint;
  /** Total balance (free + reserved) */
  total: bigint;
}

/**
 * Transfer event data
 */
export interface TransferEvent {
  /** Sender account */
  from: string;
  /** Recipient account */
  to: string;
  /** Amount transferred */
  amount: bigint;
}

/**
 * Balance set event data
 */
export interface BalanceSetEvent {
  /** Account whose balance was set */
  who: string;
  /** New free balance */
  free: bigint;
  /** New reserved balance */
  reserved: bigint;
}

/**
 * Reserved event data
 */
export interface ReservedEvent {
  /** Account that reserved balance */
  who: string;
  /** Amount reserved */
  amount: bigint;
}

/**
 * Unreserved event data
 */
export interface UnreservedEvent {
  /** Account that unreserved balance */
  who: string;
  /** Amount unreserved */
  amount: bigint;
}

/**
 * Deposit event data
 */
export interface DepositEvent {
  /** Account that received deposit */
  who: string;
  /** Amount deposited */
  amount: bigint;
}

/**
 * Withdraw event data
 */
export interface WithdrawEvent {
  /** Account that withdrew */
  who: string;
  /** Amount withdrawn */
  amount: bigint;
}

/**
 * Fee estimation result
 */
export interface FeeEstimate {
  /** Estimated fee in native token */
  partialFee: bigint;
  /** Weight of the transaction */
  weight: {
    refTime: bigint;
    proofSize: bigint;
  };
  /** Class of the transaction */
  class: 'Normal' | 'Operational' | 'Mandatory';
}
