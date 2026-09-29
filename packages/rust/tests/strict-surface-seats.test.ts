// A group flattened into its parent's config keeps its own arity: the match
// block's arms take their required last arm, an absent group is the
// no-argument call, and a list seat takes an array.
import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

const arm = () =>
	rs.build.matchArm.blockEnding.strict({
		pattern: rs.build.matchPattern.strict({ pattern: rs.build.identifier('x') }),
		value: rs.build.block.strict({})
	});
const last = () =>
	rs.build.lastMatchArm.strict({
		pattern: rs.build.matchPattern.strict({ pattern: rs.build.identifier('y') }),
		value: rs.build.identifier('z')
	});

describe('a group flattened into the parent config', () => {
	it('renders with its arms and renders empty without the group', () => {
		expect(rs.build.matchBlock.strict({ matchArm: [arm()], lastArm: last() }).$render()).toBe(
			'{\n    x => {}\n    y => z\n}'
		);
		expect(rs.build.matchBlock.strict().$render()).toBe('{}');
	});
	it('refuses a partial group and a lone node where the seat takes an array', () => {
		// @ts-expect-error the group's last arm is required once the group is given
		const partial = () => rs.build.matchBlock.strict({ matchArm: [arm()] });
		const lone = () =>
			rs.build.matchBlock.strict({
				// @ts-expect-error a list seat takes an array
				matchArm: arm(),
				lastArm: last()
			});
		expect(partial).toBeDefined();
		expect(lone).toBeDefined();
	});
});
