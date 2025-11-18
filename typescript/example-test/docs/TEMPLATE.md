# Example Template

Copy this template when creating new examples.

## File: `src/examples/[category]/[example-name].ts`

```typescript
/**
 * Example: [Example Name]
 * 
 * [Brief description of what this example demonstrates]
 */

import { SelendraSDK } from '@selendrajs/sdk';
import { Logger } from '../../utils';

async function [exampleName]Example() {
  Logger.section('Example: [Example Name]');

  const sdk = new SelendraSDK({ 
    endpoint: 'https://rpc.selendra.org'
  });

  try {
    Logger.step(1, 'SETUP');
    await sdk.connect();
    Logger.success('Connected to network');

    Logger.step(2, 'PERFORM ACTION');
    // Your example code here
    
    Logger.step(3, 'VERIFY RESULT');
    // Verification code
    
    Logger.step(4, 'CLEANUP');
    await sdk.destroy();
    Logger.success('Cleanup completed');

  } catch (error) {
    Logger.error('Example failed', error);
    throw error;
  }
}

// Run the example if executed directly
if (require.main === module) {
  [exampleName]Example()
    .then(() => {
      Logger.success('[Example Name] completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      Logger.error('[Example Name] failed', error);
      process.exit(1);
    });
}

export { [exampleName]Example };
```

## Steps to Create New Example

1. **Choose Category**: Determine which category your example belongs to
   - `core-sdk/` - Core SDK functions
   - `evm/` - EVM-related features
   - `substrate/` - Substrate features
   - `unified/` - Unified accounts
   - `react/` - React hooks

2. **Create File**: Create your example file in the appropriate directory

3. **Export**: Add export to the category's `index.ts`
   ```typescript
   export * from './your-example';
   ```

4. **Add Script**: Add npm script to `package.json`
   ```json
   "[example-name]": "ts-node src/examples/[category]/[example-name].ts"
   ```

5. **Update Main Index** (optional): If you want it accessible from main CLI

6. **Test**: Run your example
   ```bash
   npm run [example-name]
   ```

## Naming Conventions

- **File names**: lowercase with hyphens (e.g., `get-balance.ts`)
- **Function names**: camelCase with "Example" suffix (e.g., `getBalanceExample`)
- **npm scripts**: lowercase with hyphens (e.g., `get-balance`)

## Best Practices

✅ Use the Logger utility for consistent output
✅ Handle errors properly with try/catch
✅ Clean up resources (disconnect/destroy SDK)
✅ Make examples runnable standalone
✅ Export the example function for reuse
✅ Add descriptive comments
✅ Include success/error logging
✅ Show step-by-step progress
