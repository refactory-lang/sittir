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

/** An unexpanded read stub: coordinates into the owning tree, and none of the
 *  storage the read they point at would produce. */
function isUnexpandedStub(value: unknown): boolean {
	if (!isRecord(value)) return false;
	if (value.$nodeHandle == null || value.$childIndex == null) return false;
	return !hasStructure(value);
}

/**
 * Nothing below this node has been expanded or replaced, so its own captured
 * `$text` still spells the whole subtree — including what lies BETWEEN its
 * children, which its template would re-spell in the canonical form. That gap
 * is not cosmetic: it holds the comments and the blank lines, and in an
 * indentation-sensitive grammar it holds the block structure, so re-spelling
 * it can move a node into a different parent.
 *
 * Requires at least one stub, and requires EVERY stored value to be one. Any
 * edit puts something else in storage — a factory-built node, a replacement
 * string — which is exactly what should send the node back through its
 * template. A node with no children left (its slot emptied via `$with`) has no
 * stub either, so its now-stale `$text` cannot be mistaken for current.
 *
 * Attached trivia keeps a node out: the carrier writes verbatim text and
 * nothing else, and a node's own leading/trailing comments sit outside the
 * span `$text` captured.
 */
function isUntouchedSubtree(record: Record<string, unknown>): boolean {
	if (typeof record.$text !== 'string') return false;
	if (record.$triviaData != null) return false;
	let stubs = 0;
	for (const [key, child] of Object.entries(record)) {
		if (!key.startsWith('_') && key !== '$other') continue;
		for (const entry of Array.isArray(child) ? child : [child]) {
			if (entry === undefined || entry === null) continue;
			if (!isUnexpandedStub(entry)) return false;
			stubs++;
		}
	}
	return stubs > 0;
}

/** The stub projection of an untouched node: its identity and its captured
 *  source, with the storage left off so the transport reproduces the text
 *  instead of rebuilding from slots. */
function asCapturedText(record: Record<string, unknown>): Record<string, unknown> {
	const out: Record<string, unknown> = { $type: record.$type, $text: record.$text };
	for (const key of ['$source', '$named', '$span', '$nodeHandle', '$childIndex']) {
		if (record[key] !== undefined) out[key] = record[key];
	}
	return out;
}

/**
 * Reshape one node's own storage into what the transport declares.
 *
 * The reader is grammar-agnostic: it spells an untagged named child by its
 * kind (`_visibility_modifier_pub`, not the model's `_content`) and hands
 * back a lone repeated child as a bare value rather than a one-element
 * array. The per-kind wrap functions already reconcile both, so the
 * projection routes every level that carries storage through them.
 *
 * The result is not always a node: a supertype's wrap resolves the node to
 * the member it stands for, and a text-collapsed member is that member's
 * bare text.
 */
export type NormalizeNodeStorage = (node: AnyNodeData) => unknown;

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
 * they are left un-normalized (there is nothing to reshape) and keep their
 * `$text`, which the transport's slot carrier reproduces verbatim. That is
 * what keeps an untouched subtree's original bytes while its rebuilt
 * siblings render canonically.
 */
export function toTransportData(node: AnyNodeData, normalize?: NormalizeNodeStorage): AnyNodeData {
	return projectValue(node, normalize) as AnyNodeData;
}

function projectValue(value: unknown, normalize: NormalizeNodeStorage | undefined): unknown {
	if (Array.isArray(value)) return value.map((entry) => projectValue(entry, normalize));
	if (!isRecord(value)) return value;
	const normalized =
		normalize !== undefined && hasStructure(value) ? normalize(value as unknown as AnyNodeData) : value;
	// A supertype resolves to the member it stands for, which for a
	// text-collapsed member is that member's bare text — already the value the
	// slot carries, with no storage of its own left to walk.
	if (!isRecord(normalized)) return normalized;
	if (isUntouchedSubtree(normalized)) return asCapturedText(normalized);
	const out: Record<string, unknown> = {};
	for (const [key, raw] of Object.entries(normalized)) {
		if (key === '$with' || typeof raw === 'function') continue;
		out[key] = key.startsWith('_') || key === '$other' ? projectValue(raw, normalize) : raw;
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
