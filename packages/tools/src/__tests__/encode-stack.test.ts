import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '@sittir/codegen/grammars';
import {
	codecBounds,
	disassemble,
	encodeStack,
	frameBytes,
	heightKinds,
	largestLimit
} from '../validate/encode-stack.ts';

describe('frameBytes', () => {
	it('sums an arm64 prologue up to its first call', () => {
		expect(
			frameBytes(
				['stp x29, x30, [sp, #-0x20]!', 'mov x29, sp', 'sub sp, sp, #0x40', 'bl 0x100 <g>', 'sub sp, sp, #0x10'],
				'arm64'
			)
		).toBe(96);
	});

	it('counts unrolled arm64 page probes and the remainder', () => {
		expect(
			frameBytes(
				[
					'stp x29, x30, [sp, #-16]!',
					'sub sp, sp, #1, lsl #12',
					'str xzr, [sp]',
					'sub sp, sp, #1, lsl #12',
					'sub sp, sp, #0x30',
					'bl 0x100 <g>'
				],
				'arm64'
			)
		).toBe(16 + 8192 + 48);
	});

	it('counts an arm64 probe loop once, by its target', () => {
		const loop = [
			'stp x29, x30, [sp, #-16]!',
			'sub x9, sp, #5, lsl #12',
			'sub sp, sp, #1, lsl #12',
			'cmp sp, x9',
			'str xzr, [sp]',
			'b.ne 0x8 <f+0x8>',
			'sub sp, sp, #0x40',
			'bl 0x100 <g>'
		];
		expect(frameBytes(loop, 'arm64')).toBe(16 + 5 * 4096 + 64);
	});

	it('counts the frame a darwin stack check sizes, past the check call', () => {
		expect(
			frameBytes(
				[
					'stp x28, x27, [sp, #-32]!',
					'stp x29, x30, [sp, #16]',
					'mov x16, #4800',
					'bl 0x0 <___chkstk_darwin>',
					'sub sp, sp, x16',
					'bl 0x100 <g>'
				],
				'arm64'
			)
		).toBe(32 + 4800);
	});

	it('reads on past a conditional branch', () => {
		expect(
			frameBytes(['stp x29, x30, [sp, #-16]!', 'cbz x0, 0x40 <f+0x40>', 'sub sp, sp, #0x20', 'bl 0x100 <g>'], 'arm64')
		).toBe(48);
	});

	it('sums x86-64 pushes, the frame and the return address', () => {
		expect(frameBytes(['pushq %rbp', 'pushq %r15', 'subq $0x28, %rsp', 'callq 0x0 <g>'], 'x86_64')).toBe(
			8 + 8 + 40 + 8
		);
	});

	it('counts an x86-64 probe loop once, by its target', () => {
		const loop = [
			'pushq %rbp',
			'movq %rsp, %r11',
			'subq $0x5000, %r11',
			'subq $0x1000, %rsp',
			'movq $0x0, (%rsp)',
			'cmpq %r11, %rsp',
			'jne 0x10 <f+0x8>',
			'subq $0x28, %rsp',
			'callq 0x0 <g>'
		];
		expect(frameBytes(loop, 'x86_64')).toBe(8 + 0x5000 + 0x28 + 8);
	});

	it('counts the frame __rust_probestack sizes', () => {
		expect(
			frameBytes(
				['pushq %rbp', 'movl $0x3000, %eax', 'callq 0x0 <__rust_probestack>', 'subq %rax, %rsp', 'callq 0x0 <g>'],
				'x86_64'
			)
		).toBe(8 + 0x3000 + 8);
	});
});

const whole = (kind: string): string =>
	`<sittir_x::render::node::${kind} as sittir_core::codec::wire::Codec<sittir_x::render::node::TriviaNode>>::encode_whole`;
const NAMES = {
	a: whole('ANode'),
	b: whole('BNode'),
	comment: whole('CommentNode'),
	list: '<alloc::vec::Vec<sittir_core::slot::SlotValue<sittir_x::render::node::BNode>> as sittir_core::codec::wire::Codec<sittir_x::render::node::TriviaNode>>::encode_whole',
	trivia:
		'<alloc::vec::Vec<sittir_core::trivia::TriviaEntry<sittir_x::render::node::TriviaNode>> as napi::bindgen_runtime::js_values::ToNapiValue>::to_napi_value',
	loop: 'sittir_core::codec::wire::run_encode::<sittir_x::render::node::TriviaNode>',
	step: '<sittir_x::render::node::__EncodeFrame as sittir_core::codec::wire::EncodeStep<sittir_x::render::node::TriviaNode>>::step',
	encodeStep:
		'<sittir_x::render::node::ANode as sittir_core::codec::wire::Steps<sittir_x::render::node::TriviaNode>>::encode_step',
	any: '<sittir_x::render::node::AnyNode as napi::bindgen_runtime::js_values::ToNapiValue>::to_napi_value',
	callback: 'sittir_x::snapshot_c_callback'
};

function fn(
	address: number,
	name: string,
	frame: readonly string[],
	targets: readonly (readonly [string, string])[]
): string[] {
	const lines = [...frame, ...targets.map(([op, callee]) => `${op} 0x0 <${callee}>`), 'ret'];
	return [
		`${address.toString(16).padStart(16, '0')} <${name}>:`,
		...lines.map((ins, at) => `    ${(address + 4 * at).toString(16)}: \t${ins}`)
	];
}

const GRAPH = [
	'x.node:\tfile format mach-o arm64',
	'',
	'Disassembly of section __TEXT,__text:',
	'',
	...fn(
		0x1000,
		NAMES.a,
		['stp x29, x30, [sp, #-16]!', 'sub sp, sp, #0x60'],
		[
			['bl', NAMES.list],
			['bl', NAMES.trivia]
		]
	),
	...fn(0x1100, NAMES.list, ['stp x29, x30, [sp, #-16]!', 'sub sp, sp, #0x20'], [['bl', NAMES.b]]),
	...fn(0x1200, NAMES.b, ['stp x29, x30, [sp, #-16]!', 'sub sp, sp, #0x10'], []),
	...fn(
		0x1300,
		NAMES.trivia,
		['stp x29, x30, [sp, #-16]!', 'sub sp, sp, #0x40'],
		[
			['bl', NAMES.comment],
			['bl', NAMES.loop]
		]
	),
	...fn(0x1400, NAMES.comment, ['stp x29, x30, [sp, #-16]!'], []),
	...fn(0x1500, NAMES.loop, ['stp x29, x30, [sp, #-16]!', 'sub sp, sp, #0x100'], [['bl', NAMES.step]]),
	...fn(0x1600, NAMES.step, ['stp x29, x30, [sp, #-16]!'], [['b', NAMES.encodeStep]]),
	...fn(0x1700, NAMES.encodeStep, ['stp x29, x30, [sp, #-16]!', 'sub sp, sp, #0x20'], [['bl', NAMES.a]]),
	...fn(0x1800, NAMES.any, ['stp x29, x30, [sp, #-16]!', 'sub sp, sp, #0x50'], [['bl', NAMES.loop]]),
	...fn(
		0x1900,
		NAMES.callback,
		['stp x29, x30, [sp, #-16]!', 'sub sp, sp, #0x10'],
		[
			['bl', NAMES.any],
			['bl', `${NAMES.any}+0x10`]
		]
	)
];

describe('disassemble', () => {
	it('keeps each function prologue and its calls and tail calls to other functions', async () => {
		const dis = await disassemble(GRAPH);
		expect(dis.arch).toBe('arm64');
		expect(dis.functions.size).toBe(10);
		expect([...dis.functions.get(NAMES.step)!.tails]).toEqual([NAMES.encodeStep]);
		expect([...dis.functions.get(NAMES.callback)!.calls]).toEqual([NAMES.any]);
		expect(dis.functions.get(NAMES.a)!.prologue[0]).toBe('stp x29, x30, [sp, #-16]!');
	});
});

describe('encodeStack', () => {
	it('costs a level apart from the trivia trip, the loop entry and the frames above the loop', async () => {
		const stack = encodeStack(await disassemble(GRAPH), new Set(['ANode', 'BNode', 'CommentNode']));
		expect(stack.level.bytes).toBe(112 + 48);
		expect(stack.level.steps.map((step) => step.fn)).toEqual([NAMES.a, NAMES.list]);
		expect(stack.level.to).toBe(NAMES.b);
		expect(stack.trivia.bytes).toBe(112 + 80 + 16);
		expect(stack.entry.bytes).toBe(272 + 48);
		expect(stack.entry.steps.find((step) => step.fn === NAMES.step)?.tail).toBe(true);
		expect(stack.above.bytes).toBe(32 + 96);
		expect(stack.oneTime).toBe(128 + 320 + 208);
		expect(largestLimit(stack, 65_536)).toBe(Math.floor((65_536 - 656) / 160));
	});

	it('refuses a build whose names it cannot read', async () => {
		await expect(disassemble(GRAPH).then((dis) => encodeStack(dis, new Set()))).rejects.toThrow(/must name each/);
	});
});

describe('codec bounds', () => {
	it('reads the limit and the budget as codec.rs declares them', () => {
		expect(
			codecBounds('pub const ENCODE_STACK_BUDGET: usize = 64 * 1024;\n\npub const RECURSION_LIMIT: u16 = 24;\n')
		).toEqual({ limit: 24, budget: 65_536 });
		const bounds = codecBounds(readFileSync(join(REPO_ROOT, 'rust/crates/sittir-core/src/codec.rs'), 'utf8'));
		expect(bounds.limit).toBeGreaterThan(0);
		expect(bounds.budget).toBeGreaterThan(0);
	});

	it('reads the structs node.rs stamps a height on', () => {
		expect([
			...heightKinds('pub struct A {\n    #[height]\n    height: u16,\n}\npub struct B {\n    pub x: u8,\n}\n')
		]).toEqual(['A']);
	});
});
