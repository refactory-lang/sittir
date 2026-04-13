/**
 * compiler/assemble.ts — Phase 4: Assemble
 *
 * First time nodes appear. All metadata (required, multiple, contentTypes,
 * detectToken, modelType) derived from the rule tree — not carried on Rule nodes.
 */

import type {
    Rule, OptimizedGrammar, NodeMap,
    AssembledNode, AssembledField, AssembledChild,
    KindProjection, SignaturePool, ProjectionContext,
    FieldRule,
} from './rule.ts'
import {
    AssembledBranch, AssembledContainer, AssembledPolymorph,
    AssembledLeaf, AssembledKeyword, AssembledToken, AssembledEnum,
    AssembledSupertype, AssembledGroup,
    hasAnyField, hasAnyChild,
} from './rule.ts'
import { tokenToName } from './optimize.ts'

// ---------------------------------------------------------------------------
// assemble() — main entry point
// ---------------------------------------------------------------------------

export function assemble(optimized: OptimizedGrammar): NodeMap {
    const nodes = new Map<string, AssembledNode>()

    for (const [kind, rule] of Object.entries(optimized.rules)) {
        const modelType = classifyNode(kind, rule)
        const { typeName, factoryName, irKey } = nameNode(kind)

        switch (modelType) {
            case 'branch': {
                nodes.set(kind, new AssembledBranch({
                    kind, typeName, factoryName, irKey, rule,
                }))
                break
            }
            case 'container': {
                nodes.set(kind, new AssembledContainer({
                    kind, typeName, factoryName, irKey, rule,
                }))
                break
            }
            case 'polymorph': {
                // PolymorphRule is Optimize's output: already has forms in
                // declaration order. Build one AssembledGroup per form and
                // insert into the NodeMap; the polymorph references them.
                if (rule.type !== 'polymorph') {
                    throw new Error(
                        `assemble: kind '${kind}' classified as polymorph but rule.type=${rule.type}. ` +
                        `promotePolymorph in Optimize should have wrapped it.`,
                    )
                }
                const nameCounts = new Map<string, number>()
                const forms: AssembledGroup[] = rule.forms.map((form) => {
                    // Disambiguate duplicate form names (two `expression` variants
                    // over different shapes — e.g. python's expression_statement).
                    const seen = nameCounts.get(form.name) ?? 0
                    nameCounts.set(form.name, seen + 1)
                    const disambiguated = seen === 0 ? form.name : `${form.name}${seen + 1}`
                    const formKind = `${kind}_${disambiguated}`
                    const formNames = nameNode(formKind)
                    return new AssembledGroup({
                        kind: formKind,
                        typeName: formNames.typeName,
                        factoryName: formNames.factoryName,
                        irKey: formNames.irKey,
                        rule: form.content,
                        name: disambiguated,
                    })
                })
                for (const form of forms) nodes.set(form.kind, form)
                nodes.set(kind, new AssembledPolymorph({
                    kind, typeName, factoryName, irKey, forms,
                }))
                break
            }
            case 'leaf': {
                nodes.set(kind, new AssembledLeaf({
                    kind, typeName, factoryName, irKey,
                    pattern: rule.type === 'pattern' ? rule.value : undefined,
                }))
                break
            }
            case 'keyword': {
                nodes.set(kind, new AssembledKeyword({
                    kind, typeName, factoryName, irKey,
                    text: rule.type === 'string' ? rule.value : '',
                }))
                break
            }
            case 'token': {
                // Hidden — no factoryName
                nodes.set(kind, new AssembledToken({ kind, typeName }))
                break
            }
            case 'enum': {
                nodes.set(kind, new AssembledEnum({
                    kind, typeName,
                    values: rule.type === 'enum' ? rule.values : [],
                }))
                break
            }
            case 'supertype': {
                // Extract subtypes: from SupertypeRule directly, or from choice members
                let subtypes: string[]
                if (rule.type === 'supertype') {
                    subtypes = rule.subtypes
                } else if (rule.type === 'choice') {
                    subtypes = rule.members
                        .map(m => m.type === 'variant' ? m.content : m)
                        .filter(m => m.type === 'symbol')
                        .map(m => (m as any).name)
                } else {
                    subtypes = []
                }
                nodes.set(kind, new AssembledSupertype({ kind, typeName, subtypes }))
                break
            }
            case 'group': {
                // Unwrap GroupRule to its inner content (the seq-with-fields)
                const groupRule = rule.type === 'group' ? rule.content : rule
                nodes.set(kind, new AssembledGroup({
                    kind, typeName, rule: groupRule,
                }))
                break
            }
        }
    }

    // Part A: Collect anonymous tokens/keywords from the rule tree
    // Tree-sitter promotes string literals to named node-types entries
    collectAnonymousNodes(optimized.rules, nodes)

    // Part B: Resolve ir-namespace keys after the NodeMap is complete so
    // collision detection sees every node at once. Emitters read
    // `node.irKey` rather than re-running shortening rules.
    resolveIrKeys(nodes)

    return {
        name: optimized.name,
        nodes,
        signatures: computeSignatures(nodes),
        projections: buildProjections(nodes),
    }
}

// ---------------------------------------------------------------------------
// resolveIrKeys — dedupe-aware short-name pass over the whole NodeMap
// ---------------------------------------------------------------------------

/**
 * The ir namespace (`import { ir } from './ir.js'`) exposes each kind
 * under a short ergonomic key. Collisions on the short form fall back
 * to the full factoryName; JS reserved words get a `_` suffix. This
 * pass claims keys in nodeMap iteration order.
 */
function resolveIrKeys(nodes: Map<string, AssembledNode>): void {
    const claimed = new Set<string>()
    for (const [, node] of nodes) {
        if (!node.factoryName) continue
        // Synthesised polymorph form groups live under their parent's
        // variant dispatch, not as top-level ir keys.
        if (node.modelType === 'group') continue

        const short = shortenIrKey(node.kind)
        if (!claimed.has(short)) {
            claimed.add(short)
            node.irKey = short
            continue
        }
        // Collision — fall back to the full factory name.
        const full = node.factoryName
        claimed.add(full)
        node.irKey = full
    }
}

function shortenIrKey(kind: string): string {
    const stripped = kind
        .replace(/_item$/, '')
        .replace(/_expression$/, '')
        .replace(/_statement$/, '')
        .replace(/_declaration$/, '')
        .replace(/_definition$/, '')
    const parts = stripped.split('_').filter(Boolean)
    if (parts.length === 0) return nameNode(kind).factoryName
    const camel = parts
        .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join('')
    // Reserved-word names fall back to the factory name, which already
    // carries the `_` suffix from nameNode.
    if (IR_KEY_RESERVED.has(camel)) return nameNode(kind).factoryName
    return camel
}

const IR_KEY_RESERVED = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
    'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
    'false', 'finally', 'for', 'function', 'if', 'import', 'in',
    'instanceof', 'let', 'new', 'null', 'return', 'static', 'super',
    'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
    'while', 'with', 'yield', 'async', 'await',
])

// ---------------------------------------------------------------------------
// collectAnonymousNodes — extract string literals from rules as token/keyword entries
// ---------------------------------------------------------------------------

function collectAnonymousNodes(rules: Record<string, Rule>, nodes: Map<string, AssembledNode>): void {
    const seen = new Set<string>()

    for (const rule of Object.values(rules)) {
        walkForStrings(rule, seen)
    }

    for (const value of seen) {
        if (nodes.has(value)) continue // Already classified as a named rule
        if (value === '' || /^\s+$/.test(value)) continue // Skip whitespace/empty

        const isAlphanumeric = /^\w+$/.test(value)
        const { typeName } = nameNode(value)

        if (isAlphanumeric) {
            // Keyword token (e.g., "if", "class", "pub")
            // Anonymous keywords from grammar — no factory (hidden)
            nodes.set(value, new AssembledKeyword({
                kind: value, typeName, text: value,
            }))
        } else {
            // Operator/punctuation token (e.g., "+", "->", "{")
            nodes.set(value, new AssembledToken({ kind: value, typeName }))
        }
    }
}

function walkForStrings(rule: Rule, out: Set<string>): void {
    switch (rule.type) {
        case 'string':
            out.add(rule.value)
            break
        case 'enum':
            // Enum values are string literals — collect them as anonymous nodes
            for (const v of rule.values) out.add(v)
            break
        case 'seq':
            for (const m of rule.members) walkForStrings(m, out)
            break
        case 'choice':
            for (const m of rule.members) walkForStrings(m, out)
            break
        case 'optional':
            walkForStrings(rule.content, out)
            break
        case 'repeat':
            walkForStrings(rule.content, out)
            break
        case 'field':
            walkForStrings(rule.content, out)
            break
        case 'variant':
            walkForStrings(rule.content, out)
            break
        case 'clause':
            walkForStrings(rule.content, out)
            break
        case 'group':
            walkForStrings(rule.content, out)
            break
    }
}

// ---------------------------------------------------------------------------
// classifyNode — structural simplification + visibility
// ---------------------------------------------------------------------------

type ModelType = AssembledNode['modelType']

/**
 * Check if all variant members of a choice have the same field names.
 * If so, it's a branch with operator variation (e.g., binary_operator with prec variants),
 * not a polymorph with structurally distinct forms.
 */
function allVariantsHaveSameFieldSet(rule: Rule): boolean {
    if (rule.type !== 'choice') return false

    const fieldSets: Set<string>[] = []
    for (const member of rule.members) {
        const content = member.type === 'variant' ? member.content : member
        const fields = extractFieldNames(content)
        fieldSets.push(fields)
    }

    if (fieldSets.length < 2) return false

    const first = fieldSets[0]
    // Must have at least one field — empty field sets mean children-based, not field-based
    if (first.size === 0) return false

    return fieldSets.every(s =>
        s.size === first.size && [...s].every(f => first.has(f))
    )
}

function extractFieldNames(rule: Rule): Set<string> {
    const names = new Set<string>()
    walkForFieldNames(rule, names)
    return names
}

function walkForFieldNames(rule: Rule, out: Set<string>): void {
    switch (rule.type) {
        case 'field':
            out.add(rule.name)
            break
        case 'seq':
            for (const m of rule.members) walkForFieldNames(m, out)
            break
        case 'choice':
            for (const m of rule.members) walkForFieldNames(m, out)
            break
        case 'optional':
            walkForFieldNames(rule.content, out)
            break
        case 'repeat':
            walkForFieldNames(rule.content, out)
            break
        case 'variant':
            walkForFieldNames(rule.content, out)
            break
        case 'clause':
            walkForFieldNames(rule.content, out)
            break
    }
}

/**
 * Classify a rule into a model type by pure rule.type dispatch.
 *
 * By the time rules reach Assemble, Link and Optimize have already
 * pre-classified the interesting cases via dedicated rule types:
 *
 *   EnumRule       — Link: choice-of-strings
 *   SupertypeRule  — Link: hidden choice-of-symbols (grammar or promoted)
 *   GroupRule      — Link: hidden seq with fields
 *   TerminalRule   — Link: subtree with no fields and no symbol refs
 *   PolymorphRule  — Optimize: choice-of-variants with heterogeneous fields
 *
 * Assemble just dispatches on rule.type. The only structural inspection
 * left is distinguishing branch (has fields) from container (has children
 * only) for ordinary seq rules — that's a one-level check.
 */
export function classifyNode(kind: string, rule: Rule): ModelType {
    switch (rule.type) {
        case 'enum':      return 'enum'
        case 'supertype': return 'supertype'
        case 'group':     return 'group'
        case 'terminal':  return 'leaf'
        case 'polymorph': return 'polymorph'
        case 'pattern':   return 'leaf'
        case 'string':    return /^\w+$/.test(rule.value) ? 'keyword' : 'token'
    }

    // seq/choice/optional/repeat/field/... — distinguish branch from container.
    // Only need existence checks, not full extraction. The class getters
    // (AssembledBranch.fields, AssembledContainer.children) do the full walk
    // later, once.
    if (hasAnyField(rule)) return 'branch'
    if (hasAnyChild(rule)) return 'container'

    // No fields, no children — Link should have wrapped this as TerminalRule.
    throw new Error(
        `classifyNode: '${kind}' has no fields, no children, and no rule-type ` +
        `classification. Link should have wrapped it as TerminalRule. rule.type=${rule.type}`,
    )
}

// ---------------------------------------------------------------------------
// simplifyRule — strip anonymous tokens, collapse trivial seq/choice
// ---------------------------------------------------------------------------

export function simplifyRule(rule: Rule): Rule {
    switch (rule.type) {
        case 'seq': {
            // Remove non-alphanumeric string nodes (anonymous tokens)
            const members = rule.members
                .map(m => simplifyRule(m))
                .filter(m => {
                    if (m.type === 'string' && !/^\w+$/.test(m.value)) return false
                    return true
                })
            if (members.length === 0) return { type: 'seq', members: [] }
            if (members.length === 1) return members[0]
            return { type: 'seq', members }
        }
        case 'choice': {
            // Collapse all-identical branches
            const members = rule.members.map(m =>
                m.type === 'variant' ? simplifyRule(m.content) : simplifyRule(m)
            )
            if (members.length === 1) return members[0]
            return { type: 'choice', members }
        }
        case 'optional':
            return simplifyRule(rule.content)
        case 'variant':
            return simplifyRule(rule.content)
        case 'clause':
            return simplifyRule(rule.content)
        default:
            return rule
    }
}

// ---------------------------------------------------------------------------
// extractFields — walk rule tree, collect fields with derived metadata
// ---------------------------------------------------------------------------

// extractForms — deleted. PolymorphRule.forms is built by Optimize's
// promotePolymorph pass; assemble builds AssembledGroup instances from
// those forms directly (see the 'polymorph' case of the switch above).

// ---------------------------------------------------------------------------
// Naming
// ---------------------------------------------------------------------------

// Reserved or restricted identifiers that cannot be top-level function names
// in strict-mode TypeScript (or would shadow globals in problematic ways).
const FACTORY_NAME_RESERVED = new Set([
    'arguments', 'eval', 'yield', 'await', 'async', 'function', 'class',
    'import', 'export', 'default', 'return', 'throw', 'new', 'delete',
    'typeof', 'instanceof', 'in', 'of', 'let', 'const', 'var', 'null',
    'true', 'false', 'undefined', 'NaN', 'Infinity', 'static', 'public',
    'private', 'protected', 'interface', 'package', 'implements',
])

export function nameNode(kind: string): { typeName: string; factoryName: string; irKey: string } {
    // Tokens/keywords can contain non-identifier chars (!=, #, %, ->, ==, etc.).
    // Route through tokenToName first so typeName is always a valid identifier.
    const normalized = /^[\w_]+$/.test(kind) ? kind : tokenToName(kind)
    // Preserve both leading underscore (hidden-rule marker) and internal
    // double underscores as discriminators. Hidden vs visible kinds that
    // share the same base must produce distinct names.
    //   `_type_identifier`  → `Hidden_Type_Identifier`  → `HiddenTypeIdentifier`
    //   `type_identifier`   → `Type_Identifier`         → `TypeIdentifier`
    //   `literal_type__x`   → `Literal_Type_U_X`        → `LiteralTypeUX`
    const hidden = normalized.startsWith('_')
    const marked = (hidden ? `hidden_${normalized.slice(1)}` : normalized)
        .replace(/__+/g, '_U_')
    let typeName = marked
        .split('_')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('') || 'Anonymous'
    // TypeScript identifiers cannot start with a digit
    if (/^\d/.test(typeName)) typeName = `Tok_${typeName}`
    let factoryName = typeName.charAt(0).toLowerCase() + typeName.slice(1)
    // Avoid names that are illegal as top-level function declarations
    // (e.g. `arguments`, `eval`) or that shadow language keywords.
    if (FACTORY_NAME_RESERVED.has(factoryName)) factoryName = `${factoryName}_`
    const irKey = factoryName
    return { typeName, factoryName, irKey }
}

// Reserved words that cannot be used as parameter/method names in TypeScript.
const TS_RESERVED_WORDS = new Set([
    'arguments', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
    'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof',
    'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try',
    'typeof', 'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'implements',
    'interface', 'package', 'private', 'protected', 'public',
])

export function nameField(fieldName: string): { propertyName: string; paramName: string } {
    let propertyName = fieldName.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    // Avoid TS reserved keywords for param names by suffixing with '_'
    let paramName = propertyName
    if (TS_RESERVED_WORDS.has(paramName)) paramName = `${paramName}_`
    return { propertyName, paramName }
}

// ---------------------------------------------------------------------------
// Signatures & Projections (stubs — full implementation in refinement)
// ---------------------------------------------------------------------------

function computeSignatures(nodes: Map<string, AssembledNode>): SignaturePool {
    return { signatures: new Map() }
}

function buildProjections(nodes: Map<string, AssembledNode>): ProjectionContext {
    return { projections: new Map() }
}
