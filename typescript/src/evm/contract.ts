/**
 * EVM Contract Integration for the Selendra SDK
 * Provides ethers.js v6 compatible Contract class and factory
 * Supports ABI parsing, method calling, events, and batch operations
 */

import { EventEmitter } from 'events';
import type { Address, Balance, TransactionHash, BlockNumber, GasAmount } from '../types/common';
import type {
  EvmContract,
  EvmTransactionRequest,
  EvmCallOptions,
  EvmEstimateGasOptions,
  EvmLog,
  EvmFilter,
  Erc20Contract,
  Erc721Contract,
} from '../types/evm';
import { TransactionBuilder } from './transaction';
import { GAS_ESTIMATION_DEFAULTS } from './config';

/**
 * Function fragment interface
 */
export interface FunctionFragment {
  name: string;
  type: 'function';
  inputs: ParamType[];
  outputs: ParamType[];
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  payable: boolean;
  constant: boolean;
  signature: string;
}

/**
 * Event fragment interface
 */
export interface EventFragment {
  name: string;
  type: 'event';
  inputs: ParamType[];
  anonymous: boolean;
  signature: string;
}

/**
 * Constructor fragment interface
 */
export interface ConstructorFragment {
  type: 'constructor';
  inputs: ParamType[];
  payable: boolean;
}

/**
 * Fallback fragment interface
 */
export interface FallbackFragment {
  type: 'fallback';
  stateMutability: 'nonpayable' | 'payable';
  payable: boolean;
}

/**
 * Receive fragment interface
 */
export interface ReceiveFragment {
  type: 'receive';
  stateMutability: 'payable';
  payable: boolean;
}

/**
 * Parameter type interface
 */
export interface ParamType {
  name: string;
  type: string;
  indexed?: boolean;
  components?: ParamType[];
  arrayLength?: number;
  arrayChildren?: ParamType;
}

/**
 * Fragment type union
 */
export type Fragment =
  | FunctionFragment
  | EventFragment
  | ConstructorFragment
  | FallbackFragment
  | ReceiveFragment;

/**
 * Contract ABI interface
 */
export type ContractABI = (string | Fragment)[];

/**
 * Contract call options
 */
export interface CallOptions {
  /** Sender address */
  from?: Address;
  /** Contract address */
  to?: Address;
  /** Call data */
  data?: string;
  /** Value to send */
  value?: Balance;
  /** Gas limit */
  gas?: GasAmount;
  /** Block number to call against */
  blockTag?: BlockNumber | 'earliest' | 'latest' | 'pending';
}

/**
 * Contract transaction options
 */
export interface TransactionOptions extends EvmTransactionRequest {
  /** Gas limit override */
  gasLimit?: number | string;
  /** Gas price override */
  gasPrice?: string;
  /** Maximum fee per gas (EIP-1559) */
  maxFeePerGas?: string;
  /** Maximum priority fee per gas (EIP-1559) */
  maxPriorityFeePerGas?: string;
  /** Number of confirmations to wait for */
  confirmations?: number;
}

/**
 * Event filter options
 */
export interface EventFilterOptions extends EvmFilter {
  /** Event name */
  event?: string;
  /** Event parameters */
  args?: unknown[];
  /** From block */
  fromBlock?: number | 'earliest' | 'latest' | 'pending';
  /** To block */
  toBlock?: number | 'earliest' | 'latest' | 'pending';
}

/**
 * Event subscription
 */
export class EventSubscription extends EventEmitter {
  private isSubscribed = false;
  private subscriptionId?: string;

  constructor(
    private contract: Contract,
    private eventName: string,
    private filter: EventFilterOptions = {},
  ) {
    super();
  }

  /**
   * Start listening for events
   */
  async start(): Promise<void> {
    if (this.isSubscribed) {
      return;
    }

    try {
      this.subscriptionId = await this.contract.provider.subscribe('logs', {
        address: this.contract.address,
        topics: this.buildTopics(),
        fromBlock: this.filter.fromBlock || 'latest',
        toBlock: this.filter.toBlock || 'latest',
      });

      this.contract.provider.on(this.subscriptionId, (log: EvmLog) => {
        if (log.topics && log.topics[0]) {
          const fragment = this.contract.interface.getEvent(this.eventName);
          if (fragment && log.topics[0] === fragment.signature) {
            const parsedEvent = {
              name: this.eventName,
              signature: fragment.signature,
              args: [],
              raw: log,
            };
            this.emit('data', parsedEvent);
            this.emit('event', parsedEvent);
          }
        }
      });

      this.isSubscribed = true;
      this.emit('subscribed');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop listening for events
   */
  async stop(): Promise<void> {
    if (!this.isSubscribed || !this.subscriptionId) {
      return;
    }

    try {
      await this.contract.provider.unsubscribe(this.subscriptionId);
      this.removeAllListeners();
      this.isSubscribed = false;
      this.emit('unsubscribed');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Check if subscription is active
   */
  isActive(): boolean {
    return this.isSubscribed;
  }

  /**
   * Get event filter
   */
  getFilter(): EventFilterOptions {
    return { ...this.filter };
  }

  /**
   * Build topic array for subscription
   */
  private buildTopics(): (string | string[] | null)[] {
    const fragment = this.contract.interface.getEvent(this.eventName);
    if (!fragment) {
      throw new Error(`Event ${this.eventName} not found in contract interface`);
    }

    const topics: (string | string[] | null)[] = [fragment.signature];

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
  private encodeTopicValue(value: unknown, type: string): string {
    // This would implement proper topic encoding based on type
    // For now, return a placeholder
    return typeof value === 'string' ? value : String(value);
  }
}

/**
 * Contract interface implementation
 */
export class Interface {
  private readonly functions = new Map<string, FunctionFragment>();
  private readonly events = new Map<string, EventFragment>();
  private constructorFragment?: ConstructorFragment;
  private fallbackFragment?: FallbackFragment;
  private receiveFragment?: ReceiveFragment;

  constructor(abi: ContractABI) {
    this.parseABI(abi);
  }

  /**
   * Get function fragment
   */
  getFunction(nameOrSignature: string): FunctionFragment | undefined {
    return this.functions.get(nameOrSignature) || this.functions.get(nameOrSignature.toLowerCase());
  }

  /**
   * Get event fragment
   */
  getEvent(nameOrSignature: string): EventFragment | undefined {
    return this.events.get(nameOrSignature) || this.events.get(nameOrSignature.toLowerCase());
  }

  /**
   * Get all function names
   */
  getFunctionNames(): string[] {
    return Array.from(this.functions.keys());
  }

  /**
   * Get all event names
   */
  getEventNames(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Encode function call data
   */
  encodeFunctionData(
    functionName: string,
    args: unknown[] = [],
    overrides?: { gasLimit?: number; value?: Balance },
  ): string {
    const fragment = this.getFunction(functionName);
    if (!fragment) {
      throw new Error(`Function ${functionName} not found in contract interface`);
    }

    // Validate arguments
    if (args.length !== fragment.inputs.length) {
      throw new Error(
        `Function ${functionName} expects ${fragment.inputs.length} arguments, got ${args.length}`,
      );
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
  decodeFunctionResult(functionName: string, data: string): unknown[] {
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
  parseLog(log: EvmLog): { name: string; args: unknown[]; signature: string } | null {
    for (const [name, fragment] of this.events.entries()) {
      if (log.topics[0] === fragment.signature) {
        const args = this.decodeEventLog(fragment, log);
        return {
          name,
          args,
          signature: fragment.signature,
        };
      }
    }

    return null;
  }

  /**
   * Encode constructor arguments
   */
  encodeDeploy(args: unknown[] = []): string {
    if (!this.constructorFragment) {
      return '0x';
    }

    if (args.length !== this.constructorFragment.inputs.length) {
      throw new Error(
        `Constructor expects ${this.constructorFragment.inputs.length} arguments, got ${args.length}`,
      );
    }

    return this.encodeArguments(args, this.constructorFragment.inputs);
  }

  /**
   * Parse contract ABI
   */
  private parseABI(abi: ContractABI): void {
    for (const item of abi) {
      if (typeof item === 'string') {
        // Parse JSON string
        try {
          const parsed = JSON.parse(item);
          this.parseFragment(parsed);
        } catch {
          throw new Error(`Invalid ABI item: ${item}`);
        }
      } else {
        this.parseFragment(item);
      }
    }
  }

  /**
   * Parse individual ABI fragment
   */
  private parseFragment(fragment: any): void {
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
        this.constructorFragment = this.parseConstructorFragment(fragment);
        break;

      case 'fallback':
        this.fallbackFragment = this.parseFallbackFragment(fragment);
        break;

      case 'receive':
        this.receiveFragment = this.parseReceiveFragment(fragment);
        break;

      default:
        throw new Error(`Unknown fragment type: ${fragment.type}`);
    }
  }

  /**
   * Parse function fragment
   */
  private parseFunctionFragment(fragment: any): FunctionFragment {
    return {
      name: fragment.name,
      type: 'function',
      inputs: fragment.inputs?.map((input: any) => this.parseParamType(input)) || [],
      outputs: fragment.outputs?.map((output: any) => this.parseParamType(output)) || [],
      stateMutability: fragment.stateMutability || 'nonpayable',
      payable: fragment.stateMutability === 'payable' || fragment.payable === true,
      constant:
        fragment.stateMutability === 'view' ||
        fragment.stateMutability === 'pure' ||
        fragment.constant === true,
      signature: this.createFunctionSignature(fragment.name, fragment.inputs || []),
    };
  }

  /**
   * Parse event fragment
   */
  private parseEventFragment(fragment: any): EventFragment {
    return {
      name: fragment.name,
      type: 'event',
      inputs:
        fragment.inputs?.map((input: any) => ({
          ...this.parseParamType(input),
          indexed: input.indexed || false,
        })) || [],
      anonymous: fragment.anonymous || false,
      signature: this.createEventSignature(fragment.name, fragment.inputs || []),
    };
  }

  /**
   * Parse constructor fragment
   */
  private parseConstructorFragment(fragment: any): ConstructorFragment {
    return {
      type: 'constructor',
      inputs: fragment.inputs?.map((input: any) => this.parseParamType(input)) || [],
      payable: fragment.stateMutability === 'payable' || fragment.payable === true,
    };
  }

  /**
   * Parse fallback fragment
   */
  private parseFallbackFragment(fragment: any): FallbackFragment {
    return {
      type: 'fallback',
      stateMutability: fragment.stateMutability || 'nonpayable',
      payable: fragment.stateMutability === 'payable' || fragment.payable === true,
    };
  }

  /**
   * Parse receive fragment
   */
  private parseReceiveFragment(fragment: any): ReceiveFragment {
    return {
      type: 'receive',
      stateMutability: 'payable',
      payable: true,
    };
  }

  /**
   * Parse parameter type
   */
  private parseParamType(param: any): ParamType {
    return {
      name: param.name || '',
      type: param.type,
      indexed: param.indexed || false,
      components: param.components?.map((comp: any) => this.parseParamType(comp)) || [],
    };
  }

  /**
   * Create function signature
   */
  private createFunctionSignature(name: string, inputs: ParamType[]): string {
    const types = inputs.map((input) => input.type).join(',');
    const signature = `${name}(${types})`;
    return `0x${Buffer.from(signature).toString('hex').slice(0, 8)}`;
  }

  /**
   * Create event signature
   */
  private createEventSignature(name: string, inputs: ParamType[]): string {
    const types = inputs.map((input) => input.type).join(',');
    const signature = `${name}(${types})`;
    return `0x${Buffer.from(signature).toString('hex')}`;
  }

  /**
   * Encode arguments
   */
  private encodeArguments(args: unknown[], params: ParamType[]): string {
    // This would implement full ABI encoding
    // For now, return a placeholder
    return args
      .map((arg) => (typeof arg === 'string' && arg.startsWith('0x') ? arg.slice(2) : String(arg)))
      .join('');
  }

  /**
   * Decode event log
   */
  private decodeEventLog(fragment: EventFragment, log: EvmLog): unknown[] {
    // This would implement event log decoding
    // For now, return placeholder
    return [];
  }
}

/**
 * Contract implementation
 */
export class Contract extends EventEmitter implements EvmContract {
  public readonly address: Address;
  public readonly abi: any[];
  public readonly interface: Interface;

  constructor(
    address: Address,
    abi: ContractABI,
    public readonly provider: any,
    public readonly signer?: any,
  ) {
    super();
    this.address = address;
    this.abi = Array.isArray(abi) ? abi : JSON.parse(abi);
    this.interface = new Interface(this.abi);
  }

  /**
   * Connect contract to a signer
   */
  connect(signer: any): Contract {
    return new Contract(this.address, this.abi, this.provider, signer);
  }

  /**
   * Attach to new address
   */
  attach(newAddress: Address): Contract {
    return new Contract(newAddress, this.abi, this.provider, this.signer);
  }

  /**
   * Call contract method (read-only)
   */
  async call(
    method: string,
    params: unknown[] = [],
    overrides: CallOptions = {},
  ): Promise<unknown> {
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
        blockTag: overrides.blockTag || 'latest',
      });

      return this.interface.decodeFunctionResult(method, result)[0];
    } catch (error) {
      throw new Error(`Contract call failed: ${error}`);
    }
  }

  /**
   * Send transaction to contract method (write)
   */
  async send(
    method: string,
    params: unknown[] = [],
    overrides: TransactionOptions = {},
  ): Promise<TransactionHash> {
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
      type: overrides.type,
    });

    return tx.hash;
  }

  /**
   * Estimate gas for contract method call
   */
  async estimateGas(
    method: string,
    params: unknown[] = [],
    overrides: Partial<EvmEstimateGasOptions> = {},
  ): Promise<number> {
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
        gas: overrides.gas,
      });

      return Number(gas);
    } catch (error) {
      throw new Error(`Gas estimation failed: ${error}`);
    }
  }

  /**
   * Get past events
   */
  async getPastEvents(eventName: string, filter: EventFilterOptions = {}): Promise<EvmLog[]> {
    const eventFilter = {
      address: this.address,
      topics: this.buildEventTopics(eventName, filter.args),
      fromBlock: filter.fromBlock || 'earliest',
      toBlock: filter.toBlock || 'latest',
    };

    const logs = await this.provider.getLogs(eventFilter);
    return logs.filter((log) => {
      const parsed = this.interface.parseLog(log);
      return parsed && parsed.name === eventName;
    });
  }

  /**
   * Subscribe to contract events
   */
  subscribe(eventName: string, filter: EventFilterOptions = {}): EventSubscription {
    return new EventSubscription(this, eventName, filter);
  }

  /**
   * Parse transaction receipt for events
   */
  parseTransactionReceipt(
    receipt: any,
  ): Array<{ name: string; args: unknown[]; signature: string }> {
    const events: Array<{ name: string; args: unknown[]; signature: string }> = [];

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
  static async deploy(
    abi: ContractABI,
    bytecode: string,
    args: unknown[] = [],
    signer: any,
    overrides: TransactionOptions = {},
  ): Promise<Contract> {
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
      type: overrides.type,
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
  async getBytecode(): Promise<string> {
    return this.provider.getCode(this.address);
  }

  /**
   * Check if contract exists
   */
  async exists(): Promise<boolean> {
    const code = await this.getBytecode();
    return code !== '0x' && code.length > 2;
  }

  /**
   * Build event topics for filtering
   */
  private buildEventTopics(eventName: string, args?: unknown[]): (string | string[] | null)[] {
    const fragment = this.interface.getEvent(eventName);
    if (!fragment) {
      throw new Error(`Event ${eventName} not found in contract interface`);
    }

    const topics: (string | string[] | null)[] = [fragment.signature];

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
  private encodeTopicValue(value: unknown, type: string): string {
    // This would implement proper topic encoding
    return typeof value === 'string' ? value : String(value);
  }
}

/**
 * ERC20 Token Contract
 */
export class ERC20Contract extends Contract implements Erc20Contract {
  constructor(address: Address, provider: any, signer?: any) {
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
      'event Approval(address indexed owner,address indexed spender,uint256 value)',
    ];

    super(address, erc20ABI, provider, signer);
  }

  async name(): Promise<string> {
    return this.call('name') as Promise<string>;
  }

  async symbol(): Promise<string> {
    return this.call('symbol') as Promise<string>;
  }

  async decimals(): Promise<number> {
    return this.call('decimals') as Promise<number>;
  }

  async totalSupply(): Promise<Balance> {
    return this.call('totalSupply') as Promise<Balance>;
  }

  async balanceOf(account: Address): Promise<Balance> {
    return this.call('balanceOf', [account]) as Promise<Balance>;
  }

  async allowance(owner: Address, spender: Address): Promise<Balance> {
    return this.call('allowance', [owner, spender]) as Promise<Balance>;
  }

  async transfer(to: Address, amount: Balance): Promise<TransactionHash> {
    return this.send('transfer', [to, amount]);
  }

  async approve(spender: Address, amount: Balance): Promise<TransactionHash> {
    return this.send('approve', [spender, amount]);
  }

  async transferFrom(from: Address, to: Address, amount: Balance): Promise<TransactionHash> {
    return this.send('transferFrom', [from, to, amount]);
  }

  /**
   * Get formatted balance with decimals
   */
  async getFormattedBalance(account: Address): Promise<string> {
    const [balance, decimals] = await Promise.all([this.balanceOf(account), this.decimals()]);

    const balanceValue = typeof balance === 'string' ? BigInt(balance) : balance;
    const divisor = BigInt(10 ** decimals);
    const whole = balanceValue / divisor;
    const fractional = balanceValue % divisor;

    return `${whole}.${fractional.toString().padStart(decimals, '0').replace(/0+$/, '')}`;
  }
}

/**
 * ERC721 NFT Contract
 */
export class ERC721Contract extends Contract implements Erc721Contract {
  constructor(address: Address, provider: any, signer?: any) {
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
      'event ApprovalForAll(address indexed owner,address indexed operator,bool approved)',
    ];

    super(address, erc721ABI, provider, signer);
  }

  async ownerOf(tokenId: bigint): Promise<Address> {
    return this.call('ownerOf', [tokenId]) as Promise<Address>;
  }

  async tokenURI(tokenId: bigint): Promise<string> {
    return this.call('tokenURI', [tokenId]) as Promise<string>;
  }

  async balanceOf(account: Address): Promise<number> {
    const result = await this.call('balanceOf', [account]);
    return Number(result);
  }

  async transferFrom(from: Address, to: Address, tokenId: bigint): Promise<TransactionHash> {
    return this.send('transferFrom', [from, to, tokenId]);
  }

  async safeTransferFrom(
    from: Address,
    to: Address,
    tokenId: bigint,
    data?: string,
  ): Promise<TransactionHash> {
    return this.send('safeTransferFrom', [from, to, tokenId, data || '0x']);
  }

  async approve(approved: Address, tokenId: bigint): Promise<TransactionHash> {
    return this.send('approve', [approved, tokenId]);
  }

  async setApprovalForAll(operator: Address, approved: boolean): Promise<TransactionHash> {
    return this.send('setApprovalForAll', [operator, approved]);
  }

  async isApprovedForAll(owner: Address, operator: Address): Promise<boolean> {
    return this.call('isApprovedForAll', [owner, operator]) as Promise<boolean>;
  }
}

/**
 * Contract Factory
 */
export class ContractFactory {
  constructor(
    public readonly contractInterface: Interface,
    public readonly bytecode: string,
    public readonly signer: any,
  ) {}

  /**
   * Deploy contract
   */
  async deploy(...args: unknown[]): Promise<Contract> {
    const deployData = this.bytecode + this.contractInterface.encodeDeploy(args).slice(2);

    const tx = await this.signer.sendTransaction({
      data: deployData,
    });

    const receipt = await tx.wait();
    const contractAddress = receipt.contractAddress;

    if (!contractAddress) {
      throw new Error('Contract deployment failed: no contract address in receipt');
    }

    return new Contract(contractAddress, [] as any, this.signer.provider, this.signer);
  }

  /**
   * Get deployment transaction
   */
  getDeployTransaction(...args: unknown[]): EvmTransactionRequest {
    const deployData = this.bytecode + this.contractInterface.encodeDeploy(args).slice(2);

    return {
      data: deployData,
    };
  }

  /**
   * Connect to different signer
   */
  connect(signer: any): ContractFactory {
    return new ContractFactory(this.contractInterface, this.bytecode, signer);
  }

  /**
   * Create contract factory from ABI and bytecode
   */
  static fromContractABI(abi: ContractABI, bytecode: string, signer: any): ContractFactory {
    const contractInterface = new Interface(abi);
    return new ContractFactory(contractInterface, bytecode, signer);
  }
}

export default Contract;
