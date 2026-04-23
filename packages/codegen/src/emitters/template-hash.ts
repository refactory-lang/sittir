/**
 * SHA-256 template-bundle hash — FR-020 mechanism that detects drift
 * between the TS-side `.jinja` templates and the Rust engine baked
 * against them.
 *
 * Spec 012 T014. Unit-tested in `template-hash.test.ts` (T015).
 *
 * The hash is baked into two artifacts during codegen:
 *   - `packages/{lang}/rust-render/src/hash.rs` — `pub const
 *     TEMPLATE_BUNDLE_HASH: &str = "…";` (T016)
 *   - `packages/{lang}/src/hash.ts` — `export const
 *     TEMPLATE_BUNDLE_HASH = "…";` (T016)
 *
 * At runtime the JS backend shim compares the hash baked into the
 * native `.node` artifact (via the Rust const) against the hash
 * exported from the TS package. Mismatch triggers silent fallback to
 * the TS engine with `reason: "hash mismatch"` surfaced via
 * `getActiveBackend()` (T039).
 *
 * ## Determinism
 *
 * The function is pure — given the same file list + contents, it
 * produces byte-identical hex output. Three normalizations keep it
 * deterministic:
 *
 *   1. File order — filenames sorted lexicographically before
 *      concatenation. Insulates against filesystem enumeration order.
 *   2. Line endings — CRLF normalized to LF before hashing. Git
 *      autocrlf on Windows checkouts won't change the hash.
 *   3. Framing — each `{filename}\0{content}\0` separator keeps
 *      `["a.jinja":"b"]` distinguishable from `["a.jinjab", ""]`.
 *
 * Byte-for-byte content changes (including whitespace) DO change the
 * hash by design — template edits must force a Rust rebuild.
 */

import { createHash } from 'node:crypto'

/**
 * Input to `computeTemplateBundleHash`. One entry per `.jinja` file
 * in the grammar's templates directory.
 */
export interface TemplateFile {
	/**
	 * Template filename, without the directory prefix (e.g.
	 * `function_item.jinja`). Used only as the per-entry framing
	 * label; the same template under two different filenames hashes
	 * differently.
	 */
	filename: string
	/**
	 * Template body. Line endings will be CRLF → LF normalized before
	 * hashing, so the caller needn't pre-normalize.
	 */
	content: string
}

/**
 * Compute a stable SHA-256 hex digest over a set of template files.
 *
 * @param files — the grammar's `.jinja` files. Order is irrelevant;
 *   the function sorts by filename internally.
 * @returns lowercase hex-encoded SHA-256 digest, 64 characters.
 */
export function computeTemplateBundleHash(files: readonly TemplateFile[]): string {
	const sorted = [...files].sort((a, b) => (a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0))
	const hash = createHash('sha256')
	for (const { filename, content } of sorted) {
		const normalized = content.replace(/\r\n/g, '\n')
		hash.update(filename)
		hash.update('\0')
		hash.update(normalized)
		hash.update('\0')
	}
	return hash.digest('hex')
}
