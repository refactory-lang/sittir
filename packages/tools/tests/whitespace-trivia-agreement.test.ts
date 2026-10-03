import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import type { Engine, LanguageAPI } from '@sittir/types';

/**
 * The text a loose trivia string is read by (`triviaFacts.whitespace`) and the
 * classifier a read's line gaps go through name the same member for every
 * line-break member's own text. Each case reads a source whose only gap before
 * its second item is that text. Space and tab members are never asked: the
 * query classifies only runs that hold a line break.
 */
const cases: readonly { readonly grammar: string; readonly source: (gap: string) => string }[] = [
	{ grammar: 'rust', source: (gap) => `fn a() {}${gap}fn b() {}\n` },
	{ grammar: 'typescript', source: (gap) => `a;${gap}b;\n` },
	{ grammar: 'python', source: (gap) => `x = [f(),${gap}g()]\n` },
	{ grammar: 'scm', source: (gap) => `(a)${gap}(b)\n` },
	{ grammar: 'regex', source: (gap) => `a${gap}b` }
];

type Read = { readonly $span?: { readonly start: number }; readonly $trivia?: { leading(): readonly unknown[] } };

function nodeAt(value: unknown, start: number): Read | undefined {
	if (Array.isArray(value)) {
		for (const entry of value) {
			const found = nodeAt(entry, start);
			if (found !== undefined) return found;
		}
		return undefined;
	}
	if (value === null || typeof value !== 'object') return undefined;
	const node = value as Read & Record<string, unknown>;
	if (node.$span?.start === start && node.$trivia !== undefined) return node;
	for (const key of Object.keys(node)) {
		if (!key.startsWith('_') || key === '_trivia') continue;
		const found = nodeAt(node[key], start);
		if (found !== undefined) return found;
	}
	return undefined;
}

describe('whitespace members read the same as loose text and as a read gap', () => {
	for (const { grammar, source } of cases) {
		it(`${grammar}: every line-break member's text classifies as that member`, async () => {
			const language = (await import(`../../${grammar}/src/index.ts`)).default;
			const engine = (await createEngine(language)) as Engine<LanguageAPI>;
			const whitespace = engine.trivia.whitespace;
			const members = Object.entries(whitespace?.kindIdByText ?? {}).filter(([text]) => text.includes('\n'));
			expect(members.length).toBeGreaterThan(0);
			for (const [text, kind] of members) {
				expect(whitespace!.run.test(text), `${grammar} run admits ${JSON.stringify(text)}`).toBe(true);
				const code = source(text);
				const start = new TextEncoder().encode(code.slice(0, code.indexOf(text) + text.length)).length;
				const root = engine.parse(code, { deep: true });
				const item = nodeAt(root, start);
				expect(item, `${grammar}: a node at ${start} in ${JSON.stringify(code)}`).toBeDefined();
				expect(item!.$trivia!.leading(), `${grammar} ${JSON.stringify(text)}`).toEqual([kind]);
			}
		});
	}
});
