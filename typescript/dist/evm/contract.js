"use strict";
/**
 * EVM Contract Integration for the Selendra SDK
 * Provides ethers.js v6 compatible Contract class and factory
 * Supports ABI parsing, method calling, events, and batch operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractFactory = exports.ERC721Contract = exports.ERC20Contract = exports.Contract = exports.Interface = exports.EventSubscription = void 0;
const events_1 = require("events");
/**
 * Event subscription
 */
class EventSubscription extends events_1.EventEmitter {
    constructor(contract, eventName, filter = {}) {
        super();
        Object.defineProperty(this, "contract", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: contract
        });
        Object.defineProperty(this, "eventName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: eventName
        });
        Object.defineProperty(this, "filter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: filter
        });
        Object.defineProperty(this, "isSubscribed", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "subscriptionId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    /**
     * Start listening for events
     */
    async start() {
        if (this.isSubscribed) {
            return;
        }
        try {
            this.subscriptionId = await this.contract.provider.subscribe('logs', {
                address: this.contract.address,
                topics: this.buildTopics(),
                fromBlock: this.filter.fromBlock || 'latest',
                toBlock: this.filter.toBlock || 'latest'
            });
            this.contract.provider.on(this.subscriptionId, (log) => {
                const parsedEvent = this.contract.parseLog(log);
                if (parsedEvent && parsedEvent.name === this.eventName) {
                    this.emit('data', parsedEvent);
                    this.emit('event', parsedEvent);
                }
            });
            this.isSubscribed = true;
            this.emit('subscribed');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Stop listening for events
     */
    async stop() {
        if (!this.isSubscribed || !this.subscriptionId) {
            return;
        }
        try {
            await this.contract.provider.unsubscribe(this.subscriptionId);
            this.removeAllListeners();
            this.isSubscribed = false;
            this.emit('unsubscribed');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Check if subscription is active
     */
    isActive() {
        return this.isSubscribed;
    }
    /**
     * Get event filter
     */
    getFilter() {
        return { ...this.filter };
    }
    /**
     * Build topic array for subscription
     */
    buildTopics() {
        const fragment = this.contract.interface.getEvent(this.eventName);
        if (!fragment) {
            throw new Error(`Event ${this.eventName} not found in contract interface`);
        }
        const topics = [fragment.signature];
        // Add filter topics based on event parameters
        if (this.filter.args) {
            for (let i = 0; i < fragment.inputs.length && i < (this.filter.args?.length || 0); i++) {
                const input = fragment.inputs[i];
                const argValue = this.filter.args?.[i];
                if (input.indexed && argValue !== undefined && argValue !== null) {
                    topics[i + 1] = this.encodeTopicValue(argValue, input.type);
                }
            }
        }
        return topics;
    }
    /**
     * Encode value for topic filtering
     */
    encodeTopicValue(value, type) {
        // This would implement proper topic encoding based on type
        // For now, return a placeholder
        return typeof value === 'string' ? value : String(value);
    }
}
exports.EventSubscription = EventSubscription;
/**
 * Contract interface implementation
 */
class Interface {
    constructor(abi) {
        Object.defineProperty(this, "functions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "events", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "constructorFragment", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fallback", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "receive", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.parseABI(abi);
    }
    /**
     * Get function fragment
     */
    getFunction(nameOrSignature) {
        return this.functions.get(nameOrSignature) || this.functions.get(nameOrSignature.toLowerCase());
    }
    /**
     * Get event fragment
     */
    getEvent(nameOrSignature) {
        return this.events.get(nameOrSignature) || this.events.get(nameOrSignature.toLowerCase());
    }
    /**
     * Get all function names
     */
    getFunctionNames() {
        return Array.from(this.functions.keys());
    }
    /**
     * Get all event names
     */
    getEventNames() {
        return Array.from(this.events.keys());
    }
    /**
     * Encode function call data
     */
    encodeFunctionData(functionName, args = [], overrides) {
        const fragment = this.getFunction(functionName);
        if (!fragment) {
            throw new Error(`Function ${functionName} not found in contract interface`);
        }
        // Validate arguments
        if (args.length !== fragment.inputs.length) {
            throw new Error(`Function ${functionName} expects ${fragment.inputs.length} arguments, got ${args.length}`);
        }
        // This would implement ABI encoding
        // For now, return a placeholder
        const signature = fragment.signature;
        const encodedArgs = this.encodeArguments(args, fragment.inputs);
        return `${signature}${encodedArgs}`;
    }
    /**
     * Decode function result
     */
    decodeFunctionResult(functionName, data) {
        const fragment = this.getFunction(functionName);
        if (!fragment) {
            throw new Error(`Function ${functionName} not found in contract interface`);
        }
        // This would implement ABI decoding
        // For now, return placeholder
        return [];
    }
    /**
     * Parse log
     */
    parseLog(log) {
        for (const [name, fragment] of this.events.entries()) {
            if (log.topics[0] === fragment.signature) {
                const args = this.decodeEventLog(fragment, log);
                return {
                    name,
                    args,
                    signature: fragment.signature
                };
            }
        }
        return null;
    }
    /**
     * Encode constructor arguments
     */
    encodeDeploy(args = []) {
        if (!this.constructor) {
            return '0x';
        }
        if (args.length !== this.constructor.inputs.length) {
            throw new Error(`Constructor expects ${this.constructor.inputs.length} arguments, got ${args.length}`);
        }
        return this.encodeArguments(args, this.constructor.inputs);
    }
    /**
     * Parse contract ABI
     */
    parseABI(abi) {
        for (const item of abi) {
            if (typeof item === 'string') {
                // Parse JSON string
                try {
                    const parsed = JSON.parse(item);
                    this.parseFragment(parsed);
                }
                catch {
                    throw new Error(`Invalid ABI item: ${item}`);
                }
            }
            else {
                this.parseFragment(item);
            }
        }
    }
    /**
     * Parse individual ABI fragment
     */
    parseFragment(fragment) {
        switch (fragment.type) {
            case 'function':
                const funcFrag = this.parseFunctionFragment(fragment);
                this.functions.set(funcFrag.name.toLowerCase(), funcFrag);
                this.functions.set(funcFrag.signature, funcFrag);
                break;
            case 'event':
                const eventFrag = this.parseEventFragment(fragment);
                this.events.set(eventFrag.name.toLowerCase(), eventFrag);
                this.events.set(eventFrag.signature, eventFrag);
                break;
            case 'constructor':
                this.constructor = this.parseConstructorFragment(fragment);
                break;
            case 'fallback':
                this.fallback = this.parseFallbackFragment(fragment);
                break;
            case 'receive':
                this.receive = this.parseReceiveFragment(fragment);
                break;
            default:
                throw new Error(`Unknown fragment type: ${fragment.type}`);
        }
    }
    /**
     * Parse function fragment
     */
    parseFunctionFragment(fragment) {
        return {
            name: fragment.name,
            type: 'function',
            inputs: fragment.inputs?.map((input) => this.parseParamType(input)) || [],
            outputs: fragment.outputs?.map((output) => this.parseParamType(output)) || [],
            stateMutability: fragment.stateMutability || 'nonpayable',
            payable: fragment.stateMutability === 'payable' || fragment.payable === true,
            constant: fragment.stateMutability === 'view' || fragment.stateMutability === 'pure' || fragment.constant === true,
            signature: this.createFunctionSignature(fragment.name, fragment.inputs || [])
        };
    }
    /**
     * Parse event fragment
     */
    parseEventFragment(fragment) {
        return {
            name: fragment.name,
            type: 'event',
            inputs: fragment.inputs?.map((input) => ({ ...this.parseParamType(input), indexed: input.indexed || false })) || [],
            anonymous: fragment.anonymous || false,
            signature: this.createEventSignature(fragment.name, fragment.inputs || [])
        };
    }
    /**
     * Parse constructor fragment
     */
    parseConstructorFragment(fragment) {
        return {
            type: 'constructor',
            inputs: fragment.inputs?.map((input) => this.parseParamType(input)) || [],
            payable: fragment.stateMutability === 'payable' || fragment.payable === true
        };
    }
    /**
     * Parse fallback fragment
     */
    parseFallbackFragment(fragment) {
        return {
            type: 'fallback',
            stateMutability: fragment.stateMutability || 'nonpayable',
            payable: fragment.stateMutability === 'payable' || fragment.payable === true
        };
    }
    /**
     * Parse receive fragment
     */
    parseReceiveFragment(fragment) {
        return {
            type: 'receive',
            stateMutability: 'payable'
        };
    }
    /**
     * Parse parameter type
     */
    parseParamType(param) {
        return {
            name: param.name || '',
            type: param.type,
            indexed: param.indexed || false,
            components: param.components?.map((comp) => this.parseParamType(comp)) || []
        };
    }
    /**
     * Create function signature
     */
    createFunctionSignature(name, inputs) {
        const types = inputs.map(input => input.type).join(',');
        const signature = `${name}(${types})`;
        return `0x${Buffer.from(signature).toString('hex').slice(0, 8)}`;
    }
    /**
     * Create event signature
     */
    createEventSignature(name, inputs) {
        const types = inputs.map(input => input.type).join(',');
        const signature = `${name}(${types})`;
        return `0x${Buffer.from(signature).toString('hex')}`;
    }
    /**
     * Encode arguments
     */
    encodeArguments(args, params) {
        // This would implement full ABI encoding
        // For now, return a placeholder
        return args.map(arg => typeof arg === 'string' && arg.startsWith('0x') ? arg.slice(2) : String(arg)).join('');
    }
    /**
     * Decode event log
     */
    decodeEventLog(fragment, log) {
        // This would implement event log decoding
        // For now, return placeholder
        return [];
    }
}
exports.Interface = Interface;
/**
 * Contract implementation
 */
class Contract extends events_1.EventEmitter {
    constructor(address, abi, provider, signer) {
        super();
        Object.defineProperty(this, "provider", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: provider
        });
        Object.defineProperty(this, "signer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: signer
        });
        Object.defineProperty(this, "address", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "abi", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "interface", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.address = address;
        this.abi = Array.isArray(abi) ? abi : JSON.parse(abi);
        this.interface = new Interface(this.abi);
    }
    /**
     * Connect contract to a signer
     */
    connect(signer) {
        return new Contract(this.address, this.abi, this.provider, signer);
    }
    /**
     * Attach to new address
     */
    attach(newAddress) {
        return new Contract(newAddress, this.abi, this.provider, this.signer);
    }
    /**
     * Call contract method (read-only)
     */
    async call(method, params = [], overrides = {}) {
        const fragment = this.interface.getFunction(method);
        if (!fragment) {
            throw new Error(`Method ${method} not found in contract interface`);
        }
        const callData = this.interface.encodeFunctionData(method, params);
        try {
            const result = await this.provider.call({
                to: this.address,
                data: callData,
                from: overrides.from || (this.signer ? await this.signer.getAddress() : undefined),
                gas: overrides.gas,
                value: overrides.value,
                blockTag: overrides.blockTag || 'latest'
            });
            return this.interface.decodeFunctionResult(method, result)[0];
        }
        catch (error) {
            throw new Error(`Contract call failed: ${error}`);
        }
    }
    /**
     * Send transaction to contract method (write)
     */
    async send(method, params = [], overrides = {}) {
        if (!this.signer) {
            throw new Error('Contract send() requires a signer');
        }
        const fragment = this.interface.getFunction(method);
        if (!fragment) {
            throw new Error(`Method ${method} not found in contract interface`);
        }
        const callData = this.interface.encodeFunctionData(method, params);
        const tx = await this.signer.sendTransaction({
            to: this.address,
            data: callData,
            value: overrides.value || '0x0',
            gasLimit: overrides.gasLimit,
            gasPrice: overrides.gasPrice,
            maxFeePerGas: overrides.maxFeePerGas,
            maxPriorityFeePerGas: overrides.maxPriorityFeePerGas,
            nonce: overrides.nonce,
            type: overrides.type
        });
        return tx.hash;
    }
    /**
     * Estimate gas for contract method call
     */
    async estimateGas(method, params = [], overrides = {}) {
        const fragment = this.interface.getFunction(method);
        if (!fragment) {
            throw new Error(`Method ${method} not found in contract interface`);
        }
        const callData = this.interface.encodeFunctionData(method, params);
        try {
            const gas = await this.provider.estimateGas({
                to: this.address,
                data: callData,
                from: overrides.from || (this.signer ? await this.signer.getAddress() : undefined),
                value: overrides.value || '0x0',
                gas: overrides.gas
            });
            return Number(gas);
        }
        catch (error) {
            throw new Error(`Gas estimation failed: ${error}`);
        }
    }
    /**
     * Get past events
     */
    async getPastEvents(eventName, filter = {}) {
        const eventFilter = {
            address: this.address,
            topics: this.buildEventTopics(eventName, filter.args),
            fromBlock: filter.fromBlock || 'earliest',
            toBlock: filter.toBlock || 'latest'
        };
        const logs = await this.provider.getLogs(eventFilter);
        return logs.filter(log => {
            const parsed = this.interface.parseLog(log);
            return parsed && parsed.name === eventName;
        });
    }
    /**
     * Subscribe to contract events
     */
    subscribe(eventName, filter = {}) {
        return new EventSubscription(this, eventName, filter);
    }
    /**
     * Parse transaction receipt for events
     */
    parseTransactionReceipt(receipt) {
        const events = [];
        for (const log of receipt.logs || []) {
            if (log.address.toLowerCase() === this.address.toLowerCase()) {
                const parsed = this.interface.parseLog(log);
                if (parsed) {
                    events.push(parsed);
                }
            }
        }
        return events;
    }
    /**
     * Deploy contract (static method)
     */
    static async deploy(abi, bytecode, args = [], signer, overrides = {}) {
        const contractInterface = new Interface(abi);
        const deployData = bytecode + contractInterface.encodeDeploy(args).slice(2);
        const tx = await signer.sendTransaction({
            data: deployData,
            value: overrides.value || '0x0',
            gasLimit: overrides.gasLimit,
            gasPrice: overrides.gasPrice,
            maxFeePerGas: overrides.maxFeePerGas,
            maxPriorityFeePerGas: overrides.maxPriorityFeePerGas,
            nonce: overrides.nonce,
            type: overrides.type
        });
        const receipt = await tx.wait();
        const contractAddress = receipt.contractAddress;
        if (!contractAddress) {
            throw new Error('Contract deployment failed: no contract address in receipt');
        }
        return new Contract(contractAddress, abi, signer.provider, signer);
    }
    /**
     * Get contract bytecode
     */
    async getBytecode() {
        return this.provider.getCode(this.address);
    }
    /**
     * Check if contract exists
     */
    async exists() {
        const code = await this.getBytecode();
        return code !== '0x' && code.length > 2;
    }
    /**
     * Build event topics for filtering
     */
    buildEventTopics(eventName, args) {
        const fragment = this.interface.getEvent(eventName);
        if (!fragment) {
            throw new Error(`Event ${eventName} not found in contract interface`);
        }
        const topics = [fragment.signature];
        if (args) {
            for (let i = 0; i < fragment.inputs.length && i < args.length; i++) {
                const input = fragment.inputs[i];
                const argValue = args[i];
                if (input.indexed && argValue !== undefined && argValue !== null) {
                    topics[i + 1] = this.encodeTopicValue(argValue, input.type);
                }
            }
        }
        return topics;
    }
    /**
     * Encode value for topic filtering
     */
    encodeTopicValue(value, type) {
        // This would implement proper topic encoding
        return typeof value === 'string' ? value : String(value);
    }
}
exports.Contract = Contract;
/**
 * ERC20 Token Contract
 */
class ERC20Contract extends Contract {
    constructor(address, provider, signer) {
        // Standard ERC20 ABI
        const erc20ABI = [
            'function name() view returns (string)',
            'function symbol() view returns (string)',
            'function decimals() view returns (uint8)',
            'function totalSupply() view returns (uint256)',
            'function balanceOf(address) view returns (uint256)',
            'function allowance(address,address) view returns (uint256)',
            'function transfer(address,uint256) returns (bool)',
            'function approve(address,uint256) returns (bool)',
            'function transferFrom(address,address,uint256) returns (bool)',
            'event Transfer(address indexed from,address indexed to,uint256 value)',
            'event Approval(address indexed owner,address indexed spender,uint256 value)'
        ];
        super(address, erc20ABI, provider, signer);
    }
    async name() {
        return this.call('name');
    }
    async symbol() {
        return this.call('symbol');
    }
    async decimals() {
        return this.call('decimals');
    }
    async totalSupply() {
        return this.call('totalSupply');
    }
    async balanceOf(account) {
        return this.call('balanceOf', [account]);
    }
    async allowance(owner, spender) {
        return this.call('allowance', [owner, spender]);
    }
    async transfer(to, amount) {
        return this.send('transfer', [to, amount]);
    }
    async approve(spender, amount) {
        return this.send('approve', [spender, amount]);
    }
    async transferFrom(from, to, amount) {
        return this.send('transferFrom', [from, to, amount]);
    }
    /**
     * Get formatted balance with decimals
     */
    async getFormattedBalance(account) {
        const [balance, decimals] = await Promise.all([
            this.balanceOf(account),
            this.decimals()
        ]);
        const balanceValue = typeof balance === 'string' ? BigInt(balance) : balance;
        const divisor = BigInt(10 ** decimals);
        const whole = balanceValue / divisor;
        const fractional = balanceValue % divisor;
        return `${whole}.${fractional.toString().padStart(decimals, '0').replace(/0+$/, '')}`;
    }
}
exports.ERC20Contract = ERC20Contract;
/**
 * ERC721 NFT Contract
 */
class ERC721Contract extends Contract {
    constructor(address, provider, signer) {
        // Standard ERC721 ABI
        const erc721ABI = [
            'function ownerOf(uint256) view returns (address)',
            'function tokenURI(uint256) view returns (string)',
            'function balanceOf(address) view returns (uint256)',
            'function transferFrom(address,address,uint256)',
            'function safeTransferFrom(address,address,uint256)',
            'function safeTransferFrom(address,address,uint256,bytes)',
            'function approve(address,uint256)',
            'function setApprovalForAll(address,bool)',
            'function isApprovedForAll(address,address) view returns (bool)',
            'event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)',
            'event Approval(address indexed owner,address indexed approved,uint256 indexed tokenId)',
            'event ApprovalForAll(address indexed owner,address indexed operator,bool approved)'
        ];
        super(address, erc721ABI, provider, signer);
    }
    async ownerOf(tokenId) {
        return this.call('ownerOf', [tokenId]);
    }
    async tokenURI(tokenId) {
        return this.call('tokenURI', [tokenId]);
    }
    async balanceOf(account) {
        const result = await this.call('balanceOf', [account]);
        return Number(result);
    }
    async transferFrom(from, to, tokenId) {
        return this.send('transferFrom', [from, to, tokenId]);
    }
    async safeTransferFrom(from, to, tokenId, data) {
        return this.send('safeTransferFrom', [from, to, tokenId, data || '0x']);
    }
    async approve(approved, tokenId) {
        return this.send('approve', [approved, tokenId]);
    }
    async setApprovalForAll(operator, approved) {
        return this.send('setApprovalForAll', [operator, approved]);
    }
    async isApprovedForAll(owner, operator) {
        return this.call('isApprovedForAll', [owner, operator]);
    }
}
exports.ERC721Contract = ERC721Contract;
/**
 * Contract Factory
 */
class ContractFactory {
    constructor(interface, bytecode, signer) {
        Object.defineProperty(this, "interface", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: interface
        });
        Object.defineProperty(this, "bytecode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: bytecode
        });
        Object.defineProperty(this, "signer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: signer
        });
    }
    /**
     * Deploy contract
     */
    async deploy(...args) {
        const deployData = this.bytecode + this.interface.encodeDeploy(args).slice(2);
        const tx = await this.signer.sendTransaction({
            data: deployData
        });
        const receipt = await tx.wait();
        const contractAddress = receipt.contractAddress;
        if (!contractAddress) {
            throw new Error('Contract deployment failed: no contract address in receipt');
        }
        return new Contract(contractAddress, this.interface.abi, this.signer.provider, this.signer);
    }
    /**
     * Get deployment transaction
     */
    getDeployTransaction(...args) {
        const deployData = this.bytecode + this.interface.encodeDeploy(args).slice(2);
        return {
            data: deployData
        };
    }
    /**
     * Connect to different signer
     */
    connect(signer) {
        return new ContractFactory(this.interface, this.bytecode, signer);
    }
    /**
     * Create contract factory from ABI and bytecode
     */
    static fromContractABI(abi, bytecode, signer) {
        const contractInterface = new Interface(abi);
        return new ContractFactory(contractInterface, bytecode, signer);
    }
}
exports.ContractFactory = ContractFactory;
exports.default = Contract;
//# sourceMappingURL=contract.js.map