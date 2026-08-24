import type { AnyNodeData } from '@sittir/types';

/** Read a tree node by its reader coordinates. */
export type DrillFn = (handle: number, childIndex: number) => AnyNodeData;

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** A reader child stub: coordinates into the owning tree, no storage of its
 *  own. The reader emits one level of structure per read; every child under
 *  it is a stub until drilled. */
function isReaderStub(value: Record<string, unknown>): boolean {
	return value.$nodeHandle != null && value.$childIndex != null;
}

/** Structural nodes rebuild their text from the render template; a stale
 *  `$text` on one would hijack the native render's all-slots-empty verbatim
 *  fast-path (e.g. after `$with` emptied the slots). Leaves keep `$text` —
 *  it is their only content. */
function hasStructure(record: Record<string, unknown>): boolean {
	return record.$other != null || Object.keys(record).some((key) => key.startsWith('_'));
}

/**
 * Materialize a tree-backed node into plain, transport-ready data.
 *
 * The reader returns one level per read: `_<slot>` storage holds child
 * stubs (`$nodeHandle` + `$childIndex`) rather than child data, and the
 * native render transport requires every node's slots to be present. This
 * walks the storage (`_`-keys and `$other`), reads each stub through
 * `drill`, recurses into what it returns, and drops the wrap surface
 * (methods, `$with`) so only data crosses the boundary. Values without
 * coordinates (factory-built replacements installed via `$with`) are
 * copied structurally.
 */
export function materializeTreeNode(node: AnyNodeData, drill: DrillFn): AnyNodeData {
	return materializeValue(node, drill) as AnyNodeData;
}

function materializeValue(value: unknown, drill: DrillFn): unknown {
	if (Array.isArray(value)) return value.map((entry) => materializeValue(entry, drill));
	if (!isRecord(value)) return value;
	const source =
		isReaderStub(value) && !hasStructure(value)
			? (drill(value.$nodeHandle as number, value.$childIndex as number) as unknown as Record<string, unknown>)
			: value;
	const out: Record<string, unknown> = {};
	for (const [key, raw] of Object.entries(source)) {
		if (key === '$with' || typeof raw === 'function') continue;
		out[key] = key.startsWith('_') || key === '$other' ? materializeValue(raw, drill) : raw;
	}
	if (hasStructure(out)) delete out.$text;
	return out;
}

/**
 * Drop `$text` from every structural node in place (see `hasStructure`) and
 * return `root`. For already-materialized data that came through a path
 * other than {@link materializeTreeNode}.
 */
export function stripStructuralNodeText<T>(root: T): T {
	const seen = new WeakSet<object>();
	const recurse = (value: unknown): void => {
		if (!isRecord(value) || typeof value.$type !== 'number') return;
		if (seen.has(value)) return;
		seen.add(value);
		if (hasStructure(value)) delete value.$text;
		for (const [key, child] of Object.entries(value)) {
			if (key !== '$other' && !key.startsWith('_')) continue;
			if (Array.isArray(child)) for (const entry of child) recurse(entry);
			else recurse(child);
		}
	};
	recurse(root);
	return root;
}
