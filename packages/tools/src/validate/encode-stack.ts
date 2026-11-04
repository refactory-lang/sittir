import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { createInterface } from 'node:readline';
import {
	REPO_ROOT,
	assertGrammar,
	nativeBinaryName,
	nativeBindingDir,
	nativeCrateDir,
	stableGrammars,
	type GrammarName
} from '@sittir/codegen/grammars';
import { load, type CodegenSurface } from '../codegen-surface.ts';

export interface EncodeStackOptions {
	readonly grammars?: readonly string[];
	readonly addons?: readonly string[];
	readonly objdump?: string;
	readonly paths?: boolean;
	readonly json?: boolean;
}

export type Arch = 'arm64' | 'x86_64';

export interface Unresolved {
	readonly offset: number;
	readonly ins: string;
}

export interface Disassembled {
	readonly prologue: readonly string[];
	readonly calls: ReadonlySet<string>;
	readonly tails: ReadonlySet<string>;
	readonly unresolved: readonly Unresolved[];
	readonly jumps: readonly Unresolved[];
}

export interface Slots {
	readonly internal: ReadonlyMap<number, number>;
	readonly symbols: ReadonlyMap<number, string>;
	readonly tls: ReadonlySet<number>;
}

export interface BinaryImage {
	readonly int32: (address: number) => number | undefined;
	readonly threadLocal: (address: number) => boolean;
}

export interface Image extends Slots, BinaryImage {}

export interface Disassembly {
	readonly arch: Arch;
	readonly functions: ReadonlyMap<string, Disassembled>;
}

export interface StackStep {
	readonly fn: string;
	readonly bytes: number;
	readonly tail: boolean;
}

export interface StackPath {
	readonly bytes: number;
	readonly steps: readonly StackStep[];
	readonly to: string | undefined;
}

export interface UnresolvedCall extends Unresolved {
	readonly fn: string;
}

export interface DynamicClass {
	readonly name: string;
	readonly reason: string;
	readonly within: RegExp;
	readonly refutedBy?: RegExp;
}

export interface Refuted {
	readonly class: DynamicClass;
	readonly by: string;
}

export interface ReachedCall extends UnresolvedCall {
	readonly class: DynamicClass | undefined;
}

export interface EncodeStack {
	readonly level: StackPath;
	readonly above: StackPath;
	readonly trivia: StackPath;
	readonly oneTime: number;
	readonly unresolved: readonly UnresolvedCall[];
	readonly reached: readonly ReachedCall[];
	readonly refuted: readonly Refuted[];
}

export interface CodecBounds {
	readonly limit: number;
	readonly budget: number;
}

export interface AddonStack {
	readonly grammar: GrammarName;
	readonly addon: string;
	readonly stack: EncodeStack;
	readonly largestLimit: number;
	readonly fits: boolean;
}

const CODEC = join(REPO_ROOT, 'rust/crates/sittir-core/src/codec.rs');
const PROLOGUE_LENGTH = 40;
const HASH = String.raw`(?:::h[0-9a-f]{16})?$`;
const WHOLE = new RegExp(
	String.raw`^<(?:\w+::)*render::node::(\w+) as sittir_core::codec::\w+::Codec<.*>>::encode_whole${HASH}`
);
const LOOP = new RegExp(String.raw`::codec::wire::run_encode(?:::<.*>)?${HASH}`);
const CALLBACK = new RegExp(String.raw`::\w+_c_callback${HASH}`);
const TRIVIA = new RegExp(
	String.raw`^<(?:\w+::)*Vec<sittir_core::trivia::TriviaEntry<.*> as napi::bindgen_runtime::js_values::ToNapiValue>::to_napi_value${HASH}`
);
const PROBE = /chkstk|probestack/;
const CALL_OPS = new Set(['bl', 'call', 'callq']);
const TAIL_OPS = /^(?:b|b\.\w+|cbn?z|tbn?z|jmpq?|j[a-z]{1,3})$/;
const UNCONDITIONAL = new Set(['b', 'jmp', 'jmpq', 'ret', 'retq']);
const OFFSET = /\+0x[0-9a-f]+$/;
const NUMBER = String.raw`(-?(?:0x[0-9a-f]+|\d+))`;
const PAGE = 4096;

function imm(text: string): number {
	const negative = text.startsWith('-');
	const digits = negative ? text.slice(1) : text;
	const value = digits.startsWith('0x') ? Number.parseInt(digits.slice(2), 16) : Number.parseInt(digits, 10);
	return negative ? -value : value;
}

interface Prologue {
	bytes: number;
	scratch: number;
	probe: number | undefined;
	probeBase: boolean;
}

const pages = (value: number, shifted: string | undefined): number => value * (shifted ? PAGE : 1);

function allocate(state: Prologue, value: number): void {
	if (state.probe === undefined || value !== PAGE) state.bytes += value;
}

type PrologueRule = readonly [RegExp, (m: RegExpExecArray, state: Prologue) => void];

const PROLOGUE_RULES: readonly PrologueRule[] = [
	[
		new RegExp(String.raw`^st(?:p \w+,|r) \w+, \[sp, #${NUMBER}\]!$`),
		(m, state) => {
			state.bytes -= imm(m[1]!);
		}
	],
	[
		new RegExp(String.raw`^sub sp, sp, #${NUMBER}(, lsl #12)?$`),
		(m, state) => allocate(state, pages(imm(m[1]!), m[2]))
	],
	[
		new RegExp(String.raw`^mov (?:x9|x16|x17), #${NUMBER}$`),
		(m, state) => {
			state.scratch = imm(m[1]!);
		}
	],
	[
		new RegExp(String.raw`^movk (?:x9|x16|x17), #${NUMBER}, lsl #(\d+)$`),
		(m, state) => {
			state.scratch += imm(m[1]!) * 2 ** Number(m[2]);
		}
	],
	[
		/^sub sp, sp, (?:x9|x16|x17)$/,
		(_, state) => {
			state.bytes += state.scratch;
		}
	],
	[
		new RegExp(String.raw`^sub (?:x9|x16|x17), sp, #${NUMBER}(, lsl #12)?$`),
		(m, state) => {
			state.probe = pages(imm(m[1]!), m[2]);
		}
	],
	[
		/^pushq? %?\w+$/,
		(_, state) => {
			state.bytes += 8;
		}
	],
	[
		new RegExp(String.raw`^(?:subq? \$${NUMBER}, %rsp|sub rsp, ${NUMBER})$`),
		(m, state) => allocate(state, imm(m[1] ?? m[2]!))
	],
	[
		new RegExp(String.raw`^movl? \$${NUMBER}, %[er]ax$`),
		(m, state) => {
			state.scratch = imm(m[1]!);
		}
	],
	[
		/^subq? %rax, %rsp$/,
		(_, state) => {
			state.bytes += state.scratch;
		}
	],
	[
		/^movq? %rsp, %r11$/,
		(_, state) => {
			state.probeBase = true;
		}
	],
	[
		new RegExp(String.raw`^subq? \$${NUMBER}, %r11$`),
		(m, state) => {
			if (state.probeBase) state.probe = imm(m[1]!);
		}
	]
];

export function frameBytes(prologue: readonly string[], arch: Arch): number {
	const state: Prologue = { bytes: 0, scratch: 0, probe: undefined, probeBase: false };
	for (const raw of prologue) {
		const ins = raw.split('//')[0]!.trim();
		const rule = PROLOGUE_RULES.find(([pattern]) => pattern.test(ins));
		if (rule) {
			rule[1](rule[0].exec(ins)!, state);
			continue;
		}
		const op = ins.split(' ', 1)[0]!;
		if (state.probe !== undefined && TAIL_OPS.test(op) && !UNCONDITIONAL.has(op)) {
			state.bytes += state.probe;
			state.probe = undefined;
		} else if ((UNCONDITIONAL.has(op) || CALL_OPS.has(op)) && !PROBE.test(ins) && state.bytes > 0) break;
	}
	return state.bytes + (arch === 'x86_64' ? 8 : 0);
}

const HEADER = /^([0-9a-f]+) <(.*)>:$/;
const FORMAT = /file format (.+)$/;
const SECTION = /^Disassembly of section (\S+):$/;
const STUBS = /^\.plt/;
const PREFIX = /^(?:notrack|bnd) /;
const RIP_BRANCH = /^(callq?|jmpq?) \*-?0x[0-9a-f]+\(%rip\) ##? 0x([0-9a-f]+)\b/;
const RIP_LOAD = /^movq? -?0x[0-9a-f]+\(%rip\), %(\w+) ##? 0x([0-9a-f]+)\b/;
const REG_BRANCH = /^(callq?|jmpq?) \*%(\w+)$/;
const OTHER_BRANCH = /^(callq?|jmpq?|blr|br) /;
const LAST_REGISTER = /(?:^\S+|,) %(\w+)$/;
const COPY = /^movq %(\w+), %(\w+)$/;
const OPERAND = /%(\w+)/g;
const COMMENT = / ##? .*$/;
const PREFIXES = /^(?:(?:lock|rep\w*|data16) )+/;
const PADDING = /^nop[wlq]?$/;
const READS_ONLY = /^(?:cmp[bwlq]?|test[bwlq]?|bt[bwlq]?|push[wq]?|v?u?comis[sd]|v?ptest|nop[wlq]?)$/;
const EXCHANGES = /^(?:xchg|xadd|cmpxchg|mulx)/;
const IMPLICIT: readonly (readonly [RegExp, readonly string[]])[] = [
	[/^(?:i?mul|i?div)[bwlq]?$/, ['rax', 'rdx']],
	[/^c(?:btw|wtl|ltq|wtd|ltd|qto)$/, ['rax', 'rdx']],
	[/^(?:movs|stos|lods|scas|cmps)[bwlq]?$/, ['rax', 'rcx', 'rsi', 'rdi']],
	[/^(?:cpuid|rdtscp?|xgetbv)$/, ['rax', 'rbx', 'rcx', 'rdx']],
	[/^syscall$/, ['rax', 'rcx', 'r11']],
	[/^leave[wq]?$/, ['rbp', 'rsp']],
	[EXCHANGES, ['rax', 'rdx']]
];
const ENDS = /^(?:retq?|ud[12]|int3|hlt)$/;
const BRANCH = /^(?:j[a-z]+|loop\w*)$/;
const ADDRESS = /0x([0-9a-f]+)$/;
const CALLER_SAVED = ['rax', 'rcx', 'rdx', 'rsi', 'rdi', 'r8', 'r9', 'r10', 'r11'];
const LEGACY: Readonly<Record<string, string>> = Object.fromEntries(
	(['a', 'b', 'c', 'd'] as const).flatMap((r) => [`e${r}x`, `${r}x`, `${r}l`, `${r}h`].map((name) => [name, `r${r}x`])).concat(
		['si', 'di', 'bp', 'sp'].flatMap((r) => [`e${r}`, r, `${r}l`].map((name) => [name, `r${r}`]))
	)
);
const RELATIVE = /^([0-9a-f]+) R_\w+_RELATIVE\s+\*ABS\*\+0x([0-9a-f]+)$/;
const SYMBOL_SLOT = /^([0-9a-f]+) R_\w+_(?:GLOB_DAT|JUMP_SLOT)\s+(.+?)$/;
const NO_BINARY: BinaryImage = { int32: () => undefined, threadLocal: () => false };
const NO_IMAGE: Image = { internal: new Map(), symbols: new Map(), tls: new Set(), ...NO_BINARY };
const MACHO_MAGIC = 0xfeedfacf;
const LC_SEGMENT_64 = 0x19;
const THREAD_VARIABLES = '__thread_vars';
const TLV_LOAD = /^ldr (x\d+), \[x0\]$/;
const TLV_ADDRESS = /^leaq? -?0x[0-9a-f]+\(%rip\), %rdi ##? 0x([0-9a-f]+)\b/;
const TLS_SLOT = /^([0-9a-f]+) R_\w+_TLSDESC\b/;
const TLS_PAGE = /^adrp (x\d+), 0x([0-9a-f]+)\b/;
const TLS_LOAD = /^ldr x1, \[(x\d+), #0x([0-9a-f]+)\]$/;
const TLS_ARGUMENT = /^add x0, (x\d+), #0x([0-9a-f]+)$/;
const TABLE_BASE_USE = /^movslq \(%(\w+),%\w+,4\)/;

export const DYNAMIC_CLASSES: readonly DynamicClass[] = [
	{
		name: 'std panic and formatting',
		reason:
			'runs once, at the frame that faults or formats, and its stack does not grow with depth, so the stack past ENCODE_STACK_BUDGET covers it',
		within:
			/^(?:<&?)?(?:std::panicking::|core::fmt::write\b|std::sys::sync::once::|std::alloc::rust_oom\b|std::thread::current::|__rustc::__rust_start_panic\b|core::ptr::drop_glue::<panic_unwind::|std::io::stdio::|std::sys::thread_local::destructors::)/
	},
	{
		name: 'napi typed-array external-data finalizer (never set: no caller of with_external_data)',
		reason:
			'the drop calls finalizer_notify, which only with_external_data sets; the addon has no with_external_data, so the pointer is null and the call never runs',
		within: /^<napi::bindgen_runtime::js_values::arraybuffer::\w+ as core::ops::drop::Drop>::drop\b/,
		refutedBy: /::with_external_data\b/
	}
];
const RIP_ADDRESS = /^leaq? -?0x[0-9a-f]+\(%rip\), %(\w+) ##? 0x([0-9a-f]+)\b/;
const TABLE_ENTRY = /^movslq \(%(\w+),%\w+,4\), %(\w+)$/;
const TABLE_ADD = /^addq %(\w+), %(\w+)$/;
const TABLE_REACH = 12;
const TABLE_ROUNDS = 8;
const ELF_MAGIC = 0x464c457f;
const SHT_PROGBITS = 1;

function wide(reg: string): string {
	const numbered = /^r(\d+)[dwb]?$/.exec(reg);
	return numbered ? `r${numbered[1]}` : (LEGACY[reg] ?? reg);
}

interface Section {
	readonly name: string;
	readonly address: number;
	readonly offset: number;
	readonly size: number;
}

function elfSections(bytes: Buffer): Section[] {
	const sections: Section[] = [];
	const table = Number(bytes.readBigUInt64LE(0x28));
	const entry = bytes.readUInt16LE(0x3a);
	for (let at = 0; at < bytes.readUInt16LE(0x3c); at++) {
		const header = table + at * entry;
		const address = Number(bytes.readBigUInt64LE(header + 0x10));
		if (bytes.readUInt32LE(header + 4) !== SHT_PROGBITS || !address) continue;
		sections.push({ name: '', address, offset: Number(bytes.readBigUInt64LE(header + 0x18)), size: Number(bytes.readBigUInt64LE(header + 0x20)) });
	}
	return sections;
}

function machoSections(bytes: Buffer): Section[] {
	const sections: Section[] = [];
	let command = 32;
	for (let n = 0; n < bytes.readUInt32LE(16); n++) {
		if (bytes.readUInt32LE(command) === LC_SEGMENT_64) {
			for (let at = 0; at < bytes.readUInt32LE(command + 64); at++) {
				const header = command + 72 + at * 80;
				sections.push({
					name: bytes.toString('latin1', header, header + 16).replace(/\0.*$/s, ''),
					address: Number(bytes.readBigUInt64LE(header + 32)),
					size: Number(bytes.readBigUInt64LE(header + 40)),
					offset: bytes.readUInt32LE(header + 48)
				});
			}
		}
		command += bytes.readUInt32LE(command + 4);
	}
	return sections;
}

export function imageOf(bytes: Buffer): BinaryImage {
	const elf = bytes.length >= 0x40 && bytes.readUInt32LE(0) === ELF_MAGIC && bytes[4] === 2 && bytes[5] === 1;
	const macho = bytes.length >= 32 && bytes.readUInt32LE(0) === MACHO_MAGIC;
	if (!elf && !macho) return NO_BINARY;
	const sections = elf ? elfSections(bytes) : machoSections(bytes);
	const holding = (address: number, width: number) =>
		sections.find((section) => address >= section.address && address + width <= section.address + section.size);
	const variables = sections.filter((section) => section.name === THREAD_VARIABLES);
	return {
		int32: (address) => {
			const section = holding(address, 4);
			return section?.offset ? bytes.readInt32LE(section.offset + address - section.address) : undefined;
		},
		threadLocal: (address) => variables.some((section) => address >= section.address && address < section.address + section.size)
	};
}

export function gotSlots(lines: Iterable<string>): Slots {
	const internal = new Map<number, number>();
	const symbols = new Map<number, string>();
	const tls = new Set<number>();
	for (const line of lines) {
		const relative = RELATIVE.exec(line.trim());
		if (relative) internal.set(Number.parseInt(relative[1]!, 16), Number.parseInt(relative[2]!, 16));
		const symbol = SYMBOL_SLOT.exec(line.trim());
		if (symbol) symbols.set(Number.parseInt(symbol[1]!, 16), symbol[2]!);
		const descriptor = TLS_SLOT.exec(line.trim());
		if (descriptor) tls.add(Number.parseInt(descriptor[1]!, 16));
	}
	return { internal, symbols, tls };
}

interface Collected {
	readonly start: number;
	readonly prologue: string[];
	readonly targets: (readonly [string, string])[];
	readonly slots: (readonly [string, number, Unresolved])[];
	readonly addresses: (readonly [string, number, Unresolved])[];
	readonly descriptors: (readonly [number, Unresolved])[];
	readonly unresolved: Unresolved[];
	readonly jumps: Unresolved[];
}

interface Instruction {
	readonly address: number;
	readonly ins: string;
}

interface Value {
	readonly kind: 'slot' | 'address';
	readonly at: number;
}

type Held = ReadonlyMap<string, Value>;

interface DirectFlow {
	readonly next: readonly number[];
	readonly jump: boolean;
}

interface TableJump {
	readonly jump: number;
	readonly entry: number;
	readonly base: string;
}

type Tables = ReadonlyMap<number, readonly number[]>;

const NOTHING_HELD: Held = new Map();

const mnemonic = (ins: string): string => ins.replace(PREFIXES, '').split(' ', 1)[0]!;

const operands = (ins: string): string => {
	const named = ins.indexOf(' <');
	return named < 0 ? ins : ins.slice(0, named);
};

function written(ins: string): readonly string[] {
	const op = mnemonic(ins);
	if (CALL_OPS.has(op)) return CALLER_SAVED;
	const operands = ins.replace(COMMENT, '');
	const implicit = IMPLICIT.find(([pattern]) => pattern.test(op))?.[1] ?? [];
	if (EXCHANGES.test(op)) return [...implicit, ...[...operands.matchAll(OPERAND)].map((m) => wide(m[1]!))];
	if (READS_ONLY.test(op)) return implicit;
	const last = LAST_REGISTER.exec(operands)?.[1];
	return last === undefined ? implicit : [...implicit, wide(last)];
}

function held(state: Held, ins: string): Held {
	const load = RIP_LOAD.exec(ins);
	const address = RIP_ADDRESS.exec(ins);
	const copy = COPY.exec(ins);
	const copied = copy ? state.get(wide(copy[1]!)) : undefined;
	const clobbered = written(ins);
	if (!load && !address && !copied && !clobbered.some((reg) => state.has(reg))) return state;
	const out = new Map(state);
	for (const reg of clobbered) out.delete(reg);
	if (load) out.set(wide(load[1]!), { kind: 'slot', at: Number.parseInt(load[2]!, 16) });
	if (address) out.set(wide(address[1]!), { kind: 'address', at: Number.parseInt(address[2]!, 16) });
	if (copy && copied) out.set(wide(copy[2]!), copied);
	return out;
}

function meet(a: Held | undefined, b: Held | undefined): Held | undefined {
	if (a === undefined) return b;
	if (b === undefined) return a;
	return new Map(
		[...a].filter(([reg, value]) => {
			const other = b.get(reg);
			return other?.kind === value.kind && other.at === value.at;
		})
	);
}

function directFlow(ins: string, at: number, index: ReadonlyMap<number, number>): DirectFlow {
	const op = mnemonic(ins);
	if (ENDS.test(op)) return { next: [], jump: false };
	if (!BRANCH.test(op)) return { next: [at + 1], jump: false };
	if (operands(ins).includes('*')) return { next: [], jump: !RIP_BRANCH.test(ins) };
	const target = index.get(Number.parseInt(ADDRESS.exec(operands(ins))?.[1] ?? '', 16));
	const taken = target === undefined ? [] : [target];
	return { next: op === 'jmp' || op === 'jmpq' ? taken : [...taken, at + 1], jump: false };
}

function tableJump(body: readonly Instruction[], jump: number): TableJump | undefined {
	const target = REG_BRANCH.exec(body[jump]!.ins);
	if (!target) return undefined;
	const jumped = wide(target[2]!);
	let base: string | undefined;
	for (let back = jump - 1; back >= Math.max(0, jump - TABLE_REACH); back--) {
		const ins = body[back]!.ins;
		const add = base === undefined ? TABLE_ADD.exec(ins) : undefined;
		const entry = base === undefined ? undefined : TABLE_ENTRY.exec(ins);
		if (add && wide(add[2]!) === jumped) base = wide(add[1]!);
		else if (entry && wide(entry[1]!) === base && wide(entry[2]!) === jumped) return { jump, entry: back, base };
		else if (BRANCH.test(mnemonic(ins)) || ENDS.test(mnemonic(ins)) || written(ins).some((reg) => reg === jumped || reg === base))
			return undefined;
	}
	return undefined;
}

function tableTargets(image: Image, table: number, index: ReadonlyMap<number, number>): number[] {
	const targets: number[] = [];
	for (let entry = image.int32(table); entry !== undefined; entry = image.int32(table + 4 * targets.length)) {
		const target = index.get(table + entry);
		if (target === undefined) break;
		targets.push(target);
	}
	return targets;
}

function solve(
	body: readonly Instruction[],
	next: readonly (readonly number[])[],
	seeds: readonly number[],
	unknown: readonly number[]
): (Held | undefined)[] {
	let anywhere: Held | undefined;
	for (;;) {
		const into: (Held | undefined)[] = body.map(() => undefined);
		for (const seed of seeds) into[seed] = NOTHING_HELD;
		const todo = [...seeds];
		for (let at = todo.pop(); at !== undefined; at = todo.pop()) {
			const out = held(meet(into[at], anywhere)!, body[at]!.ins);
			for (const to of next[at]!) {
				if (to >= body.length) continue;
				const before = into[to];
				const after = meet(before, out)!;
				if (before === undefined || after.size !== before.size) {
					into[to] = after;
					todo.push(to);
				}
			}
		}
		const reaching = unknown.reduce<Held | undefined>(
			(state, at) => (into[at] ? meet(state, meet(into[at], anywhere)) : state),
			undefined
		);
		if (reaching === undefined || (anywhere !== undefined && reaching.size === anywhere.size))
			return into.map((state) => state && meet(state, anywhere));
		anywhere = reaching;
	}
}

function heldStates(body: readonly Instruction[], image: Image): readonly Held[] {
	if (!body.some(({ ins }) => CALL_OPS.has(REG_BRANCH.exec(ins)?.[1] ?? ''))) return [];
	const index = new Map(body.map(({ address }, at) => [address, at] as const));
	const direct = body.map(({ ins }, at) => directFlow(ins, at, index));
	const jumps = direct.flatMap(({ jump }, at) => (jump ? [at] : []));
	const tables = jumps.flatMap((jump) => tableJump(body, jump) ?? []);
	const graph = (resolved: Tables) => direct.map(({ next }, at) => resolved.get(at) ?? next);
	const resolve = (into: readonly (Held | undefined)[]): Map<number, readonly number[]> =>
		new Map(
			tables.flatMap(({ jump, entry, base }) => {
				const value = into[entry]?.get(base);
				const targets = value?.kind === 'address' ? tableTargets(image, value.at, index) : [];
				return targets.length ? [[jump, targets] as const] : [];
			})
		);
	const agrees = (a: Tables, b: Tables, jump: number): boolean => a.get(jump)?.join() === b.get(jump)?.join();
	let resolved: Tables = new Map();
	for (let round = 0; round < TABLE_ROUNDS; round++) {
		const found = resolve(solve(body, graph(resolved), [0], []));
		if (found.size === resolved.size && [...found.keys()].every((jump) => agrees(found, resolved, jump))) break;
		resolved = found;
	}
	for (;;) {
		const next = graph(resolved);
		const entered = new Set(next.flat());
		const seeds = body.flatMap(({ ins }, at) => (at === 0 || (!entered.has(at) && !PADDING.test(mnemonic(ins))) ? [at] : []));
		const into = solve(body, next, seeds, jumps.filter((jump) => !resolved.has(jump)));
		const confirmed = resolve(into);
		const kept = new Map([...resolved].filter(([jump]) => agrees(confirmed, resolved, jump)));
		if (kept.size === resolved.size) return into.map((state) => state ?? NOTHING_HELD);
		resolved = kept;
	}
}

function tlsDescriptor(body: readonly Instruction[], at: number): number | undefined {
	const ins = body[at]!.ins;
	const before = (back: number): string => body[at - back]?.ins ?? '';
	if (ins === 'callq *(%rdi)') {
		const address = TLV_ADDRESS.exec(before(1));
		return address ? Number.parseInt(address[1]!, 16) : undefined;
	}
	const called = /^blr (x\d+)$/.exec(ins)?.[1];
	const page = TLS_PAGE.exec(before(3));
	if (!called || !page || page[1] !== 'x0') return undefined;
	const descriptor = TLS_LOAD.exec(before(2));
	const argument = TLS_ARGUMENT.exec(descriptor ? before(1) : before(2));
	const thunk = descriptor ? undefined : TLV_LOAD.exec(before(1));
	if (!argument || argument[1] !== 'x0') return undefined;
	if (descriptor && called === 'x1' && descriptor[1] === 'x0' && descriptor[2] === argument[2])
		return Number.parseInt(page[2]!, 16) + Number.parseInt(argument[2]!, 16);
	if (thunk && thunk[1] === called) return Number.parseInt(page[2]!, 16) + Number.parseInt(argument[2]!, 16);
	return undefined;
}

function codeOf(body: readonly Instruction[]): readonly Instruction[] {
	const first = body[0]?.address ?? 0;
	const last = body.at(-1)?.address ?? 0;
	const bases = new Set(body.flatMap(({ ins }) => TABLE_BASE_USE.exec(ins)?.[1] ?? []).map(wide));
	const tables = body.flatMap(({ ins }) => {
		const base = RIP_ADDRESS.exec(ins);
		const at = base && bases.has(wide(base[1]!)) ? Number.parseInt(base[2]!, 16) : 0;
		return at > first && at <= last ? [at] : [];
	});
	if (!tables.length) return body;
	const data = Math.min(...tables);
	return body.filter(({ address }) => address < data);
}

function readBody(fn: Collected, listed: readonly Instruction[], image: Image): void {
	const body = codeOf(listed);
	const holding = heldStates(body, image);
	for (const [at, { address, ins }] of body.entries()) {
		if (fn.prologue.length < PROLOGUE_LENGTH) fn.prologue.push(ins);
		const site: Unresolved = { offset: address - fn.start, ins };
		const op = ins.split(' ', 1)[0]!;
		const rip = RIP_BRANCH.exec(ins);
		const reg = REG_BRANCH.exec(ins);
		const descriptor = tlsDescriptor(body, at);
		if (descriptor !== undefined) fn.descriptors.push([descriptor, site]);
		else if (rip) fn.slots.push([rip[1]!, Number.parseInt(rip[2]!, 16), site]);
		else if (reg) {
			const value = holding[at]?.get(wide(reg[2]!));
			if (value?.kind === 'slot') fn.slots.push([reg[1]!, value.at, site]);
			else if (value?.kind === 'address') fn.addresses.push([reg[1]!, value.at, site]);
			else (CALL_OPS.has(reg[1]!) ? fn.unresolved : fn.jumps).push(site);
		} else if (OTHER_BRANCH.test(ins) && (op === 'blr' || op === 'br' || operands(ins).includes('*'))) {
			(op === 'blr' || CALL_OPS.has(op) ? fn.unresolved : fn.jumps).push(site);
		} else {
			const target = ins.indexOf(' <');
			if (target > 0 && ins.endsWith('>')) fn.targets.push([op, ins.slice(target + 2, -1)]);
		}
	}
}

function archOf(format: string): Arch | undefined {
	if (/x86[-_]64/.test(format)) return 'x86_64';
	if (/arm64|aarch64/.test(format)) return 'arm64';
	return undefined;
}

export async function disassemble(
	lines: AsyncIterable<string> | Iterable<string>,
	image: Image = NO_IMAGE
): Promise<Disassembly> {
	let arch: Arch | undefined;
	const collected = new Map<string, Collected>();
	const byAddress = new Map<number, string>();
	let current: Collected | undefined;
	let stubs = false;
	let body: Instruction[] = [];
	const flush = (): void => {
		if (current) readBody(current, body, image);
		body = [];
	};
	for await (const line of lines) {
		const section = SECTION.exec(line);
		if (section) {
			flush();
			current = undefined;
			stubs = STUBS.test(section[1]!);
			continue;
		}
		const header = HEADER.exec(line);
		if (header && stubs) continue;
		if (header) {
			flush();
			const start = Number.parseInt(header[1]!, 16);
			byAddress.set(start, header[2]!);
			current = collected.get(header[2]!) ?? { start, prologue: [], targets: [], slots: [], addresses: [], descriptors: [], unresolved: [], jumps: [] };
			collected.set(header[2]!, current);
			continue;
		}
		const format = FORMAT.exec(line);
		if (format) {
			arch = archOf(format[1]!);
			continue;
		}
		const colon = line.indexOf(':');
		if (!current || colon < 0) continue;
		const ins = line
			.slice(colon + 1)
			.replace(/\s+/g, ' ')
			.trim()
			.replace(PREFIX, '');
		if (ins) body.push({ address: Number.parseInt(line.slice(0, colon).trim(), 16), ins });
	}
	flush();
	if (!arch) throw new Error('the disassembly names no x86-64 or arm64 file format');
	const functions = new Map<string, Disassembled>();
	for (const [name, { prologue, targets, slots: through, addresses, descriptors, unresolved, jumps }] of collected) {
		const calls = new Set<string>();
		const tails = new Set<string>();
		const unread = [...unresolved];
		const edge = (op: string, callee: string): void => {
			if (callee === name || OFFSET.test(callee) || !collected.has(callee)) return;
			if (CALL_OPS.has(op)) calls.add(callee);
			else if (TAIL_OPS.test(op)) tails.add(callee);
		};
		for (const [op, callee] of targets) edge(op, callee);
		for (const [op, slot, at] of through) {
			const target = image.internal.get(slot);
			const callee = target === undefined ? image.symbols.get(slot) : byAddress.get(target);
			if (callee !== undefined && collected.has(callee)) edge(op, callee);
			else if (target !== undefined || callee === undefined) unread.push(at);
		}
		for (const [op, address, at] of addresses) {
			const callee = byAddress.get(address);
			if (callee !== undefined) edge(op, callee);
			else unread.push(at);
		}
		for (const [slot, at] of descriptors) if (!image.tls.has(slot) && !image.threadLocal(slot)) unread.push(at);
		functions.set(name, { prologue, calls, tails, unresolved: unread.sort((a, b) => a.offset - b.offset), jumps });
	}
	return { arch, functions };
}

interface Option {
	readonly bytes: number;
	readonly callee: string;
	readonly tail: boolean;
}

class Costs {
	readonly cycles = new Set<string>();
	private readonly memo = new Map<string, number>();
	private readonly open = new Set<string>();

	constructor(
		private readonly dis: Disassembly,
		private readonly frame: (fn: string) => number,
		private readonly lead: ReadonlySet<string>,
		private readonly ends: (fn: string) => boolean,
		private readonly endCost: ((fn: string) => number) | undefined
	) {}

	private options(fn: string): { readonly own: number; readonly options: readonly Option[] } {
		const own = this.frame(fn);
		const { calls, tails } = this.dis.functions.get(fn)!;
		const options: Option[] = [];
		for (const [tail, callees] of [
			[false, calls],
			[true, tails]
		] as const) {
			for (const callee of callees) {
				let rest: number;
				if (this.ends(callee)) rest = this.endCost?.(callee) ?? 0;
				else if (this.lead.has(callee)) rest = this.cost(callee);
				else continue;
				options.push({ bytes: tail ? rest : own + rest, callee, tail });
			}
		}
		return { own, options };
	}

	cost(fn: string): number {
		const known = this.memo.get(fn);
		if (known !== undefined) return known;
		if (this.open.has(fn)) {
			this.cycles.add(fn);
			return 0;
		}
		this.open.add(fn);
		const { own, options } = this.options(fn);
		this.open.delete(fn);
		const bytes = options.length ? Math.max(...options.map((option) => option.bytes)) : own;
		this.memo.set(fn, bytes);
		return bytes;
	}

	path(from: string): StackPath {
		const steps: StackStep[] = [];
		const seen = new Set<string>();
		let to: string | undefined;
		for (let fn: string | undefined = from; fn !== undefined && !seen.has(fn); ) {
			seen.add(fn);
			const { own, options } = this.options(fn);
			const best = options.reduce<Option | undefined>(
				(top, option) => (top && top.bytes >= option.bytes ? top : option),
				undefined
			);
			steps.push({ fn, bytes: own, tail: best?.tail ?? false });
			fn = undefined;
			if (!best) break;
			if (!this.ends(best.callee)) fn = best.callee;
			else if (this.endCost) steps.push({ fn: best.callee, bytes: this.endCost(best.callee), tail: false });
			else to = best.callee;
		}
		return { bytes: this.cost(from), steps, to };
	}
}

function leadingTo(
	callers: ReadonlyMap<string, ReadonlySet<string>>,
	targets: Iterable<string>,
	passes: (fn: string) => boolean
): Set<string> {
	const seen = new Set<string>();
	const todo = [...targets];
	for (let target = todo.pop(); target !== undefined; target = todo.pop()) {
		for (const fn of callers.get(target) ?? []) {
			if (!seen.has(fn) && passes(fn)) {
				seen.add(fn);
				todo.push(fn);
			}
		}
	}
	return seen;
}

function reached(dis: Disassembly, starts: Iterable<string>, through: (fn: string) => boolean): Set<string> {
	const seen = new Set(starts);
	const todo = [...seen];
	for (let fn = todo.pop(); fn !== undefined; fn = todo.pop()) {
		const { calls, tails } = dis.functions.get(fn)!;
		for (const callee of [...calls, ...tails]) {
			if (!seen.has(callee) && through(callee)) {
				seen.add(callee);
				todo.push(callee);
			}
		}
	}
	return seen;
}

function costliest(costs: Costs, starts: readonly string[]): StackPath {
	const from = starts.reduce<string | undefined>(
		(top, fn) => (top !== undefined && costs.cost(top) >= costs.cost(fn) ? top : fn),
		undefined
	);
	return from === undefined ? { bytes: 0, steps: [], to: undefined } : costs.path(from);
}

export function encodeStack(dis: Disassembly, heights: ReadonlySet<string>): EncodeStack {
	const frames = new Map<string, number>();
	const frame = (fn: string): number => {
		const known = frames.get(fn);
		if (known !== undefined) return known;
		const bytes = frameBytes(dis.functions.get(fn)!.prologue, dis.arch);
		frames.set(fn, bytes);
		return bytes;
	};
	const callers = new Map<string, Set<string>>();
	for (const [fn, { calls, tails }] of dis.functions) {
		for (const callee of [...calls, ...tails]) {
			const set = callers.get(callee) ?? new Set<string>();
			set.add(fn);
			callers.set(callee, set);
		}
	}
	const names = [...dis.functions.keys()];
	const opens = (fn: string): boolean => heights.has(WHOLE.exec(fn)?.[1] ?? '');
	const fresh = (fn: string): boolean => LOOP.test(fn);
	const trivia = (fn: string): boolean => TRIVIA.test(fn);
	const entries = names.filter(opens);
	const loops = names.filter(fresh);
	const encoders = names.filter(trivia);
	if (!entries.length || !loops.length || !encoders.length) {
		throw new Error(
			`the build names ${entries.length} whole encodes of a struct with a height, ${loops.length} encode loops and ${encoders.length} trivia encoders; it must name each`
		);
	}
	const cut = (fn: string): boolean => !fresh(fn) && !trivia(fn);
	const lead = leadingTo(callers, entries, cut);
	const levels = new Costs(dis, frame, lead, opens, undefined);
	const level = costliest(levels, entries);
	if (levels.cycles.size)
		throw new Error(`calls cycle between levels through no struct with a height: ${[...levels.cycles].join(', ')}`);
	const below = new Costs(dis, frame, lead, opens, frame);
	const tripLead = leadingTo(callers, encoders, (fn) => cut(fn) && !opens(fn));
	const trips = new Costs(dis, frame, tripLead, trivia, (fn) => below.cost(fn));
	const tripStarts = entries.filter((fn) => {
		const { calls, tails } = dis.functions.get(fn)!;
		return [...calls, ...tails].some((callee) => tripLead.has(callee) || trivia(callee));
	});
	const toWhole = leadingTo(callers, entries, (fn) => !opens(fn) && !trivia(fn));
	const roots = [...toWhole].filter((fn) => !callers.get(fn)?.size);
	const unknown = roots.filter((fn) => !CALLBACK.test(fn));
	if (unknown.length) throw new Error(`no known caller and no napi callback leads to ${unknown.join(', ')}`);
	const aboveCosts = new Costs(dis, frame, toWhole, opens, undefined);
	const above = costliest(aboveCosts, roots);
	if (aboveCosts.cycles.size)
		throw new Error(`calls cycle above the first whole encode: ${[...aboveCosts.cycles].join(', ')}`);
	const trip = costliest(trips, tripStarts);
	const measured = new Set([
		...reached(dis, entries, (fn) => lead.has(fn) || opens(fn)),
		...reached(dis, tripStarts, (fn) => tripLead.has(fn) || trivia(fn) || lead.has(fn) || opens(fn)),
		...reached(dis, roots, (fn) => toWhole.has(fn) || opens(fn))
	]);
	const unresolved = [...measured]
		.sort()
		.flatMap((fn) => dis.functions.get(fn)!.unresolved.map((at) => ({ fn, ...at })));
	const extent = reached(
		dis,
		[...measured].filter((fn) => !roots.includes(fn)),
		() => true
	);
	const refuted = DYNAMIC_CLASSES.flatMap((known) => {
		const by = known.refutedBy && names.find((fn) => known.refutedBy!.test(fn));
		return by ? [{ class: known, by }] : [];
	});
	const holding = DYNAMIC_CLASSES.filter((known) => !refuted.some((r) => r.class === known));
	const outside = [...extent]
		.filter((fn) => !measured.has(fn))
		.sort()
		.flatMap((fn) =>
			dis.functions.get(fn)!.unresolved.map((at) => ({ fn, ...at, class: holding.find((c) => c.within.test(fn)) }))
		);
	return { level, above, trivia: trip, oneTime: above.bytes + trip.bytes, unresolved, reached: outside, refuted };
}

export function heightKinds(nodeRs: string): Set<string> {
	const kinds = new Set<string>();
	let struct: string | undefined;
	for (const line of nodeRs.split('\n')) {
		const open = /^pub struct (\w+) \{/.exec(line);
		if (open) struct = open[1];
		else if (struct && line.trim() === '#[height]') kinds.add(struct);
		else if (line.startsWith('}')) struct = undefined;
	}
	return kinds;
}

function constant(codecRs: string, name: string): number {
	const m = new RegExp(String.raw`^pub const ${name}: \w+ = ([\d_ *]+);$`, 'm').exec(codecRs);
	if (!m) throw new Error(`codec.rs declares no ${name}`);
	return m[1]!.split('*').reduce((product, factor) => product * Number(factor.trim().replaceAll('_', '')), 1);
}

export function codecBounds(codecRs: string): CodecBounds {
	return { limit: constant(codecRs, 'RECURSION_LIMIT'), budget: constant(codecRs, 'ENCODE_STACK_BUDGET') };
}

export function largestLimit(stack: EncodeStack, budget: number): number {
	return stack.level.bytes > 0 ? Math.floor((budget - stack.oneTime) / stack.level.bytes) : Number.POSITIVE_INFINITY;
}

function objdumpOf(objdump: string, args: readonly string[]) {
	const child = spawn(objdump, [...args], { stdio: ['ignore', 'pipe', 'inherit'] });
	const exited = new Promise<number>((resolve, reject) => {
		child.once('error', reject);
		child.once('close', (code) => resolve(code ?? 1));
	});
	return { lines: createInterface({ input: child.stdout, crlfDelay: Infinity }), exited };
}

async function disassembleAddon(objdump: string, addon: string): Promise<Disassembly> {
	const relocations = objdumpOf(objdump, ['-R', '-C', addon]);
	const relocated: string[] = [];
	for await (const line of relocations.lines) relocated.push(line);
	await relocations.exited;
	const listing = objdumpOf(objdump, ['-d', '-C', '--no-show-raw-insn', addon]);
	const dis = await disassemble(listing.lines, { ...gotSlots(relocated), ...imageOf(readFileSync(addon)) });
	const code = await listing.exited;
	if (code !== 0) throw new Error(`${objdump} exited ${code} disassembling ${addon}`);
	return dis;
}

function grammarOfAddon(addon: string): GrammarName {
	const name = basename(addon);
	const grammar = stableGrammars().find((candidate) => name.startsWith(`${nativeBinaryName(candidate)}.`));
	if (!grammar) throw new Error(`${addon} is no grammar's addon (sittir-<grammar>.<platform>.node)`);
	return grammar;
}

function builtAddons(native: CodegenSurface['nativeBinaryFreshness'], grammar: GrammarName): string[] {
	const dir = nativeBindingDir(grammar);
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((file) => file.startsWith(`${nativeBinaryName(grammar)}.`) && file.endsWith('.node'))
		.map((file) => native.unstrippedReleaseBinary(REPO_ROOT, grammar, file));
}

const SHORT =
	/sittir_\w+::render::node::|sittir_core::(?:codec::|slot::|non_empty::)?|alloc::(?:vec|boxed)::|core::option::|napi::bindgen_runtime::js_values::|::h[0-9a-f]{16}$/g;
const short = (fn: string): string => fn.replace(SHORT, '');

function describe(label: string, path: StackPath): string[] {
	const steps = path.steps.map(
		(step) => `    ${step.tail ? `${step.bytes} freed by a tail call` : step.bytes}\t${short(step.fn)}`
	);
	return [`  ${label} ${path.bytes}`, ...steps, ...(path.to ? [`    next\t${short(path.to)}`] : [])];
}

const unread = (stack: EncodeStack): readonly UnresolvedCall[] => [
	...stack.unresolved,
	...stack.reached.filter((call) => !call.class)
];

export async function run(opts: EncodeStackOptions = {}): Promise<number> {
	const bounds = codecBounds(readFileSync(CODEC, 'utf8'));
	const grammars = opts.grammars?.length ? opts.grammars.map(assertGrammar) : stableGrammars();
	const native = await load('nativeBinaryFreshness');
	const addons = opts.addons?.length ? opts.addons : grammars.flatMap((grammar) => builtAddons(native, grammar));
	if (!addons.length) {
		console.error(
			'encode-stack: no built addon to measure; build one with scripts/build-native.mts <grammar> --release'
		);
		return 1;
	}
	const objdump = opts.objdump ?? native.llvmTool('llvm-objdump');
	const reports: AddonStack[] = [];
	for (const addon of addons) {
		const grammar = grammarOfAddon(addon);
		const heights = heightKinds(readFileSync(join(nativeCrateDir(grammar), 'src/render/node.rs'), 'utf8'));
		const stack = encodeStack(await disassembleAddon(objdump, addon), heights);
		const largest = largestLimit(stack, bounds.budget);
		reports.push({ grammar, addon, stack, largestLimit: largest, fits: bounds.limit <= largest });
	}
	if (opts.json) console.log(JSON.stringify({ ...bounds, addons: reports }, null, 2));
	else {
		for (const { grammar, addon, stack, largestLimit: largest, fits } of reports) {
			const total = bounds.limit * stack.level.bytes + stack.oneTime;
			const status = unread(stack).length ? 'UNREAD' : fits ? 'ok' : 'OVER';
			console.log(
				`${status} ${grammar} ${basename(addon)}: ${bounds.limit} × ${stack.level.bytes} + ${stack.oneTime} = ${total} of ${bounds.budget} (largest limit ${largest})`
			);
			for (const { fn, offset, ins } of stack.unresolved) console.log(`  unread call ${short(fn)}+0x${offset.toString(16)}: ${ins}`);
			for (const known of DYNAMIC_CLASSES) {
				const count = stack.reached.filter((call) => call.class === known).length;
				if (count) console.log(`  ${count} reached dynamic calls, ${known.name}: ${known.reason}`);
			}
			for (const { class: known, by } of stack.refuted)
				console.log(`  no longer a class, ${known.name}: the addon has ${short(by)}`);
			for (const { fn, offset, ins } of stack.reached.filter((call) => !call.class))
				console.log(`  unread call the encode reaches, in no class, ${short(fn)}+0x${offset.toString(16)}: ${ins}`);
			if (status === 'ok' && !opts.paths) continue;
			for (const line of [
				...describe('level', stack.level),
				...describe('to the first whole encode', stack.above),
				...describe('trivia', stack.trivia)
			])
				console.log(line);
		}
	}
	const over = reports.filter((report) => !report.fits);
	if (over.length)
		console.error(
			`encode-stack: RECURSION_LIMIT ${bounds.limit} is over ENCODE_STACK_BUDGET for ${over.map((report) => `${report.grammar} (largest ${report.largestLimit})`).join(', ')}`
		);
	const unproven = reports.filter((report) => unread(report.stack).length);
	if (unproven.length)
		console.error(
			`encode-stack: indirect calls the encode reaches that the disassembly can't resolve and no class covers, so the bound is unproven, in ${unproven.map((report) => `${report.grammar} (${unread(report.stack).length})`).join(', ')}`
		);
	return over.length || unproven.length ? 1 : 0;
}
