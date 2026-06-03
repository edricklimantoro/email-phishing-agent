import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['p', 'br', 'b', 'i', 'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code'];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

export function sanitizeEmailBody(raw: string): string {
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload'],
  });
}
