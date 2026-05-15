/**
 * from() correctness validation — structural comparison of from() vs factory output.
 *
 * Tests that from() resolvers produce correct NodeData by comparing
 * from(readNodeData) against factory(readNodeFields). Detects:
 * - undefined nodes (from() resolver failed to resolve a child)
 * - structural divergence (different fields or children)
 *
 * No tree-sitter re-parsing needed — pure structural comparison.
 */
var __rewriteRelativeImportExtension = (this && this.__rewriteRelativeImportExtension) || function (path, preserveJsx) {
    if (typeof path === "string" && /^\.\.?\//.test(path)) {
        return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function (m, tsx, d, ext, cm) {
            return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : (d + ext + "." + cm.toLowerCase() + "js");
        });
    }
    return path;
};
import { loadCorpusEntries, loadLanguageForGrammar, loadKindIdFromName, loadKindNameFromId, buildReadHandle, findFirst, findNativeNodeId, readNodeAt, adaptNode, collectKinds, emitValidatorMetrics, getChildFactoryArgs, nodeToConfig } from './common.js';
const FROM_MODULE_PATHS = {
    rust: '../../../rust/src/from.ts',
    typescript: '../../../typescript/src/from.ts',
    python: '../../../python/src/from.ts'
};
const FACTORY_MODULE_PATHS = {
    rust: '../../../rust/src/factories.ts',
    typescript: '../../../typescript/src/factories.ts',
    python: '../../../python/src/factories.ts'
};
const WRAP_MODULE_PATHS = {
    rust: '../../../rust/src/wrap.ts',
    typescript: '../../../typescript/src/wrap.ts',
    python: '../../../python/src/wrap.ts'
};
// ---------------------------------------------------------------------------
// Structural analysis
// ---------------------------------------------------------------------------
/** Find paths to malformed nodes (missing $type) in a NodeData tree.
 * Historically this checked `node.$type === 'undefined'`, which was a
 * footgun in typescript — the grammar has a kind literally named
 * `undefined` (the `undefined` keyword), and every valid Undefined
 * node tripped the check. Narrow to the actual intent: a node whose
 * `$type` is the JS undefined value (malformed construction). */
function findUndefined(node, path = '') {
    const results = [];
    if (node.$type === undefined)
        results.push(path || 'root');
    const rec = node;
    const namedSlotEntries = [];
    for (const key of Object.keys(rec)) {
        if (key.startsWith('_')) {
            namedSlotEntries.push([key.slice(1), rec[key]]);
        }
    }
    for (const [key, value] of namedSlotEntries) {
        if (Array.isArray(value)) {
            value.forEach((v, i) => {
                if (typeof v === 'object' && v !== null && '$type' in v) {
                    results.push(...findUndefined(v, `${path}.${key}[${i}]`));
                }
            });
        }
        else if (typeof value === 'object' && value !== null && '$type' in value) {
            results.push(...findUndefined(value, `${path}.${key}`));
        }
    }
    if (node.$children) {
        const children = Array.isArray(node.$children) ? node.$children : [node.$children];
        children.forEach((c, i) => {
            if (typeof c === 'object' && c !== null) {
                results.push(...findUndefined(c, `${path}.children[${i}]`));
            }
        });
    }
    return results;
}
/**
 * Shallow structural diff: compare type, factory-declared field keys,
 * named children count.
 *
 * The factory output `b` is the ground truth for "what fields this kind
 * declares." Any field in `from()` output `a` that isn't in `b` is
 * acceptable runtime metadata (promoted anonymous keywords like `fn`,
 * `{`, `;` from `readNode.promoteAnonymousKeyword`, tree-sitter
 * punctuation, etc.) — those don't count as divergence. Only mismatches
 * on keys the factory actually declared are real bugs.
 *
 * Undefined-valued entries are dropped before comparison — property
 * access can't distinguish `{a: undefined}` from `{}`, so the structural
 * comparison shouldn't either.
 */
function structuralDiff(a, b, kindNameFromId) {
    const diffs = [];
    if (a.$type !== b.$type)
        diffs.push(`$type: ${a.$type} vs ${b.$type}`);
    const extractSlotKeys = (node) => {
        const rec = node;
        return Object.keys(rec)
            .filter((k) => k.startsWith('_') && rec[k] !== undefined)
            .map((k) => k.slice(1));
    };
    const bKeys = new Set(extractSlotKeys(b));
    const aKeysMatchingB = extractSlotKeys(a).filter((k) => bKeys.has(k));
    // One-way check: fields factory declared that from() didn't fill in.
    const missingInA = [...bKeys].filter((k) => !aKeysMatchingB.includes(k)).sort();
    if (missingInA.length)
        diffs.push(`from() missing declared fields: ${missingInA.join(', ')}`);
    // Compare only named children — anonymous tokens (delimiters, separators)
    // are reconstructed from templates, not carried in factory output.
    // After commit 15c4c195 (child hoisting), anonymous leaf children scalarize
    // to numeric kind IDs on the wire. Numbers have no `$named` property, so
    // `c?.$named !== false` evaluates true for them — exclude explicitly.
    // Polymorph wrapper children (whose name starts with "{parent}_") are
    // produced differently by read vs factory — filter them from both sides to
    // avoid false divergence on the wrapper/unwrapper split.
    // $type is a numeric kind ID after child hoisting, so resolve parent name
    // through kindNameFromId before building the prefix. Hidden-rule types are
    // stored with a leading `_` (e.g. `_mod_item_external`); strip it before
    // the prefix comparison so the filter matches both underscored and plain names.
    const resolveTypeName = (t) => typeof t === 'string' ? t : t != null ? kindNameFromId?.(t) : undefined;
    const parentName = resolveTypeName(a.$type);
    const polymorphPrefix = parentName ? parentName + '_' : null;
    const resolveChildName = (t) => {
        const name = resolveTypeName(t);
        return name?.startsWith('_') ? name.slice(1) : name;
    };
    const isRealNamedChild = (c) => typeof c !== 'number' &&
        c?.$named !== false &&
        !(polymorphPrefix && resolveChildName(c?.$type)?.startsWith(polymorphPrefix));
    const aChildren = a.$children === undefined ? [] : Array.isArray(a.$children) ? a.$children : [a.$children];
    const bChildren = b.$children === undefined ? [] : Array.isArray(b.$children) ? b.$children : [b.$children];
    const aNamed = aChildren.filter(isRealNamedChild);
    const bNamed = bChildren.filter(isRealNamedChild);
    if (aNamed.length !== bNamed.length)
        diffs.push(`named children: ${aNamed.length} vs ${bNamed.length}`);
    return diffs;
}
export async function validateFrom(grammar, backend) {
    const { Parser, lang } = await loadLanguageForGrammar(grammar);
    const parser = new Parser();
    parser.setLanguage(lang);
    // Phase D: $type is numeric — load both resolvers.
    // kindIdFromName (name→id): for treeHandle JS-side reads and findNativeNodeId's kindId variant.
    // kindNameFromId (id→name): for findNativeNodeId's id-to-kind comparison.
    // The generated kindIdFromName throws on missing entries; wrap it so
    // readNode's resolveKindId falls back to the zero sentinel instead of
    // propagating a TypeError for form kinds not in the numeric catalog.
    const rawKindIdFromName = await loadKindIdFromName(grammar);
    const kindIdFromName = rawKindIdFromName
        ? (name) => {
            try {
                return rawKindIdFromName(name);
            }
            catch {
                return undefined;
            }
        }
        : rawKindIdFromName;
    const kindNameFromId = await loadKindNameFromId(grammar);
    // Import from() + factory + wrap modules. `.from()` expects a fluent
    // NodeData (from factory output OR readTreeNode wrap) OR a camelCase
    // loose bag — per spec 008 US3, bare `readNode` output isn't a
    // supported input. readTreeNode wraps readNode output via the per-kind
    // wrap function, producing a fluent NodeData that `.from()` accepts.
    let fromMap = {};
    let factoryMap = {};
    let factoryShapes = {};
    let factoryFields = {};
    let factorySlots = {};
    let fieldAliasMap = {};
    let polymorphVariants = {};
    let readTreeNode;
    try {
        const fromModule = await import(__rewriteRelativeImportExtension(new URL(FROM_MODULE_PATHS[grammar], import.meta.url).pathname));
        fromMap = fromModule._fromMap ?? {};
    }
    catch {
        /* from module unavailable */
    }
    try {
        const factoryModule = await import(__rewriteRelativeImportExtension(new URL(FACTORY_MODULE_PATHS[grammar], import.meta.url).pathname));
        factoryMap = factoryModule._factoryMap ?? {};
        // Validator-only metadata (shapes, field-alias, factoryFields,
        // factorySlots, polymorphVariants) lives in factory-map.json5.
        try {
            const mapPath = `../../../${grammar}/factory-map.json5`;
            const { readFileSync } = await import('node:fs');
            const content = readFileSync(new URL(mapPath, import.meta.url).pathname, 'utf-8');
            const jsonOnly = content.replace(/^\s*\/\/.*$/gm, '').trim();
            const mapData = JSON.parse(jsonOnly);
            factoryShapes = mapData.factoryShapes ?? {};
            factoryFields = mapData.factoryFields ?? {};
            factorySlots = mapData.factorySlots ?? {};
            fieldAliasMap = mapData.fieldAliasMap ?? {};
            polymorphVariants = mapData.polymorphVariants ?? {};
        }
        catch {
            /* factory-map.json5 unavailable */
        }
    }
    catch {
        /* factory module unavailable */
    }
    try {
        const wrapModule = await import(__rewriteRelativeImportExtension(new URL(WRAP_MODULE_PATHS[grammar], import.meta.url).pathname));
        readTreeNode = wrapModule.readTreeNode;
    }
    catch {
        /* wrap module unavailable */
    }
    const entries = loadCorpusEntries(grammar);
    const errors = [];
    const testedKinds = new Set();
    let pass = 0;
    let skip = 0;
    let total = 0;
    let undefinedCount = 0;
    let divergentCount = 0;
    for (const entry of entries) {
        const tree1 = parser.parse(entry.source);
        if (tree1.rootNode.hasError)
            continue;
        for (const kind of collectKinds(tree1.rootNode)) {
            if (!(kind in fromMap) || !(kind in factoryMap))
                continue;
            if (testedKinds.has(kind))
                continue;
            testedKinds.add(kind);
            total++;
            const node1 = findFirst(tree1.rootNode, kind);
            if (!node1)
                continue;
            let readData;
            try {
                const handle = buildReadHandle(grammar, tree1, entry.source, backend, kindIdFromName);
                // Native engine Rust-heap IDs differ from WASM linear-memory IDs.
                // Resolve via the native data tree; if the kind is an alias target
                // the native engine emits under a different rule name, skip rather
                // than fall back to a mismatched WASM ID.
                const nativeCoords = findNativeNodeId(handle, kind, kindNameFromId);
                if (nativeCoords === null && handle.read)
                    continue;
                // Use readTreeNode (wrapped via per-kind dispatch) when available,
                // so `.from()` sees a fluent NodeData — the supported input shape
                // per spec 008 US3. Fall back to raw readNode if the wrap module
                // isn't loaded (bootstrap scenarios).
                // ADR-0017: for WASM/JS path, temporarily swap rootNode to target
                // then call with no navigation coords (reads rootNode).
                if (nativeCoords && handle.read) {
                    readData = readTreeNode
                        ? readTreeNode(handle, nativeCoords.handle, nativeCoords.childIndex)
                        : readNodeAt(handle, adaptNode(node1), nativeCoords);
                }
                else {
                    const prev = handle.rootNode;
                    handle.rootNode = adaptNode(node1);
                    try {
                        readData = readTreeNode ? readTreeNode(handle) : readNodeAt(handle, adaptNode(node1), null);
                    }
                    finally {
                        handle.rootNode = prev;
                    }
                }
            }
            catch (e) {
                errors.push({
                    kind,
                    severity: 'error',
                    message: `read/wrap throws: ${e.message.slice(0, 120)}`
                });
                continue;
            }
            try {
                const fromResult = fromMap[kind](readData);
                let factoryResult;
                try {
                    // Route by the shape declared at codegen time — same
                    // pattern as validate-factory-roundtrip.ts. Guessing
                    // from `readData.fields` alone mis-routes empty
                    // containers (python `()` has promoted `(`/`)` fields
                    // but `children === undefined`, yet is a children-shape
                    // factory that must dispatch as `factory()` with no args).
                    const shape = factoryShapes[kind] ?? 'config';
                    const factory = factoryMap[kind];
                    if (shape === 'config' || shape === 'direct') {
                        // ADR-0018: readNode emits `_<name>` top-level keys, not
                        // `$fields`. Use `nodeToConfig` which handles both shapes
                        // and recursively resolves children through factories.
                        const config = nodeToConfig(readData, {
                            factoryMap: factoryMap,
                            factoryShapes,
                            factoryFields,
                            factorySlots,
                            fieldAliasMap,
                            polymorphVariants: polymorphVariants,
                            kindNameFromId
                        });
                        if (shape === 'direct') {
                            // Direct-call shape: use the sole field when metadata
                            // names one, otherwise treat it as a single child call.
                            const fieldNames = factoryFields[kind];
                            const rawName = fieldNames?.[0];
                            const camelName = rawName?.replace(/_([a-z])/g, (_m, c) => c.toUpperCase());
                            const childArgs = getChildFactoryArgs(kind, config, factorySlots);
                            const value = camelName
                                ? config[camelName]
                                : childArgs[0];
                            factoryResult = factory(value);
                        }
                        else {
                            factoryResult = factory(config);
                        }
                    }
                    else if (shape === 'text') {
                        // readData.$text is absent on branch nodes (gated by
                        // SITTIR_DEBUG_TEXT). For text-shaped factories, fall back to
                        // slicing the source span directly when $text is absent.
                        const textForFactory = readData.$text ?? (readData.$span ? entry.source.slice(readData.$span.start, readData.$span.end) : '');
                        factoryResult = factory(textForFactory);
                    }
                    else {
                        const config = nodeToConfig(readData, {
                            factoryMap: factoryMap,
                            factoryShapes,
                            factoryFields,
                            factorySlots,
                            fieldAliasMap,
                            polymorphVariants: polymorphVariants,
                            kindNameFromId
                        });
                        const childArgs = getChildFactoryArgs(kind, config, factorySlots);
                        factoryResult = factory(...childArgs);
                    }
                }
                catch {
                    skip++;
                    continue;
                }
                // Check for undefined nodes in from() output
                const undefinedNodes = findUndefined(fromResult);
                if (undefinedNodes.length > 0) {
                    undefinedCount++;
                    errors.push({
                        kind,
                        severity: 'error',
                        message: `from() produces undefined nodes at: ${undefinedNodes.slice(0, 3).join(', ')}`
                    });
                    continue;
                }
                // Structural comparison
                const diffs = structuralDiff(fromResult, factoryResult, kindNameFromId);
                if (diffs.length > 0) {
                    divergentCount++;
                    errors.push({
                        kind,
                        severity: 'warning',
                        message: `from() diverges: ${diffs.slice(0, 3).join('; ')}`
                    });
                    continue;
                }
                pass++;
            }
            catch (e) {
                errors.push({
                    kind,
                    severity: 'error',
                    message: `from() throws: ${e.message.slice(0, 80)}`
                });
            }
        }
    }
    emitValidatorMetrics();
    return {
        grammar,
        total,
        pass,
        fail: total - pass - skip,
        skip,
        undefinedCount,
        divergentCount,
        errors
    };
}
export function formatFromReport(result) {
    const lines = [];
    const icon = result.fail === 0 ? 'v' : 'x';
    lines.push(`  ${icon} ${result.pass}/${result.total} from() correctness (${result.undefinedCount} undefined, ${result.divergentCount} divergent, ${result.skip} skipped)`);
    if (result.errors.length > 0) {
        for (const e of result.errors) {
            const prefix = e.severity === 'error' ? 'x' : '!';
            lines.push(`    ${prefix} ${e.kind}: ${e.message}`);
        }
    }
    return lines.join('\n');
}
//# sourceMappingURL=from.js.map