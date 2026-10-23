import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { link } from './../link.ts';
import { normalizeGrammar } from './../normalize.ts';
import { assemble, AssembleCtx } from './../assemble.ts';
import { AssembledSupertype } from './../model/node-map.ts';
import { SITE_EDITS_KEY } from '../../dsl/wire/wire.ts';

const config = `${SITE_EDITS_KEY}: { parent: { '1/0': variant('eq'), '1/1': variant('type') } }`;

const upstreamWith = (shown: string) => ({
	extras: '/\\s/',
	rules: `source: ($) => repeat(choice($.parent, $.other)), parent: ($) => seq('(', choice(seq('=', $.x), seq(':', $.y)), ')'), other: ($) => ${shown}, x: () => /x/, y: () => /y/`
});

const modelOf = async (shown: string) => {
	const raw = await evaluateTempGrammar(upstreamWith(shown), config);
	const nodeMap = assemble(AssembleCtx.from(normalizeGrammar(link(raw))));
	const parent = nodeMap.nodes.get('parent');
	return { raw, parent };
};

describe('an alias over a flattened parent, through the model', () => {
	it.each([
		['direct', 'alias($.parent, $.shown)'],
		['prec-wrapped', 'alias(prec(1, $.parent), $.shown)']
	])('%s: the parent is the same supertype with the same variant kinds', async (_label, shown) => {
		const { raw, parent } = await modelOf(shown);
		expect(raw.supertypes).toContain('parent');
		expect(parent).toBeInstanceOf(AssembledSupertype);
		expect(JSON.stringify(raw.rules)).not.toContain('"value":"shown"');
		const variants = (parent as unknown as { subtypes: readonly { variant: string }[] }).subtypes.map((s) => s.variant);
		expect(variants).toEqual(['eq', 'type']);
	});
});
