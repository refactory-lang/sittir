# Render Options — Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each grammar package a generated `Options` catalog — every slot a user may default or format, with its allowed values — and put the grammar-side facts it derives from in place: named choice slots, declared defaults, and the whitespace-bearing separator kinds.

**Architecture:** This is plan 1 of the render-options series and stays on the grammar and codegen side. It renames the choice slots the catalog keys on, declares the grammar's own default arm for each, registers `comma_space`/`newline`-style kinds as never-scanned externals so they carry parser ids, and adds one emitter that derives `packages/<g>/src/options.ts` from the node map. Nothing renders differently at the end of this plan; the reader stamps, the render path and the engine API are plans 2 to 4 and consume this catalog.

**Tech Stack:** TypeScript (ESM, `.ts` imports), the sittir codegen pipeline (`packages/codegen/src`), tree-sitter grammars via `packages/<g>/grammar.sittir.ts`, vitest.

**Spec:** `docs/superpowers/specs/2026-09-04-render-options-design.md`

## Global Constraints

- Generated outputs are never hand-edited: `packages/{rust,typescript,python}/src/*`, `templates/*.jinja`, `.sittir/*`, `rust/crates/sittir-*/templates` and `test-fixtures.json` come from `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src`.
- Explanatory comments do not go in `packages/codegen/src/`; new declarations get a `###` entry in `docs/glossary/<dir>.md` instead.
- No comment or doc references a spec, plan, PR or task number.
- `patches:` in a `grammar.sittir.ts` is one object literal — a second entry for the same kind silently replaces the first. Run the duplicate-key census before every regen (Task 1, step 4).
- Every kind has a parser-issued kindId; the phantom ratchet (`packages/codegen/src/__tests__/phantom-kind-ratchet.test.ts`) may only go down.
- Gates after every regen, in this order, numbers compared not eyeballed: `pnpm run type-check` (0 errors) and `pnpm run type-check:examples`; the six dogfood renders (706 / 542 / 203 chars strict, 2175 / 470 / 196 loose); `pnpm exec tsx packages/cli/src/cli.ts validate counts` then `validate history` (identical unless the task says which metric moves and why); `cd packages/codegen && pnpm exec vitest run` (14 failed / 1113 passed baseline in `baseline-diff`, `strict-terminal`, `render-module-emit`, `roundtrip` only); `cd packages/<g> && pnpm exec vitest run` for each touched grammar (green).
- `validate counts` auto-commits a `chore(validator)` record onto the current branch; that is expected.
- After any vitest run, regenerate python before validating (the roundtrip tests rewrite `packages/python/.sittir/grammar.js`).
- When a regen mints a NEW output file, `git add` it and regenerate once more before committing: the manifest is built from `git ls-files`, and the pre-commit hook rejects `EXTRA` files.
- Commit with explicit pathspecs. Never stage `**/node_modules/**`, `examples/01-construct-nodes.ts`, `docs/superpowers/handoffs/*`, `packages/types/.vitest-report.json`, or the untracked `*-roles.scm` / `sittir-role-interfaces-scm-spec.md` files.
- Branch: `spec/render-options` (stacked on `fix/field-wrap-arm-scope`). Each task is one commit.

---

## File structure

| File | Responsibility |
| --- | --- |
| `packages/typescript/grammar.sittir.ts` | slot rename `semicolon` → `terminator`; declared defaults; whitespace externals |
| `packages/rust/grammar.sittir.ts` | whitespace externals |
| `packages/python/grammar.sittir.ts` | whitespace externals |
| `packages/codegen/src/emitters/options.ts` (new) | derive the option catalog from the node map and emit `options.ts` |
| `packages/codegen/src/emitters/__tests__/emitter-options.test.ts` (new) | unit tests for the derivation rules on a fixture node map |
| `packages/codegen/src/emitters/emit.ts`, `packages/codegen/src/compiler/generate.ts`, `packages/codegen/src/run-codegen.ts`, `packages/codegen/src/emitters/index-file.ts` | wire the emitter into the pipeline and export the type |
| `packages/codegen/src/__tests__/externals-inert.test.ts` (new) | proves the new externals never enter the parse tables |
| `packages/<g>/tests/options-catalog.test.ts`, `packages/<g>/tests/options-types.test.ts` (new, ×3) | catalog snapshot; one valid and one invalid literal per key family |
| `docs/glossary/emitters.md` | entries for every new declaration in `options.ts` |
| `examples/18-dogfood-typescript.ts`, `examples/18-dogfood-typescript-strict.ts` | the `semicolon:` key becomes `terminator:` |

---

### Task 1: The typescript terminator slot

The catalog keys a real choice by `kind_slot`. Every typescript statement kind whose `;`-or-automatic-semicolon choice sits in a slot named `semicolon` gets the slot named `terminator`, the name `class_body`'s members already use.

**Files:**
- Modify: `packages/typescript/grammar.sittir.ts` (the `patches:` block)
- Modify: `examples/18-dogfood-typescript.ts:75`, `examples/18-dogfood-typescript-strict.ts:51`
- Test: `packages/typescript/tests/api-surface.test.ts` snapshot (refreshed, diff read)

**Interfaces:**
- Produces: slot `terminator` on `import_statement`, `expression_statement`, `variable_declaration`, `lexical_declaration`, `do_statement`, `break_statement`, `continue_statement`, `debugger_statement`, `return_statement`, `throw_statement`, `function_signature`, `import_alias`, `type_alias_declaration`, `_ambient_declaration_module`, `_class_body_method`, `_export_statement_type_export`, `_export_statement_equals_export`, `_export_statement_namespace_export`. Task 3 and Task 5 rely on exactly this slot name.

- [ ] **Step 1: Record the slot census before the change**

Run:
```bash
pnpm exec tsx packages/cli/src/cli.ts tool field-provenance -g typescript 2>/dev/null | awk -F'\t' '$3=="semicolon"{print $1"\t"$2"\t"$3"\t"$4}' | tee /tmp/ts-semicolon-before.tsv | wc -l
```
Expected: 19 rows (the list in Interfaces; `statement_block` and `class_declaration` carry `automatic_semicolon`, a single external, and are not in it).

- [ ] **Step 2: Rename every `field('semicolon')` patch to `field('terminator')`**

In `packages/typescript/grammar.sittir.ts`, inside `patches:`, change each of these entries (exact current text on the left):

| kind | current | new |
| --- | --- | --- |
| `import_alias` | `4: field('semicolon')` | `4: field('terminator')` |
| `import_statement` | `4: field('semicolon')` | `4: field('terminator')` |
| `lexical_declaration` | `2: field('semicolon')` | `2: field('terminator')` |
| `variable_declaration` | `2: field('semicolon')` | `2: field('terminator')` |
| `expression_statement` | `1: field('semicolon')` | `1: field('terminator')` |
| `type_alias_declaration` | `5: field('semicolon')` | `5: field('terminator')` |
| `return_statement` | `2: field('semicolon')` | `2: field('terminator')` |
| `throw_statement` | `2: field('semicolon')` | `2: field('terminator')` |
| `break_statement` | `2: field('semicolon')` | `2: field('terminator')` |
| `continue_statement` | `2: field('semicolon')` | `2: field('terminator')` |
| `debugger_statement` | `1: field('semicolon')` | `1: field('terminator')` |
| `do_statement` | `4: field('semicolon')` | `4: field('terminator')` |
| `function_signature` | `4: field('semicolon')` | `4: field('terminator')` |
| `class_body` (first set) | `'1/0/0/2': field('semicolon')` | `'1/0/0/2': field('terminator')` |

Then add entries for the four positions enrich named, and for the ambient module arm. Add them as new keys next to `_export_statement_default` (none of these kinds has a `patches` entry yet — verify with the census in step 4):

```ts
				_export_statement_type_export: { 4: field('terminator') },
				_export_statement_equals_export: { 3: field('terminator') },
				_export_statement_namespace_export: { 3: field('name'), 4: field('terminator') },
				_ambient_declaration_module: { '5/0': field('terminator') },
```

`_export_statement_namespace_export` already has `{ 3: field('name') }` from the arm-naming work: merge the `4:` entry into that existing object rather than adding a second key.

- [ ] **Step 3: Update the two examples**

`examples/18-dogfood-typescript.ts:75`:
```ts
	return ir.statement.return({ expression: 'result', terminator: ';' });
```
`examples/18-dogfood-typescript-strict.ts:51`:
```ts
		terminator: ';',
```
Also update the comment on `examples/18-dogfood-typescript.ts:12` and `:26` to say `terminator` where they say `semicolon`.

- [ ] **Step 4: Duplicate-key census, then regenerate typescript**

Run:
```bash
awk '/^\t\t\tpatches: \{/{p=1;next} p&&/^\t\t\t\},?$/{p=0} p&&/^\t\t\t\t[A-Za-z_][A-Za-z0-9_]*: /{sub(/:.*/,"",$1); c[$1]++} END{for(k in c) if(c[k]>1) print "DUPLICATE", k, c[k]}' packages/typescript/grammar.sittir.ts
SITTIR_QUIET=1 pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src 2>&1 | tail -3
pnpm exec tsx packages/cli/src/cli.ts tool field-provenance -g typescript 2>/dev/null | awk -F'\t' '$3=="semicolon"||$3=="terminator"{print $1"\t"$2"\t"$3"\t"$4}'
```
Expected: no `DUPLICATE` lines; `Done! Generated:`; every row from step 1 now reads `terminator`, plus the two pre-existing `_class_body_*` `terminator` rows; zero `semicolon` rows.

- [ ] **Step 5: Gates**

Run:
```bash
pnpm run type-check 2>&1 | awk '/error TS/{c++} END{print "TS errors:", c+0}'
pnpm run type-check:examples 2>&1 | awk '/error TS/' | head
cd packages/typescript && pnpm exec vitest run -u 2>&1 | awk '/Tests  |Snapshots|^ FAIL /'; cd ../..
git diff -U0 -- packages/typescript/tests/__snapshots__ | awk '/^[-+] /'
```
Expected: `TS errors: 0`; no example errors; typescript suite all passed, 1 snapshot updated; the snapshot diff is only `resolve<Kind>_semicolon` → `resolve<Kind>_terminator` pairs.

Then render the examples and run the validator:
```bash
cat > /tmp/run-examples.ts <<'EOF'
import { renderText } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/examples/helpers.ts';
import { rebuildSpliceStrict } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/examples/17-dogfood-rust-strict.ts';
import { rebuildSplice } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/examples/17-dogfood-rust.ts';
import { rebuildFormatStrict } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/examples/18-dogfood-typescript-strict.ts';
import { rebuildFormat } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/examples/18-dogfood-typescript.ts';
import { rebuildProbeSweepStrict } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/examples/19-dogfood-python-strict.ts';
import { rebuildProbeSweep } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/examples/19-dogfood-python.ts';
for (const [n, f] of Object.entries({ rebuildSpliceStrict, rebuildSplice, rebuildFormatStrict, rebuildFormat, rebuildProbeSweepStrict, rebuildProbeSweep }))
	console.log(n, renderText((f as () => unknown)()).length);
EOF
pnpm exec tsx /tmp/run-examples.ts
pnpm exec tsx packages/cli/src/cli.ts validate counts > /tmp/validate.log 2>&1; pnpm exec tsx packages/cli/src/cli.ts validate history | tail -6
```
Expected: 706, 2175, 542, 470, 203, 196; validator rows identical to the previous three (a slot rename changes no metric).

- [ ] **Step 6: Commit**

```bash
git add -- packages/typescript/grammar.sittir.ts packages/typescript/src packages/typescript/.sittir packages/typescript/templates packages/typescript/tests rust/crates/sittir-typescript examples/18-dogfood-typescript.ts examples/18-dogfood-typescript-strict.ts packages/tools/validation-report.json
git commit -m "feat(typescript): the statement terminator slot is named for its role

Every kind whose ;-or-automatic-semicolon choice sat in a slot called
semicolon now calls it terminator, the name class_body's members already
used. The render options catalog keys the choice by kind_slot, and a
terminator is what the slot holds."
```

---

### Task 2: (withdrawn) a discriminating `quote` slot on both string arms

Attempted and withdrawn. Fielding the two opening quotes under one name
makes enrich's field-enum synthesis merge them into a single `_kw_quote =
choice('"', "'")` shared by both arms, so each arm would accept either quote
and `tree-sitter generate` reports an unresolved conflict between the two
string repeats; `inline:` would only make that silent. A root-level form
split is therefore keyed by the parent's own `content` slot
(`string_content: 'double' | 'single'`), which Task 5's `rootSplitEntry`
implements without any grammar change. Nothing to do here.

---

### Task 3: Declared defaults for the two typescript choices

The catalog only lists a real choice the grammar declares a default for. `impl_item.trait_clause` in rust already declares one with `arm.default`; typescript's terminator and string quote do not yet.

**Files:**
- Modify: `packages/typescript/grammar.sittir.ts`

**Interfaces:**
- Consumes: `arm.default` from `../codegen/src/dsl/index.ts` (already imported as `arm` in the rust config; add `arm` to the typescript import if absent).
- Produces: `default: true` on the `;` value of every `terminator` slot and on the `double` arm of `string`'s `content` slot, visible in `packages/typescript/src/node-model.json5`.

- [ ] **Step 1: Check what a bare loose construction picks today**

```bash
cat > /tmp/probe-default.ts <<'EOF'
import { ir } from '/Users/pmouli/GitHub.nosync/refactory-lang/sittir/packages/typescript/src/index.ts';
console.log(JSON.stringify([
	ir.returnStatement({ expression: 'x' }).$render(),
	ir.expressionStatement({ expression: 'f()' }).$render(),
]));
EOF
pnpm exec tsx /tmp/probe-default.ts
```
Record the output. Whatever it is, it is the behaviour a declared default is allowed to change in step 4, and the change must be exactly "the `;` arm is now chosen".

- [ ] **Step 2: Declare the defaults**

`_semicolon` is `choice(alias(_automatic_semicolon → automatic_semicolon), ';')`, so arm 1 is the `;`. Add to `patches:`:
```ts
				_semicolon: { 1: arm.default },
```
and extend the `string` entry with a second patch set so the default is
declared after the variants exist:
```ts
				string: [{ 0: variant('double'), 1: variant('single') }, { 0: arm.default }],
```
Ensure `arm` is in the import list at the top of the file:
```ts
import { enrich, field, alias, variant, arm, wire } from '../codegen/src/dsl/index.ts';
```
(Match the file's actual import line; add `arm` to it.)

- [ ] **Step 3: Regenerate and verify the stamps**

`node-model.json5` does not serialize `default`; the fact lives on the
assembled slot values and is read there by the from-emitter and the catalog
emitter. Witness it on the rule tree the assembler consumes:

```bash
SITTIR_QUIET=1 pnpm exec tsx packages/cli/src/cli.ts gen --grammar typescript --all --output packages/typescript/src 2>&1 | tail -2
SITTIR_QUIET=1 pnpm exec tsx packages/cli/src/cli.ts tool probe-stages --grammar typescript --kind return_statement --skip-emit --compact 2>/dev/null | python3 -c "
import json,sys; s=json.dumps(json.load(sys.stdin)['simplify']); i=s.find('\"default\": true'); print('terminator ; carries default:', i>=0 and '\"value\": \";\"' in s[i-120:i])"
git diff -U0 -- packages/typescript/src/factories/coerce.ts | awk '/^[-+]/ && !/^(\+\+\+|---)/'
```
Expected: `terminator ; carries default: True`; the coercer diff shows
`resolveString_content` gaining `'_string_double'` as the default arm.

The `;` is a literal arm. `deriveValuesForRule`'s `STRING`/`PATTERN` case
must spread `armFactsOf(rule)` the way the `SYMBOL` case does, or the
annotation is dropped at the value; if `packages/codegen/src/compiler/model/node-map.ts`
does not yet do so, add it, add a unit test under
`packages/codegen/src/compiler/__tests__/` asserting a `STRING` arm
annotated `{ default: true }` yields a value with `default: true`, and
regenerate all three grammars (the manifests hash `packages/codegen/src/**`).

- [ ] **Step 4: Gates**

```bash
pnpm exec tsx /tmp/probe-default.ts
pnpm exec tsx /tmp/run-examples.ts
pnpm run type-check 2>&1 | awk '/error TS/{c++} END{print "TS errors:", c+0}'
cd packages/typescript && pnpm exec vitest run 2>&1 | awk '/Tests  |^ FAIL /'; cd ../..
pnpm exec tsx packages/cli/src/cli.ts validate counts > /tmp/validate.log 2>&1; pnpm exec tsx packages/cli/src/cli.ts validate history | tail -3
```
Expected: the probe behaves exactly as in step 1 — a declared default is a
fact for the catalog; filling an omitted slot from it is the construction
tier of a later plan, so `return_statement.from()` without a terminator
still throws today. Example sizes 706 / 2175 / 542 / 470 / 203 / 196; 0 TS
errors; suite green; validator identical.

- [ ] **Step 5: Commit**

```bash
git add -- packages/typescript/grammar.sittir.ts packages/typescript/src packages/typescript/.sittir packages/typescript/templates rust/crates/sittir-typescript packages/tools/validation-report.json
git commit -m "feat(typescript): the grammar declares its default terminator and quote

A bare statement takes the ; arm and a bare string the double-quoted form.
These are the grammar's own preferences; an engine's options may override
them per construction."
```

---

### Task 4: Whitespace-bearing separator kinds

`comma_space`, `comma_newline`, `space`, `newline` (and the semicolon pair where a grammar has `;`-separated lists) become externals the scanner never emits. They gain parser ids and render text and appear in no rule.

**Files:**
- Modify: `packages/rust/grammar.sittir.ts`, `packages/typescript/grammar.sittir.ts`, `packages/python/grammar.sittir.ts` (`externals` and `visibleExternals` in the `wire({…})` config)
- Create: `packages/codegen/src/__tests__/externals-inert.test.ts`

**Interfaces:**
- Produces, per grammar, kinds with ids and render text: rust `_comma_space` `", "`, `_comma_newline` `",\n"`, `_semicolon_space` `"; "`, `_semicolon_newline` `";\n"`, `_space` `" "`, `_newline` `"\n"`; typescript `_comma_space`, `_comma_newline`, `_space`, `_newline`; python `_comma_space`, `_comma_newline`, `_semicolon_space`, `_semicolon_newline`, `_space` (python's `_newline` is real and already declared). Task 5 maps whitespace classes onto these names.

- [ ] **Step 1: Write the inertness test**

`packages/codegen/src/__tests__/externals-inert.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const NEVER_SCANNED: Record<string, readonly string[]> = {
	rust: ['_comma_space', '_comma_newline', '_semicolon_space', '_semicolon_newline', '_space', '_newline'],
	typescript: ['_comma_space', '_comma_newline', '_space', '_newline'],
	python: ['_comma_space', '_comma_newline', '_semicolon_space', '_semicolon_newline', '_space']
};

function parserSource(grammar: string): string {
	return readFileSync(join(process.cwd(), 'packages', grammar, '.sittir', 'src', 'parser.c'), 'utf8');
}

describe('whitespace externals are catalogued but never parsed', () => {
	for (const [grammar, names] of Object.entries(NEVER_SCANNED)) {
		it(`${grammar}: each symbol has an id and no parse-table entry`, () => {
			const source = parserSource(grammar);
			const tables = source.slice(source.indexOf('static const uint16_t ts_parse_table'));
			for (const name of names) {
				expect(source, `${name} missing from ts_symbol_identifiers`).toMatch(new RegExp(`sym${name} = \\d+,`));
				expect(tables, `${name} appears in the parse tables`).not.toContain(`sym${name}`);
			}
		});
	}
});
```

- [ ] **Step 2: Run it to see it fail**

```bash
cd packages/codegen && pnpm exec vitest run src/__tests__/externals-inert.test.ts 2>&1 | awk '/✓|×|Tests  /'; cd ../..
```
Expected: 3 failed, each on "missing from ts_symbol_identifiers".

- [ ] **Step 3: Register the externals and their render text**

Rust — `packages/rust/grammar.sittir.ts` has no `externals` or `visibleExternals` key. Add both inside the `wire({ … })` config object, after `conflicts:`:
```ts
			externals: ($, previous) => [
				...(previous ?? []),
				$._comma_space,
				$._comma_newline,
				$._semicolon_space,
				$._semicolon_newline,
				$._space,
				$._newline
			],
			visibleExternals: (_$) => ({
				_comma_space: string(', '),
				_comma_newline: string(',\n'),
				_semicolon_space: string('; '),
				_semicolon_newline: string(';\n'),
				_space: string(' '),
				_newline: string('\n')
			}),
```
(`string` is already declared in the file: `declare const string: (value: string) => unknown;`.)

Typescript — extend the existing `visibleExternals` and add `externals`:
```ts
			externals: ($, previous) => [...(previous ?? []), $._comma_space, $._comma_newline, $._space, $._newline],
			visibleExternals: (_$) => ({
				_automatic_semicolon: string('\n'),
				_function_signature_automatic_semicolon: string('\n'),
				_comma_space: string(', '),
				_comma_newline: string(',\n'),
				_space: string(' '),
				_newline: string('\n')
			}),
```

Python — the existing `externals` callback calls `role(...)` and returns `prev`; return the extended list instead, and extend `visibleExternals`:
```ts
			externals: ($, prev) => {
				role($._indent, 'indent');
				role($._dedent, 'dedent');
				role($._newline, 'newline');
				return [
					...(prev ?? []),
					$._comma_space,
					$._comma_newline,
					$._semicolon_space,
					$._semicolon_newline,
					$._space
				];
			},
			visibleExternals: (_$) => ({
				_newline: string('\n'),
				_comma_space: string(', '),
				_comma_newline: string(',\n'),
				_semicolon_space: string('; '),
				_semicolon_newline: string(';\n'),
				_space: string(' ')
			}),
```
Python's `prev` contains string externals (`']'`, `')'`, `'}'`, `'except'`); the spread keeps them in place. New entries append after every upstream one, so the scanner's own indices are untouched.

- [ ] **Step 4: Regenerate all three grammars**

```bash
for g in rust typescript python; do SITTIR_QUIET=1 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src > /tmp/gen-$g.log 2>&1; echo "$g exit=$?"; done
awk '/Error|error\[|Undefined symbol|Unresolved conflict/' /tmp/gen-*.log | head
```
Expected: three `exit=0`, no error lines. If `tree-sitter generate` rejects an external as undefined, the DSL runtime needs the symbol declared as a rule-less external; check `packages/codegen/src/dsl/wire/wire.ts` line ~353 (`externals.has(hiddenName)`) which exempts externals from placeholder injection, and report rather than defining a dummy rule.

- [ ] **Step 5: Inertness test, phantom ratchet, catalog presence**

```bash
cd packages/codegen && pnpm exec vitest run src/__tests__/externals-inert.test.ts src/__tests__/phantom-kind-ratchet.test.ts 2>&1 | awk '/✓|×|Tests  /'; cd ../..
for g in rust typescript python; do echo "== $g"; awk '/_comma_space|_space:|_newline:/' packages/$g/src/consts.ts | head -6; done
```
Expected: inertness 3 passed; phantom ratchet passed (the new kinds have ids); each grammar's consts show `_comma_space: <id>` rows.

- [ ] **Step 6: Full gates**

```bash
pnpm run type-check 2>&1 | awk '/error TS/{c++} END{print "TS errors:", c+0}'
pnpm exec tsx /tmp/run-examples.ts
for g in rust typescript python; do (cd packages/$g && pnpm exec vitest run -u 2>&1 | awk -v g=$g '/Tests  |Snapshots|^ FAIL /{print g": "$0}'); done
git diff -U0 -- packages/*/tests/__snapshots__ | awk '/^[-+] /'
SITTIR_QUIET=1 pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src > /dev/null 2>&1
pnpm exec tsx packages/cli/src/cli.ts validate counts > /tmp/validate.log 2>&1; pnpm exec tsx packages/cli/src/cli.ts validate history | tail -3
cd packages/codegen && pnpm exec vitest run 2>&1 | awk '/Tests  /'; cd ../..
```
Expected: 0 TS errors; example sizes unchanged; three suites green; snapshot diffs add only the new kinds' `coerceTo*`/kind rows; validator identical on all fifteen metrics; codegen 14 failed / 1113 passed plus the two new passing files.

- [ ] **Step 7: Track new outputs, regenerate once, commit**

```bash
git add -- packages/rust packages/typescript packages/python rust/crates ':!packages/*/node_modules'
for g in rust typescript python; do SITTIR_QUIET=1 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src > /dev/null 2>&1; done
git add -- packages/rust packages/typescript packages/python rust/crates ':!packages/*/node_modules' packages/codegen/src/__tests__/externals-inert.test.ts packages/tools/validation-report.json
git diff --cached --name-only | awk '/node_modules/' | wc -l
git commit -m "feat(grammar): whitespace-bearing separators are kinds the scanner never emits

comma_space, comma_newline, space and newline (and the semicolon pair
where a grammar separates with ;) are registered as externals with render
text. They carry parser ids, appear in no rule, and are never valid in any
parse state, which a test on parser.c pins."
```
Expected: the `node_modules` count is 0 before committing.

---

### Task 5: The option catalog emitter

One new emitter derives the catalog from the node map. It is pure: node map in, source text and catalog rows out, so it is unit-tested on a fixture map before it touches a grammar.

**Files:**
- Create: `packages/codegen/src/emitters/options.ts`
- Create: `packages/codegen/src/emitters/__tests__/emitter-options.test.ts`
- Modify: `docs/glossary/emitters.md`

**Interfaces:**
- Consumes: `NodeMap` (`packages/codegen/src/compiler/types.ts`), `AssembledList` (`kind`, `separatorRule`, `trailingDelimiter`), `AbstractAssembledCompound.slots: readonly AssembledNonterminal[]` (`fieldName`, `values[]` with `multiplicity`, `default`, `variant`, `variantOf`, `separator`, `value`, `resolvedKind`), all from `packages/codegen/src/compiler/model/node-map.ts`.
- Produces:
  ```ts
  export type OptionFamily = 'choice' | 'list' | 'join';
  export interface OptionEntry {
    readonly key: string;            // 'expression_statement_terminator' | 'arguments_elements' | 'statement_block_statements'
    readonly family: OptionFamily;
    readonly kind: string;           // owning kind
    readonly slot?: string;          // field name (choice, join)
    readonly index: number;          // dense, stable per grammar (sorted by key)
    readonly values: readonly string[];              // allowed literals
    readonly defaultValue: string;                   // grammar default
    readonly valueKinds?: Readonly<Record<string, string>>; // literal → kind name (list/join whitespace, choice forms)
    readonly trailing?: boolean;     // list: trailing key present
  }
  export function deriveOptionCatalog(nodeMap: NodeMap): OptionEntry[];
  export function emitOptions(config: { grammar: string; nodeMap: NodeMap }): string;
  ```
  Later plans read `OPTION_CATALOG` from `packages/<g>/src/options.ts` and the `index` column to build the Rust table.

- [ ] **Step 1: Write the failing unit test**

`packages/codegen/src/emitters/__tests__/emitter-options.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { deriveOptionCatalog, emitOptions } from '../options.ts';
import type { NodeMap } from '../../compiler/types.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import { makeListNode, makeCompoundNode, makeSlot, makeValue } from '../../__tests__/helpers/node-map-fixtures.ts';

function nodeMap(nodes: [string, AssembledNode][]): NodeMap {
	return {
		name: 'test',
		nodes: new Map(nodes),
		nodeByRuleId: new Map(),
		nodeByKindId: new Map(),
		slotByRuleId: new Map(),
		signatures: { signatures: new Map() },
		derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] }
	};
}

describe('deriveOptionCatalog', () => {
	it('a separated list with an optional trailing flank gets separator and trailing', () => {
		const map = nodeMap([['arguments_elements', makeListNode('arguments_elements', { separator: ',', trailing: 'optional' })]]);
		expect(deriveOptionCatalog(map)).toEqual([
			{
				key: 'arguments_elements', family: 'list', kind: 'arguments_elements', index: 0,
				values: ['tight', 'space', 'newline'], defaultValue: 'tight',
				valueKinds: { tight: ',', space: '_comma_space', newline: '_comma_newline' },
				trailing: true
			}
		]);
	});

	it('a separated list whose trailing flank is mandatory or absent has no trailing key', () => {
		const map = nodeMap([['tuple_type_elements', makeListNode('tuple_type_elements', { separator: ',', trailing: 'none' })]]);
		expect(deriveOptionCatalog(map)[0]?.trailing).toBe(false);
	});

	it('a separator token without a spaced twin yields no separator values', () => {
		const map = nodeMap([['dotted_name', makeListNode('dotted_name', { separator: '.', trailing: 'none' })]]);
		expect(deriveOptionCatalog(map)).toEqual([]);
	});

	it('an unseparated repeat slot is a join keyed kind_slot', () => {
		const block = makeCompoundNode('statement_block', [makeSlot('statements', [makeValue({ kind: 'statement', multiplicity: 'array' })])]);
		const map = nodeMap([['statement_block', block]]);
		expect(deriveOptionCatalog(map)).toEqual([
			{
				key: 'statement_block_statements', family: 'join', kind: 'statement_block', slot: 'statements', index: 0,
				values: ['tight', 'space', 'newline'], defaultValue: 'tight',
				valueKinds: { space: '_space', newline: '_newline' }
			}
		]);
	});

	it('a slot with a declared default arm is a choice keyed kind_slot, valued by arm', () => {
		const stmt = makeCompoundNode('return_statement', [
			makeSlot('terminator', [
				makeValue({ kind: 'automatic_semicolon', multiplicity: 'one' }),
				makeValue({ literal: ';', multiplicity: 'one', default: true })
			])
		]);
		const map = nodeMap([['return_statement', stmt]]);
		expect(deriveOptionCatalog(map)).toEqual([
			{
				key: 'return_statement_terminator', family: 'choice', kind: 'return_statement', slot: 'terminator', index: 0,
				values: ['automatic_semicolon', ';'], defaultValue: ';'
			}
		]);
	});

	it('a slot with a closed choice but no declared default is not an option', () => {
		const expr = makeCompoundNode('binary_expression', [
			makeSlot('operator', [makeValue({ literal: '+', multiplicity: 'one' }), makeValue({ literal: '-', multiplicity: 'one' })])
		]);
		expect(deriveOptionCatalog(nodeMap([['binary_expression', expr]]))).toEqual([]);
	});

	it('a root-level form split is keyed by the slot its arms share, valued by form', () => {
		const parent = makeCompoundNode('string', [
			makeSlot('content', [
				makeValue({ kind: 'string_double', multiplicity: 'one', variant: 'double', variantOf: 'string', default: true }),
				makeValue({ kind: 'string_single', multiplicity: 'one', variant: 'single', variantOf: 'string' })
			])
		]);
		const dbl = makeCompoundNode('string_double', [makeSlot('quote', [makeValue({ literal: '"', multiplicity: 'one' })])]);
		const sgl = makeCompoundNode('string_single', [makeSlot('quote', [makeValue({ literal: "'", multiplicity: 'one' })])]);
		const map = nodeMap([['string', parent], ['string_double', dbl], ['string_single', sgl]]);
		expect(deriveOptionCatalog(map)).toEqual([
			{
				key: 'string_quote', family: 'choice', kind: 'string', slot: 'quote', index: 0,
				values: ['double', 'single'], defaultValue: 'double',
				valueKinds: { double: 'string_double', single: 'string_single' }
			}
		]);
	});

	it('a root-level split whose arms share no discriminating slot yields no key', () => {
		const parent = makeCompoundNode('with_clause', [
			makeSlot('content', [
				makeValue({ kind: 'with_clause_bare', multiplicity: 'one', variant: 'bare', variantOf: 'with_clause', default: true }),
				makeValue({ kind: 'with_clause_paren', multiplicity: 'one', variant: 'paren', variantOf: 'with_clause' })
			])
		]);
		const bare = makeCompoundNode('with_clause_bare', [makeSlot('items', [makeValue({ kind: 'with_item', multiplicity: 'array' })])]);
		const paren = makeCompoundNode('with_clause_paren', [makeSlot('items', [makeValue({ kind: 'with_item', multiplicity: 'array' })])]);
		const entries = deriveOptionCatalog(nodeMap([['with_clause', parent], ['with_clause_bare', bare], ['with_clause_paren', paren]]));
		expect(entries.filter((e) => e.family === 'choice')).toEqual([]);
	});

	it('indices are dense and follow key order', () => {
		const map = nodeMap([
			['zeta_elements', makeListNode('zeta_elements', { separator: ',', trailing: 'optional' })],
			['alpha_elements', makeListNode('alpha_elements', { separator: ',', trailing: 'optional' })]
		]);
		expect(deriveOptionCatalog(map).map((e) => [e.key, e.index])).toEqual([['alpha_elements', 0], ['zeta_elements', 1]]);
	});
});

describe('emitOptions', () => {
	it('emits the interface, the catalog and the name tables', () => {
		const map = nodeMap([['arguments_elements', makeListNode('arguments_elements', { separator: ',', trailing: 'optional' })]]);
		const src = emitOptions({ grammar: 'test', nodeMap: map });
		expect(src).toContain('export interface Options {');
		expect(src).toContain("readonly arguments_elements?: { readonly separator?: 'tight' | 'space' | 'newline'; readonly trailing?: 'never' | 'always' | 'preserve' };");
		expect(src).toContain('readonly indent?: string;');
		expect(src).toContain('export const OPTION_CATALOG = [');
		expect(src).toContain("key: 'arguments_elements'");
	});
});
```

The fixture helpers `makeListNode`, `makeCompoundNode`, `makeSlot`, `makeValue` may not all exist in `packages/codegen/src/__tests__/helpers/node-map-fixtures.ts`. Open that file first; reuse what is there (the arm-naming work added `kindEntry` support to it) and add the missing ones with these shapes:

```ts
export function makeValue(v: {
	kind?: string; literal?: string; multiplicity: 'one' | 'optional' | 'array' | 'nonEmptyArray';
	default?: true; variant?: string; variantOf?: string;
}): NodeOrTerminal
export function makeSlot(fieldName: string, values: readonly NodeOrTerminal[]): AssembledNonterminal
export function makeCompoundNode(kind: string, slots: readonly AssembledNonterminal[]): AssembledBranch
export function makeListNode(kind: string, opts: { separator: string; trailing: 'mandatory' | 'optional' | 'none' }): AssembledList
```
A `kind` value is a `NodeRef` whose `node` is an `UnresolvedRef` `{ kind: 'unresolved-ref', name }` with `resolvedKind: name`; a `literal` value has `value: literal`. Look at how `emitter-consts.test.ts` builds `AssembledNonterminal` (`new AssembledNonterminal({ values, fieldName, hasTrailingDelimiter, hasLeadingDelimiter, sourceRuleIds: [] })`) and how `AssembledList`'s constructor is called in `node-map.ts:1874` for the exact arguments.

- [ ] **Step 2: Run it to see it fail**

```bash
cd packages/codegen && pnpm exec vitest run src/emitters/__tests__/emitter-options.test.ts 2>&1 | tail -5; cd ../..
```
Expected: fails to import `../options.ts`.

- [ ] **Step 3: Implement the emitter**

`packages/codegen/src/emitters/options.ts`:
```ts
import type { NodeMap } from '../compiler/types.ts';
import {
	AbstractAssembledCompound,
	AssembledList,
	type AssembledNode,
	type AssembledNonterminal,
	type NodeOrTerminal,
	isTerminalValue
} from '../compiler/model/node-map.ts';

export type OptionFamily = 'choice' | 'list' | 'join';

export interface OptionEntry {
	readonly key: string;
	readonly family: OptionFamily;
	readonly kind: string;
	readonly slot?: string;
	readonly index: number;
	readonly values: readonly string[];
	readonly defaultValue: string;
	readonly valueKinds?: Readonly<Record<string, string>>;
	readonly trailing?: boolean;
}

const WHITESPACE_CLASSES = ['tight', 'space', 'newline'] as const;
const TRAILING_POLICIES = ['never', 'always', 'preserve'] as const;

const SPACED_SEPARATORS: Readonly<Record<string, string>> = {
	',': 'comma',
	';': 'semicolon'
};

type Draft = Omit<OptionEntry, 'index'>;

export function deriveOptionCatalog(nodeMap: NodeMap): OptionEntry[] {
	const drafts: Draft[] = [];
	for (const [kind, node] of nodeMap.nodes) {
		if (node instanceof AssembledList) {
			const list = listEntry(kind, node);
			if (list) drafts.push(list);
			continue;
		}
		if (!(node instanceof AbstractAssembledCompound)) continue;
		for (const slot of node.slots) {
			const join = joinEntry(kind, slot);
			if (join) drafts.push(join);
			const choice = choiceEntry(kind, slot, nodeMap);
			if (choice) drafts.push(choice);
		}
	}
	drafts.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
	return drafts.map((d, index) => ({ ...d, index }));
}

function separatorText(node: AssembledList): string | undefined {
	const rule = node.separatorRule as { type?: string; value?: unknown } | undefined;
	return rule?.type === 'STRING' && typeof rule.value === 'string' ? rule.value : undefined;
}

function listEntry(kind: string, node: AssembledList): Draft | null {
	const token = separatorText(node);
	const base = token === undefined ? undefined : SPACED_SEPARATORS[token];
	const trailing = node.trailingDelimiter === 'optional';
	if (base === undefined && !trailing) return null;
	if (base === undefined) {
		return { key: kind, family: 'list', kind, values: [], defaultValue: 'tight', trailing };
	}
	return {
		key: kind,
		family: 'list',
		kind,
		values: [...WHITESPACE_CLASSES],
		defaultValue: 'tight',
		valueKinds: { tight: token!, space: `_${base}_space`, newline: `_${base}_newline` },
		trailing
	};
}

function isRepeated(v: NodeOrTerminal): boolean {
	return v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray';
}

function joinEntry(kind: string, slot: AssembledNonterminal): Draft | null {
	if (slot.fieldName === undefined) return null;
	if (!slot.values.every((v) => isRepeated(v) && v.separator === undefined)) return null;
	if (slot.values.length === 0) return null;
	return {
		key: `${kind}_${slot.fieldName}`,
		family: 'join',
		kind,
		slot: slot.fieldName,
		values: [...WHITESPACE_CLASSES],
		defaultValue: 'tight',
		valueKinds: { space: '_space', newline: '_newline' }
	};
}

function valueName(v: NodeOrTerminal): string | undefined {
	if (v.variant !== undefined) return v.variant;
	if (isTerminalValue(v)) return v.value;
	return v.resolvedKind ?? v.node?.name;
}

function valueKind(v: NodeOrTerminal): string | undefined {
	return v.resolvedKind ?? v.node?.name;
}

function choiceEntry(kind: string, slot: AssembledNonterminal, nodeMap: NodeMap): Draft | null {
	const declared = slot.values.find((v) => v.default === true);
	if (declared === undefined) return null;
	const isRootSplit = slot.values.every((v) => v.variantOf === kind);
	if (isRootSplit) return rootSplitEntry(kind, slot, declared, nodeMap);
	if (slot.fieldName === undefined) return null;
	const values = slot.values.map(valueName).filter((n): n is string => n !== undefined);
	const defaultValue = valueName(declared);
	if (defaultValue === undefined) return null;
	return { key: `${kind}_${slot.fieldName}`, family: 'choice', kind, slot: slot.fieldName, values, defaultValue };
}

function rootSplitEntry(kind: string, slot: AssembledNonterminal, declared: NodeOrTerminal, nodeMap: NodeMap): Draft | null {
	const arms = slot.values.map((v) => ({ form: v.variant!, kind: valueKind(v) }));
	const armNodes = arms.map((a) => (a.kind === undefined ? undefined : nodeMap.nodes.get(a.kind)));
	if (armNodes.some((n) => !(n instanceof AbstractAssembledCompound))) return null;
	const compounds = armNodes as AbstractAssembledCompound[];
	const discriminator = compounds[0]!.slots
		.map((s) => s.fieldName)
		.filter((name): name is string => name !== undefined)
		.find((name) => {
			const texts = compounds.map((c) => {
				const s = c.slots.find((x) => x.fieldName === name);
				if (!s || s.values.length !== 1 || !isTerminalValue(s.values[0]!)) return undefined;
				return s.values[0]!.value;
			});
			return texts.every((t) => t !== undefined) && new Set(texts).size === texts.length;
		});
	if (discriminator === undefined) return null;
	const valueKinds: Record<string, string> = {};
	for (const a of arms) if (a.kind !== undefined) valueKinds[a.form] = a.kind;
	return {
		key: `${kind}_${discriminator}`,
		family: 'choice',
		kind,
		slot: discriminator,
		values: arms.map((a) => a.form),
		defaultValue: declared.variant!,
		valueKinds
	};
}

function literal(s: string): string {
	return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}

function unionOf(values: readonly string[]): string {
	return values.map(literal).join(' | ');
}

export function emitOptions(config: { grammar: string; nodeMap: NodeMap }): string {
	const catalog = deriveOptionCatalog(config.nodeMap);
	const lines: string[] = ['// Auto-generated by @sittir/codegen — do not edit', ''];
	lines.push('export interface Options {');
	for (const e of catalog) {
		if (e.family === 'list') {
			const parts: string[] = [];
			if (e.values.length > 0) parts.push(`readonly separator?: ${unionOf(e.values)};`);
			if (e.trailing) parts.push(`readonly trailing?: ${unionOf(TRAILING_POLICIES)};`);
			lines.push(`\treadonly ${e.key}?: { ${parts.join(' ')} };`);
		} else if (e.family === 'join') {
			lines.push(`\treadonly ${e.key}?: { readonly separator?: ${unionOf(e.values)}; };`);
		} else {
			lines.push(`\treadonly ${e.key}?: ${unionOf(e.values)};`);
		}
	}
	lines.push('\treadonly indent?: string;');
	lines.push('}', '');
	lines.push('export type OptionFamily = \'choice\' | \'list\' | \'join\';', '');
	lines.push('export interface OptionEntry {');
	lines.push('\treadonly key: string;');
	lines.push('\treadonly family: OptionFamily;');
	lines.push('\treadonly kind: string;');
	lines.push('\treadonly slot?: string;');
	lines.push('\treadonly index: number;');
	lines.push('\treadonly values: readonly string[];');
	lines.push('\treadonly defaultValue: string;');
	lines.push('\treadonly valueKinds?: Readonly<Record<string, string>>;');
	lines.push('\treadonly trailing?: boolean;');
	lines.push('}', '');
	lines.push('export const OPTION_CATALOG = [');
	for (const e of catalog) {
		const fields = [
			`key: ${literal(e.key)}`,
			`family: ${literal(e.family)}`,
			`kind: ${literal(e.kind)}`,
			...(e.slot === undefined ? [] : [`slot: ${literal(e.slot)}`]),
			`index: ${e.index}`,
			`values: [${e.values.map(literal).join(', ')}]`,
			`defaultValue: ${literal(e.defaultValue)}`,
			...(e.valueKinds === undefined
				? []
				: [`valueKinds: { ${Object.entries(e.valueKinds).map(([k, v]) => `${literal(k)}: ${literal(v)}`).join(', ')} }`]),
			...(e.trailing === undefined ? [] : [`trailing: ${e.trailing}`])
		];
		lines.push(`\t{ ${fields.join(', ')} },`);
	}
	lines.push('] as const satisfies readonly OptionEntry[];', '');
	lines.push('export const OPTION_INDEX: Readonly<Record<string, number>> = Object.fromEntries(');
	lines.push('\tOPTION_CATALOG.map((entry) => [entry.key, entry.index])');
	lines.push(');', '');
	return lines.join('\n');
}
```

Adjust two things against the real types when the test drives you there: the `separatorRule` shape (it is a `RenderRule`; if the STRING constant lives in `../types/rule-types.ts`, import and compare with it as `consts.ts` does), and `v.node?.name` (an `UnresolvedRef` has `name`; a resolved `AssembledNode` has `kind` — use `resolvedKind` first, which is stamped in both cases).

- [ ] **Step 4: Run the unit test until it passes**

```bash
cd packages/codegen && pnpm exec vitest run src/emitters/__tests__/emitter-options.test.ts 2>&1 | awk '/✓|×|Tests  |Error|expected/'; cd ../..
```
Expected: 10 passed.

- [ ] **Step 5: Glossary entries**

Append to `docs/glossary/emitters.md`, one `###` per exported declaration plus the private rules, in this shape (write real text, not this scaffold's brackets):

```markdown
### `packages/codegen/src/emitters/options.ts::deriveOptionCatalog`

```text
/**
 * Every slot a user may default or format, derived from the node map.
 *
 * @remarks
 * Three families. A separated list is keyed by its kind and offers a
 * whitespace class for its separator when the token has a spaced twin
 * (`,`, `;`), and a trailing policy only when the grammar's trailing
 * flank is optional. An unseparated repeat slot is a join keyed
 * `kind_slot`. A closed choice is an option only when the grammar declares
 * a default arm; it is keyed `kind_slot`, or for a root-level form split,
 * by the single-valued literal slot every arm shares with a differing
 * value. Indices are dense in key order and are the contract later
 * emitters build id tables from.
 */
```
```

Add matching entries for `emitOptions`, `listEntry`, `joinEntry`, `choiceEntry`, `rootSplitEntry` and the `SPACED_SEPARATORS` table (why only `,` and `;` have twins: those are the separator tokens the three grammars use in lists; a new token needs a registered external pair before it can be listed).

- [ ] **Step 6: Commit**

```bash
git add -- packages/codegen/src/emitters/options.ts packages/codegen/src/emitters/__tests__/emitter-options.test.ts packages/codegen/src/__tests__/helpers/node-map-fixtures.ts docs/glossary/emitters.md
git commit -m "feat(codegen): derive the render options catalog from the node map

One emitter turns the model's stamped facts into every option a user may
set: a separated list's separator spacing and, where the grammar leaves it
open, its trailing policy; an unseparated repeat's join; and each closed
choice the grammar declares a default for, keyed by the slot it occupies."
```

---

### Task 6: Emit `options.ts` into every grammar package

Wire the emitter into the pipeline, regenerate, pin each grammar's catalog with a snapshot, and prove the generated type rejects a wrong literal.

**Files:**
- Modify: `packages/codegen/src/emitters/emit.ts` (~lines 59, 146, 168), `packages/codegen/src/compiler/generate.ts` (~line 168 `GeneratedFiles`), `packages/codegen/src/run-codegen.ts` (~line 237), `packages/codegen/src/emitters/index-file.ts` (~line 28)
- Create: `packages/<g>/tests/options-catalog.test.ts` and `packages/<g>/tests/options-types.test.ts` for rust, typescript, python
- Modify: `docs/glossary/emitters.md` (if `GeneratedFiles` has an entry listing its members, add `options`)

**Interfaces:**
- Consumes: `emitOptions` from Task 5.
- Produces: `packages/<g>/src/options.ts` exporting `Options`, `OptionEntry`, `OPTION_CATALOG`, `OPTION_INDEX`; re-exported from the package index.

- [ ] **Step 1: Write the per-grammar tests first**

For each grammar `g` in rust, typescript, python, create `packages/<g>/tests/options-catalog.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { OPTION_CATALOG, OPTION_INDEX } from '../src/options.ts';

describe('render options catalog', () => {
	it('is pinned', () => {
		expect(OPTION_CATALOG).toMatchSnapshot();
	});
	it('has dense indices in key order', () => {
		expect(OPTION_CATALOG.map((e) => e.index)).toEqual(OPTION_CATALOG.map((_, i) => i));
		expect([...OPTION_CATALOG].map((e) => e.key)).toEqual([...OPTION_CATALOG].map((e) => e.key).sort());
		expect(Object.keys(OPTION_INDEX)).toHaveLength(OPTION_CATALOG.length);
	});
	it('offers trailing only where the grammar leaves the flank optional', () => {
		for (const e of OPTION_CATALOG) {
			if (e.family !== 'list') expect(e.trailing).toBeUndefined();
		}
	});
});
```

and `packages/<g>/tests/options-types.test.ts`. Typescript:
```ts
import { expect, it } from 'vitest';
import type { Options } from '../src/options.ts';

it('accepts every family with a valid literal and rejects a wrong one at compile time', () => {
	const ok: Options = {
		arguments_elements: { separator: 'space', trailing: 'never' },
		statement_block_statements: { separator: 'newline' },
		return_statement_terminator: ';',
		string_content: 'single',
		indent: '\t'
	};
	const bad: Options = {
		// @ts-expect-error 'wide' is not a whitespace class
		arguments_elements: { separator: 'wide' },
		// @ts-expect-error a form name the split does not have
		string_content: 'backtick'
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
});
```
Rust (keys per the catalog; adjust `impl_item_trait_clause` to the emitted key after step 3 if the slot name differs):
```ts
import { expect, it } from 'vitest';
import type { Options } from '../src/options.ts';

it('accepts every family with a valid literal and rejects a wrong one at compile time', () => {
	const ok: Options = {
		arguments_elements: { separator: 'space', trailing: 'never' },
		declaration_list_declarations: { separator: 'newline' },
		impl_item_trait_clause: 'positive',
		indent: '    '
	};
	const bad: Options = {
		// @ts-expect-error 'wide' is not a whitespace class
		arguments_elements: { separator: 'wide' }
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
});
```
Python:
```ts
import { expect, it } from 'vitest';
import type { Options } from '../src/options.ts';

it('accepts every family with a valid literal and rejects a wrong one at compile time', () => {
	const ok: Options = {
		argument_list_elements: { separator: 'space', trailing: 'never' },
		block_statements: { separator: 'newline' },
		indent: '    '
	};
	const bad: Options = {
		// @ts-expect-error 'wide' is not a whitespace class
		argument_list_elements: { separator: 'wide' }
	};
	expect(ok).toBeDefined();
	expect(bad).toBeDefined();
});
```
If a key named here is not in the emitted catalog after step 3 (a list kind may be spelled differently), pick the corresponding real key from `OPTION_CATALOG` rather than changing the emitter.

- [ ] **Step 2: Run the typescript one to see it fail**

```bash
cd packages/typescript && pnpm exec vitest run tests/options-catalog.test.ts 2>&1 | tail -3; cd ../..
```
Expected: cannot resolve `../src/options.ts`.

- [ ] **Step 3: Wire the emitter**

`packages/codegen/src/emitters/emit.ts`: import `emitOptions` from `./options.ts`; add `options: string;` to `EmitAllResult` next to `consts`; after `const consts = emitConsts(...)` add `const options = emitOptions({ grammar, nodeMap });` and include `options,` in the returned object.

`packages/codegen/src/compiler/generate.ts`: add `options: string;` to `GeneratedFiles` (wherever `consts: string;` is declared — search `consts:` in `packages/codegen/src/compiler/types.ts` or `generate.ts`) and `options: emitted.options,` next to `consts: emitted.consts,`.

`packages/codegen/src/run-codegen.ts:237` area:
```ts
	await writeFile(join(outDir, 'options.ts'), result.options);
```

`packages/codegen/src/emitters/index-file.ts`, next to the `consts` export line:
```ts
		"export * from './options.js';",
```

- [ ] **Step 4: Regenerate, track the new files, regenerate again**

```bash
for g in rust typescript python; do SITTIR_QUIET=1 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src > /tmp/gen-$g.log 2>&1; echo "$g exit=$?"; done
for g in rust typescript python; do echo "== $g $(awk '/^\t\{ key:/{c++} END{print c+0}' packages/$g/src/options.ts) entries"; awk '/^\t\{ key:/{print substr($0,1,110)}' packages/$g/src/options.ts | head -60; done
git add -- packages/rust/src/options.ts packages/typescript/src/options.ts packages/python/src/options.ts
for g in rust typescript python; do SITTIR_QUIET=1 pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src > /dev/null 2>&1; done
```
Expected: three `exit=0`. Read every catalog row against the spec's rules: every `list` row is a `*_elements` hoist or an envelope list kind; `trailing: true` only where `sittir tool separated-lists -g <g>` reports `trailing=optional`; every `join` row is a repeat slot with no separator; every `choice` row has a declared default — typescript must show `*_terminator` rows for all 18 kinds from Task 1 plus `string_content`; rust must show `impl_item_trait_clause`; python none. A row that violates a rule is a derivation bug: fix `options.ts`, extend the unit test with the shape, regenerate.

- [ ] **Step 5: Run the new tests and every gate**

```bash
for g in rust typescript python; do (cd packages/$g && pnpm exec vitest run -u 2>&1 | awk -v g=$g '/Tests  |Snapshots|^ FAIL /{print g": "$0}'); done
pnpm run type-check 2>&1 | awk '/error TS/{c++} END{print "TS errors:", c+0}'
pnpm run type-check 2>&1 | awk '/error TS/' | head
pnpm exec tsx /tmp/run-examples.ts
SITTIR_QUIET=1 pnpm exec tsx packages/cli/src/cli.ts gen --grammar python --all --output packages/python/src > /dev/null 2>&1
pnpm exec tsx packages/cli/src/cli.ts validate counts > /tmp/validate.log 2>&1; pnpm exec tsx packages/cli/src/cli.ts validate history | tail -3
cd packages/codegen && pnpm exec vitest run 2>&1 | awk '/Tests  /'; cd ../..
```
Expected: three suites green with the catalog snapshots written; `TS errors: 0` — note the `@ts-expect-error` lines are checked by this gate, and an "Unused '@ts-expect-error' directive" error means the type accepted a wrong literal, which is a derivation bug to fix, never a directive to delete; example sizes unchanged; validator identical; codegen 14 failed / 1113 passed plus the new options tests passing.

- [ ] **Step 6: Commit**

```bash
git add -- packages/codegen/src/emitters/emit.ts packages/codegen/src/compiler/generate.ts packages/codegen/src/compiler/types.ts packages/codegen/src/run-codegen.ts packages/codegen/src/emitters/index-file.ts \
  packages/rust/src packages/rust/.sittir packages/rust/tests packages/typescript/src packages/typescript/.sittir packages/typescript/tests packages/python/src packages/python/.sittir packages/python/tests rust/crates docs/glossary/emitters.md packages/tools/validation-report.json
git diff --cached --name-only | awk '/node_modules/' | wc -l
git commit -m "feat(codegen): every grammar package ships its render options catalog

options.ts carries the Options interface and OPTION_CATALOG, generated
from the node map. Each catalog is pinned by snapshot, and a type-level
test per grammar proves a wrong literal fails to compile."
```
Expected: `0` node_modules paths staged.

---

## Self-review

**Spec coverage.** Catalog rules 1–6: Task 5 (families, key spelling, whitespace classes, trailing-only-where-optional, indent, dense indices) and Task 1–3 (named slots, declared defaults). Rule 3 (whitespace kinds as externals): Task 4. Verification items owned by this plan: scanner inertness (Task 4), catalog snapshots and type-level tests (Task 6), existing gates identical (every task). Not in this plan, by design: reader stamps and the round-trip metric (plan 2), render path and `&Options` (plan 3), engine API, `engine.ir`, `reformat`, `tree.options()` and the precedence inversion (plan 4), layout (plan 5).

**Placeholder scan.** Every code step has its code; the two "if X, then" branches (Task 2 step 3, Task 3 step 3) name the exact function and file to look at and what to assert. The fixture helpers in Task 5 name their signatures.

**Type consistency.** `OptionEntry` fields (`key`, `family`, `kind`, `slot`, `index`, `values`, `defaultValue`, `valueKinds`, `trailing`) are spelled identically in the emitter, its unit test, the emitted `options.ts`, and the per-grammar tests. Whitespace classes are `'tight' | 'space' | 'newline'` and trailing policies `'never' | 'always' | 'preserve'` everywhere. The slot is `terminator` in Tasks 1, 3, 5 and 6.

---

## Addendum: declared preferences and `injects:`

After Tasks 1–6 landed, the real-choice family was redesigned: `arm.default`
is the semantic default and not an option; a real choice enters the catalog
only through `preference(label, default)`, keyed by the label across every
site that references the kind; `groups:` generalises into `injects:`. Tasks
7–9 replace what Task 3 and the catalog's `choiceEntry` derived.

### Task 7: The `preference()` primitive and its lowering

**Files:**
- Create: `packages/codegen/src/dsl/primitives/preference.ts` (mirror `arm.ts`: a placeholder `{ __preference: true, label, default }`, `preference(label, default)`, `isPreference(v)`)
- Modify: `packages/codegen/src/dsl/index.ts` and `dsl-authoring.ts` (export `preference`)
- Modify: `packages/codegen/src/dsl/wire/wire.ts` — `PatchesConfig` accepts a placeholder as a kind-level value; `composeOrSynthesizePatchedParents` applies a kind-level `preference` to the rule root: for a CHOICE root (through prec/alias wrappers) every arm gets `annotations.preference = { label }`, and the arm whose literal text, alias target, or variant name equals `default` gets `annotations.default = true`; anything else is a build error naming the kind
- Modify: `packages/codegen/src/dsl/transform/transform.ts` — `resolvePatch` accepts a path-level `preference` the same way (`withAnnotations(member, { preference: { label }, default? })` applied to the arms of the member)
- Modify: `packages/codegen/src/compiler/model/node-map.ts` — `ArmFacts` and `NodeRef` gain `preferenceLabel?: string`; `armFactsOf` carries it; the STRING/PATTERN, SYMBOL(literal) and enum-choice branches already spread arm facts
- Modify: `packages/codegen/src/emitters/options.ts` — `CatalogValue.preferenceLabel?`; `choiceEntry` keys by the label: all slots whose values carry one label fold into one entry `{ key: label, family: 'choice', sites: ['return_statement.terminator', …], values, defaultValue }`, values being the union of arm names across sites (they must agree — a mismatch is a build error); `arm.default` alone produces no entry
- Tests: `packages/codegen/src/dsl/__tests__/preference.test.ts` (lowering on a fixture choice), extend `emitter-options.test.ts` (label grouping, mismatch error, arm.default-only yields nothing)
- Glossary entries for every new declaration

Steps follow the Task 5 pattern: failing test, minimal implementation, unit tests green, glossary, commit.

### Task 8: Declare the two preferences and drop the derived ones

**Files:**
- Modify: `packages/typescript/grammar.sittir.ts` — replace `_semicolon: { 1: arm.default }` with `_semicolon: preference('statement_terminator', ';')`, and `string`'s `{ 0: arm.default }` set with `string: preference('quote_style', 'double')`
- Rust keeps `impl_item: { '3/0/0/0': arm.default }` (semantic)
- Modify: `packages/typescript/tests/options-types.test.ts` — `statement_terminator: ';'`, `quote_style: 'single'`, the wrong literal on `quote_style`
- Regenerate all three; expected catalog: typescript gains exactly `statement_terminator` and `quote_style` in the choice family and loses the 19 `*_terminator` keys, the two `export_statement_default_*_automatic_semicolon` keys and `string_content`; rust loses `impl_item_trait_clause`; python unchanged. Snapshots refreshed, diffs read; every other gate identical.

### Task 9: `injects:`

**Files:**
- Modify: `packages/codegen/src/dsl/wire/wire.ts` — `injects?: GroupsConfig` beside `groups?`; `applyWirePatternReplacement` takes both; a `_`-prefixed inject key registers the hidden rule and replaces matches with a plain symbol reference (no alias), an unprefixed key behaves as `groups:` does; `groups:` stays accepted and documented as the visible-only spelling
- Test: `packages/codegen/src/dsl/__tests__/wire-injects.test.ts` — a hidden inject replaces two structurally equal sites with `$._name` references and defines the rule once; a visible inject is byte-identical to the same `groups:` entry
- No grammar config changes in this task; the first consumer is whichever choice next needs wrapping

---

## Addendum: one preference mechanism, kind-id values, no runtime catalog

After Tasks 1–9 landed, the option surface was redesigned around a single
non-contextual mechanism. A preference is a label, arms, a default and its
sites; the `Options` type is generated from the site list alone. Separator
spacing is a preference the compiler synthesizes for a phantom kind per
separator token and side (`comma_separator_space_before`, `_after`) and per
empty gap (`empty_separator_space`), defaulting to `space` unless the
grammar patches the phantom by name. Values are kind ids, so `_tight` joins
`_space` and `_newline` as a never-scanned external and the compound
`_comma_space` / `_comma_newline` / `_semicolon_*` kinds are gone. The
runtime catalog (`OptionEntry`, `OPTION_CATALOG`, `OPTION_INDEX`) is gone;
`options.ts` is the `Options` type only. Tasks 10 and 11 replace Tasks 4–6.

### Task 10: `_tight` and the phantom declarations

**Files:**
- Modify: `packages/{rust,typescript,python}/grammar.sittir.ts` — externals
  `_tight`, `_space`, `_newline` (python: `_tight`, `_space`; its `_newline`
  is real); `visibleExternals` with `_tight: string('')`; `patches:` entries
  on the phantom kinds whose default is not `space` (comma and semi before,
  dot both sides, the empty gap as newline)
- Modify: `packages/codegen/src/__tests__/externals-inert.test.ts` — the
  never-scanned lists
- Create: `packages/codegen/src/dsl/primitives/spacing.ts` (phantom naming),
  `packages/codegen/src/dsl/__tests__/spacing-phantom.test.ts`
- Modify: `packages/codegen/src/dsl/wire/wire.ts` — `WireContext.spacingPreferences`;
  `composeOrSynthesizePatchedParents` records a phantom key instead of
  patching a rule and rejects anything but exactly one `preference()`
- Modify: `packages/codegen/src/compiler/evaluate.ts` (`drainSpacingPreferencesMetadata`),
  `packages/codegen/src/compiler/types.ts` (`RawGrammar.spacingPreferences`),
  `packages/codegen/src/compiler/generate.ts` and `packages/codegen/src/emitters/emit.ts`
  (plumbing into `emitOptions`)

### Task 11: site preferences and the type-only `options.ts`

**Files:**
- Create: `packages/codegen/src/compiler/model/site-preferences.ts` —
  `collectSitePreferences`: declared preferences from labelled arms,
  spacing preferences per eligible slot (a repeat whose elements are
  `immediate`, tokenized or external scanner tokens is not a site), the
  `delimiter` preference from `delimiterMembersFor`
- Create: `packages/codegen/src/compiler/model/supertype-members.ts` —
  `buildSupertypeMembersMap` moved out of the wrap emitter so both emitters
  share it; `delimiterMembersFor` moves into `node-map.ts` for the same reason
- Rewrite: `packages/codegen/src/emitters/options.ts` —
  `deriveOptionsShape(sites, supertypeMembers, armType)` (top level per
  label, `<slot>_<label>` per kind, union per supertype, one namespace),
  `kindIdArmType` (`TSKindId.<member>` through the kind catalog),
  `renderOptionsModule` (the interface and a type-only import), `emitOptions`
- Rewrite: `packages/codegen/src/emitters/__tests__/emitter-options.test.ts`
  on plain `SitePreference` fixtures
- Replace: `packages/<g>/tests/options-catalog.test.ts` and
  `options-types.test.ts` with `packages/<g>/tests/options.test.ts` — a
  snapshot of the emitted `options.ts` and a type-level test with one valid
  and one invalid member per tier
- Glossary: `docs/glossary/{emitters,compiler-model,dsl-primitives,dsl-wire,compiler}.md`

Gates as in the global constraints; the validator, examples and the
codegen baseline stay identical because nothing renders differently yet.
Plan 2 stamps the injected choices on read; plan 3 materializes them as
transport slots filled natively and consumed by the emitted render bodies.

