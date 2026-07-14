import { describe, it, expect } from 'vitest';
import { createRenderer } from '../src/loader.ts';
import { applyEdits } from '../src/edit.ts';
import type { RulesConfig, AnyNodeData, FormatRecord } from '../src/types.ts';

const config: RulesConfig = {
	language: 'test',
	extensions: ['test'],
	expandoChar: null,
	metadata: { grammarSha: 'test' },
	rules: {
		macro_invocation: '$MACRO!($ARGUMENTS)'
	}
};

const { render, toEdit } = createRenderer(config);

describe('toEdit (bound)', () => {
	it('produces an Edit with correct byte offsets and rendered text', () => {
		const node: AnyNodeData = {
			$type: 'macro_invocation',
			$fields: {
				macro: { $type: 'identifier', $text: 'eprintln' },
				arguments: { $type: 'string_literal', $text: '"hello"' }
			}
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
				macro: { $type: 'identifier', $text: 'println' }
			}
		};
		const edit = toEdit(node, 0, 10);
		expect(edit.insertedText).toBe(render(node));
	});
});

describe('applyEdits', () => {
	it('empty edits returns source and format unchanged', () => {
		const result = applyEdits('hello', [], undefined);
		expect(result).toEqual({ source: 'hello', format: undefined });
	});

	it('single insertion (delta > 0)', () => {
		const { source, format } = applyEdits(
			'hello world',
			[{ startPos: 5, endPos: 5, insertedText: ' beautiful' }],
			undefined
		);
		expect(source).toBe('hello beautiful world');
		expect(format).toBeUndefined();
	});

	it('single deletion (delta < 0)', () => {
		const { source, format } = applyEdits('hello world', [{ startPos: 5, endPos: 11, insertedText: '' }], undefined);
		expect(source).toBe('hello');
		expect(format).toBeUndefined();
	});

	it('replacement (same length)', () => {
		const { source, format } = applyEdits(
			'hello world',
			[{ startPos: 6, endPos: 11, insertedText: 'earth' }],
			undefined
		);
		expect(source).toBe('hello earth');
		expect(format).toBeUndefined();
	});

	it('rebases trivia offset when edit is before trivia', () => {
		const fmt: FormatRecord = {
			trivia: [{ offset: 10, text: ' ' }]
		};
		// edit at startPos 3, inserts 2 chars (delta +2) → trivia shifts to 12
		const { format } = applyEdits('hello world', [{ startPos: 3, endPos: 3, insertedText: 'XX' }], fmt);
		expect(format?.trivia?.[0]?.offset).toBe(12);
	});

	it('does not rebase trivia offset when edit is after trivia', () => {
		const fmt: FormatRecord = {
			trivia: [{ offset: 2, text: ' ' }]
		};
		// edit at startPos 5, trivia at 2 → trivia offset unchanged
		const { format } = applyEdits('hello world', [{ startPos: 5, endPos: 5, insertedText: 'XX' }], fmt);
		expect(format?.trivia?.[0]?.offset).toBe(2);
	});

	it('applies multiple unsorted edits correctly', () => {
		// edits at positions 5 and 0 — provided in arbitrary order
		const { source } = applyEdits(
			'hello world',
			[
				{ startPos: 5, endPos: 11, insertedText: ' earth' },
				{ startPos: 0, endPos: 5, insertedText: 'hi' }
			],
			undefined
		);
		expect(source).toBe('hi earth');
	});
});
