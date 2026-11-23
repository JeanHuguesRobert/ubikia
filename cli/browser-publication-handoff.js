#!/usr/bin/env node
import path from "node:path";
import {prepareBrowserPublicationHandoff} from "../src/publication/browser-handoff.js";
const args=process.argv.slice(2);
const one=key=>args.includes(key)?args[args.indexOf(key)+1]:undefined;
try{
 const dir=one("--artifact");
 if(!dir)throw Error("ARTIFACT_DIRECTORY_REQUIRED");
 const result=await prepareBrowserPublicationHandoff({
  artifactDirectory:path.resolve(dir),expectedUrl:one("--expected-url"),
  browserInstanceId:one("--browser-instance")||"fracta2-hosted",
  ledgerPath:path.resolve(one("--ledger")||"publications/ledger/publications.json"),
  source:{repository:one("--source-repo"),path:one("--source-path"),commit:one("--source-commit")}
 });
 console.log(JSON.stringify(result,null,2));
}catch(e){console.error("UBIKIA_HANDOFF_REJECTED "+e.message);process.exitCode=2}
