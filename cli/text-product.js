#!/usr/bin/env node
import { buildTextProduct } from "../src/text-product/build.js";
import { parseArgs } from "node:util";
const { values } = parseArgs({ options: { contract: { type: "string" }, output: { type: "string" }, checkout: { type: "string", multiple: true } } });
const checkouts = {};
for (const pair of values.checkout || []) {
  const pos = pair.indexOf("=");
  if (pos < 1) throw Error("--checkout OWNER/REPO=/absolute/path required");
  checkouts[pair.slice(0, pos)] = pair.slice(pos + 1);
}
try {
  const result = await buildTextProduct({ contract: values.contract, output: values.output, checkouts });
  console.log(JSON.stringify(result, null, 2));
} catch (e) { console.error(e.message); process.exitCode = 1; }
