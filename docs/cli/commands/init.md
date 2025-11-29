# selendra init

Initialize a new Selendra project.

## Usage

```bash
selendra init <project-name> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `project-name` | Name of the project to create |

## Options

| Option | Description |
|--------|-------------|
| `-t, --template <template>` | Template to use (evm\|wasm) |
| `-h, --help` | Display help |

## Templates

### EVM Template

Creates a Hardhat-based project for Solidity smart contracts:

```bash
selendra init my-token --template evm
```

Project structure:

```
my-token/
├── contracts/
│   └── MyContract.sol
├── scripts/
│   └── deploy.ts
├── test/
│   └── MyContract.test.ts
├── hardhat.config.ts
├── package.json
└── tsconfig.json
```

### WASM Template

Creates an ink! project for WebAssembly smart contracts:

```bash
selendra init my-contract --template wasm
```

Project structure:

```
my-contract/
├── lib.rs
├── Cargo.toml
└── README.md
```

## Examples

```bash
# Create EVM project
selendra init my-dapp --template evm

# Create WASM project
selendra init my-ink-contract --template wasm

# Interactive mode (prompts for template)
selendra init my-project
```

## After Initialization

```bash
cd my-project
npm install
selendra compile
```
