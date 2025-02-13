import { promptUser, withCleanup } from "./utils/helpers";
import { getConfigValues, createWeb4Account, deployToWeb4 } from "./utils/near";

// Start the main process
withCleanup(async () => {
  console.log("Starting deployment process...");

  const config = await getConfigValues();
  
  let network = config.network;
  if (!network) {
    network = await promptUser("Enter the network (mainnet/testnet): ");
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

  const fullAccount = `web4.${account}`;

  console.log(`\nCreating your web4 account... web4.${account}`);
  await createWeb4Account(network, account);

  console.log("\nDeploying profile to web4 contract...");
  await deployToWeb4(network, fullAccount);
  
  console.log("\nDeployment completed successfully!");
});
