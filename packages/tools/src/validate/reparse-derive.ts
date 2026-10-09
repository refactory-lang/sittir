import { applyHost, hostTemplateFor, lineStartsInsideTokens, type ReparseHosts } from '@sittir/common';
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
	/** Kinds a gated host serves: the variants a parent kind adopts. */
	readonly adoptedVariantKinds: ReadonlySet<string>;
	readonly kindToSupertypes: ReadonlyMap<string, readonly string[]>;
	/** Parent kind -> the kinds its slots admit, from the node model. */
	readonly admits: ReadonlyMap<string, ReadonlySet<string>>;
	/** A model kind's stamped kind id: the grammar id of the tree nodes it is the display of. */
	readonly kindIdOf: (kind: string) => number | undefined;
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

/**
 * The node's text as a host places it: without its layout lead and with every
 * continuation line shifted left by the indentation of the line its first
 * character sits on, so the text reads from column 0 as a render does. Lines
 * inside a token spanning lines stay as they are, as in `applyHost`. Null when
 * a continuation line is indented less than that line.
 */
function relativeText(node: TSNode, source: string): string | null {
	const lead = layoutLead(node);
	const text = node.text.slice(lead);
	const lines = text.split('\n');
	if (lines.length === 1) return text;
	const at = node.startIndex + lead;
	const column = /^[ \t]*/.exec(source.slice(source.lastIndexOf('\n', at - 1) + 1, at))![0].length;
	const inside = lineStartsInsideTokens(node, source);
	let lineAt = at + lines[0]!.length + 1;
	const shifted = lines.slice(1).map((line) => {
		const start = lineAt;
		lineAt += line.length + 1;
		if (inside.has(start) || line.trim() === '') return line;
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

	const modelNames = new Set<string>([...input.admits.keys(), ...input.kindToSupertypes.keys()]);
	for (const set of input.admits.values()) for (const name of set) modelNames.add(name);
	for (const list of input.kindToSupertypes.values()) for (const name of list) modelNames.add(name);
	const byId = new Map<number, string[]>();
	for (const name of modelNames) {
		const id = input.kindIdOf(name);
		if (id !== undefined) byId.set(id, [...(byId.get(id) ?? []), name]);
	}
	const ids: IdIndex = {
		visible: new Set([...occurrences.values()].flatMap((list) => list.map((o) => o.node.grammarId))),
		namesOf: (id) => byId.get(id) ?? []
	};
	const derived: Record<string, string> = {};
	const table = (): ReparseHosts => ({ ...input.declared, hosts: { ...derived, ...input.declared.hosts } });
	const hostOf = (kind: string): string | undefined =>
		hostTemplateFor(kind, table(), input.kindToSupertypes, { root: input.root, adoptedVariantKinds: input.adoptedVariantKinds, targetKind: kind });
	const samplesOf = (kind: string): { text: string; node: TSNode }[] => {
		const byText = new Map<string, TSNode>();
		for (const { entry, node } of occurrences.get(kind) ?? []) {
			const text = relativeText(node, input.corpus[entry]!.source);
			if (text !== null && !byText.has(text)) byText.set(text, node);
		}
		return [...byText].map(([text, node]) => ({ text, node })).sort((a, b) => a.text.length - b.text.length || (a.text < b.text ? -1 : a.text > b.text ? 1 : 0));
	};

	const verified = (kind: string, template: string, samples: readonly { text: string; node: TSNode }[]): boolean =>
		samples.length > 0 &&
		samples.every(({ text, node }) => {
			const hosted = applyHost(template, text, input.parse);
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
				if (!admitsKind(input, ids, parent, node)) continue;
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

/**
 * Whether the parent's slots admit the child, compared by stamped kind id:
 * every model kind resolves to its id, and a tree node carries the same id as
 * the model kind it is the display of. Kinds the corpus never shows are
 * hidden wrappers, whose own slots are walked through; a child is admitted
 * directly or through a supertype of any model kind sharing its id. A kind
 * with no stamped id (a hidden supertype) is compared by its model name, which
 * is never a tree display name.
 */
function admitsKind(input: DeriveHostsInput, ids: IdIndex, parent: TSNode, child: TSNode): boolean {
	const parentNames = ids.namesOf(parent.grammarId).filter((name) => input.admits.has(name));
	if (parentNames.length === 0) return true;
	const admitted = new Set<number>();
	const admittedUnstamped = new Set<string>();
	const walk = (names: readonly string[]): void => {
		for (const name of names) {
			for (const admittedName of input.admits.get(name) ?? []) {
				const id = input.kindIdOf(admittedName);
				if (id === undefined) {
					admittedUnstamped.add(admittedName);
					continue;
				}
				if (admitted.has(id)) continue;
				admitted.add(id);
				if (!ids.visible.has(id)) walk(ids.namesOf(id));
			}
		}
	};
	walk(parentNames);
	const seen = new Set<string>();
	const queue = [...ids.namesOf(child.grammarId), child.type];
	const reached = new Set<number>([child.grammarId]);
	while (queue.length > 0) {
		const name = queue.shift()!;
		if (seen.has(name)) continue;
		seen.add(name);
		const id = input.kindIdOf(name);
		if (id !== undefined) reached.add(id);
		else if (admittedUnstamped.has(name)) return true;
		queue.push(...(input.kindToSupertypes.get(name) ?? []));
	}
	return [...reached].some((id) => admitted.has(id));
}

interface IdIndex {
	readonly visible: ReadonlySet<number>;
	readonly namesOf: (id: number) => readonly string[];
}
