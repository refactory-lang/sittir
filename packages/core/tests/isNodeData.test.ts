import { describe, it, expect } from 'vitest';
import { isNodeData } from '../src/isNodeData.ts';

describe('isNodeData', () => {
	it('returns true for NodeData with fields', () => {
		expect(isNodeData({
			type: 'function_item',
			fields: { name: { type: 'identifier', text: 'fib' } },
		})).toBe(true);
	});

	it('returns true for NodeData with children', () => {
		expect(isNodeData({
			type: 'block',
			children: [{ type: 'expression_statement' }],
		})).toBe(true);
	});

	it('returns true for leaf NodeData with text', () => {
		expect(isNodeData({ type: 'identifier', text: 'fib' })).toBe(true);
	});

	it('returns true for NodeData with empty fields object', () => {
		expect(isNodeData({ type: 'empty_block', fields: {} })).toBe(true);
	});

	it('returns false for plain camelCase bag (no type)', () => {
		expect(isNodeData({ name: 'fib', body: {} })).toBe(false);
	});

	it('returns false for object with type but no payload slots', () => {
		// Nothing to identify this as NodeData — could be any ad-hoc object
		// that happens to have a `type` string.
		expect(isNodeData({ type: 'function_item' })).toBe(false);
	});

	it('returns false for null', () => {
		expect(isNodeData(null)).toBe(false);
	});

	it('returns false for undefined', () => {
		expect(isNodeData(undefined)).toBe(false);
	});

	it('returns false for strings, numbers, booleans', () => {
		expect(isNodeData('fib')).toBe(false);
		expect(isNodeData(42)).toBe(false);
		expect(isNodeData(true)).toBe(false);
	});

	it('returns false when type is not a string', () => {
		expect(isNodeData({ type: 42, fields: {} })).toBe(false);
		expect(isNodeData({ type: null, fields: {} })).toBe(false);
	});
});
