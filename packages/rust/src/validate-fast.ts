/**
 * Lightweight Rust validation using regex heuristics.
 *
 * Unlike `validate()` (which requires the JSSG runtime's tree-sitter parser),
 * these functions work in any environment — tests, CI, Node.js scripts.
 * They catch common structural errors (mismatched braces, keyword misuse)
 * but are not a full parse.
 */
import type { ValidationResult } from './types.js';

function detectErrors(source: string): Array<{ offset: number; kind: 'ERROR' }> {
	const errors: Array<{ offset: number; kind: 'ERROR' }> = [];
	const openBraces = (source.match(/{/g) ?? []).length;
	const closeBraces = (source.match(/}/g) ?? []).length;

	if (openBraces !== closeBraces) {
		const offset =
			openBraces > closeBraces ? source.lastIndexOf('{') : source.lastIndexOf('}');
		errors.push({ offset, kind: 'ERROR' });
	}

	const rustKeywords =
		/\b(?:struct|fn|impl|trait|enum|type|mod)\s+(?:fn|let|if|else|while|for|match|impl|use|mod|pub|crate|self|super|type|where|trait|enum|as|in|return|break|continue|loop|move|dyn|extern|unsafe|const|static)\b/;
	const keywordMatch = rustKeywords.exec(source);
	if (keywordMatch) {
		errors.push({ offset: keywordMatch.index, kind: 'ERROR' });
	}

	return errors;
}

/**
 * Fast regex-based validation. No runtime dependencies.
 * Use `validate()` for full tree-sitter accuracy when inside the JSSG runtime.
 */
export function validateFast(source: string): ValidationResult {
	const errors = detectErrors(source);
	if (errors.length === 0) return { ok: true };
	return { ok: false, errors };
}

/**
 * Assert that rendered Rust source has no obvious errors.
 * Returns the source unchanged on success; throws on failure.
 */
export function assertValid(source: string): string {
	const result = validateFast(source);
	if (result.ok) return source;
	const details = result.errors.map((e) => `${e.kind}@${e.offset}`).join(', ');
	throw new Error(`Rust validation failed: ${details}`);
}
