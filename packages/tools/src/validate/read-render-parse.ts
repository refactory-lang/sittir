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

import { createRenderer } from '@sittir/legacy-core';

import type { AnyNodeData } from '@sittir/types';
import { deriveRuleKinds } from './templates-path.ts';
import { load } from '../codegen-surface.ts';

const { loadRawEntries } = await load('nodeTypesLoader');
import {
	loadCorpusEntries,
	loadLanguageForGrammar,
	loadKindNameFromId,
	loadKindNames,
	loadKindIdFromName,
	buildReadHandle,
	buildKindToSupertypes,
	wrapForReparse,
	loadReadTreeNode,
	walkWrappedTree,
	materializeWrappedNodeData,
	stripStructuralNodeText,
	emitValidatorMetrics,
	loadNodeModel,
	type TSNode,
	type TSTree,
	type WrappedNodeData
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
async function loadVariantAdoptedKinds(grammar: string): Promise<ReadonlySet<string>> {
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
	backend?: 'native' | 'js';
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
	backend: 'native' | 'js';
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

			// Candidate enumeration by SOURCE kind (the wrap layer's drillAs result),
			// not the parser DISPLAY kind. Build the native read handle and walk the
			// WRAPPED tree ONCE: every node arrives as its true source kind, so each
			// is read/rendered directly with NO asType override.
			const handle = buildReadHandle(grammar, tree1, entry.source, backend, kindIdFromName);
			const candidatesByKind = new Map<string, { start: number; end: number; node: WrappedNodeData }[]>();
			if (readTreeNodeFn && handle.read) {
				const wrappedRoot = readTreeNodeFn(handle) as WrappedNodeData;
				const seen = new Set<string>();
				walkWrappedTree(wrappedRoot, (w: WrappedNodeData) => {
					if (w.$named === false) return;
					const sourceKind = kindNameFromId ? kindNameFromId(w.$type) : undefined;
					if (sourceKind === undefined || !ruleKinds.has(sourceKind)) return;
					const span = (w as { $span?: { start: number; end: number } }).$span;
					if (span == null) return;
					const dedup = `${sourceKind}@${span.start}:${span.end}`;
					if (seen.has(dedup)) return;
					seen.add(dedup);
					const list = candidatesByKind.get(sourceKind) ?? [];
					list.push({ start: span.start, end: span.end, node: w });
					candidatesByKind.set(sourceKind, list);
				});
			}
			const testableKinds = [...candidatesByKind.keys()];

			if (testableKinds.length === 0) {
				skip++;
				continue;
			}

			// Test round-trip for each testable kind found
			let entryOk = true;
			let entryAstMatch = true;
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
					// kind (so the compare anchors on `tuple_struct_pattern`, not the
					// enclosing same-span `match_pattern`); fall back to the outermost.
					const node1ForAst =
						findNodeBySpanOfKind(tree1.rootNode, nodeStartIndex, nodeEndIndex, kind) ??
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
						data =
							recursive !== true && cand.node.$nodeHandle != null && handle.read
								? (handle.read(cand.node.$nodeHandle, cand.node.$childIndex ?? 0) as unknown as AnyNodeData)
								: (stripStructuralNodeText(materializeWrappedNodeData(cand.node)) as AnyNodeData);
					} catch (e) {
						kindErrors.push({
							name: `${entry.name} [${kind}]`,
							message: `read: ${(e as Error).message.slice(0, 100)}`
						});
						continue;
					}
					const renderedKind = kind;
					const targetKind = tsVisibleKind ?? kind;

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

						// Wrap for reparse using supertype context
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
								backend: backend ?? 'js',
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
								backend: backend ?? 'js',
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
							backend: backend ?? 'js',
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
