import { readFileSync, writeFileSync } from 'node:fs';
import { bindingIssues, compileQuery } from './bindings.ts';
import {
	type BindingsOverlay,
	type Derivation,
	type GrammarInput,
	type NodeModelRecord,
	type OverlayReport,
	bindingGrammars,
	bindingsModulePath,
	bindingsPath,
	camel,
	derive,
	deriveOverlay,
	grammarBindingsHash,
	grammarInput,
	printBindingsModule,
	readBindings,
	VOCABULARY_DIR
} from '@sittir/codegen/bindings';
import { type Vocabulary, readVocabulary } from './vocabulary.ts';
import type { GrammarName } from '@sittir/codegen/grammars';
import { evaluateGrammar } from '../codegen-surface.ts';
import { readNodeModelFile } from '../validate/common.ts';

export { VOCABULARY_DIR };
export interface BindingsInventoryOptions {
	readonly grammars?: readonly GrammarName[];
	readonly check?: boolean;
	readonly members?: boolean;
	readonly write?: boolean;
}

export interface CompileReport {
	readonly grammar: string;
	readonly patterns: number;
	readonly error: string | null;
}

export async function compileBindings(grammars: readonly GrammarName[]): Promise<CompileReport[]> {
	const out: CompileReport[] = [];
	for (const grammar of grammars) {
		const text = readFileSync(bindingsPath(grammar), 'utf8');
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

export async function loadInputs(grammars: readonly GrammarName[]): Promise<GrammarInput[]> {
	return Promise.all(
		grammars.map(async (grammar) => {
			const record = readNodeModelFile(grammar);
			if (record === undefined) throw new Error(`bindings-inventory: no node model for ${grammar}`);
			const input = await grammarInput(grammar, await evaluateGrammar(grammar), JSON.parse(record) as NodeModelRecord);
			if (input === undefined) throw new Error(`bindings-inventory: ${grammar} has no bindings.scm`);
			return input;
		})
	);
}

export interface BindingsModule {
	readonly text: string;
	readonly overlay: BindingsOverlay;
	readonly report: OverlayReport;
}

export function vocabularyMembers(vocabulary: Vocabulary): ReadonlyMap<string, ReadonlySet<string>> {
	return new Map([...vocabulary.kinds.keys()].map((path) => [path, new Set(vocabulary.members(path).keys())]));
}

export async function bindingsModule(grammar: GrammarName): Promise<BindingsModule> {
	const facts = await readBindings(readFileSync(bindingsPath(grammar), 'utf8'));
	const base = await evaluateGrammar(grammar, { unbound: true });
	const { overlay, report } = deriveOverlay({ grammar, facts, base, vocabMembers: vocabularyMembers(readVocabulary(VOCABULARY_DIR)) });
	return { text: printBindingsModule(overlay, grammarBindingsHash(grammar)), overlay, report };
}

export function overlaySummary(grammar: string, { overlay, report }: Omit<BindingsModule, 'text'>): string {
	const pct = (n: number, d: number): string => `${n}/${d} (${d === 0 ? 0 : Math.round((1000 * n) / d) / 10} %)`;
	const sites = [...overlay.patches.values()].flat(2).length;
	const lines = [
		`${grammar}: ${Object.keys(overlay.renames).length} renames, ${Object.keys(report.aliases).length} aliases, ${report.fieldRenames.length} field renames, ${report.fieldWraps.length} field wraps, ${overlay.splits.length} splits, ${sites} patch sites (${overlay.patches.size} rules)`,
		`  claims realized as kinds ${pct(report.realizedKinds.length + report.realizedByParent.length, report.claims)} (${report.realizedByParent.length} by the parent)`,
		`  members realized as field names ${pct(report.realizedMembers.length, report.members)}; implicit routes fielded ${report.implicitMembers.length}${report.implicitMembers.length > 0 ? ` (${report.implicitMembers.join(', ')})` : ''}`
	];
	const byCause = new Map<string, string[]>();
	for (const r of report.residue) (byCause.get(r.cause) ?? byCause.set(r.cause, []).get(r.cause)!).push(r.row);
	for (const [cause, rows] of [...byCause].sort((a, b) => b[1].length - a[1].length)) {
		lines.push(`  residue ${String(rows.length).padStart(3)}  ${cause}: ${rows.slice(0, 4).join('; ')}${rows.length > 4 ? '; …' : ''}`);
	}
	return lines.join('\n');
}

export async function deriveVocabulary(grammars: readonly GrammarName[] = bindingGrammars()): Promise<Derivation> {
	return derive(await loadInputs(grammars));
}

export function vocabularyDisagreements(d: Derivation, vocabulary: Vocabulary): string[] {
	const out: string[] = [];
	for (const v of d.allvocab) {
		if (!vocabulary.kinds.has(v)) out.push(`${v}: claimed, but no vocabulary interface has this kind`);
	}
	const undeclared = (v: string, member: string, how: string): void => {
		if (vocabulary.kinds.has(v) && !vocabulary.members(v).has(member)) out.push(`${v}.${member}: ${how}, but its interface does not declare it`);
	};
	for (const [v, members] of d.members) {
		for (const member of members.keys()) undeclared(v, member, 'routed');
	}
	for (const [v, refinement] of d.refinements) {
		for (const field of refinement.literals.keys()) undeclared(v, camel(field), 'pinned');
	}
	for (const [v, holes] of d.holes) {
		for (const hole of holes.keys()) undeclared(v, hole, 'templated');
	}
	return out.sort();
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
	lines.push(
		`container captures with no direct target ${d.untargeted.length === 0 ? 'none' : `${d.untargeted.join('; ')}: claim each container as a vocabulary kind of its own`}`
	);
	lines.push(
		`container slots left uncaptured ${d.uncaptured.length === 0 ? 'none' : `${d.uncaptured.join('; ')}: capture each slot, or mark it @dropped with its reason`}`
	);
	if (d.unknownPredicates.length > 0)
		lines.push(`predicates with an operator the derivation does not know ${d.unknownPredicates.join('; ')}`);
	if (d.wildcardContainers.length > 0)
		lines.push(`wildcard claims that land on a list or container, not on its members ${d.wildcardContainers.join('; ')}`);
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
	const grammars = opts.grammars ?? bindingGrammars();
	let code = 0;
	if (opts.write) {
		for (const grammar of grammars) {
			const module = await bindingsModule(grammar);
			writeFileSync(bindingsModulePath(grammar), module.text);
			process.stdout.write(`${overlaySummary(grammar, module)}\n`);
		}
	}
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
	if (opts.check) {
		const disagreements = vocabularyDisagreements(d, readVocabulary(VOCABULARY_DIR));
		if (disagreements.length > 0) code = 1;
		process.stdout.write(
			`bindings and vocabulary: ${disagreements.length === 0 ? 'agree' : `${disagreements.length} disagreements\n  ${disagreements.join('\n  ')}`}\n`
		);
	}
	if (d.cycles.length > 0 || d.untargeted.length > 0 || d.uncaptured.length > 0 || d.unknownPredicates.length > 0 || d.wildcardContainers.length > 0)
		code = 1;
	return code;
}
