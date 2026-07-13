import path from "node:path";

import { assembleAudibleProduct } from "./assemble.js";
import { renderAudibleProduct } from "./render.js";

export async function runAudiblePipeline({
  sourceText,
  sourceReference = null,
  outputDirectory,
  provider,
  maxCharacters = 900,
  assemble = true,
  basename = null,
  formats = ["mp3", "opus"],
  ffmpegPath,
  ffprobePath,
} = {}) {
  const renderManifest = await renderAudibleProduct({
    sourceText,
    sourceReference,
    outputDirectory,
    provider,
    maxCharacters,
  });

  if (!assemble) return renderManifest;

  return assembleAudibleProduct({
    outputDirectory,
    basename: basename ?? path.basename(path.resolve(outputDirectory)),
    formats,
    ffmpegPath,
    ffprobePath,
  });
}
