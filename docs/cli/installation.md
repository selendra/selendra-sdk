# CLI Installation

## Quick Install

```bash
npm install -g @selendrajs/cli
```

## Verify Installation

```bash
selendra --version
```

## Shell Completions

### Bash

Add to your `~/.bashrc`:

```bash
# Selendra CLI completions
if [ -f ~/.selendra/completions/selendra.bash ]; then
  source ~/.selendra/completions/selendra.bash
fi
```

Generate the completion file:

```bash
mkdir -p ~/.selendra/completions
selendra completion bash > ~/.selendra/completions/selendra.bash
```

### Zsh

Add to your `~/.zshrc`:

```bash
fpath=(~/.selendra/completions $fpath)
autoload -Uz compinit && compinit
```

Generate the completion file:

```bash
mkdir -p ~/.selendra/completions
selendra completion zsh > ~/.selendra/completions/_selendra
```

## Update

```bash
npm update -g @selendrajs/cli
```

## Uninstall

```bash
npm uninstall -g @selendrajs/cli
```
