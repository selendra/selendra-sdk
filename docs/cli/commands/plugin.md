# selendra plugin

Manage CLI plugins for extending functionality.

## Usage

```bash
selendra plugin <command> [options]
```

## Commands

### install

Install a plugin:

```bash
selendra plugin install <plugin-name>
selendra plugin install <plugin-name> --local
selendra plugin install <git-url> --git
```

### uninstall

Remove a plugin:

```bash
selendra plugin uninstall <plugin-name>
```

### list

List installed plugins:

```bash
selendra plugin list
selendra plugin list --available
```

### enable/disable

Toggle a plugin:

```bash
selendra plugin enable <plugin-name>
selendra plugin disable <plugin-name>
```

### update

Update plugins:

```bash
selendra plugin update           # Update all
selendra plugin update <plugin>  # Update specific
```

### info

Show plugin details:

```bash
selendra plugin info <plugin-name>
```

### create

Create a new plugin:

```bash
selendra plugin create my-plugin
```

## Options

| Option        | Description                 |
| ------------- | --------------------------- |
| `--local`     | Install from local path     |
| `--git`       | Install from git repository |
| `--available` | Show available plugins      |

## Plugin Structure

Plugins follow this structure:

```
selendra-plugin-myname/
├── package.json
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── commands/
│   │   └── mycommand.ts
│   └── hooks/
│       └── preDeploy.ts
└── README.md
```

### package.json

```json
{
  "name": "@selendrajs/plugin-myname",
  "selendra": {
    "commands": [
      {
        "name": "mycommand",
        "description": "My custom command"
      }
    ],
    "hooks": {
      "preDeploy": "./dist/hooks/preDeploy.js"
    }
  }
}
```

## Available Hooks

Plugins can hook into these lifecycle events:

| Hook          | Description                |
| ------------- | -------------------------- |
| `preCompile`  | Before compiling contracts |
| `postCompile` | After compiling contracts  |
| `preDeploy`   | Before deploying           |
| `postDeploy`  | After deploying            |
| `preTest`     | Before running tests       |
| `postTest`    | After running tests        |

## Examples

```bash
# Install from npm
selendra plugin install @selendrajs/plugin-gas-reporter

# Install from local
selendra plugin install ./my-plugin --local

# Install from git
selendra plugin install https://github.com/user/plugin.git --git

# Create new plugin
selendra plugin create my-awesome-plugin

# List all plugins
selendra plugin list

# Show available
selendra plugin list --available
```

## Plugin Registry

Official plugins are available at:

- `@selendrajs/plugin-hardhat-bridge`
- `@selendrajs/plugin-foundry-bridge`
- `@selendrajs/plugin-gas-reporter`
- `@selendrajs/plugin-contract-sizer`
- `@selendrajs/plugin-coverage`
- `@selendrajs/plugin-ipfs-deploy`
