#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { createInstagramPublicationPackage } from "../src/publication/instagram-package.js";

const [draftFile, resolvedConfigurationFile, outputFile] = process.argv.slice(2);

if (!draftFile || !resolvedConfigurationFile || !outputFile) {
  console.error("Use: npm run package:instagram -- <draft.json> <resolved-config.json> <output.json>");
  process.exit(1);
}

const [draft, resolvedConfiguration] = await Promise.all([
  readJson(draftFile),
  readJson(resolvedConfigurationFile),
]);
const publicationPackage = createInstagramPublicationPackage({
  draft,
  resolvedConfiguration,
});
const output = path.resolve(outputFile);
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(publicationPackage, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  output,
  id: publicationPackage.id,
  status: publicationPackage.status,
  target: publicationPackage.target,
  form: publicationPackage.form,
  remote_api_call_performed: publicationPackage.human_publication_gates.remote_api_call_performed,
}, null, 2));

async function readJson(filename) {
  return JSON.parse(await readFile(path.resolve(filename), "utf8"));
}
