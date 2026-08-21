import { validatePublicPresencePackage } from "./public-presence-policy.js";

const FORMS = new Set(["single_image", "carousel", "reel", "story"]);
const MEDIA_TYPES = new Set(["image", "video"]);

/**
 * Build a reviewable local package for manual Instagram publication.
 *
 * This module intentionally has no credentials, remote API calls, scheduling,
 * or publication capability. A package remains a local proposal until an
 * accountable human completes the distinct publication decision.
 */
export function createInstagramPublicationPackage({
  draft,
  resolvedConfiguration,
  now = new Date(),
} = {}) {
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
    throw new TypeError("draft must be an object");
  }
  if (!resolvedConfiguration?.config) {
    throw new TypeError("resolvedConfiguration.config is required");
  }

  const form = draft.form;
  if (!FORMS.has(form)) {
    throw new Error("draft.form must be single_image, carousel, reel, or story");
  }
  if (typeof draft.id !== "string" || draft.id.trim() === "") {
    throw new Error("draft.id is required");
  }
  if (typeof draft.caption !== "string") {
    throw new TypeError("draft.caption must be a string");
  }
  if (typeof draft.principal !== "string" || draft.principal.trim() === "") {
    throw new Error("draft.principal is required");
  }
  if (!draft.provenance || typeof draft.provenance !== "object") {
    throw new Error("draft.provenance is required");
  }

  const media = normalizeMedia(draft.media, form);
  const publicPresence = validatePublicPresencePackage({
    public_presence: draft.public_presence,
  }, {
    policy: resolvedConfiguration.config.publicPresencePolicy,
  });

  return {
    schema: "ubikia.instagram-publication-package.v0.1",
    created_at: now.toISOString(),
    id: draft.id.trim(),
    status: "draft",
    target: "instagram",
    form,
    language: draft.language ?? resolvedConfiguration.config.defaultLanguage ?? null,
    principal: draft.principal.trim(),
    persona: draft.persona ?? null,
    title: draft.title ?? null,
    caption: draft.caption,
    media,
    public_presence: publicPresence,
    authenticity: draft.authenticity ?? null,
    provenance: normalizeProvenance(draft.provenance),
    human_publication_gates: {
      human_editorial_review_required: true,
      account_and_audience_context_check_required: true,
      manual_publication_required: true,
      automatic_public_publish: false,
      remote_api_call_performed: false,
    },
    publication_result: null,
  };
}

function normalizeMedia(value, form) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("draft.media must be a non-empty array");
  }
  if (form === "carousel" && value.length < 2) {
    throw new Error("A carousel requires at least two media items");
  }
  if (form !== "carousel" && value.length !== 1) {
    throw new Error(`${form} requires exactly one media item in this package schema`);
  }

  return value.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new TypeError(`draft.media[${index}] must be an object`);
    }
    if (typeof item.filename !== "string" || item.filename.trim() === "") {
      throw new Error(`draft.media[${index}].filename is required`);
    }
    if (!MEDIA_TYPES.has(item.type)) {
      throw new Error(`draft.media[${index}].type must be image or video`);
    }
    if (typeof item.alt_text !== "string" || item.alt_text.trim() === "") {
      throw new Error(`draft.media[${index}].alt_text is required`);
    }
    return {
      filename: item.filename.trim(),
      type: item.type,
      alt_text: item.alt_text.trim(),
      sha256: item.sha256 ?? null,
    };
  });
}

function normalizeProvenance(value) {
  for (const key of ["source_repository", "source_path", "source_commit"]) {
    if (typeof value[key] !== "string" || value[key].trim() === "") {
      throw new Error(`draft.provenance.${key} is required`);
    }
  }
  return {
    source_repository: value.source_repository.trim(),
    source_path: value.source_path.trim(),
    source_commit: value.source_commit.trim(),
    derived_product: value.derived_product ?? null,
    source_url: value.source_url ?? null,
  };
}
