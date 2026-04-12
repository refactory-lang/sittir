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
    deriveFields, deriveChildren,
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
                // Synthesize a hidden group for each form and insert into the NodeMap.
                // The polymorph holds references to these groups.
                const forms = extractForms(rule, kind)
                for (const form of forms) {
                    nodes.set(form.kind, form)
                }
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

    return {
        name: optimized.name,
        nodes,
        signatures: computeSignatures(nodes),
        projections: buildProjections(nodes),
    }
}

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
 * Classify a rule into a model type.
 *
 * By the time rules reach Assemble:
 * - Link has already classified hidden rules into SupertypeRule / EnumRule / GroupRule
 * - Those pass through via the already-classified check below
 * - Everything else is classified purely by structure
 *
 * No name-based checks. The _ prefix is an input signal for Link, not for Assemble.
 */
/**
 * Classify a rule by structural shape alone (no name heuristics).
 *
 * Decision rules, in order:
 *
 *   1. Pre-classified types (enum/supertype/group) pass through — Link has
 *      already determined the shape.
 *
 *   2. If the rule contains any `field(...)` → BRANCH. Fields are always
 *      structural user-addressable slots.
 *
 *   3. If the rule contains any visible OR hidden symbol (including
 *      supertype references that dispatch to concrete children at parse
 *      time) → it's a structural node with a children slot:
 *        - choice-with-variants with homogeneous field sets → branch
 *        - choice-with-variants with heterogeneous field sets → polymorph
 *        - otherwise → container
 *
 *   4. If the rule's content is exclusively terminal (patterns, string
 *      literals) with no fields and no symbol references → LEAF.
 *      escape_sequence, line_comment, block_comment, regex_pattern fall
 *      here; tree-sitter exposes them as text-only nodes.
 *
 *   5. Bare terminals: `pattern` → leaf; alphanumeric `string` → keyword;
 *      other `string` → token.
 */
export function classifyNode(kind: string, rule: Rule): ModelType {
    // 1. Already-classified types pass through (from Link)
    if (rule.type === 'enum') return 'enum'
    if (rule.type === 'supertype') return 'supertype'
    if (rule.type === 'group') return 'group'

    const fields = deriveFields(rule)
    const children = deriveChildren(rule)
    const hasStructure = fields.length > 0 || children.length > 0

    // 2. Choice-of-variants with structural content → polymorph or branch.
    //    (Choice-of-variants with ONLY pattern/string content is a token-
    //    constructor like `integer` — it falls through to leaf below.)
    if (rule.type === 'choice' && rule.members.some(m => m.type === 'variant') && hasStructure) {
        return allVariantsHaveSameFieldSet(rule) ? 'branch' : 'polymorph'
    }

    // 3. Any fields → branch.
    if (fields.length > 0) return 'branch'

    // 4. Any visible children (including those coming from hidden supertype
    //    references) → container.
    if (children.length > 0) return 'container'

    // 5. No fields, no children → terminal. Route by rule shape.
    if (rule.type === 'pattern') return 'leaf'
    if (rule.type === 'string') {
        return /^\w+$/.test(rule.value) ? 'keyword' : 'token'
    }

    // A seq/choice/repeat containing only terminal content (patterns, strings)
    // and no symbol references is itself a terminal — tree-sitter exposes it
    // as a text-only leaf node (escape_sequence, line_comment, integer, …).
    return 'leaf'
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

// ---------------------------------------------------------------------------
// extractForms — for polymorphs, synthesize a hidden AssembledGroup per form
// ---------------------------------------------------------------------------

function extractForms(rule: Rule, parentKind: string): AssembledGroup[] {
    if (rule.type !== 'choice') return []

    // Disambiguate form names when two variants share the same name (e.g. two
    // `variant('expression', ...)` entries over different shapes). Duplicates
    // get numeric suffixes so kinds/factoryNames remain unique.
    const nameCounts = new Map<string, number>()
    return rule.members.map((member, i) => {
        let baseName = member.type === 'variant' ? member.name : `form_${i}`
        const seen = nameCounts.get(baseName) ?? 0
        nameCounts.set(baseName, seen + 1)
        const name = seen === 0 ? baseName : `${baseName}${seen + 1}`
        const formKind = `${parentKind}_${name}`
        const { typeName, factoryName, irKey } = nameNode(formKind)

        // The form's rule IS its choice member (unwrap variant if present)
        const formRule = member.type === 'variant' ? member.content : member

        // Per design doc: polymorph form groups DO get factories
        // (the polymorph's dispatcher invokes them)
        return new AssembledGroup({
            kind: formKind,
            typeName,
            factoryName,
            irKey,
            rule: formRule,
            name,
        })
    })
}

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
