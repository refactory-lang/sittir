import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { evaluate } from '../evaluate.ts';
import { resolveOverridesPath } from '../resolve-grammar.ts';

interface CompiledGrammarJson {
	readonly rules: Record<string, unknown>;
	readonly externals?: readonly { readonly name?: string }[];
	readonly inline?: readonly string[];
	readonly conflicts?: readonly (readonly string[])[];
}

function compiledGrammarJson(grammar: string): CompiledGrammarJson {
	const path = join(import.meta.dirname, '../../../../', grammar, '.sittir/src/grammar.json');
	return JSON.parse(readFileSync(path, 'utf8')) as CompiledGrammarJson;
}

function compiledNames(compiled: CompiledGrammarJson): ReadonlySet<string> {
	const externals = (compiled.externals ?? []).flatMap((external) => (external.name === undefined ? [] : [external.name]));
	return new Set([...Object.keys(compiled.rules), ...externals]);
}

describe.each(['rust', 'typescript', 'python'])('%s metadata lists match what tree-sitter compiled', (grammar) => {
	it('inline equals grammar.json inline', async () => {
		const raw = await evaluate(resolveOverridesPath(grammar));
		const compiled = compiledGrammarJson(grammar);
		const live = compiledNames(compiled);
		expect(raw.inline.filter((name) => live.has(name))).toEqual(compiled.inline ?? []);
	});

	it('conflicts equal grammar.json conflicts', async () => {
		const raw = await evaluate(resolveOverridesPath(grammar));
		const compiled = compiledGrammarJson(grammar);
		const live = compiledNames(compiled);
		expect(raw.conflicts.filter((group) => group.every((name) => live.has(name)))).toEqual(compiled.conflicts ?? []);
	});
});
