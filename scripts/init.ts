import ora from "ora";
import { writeFile } from "fs/promises";
import { join } from "path";
import {
  promptUser,
  cleanupAndExit,
  activeSpinners,
  isCleaningUp,
} from "./utils/helpers";
import { validateAccount, createWeb4Account } from "./utils/near";

// Handle interrupts and termination
process.on("SIGINT", () => cleanupAndExit(1));
process.on("SIGTERM", () => cleanupAndExit(1));
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  cleanupAndExit(1);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  cleanupAndExit(1);
});

async function saveConfig(network: string, account: string): Promise<void> {
  const spinner = ora("Saving configuration").start();
  activeSpinners.push(spinner);

  try {
    const config = {
      network,
      account
    };

    const configPath = join(process.cwd(), 'bos.config.json');
    await writeFile(configPath, JSON.stringify(config, null, 2));
    
    if (isCleaningUp) throw new Error("Operation cancelled");
    spinner.succeed(`Configuration saved to bos.config.json`);
  } catch (error) {
    if (!isCleaningUp) {
      spinner.fail(`Failed to save configuration: ${error}`);
    }
    throw error;
  } finally {
    const index = activeSpinners.indexOf(spinner);
    if (index > -1) {
      activeSpinners.splice(index, 1);
    }
  }
}

async function main() {
  try {
    console.log("Starting initialization process...");

    const network = await promptUser("Enter the network (mainnet/testnet): ");
    if (isCleaningUp) return;

    if (network !== "mainnet" && network !== "testnet") {
      throw new Error(
        'Invalid network. Please enter either "mainnet" or "testnet".',
      );
    }

    const accountSuffix = network === "mainnet" ? "near" : "testnet";
    const account = await promptUser(
      `Enter your account name (e.g root.${accountSuffix}): `,
    );
    if (isCleaningUp) return;

    console.log(`\nValidating your account... ${account}`);
    await validateAccount(network, account);
    if (isCleaningUp) return;

    console.log(`\nSetting up web4 account... web4.${account}`);
    await createWeb4Account(network, account);
    if (isCleaningUp) return;

    console.log("\nSaving configuration...");
    await saveConfig(network, account);
    
    console.log("\nInitialization completed successfully!");
    // Success exit
    cleanupAndExit(0);
  } catch (error) {
    if (!isCleaningUp) {
      console.error("An error occurred:", error);
      cleanupAndExit(1);
    }
  }
}

// Start the main process
main().catch(() => {
  // This catch is just a safeguard - errors should be handled in main()
  if (!isCleaningUp) {
    cleanupAndExit(1);
  }
});
