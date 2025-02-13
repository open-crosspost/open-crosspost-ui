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

  // Handle cleanup if interrupted
  const cleanup = () => {
    try {
      rl.close();
    } catch (err) {
      console.error("Failed to close readline interface:", err);
    }
  };
  process.once('SIGINT', cleanup);

  try {
    return await rl.question(question);
  } finally {
    cleanup();
    process.removeListener('SIGINT', cleanup);
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

    // Create process in its own group to make cleanup easier
    const proc = spawn(command[0], command.slice(1), {
      cwd,
      stdio: "inherit",
      shell: true,
      detached: true,
      // This ensures the process group can be killed together
      windowsHide: true
    });

    // Track the process
    activeProcesses.push(proc);

    // Handle SIGINT for this specific process
    const sigintHandler = () => {
      if (proc.pid) {
        try {
          // Kill the entire process group
          process.kill(-proc.pid, 'SIGINT');
        } catch (err) {
          // Fallback to tree-kill if process group kill fails
          treeKill(proc.pid, 'SIGINT');
        }
      }
    };
    process.on('SIGINT', sigintHandler);

    proc.on("close", (code) => {
      // Clean up
      const index = activeProcesses.indexOf(proc);
      if (index > -1) {
        activeProcesses.splice(index, 1);
      }
      // Remove the SIGINT handler
      process.removeListener('SIGINT', sigintHandler);

      if (isCleaningUp) {
        reject(new Error("Operation cancelled"));
        return;
      }

      if (code === 0) {
        console.log("Command executed successfully");
        resolve();
      } else if (code === null) {
        reject(new Error("Command was terminated"));
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on("error", (err) => {
      const index = activeProcesses.indexOf(proc);
      if (index > -1) {
        activeProcesses.splice(index, 1);
      }
      process.removeListener('SIGINT', sigintHandler);
      reject(new Error(`Failed to start command: ${err.message}`));
    });
  });
}

export async function cleanupAndExit(exitCode = 1) {
  if (isCleaningUp) return;
  isCleaningUp = true;

  console.log("\nInterrupted. Cleaning up...");

  try {
    // Stop all spinners first to clear the terminal
    activeSpinners.forEach(spinner => {
      try {
        spinner.stop();
      } catch (err) {
        console.error("Failed to stop spinner:", err);
      }
    });
    activeSpinners.length = 0;

    // Kill all processes with SIGINT first to allow graceful shutdown
    const killPromises = activeProcesses.map(proc => {
      return new Promise<void>((resolve) => {
        if (!proc.pid) {
          resolve();
          return;
        }

        const timeout = setTimeout(() => {
          // If process doesn't respond to SIGINT, force kill with SIGKILL
          try {
            if (proc.pid) {
              process.kill(-proc.pid, 'SIGKILL');
            }
          } catch (err) {
            if (proc.pid) {
              treeKill(proc.pid, 'SIGKILL');
            }
          }
          resolve();
        }, 3000); // Give processes 3 seconds to cleanup

        try {
          if (proc.pid) {
            // Try SIGINT first for graceful shutdown
            process.kill(-proc.pid, 'SIGINT');
            
            // Listen for process exit
            proc.on('exit', () => {
              clearTimeout(timeout);
              resolve();
            });
          } else {
            resolve();
          }
        } catch (err) {
          // Fallback to tree-kill with SIGINT
          if (proc.pid) {
            treeKill(proc.pid, 'SIGINT', (killErr) => {
              if (killErr) {
                console.error(`Failed to kill process ${proc.pid}:`, killErr);
                try {
                  // Last resort: force kill
                  if (proc.pid) {
                    process.kill(-proc.pid, 'SIGKILL');
                  }
                } catch (e) {
                  if (proc.pid) {
                    treeKill(proc.pid, 'SIGKILL');
                  }
                }
              }
              clearTimeout(timeout);
              resolve();
            });
          } else {
            clearTimeout(timeout);
            resolve();
          }
        }
      });
    });

    // Wait for all processes to be killed or timeout
    await Promise.race([
      Promise.all(killPromises),
      new Promise(resolve => setTimeout(resolve, 5000)) // 5 second total timeout
    ]);
  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    process.exit(exitCode);
  }
}
