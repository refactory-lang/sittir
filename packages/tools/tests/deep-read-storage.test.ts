import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isStub } from '@sittir/common/utils';
import { allGrammars, type GrammarName } from '@sittir/codegen/grammars';
import { languageByName } from '../src/languages.ts';
import { loadCorpusEntries } from '../src/validate/common.ts';

/** Every slot-holding node stored below `value` that the wrap left untyped, by storage path. A node
 *  with no slots (a text leaf, a token) is stored as it was read: that already is its model shape. */
function untypedBelow(value: unknown, path: string, out: string[]): string[] {
	if (Array.isArray(value)) {
		value.forEach((entry, index) => untypedBelow(entry, `${path}[${index}]`, out));
		return out;
	}
	if (value === null || typeof value !== 'object') return out;
	const node = value as Record<string, unknown>;
	if (typeof node.$type !== 'number' || isStub(node)) return out;
	const slots = Object.entries(node).filter(([key]) => key.startsWith('_') || key === '$other');
	if (slots.length > 0 && typeof node.$render !== 'function') out.push(path);
	for (const [key, child] of slots) untypedBelow(child, `${path}.${key}`, out);
	return out;
}

describe('deep-read storage', () => {
	it.each(allGrammars())('%s: every slot-holding node a deep read expands is stored typed', async (grammar: GrammarName) => {
		const engine = await createEngine(await languageByName(grammar));
		const untyped: string[] = [];
		for (const entry of loadCorpusEntries(grammar)) {
			const found = untypedBelow(engine.parse(entry.source, { deep: true }), entry.name, []);
			if (found.length > 0) untyped.push(found[0]!);
		}
		expect(untyped).toEqual([]);
	}, 120000);
});
