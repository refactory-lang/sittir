/**
 * Boundary shim — spec 012 T042 + spec 020 T003.
 *
 * Routes render / toEdit / applyEdits through a default engine instance.
 * The engine handles native/JS dispatch internally. Consumer-facing
 * signatures are unchanged from pre-012 semantics (FR-006).
 *
 * The default engine is lazily constructed on first use and cached for
 * the process lifetime. Callers who need engine-level format config or
 * explicit disposal should use createEngine() directly.
 */
import type { AnyNodeData, ByteRange, Edit } from '@sittir/types';
/**
 * Render a NodeData to source. Dispatches through the default engine.
 */
export declare function render(node: AnyNodeData): string;
/**
 * Render `node` and return an Edit that splices the rendered text
 * into the given range. Uses the default engine's render method.
 */
export declare function toEdit(node: AnyNodeData, startOrRange: number | ByteRange, end?: number): Edit;
/**
 * Apply a batch of edits to a source string. Delegates to the default engine.
 */
export declare function applyEdits(source: string, edits: readonly Edit[]): string;
//# sourceMappingURL=boundary.d.ts.map