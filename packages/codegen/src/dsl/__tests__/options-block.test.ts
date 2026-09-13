import { describe, it, expect } from 'vitest';
import { readOptionsBlock } from '../wire/options-block.ts';
import { preference } from '../primitives/preference.ts';

const KINDS = new Set(['block', 'keyword_argument', 'object_type']);

describe('readOptionsBlock', () => {
	it('reads a virtual kind as a label', () => {
		const out = readOptionsBlock({ body: { before: preference('indent') } }, KINDS);
		expect(out.declarations).toEqual([{ path: 'body/before', arm: 'indent' }]);
		expect(out.bindings).toEqual([]);
	});

	it('reads a kind-relative declaration as a full address', () => {
		const out = readOptionsBlock({ keyword_argument: { '"="/before': preference('tight') } }, KINDS);
		expect(out.declarations).toEqual([{ path: 'keyword_argument/"="/before', arm: 'tight' }]);
	});

	it('reads a binding from an address to a label', () => {
		const out = readOptionsBlock(
			{
				body: { before: preference('indent') },
				_bindings: { 'block/"{"/after': 'body/before' }
			},
			KINDS
		);
		expect(out.bindings).toEqual([{ address: 'block/"{"/after', label: 'body/before' }]);
	});

	it('keeps membership and default separate', () => {
		const out = readOptionsBlock(
			{
				assignment: { before: preference('space') },
				keyword_argument: { '"="/before': preference('tight') },
				_bindings: { 'keyword_argument/"="/before': 'assignment/before' }
			},
			KINDS
		);
		expect(out.declarations).toContainEqual({ path: 'keyword_argument/"="/before', arm: 'tight' });
		expect(out.bindings).toEqual([{ address: 'keyword_argument/"="/before', label: 'assignment/before' }]);
	});

	it('rejects a label whose root is a real kind', () => {
		expect(() =>
			readOptionsBlock(
				{
					block: { before: preference('space') },
					_bindings: { 'object_type/opening:/after': 'block/before' }
				},
				KINDS
			)
		).toThrow(/label 'block\/before' names the kind 'block'/);
	});

	it('rejects a binding naming no declared label', () => {
		expect(() => readOptionsBlock({ _bindings: { 'block/"{"/after': 'body/before' } }, KINDS)).toThrow(/names no label/);
	});

	it('treats an unknown top-level key as a virtual kind', () => {
		const out = readOptionsBlock({ nowhere: { before: preference('tight') } }, KINDS);
		expect(out.declarations).toEqual([{ path: 'nowhere/before', arm: 'tight' }]);
	});

	it('rejects a value that is not a preference', () => {
		expect(() => readOptionsBlock({ body: { before: 'indent' } }, KINDS)).toThrow(/takes preference\(arm\)/);
	});
});
