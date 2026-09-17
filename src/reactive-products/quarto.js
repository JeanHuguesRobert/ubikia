import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execute = promisify(execFile);

export function createQuartoAdapter({ executable = "quarto" } = {}) {
  async function run(args, cwd) {
    try {
      return await execute(executable, args, { cwd, maxBuffer: 16 * 1024 * 1024, timeout: 600000 });
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(`Quarto executable not found: ${executable}. Install Quarto and a TeX distribution for PDF, then retry.`);
      }
      throw new Error(`Quarto ${args.join(" ")} failed: ${error.stderr?.trim() || error.message}`);
    }
  }
  return {
    async version() {
      const version = (await run(["--version"])).stdout.trim();
      if (!version) throw new Error("Quarto returned an empty renderer version");
      return version;
    },
    async render(directory) {
      // A Quarto book project clears its output-dir on every render invocation.
      // Rendering one format at a time via --to would therefore erase the
      // previous format's artifact. Render every format declared in the
      // generated _quarto.yml in a single invocation instead.
      await run(["render", ".", "--no-execute"], directory);
    },
  };
}
