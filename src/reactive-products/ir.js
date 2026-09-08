import { loadContract } from "./contract.js";
import { loadCorpus } from "./corpus.js";

export async function loadProjection(corpusPath, projectionPath) {
  const projection = await loadContract(projectionPath);
  const corpus = await loadCorpus(corpusPath, projection);
  const contract = projection.data;
  const ir = {
    editionId: contract.id,
    medium: contract.medium ?? "book",
    previousEditionId: contract.previous_edition_id ?? null,
    parentEditionId: contract.parent_edition_id ?? null,
    title: contract.title,
    subtitle: contract.subtitle,
    author: contract.author,
    language: contract.language,
    chapters: corpus.chapters,
    outputs: contract.outputs.required,
    sourceManifestPath: corpus.path,
    projectionPath: projection.path,
  };
  return { ir, corpus, projection };
}
