import { describe, expect, it } from 'vitest';
import {
	withMethods,
	isNodeData,
	isTreeNode,
	hasKind,
	coerceBooleanKeywordStorage,
	coerceBitflagStorage,
} from '../src/utils.ts';

describe('@sittir/common/utils runtime surface', () => {
	it('exports the shared runtime helpers', () => {
		expect(typeof withMethods).toBe('function');
		expect(typeof isNodeData).toBe('function');
		expect(typeof isTreeNode).toBe('function');
		expect(typeof hasKind).toBe('function');
		expect(typeof coerceBooleanKeywordStorage).toBe('function');
		expect(typeof coerceBitflagStorage).toBe('function');
	});

	it('guards and coercers behave consistently', () => {
		expect(withMethods({ value: 1 }, { extra: () => 2 }).extra()).toBe(2);
		expect(isNodeData({ $type: 1, $source: 2, _name: 'x' })).toBe(true);
		expect(isNodeData({ $type: 1 })).toBe(false);
		expect(isTreeNode({ type: 'x', field: () => undefined, text: () => 'x' })).toBe(true);
		expect(isTreeNode({ type: 'x' })).toBe(false);
		expect(hasKind({ kind: 'node' })).toBe(true);
		expect(hasKind({ kind: 1 })).toBe(false);
		expect(coerceBooleanKeywordStorage(undefined)).toBeUndefined();
		expect(coerceBooleanKeywordStorage([])).toBeUndefined();
		expect(coerceBooleanKeywordStorage(['x'])).toBe(true);
		expect(coerceBitflagStorage('a', ['a', 'b'])).toBe(1);
		expect(coerceBitflagStorage(['a', 'b'], ['a', 'b'])).toBe(3);
		expect(coerceBitflagStorage(false, ['a'])).toBeUndefined();
	});
});
