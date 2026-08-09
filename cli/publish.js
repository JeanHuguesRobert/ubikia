#!/usr/bin/env node
/**
 * Ubikia Unified Multi-Platform Draft Publisher CLI.
 * Supports Substack, Ghost, WordPress, Dev.to (and extensible to any blog platform).
 *
 * Usage:
 *   node cli/publish.js --target=substack publications/2026-08-09-naissance-agent-john.md
 *   node cli/publish.js --target=ghost publications/...
 *   node cli/publish.js --target=wordpress publications/...
 *   node cli/publish.js --target=all publications/...
 */

import path from "node:path";
import process from "node:process";
import { parseMarkdownPublication } from "../src/substack-publisher.js";
import { ADAPTERS, getAvailableAdapters } from "../src/adapters/index.js";

function parseArgs(argv) {
  let target = "substack";
  let filePath = null;

  for (const arg of argv) {
    if (arg.startsWith("--target=")) {
      target = arg.slice("--target=".length).toLowerCase();
    } else if (!arg.startsWith("-")) {
      filePath = arg;
    }
  }
  return { target, filePath };
}

async function main() {
  const { target, filePath } = parseArgs(process.argv.slice(2));

  if (!filePath || process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Ubikia Unified Multi-Platform Draft Publisher");
    console.log("Usage: node cli/publish.js [--target=platform] <path-to-markdown>");
    console.log(`Available targets: ${getAvailableAdapters().join(", ")}, all`);
    process.exit(0);
  }

  const absPath = path.resolve(filePath);
  const parsed = parseMarkdownPublication(absPath);

  console.log(`[ubikia] Document : "${parsed.title}"`);
  console.log(`[ubikia] Target   : ${target}`);

  const targetsToRun = target === "all" ? getAvailableAdapters() : [target];

  for (const t of targetsToRun) {
    const adapter = ADAPTERS[t];
    if (!adapter) {
      console.error(`[error] Unknown platform target: "${t}". Available: ${getAvailableAdapters().join(", ")}`);
      continue;
    }

    console.log(`\n--- Publishing Draft to ${adapter.name} (${t}) ---`);
    const missingEnv = (adapter.requiresEnv || []).filter((e) => !process.env[e]);
    if (missingEnv.length > 0) {
      console.log(`[skip] Missing environment variables for ${adapter.name}: ${missingEnv.join(", ")}`);
      continue;
    }

    const res = await adapter.createDraft(parsed, process.env);
    if (!res.ok) {
      console.error(`[failed] ${adapter.name}: ${res.error}`);
    } else {
      console.log(`✅ [success] ${adapter.name} Draft Created!`);
      console.log(`   Draft ID : ${res.draft_id}`);
      console.log(`   Edit URL : ${res.edit_url}`);
    }
  }
  console.log("\n[ubikia] Multi-platform draft processing complete (DHITL compliant).");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
