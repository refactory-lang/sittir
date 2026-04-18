import { describe, it, expect } from 'vitest';
import { createRenderer } from '../src/render.ts';
import type { RulesConfig, AnyNodeData } from '../src/types.ts';

const config: RulesConfig = {
	language: 'test',
	extensions: ['test'],
	expandoChar: null,
	metadata: { grammarSha: 'test' },
	rules: {
		macro_invocation: '$MACRO!($ARGUMENTS)',
	},
};

const { render, toEdit } = createRenderer(config);

describe('toEdit (bound)', () => {
	it('produces an Edit with correct byte offsets and rendered text', () => {
		const node: AnyNodeData = {
			$type: 'macro_invocation',
			$fields: {
				macro: { $type: 'identifier', $text: 'eprintln' },
				arguments: { $type: 'string_literal', $text: '"hello"' },
			},
		};
		const edit = toEdit(node, 42, 67);
		expect(edit.startPos).toBe(42);
		expect(edit.endPos).toBe(67);
		expect(edit.insertedText).toBe('eprintln!("hello")');
	});

	it('insertedText matches render output', () => {
		const node: AnyNodeData = {
			$type: 'macro_invocation',
			$fields: {
				macro: { $type: 'identifier', $text: 'println' },
			},
		};
		const edit = toEdit(node, 0, 10);
		expect(edit.insertedText).toBe(render(node));
	});
});
