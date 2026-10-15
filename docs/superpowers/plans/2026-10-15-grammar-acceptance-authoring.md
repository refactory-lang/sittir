# Grammar Acceptance Authoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** sittir's parsers reject what each language's grammar productions exclude, take the upstream fixes already released, and port rust's open upstream fixes.

**Architecture:**
- A new rule cause, `reauthored('accepts-invalid-syntax', witnesses, body)`, is the mirror of `rejects-valid-syntax`. Each witness names the production that excludes its text, and the gate proves that upstream derives the form while the authored body does not.
- The pins come first, so authoring is written against the grammars it will ship on.
- Then one authoring stage per grammar, each a set of `grammar.sittir.ts` rules.
- Early errors (context, labels, strict mode, duplicate names) are not parser work. They are the stated bound of "valid by construction", and the contexts spec takes the context rules into the builder.

**Tech Stack:** the grammar DSL (`packages/codegen/src/dsl`), the rule-cause gate (`packages/codegen/src/compiler/diagnostics/rule-causes.ts`), web-tree-sitter, vitest, pnpm overrides.

**Spec:** the census, [docs/superpowers/probes/2026-10-15-grammar-over-acceptance/README.md](../probes/2026-10-15-grammar-over-acceptance/README.md). Every row this plan authors is a `production` row in its `witnesses.json` or `upstream-rows.json`, with the citation carried there.

## Global Constraints

- The line is the spec's own line. Author only what the language's grammar productions exclude: ECMAScript productions, the TypeScript 1.8 spec's productions for TypeScript-only syntax, Python's PEG grammar, the Rust Reference grammar.
- Early errors are out of scope, and so are tsc checker rules on syntax newer than the TypeScript 1.8 spec, CPython symtable and compiler errors, and rustc's AST validation and later checks.
- No context cloning: no rule is duplicated per enclosing context (`[Await]`, `[Yield]`, `[Return]`, loop, trait body).
- Each authored rule declares its cause. Over-acceptance rules use `accepts-invalid-syntax`, and ported upstream fixes use `rejects-valid-syntax`, each with its witnesses.
- Generated outputs are never hand-edited. Regenerate with `pnpm run validate:native`.
- PR branches never commit `validation-history.jsonl` or `test-history.jsonl` (`SITTIR_HISTORY_NO_COMMIT=1`). The rows go in the PR body.
- A corpus case that becomes ERROR because it is invalid syntax is replaced by a corrected `local.txt` entry, never kept by loosening the rule.

## Review Focus

1. **Valid input next to an excluded form.** Examples: `f(a = 1, b: number)` (a required parameter after a defaulted one is legal TypeScript), `def f(a, /, b, *, c=1, d)` (python keyword-only parameters may mix defaults), `set x(v) {}` with a destructuring pattern. Each stage's first test lists the valid neighbours of every excluded form, and they must still parse clean.
2. **Kinds and fields the authoring renames.** Splitting `method_definition` into accessor forms, or `formal_parameters` into a list and a rest, can move kinds, fields and factories. Any generated-surface change is a stop-and-report to brainstorm, not a fix-up.
3. **Corpus cases that were invalid all along.** A validator row that drops after an authoring task is checked against the language's compiler before anything else. If the compiler rejects the case, the corpus entry is corrected locally.
4. **Recovery shape.** An excluded form now yields ERROR, and the parse of the rest of the file must not degrade: the witness test asserts the ERROR stays local to the witness's own statement.
5. **The pins' conflicts.** JavaScript 0.25.0 renames two conflicts that TypeScript's grammar extends. Generation must report no unresolved conflict, and the TypeScript validator rows must not move.

---

## Stage 0: the `accepts-invalid-syntax` cause

### Task 0.1: the cause, its witnesses and its gate

**Files:**
- Modify: `packages/codegen/src/dsl/primitives/rule-cause.ts`
- Modify: `packages/codegen/src/compiler/diagnostics/rule-causes.ts` (`PROVOKING_CODES`, `judgeReauthored`, a new `judgeInvalidWitnesses`, `isWitnessVerified`)
- Modify: `docs/glossary/dsl-primitives.md`, `docs/glossary/compiler-diagnostics.md` (one `###` entry per new declaration, and the existing `isWitnessVerified` and `reauthored` entries)
- Test: `packages/codegen/src/compiler/diagnostics/__tests__/rule-causes.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface InvalidSyntaxWitness extends OtherKindWitness {
  	/** The production that excludes `text`, cited from the language's grammar. */
  	readonly production: string;
  }
  export function reauthored<F extends (...args: never[]) => unknown>(
  	cause: 'accepts-invalid-syntax',
  	witnesses: readonly [InvalidSyntaxWitness, ...InvalidSyntaxWitness[]],
  	body: F
  ): F;
  ```
  `RuleCauseDeclaration`'s reauthored arm gains `readonly witnesses?: readonly InvalidSyntaxWitness[]`.
- The witness reads the same way as `rejects-valid-syntax`'s, turned around:
  - `text` is source the language rejects and upstream's parser accepts;
  - `form` is its token sequence;
  - `kind` is the upstream rule that derives the form;
  - `production` cites the excluding production.
- One rule carries several witnesses because one rule excludes several forms. `formal_parameters` alone excludes five.

- [ ] **Step 1: Write the failing tests.**
  - A rule declared `accepts-invalid-syntax` whose witness form upstream does not derive is a `rule-cause-mismatch`: "upstream 'X' does not derive the witness form".
  - One whose authored body still derives the form is also a `rule-cause-mismatch`: "the authored rule still derives".
  - An empty `production` is a mismatch.
  - A correct declaration yields no diagnostic.
  - `isWitnessVerified` is true for the cause.
  - Model the tests on the existing `rejects-valid-syntax` cases in the same file.
- [ ] **Step 2: Run them and confirm they fail.**
  `pnpm exec vitest run packages/codegen/src/compiler/diagnostics/__tests__/rule-causes.test.ts`
- [ ] **Step 3: Implement.**
  - Add the overload and the type.
  - Add `'accepts-invalid-syntax': []` to `PROVOKING_CODES`.
  - Add `judgeInvalidWitnesses(grammar, name, witnesses, upstreamRules, authoredRules)`. For each witness, `derivesForm(upstreamRules, upstreamRules[w.kind], w.form)` must be true, and `derivesForm(authoredRules, authoredRules[w.kind], w.form)` must be false. `authoredRules` are the rules after `rules:` are applied, the same record `judgeReauthored` already reads for the rule names.
- [ ] **Step 4: Run the tests and confirm they pass.**
- [ ] **Step 5: Write the glossary entries.** Do not commit yet; Task 0.2 lands with this one.

### Task 0.2: the witness test reads sittir's parser too

**Files:**
- Modify: `packages/tools/src/__tests__/reauthor-witness.test.ts`

- [ ] **Step 1: Extend the case collection.** Push one case per entry of `declaration.witnesses`, with `cause: 'accepts-invalid-syntax'`.
- [ ] **Step 2: Assert both parsers.** For that cause:
  - upstream's parser has no error and contains `kind`;
  - sittir's `.sittir/parser.wasm` (from `loadParser(grammar)` in `validate/common.ts`) reports an error;
  - every ERROR node lies inside the witness's own top-level statement. That is Review Focus 4.
- [ ] **Step 3: Run the test.** It passes vacuously until a stage declares a witness. The first stage task fails it, as designed.
  `pnpm exec vitest run packages/tools/src/__tests__/reauthor-witness.test.ts`
- [ ] **Step 4: Commit Tasks 0.1 and 0.2 together.** Run the gates first: suite, type-check, lint and `validate:native`, whose rows must be unchanged since no grammar declares the cause yet.

## Stage 1: pins

### Task 1.1: JavaScript 0.25.0 under the TypeScript grammar

**Files:**
- Modify: `pnpm-workspace.yaml` (`overrides`)
- Modify: `packages/typescript/grammar.sittir.ts`, only if generation reports a conflict
- Test: the census witnesses for `js#350` and `js#355`

- [ ] **Step 1:** Add `'tree-sitter-typescript>tree-sitter-javascript': 0.25.0` to `overrides`, then `pnpm install`. Confirm the result with `readlink -f packages/typescript/node_modules/tree-sitter-typescript/node_modules/tree-sitter-javascript`, which must end in `@0.25.0`.
  - The externals are unchanged (`_automatic_semicolon`, `_template_chars`, `_ternary_qmark`, `html_comment`, `||`, `escape_sequence`, `regex_pattern`, `jsx_text`), so TypeScript's own `scanner.c` still matches.
- [ ] **Step 2:** Run `pnpm run validate:native`.
  - 0.25.0 replaces the conflict `[primary_expression, _property_name, arrow_function]` with three conflicts over `await_expression`.
  - It also adds `reserved` sets and `using_declaration`.
  - A conflict error goes into `grammar.sittir.ts` as an authored conflict, with its reason in the glossary.
- [ ] **Step 3:** Run the census:
  `pnpm exec tsx docs/superpowers/probes/2026-10-15-grammar-over-acceptance/census.mts`
  - `using x = f();` must parse as `using_declaration`.
  - `for (let of of [1]) {}` must bind `of`.
  - Every other TypeScript verdict is unchanged.
- [ ] **Step 4:** Rows that move are reported to brainstorm before committing (stop rule). New kinds (`using_declaration`) reach the vocabulary through the inventory check: `tool bindings-inventory --check`.

### Task 1.2: rust from the v0.24.2 tag

**Files:**
- Modify: `packages/rust/package.json` (`"tree-sitter-rust": "github:tree-sitter/tree-sitter-rust#v0.24.2"`)

- [ ] **Step 1:** Change the specifier and run `pnpm install`. The git package has no prebuilt `tree-sitter-rust.wasm`; Task 1.3 supplies the upstream judge.
- [ ] **Step 2:** Run `pnpm run validate:native`. Then run the census and expect `&raw[..]` (rust#277) to parse clean.
- [ ] **Step 3:** Report row movements as in Task 1.1.

### Task 1.3: the upstream judge is built from the pinned grammar

**Files:**
- Modify: `packages/tools/src/validate/common.ts` (`upstreamWasmPath`)
- Modify: the gen step that writes `.sittir/parser.wasm` (`packages/codegen/src/transpile/compile-parser.ts`)

Both pins make the prebuilt upstream wasm stale. TypeScript's wasm was built against JavaScript 0.23.1, and rust's git package ships no wasm at all. So "upstream's parser" stops meaning the grammar sittir builds on.

- [ ] **Step 1:** Generate and build the unmodified upstream grammar (`base.ts`'s export) to `packages/<g>/.sittir/upstream.wasm` in the same gen step, with the same tree-sitter CLI.
- [ ] **Step 2:** `upstreamWasmPath` returns that file. The package's own wasm is used only when that file is absent, and a missing file is an error that names the gen command.
- [ ] **Step 3:** Run the reauthor-witness test and the census. The existing witnesses (`export type *`, python `tuple`) must keep their verdicts.
- [ ] **Step 4:** Commit Stage 1 by pathspec, with the rows in the PR body.

## Stage 2: TypeScript authoring

Every task adds witnesses to one `reauthored('accepts-invalid-syntax', [...], body)` rule in `packages/typescript/grammar.sittir.ts`. Each witness's text and production are copied from the census row named below. The gate and the witness test prove each one. A task's first step is a test listing the excluded forms and their valid neighbours (Review Focus 1). That test goes in `packages/typescript/src/__tests__/acceptance.test.ts`: create it in Task 2.1, using sittir's parser to assert ERROR or clean.

### Task 2.1: accessor arity

**Rules:** `method_definition`, `method_signature`, `abstract_method_signature`.
**Census rows:** every `accessor-arity` row.

This task is the authoring the user has already ruled on: the getter's and the setter's own parameter rules, keeping the `get`/`set` field. Each rule becomes three arms:

```ts
method_definition: reauthored('accepts-invalid-syntax', [/* the six class and object accessor witnesses */], ($) =>
	prec.left(seq(
		optional($.accessibility_modifier), optional('static'), optional($.override_modifier), optional('readonly'),
		choice(
			seq(optional('async'), optional('*'), field('name', $._property_name), optional('?'), $._call_signature),
			seq('get', field('name', $._property_name), optional('?'), '(', ')', field('return_type', optional($.type_annotation))),
			seq('set', field('name', $._property_name), optional('?'), '(', field('parameter', $._setter_parameter), ')')
		),
		field('body', $.statement_block)
	))
),
```

- `_setter_parameter` is `seq(repeat(field('decorator', $.decorator)), field('pattern', choice($.identifier, $._destructuring_pattern)), field('type', optional($.type_annotation)))`. It has no `?`, no initializer and no rest, matching `SetAccessor` in the TypeScript 1.8 spec §4.5.
- Keep the field names the vocabulary binds today: check `packages/typescript/bindings.scm` for `method_definition` captures before choosing names.
- The getter and setter arms exclude `async` and `*`, which also covers the `async getter` row. `async` and `*` stay on the plain arm only.

- [ ] **Step 1:** Write the test.
  - Excluded: the eleven accessor rows plus `async get x() {}`.
  - Valid: `get x() {}`, `set x({ a }) {}`, `set x(v: number) {}`, `async *m() {}`, `get?() {}` (a method named `get`), and `static get x() {}`.
- [ ] **Step 2:** Run it and confirm the failures.
- [ ] **Step 3:** Author the three rules. Then run `pnpm run validate:native` and compare rows. Any kind or field change is reported (Review Focus 2).
- [ ] **Step 4:** Run the test, the reauthor-witness test and the rule-cause test.
- [ ] **Step 5:** Commit.

### Task 2.2: parameter lists and binding patterns

**Rules:** `formal_parameters`, `array_pattern`, `object_pattern`.
**Census rows:** `rest parameter not last`, `rest parameter with an initializer`, `rest parameter with a trailing comma`, `optional rest parameter`, `required parameter after an optional one`, `arrow rest parameter not last`, and the three binding-pattern rest rows.

```ts
formal_parameters: reauthored('accepts-invalid-syntax', [/* six witnesses */], ($) =>
	seq('(', optional(choice(
		seq(commaSep1($.required_parameter_nonrest), optional(seq(',', commaSep1($.optional_parameter))),
			optional(choice(',', seq(',', $.rest_parameter)))),
		seq(commaSep1($.optional_parameter), optional(choice(',', seq(',', $.rest_parameter)))),
		$.rest_parameter
	)), ')')
),
```

- `rest_parameter` is `seq(repeat(field('decorator', $.decorator)), field('pattern', $.rest_pattern), field('type', optional($.type_annotation)))`.
- `required_parameter_nonrest` is `required_parameter` with `pattern` limited to the non-rest patterns.
- A required parameter with an initializer stays in the first list. TypeScript allows `f(a = 1, b: number)`, and only `?` makes a parameter optional (TypeScript 1.8 spec §3.9.2).
- Arrow functions reuse `formal_parameters`, so they need no rule of their own.
- `array_pattern`: elements, then optionally `, rest` with no trailing comma (ECMAScript 14.3.3 ArrayBindingPattern).
- `object_pattern`: properties, then optionally `, rest` with no trailing comma.
- Destructuring assignment shares these rules, which is correct: ECMAScript's AssignmentPattern has the same rest-last form.
- Prefer `alias` to an existing kind over minting new visible kinds. A minted kind is a generated-surface change (Review Focus 2).

- [ ] **Steps 1–5:** As in Task 2.1.
  - Valid neighbours: `f(a = 1, b: number)`, `f(a?: number, ...r: number[])`, `f(...r)`, `f(a,)`, `const [a, ...r] = x`, `const { a, ...r } = x`, and `[a, , b] = x`.

### Task 2.3: member and declaration placement

**Census rows and rules:**

| row | rule | authored constraint | production |
| --- | --- | --- | --- |
| static in an interface | the interface body's member list (`object_type_content`, already authored) | its `property_signature` and `method_signature` items use forms without `static`; the class body keeps its own | TypeScript 1.8 spec §3.9 TypeMember |
| optional method in an object literal | `object` | its method arm is a `method_definition` form without `?` | ECMAScript 13.2.5 |
| decorator on a function declaration or an interface | `export_statement` (already authored) | the decorator arm's declaration is limited to `class_declaration` and `abstract_class_declaration` | TC39 decorators grammar |
| ambient function with a body | `ambient_declaration` | its `declaration` choice drops `function_declaration` and `generator_function_declaration`; `function_signature` stays | TypeScript 1.8 spec §12.1.2 |
| class extends two classes | `extends_clause` | one `_extends_clause_single`; interfaces use `extends_type_clause`, which is untouched | ECMAScript 15.7 ClassHeritage |
| two default clauses | `switch_body` | `seq('{', repeat(case), optional(seq(default, repeat(case))), '}')` | ECMAScript 14.12 CaseBlock |
| private name in an object literal | `object` (pair key, method name) | `_property_name` without `private_property_identifier` | ECMAScript 13.2.5 PropertyName |

- [ ] **Steps 1–5 per row group:** As in Task 2.1. Commit after each row group, so a reviewer can reject one row and approve its neighbour.

### Task 2.4: module items

**Rules:** `program` and `statement`.
**Census rows:** `import inside a block` and `export inside a function`.
**Production:** ECMAScript 16.2: ImportDeclaration and ExportDeclaration are only ModuleItems.

- `program` takes `choice($.statement, $.import_statement, $.export_statement)`, and `statement` drops both.
- This changes `statement`'s supertype membership, which the vocabulary and the bindings read. Before authoring, run `tool bindings-inventory --check` against a draft and report what moves to brainstorm. This task stops for a ruling if anything moves.
- `declare module "m" { import … }` and `namespace N { export … }` must stay valid. Their bodies take module items, so those bodies use the same item choice as `program`.

### Task 2.5: `new` with an optional chain

**Rule:** `new_expression`.
**Production:** ECMAScript 13.3: OptionalExpression is not a MemberExpression.

- The constructor needs a member-expression form without an optional chain at any depth. That is a chain-free copy of `member_expression`, `subscript_expression` and `call_expression`'s object side.
- Measure parser states before and after (`pnpm exec tsx packages/cli/src/cli.ts tool --help` lists the state census). Report the cost before committing.
- This is the one TypeScript row whose authoring copies a rule family. If the cost is large, it goes to brainstorm as a choice between authoring it and listing it in the bound.

## Stage 3: Python authoring

The same pattern applies, in `packages/python/grammar.sittir.ts`, with the test in `packages/python/src/__tests__/acceptance.test.ts`.

### Task 3.1: parameter order

**Rules:** `parameters`, `lambda_parameters` (both read `_parameters`).
**Census rows:** the seven `parameter-order` production rows.
**Production:** Python's PEG grammar, `parameters`, `star_etc` and `kwds`.

Transcribe the PEG grammar into `_parameters`:

```text
parameters:
    | slash_no_default param_no_default* param_with_default* [star_etc]
    | slash_with_default param_with_default* [star_etc]
    | param_no_default+ param_with_default* [star_etc]
    | param_with_default+ [star_etc]
    | star_etc
star_etc:
    | '*' param_no_default param_maybe_default* [kwds]
    | '*' ',' param_maybe_default+ [kwds]
    | kwds
kwds: '**' param_no_default
```

- `param_no_default` is `identifier | typed_parameter | tuple_pattern`.
- `param_with_default` is `default_parameter | typed_default_parameter`.
- Separators are tree-sitter's existing `positional_separator`, `keyword_separator`, `list_splat_pattern` and `dictionary_splat_pattern`, with commas between items and one optional trailing comma.
- Lambda parameters take no annotations. Python's `lambda_parameters` is the same structure over `lambda_param`, so `lambda_parameters` uses the same authored rule with the typed forms excluded.

- [ ] **Steps 1–5:** As in Task 2.1.
  - Valid neighbours: `def f(a, /, b, *, c=1, d)`, `def f(*, a)`, `def f(*a, b=1, **k)`, `def f(a=1, /, b=2)`, and `lambda *a, **k: 0`.

### Task 3.2: argument order

**Rule:** `argument_list`.
**Census rows:** `positional argument after a keyword argument` and `*args after **kwargs`.
**Production:** PEG `args` and `kwargs`: positional and `*` arguments come first, then `kwarg_or_starred`, then `kwarg_or_double_starred`.

- Keep the generator-expression call form (`f(x for x in y)`), which is a separate production.
- Valid neighbours: `f(*a, b, k=1, *c, **d)` and `f(k=1, *a)`. A starred argument after a keyword argument is legal.

### Task 3.3: assignment and deletion targets

**Rules:** `delete_statement` and `augmented_assignment`.
**Census rows:** `del of a call` and `augmented assignment to a tuple`.
**Production:** PEG `del_targets` (a name, an attribute, a subscript, or a parenthesized or bracketed group of them) and `single_target`.

- Valid neighbours: `del a, b.c, d[0], (e), [f]` and `a.b += 1`.

### Task 3.4: tracker row py#178

**Rule:** the expression statement's line ending.
**Production:** the PEG grammar's NEWLINE ends a simple statement.

- tree-sitter-python already emits `_newline` from its external scanner. Find where the binary-expression continuation lets a newline through: inspect `x = 1 +\n2` with `tool probe-kind`.
- If the fix is in the scanner, report it, as in the rust#316 question below; no scanner change is authored here.

## Stage 4: Rust authoring and ports

The work is in `packages/rust/grammar.sittir.ts`, with the test in `packages/rust/src/__tests__/acceptance.test.ts`. Ports declare `rejects-valid-syntax`, with the PR's own test-corpus case as the witness. Each port is authored against the v0.24.2 rule as pinned in Stage 1; the PR diffs are against upstream master.

### Task 4.1: ports

| PR | rule | change | witness |
| --- | --- | --- | --- |
| rust#312 | `binary_expression` | the comparative arm's `'<='` becomes `token(prec(2, '<='))` | `a as core::primitive::u64 <= b` |
| rust#256 | `foreign_mod_item`, `static_item`, `function_modifiers` | `function_modifiers` becomes `choice(_item_modifiers, extern_modifier, seq(_item_modifiers, extern_modifier))`; `_item_modifiers` is `repeat1` over `async`, `default`, `const`, `unsafe`, `safe`; `foreign_mod_item` takes optional visibility and item modifiers; `static_item` takes optional `unsafe` or `safe`; the conflict `[foreign_mod_item, function_modifiers]` goes | `unsafe extern "C" { safe fn f(); }` |
| rust#282 | `closure_parameters` | `optional(',')` before the closing `'|'` | `\|a, b,\| a` |
| rust#271 | `struct_item` | the unit arm becomes `seq(optional($.where_clause), ';')` | `struct S<T> where T: Copy;` |
| rust#319 | `field_pattern` | `repeat($.attribute_item)` first | `let S { #[a] x } = s;` |
| rust#317 | `token_tree` punctuation | `'~'` joins the non-special punctuation | `m!(~)` |
| rust#305 (mis-parse) | `range_expression` | the prefix arm becomes `prec.right(PREC.range + 1, seq('..', $._expression))` | `..*x` |

- Task 4.2 rewrites `function_modifiers` again for order. Do rust#256 first, and Task 4.2 then authors order over `_item_modifiers`.
- rust#301 duplicates rust#319's attribute half. Its turbofish half is a separate change and waits for a tracker row.

- [ ] **Steps:** one commit per PR, each with its witness test and the PR's corpus case added to `local.txt`.

### Task 4.2: production rows

| row | rule | authored constraint | production |
| --- | --- | --- | --- |
| `self` parameter not first | `parameters` | `self_parameter` only as the first item | Rust Reference, Functions: FunctionParameters |
| `unsafe unsafe`, `async` before `const` | `_item_modifiers` (from rust#256) | `seq(optional('default'), optional('const'), optional('async'), optional(choice('unsafe', 'safe')))` with at least one present | Rust Reference, Functions: FunctionQualifiers |

- `default` is the specialization modifier and precedes the qualifiers in rustc's parser. Check that `default unsafe fn` and `const unsafe fn` stay valid, and that `const async fn` still parses: the Reference admits it, and rustc rejects it later.

## Open questions

These are listed for brainstorm; none of them blocks Stages 0–1.

1. **Under-acceptance and mis-parse rows other than rust's ports.**
   - Typescript route 2 has open PRs: variance annotations (ts#364), `import()` type members (ts#365) and method decorators (ts#310).
   - Typescript route 3 has no PR: a member named `accessor`, call signatures over line breaks, and `type` as an export name.
   - Python: PEP 696 defaults.
   - Rust: two attributes on a parameter.

   They are productions by definition, since the input is valid. Should this plan take them, one task per row in each grammar's stage?
2. **rust#316 (block comments with multibyte characters) changes the external scanner.**
   - `grammar.sittir.ts` cannot express it, and sittir builds upstream's `scanner.c` as is.
   - Options: (a) wait for an upstream release; (b) pin a fork commit with the fix; (c) give sittir a scanner patch mechanism.
   - The same question covers the line break before an arrow (`[no LineTerminator here]`), and the TypeScript ASI row ts#373.
3. **The witness list shape.**
   - `accepts-invalid-syntax` takes a non-empty array of witnesses, unlike the other causes' single witness, because one rule excludes several forms.
   - Recommended: the array for this cause only. Alternative: every witnessed cause takes an array.
