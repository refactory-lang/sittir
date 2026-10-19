import { describe, expect, it } from 'vitest';
import { queryFlags } from '../src/portable.ts';
import { TSKindId } from '../src/types.ts';
import { hooks } from '../src/api.ts';
import { slotItems } from '../../common/src/query-holds.ts';

/** Every kind-id leaf the reader gives a slot of a node the walk reaches: the stamped id an enum kind's member is read as. */
const leavesRead = (nodes: Iterable<{ readonly $type: number }>): number[] =>
	[...nodes].flatMap((node) => (hooks.querySlots[node.$type] ?? []).flatMap(([accessor]) => slotItems(node, accessor).filter((item): item is number => typeof item === 'number')));
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

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

	it('keys a member flag by the stamped kind the reader gives the parsed member, decided once by its fixed text', async () => {
		const rs = await createEngine(rust);
		const types = (source: string) => leavesRead((rs.parse(source) as unknown as { $query(): { $descendants: Iterable<{ readonly $type: number }> } }).$query().$descendants);
		const unsigned = types('fn f(a: u8, b: i8) {}').filter((type) => queryFlags[type]?.['unsigned'] !== undefined);
		expect(unsigned).toEqual([TSKindId.U8Keyword]);
		expect(queryFlags[TSKindId.U8Keyword]!['unsigned']).toEqual({ op: 'and', of: [] });
		expect(queryFlags[TSKindId.I8Keyword]?.['unsigned']).toBeUndefined();
	});
});
