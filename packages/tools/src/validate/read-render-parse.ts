/**
 * Read-render-parse validation (Checks 6 & 7) — parse → readNode → render → parse.
 *
 * Uses tree-sitter test corpus files (downloaded from grammar repos) as
 * source fixtures. Each corpus entry is parsed'd, rendered, and
 * re-parsed. Structural match is checked.
 *
 * Requires web-tree-sitter + language WASM files.
 */

import { writeSync } from 'node:fs';

import type { AnyNodeData } from '@sittir/types';
import { stripStructuralNodeText } from '@sittir/common';
import { deriveRuleKinds } from './render-bodies.ts';
import { load } from '../codegen-surface.ts';

const { loadRawEntries } = await load('nodeTypesLoader');
import {
	loadCorpusEntries,
	loadLanguageForGrammar,
	loadKindNameFromId,
	loadCanonicalKindNameFromId,
	loadKindNames,
	loadKindIdFromName,
	buildReadHandle,
	buildKindToSupertypes,
	wrapForReparse,
	loadReadTreeNode,
	walkWrappedTree,
	materializeWrappedNodeData,
	emitValidatorMetrics,
	loadNodeModel,
	dedupeMismatchesByContainment,
	type TSNode,
	type TSTree,
	type WrappedNodeData,
	type AccessorThrowRecord
} from './common.ts';

/**
 * Build the set of `$type` values the validator should deep-read,
 * scoped to kinds that participate in variant() adoption (parents and
 * their child kinds). Other kinds stay on the shallow `$text`
 * short-circuit to preserve baseline rtPass numbers.
 *
 * Sources the set from the grammar's emitted `node-model.json5`
 * polymorphVariants section (PR-K; the codegen artifact that records which
 * kinds went through Link's push-down). Returns an empty set when no
 * variant adoption exists in the grammar.
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
		if (desc.definedBy !== 'override') continue;
		byOwner.set(parent, new Set(Object.keys(desc.childKind)));
	}
	return byOwner;
}

export async function loadVariantAdoptedKinds(grammar: string): Promise<ReadonlySet<string>> {
	// PR-K: read the typed `polymorphVariants` map directly instead of
	// regex-scanning raw JSON. Only `definedBy: 'override'` descriptors carry a
	// `childKind` map (the first-named-child dispatch table); each such parent
	// and every child kind it dispatches to participates in variant() adoption.
	const { polymorphVariants } = await loadNodeModel(grammar);
	const kinds = new Set<string>();
	for (const [parent, desc] of Object.entries(polymorphVariants)) {
		if (desc.definedBy !== 'override') continue;
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
export const NAMED_EXTRAS_BY_GRAMMAR: Record<string, ReadonlySet<string>> = {
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

/**
 * Same-text leaf kind pairs the AST compare tolerates, per grammar — an
 * audited allowlist for positional leaf re-classification the reparse
 * wrapper genuinely cannot reproduce. A pair NOT listed here fails the
 * compare even when the bytes match — an unlisted same-text kind swap is
 * a real regression signal, not alias noise. Keys are order-insensitive
 * via {@link leafAliasKey}.
 *
 * Currently EMPTY: every known positional case is handled by a
 * context-faithful reparse wrapper instead (the decorator variant family
 * wraps in a real `@…` position — see `REPARSE_WRAPPERS.typescript`), so
 * leaf classification matches exactly. Adding an entry here requires the
 * same audit that emptied it: instrument the tolerance, run
 * validate:native across all grammars, and list only pairs whose context
 * a wrapper cannot express.
 */
export const LEAF_ALIAS_TOLERANCE_BY_GRAMMAR: Record<string, ReadonlySet<string>> = {};

export function leafAliasKey(a: string, b: string): string {
	return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function astStructuralDiff(
	a: TSNode,
	b: TSNode,
	namedExtras: ReadonlySet<string>,
	path: string = '',
	rootAliasPair?: readonly [string, string],
	variantChildKinds?: ReadonlyMap<string, ReadonlySet<string>>,
	leafAliasPairs?: ReadonlySet<string>
): string | null {
	// Root-level alias tolerance: `a`/`b` are the same underlying content —
	// `wrapForReparse`'s synthetic wrapper context doesn't always reproduce
	// the exact grammar position that triggered the ORIGINAL parse's named
	// alias (see `renderedKind`/`targetKind` at this function's call site),
	// so the reparsed root can legitimately surface under either the alias
	// source or the alias target's display name. Scoped to path === '' —
	// deeper mismatches are still real (`findNodeBySpanOfKind` already
	// anchors nested lookups correctly) and must still fail.
	const rootAliasTolerated =
		path === '' &&
		rootAliasPair !== undefined &&
		((a.type === rootAliasPair[0] && b.type === rootAliasPair[1]) ||
			(a.type === rootAliasPair[1] && b.type === rootAliasPair[0]));
	if (a.type !== b.type && !rootAliasTolerated) {
		// Byte-identical leaf tolerance, gated on the grammar's audited pair
		// allowlist ({@link LEAF_ALIAS_TOLERANCE_BY_GRAMMAR}): only childless
		// nodes with identical text AND an allowlisted kind pair pass — any
		// structural or byte difference, or an unlisted kind pair, still fails.
		if (
			a.childCount === 0 &&
			b.childCount === 0 &&
			a.text === b.text &&
			leafAliasPairs?.has(leafAliasKey(a.type, b.type)) === true
		) {
			return null;
		}
		return `${path || 'root'}: type ${a.type} ≠ ${b.type}`;
	}
	const aChildren = collectVisibleChildren(a, namedExtras);
	let bChildren = collectVisibleChildren(b, namedExtras);
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
				ownedVariants.has(c.type) && !aTypes.has(c.type) ? collectVisibleChildren(c, namedExtras) : [c]
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
		const sub = astStructuralDiff(
			ac,
			bc,
			namedExtras,
			`${path || a.type}[${i}].${ac.type}`,
			undefined,
			variantChildKinds,
			leafAliasPairs
		);
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
	/**
	 * Accessor-throw occurrences hit while materializing wrapped nodes for
	 * this run (see `AccessorThrowRecord`'s doc comment). Each throw masks
	 * its whole slot behind a raw stub fallback — not necessarily a hard
	 * round-trip failure on its own, but a real signal worth surfacing
	 * beyond the transient stderr line.
	 */
	accessorThrows: AccessorThrowRecord[];
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
 */
export function leadingTriviaRenderedWidth(data: AnyNodeData, render: (node: AnyNodeData) => string): number {
	const leading = data.$triviaData?.leading;
	if (!leading || leading.length === 0) return 0;
	const stripped = { ...data, $triviaData: { ...data.$triviaData, leading: undefined } } as AnyNodeData;
	return render(data).length - render(stripped).length;
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

export async function validateReadRenderParse(
	grammar: string,
	options: ValidateReadRenderParseOptions = {}
): Promise<ReadRenderParseResult> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);

	const rawEntries = loadRawEntries(grammar);
	const kindNameFromId = await loadKindNameFromId(grammar);
	const kindNames = await loadKindNames(grammar);
	const { backend } = options;
	// Render through the grammar's boundary.ts, which dispatches to the
	// native engine.
	const { loadBoundaryRender } = await import('../scripts/collect-baseline.ts');
	const render: (node: AnyNodeData) => string = await loadBoundaryRender(
		grammar as 'rust' | 'typescript' | 'python'
	);
	// The kinds the renderer can handle are those with an emitted body.
	const ruleKinds = deriveRuleKinds(grammar);
	const kindToSupertypes = buildKindToSupertypes(rawEntries);

	const readTreeNodeFn = await loadReadTreeNode(grammar);
	const canonicalKindNameFromId = await loadCanonicalKindNameFromId(grammar);
	const adoptedVariantKindNames = await loadVariantAdoptedKinds(grammar);
	const variantChildKinds = await loadVariantChildKindsByOwner(grammar);
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
	const accessorThrows: AccessorThrowRecord[] = [];
	const onAccessorThrow = (rec: AccessorThrowRecord): void => {
		accessorThrows.push(rec);
	};
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
			const handle = buildReadHandle(grammar, tree1, entry.source, backend, kindIdFromName);
			const candidatesByKind = new Map<
				string,
				{ start: number; end: number; node: WrappedNodeData; displayKind: string }[]
			>();
			if (readTreeNodeFn && handle.read) {
				const wrappedRoot = readTreeNodeFn(handle) as WrappedNodeData;
				const seen = new Set<string>();
				walkWrappedTree(
					wrappedRoot,
					(w: WrappedNodeData) => {
						if (w.$named === false) return;
						const displayKind = kindNameFromId?.(w.$type);
						const sourceKind = canonicalKindNameFromId?.(w.$type);
						// Testable-surface filter is CANONICAL-keyed, like the bucketing:
						// template filenames carry canonical spellings, so hidden minted
						// kinds (whose display name differs) are admitted and probed
						// against their own templates rather than silently skipped.
						if (displayKind === undefined || sourceKind === undefined || !ruleKinds.has(sourceKind)) return;
						const span = (w as { $span?: { start: number; end: number } }).$span;
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
			const testableKinds = [...candidatesByKind.keys()];

			if (testableKinds.length === 0) {
				skip++;
				if (process.env.SITTIR_VALIDATOR_ENTRY_LOG) {
					console.log(`ENTRY\t${recursive ? 'deep' : 'shallow'}\t${entry.name}\tskip-no-testable\tast-fail`);
				}
				continue;
			}

			// Test round-trip for each testable kind found
			let entryOk = true;
			let entryAstMatch = true;
			// Tracks whether ANY kind in this entry ever reached a genuine
			// round-trip attempt (kindHadCandidate=true below) — as opposed to
			// every candidate silently `continue`-ing via a neutral skip
			// (no supertype context, empty render). Without this, an entry
			// where EVERY kind's candidates are all neutrally skipped falls
			// through with entryOk/entryAstMatch still at their initial `true`,
			// counting as a pass despite testing nothing at all.
			let entryHadAnyCandidate = false;
			for (const kind of testableKinds) {
				if (shouldStop) break;

				let kindOk = false;
				let kindAstMatch = false;
				let kindHadCandidate = false;
				const kindErrors: typeof errors = [];
				const kindAstMismatches: typeof astMismatches = [];

				for (const cand of candidatesByKind.get(kind)!) {
					if (shouldStop) break;
					const nodeStartIndex = cand.start;
					const nodeEndIndex = cand.end;
					const inputSource = entry.source.slice(nodeStartIndex, nodeEndIndex);
					// WASM node at this span: the AST-compare target and the parser
					// DISPLAY kind (targetKind) used for post-reparse node lookup.
					// Prefer the same-span node whose type matches the candidate's
					// DISPLAY kind — WASM `.type` speaks display names, so the
					// canonical bucket kind can never match here (so the compare
					// anchors on `tuple_struct_pattern`, not the enclosing same-span
					// `match_pattern`); fall back to the outermost.
					const node1ForAst =
						findNodeBySpanOfKind(tree1.rootNode, nodeStartIndex, nodeEndIndex, cand.displayKind) ??
						findNodeBySpan(tree1.rootNode, nodeStartIndex, nodeEndIndex);
					const tsVisibleKind = node1ForAst?.type;

					// Materialize the wrapped node directly — it already IS its source
					// kind. renderedKind (source) drives the render template; targetKind
					// (display) drives the post-reparse node lookup.
					//
					// Shallow mode (`recursive !== true`): read the node's one-level
					// native data via its coords instead — children stay `$nodeHandle`
					// stubs. This preserves the read-render-parse-shallow metric's
					// meaning (render() fed stub-bearing data, the shape lazy callers
					// send) as distinct from the deep run's full materialization.
					// Falls back to deep materialization when the wrapped node carries
					// no native coords.
					let data: AnyNodeData;
					try {
						// `$childIndex` is undefined for a candidate that IS the tree
						// root (nothing above it to index into) — defaulting it to 0
						// would make `handle.read(handle, 0)` drill into the root's
						// FIRST CHILD, silently round-tripping the wrong node (the
						// child mislabeled as the parent). Root candidates take the
						// deep-materialization path instead of guessing an index.
						data =
							recursive !== true && cand.node.$nodeHandle != null && cand.node.$childIndex != null && handle.read
								? (handle.read(cand.node.$nodeHandle, cand.node.$childIndex) as unknown as AnyNodeData)
								: (stripStructuralNodeText(materializeWrappedNodeData(cand.node, onAccessorThrow)) as AnyNodeData);
					} catch (e) {
						kindErrors.push({
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
						const rendered = render(data);
						if (
							process.env['SITTIR_VALIDATOR_DUMP_RENDER'] &&
							entry.name === process.env['SITTIR_VALIDATOR_DUMP_RENDER']
						) {
							writeSync(
								2,
								`[dump-render] mode=${recursive ? 'deep' : 'shallow'} entry=${entry.name} kind=${String(kind)} data=${JSON.stringify(data)}\n`
							);
							writeSync(
								2,
								`[dump-render] mode=${recursive ? 'deep' : 'shallow'} entry=${entry.name} kind=${String(kind)} rendered=${JSON.stringify(rendered)}\n`
							);
						}

						// Wrap for reparse using supertype context. `renderedKind` IS the
						// canonical source kind (candidates are bucketed by it), so the
						// wrapper lookup needs no separate source resolution.
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
						if (
							process.env['SITTIR_VALIDATOR_DUMP_RENDER'] &&
							entry.name === process.env['SITTIR_VALIDATOR_DUMP_RENDER']
						) {
							writeSync(
								2,
								`[dump-reparse] mode=${recursive ? 'deep' : 'shallow'} entry=${entry.name} kind=${String(kind)} hasError=${tree2.rootNode.hasError} wrappedText=${JSON.stringify(wrapped.text)} sexp=${JSON.stringify(tree2.rootNode.toString().slice(0, 300))}\n`
							);
						}
						if (tree2.rootNode.hasError) {
							const failure = {
								name: `${entry.name} [${renderedKind}]`,
								message: `re-parse error [${firstParseDefect(tree2.rootNode) ?? 'unlocated'}]`,
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
						const triviaOffsetAdjust = leadingTriviaRenderedWidth(data, render);
						const node2 =
							findReparsedNodeAtOffset(tree2, targetKind, wrapped, triviaOffsetAdjust) ??
							(renderedKind !== targetKind
								? findReparsedNodeAtOffset(tree2, renderedKind, wrapped, triviaOffsetAdjust)
								: null);
						if (!node2) {
							const failure = {
								name: `${entry.name} [${renderedKind}]`,
								message: `kind not found at rendered offset ${wrapped.offset}${/^\s/.test(rendered) ? ' [leading-whitespace render]' : ''}`,
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
						const rootAliasPair: readonly [string, string] | undefined =
							renderedKind !== targetKind ? [renderedKind, targetKind] : undefined;
						const diff = node1ForAst
							? astStructuralDiff(
									node1ForAst,
									node2,
									namedExtras,
									'',
									rootAliasPair,
									variantChildKinds,
									LEAF_ALIAS_TOLERANCE_BY_GRAMMAR[grammar]
								)
							: null;
						if (diff) {
							kindAstMismatches.push({
								kind: renderedKind,
								entry: entry.name,
								message: diff,
								input: inputSource,
								rendered,
								start: nodeStartIndex,
								end: nodeEndIndex
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
							message: `render: ${(e as Error).message}`,
							input: inputSource
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
				if (process.env.SITTIR_VALIDATOR_KIND_LOG) {
					const outcome = kindHadCandidate ? (kindOk ? 'pass' : 'fail') : kindErrors.length > 0 ? 'fail' : 'neutral';
					console.log(`KIND\t${recursive ? 'deep' : 'shallow'}\t${entry.name}\t${kind}\t${outcome}`);
				}
				if (!kindHadCandidate) {
					// `kindHadCandidate` only flips on a full round-trip SUCCESS,
					// so a kind where every candidate genuinely ATTEMPTED and
					// FAILED (read threw / re-parse error / kind not found — the
					// paths that push kindErrors) lands here exactly like a kind
					// whose candidates were all neutrally skipped (no supertype,
					// empty render — paths that push nothing). Distinguish by the
					// collected errors: real failures must be REPORTED and score
					// the entry as a failure — silently `continue`-ing here made
					// 100%-failing kinds invisible to diff-failures entirely (no
					// error line, no fail count), which masked a whole regression
					// class from the standard tooling.
					if (kindErrors.length > 0) {
						errors.push(kindErrors[0]!);
						entryHadAnyCandidate = true;
						entryOk = false;
						entryAstMatch = false;
						// KIND_LOG mode: keep walking remaining kinds for full
						// per-kind coverage — entry scoring is already latched.
						if (!process.env.SITTIR_VALIDATOR_KIND_LOG) break;
						continue;
					}
					continue; // every candidate neutrally skipped — neutral on this kind
				}
				entryHadAnyCandidate = true;
				if (!kindOk) {
					if (kindErrors.length > 0) errors.push(kindErrors[0]!);
					entryOk = false;
					entryAstMatch = false;
					if (!process.env.SITTIR_VALIDATOR_KIND_LOG) break;
				}
				if (!kindAstMatch) {
					if (kindAstMismatches.length > 0) astMismatches.push(kindAstMismatches[0]!);
					entryAstMatch = false;
				}
			}

			// An entry whose every kind was neutrally skipped (no genuine
			// round-trip attempt ever succeeded past the read step) has tested
			// nothing — score it like the testableKinds.length===0 case above
			// (skip), not a silent pass. See entryHadAnyCandidate's doc comment.
			if (!entryHadAnyCandidate) {
				skip++;
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
		fail: total - pass - skip,
		skip,
		astMatchPass,
		errors,
		astMismatches: dedupeMismatchesByContainment(astMismatches),
		accessorThrows
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
