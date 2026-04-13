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

export interface LinkedGrammar {
    readonly name: string
    readonly rules: Record<string, Rule>
    readonly supertypes: Set<string>
    readonly externalRoles: Map<string, ExternalRole>
    readonly word: string | null
    readonly references: SymbolRef[]
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
    readonly typeName: string
    readonly factoryName?: string
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
    renderTemplate(): Record<string, unknown> | undefined {
        return undefined
    }

    /**
     * Emit the factory export for this node as a TS source snippet.
     * Returns `undefined` for hidden nodes (token/supertype/group-with-
     * no-factoryName) — they don't produce a factory binding. Concrete
     * subclasses override with their own emission.
     */
    emitFactory(): string | undefined {
        return undefined
    }

    /**
     * Emit the `from()` resolver export for this node. Takes the full
     * NodeMap because branch/form resolvers need to look up field-
     * content types (leaves vs branches) to decide whether a string
     * input should be wrapped in a leaf factory call. Returns
     * `undefined` for nodes that don't produce a from() binding.
     */
    emitFromFunction(_nodeMap: NodeMap): string | undefined {
        return undefined
    }

    /**
     * Emit the `wrap${TypeName}(data, tree)` read-only view function
     * for this node. Mirrors the factory's field set but with lazy
     * `drillIn`/`drillInAll` getters instead of fluent accessors.
     * No setters, no render/toEdit/replace — wrap is strictly a
     * read-only lazy projection of parsed NodeData.
     *
     * Returns `undefined` for non-structural nodes (leaves, keywords,
     * enums, tokens, supertypes) — those are pass-through in the
     * `_wrapTable` dispatcher.
     */
    emitWrap(_nodeMap: NodeMap): string | undefined {
        return undefined
    }
}

/** Escape a string literal value for embedding in single-quoted TS source. */
function escForSource(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

/**
 * Common suffix every user-addressable factory returns — render(),
 * toEdit(...), replace(target). Takes the tree type name so each
 * subclass can parameterize its `replace` target.
 */
function factorySuffix(treeTypeName: string): string[] {
    return [
        `    render() { return render(this); },`,
        `    toEdit(startOrRange: number | { start: { index: number }; end: { index: number } }, endPos?: number) {`,
        `      if (typeof startOrRange === 'number') return toEdit(this, startOrRange, endPos!);`,
        `      return toEdit(this, startOrRange);`,
        `    },`,
        `    replace(target: ${treeTypeName}) { const r = target.range(); return toEdit(this, r); },`,
    ]
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

    renderTemplate(): Record<string, unknown> {
        const { template, clauses } = renderRuleTemplate(this.rule)
        if (!template) {
            throw new Error(
                `AssembledBranch.renderTemplate: '${this.kind}' produced an empty template. ` +
                `Rule has no visible content — should have been classified as leaf/token.`,
            )
        }
        const entry: Record<string, unknown> = { template, ...clauses }
        const sep = findRepeatSeparator(this.rule)
        if (sep) entry.joinBy = sep
        return entry
    }

    emitFactory(): string | undefined {
        if (!this.rawFactoryName) return undefined
        return emitFieldCarryingFactory(this, this.fields)
    }

    emitFromFunction(nodeMap: NodeMap): string | undefined {
        if (!this.rawFactoryName) return undefined
        const fn = this.fromFunctionName!
        const factory = this.rawFactoryName
        const fields = this.fields
        const opt = fields.some(f => f.required) ? '' : '?'
        const lines: string[] = []
        lines.push(`export function ${fn}(input${opt}: ${this.fromInputTypeName}) {`)
        if (fields.length > 0) {
            // Normalize loose input vs NodeData passthrough into a single
            // `f` view at the top of the function. Per-field accesses
            // become `f.X` instead of repeating the dual-shape cast on
            // every field site.
            lines.push('  const f = ((input as any)?.fields ?? input ?? {}) as Record<string, any>;')
            lines.push(`  return ${factory}({`)
            for (const f of fields) {
                lines.push(`    ${f.propertyName}: ${resolveFieldFromView(f, nodeMap)},`)
            }
            lines.push(`    children: ((input as any)?.children ?? []) as any,`)
            lines.push('  } as any);')
        } else {
            lines.push(`  return ${factory}(input as any);`)
        }
        lines.push('}')
        return lines.join('\n')
    }

    emitWrap(_nodeMap: NodeMap): string | undefined {
        if (!this.rawFactoryName) return undefined
        return emitFieldCarryingWrap(this, this.fields, this.children ?? [])
    }
}

/**
 * Shared body for AssembledBranch, AssembledGroup, and polymorph forms —
 * nodes that carry fields + children and produce a fluent-API factory.
 */
function emitFieldCarryingFactory(
    node: AssembledNodeBase & { kind: string; typeName: string; fields: AssembledField[]; children?: AssembledChild[] | readonly AssembledChild[]; parentKind?: string },
    fields: AssembledField[],
): string {
    const fn = node.rawFactoryName!
    const hasFields = fields.length > 0
    const opt = fields.some(f => f.required) ? '' : '?'
    // Polymorph forms emit their parent's kind as the NodeData type so the
    // runtime value matches what tree-sitter produces. Non-form nodes
    // (branches, standalone groups) use their own kind.
    const typeKind = node.parentKind ?? node.kind
    const lines: string[] = []
    lines.push(`export function ${fn}(config${opt}: ConfigOf<${node.typeName}>) {`)

    if (hasFields) {
        lines.push('  const fields = {')
        for (const f of fields) {
            // ConfigOf<T> exposes camelCase keys for every field; access
            // them directly. The optional chain handles the `config?` arg
            // shape (optional when no fields are required).
            lines.push(`    ${f.name}: config?.${f.propertyName},`)
        }
        lines.push('  };')
    }
    // Always thread children — tree-sitter surfaces supertype-dispatched
    // children that the rule doesn't reference explicitly. ConfigOf<T>
    // includes a `children` slot via ChildSlotsOf<T>.
    lines.push('  const children = (config as any)?.children ?? [];')

    lines.push('  return {')
    lines.push(`    type: '${typeKind}' as const,`)
    lines.push('    named: true as const,')
    if (hasFields) lines.push('    fields,')
    lines.push('    children,')

    // Fluent field getters/setters. Param name must not shadow the
    // outer factory function — suffix when needed.
    for (const f of fields) {
        const method = f.propertyName === 'type' ? 'typeField' : f.propertyName
        let param = f.paramName
        if (param === fn || param === method) param = `${param}_`
        if (f.multiple) {
            lines.push(`    ${method}(...${param}: any[]) { return ${param}.length ? ${fn}({ ...(config as any), ${f.propertyName}: ${param} } as any) : fields.${f.name}; },`)
        } else {
            lines.push(`    ${method}(${param}?: any) { return ${param} !== undefined ? ${fn}({ ...(config as any), ${f.propertyName}: ${param} } as any) : fields.${f.name}; },`)
        }
    }

    lines.push('    getChildren() { return children; },')
    lines.push(`    setChildren(...items: any[]) { return ${fn}({ ...(config as any), children: items } as any); },`)
    lines.push(...factorySuffix(node.treeTypeName))
    lines.push('  };')
    lines.push('}')
    return lines.join('\n')
}

/**
 * Shared body for the `wrap${TypeName}(data, tree)` read-only view
 * function. Mirrors `emitFieldCarryingFactory` but with lazy drillIn
 * getters instead of fluent getter/setter methods, and no
 * render/toEdit/replace suffix. Used by AssembledBranch, AssembledGroup
 * (polymorph forms are emitted inline by the parent polymorph),
 * AssembledContainer, and AssembledPolymorph.
 */
function emitFieldCarryingWrap(
    node: AssembledNodeBase & { kind: string; typeName: string },
    fields: readonly AssembledField[],
    children: readonly AssembledChild[],
): string {
    const fn = `wrap${node.typeName}`
    const lines: string[] = []
    lines.push(`export function ${fn}(data: AnyNodeData, tree: TreeHandle) {`)
    lines.push('  return {')
    lines.push('    ...data,')

    for (const f of fields) {
        // Avoid shadowing built-in property names on the returned view.
        const method = f.propertyName === 'type' ? 'typeField' : f.propertyName
        if (f.multiple) {
            lines.push(`    get ${method}() { return drillInAll(data.fields?.['${f.name}'], tree); },`)
        } else {
            lines.push(`    get ${method}() { return drillIn(data.fields?.['${f.name}'], tree); },`)
        }
    }

    // Children slot — always project through drillIn so nested subtrees
    // hydrate lazily. A node with a default children array always exposes
    // `children`; specialised single-child containers expose `child`.
    if (children.length > 0) {
        const anyMultiple = children.some(c => c.multiple)
        if (anyMultiple) {
            lines.push(`    get children() { return (data.children ?? []).map((c: any) => drillIn(c, tree)); },`)
        } else {
            lines.push(`    get child() { return drillIn(data.children?.[0], tree); },`)
        }
    } else {
        // Even nodes without a declared child slot may receive
        // supertype-dispatched children from tree-sitter. Expose them
        // anyway so callers can walk the full tree.
        lines.push(`    get children() { return (data.children ?? []).map((c: any) => drillIn(c, tree)); },`)
    }

    lines.push('  };')
    lines.push('}')
    return lines.join('\n')
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

    renderTemplate(): Record<string, unknown> {
        const { template, clauses } = renderRuleTemplate(this.rule)
        if (!template) {
            throw new Error(
                `AssembledContainer.renderTemplate: '${this.kind}' produced an empty template. ` +
                `Rule has no visible content — should have been classified as leaf/token.`,
            )
        }
        const entry: Record<string, unknown> = { template, ...clauses }
        const sep = this.separator ?? findRepeatSeparator(this.rule)
        if (sep) entry.joinBy = sep
        return entry
    }

    emitFactory(): string | undefined {
        if (!this.rawFactoryName) return undefined
        const fn = this.rawFactoryName
        const child = this.children[0]
        const lines: string[] = []
        if (child?.multiple) {
            lines.push(`export function ${fn}(..._children: any[]) {`)
            // Filter out non-NodeData args (empty objects, undefined).
            lines.push('  const children = _children.filter((c: any) => c && typeof c === "object" && "type" in c);')
        } else {
            lines.push(`export function ${fn}(child?: any) {`)
            // Treat an empty/non-NodeData arg as "no child" so validator
            // paths passing `{}` don't wrap a typeless object as a child.
            lines.push('  const hasChild = child && typeof child === "object" && "type" in child;')
            lines.push('  const children = hasChild ? [child] : [];')
        }
        lines.push('  return {')
        lines.push(`    type: '${this.kind}' as const,`)
        lines.push('    named: true as const,')
        lines.push('    children,')
        lines.push(...factorySuffix(this.treeTypeName))
        lines.push('  };')
        lines.push('}')
        return lines.join('\n')
    }

    emitFromFunction(_nodeMap: NodeMap): string | undefined {
        if (!this.rawFactoryName) return undefined
        const fn = this.fromFunctionName!
        const factory = this.rawFactoryName
        return [
            `export function ${fn}(...input: any[]) {`,
            `  if (input.length === 1 && isNodeData(input[0])) {`,
            `    const nd = input[0] as any;`,
            `    return ${factory}(...(nd.children ?? []));`,
            `  }`,
            `  return ${factory}(...(input as any[]));`,
            '}',
        ].join('\n')
    }

    emitWrap(_nodeMap: NodeMap): string | undefined {
        if (!this.rawFactoryName) return undefined
        // Containers carry no fields — just the children slot.
        return emitFieldCarryingWrap(this, [], this.children)
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

    renderTemplate(): Record<string, unknown> {
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
            const { template, clauses } = renderRuleTemplate(form.rule)
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

    emitFactory(): string | undefined {
        if (!this.rawFactoryName) return undefined
        const fn = this.rawFactoryName
        const forms = this.#forms

        if (forms.length === 0) {
            // Empty polymorph stub — shouldn't happen after the classifier
            // fix but keep a defensive path so the file still compiles.
            return `export function ${fn}(config?: any) { return { type: '${this.kind}' as const, named: true as const, render() { return render(this); }, toEdit(s: any, e?: any) { return typeof s === 'number' ? toEdit(this, s, e!) : toEdit(this, s); }, replace(t: ${this.treeTypeName}) { const r = t.range(); return toEdit(this, r); } }; }`
        }

        const lines: string[] = []
        lines.push(`export function ${fn}(config?: ConfigOf<${this.typeName}>) {`)

        // Dispatch to per-form factory based on the presence of a
        // distinguishing field. The fallback is the form with the
        // smallest field set (handles shared-shape variants gracefully).
        if (forms.length > 1) {
            const sorted = [...forms].sort((a, b) => b.fields.length - a.fields.length)
            const fallback = sorted[sorted.length - 1]!
            for (const form of sorted) {
                if (form === fallback) continue
                const distinguishing = form.fields.find(f =>
                    !fallback.fields.some(ff => ff.name === f.name)
                )
                if (distinguishing) {
                    lines.push(`  if (config && '${distinguishing.propertyName}' in config) return ${form.rawFactoryName!}(config as any);`)
                }
            }
            lines.push(`  return ${fallback.rawFactoryName!}(config as any);`)
        } else {
            lines.push(`  return ${forms[0]!.rawFactoryName!}(config as any);`)
        }
        lines.push('}')

        // Emit each form factory inline after the dispatcher so they
        // appear in a single file section per polymorph.
        const parts = [lines.join('\n')]
        for (const form of forms) parts.push(form.emitFactory()!)
        return parts.join('\n')
    }

    emitWrap(_nodeMap: NodeMap): string | undefined {
        if (!this.rawFactoryName) return undefined
        // Polymorph wraps under the parent kind — union every form's
        // fields so the lazy view exposes any field that might be
        // populated at runtime. First-occurrence wins on duplicate
        // field names (forms with the same field name share semantics).
        const allFields = new Map<string, AssembledField>()
        for (const form of this.#forms) {
            for (const f of form.fields) {
                if (!allFields.has(f.name)) allFields.set(f.name, f)
            }
        }
        // Children: union across forms; if any form has a multiple
        // children slot, expose `children` (mapped via drillIn).
        const allChildren: AssembledChild[] = []
        for (const form of this.#forms) {
            for (const c of form.children) {
                if (!allChildren.some(existing => existing.name === c.name)) {
                    allChildren.push(c)
                }
            }
        }
        return emitFieldCarryingWrap(this, [...allFields.values()], allChildren)
    }

    emitFromFunction(nodeMap: NodeMap): string | undefined {
        if (!this.rawFactoryName) return undefined
        const fn = this.fromFunctionName!
        const factory = this.rawFactoryName
        const dispatcher = [
            `export function ${fn}(input?: ${this.fromInputTypeName}) {`,
            `  return ${factory}(input as any);`,
            '}',
        ].join('\n')
        const parts = [dispatcher]
        for (const form of this.#forms) {
            // Form-specific naming: lowercased form type name + 'From'.
            const formFn = `${form.typeName.charAt(0).toLowerCase()}${form.typeName.slice(1)}From`
            const formFactory = form.rawFactoryName!
            const fLines: string[] = []
            fLines.push(`export function ${formFn}(input?: any) {`)
            fLines.push(`  if (isNodeData(input)) return input;`)
            if (form.fields.length > 0) {
                fLines.push('  const f = ((input as any)?.fields ?? input ?? {}) as Record<string, any>;')
                fLines.push(`  return ${formFactory}({`)
                for (const f of form.fields) {
                    fLines.push(`    ${f.propertyName}: ${resolveFieldFromView(f, nodeMap)},`)
                }
                fLines.push('  });')
            } else {
                fLines.push(`  return ${formFactory}(input);`)
            }
            fLines.push('}')
            parts.push(fLines.join('\n'))
        }
        return parts.join('\n\n')
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

    emitFactory(): string | undefined {
        if (!this.rawFactoryName) return undefined
        return emitTextFactory(this, '(text: string)', 'text')
    }

    emitFromFunction(_nodeMap: NodeMap): string | undefined {
        if (!this.rawFactoryName) return undefined
        return emitStringLikeFrom(this)
    }
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

    emitFactory(): string | undefined {
        // Anonymous keywords collected from string literals in rules
        // have no factoryName and don't get a public factory binding.
        if (!this.rawFactoryName) return undefined
        // Keyword factories carry a fixed text literal; callers don't
        // pass an argument.
        return emitTextFactory(this, '()', `'${escForSource(this.#text)}'`)
    }

    emitFromFunction(_nodeMap: NodeMap): string | undefined {
        if (!this.rawFactoryName) return undefined
        const fn = this.fromFunctionName!
        const factory = this.rawFactoryName
        return [
            `export function ${fn}(input?: ${this.typeName}) {`,
            `  if (isNodeData(input)) return input;`,
            `  return ${factory}();`,
            '}',
        ].join('\n')
    }
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

    emitFactory(): string | undefined {
        if (!this.rawFactoryName) return undefined
        return emitTextFactory(this, '(text: string)', 'text')
    }

    emitFromFunction(_nodeMap: NodeMap): string | undefined {
        if (!this.rawFactoryName) return undefined
        return emitStringLikeFrom(this)
    }
}

/**
 * Shared body for the text-only factories — AssembledLeaf, AssembledKeyword,
 * AssembledEnum. Produces a fixed `{type, named, text, render, toEdit,
 * replace}` shape. The signature and the text expression vary per kind:
 * leaves/enums take a `text: string` arg; keywords bake in their text.
 */
function emitTextFactory(
    node: AssembledNodeBase & { kind: string },
    sig: string,
    textExpr: string,
): string {
    const fn = node.rawFactoryName!
    return [
        `export function ${fn}${sig} {`,
        '  return {',
        `    type: '${node.kind}' as const,`,
        '    named: true as const,',
        `    text: ${textExpr},`,
        `    render: () => ${textExpr},`,
        `    toEdit: (s: number | { start: { index: number }; end: { index: number } }, e?: number) => typeof s === 'number' ? { startPos: s, endPos: e!, insertedText: ${textExpr} } : { startPos: s.start.index, endPos: s.end.index, insertedText: ${textExpr} },`,
        `    replace: (t: ${node.treeTypeName}) => { const r = t.range(); return { startPos: r.start.index, endPos: r.end.index, insertedText: ${textExpr} }; },`,
        '  };',
        '}',
    ].join('\n')
}

/**
 * Shared body for leaf/enum `from()` — accept `string | NodeData`,
 * pass through NodeData unchanged, otherwise wrap the string via
 * the leaf factory.
 */
function emitStringLikeFrom(node: AssembledNodeBase): string {
    const fn = node.fromFunctionName!
    const factory = node.rawFactoryName!
    return [
        `export function ${fn}(input: string | ${node.typeName}) {`,
        `  if (isNodeData(input)) return input;`,
        `  return ${factory}(input as string);`,
        '}',
    ].join('\n')
}

/**
 * Resolve a factory field's value from loose `from()` input. Accepts
 * either top-level shape (`input.field_name`) or NodeData wrap shape
 * (`input.fields.field_name`). If the field is leaf-only, wrap bare
 * string inputs via the leaf factory.
 */
/**
 * Variant of `resolveField` that consumes a normalized `f` view
 * (built once at the top of the from function as
 * `((input as any).fields ?? input)`). Per-field accesses become
 * `f.X` instead of repeating the dual-shape cast at every site.
 *
 * Emits a call to one of the loose-input resolver helpers (defined
 * at the top of from.ts by `emitResolverHelpers`):
 *
 *   _resolveOne(f.field, [leafKinds], [branchKinds])     // single
 *   _resolveMany(f.field, [leafKinds], [branchKinds])    // multiple
 *
 * The helpers handle: NodeData passthrough, primitive coercion via
 * `_resolveScalar`, string→leaf via `_resolveLeafString`, kind-tagged
 * objects via `_resolveByKind`, and single-branch passthrough.
 */
function resolveFieldFromView(field: AssembledField, nodeMap: NodeMap): string {
    const prop = `f.${field.name}`
    const types = field.contentTypes

    // Classify content types into leaves vs branches.
    const leafKinds: string[] = []
    const branchKinds: string[] = []
    for (const t of types) {
        const n = nodeMap.nodes.get(t)
        if (!n) {
            // Unknown kind — treat as branch so it goes through _resolveByKind
            branchKinds.push(t)
            continue
        }
        switch (n.modelType) {
            case 'leaf':
            case 'enum':
            case 'keyword':
                leafKinds.push(t)
                break
            case 'token':
                // Anonymous tokens have no factory binding — skip.
                break
            case 'supertype':
            case 'branch':
            case 'container':
            case 'polymorph':
            case 'group':
                branchKinds.push(t)
                break
        }
    }

    const leafArr = JSON.stringify(leafKinds)
    const branchArr = JSON.stringify(branchKinds)
    const helper = field.multiple ? '_resolveMany' : '_resolveOne'
    // The helper returns `unknown` (single) or `unknown[]` (many);
    // widen with `as any` so the factory's typed Config slot accepts it.
    return `${helper}(${prop}, ${leafArr}, ${branchArr}) as any`
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

    renderTemplate(): Record<string, unknown> {
        const { template, clauses } = renderRuleTemplate(this.rule)
        if (!template) {
            throw new Error(
                `AssembledGroup.renderTemplate: '${this.kind}' produced an empty template. ` +
                `Rule has no visible content — should have been classified as leaf/token.`,
            )
        }
        const entry: Record<string, unknown> = { template, ...clauses }
        const sep = findRepeatSeparator(this.rule)
        if (sep) entry.joinBy = sep
        return entry
    }

    emitFactory(): string | undefined {
        if (!this.rawFactoryName) return undefined // hidden group
        return emitFieldCarryingFactory(this, this.fields)
    }

    emitFromFunction(_nodeMap: NodeMap): string | undefined {
        // Polymorph forms are emitted inline by their parent polymorph's
        // emitFromFunction — top-level group from() bindings aren't needed.
        // Non-form groups are hidden and have no factory binding anyway.
        return undefined
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
}

export function renderRuleTemplate(rule: Rule, inRepeat = false): WalkResult {
    const clauses: Record<string, string> = {}
    const parts = walkRuleForTemplate(rule, new Set(), inRepeat, clauses)
    return { template: parts.join(''), clauses }
}

function walkRuleForTemplate(
    rule: Rule,
    seen: Set<string>,
    inRepeat: boolean,
    clauses: Record<string, string>,
): string[] {
    switch (rule.type) {
        case 'seq': {
            const out: string[] = []
            for (const m of rule.members) {
                const parts = walkRuleForTemplate(m, seen, inRepeat, clauses)
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
                const parts = walkRuleForTemplate(m, seen, inRepeat, clauses)
                if (parts.length > 0) return parts
            }
            return []

        case 'optional':
            // `optional(',')` and friends — pure punctuation in an optional
            // wrapper is context-dependent and including it unconditionally
            // produces invalid output (python: `match X,:`). Skip the
            // whole optional when its content has no field/symbol ref.
            if (containsOnlyPunctuation(rule.content)) return []
            return walkRuleForTemplate(rule.content, seen, inRepeat, clauses)

        case 'repeat':
            return walkRuleForTemplate(rule.content, seen, true, clauses)

        case 'field': {
            if (seen.has(rule.name)) return []
            seen.add(rule.name)
            const varName = rule.name.toUpperCase()
            // Fields inside a repeat are multi-valued — emit `$$$NAME` so
            // the renderer joins instances with the rule's joinBy separator.
            return [inRepeat ? `$$$${varName}` : `$${varName}`]
        }

        case 'symbol':
            // Hidden symbols (supertype refs) dispatch to concrete children
            // at parse time, so they still contribute to the template as
            // a children-reference placeholder.
            if (seen.has('children')) return []
            seen.add('children')
            return ['$$$CHILDREN']

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
            return walkRuleForTemplate(rule.content, seen, inRepeat, clauses)

        case 'clause': {
            // Emit a separate sub-template and reference it from the main
            // template as `$NAME_CLAUSE`. Fresh seen set for clause body
            // so fields don't collide with main-template tracking.
            if (seen.has(rule.name)) return []
            seen.add(rule.name)
            const clauseSeen = new Set<string>()
            const clauseParts = walkRuleForTemplate(rule.content, clauseSeen, inRepeat, clauses)
            const clauseTemplate = clauseParts.join('')
            if (clauseTemplate) clauses[rule.name] = clauseTemplate
            return [`$${rule.name.toUpperCase()}_CLAUSE`]
        }

        case 'group':
            return walkRuleForTemplate(rule.content, seen, inRepeat, clauses)

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
