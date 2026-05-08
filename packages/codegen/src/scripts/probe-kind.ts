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
	loadWebTreeSitter,
	treeHandle,
	adaptNode,
	nativeTreeHandle
} from '../validate/common.ts';
import { loadReadTreeNode } from '../validate/common.ts';
import type * as TS from 'web-tree-sitter';
import type { AnyTreeNode, NodeId } from '@sittir/types';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
	const { values } = parseArgs({
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
			// --engine native|typescript|both: select which render
			// engine renders the NodeData. Parse + readNode stay on
			// the JS / wasm path (the native crate's `find_and_read`
			// is currently a stub); only the render leg branches.
			//   - typescript: `@sittir/core` createRenderer + .jinja
			//                 templates (the current default).
			//   - native:     `@sittir/<lang>-native` napi `.node`
			//                 → `SittirEngine.render(nodeData)`.
			//                 No web-tree-sitter; the napi crate
			//                 uses the `tree_sitter` Rust crate +
			//                 `tree_sitter_<lang>::LANGUAGE`.
			//   - both:       runs both, emits a `compareEngines`
			//                 block with rendered-equal verdict.
			engine: { type: 'string' }
		}
	});
	if (!values.grammar) {
		console.error('probe-kind: --grammar <rust|typescript|python> required');
		process.exit(2);
	}
	const grammar = values.grammar as string;
	const source = values.stdin ? await readStdin() : (values.source as string | undefined);
	if (source === undefined) {
		console.error('probe-kind: --source <text> or --stdin required');
		process.exit(2);
	}

	const parsedRange = values.range ? parseRange(values.range as string) : undefined;
	const engineRaw = (values.engine as string | undefined) ?? 'typescript';
	if (!['typescript', 'native', 'both'].includes(engineRaw)) {
		console.error(`probe-kind: --engine must be 'typescript' | 'native' | 'both' (got '${engineRaw}')`);
		process.exit(2);
	}
	const opts = {
		noRender: values['no-render'] === true,
		noWrap: values['no-wrap'] === true,
		kind: values.kind as string | undefined,
		range: parsedRange,
		reparse: values.reparse === true,
		engine: (engineRaw === 'both' ? 'typescript' : engineRaw) as 'typescript' | 'native'
	};
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
}

// ---------------------------------------------------------------------------
// Core probe
// ---------------------------------------------------------------------------

export interface ProbeReport {
	grammar: string;
	source: string;
	/** Render engine used for this report. `'typescript'` is the
	 *  default; `'native'` indicates the `@sittir/<lang>-native`
	 *  napi engine. Stamped so a `--engine both` consumer can tell
	 *  which side of the compare each block came from. */
	engine?: 'typescript' | 'native';
	/** Source sub-range probed (absent when probing the full source). */
	probeRange?: { start: number; end: number; kind?: string; text: string };
	cst: CstNode;
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
		/** Which render engine renders the NodeData:
		 *    - `typescript`: parse via web-tree-sitter wasm, read via
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
		engine?: 'typescript' | 'native';
	} = {}
): Promise<ProbeReport> {
	const { Parser, lang } =
		opts.baselineDir && opts.useBaselineParser
			? await loadLanguageFromPath(resolveBaselinePath(opts.baselineDir, '.sittir/parser.wasm'))
			: await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
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
					? await renderNodeDataFromPath(resolveBaselinePath(opts.baselineDir, 'templates'), nodeData)
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
		engine: opts.engine ?? 'typescript',
		probeRange,
		cst,
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

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function dumpCst(node: any, fieldName: string | null): CstNode {
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
	const { readNode } = await import('@sittir/core');
	return readNode(handle, nodeId);
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
	const bound = createRenderer(templatesPath);
	return bound.render(nodeData as Parameters<typeof bound.render>[0]);
}

/** @internal — render via templates from an explicit absolute path
 *  (used by --baseline mode to swap render-side artifacts). */
async function renderNodeDataFromPath(templatesPath: string, nodeData: unknown): Promise<string> {
	const { createRenderer } = await import('@sittir/core');
	const bound = createRenderer(templatesPath);
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
		? 'TS and native engines agree on render output'
		: `engines disagree (TS - native = ${renderedLenDelta >= 0 ? '+' : ''}${renderedLenDelta} chars)`;
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

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
	main().catch((err) => {
		console.error('probe-kind:', err instanceof Error ? err.message : err);
		process.exit(1);
	});
}
