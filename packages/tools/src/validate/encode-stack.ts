import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

export interface Selected extends Unresolved {
	readonly targets: readonly string[];
}

export interface Disassembled {
	readonly name: string;
	readonly frame: number;
	readonly calls: ReadonlySet<number>;
	readonly tails: ReadonlySet<number>;
	readonly unresolved: readonly Unresolved[];
	readonly selected: readonly Selected[];
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
	readonly frames?: ReadonlyMap<number, number>;
}

export interface Image extends Slots, BinaryImage {}

export interface Disassembly {
	readonly arch: Arch;
	readonly functions: ReadonlyMap<number, Disassembled>;
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

export interface SelectedCall extends Selected {
	readonly fn: string;
}

export interface EncodeStack {
	readonly level: StackPath;
	readonly above: StackPath;
	readonly trivia: StackPath;
	readonly oneTime: number;
	readonly unresolved: readonly UnresolvedCall[];
	readonly reached: readonly ReachedCall[];
	readonly selected: readonly SelectedCall[];
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
		const ins = raw.replace(COMMENT, '').replace(ARM_COMMENT, '').trim();
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
const MEMORY_BRANCH = /^(callq?|jmpq?) \*(-?0x[0-9a-f]+)?\(%(\w+)\)$/;
const HOST_STUB = /^napi_sys::functions::\w+::NAPI::(\w+)$/;
const OTHER_BRANCH = /^(callq?|jmpq?|blr(?:aa|ab)?z?|br(?:aa|ab)?z?) /;
const LAST_REGISTER = /(?:^\S+|,) %(\w+)$/;
const COPY = /^movq %(\w+), %(\w+)$/;
const X86_SELECT = /^cmov[a-z]+q %(\w+), %(\w+)$/;
const ARM_COMMENT = /\s*(?:;|\/\/).*$/;
const ARM_CALLS = /^(?:bl|blr(?:aa|ab)?z?|svc)$/;
const ARM_JUMPS = /^br(?:aa|ab)?z?$/;
const ARM_REFERENCES = /^(?:adrp?|ldr\w*|prfm)$/;
const ARM_CALLER_SAVED = [...Array.from({ length: 19 }, (_, n) => `x${n}`), 'x30'];
const ARM_READS_ONLY = /^(?:st(?!l?xr|l?xp)\w*|cmp|cmn|tst|fcmp\w*|fccmp\w*|ccmp|ccmn|b|b\.\w+|br|ret\w*|cbn?z|tbn?z|prfm\w*|dmb|dsb|isb|nop|hint|brk|udf|hlt|msr|bti)$/;
const ARM_FIRST = /^\S+ ([xw]\d+|sp|fp|lr)\b/;
const ARM_WRITES_TWO =
	/^(?:ld[a-z]*p|ld(?:add|clr|eor|set|smax|smin|umax|umin)|swp|cas)\w* ([xw]\d+|fp|lr), ([xw]\d+|fp|lr)\b/;
const ARM_WRITEBACK = /\[(x\d+|sp)[^\]]*\]!|\[(x\d+|sp)\], /;
const ARM_PAGE = /^adrp? (x\d+), 0x([0-9a-f]+)$/;
const ARM_OFFSET = /^add (x\d+), (x\d+), #0x([0-9a-f]+)$/;
const ARM_SLOT = /^ldr (x\d+), \[(x\d+)(?:, #0x([0-9a-f]+))?\]$/;
const ARM_COPY = /^mov (x\d+), (x\d+)$/;
const ARM_SELECT = /^csel (x\d+), (x\d+), (x\d+), \w+$/;
const ARM_ENDS = /^(?:ret\w*|brk|udf|hlt)$/;
const ARM_CALL_REGISTER = /^blr (x\d+)$/;
const ARM_JUMP_REGISTER = /^br (x\d+)$/;
const ARM_TABLE_ADD = /^add (x\d+), (x\d+), (x\d+)(?:, (?:lsl|sxtw|uxtw) #2)?$/;
const ARM_TABLE_ENTRY = /^ldr(?:b|h|sw)? ([wx]\d+), \[x\d+, x\d+(?:, (?:lsl|sxtw|uxtw) #\d)?\]$/;
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
const MICROSOFT_CALLER_SAVED = ['rax', 'rcx', 'rdx', 'r8', 'r9', 'r10', 'r11'];
const COFF_FORMAT = /^coff-/;
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
const TLV_BRANCH = /^(?:callq|jmpq) \*\(%rdi\)$/;
const TLS_BRANCH = /^(?:blr|br) (x\d+)$/;
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
			/^(?:<&?)?(?:std::panicking::|core::fmt::write\b|std::sys::sync::once::|std::alloc::rust_oom\b|std::thread::current::|__rustc::__rust_start_panic\b|core::ptr::drop_glue::<panic_unwind::|std::io::stdio::|std::sys::stdio::|std::sys::thread_local::destructors::)/
	},
	{
		name: 'napi typed-array external-data finalizer (never set: no caller of with_external_data)',
		reason:
			'the drop calls finalizer_notify, which only with_external_data sets; the addon has no with_external_data, so the pointer is null and the call never runs',
		within: /^<napi::bindgen_runtime::js_values::arraybuffer::\w+ as core::ops::drop::Drop>::drop\b/,
		refutedBy: /::with_external_data\b/
	},
	{
		name: 'unwinder (static libunwind on musl)',
		reason:
			'runs only while a panic unwinds, and its stack does not grow with depth, so the stack past ENCODE_STACK_BUDGET covers it',
		within: /^(?:_Unwind_|_?_?unw_|unwind_phase2|libunwind::)/
	},
	{
		name: "a custom io::Error's payload drop",
		reason:
			'std code that runs once, where a custom io::Error drops, and its stack does not grow with depth, so the stack past ENCODE_STACK_BUDGET covers it',
		within: /^<core::io::error::CustomOwner as core::ops::drop::Drop>::drop$/
	}
];
const OUTLINED = /^_?OUTLINED_FUNCTION_\d+$/;
const RIP_ADDRESS = /^leaq? -?0x[0-9a-f]+\(%rip\), %(\w+) ##? 0x([0-9a-f]+)\b/;
const TABLE_ENTRY = /^movslq \(%(\w+),%\w+,4\), %(\w+)$/;
const TABLE_ADD = /^addq %(\w+), %(\w+)$/;
const TABLE_REACH = 12;
const TABLE_ROUNDS = 8;
const ELF_MAGIC = 0x464c457f;
const SHT_PROGBITS = 1;
const MZ_MAGIC = 0x5a4d;
const PE_MAGIC = 0x4550;
const PE32_PLUS = 0x20b;
const IMPORT_DIRECTORY = 1;
const EXCEPTION_DIRECTORY = 3;
const BASE_RELOCATION_DIRECTORY = 5;
const IMAGE_REL_BASED_DIR64 = 10;
const ORDINAL_IMPORT = 1n << 63n;
const UNW_FLAG_CHAININFO = 4;
const RETURN_ADDRESS = 8;
const MAP_FUNCTION = /^ ([0-9a-f]{4}):([0-9a-f]{8})\s+(\S+)\s+[0-9a-f]{16}\s+f\s/;
const COFF_FUNCTION = 0x20;
const COFF_EXTERNAL = 2;

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
				const name = bytes.subarray(header, header + 16);
				const end = name.indexOf(0);
				sections.push({
					name: name.toString('latin1', 0, end < 0 ? name.length : end),
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

interface Pe {
	readonly base: number;
	readonly coff: number;
	readonly sections: readonly Section[];
	readonly directory: (index: number) => { readonly rva: number; readonly size: number };
}

function peOf(bytes: Buffer): Pe | undefined {
	if (bytes.length < 0x40 || bytes.readUInt16LE(0) !== MZ_MAGIC) return undefined;
	const signature = bytes.readUInt32LE(0x3c);
	if (signature + 24 > bytes.length || bytes.readUInt32LE(signature) !== PE_MAGIC) return undefined;
	const coff = signature + 4;
	const optional = coff + 20;
	if (bytes.readUInt16LE(optional) !== PE32_PLUS) return undefined;
	const base = Number(bytes.readBigUInt64LE(optional + 24));
	const directories = bytes.readUInt32LE(optional + 108);
	const headers = optional + bytes.readUInt16LE(coff + 16);
	const sections = Array.from({ length: bytes.readUInt16LE(coff + 2) }, (_, at) => {
		const header = headers + 40 * at;
		const name = bytes.subarray(header, header + 8);
		const end = name.indexOf(0);
		return {
			name: name.toString('latin1', 0, end < 0 ? name.length : end),
			address: base + bytes.readUInt32LE(header + 12),
			size: Math.min(bytes.readUInt32LE(header + 8), bytes.readUInt32LE(header + 16)),
			offset: bytes.readUInt32LE(header + 20)
		};
	});
	return {
		base,
		coff,
		sections,
		directory: (index) =>
			index < directories
				? { rva: bytes.readUInt32LE(optional + 112 + 8 * index), size: bytes.readUInt32LE(optional + 116 + 8 * index) }
				: { rva: 0, size: 0 }
	};
}

function fileOffset(sections: readonly Section[], address: number, width: number): number | undefined {
	const section = sections.find((held) => address >= held.address && address + width <= held.address + held.size);
	return section?.offset ? section.offset + address - section.address : undefined;
}

function unwoundBytes(bytes: Buffer, pe: Pe, info: number): number {
	let total = 0;
	for (let rva: number | undefined = info; rva !== undefined; ) {
		const at = fileOffset(pe.sections, pe.base + rva, 4);
		if (at === undefined) throw new Error(`the unwind info at ${hexOf(pe.base + rva)} is outside the image`);
		const flags = bytes[at]! >> 3;
		const count = bytes[at + 2]!;
		for (let slot = 0; slot < count; ) {
			const op = bytes[at + 5 + 2 * slot]! & 0xf;
			const info = bytes[at + 5 + 2 * slot]! >> 4;
			const next = at + 4 + 2 * (slot + 1);
			if (op === 0) total += 8;
			else if (op === 1) total += info === 0 ? bytes.readUInt16LE(next) * 8 : bytes.readUInt32LE(next);
			else if (op === 2) total += info * 8 + 8;
			else if (op === 10) total += info ? 48 : 40;
			else if (![3, 4, 5, 6, 8, 9].includes(op)) throw new Error(`unknown unwind code ${op} at ${hexOf(pe.base + rva)}`);
			slot += op === 1 ? (info === 0 ? 2 : 3) : op === 4 || op === 8 ? 2 : op === 5 || op === 9 ? 3 : 1;
		}
		rva = flags & UNW_FLAG_CHAININFO ? bytes.readUInt32LE(at + 4 + 2 * (count + (count & 1)) + 8) : undefined;
	}
	return total;
}

function peFrames(bytes: Buffer, pe: Pe): Map<number, number> {
	const frames = new Map<number, number>();
	const { rva, size } = pe.directory(EXCEPTION_DIRECTORY);
	for (let entry = 0; entry + 12 <= size; entry += 12) {
		const at = fileOffset(pe.sections, pe.base + rva + entry, 12);
		if (at === undefined) break;
		frames.set(pe.base + bytes.readUInt32LE(at), RETURN_ADDRESS + unwoundBytes(bytes, pe, bytes.readUInt32LE(at + 8)));
	}
	return frames;
}

const hexOf = (address: number): string => `0x${address.toString(16)}`;

export function imageOf(bytes: Buffer): BinaryImage {
	const pe = peOf(bytes);
	const elf = bytes.length >= 0x40 && bytes.readUInt32LE(0) === ELF_MAGIC && bytes[4] === 2 && bytes[5] === 1;
	const macho = bytes.length >= 32 && bytes.readUInt32LE(0) === MACHO_MAGIC;
	if (!pe && !elf && !macho) return NO_BINARY;
	const sections = pe?.sections ?? (elf ? elfSections(bytes) : machoSections(bytes));
	const variables = sections.filter((section) => section.name === THREAD_VARIABLES);
	return {
		int32: (address) => {
			const at = fileOffset(sections, address, 4);
			return at === undefined ? undefined : bytes.readInt32LE(at);
		},
		threadLocal: (address) => variables.some((section) => address >= section.address && address < section.address + section.size),
		...(pe ? { frames: peFrames(bytes, pe) } : {})
	};
}

export function peSlots(bytes: Buffer): Slots {
	const internal = new Map<number, number>();
	const symbols = new Map<number, string>();
	const pe = peOf(bytes);
	if (!pe) return { internal, symbols, tls: new Set() };
	const at = (address: number, width: number): number => {
		const offset = fileOffset(pe.sections, address, width);
		if (offset === undefined) throw new Error(`${hexOf(address)} is outside the image's sections`);
		return offset;
	};
	const text = (address: number): string => {
		const start = at(address, 1);
		return bytes.toString('latin1', start, bytes.indexOf(0, start));
	};
	const imports = pe.directory(IMPORT_DIRECTORY);
	for (let descriptor = imports.rva; imports.size; descriptor += 20) {
		const entry = at(pe.base + descriptor, 20);
		const lookup = bytes.readUInt32LE(entry);
		const name = bytes.readUInt32LE(entry + 12);
		const table = bytes.readUInt32LE(entry + 16);
		if (!lookup && !name && !table) break;
		const library = text(pe.base + name);
		for (let slot = 0; ; slot++) {
			const thunk = bytes.readBigUInt64LE(at(pe.base + (lookup || table) + 8 * slot, 8));
			if (thunk === 0n) break;
			symbols.set(
				pe.base + table + 8 * slot,
				thunk & ORDINAL_IMPORT ? `${library}#${Number(thunk & 0xffffn)}` : text(pe.base + Number(thunk & 0x7fffffffn) + 2)
			);
		}
	}
	const relocations = pe.directory(BASE_RELOCATION_DIRECTORY);
	for (let block = relocations.rva; block < relocations.rva + relocations.size; ) {
		const header = at(pe.base + block, 8);
		const page = bytes.readUInt32LE(header);
		const size = bytes.readUInt32LE(header + 4);
		if (size < 8) break;
		for (let entry = 8; entry + 2 <= size; entry += 2) {
			const field = bytes.readUInt16LE(header + entry);
			const slot = pe.base + page + (field & 0xfff);
			if (field >> 12 === IMAGE_REL_BASED_DIR64 && !symbols.has(slot)) internal.set(slot, Number(bytes.readBigUInt64LE(at(slot, 8))));
		}
		block += size;
	}
	return { internal, symbols, tls: new Set() };
}

export function namedCopy(bytes: Buffer, map: string): Buffer {
	const pe = peOf(bytes);
	if (!pe) throw new Error('only a PE image is named from a linker map');
	const records: Buffer[] = [];
	const names: Buffer[] = [];
	let strings = 4;
	for (const line of map.split(/\r?\n/)) {
		const row = MAP_FUNCTION.exec(line);
		if (!row || row[1] === '0000') continue;
		const name = Buffer.from(row[3]!, 'latin1');
		const record = Buffer.alloc(18);
		if (name.length <= 8) name.copy(record);
		else {
			record.writeUInt32LE(strings, 4);
			names.push(name, Buffer.alloc(1));
			strings += name.length + 1;
		}
		record.writeUInt32LE(Number.parseInt(row[2]!, 16), 8);
		record.writeInt16LE(Number.parseInt(row[1]!, 16), 12);
		record.writeUInt16LE(COFF_FUNCTION, 14);
		record[16] = COFF_EXTERNAL;
		records.push(record);
	}
	const size = Buffer.alloc(4);
	size.writeUInt32LE(strings);
	const named = Buffer.concat([bytes, ...records, size, ...names]);
	named.writeUInt32LE(bytes.length, pe.coff + 8);
	named.writeUInt32LE(records.length, pe.coff + 12);
	return named;
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
	readonly name: string;
	readonly start: number;
	readonly prologue: string[];
	readonly targets: (readonly [string, number])[];
	readonly slots: (readonly [string, number, Unresolved])[];
	readonly addresses: (readonly [string, number, Unresolved])[];
	readonly descriptors: (readonly [number, Unresolved])[];
	readonly selections: (readonly [readonly number[], Unresolved])[];
	readonly unresolved: Unresolved[];
	readonly jumps: Unresolved[];
}

interface Instruction {
	readonly address: number;
	readonly ins: string;
}

interface Value {
	readonly kind: 'slot' | 'address';
	readonly at: readonly number[];
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

interface Branch {
	readonly call: boolean;
	readonly register: string;
	readonly displacement?: number;
}

interface Isa {
	readonly wide: (reg: string) => string;
	readonly written: (ins: string) => readonly string[];
	readonly sets: (state: Held, ins: string) => readonly (readonly [string, Value])[];
	readonly flow: (ins: string, at: number, index: ReadonlyMap<number, number>) => DirectFlow;
	readonly branch: (ins: string) => Branch | undefined;
	readonly table: (body: readonly Instruction[], jump: number) => TableJump | undefined;
	readonly dispatches: (body: readonly Instruction[], jump: number) => boolean;
}

const NOTHING_HELD: Held = new Map();

const mnemonic = (ins: string): string => ins.replace(PREFIXES, '').split(' ', 1)[0]!;

const operands = (ins: string): string => {
	const named = ins.indexOf(' <');
	return named < 0 ? ins : ins.slice(0, named);
};

const hex = (text: string): number => Number.parseInt(text, 16);

const single = (value: Value | undefined, kind: Value['kind']): number | undefined =>
	value?.kind === kind && value.at.length === 1 ? value.at[0] : undefined;

const either = (a: number | undefined, b: number | undefined): Value | undefined =>
	a === undefined || b === undefined ? undefined : { kind: 'address', at: [...new Set([a, b])].sort((x, y) => x - y) };

function x86Written(ins: string, callerSaved: readonly string[]): readonly string[] {
	const op = mnemonic(ins);
	if (CALL_OPS.has(op)) return callerSaved;
	const text = ins.replace(COMMENT, '');
	const implicit = IMPLICIT.find(([pattern]) => pattern.test(op))?.[1] ?? [];
	if (EXCHANGES.test(op)) return [...implicit, ...[...text.matchAll(OPERAND)].map((m) => wide(m[1]!))];
	if (READS_ONLY.test(op)) return implicit;
	const last = LAST_REGISTER.exec(text)?.[1];
	return last === undefined ? implicit : [...implicit, wide(last)];
}

function x86Sets(state: Held, ins: string): readonly (readonly [string, Value])[] {
	const load = RIP_LOAD.exec(ins);
	if (load) return [[wide(load[1]!), { kind: 'slot', at: [hex(load[2]!)] }]];
	const address = RIP_ADDRESS.exec(ins);
	if (address) return [[wide(address[1]!), { kind: 'address', at: [hex(address[2]!)] }]];
	const copy = COPY.exec(ins);
	const copied = copy && state.get(wide(copy[1]!));
	if (copy && copied) return [[wide(copy[2]!), copied]];
	const select = X86_SELECT.exec(ins);
	const chosen = select && either(single(state.get(wide(select[1]!)), 'address'), single(state.get(wide(select[2]!)), 'address'));
	return select && chosen ? [[wide(select[2]!), chosen]] : [];
}

function x86Flow(ins: string, at: number, index: ReadonlyMap<number, number>): DirectFlow {
	const op = mnemonic(ins);
	if (ENDS.test(op)) return { next: [], jump: false };
	if (!BRANCH.test(op)) return { next: [at + 1], jump: false };
	if (operands(ins).includes('*')) return { next: [], jump: !RIP_BRANCH.test(ins) };
	const target = index.get(hex(ADDRESS.exec(operands(ins))?.[1] ?? ''));
	const taken = target === undefined ? [] : [target];
	return { next: op === 'jmp' || op === 'jmpq' ? taken : [...taken, at + 1], jump: false };
}

function x86Table(body: readonly Instruction[], jump: number, written: Isa['written']): TableJump | undefined {
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

function x86Isa(callerSaved: readonly string[]): Isa {
	const written = (ins: string): readonly string[] => x86Written(ins, callerSaved);
	return {
		wide,
		written,
		sets: x86Sets,
		flow: x86Flow,
		branch: (ins) => {
			const reg = REG_BRANCH.exec(ins);
			if (reg) return { call: CALL_OPS.has(reg[1]!), register: reg[2]! };
			const memory = MEMORY_BRANCH.exec(ins);
			return memory ? { call: CALL_OPS.has(memory[1]!), register: memory[3]!, displacement: imm(memory[2] ?? '0') } : undefined;
		},
		table: (body, jump) => x86Table(body, jump, written),
		dispatches: (body, jump) => x86Table(body, jump, written) !== undefined
	};
}

const X86 = x86Isa(CALLER_SAVED);
const X86_MICROSOFT = x86Isa(MICROSOFT_CALLER_SAVED);

const armWide = (reg: string): string => (reg === 'fp' ? 'x29' : reg === 'lr' ? 'x30' : reg.replace(/^w/, 'x'));

function armWritten(ins: string): readonly string[] {
	const op = mnemonic(ins);
	if (ARM_CALLS.test(op)) return ARM_CALLER_SAVED;
	const text = operands(ins).replace(ARM_COMMENT, '');
	const back = ARM_WRITEBACK.exec(text);
	const based = back ? [armWide(back[1] ?? back[2]!)] : [];
	if (ARM_READS_ONLY.test(op)) return based;
	const two = ARM_WRITES_TWO.exec(text);
	if (two) return [armWide(two[1]!), armWide(two[2]!), ...based];
	const first = ARM_FIRST.exec(text)?.[1];
	return first ? [armWide(first), ...based] : based;
}

function armSets(state: Held, ins: string): readonly (readonly [string, Value])[] {
	const text = operands(ins).replace(ARM_COMMENT, '');
	const page = ARM_PAGE.exec(text);
	if (page) return [[page[1]!, { kind: 'address', at: [hex(page[2]!)] }]];
	const offset = ARM_OFFSET.exec(text);
	const base = offset ? single(state.get(offset[2]!), 'address') : undefined;
	if (offset && base !== undefined) return [[offset[1]!, { kind: 'address', at: [base + hex(offset[3]!)] }]];
	const load = ARM_SLOT.exec(text);
	const from = load ? single(state.get(load[2]!), 'address') : undefined;
	if (load && from !== undefined) return [[load[1]!, { kind: 'slot', at: [from + hex(load[3] ?? '0')] }]];
	const copy = ARM_COPY.exec(text);
	const copied = copy && state.get(copy[2]!);
	if (copy && copied) return [[copy[1]!, copied]];
	const select = ARM_SELECT.exec(text);
	const chosen = select && either(single(state.get(select[2]!), 'address'), single(state.get(select[3]!), 'address'));
	return select && chosen ? [[select[1]!, chosen]] : [];
}

function armFlow(ins: string, at: number, index: ReadonlyMap<number, number>): DirectFlow {
	const op = mnemonic(ins);
	if (ARM_ENDS.test(op)) return { next: [], jump: false };
	if (ARM_JUMPS.test(op)) return { next: [], jump: true };
	const target =
		ARM_CALLS.test(op) || ARM_REFERENCES.test(op) ? undefined : index.get(hex(ADDRESS.exec(operands(ins))?.[1] ?? ''));
	const taken = target === undefined ? [] : [target];
	return { next: op === 'b' ? taken : [...taken, at + 1], jump: false };
}

function armDispatch(body: readonly Instruction[], jump: number): boolean {
	const target = ARM_JUMP_REGISTER.exec(body[jump]!.ins)?.[1];
	let entry: string | undefined;
	for (let back = jump - 1; target !== undefined && back >= Math.max(0, jump - TABLE_REACH); back--) {
		const ins = body[back]!.ins;
		if (TAIL_OPS.test(mnemonic(ins)) || ARM_CALLS.test(mnemonic(ins)) || ARM_ENDS.test(mnemonic(ins))) return false;
		const text = operands(ins).replace(ARM_COMMENT, '');
		const written = armWritten(ins);
		if (entry === undefined) {
			if (!written.includes(target)) continue;
			const add = ARM_TABLE_ADD.exec(text);
			if (add?.[1] !== target) return false;
			entry = add[3]!;
		} else if (written.includes(entry)) {
			const load = ARM_TABLE_ENTRY.exec(text);
			return load !== null && armWide(load[1]!) === entry;
		}
	}
	return false;
}

const ARM64: Isa = {
	wide: armWide,
	written: armWritten,
	sets: armSets,
	flow: armFlow,
	branch: (ins) => {
		const call = ARM_CALL_REGISTER.exec(ins)?.[1];
		const jump = call ?? ARM_JUMP_REGISTER.exec(ins)?.[1];
		return jump === undefined ? undefined : { call: call !== undefined, register: jump };
	},
	table: () => undefined,
	dispatches: armDispatch
};

function held(isa: Isa, state: Held, ins: string): Held {
	const sets = isa.sets(state, ins);
	const clobbered = isa.written(ins);
	if (!sets.length && !clobbered.some((reg) => state.has(reg))) return state;
	const out = new Map(state);
	for (const reg of clobbered) out.delete(reg);
	for (const [reg, value] of sets) out.set(reg, value);
	return out;
}

function meet(a: Held | undefined, b: Held | undefined): Held | undefined {
	if (a === undefined) return b;
	if (b === undefined) return a;
	return new Map(
		[...a].filter(([reg, value]) => {
			const other = b.get(reg);
			return other?.kind === value.kind && other.at.join() === value.at.join();
		})
	);
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
	isa: Isa,
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
			const out = held(isa, meet(into[at], anywhere)!, body[at]!.ins);
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

function heldStates(isa: Isa, body: readonly Instruction[], image: Image): readonly Held[] {
	if (!body.some(({ ins }) => isa.branch(ins) !== undefined)) return [];
	const index = new Map(body.map(({ address }, at) => [address, at] as const));
	const direct = body.map(({ ins }, at) => isa.flow(ins, at, index));
	const jumps = direct.flatMap(({ jump }, at) => (jump ? [at] : []));
	const tables = jumps.flatMap((jump) => isa.table(body, jump) ?? []);
	const graph = (resolved: Tables) => direct.map(({ next }, at) => resolved.get(at) ?? next);
	const resolve = (into: readonly (Held | undefined)[]): Map<number, readonly number[]> =>
		new Map(
			tables.flatMap(({ jump, entry, base }) => {
				const value = single(into[entry]?.get(base), 'address');
				const targets = value === undefined ? [] : tableTargets(image, value, index);
				return targets.length ? [[jump, targets] as const] : [];
			})
		);
	const agrees = (a: Tables, b: Tables, jump: number): boolean => a.get(jump)?.join() === b.get(jump)?.join();
	let resolved: Tables = new Map();
	for (let round = 0; round < TABLE_ROUNDS; round++) {
		const found = resolve(solve(isa, body, graph(resolved), [0], []));
		if (found.size === resolved.size && [...found.keys()].every((jump) => agrees(found, resolved, jump))) break;
		resolved = found;
	}
	for (;;) {
		const next = graph(resolved);
		const entered = new Set(next.flat());
		const seeds = body.flatMap(({ ins }, at) => (at === 0 || (!entered.has(at) && !PADDING.test(mnemonic(ins))) ? [at] : []));
		const into = solve(isa, body, next, seeds, jumps.filter((jump) => !resolved.has(jump)));
		const confirmed = resolve(into);
		const kept = new Map([...resolved].filter(([jump]) => agrees(confirmed, resolved, jump)));
		if (kept.size === resolved.size) return into.map((state) => state ?? NOTHING_HELD);
		resolved = kept;
	}
}

function tlsDescriptor(body: readonly Instruction[], at: number): number | undefined {
	const ins = body[at]!.ins;
	const before = (back: number): string => body[at - back]?.ins ?? '';
	if (TLV_BRANCH.test(ins)) {
		const address = TLV_ADDRESS.exec(before(1));
		return address ? Number.parseInt(address[1]!, 16) : undefined;
	}
	const called = TLS_BRANCH.exec(ins)?.[1];
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

function targetOf(branch: Branch, value: Value | undefined, internal: ReadonlyMap<number, number>): Value | undefined {
	if (branch.displacement === undefined) return value;
	const slot = single(value, 'slot');
	const base = single(value, 'address') ?? (slot === undefined ? undefined : internal.get(slot));
	return base === undefined ? undefined : { kind: 'slot', at: [base + branch.displacement] };
}

function readBody(fn: Collected, listed: readonly Instruction[], image: Image, isa: Isa): void {
	const body = codeOf(listed);
	const holding = heldStates(isa, body, image);
	for (const [at, { address, ins }] of body.entries()) {
		if (fn.prologue.length < PROLOGUE_LENGTH) fn.prologue.push(ins);
		const site: Unresolved = { offset: address - fn.start, ins };
		const op = ins.split(' ', 1)[0]!;
		const rip = RIP_BRANCH.exec(ins);
		const branch = isa.branch(ins);
		const descriptor = tlsDescriptor(body, at);
		if (descriptor !== undefined) fn.descriptors.push([descriptor, site]);
		else if (rip) fn.slots.push([rip[1]!, hex(rip[2]!), site]);
		else if (branch) {
			const via = branch.call ? 'call' : 'jmp';
			const target = targetOf(branch, holding[at]?.get(isa.wide(branch.register)), image.internal);
			if (target?.kind === 'slot') fn.slots.push([via, target.at[0]!, site]);
			else if (target?.kind === 'address') {
				for (const to of target.at) fn.addresses.push([via, to, site]);
				if (target.at.length > 1) fn.selections.push([target.at, site]);
			} else (branch.call || !isa.dispatches(body, at) ? fn.unresolved : fn.jumps).push(site);
		} else if (OTHER_BRANCH.test(ins) && (ARM_CALLS.test(op) || ARM_JUMPS.test(op) || operands(ins).includes('*'))) {
			fn.unresolved.push(site);
		} else {
			const to = ins.endsWith('>') ? ADDRESS.exec(operands(ins)) : null;
			if (to) fn.targets.push([op, hex(to[1]!)]);
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
	let isa = X86;
	const collected = new Map<number, Collected>();
	const starts = new Map<string, number[]>();
	let current: Collected | undefined;
	let stubs = false;
	let body: Instruction[] = [];
	const flush = (): void => {
		if (current) readBody(current, body, image, isa);
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
			const name = header[2]!;
			current = collected.get(start);
			if (!current) {
				current = { name, start, prologue: [], targets: [], slots: [], addresses: [], descriptors: [], selections: [], unresolved: [], jumps: [] };
				collected.set(start, current);
				starts.set(name, [...(starts.get(name) ?? []), start]);
			}
			continue;
		}
		const format = FORMAT.exec(line);
		if (format) {
			arch = archOf(format[1]!);
			isa = arch === 'arm64' ? ARM64 : COFF_FORMAT.test(format[1]!) ? X86_MICROSOFT : X86;
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
	const functions = new Map<number, Disassembled>();
	for (const [start, { name, prologue, targets, slots: through, addresses, descriptors, selections, unresolved, jumps }] of collected) {
		const calls = new Set<number>();
		const tails = new Set<number>();
		const unread = [...unresolved];
		const edge = (op: string, callee: number): void => {
			if (callee === start || !collected.has(callee)) return;
			if (CALL_OPS.has(op)) calls.add(callee);
			else if (TAIL_OPS.test(op)) tails.add(callee);
		};
		for (const [op, callee] of targets) edge(op, callee);
		for (const [op, slot, at] of through) {
			const target = image.internal.get(slot);
			const held = target === undefined ? undefined : collected.get(target);
			const symbol = target === undefined ? image.symbols.get(slot) : held && HOST_STUB.exec(held.name)?.[1];
			if (symbol !== undefined) for (const callee of starts.get(symbol) ?? []) edge(op, callee);
			else if (held) edge(op, held.start);
			else unread.push(at);
		}
		for (const [op, address, at] of addresses) {
			if (collected.has(address)) edge(op, address);
			else unread.push(at);
		}
		for (const [slot, at] of descriptors) if (!image.tls.has(slot) && !image.threadLocal(slot)) unread.push(at);
		const selected = selections.flatMap(([at, site]) => {
			const named = at.flatMap((address) => collected.get(address)?.name ?? []);
			return named.length === at.length ? [{ ...site, targets: named }] : [];
		});
		functions.set(start, {
			name,
			frame: image.frames ? (image.frames.get(start) ?? RETURN_ADDRESS) : frameBytes(prologue, arch),
			calls,
			tails,
			unresolved: unread.sort((a, b) => a.offset - b.offset),
			selected,
			jumps
		});
	}
	return { arch, functions };
}

interface Option {
	readonly bytes: number;
	readonly callee: number;
	readonly tail: boolean;
}

class Costs {
	readonly cycles = new Set<number>();
	private readonly memo = new Map<number, number>();
	private readonly open = new Set<number>();

	constructor(
		private readonly dis: Disassembly,
		private readonly lead: ReadonlySet<number>,
		private readonly ends: (fn: number) => boolean,
		private readonly endCost: ((fn: number) => number) | undefined
	) {}

	private options(fn: number): { readonly own: number; readonly options: readonly Option[] } {
		const { frame: own, calls, tails } = this.dis.functions.get(fn)!;
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

	cost(fn: number): number {
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

	path(from: number): StackPath {
		const name = (fn: number): string => this.dis.functions.get(fn)!.name;
		const steps: StackStep[] = [];
		const seen = new Set<number>();
		let to: string | undefined;
		for (let fn: number | undefined = from; fn !== undefined && !seen.has(fn); ) {
			seen.add(fn);
			const { own, options } = this.options(fn);
			const best = options.reduce<Option | undefined>(
				(top, option) => (top && top.bytes >= option.bytes ? top : option),
				undefined
			);
			steps.push({ fn: name(fn), bytes: own, tail: best?.tail ?? false });
			fn = undefined;
			if (!best) break;
			if (!this.ends(best.callee)) fn = best.callee;
			else if (this.endCost) steps.push({ fn: name(best.callee), bytes: this.endCost(best.callee), tail: false });
			else to = name(best.callee);
		}
		return { bytes: this.cost(from), steps, to };
	}
}

function leadingTo(
	callers: ReadonlyMap<number, ReadonlySet<number>>,
	targets: Iterable<number>,
	passes: (fn: number) => boolean
): Set<number> {
	const seen = new Set<number>();
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

function reached(dis: Disassembly, starts: Iterable<number>, through: (fn: number) => boolean): Set<number> {
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

function costliest(costs: Costs, starts: readonly number[]): StackPath {
	const from = starts.reduce<number | undefined>(
		(top, fn) => (top !== undefined && costs.cost(top) >= costs.cost(fn) ? top : fn),
		undefined
	);
	return from === undefined ? { bytes: 0, steps: [], to: undefined } : costs.path(from);
}

export function encodeStack(dis: Disassembly, heights: ReadonlySet<string>): EncodeStack {
	const name = (fn: number): string => dis.functions.get(fn)!.name;
	const frame = (fn: number): number => dis.functions.get(fn)!.frame;
	const byName = (a: number, b: number): number => (name(a) < name(b) ? -1 : name(a) > name(b) ? 1 : a - b);
	const callers = new Map<number, Set<number>>();
	for (const [fn, { calls, tails }] of dis.functions) {
		for (const callee of [...calls, ...tails]) {
			const set = callers.get(callee) ?? new Set<number>();
			set.add(fn);
			callers.set(callee, set);
		}
	}
	const starts = [...dis.functions.keys()];
	const opens = (fn: number): boolean => heights.has(WHOLE.exec(name(fn))?.[1] ?? '');
	const fresh = (fn: number): boolean => LOOP.test(name(fn));
	const trivia = (fn: number): boolean => TRIVIA.test(name(fn));
	const entries = starts.filter(opens);
	const loops = starts.filter(fresh);
	const encoders = starts.filter(trivia);
	if (!entries.length || !loops.length || !encoders.length) {
		throw new Error(
			`the build names ${entries.length} whole encodes of a struct with a height, ${loops.length} encode loops and ${encoders.length} trivia encoders; it must name each`
		);
	}
	const cut = (fn: number): boolean => !fresh(fn) && !trivia(fn);
	const lead = leadingTo(callers, entries, cut);
	const levels = new Costs(dis, lead, opens, undefined);
	const level = costliest(levels, entries);
	if (levels.cycles.size)
		throw new Error(`calls cycle between levels through no struct with a height: ${[...levels.cycles].map(name).join(', ')}`);
	const below = new Costs(dis, lead, opens, frame);
	const tripLead = leadingTo(callers, encoders, (fn) => cut(fn) && !opens(fn));
	const trips = new Costs(dis, tripLead, trivia, (fn) => below.cost(fn));
	const tripStarts = entries.filter((fn) => {
		const { calls, tails } = dis.functions.get(fn)!;
		return [...calls, ...tails].some((callee) => tripLead.has(callee) || trivia(callee));
	});
	const toWhole = leadingTo(callers, entries, (fn) => !opens(fn) && !trivia(fn));
	const roots = [...toWhole].filter((fn) => !callers.get(fn)?.size);
	const unknown = roots.filter((fn) => !CALLBACK.test(name(fn)));
	if (unknown.length) throw new Error(`no known caller and no napi callback leads to ${unknown.map(name).join(', ')}`);
	const aboveCosts = new Costs(dis, toWhole, opens, undefined);
	const above = costliest(aboveCosts, roots);
	if (aboveCosts.cycles.size)
		throw new Error(`calls cycle above the first whole encode: ${[...aboveCosts.cycles].map(name).join(', ')}`);
	const trip = costliest(trips, tripStarts);
	const measured = new Set([
		...reached(dis, entries, (fn) => lead.has(fn) || opens(fn)),
		...reached(dis, tripStarts, (fn) => tripLead.has(fn) || trivia(fn) || lead.has(fn) || opens(fn)),
		...reached(dis, roots, (fn) => toWhole.has(fn) || opens(fn))
	]);
	const unresolved = [...measured]
		.sort(byName)
		.flatMap((fn) => dis.functions.get(fn)!.unresolved.map((at) => ({ fn: name(fn), ...at })));
	const extent = reached(
		dis,
		[...measured].filter((fn) => !roots.includes(fn)),
		() => true
	);
	const refuted = DYNAMIC_CLASSES.flatMap((known) => {
		const by = known.refutedBy && [...dis.functions.values()].find((fn) => known.refutedBy!.test(fn.name))?.name;
		return by ? [{ class: known, by }] : [];
	});
	const holding = DYNAMIC_CLASSES.filter((known) => !refuted.some((r) => r.class === known));
	const classOf = (fn: number, entering: ReadonlySet<number> = new Set()): DynamicClass | undefined => {
		if (!OUTLINED.test(name(fn))) return holding.find((c) => c.within.test(name(fn)));
		if (entering.has(fn)) return undefined;
		const within = new Set([...entering, fn]);
		const classes = [...(callers.get(fn) ?? [])].map((caller) => classOf(caller, within));
		return classes.length && classes.every((c) => c !== undefined && c === classes[0]) ? classes[0] : undefined;
	};
	const outside = [...extent]
		.filter((fn) => !measured.has(fn))
		.sort(byName)
		.flatMap((fn) => {
			const known = classOf(fn);
			return dis.functions.get(fn)!.unresolved.map((at) => ({ fn: name(fn), ...at, class: known }));
		});
	const selected = [...new Set([...measured, ...extent])]
		.sort(byName)
		.flatMap((fn) => dis.functions.get(fn)!.selected.map((at) => ({ fn: name(fn), ...at })));
	return { level, above, trivia: trip, oneTime: above.bytes + trip.bytes, unresolved, reached: outside, selected, refuted };
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

async function listed(objdump: string, file: string, image: Image): Promise<Disassembly> {
	const listing = objdumpOf(objdump, ['-d', '-C', '--no-show-raw-insn', file]);
	const dis = await disassemble(listing.lines, image);
	const code = await listing.exited;
	if (code !== 0) throw new Error(`${objdump} exited ${code} disassembling ${file}`);
	return dis;
}

async function disassembleAddon(objdump: string, addon: string, map: string): Promise<Disassembly> {
	const bytes = readFileSync(addon);
	if (imageOf(bytes).frames) {
		if (!existsSync(map))
			throw new Error(`${addon} is a PE image, named by its linker map, and ${map} is missing: build it with scripts/build-native.mts --release`);
		const scratch = mkdtempSync(join(tmpdir(), 'encode-stack-'));
		try {
			const named = join(scratch, basename(addon));
			writeFileSync(named, namedCopy(bytes, readFileSync(map, 'latin1')));
			return await listed(objdump, named, { ...peSlots(bytes), ...imageOf(bytes) });
		} finally {
			rmSync(scratch, { recursive: true, force: true });
		}
	}
	const relocations = objdumpOf(objdump, ['-R', '-C', addon]);
	const relocated: string[] = [];
	for await (const line of relocations.lines) relocated.push(line);
	await relocations.exited;
	return listed(objdump, addon, { ...gotSlots(relocated), ...imageOf(bytes) });
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
		const stack = encodeStack(await disassembleAddon(objdump, addon, native.linkerMapOf(addon)), heights);
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
			for (const { fn, offset, ins, targets } of stack.selected)
				console.log(`  picked call ${short(fn)}+0x${offset.toString(16)}: ${ins}, read as ${targets.map(short).join(' or ')}`);
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
