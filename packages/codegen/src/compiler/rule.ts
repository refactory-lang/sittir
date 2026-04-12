/**
 * compiler/rule.ts — Shared IR
 *
 * One type throughout the pipeline. Defined once, never extended.
 * Rule type presence varies by phase:
 *   - After Evaluate: symbol, alias, token, repeat1 present
 *   - After Link: symbol, alias, token, repeat1 gone; clause, group, indent/dedent/newline added
 *   - After Optimize: variant added; structural grouping may be restructured
 *
 * @generated — do not add derived metadata (required, multiple, contentTypes, etc.)
 *              Those are derived from tree context at Assemble time.
 */

// ---------------------------------------------------------------------------
// Rule — the shared intermediate representation
// ---------------------------------------------------------------------------

export type Rule =
    // Structural grouping — Optimize restructures these
    | SeqRule
    | OptionalRule
    | ChoiceRule
    | RepeatRule
    | Repeat1Rule

    // Named patterns — clean wrappers, no derived metadata
    | FieldRule
    | VariantRule
    | ClauseRule
    | EnumRule
    | SupertypeRule
    | GroupRule

    // Terminals
    | StringRule
    | PatternRule

    // Structural whitespace
    | IndentRule
    | DedentRule
    | NewlineRule

    // References — Link resolves these; absent after Link
    | SymbolRule
    | AliasRule
    | TokenRule

// ---------------------------------------------------------------------------
// Structural grouping
// ---------------------------------------------------------------------------

export interface SeqRule {
    readonly type: 'seq'
    readonly members: Rule[]
}

export interface OptionalRule {
    readonly type: 'optional'
    readonly content: Rule
}

export interface ChoiceRule {
    readonly type: 'choice'
    readonly members: Rule[]
}

export interface RepeatRule {
    readonly type: 'repeat'
    readonly content: Rule
    readonly separator?: string
    readonly trailing?: boolean
}

export interface Repeat1Rule {
    readonly type: 'repeat1'
    readonly content: Rule
    readonly separator?: string
}

// ---------------------------------------------------------------------------
// Named patterns
// ---------------------------------------------------------------------------

export interface FieldRule {
    readonly type: 'field'
    readonly name: string
    readonly content: Rule
    readonly source?: 'grammar' | 'override' | 'inlined' | 'inferred'
    readonly nameFrom?: 'grammar' | 'kind' | 'override' | 'usage'
}

export interface VariantRule {
    readonly type: 'variant'
    readonly name: string
    readonly content: Rule
}

export interface ClauseRule {
    readonly type: 'clause'
    readonly name: string
    readonly content: Rule
}

export interface EnumRule {
    readonly type: 'enum'
    readonly values: string[]
    readonly source?: 'grammar' | 'promoted'
}

export interface SupertypeRule {
    readonly type: 'supertype'
    readonly name: string
    readonly subtypes: string[]
    readonly source?: 'grammar' | 'promoted'
}

export interface GroupRule {
    readonly type: 'group'
    readonly name: string
    readonly content: Rule
}

// ---------------------------------------------------------------------------
// Terminals
// ---------------------------------------------------------------------------

export interface StringRule {
    readonly type: 'string'
    readonly value: string
}

export interface PatternRule {
    readonly type: 'pattern'
    readonly value: string
}

// ---------------------------------------------------------------------------
// Structural whitespace
// ---------------------------------------------------------------------------

export interface IndentRule {
    readonly type: 'indent'
}

export interface DedentRule {
    readonly type: 'dedent'
}

export interface NewlineRule {
    readonly type: 'newline'
}

// ---------------------------------------------------------------------------
// References — resolved by Link; absent after Link
// ---------------------------------------------------------------------------

export interface SymbolRule {
    readonly type: 'symbol'
    readonly name: string
    readonly hidden?: boolean
    readonly supertype?: boolean
}

export interface AliasRule {
    readonly type: 'alias'
    readonly content: Rule
    readonly named: boolean
    readonly value: string
}

export interface TokenRule {
    readonly type: 'token'
    readonly content: Rule
    readonly immediate: boolean
}

// ---------------------------------------------------------------------------
// Reference graph
// ---------------------------------------------------------------------------

export interface SymbolRef {
    from: string
    to: string
    fieldName?: string
    optional?: boolean
    repeated?: boolean
    position?: number       // Link adds: index within parent's SEQ
}

// ---------------------------------------------------------------------------
// Grammar-level contracts
// ---------------------------------------------------------------------------

export interface RawGrammar {
    readonly name: string
    readonly rules: Record<string, Rule>
    readonly extras: string[]
    readonly externals: string[]
    readonly supertypes: string[]
    readonly inline: string[]
    readonly conflicts: string[][]
    readonly word: string | null
    readonly references: SymbolRef[]
}

export type ExternalRole = { role: 'indent' | 'dedent' | 'newline' }

export interface SuggestedOverride {
    readonly kind: string
    readonly path: (string | number)[]
    readonly rule: Rule
    readonly derivation: string
    readonly confidence: 'high' | 'medium' | 'low'
}

export interface LinkedGrammar {
    readonly name: string
    readonly rules: Record<string, Rule>
    readonly supertypes: Set<string>
    readonly externalRoles: Map<string, ExternalRole>
    readonly word: string | null
    readonly references: SymbolRef[]
    readonly suggestedOverrides?: SuggestedOverride[]
}

export interface OptimizedGrammar {
    readonly name: string
    readonly rules: Record<string, Rule>
    readonly supertypes: Set<string>
    readonly word: string | null
}

// ---------------------------------------------------------------------------
// Assembled node types (produced by Assemble — Phase 4)
// ---------------------------------------------------------------------------

export interface KindProjection {
    readonly typeName: string
    readonly kinds: string[]
}

// ---------------------------------------------------------------------------
// Derivation helpers — walk a Rule to produce fields, children, content types
// ---------------------------------------------------------------------------

function snakeToCamel(name: string): string {
    return name.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

// TypeScript reserved words that must be avoided as parameter names.
const TS_RESERVED = new Set([
    'arguments', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
    'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof',
    'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try',
    'typeof', 'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'implements',
    'interface', 'package', 'private', 'protected', 'public',
])

function safeParamName(name: string): string {
    return TS_RESERVED.has(name) ? `${name}_` : name
}

export function deriveFields(rule: Rule, isOptional = false, isRepeated = false): AssembledField[] {
    const raw = deriveFieldsRaw(rule, isOptional, isRepeated)
    // Deduplicate by field name. If the same name appears multiple times
    // (e.g. once as single, once as repeat), merge into a multiple/optional
    // field with the union of content types.
    const byName = new Map<string, AssembledField>()
    for (const f of raw) {
        const existing = byName.get(f.name)
        if (!existing) {
            byName.set(f.name, { ...f })
            continue
        }
        const merged: AssembledField = {
            ...existing,
            required: existing.required && f.required,
            multiple: existing.multiple || f.multiple,
            contentTypes: Array.from(new Set([...existing.contentTypes, ...f.contentTypes])),
            projection: {
                ...existing.projection,
                kinds: Array.from(new Set([...existing.projection.kinds, ...f.projection.kinds])),
            },
        }
        byName.set(f.name, merged)
    }
    return Array.from(byName.values())
}

function deriveFieldsRaw(rule: Rule, isOptional: boolean, isRepeated: boolean): AssembledField[] {
    switch (rule.type) {
        case 'field': {
            const contentTypes = deriveContentTypes(rule.content)
            const propertyName = snakeToCamel(rule.name)
            return [{
                name: rule.name,
                propertyName,
                paramName: safeParamName(propertyName),
                required: !isOptional,
                multiple: isRepeated,
                contentTypes,
                source: rule.source ?? 'grammar',
                projection: { typeName: '', kinds: contentTypes },
            }]
        }
        case 'seq':
            return rule.members.flatMap(m => deriveFieldsRaw(m, isOptional, isRepeated))
        case 'optional':
            return deriveFieldsRaw(rule.content, true, isRepeated)
        case 'repeat':
            return deriveFieldsRaw(rule.content, isOptional, true)
        case 'choice':
            return rule.members.flatMap(m => deriveFieldsRaw(m, isOptional, isRepeated))
        case 'clause':
            return deriveFieldsRaw(rule.content, true, isRepeated)
        case 'variant':
            return deriveFieldsRaw(rule.content, isOptional, isRepeated)
        case 'group':
            return deriveFieldsRaw(rule.content, isOptional, isRepeated)
        default:
            return []
    }
}

export function deriveChildren(rule: Rule): AssembledChild[] {
    const raw: AssembledChild[] = []
    walkForChildren(rule, raw, false, false)
    // Deduplicate by child name; merge single+multiple into multiple.
    const byName = new Map<string, AssembledChild>()
    for (const c of raw) {
        const existing = byName.get(c.name)
        if (!existing) {
            byName.set(c.name, { ...c })
            continue
        }
        byName.set(c.name, {
            ...existing,
            required: existing.required && c.required,
            multiple: existing.multiple || c.multiple,
            contentTypes: Array.from(new Set([...existing.contentTypes, ...c.contentTypes])),
        })
    }
    return Array.from(byName.values())
}

function walkForChildren(rule: Rule, out: AssembledChild[], isOptional: boolean, isRepeated: boolean): void {
    switch (rule.type) {
        case 'symbol':
            // Both visible and hidden symbols contribute to the runtime child
            // set: hidden symbols (supertypes) dispatch to their concrete
            // subtypes at parse time, so tree-sitter surfaces those children
            // under the parent. The child slot name we emit reflects the
            // symbol we referenced (stripped of any leading underscore so
            // `_expression` → `expression`).
            {
                const cleanName = rule.name.replace(/^_+/, '') || rule.name
                out.push({
                    name: cleanName,
                    propertyName: snakeToCamel(cleanName),
                    required: !isOptional,
                    multiple: isRepeated,
                    contentTypes: [rule.name],
                })
            }
            break
        case 'supertype':
            // Resolved supertype reference — dispatches to any subtype at
            // runtime. Emit one slot with the supertype's name.
            out.push({
                name: rule.name.replace(/^_+/, '') || rule.name,
                propertyName: snakeToCamel(rule.name.replace(/^_+/, '') || rule.name),
                required: !isOptional,
                multiple: isRepeated,
                contentTypes: rule.subtypes,
            })
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
            // Fields are handled by deriveFields, not children
            break
        case 'variant':
            walkForChildren(rule.content, out, isOptional, isRepeated)
            break
        case 'clause':
            walkForChildren(rule.content, out, true, isRepeated)
            break
    }
}

function deriveContentTypes(rule: Rule): string[] {
    switch (rule.type) {
        case 'symbol': return [rule.name]
        case 'choice': return rule.members.flatMap(m => deriveContentTypes(m))
        case 'enum': return rule.values
        case 'supertype': return rule.subtypes
        case 'field': return deriveContentTypes(rule.content)
        case 'variant': return deriveContentTypes(rule.content)
        case 'optional': return deriveContentTypes(rule.content)
        default: return []
    }
}

// ---------------------------------------------------------------------------
// Assembled node types — class hierarchy
//
// Abstract base + concrete subclasses per model type.
// Shape matches the previous interfaces exactly; methods/getters will be added
// as we collapse logic into the classes.
// ---------------------------------------------------------------------------

export abstract class AssembledNodeBase {
    readonly kind: string
    readonly typeName: string
    readonly factoryName?: string
    readonly irKey?: string
    abstract readonly modelType: string

    constructor(init: { kind: string; typeName: string; factoryName?: string; irKey?: string }) {
        this.kind = init.kind
        this.typeName = init.typeName
        this.factoryName = init.factoryName
        this.irKey = init.irKey
    }

    /** A node is hidden when it has no factory (supertype, group, token). */
    get hidden(): boolean {
        return this.factoryName === undefined
    }
}

export interface AssembledField {
    readonly name: string
    readonly propertyName: string
    readonly paramName: string
    readonly required: boolean
    readonly multiple: boolean
    readonly contentTypes: string[]
    readonly source: 'grammar' | 'override' | 'inlined' | 'inferred'
    readonly projection: KindProjection
}

export interface AssembledChild {
    readonly name: string
    readonly propertyName: string
    readonly required: boolean
    readonly multiple: boolean
    readonly contentTypes: string[]
}

/**
 * @deprecated AssembledForm is replaced by AssembledGroup.
 * A polymorph's forms are now hidden groups synthesized from the choice branches.
 * This type alias is kept temporarily for backwards-compat with adapters/emitters.
 */
export type AssembledForm = AssembledGroup

// --- Concrete classes per model type ---

export class AssembledBranch extends AssembledNodeBase {
    readonly modelType = 'branch' as const
    readonly rule: Rule

    // Cached derivations — lazy, computed on first access
    #fields?: AssembledField[]
    #children?: AssembledChild[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        rule: Rule
    }) {
        super(init)
        this.rule = init.rule
    }

    get fields(): AssembledField[] {
        return this.#fields ??= deriveFields(this.rule)
    }

    get children(): AssembledChild[] | undefined {
        return this.#children ??= deriveChildren(this.rule)
    }
}

export class AssembledContainer extends AssembledNodeBase {
    readonly modelType = 'container' as const
    readonly rule: Rule

    #children?: AssembledChild[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        rule: Rule
    }) {
        super(init)
        this.rule = init.rule
    }

    get children(): AssembledChild[] {
        return this.#children ??= deriveChildren(this.rule)
    }

    get separator(): string | undefined {
        // Separator is captured on the repeat rule by Evaluate
        return this.rule.type === 'repeat' ? this.rule.separator : undefined
    }
}

export class AssembledPolymorph extends AssembledNodeBase {
    readonly modelType = 'polymorph' as const
    readonly #forms: AssembledGroup[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        forms: AssembledGroup[]
    }) {
        super(init)
        this.#forms = init.forms
    }

    /** A polymorph's forms are hidden groups synthesized from the choice branches. */
    get forms(): AssembledGroup[] { return this.#forms }
}

export class AssembledLeaf extends AssembledNodeBase {
    readonly modelType = 'leaf' as const
    readonly #pattern?: string

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        pattern?: string
    }) {
        super(init)
        this.#pattern = init.pattern
    }

    get pattern(): string | undefined { return this.#pattern }
}

export class AssembledKeyword extends AssembledNodeBase {
    readonly modelType = 'keyword' as const
    readonly #text: string

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        text: string
    }) {
        super(init)
        this.#text = init.text
    }

    get text(): string { return this.#text }
}

export class AssembledToken extends AssembledNodeBase {
    readonly modelType = 'token' as const

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
    }) {
        super(init)
    }
}

export class AssembledEnum extends AssembledNodeBase {
    readonly modelType = 'enum' as const
    readonly #values: string[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        values: string[]
    }) {
        super(init)
        this.#values = init.values
    }

    get values(): string[] { return this.#values }
}

export class AssembledSupertype extends AssembledNodeBase {
    readonly modelType = 'supertype' as const
    readonly #subtypes: string[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        subtypes: string[]
    }) {
        super(init)
        this.#subtypes = init.subtypes
    }

    get subtypes(): string[] { return this.#subtypes }
}

export class AssembledGroup extends AssembledNodeBase {
    readonly modelType = 'group' as const
    readonly rule: Rule
    readonly detectToken?: string
    /** Short label (e.g., variant name like 'pub' or 'tuple'). Defaults to kind. */
    readonly name: string

    #fields?: AssembledField[]
    #children?: AssembledChild[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        rule: Rule
        detectToken?: string
        name?: string
    }) {
        super(init)
        this.rule = init.rule
        this.detectToken = init.detectToken
        this.name = init.name ?? init.kind
    }

    get fields(): AssembledField[] {
        return this.#fields ??= deriveFields(this.rule)
    }

    get children(): AssembledChild[] {
        return this.#children ??= deriveChildren(this.rule)
    }
}

export type AssembledNode =
    | AssembledBranch
    | AssembledContainer
    | AssembledPolymorph
    | AssembledLeaf
    | AssembledKeyword
    | AssembledToken
    | AssembledEnum
    | AssembledSupertype
    | AssembledGroup

// ---------------------------------------------------------------------------
// NodeMap — output of Assemble (Phase 4)
// ---------------------------------------------------------------------------

export interface SignaturePool {
    readonly signatures: Map<string, string>
}

export interface ProjectionContext {
    readonly projections: Map<string, KindProjection>
}

export interface NodeMap {
    readonly name: string
    readonly nodes: Map<string, AssembledNode>
    readonly signatures: SignaturePool
    readonly projections: ProjectionContext
}
