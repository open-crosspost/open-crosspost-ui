import { readFile } from "fs/promises";
import { connect } from "meer-api-js";
import { executeCommand, withSpinner } from "./helpers";

export interface BosConfig {
  network?: string;
  account?: string;
}

export async function getConfigValues(): Promise<BosConfig> {
  try {
    const configPath = 'bos.config.json';
    const config = JSON.parse(await readFile(configPath, 'utf-8'));
    return {
      network: config.network,
      account: config.account
    };
  } catch (error) {
    return {};
  }
}


export async function createWeb4Account(network: string, account: string): Promise<void> {
  return withSpinner("Checking web4 subaccount", async (spinner) => {
    const subaccount = `web4.${account}`;
    const exists = await checkAccountExists(network, subaccount);

    if (exists) {
      spinner.succeed(`Web4 subaccount already exists`);
      return;
    }

    spinner.text = "Creating web4 subaccount";
    try {
      const command = [
        "near",
        "account",
        "create-account",
        "fund-myself",
        subaccount,
        "'1 NEAR'",
        "autogenerate-new-keypair",
        "save-to-keychain",
        `sign-as`,
        account,
        "network-config",
        network,
      ];
      await executeCommand(command);
      
      spinner.succeed("Web4 subaccount created successfully");
    } catch (error) {
      spinner.fail("Web4 subaccount creation failed");
      throw error;
    }
  });
}


export async function checkAccountExists(
  network: string,
  account: string,
): Promise<boolean> {
  try {
    const nodeUrl = network === "mainnet" 
      ? "https://rpc.mainnet.near.org"
      : "https://rpc.testnet.near.org";
    const near = await connect({ 
      networkId: network === "mainnet" ? "mainnet" : "testnet",
      nodeUrl
    });
    try {
      await near.connection.provider.query({
        request_type: "view_account",
        account_id: account,
        finality: "final"
      });
      return true;
    } catch (e) {
      if (e.toString().includes("does not exist")) {
        return false;
      }
      throw e;
    }
  } catch (error) {
    return false;
  }
}

export async function validateAccount(network: string, account: string): Promise<void> {
  return withSpinner("Validating account", async (spinner) => {
    const exists = await checkAccountExists(network, account);

    if (!exists) {
      throw new Error(`Account ${account} does not exist on ${network}`);
    }

    spinner.succeed(`Account ${account} exists on ${network}`);
  });
}

export async function deployToWeb4(network: string, account: string): Promise<void> {
  return withSpinner("Deploying to web4", async (spinner) => {
    try {
      const command = [
        "npx",
        "github:vgrichina/web4-deploy",
        "dist",
        account,
        "--deploy-contract",
        "--nearfs",
        "--network",
        network,
      ];
      await executeCommand(command);
      spinner.succeed("Deployed to web4 successfully");
    } catch (error) {
      spinner.fail("Deployment failed");
      throw error;
    }
  });
}
