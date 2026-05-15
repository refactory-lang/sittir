/**
 * Factory-render-parse validation — corpus → parse → readNode → factory() → render → re-parse.
 *
 * Uses direct factory calls (via _factoryMap) to isolate the template
 * quality signal from from() resolver bugs:
 * 1. Parse corpus source with tree-sitter
 * 2. readNode to get NodeData
 * 3. Call the factory directly with readNode fields (no from() resolver)
 * 4. Render the factory-produced node
 * 5. Re-parse and verify the kind exists
 */
var __rewriteRelativeImportExtension = (this && this.__rewriteRelativeImportExtension) || function (path, preserveJsx) {
    if (typeof path === "string" && /^\.\.?\//.test(path)) {
        return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function (m, tsx, d, ext, cm) {
            return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : (d + ext + "." + cm.toLowerCase() + "js");
        });
    }
    return path;
};
import { createRenderer } from '@sittir/core';
import { deriveRuleKinds } from './templates-path.js';
import { loadRawEntries } from './node-types-loader.js';
import { loadCorpusEntries, loadLanguageForGrammar, buildReadHandle, findFirst, findNativeNodeId, readNodeAt, adaptNode, collectKinds, buildKindToSupertypes, wrapForReparse, loadReadTreeNode, walkWrappedTree, getChildFactoryArgs, nodeToConfig, emitValidatorMetrics } from './common.js';
/** Find a node anywhere in the tree by its exact byte span. */
function findNodeBySpan(node, startIndex, endIndex) {
    // Descend before accepting the current node so same-span wrapper/parent pairs
    // resolve to the deepest CST node; override-polymorph inference needs the
    // discriminating wrapper kind rather than the enclosing container kind.
    for (let i = 0; i < node.childCount; i++) {
        const c = node.child(i);
        if (!c)
            continue;
        if (c.startIndex > startIndex || c.endIndex < endIndex)
            continue;
        const hit = findNodeBySpan(c, startIndex, endIndex);
        if (hit)
            return hit;
    }
    if (node.startIndex === startIndex && node.endIndex === endIndex)
        return node;
    return null;
}
/**
 * Strict AST structural equality — same shape as validate-roundtrip.
 * Anonymous tokens compared byte-exactly so silently dropped content
 * (commas, operators, terminators) fails the check.
 */
function astStructuralDiff(a, b, path = '') {
    if (a.type !== b.type) {
        return `${path || 'root'}: type ${a.type} ≠ ${b.type}`;
    }
    if (a.childCount !== b.childCount) {
        const aChildren = Array.from({ length: a.childCount }, (_, i) => {
            const c = a.child(i);
            return c ? (c.isNamed ? c.type : JSON.stringify(c.text)) : '?';
        }).join(',');
        const bChildren = Array.from({ length: b.childCount }, (_, i) => {
            const c = b.child(i);
            return c ? (c.isNamed ? c.type : JSON.stringify(c.text)) : '?';
        }).join(',');
        return `${path || a.type}: childCount ${a.childCount} ≠ ${b.childCount} [${aChildren}] vs [${bChildren}]`;
    }
    for (let i = 0; i < a.childCount; i++) {
        const ac = a.child(i);
        const bc = b.child(i);
        if (!ac || !bc)
            return `${path || a.type}[${i}]: missing child`;
        if (ac.isNamed !== bc.isNamed) {
            return `${path || a.type}[${i}]: named flag ${ac.isNamed} ≠ ${bc.isNamed}`;
        }
        if (!ac.isNamed) {
            if (ac.text !== bc.text) {
                return `${path || a.type}[${i}]: anon ${JSON.stringify(ac.text)} ≠ ${JSON.stringify(bc.text)}`;
            }
            continue;
        }
        const sub = astStructuralDiff(ac, bc, `${path || a.type}[${i}].${ac.type}`);
        if (sub)
            return sub;
    }
    return null;
}
/** Find the first node of `kind` whose `startIndex` equals `offset`. */
function findNodeAt(node, kind, offset) {
    if (node.type === kind && node.startIndex === offset)
        return node;
    for (let i = 0; i < node.childCount; i++) {
        const c = node.child(i);
        if (!c)
            continue;
        if (offset < c.startIndex || offset >= c.endIndex)
            continue;
        const hit = findNodeAt(c, kind, offset);
        if (hit)
            return hit;
    }
    return null;
}
/** Return the named tree-sitter child kinds for a parsed CST node, in source order. */
function namedChildKinds(node) {
    const kinds = [];
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child?.isNamed)
            kinds.push(child.type);
    }
    return kinds;
}
// ---------------------------------------------------------------------------
// Strip runtime metadata to simulate factory output
// ---------------------------------------------------------------------------
/**
 * Strip span, nodeId, and set named:true on all nodes recursively.
 * This simulates what a factory-built NodeData looks like — no runtime
 * metadata from tree-sitter, all children are named NodeData objects.
 */
function stripToFactory(data) {
    const result = {
        $type: data.$type,
        $source: 2,
        $named: true
    };
    if (data.$text !== undefined)
        result.$text = data.$text;
    if (data.$variant !== undefined)
        result.$variant = data.$variant;
    const rec = data;
    const dehoistedKeys = Object.keys(rec).filter((k) => k.startsWith('_'));
    /** Recursively strip a single field value. */
    const stripMemberValue = (value) => {
        if (Array.isArray(value)) {
            return value.map((v) => typeof v === 'object' && v !== null ? stripToFactory(v) : v);
        }
        if (typeof value === 'object' && value !== null) {
            return stripToFactory(value);
        }
        return value;
    };
    // New shape: iterate `_<name>` keys directly.
    for (const rawKey of dehoistedKeys) {
        const value = rec[rawKey];
        result[rawKey] = stripMemberValue(value);
    }
    if (data.$children) {
        // Factory nodes only have named children — filter anonymous
        const namedChildren = data.$children.filter((c) => typeof c !== 'object' || c === null || c.$named !== false);
        result.$children = stripMemberValue(namedChildren);
    }
    return result;
}
/** Relative path from codegen/src/validate to language package factories.ts */
const FACTORY_MODULE_PATHS = {
    rust: '../../../rust/src/factories.ts',
    typescript: '../../../typescript/src/factories.ts',
    python: '../../../python/src/factories.ts'
};
/** Relative path from codegen/src/validate to language package types.ts */
const TYPES_MODULE_PATHS = {
    rust: '../../../rust/src/types.ts',
    typescript: '../../../typescript/src/types.ts',
    python: '../../../python/src/types.ts'
};
/** Relative path from codegen/src/validate to language package factory-map.json5 */
const FACTORY_MAP_PATHS = {
    rust: '../../../rust/factory-map.json5',
    typescript: '../../../typescript/factory-map.json5',
    python: '../../../python/factory-map.json5'
};
/** Load the JSON5 factory metadata file. Emitted by emitFactoryMap;
 * pure data (no functions). Strips the leading comment block and
 * JSON.parses the rest. */
async function loadFactoryMap(grammar) {
    const p = FACTORY_MAP_PATHS[grammar];
    if (!p)
        return {
            factoryShapes: {},
            fieldAliasMap: {},
            factoryFields: {},
            factorySlots: {},
            polymorphVariants: {}
        };
    const { readFileSync } = await import('node:fs');
    const content = readFileSync(new URL(p, import.meta.url).pathname, 'utf-8');
    // Strip `// ...` line comments so JSON.parse accepts the body.
    const jsonOnly = content.replace(/^\s*\/\/.*$/gm, '').trim();
    const data = JSON.parse(jsonOnly);
    return {
        factoryShapes: data.factoryShapes ?? {},
        fieldAliasMap: data.fieldAliasMap ?? {},
        factoryFields: data.factoryFields ?? {},
        factorySlots: data.factorySlots ?? {},
        polymorphVariants: data.polymorphVariants ?? {}
    };
}
/**
 * Dynamically import the generated `_factoryMap` and validator-only metadata
 * for a grammar. `_factoryShapes[kind]` encodes the calling convention
 * (`config` / `children` / `text`) produced at codegen time from the node
 * model type — it is never inferred at runtime.
 *
 * @param grammar - Grammar name (rust / typescript / python).
 * @returns Resolved factory artifacts and an `importFailure` record if loading
 *   fails, or `null` for `importFailure` on success.
 * @remarks Validator-only metadata lives in `factory-map.json5` and is loaded
 *   separately from the factory functions so the pure-data file stays
 *   tree-shakeable.
 */
async function loadFactoryModuleForGrammar(grammar) {
    const factoryModulePath = FACTORY_MODULE_PATHS[grammar];
    let factoryMap = {};
    let factoryShapes = {};
    let fieldAliasMap = {};
    let factoryFields = {};
    let factorySlots = {};
    let polymorphVariants = {};
    let kindNameFromId = undefined;
    let kindNames = undefined;
    let kindIdFromName = undefined;
    if (!factoryModulePath) {
        return {
            factoryMap,
            factoryShapes,
            fieldAliasMap,
            factoryFields,
            factorySlots,
            polymorphVariants,
            kindNames,
            kindNameFromId,
            kindIdFromName,
            importFailure: null
        };
    }
    try {
        const factoryModule = await import(__rewriteRelativeImportExtension(new URL(factoryModulePath, import.meta.url).pathname));
        factoryMap = factoryModule._factoryMap ?? {};
        // Validator-only metadata lives in factory-map.json5 — pure
        // data, loaded separately from the factory functions.
        const mapData = await loadFactoryMap(grammar);
        factoryShapes = mapData.factoryShapes;
        fieldAliasMap = mapData.fieldAliasMap;
        factoryFields = mapData.factoryFields;
        factorySlots = mapData.factorySlots;
        polymorphVariants = mapData.polymorphVariants;
        // Load KIND_NAMES (static Map) and kindIdFromName from the grammar's
        // types module.
        const typesModulePath = TYPES_MODULE_PATHS[grammar];
        if (typesModulePath) {
            try {
                const typesModule = await import(__rewriteRelativeImportExtension(new URL(typesModulePath, import.meta.url).pathname));
                const kindNamesMap = typesModule.KIND_NAMES;
                if (kindNamesMap) {
                    kindNames = kindNamesMap;
                    kindNameFromId = (id) => kindNamesMap.get(id);
                }
                const rawNameFn = typesModule.kindIdFromName;
                if (rawNameFn) {
                    kindIdFromName = (name) => {
                        try {
                            return rawNameFn(name);
                        }
                        catch {
                            return undefined;
                        }
                    };
                }
            }
            catch {
                // types module unavailable — resolvers stay undefined.
                // Reads will fail with a clear error if numeric $type is encountered.
            }
        }
        return {
            factoryMap,
            factoryShapes,
            fieldAliasMap,
            factoryFields,
            factorySlots,
            polymorphVariants,
            kindNames,
            kindNameFromId,
            kindIdFromName,
            importFailure: null
        };
    }
    catch (e) {
        const message = `[validate-factory-roundtrip] failed to load ${factoryModulePath}: ${e?.message ?? e}`;
        console.error(message);
        return {
            factoryMap,
            factoryShapes,
            fieldAliasMap,
            factoryFields,
            factorySlots,
            polymorphVariants,
            kindNames,
            kindNameFromId,
            kindIdFromName,
            importFailure: { message }
        };
    }
}
/**
 * Load the walker-based alias-source resolver for ADR-0006 wrap-aware kind
 * resolution. When available, walking the wrapped tree once per corpus entry
 * surfaces alias-source `$type`s so those kinds can be tested via their source
 * templates and reparse wrappers — the same infrastructure used in
 * validate-roundtrip.ts.
 *
 * @param grammar - Grammar name (rust / typescript / python).
 * @returns The `readTreeNode` function bound to the grammar, or `null` if the
 *   wrap layer is not available.
 */
async function loadWrapperBasedAliasResolver(grammar) {
    return loadReadTreeNode(grammar);
}
/**
 * Create a `Set` that deduplicates validation work on (kind, entry) pairs.
 * Each corpus entry that contains a kind is exercised exactly once — the
 * prior per-kind-only granularity hid real bugs: when the first corpus entry
 * happened to exercise a working shape, subsequent entries testing buggy
 * shapes (e.g. python `comparison_operator` with `not in` vs the chained
 * `a < b`) never ran. The (kind, entry) granularity keeps runtime bounded
 * while catching shape-specific bugs.
 *
 * @returns An empty Set keyed by `"${kind}\0${entryName}"` strings.
 */
function initKindEntryDeduplicator() {
    return new Set();
}
/**
 * Record a factory-module load failure as a sentinel error entry. Without
 * this entry, an empty `factoryMap` silently routes every kind to the
 * `stripToFactory` fallback, making the reported "factory pass" count reflect
 * the strip path rather than the real factory path — a false-green result.
 *
 * @param importFailure - The load-failure descriptor, or `null` if loading succeeded.
 * @param errors - Mutable error list to append to.
 */
function recordFactoryModuleLoadFailure(importFailure, errors) {
    if (importFailure) {
        errors.push({
            kind: '(factory-module-load)',
            message: importFailure.message
        });
    }
}
/**
 * Resolve the concrete `TSNode` to test for a given `kind` within a parsed
 * tree. For alias-source kinds (not present in tree-sitter's raw kind set),
 * look up by `nodeId` from the walker-populated `nodeIdToEffectiveType` map.
 * Plain kinds fall back to a breadth-first `findFirst` scan.
 *
 * @param kind - The effective (possibly alias-source) kind being tested.
 * @param rootNode - Root of the parsed tree to search.
 * @param nodeIdToEffectiveType - Map from tree-sitter node id to walker-resolved kind.
 * @returns The first matching `TSNode`, or `null` if none is found.
 */
function resolveNodeForKind(kind, rootNode, nodeIdToEffectiveType) {
    const direct = findFirst(rootNode, kind);
    if (direct)
        return direct;
    let node1 = null;
    let bestWidth = Number.POSITIVE_INFINITY;
    for (const [spanKey, et] of nodeIdToEffectiveType) {
        if (et === kind) {
            const colon = spanKey.indexOf(':');
            const startIdx = parseInt(spanKey.slice(0, colon), 10);
            const endIdx = parseInt(spanKey.slice(colon + 1), 10);
            const candidate = findNodeBySpan(rootNode, startIdx, endIdx);
            if (!candidate)
                continue;
            const width = endIdx - startIdx;
            if (width < bestWidth) {
                node1 = candidate;
                bestWidth = width;
            }
        }
    }
    return node1;
}
function renderKindNameOf(node, kindNameFromId) {
    if (typeof node.$type === 'string')
        return node.$type;
    if (typeof node.$type === 'number')
        return kindNameFromId?.(node.$type) ?? String(node.$type);
    return undefined;
}
function matchesRenderedKind(node, renderedKind, kindNameFromId) {
    const kind = renderKindNameOf(node, kindNameFromId);
    if (!kind)
        return false;
    if (kind === renderedKind)
        return true;
    const strippedKind = kind.startsWith('_') ? kind.slice(1) : kind;
    const strippedRendered = renderedKind.startsWith('_') ? renderedKind.slice(1) : renderedKind;
    return strippedKind === strippedRendered;
}
function alignReadDataToRenderedKind(rawReadData, renderedKind, kindNameFromId) {
    if (matchesRenderedKind(rawReadData, renderedKind, kindNameFromId))
        return rawReadData;
    const matchingChildren = rawReadData.$children?.filter((child) => child != null &&
        typeof child === 'object' &&
        child.$named !== false &&
        matchesRenderedKind(child, renderedKind, kindNameFromId)) ?? [];
    if (matchingChildren.length === 1)
        return matchingChildren[0];
    return { ...rawReadData, $type: renderedKind };
}
/**
 * Dispatch `readData` through the appropriate factory call convention and
 * return the resulting `NodeData`. Pure text leaves (no `_<name>` keys, no
 * legacy `$fields`, and no `$children`) are returned as-is — factories for container-shaped wrappers
 * that tree-sitter surfaces as leaves would produce garbage. Factory lookup
 * uses the walker-resolved kind so that alias-source factories are preferred
 * over alias-target factories, keeping the output `$type` aligned with our
 * declared interfaces. Errors thrown by the factory are pushed to `errors`
 * and `null` is returned so the caller can skip the reparse step — silently
 * falling back to `stripToFactory` on throw would make the "factory pass"
 * count fake.
 *
 * @param readData - NodeData produced by `readNode`, possibly with `$type` overridden.
 * @param renderedKind - The walker-resolved kind (used for factory + shape lookup).
 * @param cstNodeKindHint - CST node-kind fallback when the wrapper node itself discriminates the variant.
 * @param firstNamedChildKindHint - First CST named-child fallback for legacy callers.
 * @param namedChildKindHints - Ordered CST named-child fallback candidates.
 * @param factoryMap - Map from kind to factory function.
 * @param factoryShapes - Codegen-produced calling-convention map per kind.
 * @param fieldAliasMap - Camel→snake alias map used by `nodeToConfig`.
 * @param factoryFields - Declared field list per kind used by `nodeToConfig`.
 * @param factorySlots - Declared slot metadata per kind used by `nodeToConfig`.
 * @param treeHandle - Tree handle forwarded to `nodeToConfig` in recursive mode.
 * @param entryName - Corpus entry name, used when recording errors.
 * @param inputSource - Original source text, used when recording errors.
 * @param errors - Mutable error list to append to on factory throw.
 * @returns The factory-produced (or stripped) `AnyNodeData`, or `null` if the
 *   factory threw.
 * @remarks In recursive mode (`SITTIR_VALIDATE_RECURSIVE=1`) each child is
 *   drilled through its own factory, exposing factory-vs-read shape
 *   mismatches at the cost of surfacing spacing / anon-token divergences
 *   accumulated before the recursive path was added.
 */
function buildFactoryNodeData(readData, renderedKind, cstNodeKindHint, firstNamedChildKindHint, namedChildKindHints, factoryMap, factoryShapes, fieldAliasMap, factoryFields, factorySlots, polymorphVariants, treeHandle, entryName, inputSource, errors, kindNameFromId) {
    // Leaf check: no named fields (_<name> keys or legacy $fields) and no $children.
    const hasLegacyFields = !!readData['$fields'];
    const hasDehoistedFields = Object.keys(readData).some((k) => k.startsWith('_'));
    if (!hasLegacyFields && !hasDehoistedFields && !readData.$children) {
        // Leaf — render its text directly by preserving the original.
        return readData;
    }
    const factory = factoryMap[renderedKind];
    if (!factory) {
        return stripToFactory(readData);
    }
    try {
        const shape = factoryShapes[renderedKind] ?? 'config';
        if (shape === 'config' || shape === 'direct') {
            const recursive = process?.env?.SITTIR_VALIDATE_RECURSIVE === '1';
            const config = recursive
                ? nodeToConfig(readData, {
                    tree: treeHandle,
                    factoryMap,
                    factoryShapes,
                    fieldAliasMap,
                    factoryFields,
                    factorySlots,
                    polymorphVariants,
                    cstNodeKindHint,
                    firstNamedChildKindHint,
                    namedChildKindHints,
                    kindNameFromId
                })
                : nodeToConfig(readData, {
                    factoryMap,
                    factoryShapes,
                    fieldAliasMap,
                    factoryFields,
                    factorySlots,
                    polymorphVariants,
                    cstNodeKindHint,
                    firstNamedChildKindHint,
                    namedChildKindHints,
                    kindNameFromId
                });
            if (shape === 'direct') {
                // Direct-call shape: extract the sole field value when metadata
                // names one, otherwise treat it as a single child call.
                const fieldNames = factoryFields[renderedKind];
                const rawName = fieldNames?.[0];
                const camelName = rawName?.replace(/_([a-z])/g, (_m, c) => c.toUpperCase());
                const childArgs = getChildFactoryArgs(renderedKind, config, factorySlots);
                const value = camelName
                    ? config[camelName]
                    : childArgs[0];
                return factory(value);
            }
            return factory(config);
        }
        else if (shape === 'text') {
            // $TEXT-templated branch/container (e.g. rust
            // raw_string_literal) — factory accepts the raw
            // source span because external-scanner delimiters
            // can't be reconstructed from children.
            const text = readData.$text ?? '';
            return factory(text);
        }
        else {
            // shape === 'spread' — child-spread factory.
            const recursive = process?.env?.SITTIR_VALIDATE_RECURSIVE === '1';
            const config = recursive
                ? nodeToConfig(readData, {
                    tree: treeHandle,
                    factoryMap,
                    factoryShapes,
                    fieldAliasMap,
                    factoryFields,
                    factorySlots,
                    polymorphVariants,
                    cstNodeKindHint,
                    firstNamedChildKindHint,
                    namedChildKindHints,
                    kindNameFromId
                })
                : nodeToConfig(readData, {
                    factoryMap,
                    factoryShapes,
                    fieldAliasMap,
                    factoryFields,
                    factorySlots,
                    polymorphVariants,
                    cstNodeKindHint,
                    firstNamedChildKindHint,
                    namedChildKindHints,
                    kindNameFromId
                });
            const childArgs = getChildFactoryArgs(renderedKind, config, factorySlots);
            return factory(...childArgs);
        }
    }
    catch (e) {
        errors.push({
            kind: renderedKind,
            entry: entryName,
            message: `factory threw: ${e?.message?.slice(0, 100) ?? String(e)}`,
            input: inputSource
        });
        return null;
    }
}
/**
 * Wrap the rendered text for re-parsing using the supertype-based wrapper
 * registry, then re-parse it with the provided parser. Returns `null` for
 * the `tree2` field when wrapping is impossible (no registered wrapper for
 * this kind's supertype) — callers should count those cases as skips rather
 * than passes or failures, since the validator cannot make a claim either
 * way. Historically these were counted as passes, silently fake-passing every
 * TypeScript kind because the wrapper map used hidden-prefixed supertype names
 * that tree-sitter-typescript's unprefixed supertype names never matched.
 *
 * @param rendered - Rendered text to wrap.
 * @param renderedKind - Walker-resolved kind (picks up source-kind wrappers).
 * @param grammar - Grammar name passed to `wrapForReparse`.
 * @param kindToSupertypes - Supertype map used by `wrapForReparse`.
 * @param parser - Initialized tree-sitter parser used to re-parse.
 * @returns `{ wrapped, tree2 }` on success, `{ wrapped: null, tree2: null }`
 *   when no wrapper is registered (caller should skip), or `{ wrapped,
 *   tree2: null }` when the re-parse itself produces an error tree.
 */
function wrapAndReparseRendered(rendered, renderedKind, grammar, kindToSupertypes, parser) {
    const wrapped = wrapForReparse(rendered, renderedKind, grammar, kindToSupertypes);
    if (wrapped === null) {
        return { wrapped: null, tree2: null };
    }
    const tree2 = parser.parse(wrapped.text);
    if (!tree2 || tree2.rootNode.hasError) {
        return { wrapped, tree2: null };
    }
    return { wrapped, tree2 };
}
/**
 * Locate the rendered fragment node within the reparsed tree at the exact
 * wrapper offset, falling back to a breadth-first search when the offset
 * lookup fails. Using the wrapper offset avoids matching a wrapper-emitted
 * outer block/let/etc. of the same kind. `targetKind` (the tree-sitter alias
 * target, not the walker-resolved source kind) is what the reparsed tree
 * carries because tree-sitter re-applies the alias on re-parse.
 *
 * @param tree2 - Reparsed tree.
 * @param targetKind - The raw tree-sitter kind (`rawReadData.$type`).
 * @param wrapped - Wrapper result carrying `.offset`.
 * @returns The located node, or `null` if it cannot be found.
 */
function locateNodeInReparsedTree(tree2, targetKind, wrapped) {
    return findNodeAt(tree2.rootNode, targetKind, wrapped.offset) ?? findFirst(tree2.rootNode, targetKind);
}
/**
 * Compare the original and reparsed nodes structurally, recording any
 * mismatch in `astMismatches` and returning whether the trees matched exactly.
 * Recorded separately so the existing kind-found count stays a stable floor;
 * ast-match tightens it to catch factory API gaps where a field or children
 * slot is missing.
 *
 * @param node1 - Original node from the corpus parse.
 * @param node2 - Node located in the reparsed tree.
 * @param renderedKind - Kind label for the mismatch record.
 * @param entryName - Corpus entry name for the mismatch record.
 * @param inputSource - Original source text for the mismatch record.
 * @param rendered - Rendered text for the mismatch record.
 * @param astMismatches - Mutable mismatch list to append to.
 * @returns `true` if the two nodes are structurally identical, `false` otherwise.
 */
function recordAstStructuralComparison(node1, node2, renderedKind, entryName, inputSource, rendered, astMismatches) {
    const diff = astStructuralDiff(node1, node2);
    if (diff) {
        astMismatches.push({
            kind: renderedKind,
            entry: entryName,
            message: diff.slice(0, 160),
            input: inputSource,
            rendered
        });
        return false;
    }
    return true;
}
export async function validateFactoryRenderParse(grammar, templatesPath, backend) {
    const { Parser, lang } = await loadLanguageForGrammar(grammar);
    const parser = new Parser();
    parser.setLanguage(lang);
    const rawEntries = loadRawEntries(grammar);
    const ruleKinds = deriveRuleKinds(templatesPath);
    const kindToSupertypes = buildKindToSupertypes(rawEntries);
    const { factoryMap, factoryShapes, fieldAliasMap, factoryFields, factorySlots, polymorphVariants, kindNames, kindNameFromId, kindIdFromName, importFailure } = await loadFactoryModuleForGrammar(grammar);
    const { render } = createRenderer(templatesPath, { kindNames });
    const readTreeNodeFn = await loadWrapperBasedAliasResolver(grammar);
    const entries = loadCorpusEntries(grammar);
    const errors = [];
    const astMismatches = [];
    const testedPairs = initKindEntryDeduplicator();
    let pass = 0;
    let astMatchPass = 0;
    let skip = 0;
    let total = 0;
    recordFactoryModuleLoadFailure(importFailure, errors);
    // Short-circuit when the factory module failed to load. Otherwise an
    // empty `factoryMap` silently routes every kind to `stripToFactory`,
    // producing a misleading "factory render-parse passed" signal that
    // actually just exercised the strip fallback.
    if (importFailure) {
        return {
            grammar,
            total: 0,
            pass: 0,
            fail: 0,
            skip: 0,
            astMatchPass: 0,
            errors,
            astMismatches: []
        };
    }
    for (const entry of entries) {
        const tree1 = parser.parse(entry.source);
        if (tree1.rootNode.hasError)
            continue;
        const handle = buildReadHandle(grammar, tree1, entry.source, backend, kindIdFromName);
        const rawKinds = new Set(collectKinds(tree1.rootNode));
        const kinds = new Set(rawKinds);
        const nodeIdToEffectiveType = new Map();
        if (readTreeNodeFn) {
            const wrappedRoot = readTreeNodeFn(handle);
            walkWrappedTree(wrappedRoot, (w) => {
                // Phase D: $type is numeric; resolve to string kind name for
                // ruleKinds.has() and nodeIdToEffectiveType string-keyed maps.
                const kindStr = kindNameFromId ? kindNameFromId(w.$type) : undefined;
                if (kindStr === undefined)
                    return; // unknown id — skip
                // ADR-0017: use "${start}:${end}" composite span as collision-free identity key.
                const span = w.$span;
                if (span != null)
                    nodeIdToEffectiveType.set(`${span.start}:${span.end}`, kindStr);
                kinds.add(kindStr);
            });
        }
        for (const kind of kinds) {
            if (!ruleKinds.has(kind))
                continue;
            const pairKey = `${kind}\0${entry.name}`;
            if (testedPairs.has(pairKey))
                continue;
            testedPairs.add(pairKey);
            total++;
            const node1 = resolveNodeForKind(kind, tree1.rootNode, nodeIdToEffectiveType);
            if (!node1)
                continue;
            const inputSource = node1.text;
            // readNode → direct factory call → render → re-parse
            // Native engine uses Rust-heap pointer IDs; WASM engine uses
            // linear-memory IDs. Resolve via the native data tree. If the
            // kind is an alias target that the native engine emits under its
            // underlying rule name (e.g. `with_clause_bare` → `with_clause`),
            // findNativeNodeId returns null — skip rather than fall back to a
            // mismatched WASM handle.
            const nativeCoords = findNativeNodeId(handle, kind, kindNameFromId);
            if (nativeCoords === null && handle.read) {
                skip++;
                continue;
            }
            const rawReadData = readNodeAt(handle, adaptNode(node1), nativeCoords);
            // $type may be numeric (TSKindId) or string (hidden/synthetic kind).
            const rawKindName = typeof rawReadData.$type === 'number' && kindNameFromId
                ? kindNameFromId(rawReadData.$type)
                : typeof rawReadData.$type === 'string'
                    ? rawReadData.$type
                    : undefined;
            // canonicalKind: sittir internal form, may have leading underscore
            // (e.g. '_type_identifier') or may have an alias suffix
            // ('scoped_type_identifier_in_expression_position'). Used for factory
            // lookup and error reporting.
            const canonicalKind = rawKindName ?? String(rawReadData.$type);
            // targetKind: tree-sitter visible form used for locateNodeInReparsedTree.
            // Phase D: kindNameFromId may return a canonical form that differs from
            // tree-sitter's node.type (e.g. '_type_identifier' vs 'type_identifier',
            // or 'scoped_type_identifier_in_expression_position' vs
            // 'scoped_type_identifier'). Use node1.type as the ground truth — it's
            // the actual string tree-sitter reported for this node.
            const targetKind = node1.type;
            const effective = nodeIdToEffectiveType.get(`${node1.startIndex}:${node1.endIndex}`);
            // renderedKind: canonical form used for factory lookup and error messages.
            // Only wrapped-only/internal kinds should borrow the effective kind. For
            // direct CST kinds like `expression_statement` or `module`, overriding to a
            // same-span promoted child kind makes the validator run the wrong factory
            // against wrapper-shaped data.
            const renderedKind = rawKinds.has(kind) ? canonicalKind : (effective ?? canonicalKind);
            // Keep nodeToConfig's parent-kind / slot / polymorph lookups aligned with
            // the kind we're actually validating. If readData retains the outer wrapper
            // kind here (for example `expression_statement` while renderedKind is
            // `assignment`), nodeToConfig derives the wrong $variant and config surface
            // before the factory is called.
            const readData = alignReadDataToRenderedKind(rawReadData, renderedKind, kindNameFromId);
            const cstNamedChildKinds = namedChildKinds(node1);
            const factoryData = buildFactoryNodeData(readData, renderedKind, node1.type, cstNamedChildKinds[0], cstNamedChildKinds, factoryMap, factoryShapes, fieldAliasMap, factoryFields, factorySlots, polymorphVariants, handle, entry.name, inputSource, errors, kindNameFromId);
            if (factoryData === null)
                continue;
            try {
                const rendered = render(factoryData);
                if (!rendered.trim()) {
                    skip++;
                    continue;
                }
                const { wrapped, tree2 } = wrapAndReparseRendered(rendered, renderedKind, grammar, kindToSupertypes, parser);
                if (wrapped === null) {
                    // No wrapper registered — validator can't make a claim.
                    skip++;
                    continue;
                }
                if (tree2 === null) {
                    errors.push({
                        kind: renderedKind,
                        entry: entry.name,
                        message: `re-parse error: "${rendered.slice(0, 60)}"`,
                        input: inputSource,
                        rendered
                    });
                    continue;
                }
                const node2 = locateNodeInReparsedTree(tree2, targetKind, wrapped);
                if (!node2) {
                    errors.push({
                        kind: renderedKind,
                        entry: entry.name,
                        message: `kind not found in re-parse (rendered: "${rendered.slice(0, 60)}")`,
                        input: inputSource,
                        rendered
                    });
                    continue;
                }
                pass++;
                if (recordAstStructuralComparison(node1, node2, renderedKind, entry.name, inputSource, rendered, astMismatches)) {
                    astMatchPass++;
                }
            }
            catch (e) {
                errors.push({
                    kind: renderedKind,
                    entry: entry.name,
                    message: `${e.message.slice(0, 80)}`,
                    input: inputSource
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
        astMatchPass,
        errors,
        astMismatches
    };
}
export function formatFactoryRenderParseReport(result) {
    const lines = [];
    const icon = result.fail === 0 ? 'v' : 'x';
    lines.push(`  ${icon} ${result.pass}/${result.total} factory render parse (${result.skip} skipped, ${result.errors.length} errors)`);
    lines.push(`    ast-match ${result.astMatchPass}/${result.total} (${result.astMismatches.length} structural mismatches)`);
    if (result.errors.length > 0) {
        for (const e of result.errors) {
            lines.push(`    x ${e.kind}: ${e.message}`);
        }
    }
    if (result.astMismatches.length > 0) {
        for (const e of result.astMismatches.slice(0, 20)) {
            lines.push(`    ~ ${e.kind}: ${e.message}`);
        }
        if (result.astMismatches.length > 20) {
            lines.push(`    … and ${result.astMismatches.length - 20} more`);
        }
    }
    return lines.join('\n');
}
//# sourceMappingURL=factory-render-parse.js.map