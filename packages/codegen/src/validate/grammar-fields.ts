/**
 * grammar-fields — compute the set of "directly-addressable" fields for
 * each named rule in a tree-sitter grammar.json.
 *
 * ## Why
 *
 * Tree-sitter's `node-types.json` records EVERY field that can appear
 * under a kind in any concrete parse tree — including two kinds of
 * "flatten artifacts" that the rule itself never references at the top
 * level:
 *
 *  1. **Nested fields** — declared inside another `FIELD` block in the
 *     same rule. Example: `infer_type` declares
 *     `field('constraint', choice(seq('extends', field('type', $.type)), BLANK))`
 *     — `type` shows up at the top level of `infer_type`'s entry in
 *     `node-types.json` even though it's only reachable via the
 *     `constraint` placeholder's emission.
 *
 *  2. **Alias-collapse fields** — contributed by a SEPARATE rule R' that
 *     has `ALIAS{value=K}` somewhere in the grammar. Example:
 *     `_type_query_instantiation_expression` has a `function` field and
 *     aliases up to `instantiation_expression` via the `type_query`
 *     chain — `function` appears as a field of `instantiation_expression`
 *     in node-types even though the `instantiation_expression` rule
 *     itself never mentions `function`.
 *
 * Render templates can't reference either: case (1) is emitted via the
 * parent field's placeholder; case (2) is handled by the OTHER rule's
 * template (which renders when that rule's input form is parsed). The
 * template-coverage validator must NOT flag them as missing.
 *
 * ## What "directly addressable" means
 *
 * For a rule R, the directly-addressable field set is every `FIELD name`
 * encountered while walking R's content under these constraints:
 *
 *  - We do NOT enter another `FIELD`'s content (those are the nested
 *    fields — case 1).
 *  - We DO follow hidden `_*` symbols (they inline into R verbatim).
 *  - We do NOT follow visible (non-`_`-prefixed) symbols (they keep
 *    their own field namespace).
 *  - We DO traverse SEQ/CHOICE/REPEAT/PREC etc. transparently.
 *  - ALIAS nodes wrapping a hidden symbol with a visible `value` are
 *    NOT followed (they project to a different visible kind).
 *
 * Alias-target rules (case 2) are intentionally NOT folded back into
 * K's set — their top-level fields are also flatten artifacts from K's
 * primary template's perspective.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const packagesDir = fileURLToPath(new URL('../../../', import.meta.url))

interface GrammarJson {
    rules: Record<string, GrammarRule>
}

type GrammarRule = unknown

interface FieldNode { type: 'FIELD'; name: string; content: GrammarRule }
interface SymbolNode { type: 'SYMBOL'; name: string }
interface AliasNode { type: 'ALIAS'; value: string; named?: boolean; content: GrammarRule }

function isField(n: unknown): n is FieldNode {
    return !!n && typeof n === 'object' && (n as { type?: unknown }).type === 'FIELD'
}
function isSymbol(n: unknown): n is SymbolNode {
    return !!n && typeof n === 'object' && (n as { type?: unknown }).type === 'SYMBOL'
}
function isAlias(n: unknown): n is AliasNode {
    return !!n && typeof n === 'object' && (n as { type?: unknown }).type === 'ALIAS'
}

/**
 * Load a grammar's `grammar.json` from `packages/<grammar>/.sittir/src/`.
 * Returns null when the file isn't present (older test fixtures, fresh
 * checkouts where codegen hasn't run) — caller should treat the absence
 * as "no transitive-coverage data; fall back to strict checking".
 */
export function loadGrammarJson(grammar: string): GrammarJson | null {
    const path = join(packagesDir, grammar, '.sittir', 'src', 'grammar.json')
    if (!existsSync(path)) return null
    return JSON.parse(readFileSync(path, 'utf8')) as GrammarJson
}

/**
 * Compute the "directly-addressable field" set for every named rule in
 * the grammar. Returns `kind → Set<fieldName>` where each `fieldName`
 * IS reachable from the kind's primary template via a top-level FIELD
 * placeholder.
 *
 * @remarks
 * Any field declared in `node-types.json` for a kind but NOT present in
 * this set is a tree-sitter flatten artifact (nested-field or alias-
 * collapse) and should be considered transitively covered.
 */
export function computeDirectFields(grammar: GrammarJson): Map<string, Set<string>> {
    const rules = grammar.rules
    const direct = new Map<string, Set<string>>()
    for (const kind of Object.keys(rules)) {
        if (kind.startsWith('_')) continue
        const fields = new Set<string>()
        collectDirectFields(rules[kind], rules, fields, new Set())
        direct.set(kind, fields)
    }
    return direct
}

/**
 * Compute, for each named rule K, the set of field names nested inside
 * another FIELD's content somewhere in K's rule tree (following hidden
 * `_*` symbols). A nested field shows up at K's top level in
 * `node-types.json` but is unreachable as a direct placeholder — it's
 * emitted via the parent FIELD's placeholder.
 *
 * This is the strict subset of "transitively covered" fields the
 * template-coverage validator can confidently skip without masking
 * alias-collapse coverage gaps.
 */
export function computeNestedFields(grammar: GrammarJson): Map<string, Set<string>> {
    const rules = grammar.rules
    const nested = new Map<string, Set<string>>()
    for (const kind of Object.keys(rules)) {
        if (kind.startsWith('_')) continue
        const fields = new Set<string>()
        collectNestedFields(rules[kind], rules, fields, /* insideField */ false, new Set())
        nested.set(kind, fields)
    }
    return nested
}

/**
 * Walk a rule node, collecting every FIELD name encountered while we
 * are INSIDE another FIELD's content. Hidden `_*` symbols are inlined;
 * visible symbols (including the kind itself for self-recursion) and
 * named aliases are not followed.
 */
function collectNestedFields(
    node: unknown,
    rules: Record<string, GrammarRule>,
    out: Set<string>,
    insideField: boolean,
    visited: Set<string>,
): void {
    if (!node || typeof node !== 'object') return
    if (isField(node)) {
        if (insideField) out.add(node.name)
        // Recurse into FIELD's content with insideField=true so any
        // further FIELD inside this content gets recorded.
        collectNestedFields(node.content, rules, out, true, visited)
        return
    }
    if (isAlias(node)) {
        if (node.named) return
        collectNestedFields(node.content, rules, out, insideField, visited)
        return
    }
    if (isSymbol(node)) {
        if (!node.name.startsWith('_')) return
        if (visited.has(node.name)) return
        const target = rules[node.name]
        if (target === undefined) return
        const nextVisited = new Set(visited)
        nextVisited.add(node.name)
        collectNestedFields(target, rules, out, insideField, nextVisited)
        return
    }
    const n = node as { content?: unknown; members?: unknown[] }
    if (n.content !== undefined) {
        collectNestedFields(n.content, rules, out, insideField, visited)
    }
    if (Array.isArray(n.members)) {
        for (const m of n.members) collectNestedFields(m, rules, out, insideField, visited)
    }
}

/**
 * Walk a rule node, accumulating the names of every `FIELD` whose
 * position is "top-level" — reachable without crossing into another
 * FIELD's content, into a visible (non-`_`) SYMBOL, or into a named
 * ALIAS that re-projects to a different visible kind.
 *
 * @param visited - Hidden-symbol cycle guard.
 */
function collectDirectFields(
    node: unknown,
    rules: Record<string, GrammarRule>,
    out: Set<string>,
    visited: Set<string>,
): void {
    if (!node || typeof node !== 'object') return
    if (isField(node)) {
        out.add(node.name)
        // Do NOT recurse into the FIELD's content — anything inside is
        // a nested-field by definition.
        return
    }
    if (isAlias(node)) {
        // A named ALIAS reprojects to a different kind; don't claim its
        // fields. An anonymous (named=false) ALIAS just re-labels the
        // surface text and DOES contribute its content's fields.
        if (node.named) return
        collectDirectFields(node.content, rules, out, visited)
        return
    }
    if (isSymbol(node)) {
        // Inline only hidden rules (tree-sitter convention: `_`-prefix
        // means "no node in the parse tree, just splice the rule's
        // content into this position"). Visible symbols keep their own
        // field namespace.
        if (!node.name.startsWith('_')) return
        if (visited.has(node.name)) return
        const target = rules[node.name]
        if (target === undefined) return
        const nextVisited = new Set(visited)
        nextVisited.add(node.name)
        collectDirectFields(target, rules, out, nextVisited)
        return
    }
    // SEQ / CHOICE / REPEAT / REPEAT1 / PREC / PREC_LEFT / PREC_RIGHT
    // / PREC_DYNAMIC / TOKEN / IMMEDIATE_TOKEN / BLANK / STRING /
    // PATTERN — recurse transparently into `content` and `members`.
    const n = node as { content?: unknown; members?: unknown[] }
    if (n.content !== undefined) {
        collectDirectFields(n.content, rules, out, visited)
    }
    if (Array.isArray(n.members)) {
        for (const m of n.members) collectDirectFields(m, rules, out, visited)
    }
}

