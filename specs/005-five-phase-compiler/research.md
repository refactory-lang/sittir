# Research: Five-Phase Grammar Compiler

**Phase 0 output** — all Technical Context unknowns resolved.

## Decision 1: grammar.js Evaluation Strategy

**Decision**: Execute grammar.js using tree-sitter's own DSL runtime approach. Provide our implementations of the DSL functions (`seq`, `choice`, `field`, `repeat`, etc.) as globals, then import the grammar module. When overrides exist, the entry point is overrides.ts which imports grammar.js as base — tree-sitter's `grammar(base, { rules })` handles the merge natively.

**Rationale**: Tree-sitter's `dsl.js` (saved at `specs/005-five-phase-compiler/reference/tree-sitter-dsl.js`) shows exactly how this works: DSL functions are attached to `globalThis`, the grammar module is imported, and the result is a plain object tree. The extension mechanism passes each base rule as the second argument to extension rule functions (`ruleFn.call(ruleBuilder, ruleBuilder, baseGrammar.rules[ruleName])` at line 326). No custom two-pass system needed.

**Alternatives considered**:
- **Parse grammar.json instead**: Discarded — grammar.json is a lossy intermediate format that doesn't preserve the DSL structure. The spec mandates grammar.js as the sole input.
- **Custom two-pass system**: Initially proposed, but tree-sitter's grammar() already provides the base rule as the second argument. Building our own merge would duplicate existing logic.
- **Full JS evaluation (vm module)**: Too risky — arbitrary code execution. The DSL proxy approach limits execution to the known DSL functions.

## Decision 2: Override File Format

**Decision**: TypeScript module using tree-sitter's native `grammar(base, { rules })` extension mechanism. Each rule function receives `($, original)` where `original` is the base grammar's rule. New DSL primitives (`transform`, `insert`, `replace`) operate on `original`.

**Rationale**: Tree-sitter's `grammar()` already passes the base rule as the second argument (dsl.js line 326). Override authors write `function_item: ($, original) => transform(original, { 2: field('body') })`. The `transform` primitive walks the `original` object tree and applies patches at specified positions. No custom merge logic needed — tree-sitter handles `Object.assign({}, baseGrammar.rules)` then overwrites with extension rules.

**Alternatives considered**:
- **JSON config (current overrides.json)**: Limited expressiveness, no cross-referencing, no composition.
- **YAML**: More readable but still declarative — can't express rule transformations.
- **Separate positional addressing without grammar extension**: Works but diverges from the tree-sitter ecosystem's established patterns.

## Decision 3: node-types.json Role

**Decision**: Validation only. All structural information derived from the rule tree.

**Rationale**: node-types.json is a derived artifact — tree-sitter generates it from grammar.js. Using it as a primary data source creates a circular dependency and makes the pipeline fragile to node-types.json format changes. The rule tree contains strictly more information than node-types.json.

**Alternatives considered**:
- **Primary data source (current approach)**: The current pipeline initializes models from node-types.json then reconciles with grammar rules. This leads to "reconcile" functions that patch mismatches. Eliminated.

## Decision 4: Reference Graph Derivation Scope

**Decision**: Core derivations (inline confidence, supertype promotion, dead rules, cycles) are active. New derivations (field name inference, synthetic supertypes, override inference, naming consistency, global optionality, separator consistency, override candidate quality) produce suggested overrides only.

**Rationale**: Core derivations replicate current behavior. New derivations are analytical tools for override authoring — auto-applying them risks incorrect inferences changing pipeline output silently. The suggested overrides file gives the developer control.

**Alternatives considered**:
- **All active**: Risk of incorrect inferences producing wrong output.
- **Core only, no suggestions**: Misses the opportunity to assist override authoring for new grammars.

## Decision 5: Baseline Validation Strategy

**Decision**: Golden file snapshots for investigation + e2e validation tests as the correctness contract.

**Rationale**: E2e tests verify behavioral correctness (factories produce right NodeData, render produces valid source). Golden file diffs reveal formatting/ordering changes that may be intentional. The two together cover both correctness and explainability.

**Alternatives considered**:
- **Golden files only**: Brittle — formatting changes cause false failures.
- **E2e tests only**: Misses subtle output changes that tests don't cover.

## Decision 6: Module-Level State Elimination

**Decision**: Replace all caches and singletons with function parameters.

**Current state inventory** (from codebase research):
- `grammar-reader.ts`: `grammarCache`, `grammarJsonCache`, `explicitPaths` (3 Maps)
- `grammar.ts`: `grammarJsonCache` (1 Map)
- `overrides.ts`: `overridePaths` (1 Map)
- `node-types.ts`: `nodeTypesCache`, `explicitNodeTypePaths` (2 Maps)
- `token-attachment.ts`: `OPEN_DELIMITERS`, `CLOSE_DELIMITERS` (2 Sets — constants, acceptable)
- `naming.ts`: `JS_RESERVED` (1 Set — constant, acceptable)

**Rationale**: Caches make functions impure and prevent independent testing. Each phase takes its inputs as parameters. Constants (reserved words, delimiter sets) are acceptable — they don't mutate.

## Decision 7: Emitter Architecture

**Decision**: All emitters consume `NodeMap` exclusively. `from` derives from factory signatures, `ir` derives from factory exports — neither goes back to the node model.

**Rationale**: This enforces phase boundaries. If an emitter needs data, it must be on `AssembledNode`, not derivable by re-walking the rule tree. The design doc's emitter dependency diagram makes this explicit:
- types, factories, templates: direct from NodeMap
- from: derives from factory signature (what fields does the factory accept?)
- ir: derives from factory exports (what did the factory produce?)
