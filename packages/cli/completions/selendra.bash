#!/bin/bash
# Selendra CLI Bash Completion Script
# 
# Installation:
#   1. Save this file to ~/.selendra/completions/selendra.bash
#   2. Add to ~/.bashrc: source ~/.selendra/completions/selendra.bash
#   
# Or install globally:
#   sudo cp selendra.bash /etc/bash_completion.d/selendra

_selendra_completions() {
    local cur prev opts commands
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    # Main commands
    commands="init compile deploy verify status chain block tx gas logs interact abi account balance transfer faucet stake"
    
    # Network options
    networks="mainnet testnet local"
    
    # Account actions
    account_actions="new new-substrate list import export delete show"
    
    # Stake actions
    stake_actions="info pools join claim unbond"
    
    # ABI subcommands
    abi_commands="export import list types"

    case "${prev}" in
        selendra)
            COMPREPLY=( $(compgen -W "${commands}" -- ${cur}) )
            return 0
            ;;
        -n|--network)
            COMPREPLY=( $(compgen -W "${networks}" -- ${cur}) )
            return 0
            ;;
        -t|--template)
            COMPREPLY=( $(compgen -W "evm wasm" -- ${cur}) )
            return 0
            ;;
        --target)
            COMPREPLY=( $(compgen -W "evm wasm" -- ${cur}) )
            return 0
            ;;
        account)
            COMPREPLY=( $(compgen -W "${account_actions}" -- ${cur}) )
            return 0
            ;;
        stake)
            COMPREPLY=( $(compgen -W "${stake_actions}" -- ${cur}) )
            return 0
            ;;
        abi)
            COMPREPLY=( $(compgen -W "${abi_commands}" -- ${cur}) )
            return 0
            ;;
        init)
            # Complete directory names for project
            COMPREPLY=( $(compgen -d -- ${cur}) )
            return 0
            ;;
        deploy|compile)
            # Complete contract names from artifacts
            if [ -d "./artifacts/contracts" ]; then
                local contracts=$(find ./artifacts/contracts -name "*.json" -exec basename {} .json \; 2>/dev/null | sort -u)
                COMPREPLY=( $(compgen -W "${contracts}" -- ${cur}) )
            fi
            return 0
            ;;
        verify|interact|logs|balance|transfer|faucet)
            # These expect addresses, no completion
            return 0
            ;;
        tx)
            # Expect transaction hash, no completion
            return 0
            ;;
        block)
            COMPREPLY=( $(compgen -W "latest" -- ${cur}) )
            return 0
            ;;
        -a|--abi)
            # Complete JSON files
            COMPREPLY=( $(compgen -f -X '!*.json' -- ${cur}) )
            return 0
            ;;
        -o|--output)
            # Complete files
            COMPREPLY=( $(compgen -f -- ${cur}) )
            return 0
            ;;
    esac

    # Handle command-specific options
    local command=""
    for word in "${COMP_WORDS[@]}"; do
        if [[ " ${commands} " =~ " ${word} " ]]; then
            command="${word}"
            break
        fi
    done

    case "${command}" in
        init)
            opts="-t --template"
            ;;
        compile)
            opts="--target"
            ;;
        deploy)
            opts="-n --network --args --gas"
            ;;
        verify)
            opts="-n --network --compiler --optimization --runs --constructor --license"
            ;;
        status)
            opts="-n --network --json --health -w --watch"
            ;;
        chain|gas)
            opts="-n --network --json"
            ;;
        block)
            opts="-n --network --json --txs"
            ;;
        tx)
            opts="-n --network --json"
            ;;
        logs)
            opts="-n --network -e --event --from-block --to-block --abi -w --watch --json -l --limit"
            ;;
        interact)
            opts="-a --abi -n --network"
            ;;
        balance)
            opts="-n --network --json"
            ;;
        transfer)
            opts="-n --network -a --amount"
            ;;
        stake)
            opts="-n --network -p --pool -a --amount"
            ;;
        *)
            opts=""
            ;;
    esac

    if [[ ${cur} == -* ]]; then
        COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
        return 0
    fi
}

complete -F _selendra_completions selendra
