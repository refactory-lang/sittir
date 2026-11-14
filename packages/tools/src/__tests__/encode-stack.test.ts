import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '@sittir/codegen/grammars';
import {
	codecBounds,
	DYNAMIC_CLASSES,
	disassemble,
	imageOf,
	encodeStack,
	frameBytes,
	gotSlots,
	heightKinds,
	largestLimit,
	namedCopy,
	peSlots,
	type Disassembled,
	type Disassembly,
	type Image
} from '../validate/encode-stack.ts';

const named = (dis: Disassembly, name: string): Disassembled => {
	const found = [...dis.functions.values()].filter((fn) => fn.name === name);
	expect(found).toHaveLength(1);
	return found[0]!;
};

const names = (dis: Disassembly, starts: Iterable<number>): string[] => [...starts].map((start) => dis.functions.get(start)!.name);

const linked = (lines: readonly string[]): string[] => {
	const starts = new Map(
		lines.flatMap((line) => {
			const header = /^([0-9a-f]+) <(.*)>:$/.exec(line);
			return header ? [[header[2]!, Number.parseInt(header[1]!, 16)] as const] : [];
		})
	);
	return lines.map((line) =>
		line.replace(/ 0x0 <(.+)>$/, (whole, name: string) => {
			const start = starts.get(name);
			return start === undefined ? whole : ` 0x${start.toString(16)} <${name}>`;
		})
	);
};

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

	it('reads an immediate past the comment objdump prints after it, in each listing', () => {
		expect(frameBytes(['pushq %rbx', 'subq $0x128, %rsp # imm = 0x128', 'callq 0x0 <g>'], 'x86_64')).toBe(8 + 0x128 + 8);
		expect(frameBytes(['pushq %rbx', 'subq $0x128, %rsp ## imm = 0x128', 'callq 0x0 <g>'], 'x86_64')).toBe(8 + 0x128 + 8);
		expect(
			frameBytes(
				['movl $0x3000, %eax # imm = 0x3000', 'callq 0x0 <__rust_probestack>', 'subq %rax, %rsp', 'callq 0x0 <g>'],
				'x86_64'
			)
		).toBe(0x3000 + 8);
		for (const comment of ['// =4800', '; =4800']) {
			expect(
				frameBytes(
					['stp x29, x30, [sp, #-0x10]!', `mov x16, #0x12c0 ${comment}`, 'bl 0x0 <___chkstk_darwin>', 'sub sp, sp, x16', 'bl 0x100 <g>'],
					'arm64'
				)
			).toBe(16 + 4800);
		}
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
	it('keeps each function frame and its calls and tail calls to other functions', async () => {
		const dis = await disassemble(linked(GRAPH));
		expect(dis.arch).toBe('arm64');
		expect(dis.functions.size).toBe(10);
		expect(names(dis, named(dis, NAMES.step).tails)).toEqual([NAMES.encodeStep]);
		expect(names(dis, named(dis, NAMES.callback).calls)).toEqual([NAMES.any]);
		expect(named(dis, NAMES.a).frame).toBe(16 + 0x60);
	});

	it('keeps apart the functions that share a name, each with its own frame, calls and sites', async () => {
		const route = 'sittir_x::render::node::_::__route';
		const dis = await disassemble(
			linked([
				...ARM_ELF,
				...fn(0x1000, route, ['stp x29, x30, [sp, #-16]!', 'blr x8'], []),
				...fn(0x2000, route, ['stp x29, x30, [sp, #-16]!', 'sub sp, sp, #0x100'], [['bl', G]]),
				...fn(0x3000, 'sittir_x::f', ['stp x29, x30, [sp, #-16]!', 'bl 0x2000 <sittir_x::render::node::_::__route>'], []),
				...fn(0x4000, G, [], [])
			]),
			image()
		);
		const [first, second] = [dis.functions.get(0x1000)!, dis.functions.get(0x2000)!];
		expect([first.name, second.name]).toEqual([route, route]);
		expect([first.frame, second.frame]).toEqual([16, 16 + 0x100]);
		expect([first.unresolved, second.unresolved]).toEqual([[{ offset: 4, ins: 'blr x8' }], []]);
		expect(names(dis, second.calls)).toEqual([G]);
		expect([...named(dis, 'sittir_x::f').calls]).toEqual([0x2000]);
	});
});

const HEIGHTS = new Set(['ANode', 'BNode', 'CommentNode']);

describe('encodeStack', () => {
	it('costs a level apart from the trivia trip and the frames from the callback to the first whole encode', async () => {
		const stack = encodeStack(await disassemble(linked(GRAPH)), HEIGHTS);
		expect(stack.level.bytes).toBe(112 + 48);
		expect(stack.level.steps.map((step) => step.fn)).toEqual([NAMES.a, NAMES.list]);
		expect(stack.level.to).toBe(NAMES.b);
		expect(stack.trivia.bytes).toBe(112 + 80 + 16);
		expect(stack.above.bytes).toBe(32 + 96 + 272 + 48);
		expect(stack.above.steps.map((step) => step.fn)).toEqual([NAMES.callback, NAMES.any, NAMES.loop, NAMES.step, NAMES.encodeStep]);
		expect(stack.above.steps.find((step) => step.fn === NAMES.step)?.tail).toBe(true);
		expect(stack.above.to).toBe(NAMES.a);
		expect(stack.oneTime).toBe(448 + 208);
		expect(stack.unresolved).toEqual([]);
		expect(largestLimit(stack, 65_536)).toBe(Math.floor((65_536 - 656) / 160));
	});

	it('costs a route into the first whole encode that bypasses the loop', async () => {
		const direct = 'sittir_x::read';
		const read = 'sittir_x::read_c_callback';
		const graph = [
			...GRAPH,
			...fn(0x2000, read, ['stp x29, x30, [sp, #-16]!'], [['bl', direct]]),
			...fn(0x2100, direct, ['stp x29, x30, [sp, #-16]!', 'sub sp, sp, #0x400'], [['bl', NAMES.a]])
		];
		const stack = encodeStack(await disassemble(linked(graph)), HEIGHTS);
		expect(stack.above.bytes).toBe(16 + 1040);
		expect(stack.above.steps.map((step) => step.fn)).toEqual([read, direct]);
	});

	it('refuses a function that leads to a whole encode when no napi callback leads to it', async () => {
		const graph = [...GRAPH, ...fn(0x2000, 'sittir_x::orphan', ['stp x29, x30, [sp, #-16]!'], [['bl', NAMES.a]])];
		await expect(disassemble(linked(graph)).then((dis) => encodeStack(dis, HEIGHTS))).rejects.toThrow(
			/no known caller and no napi callback leads to sittir_x::orphan/
		);
	});

	it('lists the indirect calls on a measured path it cannot resolve', async () => {
		const graph = GRAPH.flatMap((line) => (line.endsWith(`bl 0x0 <${NAMES.list}>`) ? [line, '    100a: \tblr x8'] : [line]));
		const stack = encodeStack(await disassemble(linked(graph)), HEIGHTS);
		expect(stack.unresolved).toEqual([{ fn: NAMES.a, offset: 0xa, ins: 'blr x8' }]);
	});

	it('classifies each indirect call the encode reaches off its measured paths, and names the ones no class covers', async () => {
		const panic = 'std::panicking::begin_panic_handler';
		const leaf = 'sittir_x::leaf';
		const graph = [
			...GRAPH.flatMap((line) =>
				line.endsWith(`<${NAMES.b}>:`) ? [line, `    1208: \tbl 0x0 <${panic}>`, `    120c: \tbl 0x0 <${leaf}>`] : [line]
			),
			...fn(0x2000, panic, ['stp x29, x30, [sp, #-16]!', 'blr x8'], []),
			...fn(0x2100, leaf, ['stp x29, x30, [sp, #-16]!', 'blr x9'], [])
		];
		const stack = encodeStack(await disassemble(linked(graph)), HEIGHTS);
		expect(stack.unresolved).toEqual([]);
		expect(stack.reached).toEqual([
			{ fn: leaf, offset: 4, ins: 'blr x9', class: undefined },
			{ fn: panic, offset: 4, ins: 'blr x8', class: DYNAMIC_CLASSES[0] }
		]);
	});

	it('holds a class only while the addon has nothing that refutes it', async () => {
		const drop = '<napi::bindgen_runtime::js_values::arraybuffer::Uint8Array as core::ops::drop::Drop>::drop';
		const setter = '<napi::bindgen_runtime::js_values::arraybuffer::Uint8Array>::with_external_data::<sittir_x::Notify>';
		const graph = [
			...GRAPH.flatMap((line) => (line.endsWith(`<${NAMES.b}>:`) ? [line, `    1208: \tbl 0x0 <${drop}>`] : [line])),
			...fn(0x2000, drop, ['stp x29, x30, [sp, #-16]!', 'blr x8'], [])
		];
		const kept = encodeStack(await disassemble(linked(graph)), HEIGHTS);
		expect(kept.reached.map((call) => call.class)).toEqual([DYNAMIC_CLASSES[1]]);
		expect(kept.refuted).toEqual([]);
		const refuted = encodeStack(await disassemble(linked([...graph, ...fn(0x2100, setter, ['ret'], [])])), HEIGHTS);
		expect(refuted.reached.map((call) => call.class)).toEqual([undefined]);
		expect(refuted.refuted).toEqual([{ class: DYNAMIC_CLASSES[1], by: setter }]);
	});

	it('counts an indirect tail call on a measured path as unread, and leaves a jump-table dispatch out', async () => {
		const graph = GRAPH.flatMap((line) =>
			line === '    1204: \tsub sp, sp, #0x10'
				? [
						line,
						'    1290: \tadr x11, 0x12a0 <x>',
						'    1294: \tldrb w10, [x9, x8]',
						'    1298: \tadd x10, x11, x10, lsl #2',
						'    129a: \tbr x10',
						'    129b: \tldr x8, [x0, #0x18]',
						'    129c: \tbr x8'
					]
				: [line]
		);
		const stack = encodeStack(await disassemble(linked(graph)), HEIGHTS);
		expect(stack.unresolved).toEqual([{ fn: NAMES.b, offset: 0x9c, ins: 'br x8' }]);
	});

	it('refuses a build whose names it cannot read', async () => {
		await expect(disassemble(linked(GRAPH)).then((dis) => encodeStack(dis, new Set()))).rejects.toThrow(/must name each/);
	});
});

describe('disassemble on arm64', () => {
	it.each(['blr', 'br'])('takes a TLS descriptor access through %s for the dynamic linker its relocation names', async (op) => {
		const listing = [
			'x.node:\tfile format elf64-littleaarch64',
			'',
			'Disassembly of section .text:',
			'',
			...fn(0x1000, 'sittir_x::f', ['adrp x0, 0x5000 <x>', 'ldr x1, [x0, #0x220]', 'add x0, x0, #0x220', `${op} x1`], [])
		];
		const relocated = gotSlots(['0000000000005220 R_AARCH64_TLSDESC        *ABS*']);
		const read = await disassemble(listing, { ...relocated, int32: () => undefined, threadLocal: () => false });
		expect(named(read, 'sittir_x::f').unresolved).toEqual([]);
		const unread = await disassemble(listing, image());
		expect(named(unread, 'sittir_x::f').unresolved.map((site) => site.ins)).toEqual([`${op} x1`]);
	});

	it.each(['blr', 'br'])('takes a Mach-O thread-local access through %s for the thunk its descriptor holds', async (op) => {
		const listing = [
			'x.node:\tfile format mach-o arm64',
			'',
			'Disassembly of section __TEXT,__text:',
			'',
			...fn(0x1000, 'sittir_x::f', ['adrp x0, 0x5000 <x>', 'add x0, x0, #0xc8', 'ldr x8, [x0]', `${op} x8`], [])
		];
		const tlv = { ...image(), threadLocal: (address: number) => address === 0x50c8 };
		expect(named(await disassemble(listing, tlv), 'sittir_x::f').unresolved).toEqual([]);
		expect(named(await disassemble(listing, image()), 'sittir_x::f').unresolved.map((site) => site.ins)).toEqual([`${op} x8`]);
	});
});

const LOCK = '<std::sys::sync::rwlock::queue::RwLock>::lock_contended';
const READ_LOCK = 'std::sys::sync::rwlock::queue::read_lock';
const WRITE_LOCK = 'std::sys::sync::rwlock::queue::write_lock';
const ARM_ELF = ['x.node:\tfile format elf64-littleaarch64', '', 'Disassembly of section .text:', ''];

describe('arm64 registers', () => {
	it('follows an address or a GOT slot a register holds along each path that keeps it, and leaves a signed branch unread', async () => {
		const dis = await disassemble(
			[
				...ARM_ELF,
				...fn(
					0x1000,
					'sittir_x::f',
					[
						'adrp x8, 0x2000 <x>',
						'add x8, x8, #0x100',
						'blr x8',
						'adrp x19, 0x3000 <x>',
						'ldr x19, [x19, #0x8]',
						`bl 0x2100 <${G}>`,
						'blr x19',
						'adrp x9, 0x3000 <x>',
						'ldr x9, [x9]',
						`bl 0x2100 <${G}>`,
						'blr x9',
						'blraaz x10'
					],
					[]
				),
				...fn(0x2100, G, [], [])
			],
			image()
		);
		const f = named(dis, 'sittir_x::f');
		expect(names(dis, f.calls)).toEqual([G]);
		expect(f.unresolved.map((site) => site.ins)).toEqual(['blr x9', 'blraaz x10']);
	});

	it('calls both functions a csel picks between, across calls and a loop', async () => {
		const dis = await disassemble(
			[
				...ARM_ELF,
				...fn(
					0x1000,
					LOCK,
					[
						'adrp x8, 0x2000 <x>',
						'add x8, x8, #0x100',
						'adrp x9, 0x2000 <x>',
						'add x9, x9, #0x200',
						'cmp w1, #0x0',
						'csel x22, x9, x8, ne',
						`bl 0x2300 <${G}>`,
						'blr x22',
						`cbnz w0, 0x1018 <${LOCK}+0x18>`
					],
					[]
				),
				...fn(0x2100, WRITE_LOCK, [], []),
				...fn(0x2200, READ_LOCK, [], []),
				...fn(0x2300, G, [], [])
			],
			image()
		);
		const lock = named(dis, LOCK);
		expect(names(dis, lock.calls).sort()).toEqual([G, READ_LOCK, WRITE_LOCK].sort());
		expect(lock.unresolved).toEqual([]);
		expect(lock.selected).toEqual([{ offset: 0x1c, ins: 'blr x22', targets: [WRITE_LOCK, READ_LOCK] }]);
	});
});

describe('dynamic classes', () => {
	const below = (callee: string, functions: readonly string[]): string[] => [
		...GRAPH.flatMap((line) => (line.endsWith(`<${NAMES.b}>:`) ? [line, `    1208: \tbl 0x2000 <${callee}>`] : [line])),
		...functions
	];

	it('takes the static unwinder for a class of its own', async () => {
		const graph = below('unwind_phase2', fn(0x2000, 'unwind_phase2', ['stp x29, x30, [sp, #-16]!', 'blr x8'], []));
		expect(encodeStack(await disassemble(linked(graph)), HEIGHTS).reached.map((call) => call.class)).toEqual([DYNAMIC_CLASSES[2]]);
	});

	it("takes a custom io::Error's payload drop for a class, and nothing else in its module", async () => {
		const owner = '<core::io::error::CustomOwner as core::ops::drop::Drop>::drop';
		const repr = '<core::io::error::repr_bitpacked::Repr as core::ops::drop::Drop>::drop';
		const graph = below(owner, [
			...fn(0x2000, owner, ['stp x29, x30, [sp, #-16]!', 'blr x8', `bl 0x2100 <${repr}>`], []),
			...fn(0x2100, repr, ['blr x9'], [])
		]);
		expect(encodeStack(await disassemble(linked(graph)), HEIGHTS).reached.map((call) => [call.fn, call.ins, call.class?.name])).toEqual([
			[owner, 'blr x8', "a custom io::Error's payload drop"],
			[repr, 'blr x9', undefined]
		]);
	});

	it('takes an outlined fragment for the class every function entering it falls in, and leaves it unread when they differ', async () => {
		const panic = 'std::panicking::begin_panic_handler';
		const fragment = '_OUTLINED_FUNCTION_7';
		const graph = below(panic, [
			...fn(0x2000, panic, ['stp x29, x30, [sp, #-16]!', `bl 0x2100 <${fragment}>`], []),
			...fn(0x2100, fragment, ['mov x0, x21', 'br x8'], [])
		]);
		expect(encodeStack(await disassemble(linked(graph)), HEIGHTS).reached).toEqual([
			{ fn: fragment, offset: 4, ins: 'br x8', class: DYNAMIC_CLASSES[0] }
		]);
		const shared = [...graph, ...fn(0x2200, 'sittir_x::leaf', [`bl 0x2100 <${fragment}>`], [])];
		expect(encodeStack(await disassemble(linked(shared)), HEIGHTS).reached).toEqual([
			{ fn: fragment, offset: 4, ins: 'br x8', class: undefined }
		]);
	});

	it('reads a call between two picked functions as a call to both, and lists it with their names', async () => {
		const graph = below(LOCK, [
			...fn(
				0x2000,
				LOCK,
				['adrp x8, 0x2000 <x>', 'add x8, x8, #0x100', 'adrp x9, 0x2000 <x>', 'add x9, x9, #0x200', 'csel x22, x9, x8, ne', 'blr x22'],
				[]
			),
			...fn(0x2100, WRITE_LOCK, [], []),
			...fn(0x2200, READ_LOCK, ['blr x8'], [])
		]);
		const stack = encodeStack(await disassemble(linked(graph)), HEIGHTS);
		expect(stack.selected).toEqual([{ fn: LOCK, offset: 0x14, ins: 'blr x22', targets: [WRITE_LOCK, READ_LOCK] }]);
		expect(stack.reached).toEqual([{ fn: READ_LOCK, offset: 0, ins: 'blr x8', class: undefined }]);
	});
});

const hex = (n: number): string => `0x${n.toString(16)}`;

function x86(start: number, name: string, body: readonly string[]): string[] {
	return [
		`${start.toString(16).padStart(16, '0')} <${name}>:`,
		...body.map((ins, at) => `  ${(start + 4 * at).toString(16)}:      \t${ins.replace(/@(\d+)/g, (_, k) => `${hex(start + 4 * Number(k))} <${name}+${hex(4 * Number(k))}>`)}`)
	];
}

const ELF = ['x.node:\tfile format elf64-x86-64', '', 'Disassembly of section .text:', ''];
const SLOTS = gotSlots([
	'0000000000003000 R_X86_64_RELATIVE        *ABS*+0x2100',
	'0000000000003008 R_X86_64_GLOB_DAT        memcpy'
]);
const image = (table: ReadonlyMap<number, number> = new Map()): Image => ({ ...SLOTS, int32: (address) => table.get(address), threadLocal: () => false });
const G = 'sittir_x::g';
const STAR = 'core::ptr::drop_glue::<*mut u8>';

describe('disassemble on x86-64', () => {
	it('follows a call through a GOT slot to the function its relocation names, and leaves an unrelocated slot unread', async () => {
		const dis = await disassemble(
			[
				...ELF,
				...x86(0x2000, 'sittir_x::f', [
					'callq *0x10(%rip) # 0x3000 <x>',
					'callq *0x10(%rip) # 0x3008 <x>',
					'callq *0x10(%rip) # 0x3010 <x>',
					`callq 0x2200 <${STAR}>`,
					'retq'
				]),
				...x86(0x2100, G, ['retq']),
				...x86(0x2200, STAR, ['retq'])
			],
			image()
		);
		const f = named(dis, 'sittir_x::f');
		expect(names(dis, f.calls).sort()).toEqual([STAR, G].sort());
		expect(f.unresolved.map((site) => site.offset)).toEqual([8]);
	});

	it('follows a slot held in a register along each path that keeps it', async () => {
		const dis = await disassemble(
			[
				...ELF,
				...x86(0x2000, 'sittir_x::f', [
					'movq 0x10(%rip), %rbx # 0x3000 <x>',
					'callq *%rbx',
					'testl %eax, %eax',
					'jne @6',
					'movq 0x28(%rsp), %rbx',
					'jmp @7',
					'callq *%rbx',
					'callq *%rbx',
					'retq'
				]),
				...x86(0x2100, G, ['retq'])
			],
			image()
		);
		const f = named(dis, 'sittir_x::f');
		expect(names(dis, f.calls)).toEqual([G]);
		expect(f.unresolved.map((site) => site.offset)).toEqual([0x1c]);
	});

	it('enters a jump table only at the targets the table holds', async () => {
		const listing = [
			...ELF,
			...x86(0x4000, 'sittir_x::t', [
				'leaq 0x1000(%rip), %rbx # 0x5000 <table>',
				'movq 0x10(%rip), %r13 # 0x3000 <x>',
				'movq (%rdi), %rax',
				'cmpq $0x1, %rax',
				'ja @12',
				'movslq (%rbx,%rax,4), %rax',
				'addq %rbx, %rax',
				'jmpq *%rax',
				'callq *%r13',
				'jmp @2',
				'callq *%r13',
				'jmp @2',
				'retq'
			]),
			...x86(0x2100, G, ['retq'])
		];
		const table = new Map([
			[0x5000, 0x4020 - 0x5000],
			[0x5004, 0x4028 - 0x5000]
		]);
		const tabled = await disassemble(listing, image(table));
		const read = named(tabled, 'sittir_x::t');
		expect(names(tabled, read.calls)).toEqual([G]);
		expect(read.unresolved).toEqual([]);
		expect(read.jumps.map((site) => site.ins)).toEqual(['jmpq *%rax']);
		const unread = named(await disassemble(listing, image()), 'sittir_x::t');
		expect(unread.unresolved.map((site) => site.offset)).toEqual([0x20, 0x28]);
	});

	describe('reads a function\'s last jump table past the entries a comparison states only when the comparison bounds the whole index', () => {
		const lastTable = (check: string, branch: string) => [
			...ELF,
			...x86(0x4000, 'sittir_x::t', [
				'leaq 0x1000(%rip), %rbx # 0x5000 <table>',
				'movq 0x10(%rip), %r13 # 0x3000 <x>',
				'movq (%rdi), %rax',
				check,
				branch,
				'movslq (%rbx,%rax,4), %rax',
				'addq %rbx, %rax',
				'jmpq *%rax',
				'callq *%r13',
				'jmp @2',
				'callq *%r13',
				'jmp @2',
				'retq',
				'callq *%r13',
				'retq'
			]),
			...x86(0x2100, G, ['retq'])
		];
		const table = new Map([
			[0x5000, 0x4020 - 0x5000],
			[0x5004, 0x4028 - 0x5000],
			[0x5008, 0x4034 - 0x5000]
		]);
		const unresolvedOf = async (listing: ReturnType<typeof lastTable>) => named(await disassemble(listing, image(table)), 'sittir_x::t').unresolved.map((site) => site.offset);

		it('bounds the table by a full-width comparison', async () => {
			expect(await unresolvedOf(lastTable('cmpq $0x1, %rax', 'ja @12'))).toEqual([0x34]);
		});

		it('keeps reading past a comparison of only the low byte, whose upper bits stay free', async () => {
			expect(await unresolvedOf(lastTable('cmpb $0x1, %al', 'ja @12'))).toEqual([]);
		});

		it('keeps reading when the branch lands on the load itself', async () => {
			expect(await unresolvedOf(lastTable('cmpq $0x1, %rax', 'ja @5'))).toEqual([]);
		});

		it('keeps reading past a comparison with a negative immediate, which the branch reads as unsigned', async () => {
			expect(await unresolvedOf(lastTable('cmpq $-1, %rax', 'ja @12'))).toEqual([]);
		});
	});

	it('ends a jump table where the next table the function reads begins', async () => {
		const listing = [
			...ELF,
			...x86(0x4000, 'sittir_x::t', [
				'leaq 0x1000(%rip), %rcx # 0x5000 <a>',
				'movq (%rdi), %rax',
				'movslq (%rcx,%rax,4), %rax',
				'addq %rcx, %rax',
				'jmpq *%rax',
				'jmp @7',
				'jmp @7',
				'leaq 0x1000(%rip), %rbx # 0x5008 <b>',
				'movq 0x10(%rip), %r12 # 0x3000 <x>',
				'movq (%rsi), %rax',
				'jmp @13',
				'callq *%r12',
				'jmp @9',
				'cmpq $0x1, %rax',
				'ja @20',
				'movslq (%rbx,%rax,4), %rax',
				'addq %rbx, %rax',
				'jmpq *%rax',
				'callq *%r12',
				'jmp @9',
				'retq'
			]),
			...x86(0x2100, G, ['retq'])
		];
		const tables = new Map([
			[0x5000, 0x4014 - 0x5000],
			[0x5004, 0x4018 - 0x5000],
			[0x5008, 0x402c - 0x5008],
			[0x500c, 0x4048 - 0x5008]
		]);
		const dis = await disassemble(listing, image(tables));
		const read = named(dis, 'sittir_x::t');
		expect(names(dis, read.calls)).toEqual([G]);
		expect(read.unresolved).toEqual([]);
	});

	it('follows a slot through a register copy, in a Mach-O listing too', async () => {
		const dis = await disassemble(
			[
				...ELF,
				...x86(0x2000, 'sittir_x::f', [
					'movq 0x10(%rip), %r15 ## 0x3000 <x>',
					'movq %r15, %r12',
					'movq (%rdi), %r15',
					'callq *%r12',
					'retq'
				]),
				...x86(0x2100, G, ['retq'])
			],
			image()
		);
		expect(names(dis, named(dis, 'sittir_x::f').calls)).toEqual([G]);
		expect(named(dis, 'sittir_x::f').unresolved).toEqual([]);
	});

	it('reads no code past a jump table the function holds inline', async () => {
		const dis = await disassemble(
			[
				...ELF,
				...x86(0x4000, 'sittir_x::t', [
					'leaq 0xc(%rip), %rcx ## 0x4014 <sittir_x::t+0x14>',
					'movslq (%rcx,%rax,4), %rax',
					'addq %rcx, %rax',
					'jmpq *%rax',
					'retq',
					'callq *-0x1(%rdi)'
				])
			],
			image()
		);
		expect(named(dis, 'sittir_x::t').unresolved).toEqual([]);
	});

	it.each(['callq', 'jmpq'])('takes a Mach-O thread-local access through %s for the thunk its descriptor holds', async (op) => {
		const listing = [...ELF, ...x86(0x2000, 'sittir_x::f', ['leaq 0x10(%rip), %rdi ## 0x50c8 <x>', `${op} *(%rdi)`, 'retq'])];
		const tlv = { ...image(), threadLocal: (address: number) => address === 0x50c8 };
		expect(named(await disassemble(listing, tlv), 'sittir_x::f').unresolved).toEqual([]);
		expect(named(await disassemble(listing, image()), 'sittir_x::f').unresolved.map((site) => site.ins)).toEqual([`${op} *(%rdi)`]);
	});

	it('reads an indirect tail call like a call: through a slot a register holds, or unread', async () => {
		const dis = await disassemble(
			[
				...ELF,
				...x86(0x2000, 'sittir_x::f', ['leaq 0x10(%rip), %rax # 0x3000 <x>', 'testl %esi, %esi', 'je @4', 'jmpq *(%rax)', 'jmpq *0x18(%rdx)']),
				...x86(0x2100, G, ['retq'])
			],
			image()
		);
		const f = named(dis, 'sittir_x::f');
		expect(names(dis, f.tails)).toEqual([G]);
		expect(f.unresolved.map((site) => site.ins)).toEqual(['jmpq *0x18(%rdx)']);
	});

	it('calls both functions a cmov picks between', async () => {
		const dis = await disassemble(
			[
				...ELF,
				...x86(0x2000, LOCK, [
					'leaq 0xf9(%rip), %rax ## 0x2100 <x>',
					'leaq 0x1f5(%rip), %r13 ## 0x2200 <x>',
					'testl %esi, %esi',
					'cmovneq %rax, %r13',
					'callq *%r13',
					'retq'
				]),
				...x86(0x2100, WRITE_LOCK, ['retq']),
				...x86(0x2200, READ_LOCK, ['retq'])
			],
			image()
		);
		const lock = named(dis, LOCK);
		expect(names(dis, lock.calls).sort()).toEqual([READ_LOCK, WRITE_LOCK].sort());
		expect(lock.selected).toEqual([{ offset: 0x10, ins: 'callq *%r13', targets: [WRITE_LOCK, READ_LOCK] }]);
	});

	it('follows a call through memory at an address a register holds, or at the pointer the slot it holds was relocated to', async () => {
		const stub = 'napi_sys::functions::napi1::NAPI::napi_get_boolean';
		const table: Image = {
			internal: new Map([
				[0x3000, 0x2100],
				[0x3010, 0x4000],
				[0x4008, 0x2300],
				[0x4010, 0x2100]
			]),
			symbols: new Map([[0x3008, 'memcpy']]),
			tls: new Set(),
			int32: () => undefined,
			threadLocal: () => false
		};
		const dis = await disassemble(
			[
				...ELF,
				...x86(0x2000, 'sittir_x::f', [
					'leaq 0x10(%rip), %rax # 0x3000 <x>',
					'callq *(%rax)',
					'leaq 0x10(%rip), %rax # 0x3000 <x>',
					'callq *0x8(%rax)',
					'movq 0x10(%rip), %r9 # 0x3010 <x>',
					'callq *0x8(%r9)',
					'movq 0x10(%rip), %r9 # 0x3010 <x>',
					'callq *0x10(%r9)',
					'callq *0x18(%rdx)',
					'retq'
				]),
				...x86(0x2100, G, ['retq']),
				...x86(0x2300, stub, ['retq'])
			],
			table
		);
		const f = named(dis, 'sittir_x::f');
		expect(names(dis, f.calls)).toEqual([G]);
		expect(f.unresolved.map((site) => site.ins)).toEqual(['callq *0x18(%rdx)']);
	});

	it('keeps a slot in a register the Microsoft x64 convention preserves across a call, in a COFF listing only', async () => {
		const listing = (format: string): string[] => [
			`x.node:\tfile format ${format}`,
			'',
			'Disassembly of section .text:',
			'',
			...x86(0x2000, 'sittir_x::f', ['movq 0x10(%rip), %rdi # 0x3000 <x>', `callq 0x2200 <${STAR}>`, 'callq *%rdi', 'retq']),
			...x86(0x2100, G, ['retq']),
			...x86(0x2200, STAR, ['retq'])
		];
		const coff = await disassemble(listing('coff-x86-64'), image());
		expect(names(coff, named(coff, 'sittir_x::f').calls).sort()).toEqual([G, STAR].sort());
		expect(named(coff, 'sittir_x::f').unresolved).toEqual([]);
		const elf = await disassemble(listing('elf64-x86-64'), image());
		expect(named(elf, 'sittir_x::f').unresolved.map((site) => site.ins)).toEqual(['callq *%rdi']);
	});

	it('takes each frame from the unwind info the image carries, and a function it has no entry for as a leaf', async () => {
		const dis = await disassemble(
			[...ELF, ...x86(0x2000, 'sittir_x::f', ['pushq %rbx', 'subq $0x20, %rsp', `callq 0x2100 <${G}>`, 'retq']), ...x86(0x2100, G, ['retq'])],
			{ ...image(), frames: new Map([[0x2000, 0x50]]) }
		);
		expect([named(dis, 'sittir_x::f').frame, named(dis, G).frame]).toEqual([0x50, 8]);
	});

	it('takes a PLT stub for the external function it binds', async () => {
		const dis = await disassemble(
			[
				...ELF,
				...x86(0x2000, 'sittir_x::f', ['callq 0x6010 <foo@plt>', 'retq']),
				'',
				'Disassembly of section .plt:',
				'',
				...x86(0x6000, '.plt', ['pushq 0x8(%rip) # 0x7008 <_GLOBAL_OFFSET_TABLE_+0x8>', 'jmpq *0x10(%rip) # 0x7010 <_GLOBAL_OFFSET_TABLE_+0x10>']),
				...x86(0x6010, 'foo@plt', ['jmpq *0x10(%rip) # 0x7018 <_GLOBAL_OFFSET_TABLE_+0x18>', 'pushq $0x0', 'jmp 0x6000 <.plt>'])
			],
			image()
		);
		expect([...dis.functions.values()].map((f) => f.name)).toEqual(['sittir_x::f']);
		expect(named(dis, 'sittir_x::f').unresolved).toEqual([]);
	});
});

describe('imageOf', () => {
	it('reads a signed word at an address inside a loaded section', () => {
		const bytes = Buffer.alloc(0x100);
		bytes.writeUInt32LE(0x464c457f, 0);
		bytes[4] = 2;
		bytes[5] = 1;
		bytes.writeBigUInt64LE(0x80n, 0x28);
		bytes.writeUInt16LE(0x40, 0x3a);
		bytes.writeUInt16LE(2, 0x3c);
		const section = 0x80 + 0x40;
		bytes.writeUInt32LE(1, section + 4);
		bytes.writeBigUInt64LE(0x1000n, section + 0x10);
		bytes.writeBigUInt64LE(0x40n, section + 0x18);
		bytes.writeBigUInt64LE(8n, section + 0x20);
		bytes.writeInt32LE(-0xfe0, 0x40);
		bytes.writeInt32LE(7, 0x44);
		const { int32 } = imageOf(bytes);
		expect([int32(0x1000), int32(0x1004), int32(0x1008), int32(0xfff)]).toEqual([-0xfe0, 7, undefined, undefined]);
		expect(imageOf(Buffer.from('MZ not an ELF image')).int32(0x1000)).toBeUndefined();
	});

	it('reads a Mach-O image by its segments, and knows its thread-local descriptors', () => {
		const bytes = Buffer.alloc(0x400);
		bytes.writeUInt32LE(0xfeedfacf, 0);
		bytes.writeUInt32LE(1, 16);
		const command = 32;
		bytes.writeUInt32LE(0x19, command);
		bytes.writeUInt32LE(72 + 2 * 80, command + 4);
		bytes.writeUInt32LE(2, command + 64);
		const section = (at: number, name: string, address: number, size: number, offset: number) => {
			const header = command + 72 + at * 80;
			bytes.write(name, header, 'latin1');
			bytes.writeBigUInt64LE(BigInt(address), header + 32);
			bytes.writeBigUInt64LE(BigInt(size), header + 40);
			bytes.writeUInt32LE(offset, header + 48);
		};
		section(0, '__text', 0x1000, 8, 0x200);
		section(1, '__thread_vars', 0x2000, 0x18, 0x300);
		bytes.writeInt32LE(-12, 0x204);
		const read = imageOf(bytes);
		expect([read.int32(0x1004), read.int32(0x1008)]).toEqual([-12, undefined]);
		expect([read.threadLocal(0x2008), read.threadLocal(0x1004), read.threadLocal(0x2018)]).toEqual([true, false, false]);
	});

	it('sizes each ELF function by its symbol, leaving out a symbol sized 0 and one that is no function', () => {
		const symtab = 0x100;
		const bytes = Buffer.alloc(symtab + 6 * 24);
		bytes.writeUInt32LE(0x464c457f, 0);
		bytes[4] = 2;
		bytes[5] = 1;
		bytes.writeBigUInt64LE(0x40n, 0x28);
		bytes.writeUInt16LE(0x40, 0x3a);
		bytes.writeUInt16LE(1, 0x3c);
		bytes.writeUInt32LE(2, 0x40 + 4);
		bytes.writeBigUInt64LE(BigInt(symtab), 0x40 + 0x18);
		bytes.writeBigUInt64LE(5n * 24n, 0x40 + 0x20);
		bytes.writeBigUInt64LE(24n, 0x40 + 0x38);
		const symbol = (at: number, info: number, address: number, size: number) => {
			const entry = symtab + at * 24;
			bytes[entry + 4] = info;
			bytes.writeBigUInt64LE(BigInt(address), entry + 8);
			bytes.writeBigUInt64LE(BigInt(size), entry + 16);
		};
		symbol(0, 0x02, 0x1000, 0x5c);
		symbol(1, 0x12, 0x1000, 0x5c);
		symbol(2, 0x02, 0x2000, 0);
		symbol(3, 0x00, 0x3000, 0);
		symbol(4, 0x01, 0x4000, 8);
		symbol(5, 0x02, 0x5000, 0x10);
		expect([...imageOf(bytes).extents!]).toEqual([[0x1000, 0x5c]]);
		expect(imageOf(peImage()).extents).toBeUndefined();
	});
});

describe('function extents', () => {
	const STEP = '<sittir_x::Node as sittir_core::codec::wire::Steps<sittir_x::TriviaNode>>::decode_step';
	const NEXT = '<sittir_x::Node as sittir_core::codec::wire::Steps<sittir_x::TriviaNode>>::encode_step';
	const STUB = 'e843419@0005_000085da_344';
	const at = (address: number, ins: string): string => `    ${address.toString(16)}: \t${ins}`;
	const label = (address: number, name: string): string => `${address.toString(16).padStart(16, '0')} <${name}>:`;
	const erratum = [
		...ARM_ELF,
		label(0x1000, STEP),
		at(0x1000, 'stp x29, x30, [sp, #-0x10]!'),
		at(0x1004, `b 0x1100 <${STUB}>`),
		at(0x1008, 'mov w8, #0x2'),
		at(0x100c, 'bl 0x2000 <core::panicking::panic_in_cleanup>'),
		at(0x1010, `b 0x2100 <${NEXT}>`),
		label(0x1100, STUB),
		at(0x1100, 'ldr q0, [x8, #0x5b0]'),
		at(0x1104, `b 0x1008 <${STEP}+0x8>`),
		at(0x1108, 'udf #0x0'),
		label(0x2000, 'core::panicking::panic_in_cleanup'),
		at(0x2000, 'ret'),
		label(0x2100, NEXT),
		at(0x2100, 'ret')
	];
	const sized = new Map([
		[0x1000, 0x10],
		[0x1100, 8],
		[0x2000, 4],
		[0x2100, 4]
	]);

	it('ends an ELF function where its symbol ends, so a linker stub block after it adds no tail call', async () => {
		const dis = await disassemble(erratum, { ...image(), extents: sized });
		expect(names(dis, named(dis, STEP).tails)).toEqual([STUB]);
		expect(names(dis, named(dis, STEP).calls)).toEqual(['core::panicking::panic_in_cleanup']);
		expect(named(dis, STEP).unresolved).toEqual([]);
		expect(named(dis, STUB)).toMatchObject({ frame: 0, calls: new Set(), tails: new Set(), unresolved: [] });
		const unsized = await disassemble(erratum, image());
		expect(names(unsized, named(unsized, STEP).tails).sort()).toEqual([NEXT, STUB].sort());
	});

	it('extends a function its symbol table gives no size to the next label', async () => {
		const dis = await disassemble(erratum, { ...image(), extents: new Map([...sized].filter(([start]) => start !== 0x1000)) });
		expect(names(dis, named(dis, STEP).tails).sort()).toEqual([NEXT, STUB].sort());
	});

	it.each(['b', 'bl', 'cbz x0,'])('reads a %s into code that no function owns as unread', async (op) => {
		const dis = await disassemble(
			[...erratum, label(0x3000, 'sittir_x::f'), at(0x3000, `${op} 0x1010 <${STEP}+0x10>`), at(0x3004, 'ret')],
			{ ...image(), extents: new Map([...sized, [0x3000, 8]]) }
		);
		const f = named(dis, 'sittir_x::f');
		expect(f.unresolved.map((site) => site.ins)).toEqual([`${op} 0x1010 <${STEP}+0x10>`]);
		expect([...f.calls, ...f.tails]).toEqual([]);
	});
});

const PE_BASE = 0x180000000;
const PE_SECTION = 0x1000;
const PE_RAW = 0x200;

function peImage(): Buffer {
	const bytes = Buffer.alloc(PE_RAW + 0x600);
	const at = (rva: number): number => PE_RAW + rva - PE_SECTION;
	bytes.writeUInt16LE(0x5a4d, 0);
	bytes.writeUInt32LE(0x40, 0x3c);
	bytes.writeUInt32LE(0x4550, 0x40);
	const coff = 0x44;
	bytes.writeUInt16LE(0x8664, coff);
	bytes.writeUInt16LE(1, coff + 2);
	bytes.writeUInt16LE(240, coff + 16);
	const optional = coff + 20;
	bytes.writeUInt16LE(0x20b, optional);
	bytes.writeBigUInt64LE(BigInt(PE_BASE), optional + 24);
	bytes.writeUInt32LE(16, optional + 108);
	for (const [index, rva, size] of [
		[1, 0x1000, 40],
		[3, 0x1400, 24],
		[5, 0x1300, 16]
	] as const) {
		bytes.writeUInt32LE(rva, optional + 112 + 8 * index);
		bytes.writeUInt32LE(size, optional + 116 + 8 * index);
	}
	const header = optional + 240;
	bytes.write('.data', header, 'latin1');
	bytes.writeUInt32LE(0x600, header + 8);
	bytes.writeUInt32LE(PE_SECTION, header + 12);
	bytes.writeUInt32LE(0x600, header + 16);
	bytes.writeUInt32LE(PE_RAW, header + 20);
	bytes.writeUInt32LE(0x1100, at(0x1000));
	bytes.writeUInt32LE(0x1200, at(0x1000) + 12);
	bytes.writeUInt32LE(0x1180, at(0x1000) + 16);
	for (const table of [0x1100, 0x1180]) {
		bytes.writeBigUInt64LE(0x1220n, at(table));
		bytes.writeBigUInt64LE((1n << 63n) | 7n, at(table) + 8);
	}
	bytes.write('KERNEL32.dll\0', at(0x1200), 'latin1');
	bytes.write('WriteFile\0', at(0x1222), 'latin1');
	bytes.writeUInt32LE(0x1000, at(0x1300));
	bytes.writeUInt32LE(16, at(0x1300) + 4);
	[0xa180, 0xa388, 0xa390, 0].forEach((entry, n) => bytes.writeUInt16LE(entry, at(0x1300) + 8 + 2 * n));
	bytes.writeBigUInt64LE(BigInt(PE_BASE + 0x5000), at(0x1388));
	bytes.writeBigUInt64LE(BigInt(PE_BASE + 0x1500), at(0x1390));
	for (const [n, begin, info] of [
		[0, 0x5000, 0x1440],
		[1, 0x5100, 0x1480]
	] as const) {
		bytes.writeUInt32LE(begin, at(0x1400) + 12 * n);
		bytes.writeUInt32LE(begin + 0x80, at(0x1400) + 12 * n + 4);
		bytes.writeUInt32LE(info, at(0x1400) + 12 * n + 8);
	}
	Buffer.from([0x01, 0x10, 5, 0, 0x0c, 0x68, 2, 0, 0x08, 0x42, 0x04, 0x30, 0x02, 0x50]).copy(bytes, at(0x1440));
	Buffer.from([0x21, 0x10, 3, 0, 0x10, 0x11, 0x00, 0x20, 0, 0, 0, 0]).copy(bytes, at(0x1480));
	bytes.writeUInt32LE(0x5000, at(0x148c));
	bytes.writeUInt32LE(0x5080, at(0x1490));
	bytes.writeUInt32LE(0x1440, at(0x1494));
	return bytes;
}

describe('PE images', () => {
	it('names each import slot and takes every other relocated slot for the pointer it holds', () => {
		const slots = peSlots(peImage());
		expect([...slots.symbols]).toEqual([
			[PE_BASE + 0x1180, 'WriteFile'],
			[PE_BASE + 0x1188, 'KERNEL32.dll#7']
		]);
		expect([...slots.internal]).toEqual([
			[PE_BASE + 0x1388, PE_BASE + 0x5000],
			[PE_BASE + 0x1390, PE_BASE + 0x1500]
		]);
	});

	it('sums each function frame from its unwind codes, following a chained entry', () => {
		const { frames, int32 } = imageOf(peImage());
		expect([...frames!]).toEqual([
			[PE_BASE + 0x5000, 8 + 8 + 8 + 40],
			[PE_BASE + 0x5100, 8 + 0x2000 + 8 + 8 + 40]
		]);
		expect([int32(PE_BASE + 0x1304), int32(PE_BASE + 0x1600)]).toEqual([16, undefined]);
	});

	it('appends a symbol table of the functions the linker map names', () => {
		const bytes = peImage();
		const long = '_RNvCs1_6sittir12long_name_fn';
		const map = [
			' 0000:00000000       ___safe_se_handler_count   0000000000000000     <absolute>',
			` 0001:00000010       ${long} 0000000180001010 f   sittir.o`,
			' 0001:00000020       short                      0000000180001020 f i sittir.o',
			' 0002:00000000       _RNvCs1_6sittir4DATA       0000000180002000     sittir.o'
		].join('\r\n');
		const named = namedCopy(bytes, map);
		const coff = 0x44;
		expect([named.readUInt32LE(coff + 8), named.readUInt32LE(coff + 12)]).toEqual([bytes.length, 2]);
		const record = (n: number) => named.subarray(bytes.length + 18 * n, bytes.length + 18 * (n + 1));
		const [first, second] = [record(0), record(1)];
		expect([first.readUInt32LE(0), first.readUInt32LE(4), first.readUInt32LE(8), first.readInt16LE(12), first.readUInt16LE(14), first[16]]).toEqual([0, 4, 0x10, 1, 0x20, 2]);
		expect([second.toString('latin1', 0, 8), second.readUInt32LE(8)]).toEqual(['short\0\0\0', 0x20]);
		const strings = bytes.length + 36;
		expect(named.readUInt32LE(strings)).toBe(4 + long.length + 1);
		expect(named.toString('latin1', strings + 4, strings + 4 + long.length)).toBe(long);
		expect(named.subarray(0, bytes.length).equals(Buffer.concat([bytes.subarray(0, coff + 8), named.subarray(coff + 8, coff + 16), bytes.subarray(coff + 16)]))).toBe(true);
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
