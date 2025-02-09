import { ChildProcess, spawn } from "child_process";
import ora, { Ora } from "ora";
import treeKill from "tree-kill";

// Track all active processes and spinners
const activeProcesses: ChildProcess[] = [];
const activeSpinners: Ora[] = [];
let isCleaningUp = false;

async function promptUser(question: string): Promise<string> {
  const { default: readline } = await import("readline/promises");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    return await rl.question(question);
  } finally {
    rl.close();
  }
}

async function executeCommand(
  command: string[],
  cwd: string = process.cwd(),
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isCleaningUp) {
      reject(new Error("Operation cancelled"));
      return;
    }

    console.log("\nExecuting command:", command.join(" "));

    const proc = spawn(command[0], command.slice(1), {
      cwd,
      stdio: "inherit",
      shell: true,
      detached: true
    });

    activeProcesses.push(proc);

    proc.on("close", (code) => {
      const index = activeProcesses.indexOf(proc);
      if (index > -1) {
        activeProcesses.splice(index, 1);
      }

      if (isCleaningUp) {
        reject(new Error("Operation cancelled"));
        return;
      }

      if (code === 0) {
        console.log("Command executed successfully");
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on("error", (err) => {
      const index = activeProcesses.indexOf(proc);
      if (index > -1) {
        activeProcesses.splice(index, 1);
      }
      reject(new Error(`Failed to start command: ${err.message}`));
    });
  });
}

function cleanupAndExit(exitCode = 1) {
  if (isCleaningUp) return;
  isCleaningUp = true;

  console.log("\nInterrupted. Cleaning up...");

  // Stop all spinners
  activeSpinners.forEach(spinner => {
    try {
      spinner.stop();
    } catch (err) {
      console.error("Failed to stop spinner:", err);
    }
  });
  activeSpinners.length = 0;

  // Kill all processes
  const killPromises = activeProcesses.map(proc => {
    return new Promise<void>((resolve) => {
      if (!proc.pid) {
        resolve();
        return;
      }

      try {
        // Try to kill the process group first
        process.kill(-proc.pid, 'SIGKILL');
        resolve();
      } catch (err) {
        // Fallback to tree-kill
        treeKill(proc.pid, 'SIGKILL', (killErr) => {
          if (killErr) {
            console.error(`Failed to kill process ${proc.pid}:`, killErr);
          }
          resolve();
        });
      }
    });
  });

  // Wait briefly for cleanup or force exit
  Promise.race([
    Promise.all(killPromises),
    new Promise(resolve => setTimeout(resolve, 1000))
  ]).finally(() => {
    process.exit(exitCode);
  });
}

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

async function checkAccountExists(
  network: string,
  account: string,
): Promise<boolean> {
  try {
    const command = [
      "npx",
      "near-cli-rs",
      "account",
      "view-account-summary",
      account,
      "network-config",
      network,
      "now",
    ];
    await executeCommand(command);
    return true;
  } catch (error) {
    if (isCleaningUp) throw error;
    return false;
  }
}

async function createAccount(network: string, account: string): Promise<void> {
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

async function deployToWeb4(network: string, account: string): Promise<void> {
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

async function main() {
  try {
    console.log("Starting deployment process...");

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

    const fullAccount = `web4.${account}`;

    console.log(`\nCreating your web4 account... web4.${account}`);
    await createAccount(network, account);
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
