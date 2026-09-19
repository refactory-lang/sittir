import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ir } from '../src/index.ts';

const structPattern = { kind: 'struct_pattern', type: 'T' } as const;

describe('a visible wrapper seated on its parent', () => {
	it('takes the wrapped pattern where the arm takes the wrapper', () => {
		expect(ir.matchArm.withComma({ pattern: structPattern, value: ir.block({}) }).$render()).toBe('T{} => {},');
		expect(ir.matchArm.blockEnding({ pattern: structPattern, value: ir.block({}) }).$render()).toBe('T{} => {}');
		expect(ir.lastMatchArm({ pattern: structPattern, value: ir.block({}) }).$render()).toBe('T{} => {}');
	});

	it('takes the wrapper own condition beside the pattern', () => {
		expect(ir.matchArm.withComma({ pattern: 'x', condition: ir.identifier('c'), value: ir.block({}) }).$render()).toBe(
			'x if c => {},'
		);
	});

	it('builds the strict spelling', () => {
		const arm = ir.matchArm.withComma.strict({
			pattern: ir.structPattern.strict({ type: ir.identifier('T') }),
			value: ir.block.strict({})
		});
		expect(arm.$render()).toBe('T{} => {},');
	});

	it('still builds the hand-spelled wrapper, as a config and as a built node', () => {
		const config = ir.matchArm.withComma({ pattern: { pattern: structPattern }, value: ir.block({}) });
		const built = ir.matchArm.withComma.strict({
			pattern: ir.matchPattern.strict({ pattern: ir.structPattern.strict({ type: ir.identifier('T') }) }),
			value: ir.block.strict({})
		});
		expect(config.$render()).toBe('T{} => {},');
		expect(built.$render()).toBe('T{} => {},');
	});

	it('records the seat on every parent in the node model', () => {
		const model = JSON.parse(readFileSync(new URL('../src/node-model.json5', import.meta.url), 'utf8')) as {
			nodes: { kind: string; slots?: { name: string; values: { seat?: { kind: string; shape: string } }[] }[] }[];
		};
		const seated = model.nodes
			.filter((n) => n.slots?.some((s) => s.values.some((v) => v.seat?.kind === 'match_pattern' && v.seat.shape === 'splice')))
			.map((n) => n.kind)
			.sort();
		expect(seated).toEqual(['last_match_arm', 'match_arm_block_ending', 'match_arm_with_comma']);
	});
});
