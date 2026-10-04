import { describe, expect, it } from 'vitest';
import { modelSlots } from '../src/utils.ts';

const a = { $type: 1 };
const b = { $type: 2 };
const c = { $type: 3 };

describe('modelSlots', () => {
	it('keeps the modelled slots and every non-slot member, dropping a key the model has no slot for', () => {
		const data = { $type: 9, _name: a, _semi: b, $slotOrder: ['name', 'semi'] };
		expect(modelSlots(data, ['_name'])).toEqual({ $type: 9, _name: a, $slotOrder: ['name', 'semi'] });
	});

	it('renames a lone routed key in place and keeps its value', () => {
		const data = { $type: 9, _term: a };
		expect(modelSlots(data, ['_content'], { _term: '_content' })).toEqual({ $type: 9, _content: a });
	});

	it('merges keys routed to one slot in document order, dropping a stamp left with one bucket', () => {
		const data = { $type: 9, _term: [a, c], _alternation: b, $slotOrder: ['term', 'alternation', 'term'] };
		const routed = modelSlots(data, ['_content'], { _term: '_content', _alternation: '_content' });
		expect(routed).toEqual({ $type: 9, _content: [a, b, c] });
		expect(Object.keys(routed)).toEqual(['$type', '_content']);
	});

	it('merges a routed key into a slot that also arrives under its own key', () => {
		const data = { $type: 9, _content: a, _term: b, $slotOrder: ['content', 'term'] };
		expect(modelSlots(data, ['_content'], { _term: '_content' })).toEqual({ $type: 9, _content: [a, b] });
	});

	it('renames the stamp to model slots while two or more buckets remain', () => {
		const data = { $type: 9, _name: a, _term: b, $slotOrder: ['name', 'term'] };
		expect(modelSlots(data, ['_name', '_content'], { _term: '_content' })).toEqual({
			$type: 9,
			_name: a,
			_content: b,
			$slotOrder: ['name', 'content']
		});
	});

	it('keeps the symbol-keyed members a spread copy keeps', () => {
		const token = Symbol('tree');
		const data = { $type: 9, _term: a, [token]: 'held' };
		expect((modelSlots(data, ['_content'], { _term: '_content' }) as Record<symbol, unknown>)[token]).toBe('held');
		expect((modelSlots(data, ['_term']) as Record<symbol, unknown>)[token]).toBe('held');
	});

	it('seats a merged slot at the position of its first source', () => {
		const data = { $type: 9, _term: a, _name: b, _alternation: c, $slotOrder: ['term', 'name', 'alternation'] };
		const routed = modelSlots(data, ['_content', '_name'], { _term: '_content', _alternation: '_content' });
		expect(Object.keys(routed)).toEqual(['$type', '_content', '_name', '$slotOrder']);
		expect(routed).toMatchObject({ _content: [a, c], _name: b, $slotOrder: ['content', 'name', 'content'] });
	});
});
