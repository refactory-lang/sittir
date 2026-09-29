import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

const structPattern = { $type: rs.kinds.StructPattern, type: 'T' } as const;

describe('a visible wrapper seated on its parent', () => {
	it('takes the wrapped pattern where the arm takes the wrapper', () => {
		expect(rs.build.matchArm.withComma({ pattern: structPattern, value: rs.build.block({}) }).$render()).toBe('T {} => {},');
		expect(rs.build.matchArm.blockEnding({ pattern: structPattern, value: rs.build.block({}) }).$render()).toBe('T {} => {}');
		expect(rs.build.lastMatchArm({ pattern: structPattern, value: rs.build.block({}) }).$render()).toBe('T {} => {}');
	});

	it('takes the wrapper own condition beside the pattern', () => {
		expect(rs.build.matchArm.withComma({ pattern: 'x', condition: rs.build.identifier('c'), value: rs.build.block({}) }).$render()).toBe(
			'x if c => {},'
		);
	});

	it('builds the strict spelling', () => {
		const arm = rs.build.matchArm.withComma.strict({
			pattern: rs.build.structPattern.strict({ type: rs.build.identifier('T') }),
			value: rs.build.block.strict({})
		});
		expect(arm.$render()).toBe('T {} => {},');
	});

	it('still builds the hand-spelled wrapper, as a config and as a built node', () => {
		const config = rs.build.matchArm.withComma({ pattern: { pattern: structPattern }, value: rs.build.block({}) });
		const built = rs.build.matchArm.withComma.strict({
			pattern: rs.build.matchPattern.strict({ pattern: rs.build.structPattern.strict({ type: rs.build.identifier('T') }) }),
			value: rs.build.block.strict({})
		});
		expect(config.$render()).toBe('T {} => {},');
		expect(built.$render()).toBe('T {} => {},');
	});

	it('records the seat on every parent in the node model', () => {
		const model = JSON.parse(readFileSync(new URL('../src/node-model.json5', import.meta.url), 'utf8')) as {
			nodes: { kind: string; slots?: { name: string; values: { seat?: { kind: string; shape: string } }[] }[] }[];
		};
		const seated = model.nodes
			.filter((n) => n.slots?.some((s) => s.values.some((v) => v.seat?.kind === 'match_pattern' && v.seat.shape === 'flatten')))
			.map((n) => n.kind)
			.sort();
		expect(seated).toEqual(['last_match_arm', 'match_arm_block_ending', 'match_arm_with_comma']);
	});
});
