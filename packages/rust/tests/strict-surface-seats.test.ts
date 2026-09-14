// A group spliced into its parent's config keeps its own arity: the match
// block's arms take their required last arm, an absent group is the
// no-argument call, and a list seat takes an array.
import { describe, expect, it } from 'vitest';
import { ir } from '../src/index.ts';

const arm = () =>
	ir.matchArm.blockEnding.strict({
		pattern: ir.matchPattern.strict({ pattern: ir.identifier('x') }),
		value: ir.block.strict({})
	});
const last = () =>
	ir.lastMatchArm.strict({
		pattern: ir.matchPattern.strict({ pattern: ir.identifier('y') }),
		value: ir.identifier('z')
	});

describe('a group spliced into the parent config', () => {
	it('renders with its arms and renders empty without the group', () => {
		expect(ir.matchBlock.strict({ matchArm: [arm()], lastArm: last() }).$render()).toBe(
			'{\n    x => {}\n    y => z\n}'
		);
		expect(ir.matchBlock.strict().$render()).toBe('{}');
	});
	it('refuses a partial group and a lone node where the seat takes an array', () => {
		// @ts-expect-error the group's last arm is required once the group is given
		const partial = () => ir.matchBlock.strict({ matchArm: [arm()] });
		const lone = () =>
			ir.matchBlock.strict({
				// @ts-expect-error a list seat takes an array
				matchArm: arm(),
				lastArm: last()
			});
		expect(partial).toBeDefined();
		expect(lone).toBeDefined();
	});
});
