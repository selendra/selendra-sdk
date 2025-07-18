import { NetworkStats, GasPriceInfo, NetworkConfig } from '../types';
import { API_ENDPOINTS } from '../config/networks';

export class APIClient {
  private baseUrl: string;
  private networkConfig: NetworkConfig;

  constructor(networkConfig: NetworkConfig) {
    this.networkConfig = networkConfig;
    this.baseUrl = this.getAPIEndpoint();
  }

  private getAPIEndpoint(): string {
    if (this.networkConfig.chainId === 1961) {
      return API_ENDPOINTS.mainnet;
    } else if (this.networkConfig.chainId === 1953) {
      return API_ENDPOINTS.testnet;
    }
    return 'https://api.selendra.org/v1'; // Default
  }

  /**
   * Make HTTP request
   */
  private async request(endpoint: string, options?: RequestInit): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`API request failed: ${error}`);
    }
  }

  /**
   * Get network statistics
   */
  async getNetworkStats(): Promise<NetworkStats> {
    return await this.request('/network/stats');
  }

  /**
   * Get gas price information
   */
  async getGasPrices(): Promise<GasPriceInfo> {
    return await this.request('/gas/stats');
  }

  /**
   * Get validator information
   */
  async getValidators(): Promise<any[]> {
    const response = await this.request('/validators');
    return response.validators || [];
  }

  /**
   * Get transaction metrics
   */
  async getTransactionMetrics(): Promise<any> {
    return await this.request('/transactions/metrics');
  }

  /**
   * Get block information
   */
  async getBlock(blockNumber: number): Promise<any> {
    return await this.request(`/blocks/${blockNumber}`);
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string): Promise<any> {
    return await this.request(`/transactions/${hash}`);
  }

  /**
   * Get account information
   */
  async getAccount(address: string): Promise<any> {
    return await this.request(`/accounts/${address}`);
  }

  /**
   * Get account transactions
   */
  async getAccountTransactions(
    address: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<any[]> {
    const response = await this.request(
      `/accounts/${address}/transactions?limit=${limit}&offset=${offset}`
    );
    return response.transactions || [];
  }

  /**
   * Get contract information
   */
  async getContract(address: string): Promise<any> {
    return await this.request(`/contracts/${address}`);
  }

  /**
   * Get contract transactions
   */
  async getContractTransactions(
    address: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<any[]> {
    const response = await this.request(
      `/contracts/${address}/transactions?limit=${limit}&offset=${offset}`
    );
    return response.transactions || [];
  }

  /**
   * Get token information
   */
  async getToken(address: string): Promise<any> {
    return await this.request(`/tokens/${address}`);
  }

  /**
   * Get token holders
   */
  async getTokenHolders(
    address: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<any[]> {
    const response = await this.request(
      `/tokens/${address}/holders?limit=${limit}&offset=${offset}`
    );
    return response.holders || [];
  }

  /**
   * Search transactions, accounts, or blocks
   */
  async search(query: string): Promise<any> {
    return await this.request(`/search?q=${encodeURIComponent(query)}`);
  }

  /**
   * Get DeFi TVL data
   */
  async getTVL(): Promise<any> {
    return await this.request('/defi/tvl');
  }

  /**
   * Get active addresses statistics
   */
  async getActiveAddresses(): Promise<any> {
    return await this.request('/addresses/active');
  }

  /**
   * Get historical data
   */
  async getHistoricalData(
    type: 'blocks' | 'transactions' | 'gas',
    from: string,
    to: string
  ): Promise<any[]> {
    const response = await this.request(
      `/analytics/${type}?from=${from}&to=${to}`
    );
    return response.data || [];
  }

  /**
   * Get faucet information (testnet only)
   */
  async getFaucetInfo(): Promise<any> {
    if (this.networkConfig.chainId !== 1953) {
      throw new Error('Faucet only available on testnet');
    }
    return await this.request('/faucet/info');
  }

  /**
   * Request tokens from faucet (testnet only)
   */
  async requestFaucet(address: string): Promise<any> {
    if (this.networkConfig.chainId !== 1953) {
      throw new Error('Faucet only available on testnet');
    }

    return await this.request('/faucet/drip', {
      method: 'POST',
      body: JSON.stringify({ address })
    });
  }

  /**
   * Get network health status
   */
  async getNetworkHealth(): Promise<any> {
    return await this.request('/network/health');
  }

  /**
   * Get consensus information
   */
  async getConsensusInfo(): Promise<any> {
    return await this.request('/consensus/info');
  }

  /**
   * Get staking information
   */
  async getStakingInfo(): Promise<any> {
    return await this.request('/staking/info');
  }

  /**
   * Get validator performance
   */
  async getValidatorPerformance(address?: string): Promise<any> {
    const endpoint = address ? `/validators/${address}/performance` : '/validators/performance';
    return await this.request(endpoint);
  }

  /**
   * Get network events
   */
  async getNetworkEvents(
    limit: number = 10,
    offset: number = 0,
    type?: string
  ): Promise<any[]> {
    let endpoint = `/events?limit=${limit}&offset=${offset}`;
    if (type) {
      endpoint += `&type=${type}`;
    }
    
    const response = await this.request(endpoint);
    return response.events || [];
  }
}