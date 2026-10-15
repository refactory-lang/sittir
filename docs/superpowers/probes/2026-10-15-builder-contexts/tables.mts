// The kinds-only context tables, run over sittir's own parse trees. It checks three things:
// - every requiring kind, providing slot and bounding slot exists in the grammar sittir generates
//   (a prototype of the declaration's diagnostics);
// - which of the census's early-error witnesses the tables refuse (coverage);
// - that no valid corpus entry is refused (soundness: a missing kind may cost a refusal, never a
//   false one).
// The masks follow the spec: a slot's contribution is the children's needs less what the slot
// provides; a bounding slot refuses what is left; unmet needs are carried up; the root bounds every
// context it does not provide.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../../..');
const toolsRequire = createRequire(join(ROOT, 'packages/tools/package.json'));
const { Parser, Language } = toolsRequire('web-tree-sitter') as typeof import('web-tree-sitter');
const { loadCorpusEntries } = (await import(join(ROOT, 'packages/tools/src/validate/common.ts'))) as {
	loadCorpusEntries(grammar: string): { name: string; source: string }[];
};
const { judges, removeScratch } = await import('../2026-10-15-grammar-over-acceptance/judges.mts');
await Parser.init();

// The vocabulary's context terms, in bit order.
const TERMS = ['Break', 'Continue', 'Return', 'Await', 'Yield', 'NewTarget', 'Abstract', 'Visibility', 'Receiver', 'Variadic', 'Nonlocal'] as const;
type Term = (typeof TERMS)[number];
type Slot = readonly [kind: string, slot: string];
interface Rule { requiredBy: readonly string[]; providedAt: readonly Slot[]; boundedAt: readonly Slot[] }
interface Table { root: string; contexts: Partial<Record<Term, Rule>> }

const ts = (): Table => {
	const loops: Slot[] = [['for_statement', 'body'], ['for_in_statement', 'body'], ['while_statement', 'body'], ['do_statement', 'body']];
	const functionBodies: Slot[] = ['function_declaration', 'function_expression', 'generator_function_declaration', 'generator_function', 'method_definition'].map((k) => [k, 'body'] as const);
	const arrowBody: Slot[] = [['arrow_function', 'body']];
	const classBodies: Slot[] = [['class_body', 'members'], ['class_static_block', 'body']];
	const bounds = [...functionBodies, ...arrowBody, ...classBodies];
	return {
		root: 'program',
		contexts: {
			Break: { requiredBy: ['break_statement'], providedAt: [...loops, ['switch_statement', 'body'], ['labeled_statement', 'body']], boundedAt: bounds },
			Continue: { requiredBy: ['continue_statement'], providedAt: loops, boundedAt: bounds },
			Return: { requiredBy: ['return_statement'], providedAt: [...functionBodies, ...arrowBody], boundedAt: classBodies },
			Await: { requiredBy: ['await_expression'], providedAt: [...functionBodies, ...arrowBody, ['program', 'statements']], boundedAt: classBodies },
			Yield: {
				requiredBy: ['yield_expression'],
				providedAt: [['generator_function_declaration', 'body'], ['generator_function', 'body'], ['method_definition', 'body']],
				boundedAt: [['function_declaration', 'body'], ['function_expression', 'body'], ...arrowBody, ...classBodies]
			},
			NewTarget: { requiredBy: ['meta_property_new_target'], providedAt: [...functionBodies, ...classBodies], boundedAt: [] },
			Abstract: { requiredBy: ['abstract_method_signature'], providedAt: [['abstract_class_declaration', 'body']], boundedAt: [['class_declaration', 'body'], ['class', 'body']] },
			Visibility: {
				requiredBy: ['accessibility_modifier'],
				providedAt: [
					...['method_definition', 'public_field_definition', 'method_signature', 'abstract_method_signature', 'property_signature'].map((k) => [k, 'accessibility_modifier'] as const),
					['method_definition', 'parameters']
				],
				boundedAt: []
			}
		}
	};
};

const py = (): Table => {
	const loops: Slot[] = [['for_statement', 'body'], ['while_statement', 'body']];
	const scopes: Slot[] = [['function_definition', 'body'], ['class_definition', 'body']];
	const comprehensions: Slot[] = ['list_comprehension', 'set_comprehension', 'dictionary_comprehension', 'generator_expression'].map((k) => [k, 'body'] as const);
	return {
		root: 'module',
		contexts: {
			Break: { requiredBy: ['break_statement'], providedAt: loops, boundedAt: scopes },
			Continue: { requiredBy: ['continue_statement'], providedAt: loops, boundedAt: scopes },
			Return: { requiredBy: ['return_statement'], providedAt: [['function_definition', 'body']], boundedAt: [['class_definition', 'body']] },
			Await: { requiredBy: ['await'], providedAt: [['function_definition', 'body']], boundedAt: [['lambda', 'body'], ['class_definition', 'body']] },
			Yield: { requiredBy: ['yield'], providedAt: [['function_definition', 'body'], ['lambda', 'body']], boundedAt: [['class_definition', 'body'], ...comprehensions] },
			Nonlocal: { requiredBy: ['nonlocal_statement'], providedAt: [['function_definition', 'body']], boundedAt: [] }
		}
	};
};

const rs = (): Table => {
	const loops: Slot[] = [['loop_expression', 'body'], ['while_expression', 'body'], ['for_expression', 'body']];
	const bodies: Slot[] = [['function_item', 'body'], ['closure_expression_block', 'body'], ['closure_expression_expr', 'body'], ['async_block', 'body']];
	const constants: Slot[] = [['const_item', 'value'], ['static_item', 'value']];
	return {
		root: 'source_file',
		contexts: {
			Continue: { requiredBy: ['continue_expression'], providedAt: loops, boundedAt: [...bodies, ...constants] },
			Return: { requiredBy: ['return_expression'], providedAt: bodies, boundedAt: constants },
			Await: { requiredBy: ['await_expression'], providedAt: bodies, boundedAt: constants },
			Receiver: { requiredBy: ['self_parameter'], providedAt: [['impl_item_body', 'body'], ['trait_item', 'body']], boundedAt: [['function_item', 'body']] },
			Variadic: { requiredBy: ['variadic_parameter'], providedAt: [['foreign_mod_item_body', 'body'], ['function_type', 'parameters']], boundedAt: [] },
			Visibility: { requiredBy: ['visibility_modifier'], providedAt: [['block', 'statements'], ['source_file', 'statements']], boundedAt: [['trait_item', 'body'], ['enum_variant_list', 'elements']] }
		}
	};
};

const TABLES: Record<string, Table> = { typescript: ts(), python: py(), rust: rs() };
const bit = (t: Term) => 1 << TERMS.indexOf(t);
const names = (mask: number) => TERMS.filter((t) => mask & bit(t)).join('|');

interface Compiled { requires: Map<string, number>; provides: Map<string, number>; bounds: Map<string, number>; root: string; rootProvides: number }
function compile(table: Table): Compiled {
	const c: Compiled = { requires: new Map(), provides: new Map(), bounds: new Map(), root: table.root, rootProvides: 0 };
	const or = (m: Map<string, number>, k: string, b: number) => m.set(k, (m.get(k) ?? 0) | b);
	for (const [term, rule] of Object.entries(table.contexts) as [Term, Rule][]) {
		for (const k of rule.requiredBy) or(c.requires, k, bit(term));
		for (const [k, s] of rule.providedAt) {
			or(c.provides, `${k}.${s}`, bit(term));
			if (k === table.root) c.rootProvides |= bit(term);
		}
		for (const [k, s] of rule.boundedAt) or(c.bounds, `${k}.${s}`, bit(term));
	}
	return c;
}

// The declaration diagnostics, against the grammar sittir generates.
function validate(grammar: string, table: Table): string[] {
	const rules = JSON.parse(readFileSync(join(ROOT, `packages/${grammar}/.sittir/src/grammar.json`), 'utf8')).rules as Record<string, unknown>;
	const fieldsOf = (kind: string): Set<string> => {
		const out = new Set<string>();
		const seen = new Set<string>();
		const walk = (x: any): void => {
			if (x === null || typeof x !== 'object') return;
			if (x.type === 'FIELD') out.add(x.name);
			if (x.type === 'SYMBOL' && x.name.startsWith('_') && !seen.has(x.name) && rules[x.name]) {
				seen.add(x.name);
				walk(rules[x.name]);
			}
			if (x.content) walk(x.content);
			for (const m of x.members ?? []) walk(m);
		};
		walk(rules[kind]);
		return out;
	};
	const problems: string[] = [];
	const visible = (k: string) => rules[k] !== undefined && !k.startsWith('_');
	for (const [term, rule] of Object.entries(table.contexts) as [Term, Rule][]) {
		for (const k of rule.requiredBy) if (!visible(k)) problems.push(`context-unknown-kind ${term} requiredBy ${k}`);
		for (const [k, s] of [...rule.providedAt, ...rule.boundedAt]) {
			if (!visible(k)) problems.push(`context-unknown-kind ${term} ${k}`);
			else if (!fieldsOf(k).has(s)) problems.push(`context-unknown-slot ${term} ${k}.${s}`);
		}
		const both = rule.providedAt.filter(([k, s]) => rule.boundedAt.some(([k2, s2]) => k === k2 && s === s2));
		for (const [k, s] of both) problems.push(`context-provided-and-bounded ${term} ${k}.${s}`);
	}
	return problems;
}

interface Violation { at: string; term: string; text: string }
function check(c: Compiled, tree: import('web-tree-sitter').Tree): Violation[] {
	const violations: Violation[] = [];
	const needs = (n: import('web-tree-sitter').Node): number => {
		let mask = c.requires.get(n.type) ?? 0;
		for (let i = 0; i < n.childCount; i++) {
			const child = n.child(i);
			if (!child) continue;
			const slot = n.fieldNameForChild(i);
			const key = slot ? `${n.type}.${slot}` : '';
			const contribution = needs(child) & ~(c.provides.get(key) ?? 0);
			const unmet = contribution & (c.bounds.get(key) ?? 0);
			if (unmet) violations.push({ at: key, term: names(unmet), text: child.text.slice(0, 50) });
			mask |= contribution;
		}
		return mask;
	};
	const rootUnmet = needs(tree.rootNode) & ~c.rootProvides;
	if (rootUnmet) violations.push({ at: `${c.root} (root)`, term: names(rootUnmet), text: '' });
	return violations;
}

type Witness = [cls: string, name: string, source: string, line?: string, cite?: string];
const witnesses = JSON.parse(readFileSync(join(HERE, '../2026-10-15-grammar-over-acceptance/witnesses.json'), 'utf8')) as Record<string, Witness[]>;
const out: string[] = ['grammar\tset\tentry\trefused\tcontexts\twhere'];
for (const [grammar, table] of Object.entries(TABLES)) {
	const problems = validate(grammar, table);
	console.log(`${grammar}: ${problems.length === 0 ? 'declaration valid' : problems.join('; ')}`);
	const c = compile(table);
	const parser = new Parser();
	parser.setLanguage(await Language.load(join(ROOT, `packages/${grammar}/.sittir/parser.wasm`)));
	const early = witnesses[grammar]!.filter((w) => w[3] === 'early-error' || w[0] === 'control');
	let covered = 0;
	for (const [cls, name, source] of early) {
		const tree = parser.parse(source)!;
		const v = check(c, tree);
		if (cls !== 'control' && v.length > 0) covered++;
		out.push([grammar, cls === 'control' ? 'control' : 'early-error', name, v.length > 0 ? 'refused' : 'accepted', v.map((x) => x.term).join(','), v.map((x) => x.at).join(',')].join('\t'));
	}
	let parsed = 0, skipped = 0;
	const refused: { name: string; source: string; detail: string }[] = [];
	for (const entry of loadCorpusEntries(grammar)) {
		const tree = parser.parse(entry.source)!;
		if (tree.rootNode.hasError) { skipped++; continue; }
		parsed++;
		const v = check(c, tree);
		if (v.length > 0) refused.push({ name: entry.name, source: entry.source, detail: v.map((x) => `${x.term} at ${x.at}`).join('; ') });
	}
	// A corpus refusal is sound only if the language's compiler rejects the entry too.
	const verdicts = judges[grammar]!(refused.map((r) => r.source));
	refused.forEach((r, i) => out.push([grammar, 'corpus', r.name, 'refused', r.detail, `compiler: ${verdicts[i]!.slice(0, 300)}`].join('\t')));
	console.log(`${grammar}: early-error witnesses refused ${covered} of ${early.length - 1}; corpus ${parsed} entries checked (${skipped} with parse errors skipped), refused ${refused.length}`);
	refused.forEach((r, i) => console.log(`  corpus refusal: ${r.name}: ${r.detail}\n    compiler: ${verdicts[i]!.slice(0, 400)}`));
}
writeFileSync(join(HERE, 'coverage.tsv'), `${out.join('\n')}\n`);
removeScratch();
