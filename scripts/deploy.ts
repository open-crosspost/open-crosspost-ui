import { promptUser, cleanupAndExit, isCleaningUp } from "./utils/helpers";
import { getConfigValues, createWeb4Account, deployToWeb4 } from "./utils/near";

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

async function main() {
  try {
    console.log("Starting deployment process...");

    const config = await getConfigValues();
    
    let network = config.network;
    if (!network) {
      network = await promptUser("Enter the network (mainnet/testnet): ");
      if (isCleaningUp) return;
    }

    if (network !== "mainnet" && network !== "testnet") {
      throw new Error(
        'Invalid network. Please enter either "mainnet" or "testnet".',
      );
    }

    const accountSuffix = network === "mainnet" ? "near" : "testnet";
    let account = config.account;
    if (!account) {
      account = await promptUser(
        `Enter your account name (e.g root.${accountSuffix}): `,
      );
    }
    if (isCleaningUp) return;

    const fullAccount = `web4.${account}`;

    console.log(`\nCreating your web4 account... web4.${account}`);
    await createWeb4Account(network, account);
    if (isCleaningUp) return;

    console.log("\nDeploying profile to web4 contract...");
    await deployToWeb4(network, fullAccount);
    
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
