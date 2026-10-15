import { describe, expect, it } from 'vitest';
import { queryFlags } from '../src/portable.ts';
import { TSKindId } from '../src/types.ts';
import { hooks } from '../src/api.ts';

const slotOf = (kind: number, accessor: string) => ({ slots: { [kind]: hooks.querySlots[kind]!.find(([name]) => name === accessor)![1] } });

describe('the query flag table', () => {
	it('steps into function_modifiers for a keyword flag spelled there', () => {
		expect(queryFlags[TSKindId.FunctionItem]!['async']).toEqual({
			op: 'child',
			...slotOf(TSKindId.FunctionItem, 'functionModifiers'),
			of: { op: 'eq', text: 'async', ...slotOf(TSKindId.FunctionModifiers, 'modifiers') }
		});
	});

	it('marks a flag that depends on the node\'s context instead of lowering it', () => {
		expect(queryFlags[TSKindId.FunctionItem]!['static']).toBeNull();
	});

	it('holds always for a flag a variant form spells, whether captured as a token or a node', () => {
		expect(queryFlags[TSKindId.ReferenceExpressionRawConst]!['raw']).toEqual({ op: 'and', of: [] });
		expect(queryFlags[TSKindId.ReferenceExpressionMut]!['exclusive']).toEqual({ op: 'and', of: [] });
		expect(queryFlags[TSKindId.ReferenceExpressionRawMut]).toEqual({ raw: { op: 'and', of: [] }, writable: { op: 'and', of: [] } });
	});

	it('tests a captured node by its stamped kind', () => {
		expect(queryFlags[TSKindId.Parameter]!['mutable']).toEqual({ op: 'is', types: [TSKindId.MutableSpecifier], ...slotOf(TSKindId.Parameter, 'mutable') });
	});
});
