// Escapes every regular-expression metacharacter so user input is matched
// literally. Without this, a query like "(a+)+$" is compiled as a catastrophic
// backtracking pattern and blocks the Node event loop (ReDoS).
export const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Builds a safe case-insensitive "contains" matcher from untrusted input.
export const safeContainsRegex = (str) => new RegExp(escapeRegex(str), 'i');
