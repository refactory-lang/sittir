# Research: YAML Render Templates

## Decision 1: YAML runtime dependency strategy

**Decision**: Codegen emits `templates.yaml` per grammar package. Core adds `yaml` as a runtime dependency and parses the YAML file when `createRenderer` is called (or at module init in generated packages).

**Rationale**: The codegen produces YAML; core consumes it. A minor dependency in core (`yaml` package) is acceptable — core is hand-written infrastructure, not a generated package. The zero-runtime-deps constitution principle applies to generated builder packages themselves, not to core which is already a dependency of all generated packages.

**Alternatives considered**:
- **Codegen emits both YAML + TypeScript module**: Over-engineering — adds a derived artifact that must stay in sync. YAML is the single source of truth; core parses it directly.
- **JSON instead of YAML**: YAML's `|` block scalars are significantly more readable for multiline templates (the primary use case). JSON would require escaped newlines throughout.

**Implementation**: Codegen emits one file per grammar: `templates.yaml`. Generated packages load it via core's YAML-aware `createRenderer`. The `yaml` package is added as a dependency of `@sittir/core`.

## Decision 2: Deterministic output — metadata.generatedAt

**Decision**: Remove the `generatedAt` timestamp from `metadata`. Use only `grammarSha` for provenance tracking.

**Rationale**: Constitution Principle VI requires byte-identical output for the same grammar version. A timestamp changes on every regeneration, breaking deterministic diffing and CI reproducibility.

**Alternatives considered**:
- **Keep timestamp, exclude from determinism check**: Adds complexity — which fields are deterministic and which aren't? Rejected for simplicity.
- **Keep timestamp in YAML only, strip from .ts emission**: Still makes the YAML file non-deterministic. Rejected.

**Implementation**: The `metadata` object contains only `grammarSha` (and optionally `treeSitterVersion` which is also deterministic for a given grammar).

## Decision 3: YAML library placement

**Decision**: Add `yaml` (npm package) as a dependency of both `@sittir/codegen` (serialization) and `@sittir/core` (parsing).

**Rationale**: Codegen serializes template data to YAML. Core parses it at runtime. The `yaml` package (v2) is the standard TypeScript-native YAML library with full spec compliance and built-in types. One package covers both directions.

**Alternatives considered**:
- **js-yaml**: Older, less TypeScript-friendly. `yaml` (v2) is the modern successor.
- **JSON5 instead of YAML**: Would work but YAML's `|` block scalars are significantly more readable for multiline templates (the primary use case).

## Decision 4: Generated package import path changes

**Decision**: Generated packages replace `import { rules } from './rules.js'` and `import { joinBy } from './joinby.js'` with loading the `templates.yaml` file via core's YAML-aware API.

**Rationale**: The current split across `rules.ts` and `joinby.ts` is an artifact of the S-expression format where separators couldn't be expressed per-rule. With YAML templates containing per-rule `joinBy`, the data naturally lives in one file. Core parses the YAML and provides the typed `RulesConfig` to `createRenderer`.

**Alternatives considered**:
- **Keep separate .ts files**: Pointless duplication — the data comes from one YAML source.
- **Emit a .ts module alongside YAML**: Over-engineering — core handles YAML parsing directly.

**Implementation**: Core owns template loading and rendering. Generated `factories.ts` no longer imports rules or joinBy — it receives a bound renderer from core. The `joinby.ts` emitter is removed; the `rules.ts` emitter is replaced by the YAML emitter. No `.ts` intermediary needed.

## Decision 5: `createRenderer` API signature

**Decision**: The `createRenderer` API signature changes from `createRenderer(rules: RulesRegistry, joinBy?: JoinByMap)` to `createRenderer(yamlPath: string)` (or `createRenderer(config: RulesConfig)` if pre-parsed). Core owns loading the YAML file, parsing it, and closing over the template data.

**Rationale**: Render is entirely a core concern. Currently, generated `factories.ts` imports `rules` and `joinBy` from generated files, then passes them to `createRenderer`. With YAML templates, core should load and parse the YAML directly — factories should not be aware of template format or content. This keeps the boundary clean: factories produce `NodeData`, core renders it.

**Alternatives considered**:
- **Keep factories loading templates**: Mixes concerns — factories shouldn't know about render template format.
- **Pass RulesConfig from generated package to core**: Still requires generated packages to parse YAML or hold template data. Core should own the entire template lifecycle.

**Implementation**: `createRenderer(yamlPath: string)` loads and parses the YAML file, closes over the `RulesConfig`. Returns bound `render`/`toEdit` functions. Generated `factories.ts` calls `createRenderer` with the path to `templates.yaml` (resolved relative to the package). The `JoinByMap` and `RulesRegistry` types are removed from the public API.

## Decision 6: Override fields via `overrides.json`

**Decision**: Per-grammar `overrides.json` files provide supplemental field names for nodes where the tree-sitter grammar lacks explicit FIELDs. The codegen merges overrides during enrichment and validates against grammar rule structure.

**Rationale**: Tree-sitter grammars vary in their use of FIELDs. Rust's grammar leaves ~10-15 nodes without field names for positional children (e.g., `index_expression` has two `_expression` children). Without overrides, templates would be forced to use positional `$$$CHILDREN` for these nodes, losing semantic clarity.

**Alternatives considered**:
- **Fully automatic naming**: The codegen can detect candidates (same-kind positional, discriminator tokens) but can't assign semantically meaningful names. "child_0" / "child_1" are worse than nothing.
- **Inline in YAML templates**: Mixing structural metadata with render templates muddies the template format.
- **Patch tree-sitter grammars upstream**: Impractical — grammar repos are maintained by different communities with different goals.

**Implementation**: `overrides.json` at each grammar package root, loaded by codegen during NodeModel enrichment. Schema mirrors `node-types.json` fields block. `anonymous: true` marks anonymous tokens. Codegen validates entries against grammar rule structure and reports errors for mismatches.

## Decision 7: wrap.ts field promotion heuristics

**Decision**: Five heuristics for promoting unnamed children into `fields`, ordered by specificity: (1) tree-sitter FIELD by name, (2) unique kind, (3) anonymous token as value, (4) token-positional, (5) CHOICE branch by token.

**Rationale**: Each heuristic covers a distinct grammar pattern. Heuristics 1-2 are fully automatic (no overrides needed). Heuristics 3-5 require override names but the promotion logic is still generated automatically by the codegen.

**Alternatives considered**:
- **Single generic wrap function**: Too slow at runtime — per-kind functions inline the known field structure.
- **No heuristics, manual wrap**: Defeats the purpose of codegen — would require hand-writing wrap functions for every node kind.
- **Fewer heuristics**: Leaving out heuristic 4 or 5 would fail for `index_expression`, `range_expression`, and similar nodes that are common in Rust.

**Implementation**: Codegen walks the enriched rule for each node kind and selects the appropriate heuristic per child. Generated `wrap.ts` functions inline the promotion logic. After wrapping, `children` contains only truly unnamed remainder.

## Decision 8: Children classification for template generation

**Decision**: Codegen classifies each node's unnamed children by simplifying the grammar rule: strip tokens from SEQs, unwrap single-member SEQs, leave CHOICEs intact. The simplified root determines the template pattern.

**Rationale**: Different grammar rule shapes produce different template patterns. A REPEAT produces `$$$CHILDREN` + `joinBy`. A SEQ with mixed fields and children produces field variables + `$$$CHILDREN` for the unnamed portion. Classification drives correct template generation.

**Alternatives considered**:
- **No classification, uniform `$$$CHILDREN`**: Loses the ability to generate field-specific templates for SEQ-based nodes.
- **Deep rule analysis**: Diminishing returns — the 5 simplified roots cover all observed patterns across Rust, TypeScript, and Python grammars.
