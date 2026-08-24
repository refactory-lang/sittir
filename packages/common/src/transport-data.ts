import type { AnyNodeData } from '@sittir/types';

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Structural nodes rebuild their text from the render template; a stale
 *  `$text` on one would hijack the native render's all-slots-empty verbatim
 *  fast-path (e.g. after `$with` emptied the slots). Leaves and unexpanded
 *  child stubs keep `$text` — it is the only content they carry, and it is
 *  what the transport's slot carrier reproduces for them. */
function hasStructure(record: Record<string, unknown>): boolean {
	return record.$other != null || Object.keys(record).some((key) => key.startsWith('_'));
}

/**
 * Project a node down to the plain data the native boundary accepts.
 *
 * The wrap surface carries accessor methods and `$with`; only data crosses
 * to napi. This copies the storage (`_`-keys and `$other`) through, drops
 * everything callable, and strips `$text` from every node that carries
 * storage — that node renders from its slots, and text describing a
 * pre-edit spelling must not survive to be emitted instead.
 *
 * Unexpanded child stubs pass through as they are: carrying no storage,
 * they keep their `$text`, and the transport's slot carrier reproduces it
 * verbatim. That is what keeps an untouched subtree's original bytes while
 * its rebuilt siblings render canonically.
 */
export function toTransportData(node: AnyNodeData): AnyNodeData {
	return projectValue(node) as AnyNodeData;
}

function projectValue(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(projectValue);
	if (!isRecord(value)) return value;
	const out: Record<string, unknown> = {};
	for (const [key, raw] of Object.entries(value)) {
		if (key === '$with' || typeof raw === 'function') continue;
		out[key] = key.startsWith('_') || key === '$other' ? projectValue(raw) : raw;
	}
	if (hasStructure(out)) delete out.$text;
	return out;
}

/**
 * Drop `$text` from every structural node in place (see `hasStructure`) and
 * return `root`. For already-projected data that came through a path other
 * than {@link toTransportData}.
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
