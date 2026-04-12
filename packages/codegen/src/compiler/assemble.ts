/**
 * compiler/assemble.ts — Phase 4: Assemble
 *
 * First time nodes appear. All metadata (required, multiple, contentTypes,
 * detectToken, modelType) derived from the rule tree — not carried on Rule nodes.
 */

import type {
    Rule, OptimizedGrammar, NodeMap,
    AssembledNode, AssembledNodeBase, AssembledField, AssembledChild,
    AssembledForm, AssembledBranch, AssembledContainer, AssembledPolymorph,
    AssembledLeaf, AssembledKeyword, AssembledToken, AssembledEnum,
    AssembledSupertype, AssembledGroup,
    KindProjection, SignaturePool, ProjectionContext,
    FieldRule,
} from './rule.ts'

// ---------------------------------------------------------------------------
// assemble() — main entry point
// ---------------------------------------------------------------------------

export function assemble(optimized: OptimizedGrammar): NodeMap {
    const nodes = new Map<string, AssembledNode>()

    for (const [kind, rule] of Object.entries(optimized.rules)) {
        const modelType = classifyNode(kind, rule)
        const { typeName, factoryName, irKey } = nameNode(kind)
        const base: AssembledNodeBase = { kind, typeName, factoryName, irKey }

        switch (modelType) {
            case 'branch': {
                const fields = extractFields(rule)
                const children = extractChildren(rule)
                nodes.set(kind, { ...base, modelType, fields, children } as AssembledBranch)
                break
            }
            case 'container': {
                const children = extractChildren(rule)
                const separator = rule.type === 'repeat' ? rule.separator : undefined
                nodes.set(kind, { ...base, modelType, children, separator } as AssembledContainer)
                break
            }
            case 'polymorph': {
                const forms = extractForms(rule, kind)
                nodes.set(kind, { ...base, modelType, forms } as AssembledPolymorph)
                break
            }
            case 'leaf': {
                const pattern = rule.type === 'pattern' ? rule.value : undefined
                nodes.set(kind, { ...base, modelType, pattern } as AssembledLeaf)
                break
            }
            case 'keyword': {
                const text = rule.type === 'string' ? rule.value : ''
                nodes.set(kind, { ...base, modelType, text } as AssembledKeyword)
                break
            }
            case 'token': {
                nodes.set(kind, { ...base, modelType, factoryName: undefined, irKey: undefined } as AssembledToken)
                break
            }
            case 'enum': {
                const values = rule.type === 'enum' ? rule.values : []
                nodes.set(kind, { ...base, modelType, values, factoryName: undefined, irKey: undefined } as AssembledEnum)
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
                nodes.set(kind, { ...base, modelType, subtypes, factoryName: undefined, irKey: undefined } as AssembledSupertype)
                break
            }
            case 'group': {
                const fields = rule.type === 'group' ? extractFields(rule.content) : extractFields(rule)
                nodes.set(kind, { ...base, modelType, fields, factoryName: undefined, irKey: undefined } as AssembledGroup)
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

        const isAlphanumeric = /^\w+$/.test(value)
        const { typeName } = nameNode(value)

        if (isAlphanumeric) {
            // Keyword token (e.g., "if", "class", "pub")
            nodes.set(value, {
                kind: value,
                typeName,
                factoryName: undefined,
                irKey: undefined,
                modelType: 'keyword',
                text: value,
            } as AssembledKeyword)
        } else {
            // Operator/punctuation token (e.g., "+", "->", "{")
            nodes.set(value, {
                kind: value,
                typeName,
                factoryName: undefined,
                irKey: undefined,
                modelType: 'token',
            } as AssembledToken)
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
export function classifyNode(kind: string, rule: Rule): ModelType {
    // Already-classified types pass through (from Link)
    if (rule.type === 'enum') return 'enum'
    if (rule.type === 'supertype') return 'supertype'
    if (rule.type === 'group') return 'group'

    // Choice with variants: branch if same field set, else polymorph
    if (rule.type === 'choice' && rule.members.some(m => m.type === 'variant')) {
        if (allVariantsHaveSameFieldSet(rule)) return 'branch'
        return 'polymorph'
    }

    const simplified = simplifyRule(rule)

    switch (simplified.type) {
        case 'seq': {
            const hasFields = simplified.members.some(m => m.type === 'field')
            if (hasFields) return 'branch'
            return 'token'
        }
        case 'repeat':
            return 'container'
        case 'choice': {
            if (simplified.members.every(m => m.type === 'string')) return 'enum'
            return 'polymorph'
        }
        case 'pattern':
            return 'leaf'
        case 'string': {
            if (/^\w+$/.test(simplified.value)) return 'keyword'
            return 'token'
        }
        case 'field':
            return 'branch'
        case 'optional':
            return classifyNode(kind, simplified.content)
        default:
            return 'token'
    }
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

export function extractFields(rule: Rule, isOptional = false, isRepeated = false): AssembledField[] {
    switch (rule.type) {
        case 'field': {
            const contentTypes = deriveContentTypes(rule.content)
            const { propertyName, paramName } = nameField(rule.name)
            return [{
                name: rule.name,
                propertyName,
                paramName,
                required: !isOptional,
                multiple: isRepeated,
                contentTypes,
                source: rule.source ?? 'grammar',
                projection: { typeName: '', kinds: contentTypes },
            }]
        }
        case 'seq':
            return rule.members.flatMap(m => extractFields(m, isOptional, isRepeated))
        case 'optional':
            return extractFields(rule.content, true, isRepeated)
        case 'repeat':
            return extractFields(rule.content, isOptional, true)
        case 'choice':
            return rule.members.flatMap(m => extractFields(m, isOptional, isRepeated))
        case 'clause':
            return extractFields(rule.content, true, isRepeated)
        case 'variant':
            return extractFields(rule.content, isOptional, isRepeated)
        case 'group':
            return extractFields(rule.content, isOptional, isRepeated)
        default:
            return []
    }
}

// ---------------------------------------------------------------------------
// extractChildren — collect non-field named children
// ---------------------------------------------------------------------------

export function extractChildren(rule: Rule): AssembledChild[] {
    // For now, children are symbols not wrapped in fields
    const children: AssembledChild[] = []
    walkForChildren(rule, children, false, false)
    return children
}

function walkForChildren(rule: Rule, out: AssembledChild[], isOptional: boolean, isRepeated: boolean): void {
    switch (rule.type) {
        case 'symbol':
            if (!rule.hidden) {
                const { propertyName } = nameField(rule.name)
                out.push({
                    name: rule.name,
                    propertyName,
                    required: !isOptional,
                    multiple: isRepeated,
                    contentTypes: [rule.name],
                })
            }
            break
        case 'seq':
            for (const m of rule.members) walkForChildren(m, out, isOptional, isRepeated)
            break
        case 'optional':
            walkForChildren(rule.content, out, true, isRepeated)
            break
        case 'repeat':
            walkForChildren(rule.content, out, isOptional, true)
            break
        case 'choice':
            for (const m of rule.members) walkForChildren(m, out, isOptional, isRepeated)
            break
        case 'field':
            // Fields are handled by extractFields, not children
            break
        case 'variant':
            walkForChildren(rule.content, out, isOptional, isRepeated)
            break
        case 'clause':
            walkForChildren(rule.content, out, true, isRepeated)
            break
    }
}

// ---------------------------------------------------------------------------
// extractForms — for polymorphs, each choice branch as a form
// ---------------------------------------------------------------------------

function extractForms(rule: Rule, kind: string): AssembledForm[] {
    if (rule.type !== 'choice') return []

    const forms: AssembledForm[] = rule.members.map((member, i) => {
        const content = member.type === 'variant' ? member : member
        const name = member.type === 'variant' ? member.name : `form_${i}`
        const { typeName, factoryName } = nameNode(`${kind}_${name}`)
        const fields = extractFields(content)
        const children = extractChildren(content)

        return {
            name,
            typeName,
            factoryName,
            fields,
            children: children.length > 0 ? children : undefined,
        }
    })

    return collapseForms(forms)
}

// ---------------------------------------------------------------------------
// collapseForms — merge same-field-set forms without detect tokens
// ---------------------------------------------------------------------------

function collapseForms(forms: AssembledForm[]): AssembledForm[] {
    // For now, return as-is — full collapse logic comes in refinement
    return forms
}

// ---------------------------------------------------------------------------
// deriveContentTypes — walk field content, collect kind names
// ---------------------------------------------------------------------------

function deriveContentTypes(rule: Rule): string[] {
    switch (rule.type) {
        case 'symbol':
            return [rule.name]
        case 'choice':
            return rule.members.flatMap(m => deriveContentTypes(m))
        case 'enum':
            return rule.values
        case 'supertype':
            return rule.subtypes
        case 'field':
            return deriveContentTypes(rule.content)
        case 'variant':
            return deriveContentTypes(rule.content)
        case 'optional':
            return deriveContentTypes(rule.content)
        default:
            return []
    }
}

// ---------------------------------------------------------------------------
// Naming
// ---------------------------------------------------------------------------

export function nameNode(kind: string): { typeName: string; factoryName: string; irKey: string } {
    const typeName = kind
        .replace(/^_/, '')
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('')
    const factoryName = typeName.charAt(0).toLowerCase() + typeName.slice(1)
    const irKey = factoryName
    return { typeName, factoryName, irKey }
}

export function nameField(fieldName: string): { propertyName: string; paramName: string } {
    const propertyName = fieldName.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    return { propertyName, paramName: propertyName }
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
