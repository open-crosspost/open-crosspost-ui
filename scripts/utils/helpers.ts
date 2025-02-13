import { ChildProcess, spawn } from "child_process";
import ora, { Ora } from "ora";
import treeKill from "tree-kill";

// Track all active processes and spinners
export const activeProcesses: ChildProcess[] = [];
export const activeSpinners: Ora[] = [];
export let isCleaningUp = false;

export async function promptUser(question: string): Promise<string> {
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

export async function executeCommand(
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

export function cleanupAndExit(exitCode = 1) {
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
