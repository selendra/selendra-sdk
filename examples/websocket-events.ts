import { SelendraSDK } from '../src';

async function websocketExample() {
  const sdk = new SelendraSDK({
    network: 'testnet'
  });

  try {
    await sdk.initialize();

    console.log('Setting up WebSocket subscriptions...');

    // Get subscription methods
    const subscribe = await sdk.subscribe();

    // Subscribe to new blocks
    const blockSubscription = await subscribe.blocks((block) => {
      console.log('🔷 New Block:', {
        number: block.number,
        hash: block.hash,
        timestamp: new Date(block.timestamp * 1000).toISOString(),
        transactions: block.transactions,
        gasUsed: block.gasUsed,
        gasLimit: block.gasLimit
      });
    });

    // Subscribe to pending transactions
    const txSubscription = await subscribe.transactions((tx) => {
      console.log('🔶 Pending Transaction:', {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: sdk.utils.format.formatEther(tx.value || '0'),
        gasPrice: sdk.utils.format.formatUnits(tx.gasPrice || '0', 9) // gwei
      });
    });

    // Subscribe to gas price updates
    const gasPriceSubscription = await subscribe.gasPrices((gasData) => {
      console.log('⛽ Gas Price Update:', {
        gasPrice: sdk.utils.format.formatUnits(gasData.gasPrice, 9) + ' gwei',
        baseFee: sdk.utils.format.formatUnits(gasData.baseFee, 9) + ' gwei',
        priorityFee: sdk.utils.format.formatUnits(gasData.priorityFee, 9) + ' gwei',
        timestamp: new Date(gasData.timestamp * 1000).toISOString()
      });
    });

    // Example: Watch specific addresses
    const watchedAddresses = [
      '0x742d35Cc6634C0532925a3b8D8432d462c0AaeFe',
      '0x1234567890123456789012345678901234567890'
    ];

    const addressTxSubscription = await subscribe.addressTransactions(
      watchedAddresses,
      (tx) => {
        console.log('👤 Address Transaction:', {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: sdk.utils.format.formatEther(tx.value || '0'),
          status: tx.status,
          blockNumber: tx.blockNumber
        });
      }
    );

    // Example: Watch contract events
    const contractAddress = '0x1234567890123456789012345678901234567890';
    const transferEventTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    
    const contractEventSubscription = await subscribe.contractEvents(
      contractAddress,
      [transferEventTopic],
      (event) => {
        console.log('📜 Contract Event:', {
          address: event.address,
          topics: event.topics,
          data: event.data,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      }
    );

    console.log('✅ All subscriptions set up. Listening for events...');
    console.log('📊 Subscription IDs:', {
      blocks: blockSubscription.id,
      transactions: txSubscription.id,
      gasPrices: gasPriceSubscription.id,
      addressTransactions: addressTxSubscription.id,
      contractEvents: contractEventSubscription.id
    });

    // Keep the script running for 2 minutes
    console.log('⏰ Running for 2 minutes...');
    await new Promise(resolve => setTimeout(resolve, 120000));

    // Unsubscribe from all events
    console.log('🔌 Unsubscribing from all events...');
    blockSubscription.unsubscribe();
    txSubscription.unsubscribe();
    gasPriceSubscription.unsubscribe();
    addressTxSubscription.unsubscribe();
    contractEventSubscription.unsubscribe();

    console.log('✅ All subscriptions closed');

  } catch (error) {
    console.error('WebSocket example failed:', error);
  } finally {
    await sdk.disconnect();
  }
}

websocketExample().catch(console.error);