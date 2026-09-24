import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { compileQuery, parseQuery } from './query.ts';
import { loadSlotModel } from './model.ts';
import { type Derivation, type GrammarInput, derive } from './derive.ts';
import { renderIndexFile, renderVocabularyFile, vocabularyFiles } from './emit.ts';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
export const VOCABULARY_DIR = join(ROOT, 'packages', 'types', 'src', 'vocabulary');
export const INVENTORY_GRAMMARS = ['python', 'typescript', 'rust'] as const;

export interface BindingsInventoryOptions {
	readonly grammars?: readonly string[];
	readonly emit?: string | true;
	readonly check?: boolean;
	readonly members?: boolean;
}

export interface CompileReport {
	readonly grammar: string;
	readonly patterns: number;
	readonly error: string | null;
}

export async function compileBindings(grammars: readonly string[]): Promise<CompileReport[]> {
	const out: CompileReport[] = [];
	for (const grammar of grammars) {
		const text = readFileSync(join(ROOT, 'packages', grammar, 'bindings.scm'), 'utf8');
		try {
			const compiled = await compileQuery(grammar, text);
			out.push({ grammar, patterns: compiled.patterns, error: null });
		} catch (e) {
			out.push({ grammar, patterns: 0, error: e instanceof Error ? e.message : String(e) });
		}
	}
	return out;
}

export function loadInputs(grammars: readonly string[]): GrammarInput[] {
	return grammars.map((grammar) => ({
		grammar,
		patterns: parseQuery(readFileSync(join(ROOT, 'packages', grammar, 'bindings.scm'), 'utf8')),
		model: loadSlotModel(grammar)
	}));
}

export function deriveVocabulary(grammars: readonly string[] = INVENTORY_GRAMMARS): Derivation {
	return derive(loadInputs(grammars));
}

export function emitVocabulary(d: Derivation, outDir: string): string[] {
	mkdirSync(outDir, { recursive: true });
	const files = vocabularyFiles(d);
	const written: string[] = [];
	for (const file of files) {
		const path = join(outDir, `${file.name}.ts`);
		writeFileSync(path, renderVocabularyFile(file));
		written.push(path);
	}
	const index = join(outDir, 'index.ts');
	writeFileSync(index, renderIndexFile(files));
	written.push(index);
	execFileSync('pnpm', ['exec', 'oxfmt', ...written], { cwd: ROOT, stdio: 'pipe' });
	return written;
}

export function summarize(d: Derivation): string {
	const lines: string[] = [];
	const total = [...d.unmapped.values()].reduce((a, b) => a + b, 0);
	lines.push(
		`vocab kinds ${d.allvocab.size}, prefixes ${d.prefixes.size}, content-derived ${d.contentDerived.size}, members ${[...d.members.values()].reduce((a, m) => a + m.size, 0)}`
	);
	lines.push(
		`refinements ${d.refinements.size}, unmapped references ${total} over ${d.unmapped.size} kinds, set-inclusion cycles ${d.cycles.length === 0 ? 'none' : d.cycles.join('; ')}`
	);
	const top = [...d.unmapped].sort((a, b) => b[1] - a[1]).slice(0, 12);
	if (top.length > 0) lines.push(`  ${top.map(([k, n]) => `${k.slice(1, -1)}×${n}`).join(' ')}`);
	return lines.join('\n');
}

export function membersTable(d: Derivation): string {
	const lines: string[] = [];
	for (const v of [...d.members.keys()].sort()) {
		const claimers = d.claimers.get(v) ?? new Set();
		if (claimers.size < 2 || d.refinements.has(v)) continue;
		lines.push(
			`${v} [${[...claimers]
				.map((g) => g.charAt(0))
				.sort()
				.join('')}]`
		);
		for (const [cm, f] of [...(d.members.get(v) ?? [])].sort(([a], [b]) => a.localeCompare(b))) {
			const tag = [...f.grammars]
				.map((g) => g.charAt(0))
				.sort()
				.join('');
			const mark = [...f.grammars].sort().join() === [...claimers].sort().join() ? '' : '*';
			lines.push(`  ${cm}(${tag})${mark}: ${[...f.kinds].sort().join(' | ')}`);
		}
	}
	return lines.join('\n');
}

export async function run(opts: BindingsInventoryOptions): Promise<number> {
	const grammars = opts.grammars ?? INVENTORY_GRAMMARS;
	let code = 0;
	if (opts.check) {
		for (const report of await compileBindings(grammars)) {
			if (report.error !== null) {
				code = 1;
				process.stdout.write(`${report.grammar}: bindings.scm does not compile: ${report.error}\n`);
			} else process.stdout.write(`${report.grammar}: bindings.scm compiles, ${report.patterns} patterns\n`);
		}
	}
	const d = deriveVocabulary(grammars);
	process.stdout.write(`${summarize(d)}\n`);
	if (opts.members) process.stdout.write(`${membersTable(d)}\n`);
	if (opts.emit !== undefined) {
		const outDir = opts.emit === true ? VOCABULARY_DIR : opts.emit;
		const written = emitVocabulary(d, outDir);
		process.stdout.write(`emitted ${written.length} files into ${outDir}\n`);
	}
	if (d.cycles.length > 0) code = 1;
	return code;
}
