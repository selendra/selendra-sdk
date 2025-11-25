/**
 * Stake Command
 *
 * Staking operations via Nomination Pools
 */

import chalk from "chalk";
import ora from "ora";
import {
  SubstrateClient,
  getNetwork,
  NetworkKey,
  formatBalance,
  parseBalance,
} from "../utils/client.js";
import {
  printHeader,
  printKeyValue,
  printSuccess,
  printWarning,
  printInfo,
  printTroubleshooting,
  newLine,
} from "../utils/output.js";
import {
  promptConfirm,
  promptNetwork,
  promptAmount,
  promptSelect,
} from "../utils/prompts.js";

interface StakeOptions {
  network?: string;
  pool?: string;
  amount?: string;
}

/**
 * Main stake command - show staking info or join a pool
 */
export async function stakeCommand(action: string, options: StakeOptions) {
  switch (action) {
    case "info":
      await showStakingInfo(options);
      break;
    case "pools":
      await listPools(options);
      break;
    case "join":
      await joinPool(options);
      break;
    case "claim":
      await claimRewards(options);
      break;
    case "unbond":
      await unbond(options);
      break;
    default:
      console.log(chalk.red(`Unknown action: ${action}`));
      console.log();
      console.log(chalk.white("Available staking commands:"));
      console.log(
        chalk.gray("  selendra stake info      Show staking overview")
      );
      console.log(
        chalk.gray("  selendra stake pools     List available pools")
      );
      console.log(
        chalk.gray("  selendra stake join      Join a nomination pool")
      );
      console.log(
        chalk.gray("  selendra stake claim     Claim staking rewards")
      );
      console.log(chalk.gray("  selendra stake unbond    Unbond from pool"));
  }
}

/**
 * Show staking info and overview
 */
async function showStakingInfo(options: StakeOptions) {
  const networkKey = (options.network || "mainnet") as NetworkKey;
  const network = getNetwork(networkKey);

  const spinner = ora("Fetching staking info...").start();

  try {
    const client = new SubstrateClient(network);
    const api = await client.connect();

    // Get staking data
    const [
      activeEra,
      currentEra,
      minJoinBond,
      minCreateBond,
      maxPools,
      poolCount,
    ] = await Promise.all([
      api.query.staking?.activeEra?.() || null,
      api.query.staking?.currentEra?.() || null,
      api.query.nominationPools?.minJoinBond?.() || null,
      api.query.nominationPools?.minCreateBond?.() || null,
      api.query.nominationPools?.maxPools?.() || null,
      api.query.nominationPools?.counterForPoolMembers?.() || null,
    ]);

    await client.disconnect();
    spinner.succeed("Staking info retrieved");

    printHeader("Staking Overview");
    printKeyValue("Network:", network.name);

    if (activeEra) {
      const era = activeEra.toJSON() as any;
      printKeyValue("Active Era:", era?.index?.toString() || "N/A");
    }

    if (currentEra) {
      printKeyValue("Current Era:", currentEra.toString());
    }
    newLine();

    printHeader("Nomination Pools");

    if (minJoinBond) {
      printKeyValue(
        "Min Join Bond:",
        `${formatBalance(minJoinBond.toString())} SEL`
      );
    }

    if (minCreateBond) {
      printKeyValue(
        "Min Create Bond:",
        `${formatBalance(minCreateBond.toString())} SEL`
      );
    }

    if (maxPools) {
      printKeyValue("Max Pools:", maxPools.toString());
    }

    if (poolCount) {
      printKeyValue("Pool Members:", poolCount.toString());
    }
    newLine();

    printInfo("Join a pool to start earning staking rewards");
    console.log(chalk.gray("  selendra stake pools    # View available pools"));
    console.log(chalk.gray("  selendra stake join     # Join a pool"));
    newLine();
  } catch (error: any) {
    spinner.fail("Failed to fetch staking info");
    console.error(chalk.red("Error:"), error.message);

    printTroubleshooting([
      "Staking may not be available on this network",
      "Check network status: selendra status",
    ]);

    process.exit(1);
  }
}

/**
 * List available nomination pools
 */
async function listPools(options: StakeOptions) {
  const networkKey = (options.network || "mainnet") as NetworkKey;
  const network = getNetwork(networkKey);

  const spinner = ora("Fetching pools...").start();

  try {
    const client = new SubstrateClient(network);
    const api = await client.connect();

    // Get pool count
    const lastPoolId = await api.query.nominationPools?.lastPoolId?.();
    const poolCount = lastPoolId ? lastPoolId.toNumber() : 0;

    if (poolCount === 0) {
      spinner.warn("No pools found");
      printInfo("Nomination pools may not be enabled on this network");
      await client.disconnect();
      return;
    }

    // Fetch pool details (first 10 pools)
    const poolIds = Array.from(
      { length: Math.min(poolCount, 10) },
      (_, i) => i + 1
    );
    const pools = await Promise.all(
      poolIds.map(async (id) => {
        const bondedPool = await api.query.nominationPools?.bondedPools?.(id);
        const metadata = await api.query.nominationPools?.metadata?.(id);

        if (!bondedPool || bondedPool.isNone) return null;

        const poolData = bondedPool.toJSON() as any;
        const name = metadata
          ? Buffer.from(metadata.toHex().slice(2), "hex").toString("utf8")
          : `Pool #${id}`;

        return {
          id,
          name: name || `Pool #${id}`,
          state: poolData?.state || "Unknown",
          points: poolData?.points || "0",
          memberCount: poolData?.memberCounter || 0,
        };
      })
    );

    await client.disconnect();
    spinner.succeed(`Found ${poolCount} pools`);

    printHeader("Available Nomination Pools");
    console.log(
      chalk.gray(
        "ID".padEnd(6) + "Name".padEnd(25) + "State".padEnd(12) + "Members"
      )
    );
    console.log(chalk.gray("─".repeat(55)));

    for (const pool of pools.filter(Boolean)) {
      if (!pool) continue;
      const stateColor = pool.state === "Open" ? chalk.green : chalk.yellow;
      console.log(
        `${pool.id.toString().padEnd(6)}` +
          `${pool.name.slice(0, 23).padEnd(25)}` +
          `${stateColor(pool.state.toString().padEnd(12))}` +
          `${pool.memberCount}`
      );
    }

    newLine();
    printInfo("Join a pool: selendra stake join --pool <id>");
    newLine();
  } catch (error: any) {
    spinner.fail("Failed to fetch pools");
    console.error(chalk.red("Error:"), error.message);
    process.exit(1);
  }
}

/**
 * Join a nomination pool
 */
async function joinPool(options: StakeOptions) {
  printHeader("Join Nomination Pool");

  printWarning("This feature requires signing a transaction");
  console.log(chalk.gray("Transaction signing is coming soon. For now, use:"));
  newLine();
  console.log(
    chalk.white("  • Polkadot.js Apps: https://polkadot.js.org/apps")
  );
  console.log(chalk.white("  • SubWallet or Talisman browser extensions"));
  newLine();

  printInfo("Steps to join a pool:");
  console.log(chalk.gray("  1. Connect your wallet to Polkadot.js Apps"));
  console.log(chalk.gray("  2. Navigate to Network → Staking → Pools"));
  console.log(chalk.gray('  3. Select a pool and click "Join"'));
  console.log(chalk.gray("  4. Enter amount and sign the transaction"));
  newLine();
}

/**
 * Claim staking rewards
 */
async function claimRewards(options: StakeOptions) {
  printHeader("Claim Staking Rewards");

  printWarning("This feature requires signing a transaction");
  console.log(chalk.gray("Transaction signing is coming soon. For now, use:"));
  newLine();
  console.log(
    chalk.white("  • Polkadot.js Apps: https://polkadot.js.org/apps")
  );
  newLine();
}

/**
 * Unbond from pool
 */
async function unbond(options: StakeOptions) {
  printHeader("Unbond from Pool");

  printWarning("This feature requires signing a transaction");
  console.log(chalk.gray("Transaction signing is coming soon. For now, use:"));
  newLine();
  console.log(
    chalk.white("  • Polkadot.js Apps: https://polkadot.js.org/apps")
  );
  newLine();

  printInfo("Note: Unbonding has a waiting period before you can withdraw");
  newLine();
}
