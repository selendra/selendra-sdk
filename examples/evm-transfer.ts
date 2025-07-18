import { SelendraSDK } from '../src';

async function evmTransferExample() {
  const sdk = new SelendraSDK({
    network: 'testnet'
  });

  try {
    await sdk.initialize();
    
    // Connect wallet
    await sdk.connectWallet('metamask');
    
    const sender = await sdk.evm.getAccount();
    const recipient = '0x742d35Cc6634C0532925a3b8D8432d462c0AaeFe';
    const amount = '0.1'; // 0.1 SEL

    console.log(`Transferring ${amount} SEL from ${sender} to ${recipient}`);

    // Check balance before transfer
    const balanceBefore = await sdk.evm.getFormattedBalance(sender);
    console.log('Balance before:', balanceBefore, 'SEL');

    // Send transfer transaction
    const txHash = await sdk.evm.transfer(recipient, amount);
    console.log('Transaction sent:', txHash);

    // Wait for confirmation
    const receipt = await sdk.evm.waitForTransaction(txHash);
    console.log('Transaction confirmed in block:', receipt.blockNumber);

    // Check balance after transfer
    const balanceAfter = await sdk.evm.getFormattedBalance(sender);
    console.log('Balance after:', balanceAfter, 'SEL');

    // Get transaction details
    const txDetails = await sdk.evm.getTransaction(txHash);
    console.log('Transaction details:', {
      hash: txDetails.hash,
      from: txDetails.from,
      to: txDetails.to,
      value: sdk.utils.format.formatEther(txDetails.value),
      gasUsed: receipt.gasUsed.toString(),
      gasPrice: txDetails.gasPrice.toString()
    });

  } catch (error) {
    console.error('Transfer failed:', error);
  } finally {
    await sdk.disconnect();
  }
}

evmTransferExample().catch(console.error);