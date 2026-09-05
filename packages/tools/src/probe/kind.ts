/**
 * probe-kind — structured diagnostics for one parse → readNode → render cycle,
 * with optional baseline comparison for new-vs-legacy pipeline diffs.
 *
 * ## Usage
 *
 * ```sh
 * # Single-pipeline probe.
 * probe-kind \
 *     --grammar typescript --source 'break;'
 *
 * # New-vs-legacy comparison: stage a baseline package dir
 * # (e.g. `cp -r packages/rust packages/rust-baseline` from a prior commit,
 * # or `git worktree add` it from a baseline ref + regen).
 * probe-kind \
 *     --grammar rust --source "fn f<'a>() {}" --kind lifetime \
 *     --reparse --baseline packages/rust-baseline --pretty
 * ```
 *
 * ## Output
 *
 * JSON to stdout with four stages:
 *
 * - `cst`:       tree-sitter parse result as a structured tree (type / named /
 *                text / field-name / children). Shows EXACTLY what tree-sitter
 *                emits, including anonymous tokens and field assignments.
 * - `nodeData`:  output of `readTreeNode(root)` — sittir's NodeData view.
 *                Shows `$fields` / `$other` / `$type` (the grammar-symbol
 *                wire identity stamped by the read).
 * - `rendered`:  output of `render(nodeData)` — the text re-emitted by the
 *                render pipeline.
 * - `diff`:      trivial comparison: source length, rendered length,
 *                same-text flag.
 *
 * With `--baseline <dir>`:
 *   - `baseline`: same shape as the top-level report, computed via the
 *                 baseline dir's `src/wrap.ts` + `templates/` (and optionally
 *                 `.sittir/parser.wasm` with `--baseline-parser`).
 *   - `compare`:  `{ renderedEqual, renderedLenDelta, astShapeEqual,
 *                   inputAstShapeEqual, summary }` — quick verdict on
 *                 whether the two pipelines agreed.
 *
 * With `--shipped`:
 *   - `shipped`: `{ cst, sexp, hasError }` from parsing the SAME source with
 *                the grammar's shipped upstream wasm (`tree-sitter-<lang>` on
 *                npm) instead of sittir's override-compiled
 *                `packages/<lang>/.sittir/parser.wasm`. Lets a single probe
 *                answer "does this diverge in the override grammar, or does
 *                the real grammar already parse it this way?" without
 *                standing up a corpus-wide base-vs-override sweep.
 *
 * With `--trace`:
 *   - emits a richer matrix for the selected target:
 *     `js.shallow`, `js.deep`, `native.shallow`, `native.deep`
 *   - each lane shows the boundary payload passed to that renderer and the
 *     rendered output / error, so drill-in and transport projection can be
 *     compared side-by-side.
 *   - when native wrap is available, `native.deep.nodeData` follows the
 *     validator-equivalent materialized wrap path; the older recursive
 *     readNode walker is exposed separately as `legacyDeepNodeData`.
 *
 * ## Why this exists
 *
 * Debugging RT failures repeatedly required writing one-off `/tmp/probe-X.ts`
 * scripts that rebuild the parse+wrap+render pipeline. See memory note
 * `feedback_promote_scratch_scripts.md` — the agent should run this tool
 * instead of re-writing the probe. If a needed flag is missing, extend this
 * file; don't fork a new throwaway.
 *
 * The `--baseline` flag covers the lighter end of new-vs-legacy diffing —
 * it swaps render-side artifacts (templates + wrap) only; the parser stays
 * shared unless `--baseline-parser` is passed. For full git-ref-based
 * comparison (auto-checkout-and-regen of a historical commit), see the
 * follow-up note in this file's docstring at the bottom of the diff.
 */

import { fileURLToPath } from 'node:url';
import {
	loadLanguageForGrammar,
	loadKindIdFromName,
	loadKindNameFromId,
	loadCanonicalKindNameFromId,
	loadKindNames,
	loadWebTreeSitter,
	treeHandle,
	adaptNode,
	nativeTreeHandle,
	materializeWrappedNodeData,
	loadReadTreeNode,
	walkNativeForKind,
	buildKindToSupertypes,
	wrapForReparse,
	WASM_PATHS,
	type TSNode,
	type TSTree,
	type AccessorThrowRecord
} from '../validate/common.ts';
import {
	loadVariantAdoptedKinds,
	loadVariantChildKindsByOwner,
	firstParseDefect,
	astStructuralDiff,
	findReparsedNodeAtOffset,
	NAMED_EXTRAS_BY_GRAMMAR,
	LEAF_ALIAS_TOLERANCE_BY_GRAMMAR
} from '../validate/read-render-parse.ts';
import { load } from '../codegen-surface.ts';
import type * as TS from 'web-tree-sitter';
import type { AnyNodeData, AnyTreeNode } from '@sittir/types';
import type { TreeHandle } from '@sittir/common';
import { stripStructuralNodeText } from '@sittir/common';
// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

export interface ProbeKindOptions {
	grammar: string;
	source?: string;
	stdin: boolean;
	kind?: string;
	range?: string;
	noRender: boolean;
	noWrap: boolean;
	reparse: boolean;
	/** Reparse using the SAME wrapForReparse/offset-lookup mechanism the
	 *  validator (read-render-parse.ts) uses, instead of `--reparse`'s naive
	 *  bare `parser.parse(rendered)`. Reports the selected wrapper's text,
	 *  splice offset, and the located reparsed node — reproducing exactly
	 *  what the validator sees, including its "kind not found at rendered
	 *  offset" failure mode. */
	validatorReparse: boolean;
	pretty: boolean;
	baseline?: string;
	baselineParser: boolean;
	engine?: string;
	trace: boolean;
	logParse: boolean;
	full: boolean;
	shipped: boolean;
}

export async function run(opts: ProbeKindOptions): Promise<number> {
	if (!opts.grammar) {
		process.stderr.write('probe-kind: --grammar <rust|typescript|python> required\n');
		return 2;
	}
	const grammar = opts.grammar;
	const source = opts.stdin ? await readStdin() : opts.source;
	if (source === undefined) {
		process.stderr.write('probe-kind: --source <text> or --stdin required\n');
		return 2;
	}

	const parsedRange = opts.range ? parseRange(opts.range) : undefined;
	const explicitEngine = opts.engine;
	// `js` is the TypeScript read path (wrap + readNode); rendering is always
	// native. Default to native so an un-flagged probe reflects what ships.
	const engineRaw = explicitEngine ?? 'native';
	if (!['js', 'native', 'both'].includes(engineRaw)) {
		process.stderr.write(`probe-kind: --engine must be 'js' | 'native' | 'both' (got '${engineRaw}')\n`);
		return 2;
	}
	const probeOpts = {
		noRender: opts.noRender,
		noWrap: opts.noWrap,
		kind: opts.kind,
		range: parsedRange,
		reparse: opts.reparse,
		validatorReparse: opts.validatorReparse,
		engine: (engineRaw === 'both' ? 'js' : engineRaw) as 'js' | 'native',
		logParse: opts.logParse
	};
	const traceEngine = (explicitEngine === undefined ? (opts.full ? 'both' : 'native') : engineRaw) as
		| 'js'
		| 'native'
		| 'both';
	const traceOpts = {
		...probeOpts,
		engine: traceEngine
	};
	// Step 0 (optional): parse the same source with the grammar's shipped
	// upstream wasm, independent of engine/trace/kind branching below, so
	// every output shape can carry the same `shipped` block.
	const shippedReport = opts.shipped
		? await probeShipped(grammar, source, { kind: probeOpts.kind, range: probeOpts.range })
		: undefined;
	// Focused native-pipeline view: default when `--kind` is given (unless
	// --trace/--full). Shows the slot at EVERY native stage so the layer that
	// drops it is obvious — cst (parse) → raw (raw read) → wrapped (materialized
	// wrap, what render consumes) → transport (FromNapiValue payload) → rendered.
	// `legacyWrapped` is the old recursive readNode walker — populated in it but
	// empty in `wrapped` = a wrap-materialization gap.
	const wantFull = opts.trace || opts.full;
	if (probeOpts.kind && !wantFull && !opts.validatorReparse) {
		const trace = await probeTrace(grammar, source, { ...probeOpts, engine: 'native' });
		const nativeTrace = (trace.trace as { native?: { deep?: Record<string, unknown>; wrapError?: string } } | undefined)
			?.native;
		const deep = nativeTrace?.deep ?? {};
		const focused = {
			grammar,
			source,
			kind: probeOpts.kind,
			cst: trace.cst,
			// wrap throws (e.g. a required slot the parser didn't route) surface
			// here so the CST is still readable to diagnose what the parser emitted.
			wrapError: nativeTrace?.wrapError,
			raw: deep.rawNodeData,
			wrapped: deep.nodeData,
			legacyWrapped: deep.legacyDeepNodeData,
			transport: deep.nativeTransport,
			rendered: deep.rendered,
			renderError: deep.renderError,
			shipped: shippedReport,
			accessorThrows: trace.accessorThrows
		};
		process.stdout.write(JSON.stringify(focused, null, opts.pretty ? 2 : undefined) + '\n');
		return 0;
	}
	if (wantFull) {
		const trace = await probeTrace(grammar, source, traceOpts);
		const out = { ...trace, shipped: shippedReport };
		process.stdout.write(JSON.stringify(out, null, opts.pretty ? 2 : undefined) + '\n');
		return 0;
	}
	const report = await probe(grammar, source, probeOpts);
	let baselineReport: ProbeReport | undefined;
	let compare: ProbeCompare | undefined;
	if (opts.baseline) {
		const baselineDir = opts.baseline;
		baselineReport = await probe(grammar, source, {
			...probeOpts,
			baselineDir,
			useBaselineParser: opts.baselineParser
		});
		compare = computeCompare(report, baselineReport);
	}
	let engineNativeReport: ProbeReport | undefined;
	let compareEngines: ProbeEngineCompare | undefined;
	if (engineRaw === 'both' || engineRaw === 'native') {
		engineNativeReport = await probe(grammar, source, {
			...probeOpts,
			engine: 'native'
		});
		if (engineRaw === 'both') {
			compareEngines = computeEngineCompare(report, engineNativeReport);
		}
	}
	const indent = opts.pretty ? 2 : undefined;
	const out: Record<string, unknown> = baselineReport
		? { ...report, baseline: baselineReport, compare }
		: { ...report };
	if (engineRaw === 'native') {
		Object.assign(out, engineNativeReport);
	} else if (engineRaw === 'both') {
		out.engineNative = engineNativeReport;
		out.compareEngines = compareEngines;
	}
	out.shipped = shippedReport;
	process.stdout.write(JSON.stringify(out, null, indent) + '\n');
	return 0;
}

// ---------------------------------------------------------------------------
// Core probe
// ---------------------------------------------------------------------------

export interface ProbeReport {
	grammar: string;
	source: string;
	/** Read path used for this report: `'js'` is the TypeScript wrap +
	 *  readNode path, `'native'` the napi engine end-to-end; rendering is
	 *  native in both. Stamped so a `--engine both` consumer can tell
	 *  which side of the compare each block came from. */
	engine?: 'js' | 'native';
	/** Source sub-range probed (absent when probing the full source). */
	probeRange?: { start: number; end: number; kind?: string; text: string };
	cst: CstNode;

	sexp: string;
	nodeData: unknown;
	rendered?: string;
	/** Reparse pass when `--reparse` set: rendered output re-parsed and dumped. */
	reparsedCst?: CstNode;
	/** Structural diff summary between original and reparsed CST. */
	astDiff?: {
		childCountMatch: boolean;
		originalShape: string;
		reparsedShape: string;
	};
	diff: { sourceLen: number; renderedLen?: number; sameText?: boolean };
	/** `--shipped`: parse of the same source/target via the grammar's shipped
	 *  upstream wasm rather than the override-compiled parser. */
	shipped?: ProbeShippedReport;
	/** `--validator-reparse`: the validator's own wrapForReparse + offset-lookup
	 *  reparse, reproduced exactly (see `computeValidatorWrapDiag`). */
	wrapDiag?: ProbeWrapDiag;
}

/** See `computeValidatorWrapDiag`'s doc comment. */
export interface ProbeWrapDiag {
	/** Source kind (drives the render template + wrapper selection) —
	 *  derived from the read NodeData's own `$type`. */
	renderedKind: string;
	/** Display kind at the probed tree-sitter node (drives post-reparse
	 *  node location; differs from `renderedKind` for aliased kinds). */
	targetKind: string;
	/** The selected supertype/direct wrapper's output, or `null` when no
	 *  wrapper exists for this kind (validator would skip the candidate). */
	wrapped: { text: string; offset: number } | null;
	/** True when the wrapped text itself failed to reparse cleanly. */
	reparseHasError?: boolean;
	/** First MISSING/ERROR node signature in the reparsed wrapper tree. */
	parseDefect?: string | null;
	/** Bytes skipped past the candidate's own leading trivia before the
	 *  offset lookup. Always 0 here — see `computeValidatorWrapDiag`. */
	triviaOffsetAdjust: number;
	/** Whether a node of `targetKind` (or `renderedKind`) was found at the
	 *  wrapper's splice offset. `false` reproduces the validator's "kind not
	 *  found at rendered offset" failure. */
	node2Found: boolean;
	node2Kind?: string;
	node2Sexp?: string;
	/** Strict structural diff between the original node and the located
	 *  reparsed node, or `null` when they match / no node was found. */
	astDiff: string | null;
}

/**
 * Reproduce the validator's own reparse mechanism (`wrapForReparse` +
 * offset-based node location, see `read-render-parse.ts`) for a single
 * probed node, instead of `--reparse`'s naive bare `parser.parse(rendered)`.
 * `--reparse` drills for the first node of the right TYPE anywhere in the
 * reparsed tree, which can silently match the wrong node (or the wrapper's
 * own scaffolding) and therefore can't reproduce validator-only failures
 * like "kind not found at rendered offset". This surfaces exactly what the
 * validator sees: the selected wrapper, the splice offset, and whether a
 * node of the expected kind was actually found there.
 */
async function computeValidatorWrapDiag(
	grammar: string,
	parser: { parse(text: string): TSTree | null },
	targetNode: TSNode,
	nodeData: unknown,
	rendered: string
): Promise<ProbeWrapDiag> {
	const { loadRawEntries } = await load('nodeTypesLoader');
	const rawEntries = loadRawEntries(grammar);
	const kindToSupertypes = buildKindToSupertypes(rawEntries);
	const adoptedVariantKindNames = await loadVariantAdoptedKinds(grammar);
	// Parity with the validator: candidates key by the CANONICAL catalog
	// name of the wire `$type`, so the replayed wrapper selection must too.
	const canonicalKindNameFromId = await loadCanonicalKindNameFromId(grammar);
	const targetKind = targetNode.type;
	const dType = (nodeData as { $type?: unknown } | undefined)?.$type;
	const renderedKind =
		typeof dType === 'number' && canonicalKindNameFromId ? (canonicalKindNameFromId(dType) ?? targetKind) : targetKind;

	const wrapped = wrapForReparse(rendered, renderedKind, grammar, kindToSupertypes, {
		adoptedVariantKinds: adoptedVariantKindNames,
		targetKind
	});
	if (wrapped === null || rendered.trim() === '') {
		return { renderedKind, targetKind, wrapped, triviaOffsetAdjust: 0, node2Found: false, astDiff: null };
	}

	const tree2 = parser.parse(wrapped.text) as TSTree;
	if (tree2.rootNode.hasError) {
		return {
			renderedKind,
			targetKind,
			wrapped,
			reparseHasError: true,
			parseDefect: firstParseDefect(tree2.rootNode),
			triviaOffsetAdjust: 0,
			node2Found: false,
			astDiff: null
		};
	}

	// probe-kind's render dispatch is async end-to-end (native payload
	// building, baseline template loads), unlike the validator's own
	// synchronous `render` — leading-trivia offset adjustment
	// (leadingTriviaRenderedWidth) needs a sync per-entry render callback,
	// so it isn't reproduced here. Candidates with leading trivia (rendered
	// comments) report a 0 adjustment, which can shift the located node for
	// those cases only.
	const triviaOffsetAdjust = 0;
	const node2 =
		findReparsedNodeAtOffset(tree2, targetKind, wrapped, triviaOffsetAdjust) ??
		(renderedKind !== targetKind ? findReparsedNodeAtOffset(tree2, renderedKind, wrapped, triviaOffsetAdjust) : null);
	if (!node2) {
		return {
			renderedKind,
			targetKind,
			wrapped,
			reparseHasError: false,
			triviaOffsetAdjust,
			node2Found: false,
			astDiff: null
		};
	}

	const namedExtras = NAMED_EXTRAS_BY_GRAMMAR[grammar] ?? new Set<string>();
	const rootAliasPair: readonly [string, string] | undefined =
		renderedKind !== targetKind ? [renderedKind, targetKind] : undefined;
	const variantChildKinds = await loadVariantChildKindsByOwner(grammar);
	const astDiff = astStructuralDiff(
		targetNode,
		node2,
		namedExtras,
		'',
		rootAliasPair,
		variantChildKinds,
		LEAF_ALIAS_TOLERANCE_BY_GRAMMAR[grammar]
	);

	return {
		renderedKind,
		targetKind,
		wrapped,
		reparseHasError: false,
		triviaOffsetAdjust,
		node2Found: true,
		node2Kind: node2.type,
		node2Sexp: node2.toString(),
		astDiff
	};
}

export interface ProbeShippedReport {
	cst: CstNode;
	sexp: string;
	hasError: boolean;
}

export interface ProbeTraceLane {
	readMode: 'shallow' | 'deep';
	engine: 'js' | 'native';
	rawNodeData?: unknown;
	readTreeNodeRaw?: unknown;
	/** Native-only legacy recursive readNode walker output. Diagnostic only. */
	legacyDeepNodeData?: unknown;
	nodeData: unknown;
	rendererInput?: unknown;
	nativeTransport?: unknown;
	rendered?: string;
	renderError?: string;
}

export interface ProbeTraceEngineReport {
	shallow?: ProbeTraceLane;
	deep?: ProbeTraceLane;
	wrapError?: string;
}

export interface ProbeTraceReport {
	grammar: string;
	source: string;
	probeRange?: { start: number; end: number; kind?: string; text: string };
	cst: CstNode;
	sexp: string;
	trace: {
		js?: ProbeTraceEngineReport;
		native?: ProbeTraceEngineReport;
	};
	/** Accessor-throw occurrences hit while materializing this probe's wrapped node data — see `AccessorThrowRecord`'s doc comment. */
	accessorThrows: AccessorThrowRecord[];
}

export interface CstNode {
	type: string;
	named: boolean;
	text?: string;
	field?: string;
	children: CstNode[];
}

export async function probe(
	grammar: string,
	source: string,
	opts: {
		noRender?: boolean;
		noWrap?: boolean;
		/** Find first node of this kind inside `source` and probe just that sub-tree. */
		kind?: string;
		/** Probe the node at this byte range (takes precedence over `kind`). */
		range?: { start: number; end: number };
		/** Render → re-parse → include reparsed CST + structural diff. */
		reparse?: boolean;
		/** Render → validator-equivalent wrapForReparse + offset lookup →
		 *  include the selected wrapper, offset, located node, and structural
		 *  diff. See `computeValidatorWrapDiag`. */
		validatorReparse?: boolean;
		/** Absolute or repo-relative path to a baseline package dir
		 *  (e.g. `packages/rust-baseline`). When set, swaps wrap.ts
		 *  + templates/ resolution to that dir for this probe pass.
		 *  See `--baseline` CLI flag. */
		baselineDir?: string;
		/** When true, also load the parser from `<baselineDir>/.sittir/parser.wasm`
		 *  instead of the current package's. Default false — most baselines
		 *  only differ in render-side artifacts. */
		useBaselineParser?: boolean;
		logParse?: boolean;
		/** Which render engine renders the NodeData:
		 *    - `js`: parse via web-tree-sitter wasm, read via
		 *                    `<lang>/src/wrap.ts:readTreeNode`, render
		 *                    rendered through the native engine.
		 *    - `native`:     parse via `@sittir/<lang>-native`'s
		 *                    embedded `tree_sitter` Rust crate (no
		 *                    wasm), read via napi `parseAndRead`,
		 *                    render via napi `render`. Fully native
		 *                    end-to-end — zero web-tree-sitter and
		 *                    zero JS-side wrap traversal on this path.
		 *  Tree-sitter wasm is still used for the CST dump
		 *  (cosmetic — informational `cst` block) regardless of
		 *  engine, so the JSON output is comparable across both. */
		engine?: 'js' | 'native';
	} = {}
): Promise<ProbeReport> {
	const { Parser, lang } =
		opts.baselineDir && opts.useBaselineParser
			? await loadLanguageFromPath(resolveBaselinePath(opts.baselineDir, '.sittir/parser.wasm'))
			: await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	if (opts.logParse) {
		parser.setLogger((message, isLex) => {
			process.stderr.write(`tree-sitter: ${isLex ? 'lex' : 'parse'} ${message}\n`);
		});
	}
	const tree = parser.parse(source);
	if (!tree) throw new Error('probe-kind: parse returned null');

	// Resolve probe target: root node, or a specific sub-tree.
	// `tree.rootNode` is a getter that returns a fresh wrapper each
	// call, so identity comparison with subsequent getter accesses
	// is unreliable — track "is this root?" with a flag.
	let targetNode: any = tree.rootNode;
	let isRoot = true;
	let probeRange: ProbeReport['probeRange'] | undefined;
	if (opts.range) {
		targetNode = findNodeCoveringRange(tree.rootNode, opts.range.start, opts.range.end);
		if (!targetNode) throw new Error(`probe-kind: no node covers range ${opts.range.start}–${opts.range.end}`);
		isRoot = false;
	} else if (opts.kind) {
		targetNode = findFirstByKind(tree.rootNode, opts.kind);
		if (!targetNode) throw new Error(`probe-kind: no node of kind '${opts.kind}' found`);
		isRoot = false;
	}
	if (!isRoot) {
		probeRange = {
			start: targetNode.startIndex,
			end: targetNode.endIndex,
			kind: targetNode.type,
			text: targetNode.text
		};
	}

	const cst = dumpCst(targetNode, null);
	const sexp = targetNode.toString();

	// Fully-native path: parse + read via the napi engine end-to-end.
	// The native engine parses internally via the `tree_sitter` Rust
	// crate (zero web-tree-sitter). A `nativeTreeHandle` wraps the
	// engine; the grammar's `readTreeNode` then routes the read +
	// every drill-in through `tree.read(id)` → napi. tree-
	// sitter `Node::id()` is per-tree, so the engine that parsed the
	// tree owns the id space — the per-handle dispatch keeps reads
	// inside that engine. Wasm parser above is kept only so the
	// (informational) `cst` dump is comparable across paths.
	let nodeData: unknown;
	let nativeEngine: NativeProbeEngine | undefined;
	if (opts.engine === 'native' && !opts.noWrap) {
		nativeEngine = await loadNativeEngine(grammar);
		const readTreeNodeFn = await loadReadTreeNode(grammar);
		const handle = nativeTreeHandle(nativeEngine, source);
		if (isRoot) {
			nodeData = readTreeNodeFn ? readTreeNodeFn(handle) : handle.read?.();
		} else {
			// For --kind / --range, the wasm `targetNode.id` does not
			// address the native engine's tree (separate id spaces).
			// Read root via the native handle, walk its NodeData to
			// find the matching subtree, then re-read THAT node by its
			// native `$nodeId` so drill-in fires under napi.
			const root = readTreeNodeFn ? readTreeNodeFn(handle) : handle.read?.();
			const target = opts.kind
				? findInNodeData(root, opts.kind)
				: findInNodeDataByRange(root, opts.range!.start, opts.range!.end);
			if (!target) {
				throw new Error(`probe-kind: --engine native: no node match in NodeData tree`);
			}
			// `$nodeId` is ADR-0017's retired field name (replaced by
			// `$nodeHandle`+`$childIndex`) — kept as a defensive optional
			// check, not a live path: current NodeData shapes never carry
			// it, so this is always `undefined` and `target` (the wrap-read
			// match from `root` above, already fully materialized) is what
			// actually gets used. Native --kind/--range currently fails
			// earlier in the pipeline regardless (unrelated transport bug),
			// so this branch isn't independently testable right now.
			const targetId = (target as { $nodeId?: number }).$nodeId;
			nodeData = targetId !== undefined && readTreeNodeFn ? readTreeNodeFn(handle, targetId) : target;
		}
	} else {
		const readTreeNodeFn = opts.noWrap
			? null
			: opts.baselineDir
				? await loadReadTreeNodeFromPath(resolveBaselinePath(opts.baselineDir, 'src/wrap.ts'))
				: await loadReadTreeNode(grammar);
		// kindIdFromName is required for JS-side reads (readNode emits numeric
		// $type — see common.ts's treeHandle doc). Wrap so an unknown kind name
		// returns undefined instead of throwing, matching run()'s own pattern.
		// Kind IDs can differ across generated versions — the exact scenario
		// --baseline compares — so load from the baseline package's own
		// types.ts, not the current package's, whenever a baseline is set.
		const rawKindIdFromName = opts.baselineDir
			? await loadKindIdFromNameFromPath(resolveBaselinePath(opts.baselineDir, 'src/types.ts'))
			: await loadKindIdFromName(grammar);
		const kindIdFromName = rawKindIdFromName
			? (name: string): number | undefined => {
					try {
						return rawKindIdFromName(name);
					} catch {
						return undefined;
					}
				}
			: undefined;
		const handle = treeHandle(tree, source, kindIdFromName);
		// targetNode.id is tree-sitter wasm's own internal id, not a
		// $nodeHandle/$childIndex pair (ADR-0017 replaced $nodeId with that
		// pair; readNode/readTreeNode navigate ONLY via handle+childIndex —
		// see readNode.ts: `if (handle != null && childIndex != null...)`,
		// else it falls back to reading `tree.rootNode`). Passing just
		// targetNode.id as a single positional arg can never satisfy that
		// check, so --kind/--range silently read/render the root instead of
		// the selected node. Swap the handle's rootNode instead, matching
		// readSelectedNode's already-correct pattern elsewhere in this file.
		if (isRoot) {
			nodeData = readTreeNodeFn ? readTreeNodeFn(handle) : await fallbackReadNode(handle);
		} else {
			const prev = handle.rootNode;
			(handle as { rootNode: typeof prev }).rootNode = adaptNode(targetNode);
			try {
				nodeData = readTreeNodeFn ? readTreeNodeFn(handle) : await fallbackReadNode(handle);
			} finally {
				(handle as { rootNode: typeof prev }).rootNode = prev;
			}
		}
	}

	let rendered: string | undefined;
	let sameText: boolean | undefined;
	let renderedLen: number | undefined;
	let reparsedCst: CstNode | undefined;
	let astDiff: ProbeReport['astDiff'] | undefined;
	let wrapDiag: ProbeWrapDiag | undefined;
	if (!opts.noRender) {
		if (opts.engine === 'native') {
			rendered = nativeEngine
				? nativeEngine.render(await nativeRenderPayload(grammar, nodeData))
				: await renderNodeDataNative(grammar, nodeData);
		} else {
			rendered = await renderNodeData(grammar, nodeData);
		}
		renderedLen = rendered.length;
		const originalText = probeRange ? probeRange.text : source;
		sameText = rendered === originalText;
		if (opts.reparse) {
			const tree2 = parser.parse(rendered);
			if (tree2) {
				// Re-parse root is a whole program; drill down to the
				// same-kind node for comparison when we probed a
				// sub-tree.
				const root2 = isRoot ? tree2.rootNode : (findFirstByKind(tree2.rootNode, targetNode.type) ?? tree2.rootNode);
				reparsedCst = dumpCst(root2, null);
				const origShape = shapeString(cst);
				const reparsedShape = shapeString(reparsedCst);
				astDiff = {
					childCountMatch: origShape === reparsedShape,
					originalShape: origShape,
					reparsedShape: reparsedShape
				};
			}
		}
		if (opts.validatorReparse) {
			wrapDiag = await computeValidatorWrapDiag(grammar, parser, targetNode as TSNode, nodeData, rendered);
		}
	}

	return {
		grammar,
		source,
		engine: opts.engine ?? 'js',
		probeRange,
		cst,
		sexp,
		nodeData: stripBigInts(nodeData),
		rendered,
		reparsedCst,
		astDiff,
		wrapDiag,
		diff: {
			sourceLen: probeRange ? probeRange.text.length : source.length,
			renderedLen,
			sameText
		}
	};
}

/**
 * Parse `source` with the grammar's shipped upstream wasm (the
 * `tree-sitter-<lang>` npm package's own `.wasm`) rather than sittir's
 * override-compiled `packages/<lang>/.sittir/parser.wasm`. This is the
 * "unmodified base grammar" lane: it answers whether a parse divergence
 * originates in the override grammar or already exists upstream, without
 * standing up a corpus-wide base-vs-override sweep (see `--shipped`).
 */
async function probeShipped(
	grammar: string,
	source: string,
	target: { kind?: string; range?: { start: number; end: number } }
): Promise<ProbeShippedReport | undefined> {
	const wasmSpecifier = WASM_PATHS[grammar];
	if (!wasmSpecifier) return undefined;
	const wasmPath = fileURLToPath(import.meta.resolve(wasmSpecifier));
	const { Parser, lang } = await loadLanguageFromPath(wasmPath);
	const parser = new Parser();
	parser.setLanguage(lang);
	const tree = parser.parse(source);
	if (!tree) return undefined;
	let node = tree.rootNode;
	if (target.range) {
		node = findNodeCoveringRange(tree.rootNode, target.range.start, target.range.end) ?? tree.rootNode;
	} else if (target.kind) {
		node = findFirstByKind(tree.rootNode, target.kind) ?? tree.rootNode;
	}
	return { cst: dumpCst(node, null), sexp: node.toString(), hasError: tree.rootNode.hasError };
}

export async function probeTrace(
	grammar: string,
	source: string,
	opts: {
		kind?: string;
		range?: { start: number; end: number };
		reparse?: boolean;
		noWrap?: boolean;
		baselineDir?: string;
		useBaselineParser?: boolean;
		engine?: 'js' | 'native' | 'both';
		logParse?: boolean;
	} = {}
): Promise<ProbeTraceReport> {
	const { Parser, lang } =
		opts.baselineDir && opts.useBaselineParser
			? await loadLanguageFromPath(resolveBaselinePath(opts.baselineDir, '.sittir/parser.wasm'))
			: await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	if (opts.logParse) {
		parser.setLogger((message, isLex) => {
			process.stderr.write(`tree-sitter: ${isLex ? 'lex' : 'parse'} ${message}\n`);
		});
	}
	parser.setLanguage(lang);
	const tree = parser.parse(source);

	// `tree.rootNode` is a getter that returns a fresh wrapper each
	// call, so identity comparison with subsequent getter accesses
	// is unreliable — track "is this root?" with a flag. Don't trust
	// the caller to not accidentally compare against a different wrapper

	if (!tree) throw new Error('probe-kind: parse returned null');

	let targetNode: TSNode = tree.rootNode;
	let isRoot = true;
	let probeRange: ProbeTraceReport['probeRange'] | undefined;
	if (opts.range) {
		targetNode = findNodeCoveringRange(tree.rootNode, opts.range.start, opts.range.end);
		if (!targetNode) throw new Error(`probe-kind: no node covers range ${opts.range.start}–${opts.range.end}`);
		isRoot = false;
	} else if (opts.kind) {
		targetNode = findFirstByKind(tree.rootNode, opts.kind);
		if (!targetNode) throw new Error(`probe-kind: no node of kind '${opts.kind}' found`);
		isRoot = false;
	}
	if (!isRoot) {
		probeRange = {
			start: targetNode.startIndex,
			end: targetNode.endIndex,
			kind: targetNode.type,
			text: targetNode.text
		};
	}
	const cst = dumpCst(targetNode, null);
	const accessorThrows: AccessorThrowRecord[] = [];
	const onAccessorThrow = (rec: AccessorThrowRecord): void => {
		accessorThrows.push(rec);
	};
	// `wrap` (used by BOTH the native and TS flows) can throw — e.g. a required
	// slot the parser didn't route into it, like `function_definition.block`.
	// Catch per-engine so the CST (parser output) and the other engine still
	// report instead of the whole probe aborting.
	const buildEngineTrace = async (engine: 'js' | 'native'): Promise<ProbeTraceEngineReport> => {
		let read: Awaited<ReturnType<typeof readProbeNodeData>>;
		try {
			read = await readProbeNodeData(grammar, source, tree, targetNode, isRoot, engine, opts.kind, onAccessorThrow);
		} catch (e) {
			return { wrapError: String((e as Error)?.message ?? e) };
		}
		const shallow = await buildTraceLane(grammar, read.shallow, read.shallow, read.shallow, engine, 'shallow');
		const deep =
			engine === 'native'
				? await buildTraceLane(
						grammar,
						read.shallow,
						read.deepReadTreeNodeRaw,
						read.deep,
						engine,
						'deep',
						read.legacyDeepNodeData
					)
				: await buildTraceLane(grammar, read.shallow, read.deepReadTreeNodeRaw ?? read.deep, read.deep, engine, 'deep');
		return { shallow, deep };
	};
	const sexp = targetNode.toString();

	const trace: ProbeTraceReport['trace'] = {};
	const traceEngine = opts.engine ?? 'both';
	if (traceEngine === 'both') {
		trace.js = await buildEngineTrace('js');
		trace.native = await buildEngineTrace('native');
	} else {
		trace[traceEngine] = await buildEngineTrace(traceEngine);
	}
	return {
		grammar,
		source,
		probeRange,
		cst,
		sexp,
		trace,
		accessorThrows
	};
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function dumpCst(node: TSNode, fieldName: string | null): CstNode {
	const out: CstNode = {
		type: node.type,
		named: node.isNamed,
		children: []
	};
	if (fieldName) out.field = fieldName;
	if (node.childCount === 0) {
		out.text = node.text;
		return out;
	}
	for (let i = 0; i < node.childCount; i++) {
		const child = node.child(i);
		if (!child) continue;
		const fn = typeof node.fieldNameForChild === 'function' ? node.fieldNameForChild(i) : null;
		out.children.push(dumpCst(child, fn));
	}
	return out;
}

async function fallbackReadNode(handle: ReturnType<typeof treeHandle>): Promise<unknown> {
	const { readNode } = await import('@sittir/common');
	return readNode(handle);
}

async function deepReadProbeNode(
	handle: TreeHandle,
	nodeHandle: number | undefined,
	childIndex: number | undefined
): Promise<unknown> {
	const { readNode } = await import('@sittir/common');
	const data = readNode(handle, nodeHandle, childIndex);
	const isNodeData = (value: unknown): value is AnyNodeData =>
		typeof value === 'object' && value !== null && '$type' in value;
	const shouldDrill = (entry: unknown): entry is AnyNodeData & { $nodeHandle: number; $childIndex: number } =>
		isNodeData(entry) &&
		entry.$named === true &&
		typeof entry.$nodeHandle === 'number' &&
		typeof entry.$childIndex === 'number' &&
		typeof entry.$type === 'number';
	const record = data as unknown as Record<string, unknown>;
	for (const rawKey of Object.keys(record).filter((key) => key.startsWith('_'))) {
		const value = record[rawKey];
		if (Array.isArray(value)) {
			record[rawKey] = await Promise.all(
				value.map(async (entry) =>
					shouldDrill(entry) ? deepReadProbeNode(handle, entry.$nodeHandle, entry.$childIndex) : entry
				)
			);
		} else if (shouldDrill(value)) {
			record[rawKey] = await deepReadProbeNode(handle, value.$nodeHandle, value.$childIndex);
		}
	}
	return data;
}

export function materializeProbeWrappedNodeData(
	root: unknown,
	onAccessorThrow?: (rec: AccessorThrowRecord) => void
): unknown {
	return stripStructuralNodeText(materializeWrappedNodeData(root, onAccessorThrow));
}

export function resolveNativeTraceNodeData(
	readTreeNodeRaw: unknown | undefined,
	legacyDeepNodeData: unknown,
	onAccessorThrow?: (rec: AccessorThrowRecord) => void
): unknown {
	return readTreeNodeRaw === undefined
		? legacyDeepNodeData
		: materializeProbeWrappedNodeData(readTreeNodeRaw, onAccessorThrow);
}

async function readProbeNodeData(
	grammar: string,
	source: string,
	tree: TS.Tree,
	targetNode: any,
	isRoot: boolean,
	engine: 'js' | 'native',
	targetKind?: string,
	onAccessorThrow?: (rec: AccessorThrowRecord) => void
): Promise<{ shallow: unknown; deep: unknown; deepReadTreeNodeRaw?: unknown; legacyDeepNodeData?: unknown }> {
	if (engine === 'native') {
		const nativeEngine = await loadNativeEngine(grammar);
		const readTreeNodeFn = await loadReadTreeNode(grammar);
		const handle = nativeTreeHandle(nativeEngine, source);
		if (isRoot) {
			const shallow = stripBigInts(handle.read?.());
			const legacyDeepNodeData = stripStructuralNodeText(await deepReadProbeNode(handle, undefined, undefined));
			const deepReadTreeNodeRaw = readTreeNodeFn ? readTreeNodeFn(handle) : undefined;
			const deep = resolveNativeTraceNodeData(deepReadTreeNodeRaw, legacyDeepNodeData, onAccessorThrow);
			return { shallow, deep, deepReadTreeNodeRaw, legacyDeepNodeData };
		}
		if (targetKind) {
			const kindNameFromId = await loadKindNameFromId(grammar);
			const targetCandidate =
				walkNativeForKind(handle, targetKind, kindNameFromId).find(
					(candidate) => candidate.span?.start === targetNode.startIndex && candidate.span?.end === targetNode.endIndex
				) ?? null;
			if (targetCandidate?.coords.handle !== undefined && targetCandidate.coords.childIndex !== undefined) {
				const shallow = handle.read?.(targetCandidate.coords.handle, targetCandidate.coords.childIndex);
				const legacyDeepNodeData = stripStructuralNodeText(
					await deepReadProbeNode(handle, targetCandidate.coords.handle, targetCandidate.coords.childIndex)
				);
				const deepReadTreeNodeRaw = readTreeNodeFn
					? readTreeNodeFn(handle, targetCandidate.coords.handle, targetCandidate.coords.childIndex)
					: undefined;
				const deep = resolveNativeTraceNodeData(deepReadTreeNodeRaw, legacyDeepNodeData, onAccessorThrow);
				return { shallow, deep, deepReadTreeNodeRaw, legacyDeepNodeData };
			}
		}
		const root = readTreeNodeFn
			? materializeProbeWrappedNodeData(readTreeNodeFn(handle), onAccessorThrow)
			: await deepReadProbeNode(handle, undefined, undefined);
		const target = findInNodeDataByRange(root, targetNode.startIndex, targetNode.endIndex);
		if (!target) throw new Error('probe-kind: no native node match in NodeData tree');
		const targetHandle = getTargetHandle(target);
		const shallow = targetHandle ? handle.read?.(targetHandle.handle, targetHandle.childIndex) : target;
		const legacyDeepNodeData = stripStructuralNodeText(
			targetHandle ? await deepReadProbeNode(handle, targetHandle.handle, targetHandle.childIndex) : target
		);
		const deepReadTreeNodeRaw =
			targetHandle && readTreeNodeFn ? readTreeNodeFn(handle, targetHandle.handle, targetHandle.childIndex) : undefined;
		const deep =
			readTreeNodeFn && !targetHandle
				? target
				: resolveNativeTraceNodeData(deepReadTreeNodeRaw, legacyDeepNodeData, onAccessorThrow);
		return { shallow, deep, deepReadTreeNodeRaw, legacyDeepNodeData };
	}
	const rawKindIdFromName = await loadKindIdFromName(grammar);
	const kindIdFromName = rawKindIdFromName
		? (name: string): number | undefined => {
				try {
					return rawKindIdFromName(name);
				} catch {
					return undefined;
				}
			}
		: undefined;
	const handle = treeHandle(tree, source, kindIdFromName);
	const shallow = isRoot ? await fallbackReadNode(handle) : await readSelectedNode(handle, targetNode);
	const deepReadTreeNodeRaw = await deepReadSelectedNode(grammar, handle, targetNode, isRoot, shallow);
	const deep = deepReadTreeNodeRaw;
	return { shallow, deep, deepReadTreeNodeRaw };
}

async function readSelectedNode(handle: ReturnType<typeof treeHandle>, targetNode: TS.Node): Promise<unknown> {
	const prev = handle.rootNode;
	(handle as { rootNode: ReturnType<typeof adaptNode> }).rootNode = adaptNode(targetNode);
	try {
		return await fallbackReadNode(handle);
	} finally {
		(handle as { rootNode: ReturnType<typeof adaptNode> }).rootNode = prev;
	}
}

async function deepReadSelectedNode(
	grammar: string,
	handle: ReturnType<typeof treeHandle>,
	targetNode: TS.Node,
	isRoot: boolean,
	fallback: unknown
): Promise<unknown> {
	const readTreeNodeFn = await loadReadTreeNode(grammar);
	if (!readTreeNodeFn) return fallback;
	if (isRoot) return readTreeNodeFn(handle);
	const prev = handle.rootNode;
	(handle as { rootNode: ReturnType<typeof adaptNode> }).rootNode = adaptNode(targetNode);
	try {
		return readTreeNodeFn(handle);
	} finally {
		(handle as { rootNode: ReturnType<typeof adaptNode> }).rootNode = prev;
	}
}

function getTargetHandle(target: unknown): { handle: number; childIndex: number } | null {
	if (!target || typeof target !== 'object') return null;
	const record = target as Record<string, unknown>;
	return typeof record.$nodeHandle === 'number' && typeof record.$childIndex === 'number'
		? { handle: record.$nodeHandle, childIndex: record.$childIndex }
		: null;
}

async function buildTraceLane(
	grammar: string,
	rawNodeData: unknown,
	readTreeNodeRaw: unknown,
	nodeData: unknown,
	engine: 'js' | 'native',
	readMode: 'shallow' | 'deep',
	legacyDeepNodeData?: unknown
): Promise<ProbeTraceLane> {
	const cleanedRawNodeData = stripBigInts(rawNodeData);
	const cleanedReadTreeNodeRaw = readTreeNodeRaw === undefined ? undefined : stripBigInts(readTreeNodeRaw);
	const cleanedNodeData = stripBigInts(nodeData);
	const cleanedLegacyDeepNodeData = legacyDeepNodeData === undefined ? undefined : stripBigInts(legacyDeepNodeData);
	if (engine === 'js') {
		try {
			const rendered = await renderNodeData(grammar, cleanedNodeData);
			return {
				engine,
				readMode,
				rawNodeData: cleanedRawNodeData,
				readTreeNodeRaw: cleanedReadTreeNodeRaw,
				nodeData: cleanedNodeData,
				rendererInput: cleanedNodeData,
				rendered
			};
		} catch (error) {
			return {
				engine,
				readMode,
				rawNodeData: cleanedRawNodeData,
				readTreeNodeRaw: cleanedReadTreeNodeRaw,
				nodeData: cleanedNodeData,
				rendererInput: cleanedNodeData,
				renderError: error instanceof Error ? error.message : String(error)
			};
		}
	}
	try {
		const nativeTransport = await nativeRenderPayload(grammar, cleanedNodeData);
		const rendered = await renderNodeDataNative(grammar, cleanedNodeData);
		return {
			engine,
			readMode,
			rawNodeData: cleanedRawNodeData,
			readTreeNodeRaw: cleanedReadTreeNodeRaw,
			legacyDeepNodeData: cleanedLegacyDeepNodeData,
			nodeData: cleanedNodeData,
			nativeTransport,
			rendered
		};
	} catch (error) {
		let nativeTransport: unknown;
		try {
			nativeTransport = await nativeRenderPayload(grammar, cleanedNodeData);
		} catch {
			nativeTransport = undefined;
		}
		return {
			engine,
			readMode,
			rawNodeData: cleanedRawNodeData,
			readTreeNodeRaw: cleanedReadTreeNodeRaw,
			legacyDeepNodeData: cleanedLegacyDeepNodeData,
			nodeData: cleanedNodeData,
			nativeTransport,
			renderError: error instanceof Error ? error.message : String(error)
		};
	}
}

/** Find the first descendant (inclusive) of kind `kind`, pre-order. */
function findFirstByKind(node: any, kind: string): any | null {
	if (node.type === kind) return node;
	for (let i = 0; i < node.childCount; i++) {
		const child = node.child(i);
		if (!child) continue;
		const found = findFirstByKind(child, kind);
		if (found) return found;
	}
	return null;
}

/**
 * Find the smallest node whose byte range exactly covers `[start, end)`.
 * Falls back to any node covering the range when no exact match exists.
 */
function findNodeCoveringRange(node: any, start: number, end: number): any | null {
	if (node.startIndex > start || node.endIndex < end) return null;
	// Try to narrow into a child.
	for (let i = 0; i < node.childCount; i++) {
		const child = node.child(i);
		if (!child) continue;
		const found = findNodeCoveringRange(child, start, end);
		if (found) return found;
	}
	// This node covers the range and no child does. It's the narrowest.
	return node;
}

/** Normalize a CST node to a compact shape signature for diffing. */
function shapeString(node: CstNode): string {
	const kids = node.children.length === 0 ? '' : `(${node.children.map(shapeString).join(',')})`;
	return `${node.type}${kids}`;
}

function parseRange(spec: string): { start: number; end: number } {
	const m = /^(\d+),(\d+)$/.exec(spec.trim());
	if (!m) throw new Error(`probe-kind: --range expects 'start,end' (got '${spec}')`);
	return { start: Number(m[1]), end: Number(m[2]) };
}

/** The TypeScript-read lane renders through the native engine too: there is
 *  no other renderer. `materializeProbeWrappedNodeData` resolves the lazy
 *  wrap getters the native transport cannot read. */
async function renderNodeData(grammar: string, nodeData: unknown): Promise<string> {
	return renderNodeDataNative(grammar, materializeProbeWrappedNodeData(nodeData));
}

/** @internal — load the grammar-owned native engine for `grammar`. Mirrors
 *  the `createRequire` pattern in `backend.ts`. Throws on failure so
 *  `--engine native` / `both` modes can't silently fall back to the
 *  TS render and mask a parity issue. */
interface NativeProbeEngine {
	parseAndRead(source: string): string;
	readNode(nodeId: number): string;
	render(node: Record<string, unknown>): string;
}
const nativePackages: Record<string, string> = {
	rust: 'sittir-rust',
	typescript: 'sittir-typescript',
	python: 'sittir-python'
};
async function loadNativeEngine(grammar: string): Promise<NativeProbeEngine> {
	const { createRequire } = await import('node:module');
	const req = createRequire(import.meta.url);
	// Try the package name first; fall back to the workspace-local
	// grammar crate at `rust/crates/sittir-{grammar}/`. The crate's
	// package.json `main` points at the local platform-specific `.node`
	// artifact.
	const pkg = nativePackages[grammar];
	if (!pkg) throw new Error(`probe-kind: no native package for ${grammar}`);
	const repoRoot = new URL('../../../..', import.meta.url).pathname.replace(/\/$/, '');
	const localCratePath = `${repoRoot}/rust/crates/sittir-${grammar}`;
	let mod: { SittirEngine: new () => NativeProbeEngine };
	try {
		mod = req(pkg) as typeof mod;
	} catch {
		try {
			mod = req(localCratePath) as typeof mod;
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			throw new Error(
				`probe-kind: --engine native could not load '${pkg}' or '${localCratePath}' — build the native binary with \`cd ${localCratePath} && pnpm exec napi build --release\`. Underlying error: ${message}`
			);
		}
	}
	return new mod.SittirEngine();
}

async function nativeRenderPayload(grammar: string, nodeData: unknown): Promise<Record<string, unknown>> {
	const thisFile = import.meta.url;
	const utilsPath = new URL(`../../../${grammar}/src/utils.ts`, thisFile).href;
	const utils = (await import(utilsPath)) as {
		toNativeRenderTransport?: (node: unknown) => unknown;
	};
	const project = utils.toNativeRenderTransport ?? ((node: unknown) => node);
	const payload = project(stripBigInts(nodeData));
	if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
		throw new Error('native render payload must be a transport object');
	}
	return payload as Record<string, unknown>;
}

/** @internal — render via the native napi engine.
 *  `SittirEngine.render(nodeData)` — stateless, no
 *  parse / tree dependency. The native crate uses the `tree_sitter`
 *  Rust crate + `tree_sitter_<lang>::LANGUAGE`; zero web-tree-sitter
 *  on this path. */
async function renderNodeDataNative(grammar: string, nodeData: unknown): Promise<string> {
	const engine = await loadNativeEngine(grammar);
	return engine.render(await nativeRenderPayload(grammar, nodeData));
}

/** @internal — load `readTreeNode` from an explicit `src/wrap.ts`
 *  path. Mirrors `loadReadTreeNode` in `validate/common.ts` but
 *  without the kind-name registry — caller passes the absolute path. */
async function loadReadTreeNodeFromPath(
	wrapTsPath: string
): Promise<((handle: unknown, nodeId?: number) => unknown) | null> {
	try {
		const mod = await import(wrapTsPath);
		return (mod as { readTreeNode?: (h: unknown, id?: number) => unknown }).readTreeNode ?? null;
	} catch (e) {
		process.stderr.write(`probe-kind: failed to load baseline wrap module at ${wrapTsPath}: ${(e as Error).message}\n`);
		return null;
	}
}

/** @internal — load `kindIdFromName` from an explicit `src/types.ts`
 *  path. Mirrors `loadKindIdFromName` in `validate/common.ts` but reads
 *  the baseline package's own table — kind IDs can differ across
 *  generated versions, the exact scenario --baseline compares. */
async function loadKindIdFromNameFromPath(typesTsPath: string): Promise<((name: string) => number) | undefined> {
	try {
		const mod = await import(typesTsPath);
		return (mod as { kindIdFromName?: (name: string) => number }).kindIdFromName;
	} catch {
		return undefined;
	}
}

/** @internal — load `KIND_DISPLAY_NAMES` from an explicit `src/types.ts`
 *  path. Mirrors `loadKindNames` in `validate/common.ts`; baseline
 *  rendering needs the baseline package's own id→display-name table for
 *  the same reason `loadKindIdFromNameFromPath` does — this feeds the
 *  JS-backend's name-based template resolution, not wrap dispatch. */
async function loadKindNamesFromPath(typesTsPath: string): Promise<ReadonlyMap<number, string> | undefined> {
	try {
		const mod = await import(typesTsPath);
		return (mod as { KIND_DISPLAY_NAMES?: ReadonlyMap<number, string> }).KIND_DISPLAY_NAMES;
	} catch {
		return undefined;
	}
}

/** @internal — load a tree-sitter Language from an explicit wasm path
 *  (used by --baseline-parser mode). */
async function loadLanguageFromPath(wasmPath: string): Promise<{ Parser: typeof TS.Parser; lang: TS.Language }> {
	const { Parser, Language } = await loadWebTreeSitter();
	const lang = await Language.load(wasmPath);
	return { Parser, lang };
}

/** @internal — resolve a baseline-relative path to an absolute path.
 *  Accepts a baseline dir as either an absolute path or a repo-relative
 *  path (e.g. `packages/rust-baseline`). */
function resolveBaselinePath(baselineDir: string, sub: string): string {
	if (baselineDir.startsWith('/')) return `${baselineDir}/${sub}`;
	const repoRoot = new URL('../../../..', import.meta.url).pathname.replace(/\/$/, '');
	return `${repoRoot}/${baselineDir}/${sub}`;
}

/** @internal — top-level diff summary between current and baseline probes. */
export interface ProbeCompare {
	/** Both rendered outputs are byte-equal. */
	renderedEqual: boolean;
	/** Length delta (currentLen - baselineLen); 0 when both undefined. */
	renderedLenDelta: number;
	/** Reparsed-CST shape strings match. Undefined when --reparse not set. */
	astShapeEqual?: boolean;
	/** Original-source CST shape strings match (sanity — should always be true
	 *  unless --baseline-parser triggered a different parser). */
	inputAstShapeEqual: boolean;
	/** Rendered-output drift summary, one line. */
	summary: string;
}

function computeCompare(current: ProbeReport, baseline: ProbeReport): ProbeCompare {
	const renderedEqual = current.rendered === baseline.rendered;
	const renderedLenDelta = (current.diff.renderedLen ?? 0) - (baseline.diff.renderedLen ?? 0);
	const inputAstShapeEqual = shapeOf(current.cst) === shapeOf(baseline.cst);
	let astShapeEqual: boolean | undefined;
	if (current.astDiff && baseline.astDiff) {
		astShapeEqual = current.astDiff.reparsedShape === baseline.astDiff.reparsedShape;
	}
	const summary = renderedEqual
		? 'rendered output identical'
		: `rendered output differs (${renderedLenDelta >= 0 ? '+' : ''}${renderedLenDelta} chars)`;
	return {
		renderedEqual,
		renderedLenDelta,
		astShapeEqual,
		inputAstShapeEqual,
		summary
	};
}

function shapeOf(node: CstNode): string {
	return `${node.named ? node.type : `"${node.type}"`}(${node.children.map(shapeOf).join(',')})`;
}

/** @internal — depth-first walk a NodeData tree, returning the first
 *  subtree whose `$type` matches `kind`. Used by the native-engine
 *  path to find a kind-specific subtree once `parse_and_read` has
 *  returned the whole-tree NodeData. */
function findInNodeData(node: unknown, kind: string): unknown | null {
	if (!node || typeof node !== 'object') return null;
	const n = node as Record<string, unknown>;
	if (n.$type === kind) return node;
	for (const key of Object.keys(n)) {
		if (!key.startsWith('_')) continue;
		const v = n[key];
		if (Array.isArray(v)) {
			for (const item of v) {
				const found = findInNodeData(item, kind);
				if (found) return found;
			}
		} else {
			const found = findInNodeData(v, kind);
			if (found) return found;
		}
	}
	if (Array.isArray(n.$other)) {
		for (const c of n.$other as unknown[]) {
			const found = findInNodeData(c, kind);
			if (found) return found;
		}
	}
	return null;
}

/** @internal — locate the smallest NodeData subtree whose `$span`
 *  exactly covers `[start, end)`. Pre-order with narrowing — descend
 *  whenever a child's span contains the target, fall back to the
 *  smallest containing node when no child does. Used by the native
 *  engine `--range` path where the wasm `targetNode.id` doesn't apply. */
function findInNodeDataByRange(node: unknown, start: number, end: number): unknown | null {
	if (!node || typeof node !== 'object') return null;
	const n = node as Record<string, unknown>;
	const span = n.$span as { start: number; end: number } | undefined;
	if (!span) return null;
	if (span.start > start || span.end < end) return null;
	const recurseInto = (child: unknown): unknown | null => findInNodeDataByRange(child, start, end);
	for (const key of Object.keys(n)) {
		if (!key.startsWith('_')) continue;
		const v = n[key];
		if (Array.isArray(v)) {
			for (const item of v) {
				const f = recurseInto(item);
				if (f) return f;
			}
		} else {
			const f = recurseInto(v);
			if (f) return f;
		}
	}
	if (Array.isArray(n.$other)) {
		for (const c of n.$other) {
			const f = recurseInto(c);
			if (f) return f;
		}
	}
	return node;
}

/** @internal — engine-vs-engine compare summary for `--engine both`.
 *  TS and native render the same NodeData; equal output means the
 *  napi crate's `render_dispatch` agrees with the read path's
 *  NodeData. */
export interface ProbeEngineCompare {
	/** Both engines rendered identical text. */
	renderedEqual: boolean;
	/** length(currentRendered) - length(nativeRendered). */
	renderedLenDelta: number;
	/** Astdiff agreement when --reparse used; undefined otherwise. */
	astShapeEqual?: boolean;
	summary: string;
}

function computeEngineCompare(ts: ProbeReport, native: ProbeReport): ProbeEngineCompare {
	const renderedEqual = ts.rendered === native.rendered;
	const renderedLenDelta = (ts.diff.renderedLen ?? 0) - (native.diff.renderedLen ?? 0);
	let astShapeEqual: boolean | undefined;
	if (ts.astDiff && native.astDiff) {
		astShapeEqual = ts.astDiff.reparsedShape === native.astDiff.reparsedShape;
	}
	const summary = renderedEqual
		? 'JS and native engines agree on render output'
		: `engines disagree (JS - native = ${renderedLenDelta >= 0 ? '+' : ''}${renderedLenDelta} chars)`;
	return { renderedEqual, renderedLenDelta, astShapeEqual, summary };
}

function stripBigInts(v: unknown): unknown {
	// NodeData carries `$nodeId` as number (or bigint on some platforms);
	// JSON.stringify chokes on bigint. Cast to Number for dump purposes.
	return JSON.parse(JSON.stringify(v, (_k, val) => (typeof val === 'bigint' ? Number(val) : val)));
}

async function readStdin(): Promise<string> {
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
	return Buffer.concat(chunks).toString('utf-8');
}

// silence unused warnings on adaptNode / AnyTreeNode (used indirectly in treeHandle path)
void adaptNode;
type _AnyTreeNode = AnyTreeNode;
