// emit-grammar-shape.mjs — regenerate grammar-shape.<lang>.ts from the RAW
// upstream tree-sitter grammar.json as a literal+tuple-preserving emit.
//
// Why a generated `.ts` and not a `resolveJsonModule` import: importing
// JSON widens "SEQ" -> string, rule names -> string, and arrays -> T[]
// (no tuple indices). `as const satisfies GrammarJson` keeps strings as
// literals, keys as literal keys, and arrays as readonly tuples — exactly
// what the recursive deriver + path-key Get need.
//
// Usage:  node packages/codegen/src/grammar-shapes/emit-grammar-shape.mjs
//
// Currently rust-only (the proving grammar). Extend SOURCES to add langs.

import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../../..');

const SOURCES = [
	{
		lang: 'rust',
		json: resolve(repoRoot, 'packages/rust/node_modules/tree-sitter-rust/src/grammar.json'),
		constName: 'rustGrammarShape',
		typeName: 'RustGrammarShape'
	}
];

for (const src of SOURCES) {
	const gj = JSON.parse(readFileSync(src.json, 'utf8'));
	// Emit the supertype array under `supertypeNames` (NOT `supertypes`):
	// tree-sitter's ambient `Grammar.supertypes` is an authoring callback, so
	// the same key would block `GrammarJson extends GrammarSchema<string>`.
	const slim = { name: gj.name, rules: gj.rules, supertypeNames: gj.supertypes ?? [] };
	const body = JSON.stringify(slim, null, 1);
	const real = realpathSync(src.json).replace(repoRoot + '/', '');
	const header = [
		'/**',
		` * grammar-shape.${src.lang}.ts — GENERATED literal+tuple-preserving emit of the`,
		` * RAW upstream tree-sitter-${src.lang} grammar.json.`,
		' *',
		' * Emitted with `as const` so every STRING value stays a string LITERAL,',
		' * every rule name stays a literal key, and every JSON array becomes a',
		' * readonly TUPLE (positional indexing survives). A plain',
		' * `resolveJsonModule` import would widen all of these to',
		' * `string` / `T[]` and destroy the discriminants + tuple indices the',
		' * recursive deriver and path-key `Get` depend on.',
		' *',
		' * DO NOT hand-edit. Regenerate via grammar-shapes/emit-grammar-shape.mjs.',
		' *',
		` * Source (realpath, same pnpm-store entry as the production base import):`,
		` *   ${real}`,
		' */'
	].join('\n');
	const out = `${header}\nimport type { GrammarJson } from './grammar-json.ts';\n\nexport const ${src.constName} = ${body} as const satisfies GrammarJson;\n\nexport type ${src.typeName} = typeof ${src.constName};\n`;
	const dest = resolve(here, `grammar-shape.${src.lang}.ts`);
	writeFileSync(dest, out);
	console.log(`wrote grammar-shape.${src.lang}.ts (${body.length} bytes json, ${Object.keys(gj.rules).length} rules)`);
}
