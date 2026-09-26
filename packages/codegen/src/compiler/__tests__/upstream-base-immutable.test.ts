import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate } from '../evaluate.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from '../resolve-grammar.ts';
import type { RawGrammar } from '../types.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const enrichedEntry = resolve(__dirname, '../../__tests__/fixtures/enriched-upstream-entry.ts');
const GRAMMARS = ['python', 'rust', 'typescript', 'scm', 'regex'] as const;

function deepFreeze(value: unknown, seen = new Set<unknown>()): void {
	if (value === null || typeof value !== 'object' || seen.has(value)) return;
	seen.add(value);
	if (value instanceof Map) {
		for (const [key, entry] of value) {
			deepFreeze(key, seen);
			deepFreeze(entry, seen);
		}
	} else if (value instanceof Set) {
		for (const entry of value) deepFreeze(entry, seen);
	}
	for (const key of Reflect.ownKeys(value)) deepFreeze((value as Record<PropertyKey, unknown>)[key], seen);
	Object.freeze(value);
}

async function freshEnrichedUpstream(grammar: string, pass: string): Promise<string> {
	(globalThis as { __enrichedUpstreamGrammar__?: string }).__enrichedUpstreamGrammar__ = grammar;
	const { rules, extras, externals, supertypes, inline, conflicts, precedences, word }: RawGrammar = await evaluate(
		`${enrichedEntry}?grammar=${grammar}&pass=${pass}`
	);
	return JSON.stringify({ rules, extras, externals, supertypes, inline, conflicts, precedences, word });
}

describe('evaluating a grammar leaves its upstream untouched', () => {
	for (const grammar of GRAMMARS) {
		it.fails(`${grammar}: the frozen upstream base survives enrich and the wired evaluation (fails while field(), optional() and repeat() stamp symbol refs in place)`, async () => {
			deepFreeze(await evaluate(resolveGrammarJsPath(grammar)));
			const before = await freshEnrichedUpstream(grammar, 'before');
			await evaluate(resolveOverridesPath(grammar));
			expect(await freshEnrichedUpstream(grammar, 'after')).toBe(before);
		}, 120_000);
	}
});
