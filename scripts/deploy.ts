import { promptUser, withCleanup, withSpinner } from "./utils/helpers";
import { getConfigValues, createWeb4Account, deployToWeb4, validateAccount } from "./utils/near";

withCleanup(async () => {
  return withSpinner("Starting deployment process", async (spinner) => {
    // Get configuration
    spinner.text = "Reading configuration";
    const config = await getConfigValues();
    
    // Get network
    let network = config.network;
    if (!network) {
      spinner.stop();
      network = await promptUser("Enter the network (mainnet/testnet): ");
      spinner.start();
    }
    
    if (network !== "mainnet" && network !== "testnet") {
      throw new Error('Invalid network. Please enter either "mainnet" or "testnet".');
    }

    // Get account
    const accountSuffix = network === "mainnet" ? "near" : "testnet";
    let account = config.account;
    if (!account) {
      spinner.stop();
      account = await promptUser(`Enter your account name (e.g root.${accountSuffix}): `);
      spinner.start();
    }

    // Validate base account
    await validateAccount(network, account);
    
    // Setup web4 account
    const fullAccount = `web4.${account}`;
    await createWeb4Account(network, account);
    
    // Deploy to web4
    await deployToWeb4(network, fullAccount);
    
    spinner.succeed("Deployment completed successfully!");
  });
});
