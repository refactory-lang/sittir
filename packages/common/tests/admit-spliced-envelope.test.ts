import { describe, expect, it } from 'vitest';
import { admitSplicedEnvelope, type SplicedEnvelope } from '../src/runtime.ts';

const ENVELOPE = 7;
const spec: SplicedEnvelope = [ENVELOPE, 'content', 'e'];
const content = { $type: 3 };
const envelope = () => ({ $type: ENVELOPE, content: () => content });

describe('admitSplicedEnvelope', () => {
	it('stores an envelope\'s content and passes any other value through', () => {
		const other = { $type: 4 };
		expect(admitSplicedEnvelope(envelope(), spec, 'Pair.left')).toBe(content);
		expect(admitSplicedEnvelope(other, spec, 'Pair.left')).toBe(other);
		expect(admitSplicedEnvelope('text', spec, 'Pair.left')).toBe('text');
	});

	it('admits each element of a repeated slot on its own', () => {
		const other = { $type: 4 };
		expect(admitSplicedEnvelope([envelope(), other, envelope()], spec, 'List.items')).toEqual([content, other, content]);
	});
});
