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
	type Image
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

const HEIGHTS = new Set(['ANode', 'BNode', 'CommentNode']);

describe('encodeStack', () => {
	it('costs a level apart from the trivia trip and the frames from the callback to the first whole encode', async () => {
		const stack = encodeStack(await disassemble(GRAPH), HEIGHTS);
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
		const stack = encodeStack(await disassemble(graph), HEIGHTS);
		expect(stack.above.bytes).toBe(16 + 1040);
		expect(stack.above.steps.map((step) => step.fn)).toEqual([read, direct]);
	});

	it('refuses a function that leads to a whole encode when no napi callback leads to it', async () => {
		const graph = [...GRAPH, ...fn(0x2000, 'sittir_x::orphan', ['stp x29, x30, [sp, #-16]!'], [['bl', NAMES.a]])];
		await expect(disassemble(graph).then((dis) => encodeStack(dis, HEIGHTS))).rejects.toThrow(
			/no known caller and no napi callback leads to sittir_x::orphan/
		);
	});

	it('lists the indirect calls on a measured path it cannot resolve', async () => {
		const graph = GRAPH.flatMap((line) => (line.endsWith(`bl 0x0 <${NAMES.list}>`) ? [line, '    100a: \tblr x8'] : [line]));
		const stack = encodeStack(await disassemble(graph), HEIGHTS);
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
		const stack = encodeStack(await disassemble(graph), HEIGHTS);
		expect(stack.unresolved).toEqual([]);
		expect(stack.reached).toEqual([
			{ fn: leaf, offset: 4, ins: 'blr x9', class: undefined },
			{ fn: panic, offset: 4, ins: 'blr x8', class: DYNAMIC_CLASSES[0] }
		]);
	});

	it('holds a class only while the addon has nothing that refutes it', async () => {
		const drop = '<napi::bindgen_runtime::js_values::arraybuffer::Uint32Array as core::ops::drop::Drop>::drop';
		const setter = '<napi::bindgen_runtime::js_values::arraybuffer::Uint32Array>::with_external_data::<sittir_x::Notify>';
		const graph = [
			...GRAPH.flatMap((line) => (line.endsWith(`<${NAMES.b}>:`) ? [line, `    1208: \tbl 0x0 <${drop}>`] : [line])),
			...fn(0x2000, drop, ['stp x29, x30, [sp, #-16]!', 'blr x8'], [])
		];
		const kept = encodeStack(await disassemble(graph), HEIGHTS);
		expect(kept.reached.map((call) => call.class)).toEqual([DYNAMIC_CLASSES[1]]);
		expect(kept.refuted).toEqual([]);
		const refuted = encodeStack(await disassemble([...graph, ...fn(0x2100, setter, ['ret'], [])]), HEIGHTS);
		expect(refuted.reached.map((call) => call.class)).toEqual([undefined]);
		expect(refuted.refuted).toEqual([{ class: DYNAMIC_CLASSES[1], by: setter }]);
	});

	it('refuses a build whose names it cannot read', async () => {
		await expect(disassemble(GRAPH).then((dis) => encodeStack(dis, new Set()))).rejects.toThrow(/must name each/);
	});
});

describe('disassemble on arm64', () => {
	it('takes a TLS descriptor call for the dynamic linker its relocation names', async () => {
		const listing = [
			'x.node:\tfile format elf64-littleaarch64',
			'',
			'Disassembly of section .text:',
			'',
			...fn(0x1000, 'sittir_x::f', ['adrp x0, 0x5000 <x>', 'ldr x1, [x0, #0x220]', 'add x0, x0, #0x220', 'blr x1'], [])
		];
		const relocated = gotSlots(['0000000000005220 R_AARCH64_TLSDESC        *ABS*']);
		const read = await disassemble(listing, { ...relocated, int32: () => undefined, threadLocal: () => false });
		expect(read.functions.get('sittir_x::f')!.unresolved).toEqual([]);
		const unread = await disassemble(listing, image());
		expect(unread.functions.get('sittir_x::f')!.unresolved.map((site) => site.ins)).toEqual(['blr x1']);
	});

	it('takes a Mach-O thread-local access for the thunk its descriptor holds', async () => {
		const listing = [
			'x.node:\tfile format mach-o arm64',
			'',
			'Disassembly of section __TEXT,__text:',
			'',
			...fn(0x1000, 'sittir_x::f', ['adrp x0, 0x5000 <x>', 'add x0, x0, #0xc8', 'ldr x8, [x0]', 'blr x8'], [])
		];
		const tlv = { ...image(), threadLocal: (address: number) => address === 0x50c8 };
		expect((await disassemble(listing, tlv)).functions.get('sittir_x::f')!.unresolved).toEqual([]);
		expect((await disassemble(listing, image())).functions.get('sittir_x::f')!.unresolved.map((site) => site.ins)).toEqual(['blr x8']);
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
		const f = dis.functions.get('sittir_x::f')!;
		expect([...f.calls]).toEqual([G]);
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
		const lock = dis.functions.get(LOCK)!;
		expect([...lock.calls].sort()).toEqual([G, READ_LOCK, WRITE_LOCK].sort());
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
		expect(encodeStack(await disassemble(graph), HEIGHTS).reached.map((call) => call.class)).toEqual([DYNAMIC_CLASSES[2]]);
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
		const stack = encodeStack(await disassemble(graph), HEIGHTS);
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
		const f = dis.functions.get('sittir_x::f')!;
		expect([...f.calls].sort()).toEqual([STAR, G].sort());
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
		const f = dis.functions.get('sittir_x::f')!;
		expect([...f.calls]).toEqual([G]);
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
		const read = (await disassemble(listing, image(table))).functions.get('sittir_x::t')!;
		expect([...read.calls]).toEqual([G]);
		expect(read.unresolved).toEqual([]);
		expect(read.jumps.map((site) => site.ins)).toEqual(['jmpq *%rax']);
		const unread = (await disassemble(listing, image())).functions.get('sittir_x::t')!;
		expect(unread.unresolved.map((site) => site.offset)).toEqual([0x20, 0x28]);
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
		expect([...dis.functions.get('sittir_x::f')!.calls]).toEqual([G]);
		expect(dis.functions.get('sittir_x::f')!.unresolved).toEqual([]);
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
		expect(dis.functions.get('sittir_x::t')!.unresolved).toEqual([]);
	});

	it('takes a Mach-O thread-local access for the thunk its descriptor holds', async () => {
		const listing = [...ELF, ...x86(0x2000, 'sittir_x::f', ['leaq 0x10(%rip), %rdi ## 0x50c8 <x>', 'callq *(%rdi)', 'retq'])];
		const tlv = { ...image(), threadLocal: (address: number) => address === 0x50c8 };
		expect((await disassemble(listing, tlv)).functions.get('sittir_x::f')!.unresolved).toEqual([]);
		expect((await disassemble(listing, image())).functions.get('sittir_x::f')!.unresolved.map((site) => site.ins)).toEqual(['callq *(%rdi)']);
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
		const lock = dis.functions.get(LOCK)!;
		expect([...lock.calls].sort()).toEqual([READ_LOCK, WRITE_LOCK].sort());
		expect(lock.selected).toEqual([{ offset: 0x10, ins: 'callq *%r13', targets: [WRITE_LOCK, READ_LOCK] }]);
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
		expect([...dis.functions.keys()]).toEqual(['sittir_x::f']);
		expect(dis.functions.get('sittir_x::f')!.unresolved).toEqual([]);
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
