import { portablePathHasFacts } from '@sittir/common/engine';

export interface NamespaceNode {
	readonly path: string;
	readonly kinds: readonly string[];
	readonly children: ReadonlyMap<string, NamespaceNode>;
}

interface MutableNode {
	readonly path: string;
	readonly children: Map<string, MutableNode>;
}

const joinPath = (under: string, segment: string): string => (under === '' ? segment : `${under}.${segment}`);

export function namespaceTree(readEntries: ReadonlyMap<string, readonly { readonly vocab: string }[]>): NamespaceNode {
	const root: MutableNode = { path: '', children: new Map() };
	const entries = [...readEntries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
	for (const [, reads] of entries) {
		for (const { vocab } of reads) {
			let at = root;
			for (const segment of vocab.split('.')) {
				const path = joinPath(at.path, segment);
				let next = at.children.get(segment);
				if (next === undefined) at.children.set(segment, (next = { path, children: new Map() }));
				at = next;
			}
		}
	}
	const freeze = (node: MutableNode): NamespaceNode => ({
		path: node.path,
		kinds: entries.filter(([, reads]) => reads.some(({ vocab }) => node === root || portablePathHasFacts(node.path, vocab))).map(([kind]) => kind),
		children: new Map([...node.children].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([segment, child]) => [segment, freeze(child)]))
	});
	return freeze(root);
}

export function descendants(node: NamespaceNode): NamespaceNode[] {
	return [...node.children.values()].flatMap((child) => [child, ...descendants(child)]);
}

export interface NamespaceLevel {
	readonly depth: number;
	readonly paths: number;
	readonly kinds: number;
	readonly refinements: number;
}

const depthOf = (path: string): number => (path === '' ? 0 : path.split('.').length);

export function namespaceSection(readEntries: ReadonlyMap<string, readonly { readonly vocab: string }[]>): { readonly levels: NamespaceLevel[] } {
	const root = namespaceTree(readEntries);
	const read = [...readEntries].flatMap(([kind, entries]) => entries.map(({ vocab }) => ({ kind, vocab })));
	const claimed = new Set(read.map((r) => r.vocab));
	const paths = descendants(root).map((n) => n.path);
	const deepest = Math.max(0, ...paths.map(depthOf));
	const levels = Array.from({ length: deepest }, (_, i): NamespaceLevel => {
		const depth = i + 1;
		const here = paths.filter((p) => depthOf(p) === depth);
		return {
			depth,
			paths: here.length,
			kinds: new Set(read.filter((r) => depthOf(r.vocab) === depth).map((r) => r.kind)).size,
			refinements: here.filter((p) => depth > 1 && claimed.has(p.slice(0, p.lastIndexOf('.')))).length
		};
	});
	return { levels };
}
