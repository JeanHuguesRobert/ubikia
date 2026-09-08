#!/usr/bin/env node
import { parseArgs } from "node:util";
import { render } from "../src/reactive-products/render.js";

try {
  const { values } = parseArgs({ options: {
    corpus: { type: "string" }, projection: { type: "string" }, output: { type: "string" },
    help: { type: "boolean", short: "h" },
  } });
  if (values.help) {
    console.log("Usage: npm run render -- --corpus <corpus.yml> --projection <book.yml> [--output <new-directory>]");
  } else {
    const result = await render(values);
    console.log(JSON.stringify({ directory: result.directory, manifest: `${result.directory}/manifest.json`,
      outputs: result.manifest.outputs }, null, 2));
  }
} catch (error) {
  console.error(`ubikia render: ${error.message}`);
  process.exitCode = 1;
}
