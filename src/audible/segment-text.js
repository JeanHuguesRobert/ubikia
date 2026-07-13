export function segmentText(text, { maxCharacters = 2200 } = {}) {
  if (typeof text !== "string" || text.trim() === "") {
    throw new TypeError("Text must be a non-empty string");
  }

  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const segments = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxCharacters) {
      if (current) {
        segments.push(current);
        current = "";
      }
      segments.push(...splitLongParagraph(paragraph, maxCharacters));
      continue;
    }

    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= maxCharacters) {
      current = candidate;
    } else {
      segments.push(current);
      current = paragraph;
    }
  }

  if (current) segments.push(current);
  return segments;
}

function splitLongParagraph(paragraph, maxCharacters) {
  const sentences = paragraph.split(/(?<=[.!?…])\s+/u);
  const result = [];
  let current = "";

  for (const sentence of sentences) {
    if (sentence.length > maxCharacters) {
      if (current) {
        result.push(current);
        current = "";
      }
      for (let offset = 0; offset < sentence.length; offset += maxCharacters) {
        result.push(sentence.slice(offset, offset + maxCharacters));
      }
      continue;
    }

    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length <= maxCharacters) {
      current = candidate;
    } else {
      result.push(current);
      current = sentence;
    }
  }

  if (current) result.push(current);
  return result;
}
