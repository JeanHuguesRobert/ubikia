#!/usr/bin/env node
/**
 * CLI Tool: Publish a derived Markdown document to Substack as a DRAFT.
 * DHITL Compliant: Pure HTTP API, no headless browser.
 *
 * Usage:
 *   node cli/substack-publish.js publications/2026-08-09-naissance-agent-john.md
 *
 * Environment:
 *   SUBSTACK_SUBDOMAIN  e.g. "baronmariani" or "jeanhuguesrobert"
 *   SUBSTACK_SID        Substack session cookie (`substack.sid`)
 */

import path from "node:path";
import process from "node:process";
import { parseMarkdownPublication, createSubstackDraft } from "../src/substack-publisher.js";

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log("Ubikia Substack Draft Publisher (Pure HTTP API)");
    console.log("Usage: node cli/substack-publish.js <path-to-markdown-file>");
    console.log("Env: SUBSTACK_SUBDOMAIN, SUBSTACK_SID");
    process.exit(0);
  }

  const filePath = path.resolve(args[0]);
  const subdomain = process.env.SUBSTACK_SUBDOMAIN;
  const sid = process.env.SUBSTACK_SID;

  if (!subdomain) {
    console.error("Error: SUBSTACK_SUBDOMAIN environment variable is missing.");
    console.error("Example: set SUBSTACK_SUBDOMAIN=baronmariani");
    process.exit(1);
  }

  if (!sid) {
    console.error("Error: SUBSTACK_SID environment variable is missing.");
    console.error("Set your Substack session cookie value in SUBSTACK_SID.");
    process.exit(1);
  }

  console.log(`[ubikia] Parsing publication: ${path.basename(filePath)}...`);
  const parsed = parseMarkdownPublication(filePath);

  console.log(`[ubikia] Title: "${parsed.title}"`);
  console.log(`[ubikia] Creating draft on https://${subdomain}.substack.com via direct HTTP API...`);

  const result = await createSubstackDraft({
    subdomain,
    sessionCookie: sid,
    title: parsed.title,
    subtitle: parsed.subtitle,
    markdownBody: parsed.body,
  });

  if (!result.ok) {
    console.error(`[error] Failed to create Substack draft: ${result.error}`);
    process.exit(1);
  }

  console.log("\n============================================================");
  console.log("🎉 SUBSTACK DRAFT CREATED SUCCESSFULLY!");
  console.log("============================================================");
  console.log(`Draft ID  : ${result.draft_id}`);
  console.log(`Edit URL  : ${result.edit_url}`);
  console.log("============================================================\n");
  console.log("ON YOUR PHONE / BROWSER NOW:");
  console.log(`  1. Open ${result.edit_url}`);
  console.log("  2. Review formatting and click Publish (DHITL Human Verification)!");
  console.log("");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
