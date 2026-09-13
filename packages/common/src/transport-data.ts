import type { AnyNodeData } from '@sittir/types';

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const COORDINATE_KEYS = ['$nodeHandle', '$span', '$childIndex'] as const;

function isStorageKey(key: string): boolean {
	return key.startsWith('_') || key === '$other';
}

function hasStructure(record: Record<string, unknown>): boolean {
	return record.$other != null || Object.keys(record).some((key) => key.startsWith('_'));
}

/**
 * Whether nothing under `value` was rebuilt: it still spans the bytes it was
 * read from, and the same holds all the way down. A kind id, a boolean or a
 * bare string in a slot is inert — the parent's own coordinate is what
 * places it, and an edit that put it there detached that coordinate at the
 * setter.
 *
 * A span is the whole requirement because a deep read hands its descendants
 * a span and no handle: only the node that emits the coordinate needs to
 * name the tree. A descendant's attached comments do not keep an ancestor
 * from folding: they lie inside the ancestor's span, so its bytes carry
 * them — only a node's OWN trivia sits outside its span, which is why
 * `foldsToCoordinate` refuses that node and no other.
 */
function isUntouchedBelow(value: unknown): boolean {
	if (Array.isArray(value)) return value.every(isUntouchedBelow);
	if (value === undefined || value === null || typeof value !== 'object') return true;
	const record = value as Record<string, unknown>;
	if (!isRecord(record.$span)) return false;
	for (const [key, child] of Object.entries(record)) {
		if (!isStorageKey(key)) continue;
		if (!isUntouchedBelow(child)) return false;
	}
	return true;
}

/**
 * Whether this node can cross as a coordinate: it still names its tree and
 * its span, carries no separately attached trivia, and nothing below it was
 * rebuilt. The handle is required here and nowhere below, because it is the
 * only thing that says which tree the span indexes into.
 */
function foldsToCoordinate(record: Record<string, unknown>): boolean {
	if (typeof record.$nodeHandle !== 'number' || !isRecord(record.$span)) return false;
	if (record.$_trivia != null) return false;
	return isUntouchedBelow(record);
}

/** The coordinate projection of a folded node: identity and provenance, no storage. */
function asCoordinate(record: Record<string, unknown>): Record<string, unknown> {
	const out: Record<string, unknown> = { $type: record.$type };
	for (const key of ['$source', '$named', '$span', '$nodeHandle', '$childIndex', '$format']) {
		if (record[key] !== undefined) out[key] = record[key];
	}
	return out;
}

/**
 * Detach the fact an edit invalidates: the coordinate into the source this
 * node was read from. A `$with` setter spreads the node it edits, so without
 * this the new node would still fold to the pre-edit bytes. Recorded here,
 * at the edit, because an emptied node and a node that parsed childless have
 * the same shape afterwards and only the first is dirty.
 */
export function markEdited<T extends object>(data: T): Omit<T, (typeof COORDINATE_KEYS)[number]> {
	const {
		$nodeHandle: _handle,
		$span: _span,
		$childIndex: _index,
		...rest
	} = data as T & Record<(typeof COORDINATE_KEYS)[number], unknown>;
	return rest;
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
 * everything callable, and strips `$text` and the coordinate keys
 * (`$nodeHandle`, `$span`, `$childIndex`) from every node that carries
 * storage — that node rebuilds from its slots, so neither its pre-edit
 * text nor the coordinate that would slice that text may cross.
 *
 * A node that still names its tree and was not rebuilt below crosses as its
 * coordinate alone (`foldsToCoordinate`), which the transport's slot carrier
 * slices from the source the engine still holds. That is what keeps an
 * untouched subtree's original bytes while its rebuilt siblings render
 * canonically.
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
	if (foldsToCoordinate(normalized)) return asCoordinate(normalized);
	const out: Record<string, unknown> = {};
	for (const [key, raw] of Object.entries(normalized)) {
		if (key === '$with' || typeof raw === 'function') continue;
		out[key] = key.startsWith('_') || key === '$other' ? projectValue(raw, normalize) : raw;
	}
	// Past the fold, nothing is a coordinate: a leaf that kept its trivia
	// crosses as itself, and a storage-bearing node rebuilds from its slots
	// with neither its pre-edit text nor the span that would slice it.
	delete out.$nodeHandle;
	delete out.$childIndex;
	if (hasStructure(out)) {
		delete out.$text;
		delete out.$span;
	}
	return out;
}

/**
 * Drop the pre-edit spelling and the coordinate that would slice it from
 * every node that carries storage, in place, and return `root`. For
 * already-projected data that came through a path other than
 * {@link toTransportData}.
 */
export function stripStructuralProvenance<T>(root: T): T {
	const seen = new WeakSet<object>();
	const recurse = (value: unknown): void => {
		if (!isRecord(value) || typeof value.$type !== 'number') return;
		if (seen.has(value)) return;
		seen.add(value);
		if (hasStructure(value)) {
			delete value.$text;
			for (const key of COORDINATE_KEYS) delete value[key];
		}
		for (const [key, child] of Object.entries(value)) {
			if (!isStorageKey(key)) continue;
			if (Array.isArray(child)) for (const entry of child) recurse(entry);
			else recurse(child);
		}
	};
	recurse(root);
	return root;
}
