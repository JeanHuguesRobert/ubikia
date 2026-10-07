#!/usr/bin/env node
import { parseArgs } from "node:util";
import { planFilingPackage } from "../src/filing-package/plan.js";
import { buildFilingPackage } from "../src/filing-package/build.js";
import { freezeFilingPackage, publishFilingPackage } from "../src/filing-package/release.js";

try {
  const {positionals,values}=parseArgs({allowPositionals:true,options:{
    contract:{type:"string"}, output:{type:"string"}, build:{type:"string"},
    apply:{type:"boolean",default:false}, help:{type:"boolean",short:"h"}
  }});
  const command=positionals[0];
  if(values.help||!command) {
    console.log("Usage: npm run filing-package -- <plan|build|freeze|publish> --contract <file> [--output <dir>] [--build <dir>] [--apply]");
  } else if(command==="plan") console.log(JSON.stringify(await planFilingPackage(values),null,2));
  else if(command==="build") console.log(JSON.stringify(await buildFilingPackage(values),null,2));
  else if(command==="freeze") console.log(JSON.stringify(await freezeFilingPackage(values),null,2));
  else if(command==="publish") console.log(JSON.stringify(await publishFilingPackage(values),null,2));
  else throw new Error(`Unknown command: ${command}`);
} catch(e) {
  console.error(`ubikia filing-package: ${e.message}`);
  process.exitCode=1;
}
