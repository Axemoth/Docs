import sanitizeHtml from "sanitize-html";

export const MAX_DOCUMENT_TITLE_LENGTH = 120;
export const MAX_DOCUMENT_CONTENT_LENGTH = 250_000;

const allowedTags = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "h1",
  "h2",
  "ul",
  "ol",
  "li",
  "div",
];

export function validateDocumentTitle(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Document title must be text");
  }

  const title = value.trim();
  if (!title) {
    throw new Error("Document title cannot be empty");
  }
  if (title.length > MAX_DOCUMENT_TITLE_LENGTH) {
    throw new Error(`Document title must be ${MAX_DOCUMENT_TITLE_LENGTH} characters or fewer`);
  }

  return title;
}

export function sanitizeDocumentContent(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Document content must be text");
  }
  if (value.length > MAX_DOCUMENT_CONTENT_LENGTH) {
    throw new Error("Document content is too large");
  }

  return sanitizeHtml(value, {
    allowedTags,
    allowedAttributes: {},
    allowedSchemes: [],
    disallowedTagsMode: "discard",
  });
}
