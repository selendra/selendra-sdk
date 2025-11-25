/**
 * CLI Output Utilities
 *
 * Provides consistent, formatted console output for CLI commands
 */

import chalk from "chalk";

/**
 * Print a section header
 */
export function printHeader(title: string): void {
  console.log();
  console.log(chalk.bold.white(title));
  console.log(chalk.gray("─".repeat(60)));
  console.log();
}

/**
 * Print a key-value pair
 */
export function printKeyValue(
  key: string,
  value: string | number,
  color: typeof chalk = chalk.cyan
): void {
  const paddedKey = key.padEnd(16);
  console.log(`${color(paddedKey)} ${value}`);
}

/**
 * Print a success message
 */
export function printSuccess(message: string): void {
  console.log(chalk.green("✓ " + message));
}

/**
 * Print an error message
 */
export function printError(message: string): void {
  console.error(chalk.red("✗ " + message));
}

/**
 * Print a warning message
 */
export function printWarning(message: string): void {
  console.log(chalk.yellow("⚠ " + message));
}

/**
 * Print an info message
 */
export function printInfo(message: string): void {
  console.log(chalk.blue("ℹ " + message));
}

/**
 * Print a divider
 */
export function printDivider(char: string = "─", length: number = 60): void {
  console.log(chalk.gray(char.repeat(length)));
}

/**
 * Print a table row
 */
export function printTableRow(columns: string[], widths: number[]): void {
  const row = columns.map((col, i) => col.padEnd(widths[i] || 20)).join(" ");
  console.log(row);
}

/**
 * Print a box around content
 */
export function printBox(title: string, content: string[]): void {
  const maxWidth = Math.max(title.length, ...content.map((c) => c.length)) + 4;
  const border = "─".repeat(maxWidth);

  console.log(chalk.gray("┌" + border + "┐"));
  console.log(
    chalk.gray("│ ") +
      chalk.bold.white(title.padEnd(maxWidth - 2)) +
      chalk.gray(" │")
  );
  console.log(chalk.gray("├" + border + "┤"));

  for (const line of content) {
    console.log(
      chalk.gray("│ ") + line.padEnd(maxWidth - 2) + chalk.gray(" │")
    );
  }

  console.log(chalk.gray("└" + border + "┘"));
}

/**
 * Print JSON data in a formatted way
 */
export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Print a list with bullets
 */
export function printList(items: string[], bullet: string = "•"): void {
  for (const item of items) {
    console.log(chalk.gray(bullet) + " " + item);
  }
}

/**
 * Print troubleshooting tips
 */
export function printTroubleshooting(tips: string[]): void {
  console.log();
  console.log(chalk.yellow("Troubleshooting:"));
  for (const tip of tips) {
    console.log(chalk.gray("  • " + tip));
  }
  console.log();
}

/**
 * Print next steps
 */
export function printNextSteps(steps: string[]): void {
  console.log();
  console.log(chalk.bold.white("Next steps:"));
  steps.forEach((step, i) => {
    console.log(chalk.gray(`  ${i + 1}. `) + chalk.white(step));
  });
  console.log();
}

/**
 * Format an address for display (truncate middle)
 */
export function formatAddress(address: string, chars: number = 6): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format a large number with commas
 */
export function formatNumber(num: number | bigint): string {
  return num.toLocaleString();
}

/**
 * Format a timestamp
 */
export function formatTimestamp(timestamp?: number): string {
  const date = timestamp ? new Date(timestamp) : new Date();
  return date.toLocaleString();
}

/**
 * Clear the console
 */
export function clearConsole(): void {
  process.stdout.write("\x1b[2J\x1b[0f");
}

/**
 * Print an empty line
 */
export function newLine(count: number = 1): void {
  for (let i = 0; i < count; i++) {
    console.log();
  }
}
