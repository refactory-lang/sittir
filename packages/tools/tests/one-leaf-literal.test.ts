import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PACKAGES = join(import.meta.dirname, '..', '..');
const GRAMMARS = ['python', 'regex', 'rust', 'scm', 'typescript'] as const;

/** The generated factory modules of `grammar`. */
function factoryModules(grammar: string): { readonly file: string; readonly text: string }[] {
	const dir = join(PACKAGES, grammar, 'src', 'factories');
	return readdirSync(dir, { recursive: true, encoding: 'utf8' })
		.filter((file) => file.endsWith('.ts'))
		.map((file) => ({ file, text: readFileSync(join(dir, file), 'utf8') }));
}

/** Each anchored whole-text regex literal a leaf pattern is emitted as, with the files it appears in, once per appearance. */
function anchoredLiterals(grammar: string): Map<string, string[]> {
	const seen = new Map<string, string[]>();
	for (const { file, text } of factoryModules(grammar)) {
		for (const [literal] of text.matchAll(/\/\^\(\?:.*?\)\$\/[a-z]*/g)) seen.set(literal, [...(seen.get(literal) ?? []), file]);
	}
	return seen;
}

describe('each leaf pattern is emitted as exactly one literal', () => {
	for (const grammar of GRAMMARS) {
		it(`${grammar}: no anchored pattern literal appears twice, and none is rebuilt from a token interior`, () => {
			const copies = [...anchoredLiterals(grammar)].filter(([, files]) => files.length > 1).map(([literal, files]) => `${files.join(', ')}: ${literal.slice(0, 60)}`);
			const rebuilt = factoryModules(grammar)
				.filter(({ text }) => text.includes('new RegExp(TOKEN_INTERIORS'))
				.map(({ file }) => file);
			expect({ copies, rebuilt }).toEqual({ copies: [], rebuilt: [] });
		});
	}
});
