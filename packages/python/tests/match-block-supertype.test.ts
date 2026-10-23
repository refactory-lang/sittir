import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { ir as irBuilders } from '../src/ir.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);
const ir = irBuilders as unknown as Record<string, any>;
const is = python.is as unknown as Record<string, any>;

const matchBlock = () => {
	const block = py
		.parse('match x:\n    case 1:\n        pass\n')
		.$query()
		.$descendants.ofType(py.kinds.MatchBlockBlock)
		.find();
	if (block === undefined) throw new Error('expected a match_block_block');
	return block;
};

describe('match block supertype guards', () => {
	it('answers the supertype guard true on a parsed match_block_block', () => {
		expect(is.matchBlock(matchBlock())).toBe(true);
	});

	it('exposes the block and empty alternates as guards', () => {
		expect(typeof is.matchBlock.block).toBe('function');
		expect(typeof is.matchBlock.empty).toBe('function');
		expect(is.matchBlock.block(matchBlock())).toBe(true);
		expect(is.matchBlock.empty(matchBlock())).toBe(false);
	});

	it('builds the flat match block form, with the owner route as an alternate', () => {
		expect(typeof ir.matchBlockBlock).toBe('function');
		expect(typeof ir.matchBlock.block).toBe('function');
	});
});
