/**
 * discover/assemble-shape-census -- what actually reaches each Assembled*
 * constructor.
 *
 * For every node in the assembled node map, records the shape of the rule
 * the constructor received (`diagnosticRule`) and, for slot-bearing nodes,
 * the simplified view too. A shape is the rule type plus its list/slot
 * attributes, one level down: `SEQ[SYMBOL{opt}, STRING, CHOICE[SYMBOL,SYMBOL]]`.
 * Grouped by modelType, so each constructor's parameter type can be checked
 * against the population it really sees rather than against what tsc accepts.
 *
 * Usage:
 *   assemble-shape-census [--grammar <g>] [--all-grammars] [--format table|json] [--view constructor|simplified|both]
 */

import { buildNodeMap } from '../codegen-surface.ts';
import type { AssembledNode } from '../codegen-surface.ts';

export interface AssembleShapeCensusOptions {
	grammar: string;
	allGrammars: boolean;
	format: string;
	view: string;
}

interface ShapeBucket {
	shape: string;
	count: number;
	kinds: string[];
}

export interface AssembleShapeCensus {
	grammar: string;
	byModelType: Record<string, { view: string; buckets: ShapeBucket[] }[]>;
}

type RuleLike = {
	type: string;
	members?: RuleLike[];
	content?: RuleLike;
	subtypes?: RuleLike[];
	multiplicity?: string;
	separator?: unknown;
	fieldName?: string;
	nonterminal?: boolean;
	tokenized?: boolean;
	immediate?: boolean;
};

const MULT_TAG: Record<string, string> = { optional: '?', array: '*', nonEmptyArray: '+' };

function attrTag(r: RuleLike): string {
	const tags: string[] = [];
	if (r.multiplicity !== undefined) tags.push(MULT_TAG[r.multiplicity] ?? r.multiplicity);
	if (r.separator !== undefined) tags.push('sep');
	if (r.fieldName !== undefined) tags.push('field');
	if (r.tokenized) tags.push('tok');
	if (r.immediate) tags.push('imm');
	if (r.nonterminal) tags.push('nt');
	return tags.length > 0 ? `{${tags.join(',')}}` : '';
}

function leafShape(r: RuleLike): string {
	return `${r.type}${attrTag(r)}`;
}

export function shapeOf(rule: unknown): string {
	const r = rule as RuleLike;
	const self = leafShape(r);
	if (Array.isArray(r.members)) return `${self}[${r.members.map(leafShape).join(',')}]`;
	if (r.content !== undefined) return `${self}(${leafShape(r.content)})`;
	if (Array.isArray(r.subtypes)) return `${self}[${r.subtypes.length} subtypes]`;
	return self;
}

function bucketize(entries: Iterable<[string, unknown]>): ShapeBucket[] {
	const buckets = new Map<string, ShapeBucket>();
	for (const [kind, rule] of entries) {
		const shape = shapeOf(rule);
		const b = buckets.get(shape) ?? { shape, count: 0, kinds: [] };
		b.count++;
		b.kinds.push(kind);
		buckets.set(shape, b);
	}
	return [...buckets.values()].sort((a, b) => b.count - a.count || a.shape.localeCompare(b.shape));
}

function simplifiedRuleOf(node: AssembledNode): unknown {
	return (node as { simplifiedRule?: unknown }).simplifiedRule;
}

export function computeAssembleShapeCensus(
	grammar: string,
	nodes: ReadonlyMap<string, AssembledNode>,
	view: string
): AssembleShapeCensus {
	const byModelType: AssembleShapeCensus['byModelType'] = {};
	const constructorEntries = new Map<string, [string, unknown][]>();
	const simplifiedEntries = new Map<string, [string, unknown][]>();
	for (const [kind, node] of nodes) {
		const mt = node.modelType;
		(constructorEntries.get(mt) ?? constructorEntries.set(mt, []).get(mt)!).push([kind, node.diagnosticRule]);
		const simplified = simplifiedRuleOf(node);
		if (simplified !== undefined) {
			(simplifiedEntries.get(mt) ?? simplifiedEntries.set(mt, []).get(mt)!).push([kind, simplified]);
		}
	}
	for (const mt of [...constructorEntries.keys()].sort()) {
		const views: { view: string; buckets: ShapeBucket[] }[] = [];
		if (view !== 'simplified') views.push({ view: 'constructor', buckets: bucketize(constructorEntries.get(mt)!) });
		if (view !== 'constructor' && simplifiedEntries.has(mt))
			views.push({ view: 'simplified', buckets: bucketize(simplifiedEntries.get(mt)!) });
		byModelType[mt] = views;
	}
	return { grammar, byModelType };
}

function renderTable(census: AssembleShapeCensus): string {
	const lines: string[] = [`===== ${census.grammar}`];
	for (const [mt, views] of Object.entries(census.byModelType)) {
		for (const { view, buckets } of views) {
			const total = buckets.reduce((n, b) => n + b.count, 0);
			lines.push(`  ${mt} (${view}, ${total} kinds)`);
			for (const b of buckets) {
				const sample = b.kinds.slice(0, 4).join(' ') + (b.kinds.length > 4 ? ' …' : '');
				lines.push(`    ${String(b.count).padStart(5)}  ${b.shape}   ${sample}`);
			}
		}
	}
	return lines.join('\n');
}

export async function run(opts: AssembleShapeCensusOptions): Promise<number> {
	const grammars = opts.allGrammars ? ['rust', 'typescript', 'python'] : [opts.grammar];
	const results: AssembleShapeCensus[] = [];
	for (const grammar of grammars) {
		let nodes: ReadonlyMap<string, AssembledNode>;
		try {
			nodes = (await buildNodeMap(grammar)).nodes;
		} catch (e) {
			process.stderr.write(`${grammar}: ERROR building nodeMap -- ${(e as Error).message}\n`);
			return 1;
		}
		results.push(computeAssembleShapeCensus(grammar, nodes, opts.view));
	}
	if (opts.format === 'json') {
		process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
	} else {
		for (const census of results) process.stdout.write(`${renderTable(census)}\n`);
	}
	return 0;
}
