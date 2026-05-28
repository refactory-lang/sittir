/**
 * probe-kind — structured diagnostics for one parse → readNode → render cycle,
 * with optional baseline comparison for new-vs-legacy pipeline diffs.
 *
 * ## Usage
 *
 * ```sh
 * # Single-pipeline probe.
 * npx tsx packages/codegen/src/scripts/probe-kind.ts \
 *     --grammar typescript --source 'break;'
 *
 * # New-vs-legacy comparison: stage a baseline package dir
 * # (e.g. `cp -r packages/rust packages/rust-baseline` from a prior commit,
 * # or `git worktree add` it from a baseline ref + regen).
 * npx tsx packages/codegen/src/scripts/probe-kind.ts \
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
 *                Shows `$fields` / `$children` / `$type` identity after
 *                drillAs remapping.
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
 * `feedback_promote_scratch_scripts.md` — the agent should run this script
 * instead of re-writing the probe. If a needed flag is missing, extend this
 * file; don't fork a new throwaway.
 *
 * The `--baseline` flag covers the lighter end of new-vs-legacy diffing —
 * it swaps render-side artifacts (templates + wrap) only; the parser stays
 * shared unless `--baseline-parser` is passed. For full git-ref-based
 * comparison (auto-checkout-and-regen of a historical commit), see the
 * follow-up note in this file's docstring at the bottom of the diff.
 */

import { parseArgs } from 'node:util';
import {
	loadLanguageForGrammar,
	loadKindIdFromName,
	loadKindNameFromId,
	loadKindNames,
	loadWebTreeSitter,
	treeHandle,
	adaptNode,
	nativeTreeHandle,
	materializeWrappedNodeData,
	stripStructuralNodeText,
	loadReadTreeNode,
	walkNativeForKind,
    type TSNode
} from '../validate/common.ts';
import type * as TS from 'web-tree-sitter';
import type { AnyNodeData, AnyTreeNode, NodeId } from '@sittir/types';
import type { TreeHandle } from '@sittir/common';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main(argv: string[]): Promise<number> {
	const { values } = parseArgs({
		args: argv,
		options: {
			grammar: { type: 'string', short: 'g' },
			source: { type: 'string', short: 's' },
			stdin: { type: 'boolean', default: false },
			kind: { type: 'string', short: 'k' },
			range: { type: 'string' },
			'no-render': { type: 'boolean', default: false },
			'no-wrap': {
				type: 'boolean',
				default: false
				// Skip the grammar's readTreeNode (wrap layer with
				// drillAs) and use core `readNode` directly. Matches
				// what validators currently call — useful for
				// reproducing rtPass failures.
			},
			reparse: { type: 'boolean', default: false },
			pretty: { type: 'boolean', default: false },
			// --baseline <path-to-package-dir>: also run the same
			// probe against the baseline-package's `src/wrap.ts`,
			// `templates/`, and `.sittir/parser.wasm`. Output gains
			// a `baseline` block (same shape as the primary report)
			// and a `compare` summary. Useful for diffing pre-change
			// vs post-change generated output: stage a baseline by
			// copying / git-checkout-ing the prior `packages/<lang>/`
			// into a sibling dir (e.g. `packages/rust-baseline/`),
			// then `--baseline packages/rust-baseline`. Same parser
			// is used by default unless --baseline-parser is set.
			baseline: { type: 'string' },
			'baseline-parser': {
				type: 'boolean',
				default: false
				// Use baseline's `.sittir/parser.wasm` for the
				// baseline pass instead of the current package's.
				// Only enable if you regenerated the baseline's
				// parser too (grammar.json drift between baseline
				// and current). Default off — assumes the parser is
				// current and only render-side artifacts differ.
			},
			// --engine native|js|both: select which render
			// engine renders the NodeData. Parse + readNode stay on
			// the JS / wasm path (the native crate's `find_and_read`
			// is currently a stub); only the render leg branches.
			//   - js: `@sittir/core` createRenderer + .jinja
			//                 templates (the current default).
			//   - native:     `@sittir/<lang>-native` napi `.node`
			//                 → `SittirEngine.render(nodeData)`.
			//                 No web-tree-sitter; the napi crate
			//                 uses the `tree_sitter` Rust crate +
			//                 `tree_sitter_<lang>::LANGUAGE`.
			//   - both:       runs both, emits a `compareEngines`
			//                 block with rendered-equal verdict.
			engine: { type: 'string' }
			,
			trace: { type: 'boolean', default: false },
			logParse: { type: 'boolean', default: false },
			// --full: emit the complete multi-lane trace (js + native,
			// shallow + deep). Default for `--kind` is the focused native-pipeline
			// view (cst → raw → wrapped → transport → rendered). Use --full for
			// cross-engine comparison.
			full: { type: 'boolean', default: false }
		}
	});
	if (!values.grammar) {
		process.stderr.write('probe-kind: --grammar <rust|typescript|python> required\n');
		return 2;
	}
	const grammar = values.grammar as string;
	const source = values.stdin ? await readStdin() : (values.source as string | undefined);
	if (source === undefined) {
		process.stderr.write('probe-kind: --source <text> or --stdin required\n');
		return 2;
	}

	const parsedRange = values.range ? parseRange(values.range as string) : undefined;
	// Native is the production path; the JS render engine is @deprecated. Default
	// to native so an un-flagged probe reflects what actually ships.
	const engineRaw = (values.engine as string | undefined) ?? 'native';
	if (!['js', 'native', 'both'].includes(engineRaw)) {
		process.stderr.write(`probe-kind: --engine must be 'js' | 'native' | 'both' (got '${engineRaw}')\n`);
		return 2;
	}
	if (engineRaw === 'js') {
		process.stderr.write('probe-kind: warning: --engine js is deprecated; native remains the default production path\n');
	}
	const opts = {
		noRender: values['no-render'] === true,
		noWrap: values['no-wrap'] === true,
		kind: values.kind as string | undefined,
		range: parsedRange,
		reparse: values.reparse === true,
		engine: (engineRaw === 'both' ? 'js' : engineRaw) as 'js' | 'native',
		logParse: values.logParse === true

	};
	// Focused native-pipeline view: default when `--kind` is given (unless
	// --trace/--full). Shows the slot at EVERY native stage so the layer that
	// drops it is obvious — cst (parse) → raw (raw read) → wrapped (materialized
	// wrap, what render consumes) → transport (FromNapiValue payload) → rendered.
	// `legacyWrapped` is the old recursive readNode walker — populated in it but
	// empty in `wrapped` = a wrap-materialization gap.
	const wantFull = values.trace === true || values.full === true;
	if (opts.kind && !wantFull) {
		const trace = (await probeTrace(grammar, source, { ...opts, engine: 'native' }));
		const nativeTrace = (
			trace.trace as { native?: { deep?: Record<string, unknown>; wrapError?: string } } | undefined
		)?.native;
		const deep = nativeTrace?.deep ?? {};
		const focused = {
			grammar,
			source,
			kind: opts.kind,
			cst: trace.cst,
			// wrap throws (e.g. a required slot the parser didn't route) surface
			// here so the CST is still readable to diagnose what the parser emitted.
			wrapError: nativeTrace?.wrapError,
			raw: deep.rawNodeData,
			wrapped: deep.nodeData,
			legacyWrapped: deep.legacyDeepNodeData,
			transport: deep.nativeTransport,
			rendered: deep.rendered,
			renderError: deep.renderError
		};
		process.stdout.write(JSON.stringify(focused, null, values.pretty ? 2 : undefined) + '\n');
		return 0;
	}
	if (wantFull) {
		const trace = await probeTrace(grammar, source, opts);
		process.stdout.write(JSON.stringify(trace, null, values.pretty ? 2 : undefined) + '\n');
		return 0;
	}
	const report = await probe(grammar, source, opts);
	let baselineReport: ProbeReport | undefined;
	let compare: ProbeCompare | undefined;
	if (values.baseline) {
		const baselineDir = values.baseline as string;
		baselineReport = await probe(grammar, source, {
			...opts,
			baselineDir,
			useBaselineParser: values['baseline-parser'] === true
		});
		compare = computeCompare(report, baselineReport);
	}
	let engineNativeReport: ProbeReport | undefined;
	let compareEngines: ProbeEngineCompare | undefined;
	if (engineRaw === 'both' || engineRaw === 'native') {
		engineNativeReport = await probe(grammar, source, {
			...opts,
			engine: 'native'
		});
		if (engineRaw === 'both') {
			compareEngines = computeEngineCompare(report, engineNativeReport);
		}
	}
	const indent = values.pretty ? 2 : undefined;
	const out: Record<string, unknown> = baselineReport
		? { ...report, baseline: baselineReport, compare }
		: { ...report };
	if (engineRaw === 'native') {
		Object.assign(out, engineNativeReport);
	} else if (engineRaw === 'both') {
		out.engineNative = engineNativeReport;
		out.compareEngines = compareEngines;
	}
	process.stdout.write(JSON.stringify(out, null, indent) + '\n');
	return 0;
}

// ---------------------------------------------------------------------------
// Core probe
// ---------------------------------------------------------------------------

export interface ProbeReport {
	grammar: string;
	source: string;
	/** Render engine used for this report. `'js'` is the
	 *  default; `'native'` indicates the `@sittir/<lang>-native`
	 *  napi engine. Stamped so a `--engine both` consumer can tell
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
		 *                    via `@sittir/core` createRenderer.
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
	if(opts.logParse) {
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
	// every drill-in / drillAs through `tree.read(id)` → napi. tree-
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
			// native `$nodeId` so drillAs / drillIn fire under napi.
			const root = readTreeNodeFn ? readTreeNodeFn(handle) : handle.read?.();
			const target = opts.kind
				? findInNodeData(root, opts.kind)
				: findInNodeDataByRange(root, opts.range!.start, opts.range!.end);
			if (!target) {
				throw new Error(`probe-kind: --engine native: no node match in NodeData tree`);
			}
			const targetId = (target as { $nodeId?: NodeId }).$nodeId;
			nodeData = targetId !== undefined && readTreeNodeFn ? readTreeNodeFn(handle, targetId) : target;
		}
	} else {
		const readTreeNodeFn = opts.noWrap
			? null
			: opts.baselineDir
				? await loadReadTreeNodeFromPath(resolveBaselinePath(opts.baselineDir, 'src/wrap.ts'))
				: await loadReadTreeNode(grammar);
		const handle = treeHandle(tree, source);
		const nodeId = isRoot ? undefined : (targetNode.id as NodeId);
		nodeData = readTreeNodeFn ? readTreeNodeFn(handle, nodeId) : await fallbackReadNode(handle, nodeId);
	}

	let rendered: string | undefined;
	let sameText: boolean | undefined;
	let renderedLen: number | undefined;
	let reparsedCst: CstNode | undefined;
	let astDiff: ProbeReport['astDiff'] | undefined;
	if (!opts.noRender) {
		rendered =
			opts.engine === 'native'
				? nativeEngine
					? nativeEngine.render(await nativeRenderPayload(grammar, nodeData))
					: await renderNodeDataNative(grammar, nodeData)
				: opts.baselineDir
					? await renderNodeDataFromPath(grammar, resolveBaselinePath(opts.baselineDir, 'templates'), nodeData)
					: await renderNodeData(grammar, nodeData);
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
		diff: {
			sourceLen: probeRange ? probeRange.text.length : source.length,
			renderedLen,
			sameText
		}
	};
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
	// `wrap` (used by BOTH the native and TS flows) can throw — e.g. a required
	// slot the parser didn't route into it, like `function_definition.block`.
	// Catch per-engine so the CST (parser output) and the other engine still
	// report instead of the whole probe aborting.
	const buildEngineTrace = async (engine: 'js' | 'native'): Promise<ProbeTraceEngineReport> => {
		let read: Awaited<ReturnType<typeof readProbeNodeData>>;
		try {
			read = await readProbeNodeData(grammar, source, tree, targetNode, isRoot, engine, opts.kind);
		} catch (e) {
			return { wrapError: String((e as Error)?.message ?? e) };
		}
		const shallow = await buildTraceLane(grammar, read.shallow, read.shallow, read.shallow, engine, 'shallow');
		const deep =
			engine === 'native'
				? await buildTraceLane(grammar, read.shallow, read.deepReadTreeNodeRaw, read.deep, engine, 'deep', read.legacyDeepNodeData)
				: await buildTraceLane(grammar, read.shallow, read.deepReadTreeNodeRaw ?? read.deep, read.deep, engine, 'deep');
		return { shallow, deep };
	};
	const sexp = targetNode.toString();

	const trace: ProbeTraceReport['trace'] = {};
	if (opts.engine === 'both') {
		trace.js = await buildEngineTrace('js');
		trace.native = await buildEngineTrace('native');
	} else {
		const engine = opts.engine ?? 'native';
		trace[engine] = await buildEngineTrace(engine);
	}
	return {
		grammar,
		source,
		probeRange,
		cst,
		sexp,
		trace
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

async function fallbackReadNode(handle: ReturnType<typeof treeHandle>, nodeId?: NodeId): Promise<unknown> {
	const { readNode } = await import('@sittir/common');
	return readNode(handle, nodeId);
}

async function deepReadProbeNode(
	handle: TreeHandle,
	nodeHandle: number | undefined,
	childIndex: number | undefined,
): Promise<unknown> {
	const { readNode } = await import('@sittir/common');
	const data = readNode(handle, nodeHandle, childIndex);
	const isNodeData = (value: unknown): value is AnyNodeData => typeof value === 'object' && value !== null && '$type' in value;
	const shouldDrill = (entry: unknown): entry is AnyNodeData & { $nodeHandle: number; $childIndex: number } =>
		isNodeData(entry) &&
		entry.$named === true &&
		typeof entry.$nodeHandle === 'number' &&
		typeof entry.$childIndex === 'number' &&
		typeof entry.$type === 'number';
	if (data.$children) {
		const children = Array.isArray(data.$children) ? data.$children : [data.$children];
		const drilled = await Promise.all(
			children.map(async (entry) => {
				if (!shouldDrill(entry)) return entry;
				return deepReadProbeNode(handle, entry.$nodeHandle, entry.$childIndex);
			}),
		);
		(data as { $children?: typeof data.$children }).$children = Array.isArray(data.$children) ? drilled : drilled[0];
	}
	const record = data as unknown as Record<string, unknown>;
	for (const rawKey of Object.keys(record).filter((key) => key.startsWith('_'))) {
		const value = record[rawKey];
		if (Array.isArray(value)) {
			record[rawKey] = await Promise.all(value.map(async (entry) =>
				shouldDrill(entry) ? deepReadProbeNode(handle, entry.$nodeHandle, entry.$childIndex) : entry
			));
		} else if (shouldDrill(value)) {
			record[rawKey] = await deepReadProbeNode(handle, value.$nodeHandle, value.$childIndex);
		}
	}
	return data;
}

export function materializeProbeWrappedNodeData(root: unknown): unknown {
	return stripStructuralNodeText(materializeWrappedNodeData(root));
}

export function resolveNativeTraceNodeData(readTreeNodeRaw: unknown | undefined, legacyDeepNodeData: unknown): unknown {
	return readTreeNodeRaw === undefined ? legacyDeepNodeData : materializeProbeWrappedNodeData(readTreeNodeRaw);
}

async function readProbeNodeData(
	grammar: string,
	source: string,
	tree: TS.Tree,
	targetNode: any,
	isRoot: boolean,
	engine: 'js' | 'native',
	targetKind?: string
): Promise<{ shallow: unknown; deep: unknown; deepReadTreeNodeRaw?: unknown; legacyDeepNodeData?: unknown }> {
	if (engine === 'native') {
		const nativeEngine = await loadNativeEngine(grammar);
		const readTreeNodeFn = await loadReadTreeNode(grammar);
		const handle = nativeTreeHandle(nativeEngine, source);
		if (isRoot) {
			const shallow = stripBigInts(handle.read?.());
			const legacyDeepNodeData = stripStructuralNodeText(await deepReadProbeNode(handle, undefined, undefined));
			const deepReadTreeNodeRaw = readTreeNodeFn ? readTreeNodeFn(handle) : undefined;
			const deep = resolveNativeTraceNodeData(deepReadTreeNodeRaw, legacyDeepNodeData);
			return { shallow, deep, deepReadTreeNodeRaw, legacyDeepNodeData };
		}
		if (targetKind) {
			const kindNameFromId = await loadKindNameFromId(grammar);
			const targetCandidate =
				walkNativeForKind(handle, targetKind, kindNameFromId).find(
					(candidate) =>
						candidate.span?.start === targetNode.startIndex && candidate.span?.end === targetNode.endIndex
				) ?? null;
			if (targetCandidate?.coords.handle !== undefined && targetCandidate.coords.childIndex !== undefined) {
				const shallow = handle.read?.(targetCandidate.coords.handle, targetCandidate.coords.childIndex);
				const legacyDeepNodeData = stripStructuralNodeText(
					await deepReadProbeNode(handle, targetCandidate.coords.handle, targetCandidate.coords.childIndex)
				);
				const deepReadTreeNodeRaw = readTreeNodeFn
					? readTreeNodeFn(handle, targetCandidate.coords.handle, targetCandidate.coords.childIndex)
					: undefined;
				const deep = resolveNativeTraceNodeData(deepReadTreeNodeRaw, legacyDeepNodeData);
				return { shallow, deep, deepReadTreeNodeRaw, legacyDeepNodeData };
			}
		}
		const root = readTreeNodeFn
			? materializeProbeWrappedNodeData(readTreeNodeFn(handle))
			: await deepReadProbeNode(handle, undefined, undefined);
		const target = findInNodeDataByRange(root, targetNode.startIndex, targetNode.endIndex);
		if (!target) throw new Error('probe-kind: no native node match in NodeData tree');
		const targetHandle = getTargetHandle(target);
		const shallow = targetHandle ? handle.read?.(targetHandle.handle, targetHandle.childIndex) : target;
		const legacyDeepNodeData = stripStructuralNodeText(
			targetHandle ? await deepReadProbeNode(handle, targetHandle.handle, targetHandle.childIndex) : target
		);
		const deepReadTreeNodeRaw =
			targetHandle && readTreeNodeFn
				? readTreeNodeFn(handle, targetHandle.handle, targetHandle.childIndex)
				: undefined;
		const deep = readTreeNodeFn && !targetHandle ? target : resolveNativeTraceNodeData(deepReadTreeNodeRaw, legacyDeepNodeData);
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

async function readSelectedNode(
	handle: ReturnType<typeof treeHandle>,
	targetNode: TS.Node
): Promise<unknown> {
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

async function renderNodeData(grammar: string, nodeData: unknown): Promise<string> {
	const { createRenderer } = await import('@sittir/core');
	const thisFile = import.meta.url;
	const templatesPath = new URL(`../../../${grammar}/templates`, thisFile).pathname;
	const kindNames = await loadKindNames(grammar);
	const bound = createRenderer(templatesPath, { kindNames });
	return bound.render(nodeData as Parameters<typeof bound.render>[0]);
}

/** @internal — render via templates from an explicit absolute path
 *  (used by --baseline mode to swap render-side artifacts). */
async function renderNodeDataFromPath(grammar: string, templatesPath: string, nodeData: unknown): Promise<string> {
	const { createRenderer } = await import('@sittir/core');
	const kindNames = await loadKindNames(grammar);
	const bound = createRenderer(templatesPath, { kindNames });
	return bound.render(nodeData as Parameters<typeof bound.render>[0]);
}

/** @internal — load the grammar-owned native engine for `grammar`. Mirrors
 *  the `createRequire` pattern in `backend.ts`. Throws on failure so
 *  `--engine native` / `both` modes can't silently fall back to the
 *  TS render and mask a parity issue. */
interface NativeProbeEngine {
	parseAndRead(source: string): string;
	readNode(nodeId: NodeId): string;
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
	const project = utils.toNativeRenderTransport;
	if (!project) {
		throw new Error(`native transport projector missing for grammar '${grammar}'`);
	}
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
	if (Array.isArray(n.$children)) {
		for (const c of n.$children as unknown[]) {
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
	if (Array.isArray(n.$children)) {
		for (const c of n.$children) {
			const f = recurseInto(c);
			if (f) return f;
		}
	}
	return node;
}

/** @internal — engine-vs-engine compare summary for `--engine both`.
 *  TS and native render the same NodeData; equal output means the
 *  napi crate's `render_dispatch` agrees with `@sittir/core`'s
 *  `createRenderer`. */
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

/** Run the probe-kind CLI with the given argv (excluding node/script path). */
export async function run(argv: string[]): Promise<number> {
	return main(argv);
}

// silence unused warnings on adaptNode / AnyTreeNode (used indirectly in treeHandle path)
void adaptNode;
type _AnyTreeNode = AnyTreeNode;

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
	run(process.argv.slice(2)).then(process.exit).catch((err) => {
		process.stderr.write(`probe-kind: ${err instanceof Error ? err.stack ?? err.message : err}\n`);
		process.exit(1);
	});
}
