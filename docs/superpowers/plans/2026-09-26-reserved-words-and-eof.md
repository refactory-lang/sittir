# Reserved Words and `eof()` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sittir models tree-sitter's `reserved` wordsets, the `reserved(ctx, rule)` rule and `eof()` in both
pipelines; typescript inherits javascript 0.25's reserved set; rust gets an enrich-inferred set; the identifier guard
reads the one reserved fact.

**Architecture:** The grammar field `reserved` already reaches the model (Task 7d, `RawGrammar.reserved` /
`reservedWordset`).
- **New rule types:** the two rule types are added to evaluate's DSL and the rule model, transparent to structure:
  - `RESERVED` leaves a `reservedContext` fact on the slot it wraps;
  - `EOF` contributes nothing.
- **Typescript:** it extends javascript 0.25 through a pnpm override and a ported conflict list.
- **Rust:** enrich derives its wordsets from the grammar's own keyword patterns, proven by corpus equality.

**Tech Stack:** TypeScript codegen (`packages/codegen`), tree-sitter-cli 0.27, pnpm overrides, vitest, cargo.

**Spec:** `docs/superpowers/specs/2026-09-26-reserved-words-and-eof-design.md`

## Global Constraints

- DRY: `reservedWordset` (compiler/generated-metadata.ts) is the only reader of wordsets; enrich is the only place
  wordsets are synthesized; `reservedContext` is the only slot fact.
- Both pipelines see the same grammar: anything synthesized is injected by enrich/wire pre-generate, and
  `evaluate`'s `reserved` must equal `.sittir/src/grammar.json`'s for every grammar.
- Generated outputs are never hand-edited; regenerate.
- No explanatory comments in `packages/codegen/src/`; every new declaration gets a `docs/glossary/` entry. No
  planning numbers in comments or glossary text.
- New model surface is limited to the spec's three additions: `RawGrammar.reserved` (already landed), `ReservedRule`
  and `EofRule`, and `reservedContext` on a slot.
- Annotations are never read by compiler phases.
- Ratchets only tighten. Behaviour moves (tasks 1, 5, 6) are listed per kind and accepted before a baseline changes.
- Gates for every task:
  - targeted probes;
  - `pnpm run validate:native`, compared row by row with `validate:history` against
    `packages/tools/baselines/native.json`;
  - the full vitest suite as its own shell call;
  - workspace type-check `--noEmit` and lint;
  - `cargo test --workspace --no-default-features`;
  - `propose-14`.
- Commits use pathspecs.

## Review Focus

1. **A contextual `reserved(ctx, …)` slot with its own wordset:** an identifier admitted by that slot's wordset but
   in `global` is accepted there and rejected elsewhere. Pinned in Task 4.
2. **`eof()` misuse:** `seq(eof(), 'x')`, `token(eof())` and `choice(seq('a', eof()), 'b')` produce the same
   acceptance/rejection as tree-sitter's generate. Evaluate never builds a grammar the parser generator rejects, and
   never rejects one it accepts. Pinned in Task 2.
3. **A reserved wordset member that is a SYMBOL, not a STRING:** it resolves to its catalog literalText; a
   non-literal member warns `reserved-member-not-literal` instead of silently dropping. Pinned in Task 4.
4. **The typescript repoint changes a parse the user relies on**, e.g. `using` declarations, or a keyword that becomes
   reserved and stops parsing as an identifier. Every such move appears in Task 5's per-kind report before
   acceptance.
5. **The rust inference over-reserves** a word the corpus never uses as an identifier but the language allows. The
   inferred list is printed for human check, and a hand-picked probe (`union`, `default`, `auto`, `raw` as
   identifiers) must still parse. Pinned in Task 6.

---

### Task 1: tree-sitter-cli 0.27.0

**Files:**
- Modify: `package.json`, `packages/codegen/package.json` (`tree-sitter-cli` → `^0.27.0`), `pnpm-lock.yaml`
- Regenerate: all five grammars (`packages/{rust,python,typescript,regex,scm}/.sittir/*`, generated src, crates)

**Interfaces:** Produces the CLI that supports `eof()`. No code interface.

- [ ] **Step 1:** Record the pre-upgrade `validate:native` rows and the parity fixture hashes:
  `pnpm run validate:native && pnpm run validate:history`.
- [ ] **Step 2:** Bump both `tree-sitter-cli` pins to `^0.27.0`, then `pnpm install`.
- [ ] **Step 3:** Regenerate all five grammars:
  - `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src` for each;
  - then `pnpm run validate:native`.
- [ ] **Step 4:** Diff the generated outputs.
  - Expected: `parser.c`/tables may move; sittir src, validate rows and fixtures hold.
  - If any validate row or fixture moves, STOP and report old/new/where.
- [ ] **Step 5:** Run the gates (the suite as its own call, cargo `--workspace`).
- [ ] **Step 6:** Commit:
  `git commit -m "chore(deps): tree-sitter-cli 0.27.0" -- package.json packages/codegen/package.json pnpm-lock.yaml packages/*/.sittir packages/*/src rust/crates`.

### Task 2: `RESERVED` and `EOF` in evaluate's DSL and the rule model

**Files:**
- Modify:
  - `packages/codegen/src/types/rule-types.ts`: add `RESERVED`, `EOF`;
  - `packages/codegen/src/types/rule.ts`: `ReservedRule<P>`, `EofRule<P>` in the `Rule<P>` union;
  - `packages/codegen/src/dsl/builders.ts`: `structuralBuilder.reserved`, `structuralBuilder.eof`;
  - `packages/codegen/src/compiler/evaluate.ts` `saveAndInjectDslGlobals`: add `reserved`, `eof`;
  - `packages/codegen/src/dsl/wire/wire.ts`: pass the two through renaming like any rule.
- Create: `packages/codegen/src/compiler/__tests__/fixtures/reserved-eof-grammar.js`,
  `packages/codegen/src/compiler/__tests__/reserved-eof-evaluate.test.ts`
- Docs: glossary entries for both rule types and both builders.

**Interfaces:**
- Produces:
  - `ReservedRule<P> = { type: typeof RESERVED; contextName: string; content: Rule<P> }`;
  - `EofRule<P> = { type: typeof EOF }`;
  - DSL globals `reserved(wordset: string, rule)` and `eof()`, with JSON output identical to tree-sitter's
    (`{type:'RESERVED', context_name, content}`, `{type:'EOF'}`).

- [ ] **Step 1: Write the failing test.**

```ts
import { evaluate } from '../evaluate.ts';
import { generateGrammarJson } from './helpers/tree-sitter-generate.ts';
const FIXTURE = new URL('./fixtures/reserved-eof-grammar.js', import.meta.url).pathname;
it('evaluates reserved() and eof() exactly as tree-sitter serializes them', async () => {
	const raw = await evaluate(FIXTURE);
	const ts = await generateGrammarJson(FIXTURE);
	expect(raw.reserved).toEqual(ts.reserved);
	expect(raw.rules.property.type).toBe('RESERVED');
	expect((raw.rules.property as { contextName: string }).contextName).toBe('properties');
	expect(raw.rules.statement_end).toMatchObject({ type: 'CHOICE' });
});
it.each([
	['eof not final', 'seq(eof(), "x")'],
	['eof inside token', 'token(seq("a", eof()))']
])('rejects %s like tree-sitter', async (_name, body) => {
	await expect(evaluateInline({ bad: body })).rejects.toThrow(/eof/);
	await expect(generateInline({ bad: body })).rejects.toThrow();
});
```

  The fixture declares `reserved: { global: $ => ['if', 'else'], properties: $ => [] }`,
  `property: $ => reserved('properties', $.identifier)` and `statement_end: $ => choice(';', eof())`, over a
  `word: $ => $.identifier`. `generateGrammarJson` / `generateInline` / `evaluateInline` are test helpers that run
  `tree-sitter generate` in a temp dir and read `src/grammar.json`; reuse the metadata-parity helper if one exists.
- [ ] **Step 2:** Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/reserved-eof-evaluate.test.ts`.
  Expected: FAIL (`reserved is not defined`).
- [ ] **Step 3: Implement.**

```ts
// rule-types.ts
export const RESERVED = 'RESERVED' as const;
export const EOF = 'EOF' as const;
// builders.ts (structuralBuilder)
reserved(contextName: string, content: Rule<'evaluate'>): ReservedRule<'evaluate'> {
	return { type: RESERVED, contextName, content };
},
eof(): EofRule<'evaluate'> {
	return { type: EOF };
},
```

  - Evaluate's `reserved(wordset, rule)` global coerces `rule` with the same `coerceToRule` other combinators use.
  - `grammar.json` serialization maps `contextName` ↔ `context_name`, wherever sittir serializes rules to
    tree-sitter JSON (the transpile path).
  - Evaluate validates `eof()` placement once per rule body after evaluation:
    - an EOF not in final position of its innermost SEQ throws `eof(): must be the last member of its sequence (rule '<name>')`;
    - an EOF under TOKEN/IMMEDIATE_TOKEN throws `eof(): not allowed inside token() (rule '<name>')`.
- [ ] **Step 4:** Run the test. Expected: PASS.
- [ ] **Step 5:** Regenerate all five grammars. Expected: byte-identical, since no grammar uses either rule. Run the gates.
- [ ] **Step 6:** Commit.

### Task 3: `RESERVED` and `EOF` through link, normalize, simplify and assemble

**Files:**
- Modify: every rule-type switch that handles `TOKEN`/`IMMEDIATE_TOKEN` in `compiler/link.ts`,
  `compiler/normalize.ts`, `compiler/flatten.ts`, `compiler/collect-slots.ts`, `compiler/assemble.ts` and the
  `RuleWalker` (`dsl/rule-walker.ts`). Add a `RESERVED` case (descend into `content`) and an `EOF` case (a leaf with
  no slot and no render text) to each.
- Modify: `compiler/model/node-map.ts`: `AssembledNonterminal.reservedContext?: string`, set when the slot's value
  sits under a `RESERVED` rule.
- Modify: `emitters/templates.ts` / `emitters/render-body.ts`: `EOF` emits nothing.
- Test: `packages/codegen/src/compiler/__tests__/reserved-eof-model.test.ts`
- Docs: glossary entries for each new case's function and `reservedContext`.

**Interfaces:**
- Consumes: `ReservedRule`, `EofRule` (Task 2).
- Produces: `AssembledNonterminal.reservedContext: string | undefined`.

- [ ] **Step 1: Write the failing test.**

```ts
it('sees through reserved() and records its context on the slot', async () => {
	const nodeMap = await compileFixtureNodeMap('reserved-eof-grammar');
	const member = nodeMap.nodes.get('member_expression')!;
	const property = member.slots.find((s) => s.name === 'property')!;
	expect(property.reservedContext).toBe('properties');
	expect(property.values.map((v) => v.kind)).toEqual(['identifier']);
});
it('eof() contributes no slot and no text', async () => {
	const nodeMap = await compileFixtureNodeMap('reserved-eof-grammar');
	const stmt = nodeMap.nodes.get('expression_statement')!;
	expect(stmt.slots.map((s) => s.name)).toEqual(['expression']);
	expect(renderOf(ir.expressionStatement(ir.identifier('a')))).toBe('a;');
});
```

  Extend the Task 2 fixture:
  - `member_expression: $ => seq($.identifier, '.', field('property', reserved('properties', $.identifier)))`;
  - `expression_statement: $ => seq(field('expression', $.identifier), $.statement_end)`.

  `compileFixtureNodeMap` and `renderOf` are the existing fixture-compile helpers used by the model tests.
- [ ] **Step 2:** Run the test. Expected: FAIL (unknown rule type `RESERVED` in link).
- [ ] **Step 3:** Implement the cases. RESERVED is structural pass-through everywhere except `collect-slots`, which
  stamps `reservedContext` on the slot being collected when it descends through one. EOF returns an empty
  contribution at every switch.
- [ ] **Step 4:** Run the test. Expected: PASS.
- [ ] **Step 5:** Regenerate all five: byte-identical. Run the gates.
- [ ] **Step 6:** Commit.

### Task 4: The identifier guard reads `reservedContext`

**Files:**
- Modify: the Task 7d seating check (`rejectKeywordText` emission in `emitters/factories.ts`, and the builder guard in
  `buildLeafGuards`): a slot with `reservedContext` checks `reservedWordset(reserved, reservedContext, entries)`
  instead of `global`. The slot-free builder guard keeps `global`.
- Test: `packages/codegen/src/emitters/__tests__/reserved-context-guard.test.ts`
- Docs: update the `buildLeafGuards` and `rejectKeywordText` glossary entries.

**Interfaces:**
- Consumes: `reservedContext` (Task 3); `reservedWordset(reserved, wordset, entries)` and `reservedMemberDiagnostics`
  (Task 7d, `compiler/generated-metadata.ts`).
- Produces: the generated per-slot check `rejectReservedText(value, 'Kind.slot', wordKindId, [texts])` for contextual
  slots, a sibling of `rejectKeywordText` in `utils.ts`.

- [ ] **Step 1: Write the failing test.**

```ts
it('a reserved(ctx) slot checks its own wordset', async () => {
	const out = await emitFixtureFactories('reserved-eof-grammar');
	expect(out.raw).toContain(`rejectReservedText(property, 'MemberExpression.property', TSKindId.Identifier, [])`);
});
it('a global-reserved word is accepted in a context whose wordset omits it', async () => {
	const F = await loadFixtureFactories('reserved-eof-grammar');
	expect(() => F.memberExpression({ object: 'a', property: 'if' })).not.toThrow();
	expect(() => F.identifier('if')).toThrow(/reserved word/);
});
it('a SYMBOL wordset member resolves to its literal; a non-literal member warns', () => {
	const rows = reservedWordset({ global: [{ type: 'SYMBOL', name: 'kw_if' }, { type: 'PATTERN', value: 'x+' }] }, 'global', entriesWith({ kw_if: 'if' }));
	expect(rows.words).toEqual(['if']);
	expect(rows.nonLiteral).toHaveLength(1);
});
```

- [ ] **Step 2:** Run the test. Expected: FAIL.
- [ ] **Step 3:** Implement: the emitter chooses the wordset by `slot.reservedContext ?? 'global'` through
  `reservedWordset`. The runtime helper is a message-only rejection, like `rejectKeywordText`.
- [ ] **Step 4:** Run the test. Expected: PASS.
- [ ] **Step 5:** Regenerate all five: byte-identical (no real slot has a context yet). Run the gates.
- [ ] **Step 6:** Commit.

### Task 5: Typescript on tree-sitter-javascript 0.25

**Files:**
- Modify: root `package.json` `pnpm.overrides`: `"tree-sitter-typescript>tree-sitter-javascript": "0.25.0"`;
  `pnpm-lock.yaml`
- Modify: `packages/typescript/grammar.sittir.ts`: `conflicts` (and precedences only where a corpus test proves a
  reading invalid)
- Regenerate: typescript package, crate, fixtures; `packages/tools/baselines/native.json` (after acceptance)
- Docs: typescript glossary lines for each ported conflict

**Interfaces:** Consumes the Task 1 CLI. Produces typescript with `reserved.global` inherited from javascript.

- [ ] **Step 1: Census before code.**
  - Apply the override, `pnpm install`, then run `tree-sitter generate` on the evaluated grammar repeatedly,
    recording each unresolved conflict. Add each as a declared conflict in a scratch copy until generate passes.
  - Report the full conflict list to brainstorm.
  - Expected first two: `variable_declarator` vs `primary_expression` (`using x!`), then `assignment_expression`
    vs `_initializer`.
  - STOP for review if the list has more than 5 entries or any needs a precedence.
- [ ] **Step 2:** Port the approved conflicts into `grammar.sittir.ts`'s `conflicts`, one per line, in the grammar's
  existing conflicts block.
- [ ] **Step 3: Write the failing test.**

```ts
it('inherits javascript reserved.global', async () => {
	const raw = await evaluate(TS_OVERRIDES);
	expect(Object.keys(raw.reserved!)).toContain('global');
	expect(reservedWordset(raw.reserved!, 'global', kindEntries).words).toContain('if');
});
it('parses a using declaration', () => {
	expect(parseTs('using x = f();').rootNode.hasError).toBe(false);
});
```

- [ ] **Step 4:** Regenerate typescript. Produce the per-kind move report:
  - new/removed kinds;
  - changed rule bodies;
  - corpus entries gained/lost;
  - validate rows;
  - fixtures;
  - ir paths.

  STOP and send the report to brainstorm; nothing is committed until it's accepted.
- [ ] **Step 5:** After acceptance, run the gates, refresh `native.json` (row diff to brainstorm first), and commit.

### Task 6: Enrich infers reserved wordsets (rust)

**Files:**
- Create: `packages/codegen/src/dsl/reserved-inference.ts`: `inferReservedWordsets(rules, word, symbols)`
- Modify: `packages/codegen/src/dsl/enrich.ts`: when the base declares no `reserved`, inject the inferred wordsets
  and wrap contextual positions in `reserved(ctx, …)`
- Create: `packages/cli/src/commands/tool/reserved-inference.ts`: `sittir tool reserved-inference --grammar <g>`
  prints each inferred word and each injected context
- Test: `packages/codegen/src/dsl/__tests__/reserved-inference.test.ts`,
  `packages/rust/tests/reserved-inference-corpus.test.ts`
- Docs: glossary entries; rust glossary lists the inferred sets

**Interfaces:**
- Consumes: `SymbolSource` (the predicted source, dsl/rule-patterns.ts), the grammar's `word`, `reservedWordset`.
- Produces:
  - `inferReservedWordsets(rules, word, symbols): { wordsets: Record<string, string[]>; contexts: { rule: string; path: string; wordset: string }[] }`;
  - the injected `reserved` grammar field (both pipelines);
  - `reserved(ctx, …)` wrappers.

- [ ] **Step 1: Write the failing unit test.**

```ts
it('global = word-shaped keyword literals minus identifier-admitted keywords', () => {
	const rules = {
		identifier: pattern('[a-z_]+'),
		_reserved_identifier: choice(str('default'), str('union')),
		name: choice(sym('identifier'), sym('_reserved_identifier')),
		if_expression: seq(str('if'), sym('name')),
		loop_expression: seq(str('loop'), str('{'), str('}'))
	};
	const out = inferReservedWordsets(rules, 'identifier', predictedSymbolSource({ rules, externals: new Set(), inline: new Set() }));
	expect(out.wordsets.global.sort()).toEqual(['if', 'loop']);
	expect(out.contexts).toEqual([]);
});
```

- [ ] **Step 2:** Run it. Expected: FAIL (module not found).
- [ ] **Step 3: Implement.**
  - Collect the STRING literals that match the grammar's `word` pattern (the word-shape fact, via the anchored
    pattern helper, not a regex in the emitter).
  - Collect the admitted keywords: literals under any choice that also offers the word symbol, directly or through a
    hidden rule such as `_reserved_identifier` (walk with `RuleWalker`).
  - `global = keywords − admitted`, sorted.
  - A context is emitted only where a position admits a strict subset different from the global complement, and it
    wraps that position's word reference.
- [ ] **Step 4:** Run the unit test. Expected: PASS.
- [ ] **Step 5: Write the corpus-equality test, failing until wired.**

```ts
it('rust parses its whole upstream corpus identically with the inferred sets', async () => {
	const before = await parseCorpusTrees('rust', { reserved: false });
	const after = await parseCorpusTrees('rust', { reserved: true });
	expect(after).toEqual(before);
});
it.each(['union', 'default', 'auto', 'raw'])('%s still parses as an identifier', (word) => {
	expect(parseRust(`fn f(){ let ${word} = 1; }`).rootNode.hasError).toBe(false);
});
```

- [ ] **Step 6:** Wire the injection in enrich (only when the base declares none), regenerate rust, and run the test.
  If trees differ, STOP. The grammar keeps no set, and the report goes to brainstorm.
- [ ] **Step 7:** Print `sittir tool reserved-inference --grammar rust` into the commit message for human review, run
  the gates, and commit.

## Execution

- **Order:** Tasks 1→4 are sequential and byte-identical except Task 1's parser tables. Task 5 and Task 6 are
  independent of each other, but both follow 1–4.
- **Stacking:** a branch stacked on feat/leaf-guard-reserved, since Task 4 extends 7d's guard.
- **Review:** each task's commit goes to brainstorm before the next.
