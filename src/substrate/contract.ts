import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { Abi } from '@polkadot/api-contract';
import { SubstrateAPI } from './api';

export class SubstrateContract {
  private api: SubstrateAPI;
  private contract?: ContractPromise;
  private address: string;
  private abi: any;

  constructor(api: SubstrateAPI, address: string, abi: any) {
    this.api = api;
    this.address = address;
    this.abi = abi;
    this.initializeContract();
  }

  private initializeContract(): void {
    const apiInstance = this.api.getAPI();
    const contractAbi = new Abi(this.abi, apiInstance.registry.getChainProperties());
    this.contract = new ContractPromise(apiInstance, contractAbi, this.address);
  }

  /**
   * Query contract (read-only call)
   */
  async query(
    methodName: string,
    options: any = {},
    params: any[] = []
  ): Promise<any> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const { gasConsumed, gasRequired, output, result } = await this.contract.query[methodName](
        options.caller || '',
        {
          gasLimit: options.gasLimit || -1,
          storageDepositLimit: options.storageDepositLimit || null,
          value: options.value || 0
        },
        ...params
      );

      if (result.isErr) {
        throw new Error(`Contract query failed: ${result.asErr}`);
      }

      return {
        gasConsumed: gasConsumed.toString(),
        gasRequired: gasRequired.toString(),
        output: output?.toHuman(),
        result: output?.toJSON()
      };
    } catch (error) {
      throw new Error(`Contract query failed: ${error}`);
    }
  }

  /**
   * Execute contract method (state-changing call)
   */
  async execute(
    methodName: string,
    account: any,
    options: any = {},
    params: any[] = []
  ): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      // Estimate gas first
      const gasLimit = options.gasLimit || await this.estimateGas(methodName, options, params);

      const extrinsic = this.contract.tx[methodName]({
        gasLimit,
        storageDepositLimit: options.storageDepositLimit || null,
        value: options.value || 0
      }, ...params);

      const hash = await extrinsic.signAndSend(account);
      return hash.toString();
    } catch (error) {
      throw new Error(`Contract execution failed: ${error}`);
    }
  }

  /**
   * Estimate gas for contract call
   */
  async estimateGas(
    methodName: string,
    options: any = {},
    params: any[] = []
  ): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const { gasConsumed, gasRequired } = await this.contract.query[methodName](
        options.caller || '',
        {
          gasLimit: -1,
          storageDepositLimit: options.storageDepositLimit || null,
          value: options.value || 0
        },
        ...params
      );

      // Add buffer to gas estimate
      const buffer = Math.ceil(gasRequired.toNumber() * 0.2); // 20% buffer
      return (gasRequired.toNumber() + buffer).toString();
    } catch (error) {
      throw new Error(`Gas estimation failed: ${error}`);
    }
  }

  /**
   * Get contract metadata
   */
  getMetadata(): any {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    return this.contract.abi.metadata.toHuman();
  }

  /**
   * Get contract address
   */
  getAddress(): string {
    return this.address;
  }

  /**
   * Get contract ABI
   */
  getABI(): any {
    return this.abi;
  }

  /**
   * Subscribe to contract events
   */
  async subscribeToEvents(callback: (event: any) => void): Promise<() => void> {
    const apiInstance = this.api.getAPI();
    
    const unsubscribe = await apiInstance.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        
        if (apiInstance.events.contracts.ContractExecution.is(event)) {
          const [account, contractAddress] = event.data;
          
          if (contractAddress.toString() === this.address) {
            callback({
              type: 'ContractExecution',
              account: account.toString(),
              contractAddress: contractAddress.toString(),
              data: event.data
            });
          }
        }
      });
    });

    return unsubscribe;
  }
}

/**
 * Contract deployment helper
 */
export class ContractDeployer {
  private api: SubstrateAPI;

  constructor(api: SubstrateAPI) {
    this.api = api;
  }

  /**
   * Deploy a new contract
   */
  async deploy(
    codeHash: string,
    abi: any,
    constructorParams: any[] = [],
    options: any = {},
    account: any
  ): Promise<{ address: string; hash: string }> {
    const apiInstance = this.api.getAPI();
    
    try {
      const contractAbi = new Abi(abi, apiInstance.registry.getChainProperties());
      const gasLimit = options.gasLimit || 100000000000; // Default gas limit

      // Create instantiate extrinsic
      const extrinsic = apiInstance.tx.contracts.instantiateWithCode(
        options.value || 0,
        gasLimit,
        options.storageDepositLimit || null,
        codeHash,
        constructorParams.length > 0 ? contractAbi.constructors[0].toU8a(constructorParams) : []
      );

      // Sign and send transaction
      const hash = await extrinsic.signAndSend(account);
      
      // Wait for contract deployment and get address
      // Note: In a real implementation, you'd need to parse events to get the contract address
      const contractAddress = 'CONTRACT_ADDRESS_FROM_EVENTS';

      return {
        address: contractAddress,
        hash: hash.toString()
      };
    } catch (error) {
      throw new Error(`Contract deployment failed: ${error}`);
    }
  }

  /**
   * Upload contract code
   */
  async uploadCode(
    wasmCode: Uint8Array,
    account: any,
    options: any = {}
  ): Promise<{ codeHash: string; hash: string }> {
    const apiInstance = this.api.getAPI();

    try {
      const extrinsic = apiInstance.tx.contracts.uploadCode(
        wasmCode,
        options.storageDepositLimit || null,
        options.determinism || 'Enforced'
      );

      const hash = await extrinsic.signAndSend(account);
      
      // Calculate code hash
      const codeHash = apiInstance.registry.hash(wasmCode).toString();

      return {
        codeHash,
        hash: hash.toString()
      };
    } catch (error) {
      throw new Error(`Code upload failed: ${error}`);
    }
  }

  /**
   * Instantiate contract from existing code
   */
  async instantiate(
    codeHash: string,
    abi: any,
    constructorParams: any[] = [],
    options: any = {},
    account: any
  ): Promise<{ address: string; hash: string }> {
    const apiInstance = this.api.getAPI();

    try {
      const contractAbi = new Abi(abi, apiInstance.registry.getChainProperties());
      const gasLimit = options.gasLimit || 100000000000;

      const extrinsic = apiInstance.tx.contracts.instantiate(
        options.value || 0,
        gasLimit,
        options.storageDepositLimit || null,
        codeHash,
        constructorParams.length > 0 ? contractAbi.constructors[0].toU8a(constructorParams) : [],
        options.salt || new Uint8Array()
      );

      const hash = await extrinsic.signAndSend(account);
      
      // In a real implementation, parse events to get the actual contract address
      const contractAddress = 'CONTRACT_ADDRESS_FROM_EVENTS';

      return {
        address: contractAddress,
        hash: hash.toString()
      };
    } catch (error) {
      throw new Error(`Contract instantiation failed: ${error}`);
    }
  }
}