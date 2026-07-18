import path from "node:path";

/**
 * Returns true when candidate resolves to the same path as root, or a path
 * strictly inside root.
 */
export function isPathInsideOrEqual(candidate, root) {
  const resolvedCandidate = path.resolve(candidate);
  const resolvedRoot = path.resolve(root);
  if (resolvedCandidate === resolvedRoot) return true;

  const relative = path.relative(resolvedRoot, resolvedCandidate);
  return relative !== ""
    && !relative.startsWith("..")
    && !path.isAbsolute(relative);
}

/**
 * Detect unsafe input/output aliasing for finalize-style workflows where the
 * output workspace is recreated or rewritten while inputs still point into it.
 */
export function detectFinalizePathAliasing({
  sourceFile,
  spokenFile,
  outputDirectory,
} = {}) {
  if (!sourceFile || !spokenFile || !outputDirectory) {
    throw new Error("sourceFile, spokenFile, and outputDirectory are required");
  }

  const absoluteSource = path.resolve(sourceFile);
  const absoluteSpoken = path.resolve(spokenFile);
  const absoluteOutput = path.resolve(outputDirectory);

  return {
    source_inside_output: isPathInsideOrEqual(absoluteSource, absoluteOutput),
    spoken_inside_output: isPathInsideOrEqual(absoluteSpoken, absoluteOutput),
    source_equals_spoken: absoluteSource === absoluteSpoken,
    paths: {
      source: absoluteSource,
      spoken: absoluteSpoken,
      output: absoluteOutput,
    },
  };
}

/**
 * Policy for finalize: never rely on copyFile from a path that may be
 * rewritten when the workspace is prepared. Callers must stage from the
 * already-read in-memory buffers after workspace creation.
 */
export function requireStagedFinalizeInputs(aliasing) {
  if (!aliasing || typeof aliasing !== "object") {
    throw new TypeError("aliasing report is required");
  }

  return {
    must_stage_source: aliasing.source_inside_output === true,
    must_stage_spoken: true,
    aliasing_detected: aliasing.source_inside_output === true
      || aliasing.spoken_inside_output === true,
    message: aliasing.spoken_inside_output || aliasing.source_inside_output
      ? "Input path(s) resolve inside the finalize output directory. Content will be staged from memory so approved inputs are not replaced before use."
      : null,
  };
}
