// A built node is empty when nothing is stored inside its kind's inner gap
// (`TriviaFacts.innerRegions`); a parsed node is empty when no child of it
// holds sides, which its tree answers. Every parsed node of a kind with an
// inner side, across each grammar's corpus, must get the same answer from
// both, so the stored rule and the parsed rule cannot drift. A node known to
// disagree is named with its reason, and must still disagree, so a fix
// retires it.
import { describe, expect, it } from 'vitest';
import type { AnyUntypedNode, TriviaFacts } from '@sittir/types';
import { createEngine } from '@sittir/common';
import { isCoordinate, isEmptyNode, storesNothingIn } from '@sittir/common/utils';
import { languageByName } from '../src/languages.ts';
import { loadCorpusEntries, loadSlotAccessorOf, walkWrappedTree } from '../src/validate/common.ts';

const NATIVE_COUNTS_ANYWHERE =
	'the tree counts a named child anywhere in the node, here a capture after the closing paren, where the inner gap holds nothing';

const KNOWN: Readonly<Record<string, Readonly<Record<string, string>>>> = {
	scm: { 'Missing keyword: missing_node': NATIVE_COUNTS_ANYWHERE }
};

describe.each(['python', 'regex', 'rust', 'scm', 'typescript'])('%s: inner-gap emptiness agrees with the parsed rule', (grammar) => {
	it('gives every parsed node of an inner kind in the corpus the answer its tree gives', async () => {
		const language = await languageByName(grammar);
		const engine = await createEngine(language);
		const { hooks } = (await import(`@sittir/${grammar}/api`)) as { hooks: { trivia: TriviaFacts } };
		const regions = hooks.trivia.innerRegions;
		const accessorOf = await loadSlotAccessorOf(grammar);
		const known = KNOWN[grammar] ?? {};
		const disagreeing = new Set<string>();
		let checked = 0;
		for (const entry of loadCorpusEntries(grammar)) {
			walkWrappedTree(engine.parse(entry.source, { depth: Infinity }), accessorOf, (node) => {
				if (isCoordinate(node) || typeof node.$type !== 'number') return;
				const region = regions.get(node.$type);
				if (region === undefined) return;
				checked++;
				const parsed = isEmptyNode(node as AnyUntypedNode);
				if (storesNothingIn(node as AnyUntypedNode, region, hooks.trivia.namedUnits) !== parsed) {
					disagreeing.add(`${entry.name}: ${hooks.trivia.kindName(node.$type)}`);
				}
			});
		}
		expect(checked).toBeGreaterThan(0);
		expect([...disagreeing].filter((at) => !(at in known))).toEqual([]);
		expect(Object.keys(known).filter((at) => !disagreeing.has(at)), 'named exceptions that now agree').toEqual([]);
	});
});
