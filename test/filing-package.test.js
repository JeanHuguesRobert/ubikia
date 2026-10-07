import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { planFilingPackage } from "../src/filing-package/plan.js";

test("filing plan exposes unmaterialized required inputs", async () => {
  const dir=await mkdtemp(path.join(tmpdir(),"ubikia-filing-test-"));
  await mkdir(path.join(dir,"src"));
  await writeFile(path.join(dir,"src","petition.md"),"---\ntitle: T\n---\n# T\n");
  const contract=path.join(dir,"filing.yml");
  await writeFile(contract,`schema: ubikia.filing-package.v0
id: test
title: Test
source_root: .
source_clean_required: false
artifact:
  filename: filing.pdf
release:
  repository: owner/repo
  tag: filing-test
  title: Filing Test
  immutable_required: true
sections:
  - id: core
    title: Core
    items:
      - id: petition
        kind: markdown
        path: src/petition.md
        status: ready
      - id: P-01
        kind: pdf
        path: null
        status: to_materialize
`);
  const plan=await planFilingPackage({contract});
  assert.equal(plan.ready,false);
  assert.equal(plan.items[0].state,"READY");
  assert.equal(plan.items[1].state,"BLOCKED_PATH_UNASSIGNED");
  assert.equal(plan.blockers[0].item,"P-01");
});
