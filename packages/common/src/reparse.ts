export interface ReparseHosts {
	readonly hosts: Readonly<Record<string, string>>;
	readonly priority: readonly string[];
	readonly gated: readonly string[];
}

export const NO_REPARSE_HOSTS: ReparseHosts = Object.freeze({ hosts: {}, priority: [], gated: [] });

export interface HostedText {
	readonly text: string;
	readonly offset: number;
}

export interface HostOptions {
	readonly adoptedVariantKinds?: ReadonlySet<string>;
	readonly targetKind?: string;
	readonly root?: string;
	/** Parses host text, so a multi-line token's inside is not re-indented. */
	readonly parse?: (text: string) => { readonly rootNode: SpanNode } | null;
}

const HOLE = '$r';
const SENTINEL = '\u0001SITTIR_SENTINEL\u0001';

/** The part of a syntax node the host helpers read. */
export interface SpanNode {
	readonly startIndex: number;
	readonly endIndex: number;
	readonly children: readonly SpanNode[];
}

/**
 * The offsets in `text` of the lines that begin inside a token spanning lines
 * (a multi-line string or comment), or right after a token ending in a line
 * break with the next token starting at that very offset (a string's content
 * continuing past an interpolation): shifting such a line changes the string's
 * content, so hosts leave it where it is.
 */
export function lineStartsInsideTokens(root: SpanNode, text: string): ReadonlySet<number> {
	const starts = new Set<number>();
	let previousEnd = -1;
	const walk = (node: SpanNode): void => {
		if (node.children.length > 0) {
			for (const child of node.children) walk(child);
			return;
		}
		if (node.startIndex === previousEnd) starts.add(previousEnd);
		for (let at = text.indexOf('\n', node.startIndex); at !== -1 && at + 1 < node.endIndex; at = text.indexOf('\n', at + 1)) starts.add(at + 1);
		if (node.endIndex > node.startIndex) previousEnd = text[node.endIndex - 1] === '\n' ? node.endIndex : -1;
	};
	walk(root);
	return starts;
}

/**
 * Splices rendered text into a host template's hole. When only whitespace
 * precedes the hole on its line, the rendered text's continuation lines are
 * indented to that column, except lines inside a token spanning lines, which
 * `parse` (a parser for the host language) finds on the unindented text.
 */
export function applyHost(template: string, rendered: string, parse?: (text: string) => { readonly rootNode: SpanNode } | null): HostedText {
	const offset = template.split(HOLE).join(SENTINEL).indexOf(SENTINEL);
	const parts = template.split(HOLE);
	const plain = parts.join(rendered);
	const inside = parse === undefined ? new Set<number>() : lineStartsInsideTokens(parse(plain)?.rootNode ?? { startIndex: 0, endIndex: 0, children: [] }, plain);
	let text = parts[0]!;
	let plainAt = parts[0]!.length;
	for (let i = 1; i < parts.length; i++) {
		const lineStart = text.lastIndexOf('\n') + 1;
		const indent = /^[ \t]*$/.test(text.slice(lineStart)) ? text.slice(lineStart) : '';
		if (indent === '') {
			text += rendered;
		} else {
			let at = plainAt;
			text += rendered
				.split('\n')
				.map((line, index) => {
					const lineAt = at;
					at += line.length + 1;
					return index === 0 || inside.has(lineAt) ? line : indent + line;
				})
				.join('\n');
		}
		plainAt += rendered.length + parts[i]!.length;
		text += parts[i]!;
	}
	return { text, offset: offset >= 0 ? offset : 0 };
}

function hostBySupertype(
	kind: string,
	hosts: Readonly<Record<string, string>>,
	priority: readonly string[],
	kindToSupertypes: ReadonlyMap<string, readonly string[]>
): string | undefined {
	const reachable = new Set<string>();
	const visited = new Set<string>([kind]);
	const queue = [...(kindToSupertypes.get(kind) ?? [])];
	while (queue.length > 0) {
		const supertype = queue.shift()!;
		if (visited.has(supertype)) continue;
		visited.add(supertype);
		if (hosts[supertype] !== undefined) reachable.add(supertype);
		for (const parent of kindToSupertypes.get(supertype) ?? []) if (!visited.has(parent)) queue.push(parent);
	}
	if (reachable.size === 0) return undefined;
	const chosen = priority.find((name) => reachable.has(name)) ?? [...reachable][0]!;
	return hosts[chosen];
}

export function hostTemplateFor(
	kind: string,
	table: ReparseHosts,
	kindToSupertypes: ReadonlyMap<string, readonly string[]>,
	opts?: HostOptions
): string | undefined {
	const hosts = { ...(opts?.root === undefined ? {} : { [opts.root]: '$r' }), ...table.hosts };
	const visibleKind = hosts[kind] !== undefined ? kind : (opts?.targetKind ?? kind);
	const direct = hosts[kind] ?? hosts[visibleKind];
	if (direct !== undefined) {
		const gateKey = hosts[kind] !== undefined ? kind : visibleKind;
		const gated = table.gated.includes(gateKey);
		const adopted = opts?.adoptedVariantKinds?.has(gateKey) ?? false;
		if (gated && !adopted) return hostBySupertype(visibleKind, hosts, table.priority, kindToSupertypes);
		return direct;
	}
	if (opts?.targetKind !== undefined && opts.targetKind !== kind) {
		const target = hosts[opts.targetKind];
		if (target !== undefined) return target;
	}
	const bySource = hostBySupertype(visibleKind, hosts, table.priority, kindToSupertypes);
	if (bySource !== undefined) return bySource;
	if (opts?.targetKind !== undefined && opts.targetKind !== visibleKind) {
		return hostBySupertype(opts.targetKind, hosts, table.priority, kindToSupertypes);
	}
	return undefined;
}
