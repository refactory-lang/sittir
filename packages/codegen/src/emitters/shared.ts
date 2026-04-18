/**
 * Shared helpers used across emitters. Kept small — the goal is to dedupe
 * patterns that copy-paste across 3+ emitters, not to become a grab-bag.
 */

/** TypeScript identifier pattern — starts with letter/underscore/dollar,
 * continues with word chars or dollar. Used by emitters to decide whether
 * a kind name can be emitted as a bare identifier vs. a quoted literal. */
const IDENT_RE = /^[A-Za-z_$][\w$]*$/

/** True when `s` is a valid unquoted TypeScript identifier. */
export function isValidIdent(s: string): boolean {
    return IDENT_RE.test(s)
}

/** If `name` is a valid identifier, return `name`. Otherwise return its
 * JSON-quoted form — suitable for emission inside union / indexed-access
 * type positions where a non-identifier key would otherwise be a syntax
 * error. */
export function identOrQuoted(name: string): string {
    return IDENT_RE.test(name) ? name : JSON.stringify(name)
}
