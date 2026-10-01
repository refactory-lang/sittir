/**
 * probe-kind — structured diagnostics for one parse → readUntypedNode → render cycle,
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
 * - `untypedNode`:  output of `readNode(root)` — sittir's UntypedNode view.
 *                Shows `$fields` / `$other` / `$type` (the grammar-symbol
 *                wire identity stamped by the read).
 * - `rendered`:  output of `render(untypedNode)` — the text re-emitted by the
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
 *     rendered output / error, so what each lane hydrates and what it sends
 *     to the transport can be compared side-by-side.
 *   - when native wrap is available, `native.deep.untypedNode` follows the
 *     validator-equivalent materialized wrap path; the native reader's own
 *     deep read (depth `Infinity`) is exposed separately as `deepUntypedNode`.
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

import {
	loadLanguageForGrammar,
	loadKindIdFromName,
	loadKindNameFromId,
	loadCanonicalKindNameFromId,
	loadWebTreeSitter,
	treeHandle,
	adaptNode,
	loadNativeEngine,
	readNativeTree,
	type NativeEngine,
	materializeDetached,
	readNodeOf,
	walkNativeForKind,
	buildKindToSupertypes,
	wrapForReparse,
	upstreamWasmPath,
	nativeNodeIsKind,
	type TSNode,
	type TSTree,
	type AccessorThrowRecord,
	loadNodeModel
} from '../validate/common.ts';
import {
	loadVariantAdoptedKinds,
	loadVariantChildKindsByOwner,
	firstParseDefect,
	astStructuralDiff,
	findReparsedNodeAtOffset
} from '../validate/read-render-parse.ts';
import { load } from '../codegen-surface.ts';
import type * as TS from 'web-tree-sitter';
import type { AnyUntypedNode, AnyTreeNode } from '@sittir/types';
import { detachCoordinates, sourceSpans, type ByteSpan, type SourceSpans } from '@sittir/common';
import { isStub, readUntypedNode, toTransportData } from '@sittir/common/utils';
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
		process.stderr.write('probe-kind: --grammar <name> required\n');
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
	// `js` is the TypeScript read path (wrap + readUntypedNode); rendering is always
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
	// `legacyWrapped` is the old recursive readUntypedNode walker — populated in it but
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
			raw: deep.rawUntypedNode,
			wrapped: deep.untypedNode,
			legacyWrapped: deep.deepUntypedNode,
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
	 *  readUntypedNode path, `'native'` the napi engine end-to-end; rendering is
	 *  native in both. Stamped so a `--engine both` consumer can tell
	 *  which side of the compare each block came from. */
	engine?: 'js' | 'native';
	/** Source sub-range probed (absent when probing the full source). */
	probeRange?: { start: number; end: number; kind?: string; text: string };
	cst: CstNode;

	sexp: string;
	untypedNode: unknown;
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
	 *  derived from the read UntypedNode's own `$type`. */
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
	untypedNode: unknown,
	rendered: string
): Promise<ProbeWrapDiag> {
	const { loadRawEntries } = await load('nodeTypesLoader');
	const rawEntries = loadRawEntries(grammar);
	const kindToSupertypes = buildKindToSupertypes(rawEntries);
	const adoptedVariantKindNames = await loadVariantAdoptedKinds(grammar);
	const { root } = await loadNodeModel(grammar);
	// Parity with the validator: candidates key by the CANONICAL catalog
	// name of the wire `$type`, so the replayed wrapper selection must too.
	const canonicalKindNameFromId = await loadCanonicalKindNameFromId(grammar);
	const targetKind = targetNode.type;
	const dType = (untypedNode as { $type?: unknown } | undefined)?.$type;
	const renderedKind =
		typeof dType === 'number' && canonicalKindNameFromId ? (canonicalKindNameFromId(dType) ?? targetKind) : targetKind;

	const wrapped = wrapForReparse(rendered, renderedKind, grammar, kindToSupertypes, {
		adoptedVariantKinds: adoptedVariantKindNames,
		targetKind,
		root
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

	const variantChildKinds = await loadVariantChildKindsByOwner(grammar);
	const astDiff = astStructuralDiff(targetNode, node2, '', variantChildKinds);

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
	rawUntypedNode?: unknown;
	typed?: unknown;
	/** Native-only legacy recursive readUntypedNode walker output. Diagnostic only. */
	deepUntypedNode?: unknown;
	untypedNode: unknown;
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
		/** Which render engine renders the UntypedNode:
		 *    - `js`: parse via web-tree-sitter wasm, read via
		 *                    `<lang>/src/wrap.ts:readNode`, render
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
		targetNode = findNodeCoveringSpan(tree.rootNode, sourceSpans(source), opts.range);
		if (!targetNode) throw new Error(`probe-kind: no node covers range ${opts.range.start}–${opts.range.end}`);
		isRoot = false;
	} else if (opts.kind) {
		targetNode = findFirstByKind(tree.rootNode, opts.kind);
		if (!targetNode) throw new Error(`probe-kind: no node of kind '${opts.kind}' found`);
		isRoot = false;
	}
	if (!isRoot) {
		probeRange = {
			...spanOfNode(sourceSpans(source), targetNode),
			kind: targetNode.type,
			text: targetNode.text
		};
	}

	const cst = dumpCst(targetNode, null);
	const sexp = targetNode.toString();

	// Fully-native path: parse + read via the napi engine end-to-end.
	// The native engine parses internally via the `tree_sitter` Rust
	// crate (zero web-tree-sitter). A `nativeTreeHandle` wraps the
	// engine; the grammar's `readNode` then routes the read +
	// every hydration through `tree.read(id)` → napi. tree-
	// sitter `Node::id()` is per-tree, so the engine that parsed the
	// tree owns the id space — the per-handle dispatch keeps reads
	// inside that engine. Wasm parser above is kept only so the
	// (informational) `cst` dump is comparable across paths.
	let untypedNode: unknown;
	let nativeEngine: NativeEngine | undefined;
	if (opts.engine === 'native' && !opts.noWrap) {
		nativeEngine = await loadNativeEngine(grammar);
		const readNode = await readNodeOf(grammar);
		const handle = readNativeTree(nativeEngine, source).tree;
		if (isRoot) {
			untypedNode = readNode ? readNode(handle) : handle.read?.();
		} else {
			// For --kind / --range, the wasm `targetNode.id` does not
			// address the native engine's tree (separate id spaces).
			// Read root via the native handle, walk its UntypedNode to
			// find the matching subtree, then re-read THAT node by its
			// native `$nodeId` so hydration fires under napi.
			const root = readNode ? readNode(handle) : handle.read?.();
			const target = opts.kind
				? findInUntypedNode(root, opts.kind, await loadKindNameFromId(grammar))
				: findInUntypedNodeByRange(root, opts.range!.start, opts.range!.end);
			if (!target) {
				throw new Error(`probe-kind: --engine native: no node match in UntypedNode tree`);
			}
			// `$nodeId` is a retired field name (replaced by
			// `$parentHandle`+`$childIndex`) — kept as a defensive optional
			// check, not a live path: current UntypedNode shapes never carry
			// it, so this is always `undefined` and `target` (the wrap-read
			// match from `root` above, already fully materialized) is what
			// actually gets used. Native --kind/--range currently fails
			// earlier in the pipeline regardless (unrelated transport bug),
			// so this branch isn't independently testable right now.
			const targetId = (target as { $nodeId?: number }).$nodeId;
			untypedNode = targetId !== undefined && readNode ? readNode(handle, targetId) : target;
		}
	} else {
		const readNode = opts.noWrap
			? null
			: opts.baselineDir
				? await readNodeOfPath(resolveBaselinePath(opts.baselineDir, 'src/wrap.ts'))
				: await readNodeOf(grammar);
		// kindIdFromName is required for JS-side reads (readUntypedNode emits numeric
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
		// $parentHandle/$childIndex pair (that pair replaced $nodeId;
		// readUntypedNode/readNode navigate ONLY via handle+childIndex —
		// see readUntypedNode.ts: `if (handle != null && childIndex != null...)`,
		// else it falls back to reading `tree.rootNode`). Passing just
		// targetNode.id as a single positional arg can never satisfy that
		// check, so --kind/--range silently read/render the root instead of
		// the selected node. Swap the handle's rootNode instead, matching
		// readSelectedNode's already-correct pattern elsewhere in this file.
		if (isRoot) {
			untypedNode = readNode ? readNode(handle) : readUntypedNode(handle);
		} else {
			const prev = handle.rootNode;
			(handle as { rootNode: typeof prev }).rootNode = adaptNode(targetNode);
			try {
				untypedNode = readNode ? readNode(handle) : readUntypedNode(handle);
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
			rendered = await renderUntypedNodeNative(grammar, untypedNode);
		} else {
			rendered = await renderUntypedNode(grammar, untypedNode);
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
			wrapDiag = await computeValidatorWrapDiag(grammar, parser, targetNode as TSNode, untypedNode, rendered);
		}
	}

	return {
		grammar,
		source,
		engine: opts.engine ?? 'js',
		probeRange,
		cst,
		sexp,
		untypedNode: stripBigInts(untypedNode),
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
	const wasmPath = upstreamWasmPath(grammar);
	if (wasmPath === undefined) return undefined;
	const { Parser, lang } = await loadLanguageFromPath(wasmPath);
	const parser = new Parser();
	parser.setLanguage(lang);
	const tree = parser.parse(source);
	if (!tree) return undefined;
	let node = tree.rootNode;
	if (target.range) {
		node = findNodeCoveringSpan(tree.rootNode, sourceSpans(source), target.range) ?? tree.rootNode;
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
		targetNode = findNodeCoveringSpan(tree.rootNode, sourceSpans(source), opts.range);
		if (!targetNode) throw new Error(`probe-kind: no node covers range ${opts.range.start}–${opts.range.end}`);
		isRoot = false;
	} else if (opts.kind) {
		targetNode = findFirstByKind(tree.rootNode, opts.kind);
		if (!targetNode) throw new Error(`probe-kind: no node of kind '${opts.kind}' found`);
		isRoot = false;
	}
	if (!isRoot) {
		probeRange = {
			...spanOfNode(sourceSpans(source), targetNode),
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
		let read: Awaited<ReturnType<typeof readProbeLanes>>;
		try {
			read = await readProbeLanes(grammar, source, tree, targetNode, isRoot, engine, opts.kind, onAccessorThrow);
		} catch (e) {
			return { wrapError: String((e as Error)?.message ?? e) };
		}
		const shallow = await buildTraceLane(grammar, read.shallow, read.shallow, read.shallow, engine, 'shallow');
		const deep =
			engine === 'native'
				? await buildTraceLane(
						grammar,
						read.shallow,
						read.deepTyped,
						read.deep,
						engine,
						'deep',
						read.deepUntypedNode
					)
				: await buildTraceLane(grammar, read.shallow, read.deepTyped ?? read.deep, read.deep, engine, 'deep');
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

export function resolveNativeTraceUntypedNode(
	typed: unknown | undefined,
	deepUntypedNode: unknown,
	onAccessorThrow?: (rec: AccessorThrowRecord) => void
): unknown {
	return typed === undefined
		? deepUntypedNode
		: materializeDetached(typed, onAccessorThrow);
}

async function readProbeLanes(
	grammar: string,
	source: string,
	tree: TS.Tree,
	targetNode: any,
	isRoot: boolean,
	engine: 'js' | 'native',
	targetKind?: string,
	onAccessorThrow?: (rec: AccessorThrowRecord) => void
): Promise<{ shallow: unknown; deep: unknown; deepTyped?: unknown; deepUntypedNode?: unknown }> {
	if (engine === 'native') {
		const nativeEngine = await loadNativeEngine(grammar);
		const readNode = await readNodeOf(grammar);
		const handle = readNativeTree(nativeEngine, source).tree;
		if (isRoot) {
			const shallow = stripBigInts(handle.read?.());
			const deepUntypedNode = detachCoordinates(readUntypedNode(handle, undefined, undefined, Infinity));
			const deepTyped = readNode ? readNode(handle) : undefined;
			const deep = resolveNativeTraceUntypedNode(deepTyped, deepUntypedNode, onAccessorThrow);
			return { shallow, deep, deepTyped, deepUntypedNode };
		}
		if (targetKind) {
			const kindNameFromId = await loadKindNameFromId(grammar);
			const targetSpan = spanOfNode(sourceSpans(source), targetNode);
			const targetCandidate =
				walkNativeForKind(handle, targetKind, kindNameFromId).find(
					(candidate) => candidate.span?.start === targetSpan.start && candidate.span?.end === targetSpan.end
				) ?? null;
			if (targetCandidate?.coords.handle !== undefined && targetCandidate.coords.childIndex !== undefined) {
				const shallow = handle.read?.(targetCandidate.coords.handle, targetCandidate.coords.childIndex);
				const deepUntypedNode = detachCoordinates(
					readUntypedNode(handle, targetCandidate.coords.handle, targetCandidate.coords.childIndex, Infinity)
				);
				const deepTyped = readNode
					? readNode(handle, targetCandidate.coords.handle, targetCandidate.coords.childIndex)
					: undefined;
				const deep = resolveNativeTraceUntypedNode(deepTyped, deepUntypedNode, onAccessorThrow);
				return { shallow, deep, deepTyped, deepUntypedNode };
			}
		}
		const root = readNode
			? materializeDetached(readNode(handle), onAccessorThrow)
			: readUntypedNode(handle, undefined, undefined, Infinity);
		const rootTargetSpan = spanOfNode(sourceSpans(source), targetNode);
		const target = findInUntypedNodeByRange(root, rootTargetSpan.start, rootTargetSpan.end);
		if (!target) throw new Error('probe-kind: no native node match in UntypedNode tree');
		const targetHandle = getTargetHandle(target);
		const shallow = targetHandle ? handle.read?.(targetHandle.handle, targetHandle.childIndex) : target;
		const deepUntypedNode = detachCoordinates(
			targetHandle ? readUntypedNode(handle, targetHandle.handle, targetHandle.childIndex, Infinity) : target
		);
		const deepTyped =
			targetHandle && readNode ? readNode(handle, targetHandle.handle, targetHandle.childIndex) : undefined;
		const deep =
			readNode && !targetHandle
				? target
				: resolveNativeTraceUntypedNode(deepTyped, deepUntypedNode, onAccessorThrow);
		return { shallow, deep, deepTyped, deepUntypedNode };
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
	const shallow = isRoot ? readUntypedNode(handle) : await readSelectedNode(handle, targetNode);
	const deepTyped = await deepReadSelectedNode(grammar, handle, targetNode, isRoot, shallow);
	const deep = deepTyped;
	return { shallow, deep, deepTyped };
}

async function readSelectedNode(handle: ReturnType<typeof treeHandle>, targetNode: TS.Node): Promise<unknown> {
	const prev = handle.rootNode;
	(handle as { rootNode: ReturnType<typeof adaptNode> }).rootNode = adaptNode(targetNode);
	try {
		return readUntypedNode(handle);
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
	const readNode = await readNodeOf(grammar);
	if (!readNode) return fallback;
	if (isRoot) return readNode(handle);
	const prev = handle.rootNode;
	(handle as { rootNode: ReturnType<typeof adaptNode> }).rootNode = adaptNode(targetNode);
	try {
		return readNode(handle);
	} finally {
		(handle as { rootNode: ReturnType<typeof adaptNode> }).rootNode = prev;
	}
}

function getTargetHandle(target: unknown): { handle: number; childIndex: number } | null {
	if (!target || typeof target !== 'object') return null;
	const record = target as Record<string, unknown>;
	return isStub(record) ? { handle: record.$parentHandle, childIndex: record.$childIndex } : null;
}

async function buildTraceLane(
	grammar: string,
	rawUntypedNode: unknown,
	typed: unknown,
	untypedNode: unknown,
	engine: 'js' | 'native',
	readMode: 'shallow' | 'deep',
	deepUntypedNode?: unknown
): Promise<ProbeTraceLane> {
	const cleanedRawUntypedNode = stripBigInts(rawUntypedNode);
	const cleanedTyped = typed === undefined ? undefined : stripBigInts(typed);
	const cleanedUntypedNode = stripBigInts(untypedNode);
	const cleanedDeepUntypedNode = deepUntypedNode === undefined ? undefined : stripBigInts(deepUntypedNode);
	if (engine === 'js') {
		try {
			const rendered = await renderUntypedNode(grammar, cleanedUntypedNode);
			return {
				engine,
				readMode,
				rawUntypedNode: cleanedRawUntypedNode,
				typed: cleanedTyped,
				untypedNode: cleanedUntypedNode,
				rendererInput: cleanedUntypedNode,
				rendered
			};
		} catch (error) {
			return {
				engine,
				readMode,
				rawUntypedNode: cleanedRawUntypedNode,
				typed: cleanedTyped,
				untypedNode: cleanedUntypedNode,
				rendererInput: cleanedUntypedNode,
				renderError: error instanceof Error ? error.message : String(error)
			};
		}
	}
	try {
		const nativeTransport = nativeRenderPayload(cleanedUntypedNode);
		const rendered = await renderUntypedNodeNative(grammar, cleanedUntypedNode);
		return {
			engine,
			readMode,
			rawUntypedNode: cleanedRawUntypedNode,
			typed: cleanedTyped,
			deepUntypedNode: cleanedDeepUntypedNode,
			untypedNode: cleanedUntypedNode,
			nativeTransport,
			rendered
		};
	} catch (error) {
		let nativeTransport: unknown;
		try {
			nativeTransport = nativeRenderPayload(cleanedUntypedNode);
		} catch {
			nativeTransport = undefined;
		}
		return {
			engine,
			readMode,
			rawUntypedNode: cleanedRawUntypedNode,
			typed: cleanedTyped,
			deepUntypedNode: cleanedDeepUntypedNode,
			untypedNode: cleanedUntypedNode,
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

/** The byte span of a parser node, whose own `startIndex` / `endIndex` are string indices. */
function spanOfNode(spans: SourceSpans, node: { readonly startIndex: number; readonly endIndex: number }): ByteSpan {
	return spans.toSpan({ start: node.startIndex, end: node.endIndex });
}

/** The smallest parser node covering a byte span (see `findNodeCoveringRange`). */
function findNodeCoveringSpan(root: any, spans: SourceSpans, span: ByteSpan): any | null {
	const indices = spans.toIndices(span);
	return findNodeCoveringRange(root, indices.start, indices.end);
}

/**
 * Find the smallest node whose string-index range exactly covers `[start, end)`.
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
 *  no other renderer. `materializeDetached` resolves the lazy
 *  wrap getters the native transport cannot read. */
async function renderUntypedNode(grammar: string, untypedNode: unknown): Promise<string> {
	return renderUntypedNodeNative(grammar, materializeDetached(untypedNode));
}

/** @internal — the transport data the engine renders for `untypedNode`: the
 *  same projection `SittirEngine.render` applies, exposed for the trace. */
function nativeRenderPayload(untypedNode: unknown): Record<string, unknown> {
	return toTransportData(stripBigInts(untypedNode) as AnyUntypedNode) as unknown as Record<string, unknown>;
}

/** @internal — render via the native napi engine.
 *  `SittirEngine.render(untypedNode)` — stateless, no
 *  parse / tree dependency. The native crate uses the `tree_sitter`
 *  Rust crate + `tree_sitter_<lang>::LANGUAGE`; zero web-tree-sitter
 *  on this path. */
async function renderUntypedNodeNative(grammar: string, untypedNode: unknown): Promise<string> {
	const engine = await loadNativeEngine(grammar);
	return engine.render(stripBigInts(untypedNode) as AnyUntypedNode).toString();
}

/** @internal — load `readNode` from an explicit `src/wrap.ts`
 *  path. Mirrors `readNodeOf` in `validate/common.ts` but
 *  without the kind-name registry — caller passes the absolute path. */
async function readNodeOfPath(
	wrapTsPath: string
): Promise<((handle: unknown, nodeId?: number) => unknown) | null> {
	try {
		const mod = await import(wrapTsPath);
		return (mod as { readNode?: (h: unknown, id?: number) => unknown }).readNode ?? null;
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

/** @internal — depth-first walk an UntypedNode tree, returning the first
 *  subtree whose `$type` matches `kind`. Used by the native-engine
 *  path to find a kind-specific subtree once `parse_and_read` has
 *  returned the whole-tree UntypedNode. */
export function findInUntypedNode(
	node: unknown,
	kind: string,
	kindNameFromId: ((id: number) => string | undefined) | undefined
): unknown | null {
	if (!node || typeof node !== 'object') return null;
	if (nativeNodeIsKind(node as AnyUntypedNode, kind, kindNameFromId)) return node;
	const n = node as Record<string, unknown>;
	for (const key of Object.keys(n)) {
		if (!key.startsWith('_')) continue;
		const v = n[key];
		if (Array.isArray(v)) {
			for (const item of v) {
				const found = findInUntypedNode(item, kind, kindNameFromId);
				if (found) return found;
			}
		} else {
			const found = findInUntypedNode(v, kind, kindNameFromId);
			if (found) return found;
		}
	}
	if (Array.isArray(n.$other)) {
		for (const c of n.$other as unknown[]) {
			const found = findInUntypedNode(c, kind, kindNameFromId);
			if (found) return found;
		}
	}
	return null;
}

/** @internal — locate the smallest UntypedNode subtree whose `$span`
 *  exactly covers `[start, end)`. Pre-order with narrowing — descend
 *  whenever a child's span contains the target, fall back to the
 *  smallest containing node when no child does. Used by the native
 *  engine `--range` path where the wasm `targetNode.id` doesn't apply. */
function findInUntypedNodeByRange(node: unknown, start: number, end: number): unknown | null {
	if (!node || typeof node !== 'object') return null;
	const n = node as Record<string, unknown>;
	const span = n.$span as { start: number; end: number } | undefined;
	if (!span) return null;
	if (span.start > start || span.end < end) return null;
	const recurseInto = (child: unknown): unknown | null => findInUntypedNodeByRange(child, start, end);
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
 *  TS and native render the same UntypedNode; equal output means the
 *  napi crate's `render_dispatch` agrees with the read path's
 *  UntypedNode. */
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
	// UntypedNode carries `$nodeId` as number (or bigint on some platforms);
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
