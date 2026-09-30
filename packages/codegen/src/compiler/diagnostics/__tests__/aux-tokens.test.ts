import { describe, expect, it } from 'vitest';
import { auxTokenKinds } from '../catalog-coverage.ts';
import type { GeneratedKindEntry } from '../../../dsl/symbol-table.ts';
import type { Rule } from '../../../types/rule.ts';

const pattern = (value: string) => ({ type: 'PATTERN', value }) as unknown as Rule<'evaluate'>;
const sym = (name: string) => ({ type: 'SYMBOL', name }) as unknown as Rule<'evaluate'>;
const seq = (...members: Rule<'evaluate'>[]) => ({ type: 'SEQ', members }) as unknown as Rule<'evaluate'>;
const auxToken = (kind: string, id: number): GeneratedKindEntry => ({ kind, id, anon: true, aux: true, hidden: true, terminal: true });

describe('auxTokenKinds', () => {
	it('names every anonymous auxiliary token the parser extracted', () => {
		const rules = { escape: seq(sym('backslash'), pattern('[dD]')), backslash: pattern('\\\\') };
		expect(auxTokenKinds([auxToken('escape_token1', 3), { kind: 'escape', id: 4 }], rules)).toEqual(['escape_token1']);
	});

	it('exempts the token tree-sitter shares among named rules with one identical body', () => {
		const rules = { root: seq(sym('name'), sym('flags')), name: pattern('[a-z]+'), flags: pattern('[a-z]+') };
		expect(auxTokenKinds([auxToken('name_token1', 3), { kind: 'name', id: 4 }, { kind: 'flags', id: 5 }], rules)).toEqual([]);
	});

	it('does not count an auxiliary repeat helper, which is not a token', () => {
		expect(auxTokenKinds([{ kind: 'root_repeat1', id: 3, aux: true, hidden: true }], { root: seq(pattern('a')) })).toEqual([]);
	});
});
