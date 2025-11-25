# wasm-test

Selendra WASM Project (ink!)

## Build

```bash
cargo contract build
```

## Test

```bash
cargo test
```

## Deploy

```bash
cargo contract upload --suri //Alice
cargo contract instantiate --suri //Alice --constructor new --args false
```
