import { SelendraSDK } from '../src';

async function erc20Example() {
  const sdk = new SelendraSDK({
    network: 'testnet'
  });

  try {
    await sdk.initialize();
    await sdk.connectWallet('metamask');

    // Example ERC-20 token address (replace with actual token)
    const tokenAddress = '0x1234567890123456789012345678901234567890';
    
    // Create ERC-20 contract instance
    const token = sdk.evm.erc20(tokenAddress);

    // Get token information
    console.log('Getting token information...');
    const tokenInfo = await sdk.evm.getTokenInfo(tokenAddress);
    console.log('Token Info:', {
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals,
      totalSupply: sdk.utils.format.formatUnits(tokenInfo.totalSupply, tokenInfo.decimals)
    });

    const account = await sdk.evm.getAccount();
    
    // Get token balance
    const balance = await sdk.evm.getFormattedTokenBalance(tokenAddress);
    console.log(`Token balance: ${balance} ${tokenInfo.symbol}`);

    // Transfer tokens
    const recipient = '0x742d35Cc6634C0532925a3b8D8432d462c0AaeFe';
    const transferAmount = '10'; // 10 tokens

    console.log(`Transferring ${transferAmount} ${tokenInfo.symbol} to ${recipient}`);

    // Convert amount to token units
    const amountInUnits = sdk.utils.format.parseUnits(transferAmount, tokenInfo.decimals);

    // Send transfer transaction
    const txHash = await token.transfer(recipient, amountInUnits);
    console.log('Transfer transaction sent:', txHash);

    // Wait for confirmation
    const receipt = await sdk.evm.waitForTransaction(txHash);
    console.log('Transfer confirmed in block:', receipt.blockNumber);

    // Check new balance
    const newBalance = await sdk.evm.getFormattedTokenBalance(tokenAddress);
    console.log(`New token balance: ${newBalance} ${tokenInfo.symbol}`);

    // Example: Approve spending
    const spender = '0x0987654321098765432109876543210987654321';
    const approveAmount = '100';

    console.log(`Approving ${approveAmount} ${tokenInfo.symbol} for ${spender}`);
    
    const approveAmountInUnits = sdk.utils.format.parseUnits(approveAmount, tokenInfo.decimals);
    const approveTxHash = await token.approve(spender, approveAmountInUnits);
    console.log('Approve transaction sent:', approveTxHash);

    await sdk.evm.waitForTransaction(approveTxHash);
    console.log('Approval confirmed');

    // Check allowance
    const allowance = await token.allowance(account, spender);
    const formattedAllowance = sdk.utils.format.formatUnits(allowance, tokenInfo.decimals);
    console.log(`Allowance for ${spender}: ${formattedAllowance} ${tokenInfo.symbol}`);

  } catch (error) {
    console.error('ERC-20 interaction failed:', error);
  } finally {
    await sdk.disconnect();
  }
}

erc20Example().catch(console.error);