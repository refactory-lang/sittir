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

export interface AssembledNodeBase {
    readonly kind: string
    readonly typeName: string
    readonly factoryName?: string
    readonly irKey?: string
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

// --- Discriminated union of model types ---

export interface AssembledBranch extends AssembledNodeBase {
    readonly modelType: 'branch'
    readonly fields: AssembledField[]
    readonly children?: AssembledChild[]
}

export interface AssembledContainer extends AssembledNodeBase {
    readonly modelType: 'container'
    readonly children: AssembledChild[]
    readonly separator?: string
}

export interface AssembledPolymorph extends AssembledNodeBase {
    readonly modelType: 'polymorph'
    readonly forms: AssembledForm[]
}

export interface AssembledLeaf extends AssembledNodeBase {
    readonly modelType: 'leaf'
    readonly pattern?: string
}

export interface AssembledKeyword extends AssembledNodeBase {
    readonly modelType: 'keyword'
    readonly text: string
}

export interface AssembledToken extends AssembledNodeBase {
    readonly modelType: 'token'
}

export interface AssembledEnum extends AssembledNodeBase {
    readonly modelType: 'enum'
    readonly values: string[]
}

export interface AssembledSupertype extends AssembledNodeBase {
    readonly modelType: 'supertype'
    readonly subtypes: string[]
}

export interface AssembledGroup extends AssembledNodeBase {
    readonly modelType: 'group'
    readonly fields: AssembledField[]
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
