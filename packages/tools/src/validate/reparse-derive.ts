import { applyHost, hostTemplateFor, type ReparseHosts } from '@sittir/common';
import type { TSNode, TSTree } from './common.ts';

const HOLE = '$r';

/** One corpus entry, parsed. */
export interface DerivationTree {
	readonly source: string;
	readonly tree: TSTree;
}

export interface DeriveHostsInput {
	/** The grammar's declared hosts. */
	readonly declared: ReparseHosts;
	readonly root: string | undefined;
	readonly kindToSupertypes: ReadonlyMap<string, readonly string[]>;
	/** Parent kind -> the kinds its slots admit, from the node model. */
	readonly admits: ReadonlyMap<string, ReadonlySet<string>>;
	readonly corpus: readonly DerivationTree[];
	readonly parse: (text: string) => TSTree;
	/** The reparsed node with the source node's grammar id at the hole's offset, or null. */
	readonly findAt: (tree: TSTree, source: TSNode, hosted: { text: string; offset: number }) => TSNode | null;
	/** Whether the reparsed node is the source node, structurally. */
	readonly same: (source: TSNode, reparsed: TSNode) => boolean;
}

interface Occurrence {
	readonly entry: number;
	readonly node: TSNode;
}

function* namedNodes(node: TSNode): Generator<TSNode> {
	if (node.isNamed) yield node;
	for (const child of node.children) yield* namedNodes(child);
}

function layoutLead(node: TSNode): number {
	const own = /^\s+/.exec(node.text);
	if (own !== null) return own[0].length;
	const first = node.child(0);
	if (first === null || first.startIndex <= node.startIndex) return 0;
	const lead = first.startIndex - node.startIndex;
	return /^\s+$/.test(node.text.slice(0, lead)) ? lead : 0;
}

function hasMultiLineLeaf(node: TSNode): boolean {
	return node.childCount === 0 ? node.text.includes('\n') : node.children.some(hasMultiLineLeaf);
}

/**
 * The node's text as a host places it: without its layout lead and with every
 * continuation line shifted left by the column its first character sat at, so
 * the text reads from column 0 as a render does. Null when that shift is not
 * lossless: a continuation line indented less than the first, or a token that
 * itself spans lines (its inside would move with the shift).
 */
function relativeText(node: TSNode): string | null {
	const lead = layoutLead(node);
	const text = node.text.slice(lead);
	const leadText = node.text.slice(0, lead);
	const column = leadText.includes('\n') ? leadText.length - leadText.lastIndexOf('\n') - 1 : node.startPosition.column + lead;
	const lines = text.split('\n');
	if (lines.length === 1) return text;
	if (hasMultiLineLeaf(node)) return null;
	const shifted = lines.slice(1).map((line) => {
		if (line.trim() === '') return '';
		const indent = /^[ \t]*/.exec(line)![0].length;
		return indent < column ? null : line.slice(column);
	});
	return shifted.includes(null) ? null : [lines[0], ...shifted].join('\n');
}

function contextOf(parent: TSNode, child: TSNode): string {
	const text = parent.text;
	const start = child.startIndex - parent.startIndex;
	const lead = layoutLead(child);
	return text.slice(0, start + lead) + HOLE + text.slice(start + child.text.length);
}

/**
 * The reparse hosts a grammar's corpus supports beyond its declared ones. A
 * kind is hostable when some parent kind whose slots admit it is hostable; its
 * template is the parent's host with the smallest corpus occurrence of the
 * parent around the kind, the kind's span replaced by the hole. Breadth first
 * from the declared hosts, each kind taking its first verified template:
 * levels order the parents, then the shortest context, then the parent's name.
 * A template is verified by placing every sampled source text of the kind in
 * it, which must reparse without an error and hold the kind at the hole.
 * Deterministic: the corpus order, sorted names and lengths decide every tie.
 */
export function deriveReparseHosts(input: DeriveHostsInput): Record<string, string> {
	const occurrences = new Map<string, Occurrence[]>();
	input.corpus.forEach(({ tree }, entry) => {
		for (const node of namedNodes(tree.rootNode)) {
			const list = occurrences.get(node.type) ?? [];
			list.push({ entry, node });
			occurrences.set(node.type, list);
		}
	});

	const visibleKinds = new Set(occurrences.keys());
	const derived: Record<string, string> = {};
	const table = (): ReparseHosts => ({ ...input.declared, hosts: { ...derived, ...input.declared.hosts } });
	const hostOf = (kind: string): string | undefined => hostTemplateFor(kind, table(), input.kindToSupertypes, { root: input.root });
	const samplesOf = (kind: string): { text: string; node: TSNode }[] => {
		const byText = new Map<string, TSNode>();
		for (const { node } of occurrences.get(kind) ?? []) {
			const text = relativeText(node);
			if (text !== null && !byText.has(text)) byText.set(text, node);
		}
		return [...byText].map(([text, node]) => ({ text, node })).sort((a, b) => a.text.length - b.text.length || (a.text < b.text ? -1 : a.text > b.text ? 1 : 0));
	};

	const verified = (kind: string, template: string, samples: readonly { text: string; node: TSNode }[]): boolean =>
		samples.length > 0 &&
		samples.every(({ text, node }) => {
			const hosted = applyHost(template, text);
			const tree = input.parse(hosted.text);
			if (tree.rootNode.hasError) return false;
			const reparsed = input.findAt(tree, node, hosted);
			return reparsed !== null && input.same(node, reparsed);
		});

	const pending = [...occurrences.keys()].filter((kind) => hostOf(kind) === undefined).sort();
	for (let progressed = true; progressed && pending.length > 0; ) {
		progressed = false;
		const hostable = new Set([...occurrences.keys()].filter((kind) => hostOf(kind) !== undefined));
		const resolved: [string, string][] = [];
		for (const kind of pending) {
			const samples = samplesOf(kind);
			const candidates: { context: string; parent: string; template: string }[] = [];
			for (const { node } of occurrences.get(kind) ?? []) {
				const parent = node.parent;
				if (parent === null || !hostable.has(parent.type)) continue;
				if (!admitsKind(input, visibleKinds, parent.type, kind)) continue;
				const parentHost = hostOf(parent.type);
				if (parentHost === undefined) continue;
				const context = contextOf(parent, node);
				candidates.push({ context, parent: parent.type, template: parentHost.split(HOLE).join(context) });
			}
			candidates.sort((a, b) => a.context.length - b.context.length || (a.parent < b.parent ? -1 : a.parent > b.parent ? 1 : 0));
			const seen = new Set<string>();
			for (const candidate of candidates) {
				if (seen.has(candidate.template)) continue;
				seen.add(candidate.template);
				if (verified(kind, candidate.template, samples)) {
					resolved.push([kind, candidate.template]);
					break;
				}
			}
		}
		for (const [kind, template] of resolved) {
			derived[kind] = template;
			pending.splice(pending.indexOf(kind), 1);
			progressed = true;
		}
	}
	return derived;
}

function admitsKind(input: DeriveHostsInput, visible: ReadonlySet<string>, parent: string, kind: string): boolean {
	if (!input.admits.has(parent)) return true;
	const admitted = new Set<string>();
	const walk = (from: string): void => {
		for (const child of input.admits.get(from) ?? []) {
			if (admitted.has(child)) continue;
			admitted.add(child);
			if (!visible.has(child)) walk(child);
		}
	};
	walk(parent);
	const seen = new Set<string>([kind]);
	const queue = [kind];
	while (queue.length > 0) {
		const current = queue.shift()!;
		if (admitted.has(current)) return true;
		for (const supertype of input.kindToSupertypes.get(current) ?? []) {
			if (!seen.has(supertype)) {
				seen.add(supertype);
				queue.push(supertype);
			}
		}
	}
	return false;
}
