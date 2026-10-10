export interface NamespaceNode {
	readonly path: string;
	readonly kinds: readonly string[];
	readonly children: ReadonlyMap<string, NamespaceNode>;
}

export interface NamespaceAlias {
	readonly under: string;
	readonly name: string;
	readonly path: string;
}

export interface DroppedAlias {
	readonly under: string;
	readonly name: string;
	readonly paths: readonly string[];
}

interface MutableNode {
	readonly path: string;
	readonly kinds: Set<string>;
	readonly children: Map<string, MutableNode>;
}

const joinPath = (under: string, segment: string): string => (under === '' ? segment : `${under}.${segment}`);

export function namespaceTree(readEntries: ReadonlyMap<string, readonly { readonly vocab: string }[]>): NamespaceNode {
	const root: MutableNode = { path: '', kinds: new Set(), children: new Map() };
	for (const [kind, entries] of [...readEntries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
		for (const { vocab } of entries) {
			let at = root;
			at.kinds.add(kind);
			for (const segment of vocab.split('.')) {
				const path = joinPath(at.path, segment);
				let next = at.children.get(segment);
				if (next === undefined) at.children.set(segment, (next = { path, kinds: new Set(), children: new Map() }));
				next.kinds.add(kind);
				at = next;
			}
		}
	}
	const freeze = (node: MutableNode): NamespaceNode => ({
		path: node.path,
		kinds: [...node.kinds].sort(),
		children: new Map([...node.children].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([segment, child]) => [segment, freeze(child)]))
	});
	return freeze(root);
}

export function descendants(node: NamespaceNode): NamespaceNode[] {
	return [...node.children.values()].flatMap((child) => [child, ...descendants(child)]);
}

export function aliasesOf(root: NamespaceNode): { readonly aliases: NamespaceAlias[]; readonly dropped: DroppedAlias[] } {
	const aliases: NamespaceAlias[] = [];
	const dropped: DroppedAlias[] = [];
	const visit = (node: NamespaceNode): void => {
		const bySegment = new Map<string, string[]>();
		for (const descendant of descendants(node)) {
			if (node.children.get(descendant.path.slice(descendant.path.lastIndexOf('.') + 1)) === descendant) continue;
			const segment = descendant.path.slice(descendant.path.lastIndexOf('.') + 1);
			(bySegment.get(segment) ?? bySegment.set(segment, []).get(segment)!).push(descendant.path);
		}
		for (const [name, paths] of [...bySegment].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
			if (node.children.has(name)) continue;
			if (paths.length === 1) aliases.push({ under: node.path, name, path: paths[0]! });
			else dropped.push({ under: node.path, name, paths: [...paths].sort() });
		}
		for (const child of node.children.values()) visit(child);
	};
	visit(root);
	return { aliases, dropped };
}

export interface NamespaceLevel {
	readonly depth: number;
	readonly paths: number;
	readonly kinds: number;
	readonly refinements: number;
	readonly aliases: number;
}

const depthOf = (path: string): number => (path === '' ? 0 : path.split('.').length);

export function namespaceSection(readEntries: ReadonlyMap<string, readonly { readonly vocab: string }[]>): {
	readonly levels: NamespaceLevel[];
	readonly dropped: DroppedAlias[];
} {
	const root = namespaceTree(readEntries);
	const { aliases, dropped } = aliasesOf(root);
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
			refinements: here.filter((p) => depth > 1 && claimed.has(p.slice(0, p.lastIndexOf('.')))).length,
			aliases: aliases.filter((a) => depthOf(a.under) === i).length
		};
	});
	return { levels, dropped };
}
