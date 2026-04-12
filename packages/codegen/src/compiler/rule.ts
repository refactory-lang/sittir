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

export interface AssembledForm {
    readonly name: string
    readonly typeName: string
    readonly factoryName: string
    readonly detectToken?: string
    readonly fields: AssembledField[]
    readonly children?: AssembledChild[]
    readonly mergedRules?: Rule[]
}

// --- Concrete classes per model type ---

export class AssembledBranch extends AssembledNodeBase {
    readonly modelType = 'branch' as const
    readonly fields: AssembledField[]
    readonly children?: AssembledChild[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        fields: AssembledField[]; children?: AssembledChild[]
    }) {
        super(init)
        this.fields = init.fields
        this.children = init.children
    }
}

export class AssembledContainer extends AssembledNodeBase {
    readonly modelType = 'container' as const
    readonly children: AssembledChild[]
    readonly separator?: string

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        children: AssembledChild[]; separator?: string
    }) {
        super(init)
        this.children = init.children
        this.separator = init.separator
    }
}

export class AssembledPolymorph extends AssembledNodeBase {
    readonly modelType = 'polymorph' as const
    readonly forms: AssembledForm[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        forms: AssembledForm[]
    }) {
        super(init)
        this.forms = init.forms
    }
}

export class AssembledLeaf extends AssembledNodeBase {
    readonly modelType = 'leaf' as const
    readonly pattern?: string

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        pattern?: string
    }) {
        super(init)
        this.pattern = init.pattern
    }
}

export class AssembledKeyword extends AssembledNodeBase {
    readonly modelType = 'keyword' as const
    readonly text: string

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        text: string
    }) {
        super(init)
        this.text = init.text
    }
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
    readonly values: string[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        values: string[]
    }) {
        super(init)
        this.values = init.values
    }
}

export class AssembledSupertype extends AssembledNodeBase {
    readonly modelType = 'supertype' as const
    readonly subtypes: string[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        subtypes: string[]
    }) {
        super(init)
        this.subtypes = init.subtypes
    }
}

export class AssembledGroup extends AssembledNodeBase {
    readonly modelType = 'group' as const
    readonly fields: AssembledField[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        fields: AssembledField[]
    }) {
        super(init)
        this.fields = init.fields
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
