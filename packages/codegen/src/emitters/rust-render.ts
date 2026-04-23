/**
 * Rust render-crate emitter. Owns codegen output for
 * `packages/{lang}/rust-render/src/*.rs` and the companion
 * `packages/{lang}/src/hash.ts` that the TS backend shim imports.
 *
 * Spec 012 T016 (this file's initial scaffold — hash emission only).
 * T027/T028 expand it to per-kind `#[derive(Template)]` structs +
 * `render_dispatch`. T030 copies `.jinja` files into the render crate
 * at codegen time. T031 overwrites the Cargo.toml with final deps.
 *
 * The emitter is pure — given a grammar's template bundle, it returns
 * the string contents of each file it would write. The CLI (T017)
 * owns filesystem I/O.
 */

import type { TemplateFile } from './template-hash.ts'
import { computeTemplateBundleHash } from './template-hash.ts'

/** Grammars the emitter supports. Matches the three per-grammar packages. */
export type Grammar = 'rust' | 'typescript' | 'python'

/**
 * Output of a single emit pass. Each field names a file path
 * (relative to the repo root) and its exact contents. The CLI writes
 * them; this module does not touch disk. Key invariant: re-running
 * the emitter over the same inputs produces byte-identical output.
 */
export interface RustRenderEmit {
	/** `packages/{lang}/rust-render/src/hash.rs` */
	hashRs: { path: string; contents: string }
	/** `packages/{lang}/src/hash.ts` */
	hashTs: { path: string; contents: string }
}

/**
 * @generated-file headers — mirror the existing emitter conventions
 * (see `packages/codegen/src/emitters/templates.ts` GENERATED_HEADER).
 * The Rust source uses `//`, the TS source uses `//`; both reference
 * the regenerate command for FR-019 / Principle III compliance.
 */
function hashRsHeader(lang: Grammar): string {
	return `// @generated from packages/${lang}/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar ${lang} --rust-render
//
// This file carries the SHA-256 digest of the template bundle at codegen
// time. The napi binding (sittir-${lang}-napi) exports it as
// \`SittirEngine.templateBundleHash\`; the JS backend shim
// (packages/${lang}/src/backend.ts) compares it against the TS-side
// hash to detect drift between the baked Rust binary and the TS
// templates, falling through to the TS engine on mismatch (FR-020).
`
}

function hashTsHeader(lang: Grammar): string {
	return `// @generated from packages/${lang}/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar ${lang} --rust-render
//
// Companion to packages/${lang}/rust-render/src/hash.rs; the two must
// agree byte-for-byte at runtime for the native backend to be picked
// (FR-020). Mismatch is caught by packages/${lang}/src/backend.ts and
// falls through to the TS engine silently.
`
}

/**
 * Emit `hash.rs` + `hash.ts` for a single grammar. Both files carry
 * the same 64-char lowercase hex digest produced by
 * `computeTemplateBundleHash(files)` (T014).
 *
 * @param lang — grammar identifier (`rust` / `typescript` / `python`).
 * @param files — the grammar's `.jinja` template bundle. Order
 *   irrelevant; the hash function sorts internally.
 * @returns paired file contents. Writing them is the caller's job.
 */
export function emitHashFiles(lang: Grammar, files: readonly TemplateFile[]): RustRenderEmit {
	const hash = computeTemplateBundleHash(files)
	return {
		hashRs: {
			path: `packages/${lang}/rust-render/src/hash.rs`,
			contents: `${hashRsHeader(lang)}\npub const TEMPLATE_BUNDLE_HASH: &str = "${hash}";\n`,
		},
		hashTs: {
			path: `packages/${lang}/src/hash.ts`,
			contents: `${hashTsHeader(lang)}\nexport const TEMPLATE_BUNDLE_HASH = '${hash}'\n`,
		},
	}
}
