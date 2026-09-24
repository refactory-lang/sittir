import { describe, expect, it } from 'vitest';
import { ir } from '../src/index.ts';

describe('a strict slot that admits a hidden text leaf takes its text', () => {
	it('builds the leaf from text and renders it', () => {
		expect(ir.templateString.strict('a').$render()).toBe('`a`');
	});

	it('runs the hidden leaf guard, by name, on empty text', () => {
		expect(() => ir.templateString.strict('')).toThrow(/_template_chars: text must be non-empty/);
	});

	it('still rejects a value that is neither a node nor text', () => {
		// @ts-expect-error a number is neither a child node nor its text
		ir.templateString.strict(1);
	});
});
