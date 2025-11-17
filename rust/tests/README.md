# Substrate Wrapper Tests - Task 1.8

This directory contains integration tests for the Substrate wrapper functionality.

## Test Files

- **`substrate_wrapper.rs`** - Integration tests for selendra_client wrapper

## Running Tests

### Unit Tests (No network required)

```bash
# Run unit tests in client.rs module
cargo test --lib substrate::client::tests

# Run offline keypair tests
cargo test --test substrate_wrapper test_keypair
```

### Integration Tests (Require network connection)

```bash
# Run ALL tests including network tests (marked as #[ignore])
cargo test --test substrate_wrapper -- --ignored

# Run specific integration test
cargo test --test substrate_wrapper test_balance_query -- --ignored
```

## Test Categories

### 1. Offline Tests (Always run)

- `test_keypair_creation` - Verify keypair generation from seed
- `test_keypair_from_seed_alice` - Test Alice keypair determinism
- `test_keypair_from_seed_bob` - Test Bob keypair generation
- `test_keypair_ss58_format` - Verify SS58 address format

### 2. Network Tests (Run with --ignored)

- `test_connection_creation` - Test connection to testnet
- `test_signed_connection` - Test signing connection with keypair
- `test_balance_query` - Query account balance from chain
- `test_account_id_consistency` - Verify account ID consistency
- `test_transfer_simulation` - Demonstrate transfer API (no actual tx)
- `test_multiple_connections` - Test concurrent connections

## Prerequisites for Network Tests

1. **Network Access**: Tests connect to `wss://rpc-testnet.selendra.org`
2. **Test Accounts**: Uses well-known test seeds (`//Alice`, `//Bob`)
3. **Substrate Feature**: Some tests require `--features substrate`

## Examples

### Run all offline tests:

```bash
cargo test --test substrate_wrapper
```

### Run with network tests:

```bash
cargo test --test substrate_wrapper -- --ignored
```

### Run and show output:

```bash
cargo test --test substrate_wrapper -- --ignored --nocapture
```

## Notes

- Network tests are marked with `#[ignore]` to prevent failures in offline CI/CD
- The testnet endpoint may change - update `TEST_ENDPOINT` constant if needed
- Transfer tests simulate API calls without executing actual transactions
- All tests use the selendra_client wrapper (not direct subxt calls)

## Verification

To verify Tasks 1.7 and 1.8 are complete:

```bash
# Check compilation
cargo check

# Run offline tests
cargo test --test substrate_wrapper

# Run example
cargo run --example substrate_connection

# Run network integration tests (if testnet available)
cargo test --test substrate_wrapper -- --ignored
```

## Task Completion Status

- ✅ Task 1.7: Example updated (`examples/substrate_connection.rs`)
- ✅ Task 1.8: Integration tests created (`tests/substrate_wrapper.rs`)
- ✅ Unit tests added to `src/substrate/client.rs`
- ✅ All tests compile successfully
- ✅ Offline tests pass without network
