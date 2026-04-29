# Data Model: Rule IDs and Rule Classification

## RuleId

**Purpose**: Opaque deterministic identifier for one concrete Evaluate-stage rule occurrence.

**Fields**:

- `value`: deterministic opaque string or branded string value.

**Validation Rules**:

- MUST identify one concrete occurrence, not a semantic slot, merged field, or structurally deduplicated subtree.
- MUST be stable for unchanged evaluated grammar output.
- MAY change for affected paths when evaluated grammar structure changes.
- MUST NOT depend on process-global counters or object insertion accidents.

**Relationships**:

- Appears inline on each evaluated rule occurrence.
- Keys exactly one `RuleCatalogEntry`.
- Keys exactly one `RuleClassification`.

## IdentifiedRule

**Purpose**: Evaluated rule occurrence with its inline identity.

**Fields**:

- `id`: `RuleId`.
- `rule`: existing compiler `Rule` shape.

**Validation Rules**:

- Every evaluated occurrence MUST have an inline `id`.
- The inline `id` MUST join to exactly one catalog entry.
- Inline identity MUST NOT duplicate catalog metadata such as parent, path, provenance, or classification.

**Relationships**:

- Owned by a top-level kind in `RawGrammar.rules`.
- Indexed by `RuleCatalog`.

## RuleCatalog

**Purpose**: Authoritative sidecar emitted by Evaluate for occurrence metadata.

**Fields**:

- `byId`: mapping from `RuleId` to `RuleCatalogEntry`.
- `rootsByKind`: mapping from top-level kind name to root `RuleId`.
- `classificationById`: mapping from `RuleId` to `RuleClassification`.

**Validation Rules**:

- Every inline `RuleId` MUST appear exactly once in `byId`.
- Every non-root entry MUST reference an existing parent entry.
- Every child ID in a catalog entry MUST reference an existing entry.
- Every cataloged ID MUST have exactly one classification.
- Catalog serialization MUST be deterministic.

**Relationships**:

- Belongs to `RawGrammar`.
- Consumed by later compiler phases as the only foundational identity metadata source.

## RuleCatalogEntry

**Purpose**: Metadata for one concrete rule occurrence.

**Fields**:

- `id`: `RuleId`.
- `ownerKind`: top-level grammar rule kind that owns this occurrence.
- `ruleType`: `Rule["type"]` for this occurrence.
- `parentId`: parent occurrence ID, absent for top-level root entries.
- `path`: deterministic path from owner root to this occurrence.
- `childIds`: direct child occurrence IDs in declaration order.
- `provenance`: `grammar-authored`, `override-authored-or-replaced`, or `evaluate-synthesized`.

**Validation Rules**:

- `ownerKind` MUST exist in evaluated `RawGrammar.rules`.
- `path` MUST be deterministic for unchanged evaluated grammar output.
- `childIds` MUST match the child-bearing structure of `ruleType`.
- Provenance MUST record occurrence-root source only, not full transformation history.
- Descendants inherit provenance only when introduced by the same source.

## RuleClassification

**Purpose**: Rule-level terminal/nonterminal classification and related local facts.

**Fields**:

- `ruleId`: `RuleId`.
- `kind`: `terminal` or `nonterminal`.
- `forcedBy`: optional `intrinsic`, `field`, or `named-alias`.
- `edgeName`: optional parent-edge field name.
- `cstSurface`: optional `named` or `anonymous` surface metadata.

**Validation Rules**:

- Every rule occurrence MUST receive one classification.
- `field(name, rule)` MUST force only the immediately wrapped occurrence to `nonterminal` and set the parent-edge name.
- `alias(rule, $.Name)` MUST force only the immediately wrapped occurrence to `nonterminal` and set named CST surface metadata.
- `alias(rule, 'literal')` MUST affect anonymous CST surface metadata only and MUST NOT create a new nonterminal boundary by itself.
- Structural wrappers MUST classify by deterministic aggregation: nonterminal if any descendant or wrapper semantics expose a nonterminal boundary, otherwise terminal.
- Tree-sitter named/anonymous surface metadata MUST stay distinct from Sittir terminal/nonterminal classification.

## ParentEdgeName

**Purpose**: Field name attached by `field(name, rule)`.

**Fields**:

- `name`: raw grammar field name.
- `fromRuleId`: parent or wrapper occurrence that owns the named edge.
- `toRuleId`: immediately wrapped child occurrence.

**Validation Rules**:

- Parent-edge names are edge metadata, not primary entities.
- FieldID metadata, when available later, attaches to this edge/name concept rather than replacing `RuleId`.

## GeneratedMetadata

**Purpose**: Late metadata derived from tree-sitter generated artifacts.

**Fields**:

- `kindId`: optional tree-sitter generated kind ID.
- `fieldId`: optional tree-sitter generated field ID.
- `sourceArtifact`: generated tree-sitter artifact used to derive the metadata.

**Validation Rules**:

- MUST attach only after tree-sitter generation.
- MUST NOT become foundational identity.
- MUST remain traceable back to `RuleId`, `RuleClassification`, and parent-edge naming.
