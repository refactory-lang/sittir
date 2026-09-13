/**
 * Boundary shim — spec 012 T042 + spec 020 T003.
 *
 * Routes render / toEdit / applyEdits through a default engine instance.
 * The engine handles native/JS dispatch internally. Consumer-facing
 * signatures are unchanged from pre-012 semantics (FR-006).
 *
 * The default engine is lazily constructed on first use and cached for
 * the process lifetime; `defaultEngine()` hands it out so a tool that reads
 * a tree through it renders that tree's coordinates through the same engine
 * — a coordinate names the engine that minted it. Callers who need
 * engine-level format config or explicit disposal should use createEngine()
 * directly.
 */

import type { AnyNodeData, ByteRange, Edit } from '@sittir/types';
import { createRenderEngine } from './render-engine.js';
import type { SittirEngine } from '@sittir/common/engine';
import { metricsEnabled, recordFfi, toEditAt } from '@sittir/common';
import { KIND_NAMES } from './types.js';

let shared: SittirEngine | null = null;

/** The process-wide engine every boundary call renders through. */
export function defaultEngine(): SittirEngine {
	if (shared === null) {
		shared = createRenderEngine();
	}
	return shared;
}

/**
 * Render a NodeData to source. Dispatches through the default engine.
 *
 * When `SITTIR_METRICS=1`, times the napi round-trip and records it via
 * `recordFfi` (packages/common/src/metrics.ts) — the FFI-cost half of spec
 * 054, previously drafted but never wired to a real call site.
 */
export function render(node: AnyNodeData): string {
	if (!metricsEnabled) {
		return defaultEngine().render(node).toString();
	}
	const kind = typeof node.$type === 'number' ? (KIND_NAMES.get(node.$type) ?? String(node.$type)) : node.$type;
	const payloadBytes = JSON.stringify(node).length;
	const before = performance.now();
	const result = defaultEngine().render(node).toString();
	recordFfi('python', kind, payloadBytes, performance.now() - before, result.length);
	return result;
}

/**
 * Render `node` and return an Edit that splices the rendered text
 * into the given range. Uses the default engine's render method.
 */
export function toEdit(node: AnyNodeData, startOrRange: number | ByteRange, end?: number): Edit {
	return toEditAt(render(node), startOrRange, end);
}

/**
 * Apply a batch of edits to a source string. Delegates to the default engine.
 */
export function applyEdits(source: string, edits: readonly Edit[]): string {
	return defaultEngine().applyEdits(source, edits);
}
