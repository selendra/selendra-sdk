/**
 * Main entry point for @selendrajs/sdk examples
 * 
 * Run individual examples or all examples
 */

import { connectExample } from './examples/core-sdk/connect';
import { disconnectExample } from './examples/core-sdk/disconnect';
import { destroyExample } from './examples/core-sdk/destroy';
import { lifecycleExample } from './examples/core-sdk/lifecycle';
import { getAccountExample } from './examples/core-sdk/get-account';
import { getBalanceExample } from './examples/core-sdk/get-balance';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🚀 Selendra SDK Examples\n');

  try {
    switch (command) {
      case 'connect':
        await connectExample();
        break;
      
      case 'disconnect':
        await disconnectExample();
        break;
      
      case 'destroy':
        await destroyExample();
        break;
      
      case 'lifecycle':
        await lifecycleExample();
        break;
      
      case 'get-account':
        await getAccountExample();
        break;
      
      case 'get-balance':
        await getBalanceExample();
        break;
      
      case 'all':
        console.log('Running all core SDK examples...\n');
        await connectExample();
        console.log('\n' + '='.repeat(60) + '\n');
        await disconnectExample();
        console.log('\n' + '='.repeat(60) + '\n');
        await destroyExample();
        console.log('\n' + '='.repeat(60) + '\n');
        await lifecycleExample();
        console.log('\n' + '='.repeat(60) + '\n');
        await getAccountExample();
        console.log('\n' + '='.repeat(60) + '\n');
        await getBalanceExample();
        break;
      
      default:
        console.log('📚 Available examples:\n');
        console.log('Core SDK:');
        console.log('  npm start connect      - SDK connect example');
        console.log('  npm start disconnect   - SDK disconnect example');
        console.log('  npm start destroy      - SDK destroy example');
        console.log('  npm start lifecycle    - Complete lifecycle example');
        console.log('  npm start get-account  - Get account information');
        console.log('  npm start get-balance  - Get account balance');
        console.log('  npm start all          - Run all core SDK examples\n');
        console.log('Or use direct npm scripts:');
        console.log('  npm run connect | npm run get-account');
        console.log('  npm run disconnect | npm run get-balance');
        console.log('  npm run destroy | npm run lifecycle\n');
        console.log('Usage: npm start <example-name>');
        process.exit(0);
    }

    console.log('\n✅ Example(s) completed successfully');

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
