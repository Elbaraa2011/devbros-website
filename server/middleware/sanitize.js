// Honeypot: a form field that must stay empty. Real visitors never see it
// or fill it; bots do. Returns true when the submission looks like a bot.
export function isHoneypotTripped(reqBody) {
  const honey = reqBody?.website ?? reqBody?.honeypot ?? '';
  return typeof honey === 'string' && honey.trim().length > 0;
}

// Strip characters that have no business in free-text fields submitted
// through a web form (angle brackets, control characters).
export function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[<>]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, (c) => (c === '\n' || c === '\t' ? c : ' '))
    .trim();
}

export function sanitizeMultiline(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[<>]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .trim();
}
