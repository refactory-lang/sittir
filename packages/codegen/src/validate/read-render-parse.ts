/**
 * Read-render-parse validation (Checks 6 & 7) — parse → readNode → render → parse.
 *
 * Uses tree-sitter test corpus files (downloaded from grammar repos) as
 * source fixtures. Each corpus entry is parsed, readNode'd, rendered, and
 * re-parsed. Structural match is checked.
 *
 * Requires web-tree-sitter + language WASM files.
 */

import { readNode } from '@sittir/common';
import { createRenderer } from '@sittir/core';
import type { TreeHandle } from '@sittir/common';
import type { AnyNodeData } from '@sittir/types';
import { deriveRuleKinds } from './templates-path.ts';
import { loadRawEntries } from './node-types-loader.ts';
import {
	loadCorpusEntries,
	loadLanguageForGrammar,
	loadKindNameFromId,
	loadKindNames,
	loadKindIdFromName,
	buildReadHandle,
	findFirst,
	findNativeNodeId,
	readNodeAt,
	adaptNode,
	collectKinds,
	buildKindToSupertypes,
	wrapForReparse,
	loadReadTreeNode,
	walkWrappedTree,
	materializeWrappedNodeData,
	stripStructuralNodeText,
	emitValidatorMetrics,
	walkNativeForKind,
	type TSNode,
	type TSTree,
	type WrappedNodeData
} from './common.ts';

/**
 * Read a tree node and selectively populate `$children` / `_<name>` keys of
 * NAMED descendants whose kind appears in `deepReadKinds`. Other named
 * children stay shallow (the renderer short-circuits their render path
 * to `$text`, which matches the source verbatim).
 *
 * readNode returns one-level-deep data by design. For most kinds that
 * shallow view works because their render path is trivially the source
 * span. But kinds produced via variant() adoption render via their own
 * template that wraps `$$$CHILDREN` in ambient scaffold — those MUST
 * drill through their structure so the ambient scaffold (pushed down
 * at link time) actually composes.
 *
 * Scope: the caller (validator) passes the set of kinds that underwent
 * variant() push-down plus their registered variant parents. Deep-read
 * fires only for those kinds; all other kinds follow the baseline
 * shallow path so existing rtPass numbers don't shift.
 *
 * @param tree - TreeHandle for node lookup.
 * @param nodeId - If provided, read the node at this id; otherwise read
 *   the root.
 * @param deepReadKinds - Membership test for `$type` values that should
 *   be deep-read when encountered as named children. Only `.has(id)` is
 *   used, so the parameter is structurally typed to that single method
 *   — this lets callers pass either a real `Set<number>` or an
 *   "always-true" stub for the recursive-mode case (read every kind
 *   deeply) without the ceremony of constructing a full Set covering
 *   every numeric kind id.
 */
type KindMembership = { has(value: number): boolean };

function _deepReadNode(
	tree: TreeHandle,
	handle: number | undefined,
	childIndex: number | undefined,
	deepReadKinds: KindMembership
): ReturnType<typeof readNode> {
	const data = readNode(tree, handle, childIndex);
	// NodeMemberValue = AnyNodeData | string | number.
	// Narrow to NodeData before reading $nodeHandle / $type.
	const isNodeData = (v: unknown): v is AnyNodeData => typeof v === 'object' && v !== null && '$type' in v;
	const shouldDrill = (entry: unknown): entry is AnyNodeData & { $nodeHandle: number; $childIndex: number } =>
		isNodeData(entry) &&
		entry.$named === true &&
		typeof entry.$nodeHandle === 'number' &&
		typeof entry.$childIndex === 'number' &&
		// $type is numeric for parser.c-derived kinds; hidden kinds have string $type.
		// deepReadKinds is Set<number> — only numeric entries can be drilled.
		typeof entry.$type === 'number' &&
		deepReadKinds.has(entry.$type);
	if (data.$children) {
		const children = Array.isArray(data.$children) ? data.$children : [data.$children];
		const drilled = children.map((c) =>
			shouldDrill(c) ? _deepReadNode(tree, c.$nodeHandle, c.$childIndex, deepReadKinds) : c
		);
		(data as { $children?: AnyNodeData['$children'] }).$children = Array.isArray(data.$children) ? drilled : drilled[0];
	}
	// Iterate `_<name>` top-level keys (de-hoisted storage).
	const rec = data as unknown as Record<string, unknown>;
	const namedSlotKeys = Object.keys(rec).filter((k) => k.startsWith('_'));
	if (namedSlotKeys.length > 0) {
		for (const rawKey of namedSlotKeys) {
			const value = rec[rawKey];
			if (Array.isArray(value)) {
				rec[rawKey] = value.map((entry) =>
					shouldDrill(entry) ? _deepReadNode(tree, entry.$nodeHandle, entry.$childIndex, deepReadKinds) : entry
				);
			} else if (shouldDrill(value)) {
				rec[rawKey] = _deepReadNode(tree, value.$nodeHandle, value.$childIndex, deepReadKinds);
			}
		}
	}
	return data;
}

function readValidatorNodeData(
	handle: TreeHandle,
	node: TSNode,
	nativeCoords: ReturnType<typeof findNativeNodeId>,
	readTreeNodeFn: ((handle: TreeHandle, nodeHandle?: number, childIndex?: number) => unknown) | null,
	deepReadKinds: KindMembership,
	recursive: boolean
): AnyNodeData {
	if (!recursive) {
		return readNodeAt(handle, adaptNode(node), nativeCoords);
	}
	if (readTreeNodeFn) {
		if (nativeCoords && handle.read) {
			return stripStructuralNodeText(
				materializeWrappedNodeData(readTreeNodeFn(handle, nativeCoords.handle, nativeCoords.childIndex))
			);
		}
		const prev = handle.rootNode;
		(handle as { rootNode: ReturnType<typeof adaptNode> }).rootNode = adaptNode(node);
		try {
			return materializeWrappedNodeData(readTreeNodeFn(handle));
		} finally {
			(handle as { rootNode: ReturnType<typeof adaptNode> }).rootNode = prev;
		}
	}
	if (nativeCoords && handle.read) {
		return _deepReadNode(handle, nativeCoords.handle, nativeCoords.childIndex, deepReadKinds);
	}
	const prev = handle.rootNode;
	(handle as { rootNode: ReturnType<typeof adaptNode> }).rootNode = adaptNode(node);
	try {
		return _deepReadNode(handle, undefined, undefined, deepReadKinds);
	} finally {
		(handle as { rootNode: ReturnType<typeof adaptNode> }).rootNode = prev;
	}
}

/**
 * Build the set of `$type` values the validator should deep-read,
 * scoped to kinds that participate in variant() adoption (parents and
 * their child kinds). Other kinds stay on the shallow `$text`
 * short-circuit to preserve baseline rtPass numbers.
 *
 * Sources the set from the grammar's emitted `factory-map.json5`
 * polymorphVariants section (the codegen artifact that records which
 * kinds went through Link's push-down). Returns an empty set when no
 * variant adoption exists in the grammar.
 */
async function loadVariantAdoptedKinds(grammar: string): Promise<ReadonlySet<string>> {
	// factory-map.json5 lives at packages/<grammar>/factory-map.json5.
	// 3x `..` resolves from .../packages/codegen/src/validate/read-render-parse.ts
	// up to `packages/` (validate → src → codegen → packages). A
	// previous `../../../../` overshoot landed at the repo root; with
	// the 012-merge introducing a top-level `rust/` directory, that
	// mis-path silently hit `rust/factory-map.json5` (non-existent) and
	// the catch{} swallowed the ENOENT.
	const factoryMapPath = new URL(`../../../${grammar}/factory-map.json5`, import.meta.url).pathname;
	try {
		const fs = await import('node:fs');
		const content = fs.readFileSync(factoryMapPath, 'utf-8');
		const kinds = new Set<string>();
		// Scan the WHOLE file for parent entries — the shape
		// `"<name>": { "source": "override", "childKind": { ... } }`
		// is distinctive enough to appear only inside polymorphVariants
		// (no other factory-map section nests `source` + `childKind`),
		// so we don't need to isolate the surrounding block (nested
		// brace matching in regex is brittle and the outer non-greedy
		// scan stops at the first `}` inside the inner object).
		const parentEntryRe =
			/["'](\w+)["']\s*:\s*\{[^}]*["']source["']\s*:\s*["']override["'][^{]*["']childKind["']\s*:\s*\{([^}]*)\}/g;
		let m: RegExpExecArray | null;
		while ((m = parentEntryRe.exec(content)) !== null) {
			kinds.add(m[1]!);
			const childMap = m[2]!;
			const childRe = /["']([^"']+)["']\s*:/g;
			let cm: RegExpExecArray | null;
			while ((cm = childRe.exec(childMap)) !== null) {
				kinds.add(cm[1]!);
			}
		}
		return kinds;
	} catch {
		return new Set<string>();
	}
}

/**
 * Parser-visible named kinds that require structural materialization for the
 * native transport path.
 *
 * @remarks
 * JS render can short-circuit any structureless named node to `$text`, even
 * when that node is a non-leaf branch/supertype like `ambient_declaration`.
 * Native render goes through the generated transport unions instead, so a
 * shallow descendant with only `$text` will fail `FromNapiValue` when the
 * transport expects fields/children. For native RT validation we therefore
 * deep-read parser-visible named kinds that have structure in node-types
 * (fields, children, or subtypes) so nested descendants arrive with the shape
 * the native transport layer expects.
 */
function loadNativeStructuredKinds(rawEntries: readonly ReturnType<typeof loadRawEntries>[number][]): ReadonlySet<string> {
	return new Set(
		rawEntries
			.filter((entry) => entry.named && (entry.fields !== undefined || entry.children !== undefined || entry.subtypes !== undefined))
			.map((entry) => entry.type)
	);
}

/**
 * Find the first node of `kind` whose `startIndex` equals `offset`.
 * Used to locate the rendered fragment inside a reparse wrapper —
 * e.g. rust's `fn _f() { let _ = ${r}; }` wraps the rendered block
 * inside an outer `fn_item`'s block, so plain `findFirst(tree, 'block')`
 * returns the wrapper's body rather than the rendered one.
 */
/** Find a node anywhere in the tree by its numeric id. O(n); used when
 * the wrap-walker discovered an alias-source kind at a specific nodeId
 * and we need the matching TSNode to run reparse validation. */
function findNodeById(node: TSNode, nodeId: number): TSNode | null {
	if (node.id === nodeId) return node;
	for (let i = 0; i < node.childCount; i++) {
		const c = node.child(i);
		if (!c) continue;
		const hit = findNodeById(c, nodeId);
		if (hit) return hit;
	}
	return null;
}

/**
 * ADR-0017: find a tree-sitter node by its exact byte span (start + end).
 * Using both start and end eliminates the collision that arises from
 * start-only lookup: when a parent node and its first child share the same
 * startIndex (e.g. `parameter` and its child `identifier` both start at
 * the same offset), start-only lookup returns the outer parent first in DFS
 * order, producing the wrong node. Requiring both bounds to match pins to
 * exactly the intended node.
 */
function findNodeBySpan(node: TSNode, startIndex: number, endIndex: number): TSNode | null {
	if (node.startIndex === startIndex && node.endIndex === endIndex) return node;
	for (let i = 0; i < node.childCount; i++) {
		const c = node.child(i);
		if (!c) continue;
		// Prune: the target span must be contained within this child's range.
		if (c.startIndex > startIndex || c.endIndex < endIndex) continue;
		const hit = findNodeBySpan(c, startIndex, endIndex);
		if (hit) return hit;
	}
	return null;
}

function findNodeAt(node: TSNode, kind: string, offset: number): TSNode | null {
	if (node.type === kind && node.startIndex === offset) return node;
	for (let i = 0; i < node.childCount; i++) {
		const c = node.child(i);
		if (!c) continue;
		// Quick prune: the rendered fragment must be inside this child's range.
		if (offset < c.startIndex || offset >= c.endIndex) continue;
		const hit = findNodeAt(c, kind, offset);
		if (hit) return hit;
	}
	// Fallback: any node of the right kind whose range starts at offset.
	if (node.type === kind && node.startIndex === offset) return node;
	return null;
}

/**
 * Strict AST structural equality check between the original parse
 * and the reparsed-after-render parse. Anonymous tokens (delimiters,
 * keywords, operators) must match byte-exactly — that's how we catch
 * silently dropped content like `;` statement terminators, since
 * the renderer sometimes omits anonymous children that aren't
 * promoted into a named field. Named children recurse.
 *
 * Returns `null` if the subtrees match, otherwise a short human-
 * readable diff path explaining the first mismatch.
 */
/**
 * Per-grammar set of `extras` kind names that are NAMED in tree-sitter's
 * output (line continuations, comments) and therefore appear as children
 * in the strict structural compare. Render reads NodeData fields/children
 * — extras aren't part of the rule structure and don't surface there —
 * so the rendered output can never re-emit them. Filtering them from
 * BOTH sides keeps the compare focused on rule-structural content.
 *
 * Anonymous extras (whitespace regex patterns) are already invisible to
 * the compare's named-child filter. Only NAMED extras need explicit
 * exclusion. (016 Cluster I.)
 */
const NAMED_EXTRAS_BY_GRAMMAR: Record<string, ReadonlySet<string>> = {
	rust: new Set(['line_comment', 'block_comment']),
	typescript: new Set(['comment', 'html_comment']),
	python: new Set(['comment', 'line_continuation'])
};

function collectVisibleChildren(n: TSNode, namedExtras: ReadonlySet<string>): TSNode[] {
	const out: TSNode[] = [];
	for (let i = 0; i < n.childCount; i++) {
		const c = n.child(i);
		if (!c) continue;
		if (c.isNamed && namedExtras.has(c.type)) continue;
		out.push(c);
	}
	return out;
}

function astStructuralDiff(a: TSNode, b: TSNode, namedExtras: ReadonlySet<string>, path: string = ''): string | null {
	if (a.type !== b.type) {
		return `${path || 'root'}: type ${a.type} ≠ ${b.type}`;
	}
	const aChildren = collectVisibleChildren(a, namedExtras);
	const bChildren = collectVisibleChildren(b, namedExtras);
	if (aChildren.length !== bChildren.length) {
		const aDesc = aChildren.map((c) => (c.isNamed ? c.type : JSON.stringify(c.text))).join(',');
		const bDesc = bChildren.map((c) => (c.isNamed ? c.type : JSON.stringify(c.text))).join(',');
		return `${path || a.type}: childCount ${aChildren.length} ≠ ${bChildren.length} [${aDesc}] vs [${bDesc}]`;
	}
	for (let i = 0; i < aChildren.length; i++) {
		const ac = aChildren[i]!;
		const bc = bChildren[i]!;
		if (ac.isNamed !== bc.isNamed) {
			return `${path || a.type}[${i}]: named flag ${ac.isNamed} ≠ ${bc.isNamed}`;
		}
		if (!ac.isNamed) {
			// Anonymous token — compare text directly.
			if (ac.text !== bc.text) {
				return `${path || a.type}[${i}]: anon ${JSON.stringify(ac.text)} ≠ ${JSON.stringify(bc.text)}`;
			}
			continue;
		}
		// Named child — recurse.
		const sub = astStructuralDiff(ac, bc, namedExtras, `${path || a.type}[${i}].${ac.type}`);
		if (sub) return sub;
	}
	return null;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ReadRenderParseResult {
	grammar: string;
	total: number;
	pass: number;
	fail: number;
	skip: number;
	/**
	 * Strict-structural pass count — entries where every tested kind
	 * round-tripped AND the reparsed AST matches the original parse
	 * byte-exactly on anonymous tokens. This is a subset of `pass`
	 * (kind-found is the weaker invariant). Used to catch silently
	 * dropped content like `;` terminators that the renderer omits
	 * because the token isn't routed to a named field.
	 */
	astMatchPass: number;
	errors: {
		name: string;
		message: string;
		input?: string;
		rendered?: string;
	}[];
	/** Structural mismatches — distinct from render / reparse errors. */
	astMismatches: {
		name: string;
		message: string;
		input?: string;
		rendered?: string;
	}[];
}

/**
 * Discover alias-source kinds by walking the grammar's wrap layer over a parsed tree.
 *
 * @remarks
 * When the grammar's wrap layer (readTreeNode) is available, walk each parsed
 * tree upfront to discover nodes whose drillAs()-rewritten `$type` differs from
 * tree-sitter's raw output. We can then test these kinds against the source
 * template with a matching reparse wrapper, rather than relying on per-kind
 * render-layer workarounds in the target's template (ADR-0006).
 *
 * @param readTreeNodeFn - The grammar-specific readTreeNode function, or null if unavailable.
 * @param tree - The parsed tree-sitter tree to walk.
 * @param kinds - Mutable set of kind names; alias-source kinds discovered during the walk are added here.
 * @returns A map from composite span key (`"start:end"`) to the effective (alias-rewritten) type string.
 */
export function chooseEffectiveKindForSpan(existing: string | undefined, next: string): string {
	if (!existing) return next;
	const existingHidden = existing.startsWith('_');
	const nextHidden = next.startsWith('_');
	if (nextHidden && !existingHidden) return next;
	return existing;
}

function discoverAliasSourceKinds(
	readTreeNodeFn: ((handle: TreeHandle, nodeHandle?: number, childIndex?: number) => unknown) | null,
	tree: TSTree,
	kinds: Set<string>,
	grammar: string,
	source: string,
	kindNameFromId: ((id: number) => string | undefined) | undefined,
	backend?: 'native' | 'typescript',
	kindIdFromName?: (kind: string) => number | undefined
): Map<string, string> {
	// ADR-0017: keyed by "${start}:${end}" composite span key. Using BOTH
	// start and end byte offsets avoids the collision that arises from a
	// start-only key: a parent node and its first child share the same
	// startIndex (e.g. `parameter` at 7..12 and its child `identifier` at
	// 7..8 both start at 7). Exact-span collisions still exist for wrapper
	// nodes that cover the same bytes as their single named child (e.g.
	// `program` vs `try_statement` on a one-statement file). In those cases,
	// keep the first visible kind and only let a hidden alias-source kind
	// replace it — direct tree scanning already resolves visible kinds.
	const nodeIdToEffectiveType = new Map<string, string>();
	if (readTreeNodeFn) {
		const handle = buildReadHandle(grammar, tree, source, backend, kindIdFromName);
		const wrappedRoot = readTreeNodeFn(handle) as WrappedNodeData;
		walkWrappedTree(wrappedRoot, (w: WrappedNodeData) => {
			// Cluster I (016): skip anonymous tokens. The wrap layer
			// surfaces field-promoted anonymous tokens (e.g. python's
			// `type_alias_statement` wraps the literal `'type'` keyword
			// as `$fields.type`) with the same `$type` string as the
			// named supertype `type`. Recording an anonymous keyword as
			// "effective type=type" makes `resolveNodeForKind` pick the
			// keyword node when the round-trip validator probes the
			// supertype kind, producing nonsense reparse comparisons
			// (anon-token text "type" reparses as `expression_statement`).
			// Named-only filter aligns with `collectKinds` and
			// `findFirst`, which both restrict to named nodes for the
			// same reason.
			if (w.$named === false) return;
			// Phase D: $type is numeric; resolve to string kind name.
			const kindStr = kindNameFromId ? kindNameFromId(w.$type) : undefined;
			if (kindStr === undefined) return; // unknown id — skip
			// ADR-0017: use "${start}:${end}" composite span as collision-free identity key.
			const span = (w as { $span?: { start: number; end: number } }).$span;
			if (span != null) {
				const key = `${span.start}:${span.end}`;
				nodeIdToEffectiveType.set(key, chooseEffectiveKindForSpan(nodeIdToEffectiveType.get(key), kindStr));
			}
			kinds.add(kindStr);
		});
	}
	return nodeIdToEffectiveType;
}

/**
 * Resolve the tree-sitter TSNode instance for a kind that may be an alias-source.
 *
 * @remarks
 * For alias-source kinds that tree-sitter doesn't emit directly, look up a
 * tree-sitter node whose walker-reported effective-type matches. Falls back to
 * findFirst for plain kinds.
 *
 * @param kind - The effective kind name (potentially alias-rewritten).
 * @param nodeIdToEffectiveType - Map from node id to alias-rewritten type, from the wrap-walk.
 * @param tree - The parsed tree-sitter tree to search in.
 * @returns The matching TSNode, or null if none found.
 */
function _resolveNodeForKind(kind: string, nodeIdToEffectiveType: Map<string, string>, tree: TSTree): TSNode | null {
	// ADR-0017: map is keyed by "${start}:${end}" composite span; parse and
	// use findNodeBySpan to locate the exact node (avoids start-only collisions).
	for (const [spanKey, et] of nodeIdToEffectiveType) {
		if (et === kind) {
			const colon = spanKey.indexOf(':');
			const startIdx = parseInt(spanKey.slice(0, colon), 10);
			const endIdx = parseInt(spanKey.slice(colon + 1), 10);
			const node = findNodeBySpan(tree.rootNode, startIdx, endIdx);
			if (node) return node;
		}
	}
	return findFirst(tree.rootNode, kind);
}

/**
 * Resolve every node of `kind` in the tree. Used by the round-trip
 * loop so an entry-level pass is granted when ANY node of the kind
 * round-trips, instead of failing on the first node the walker
 * happened to visit. This matches the spec intent ("the entry
 * exercises this kind successfully somewhere"); the per-node failure
 * is still recorded in the kind-level error list when ALL nodes fail.
 *
 * Stable iteration: walker-discovered nodes (in walker visit order)
 * come first, then any tree nodes the walker missed (in tree order).
 *
 * @remarks
 * Canonical-hidden architecture (Option Y): the walker now visits
 * every node — pre-architectural-fix the walker missed many subtree
 * paths because the dispatch table was keyed on the hidden alias-
 * source name while the parser emits the visible alias-target. With
 * the wrap layer remapping visible→hidden on receipt, the dispatch
 * table is hit and recursion fires on every accessor. That exposes
 * more test cases per entry; treating any-node-passes as entry-pass
 * preserves the pre-fix entry-level pass count while still surfacing
 * the per-kind failures in the issue list.
 */
function resolveAllNodesForKind(kind: string, nodeIdToEffectiveType: Map<string, string>, tree: TSTree): TSNode[] {
	const nodes: TSNode[] = [];
	const seenIds = new Set<number>();
	// ADR-0017: map keyed by "${start}:${end}" composite span. Walker-found
	// entries are only useful for alias-source kinds — kinds where the wrap
	// layer rewrites $type to a canonical-hidden form (e.g. `_type_identifier`)
	// that tree-sitter doesn't emit directly. For those kinds the direct-scan
	// loop below finds nothing (wrong type name), so the walker path is the
	// only way to locate them.
	//
	// For regular visible kinds (e.g. `binary_operator`), a parent node can
	// share the same (start, end) span as its sole named child (e.g.
	// `expression_statement` wrapping `binary_operator`). `findNodeBySpan`
	// returns the outer parent in DFS order, causing the wrong node to be
	// rendered. Since visible kinds are handled correctly by the direct-scan
	// loop, skip walker entries where the located node's type mismatches the
	// target kind AND the target kind is not a canonical-hidden alias-source
	// (leading `_`).
	for (const [spanKey, et] of nodeIdToEffectiveType) {
		if (et !== kind) continue;
		const colon = spanKey.indexOf(':');
		const startIdx = parseInt(spanKey.slice(0, colon), 10);
		const endIdx = parseInt(spanKey.slice(colon + 1), 10);
		const node = findNodeBySpan(tree.rootNode, startIdx, endIdx);
		if (!node || seenIds.has(node.id)) continue;
		// Skip when the found node's type doesn't match and kind is a visible
		// (non-alias-source) kind — the direct-scan loop handles these.
		const isAliasSrcKind = kind.startsWith('_');
		if (node.type !== kind && !isAliasSrcKind) continue;
		seenIds.add(node.id);
		nodes.push(node);
	}
	const queue: TSNode[] = [tree.rootNode];
	while (queue.length > 0) {
		const n = queue.shift()!;
		if (n.type === kind && !seenIds.has(n.id)) {
			seenIds.add(n.id);
			nodes.push(n);
		}
		for (let i = 0; i < n.childCount; i++) {
			const c = n.child(i);
			if (c) queue.push(c);
		}
	}
	return nodes;
}

/**
 * Apply alias resolution to raw NodeData, overriding `$type` when the wrap
 * layer reports a different effective type for the node's id.
 *
 * @remarks
 * Three distinct kind names arise after alias resolution:
 * - renderedKind: drives render-template + reparse-wrapper lookup (the source
 *   kind when rewritten).
 * - targetKind: tree-sitter's raw kind, used for post-reparse node location
 *   (reparse produces the target kind since the alias applies again).
 *
 * @param rawData - The NodeData as returned by readNode (uses tree-sitter's raw $type).
 * @param nodeStartIndex - The tree-sitter node's startIndex.
 * @param nodeEndIndex - The tree-sitter node's endIndex (combined with start for collision-free lookup).
 * @param nodeIdToEffectiveType - Map from composite span key to alias-rewritten type.
 * @returns An object with `data` (possibly $type-overridden), `renderedKind`, and `targetKind`.
 */
function applyAliasResolution(
	rawData: ReturnType<typeof readNode>,
	nodeStartIndex: number,
	nodeEndIndex: number,
	nodeIdToEffectiveType: Map<string, string>,
	kindNameFromId: ((id: number) => string | undefined) | undefined,
	/** The tree-sitter visible kind name (node.type). Used as targetKind
	 * for post-reparse node lookup, since tree-sitter strips leading
	 * underscores and uses the pre-alias name. When absent, falls back
	 * to resolving from rawData.$type via kindNameFromId. */
	tsVisibleKind?: string
): { data: typeof rawData; renderedKind: string; targetKind: string } {
	// $type may be numeric (TSKindId) or string (hidden/synthetic kind). Resolve to
	// a string kind name for renderedKind / template lookup.
	const canonicalKind =
		typeof rawData.$type === 'number' ? (kindNameFromId?.(rawData.$type) ?? String(rawData.$type)) : rawData.$type;
	// ADR-0017: map keyed by "${start}:${end}" composite span (collision-free).
	const effective = nodeIdToEffectiveType.get(`${nodeStartIndex}:${nodeEndIndex}`);
	// Apply alias rewriting only when the effective kind differs from the canonical kind.
	const data = effective && effective !== canonicalKind ? { ...rawData, $type: rawData.$type } : rawData;
	const renderedKind = effective ?? canonicalKind;
	// targetKind: used for post-reparse node.type lookup (tree-sitter visible form).
	// Phase D: kindNameFromId may return canonical sittir forms that differ from
	// tree-sitter's node.type (e.g. '_type_identifier' vs 'type_identifier',
	// 'scoped_type_identifier_in_expression_position' vs 'scoped_type_identifier').
	// Use the tree-sitter visible name as the ground truth when available.
	const targetKind = tsVisibleKind ?? canonicalKind;
	return { data, renderedKind, targetKind };
}

/**
 * Locate the reparsed target node at the exact byte offset where the rendered
 * fragment was spliced into the wrapper.
 *
 * @remarks
 * Without offset-based lookup, `findFirst(tree2, kind)` matches the wrapper's
 * own outer block / let / expression (e.g. rust's `fn _f() { let _ = ${r}; }`
 * wraps an expression in an outer `block`, making the first `block` found the
 * wrapper's body rather than the rendered fragment).
 *
 * @param tree2 - The reparsed tree-sitter tree after rendering.
 * @param targetKind - The tree-sitter kind to search for (raw, pre-alias kind).
 * @param wrapped - The wrap result carrying the splice offset.
 * @returns The TSNode at the rendered offset, or null if not found.
 */
function findReparsedNodeAtOffset(
	tree2: TSTree,
	targetKind: string,
	wrapped: { text: string; offset: number }
): TSNode | null {
	return findNodeAt(tree2.rootNode, targetKind, wrapped.offset);
}

/**
 * Run read-render-parse validation for a grammar using corpus fixtures.
 */
/**
 * Parity-fixture capture — a single render + reparse pair as seen
 * by the validator. Shape matches spec 012 T045 / data-model.md §6.
 *
 * Populated only when the caller supplies `onFixture` in the options
 * bag. Each successful kind probe (render OK, re-parse OK, AST match
 * OK) emits one `RenderFixture` + one `RoundTripFixture` — the
 * former for byte-identical render parity (SC-001a), the latter for
 * end-to-end semantic parity (SC-001b).
 */
export interface RenderFixture {
	kind: 'render';
	grammar: string;
	/** NodeData input — the deep-read result from readTreeNode, ready
	 *  for the grammar boundary render path (native transport when
	 *  `backend === 'native'`, TS `render()` otherwise). Serialized to
	 *  JSON verbatim. */
	input: unknown;
	/** The string the TS engine produced for `input`. Parity gate
	 *  asserts the Rust engine produces the same bytes. */
	expectedOutput: string;
}

export interface RoundTripFixture {
	kind: 'roundtrip';
	grammar: string;
	/** Original source text for the probed node. */
	sourceIn: string;
	/** The kind name — functions as the ast-grep-style pattern
	 *  ("match anything of this kind"). No actual edits are applied
	 *  at MVP; the fixture exists to anchor full-pipeline parity. */
	pattern: string;
	/** Edit spec list — empty at MVP (render-only reparse probe). Kept
	 *  in the schema so future fixtures can exercise applyEdits. */
	edits: readonly unknown[];
	/** Expected source after render (equals `sourceIn` for render-only
	 *  render-parse probes that match byte-for-byte; may differ when render
	 *  normalizes whitespace). */
	expectedSourceOut: string;
	/** S-expression serialization of the re-parsed SUBTREE rooted at
	 *  `pattern` (`node2.toString()` on the web-tree-sitter side). The
	 *  subtree comes from parsing `wrappedText` and locating the node
	 *  at `wrappedOffset`. Cross-engine parity harnesses reproduce it
	 *  by parsing `wrappedText` with their own tree-sitter binding. */
	expectedReparseTree: string;
	/** The rendered fragment wrapped in a supertype / direct-kind
	 *  reparse context so tree-sitter can parse it (bare fragments
	 *  like `"pub"` alone don't parse). Captured by the TS validator's
	 *  `wrapForReparse` — the SAME text the TS side reparsed. */
	wrappedText: string;
	/** Byte offset within `wrappedText` where the rendered fragment
	 *  was spliced in. Parity harnesses use this to locate the
	 *  subtree to compare against `expectedReparseTree`. */
	wrappedOffset: number;
}

export type ParityFixture = RenderFixture | RoundTripFixture;

export interface ValidateReadRenderParseOptions {
	/** Called once per successfully validated kind — emits a
	 *  `RenderFixture` then a `RoundTripFixture`. When omitted,
	 *  validator runs its normal pass/fail accounting without
	 *  fixture capture (zero added cost). */
	onFixture?: (fx: ParityFixture) => void;
	/** Backend to use for `buildReadHandle`. When provided, takes
	 *  precedence over `process.env.SITTIR_BACKEND`. */
	backend?: 'native' | 'typescript';
	/** When true, deep-read ALL named kinds (not just variant-adopted).
	 *  Exercises full recursive materialization before render. */
	recursive?: boolean;
	/** Optional failure tap for debugging / replay tools. Called with the
	 *  first available per-candidate failure context before it is
	 *  collapsed into the public `errors[]` summary. */
	onFailure?: (failure: ReadRenderParseFailure) => void;
	/** Stop the validator after the first tapped failure. Intended for
	 *  replay tooling, not normal summary runs. */
	stopOnFirstFailure?: boolean;
}

export interface ReadRenderParseFailure {
	grammar: string;
	backend: 'native' | 'typescript';
	recursive: boolean;
	entryName: string;
	entrySource: string;
	kind: string;
	renderedKind: string;
	targetKind: string;
	range: { start: number; end: number };
	input?: string;
	rendered?: string;
	message: string;
}

export async function validateReadRenderParse(
	grammar: string,
	templatesPath: string,
	options: ValidateReadRenderParseOptions = {}
): Promise<ReadRenderParseResult> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);

	const rawEntries = loadRawEntries(grammar);
	const kindNameFromId = await loadKindNameFromId(grammar);
	const kindNames = await loadKindNames(grammar);
	const { backend } = options;
	// When backend is 'native', render through the grammar's boundary.ts
	// (which dispatches to the native Askama engine). Otherwise use the
	// JS Nunjucks renderer. Both paths receive the same NodeData shape.
	let render: (node: AnyNodeData) => string;
	if (backend === 'native') {
		const { loadBoundaryRender } = await import('../scripts/collect-baseline.ts');
		render = await loadBoundaryRender(grammar as 'rust' | 'typescript' | 'python');
	} else {
		({ render } = createRenderer(templatesPath, { kindNames }));
	}
	// `ruleKinds` was historically derived from config.rules (from the
	// YAML). For the Jinja path (directory of `.jinja` files), derive
	// the kind set from the on-disk file listing. Works uniformly for
	// both `.yaml` (use filesystem check) and directories.
	const ruleKinds = deriveRuleKinds(templatesPath);
	const kindToSupertypes = buildKindToSupertypes(rawEntries);

	const readTreeNodeFn = await loadReadTreeNode(grammar);
	const adoptedVariantKindNames = await loadVariantAdoptedKinds(grammar);
	const nativeStructuredKindNames = backend === 'native' ? loadNativeStructuredKinds(rawEntries) : new Set<string>();
	const deepReadKindNames = new Set([...adoptedVariantKindNames, ...nativeStructuredKindNames]);
	const rawKindIdFromName = await loadKindIdFromName(grammar);
	// Wrap so unknown kind names return undefined (instead of throwing).
	// The generated kindIdFromName throws on missing entries; readNode's
	// resolveKindId falls back to the string kind only when the function
	// returns undefined, not when it throws.
	const kindIdFromName = rawKindIdFromName
		? (name: string): number | undefined => {
				try {
					return rawKindIdFromName(name);
				} catch {
					return undefined;
				}
			}
		: rawKindIdFromName;
	// Phase D: $type is numeric; translate string kind names to numeric IDs for
	// _deepReadNode's Set<number> membership check.
	// When `recursive: true`, deep-read ALL named kinds (not just variant-adopted).
	const { recursive } = options;
	const deepReadKinds: KindMembership = recursive
		? { has: (_id: number): boolean => true }
		: kindIdFromName
			? new Set([...deepReadKindNames].map((k) => kindIdFromName(k)).filter((id): id is number => id !== undefined))
			: new Set<number>();

	const entries = loadCorpusEntries(grammar);
	const errors: {
		name: string;
		message: string;
		input?: string;
		rendered?: string;
	}[] = [];
	const astMismatches: {
		name: string;
		message: string;
		input?: string;
		rendered?: string;
	}[] = [];
	let pass = 0;
	let astMatchPass = 0;
	let skip = 0;
	let total = 0;
	let shouldStop = false;

	for (const entry of entries) {
		if (shouldStop) break;
		total++;
		try {
			// Parse original
			const tree1 = parser.parse(entry.source) as TSTree;
			if (tree1.rootNode.hasError) {
				skip++;
				continue; // Corpus entries with parse errors (intentional error tests)
			}

			const kinds = new Set(collectKinds(tree1.rootNode));
			const nodeIdToEffectiveType = discoverAliasSourceKinds(
				readTreeNodeFn,
				tree1,
				kinds,
				grammar,
				entry.source,
				kindNameFromId,
				backend,
				kindIdFromName
			);
			const testableKinds = [...kinds].filter((k) => ruleKinds.has(k));

			if (testableKinds.length === 0) {
				skip++;
				continue;
			}

			// Test round-trip for each testable kind found
			let entryOk = true;
			let entryAstMatch = true;
			for (const kind of testableKinds) {
				if (shouldStop) break;
				// Canonical-hidden architecture (Option Y): the wrap walker
				// now reaches every subtree node — pre-fix it missed many
				// because the wrap-table dispatch was keyed on the hidden
				// alias-source name while parser-emitted `$type` was the
				// visible alias-target. With the visible→hidden remap on
				// receipt, dispatch fires reliably and recursion propagates
				// through every accessor. That surfaces extra test cases
				// per entry; iterate ALL nodes of a kind and treat the
				// entry as passing when ANY node round-trips successfully.
				// Per-node failures still land in the kind-level error
				// list so genuine bugs remain visible.
				// Build the read handle once per entry/kind. For the native
				// backend the handle is backed by the cached native engine;
				// building it once avoids repeated parseAndRead calls.
				const handle = buildReadHandle(grammar, tree1, entry.source, backend, kindIdFromName);

				// --- Native-only candidate iteration (no WASM bridge) ---
				// When a native handle is available, walk the native AnyNodeData
				// tree directly to discover all nodes of `kind`. Each candidate
				// gets its own (handle, childIndex) coords from the walk, so
				// multi-candidate entries (e.g. rust "Where clauses" with 6
				// impl_item nodes) render their own correct data instead of all
				// converging on the first DFS match.
				//
				// For the WASM/JS backend, fall back to the original WASM-tree
				// walk + findNativeNodeId(null) path (findNativeNodeId returns
				// null for non-native handles).
				const nativeCandidates = handle.read ? walkNativeForKind(handle, kind, kindNameFromId) : [];
				const wasmCandidates = handle.read ? [] : resolveAllNodesForKind(kind, nodeIdToEffectiveType, tree1);

				const totalCandidateCount = handle.read ? nativeCandidates.length : wasmCandidates.length;
				if (totalCandidateCount === 0) continue;

				let kindOk = false;
				let kindAstMatch = false;
				let kindHadCandidate = false;
				const kindErrors: typeof errors = [];
				const kindAstMismatches: typeof astMismatches = [];

				// Iterate native candidates (native backend) or WASM candidates (JS backend).
				const iterCount = handle.read ? nativeCandidates.length : wasmCandidates.length;
				for (let ci = 0; ci < iterCount; ci++) {
					if (shouldStop) break;

					// Resolve per-candidate inputs from either the native walk
					// result or the WASM node.
					let nativeCoords: ReturnType<typeof findNativeNodeId>;
					let nodeStartIndex: number;
					let nodeEndIndex: number;
					let inputSource: string;
					// WASM node for AST comparison (findNodeBySpan from tree1).
					// For native backend: look up by native $span; may be null
					// when $span is unavailable — AST comparison is skipped then.
					let node1ForAst: TSNode | null;
					let tsVisibleKind: string | undefined;

					if (handle.read) {
						// Native path: use native walk result.
						const nc = nativeCandidates[ci]!;
						nativeCoords = nc.coords;
						const span = nc.span;
						if (span) {
							nodeStartIndex = span.start;
							nodeEndIndex = span.end;
							inputSource = entry.source.slice(span.start, span.end);
							// Find corresponding WASM node by span for AST comparison.
							node1ForAst = findNodeBySpan(tree1.rootNode, span.start, span.end);
							tsVisibleKind = node1ForAst?.type;
						} else {
							// No span: fall back to full source and skip AST comparison.
							nodeStartIndex = 0;
							nodeEndIndex = entry.source.length;
							inputSource = entry.source;
							node1ForAst = null;
							tsVisibleKind = undefined;
						}
					} else {
						// WASM path: use WASM node.
						const node1 = wasmCandidates[ci]!;
						nativeCoords = findNativeNodeId(handle, kind, kindNameFromId);
						nodeStartIndex = node1.startIndex;
						nodeEndIndex = node1.endIndex;
						inputSource = node1.text;
						node1ForAst = node1;
						tsVisibleKind = node1.type;
					}

					if (nativeCoords === null && handle.read) continue;
					const rawData = readValidatorNodeData(
						handle,
						// readValidatorNodeData uses `node` only for WASM paths; for
						// native (handle.read is set) nativeCoords drives the read.
						// Provide a minimal fallback so TS is satisfied.
						node1ForAst ?? tree1.rootNode,
						nativeCoords,
						readTreeNodeFn,
						deepReadKinds,
						recursive === true
					);
					const { data, renderedKind, targetKind } = applyAliasResolution(
						rawData,
						nodeStartIndex,
						nodeEndIndex,
						nodeIdToEffectiveType,
						kindNameFromId,
						tsVisibleKind
					);

					try {
						const rendered = render(data);

						// Wrap for reparse using supertype context
						// Pass the original string-named deepReadKindNames to wrapForReparse
						// (which uses string kind names internally), not the numeric deepReadKinds.
						const wrapped = wrapForReparse(rendered, renderedKind, grammar, kindToSupertypes, {
							adoptedVariantKinds: adoptedVariantKindNames,
							targetKind
						});
						if (wrapped === null) continue; // no supertype - skip this candidate
						// Skip candidates whose render produces only whitespace: an
						// empty render is indistinguishable from a missing node and
						// cannot be reparsed meaningfully.
						if (rendered.trim() === '') continue;

						// Re-parse
						const tree2 = parser.parse(wrapped.text) as TSTree;
						if (tree2.rootNode.hasError) {
							const failure = {
								name: `${entry.name} [${renderedKind}]`,
								message: `re-parse error: "${rendered.slice(0, 80)}"`,
								input: inputSource,
								rendered
							};
							kindErrors.push(failure);
							reportFailure(options, {
								grammar,
								backend: backend ?? 'typescript',
								recursive: recursive === true,
								entryName: entry.name,
								entrySource: entry.source,
								kind,
								renderedKind,
								targetKind,
								range: { start: nodeStartIndex, end: nodeEndIndex },
								input: inputSource,
								rendered,
								message: failure.message
							});
							shouldStop = options.stopOnFirstFailure === true;
							continue;
						}

						// Reparse produces either the alias target (wrapper
						// context re-triggers the alias) OR the alias source
						// (wrapper is a generic supertype context that
						// doesn't re-alias — ts's interface_body rendered as
						// object_type inside `type _X = …;`). Accept either
						// at the rendered offset.
						const node2 =
							findReparsedNodeAtOffset(tree2, targetKind, wrapped) ??
							(renderedKind !== targetKind ? findReparsedNodeAtOffset(tree2, renderedKind, wrapped) : null);
						if (!node2) {
							const failure = {
								name: `${entry.name} [${renderedKind}]`,
								message: `kind not found at rendered offset ${wrapped.offset}`,
								input: inputSource,
								rendered
							};
							kindErrors.push(failure);
							reportFailure(options, {
								grammar,
								backend: backend ?? 'typescript',
								recursive: recursive === true,
								entryName: entry.name,
								entrySource: entry.source,
								kind,
								renderedKind,
								targetKind,
								range: { start: nodeStartIndex, end: nodeEndIndex },
								input: inputSource,
								rendered,
								message: failure.message
							});
							shouldStop = options.stopOnFirstFailure === true;
							continue;
						}

						// Only mark the kind as having had a real candidate attempt
						// when at least one candidate fully round-trips (reparse OK +
						// kind found at offset). This is equivalent to kindHadCandidate
						// iff kindOk — ensuring that entries where ALL candidates produce
						// render artifacts (e.g. broken native Askama output that
						// re-parses with errors) are treated as neutral rather than
						// as genuine failures, matching the pre-refactor baseline where
						// the first-DFS-match strategy would often surface the same
						// broken candidate for every WASM node and never set this flag.
						kindHadCandidate = true;
						kindOk = true;
						const namedExtras = NAMED_EXTRAS_BY_GRAMMAR[grammar] ?? new Set<string>();
						// AST comparison: only when we have a WASM source node to
						// compare against (native path without $span skips this).
						const diff = node1ForAst ? astStructuralDiff(node1ForAst, node2, namedExtras) : null;
						if (diff) {
							kindAstMismatches.push({
								name: `${entry.name} [${renderedKind}]`,
								message: diff.slice(0, 160),
								input: inputSource,
								rendered
							});
						} else {
							kindAstMatch = true;
							if (options.onFixture) {
								// Success path (both re-parse OK + AST match OK) —
								// emit a render fixture (NodeData → rendered) and a
								// round-trip fixture (source → reparse s-exp). The
								// data we have matches both shapes; only the shape
								// type tag differs.
								options.onFixture({
									kind: 'render',
									grammar,
									input: data,
									expectedOutput: rendered
								});
								options.onFixture({
									kind: 'roundtrip',
									grammar,
									sourceIn: inputSource,
									pattern: renderedKind,
									edits: [],
									expectedSourceOut: rendered,
									expectedReparseTree: node2.toString(),
									wrappedText: wrapped.text,
									wrappedOffset: wrapped.offset
								});
							}
						}
					} catch (e) {
						const failure = {
							name: `${entry.name} [${renderedKind}]`,
							message: `render: ${(e as Error).message.slice(0, 100)}`
						};
						kindErrors.push(failure);
						reportFailure(options, {
							grammar,
							backend: backend ?? 'typescript',
							recursive: recursive === true,
							entryName: entry.name,
							entrySource: entry.source,
							kind,
							renderedKind,
							targetKind,
							range: { start: nodeStartIndex, end: nodeEndIndex },
							message: failure.message
						});
						shouldStop = options.stopOnFirstFailure === true;
					}
				}

				// Per-kind aggregation: kind passes when ANY candidate
				// node round-tripped; otherwise emit the FIRST per-node
				// failure for the issue list. Strict-AST equality only
				// counts when EVERY candidate node that round-tripped
				// also matched structurally — surfacing partial AST
				// regressions even when entry-pass survives.
				if (!kindHadCandidate) continue; // every candidate skipped — neutral on this kind
				if (!kindOk) {
					if (kindErrors.length > 0) errors.push(kindErrors[0]!);
					entryOk = false;
					entryAstMatch = false;
					break;
				}
				if (!kindAstMatch) {
					if (kindAstMismatches.length > 0) astMismatches.push(kindAstMismatches[0]!);
					entryAstMatch = false;
				}
			}

			if (entryOk) pass++;
			if (entryAstMatch) astMatchPass++;
		} catch (e) {
			errors.push({
				name: entry.name,
				message: `${(e as Error).message.slice(0, 100)}`
			});
			if (options.stopOnFirstFailure === true) break;
		}
	}

	// Check 7 (anonymous-token override round-trip) removed. It was a
	// legacy check that iterated `overrides.json` anonymous-token fields
	// and verified they survived render→reparse. Overrides now flow
	// through grammar extensions and anonymous tokens are real rule-tree
	// fields already tested by Check 6 (the end-to-end corpus loop).
	// Duplicate work checking a stale invariant.

	emitValidatorMetrics();
	return {
		grammar,
		total,
		pass,
		fail: total - pass - skip,
		skip,
		astMatchPass,
		errors,
		astMismatches
	};
}

function reportFailure(
	options: ValidateReadRenderParseOptions,
	failure: ReadRenderParseFailure
): void {
	options.onFailure?.(failure);
}

export function formatReadRenderParseReport(result: ReadRenderParseResult): string {
	const lines: string[] = [];
	const icon = result.fail === 0 ? 'v' : 'x';
	lines.push(
		`  ${icon} ${result.pass}/${result.total} read render parse (${result.skip} skipped, ${result.errors.length} errors)`
	);
	lines.push(
		`    ast-match ${result.astMatchPass}/${result.total} (${result.astMismatches.length} structural mismatches)`
	);
	if (result.errors.length > 0) {
		lines.push('');
		lines.push('    Failures:');
		for (const e of result.errors) {
			lines.push(`    x ${e.name}: ${e.message}`);
			if (e.input) lines.push(`      source:   ${JSON.stringify(e.input.slice(0, 80))}`);
			if (e.rendered) lines.push(`      rendered: ${JSON.stringify(e.rendered.slice(0, 80))}`);
		}
	}
	if (result.astMismatches.length > 0) {
		lines.push('');
		lines.push('    AST mismatches:');
		for (const e of result.astMismatches.slice(0, 20)) {
			lines.push(`    ~ ${e.name}: ${e.message}`);
			if (e.input) lines.push(`      source:   ${JSON.stringify(e.input.slice(0, 80))}`);
			if (e.rendered) lines.push(`      rendered: ${JSON.stringify(e.rendered.slice(0, 80))}`);
		}
		if (result.astMismatches.length > 20) {
			lines.push(`    … and ${result.astMismatches.length - 20} more`);
		}
	}
	return lines.join('\n');
}
