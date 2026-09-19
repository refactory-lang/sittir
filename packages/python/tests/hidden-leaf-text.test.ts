import { describe, expect, it } from 'vitest';
import { ir } from '../src/index.ts';

describe('a strict slot that admits a hidden text leaf takes its text', () => {
	it('builds the leaf from text and renders it', () => {
		expect(ir.stringContent.strict('hello').$render()).toBe('hello');
	});

	it('runs the hidden leaf guard, by name, on unmatched text', () => {
		expect(() => ir.stringContent.strict('a"b')).toThrow(/_string_content: text does not match pattern/);
	});

	it('still rejects a value that is neither a node nor text', () => {
		// @ts-expect-error a number is neither a child node nor its text
		ir.stringContent.strict(1);
	});
});
