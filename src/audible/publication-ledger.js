import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PUBLICATION_LEDGER_SCHEMA = "ubikia.publication-ledger.v0.1";

const DEFAULT_LEDGER_PATH = fileURLToPath(
  new URL("../../publications/ledger/publications.json", import.meta.url),
);

/**
 * Versioned, secret-free ledger of public appearances.
 *
 * Local artifact runs still write publication.youtube.json under artifacts/
 * (gitignored). The ledger is the durable, repository-visible memory of URLs.
 * Platforms themselves also act as recoverability backups: what was uploaded
 * can often be re-exported or re-linked from the platform UI.
 */
export async function upsertPublicationLedgerEntry(entry, {
  ledgerPath = DEFAULT_LEDGER_PATH,
} = {}) {
  if (!entry || typeof entry !== "object") {
    throw new TypeError("ledger entry must be an object");
  }
  if (!entry.platform) throw new Error("entry.platform is required");
  if (!entry.url) throw new Error("entry.url is required");

  const absoluteLedger = path.resolve(ledgerPath);
  await mkdir(path.dirname(absoluteLedger), { recursive: true });

  const ledger = (await readJsonIfPresent(absoluteLedger)) ?? emptyLedger();
  if (ledger.schema !== PUBLICATION_LEDGER_SCHEMA) {
    throw new Error(
      `Unexpected publication ledger schema: ${ledger.schema ?? "missing"}`,
    );
  }

  const normalized = normalizeEntry(entry);
  const entries = Array.isArray(ledger.entries) ? [...ledger.entries] : [];
  const index = entries.findIndex((candidate) => candidate.id === normalized.id);

  if (index >= 0) {
    entries[index] = {
      ...entries[index],
      ...normalized,
      updated_at: new Date().toISOString(),
    };
  } else {
    entries.push(normalized);
  }

  entries.sort((left, right) => {
    const leftDate = left.published_at ?? left.recorded_at ?? "";
    const rightDate = right.published_at ?? right.recorded_at ?? "";
    return leftDate.localeCompare(rightDate);
  });

  const updated = {
    schema: PUBLICATION_LEDGER_SCHEMA,
    updated_at: new Date().toISOString(),
    notes: ledger.notes ?? defaultNotes(),
    entries,
  };

  await writeFile(absoluteLedger, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
  return {
    ledgerPath: absoluteLedger,
    entry: normalized,
    entry_count: entries.length,
  };
}

export function publicationEntryFromYouTubeRecord(publication, {
  slug = null,
  source = null,
  notes = null,
} = {}) {
  if (!publication?.video_id && !publication?.url) {
    throw new Error("YouTube publication record is incomplete");
  }

  const videoId = publication.video_id
    ?? extractIdFromUrl(publication.url);
  const id = `youtube:${videoId}`;

  return normalizeEntry({
    id,
    platform: "youtube",
    url: publication.url,
    canonical_url: publication.canonical_url
      ?? `https://www.youtube.com/watch?v=${videoId}`,
    platform_id: videoId,
    title: publication.title ?? null,
    visibility: publication.visibility ?? null,
    status: publication.status ?? "published",
    published_at: publication.published_at ?? null,
    recorded_at: publication.recorded_at ?? new Date().toISOString(),
    recorded_by: publication.recorded_by ?? null,
    evidence: publication.evidence ?? {
      type: "human_confirmation",
      remote_verification: "not_performed",
    },
    slug,
    source,
    product: {
      kind: "audiovisual_essay",
      form: "spoken_essay_script",
      platform_package: "youtube",
    },
    platform_as_backup: true,
    local_artifact_directory: slug
      ? `artifacts/audible/${slug}`
      : null,
    notes,
  });
}

export function defaultPublicationLedgerPath() {
  return DEFAULT_LEDGER_PATH;
}

function normalizeEntry(entry) {
  const platform = String(entry.platform).toLowerCase();
  const platformId = entry.platform_id ?? entry.video_id ?? null;
  const id = entry.id ?? (platformId ? `${platform}:${platformId}` : null);
  if (!id) throw new Error("entry.id or entry.platform_id is required");

  return {
    id,
    platform,
    url: entry.url,
    canonical_url: entry.canonical_url ?? entry.url,
    platform_id: platformId,
    title: entry.title ?? null,
    visibility: entry.visibility ?? null,
    status: entry.status ?? "published",
    published_at: entry.published_at ?? null,
    recorded_at: entry.recorded_at ?? new Date().toISOString(),
    recorded_by: entry.recorded_by ?? null,
    evidence: entry.evidence ?? null,
    slug: entry.slug ?? null,
    source: entry.source ?? null,
    product: entry.product ?? null,
    platform_as_backup: entry.platform_as_backup !== false,
    local_artifact_directory: entry.local_artifact_directory ?? null,
    notes: entry.notes ?? null,
  };
}

function emptyLedger() {
  return {
    schema: PUBLICATION_LEDGER_SCHEMA,
    updated_at: new Date().toISOString(),
    notes: defaultNotes(),
    entries: [],
  };
}

function defaultNotes() {
  return [
    "This ledger is the repository-visible memory of publication appearances.",
    "Detailed media binaries remain local under artifacts/ (gitignored).",
    "Platforms also act as recoverability backups: uploaded material can often be re-downloaded or re-linked from the platform.",
  ];
}

function extractIdFromUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    }
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}

async function readJsonIfPresent(filename) {
  try {
    return JSON.parse(await readFile(filename, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}
