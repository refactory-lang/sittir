import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { evaluateDsl } from '../../compiler/evaluate.ts';
import { evaluateTempGrammar } from '../../compiler/__tests__/_temp-grammar.ts';

const PACKAGES = join(__dirname, '../../../..');
const layers = vi.hoisted(() => ({ checking: false, bases: [] as unknown[], changed: [] as string[][] }));

vi.mock('../wire/wire.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../wire/wire.ts')>();
	return {
		...actual,
		wireBindings: (...args: Parameters<typeof actual.wireBindings>) => {
			layers.bases.push(args[1]);
			return actual.wireBindings(...args);
		}
	};
});

vi.mock('../sittir-grammar.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../sittir-grammar.ts')>();
	const { enrich, withEnrichSidecarsOf } = await import('../enrich.ts');
	const { baseRulesOf } = await import('../shared.ts');
	const checked = <B extends Parameters<typeof actual.sittirGrammar>[0], P, O>(
		...[base, config]: Parameters<typeof actual.sittirGrammar<B, P, O>>
	) => {
		const top = actual.sittirGrammar<B, P, O>(base, config);
		if (layers.checking) {
			const before = baseRulesOf<unknown>(top) ?? {};
			const after = baseRulesOf<unknown>(enrich(withEnrichSidecarsOf(top, layers.bases.at(-1)))) ?? {};
			layers.changed.push(
				[...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
					(name) => JSON.stringify(before[name]) !== JSON.stringify(after[name])
				)
			);
		}
		return top;
	};
	return { ...actual, sittirGrammar: checked };
});

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

async function topLayerChanges(grammar: string): Promise<string[][]> {
	layers.bases.length = 0;
	layers.changed.length = 0;
	layers.checking = true;
	try {
		await evaluateDsl(join(PACKAGES, grammar, 'grammar.sittir.ts'));
	} finally {
		layers.checking = false;
	}
	return layers.changed.map((names) => [...names].sort());
}

describe('visible externals across layers', () => {
	it('aliases a visible external once when a second layer wires it again', async () => {
		const raw = await evaluateTempGrammar({ extras: '/\\s/', rules: "pair: $ => seq($.word, ',', $.word)" }, 'bindings: bindings({})');
		const sites = aliasSites(raw.rules);
		expect(sites.once.length).toBeGreaterThan(0);
		expect(sites.nested).toEqual([]);
	}, 60_000);

	it.each(['rust', 'typescript'])("takes %s's completed top layer as a fixpoint of enrich", async (grammar) => {
		expect(await topLayerChanges(grammar)).toEqual([[]]);
	}, 240_000);

	it("changes nothing in python's completed top layer but the two rules its lambda display merge aliases", async () => {
		expect(await topLayerChanges('python')).toEqual([['_expression_within_for_in_clause', 'expression']]);
	}, 240_000);
});
