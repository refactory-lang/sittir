# Canonical Surface (`ir.from.*`) — Design

## Problem

Sittir's `ir` namespace exposes grammar-specific factory names (`ir.booleanLiteral`,
`ir.integerLiteral`, `ir.stringLiteral`). These names vary by grammar —
Rust has `integer_literal`, Python has `integer`, TypeScript has `number`.
Developers building cross-grammar tools or writing grammar-agnostic code
have no stable vocabulary for common concepts.

Phase 1 (shipped) extracted `@comment` captures from `highlights.scm` to
discover trivia kinds. Phase 2 extends extraction to all semantic roles
and provides `ir.from.*` — a grammar-agnostic canonical factory namespace
that resolves to the right grammar-specific kind.

## Design

### Role extraction

Extend the SCM extraction pipeline to read BOTH `highlights.scm` AND
`tags.scm`, mapping captures to a canonical role vocabulary:

| Source | Capture | Role |
|--------|---------|------|
| highlights | `@comment` / `@comment.*` | `trivia` |
| highlights | `@string` / `@string.*` | `string` |
| highlights | `@number` / `@number.*` | `number` |
| highlights | `@type` / `@type.*` | `type` |
| highlights | `@variable` / `@variable.*` | `variable` |
| highlights | `@function` / `@function.*` | `function` |
| highlights | `@boolean` | `boolean` |
| tags | `@definition.function` | `definition.function` |
| tags | `@definition.class` | `definition.class` |
| tags | `@definition.method` | `definition.method` |
| tags | `@definition.module` | `definition.module` |
| tags | `@definition.interface` | `definition.interface` |
| tags | `@reference.call` | `reference.call` |

Sub-captures (e.g., `@string.special`, `@number.float`) map to the
same base role. The kind list for each role is deduplicated.

### `ir.from.*` canonical namespace

Codegen emits an `ir.from` sub-namespace per grammar with canonical
factory functions. Each function accepts a native value and resolves
to the grammar-specific kind:

```ts
// Usage
ir.from.boolean(true)        // → ir.booleanLiteral('true')
ir.from.number(42)           // → ir.integerLiteral('42')
ir.from.string("hello")      // → ir.stringLiteral('"hello"')
ir.from.comment("// note")   // → ir.lineComment('// note')
ir.from.type("String")       // → ir.typeIdentifier('String')
ir.from.identifier("main")   // → ir.identifier('main')
```

### Resolution rules per role

Each canonical factory has a resolution strategy based on the input
value type:

| Role | Input | Resolution |
|------|-------|------------|
| `boolean` | `boolean` | `true` → grammar's true-literal kind, `false` → false-literal kind. If grammar has a single `boolean_literal` kind, both map there. |
| `number` | `number` | Integer → integer-literal kind (`'42'`). Float → float-literal kind (`'3.14'`). If grammar has a single `number` kind, both map there. |
| `string` | `string` | Wraps in grammar's string-literal kind. Does NOT add quotes — the factory text is the raw content. |
| `trivia` / `comment` | `string` | Routes to line-comment kind if input starts with `//` or `#`, block-comment kind if starts with `/*`. |
| `type` | `string` | Routes to the grammar's type-identifier kind. |
| `variable` / `identifier` | `string` | Routes to the grammar's identifier kind. |

### Per-grammar resolution table

The extraction discovers which kinds fulfill each role. When multiple
kinds map to a role, the resolver needs a discriminator:

**Rust:**
```ts
ir.from.boolean(true)   → F.booleanLiteral('true')   // one kind
ir.from.number(42)      → F.integerLiteral('42')      // int vs float by input type
ir.from.number(3.14)    → F.floatLiteral('3.14')
ir.from.string("hello") → F.stringLiteral('hello')    // default to regular string
ir.from.comment("// x") → F.lineComment('// x')       // prefix detection
```

**Python:**
```ts
ir.from.boolean(true)   → F.true_()                   // true/false are keywords
ir.from.number(42)      → F.integer('42')
ir.from.number(3.14)    → F.float_('3.14')
ir.from.string("hello") → F.string_('hello')
ir.from.comment("# x")  → F.comment('# x')
```

**TypeScript:**
```ts
ir.from.boolean(true)   → F.true_()                   // true/false are keywords
ir.from.number(42)      → F.number('42')              // single number kind
ir.from.string("hello") → F.stringFragment('hello')   // or template_string
ir.from.comment("// x") → F.comment('// x')
```

### Emission

Codegen emits `ir.from.*` into the `ir.ts` emitter output per grammar:

```ts
// In generated ir.ts
export namespace from {
  export function boolean(value: boolean): T.BooleanLiteral {
    return F.booleanLiteral(value ? 'true' : 'false');
  }
  export function number(value: number): T.IntegerLiteral | T.FloatLiteral {
    return Number.isInteger(value)
      ? F.integerLiteral(String(value))
      : F.floatLiteral(String(value));
  }
  export function string(value: string): T.StringLiteral {
    return F.stringLiteral(value);
  }
  export function comment(text: string): T.LineComment | T.BlockComment {
    return text.startsWith('//')
      ? F.lineComment(text)
      : F.blockComment(text);
  }
  export function type(name: string): T.TypeIdentifier {
    return F.typeIdentifier(name);
  }
  export function identifier(name: string): T.Identifier {
    return F.identifier(name);
  }
}
```

Each function is tree-shakeable. The return types are grammar-specific
unions (typed per the discovered role kinds).

### What codegen needs per role

For each role, codegen needs:

1. **Kind list** — which grammar kinds fulfill this role (from SCM extraction)
2. **Discriminator** — how to pick the right kind from the input value:
   - `boolean`: `true` vs `false` → look for keyword kinds or enum values
   - `number`: integer vs float → `Number.isInteger()`
   - `comment`: line vs block → prefix detection (`//`, `#`, `/*`)
   - Single-kind roles (type, identifier): no discrimination needed
3. **Factory call** — the grammar-specific factory function name

Roles where all kinds are leaves (text-only) get simple `F.kindName(text)`
calls. Roles where kinds are branches get `.from()` calls.

### Data model

```ts
export type Role =
  | 'trivia' | 'string' | 'number' | 'boolean'
  | 'type' | 'variable' | 'function'
  | 'definition.function' | 'definition.class'
  | 'definition.method' | 'definition.module'
  | 'definition.interface' | 'reference.call';

export interface RoleEntry {
  role: Role;
  kinds: string[];           // grammar kinds fulfilling this role
  discriminator?: 'boolean-value' | 'number-type' | 'comment-prefix' | 'none';
}

export interface GrammarRoles {
  grammar: string;
  entries: RoleEntry[];
}
```

### Scope

**In scope:**
- Role extraction from highlights.scm + tags.scm
- `ir.from.*` emission for: boolean, number, string, comment, type, identifier
- Cross-grammar diagnostic (print which kinds map to which roles)
- Typed return types per grammar

**Out of scope:**
- `ir.from.functionDefinition(...)` or other definition-role factories
  (definitions are branch-shaped, not leaf-shaped — resolution is complex)
- Modifying the `$trivia()` system (already shipped)
- Expression roles (not extractable from SCM)

### Success criteria

- `ir.from.boolean(true).$render()` produces `true` in all three grammars
- `ir.from.number(42).$render()` produces `42` in all three grammars
- `ir.from.string("hello").$render()` produces `hello` in all three grammars
- `ir.from.comment("// note").$render()` produces `// note` in Rust/TS,
  `ir.from.comment("# note")` produces `# note` in Python
- Cross-grammar diagnostic runs and reports role→kind mappings
- All existing counts hold
- Type-check clean
