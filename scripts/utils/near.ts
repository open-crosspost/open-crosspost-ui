import ora from "ora";
import { executeCommand, activeSpinners, isCleaningUp } from "./helpers";
import { readFile } from "fs/promises";

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
  const spinner = ora("Checking web4 subaccount").start();
  activeSpinners.push(spinner);

  try {
    const subaccount = `web4.${account}`;
    const exists = await checkAccountExists(network, subaccount);
    
    if (isCleaningUp) throw new Error("Operation cancelled");

    if (exists) {
      spinner.succeed(`Web4 subaccount already exists`);
      return;
    }

    spinner.text = "Creating web4 subaccount";
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
    
    if (isCleaningUp) throw new Error("Operation cancelled");
    spinner.succeed("Web4 subaccount created successfully");
  } catch (error) {
    if (!isCleaningUp) {
      spinner.fail(`Failed to create web4 subaccount: ${error}`);
    }
    throw error;
  } finally {
    const index = activeSpinners.indexOf(spinner);
    if (index > -1) {
      activeSpinners.splice(index, 1);
    }
  }
}

import { connect } from "meer-api-js";

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
    if (isCleaningUp) throw error;
    return false;
  }
}

export async function validateAccount(network: string, account: string): Promise<void> {
  const spinner = ora("Validating account").start();
  activeSpinners.push(spinner);

  try {
    const exists = await checkAccountExists(network, account);
    
    if (isCleaningUp) throw new Error("Operation cancelled");

    if (!exists) {
      spinner.fail(`Account ${account} does not exist on ${network}`);
      throw new Error(`Account ${account} does not exist on ${network}`);
    }

    spinner.succeed(`Account ${account} exists on ${network}`);
  } catch (error) {
    if (!isCleaningUp) {
      spinner.fail(`Account validation failed: ${error}`);
    }
    throw error;
  } finally {
    const index = activeSpinners.indexOf(spinner);
    if (index > -1) {
      activeSpinners.splice(index, 1);
    }
  }
}

export async function deployToWeb4(network: string, account: string): Promise<void> {
  const spinner = ora("Deploying to web4").start();
  activeSpinners.push(spinner);

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
    
    if (isCleaningUp) throw new Error("Operation cancelled");
    spinner.succeed("Deployed to web4 successfully");
  } catch (error) {
    if (!isCleaningUp) {
      spinner.fail(`Failed to deploy to web4: ${error}`);
    }
    throw error;
  } finally {
    const index = activeSpinners.indexOf(spinner);
    if (index > -1) {
      activeSpinners.splice(index, 1);
    }
  }
}
