import { describe, expect, it } from 'vitest';
import { collectOrphanedRules } from '../reachable-rules.ts';

const sym = (name: string) => ({ type: 'SYMBOL', name });
const blank = { type: 'BLANK' };

describe('collectOrphanedRules', () => {
	it('keeps hidden rules reached from a visible rule and drops the unreached ones', () => {
		const rules = { program: { type: 'SEQ', members: [sym('_used')] }, _used: sym('identifier'), _unused: sym('identifier'), identifier: { type: 'PATTERN', value: 'x' } };
		expect(collectOrphanedRules(rules, new Set())).toEqual(['_unused']);
	});

	it('drops an unreferenced visible rule whose body is blank', () => {
		const rules = { program: sym('identifier'), identifier: { type: 'PATTERN', value: 'x' }, match_block_empty: blank };
		expect(collectOrphanedRules(rules, new Set())).toEqual(['match_block_empty']);
	});

	it('keeps a blank visible rule that something references or protects', () => {
		const rules = { program: { type: 'CHOICE', members: [sym('program_bare'), sym('identifier')] }, program_bare: blank, identifier: { type: 'PATTERN', value: 'x' }, kept: blank };
		expect(collectOrphanedRules(rules, new Set(['kept']))).toEqual([]);
	});

	it('treats sittir\'s empty choice the same as tree-sitter\'s blank', () => {
		const rules = { program: sym('identifier'), identifier: { type: 'PATTERN', value: 'x' }, match_block_empty: { type: 'CHOICE', members: [] } };
		expect(collectOrphanedRules(rules, new Set())).toEqual(['match_block_empty']);
	});
});
