/**
 * Boundary shim — spec 012 T042.
 *
 * Routes render / readNode / applyEdits / findMatches through the
 * active backend (native via napi, or the existing TS Nunjucks engine)
 * per contracts/backend-selection.md. Consumer-facing signatures are
 * unchanged from pre-012 semantics (FR-006).
 *
 * Native path: lazily constructs a module-scoped `SittirEngine` from
 * the loaded `@sittir/typescript-native` module carried on the backend
 * status. Falls back to the TS engine on any runtime error.
 *
 * TS path: reuses the package-level renderer (bound to
 * `packages/typescript/templates/`) and `@sittir/core` primitives
 * (`readNode`, `bindRange`).
 */

import { createRenderer, readNode as coreReadNode, recordFfi, metricsEnabled } from "@sittir/core";
import type { TreeHandle } from "@sittir/core";
import type { AnyNodeData, ByteRange, Edit } from "@sittir/types";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getActiveBackend, type NativeEngine } from "./backend.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GRAMMAR = "typescript";

/**
 * Package-level Nunjucks renderer. Lazily built on first render call
 * to keep module-load cheap; per-call overhead is just a property
 * lookup once the `BoundRenderer` is cached.
 */
let tsRenderer: ReturnType<typeof createRenderer> | null = null;
function getTsRenderer(): ReturnType<typeof createRenderer> {
	if (tsRenderer === null) {
		tsRenderer = createRenderer(join(__dirname, "..", "templates"));
	}
	return tsRenderer;
}

/**
 * Module-scoped native engine. Constructed from the loaded native
 * module on first use; kept for the process lifetime. A single engine
 * is sufficient for the current hot path since napi calls are
 * synchronous and the consumer is expected to serialize per thread.
 */
let nativeEngine: NativeEngine | null = null;
function getNativeEngine(): NativeEngine | null {
	const status = getActiveBackend();
	if (status.name !== "native" || !status.native) return null;
	if (nativeEngine === null) {
		try {
			nativeEngine = new status.native.SittirEngine();
		} catch {
			// Construction failure is rare (set_language ABI mismatch, mostly);
			// fall back silently to TS — the debug log line at selection
			// already surfaced the issue if the consumer cared.
			nativeEngine = null;
		}
	}
	return nativeEngine;
}

/**
 * Render a NodeData to source. Dispatches to the native engine when
 * active; otherwise uses the package-level TS renderer. Output is
 * byte-identical across backends on the render-parity partition
 * (FR-002a).
 */
export function render(node: AnyNodeData): string {
	const kind = node.$type;
	const engine = getNativeEngine();
	if (engine !== null) {
		try {
			if (metricsEnabled) {
				const json = JSON.stringify(node);
				const payloadBytes = json.length;
				const t0 = performance.now();
				const result = engine.render(json);
				const roundtripMs = performance.now() - t0;
				recordFfi(GRAMMAR, kind, payloadBytes, roundtripMs, result.length);
				return result;
			}
			return engine.render(JSON.stringify(node));
		} catch {
			// Runtime render failures on native are rare (template defects
			// fail `cargo build` per FR-008). If one slips through, fall
			// back to TS for this call — the next call retries native.
		}
	}
	return getTsRenderer().render(node);
}

/**
 * Render `node` and return an Edit that splices the rendered text
 * into the given range. Mirrors `@sittir/core`'s `BoundRenderer.toEdit`
 * but uses the backend-dispatching `render()` above so the Edit's
 * `insertedText` comes from whichever engine `getActiveBackend()`
 * reports — keeping the factory-method `node.toEdit(...)` consistent
 * with `node.render()`.
 */
export function toEdit(node: AnyNodeData, startOrRange: number | ByteRange, end?: number): Edit {
	const insertedText = render(node);
	if (typeof startOrRange === "number") {
		if (typeof end !== "number") {
			throw new Error("endPos is required when startPos is a number");
		}
		if (startOrRange < 0 || end < 0) {
			throw new Error(
				`Edit positions must be non-negative (got start=${startOrRange}, end=${end})`,
			);
		}
		if (startOrRange > end) {
			throw new Error(`Edit startPos (${startOrRange}) must not exceed endPos (${end})`);
		}
		return { startPos: startOrRange, endPos: end, insertedText };
	}
	return { startPos: startOrRange.start.index, endPos: startOrRange.end.index, insertedText };
}

/**
 * Apply a batch of edits to a source string. On native, delegates to
 * the engine's apply_edits (byte-level splice). On TS, performs the
 * equivalent sort-descending-and-splice inline.
 *
 * Consumers are responsible for non-overlapping edits (matches the
 * existing TS edit.ts / napi-api.md contract).
 */
export function applyEdits(source: string, edits: readonly Edit[]): string {
	const engine = getNativeEngine();
	if (engine !== null) {
		try {
			return engine.applyEdits(
				source,
				edits.map((e) => ({ ...e })),
			);
		} catch {
			// Fall through to TS splice on any native failure.
		}
	}
	return applyEditsTs(source, edits);
}

function applyEditsTs(source: string, edits: readonly Edit[]): string {
	if (edits.length === 0) return source;
	const sorted = [...edits].sort((a, b) => b.startPos - a.startPos);
	let out = source;
	for (const e of sorted) {
		if (e.startPos > e.endPos) {
			throw new Error(`invalid edit range: startPos=${e.startPos} > endPos=${e.endPos}`);
		}
		if (e.endPos > out.length) {
			throw new Error(`edit endPos=${e.endPos} exceeds source length=${out.length}`);
		}
		out = out.slice(0, e.startPos) + e.insertedText + out.slice(e.endPos);
	}
	return out;
}

/**
 * Read a single tree node one level deep. Backend-dispatching entry
 * point paired with the per-kind `wrap*` functions in wrap.ts.
 *
 * Consumer-facing signature mirrors `@sittir/core`'s `readNode`
 * (tree handle + optional nodeId). The native path is only taken if
 * the engine has a tree cached from a prior `findMatches` call — the
 * grammar-agnostic `TreeHandle` shape has no native-engine binding
 * of its own, so callers that supply a raw `TreeHandle` always go
 * through the TS path (correct: that's the only path that can read
 * a tree the engine doesn't own).
 */
export function readNode(tree: TreeHandle, nodeId?: number): AnyNodeData {
	// A TreeHandle from ast-grep / tree-sitter isn't directly addressable
	// from the native engine's internal state — there's no cross-boundary
	// identity. So native dispatch for this entry point is only meaningful
	// when the caller is inside a find-and-read pipeline that populated
	// the engine's own tree. That integration lands with the ast-grep
	// unblock (T033 deferral). Today: always TS.
	return coreReadNode(tree, nodeId);
}

/**
 * Run an ast-grep pattern match against `source`. Returns the matched
 * node ids + a handle for drilling in. Deferred on native per T033
 * (ast-grep-core version conflict with grammar crates); the TS path
 * below is the currently-documented behaviour of the codemod stack.
 *
 * When the TS side exposes a packaged `findMatches` (presently the
 * feature lives inside the ast-grep library, not in @sittir/core),
 * this shim routes through it. Today it throws a clear NotImplemented
 * so consumers that call through the backend layer get a visible
 * error rather than a silent miss.
 */
export function findMatches(_source: string, _pattern: string): never {
	const engine = getNativeEngine();
	if (engine !== null) {
		throw new Error(
			"findMatches not yet routable through native backend — ast-grep-core integration pending (T033 deferral)",
		);
	}
	throw new Error(
		"findMatches not yet implemented in the TS backend of @sittir/typescript — use ast-grep directly and feed TreeHandle to readNode()",
	);
}
