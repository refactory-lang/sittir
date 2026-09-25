import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.js';
import { TSKindId } from '../src/types.js';

describe('sub-factory flattening follows the slot', () => {
	it('mounts grand arms through an unfielded slot: case_pattern content reaches negative.hex', () => {
		const node = ir.casePattern.negative.hex({ content: '1f' });
		expect(node.$type).toBe(TSKindId.CasePattern);
		expect((node.content() as { $type: number }).$type).toBe(TSKindId.SimplePatternNegative);
	});
});
