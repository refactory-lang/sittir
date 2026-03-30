import { describe, it, expect } from 'vitest';
import { toEdit } from '../src/edit.ts';
import { render } from '../src/render.ts';
import type { RulesRegistry } from '../src/render.ts';
import type { NodeData } from '../src/types.ts';

const registry: RulesRegistry = {
	macro_invocation: '(macro_invocation macro: (_) "!" "(" arguments: (_)? ")")',
};

describe('toEdit', () => {
	it('produces an Edit with correct byte offsets and rendered text', () => {
		const node: NodeData = {
			type: 'macro_invocation',
			fields: {
				macro: { type: 'identifier', fields: {}, text: 'eprintln' },
				arguments: { type: 'string_literal', fields: {}, text: '"hello"' },
			},
		};
		const edit = toEdit(node, registry, 42, 67);
		expect(edit.startPos).toBe(42);
		expect(edit.endPos).toBe(67);
		expect(edit.insertedText).toBe('eprintln ! ( "hello" )');
	});

	it('insertedText matches render output', () => {
		const node: NodeData = {
			type: 'macro_invocation',
			fields: {
				macro: { type: 'identifier', fields: {}, text: 'println' },
			},
		};
		const edit = toEdit(node, registry, 0, 10);
		expect(edit.insertedText).toBe(render(node, registry));
	});
});
