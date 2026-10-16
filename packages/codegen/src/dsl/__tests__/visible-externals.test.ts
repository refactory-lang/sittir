import { describe, expect, it } from 'vitest';
import { evaluateDsl } from '../../compiler/evaluate.ts';
import { evaluateTempGrammar } from '../../compiler/__tests__/_temp-grammar.ts';
import { grammarPackage, topLayerPath } from '../../grammars.ts';
import { layerRecordOf } from '../layer-record.ts';

interface AliasSites {
	readonly once: string[];
	readonly nested: string[];
}

function aliasSites(rules: Readonly<Record<string, unknown>>): AliasSites {
	const sites: AliasSites = { once: [], nested: [] };
	const walk = (owner: string, node: unknown): void => {
		if (Array.isArray(node)) for (const item of node) walk(owner, item);
		if (node === null || typeof node !== 'object' || Array.isArray(node)) return;
		const rule = node as { readonly type?: string; readonly content?: { readonly type?: string } };
		if (rule.type === 'ALIAS' && rule.content?.type === 'ALIAS') sites.nested.push(owner);
		if (rule.type === 'ALIAS' && rule.content?.type === 'SYMBOL') sites.once.push(owner);
		for (const value of Object.values(node)) walk(owner, value);
	};
	for (const [name, body] of Object.entries(rules)) walk(name, body);
	return sites;
}

describe('visible externals across layers', () => {
	it('aliases a visible external once when a second layer wires it again', async () => {
		const raw = await evaluateTempGrammar({ extras: '/\\s/', rules: "pair: $ => seq($.word, ',', $.word)" }, '', { bindings: '' });
		const sites = aliasSites(raw.rules);
		expect(sites.once.length).toBeGreaterThan(0);
		expect(sites.nested).toEqual([]);
	}, 60_000);

	it.each(['rust', 'typescript', 'python'])("takes %s's completed top layer as a fixpoint of enrich", async (grammar) => {
		const record = layerRecordOf({ grammar: await evaluateDsl(topLayerPath(grammarPackage(grammar))) });
		expect(record).toBeDefined();
		expect(record!.diagnostics).not.toContainEqual(expect.objectContaining({ code: 'layer-not-enrich-fixpoint' }));
	}, 240_000);
});
