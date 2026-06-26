import type * as TS from 'web-tree-sitter';

/**
 * Dynamic import of web-tree-sitter. The package ships CommonJS with
 * ambiguous default-export shape depending on bundler, so we try the
 * two common locations and throw if neither carries `Parser` + `Language`.
 *
 * This is codegen-run infrastructure: it is consumed by `compiler/generated-metadata`
 * (and, internally, by the corpus validator in `validate/common.ts`). It lives at
 * the top level of `src/` — NOT under `validate/` — for two reasons (R9): the
 * validator surface is relocatable to `packages/tools`, and `codegenSourceHash()`
 * excludes `/src/validate/` from the manifest source hash, so a loader placed there
 * would let edits slip past staleness verification.
 */
export async function loadWebTreeSitter(): Promise<{
	Parser: typeof TS.Parser;
	Language: typeof TS.Language;
}> {
	const mod = await import('web-tree-sitter');
	const Parser = mod.Parser ?? (mod.default && 'Parser' in mod.default ? mod.default.Parser : undefined);
	const Language = mod.Language ?? (mod.default && 'Language' in mod.default ? mod.default.Language : undefined);
	if (!Parser || !Language) {
		throw new Error('web-tree-sitter: could not locate `Parser` or `Language` export');
	}
	await Parser.init();
	return { Parser, Language };
}
