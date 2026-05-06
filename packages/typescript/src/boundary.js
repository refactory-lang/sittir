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
import { createEngine } from './engine.js';
let defaultEngine = null;
function getDefaultEngine() {
    if (defaultEngine === null) {
        defaultEngine = createEngine();
    }
    return defaultEngine;
}
/**
 * Render a NodeData to source. Dispatches through the default engine.
 */
export function render(node) {
    return getDefaultEngine().render(node);
}
/**
 * Render `node` and return an Edit that splices the rendered text
 * into the given range. Uses the default engine's render method.
 */
export function toEdit(node, startOrRange, end) {
    const insertedText = render(node);
    if (typeof startOrRange === 'number') {
        if (typeof end !== 'number') {
            throw new Error('endPos is required when startPos is a number');
        }
        if (startOrRange < 0 || end < 0) {
            throw new Error(`Edit positions must be non-negative (got start=${startOrRange}, end=${end})`);
        }
        if (startOrRange > end) {
            throw new Error(`Edit startPos (${startOrRange}) must not exceed endPos (${end})`);
        }
        return { startPos: startOrRange, endPos: end, insertedText };
    }
    return {
        startPos: startOrRange.start.index,
        endPos: startOrRange.end.index,
        insertedText
    };
}
/**
 * Apply a batch of edits to a source string. Delegates to the default engine.
 */
export function applyEdits(source, edits) {
    return getDefaultEngine().applyEdits(source, edits);
}
//# sourceMappingURL=boundary.js.map