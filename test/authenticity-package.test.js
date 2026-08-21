import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { normalizeAuthenticity } from "../src/audible/authenticity.js";
import { createYouTubePublicationPackage } from "../src/audible/package-youtube.js";

test("unknown authenticity remains explicit rather than implying no disclosure", () => {
  assert.deepEqual(normalizeAuthenticity(), {
    authenticity_risk: "unknown",
    disclosure_required: null,
    disclosure_text: null,
    human_editorial_review: "pending",
    responsible_publisher: null,
  });
});

test("YouTube package carries an audience-facing authenticity disclosure", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ubikia-authenticity-package-"));
  await writeJson(path.join(directory, "manifest.json"), {
    source_reference: "source.md",
    source_sha256: "source-sha",
    spoken_text_sha256: "spoken-sha",
    contribution_roles: {
      principal: "Principal de test",
      twin_or_agent: "Twin de test",
      substantive_reviewer: "Éditeur de test",
      responsible_publisher: "Éditeur de test",
    },
    publication_assets: {
      youtube_video: { filename: "episode.mp4", sha256: "video-sha" },
    },
  });
  await writeFile(path.join(directory, "spoken.reviewed.md"), "Texte validé.\n", "utf8");

  const publicationPackage = await createYouTubePublicationPackage({
    outputDirectory: directory,
    metadata: {
      title: "Episode de test",
      language: "fr",
      skipCaptions: true,
      authenticity: {
        authenticity_risk: "material",
        disclosure_required: true,
        disclosure_text: "La voix est synthétique et la publication a été revue.",
        human_editorial_review: "substantive_reviewed",
        responsible_publisher: "Éditeur de test",
      },
    },
  });

  assert.equal(publicationPackage.altered_or_synthetic_content, true);
  assert.equal(publicationPackage.authenticity.disclosure_required, true);
  assert.match(publicationPackage.description, /Authenticity disclosure: La voix est synthétique/);
  assert.equal(publicationPackage.provenance.contribution_roles.twin_or_agent, "Twin de test");
});

async function writeJson(filename, value) {
  await writeFile(filename, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
