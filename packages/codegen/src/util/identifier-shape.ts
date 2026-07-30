/**
 * util/identifier-shape.ts — fixed ASCII identifier predicate, grammar-INDEPENDENT.
 *
 * Answers "is `value` a valid identifier in EMITTED code (TS / Rust) or in
 * authored config (grammar.sittir.ts paths / discriminators)?" — a fixed lexical
 * shape (`/^[A-Za-z_][A-Za-z0-9_]*$/`: letter/underscore start, no leading
 * digit), independent of any grammar.
 *
 * NOT to be confused with the grammar-AWARE word check: "does this lex as a word
 * under the grammar's `word` rule?" is `matchesWordShape` (util/word-matcher.ts),
 * which respects unicode `\p{...}` identifier grammars. Use THIS one only for
 * target-language / tooling identifiers, where the ASCII shape is the actual
 * contract.
 */

const ASCII_IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function isAsciiIdentifier(value: string): boolean {
	return ASCII_IDENTIFIER_RE.test(value);
}
