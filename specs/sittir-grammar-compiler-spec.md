# Grammar Compiler — Five-Phase Architecture

## Pipeline

```
grammar.js  ─┐
              ├→  [1. Evaluate]  →  RawGrammar           (rules + overrides applied)
overrides.ts ─┘                        ↓
                  [2. Link]      →  LinkedGrammar          (resolved rules + suggested overrides)
                                       ↓
                  [3. Optimize]  →  OptimizedGrammar       (restructured rules)
                                       ↓
                  [4. Assemble]  →  NodeMap                (per-kind nodes)
                                       ↓
                  [5. Emit]      →  types, factories, templates, from, ir
                                     + overrides.suggested.ts
```

**No nodes until Assemble.** Phases 1-3 produce and consume rules. Phase 4 turns rules into nodes. Phase 5 emits from nodes (and from factory signatures for from/ir).

**Every CHOICE branch starts as a variant (Rule level).** Merging is the optimization, not the default. At the model level, visible choices become polymorphs with forms.

**Non-lossy.** Every optimization preserves all information that affects output.

---

## Design principles

### Where new information belongs

When a gap is found — something the pipeline needs to know but doesn't — there are three places it can go. Use the first that fits:

**1. Grammar-level structure on the contract** (`RawGrammar`, `LinkedGrammar`, `OptimizedGrammar`)

Use when: the information describes a relationship *across* rules, not within a single rule. Supertypes are the canonical example — they describe which kinds belong to a group. This is not expressible within a single rule's tree.

Test: does the information require looking at multiple rules to compute? If yes, it belongs on the grammar contract, not on individual rules.

Examples: `supertypes`, `externalRoles`, `conflicts`, `references`.

**2. New Rule type in the shared IR** (`type Rule = ...`)

Use when: the information describes a *structural pattern* within a rule that later phases need to recognize and handle distinctly. It names something — a position, a branch, a grouping — that has specific meaning for emitters.

Test: does the information affect how a subtree is *traversed or emitted*? If yes, it's a Rule type. If it's just metadata about an existing subtree, it's not.

Examples: `clause` (optional group of tokens+fields), `variant` (named choice branch), `enum` (closed string set), `group` (inlined hidden seq).

Adding a new Rule type is a high-cost decision — every phase that pattern-matches on Rule must handle it. Prefer deriving from existing structure at Assemble time over adding new types.

**3. Metadata on an existing Rule type** (e.g. `source` on `field`, `separator` on `repeat`)

Use when: the information qualifies an existing pattern without changing what it *is*. It's provenance, or a parameter that affects rendering, or a flag that guides a later phase's decision.

Test: does the information change which Rule type this is? If no, it's metadata on the existing type.

Examples: `field.source`, `field.nameFrom`, `repeat.separator`, `repeat.trailing`, `enum.source`.

### What must not be hardcoded

Anything that is not derivable from the grammar must come from configuration (`overrides.json`), not from hardcoded logic in the pipeline. The pipeline is grammar-agnostic — it works for any tree-sitter grammar. Language-specific knowledge lives in overrides.

This includes:

- Field names that differ from the grammar's naming (override promotes or renames)
- Indent/dedent behavior (override maps externals to roles)
- Spacing rules that the grammar doesn't encode (override specifies word boundaries)
- Template formatting that varies per language (override provides formatting directives)

Test: would this logic break if applied to a different grammar? If yes, it belongs in overrides, not in the pipeline.

Corollary: if Assemble or Emit contains a conditional like `if (language === 'rust')` or `if (kind === 'function_item')`, that's a bug. The logic should be driven by structure in the rule tree or by override configuration.

### Overrides as structural patches

Overrides transform grammar rules into enriched grammar rules. The output is still a valid tree-sitter grammar — `transform(original, { 2: field('body') })` wraps position 2 in `field()`, which is a native tree-sitter concept. The enriched rules are rules that tree-sitter could parse.

This means the same transform applies to two substrates:

- **Rules** (codegen time): `grammar rule → override patches → enriched rule (still valid grammar)` — Evaluate produces enriched rules that Assemble/Emit consume.
- **SgNodes** (runtime): `raw SgNode → project same overrides → "better" SgNode` — the override projection makes implicit structure explicit. An unnamed positional child becomes addressable by field name.

The override operates entirely within tree-sitter's own concepts. It doesn't create sittir-specific structures — it creates better tree-sitter structures. The sittir factories/types are the typed API surface for these enriched structures.

Implication: `readNode`/`wrap` logic is a projection of the override patches onto node instances — not a separate per-kind codegen concern. The same positional patch that wraps rule position 2 in `field('body')` tells the runtime to expose `sgNode.child(2)` as `.body`.

### Derivability

Metadata that *can* be derived from the rule tree at Assemble time *must* be derived, not carried forward on Rule nodes through earlier phases. This keeps Rules clean and phases independent.

`required`, `multiple`, `contentTypes`, `detectToken`, `modelType` — all derived from tree context at Assemble, not stored on Rule nodes during Link or Optimize.

Test: can this be computed by walking the rule tree with its parent context? If yes, derive it in Assemble. Don't add it to the Rule type or carry it on grammar contracts.

---

## compiler/rule.ts — Shared IR

One type throughout the pipeline. Defined once, never extended.

```ts
type Rule =
    // Structural grouping — Optimize restructures these
    | { type: 'seq'; members: Rule[] }
    | { type: 'optional'; content: Rule }
    | { type: 'choice'; members: Rule[] }
    | { type: 'repeat'; content: Rule; separator?: string; trailing?: boolean }
    | { type: 'repeat1'; content: Rule; separator?: string }

    // Named patterns — clean wrappers, no derived metadata
    | { type: 'field'; name: string; content: Rule;
        source?: 'grammar' | 'override' | 'inlined' | 'inferred';
        nameFrom?: 'grammar' | 'kind' | 'override' | 'usage' }
    | { type: 'variant'; name: string; content: Rule }
    | { type: 'clause'; name: string; content: Rule }
    | { type: 'enum'; values: string[]; source?: 'grammar' | 'promoted' }
    | { type: 'supertype'; name: string; subtypes: string[]; source?: 'grammar' | 'promoted' }
    | { type: 'group'; name: string; content: Rule }

    // Terminals
    | { type: 'string'; value: string }
    | { type: 'pattern'; value: string }

    // Structural whitespace
    | { type: 'indent' }
    | { type: 'dedent' }
    | { type: 'newline' }

    // References — Link resolves these; absent after Link
    | { type: 'symbol'; name: string; hidden?: boolean; supertype?: boolean }
    | { type: 'alias'; content: Rule; named: boolean; value: string }
    | { type: 'token'; content: Rule; immediate: boolean }

interface SymbolRef {
    from: string;
    to: string;
    fieldName?: string;
    optional?: boolean;
    repeated?: boolean;
    position?: number;          // Link adds: index within parent's SEQ
}
```

### Named pattern taxonomy

Each names a structural pattern. No derived metadata — `required`, `multiple`, `contentTypes`, `detectToken` are all derivable from tree context at Assemble time.

| Rule type | Names a... | Provenance |
|---|---|---|
| `field` | position in a seq | `source`: grammar field() / override promotion / inlined from hidden rule / inferred from cross-parent usage. `nameFrom`: grammar field name / kind name / override name / majority usage across parents. |
| `variant` | branch in a choice | Added by Optimize when naming CHOICE branches. |
| `clause` | optional group (tokens+fields together) | Detected by Link from `optional(seq(STRING, FIELD, ...))`. |
| `enum` | closed set of string values | `source`: grammar choice-of-strings / promoted from hidden rule. |
| `supertype` | closed set of kind names (union type) | `source`: grammar supertypes list / promoted from hidden choice-of-symbols. |
| `group` | inlined hidden seq with fields | Preserves provenance when `_call_signature` is inlined — fields came from this group. |
| `terminal` | composed text-only terminal (seq/choice of strings+patterns) | Added by Link's `promoteTerminals` pass when a rule has no fields and no symbol refs — classified as leaf at Assemble time. |
| `polymorph` | choice-of-variants with heterogeneous field sets | Added by Optimize's `promotePolymorph` pass when a branch's CHOICE has members with incompatible field shapes — classified as polymorph at Assemble time, synthesizing one AssembledGroup per form. |

### Hidden rule resolution (Link)

Hidden rules (`_`-prefixed) resolve based on their content:

| Content pattern | Resolves to | Example |
|---|---|---|
| Choice of symbols, in `grammar.supertypes` | `supertype` (source: 'grammar') | `_expression: choice($.binary_expression, ...)` |
| Choice of symbols, NOT in supertypes, 5+ parent refs | `supertype` (source: 'promoted') | `_declaration: choice($.function_item, ...)` — usage frequency determines promotion confidence |
| Choice of symbols, NOT in supertypes, 1 parent ref | Inline content directly | Single-use structural helper |
| Choice of strings | `enum` (source: 'promoted') | `_visibility: choice('pub', 'crate')` |
| Seq with fields | `group` (inlined, fields promoted) | `_call_signature: seq(field('params'), ...)` |
| Other | Inline content directly | No named wrapper |

### Rule variant presence by phase

| Variant | After Evaluate | After Link | After Optimize |
|---|---|---|---|
| `seq` | ✓ | ✓ | ✓ |
| `optional` | ✓ | ✓ | ✓ |
| `choice` | ✓ | ✓ | ✓ |
| `repeat` | ✓ | ✓ | ✓ |
| `repeat1` | ✓ | gone (→ repeat) | |
| `field` | ✓ (bare) | ✓ (enriched with source/nameFrom) | ✓ |
| `variant` | | | ✓ |
| `clause` | | ✓ | ✓ |
| `enum` | ✓ (from choice-of-strings) | ✓ (+ promoted) | ✓ |
| `supertype` | ✓ (from grammar.supertypes) | ✓ (+ promoted) | ✓ |
| `group` | | ✓ | ✓ |
| `terminal` | | ✓ (from `promoteTerminals`) | ✓ |
| `polymorph` | | | ✓ (from `promotePolymorph`) |
| `string` | ✓ | ✓ | ✓ |
| `pattern` | ✓ | ✓ | ✓ |
| `indent` | | ✓ | ✓ |
| `dedent` | | ✓ | ✓ |
| `newline` | | ✓ | ✓ |
| `symbol` | ✓ | gone | |
| `alias` | ✓ | gone | |
| `token` | ✓ | gone | |

### What Optimize can and cannot change

| Can change (structural grouping) | Cannot change (named content) |
|---|---|
| Add/remove/restructure `seq` | `string` values |
| Add/remove/restructure `choice` | `pattern` values |
| Add/remove `optional` wrappers | `field` name, source, nameFrom |
| Add/remove `repeat` wrappers | `clause` name, content |
| Wrap `choice` members in `variant` | `enum` values, source |
| | `supertype` name, subtypes, source |
| | `group` name, content |
| | `indent` / `dedent` / `newline` |

---

## Grammar-level contracts

No nodes until Assemble. All three pre-Assemble phases produce `Record<string, Rule>`.

### After Evaluate: `RawGrammar`

```ts
interface RawGrammar {
    name: string;
    rules: Record<string, Rule>;
    extras: string[];
    externals: string[];
    supertypes: string[];
    inline: string[];
    conflicts: string[][];
    word: string | null;
    references: SymbolRef[];
}
```

Rule subset present: `seq`, `optional`, `choice`, `repeat`, `repeat1`, `field` (bare), `enum` (from choice-of-strings), `supertype` (from grammar.supertypes), `string`, `symbol`, `alias`, `token`, `pattern`.

### After Link: `LinkedGrammar`

No `node-types.json` as primary input. Content types, required, multiple — all derivable from the rule tree at Assemble time. node-types.json used for **validation only**. Overrides already applied by Evaluate — Link does not process them.

```ts
interface LinkedGrammar {
    name: string;
    rules: Record<string, Rule>;
    supertypes: Set<string>;
    externalRoles: Map<string, ExternalRole>;
    word: string | null;
    references: SymbolRef[];         // enriched: position added by tree walk
    suggestedOverrides?: SuggestedOverride[];  // from diagnostic derivations
}

type ExternalRole = { role: 'indent' | 'dedent' | 'newline' };

interface SuggestedOverride {
    kind: string;                    // target rule
    path: (string | number)[];       // position within rule (name or index)
    rule: Rule;                      // suggested Rule insertion
    derivation: string;              // which derivation produced this
    confidence: 'high' | 'medium' | 'low';
}
```

Rule subset present: `seq`, `optional`, `choice`, `repeat`, `field` (with provenance), `variant` (absent — not yet), `clause`, `enum` (+ promoted), `supertype` (+ promoted), `group`, `string`, `pattern`, `indent`, `dedent`, `newline`.

Absent: `symbol`, `alias`, `token`, `repeat1`.

### After Optimize: `OptimizedGrammar`

```ts
interface OptimizedGrammar {
    name: string;
    rules: Record<string, Rule>;
    supertypes: Set<string>;
    word: string | null;
}
```

Same rule types as after Link, plus `variant` (wrapping choice members). Structural grouping may be restructured.

### After Assemble: `NodeMap`

First time nodes appear. Metadata (required, multiple, contentTypes, detectToken) derived from tree context. Rules are consumed — not stored on nodes.

```ts
interface NodeMap {
    name: string;
    nodes: Map<string, AssembledNode>;
    signatures: SignaturePool;
    projections: ProjectionContext;
}

// Discriminated union — model type determines shape
type AssembledNode =
    | AssembledBranch
    | AssembledContainer
    | AssembledPolymorph
    | AssembledLeaf
    | AssembledKeyword
    | AssembledToken
    | AssembledEnum
    | AssembledSupertype
    | AssembledGroup;

interface AssembledNodeBase {
    kind: string;
    typeName: string;
    factoryName?: string;    // absent for supertype, group
    irKey?: string;          // absent for supertype, group
}

// seq with fields (visible)
interface AssembledBranch extends AssembledNodeBase {
    modelType: 'branch';
    fields: AssembledField[];
    children?: AssembledChild[];
}

// repeat (visible)
interface AssembledContainer extends AssembledNodeBase {
    modelType: 'container';
    children: AssembledChild[];
    separator?: string;
}

// choice of structures (visible) — one kind, multiple structural forms
interface AssembledPolymorph extends AssembledNodeBase {
    modelType: 'polymorph';
    forms: AssembledForm[];
}

// pattern (visible)
interface AssembledLeaf extends AssembledNodeBase {
    modelType: 'leaf';
    pattern?: string;
}

// single string, alphanumeric (visible)
interface AssembledKeyword extends AssembledNodeBase {
    modelType: 'keyword';
    text: string;
}

// non-alphanumeric terminal (visible)
interface AssembledToken extends AssembledNodeBase {
    modelType: 'token';
}

// choice of strings (hidden or visible) — no factory
interface AssembledEnum extends AssembledNodeBase {
    modelType: 'enum';
    values: string[];
}

// hidden choice of symbols — no factory, no AST node
interface AssembledSupertype extends AssembledNodeBase {
    modelType: 'supertype';
    subtypes: string[];
}

// hidden seq with fields — fields promoted to parent, no factory, no AST node
interface AssembledGroup extends AssembledNodeBase {
    modelType: 'group';
    fields: AssembledField[];
}

// --- Shared sub-structures ---

interface AssembledField {
    name: string;
    propertyName: string;
    paramName: string;
    required: boolean;           // derived: is this field inside an optional?
    multiple: boolean;           // derived: is this field inside a repeat?
    contentTypes: string[];      // derived: walk field content, collect kind names
    source: 'grammar' | 'override' | 'inlined' | 'inferred';
    projection: KindProjection;
}

// One structural form of a polymorph
interface AssembledForm {
    name: string;
    typeName: string;
    factoryName: string;
    detectToken?: string;        // derived: unique string literal among sibling forms
    fields: AssembledField[];    // derived: per-form narrowed fields
    children?: AssembledChild[];
    mergedRules?: Rule[];        // from collapse (non-lossy) — only for template generation
}
```

**No factory ≠ no NodeMap entry.** Supertypes, groups, and enums are in the map — they have kinds, they have type names, they participate in the type system. They just don't produce factories (no AST node to construct). Emitters that produce factories skip them; emitters that produce types include them.

**Rules are not stored on assembled nodes.** The rule is consumed during Assemble to derive fields, children, forms, and metadata. After Assemble, the rule tree is gone. Anything Emit needs must be on the assembled node, not derivable by re-walking the rule.

Exception: `mergedRules` on `AssembledForm` preserves collapsed form rules for template generation only. This is a narrow carve-out — the template emitter needs the original rule shapes to produce per-form templates.

---

## Phase 1: compiler/evaluate.ts

**In:** `grammar.js` source (sole input format — no grammar.json), or `overrides.ts` (grammar extension that imports grammar.js as base)
**Out:** `RawGrammar`

Evaluate executes the grammar DSL and produces a `RawGrammar`. When overrides exist, the entry point is `overrides.ts` — a grammar extension that imports the base grammar.js. Tree-sitter's native `grammar(base, { rules })` mechanism handles the merge:

1. `grammar()` starts with `Object.assign({}, baseGrammar.rules)` — copies all base rules
2. For each rule in the extension, the rule function receives `($, original)` — where `original` is the base grammar's definition
3. The extension rule can return a new definition, or use `transform(original, patches)` to modify surgically
4. Result: a single merged grammar object with all rules (base + overrides)

**No custom two-pass system.** Tree-sitter's `grammar()` already provides the base rule as the second argument to each extension rule function. Our `transform`/`insert`/`replace` primitives are additional DSL functions that operate on the `original` rule.

Reference implementation saved at: `specs/005-five-phase-compiler/reference/tree-sitter-dsl.js` (lines 246-331 show the extension mechanism).

### Operations

| Function | In → Out | Stateless? |
|---|---|---|
| `evaluate(entryPath)` | path to grammar.js or overrides.ts → `RawGrammar` | Yes (I/O) |
| `seq(...members)` | `Input[]` → `Rule{seq}` | Yes |
| `choice(...members)` | `Input[]` → `Rule{choice\|optional\|enum}` | Yes |
| `optional(content)` | `Input` → `Rule{optional}` | Yes |
| `repeat(content)` | `Input` → `Rule{repeat}` (detects separator) | Yes |
| `repeat1(content)` | `Input` → `Rule{repeat1}` (detects separator) | Yes |
| `field(name, content)` | name + `Input` → `Rule{field}` | Yes |
| `token(content)` | `Input` → `Rule{token}` | Yes |
| `prec(n, content)` | `Input` → `Rule` (strips PREC) | Yes |
| `normalize(input)` | `Input` → `Rule` | Yes |
| `createProxy(currentRule, refs)` | → `$` Proxy | Stateful (accumulates refs) |
| `transform(original, patches)` | base Rule + position map → modified Rule (walks object tree, applies patches) | Yes |
| `insert(original, position, wrapper)` | base Rule + position + wrapper → modified Rule (sugar over transform) | Yes |
| `replace(original, position, replacement)` | base Rule + position + replacement → modified Rule (substitute/suppress) | Yes |

### Override DSL primitives

Overrides are grammar extensions that use tree-sitter's native `($, original)` pattern. The `original` parameter is the base grammar's rule definition (provided by `grammar()` at line 326 of tree-sitter's dsl.js). New DSL primitives (`transform`, `insert`, `replace`) operate on `original`:

```ts
// overrides.ts
const base = require('tree-sitter-rust/grammar')

module.exports = grammar(base, {
  name: 'rust',
  rules: {
    // ($, original) — original is the base grammar's function_item rule
    function_item: ($, original) => transform(original, {
      2: field('body'),                    // insert: wrap position 2 in a field
      'parameters': field('params'),       // insert: address by existing field name
    }),

    _newline: ($) => role('newline'),      // external role mapping
    _indent: ($) => role('indent'),
  }
})
```

**How it works**: `grammar(base, { rules })` calls each rule function with `ruleFn.call(ruleBuilder, ruleBuilder, baseGrammar.rules[ruleName])`. The second argument is the base rule — a plain object tree of `{ type: 'SEQ', members: [...] }`. Our `transform()` walks this object tree and applies patches at the specified positions.

**Addressing**: hybrid keys — numeric positional index for unnamed positions, field name when traversing through a named field node.

**Insert vs replace**: `insert` adds structure (field wrappers, role annotations) while preserving grammar content. `replace` substitutes a different Rule subtree; suppress is a replace with no content.

### Reference tracking

The `$` proxy knows which rule is currently being evaluated. When `field('body', $.block)` executes, `field()` sees the symbol returned by the proxy — so it knows parent → field name → referenced symbol. When `optional($.block)` executes, it knows the reference is optional.

```ts
let currentRule = '';
const references: SymbolRef[] = [];

const $ = new Proxy({}, {
    get: (_, name: string) => {
        const ref: SymbolRef = { from: currentRule, to: name };
        references.push(ref);
        return { type: 'symbol', name, hidden: name.startsWith('_'), ref };
    }
});

for (const [name, ruleFn] of Object.entries(def.rules)) {
    currentRule = name;
    rules[name] = ruleFn($);
}
```

DSL functions enrich the ref in-place:

```ts
function field(name: string, content: Input): Rule {
    const resolved = normalize(content);
    if (resolved.ref) resolved.ref.fieldName = name;
    return { type: 'field', name, content: resolved };
}

function optional(content: Input): Rule {
    const resolved = normalize(content);
    if (resolved.ref) resolved.ref.optional = true;
    return { type: 'optional', content: resolved };
}

function repeat(content: Input): Rule {
    const resolved = normalize(content);
    if (resolved.ref) resolved.ref.repeated = true;
    // separator detection...
    return { type: 'repeat', content: resolved, separator };
}
```

### What's capturable at eval time vs link time

| Info | Eval time | Link time |
|---|---|---|
| A references B | ✓ (proxy) | |
| A.fieldName = B | ✓ (field() sees it) | |
| B is optional in A | ✓ (optional() sees it) | |
| B is repeated in A | ✓ (repeat() sees it) | |
| B is at position N in A's SEQ | | ✓ (walk the rule tree) |
| B's complete parent set | | ✓ (all rules evaluated) |

Position within SEQ can't be captured at eval time without significant complexity — `seq()` receives already-constructed children and doesn't know which `$.foo` reference is at position 0 vs position 3. Threading position counters through every DSL function makes them stateful. The linker walks the assembled tree to assign positions.

### Pattern detection

`choice()` detects:
- All strings, no BLANK → `enum` (source: 'grammar')
- Contains BLANK → `optional(choice(nonBlank...))`
- Single remaining → unwrap

`repeat()` detects:
- `seq(STRING, x)` → `{ separator: STRING.value }`
- `seq(x, STRING)` → `{ separator: STRING.value, trailing: true }`

### Eliminated

| Old function | Old location | Why gone |
|---|---|---|
| `unwrapPrec()` | factoring.ts, emitters/rules.ts | PREC stripped by `prec()` |
| `detectRecursiveSeparator()` | emitters/rules.ts | Separator captured by `repeat()` |
| `findRecursiveSeps()` | emitters/rules.ts | Helper for above |
| `extractSeparators()` | enriched-grammar.ts | Separator captured by `repeat()` |
| `buildJoinBy()` | emitters/rules.ts | Separator on Rule directly |
| `hasBlankChoice()` | enriched-grammar.ts | BLANK absorbed by `choice()` |

---

## Phase 2: compiler/link.ts

**In:** `RawGrammar` (overrides already applied by Evaluate). node-types.json for **validation only**.
**Out:** `LinkedGrammar`

Link resolves what nodes ARE. After Link: no `symbol`, `alias`, `token`, `repeat1`. Terminals (`string`, `pattern`) and structural whitespace (`indent`, `dedent`, `newline`) survive. All `field` nodes enriched with provenance. Child slots resolved. External tokens → structural directives. Clauses detected. `seq(X, repeat(X))` normalized to `repeat(X)`.

Link also runs a **terminal promotion** pass (`promoteTerminals`) that walks every rule and wraps any field-free, symbol-free subtree in a `terminal` Rule. This lets Assemble classify composed text-only constructs (e.g. `seq('->', '!', $.identifier_start_pattern)`) as `leaf` model types without re-walking the tree.

Link converts tree-sitter external tokens for structural whitespace (`_indent`, `_dedent`, `_newline`) into `indent` / `dedent` / `newline` Rule nodes via name matching. See C17 in `specs/005-five-phase-compiler/cleanup-backlog.md` for the audit of grammars using non-standard external names.

**Link does NOT restructure the tree.** Tree shape identical before and after — only node types and provenance change.

**Link does NOT process overrides.** Override application happens in Evaluate's second pass. Link receives rules already annotated with `source: 'override'` provenance.

**Link generates suggested overrides.** New reference graph derivations (field name inference, synthetic supertypes, override inference, naming consistency, global optionality, separator consistency, override candidate quality) produce entries for `overrides.suggested.ts` — a grammar extension file in the same format as manual overrides. Each entry includes derivation source and confidence in comments. Entries already in `overrides.ts` are omitted.

### Reference resolution (removes symbol, alias, token, repeat1)

| Function | In → Out | Stateless? |
|---|---|---|
| `link(raw)` | `RawGrammar` → `LinkedGrammar` | Yes |
| `resolveRule(rule, ctx)` | `Rule` → `Rule` (resolve all references) | Yes |
| `inlineHiddenRule(sym, rules)` | `Rule{symbol}` → content (if has relevant fields) | Yes |
| `resolveHiddenChoice(sym, rules)` | `Rule{symbol}` → `Rule{supertype\|enum}` (if hidden choice) | Yes |
| `resolveHiddenSeq(sym, rules)` | `Rule{symbol}` → `Rule{group}` (if hidden seq with fields) | Yes |
| `resolveExternal(sym, roles)` | `Rule{symbol}` → `Rule{indent\|dedent\|newline}` | Yes |
| `resolveAlias(alias)` | `Rule{alias}` → `Rule{field}` or transparent | Yes |
| `flattenToken(token)` | `Rule{token}` → `Rule{seq(string,...)}` | Yes |
| `normalizeRepeat1(rule)` | `Rule{repeat1}` → `Rule{repeat}` | Yes |
| `normalizeRepeatPattern(rule)` | `seq(X, repeat(X))` → `repeat(X)` | Yes |

### Clause detection

| Function | In → Out | Stateless? |
|---|---|---|
| `detectClause(optionalRule)` | `Rule{optional}` → `Rule{clause}` or unchanged | Yes |
| `detectIndentField(field, rules, roles)` | field content + roles → boolean | Yes |

### Field annotation (provenance only — no derived metadata)

| Function | In → Out | Stateless? |
|---|---|---|
| `assignPositions(rule)` | SEQ walk → fields with position context | Yes |

Note: `promoteFields()` is eliminated from Link. Override-driven field promotion now happens in Evaluate's second pass via `transform`/`insert`.

### Reference graph enrichment

After all rules are linked, Link walks each rule tree to assign `position` to SymbolRefs. The complete enriched graph enables several derivations:

| Function | In → Out | Stateless? |
|---|---|---|
| `enrichPositions(rules, refs)` | rules + SymbolRef[] → SymbolRef[] with `position` set | Yes |
| `computeParentSets(refs)` | SymbolRef[] → `Map<string, SymbolRef[]>` (symbol → all parents) | Yes |

**Link-time derivations from the enriched graph:**

| Derivation | How | Uses |
|---|---|---|
| Inline confidence | Hidden rule referenced from 1 parent → always inline. From N parents with same field names → shared group, inline all. | `from`, `fieldName` |
| Field name inference | Symbol `block` is `field('body')` in 5/6 parents → auto-promote unnamed case to `field('body', source: 'inferred', nameFrom: 'usage')`. High agreement = auto-apply, low agreement = flag for review. | `to`, `fieldName` (cross-parent) |
| Supertype candidate | Hidden choice of symbols referenced from 5+ parents as field content → promote to `supertype` (source: 'promoted'). 1 parent → inline. 10+ parents → almost certainly should be in grammar.supertypes. | `to`, `from`, `fieldName` (count) |
| Synthetic supertype | Same set of concrete kinds appears as field content alternatives in 3+ parents → de-facto supertype even if no hidden rule groups them. Candidate for a synthetic supertype rule. | `to`, `fieldName`, field content overlap |
| Override inference | Symbol always at same position with same role across all parents → override auto-derivable. Flag for confirmation. | `from`, `to`, `position`, `fieldName` |
| Dead rule detection | Symbol in `grammar.rules` but zero incoming refs → unreachable, skip. | `to` (absence) |
| Naming consistency | If `_expression` appears as `field('left')` in one parent and `field('value')` in another → naming is parent-specific. Always `field('condition')` → name is inherent. | `to`, `fieldName` |
| Global optionality | Symbol is `optional: true` in ALL parents → inherently optional. | `to`, `optional` |
| Separator consistency | Symbol always inside `repeat` with same separator → separator is inherent to the content. | `to`, `repeated`, `separator` |
| Override candidate quality | Position has same kind in all parents → high-confidence override. Varies → needs manual review. | `to`, `from`, `position` |
| Cycle detection | Self-referential rules (A → A). Flagged for awareness. | `from`, `to` |

### Diagnostics

| Function | In → Out | Stateless? |
|---|---|---|
| `detectCandidates(rules, grammar)` | rules + grammar → console | Side-effecting |
| `detectKeywordAlternatives(rule, rules)` | Rule → string[][] | Yes |
| `validateAgainstNodeTypes(linked, nodeTypes)` | LinkedGrammar + entries → warnings[] | Yes |

### Current code → Link

| Current function | Current location | New function |
|---|---|---|
| `applyOverrides()` + helpers | enriched-grammar.ts | Moved to Evaluate: `applyOverrides()` via grammar extension |
| `containsFields()` | factoring.ts | Internal to `inlineHiddenRule()` |
| `tryClause()` | emitters/rules.ts | `detectClause()` |
| `ruleReferencesExternal()` | emitters/rules.ts | `detectIndentField()` |
| `classifyRules()` | enriched-grammar.ts | `resolveRule()` (hidden rules → supertype/enum/group) |
| `hasFields()`, `hasChildren()` | enriched-grammar.ts | Internal to hidden rule classification |
| `extractSubtypes()` | enriched-grammar.ts | Internal to `resolveHiddenChoice()` |
| `collectConcreteTypes()` | enriched-grammar.ts | Internal to `resolveHiddenChoice()` |
| `assignFieldPositions()` | enriched-grammar.ts | `assignPositions()` |
| `initializeModels()` | node-model.ts | Eliminated (no nodes in Link) |
| `reconcile()` | node-model.ts | Eliminated (no nodes in Link) |
| `refineAllModelTypes()` | node-model.ts | Eliminated (no nodes in Link) |
| `mergeOverrides()` | overrides.ts | Moved to Evaluate: grammar extension mechanism |
| `loadOverridesWithExternals()` | overrides.ts | Moved to Evaluate: grammar extension mechanism |
| `inferTokenAliases()`, `applyTokenAliases()` | semantic-aliases.ts | Absorbed into `link()` |
| `createHiddenModels()` | build-model.ts | Absorbed into `resolveRule()` |
| `enrichBranch()`, `enrichContainer()`, etc. | node-model.ts | Eliminated (Assemble derives from tree) |
| All field/child extraction helpers | enriched-grammar.ts | Eliminated from Link (Assemble derives from tree) |

---

## Phase 3: compiler/optimize.ts

**In:** `LinkedGrammar`
**Out:** `OptimizedGrammar`

Restructures `seq`/`choice`/`optional`/`repeat`. Does NOT change named content. Adds `variant` wrappers around choice members. Non-lossy.

Optimize also runs **polymorph promotion** (`promotePolymorph`): after variants are named, any visible CHOICE whose members have heterogeneous field shapes is wrapped in a `polymorph` Rule. The polymorph carries the full list of forms and their detect tokens so that Assemble can construct one `AssembledPolymorph` node with one `AssembledGroup` per form — classification then becomes a pure `switch` on `rule.type` with no field-shape inspection.

### CHOICE handling

| Function | In → Out | Stateless? |
|---|---|---|
| `optimize(linked)` | `LinkedGrammar` → `OptimizedGrammar` | Yes |
| `fanOutChoices(rule)` | `Rule` → `Rule[]` (one per CHOICE path) | Yes |
| `fanOutChoice(members)` | `Rule[]` → `Rule[]` | Yes |
| `factorSeqChoice(branches)` | `Rule[]` → `Rule[]` (prefix/suffix extraction) | Yes |
| `findCommonPrefix(seqs)` | `Rule[][]` → number | Yes |
| `findCommonSuffix(seqs, prefixLen)` | `Rule[][]` × number → number | Yes |
| `flattenToSeq(rule)` | `Rule` → `Rule[]` | Yes |
| `rulesEqual(a, b)` | Rule × Rule → boolean | Yes |

### Variant construction (Rule level)

Note: `variant` remains a Rule type — it wraps individual choice branches at the rule level. At the model level, a visible choice containing `variant` rules becomes a `polymorph` with `forms`. The Rule-level `variant` is the mechanism; the model-level `form` is the result.

| Function | In → Out | Stateless? |
|---|---|---|
| `wrapVariants(choice, resolvedRules)` | choice + rules → `Rule{choice}` with `variant`-wrapped members | Yes |
| `deduplicateVariants(variants)` | `Rule{variant}[]` → `Rule{variant}[]` (remove identical variants — non-lossy) | Yes |
| `nameVariant(variant, i, all)` | variant Rule + index + set → string (name for the Rule-level variant; becomes form name at Assemble) | Yes |
| `tokenToName(token)` | `; → semi`, `{ → brace` | Yes |

### Spacing

| Function | In → Out | Stateless? |
|---|---|---|
| `needsSpace(prev, next)` | string × string → boolean | Yes |
| `buildWordBoundary(grammar)` | grammar → { endRe, startRe } | Yes |

### Current code → Optimize

| Current function | Current location | New function |
|---|---|---|
| `resolveChoices()` | factoring.ts | `fanOutChoices()` |
| `resolveChoice()` | factoring.ts | `fanOutChoice()` |
| `factorSeqChoice()` | factoring.ts | `factorSeqChoice()` |
| `structurallyEqual()` | factoring.ts | `rulesEqual()` |
| `commonPrefixLength()`, `commonSuffixLength()` | factoring.ts | `findCommonPrefix()`, `findCommonSuffix()` |
| `normalizeToSeq()` | factoring.ts | `flattenToSeq()` |
| `deduplicateVariants()` | factoring.ts | `deduplicateVariants()` |
| `collapseSameFieldSetVariants()` | factoring.ts | Moves to Assemble: `collapseForms()` |
| `nameVariant()`, `tokenToName()` | factoring.ts | `nameForm()`, `tokenToName()` |
| `buildVariantMetadata()` | factoring.ts | `wrapVariants()` (variant is a Rule node now, not side-channel metadata) |
| `extractContentKinds()` | factoring.ts | Eliminated (Assemble derives contentTypes from tree) |
| `computeAllVariants()` | build-model.ts | `optimize()` |
| `needsSpace()` | emitters/rules.ts | `needsSpace()` |
| `buildWordBoundary()` | emitters/rules.ts | `buildWordBoundary()` |

---

## Phase 4: compiler/assemble.ts

**In:** `OptimizedGrammar`
**Out:** `NodeMap`

First time nodes appear. All metadata (required, multiple, contentTypes, detectToken, modelType) **derived from the rule tree**, not carried on Rule nodes.

**Class hierarchy.** Nodes are real ES class instances, not plain data shapes. `AssembledNodeBase` owns identity (`kind`, `typeName`, `factoryName`, `irKey`, derived name surfaces like `rawFactoryName`, `treeTypeName`, `configTypeName`, `fromInputTypeName`, `fromFunctionName`). The concrete subclasses — `AssembledBranch`, `AssembledContainer`, `AssembledPolymorph`, `AssembledLeaf`, `AssembledKeyword`, `AssembledToken`, `AssembledEnum`, `AssembledSupertype`, `AssembledGroup` — each override `renderTemplate()`, `emitFactory()`, and `emitFromFunction(nodeMap)` to own their own emission. Emitters are thin dispatch loops over `nodeMap.nodes` calling these methods.

**Classification is a pure switch.** After Link's `promoteTerminals` and Optimize's `promotePolymorph` passes, `classifyNode(kind, rule)` reduces to a `switch` on `rule.type` — every case maps directly to one model type. No field-shape inspection, no ancestor walks.

### Derivation from tree context

| Metadata | How derived |
|---|---|
| `required` | Walk up from field — is it inside an `optional`? |
| `multiple` | Walk up from field — is it inside a `repeat`? |
| `contentTypes` | Walk field's content — collect names from `field`, `enum`, `supertype`, `string` |
| `detectToken` | Among sibling `variant` Rule nodes in a choice, find a `string` unique to this branch |
| `separator` | From `repeat.separator` (captured at Evaluate) |
| `modelType` | Structural simplification + visibility check (see below) |
| `mergedRules` | Assemble collapses same-field-set polymorph forms without detect tokens: preserves all rules for template generation, unions content types per field |

### Model type classification

`classifyNode(kind, rule)` determines model type in two steps:

**Step 1: Structural simplification.** Reduce the rule to its primitive shape by stripping non-structural content:

- Remove anonymous tokens (non-alphanumeric `string` nodes: `{`, `(`, `->`, `;`)
- Collapse `seq(x)` → `x` (single-member seq is just its content)
- Collapse `choice(x|x)` → `x` (all-identical branches)

This is a transient computation — the simplified form exists only inside `classifyNode()`. It is not stored.

**Step 2: Classify by shape × visibility.** The simplified top-level Rule shape and the rule's visibility (hidden = `_`-prefixed, visible = named) determine the model type:

| Simplified shape | Hidden (`_`-prefixed) | Visible (named) |
|---|---|---|
| `seq` (containing `field` nodes) | `group` — fields promoted to parent, no AST node | `branch` |
| `repeat` | inlined into parent | `container` |
| `choice` (of structures/symbols) | `supertype` — type-level union, no AST node | `polymorph` — one kind, multiple structural forms |
| `choice` (of strings) | `enum` | `enum` |
| `pattern` | inlined | `leaf` |
| single `string` (alphanumeric) | inlined | `keyword` |
| non-alphanumeric terminal | inlined | `token` |

This is exhaustive. Every simplified rule falls into exactly one cell.

### Model types in NodeMap

| Model type | What it represents | Emits |
|---|---|---|
| `branch` | Visible seq with fields. Named AST node with field-based structure. | type, factory, template, from, ir |
| `container` | Visible repeat. Named AST node wrapping repeated children. | type, factory, template, from, ir |
| `polymorph` | Visible choice of structures. One AST node kind with multiple distinct structural forms. Each form may be a seq, repeat, or terminal. | type (per form), factory (per form), template (per form), from, ir |
| `leaf` | Visible pattern. Terminal node with text captured by tree-sitter. | type, factory, ir |
| `keyword` | Visible single string (alphanumeric). Fixed literal token. | type, factory, ir |
| `enum` | Choice of strings (hidden or visible). Closed set of literal values. | type (union of literals), factory, ir |
| `token` | Non-alphanumeric terminal. Operator/punctuation. | type (minimal) |
| `supertype` | Hidden choice of symbols. Type-level union of concrete kinds. No AST node. | type (union of interfaces) |
| `group` | Hidden seq with fields. Fields promoted to parent. No AST node. | provenance only |

### Model types without factories

| Model type | Why no factory |
|---|---|
| `supertype` | No AST node — type-level union only. Types emitter produces union type. |
| `group` | No AST node — fields promoted to parent during Link. Stays in NodeMap to preserve provenance. |
| `token` | Non-alphanumeric terminal — no user-facing construction. Types emitter produces minimal type. |

### Not a model type

| | What happens |
|---|---|
| `hidden` | Not a model type. All hidden rules resolved during Link into `supertype`, `enum`, `group`, or inlined directly. If a hidden rule survives to Assemble, Link has a bug. |
| inlined content | Hidden repeat, pattern, string, terminal — absorbed into parent's rule tree during Link. No separate identity. |

### Why `polymorph` is not `branch`

A branch is a sequence with fields — one structural form. A polymorph is a choice between different structural forms. Treating polymorphs as "branches with variants" forces every emitter to handle two fundamentally different structures through one code path:

- A branch always has the same fields in the same positions. One template, one factory signature, one type interface.
- A polymorph has different fields per form, different tokens per form, different templates per form. Each form needs its own factory entry point, its own template, its own type interface. A detect token or discriminant distinguishes forms at runtime.

By making polymorph a separate model type, emitters that handle branches never see variant logic, and emitters that handle polymorphs are purpose-built for multi-form nodes.

**Supertype vs. polymorph:** A supertype is a hidden union — many *kinds*, one type constraint, no AST node. A polymorph is a visible union — one *kind*, many structural forms, produces an AST node. The supertype exists only in the type system. The polymorph exists in the syntax tree.

### Functions

| Function | In → Out | Stateless? |
|---|---|---|
| `assemble(optimized)` | `OptimizedGrammar` → `NodeMap` | Yes |
| `classifyNode(kind, rule)` | kind + Rule → modelType (structural simplification + visibility) | Yes |
| `simplifyRule(rule)` | Rule → Rule (strip anon tokens, collapse trivial seq/choice) — transient, not stored | Yes |
| `extractFields(rule)` | Rule → `AssembledField[]` (walk, derive required/multiple/contentTypes) | Yes |
| `extractChildren(rule)` | Rule → `AssembledChild[]` (walk tree, skip string/pattern/enum — collect remaining fields as child structure) | Yes |
| `extractForms(rule)` | Rule → `AssembledForm[]` (for polymorphs: each choice branch as a distinct structural form) | Yes |
| `collapseForms(forms)` | `AssembledForm[]` → `AssembledForm[]` (same-field-set forms without detect tokens → merge, union contentTypes, preserve mergedRules) | Yes |
| `deriveRequired(field, rule)` | field + ancestor context → boolean | Yes |
| `deriveMultiple(field, rule)` | field + ancestor context → boolean | Yes |
| `deriveContentTypes(field)` | field content → string[] | Yes |
| `deriveDetectToken(form, siblings)` | form + sibling forms → string | Yes |
| `nameNode(kind)` | kind → { typeName, factoryName, irKey } | Yes |
| `nameField(field)` | field name → { propertyName, paramName } | Yes |
| `computeSignatures(nodes)` | nodes → SignaturePool | Yes |
| `collapseKinds(nodes, sigs)` | nodes + signatures → collapsed Map | Yes |
| `buildProjections(nodes)` | nodes → ProjectionContext | Yes |
| `projectKinds(kinds, ctx)` | kinds + ctx → KindProjection | Yes |

### Current code → Assemble

| Current function | Current location | New function |
|---|---|---|
| `applyNaming()`, `nameModel()`, `nameField()` | naming.ts | `nameNode()`, `nameField()` |
| `computeSignatures()` | optimization.ts | `computeSignatures()` |
| `collapseKinds()` | optimization.ts | `collapseKinds()` |
| `identifyEnumPatterns()` | optimization.ts | `classifyNode()` (enum from Rule) |
| `hydrate()`, `hydrateField()`, `hydrateChild()` | hydration.ts | `extractFields()`, `extractChildren()` |
| `buildProjectionContext()`, `projectKinds()` | kind-projections.ts | `buildProjections()`, `projectKinds()` |
| `initializeModels()` | node-model.ts | `assemble()` (builds nodes from rules) |
| `reconcile()` | node-model.ts | `assemble()` (merges rule structure into nodes) |
| `extractFields()`, `extractChildren()` | enriched-grammar.ts | `extractFields()`, `extractChildren()` (derive from tree) |
| `simplifyRule()` | classify.ts | `simplifyRule()` (transient, inside `classifyNode()`) |
| `classifyRule()` | classify.ts | Absorbed into `classifyNode()` |
| `collapseSameFieldSetVariants()` | factoring.ts | `collapseForms()` (same-field-set forms → merge, union contentTypes, preserve mergedRules) |
| `collectChildSlots()`, `collapseSlots()`, `nameChildSlots()` | enriched-grammar.ts | Absorbed into `extractChildren()` |
| `refineAllModelTypes()` | node-model.ts | `classifyNode()` (structural simplification + visibility) |

---

## Phase 5: emitters/

**In:** `NodeMap`
**Out:** source strings

All stateless: `NodeMap → string`.

### Five outputs, two derivation chains

```
NodeMap ──→ emitters/types.ts      → types.ts       (interfaces, unions, Config, FromInput)
       ├──→ emitters/factories.ts  → factories.ts   (constructors, per-form factories for polymorphs)
       ├──→ emitters/templates.ts  → templates.yaml (render strings, clauses, joinBy)
       │
       │    factory signature
       │         ↓
       ├──→ emitters/from.ts       → from.ts        (sugar over factory: resolve fields, call factory)
       └──→ emitters/ir.ts         → ir.ts          (re-exports factories + from with form accessors)
```

**From derives from factory signature.** For each field in the factory config type, pick a resolver based on `field.contentTypes`, apply recursively, call factory. Does not go back to the node model.

**IR derives from factory exports.** Thin namespace wrapper. Does not go back to the node model.

### emitters/templates.ts

| Function | In → Out |
|---|---|
| `emitTemplatesYaml(nodeMap)` | NodeMap → YAML string |
| `emitTemplate(node)` | AssembledBranch \| AssembledContainer → TemplateRule |
| `emitPolymorphTemplates(node)` | AssembledPolymorph → TemplateRule per form |

### emitters/types.ts

| Function | In → Out |
|---|---|
| `emitTypes(nodeMap)` | NodeMap → TypeScript string |
| `emitInterface(node)` | AssembledBranch \| AssembledContainer → interface lines |
| `emitFormInterface(node, form)` | polymorph + form → interface lines |
| `emitConfigType(node)` | AssembledNode → config type lines |

### emitters/factories.ts

| Function | In → Out |
|---|---|
| `emitFactories(nodeMap)` | NodeMap → TypeScript string |
| `emitFactory(node)` | AssembledBranch \| AssembledContainer → factory string |
| `emitFormFactory(node, form)` | polymorph + form → form factory string |

### emitters/from.ts

Derives from factory signature.

| Function | In → Out |
|---|---|
| `emitFrom(nodeMap)` | NodeMap → TypeScript string |
| `emitFromFunction(node)` | AssembledNode → from function string |
| `emitFormFrom(node, form)` | polymorph + form → form from string |
| `resolveFieldStrategy(field)` | AssembledField → resolver strategy |
| `emitResolver(strategy)` | strategy → resolver function string |

### emitters/ir.ts

Derives from factory exports.

| Function | In → Out |
|---|---|
| `emitIr(nodeMap)` | NodeMap → TypeScript string |

### Current code → Emit

| Current function | Current location | New function |
|---|---|---|
| `emitTemplatesYaml()` | emitters/rules.ts | `emitTemplatesYaml()` in templates.ts |
| `ruleToTemplate()` | emitters/rules.ts | Absorbed into `emitTemplate()` |
| `emitFromModelVariants()` | emitters/rules.ts | `emitPolymorphTemplates()` |
| `emitTypes()` | emitters/types.ts | `emitTypes()` |
| `emitConcreteInterface()` | emitters/types.ts | `emitInterface()` |
| `emitVariantInterface()` | emitters/types.ts | `emitFormInterface()` |
| `emitFactories()` | emitters/factories.ts | `emitFactories()` |
| `emitFactory()` | emitters/factories.ts | `emitFactory()` |
| `emitVariantFactory()` | emitters/factories.ts | `emitFormFactory()` |
| `emitFrom()` | emitters/from.ts | `emitFrom()` |
| `emitFromFunction()` | emitters/from.ts | `emitFromFunction()` |
| `emitVariantFromFunction()` | emitters/from.ts | `emitFormFrom()` |

### Eliminated from Emit

| Old function | Where it went |
|---|---|
| `tryClause()` | Link: `detectClause()` |
| `topLevelChoice()` | Assemble: `classifyNode()` produces `polymorph` model type |
| `ruleReferencesExternal()` | Link: `detectIndentField()` |
| `needsSpace()`, `buildWordBoundary()` | Optimize |
| `variantFieldSetsFromModel()` | Assemble: `extractForms()` |
| `computeVariantFieldSets()` | Eliminated — variant Rule nodes from Optimize, forms extracted in Assemble |
| `walkWithInlining()` | Link: hidden rules already inlined |
| `buildJoinBy()`, `detectRecursiveSeparator()` | Evaluate: separator on Rule |
| `appendMissingFields()` | Eliminated — Assemble provides complete field set per form |

---

## Stateful → Stateless

All five phases become pure functions:

| Current state | Migration |
|---|---|
| `grammarJsonCache`, `explicitPaths` | `evaluate()` takes single entry path (grammar.js or overrides.ts) |
| `nodeTypesCache`, `explicitNodeTypePaths` | `validateAgainstNodeTypes()` takes path |
| `overridePaths` | Eliminated — overrides.ts imports grammar.js directly via tree-sitter's `grammar(base)` |
| `_wordEndRe`, `_wordStartRe`, `_externalRoles` | Eliminated — spacing config from Optimize, externals resolved in Link |
| Model mutation everywhere | Each phase returns new data |
