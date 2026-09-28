import { describe, expect, it } from 'vitest';
import { joinIdNames, type CEnumEntry, type ParserSymbolFacts } from '../symbol-table.ts';
import { evaluateRecords } from '../../compiler/diagnostics/grammar-diagnostics.ts';
import type { RawGrammar } from '../../compiler/types.ts';

function join(symbols: readonly (readonly [cName: string, id: number, named: boolean, key: string, literalText?: string])[]) {
	const ids = new Map<string, CEnumEntry>(symbols.map(([cName, id]) => [cName, { cName, id }]));
	const facts: ParserSymbolFacts = {
		aliasedNonTerminals: new Set(),
		visible: new Map(),
		named: new Map(symbols.map(([cName, , named]) => [cName, named])),
		supertypes: new Set(),
		tokenCount: undefined
	};
	const keyOf = new Map(symbols.map(([cName, , , key]) => [cName, key]));
	const texts = new Map(symbols.flatMap(([cName, , , , literalText]) => (literalText === undefined ? [] : [[cName, { literalText }] as const])));
	return joinIdNames(ids, new Map(), (cName) => keyOf.get(cName)!, texts, facts);
}

const idsOf = (joined: ReturnType<typeof join>) => [...joined.ids].map(([key, entry]) => [key, entry.id]);

describe('joinIdNames', () => {
	it('gives the anonymous side of a punctuation/named collision the punctuation suffix, in either order', () => {
		for (const order of [
			[['anon_sym_DOT', 7, false, 'dot'], ['sym_dot', 99, true, 'dot']],
			[['sym_dot', 99, true, 'dot'], ['anon_sym_DOT', 7, false, 'dot']]
		] as const) {
			const joined = join(order);
			expect(new Map(idsOf(joined) as [string, number][])).toEqual(new Map([['dot', 99], ['dot_punctuation', 7]]));
			expect(joined.collisions).toEqual([]);
		}
	});

	it('records a keyword and a named rule that derive one key, keeping the named rule, and never throws', () => {
		for (const order of [
			[['sym_true_keyword', 30, true, 'true_keyword'], ['anon_sym_true', 31, false, 'true_keyword', 'true']],
			[['anon_sym_true', 31, false, 'true_keyword', 'true'], ['sym_true_keyword', 30, true, 'true_keyword']]
		] as const) {
			const joined = join(order);
			expect(idsOf(joined)).toEqual([['true_keyword', 30]]);
			expect(joined.collisions).toEqual([{ key: 'true_keyword', symbols: ['sym_true_keyword', 'anon_sym_true'] }]);
		}
	});

	it('records two symbols of one kind that derive one key, keeping the first, and never throws', () => {
		const joined = join([
			['anon_sym_BSLASHk', 3, false, 'bslashk'],
			['anon_sym_BSLASHK', 4, false, 'bslashk']
		]);
		expect(idsOf(joined)).toEqual([['bslashk', 3]]);
		expect(joined.collisions).toEqual([{ key: 'bslashk', symbols: ['anon_sym_BSLASHk', 'anon_sym_BSLASHK'] }]);
	});

	it('a recorded collision is a blocking kind-key-collision record naming both symbols', () => {
		const raw = {
			name: 'demo',
			predictedKinds: { entries: [], keyCollisions: [{ key: 'bslashk', symbols: ['anon_sym_BSLASHk', 'anon_sym_BSLASHK'] }] }
		} as unknown as RawGrammar;
		expect(evaluateRecords(raw)).toEqual([
			expect.objectContaining({
				code: 'kind-key-collision',
				ownerKind: 'bslashk',
				canProceed: false,
				message: expect.stringMatching(/anon_sym_BSLASHk.*anon_sym_BSLASHK/)
			})
		]);
	});
});
