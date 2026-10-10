/**
 * Read-render-parse validation (Checks 6 & 7) — parse → readUntypedNode → render → parse.
 *
 * Uses tree-sitter test corpus files (downloaded from grammar repos) as
 * source fixtures. Each corpus entry is parsed'd, rendered, and
 * re-parsed. Structural match is checked.
 *
 * Requires web-tree-sitter + language WASM files.
 */

import { writeSync } from 'node:fs';

import type { AnyUntypedNode, NodeTrivia } from '@sittir/types';
import { sourceSpans, spanSlicer, type TriviaSides } from '@sittir/common';
import {
	carrySource,
	isStorageKey,
	mapTriviaEntries,
	readNode as readTransport,
	readTrivia,
	spanOf,
	toDetachedTransportData,
	type SourceFlankEvidence,
	type TransportLayout,
	type TriviaView
} from '@sittir/common/utils';
import { deriveRuleKinds } from './render-bodies.ts';
import { load } from '../codegen-surface.ts';

const { loadRawEntries } = await load('nodeTypesLoader');
import {
	loadCorpusEntries,
	loadLanguageForGrammar,
	loadKindNameFromId,
	loadCanonicalKindNameFromId,
	buildReadHandle,
	buildKindToSupertypes,
	loadReparseHosts,
	wrapForReparse,
	readNodeOf,
	walkWrappedTree,
	materializeDetached,
	emitValidatorMetrics,
	loadNodeModel,
	loadIsLeafKind,
	dedupeMismatchesByContainment,
	type TSNode,
	type TSTree,
	type TypedNode,
	type AccessorThrowRecord,
	type ValidatorSkip,
	loadNativeEngine,
	triviaViewOf
} from './common.ts';

/**
 * The kinds that participate in variant() adoption (each override-defined
 * parent and every child kind it dispatches to), from the node model's
 * `polymorphVariants`. Every candidate is deep-read regardless; this set
 * only decides which candidates render inside a reparse wrapper. Empty
 * when the grammar has no variant adoption.
 */
/**
 * Owner-kind → visible variant child kinds, from the node model's
 * `polymorphVariants` (the same stamped fact `loadVariantAdoptedKinds`
 * reads). `call_expression` → {call_expression_call, …} etc. Used by
 * {@link astStructuralDiff} to treat sittir's own group-lift layer as
 * transparent when the ORIGINAL parse came through an upstream
 * variant-aliased context that never had it.
 */
export async function loadVariantChildKindsByOwner(grammar: string): Promise<ReadonlyMap<string, ReadonlySet<string>>> {
	const { polymorphVariants } = await loadNodeModel(grammar);
	const byOwner = new Map<string, ReadonlySet<string>>();
	for (const [parent, desc] of Object.entries(polymorphVariants)) {
		byOwner.set(parent, new Set(Object.keys(desc.childKind)));
	}
	return byOwner;
}

export async function loadVariantAdoptedKinds(grammar: string): Promise<ReadonlySet<string>> {
	const { polymorphVariants } = await loadNodeModel(grammar);
	const kinds = new Set<string>();
	for (const [parent, desc] of Object.entries(polymorphVariants)) {
		kinds.add(parent);
		for (const childKind of Object.keys(desc.childKind)) kinds.add(childKind);
	}
	return kinds;
}

/**
 * Find the first node of `kind` whose `startIndex` equals `offset`.
 * Used to locate the rendered fragment inside a reparse wrapper —
 * e.g. rust's `fn _f() { let _ = ${r}; }` wraps the rendered block
 * inside an outer `fn_item`'s block, so plain `findFirst(tree, 'block')`
 * returns the wrapper's body rather than the rendered one.
 */

/**
 * Find a tree-sitter node by its exact byte span (start + end).
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

/**
 * Find the same-span wasm node whose `type` equals `kind`, preferring it over
 * the outermost same-span node.
 *
 * @remarks
 * A wrapped source-kind candidate frequently shares its EXACT span with an
 * enclosing wasm node (e.g. `match_pattern` wraps the inner `tuple_struct_pattern`
 * at the identical span in no-guard arms). Anchoring the AST compare on the
 * outermost same-span node (plain {@link findNodeBySpan}) then reports a kind-name
 * mismatch (`match_pattern ≠ tuple_struct_pattern`) even when the render is
 * byte-identical. Preferring the same-span node whose type matches the
 * candidate's kind anchors the compare on the right node. Falls back to the
 * outermost node when no same-span descendant matches (e.g. alias-source kinds
 * whose wasm display name differs).
 */
function findNodeBySpanOfKind(node: TSNode, startIndex: number, endIndex: number, kind: string): TSNode | null {
	if (node.startIndex === startIndex && node.endIndex === endIndex && node.type === kind) return node;
	for (let i = 0; i < node.childCount; i++) {
		const c = node.child(i);
		if (!c) continue;
		if (c.startIndex > startIndex || c.endIndex < endIndex) continue;
		const hit = findNodeBySpanOfKind(c, startIndex, endIndex, kind);
		if (hit) return hit;
	}
	return null;
}

/**
 * Locate the first parse defect (MISSING or ERROR node) in a re-parsed
 * tree and describe it as a cause signature: the broken construct, not
 * the entry that happened to contain it. Root-kind entries (source_file/
 * program/module) fail whenever ANY nested render is off, so bucketing
 * re-parse failures by entry kind measures blast radius, not defects —
 * this pins the actual divergence point instead.
 */
export function firstParseDefect(node: TSNode): string | null {
	if (node.isMissing) {
		return `MISSING "${node.type}" in ${node.parent?.type ?? 'root'}`;
	}
	if (node.isError) {
		const tokenHead = node.text.replace(/\s+/g, ' ');
		return `ERROR in ${node.parent?.type ?? 'root'} at "${tokenHead}"`;
	}
	for (let i = 0; i < node.childCount; i++) {
		const c = node.child(i);
		if (!c || !c.hasError) continue;
		const hit = firstParseDefect(c);
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
 * promoted into a named field. Named leaves must match in text too, so a
 * changed spelling or inserted character inside a leaf is a mismatch. Named
 * children with children recurse.
 *
 * Extras (comments) are not children here: they are compared once, at the
 * root, as one ordered sequence of (kind, text) over each subtree in source
 * order, so a comment seated under another parent keeps its bytes' verdict.
 *
 * Returns `null` if the subtrees match, otherwise a short human-
 * readable diff path explaining the first mismatch.
 */
function collectVisibleChildren(n: TSNode): TSNode[] {
	const out: TSNode[] = [];
	for (let i = 0; i < n.childCount; i++) {
		const c = n.child(i);
		if (!c) continue;
		if (c.isNamed && c.isExtra) continue;
		out.push(c);
	}
	return out;
}

function extrasOf(n: TSNode, out: [string, string][] = []): [string, string][] {
	if (n.isNamed && n.isExtra) {
		out.push([n.type, n.text]);
		return out;
	}
	for (let i = 0; i < n.childCount; i++) {
		const c = n.child(i);
		if (c) extrasOf(c, out);
	}
	return out;
}

function extrasDiff(a: TSNode, b: TSNode): string | null {
	const aExtras = extrasOf(a);
	const bExtras = extrasOf(b);
	const at = aExtras.findIndex(([kind, text], i) => bExtras[i]?.[0] !== kind || bExtras[i]?.[1] !== text);
	if (at < 0 && aExtras.length === bExtras.length) return null;
	const show = (e: [string, string] | undefined): string => (e === undefined ? 'none' : `${e[0]} ${JSON.stringify(e[1])}`);
	const index = at < 0 ? Math.min(aExtras.length, bExtras.length) : at;
	return `extras[${index}]: ${show(aExtras[index])} ≠ ${show(bExtras[index])}`;
}

export function astStructuralDiff(
	a: TSNode,
	b: TSNode,
	path: string = '',
	variantChildKinds?: ReadonlyMap<string, ReadonlySet<string>>
): string | null {
	const structural = structuralDiff(a, b, path, variantChildKinds);
	return structural ?? (path === '' ? extrasDiff(a, b) : null);
}

function structuralDiff(
	a: TSNode,
	b: TSNode,
	path: string = '',
	variantChildKinds?: ReadonlyMap<string, ReadonlySet<string>>
): string | null {
	if (a.grammarId !== b.grammarId) {
		return `${path || 'root'}: grammar type ${a.grammarType} ≠ ${b.grammarType}`;
	}
	if (a.isNamed && a.childCount === 0 && b.childCount === 0 && a.text !== b.text) {
		return `${path || a.type}: text ${JSON.stringify(a.text)} ≠ ${JSON.stringify(b.text)}`;
	}
	const aChildren = collectVisibleChildren(a);
	let bChildren = collectVisibleChildren(b);
	// Group-lift transparency: sittir's enrich lifts choice arms of canonical
	// rules into visible variant children (`call_expression` parses as
	// `(call_expression (call_expression_call …))`; `parenthesized_expression`
	// keeps its parens and carries the lifted arm BETWEEN them). Upstream
	// variant-aliased contexts — decorator calls/parens, type_query's
	// `typeof import(…)` — are separate flat rules DISPLAYED under the same
	// canonical name, so the original parse has the arm's children inline
	// while the reparse (always routed through the canonical rule by the
	// wrapper) carries the lift layer. Splice each reparse-side variant child
	// open in place when the original has no child of that kind; the arm's
	// actual children are still compared exactly. The catalog comes from the
	// node model's stamped `polymorphVariants`, not name convention. Only the
	// b side can carry an unmatched layer — wrappers never route through
	// upstream variant contexts. Repeat owners where BOTH sides carry the
	// variant kind (class_body's class_body_method children) are untouched.
	const ownedVariants = variantChildKinds?.get(b.type);
	if (ownedVariants) {
		const aTypes = new Set(aChildren.map((c) => c.type));
		if (bChildren.some((c) => ownedVariants.has(c.type) && !aTypes.has(c.type))) {
			bChildren = bChildren.flatMap((c) =>
				ownedVariants.has(c.type) && !aTypes.has(c.type) ? collectVisibleChildren(c) : [c]
			);
		}
	}
	// Reparse-side-only trailing zero-width marker tolerance: external-scanner
	// markers like typescript's automatic_semicolon are zero-width and fire
	// based on lookahead context (that is what ASI is). A synthetic reparse
	// wrapper ends at EOF, a context the original corpus position may not
	// have had, so the reparsed node can gain a trailing marker the original
	// lacked — e.g. a bare `{}` statement_block at EOF absorbs an
	// automatic_semicolon child that the same bytes mid-class do not.
	// Tolerating it is byte-safe: a zero-width child adds no content, and
	// every other child is still compared exactly. The OPPOSITE direction
	// (original had the marker, reparse lacks it) stays a failure — there the
	// marker's rendered text (e.g. "\n") was dropped, which is real content
	// loss. Reproducing the not-at-EOF context in the wrapper instead (by
	// appending `;`) is not an option: the trailing `;` suppresses the
	// legitimately-regained markers of entries whose ORIGINAL ends in one,
	// and can even flip which grammar arm the fragment parses into.
	if (bChildren.length === aChildren.length + 1) {
		const extra = bChildren[bChildren.length - 1]!;
		if (extra.startIndex === extra.endIndex) bChildren.pop();
	}
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
		const sub = structuralDiff(ac, bc, `${path || a.type}[${i}].${ac.type}`, variantChildKinds);
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
		kind: string;
		entry?: string;
		message: string;
		input?: string;
		rendered?: string;
		start: number;
		end: number;
	}[];
	skips: ValidatorSkip[];
	excluded: ValidatorSkip[];
	trivia: ValidatorSkip[];
}

/**
 * Width, in rendered bytes, of a candidate's own leading trivia — the text
 * `render_with_trivia!` (Rust) / its JS-engine counterpart writes BEFORE the
 * candidate's own content. The candidate's real node starts this many bytes
 * after where its `rendered` string (trivia included) was spliced into the
 * reparse wrapper, so the offset-based lookup below must skip past it.
 * Returns 0 when there's no leading trivia (the common case).
 *
 * Derived by differencing two engine renders (with vs. without the leading
 * trivia) rather than rendering each trivia entry standalone: trivia entries
 * are embedded raw at read time (never wrapped into model shape), and only
 * the in-context `TriviaTransport` decode carries the verbatim `$text`
 * fallback for that raw shape — a standalone root render of the same entry
 * hard-fails decoding (`Missing field _content`).
 *
 * `triviaOf` is the trivia view the render itself uses (`readTrivia`), so the
 * width counts what the render printed: a leading comment and the whitespace
 * between it and the node, never the root's outer-edge whitespace. The
 * stripped copy keeps an empty `leading` side rather than none: an empty side
 * still refuses the fold to a coordinate, so both renders print the node from
 * its storage and differ only by the leading trivia. The stripped copy keeps
 * the node's source identity, so an alias envelope's content still crosses
 * without the line gap the envelope owns. Both are measured
 * without trailing whitespace, which only the outer edge contributes.
 */
export function leadingTriviaRenderedWidth(
	data: AnyUntypedNode,
	render: (node: AnyUntypedNode) => string,
	triviaOf: (node: object) => NodeTrivia | undefined
): number {
	const trivia = triviaOf(data);
	const leading = trivia?.leading;
	if (!leading || leading.length === 0) return 0;
	const stripped = { ...data, $_layout: { ...data.$_layout, trivia: { ...trivia, leading: [] } } } as AnyUntypedNode;
	carrySource(data, stripped);
	return render(data).trimEnd().length - render(stripped).trimEnd().length;
}

/**
 * A list's kept flanks as text: the source from the start of the line its
 * opener sits on through its closer, with the list's span counted from the
 * window's start. That is every byte the native flank classifier reads: the
 * whitespace on both sides of the list, the opener's line for the depth the
 * list opens at, and the list's own last line for the depth it closes at.
 */
export function flankWindow(
	source: Buffer,
	flank: SourceFlankEvidence
): { readonly $text: string; readonly $span: { readonly start: number; readonly end: number }; readonly $before: boolean; readonly $after: boolean } {
	const head = source.subarray(0, flank.$span.start).toString('utf8');
	const opened = head.trimEnd();
	const from = Buffer.byteLength(opened.slice(0, opened.lastIndexOf('\n') + 1), 'utf8');
	const tail = source.subarray(flank.$span.end).toString('utf8');
	const closer = tail.trimStart();
	const through = closer.length === 0 ? tail : tail.slice(0, tail.length - closer.length + String.fromCodePoint(closer.codePointAt(0)!).length);
	const to = flank.$span.end + Buffer.byteLength(through, 'utf8');
	return {
		$text: source.subarray(from, to).toString('utf8'),
		$span: { start: flank.$span.start - from, end: flank.$span.end - from },
		$before: flank.$before,
		$after: flank.$after
	};
}

/**
 * A render fixture's input, detached from the engine that read it: the
 * transport the render itself sends, unfolded (`toDetachedTransportData`,
 * through `view`, the view the render read), with everything that names a tree turned into the
 * text it names. A coordinate names the tree its engine still holds, so it
 * means nothing in another process: every handle and `$childIndex` is
 * dropped. A storage-less leaf kind (`isLeafKind`) keeps its identity with
 * its own bytes as `$text` (sliced from `source` when the reader captured
 * none); a storage-less compound keeps only its identity and rebuilds from
 * its empty slots, and a storage-less trivia entry becomes its text with the
 * kind the reader stamped on it, `{ $type, $text }`, plus `$sameLine` and
 * `$tokensBetween` when it shares its owner's row. The layout evidence a list
 * keeps from its source travels as text, in the node's `$_layout`: each kept
 * list gap as its bytes (`gap: { $text }`), and kept flanks as a window of the
 * source (`flank: { $text, $span }`, `flankWindow`).
 */
export function selfContainedRenderInput(
	data: unknown,
	source: string,
	isLeafKind: (kindId: number) => boolean,
	view: TriviaView
): unknown {
	const slice = spanSlicer(source);
	const bytes = Buffer.from(source, 'utf8');
	const textOf = (record: Record<string, unknown>): string | undefined => {
		if (typeof record.$text === 'string') return record.$text;
		const span = spanOf(record);
		return span === undefined ? undefined : slice(span);
	};
	const hasStorage = (record: Record<string, unknown>): boolean => Object.keys(record).some(isStorageKey);
	const walkTrivia = (entries: readonly unknown[]): unknown[] =>
		entries.map((entry) => {
			if (entry === null || typeof entry !== 'object' || hasStorage(entry as Record<string, unknown>)) return walk(entry);
			const record = entry as Record<string, unknown>;
			const text = textOf(record);
			if (text === undefined) return walk(entry);
			const kind = typeof record.$type === 'number' ? { $type: record.$type } : {};
			if (record.$sameLine !== true) return { ...kind, $text: text };
			return { ...kind, $text: text, $sameLine: true, $tokensBetween: record.$tokensBetween };
		});
	const layoutOf = (layout: TransportLayout): Record<string, unknown> => ({
		...(layout.trivia === undefined ? {} : { trivia: mapTriviaEntries(layout.trivia as TriviaSides<unknown>, walkTrivia) }),
		...(layout.gap === undefined ? {} : { gap: { $text: slice(layout.gap.$span) } }),
		...(layout.flank === undefined ? {} : { flank: flankWindow(bytes, layout.flank) })
	});
	const walk = (value: unknown): unknown => {
		if (Array.isArray(value)) return value.map(walk);
		if (value === null || typeof value !== 'object') return value;
		const record = value as Record<string, unknown>;
		const out: Record<string, unknown> = {};
		for (const [key, raw] of Object.entries(record)) {
			if (key === '$treeHandle') continue;
			if (key === '$_layout') out.$_layout = layoutOf(raw as TransportLayout);
			else out[key] = isStorageKey(key) ? walk(raw) : raw;
		}
		if (!hasStorage(out) && typeof out.$type === 'number' && isLeafKind(out.$type) && out.$text === undefined) {
			const text = textOf(record);
			if (text !== undefined) out.$text = text;
		}
		return out;
	};
	return walk(toDetachedTransportData(data as AnyUntypedNode, view));
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
 * `offsetAdjust` shifts the lookup past a candidate's own leading trivia
 * (comments etc. rendered before its content) — the wrapper splices in the
 * FULL `rendered` string (trivia included), so the candidate's own node in
 * the reparsed tree starts `offsetAdjust` bytes after the splice point, not
 * at it. Pass `leadingTriviaRenderedWidth(data, render)` for this; 0 when
 * the candidate has no leading trivia (the common case, no-op).
 *
 * @param tree2 - The reparsed tree-sitter tree after rendering.
 * @param targetKind - The tree-sitter kind to search for (raw, pre-alias kind).
 * @param wrapped - The wrap result carrying the splice offset.
 * @param offsetAdjust - Bytes to skip past the candidate's own leading trivia.
 * @returns The TSNode at the rendered offset, or null if not found.
 */
export function findReparsedNodeAtOffset(
	tree2: TSTree,
	targetKind: string,
	wrapped: { text: string; offset: number },
	offsetAdjust = 0
): TSNode | null {
	return findNodeAt(tree2.rootNode, targetKind, wrapped.offset + offsetAdjust);
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
	/** The kind the fixture renders, by name. */
	pattern: string;
	/** UntypedNode input — the deep-read result from readNode, made
	 *  self-contained by `selfContainedRenderInput` so the engine's render
	 *  can take it in any process. Serialized to JSON verbatim. */
	input: unknown;
	/** The bytes the engine rendered for `input` when the fixture was
	 *  captured; the parity gate asserts a fresh render reproduces them. */
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
	 *  in the schema for future fixtures. */
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
	backend?: 'native';
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
	backend: 'native';
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

/** What rendering a node and reparsing it needs from its grammar: the parser, the native render, and the reparse wrappers. */
export interface RenderReparseContext {
	readonly grammar: string;
	readonly parser: { parse(text: string): unknown };
	readonly render: (node: AnyUntypedNode) => string;
	readonly triviaOf: (node: object) => NodeTrivia | undefined;
	readonly kindToSupertypes: ReturnType<typeof buildKindToSupertypes>;
	readonly adoptedVariantKinds: ReadonlySet<string>;
	readonly root: Awaited<ReturnType<typeof loadNodeModel>>['root'];
	readonly variantChildKinds: ReadonlyMap<string, ReadonlySet<string>>;
	readonly placements: ReadonlyMap<string, Placement>;
}

/** Where a split kind sits: the nearest ancestor that is no split rule, and the source around the kind inside it. */
export interface Placement {
	readonly kind: string;
	readonly display: string;
	readonly prefix: string;
	readonly suffix: string;
}

/**
 * How a node's render-and-reparse ended: excluded (no reparse wrapper for its
 * kind, or an empty render), failed (the reparse has an error, or the kind is
 * not at the rendered offset), or round-tripped, with the AST difference from
 * `source` when one is given.
 */
export type RenderReparseOutcome =
	| { readonly status: 'excluded'; readonly reason: 'no-reparse-wrapper' | 'empty-render'; readonly rendered: string }
	| { readonly status: 'failed'; readonly message: string; readonly rendered: string }
	| {
			readonly status: 'round-trip';
			readonly rendered: string;
			readonly wrapped: NonNullable<ReturnType<typeof wrapForReparse>>;
			readonly reparsed: TSNode;
			readonly astDiff: string | null;
	  };

/** `rendered` inside its kind's reparse host, or, for a split kind with no host of its own, inside its placement's owner. */
export function wrapRendered(
	rendered: string,
	renderedKind: string,
	targetKind: string,
	ctx: Pick<RenderReparseContext, 'grammar' | 'kindToSupertypes' | 'adoptedVariantKinds' | 'root' | 'placements'>
): ReturnType<typeof wrapForReparse> {
	const wrap = (text: string, kind: string, target: string) =>
		wrapForReparse(text, kind, ctx.grammar, ctx.kindToSupertypes, {
			adoptedVariantKinds: ctx.adoptedVariantKinds,
			targetKind: target,
			root: ctx.root
		});
	const direct = wrap(rendered, renderedKind, targetKind);
	const placement = ctx.placements.get(renderedKind);
	if (direct !== null || placement === undefined) return direct;
	const placed = wrap(`${placement.prefix}${rendered}${placement.suffix}`, placement.kind, placement.display);
	return placed === null ? null : { text: placed.text, offset: placed.offset + placement.prefix.length };
}

/**
 * Render `data` with the native engine, reparse the text inside its kind's
 * reparse wrapper, find the reparsed node of `targetKind` (or `renderedKind`)
 * at the rendered offset (the root when `treeRoot`), and compare its AST with
 * `source`. A render that throws propagates. `dumpLabel` turns on the render
 * and reparse dumps for one entry.
 */
export function renderReparse(
	data: AnyUntypedNode,
	renderedKind: string,
	targetKind: string,
	source: TSNode | null,
	treeRoot: boolean,
	ctx: RenderReparseContext,
	dumpLabel?: string
): RenderReparseOutcome {
	const rendered = ctx.render(data);
	if (dumpLabel !== undefined) {
		writeSync(2, `[dump-render] ${dumpLabel} data=${JSON.stringify(data)}\n`);
		writeSync(2, `[dump-render] ${dumpLabel} rendered=${JSON.stringify(rendered)}\n`);
	}
	const wrapped = wrapRendered(rendered, renderedKind, targetKind, ctx);
	if (wrapped === null) return { status: 'excluded', reason: 'no-reparse-wrapper', rendered };
	if (rendered.trim() === '') return { status: 'excluded', reason: 'empty-render', rendered };
	const tree2 = ctx.parser.parse(wrapped.text) as TSTree;
	if (dumpLabel !== undefined) {
		writeSync(
			2,
			`[dump-reparse] ${dumpLabel} hasError=${tree2.rootNode.hasError} wrappedText=${JSON.stringify(wrapped.text)} sexp=${JSON.stringify(tree2.rootNode.toString().slice(0, 300))}\n`
		);
	}
	if (tree2.rootNode.hasError) {
		return { status: 'failed', message: `re-parse error [${firstParseDefect(tree2.rootNode) ?? 'unlocated'}]`, rendered };
	}
	const triviaOffsetAdjust = leadingTriviaRenderedWidth(data, ctx.render, ctx.triviaOf);
	const reparsed = treeRoot
		? tree2.rootNode
		: (findReparsedNodeAtOffset(tree2, targetKind, wrapped, triviaOffsetAdjust) ??
			(renderedKind !== targetKind ? findReparsedNodeAtOffset(tree2, renderedKind, wrapped, triviaOffsetAdjust) : null));
	if (!reparsed) {
		return {
			status: 'failed',
			message: `kind not found at rendered offset ${wrapped.offset}${/^\s/.test(rendered) ? ' [leading-whitespace render]' : ''}`,
			rendered
		};
	}
	return {
		status: 'round-trip',
		rendered,
		wrapped,
		reparsed,
		astDiff: source ? astStructuralDiff(source, reparsed, '', ctx.variantChildKinds) : null
	};
}

/** Each visible split kind's placement, from its first occurrence in the corpus. */
function placementsOf(grammar: string, parser: RenderReparseContext['parser'], splitFrom: Readonly<Record<string, string>> | undefined): ReadonlyMap<string, Placement> {
	const splitKinds = new Set(Object.keys(splitFrom ?? {}).filter((kind) => !kind.startsWith('_')));
	const placements = new Map<string, Placement>();
	if (splitKinds.size === 0) return placements;
	for (const entry of loadCorpusEntries(grammar)) {
		const spans = sourceSpans(entry.source);
		const visit = (node: TSNode): void => {
			if (splitKinds.has(node.grammarType) && !placements.has(node.grammarType)) {
				let outer = node.parent;
				while (outer !== null && splitKinds.has(outer.grammarType)) outer = outer.parent;
				if (outer !== null)
					placements.set(node.grammarType, {
						kind: outer.grammarType,
						display: outer.type,
						prefix: spans.slice({ start: outer.startIndex, end: node.startIndex }),
						suffix: spans.slice({ start: node.endIndex, end: outer.endIndex })
					});
			}
			for (const child of node.namedChildren) if (child !== null) visit(child);
		};
		visit((parser.parse(entry.source) as TSTree).rootNode);
		if (placements.size === splitKinds.size) break;
	}
	return placements;
}

/** Load what `renderReparse` needs for `grammar`, rendering through `nativeEngine`. */

export async function loadRenderReparseContext(
	grammar: string,
	parser: RenderReparseContext['parser'],
	nativeEngine: Awaited<ReturnType<typeof loadNativeEngine>>
): Promise<RenderReparseContext> {
	await loadReparseHosts(grammar);
	const model = await loadNodeModel(grammar);
	return {
		grammar,
		parser,
		render: (node) => nativeEngine.render(node).toString(),
		triviaOf: (node) => readTrivia(node, nativeEngine.diagnostics.lineGapsOf),
		kindToSupertypes: buildKindToSupertypes(loadRawEntries(grammar)),
		adoptedVariantKinds: await loadVariantAdoptedKinds(grammar),
		root: model.root,
		variantChildKinds: await loadVariantChildKindsByOwner(grammar),
		placements: placementsOf(grammar, parser, model.splitFrom)
	};
}

export async function validateReadRenderParse(
	grammar: string,
	options: ValidateReadRenderParseOptions = {}
): Promise<ReadRenderParseResult> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);

	const kindNameFromId = await loadKindNameFromId(grammar);
	const { backend } = options;
	const nativeEngine = await loadNativeEngine(grammar);
	const renderReparseContext = await loadRenderReparseContext(grammar, parser, nativeEngine);
	const view = triviaViewOf(nativeEngine);
	// The kinds the renderer can handle are those with an emitted body.
	const ruleKinds = deriveRuleKinds(grammar);

	const readNode = await readNodeOf(grammar);
	const isLeafKind = await loadIsLeafKind(grammar);
	const canonicalKindNameFromId = await loadCanonicalKindNameFromId(grammar);
	const { recursive } = options;
	const entries = loadCorpusEntries(grammar);
	const errors: {
		name: string;
		message: string;
		input?: string;
		rendered?: string;
	}[] = [];
	const astMismatches: {
		kind: string;
		entry?: string;
		message: string;
		input?: string;
		rendered?: string;
		start: number;
		end: number;
	}[] = [];
	const skips: ValidatorSkip[] = [];
	const excluded: ValidatorSkip[] = [];
	const trivia: ValidatorSkip[] = [];
	// A read refused while an entry is walked or a candidate materialized
	// fails that entry: no refusal is a warning.
	let refused: AccessorThrowRecord[] = [];
	const onAccessorThrow = (rec: AccessorThrowRecord): void => {
		refused.push(rec);
	};
	const refusalsOf = (entry: { name: string; source: string }): typeof errors =>
		refused.splice(0).map((rec) => ({
			name: `${entry.name} [${String(rec.type)}]`,
			message: `read: ${rec.key} (${rec.accessor}): ${rec.message}`,
			input: entry.source
		}));
	let pass = 0;
	let astMatchPass = 0;
	let total = 0;
	let shouldStop = false;

	for (const entry of entries) {
		if (shouldStop) break;
		total++;
		refused = [];
		try {
			// Parse original
			const tree1 = parser.parse(entry.source) as TSTree;
		const spans = sourceSpans(entry.source);
			if (tree1.rootNode.hasError) {
				skips.push({ entry: entry.name, reason: 'parse-error', input: entry.source });
				if (process.env.SITTIR_VALIDATOR_ENTRY_LOG) {
					console.log(`ENTRY\t${recursive ? 'deep' : 'shallow'}\t${entry.name}\tskip-parse-error\tast-fail`);
				}
				continue; // Corpus entries with parse errors (intentional error tests)
			}

			// Candidate enumeration by SOURCE kind — the CANONICAL catalog name of
			// the wire `$type` (the grammar symbol the read stamps). Display names
			// are non-injective at alias-source kinds (a true `token_tree` and a
			// `delim_token_tree` occurrence both display "token_tree"), so keying
			// by display would merge kinds that need e.g. disjoint reparse
			// wrappers; display names are resolved per candidate below, only at
			// the WASM `.type` seams. Build the native read handle and walk the
			// WRAPPED tree ONCE.
			const handle = await buildReadHandle(grammar, entry.source);
			const candidatesByKind = new Map<
				string,
				{ start: number; end: number; node: TypedNode; displayKind: string }[]
			>();
			if (readNode && handle.read) {
				const wrappedRoot = readNode(handle) as TypedNode;
				const seen = new Set<string>();
				walkWrappedTree(
					wrappedRoot,
					(w: TypedNode) => {
						if (w.$named === false) return;
						const displayKind = kindNameFromId?.(w.$type);
						const sourceKind = canonicalKindNameFromId?.(w.$type);
						// Testable-surface filter is CANONICAL-keyed, like the bucketing:
						// template filenames carry canonical spellings, so hidden minted
						// kinds (whose display name differs) are admitted and probed
						// against their own templates rather than silently skipped.
						if (displayKind === undefined || sourceKind === undefined || !ruleKinds.has(sourceKind)) return;
						const span = spanOf(w);
						if (span == null) return;
						const dedup = `${sourceKind}@${span.start}:${span.end}`;
						if (seen.has(dedup)) return;
						seen.add(dedup);
						const list = candidatesByKind.get(sourceKind) ?? [];
						list.push({ start: span.start, end: span.end, node: w, displayKind });
						candidatesByKind.set(sourceKind, list);
					},
					onAccessorThrow
				);
			}
			const refusals = refusalsOf(entry);
			errors.push(...refusals);
			const testableKinds = [...candidatesByKind.keys()];

			if (testableKinds.length === 0) {
				if (refusals.length > 0) continue;
				skips.push({ entry: entry.name, reason: 'no-testable-kind', input: entry.source });
				if (process.env.SITTIR_VALIDATOR_ENTRY_LOG) {
					console.log(`ENTRY\t${recursive ? 'deep' : 'shallow'}\t${entry.name}\tskip-no-testable\tast-fail`);
				}
				continue;
			}

			// Test round-trip for each testable kind found
			let entryOk = refusals.length === 0;
			let entryAstMatch = entryOk;
			// Tracks whether ANY kind in this entry ever reached a genuine
			// round-trip attempt (kindHadCandidate=true below) — as opposed to
			// every candidate silently `continue`-ing via a neutral skip
			// (no supertype context, empty render). Without this, an entry
			// where EVERY kind's candidates are all neutrally skipped falls
			// through with entryOk/entryAstMatch still at their initial `true`,
			// counting as a pass despite testing nothing at all.
			let entryHadAnyCandidate = !entryOk;
			// A candidate that throws while its input is read, rendered or
			// captured is a failure in its own right: it is reported and fails
			// the entry even when another candidate of its kind round-trips.
			const reportThrown = (failure: (typeof errors)[number]): void => {
				errors.push(failure);
				entryHadAnyCandidate = true;
				entryOk = false;
				entryAstMatch = false;
			};
			for (const kind of testableKinds) {
				if (shouldStop) break;

				let kindOk = false;
				let kindAstMatch = false;
				let kindHadCandidate = false;
				const kindErrors: typeof errors = [];
				const kindAstMismatches: typeof astMismatches = [];

				for (const cand of candidatesByKind.get(kind)!) {
					if (shouldStop) break;
					const inputSource = spans.slice(cand);
					const indices = spans.toIndices(cand);
					// WASM node at this span: the AST-compare target and the parser
					// DISPLAY kind (targetKind) used for post-reparse node lookup.
					// Prefer the same-span node whose type matches the candidate's
					// DISPLAY kind — WASM `.type` speaks display names, so the
					// canonical bucket kind can never match here (so the compare
					// anchors on `tuple_struct_pattern`, not the enclosing same-span
					// `match_pattern`); fall back to the outermost.
					const node1ForAst =
						findNodeBySpanOfKind(tree1.rootNode, indices.start, indices.end, cand.displayKind) ??
						findNodeBySpan(tree1.rootNode, indices.start, indices.end);
					const tsVisibleKind = node1ForAst?.type;

					// Materialize the wrapped node directly — it already IS its source
					// kind. renderedKind (source) drives the render template; targetKind
					// (display) drives the post-reparse node lookup.
					//
					// Shallow mode (`recursive !== true`): read the node one level down
					// through its coordinate instead — its children stay coordinates.
					// This preserves the read-render-parse-shallow metric's meaning
					// (render() fed coordinate-bearing data, the shape lazy callers
					// send) as distinct from the deep run's full materialization.
					// Falls back to deep materialization when the wrapped node carries
					// no coordinate.
					const treeRoot = cand.displayKind === tree1.rootNode.type;
					let data: AnyUntypedNode;
					try {
						const at = (cand.node as AnyUntypedNode).$_layout?.at;
						data =
							recursive !== true && at !== undefined && handle.read
								? (readTransport(handle, at) as AnyUntypedNode)
								: (materializeDetached(cand.node, onAccessorThrow) as AnyUntypedNode);
					} catch (e) {
						reportThrown({
							name: `${entry.name} [${kind}]`,
							message: `read: ${(e as Error).message}`,
							input: inputSource
						});
						continue;
					}
					const renderedKind = kind;
					const targetKind = tsVisibleKind ?? cand.displayKind;

					// Emit a per-kind progress breadcrumb to stderr when running as
					// an isolation worker (SITTIR_ISOLATE_WORKER=1). MUST use
					// fs.writeSync(2, …) — `process.stderr.write` is BUFFERED for a
					// piped stderr (the child case), so an unflushed breadcrumb is
					// LOST on SIGSEGV and the parent mis-attributes the crash to an
					// earlier kind. writeSync bypasses the stream buffer so the
					// breadcrumb is on the fd before render() can fault.
					if (process.env['SITTIR_ISOLATE_WORKER'] === '1') {
						writeSync(2, `[isolate-progress] ${grammar} ${String(kind)}\n`);
					}
					try {
						const outcome = renderReparse(
							data,
							renderedKind,
							targetKind,
							node1ForAst,
							treeRoot,
							renderReparseContext,
							process.env['SITTIR_VALIDATOR_DUMP_RENDER'] && entry.name === process.env['SITTIR_VALIDATOR_DUMP_RENDER']
								? `mode=${recursive ? 'deep' : 'shallow'} entry=${entry.name} kind=${String(kind)}`
								: undefined
						);
						if (outcome.status === 'excluded') {
							excluded.push({ entry: entry.name, kind, reason: outcome.reason, input: inputSource });
							continue;
						}
						const { rendered } = outcome;
						if (outcome.status === 'failed') {
							const failure = {
								name: `${entry.name} [${renderedKind}]`,
								message: outcome.message,
								input: inputSource,
								rendered
							};
							kindErrors.push(failure);
							reportFailure(options, {
								grammar,
								backend: backend ?? 'native',
								recursive: recursive === true,
								entryName: entry.name,
								entrySource: entry.source,
								kind,
								renderedKind,
								targetKind,
								range: { start: cand.start, end: cand.end },
								input: inputSource,
								rendered,
								message: failure.message
							});
							shouldStop = options.stopOnFirstFailure === true;
							continue;
						}
						const { wrapped, reparsed: node2 } = outcome;

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
						// AST comparison: only when we have a WASM source node to
						// compare against (native path without $span skips this).
						const diff = outcome.astDiff;
						if (diff) {
							kindAstMismatches.push({
								kind: renderedKind,
								entry: entry.name,
								message: diff,
								input: inputSource,
								rendered,
								start: cand.start,
								end: cand.end
							});
						} else {
							kindAstMatch = true;
							if (options.onFixture) {
								// Success path (both re-parse OK + AST match OK) —
								// emit a render fixture (UntypedNode → rendered) and a
								// round-trip fixture (source → reparse s-exp). The
								// data we have matches both shapes; only the shape
								// type tag differs.
								options.onFixture({
									kind: 'render',
									grammar,
									pattern: renderedKind,
									input: selfContainedRenderInput(data, entry.source, isLeafKind, view),
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
							message: `render: ${(e as Error).message}`,
							input: inputSource
						};
						reportThrown(failure);
						reportFailure(options, {
							grammar,
							backend: backend ?? 'native',
							recursive: recursive === true,
							entryName: entry.name,
							entrySource: entry.source,
							kind,
							renderedKind,
							targetKind,
							range: { start: cand.start, end: cand.end },
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
				if (process.env.SITTIR_VALIDATOR_KIND_LOG) {
					const outcome = kindHadCandidate ? (kindOk ? 'pass' : 'fail') : kindErrors.length > 0 ? 'fail' : 'neutral';
					console.log(`KIND\t${recursive ? 'deep' : 'shallow'}\t${entry.name}\t${kind}\t${outcome}`);
				}
				if (!kindHadCandidate) {
					// `kindHadCandidate` only flips on a full round-trip SUCCESS,
					// so a kind where every candidate genuinely ATTEMPTED and
					// FAILED (re-parse error / kind not found — the paths that
					// push kindErrors; a thrown candidate is already reported by
					// reportThrown) lands here exactly like a kind
					// whose candidates were all neutrally skipped (no supertype,
					// empty render — paths that push nothing). Distinguish by the
					// collected errors: real failures must be REPORTED and score
					// the entry as a failure — silently `continue`-ing here made
					// 100%-failing kinds invisible to diff-failures entirely (no
					// error line, no fail count), which masked a whole regression
					// class from the standard tooling.
					if (kindErrors.length > 0) {
						errors.push(...kindErrors);
						entryHadAnyCandidate = true;
						entryOk = false;
						entryAstMatch = false;
						continue;
					}
					continue; // every candidate neutrally skipped — neutral on this kind
				}
				entryHadAnyCandidate = true;
				if (!kindOk) {
					errors.push(...kindErrors);
					entryOk = false;
					entryAstMatch = false;
				}
				if (!kindAstMatch) {
					astMismatches.push(...kindAstMismatches);
					entryAstMatch = false;
				}
			}
			for (const failure of refusalsOf(entry)) reportThrown(failure);

			// An entry whose every kind was neutrally skipped (no genuine
			// round-trip attempt ever succeeded past the read step) has tested
			// nothing — score it like the testableKinds.length===0 case above
			// (skip), not a silent pass. See entryHadAnyCandidate's doc comment.
			const namedRoots = tree1.rootNode.namedChildren;
			if (!entryHadAnyCandidate && namedRoots.length > 0 && namedRoots.every((n) => n?.isExtra)) {
				total--;
				trivia.push({ entry: entry.name, reason: 'native-read-dropped-extras', input: entry.source });
			} else if (!entryHadAnyCandidate) {
				skips.push({ entry: entry.name, reason: 'all-candidates-neutral', input: entry.source });
			} else {
				if (entryOk) pass++;
				if (entryAstMatch) astMatchPass++;
			}
			if (process.env.SITTIR_VALIDATOR_ENTRY_LOG) {
				const outcome = !entryHadAnyCandidate ? 'skip' : entryOk ? 'pass' : 'fail';
				const ast = entryHadAnyCandidate && entryAstMatch ? 'ast-pass' : 'ast-fail';
				console.log(`ENTRY\t${recursive ? 'deep' : 'shallow'}\t${entry.name}\t${outcome}\t${ast}`);
			}
		} catch (e) {
			errors.push({
				name: entry.name,
				message: `${(e as Error).message}`,
				input: entry.source
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
		fail: total - pass - skips.length,
		skip: skips.length,
		astMatchPass,
		errors,
		astMismatches: dedupeMismatchesByContainment(astMismatches),
		skips,
		excluded,
		trivia
	};
}

function reportFailure(options: ValidateReadRenderParseOptions, failure: ReadRenderParseFailure): void {
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
			if (e.input) lines.push(`      source:   ${JSON.stringify(e.input)}`);
			if (e.rendered) lines.push(`      rendered: ${JSON.stringify(e.rendered)}`);
		}
	}
	if (result.astMismatches.length > 0) {
		lines.push('');
		lines.push('    AST mismatches:');
		for (const e of result.astMismatches.slice(0, 20)) {
			lines.push(`    ~ ${e.entry ? `${e.entry} (${e.kind})` : e.kind}: ${e.message}`);
			if (e.input) lines.push(`      source:   ${JSON.stringify(e.input)}`);
			if (e.rendered) lines.push(`      rendered: ${JSON.stringify(e.rendered)}`);
		}
		if (result.astMismatches.length > 20) {
			lines.push(`    … and ${result.astMismatches.length - 20} more`);
		}
	}
	return lines.join('\n');
}
