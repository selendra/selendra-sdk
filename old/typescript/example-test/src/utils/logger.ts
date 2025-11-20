/**
 * Utility: Logger
 * 
 * Console logging utilities for examples
 */

export class Logger {
  static section(title: string) {
    console.log('\n' + '='.repeat(60));
    console.log(title);
    console.log('='.repeat(60));
  }

  static subsection(title: string) {
    console.log('\n' + '-'.repeat(60));
    console.log(title);
    console.log('-'.repeat(60));
  }

  static success(message: string) {
    console.log('✅', message);
  }

  static error(message: string, error?: Error | unknown) {
    console.error('❌', message);
    if (error instanceof Error) {
      console.error('  ', error.message);
    } else if (error) {
      console.error('  ', String(error));
    }
  }

  static info(message: string) {
    console.log('ℹ️ ', message);
  }

  static warn(message: string) {
    console.warn('⚠️ ', message);
  }

  static step(number: number, title: string) {
    console.log(`\n${number}️⃣  ${title}`);
    console.log('-'.repeat(60));
  }
}
