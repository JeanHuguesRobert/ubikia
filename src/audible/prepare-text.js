const FRONT_MATTER = /^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n/;

export function prepareMarkdownForSpeech(markdown) {
  if (typeof markdown !== "string") {
    throw new TypeError("Markdown input must be a string");
  }

  return markdown
    .replace(FRONT_MATTER, "")
    .replace(/```[\s\S]*?```/g, "\n")
    .replace(/^#{1,6}\s+(.+)$/gm, "$1.")
    .replace(/^>\s?/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "Les références sont disponibles dans la version écrite.")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
