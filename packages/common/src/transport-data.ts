import type { AnyNodeData } from '@sittir/types';

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export const HANDLE_KEYS = ['$handle', '$parentHandle', '$treeHandle'] as const;

const COORDINATE_KEYS = [...HANDLE_KEYS, '$span', '$childIndex', '$textOnly'] as const;

/**
 * The tree a node's handle names, whichever handle it carries: every handle is
 * tagged with its tree, so each one identifies it.
 */
export function treeHandleOf(node: object): number | undefined {
	const record = node as Partial<Record<(typeof HANDLE_KEYS)[number], unknown>>;
	const handle = record.$handle ?? record.$parentHandle ?? record.$treeHandle;
	return typeof handle === 'number' ? handle : undefined;
}

function isStorageKey(key: string): boolean {
	return key.startsWith('_') || key === '$other';
}

function hasStructure(record: Record<string, unknown>): boolean {
	return record.$other != null || Object.keys(record).some((key) => key.startsWith('_'));
}

function isInert(value: unknown): boolean {
	if (Array.isArray(value)) return value.every(isInert);
	return value === null || typeof value !== 'object';
}

/**
 * A node read as text whose slots are only kind ids, booleans and bare text
 * projected from that text (a lexed token's interior) and that still spans
 * the bytes it was read from: nothing was rebuilt, so it stays the
 * coordinate its text names. An edit detaches the span, which ends this.
 */
function isDerivedFromText(record: Record<string, unknown>): boolean {
	if (typeof record.$text !== 'string' || !isRecord(record.$span) || record.$other != null) return false;
	return Object.entries(record).every(([key, value]) => !key.startsWith('_') || isInert(value));
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
 * its span, carries no trivia outside that span, and nothing below it was
 * rebuilt. The handle is required here and nowhere below, because it is the
 * only thing that says which tree the span indexes into.
 */
function foldsToCoordinate(record: Record<string, unknown>): boolean {
	if (treeHandleOf(record) === undefined || !isRecord(record.$span)) return false;
	if (hasOutsideTrivia(record.$_trivia)) return false;
	return isUntouchedBelow(record);
}

/**
 * Whether trivia lies outside the node's span: leading or trailing entries. A
 * read's inner entries sit inside the span, so the coordinate already covers
 * them.
 */
function hasOutsideTrivia(trivia: unknown): boolean {
	if (!isRecord(trivia)) return false;
	return trivia.leading != null || trivia.trailing != null;
}

/**
 * The coordinate projection of a folded node: identity, its span and the tree
 * that span slices, no storage.
 */
function asCoordinate(record: Record<string, unknown>): Record<string, unknown> {
	const out: Record<string, unknown> = { $type: record.$type };
	for (const key of ['$source', '$named', '$span']) {
		if (record[key] !== undefined) out[key] = record[key];
	}
	out.$treeHandle = treeHandleOf(record);
	for (const key of ['$textOnly', '$format']) {
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
		$handle: _handle,
		$parentHandle: _parentHandle,
		$treeHandle: _treeHandle,
		$span: _span,
		$childIndex: _index,
		$textOnly: _textOnly,
		...rest
	} = data as T & Record<(typeof COORDINATE_KEYS)[number], unknown>;
	return rest;
}

/**
 * `markEdited` for a node edited in place: the node keeps its identity and
 * methods, and loses the coordinate that would fold it back to its pre-edit
 * bytes. A write of inner trivia is such an edit, since the coordinate's span
 * already covers the gap the new entries sit in.
 */
export function detachCoordinate(data: object): void {
	for (const key of COORDINATE_KEYS) delete (data as Record<string, unknown>)[key];
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
 * (the handles, `$span`, `$childIndex`) from every node that carries
 * storage — that node rebuilds from its slots, so neither its pre-edit
 * text nor the coordinate that would slice that text may cross.
 *
 * A node that still names its tree and was not rebuilt below crosses as its
 * coordinate alone (`foldsToCoordinate`), its `$span` and the `$treeHandle`
 * that span slices, which the transport's slot carrier
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
	for (const key of HANDLE_KEYS) delete out[key];
	delete out.$childIndex;
	delete out.$textOnly;
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
 * {@link toTransportData}. A coordinate that survives addresses its node's
 * text only: it crosses as the `$treeHandle` its span slices, stamped
 * `$textOnly` so no edge or gap reader takes layout evidence from it.
 */
export function stripStructuralProvenance<T>(root: T): T {
	const seen = new WeakSet<object>();
	const recurse = (value: unknown): void => {
		if (!isRecord(value) || typeof value.$type !== 'number') return;
		if (seen.has(value)) return;
		seen.add(value);
		if (hasStructure(value) && !isDerivedFromText(value)) {
			delete value.$text;
			for (const key of COORDINATE_KEYS) delete value[key];
		}
		const tree = treeHandleOf(value);
		if (tree !== undefined) {
			delete value.$handle;
			delete value.$parentHandle;
			value.$treeHandle = tree;
			value.$textOnly = true;
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
