# Eve Validator Setup - Added to Staking Demo

## Summary

Added **Section 8: SET UP NEW VALIDATOR (EVE)** to `staking-demo.ts`, demonstrating the complete workflow to set up a new validator using session keys.

## Changes

### File: `examples/pallets/staking-demo.ts`
- **Before:** 467 lines
- **After:** 600 lines  
- **Added:** 133 lines of new validator setup code

### Updated Section Numbers
- Section 8: **NEW - Set Up New Validator (Eve)**
- Section 9: Reward Operations (was 8)
- Section 10: Era Information (was 9)
- Section 11: Advanced Queries (was 10)
- Section 12: Event Listeners (was 11)
- Section 13: Sudo Operations (was 12)
- Section 14: Helper Functions Summary (was 13)

## New Section Details

### What It Demonstrates

**Complete Validator Setup Workflow:**

1. **Check Current Status**
   - Verify if Eve is already bonded/validating
   - Display current bonded amount

2. **Bond Funds** 
   - Create bond transaction with minimum validator bond (25,000 SEL)
   - Set payee to `Staked` (auto-compound rewards)

3. **Set Session Keys**
   - Use `api.tx.session.setKeys()` with rotated keys
   - Session keys: `0x3415348005e744dc8471931e37a1653c5a169a749791c05774e97926fef11c30ec7be6d045e1a24119dc9fbcf9d1736c98c7cfd6e3a83a8108d56ad863f5b34f`
   - Proof: `0x` (empty for dev chain)

4. **Declare Validator Intent**
   - Set commission to 5% (50000000 / 1000000000)
   - Accept nominations: Yes

5. **Optional Execution** (commented out)
   - Full code to actually submit all three transactions
   - Wait for finalization
   - Verify new validator status

### Code Example Output

```
================================================================================
8. SET UP NEW VALIDATOR (EVE)
================================================================================

Setting up Eve as a new validator:
  Address: 5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw
  Session Keys: 0x3415348005e744dc84...

Eve status before setup:
  Bonded: false
  Validating: true

✓ Created bond transaction for Eve (25000000000000000000000 units)
  Payee: Staked (rewards compound automatically)

✓ Created setKeys transaction
  Session keys set for block production
  Proof: 0x (empty proof for dev chain)

✓ Created validate transaction for Eve
  Commission: 5%
  Accepting nominations: Yes

📝 Complete workflow to set up Eve as validator:
   1. Bond funds (minimum validator bond required)
   2. Set session keys (for block authoring)
   3. Declare validator intent (validate with commission)
   4. Wait for next era to be included in validator set

💡 To actually execute these transactions:
   await eveBondTx.signAndSend(eve);
   await setKeysTx.signAndSend(eve);
   await eveValidateTx.signAndSend(eve);
```

### Transaction Execution Code (Optional)

The section includes **commented-out code** to actually execute the transactions:

```typescript
// Bond funds
await new Promise<void>((resolve, reject) => {
  eveBondTx.signAndSend(eve, ({ status, events }) => {
    if (status.isInBlock) {
      console.log(`   ✓ Bonded in block: ${status.asInBlock.toHex()}`);
    }
    if (status.isFinalized) {
      console.log(`   ✓ Finalized in block: ${status.asFinalized.toHex()}`);
      resolve();
    }
  }).catch(reject);
});

// Set session keys
await new Promise<void>((resolve, reject) => {
  setKeysTx.signAndSend(eve, ({ status, events }) => {
    if (status.isInBlock) {
      console.log(`   ✓ Keys set in block: ${status.asInBlock.toHex()}`);
    }
    if (status.isFinalized) {
      resolve();
    }
  }).catch(reject);
});

// Declare validator intent
await new Promise<void>((resolve, reject) => {
  eveValidateTx.signAndSend(eve, ({ status, events }) => {
    if (status.isInBlock) {
      console.log(`   ✓ Validated in block: ${status.asInBlock.toHex()}`);
    }
    if (status.isFinalized) {
      resolve();
    }
  }).catch(reject);
});

// Verify final status
const eveInfoAfter = await staking.getStakingInfo(EVE);
console.log('✅ Eve is now a validator!');
```

## Technical Details

### Session Keys Format
- **Full Key:** `0x3415348005e744dc8471931e37a1653c5a169a749791c05774e97926fef11c30ec7be6d045e1a24119dc9fbcf9d1736c98c7cfd6e3a83a8108d56ad863f5b34f`
- **Length:** 128 characters (64 bytes)
- **Purpose:** Used for block authoring and validation
- **Components:** Typically contains GRANDPA + BABE + ImOnline + AuthorityDiscovery keys

### Commission Calculation
- **Input:** `50000000` (50 million)
- **Base:** `1000000000` (1 billion = parts per billion)
- **Result:** `50000000 / 1000000000 = 0.05 = 5%`

### Validator Requirements
- **Minimum Bond:** 25,000 SEL (from chain query)
- **Session Keys:** Must be set before validating
- **Waiting Period:** Included in validator set next era

## Usage

### Run Demo (Read-Only)
```bash
npm run pallet:staking
```

### Execute Transactions (Modify Chain State)
Uncomment the execution code block in Section 8:
```typescript
// Optional: Uncomment to actually submit transactions
/*
console.log('\n🚀 Executing transactions...');
// ... transaction code ...
*/
```

Then run:
```bash
npm run pallet:staking
```

## Verification

After execution, Eve will be:
- ✅ Bonded with 25,000 SEL
- ✅ Session keys configured
- ✅ Validating with 5% commission
- ✅ Accepting nominations
- ⏳ Waiting for next era to become active validator

Check status:
```typescript
const eveInfo = await staking.getStakingInfo(EVE);
console.log('Bonded:', eveInfo.isBonded);
console.log('Validating:', eveInfo.isValidating);
console.log('Commission:', eveInfo.validatorPrefs?.commission);
```

## Benefits

1. **Educational:** Shows complete validator setup workflow
2. **Safe:** Transactions created but not submitted by default
3. **Reusable:** Code can be copied for real validator setup
4. **Complete:** Includes all three required steps
5. **Verified:** Tests against local development node

## Next Steps

- Uncomment execution code to actually set up Eve as validator
- Wait for next era to see Eve in active validator set
- Test with different commission rates
- Try with different session keys
