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
                const subtypes = rule.type === 'supertype' ? rule.subtypes : []
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

    return {
        name: optimized.name,
        nodes,
        signatures: computeSignatures(nodes),
        projections: buildProjections(nodes),
    }
}

// ---------------------------------------------------------------------------
// classifyNode — structural simplification + visibility
// ---------------------------------------------------------------------------

type ModelType = AssembledNode['modelType']

export function classifyNode(kind: string, rule: Rule): ModelType {
    // Already-classified types pass through
    if (rule.type === 'enum') return 'enum'
    if (rule.type === 'supertype') return 'supertype'
    if (rule.type === 'group') return 'group'

    // Check for variant presence BEFORE simplifying — variants mean polymorph
    if (rule.type === 'choice' && rule.members.some(m => m.type === 'variant')) {
        return kind.startsWith('_') ? 'supertype' : 'polymorph'
    }

    const simplified = simplifyRule(rule)
    const hidden = kind.startsWith('_')

    switch (simplified.type) {
        case 'seq': {
            const hasFields = simplified.members.some(m => m.type === 'field')
            if (hasFields) return hidden ? 'group' : 'branch'
            // seq with no fields after simplification → token (pure punctuation)
            return hidden ? 'token' : 'token'
        }
        case 'repeat':
            return hidden ? 'container' : 'container'
        case 'choice': {
            const allStrings = simplified.members.every(m => m.type === 'string')
            if (allStrings) return 'enum'
            return hidden ? 'supertype' : 'polymorph'
        }
        case 'pattern':
            return hidden ? 'leaf' : 'leaf'
        case 'string': {
            const isAlphanumeric = /^\w+$/.test(simplified.value)
            if (isAlphanumeric) return hidden ? 'keyword' : 'keyword'
            return 'token'
        }
        case 'field':
            // Single field → branch (the field wraps content)
            return hidden ? 'group' : 'branch'
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
