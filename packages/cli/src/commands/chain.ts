/**
 * Chain Command
 * 
 * Display chain information and block details
 */

import chalk from 'chalk';
import ora from 'ora';
import {
  SubstrateClient,
  EVMClient,
  getNetwork,
  NetworkKey,
} from '../utils/client.js';
import {
  printHeader,
  printKeyValue,
  printInfo,
  printTroubleshooting,
  newLine,
} from '../utils/output.js';

interface ChainOptions {
  network: string;
  json?: boolean;
}

export async function chainCommand(options: ChainOptions) {
  const networkKey = options.network as NetworkKey;
  
  let network;
  try {
    network = getNetwork(networkKey);
  } catch {
    console.error(chalk.red(`Unknown network: ${options.network}`));
    console.log(chalk.gray('Available networks: mainnet, testnet, local'));
    return;
  }

  const spinner = ora(`Connecting to ${network.name}...`).start();

  try {
    const substrateClient = new SubstrateClient(network);
    const evmClient = new EVMClient(network);

    // Get chain info
    const [chainInfo, latestBlock, evmBlock, gasPrice] = await Promise.all([
      substrateClient.getChainInfo(),
      substrateClient.getLatestBlock(),
      evmClient.getBlockNumber(),
      evmClient.getGasPrice(),
    ]);

    await substrateClient.disconnect();
    spinner.succeed('Chain info retrieved');

    // Output as JSON if requested
    if (options.json) {
      console.log(JSON.stringify({
        network: network.name,
        substrate: {
          chain: chainInfo.chain,
          nodeName: chainInfo.nodeName,
          nodeVersion: chainInfo.nodeVersion,
          specName: chainInfo.specName,
          specVersion: chainInfo.specVersion,
          latestBlock: latestBlock,
        },
        evm: {
          chainId: network.evmChainId,
          blockNumber: evmBlock,
          gasPrice: gasPrice.toString(),
        },
      }, null, 2));
      return;
    }

    // Display chain info
    printHeader('Selendra Chain Info');
    printKeyValue('Network:', network.name);
    printKeyValue('Chain:', chainInfo.chain);
    newLine();

    printHeader('Substrate Layer');
    printKeyValue('Node Name:', chainInfo.nodeName);
    printKeyValue('Node Version:', chainInfo.nodeVersion);
    printKeyValue('Runtime:', `${chainInfo.specName} v${chainInfo.specVersion}`);
    printKeyValue('Latest Block:', latestBlock.number.toLocaleString(), chalk.green);
    printKeyValue('Block Hash:', latestBlock.hash.slice(0, 18) + '...');
    newLine();

    printHeader('EVM Layer');
    printKeyValue('Chain ID:', network.evmChainId.toString());
    printKeyValue('Block Number:', evmBlock.toLocaleString(), chalk.green);
    printKeyValue('Gas Price:', `${(Number(gasPrice) / 1e9).toFixed(2)} gwei`);
    newLine();

    printHeader('Network Endpoints');
    printKeyValue('HTTP RPC:', network.httpRpc);
    printKeyValue('WebSocket:', network.wsRpc);
    
    if (network.explorer) {
      printKeyValue('Explorer:', network.explorer);
    }
    newLine();

    printInfo('Use --json flag for machine-readable output');
    newLine();

  } catch (error: any) {
    spinner.fail('Failed to get chain info');
    console.error(chalk.red('Error:'), error.message);
    
    printTroubleshooting([
      'Check your internet connection',
      'Verify the network is operational',
      'Try a different network: --network testnet',
    ]);
    
    process.exit(1);
  }
}

/**
 * Block subcommand - get specific block info
 */
export async function blockCommand(
  blockNumber: string | undefined,
  options: { network: string; json?: boolean }
) {
  const networkKey = options.network as NetworkKey;
  const network = getNetwork(networkKey);

  const spinner = ora('Fetching block...').start();

  try {
    const substrateClient = new SubstrateClient(network);
    const api = await substrateClient.connect();

    // Get block
    let blockHash;
    if (blockNumber) {
      blockHash = await api.rpc.chain.getBlockHash(parseInt(blockNumber));
    } else {
      blockHash = await api.rpc.chain.getBlockHash();
    }

    const signedBlock = await api.rpc.chain.getBlock(blockHash);
    const header = signedBlock.block.header;
    const extrinsics = signedBlock.block.extrinsics;

    await substrateClient.disconnect();
    spinner.succeed('Block retrieved');

    const blockData = {
      number: header.number.toNumber(),
      hash: blockHash.toHex(),
      parentHash: header.parentHash.toHex(),
      stateRoot: header.stateRoot.toHex(),
      extrinsicsRoot: header.extrinsicsRoot.toHex(),
      extrinsicsCount: extrinsics.length,
    };

    if (options.json) {
      console.log(JSON.stringify(blockData, null, 2));
      return;
    }

    printHeader(`Block #${blockData.number}`);
    printKeyValue('Hash:', blockData.hash);
    printKeyValue('Parent:', blockData.parentHash.slice(0, 18) + '...');
    printKeyValue('State Root:', blockData.stateRoot.slice(0, 18) + '...');
    printKeyValue('Extrinsics:', blockData.extrinsicsCount.toString());
    newLine();

    if (network.explorer) {
      console.log(chalk.gray('View on explorer:'));
      console.log(chalk.cyan(`${network.explorer}/block/${blockData.number}`));
      newLine();
    }

  } catch (error: any) {
    spinner.fail('Failed to fetch block');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}
