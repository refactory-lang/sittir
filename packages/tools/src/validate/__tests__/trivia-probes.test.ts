import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../../languages.ts';
import { loadLanguageForGrammar } from '../common.ts';
import { detachedRenderer } from './helpers/detached-renderer.ts';
import { ORPHANS, PROBES } from './helpers/trivia-sources.ts';

async function sourceRenderer(grammar: string): Promise<(source: string, deep: boolean) => string> {
	const engine = await createEngine(await languageByName(grammar));
	return (source, deep) => (engine.parse(source, { depth: deep ? Infinity : 1 }) as unknown as { $render(): string }).$render();
}

describe('trivia probes', () => {
	for (const [grammar, probes] of Object.entries(PROBES)) {
		for (const { source, detached, owner } of probes) {
			const name = `${grammar}: ${JSON.stringify(source)}${owner === undefined ? '' : ` (comment is ${owner})`}`;
			it(`${name} renders byte-exact from its read, and detached as its layout`, async () => {
				const render = await sourceRenderer(grammar);
				expect(render(source, false)).toBe(source);
				expect(render(source, true)).toBe(source);
				expect((await detachedRenderer(grammar))(source)).toBe(detached);
			});
		}
	}

	for (const [grammar, cases] of Object.entries(ORPHANS)) {
		for (const [source, detached] of cases) {
			it(`${grammar}: ${JSON.stringify(source)} keeps a comment beside a scalar-stored leaf on the enclosing node`, async () => {
				const rendered = (await detachedRenderer(grammar))(source);
				expect(rendered).toBe(detached);
				const { Parser, lang } = await loadLanguageForGrammar(grammar);
				const parser = new Parser();
				parser.setLanguage(lang);
				expect(parser.parse(rendered)!.rootNode.hasError).toBe(false);
			});
		}
	}
});
