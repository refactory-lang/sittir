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
}

const HOLE = '$r';
const SENTINEL = '\u0001SITTIR_SENTINEL\u0001';

export function applyHost(template: string, rendered: string): HostedText {
	const offset = template.split(HOLE).join(SENTINEL).indexOf(SENTINEL);
	return { text: template.split(HOLE).join(rendered), offset: offset >= 0 ? offset : 0 };
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
