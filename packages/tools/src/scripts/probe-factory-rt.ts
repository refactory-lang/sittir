/**
 * Compatibility shim — local wrapper for factory probe diagnostics.
 *
 * Kept inside `@sittir/codegen` so historical script paths continue to work
 * without importing the separate `packages/validator` package into the codegen
 * build graph.
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateFactoryRenderParse } from '../validate/factory-render-parse.ts';

type Grammar = 'rust' | 'typescript' | 'python';

const ALL_GRAMMARS: readonly Grammar[] = ['rust', 'typescript', 'python'];

function resolveGrammars(args: readonly string[]): Grammar[] {
	const valid = args.filter((arg): arg is Grammar => ALL_GRAMMARS.includes(arg as Grammar));
	return valid.length > 0 ? valid : [...ALL_GRAMMARS];
}

function defaultTemplatesPath(grammar: Grammar): string {
	const packagesDir = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
	return resolve(packagesDir, grammar, 'templates');
}

for (const grammar of resolveGrammars(process.argv.slice(2))) {
	const result = await validateFactoryRenderParse(grammar, defaultTemplatesPath(grammar), 'native');
	console.log(
		`\n=== ${grammar} === total=${result.total} pass=${result.pass} fail=${result.fail} skip=${result.skip} astMatch=${result.astMatchPass}`
	);
	const buckets = new Map<string, Array<{ kind: string; msg: string }>>();
	for (const err of result.errors) {
		const key = (err.message.split(':')[0] ?? '').slice(0, 60);
		if (!buckets.has(key)) buckets.set(key, []);
		buckets.get(key)!.push({ kind: err.kind, msg: err.message.slice(0, 140) });
	}
	for (const [key, items] of [...buckets.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 8)) {
		const byKind = new Map<string, number>();
		for (const item of items) byKind.set(item.kind, (byKind.get(item.kind) ?? 0) + 1);
		console.log(`  [${items.length}] ${key}`);
		for (const [kind, count] of [...byKind.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
			console.log(`     ${kind}: ${count}`);
		}
		console.log(`     sample: ${items[0]?.msg}`);
	}
}
