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

export interface Disassembled {
	readonly prologue: readonly string[];
	readonly calls: ReadonlySet<string>;
	readonly tails: ReadonlySet<string>;
}

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

export interface EncodeStack {
	readonly level: StackPath;
	readonly above: StackPath;
	readonly entry: StackPath;
	readonly trivia: StackPath;
	readonly oneTime: number;
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
const TRIVIA = /^<(?:\w+::)*Vec<sittir_core::trivia::TriviaEntry</;
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

const HEADER = /^[0-9a-f]+ <(.*)>:$/;
const FORMAT = /file format (.+)$/;

interface Collected {
	readonly prologue: string[];
	readonly targets: (readonly [string, string])[];
}

function archOf(format: string): Arch | undefined {
	if (/x86[-_]64/.test(format)) return 'x86_64';
	if (/arm64|aarch64/.test(format)) return 'arm64';
	return undefined;
}

export async function disassemble(lines: AsyncIterable<string> | Iterable<string>): Promise<Disassembly> {
	let arch: Arch | undefined;
	const collected = new Map<string, Collected>();
	let current: Collected | undefined;
	for await (const line of lines) {
		const header = HEADER.exec(line);
		if (header) {
			current = collected.get(header[1]!) ?? { prologue: [], targets: [] };
			collected.set(header[1]!, current);
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
			.trim();
		if (!ins) continue;
		if (current.prologue.length < PROLOGUE_LENGTH) current.prologue.push(ins);
		const at = ins.indexOf(' <');
		if (at > 0 && ins.endsWith('>')) current.targets.push([ins.split(' ', 1)[0]!, ins.slice(at + 2, -1)]);
	}
	if (!arch) throw new Error('the disassembly names no x86-64 or arm64 file format');
	const functions = new Map<string, Disassembled>();
	for (const [name, { prologue, targets }] of collected) {
		const calls = new Set<string>();
		const tails = new Set<string>();
		for (const [op, callee] of targets) {
			if (callee === name || OFFSET.test(callee) || !collected.has(callee)) continue;
			if (CALL_OPS.has(op)) calls.add(callee);
			else if (TAIL_OPS.test(op)) tails.add(callee);
		}
		functions.set(name, { prologue, calls, tails });
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
	const levels = new Costs(dis, frame, leadingTo(callers, entries, cut), opens, undefined);
	const level = costliest(levels, entries);
	const entry = costliest(levels, loops);
	if (levels.cycles.size)
		throw new Error(`calls cycle between levels through no struct with a height: ${[...levels.cycles].join(', ')}`);
	const below = new Costs(dis, frame, leadingTo(callers, entries, cut), opens, frame);
	const tripLead = leadingTo(callers, encoders, (fn) => cut(fn) && !opens(fn));
	const trips = new Costs(dis, frame, tripLead, trivia, (fn) => below.cost(fn));
	const tripStarts = entries.filter((fn) => {
		const { calls, tails } = dis.functions.get(fn)!;
		return [...calls, ...tails].some((callee) => tripLead.has(callee) || trivia(callee));
	});
	const upward = leadingTo(callers, loops, (fn) => !opens(fn) && !trivia(fn));
	const roots = [...upward].filter((fn) => !callers.get(fn)?.size);
	const above = costliest(new Costs(dis, frame, upward, fresh, undefined), roots);
	const trip = costliest(trips, tripStarts);
	return { level, above, entry, trivia: trip, oneTime: above.bytes + entry.bytes + trip.bytes };
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

async function disassembleAddon(objdump: string, addon: string): Promise<Disassembly> {
	const child = spawn(objdump, ['-d', '-C', '--no-show-raw-insn', addon], { stdio: ['ignore', 'pipe', 'inherit'] });
	const exited = new Promise<number>((resolve, reject) => {
		child.once('error', reject);
		child.once('close', (code) => resolve(code ?? 1));
	});
	const dis = await disassemble(createInterface({ input: child.stdout, crlfDelay: Infinity }));
	const code = await exited;
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
			console.log(
				`${fits ? 'ok' : 'OVER'} ${grammar} ${basename(addon)}: ${bounds.limit} × ${stack.level.bytes} + ${stack.oneTime} = ${total} of ${bounds.budget} (largest limit ${largest})`
			);
			if (fits && !opts.paths) continue;
			for (const line of [
				...describe('level', stack.level),
				...describe('above the loop', stack.above),
				...describe('loop entry', stack.entry),
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
	return over.length ? 1 : 0;
}
