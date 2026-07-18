#!/usr/bin/env node

import path from "node:path";
import process from "node:process";

import { validateReferenceEpisode } from "../src/audible/validate-reference-episode.js";

const projectDirectory = process.argv[2]
  ?? path.join("examples", "audible", "le-pere-noel-revient");

const result = await validateReferenceEpisode(projectDirectory);
console.log(JSON.stringify(result, null, 2));

if (result.status !== "valid") {
  process.exit(1);
}
