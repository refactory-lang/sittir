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
    | TerminalRule
    | PolymorphRule

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
    /**
     * True if the field's value is rendered as an indented block — its
     * content resolves (through symbol refs) to a subtree containing an
     * `indent` Rule node. The template walker prefixes `\n  ` to the
     * field slot so `class X:$BODY` renders as `class X:\n  $BODY`.
     * Set by Link's `annotateBlockBearerFields` pass.
     */
    readonly blockBearer?: boolean
    /**
     * Internal marker used by Evaluate's `transform()` DSL: a `field()`
     * call with no content is a placeholder patch that takes its content
     * from the original rule at patch-resolve time. Never survives past
     * `resolvePatch` — if this shows up anywhere else, it's a bug.
     */
    readonly _needsContent?: boolean
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

/**
 * Rule-level provenance vocabulary.
 *
 *   'grammar'  — the user wrote this classification explicitly in grammar.js
 *                (e.g. `supertypes: [$._expression]` or a literal enum rule).
 *   'override' — an overrides.ts patch produced this rule.
 *   'promoted' — Link derived this classification from rule shape (hidden
 *                choice-of-strings → enum, hidden choice-of-symbols →
 *                supertype, field-free symbol-free subtree → terminal,
 *                heterogeneous-field choice → polymorph).
 *
 * Suggestion check is uniform across all rule-level sources:
 *    isSuggestion = source !== 'grammar' && source !== 'override'
 */
export type RuleSource = 'grammar' | 'promoted' | 'override'

export interface EnumRule {
    readonly type: 'enum'
    readonly values: string[]
    readonly source?: RuleSource
}

export interface SupertypeRule {
    readonly type: 'supertype'
    readonly name: string
    readonly subtypes: string[]
    readonly source?: RuleSource
}

export interface GroupRule {
    readonly type: 'group'
    readonly name: string
    readonly content: Rule
}

/**
 * TerminalRule — composed text-only terminal.
 *
 * A rule whose subtree contains no fields and no symbol references
 * (neither visible nor hidden). Examples: `integer`, `escape_sequence`,
 * `line_comment`, `regex_pattern`, `import_prefix`. Tree-sitter exposes
 * instances of these kinds as text-only nodes, so `render()` can return
 * `node.text` directly without ever consulting templates.
 *
 * Added by Link (see `promoteTerminals`). Not present after Evaluate.
 * Assemble routes this to `modelType: 'leaf'` without inspecting content.
 */
export interface TerminalRule {
    readonly type: 'terminal'
    readonly content: Rule
    /** Always 'promoted' today — Link synthesises terminals from shape. */
    readonly source?: RuleSource
}

/**
 * PolymorphRule — choice-of-variants with heterogeneous field sets.
 *
 * A structural dispatch: multiple named variants, each with its own
 * field shape. Added by Optimize when it detects that a variant-bearing
 * choice has variants with different field sets (the homogeneous case
 * is a branch, not a polymorph). Assemble routes this directly to
 * `modelType: 'polymorph'` and builds one form per variant — no
 * simplifyRule or content guessing.
 */
export interface PolymorphRule {
    readonly type: 'polymorph'
    /** Ordered list of forms (one per variant, in declaration order). */
    readonly forms: Array<{ readonly name: string; readonly content: Rule }>
    /** Always 'promoted' today — Link synthesises polymorphs from shape. */
    readonly source?: RuleSource
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

	refType: 'symbol' | 'alias' | 'token'
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

/**
 * Suggested override entry — emitted by the suggested.ts emitter from
 * fields whose `source` is `'inferred'` or `'inlined'`, and from rules
 * whose `source` is `'promoted'`. The classification work happens in
 * Link; this type is just the wire shape the emitter consumes.
 */
export interface SuggestedOverride {
    /** The parent kind that needs the override applied. */
    readonly kind: string
    /**
     * Position within the parent rule the override would target. Empty
     * array when the suggestion applies at the symbol level (e.g.
     * global-optionality, naming-consistency diagnostics) rather than
     * at a specific position.
     */
    readonly path: (string | number)[]
    /** The rule fragment the override would emit (typically a `field()` wrapper). */
    readonly rule: Rule
    /** Human-readable derivation tag — `field-name-inference: 6/6 ...`. */
    readonly derivation: string
    /** Confidence based on agreement ratio. */
    readonly confidence: 'high' | 'medium' | 'low'
}

/**
 * DerivationLog — sidecar record of everything Link inferred / promoted.
 *
 * Populated unconditionally by Link's derivation passes. The emitter for
 * `overrides.suggested.ts` (T042f) reads this to surface every finding
 * as a reviewable suggestion, regardless of whether Link actually
 * applied the mutation to the rule tree.
 *
 * Whether a derivation is ALSO applied (mutating the rule tree) is
 * governed by `GenerateConfigV2.include` — excluded sources still
 * appear in the log but don't land in the generated packages.
 */
export interface DerivationLog {
    /** Field-name inferences: parent wants a bare symbol wrapped in field(). */
    readonly inferredFields: InferredFieldEntry[]
    /** Rule-level promotions: enum, supertype, terminal, polymorph classifications. */
    readonly promotedRules: PromotedRuleEntry[]
    /**
     * Repeated-shape candidates — sets of kinds that appear as field
     * content unions in ≥2 distinct parent rules. Suggested as either
     * a grammar-level supertype (choice-of-symbols) or a shared group
     * so the grammar author can collapse the repetition with a single
     * named rule. Non-mutating — these are suggestions only.
     */
    readonly repeatedShapes: RepeatedShapeEntry[]
}

export interface InferredFieldEntry {
    /** The parent rule kind that contains the bare reference. */
    readonly kind: string
    /** Name of the field to wrap the reference in. */
    readonly fieldName: string
    /** Symbol being wrapped (the `to` in `field('name', $.to)`). */
    readonly targetSymbol: string
    /** Confidence tier based on cross-parent agreement ratio. */
    readonly confidence: 'high' | 'medium' | 'low'
    /** Numeric agreement — e.g. 10/10 → 1.0, 6/7 → ~0.857. */
    readonly agreement: number
    /** Total named refs that the inference was measured against. */
    readonly sampleSize: number
    /** True if Link mutated the rule tree; false if held back by `include`. */
    readonly applied: boolean
}

export interface RepeatedShapeEntry {
    /** Suggested name for the shared supertype/group (readable stub). */
    readonly suggestedName: string
    /** The kind set — sorted, canonicalized. */
    readonly kinds: readonly string[]
    /** Parent rules whose fields carry this exact kind set. */
    readonly parents: readonly string[]
    /** Suggested shape: 'supertype' for choice-of-named, 'group' for heterogeneous. */
    readonly shape: 'supertype' | 'group'
}

export interface PromotedRuleEntry {
    /** Kind whose rule was classified via promotion. */
    readonly kind: string
    /** What it was promoted to. */
    readonly classification: 'enum' | 'supertype' | 'terminal' | 'polymorph'
    /** True if Link kept the promotion; false if held back by `include`. */
    readonly applied: boolean
}

export interface LinkedGrammar {
    readonly name: string
    readonly rules: Record<string, Rule>
    readonly supertypes: Set<string>
    readonly externalRoles: Map<string, ExternalRole>
    readonly word: string | null
    readonly references: SymbolRef[]
    readonly derivations: DerivationLog
}

/**
 * Derived source tags that can be toggled via GenerateConfigV2.include.
 * `grammar` and `override` are always-on — user-authored content cannot
 * be filtered out.
 */
export type DerivedRuleSource = 'promoted'
export type DerivedFieldSource = 'inferred' | 'inlined'

export interface IncludeFilter {
    /** Derived rule classifications to KEEP. Defaults to all. */
    readonly rules?: readonly DerivedRuleSource[]
    /** Derived field provenances to KEEP. Defaults to all. */
    readonly fields?: readonly DerivedFieldSource[]
}

export interface OptimizedGrammar {
    readonly name: string
    readonly rules: Record<string, Rule>
    readonly supertypes: Set<string>
    readonly word: string | null
    readonly derivations: DerivationLog
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

/**
 * Cheap existence predicate: does this rule's tree contain any field()?
 * Used by pre-assembly phases (classifier, optimizer) that only need to
 * know IF fields exist — not the full list. Shorter-circuits than
 * deriveFields.
 */
export function hasAnyField(rule: Rule): boolean {
    switch (rule.type) {
        case 'field':
            return true
        case 'seq':
        case 'choice':
            return rule.members.some(hasAnyField)
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group':
            return hasAnyField(rule.content)
        default:
            return false
    }
}

/**
 * Cheap existence predicate: does this rule's tree contain any symbol
 * reference (visible OR hidden)? Hidden symbols dispatch to concrete
 * subtypes at parse time, so they DO contribute children.
 */
export function hasAnyChild(rule: Rule): boolean {
    switch (rule.type) {
        case 'symbol':
        case 'supertype':
            return true
        case 'seq':
        case 'choice':
            return rule.members.some(hasAnyChild)
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group':
            return hasAnyChild(rule.content)
        default:
            return false
    }
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
            literalValues: (existing.literalValues || f.literalValues)
                ? Array.from(new Set([...(existing.literalValues ?? []), ...(f.literalValues ?? [])]))
                : undefined,
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
            // Dedupe at the field boundary — inner walks via `flatMap`
            // over seq/choice members can legitimately produce duplicate
            // kind names when multiple variants reference the same
            // target (macro_definition's `rules: $$$MACRO_RULE` repeats
            // macro_rule across 6 variants; supertype expansions can
            // overlap with concrete sibling kinds).
            const contentTypes = [...new Set(deriveContentTypes(rule.content))]
            const literalValues = deriveLiteralValues(rule.content)
            const propertyName = snakeToCamel(rule.name)
            // A field wrapping a repeat/optional carries that shape on
            // itself — `field('statements', repeat($._statement))` means
            // one field named `statements` whose value is many statements.
            const innerShape = fieldInnerShape(rule.content)
            return [{
                name: rule.name,
                propertyName,
                paramName: safeParamName(propertyName),
                required: !isOptional && !innerShape.optional,
                multiple: isRepeated || innerShape.repeated,
                contentTypes,
                literalValues: literalValues.length > 0 ? literalValues : undefined,
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
        // Enum values are `text` contents, not distinct node kinds. A
        // field whose content is an inline enum should type as a
        // string-literal union (see deriveLiteralValues) — the parser
        // emits a single node whose `text` happens to match one of the
        // enum values, never a node whose `type` is `"u8"`, `"usize"`.
        case 'enum': return []
        case 'supertype': return rule.subtypes
        case 'field': return deriveContentTypes(rule.content)
        case 'variant': return deriveContentTypes(rule.content)
        case 'optional': return deriveContentTypes(rule.content)
        case 'repeat': return deriveContentTypes(rule.content)
        case 'seq': return rule.members.flatMap(m => deriveContentTypes(m))
        case 'clause': return deriveContentTypes(rule.content)
        case 'group': return deriveContentTypes(rule.content)
        default: return []
    }
}

/**
 * Collect inline-enum string values from a field's content. Returns
 * `[]` if the content is anything other than a pure choice-of-strings
 * (or an already-classified EnumRule). Used by types-v2 to emit
 * string-literal unions instead of a fallback `string` type.
 */
/**
 * Inspect a field's inner content to infer optional/repeated flags.
 * Needed because overrides can wrap a `repeat(...)` or `optional(...)`
 * directly in a field — the outer `deriveFieldsRaw` walker only sees
 * the field wrapper and doesn't know its body's shape.
 */
function fieldInnerShape(rule: Rule): { optional: boolean; repeated: boolean } {
    switch (rule.type) {
        case 'repeat': return { optional: false, repeated: true }
        case 'optional': {
            const inner = fieldInnerShape(rule.content)
            return { optional: true, repeated: inner.repeated }
        }
        default: return { optional: false, repeated: false }
    }
}

/**
 * Extract anonymous-string literals flanking the main content of a field
 * rule. The override pattern `field('first', seq(_expression, ','))`
 * from rust tuple_expression embeds a trailing comma inside the field;
 * without lifting it, the walker's slot emission `$FIRST` loses the
 * comma entirely. By extracting `leading: '', trailing: ','` here, the
 * walker can emit `$FIRST,` and preserve the override author's intent.
 *
 * Only single anonymous strings at the start/end of a `seq` are lifted;
 * complex flanking content stays inside the field's value at runtime.
 */
function extractFlankingLiterals(content: Rule): { leading: string; trailing: string } {
    if (content.type !== 'seq' || content.members.length < 2) {
        return { leading: '', trailing: '' }
    }
    let leading = ''
    let trailing = ''
    const first = content.members[0]
    const last = content.members[content.members.length - 1]
    // A leading literal is only valid if there's at least one non-literal
    // member after it; same logic for trailing. We don't lift a literal
    // out of a single-member seq.
    if (first?.type === 'string' && content.members.length >= 2) {
        leading = first.value
    }
    if (last?.type === 'string' && content.members.length >= 2 && last !== first) {
        trailing = last.value
    }
    return { leading, trailing }
}

/**
 * If a field's content is (or transitively wraps) a `repeat` rule, return
 * its separator. Defaults to `\n` for repeats that have no explicit
 * separator — `field('items', repeat(symbol))` patterns in tree-sitter
 * grammars are almost always statement-like lists where each element
 * lives on its own line (struct attributes, try.except_clauses, etc.).
 *
 * Returns `null` when the content does not wrap a repeat at all.
 */
function wrappedRepeatSeparator(content: Rule): string | null {
    switch (content.type) {
        case 'repeat':
        case 'repeat1':
            return content.separator ?? '\n'
        case 'optional':
        case 'group':
        case 'variant':
        case 'clause':
            return wrappedRepeatSeparator(content.content)
        default:
            return null
    }
}

function deriveLiteralValues(rule: Rule): string[] {
    switch (rule.type) {
        case 'enum': return rule.values
        case 'string': return [rule.value]
        case 'choice': {
            const parts: string[] = []
            for (const m of rule.members) {
                const inner = m.type === 'variant' ? m.content : m
                if (inner.type === 'string') parts.push(inner.value)
                else return []  // not a pure string-choice — bail
            }
            return parts
        }
        case 'field': return deriveLiteralValues(rule.content)
        case 'variant': return deriveLiteralValues(rule.content)
        case 'optional': return deriveLiteralValues(rule.content)
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

/**
 * JS reserved words that a raw factory function name collides with —
 * those get a trailing underscore so the emitted code parses.
 */
const JS_RESERVED_FACTORY_NAMES = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
    'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
    'false', 'finally', 'for', 'function', 'if', 'import', 'in',
    'instanceof', 'let', 'new', 'null', 'return', 'static', 'super',
    'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
    'while', 'with', 'yield', 'async', 'await', 'arguments',
])

export abstract class AssembledNodeBase {
    readonly kind: string
    // typeName / factoryName are writable so assemble()'s post-pass
    // (resolveCollidingNames) can rename hidden kinds that clashed with
    // a visible sibling — same pattern as `irKey`.
    typeName: string
    factoryName?: string
    /**
     * Short key for the ir namespace (`ir.x`). Populated by assemble()
     * via resolveIrKeys() AFTER every node is constructed so that the
     * collision-resolution pass sees the whole NodeMap at once. Emitters
     * should read this rather than recomputing their own shortening.
     *
     * Writable (not readonly) so assemble's post-pass can install the
     * resolved key — the rest of the pipeline should treat it as
     * effectively immutable.
     */
    irKey?: string
    /**
     * Rule-level provenance. Mirrors the `source` field on the
     * underlying Rule (EnumRule, SupertypeRule, TerminalRule,
     * PolymorphRule). Undefined for branches/containers/groups, which
     * don't have a rule-level classification. The suggested.ts emitter
     * surfaces nodes whose source is `'promoted'` as rule-level
     * override candidates.
     */
    readonly source?: RuleSource
    abstract readonly modelType: string

    constructor(init: { kind: string; typeName: string; factoryName?: string; irKey?: string; source?: RuleSource }) {
        this.kind = init.kind
        this.typeName = init.typeName
        this.factoryName = init.factoryName
        this.irKey = init.irKey
        this.source = init.source
    }

    /** A node is hidden when it has no factory (supertype, group, token). */
    get hidden(): boolean {
        return this.factoryName === undefined
    }

    /**
     * Factory function name to emit in factories.ts — factoryName with a
     * trailing `_` when the bare name collides with a JS reserved word.
     * Returns `undefined` for hidden nodes.
     */
    get rawFactoryName(): string | undefined {
        if (this.factoryName === undefined) return undefined
        return JS_RESERVED_FACTORY_NAMES.has(this.factoryName)
            ? `${this.factoryName}_`
            : this.factoryName
    }

    /** Tree interface name: `${typeName}Tree`. */
    get treeTypeName(): string {
        return `${this.typeName}Tree`
    }

    /** Config type alias: `${typeName}Config`. */
    get configTypeName(): string {
        return `${this.typeName}Config`
    }

    /** FromInput type alias: `${typeName}FromInput`. */
    get fromInputTypeName(): string {
        return `${this.typeName}FromInput`
    }

    /** `from()` resolver function name: `${factoryName}From` for non-hidden nodes. */
    get fromFunctionName(): string | undefined {
        if (this.factoryName === undefined) return undefined
        return `${this.factoryName}From`
    }

    /**
     * Emit the templates.yaml entry for this node. Returns `undefined`
     * for nodes that don't need a template (leaves/keywords/enums/tokens
     * render via `.text` directly; supertypes dispatch through their
     * concrete subtype). Structural subclasses (AssembledBranch,
     * AssembledContainer, AssembledGroup, AssembledPolymorph) override
     * this to walk their rule tree and produce the right shape.
     */
    renderTemplate(_rules?: Record<string, Rule>): Record<string, unknown> | undefined {
        return undefined
    }
}

export interface AssembledField {
    readonly name: string
    readonly propertyName: string
    readonly paramName: string
    readonly required: boolean
    readonly multiple: boolean
    readonly contentTypes: string[]
    /**
     * Literal values when the field's content is an inline enum
     * (choice-of-strings). Empty for normal fields. When populated,
     * types-v2 emits the field as a string-literal union instead of
     * a kind-reference union.
     */
    readonly literalValues?: readonly string[]
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

    renderTemplate(rules?: Record<string, Rule>): Record<string, unknown> {
        const { template, clauses, joinByField } = renderRuleTemplate(this.rule, false, rules)
        if (!template) {
            throw new Error(
                `AssembledBranch.renderTemplate: '${this.kind}' produced an empty template. ` +
                `Rule has no visible content — should have been classified as leaf/token.`,
            )
        }
        const entry: Record<string, unknown> = { template, ...clauses }
        const sep = findRepeatSeparator(this.rule)
        if (sep) entry.joinBy = sep
        if (Object.keys(joinByField).length > 0) entry.joinByField = joinByField
        return entry
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

    renderTemplate(rules?: Record<string, Rule>): Record<string, unknown> {
        const { template, clauses, joinByField } = renderRuleTemplate(this.rule, false, rules)
        if (!template) {
            throw new Error(
                `AssembledContainer.renderTemplate: '${this.kind}' produced an empty template. ` +
                `Rule has no visible content — should have been classified as leaf/token.`,
            )
        }
        const entry: Record<string, unknown> = { template, ...clauses }
        const sep = this.separator ?? findRepeatSeparator(this.rule)
        if (sep) entry.joinBy = sep
        if (Object.keys(joinByField).length > 0) entry.joinByField = joinByField
        return entry
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

    renderTemplate(rules?: Record<string, Rule>): Record<string, unknown> {
        if (this.#forms.length === 0) {
            throw new Error(
                `AssembledPolymorph.renderTemplate: '${this.kind}' has zero synthesised forms. ` +
                `Classifier bug — rule should have been classified as branch/container/leaf.`,
            )
        }
        // Variants as a record, detect as a sibling record, per-form
        // clauses merged into the outer rule object (the renderer looks
        // them up there regardless of which variant is active).
        const variants: Record<string, string> = {}
        const detect: Record<string, string> = {}
        const mergedClauses: Record<string, string> = {}
        for (const form of this.#forms) {
            const { template, clauses } = renderRuleTemplate(form.rule, false, rules)
            if (!template) {
                throw new Error(
                    `AssembledPolymorph.renderTemplate: '${this.kind}' form '${form.name}' ` +
                    `produced an empty template.`,
                )
            }
            variants[form.name] = template
            if (form.detectToken) detect[form.name] = form.detectToken
            Object.assign(mergedClauses, clauses)
        }
        const entry: Record<string, unknown> = { variants, ...mergedClauses }
        if (Object.keys(detect).length > 0) entry.detect = detect
        return entry
    }

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
    // No emitFactory — tokens are hidden, no factoryName.
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
    /**
     * When this group is a polymorph form, the parent polymorph's kind —
     * what tree-sitter actually produces for this node. Form factories
     * must emit `type: parentKind` so the runtime NodeData matches the
     * tree-sitter kind, not the synthesized form kind. Undefined for
     * standalone groups (inlined hidden seqs).
     */
    readonly parentKind?: string

    #fields?: AssembledField[]
    #children?: AssembledChild[]

    constructor(init: {
        kind: string; typeName: string; factoryName?: string; irKey?: string
        rule: Rule
        detectToken?: string
        name?: string
        parentKind?: string
    }) {
        super(init)
        this.rule = init.rule
        this.detectToken = init.detectToken
        this.name = init.name ?? init.kind
        this.parentKind = init.parentKind
    }

    get fields(): AssembledField[] {
        return this.#fields ??= deriveFields(this.rule)
    }

    get children(): AssembledChild[] {
        return this.#children ??= deriveChildren(this.rule)
    }

    renderTemplate(rules?: Record<string, Rule>): Record<string, unknown> {
        const { template, clauses, joinByField } = renderRuleTemplate(this.rule, false, rules)
        if (!template) {
            throw new Error(
                `AssembledGroup.renderTemplate: '${this.kind}' produced an empty template. ` +
                `Rule has no visible content — should have been classified as leaf/token.`,
            )
        }
        const entry: Record<string, unknown> = { template, ...clauses }
        const sep = findRepeatSeparator(this.rule)
        if (sep) entry.joinBy = sep
        if (Object.keys(joinByField).length > 0) entry.joinByField = joinByField
        return entry
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
    /**
     * Sidecar log of every derivation Link produced. Emitters read
     * this to surface suggestions regardless of whether the mutation
     * was applied to the rule tree (governed by IncludeFilter).
     */
    readonly derivations: DerivationLog
    /**
     * Post-Optimize rule map — the template walker needs this so its
     * `symbol` case can inline hidden helper rules (e.g. python's
     * `_import_list`) directly into the emitted template. Without it
     * the walker falls back to `$$$CHILDREN` which is wrong for hidden
     * helpers whose fields get promoted onto the parent node.
     */
    readonly rules?: Record<string, Rule>
}

// ---------------------------------------------------------------------------
// Template walker — shared by AssembledBranch/Container/Group.renderTemplate
// ---------------------------------------------------------------------------
//
// Walks a Rule subtree producing a template string + any clause sub-
// templates. A ClauseRule becomes a `$NAME_CLAUSE` placeholder plus an
// entry in the `clauses` map — the renderer drops the whole clause at
// runtime when the referenced field is absent, handling constructs like
// python's `return_type_clause: -> $RETURN_TYPE`.

interface WalkResult {
    template: string
    clauses: Record<string, string>
    /**
     * Per-field-name separator captured from `field('x', repeat(y, separator=','))`
     * patterns. The template emitter merges these into the rule entry as
     * `joinByField: { x: ',' }` so the renderer can pick the right join
     * for each `$$$X` slot when a single rule has multiple multi-valued
     * fields with different separators (e.g. rust's tuple_expression has
     * `attributes` joined by newline and `rest` joined by comma).
     */
    joinByField: Record<string, string>
}

export function renderRuleTemplate(
    rule: Rule,
    inRepeat = false,
    rules?: Record<string, Rule>,
): WalkResult {
    const clauses: Record<string, string> = {}
    const joinByField: Record<string, string> = {}
    // Pre-compute field names that appear in any `repeat` subtree so
    // the walker can emit `$$$NAME` even for the *first* occurrence of a
    // repeated field — the commaSep1 pattern `seq(field(X), repeat(seq(',',
    // field(X))))` has X at non-repeat position first, then at repeat
    // position, but both should render as the same multi-valued slot.
    const repeatedFields = new Set<string>()
    collectRepeatedFields(rule, false, repeatedFields, rules, new Set())
    const parts = walkRuleForTemplate(rule, new Set(), inRepeat, clauses, rules, repeatedFields, joinByField)
    return { template: parts.join(''), clauses, joinByField }
}

function collectRepeatedFields(
    rule: Rule,
    inRepeat: boolean,
    out: Set<string>,
    rules: Record<string, Rule> | undefined,
    visiting: Set<string>,
): void {
    switch (rule.type) {
        case 'seq':
        case 'choice':
            for (const m of rule.members) collectRepeatedFields(m, inRepeat, out, rules, visiting)
            return
        case 'repeat':
        case 'repeat1':
            collectRepeatedFields(rule.content, true, out, rules, visiting)
            return
        case 'optional':
        case 'variant':
        case 'clause':
        case 'group':
        case 'token':
        case 'alias':
        case 'terminal':
            collectRepeatedFields((rule as { content: Rule }).content, inRepeat, out, rules, visiting)
            return
        case 'field':
            if (inRepeat) out.add(rule.name)
            collectRepeatedFields(rule.content, inRepeat, out, rules, visiting)
            return
        case 'symbol': {
            // Follow hidden symbols once — their content will be inlined
            // during template emission, so any repeated fields inside
            // must be counted at the caller site as well.
            const name = (rule as { name: string }).name
            if (!name.startsWith('_') || !rules || visiting.has(name)) return
            const target = rules[name]
            if (!target) return
            visiting.add(name)
            collectRepeatedFields(target, inRepeat, out, rules, visiting)
            visiting.delete(name)
            return
        }
        case 'polymorph':
            for (const form of rule.forms) {
                collectRepeatedFields(form.content, inRepeat, out, rules, visiting)
            }
            return
        default:
            return
    }
}

function walkRuleForTemplate(
    rule: Rule,
    seen: Set<string>,
    inRepeat: boolean,
    clauses: Record<string, string>,
    rules?: Record<string, Rule>,
    repeatedFields?: ReadonlySet<string>,
    joinByField?: Record<string, string>,
): string[] {
    switch (rule.type) {
        case 'seq': {
            const out: string[] = []
            for (const m of rule.members) {
                const parts = walkRuleForTemplate(m, seen, inRepeat, clauses, rules, repeatedFields, joinByField)
                if (out.length > 0 && parts.length > 0) {
                    const lastChar = out[out.length - 1]!.slice(-1)
                    const firstChar = parts[0]!.charAt(0)
                    if (needsSpace(lastChar, firstChar)) out.push(' ')
                }
                out.push(...parts)
            }
            return out
        }

        case 'choice':
            // For choice in a template, emit the first non-empty member.
            for (const m of rule.members) {
                const parts = walkRuleForTemplate(m, seen, inRepeat, clauses, rules, repeatedFields, joinByField)
                if (parts.length > 0) return parts
            }
            return []

        case 'optional':
            // `optional(',')` and friends — pure punctuation in an optional
            // wrapper is context-dependent and including it unconditionally
            // produces invalid output (python: `match X,:`). Skip the
            // whole optional when its content has no field/symbol ref.
            if (containsOnlyPunctuation(rule.content)) return []
            return walkRuleForTemplate(rule.content, seen, inRepeat, clauses, rules, repeatedFields, joinByField)

        case 'repeat':
        case 'repeat1':
            return walkRuleForTemplate(rule.content, seen, true, clauses, rules, repeatedFields)

        case 'field': {
            if (seen.has(rule.name)) return []
            seen.add(rule.name)
            const varName = rule.name.toUpperCase()
            // A field is multi-valued in three situations:
            //   1. it's nested inside a repeat (`inRepeat`)
            //   2. another occurrence of the same field name appears inside a
            //      repeat — the commaSep1 pattern `field(X) ... repeat(field(X))`
            //      where the first slot is non-repeat (caught by repeatedFields)
            //   3. its OWN content is a repeat — the override pattern
            //      `field('rest', repeat(expr, separator=','))` where the field
            //      sits at non-repeat position but wraps a repeat directly
            const wrappedSep = wrappedRepeatSeparator(rule.content)
            const multi = inRepeat
                || (repeatedFields?.has(rule.name) ?? false)
                || wrappedSep !== null
            // Capture per-slot joinBy when the wrapped repeat carries a
            // separator. A single rule with multiple multi-valued fields
            // can then have distinct separators (rust tuple_expression's
            // attributes joins with `\n`, rest with `,`).
            if (joinByField && wrappedSep) joinByField[rule.name] = wrappedSep
            const slot = multi ? `$$$${varName}` : `$${varName}`
            // Extract anonymous-string literals flanking the field's main
            // content. The override pattern `field('first', seq(_expression,
            // ','))` from rust's tuple_expression bundles the trailing comma
            // INSIDE the field; without this extraction the comma is lost
            // and the rendered output joins `$FIRST $$$REST` with no
            // separator. By emitting `$FIRST,` instead, the comma stays.
            const flank = extractFlankingLiterals(rule.content)
            // Block-bearer fields render as an indented block (python
            // `class X:\n  body`). Link annotates the field when its
            // content resolves to a subtree containing an `indent` node.
            // Trailing newline restores the outer column so whatever
            // follows the block (e.g. `else_clause`) lands flush-left.
            const wrapped: string[] = []
            if (flank.leading) wrapped.push(flank.leading)
            wrapped.push(slot)
            if (flank.trailing) wrapped.push(flank.trailing)
            return rule.blockBearer ? ['\n  ', ...wrapped, '\n'] : wrapped
        }

        case 'symbol': {
            // Hidden helper rules (e.g. python's `_import_list`) are
            // inlined by tree-sitter at parse time — their fields get
            // promoted onto the parent node. To render correctly we
            // mirror that by walking into the referenced rule's body
            // right here, so the hidden helper's fields appear as real
            // slots in the caller's template. Guards against recursion
            // via the rule-name seen-set key.
            const symName = (rule as { name: string }).name
            if (symName.startsWith('_') && rules) {
                const target = rules[symName]
                if (target && !seen.has(`@${symName}`)) {
                    seen.add(`@${symName}`)
                    const parts = walkRuleForTemplate(target, seen, inRepeat, clauses, rules, repeatedFields, joinByField)
                    if (parts.length > 0) return parts
                }
            }
            // Visible symbols (and hidden ones we can't expand) render
            // as unconsumed named children.
            if (seen.has('children')) return []
            seen.add('children')
            return ['$$$CHILDREN']
        }

        case 'string':
            if (inRepeat) return [] // joinBy handles separators
            return [rule.value]

        case 'pattern': {
            // Extract a representative literal from the regex — delimiter
            // tokens like `[bc]?"` (rust string_literal prefix) need their
            // literal tail in the template so round-trip reparse works.
            const lit = representativeLiteral(rule.value)
            return lit ? [lit] : []
        }

        case 'enum':
            return rule.values.length > 0 ? [rule.values[0]!] : []

        case 'variant':
            return walkRuleForTemplate(rule.content, seen, inRepeat, clauses, rules, repeatedFields, joinByField)

        case 'clause': {
            // Emit a separate sub-template and reference it from the main
            // template as `$NAME_CLAUSE`. Fresh seen set for clause body
            // so fields don't collide with main-template tracking.
            if (seen.has(rule.name)) return []
            seen.add(rule.name)
            const clauseSeen = new Set<string>()
            const clauseParts = walkRuleForTemplate(rule.content, clauseSeen, inRepeat, clauses, rules, repeatedFields, joinByField)
            const clauseTemplate = clauseParts.join('')
            if (clauseTemplate) clauses[rule.name] = clauseTemplate
            return [`$${rule.name.toUpperCase()}_CLAUSE`]
        }

        case 'group':
            return walkRuleForTemplate(rule.content, seen, inRepeat, clauses, rules, repeatedFields, joinByField)

        case 'supertype':
            if (seen.has('children')) return []
            seen.add('children')
            return ['$$$CHILDREN']

        case 'indent':
            return ['\n  ']
        case 'dedent':
            return ['\n']
        case 'newline':
            return ['\n']

        case 'terminal':
            return walkRuleForTemplate(rule.content, seen, inRepeat, clauses, rules, repeatedFields, joinByField)

        case 'polymorph':
            // Polymorphs are dispatched by AssembledPolymorph.renderTemplate
            // which walks each form separately. Reaching this case means a
            // PolymorphRule appears nested inside another rule's body, which
            // the classifier is supposed to prevent — treat as a bug rather
            // than silently emitting nothing.
            throw new Error(
                `walkRuleForTemplate: nested PolymorphRule should have been promoted by Link. ` +
                `forms=${rule.forms.map(f => f.name).join(',')}`,
            )

        default:
            return []
    }
}

/**
 * True if `rule` contains only string/pattern/whitespace terminals —
 * no fields, no symbols, no enum/supertype refs. Drives the
 * `optional(...)` skip heuristic in the template walker.
 */
function containsOnlyPunctuation(rule: Rule): boolean {
    switch (rule.type) {
        case 'string':
        case 'pattern':
        case 'indent':
        case 'dedent':
        case 'newline':
            return true
        case 'field':
        case 'symbol':
        case 'supertype':
        case 'enum':
            return false
        case 'seq':
        case 'choice':
            return rule.members.every(containsOnlyPunctuation)
        case 'optional':
        case 'repeat':
        case 'repeat1':
        case 'variant':
        case 'clause':
        case 'group':
            return containsOnlyPunctuation(rule.content)
        default:
            return false
    }
}

/**
 * Extract a representative literal from a regex pattern. Strips
 * character classes, quantifiers, escapes, and alternations; returns
 * whatever literal characters remain. Best-effort — grammar authors
 * with unusual tokens can add an override to supply a template.
 *
 *   `[bc]?"`   → `"`    (rust string_literal prefix+quote)
 *   `r"#*"`    → `r"`   (raw string marker — quantifier drops)
 *   `/\\d+/`    → ``     (pure regex content, no literal tail)
 *   `0[xX]`    → `0`    (literal head, class tail)
 */
function representativeLiteral(regex: string): string {
    let s = regex
    s = s.replace(/\\(.)/g, (_, c) => (/[dwWsSbBnrtfv0]/.test(c) ? '' : c))
    s = s.replace(/\[[^\]]*\][*+?]?/g, '')
    s = s.replace(/\([^)]*\)[*+?]?/g, '')
    s = s.replace(/\{\d+(,\d*)?\}/g, '')
    s = s.replace(/[.*+?|^$]/g, '')
    return s
}

/**
 * Walk a rule tree looking for the first repeat-with-separator. Used by
 * structural nodes to propagate tree-sitter's `sepBy` / `repSeq`
 * separator hints onto their joinBy slot so `$$$CHILDREN` renders
 * with the right glue.
 */
export function findRepeatSeparator(rule: Rule): string | undefined {
    switch (rule.type) {
        case 'repeat':
            if (rule.separator) return rule.separator
            return findRepeatSeparator(rule.content)
        case 'seq':
        case 'choice':
            for (const m of rule.members) {
                const sep = findRepeatSeparator(m)
                if (sep) return sep
            }
            return undefined
        case 'optional':
        case 'variant':
        case 'clause':
        case 'group':
        case 'field':
            return findRepeatSeparator(rule.content)
        default:
            return undefined
    }
}

const TEMPLATE_WORD = /\w/

/**
 * Should we insert a space separator between two adjacent template
 * fragments? Placeholders (`$FOO`, `$$$CHILDREN`) are treated as
 * word-like on the `$`-starting side — they WILL render to user
 * content at runtime and the common case is word content. Without a
 * space we'd merge two tokens (`mod english` → `modenglish`).
 */
function needsSpace(prev: string, next: string): boolean {
    if (!prev || !next) return false
    const prevIsWordLike = TEMPLATE_WORD.test(prev)
    const nextIsWordLike = TEMPLATE_WORD.test(next) || next === '$'
    return prevIsWordLike && nextIsWordLike
}
