import { SelendraSDK } from '../../src';

/**
 * Real-time Monitoring and Analytics Example
 * Demonstrates advanced WebSocket subscriptions, monitoring, and analytics
 */

interface MonitoringConfig {
  watchAddresses: string[];
  watchTokens: string[];
  watchContracts: string[];
  alertThresholds: {
    gasPrice: string;
    blockTime: number;
    transactionVolume: number;
  };
}

interface Analytics {
  blockStats: BlockStats;
  transactionStats: TransactionStats;
  gasStats: GasStats;
  networkHealth: NetworkHealth;
}

interface BlockStats {
  latestBlock: number;
  avgBlockTime: number;
  blocksPerMinute: number;
  totalTransactions: number;
}

interface TransactionStats {
  pending: number;
  confirmed: number;
  failed: number;
  avgGasUsed: number;
  topAddresses: { address: string; count: number }[];
}

interface GasStats {
  currentPrice: string;
  avgPrice24h: string;
  priceHistory: { timestamp: number; price: string }[];
  congestionLevel: 'low' | 'medium' | 'high';
}

interface NetworkHealth {
  status: 'healthy' | 'degraded' | 'critical';
  validators: number;
  uptime: number;
  tps: number;
}

class NetworkMonitor {
  private sdk: SelendraSDK;
  private config: MonitoringConfig;
  private analytics: Analytics;
  private subscriptions: any[] = [];
  private isRunning: boolean = false;

  constructor(sdk: SelendraSDK, config: MonitoringConfig) {
    this.sdk = sdk;
    this.config = config;
    this.analytics = this.initializeAnalytics();
  }

  private initializeAnalytics(): Analytics {
    return {
      blockStats: {
        latestBlock: 0,
        avgBlockTime: 0,
        blocksPerMinute: 0,
        totalTransactions: 0
      },
      transactionStats: {
        pending: 0,
        confirmed: 0,
        failed: 0,
        avgGasUsed: 0,
        topAddresses: []
      },
      gasStats: {
        currentPrice: '0',
        avgPrice24h: '0',
        priceHistory: [],
        congestionLevel: 'low'
      },
      networkHealth: {
        status: 'healthy',
        validators: 0,
        uptime: 100,
        tps: 0
      }
    };
  }

  async start() {
    if (this.isRunning) {
      console.log('Monitor is already running');
      return;
    }

    console.log('🚀 Starting Network Monitor...');
    this.isRunning = true;

    try {
      // Start all monitoring subscriptions
      await this.subscribeToBlocks();
      await this.subscribeToTransactions();
      await this.subscribeToGasPrices();
      await this.monitorAddresses();
      await this.monitorTokens();
      await this.monitorContracts();

      // Start analytics dashboard
      this.startAnalyticsDashboard();

      console.log('✅ Network Monitor started successfully');
    } catch (error) {
      console.error('Failed to start monitor:', error);
      this.stop();
    }
  }

  async stop() {
    console.log('🛑 Stopping Network Monitor...');
    this.isRunning = false;

    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });

    this.subscriptions = [];
    console.log('✅ Network Monitor stopped');
  }

  private async subscribeToBlocks() {
    console.log('📦 Subscribing to new blocks...');

    try {
      const subscribe = await this.sdk.subscribe();
      const blockSub = await subscribe.blocks((block) => {
        this.onNewBlock(block);
      });

      this.subscriptions.push(blockSub);
    } catch (error) {
      console.error('Block subscription failed:', error);
    }
  }

  private async subscribeToTransactions() {
    console.log('💸 Subscribing to transactions...');

    try {
      const subscribe = await this.sdk.subscribe();
      const txSub = await subscribe.transactions((tx) => {
        this.onNewTransaction(tx);
      });

      this.subscriptions.push(txSub);
    } catch (error) {
      console.error('Transaction subscription failed:', error);
    }
  }

  private async subscribeToGasPrices() {
    console.log('⛽ Subscribing to gas prices...');

    try {
      const subscribe = await this.sdk.subscribe();
      const gasSub = await subscribe.gasPrices((gasData) => {
        this.onGasPriceUpdate(gasData);
      });

      this.subscriptions.push(gasSub);
    } catch (error) {
      console.error('Gas price subscription failed:', error);
    }
  }

  private async monitorAddresses() {
    console.log('👤 Monitoring watched addresses...');

    for (const address of this.config.watchAddresses) {
      try {
        const subscribe = await this.sdk.subscribe();
        const addressSub = await subscribe.addressTransactions([address], (tx) => {
          this.onAddressTransaction(address, tx);
        });

        this.subscriptions.push(addressSub);
      } catch (error) {
        console.error(`Failed to monitor address ${address}:`, error);
      }
    }
  }

  private async monitorTokens() {
    console.log('🪙 Monitoring token contracts...');

    for (const tokenAddress of this.config.watchTokens) {
      try {
        const subscribe = await this.sdk.subscribe();
        const tokenSub = await subscribe.contractEvents(
          tokenAddress,
          ['Transfer', 'Approval'],
          (event) => {
            this.onTokenEvent(tokenAddress, event);
          }
        );

        this.subscriptions.push(tokenSub);
      } catch (error) {
        console.error(`Failed to monitor token ${tokenAddress}:`, error);
      }
    }
  }

  private async monitorContracts() {
    console.log('📋 Monitoring smart contracts...');

    for (const contractAddress of this.config.watchContracts) {
      try {
        const subscribe = await this.sdk.subscribe();
        const contractSub = await subscribe.contractEvents(
          contractAddress,
          [], // All events
          (event) => {
            this.onContractEvent(contractAddress, event);
          }
        );

        this.subscriptions.push(contractSub);
      } catch (error) {
        console.error(`Failed to monitor contract ${contractAddress}:`, error);
      }
    }
  }

  private onNewBlock(block: any) {
    const blockNumber = block.number || block.blockNumber;
    const timestamp = block.timestamp || Date.now() / 1000;

    // Update block statistics
    this.analytics.blockStats.latestBlock = blockNumber;
    this.analytics.blockStats.totalTransactions += block.transactions?.length || 0;

    // Calculate block time
    this.calculateBlockTime(timestamp);

    // Check for alerts
    this.checkBlockAlerts(block);

    console.log(`📦 New Block #${blockNumber} (${block.transactions?.length || 0} txs)`);
  }

  private onNewTransaction(tx: any) {
    // Update transaction statistics
    this.analytics.transactionStats.pending++;

    // Track top addresses
    this.trackTopAddresses(tx.from);
    if (tx.to) {
      this.trackTopAddresses(tx.to);
    }

    // Check for alerts
    this.checkTransactionAlerts(tx);

    console.log(`💸 New Transaction: ${tx.hash?.substring(0, 10)}...`);
  }

  private onGasPriceUpdate(gasData: any) {
    const currentPrice = gasData.gasPrice;
    const timestamp = Date.now();

    // Update gas statistics
    this.analytics.gasStats.currentPrice = currentPrice;
    this.analytics.gasStats.priceHistory.push({ timestamp, price: currentPrice });

    // Keep only last 24 hours of data
    const oneDayAgo = timestamp - 24 * 60 * 60 * 1000;
    this.analytics.gasStats.priceHistory = this.analytics.gasStats.priceHistory
      .filter(entry => entry.timestamp > oneDayAgo);

    // Update congestion level
    this.updateCongestionLevel(currentPrice);

    // Check for gas price alerts
    this.checkGasPriceAlerts(currentPrice);

    const gweiPrice = this.sdk.utils.format.formatUnits(currentPrice, 9);
    console.log(`⛽ Gas Price Update: ${gweiPrice} gwei`);
  }

  private onAddressTransaction(address: string, tx: any) {
    console.log(`👤 Address ${address.substring(0, 8)}... transaction: ${tx.hash?.substring(0, 10)}...`);
    
    // Send notification for watched address
    this.sendAlert({
      type: 'address_transaction',
      message: `Transaction detected for watched address ${address}`,
      data: { address, tx }
    });
  }

  private onTokenEvent(tokenAddress: string, event: any) {
    console.log(`🪙 Token ${tokenAddress.substring(0, 8)}... event: ${event.event}`);
    
    if (event.event === 'Transfer') {
      const amount = this.sdk.utils.format.formatEther(event.args.value);
      console.log(`  Transfer: ${amount} tokens from ${event.args.from?.substring(0, 8)}... to ${event.args.to?.substring(0, 8)}...`);
    }
  }

  private onContractEvent(contractAddress: string, event: any) {
    console.log(`📋 Contract ${contractAddress.substring(0, 8)}... event: ${event.event}`);
  }

  private calculateBlockTime(timestamp: number) {
    // Implementation for calculating average block time
    // This would track timestamps and calculate averages
  }

  private trackTopAddresses(address: string) {
    const existing = this.analytics.transactionStats.topAddresses.find(a => a.address === address);
    if (existing) {
      existing.count++;
    } else {
      this.analytics.transactionStats.topAddresses.push({ address, count: 1 });
    }

    // Keep only top 10
    this.analytics.transactionStats.topAddresses = this.analytics.transactionStats.topAddresses
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private updateCongestionLevel(gasPrice: string) {
    const gweiPrice = parseFloat(this.sdk.utils.format.formatUnits(gasPrice, 9));
    
    if (gweiPrice < 20) {
      this.analytics.gasStats.congestionLevel = 'low';
    } else if (gweiPrice < 50) {
      this.analytics.gasStats.congestionLevel = 'medium';
    } else {
      this.analytics.gasStats.congestionLevel = 'high';
    }
  }

  private checkBlockAlerts(block: any) {
    // Check for unusual block times, empty blocks, etc.
    const txCount = block.transactions?.length || 0;
    if (txCount === 0) {
      this.sendAlert({
        type: 'empty_block',
        message: `Empty block detected: #${block.number}`,
        data: { block }
      });
    }
  }

  private checkTransactionAlerts(tx: any) {
    // Check for high-value transactions, unusual gas prices, etc.
    if (tx.value && BigInt(tx.value) > BigInt('10000000000000000000')) { // > 10 ETH
      this.sendAlert({
        type: 'high_value_transaction',
        message: `High-value transaction detected: ${this.sdk.utils.format.formatEther(tx.value)} ETH`,
        data: { tx }
      });
    }
  }

  private checkGasPriceAlerts(gasPrice: string) {
    const threshold = this.config.alertThresholds.gasPrice;
    if (BigInt(gasPrice) > BigInt(threshold)) {
      const gweiPrice = this.sdk.utils.format.formatUnits(gasPrice, 9);
      this.sendAlert({
        type: 'high_gas_price',
        message: `High gas price alert: ${gweiPrice} gwei`,
        data: { gasPrice }
      });
    }
  }

  private sendAlert(alert: { type: string; message: string; data: any }) {
    console.log(`🚨 ALERT [${alert.type.toUpperCase()}]: ${alert.message}`);
    
    // In a real implementation, you might:
    // - Send to Discord/Slack webhook
    // - Send email notification
    // - Store in database
    // - Trigger other automated responses
  }

  private startAnalyticsDashboard() {
    console.log('📊 Starting analytics dashboard...');

    // Update dashboard every 10 seconds
    const dashboardInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(dashboardInterval);
        return;
      }

      this.displayAnalytics();
    }, 10000);
  }

  private displayAnalytics() {
    console.clear();
    console.log('📊 === Selendra Network Analytics Dashboard ===\n');

    // Block Statistics
    console.log('📦 Block Statistics:');
    console.log(`  Latest Block: #${this.analytics.blockStats.latestBlock}`);
    console.log(`  Avg Block Time: ${this.analytics.blockStats.avgBlockTime.toFixed(2)}s`);
    console.log(`  Blocks/Minute: ${this.analytics.blockStats.blocksPerMinute}`);
    console.log(`  Total Transactions: ${this.analytics.blockStats.totalTransactions.toLocaleString()}`);

    // Transaction Statistics
    console.log('\n💸 Transaction Statistics:');
    console.log(`  Pending: ${this.analytics.transactionStats.pending}`);
    console.log(`  Confirmed: ${this.analytics.transactionStats.confirmed}`);
    console.log(`  Failed: ${this.analytics.transactionStats.failed}`);

    // Gas Statistics
    console.log('\n⛽ Gas Statistics:');
    const currentGwei = this.sdk.utils.format.formatUnits(this.analytics.gasStats.currentPrice, 9);
    console.log(`  Current Price: ${currentGwei} gwei`);
    console.log(`  Congestion Level: ${this.analytics.gasStats.congestionLevel.toUpperCase()}`);

    // Network Health
    console.log('\n💚 Network Health:');
    console.log(`  Status: ${this.analytics.networkHealth.status.toUpperCase()}`);
    console.log(`  TPS: ${this.analytics.networkHealth.tps}`);
    console.log(`  Uptime: ${this.analytics.networkHealth.uptime}%`);

    // Top Addresses
    console.log('\n👥 Top Active Addresses:');
    this.analytics.transactionStats.topAddresses.slice(0, 5).forEach((addr, i) => {
      console.log(`  ${i + 1}. ${addr.address.substring(0, 10)}... (${addr.count} txs)`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('Press Ctrl+C to stop monitoring');
  }

  getAnalytics(): Analytics {
    return { ...this.analytics };
  }
}

async function realTimeMonitoringExample() {
  const sdk = new SelendraSDK({
    network: 'testnet'
  });

  try {
    await sdk.initialize();
    console.log('🌊 === Real-time Network Monitoring ===');

    // Configuration for monitoring
    const config: MonitoringConfig = {
      watchAddresses: [
        '0x742d35Cc6634C0532925a3b8D8432d462c0AaeFe',
        '0x8ba1f109551bD432803012645Hac136c'
      ],
      watchTokens: [
        '0xTokenA...',
        '0xTokenB...'
      ],
      watchContracts: [
        '0xDEXContract...',
        '0xStakingContract...'
      ],
      alertThresholds: {
        gasPrice: sdk.utils.format.parseUnits('50', 9), // 50 gwei
        blockTime: 15, // 15 seconds
        transactionVolume: 1000 // transactions per block
      }
    };

    // Create and start monitor
    const monitor = new NetworkMonitor(sdk, config);
    await monitor.start();

    // Run for demonstration (in practice, this would run indefinitely)
    console.log('Monitor running for 2 minutes...');
    await new Promise(resolve => setTimeout(resolve, 120000));

    // Stop monitor
    await monitor.stop();

    // Display final analytics
    const finalAnalytics = monitor.getAnalytics();
    console.log('\n📊 Final Analytics Summary:');
    console.log(JSON.stringify(finalAnalytics, null, 2));

  } catch (error) {
    console.error('Real-time monitoring failed:', error);
  } finally {
    await sdk.disconnect();
  }
}

// Advanced monitoring features
class AdvancedAnalytics {
  private sdk: SelendraSDK;
  private metrics: Map<string, any[]> = new Map();

  constructor(sdk: SelendraSDK) {
    this.sdk = sdk;
  }

  // Price impact analysis
  async analyzePriceImpact(tokenAddress: string, amountIn: string) {
    console.log('📈 Analyzing price impact...');
    
    // This would integrate with DEX contracts to calculate price impact
    const priceImpact = 0.05; // 5% example
    
    if (priceImpact > 0.03) {
      console.log(`⚠️ High price impact detected: ${(priceImpact * 100).toFixed(2)}%`);
    }
    
    return priceImpact;
  }

  // MEV detection
  async detectMEV(transactions: any[]) {
    console.log('🔍 Detecting MEV activities...');
    
    // Look for sandwich attacks, arbitrage, etc.
    const mevTxs = transactions.filter(tx => {
      // MEV detection logic would go here
      return tx.gasPrice > '100000000000'; // High gas price indicator
    });

    if (mevTxs.length > 0) {
      console.log(`🚨 Potential MEV detected: ${mevTxs.length} transactions`);
    }

    return mevTxs;
  }

  // Whale movement tracking
  async trackWhaleMovements(threshold: string = '1000') {
    console.log('🐋 Tracking whale movements...');
    
    // Monitor large transactions above threshold
    const thresholdWei = this.sdk.utils.format.parseEther(threshold);
    
    // This would integrate with real-time transaction monitoring
    console.log(`Monitoring transactions > ${threshold} ETH`);
  }

  // Smart contract risk analysis
  async analyzeContractRisk(contractAddress: string) {
    console.log('🔒 Analyzing contract risk...');
    
    const riskFactors = {
      isVerified: true,
      hasProxies: false,
      ownershipRenounced: true,
      hasTimelock: true,
      auditStatus: 'audited'
    };

    const riskScore = this.calculateRiskScore(riskFactors);
    console.log(`Risk Score: ${riskScore}/100`);
    
    return riskScore;
  }

  private calculateRiskScore(factors: any): number {
    let score = 100;
    
    if (!factors.isVerified) score -= 30;
    if (factors.hasProxies) score -= 20;
    if (!factors.ownershipRenounced) score -= 25;
    if (!factors.hasTimelock) score -= 15;
    if (factors.auditStatus !== 'audited') score -= 10;
    
    return Math.max(0, score);
  }
}

// Example usage
realTimeMonitoringExample().catch(console.error);

export { NetworkMonitor, AdvancedAnalytics, type MonitoringConfig, type Analytics };