import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { bindingIssues, compileQuery, readBindings } from './bindings.ts';
import { loadSlotModel } from './model.ts';
import { type Derivation, type GrammarInput, type LayoutSlot, bindingsPath, camel, derive } from '@sittir/codegen/bindings';
import { type Vocabulary, readVocabulary } from './vocabulary.ts';
import { allGrammars, type GrammarName } from '@sittir/codegen/grammars';
import { evaluateGrammar, load, type RawGrammar } from '../codegen-surface.ts';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
export const VOCABULARY_DIR = join(ROOT, 'packages', 'types', 'src', 'vocabulary');
export function inventoryGrammars(): readonly GrammarName[] {
	return allGrammars().filter((g) => existsSync(bindingsPath(g)));
}

export interface BindingsInventoryOptions {
	readonly grammars?: readonly GrammarName[];
	readonly check?: boolean;
	readonly members?: boolean;
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

async function layoutSlots(raw: RawGrammar, kinds: ReadonlySet<string>): Promise<LayoutSlot[]> {
	const [{ readOptionsBlock }, { parsePreferencePath }, { SEPARATOR_LABEL }] = await Promise.all([
		load('optionsBlock'),
		load('preferencePath'),
		load('spacing')
	]);
	const optionSites = readOptionsBlock(raw.options ?? {}, kinds).bindings.flatMap(({ address }): LayoutSlot[] => {
		const [owner, slot, ...rest] = parsePreferencePath(address);
		if (rest.length > 0 || slot?.kind !== 'fieldName') return [];
		if (owner?.kind === 'wildcard') return [{ kind: null, slot: slot.name }];
		return owner?.kind === 'name' ? [{ kind: owner.name, slot: slot.name }] : [];
	});
	return [...optionSites, { kind: null, slot: SEPARATOR_LABEL }];
}

export async function loadInputs(grammars: readonly GrammarName[]): Promise<GrammarInput[]> {
	return Promise.all(
		grammars.map(async (grammar) => {
			const raw = await evaluateGrammar(grammar);
			const model = loadSlotModel(grammar);
			return {
				grammar,
				bindings: readBindings(readFileSync(bindingsPath(grammar), 'utf8')),
				model,
				textTokens: new Set(raw.textTokens ?? []),
				layoutSlots: await layoutSlots(raw, new Set(model.keys()))
			};
		})
	);
}

export async function deriveVocabulary(grammars: readonly GrammarName[] = inventoryGrammars()): Promise<Derivation> {
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
	if (opts.check) {
		const disagreements = vocabularyDisagreements(d, readVocabulary(VOCABULARY_DIR));
		if (disagreements.length > 0) code = 1;
		process.stdout.write(
			`bindings and vocabulary: ${disagreements.length === 0 ? 'agree' : `${disagreements.length} disagreements\n  ${disagreements.join('\n  ')}`}\n`
		);
	}
	if (d.cycles.length > 0 || d.untargeted.length > 0 || d.uncaptured.length > 0 || d.unknownPredicates.length > 0) code = 1;
	return code;
}
