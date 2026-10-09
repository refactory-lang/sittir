import { describe, expect, it } from 'vitest';
import { parseNodeModel } from '../../src/validate/common.ts';

describe('the node model\'s kind provenance', () => {
	const model = parseNodeModel(
		JSON.stringify({
			nodes: [
				{ kind: 'binding', renamedFrom: 'let_item' },
				{ kind: 'method', splitFrom: 'function' },
				{ kind: 'plain' }
			]
		})
	);

	it('maps each renamed kind to the base kind it came from', () => {
		expect(model.renamedFrom).toEqual({ binding: 'let_item' });
	});

	it('maps each split kind to the kind it was cloned from', () => {
		expect(model.splitFrom).toEqual({ method: 'function' });
	});
});
