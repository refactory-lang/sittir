import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { bindingIssues, compileQuery, readBindings } from './bindings.ts';
import { loadSlotModel } from './model.ts';
import { type Derivation, type GrammarInput, derive } from './derive.ts';
import { indexFile, renderVocabularyFile, vocabularyFiles } from './emit.ts';
import { allGrammars, grammarPackageDir, type GrammarName } from '@sittir/codegen/grammars';
import { evaluateGrammar } from '../codegen-surface.ts';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
export const VOCABULARY_DIR = join(ROOT, 'packages', 'types', 'src', 'vocabulary');
export function inventoryGrammars(): readonly GrammarName[] {
	return allGrammars().filter((g) => existsSync(join(grammarPackageDir(g), 'bindings.scm')));
}

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
		const text = readFileSync(join(grammarPackageDir(grammar), 'bindings.scm'), 'utf8');
		try {
			const compiled = await compileQuery(grammar, text);
			out.push({ grammar, patterns: compiled.patterns, error: null });
		} catch (e) {
			const issues = await bindingIssues(grammar, text);
			const error =
				issues.length > 0
					? issues.map((issue) => `line ${issue.line}: ${issue.message}`).join('\n  ')
					: e instanceof Error
						? e.message
						: String(e);
			out.push({ grammar, patterns: 0, error });
		}
	}
	return out;
}

export async function loadInputs(grammars: readonly string[]): Promise<GrammarInput[]> {
	return Promise.all(
		grammars.map(async (grammar) => ({
			grammar,
			bindings: readBindings(readFileSync(join(grammarPackageDir(grammar), 'bindings.scm'), 'utf8')),
			model: loadSlotModel(grammar),
			textTokens: new Set((await evaluateGrammar(grammar)).textTokens ?? [])
		}))
	);
}

export async function deriveVocabulary(grammars: readonly string[] = inventoryGrammars()): Promise<Derivation> {
	return derive(await loadInputs(grammars));
}

export async function emitVocabulary(d: Derivation, outDir: string): Promise<string[]> {
	mkdirSync(outDir, { recursive: true });
	const files = vocabularyFiles(d);
	const written: string[] = [];
	for (const file of [...files, indexFile(files)]) {
		const path = join(outDir, `${file.name}.ts`);
		writeFileSync(path, renderVocabularyFile(file));
		written.push(path);
	}
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
	const grammars = opts.grammars ?? inventoryGrammars();
	let code = 0;
	if (opts.check) {
		for (const report of await compileBindings(grammars)) {
			if (report.error !== null) {
				code = 1;
				process.stdout.write(`${report.grammar}: bindings.scm does not compile:\n  ${report.error}\n`);
			} else process.stdout.write(`${report.grammar}: bindings.scm compiles, ${report.patterns} patterns\n`);
		}
	}
	const d = await deriveVocabulary(grammars);
	process.stdout.write(`${summarize(d)}\n`);
	if (opts.members) process.stdout.write(`${membersTable(d)}\n`);
	if (opts.emit !== undefined) {
		const outDir = opts.emit === true ? VOCABULARY_DIR : opts.emit;
		const written = await emitVocabulary(d, outDir);
		process.stdout.write(`emitted ${written.length} files into ${outDir}\n`);
	}
	if (d.cycles.length > 0) code = 1;
	return code;
}
