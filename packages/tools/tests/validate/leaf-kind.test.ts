import { describe, expect, it } from 'vitest';
import { isLeafKind, parseNodeModel } from '../../src/validate/common.ts';

const model = parseNodeModel(
	JSON.stringify({
		nodes: [
			{ kind: 'word', modelType: 'pattern' },
			{ kind: 'size', modelType: 'enum' },
			{ kind: 'fn_kw', modelType: 'keyword', unit: true },
			{ kind: 'comma', modelType: 'punctuation', unit: true },
			{ kind: 'call', modelType: 'branch' },
			{ kind: 'wrap', modelType: 'envelope' }
		]
	})
);

describe('isLeafKind', () => {
	it.each(['word', 'size', 'fn_kw', 'comma'])('holds %s as a leaf', (kind) => {
		expect(isLeafKind(model, kind)).toBe(true);
	});

	it.each(['call', 'wrap', 'missing'])('does not hold %s as a leaf', (kind) => {
		expect(isLeafKind(model, kind)).toBe(false);
	});

	it('reads a unit kind from the model stamp', () => {
		expect([...model.unitKinds].sort()).toEqual(['comma', 'fn_kw']);
	});
});
