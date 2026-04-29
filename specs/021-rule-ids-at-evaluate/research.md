# Research: Rule IDs and Rule Classification

## Decision: Assign `RuleId` in Evaluate and carry it inline on each evaluated `Rule` occurrence

**Rationale**: Evaluate is the first phase with a complete normalized rule tree. Carrying the ID inline lets downstream phases join to the catalog without recomputing identity from path shape. Keeping metadata in a catalog avoids duplicating parent/path/provenance/classification across every node.

**Alternatives considered**:

- Catalog-only IDs located by path: rejected because consumers would still need path lookup and would be tempted to re-walk tree shape.
- Separate occurrence index object: rejected because it creates another structure consumers must keep aligned with the rule tree.
- Defer placement to implementation: rejected because the placement changes task decomposition and test contracts.

## Decision: Use deterministic path-derived occurrence identity scoped to unchanged evaluated grammar output

**Rationale**: The spec needs stable repeatable IDs for the same input, not a cross-version migration layer. A path-derived identity model matches occurrence identity: two identical shapes in different positions receive different IDs, while unchanged evaluated output remains stable.

**Alternatives considered**:

- Globally stable IDs across grammar versions: rejected as over-scoped and requiring alias/migration machinery not needed for this feature.
- Stability across unrelated sibling insertions: rejected because it complicates the identity model and weakens the "concrete occurrence" semantics.
- Runtime/global counters: rejected because they can depend on traversal or insertion accidents and violate deterministic output.

## Decision: Keep `RuleCatalog` as the authoritative metadata sidecar

**Rationale**: Inline IDs are join keys; the catalog is the single source for owner kind, rule type, parent, path, child IDs, provenance, and classification. This avoids duplicating facts across inline rules and downstream caches.

**Alternatives considered**:

- Store all metadata inline: rejected because parent/path/provenance data would be duplicated throughout the tree and harder to validate globally.
- Let each consumer maintain local metadata caches: rejected as the same DRY failure this feature is meant to remove.

## Decision: Classify every rule occurrence, including structural wrappers

**Rationale**: The spec says `Rule` is the only primary entity, so every cataloged occurrence must have a classification. Structural wrappers use deterministic aggregation: nonterminal if any descendant or wrapper semantics expose a nonterminal boundary, otherwise terminal.

**Alternatives considered**:

- Leave wrappers unclassified: rejected because it creates a second "structural-only" category outside terminal/nonterminal classification.
- Always classify wrappers as nonterminal: rejected because all-terminal wrapper forms would be over-classified.
- Defer wrapper classification to spec 022: rejected because downstream planning needs the catalog contract now.

## Decision: Field and named-alias forcing applies only to the immediately wrapped occurrence

**Rationale**: Field and named-alias semantics create a boundary at the wrapped occurrence. Descendants keep intrinsic or locally forced classifications, and wrapper aggregate classification follows from classified children. This prevents a field wrapper from flooding an entire subtree with nonterminal status.

**Alternatives considered**:

- Force the entire wrapped subtree: rejected because it erases useful terminal/nonterminal detail below the boundary.
- Force structural wrappers below the boundary but not terminal leaves: rejected because it creates special propagation rules instead of local classification.
- Defer to spec 022: rejected because this directly affects 021 catalog/classification tests.

## Decision: Provenance is occurrence-root source, not full transformation history

**Rationale**: Provenance only needs to distinguish grammar-authored, override-authored/replaced, and evaluate-synthesized occurrence roots. Descendants inherit when introduced by the same source. Full original-source/latest-transformer tracking is a different audit problem and would add complexity without serving the 021 catalog contract.

**Alternatives considered**:

- Mark every descendant in an override replacement as override-authored regardless of origin: rejected because it loses the "introduced by same source" distinction.
- Track original source and latest transformer for every occurrence: rejected as over-scoped and likely to become a second provenance graph.
- Defer provenance: rejected because catalog entries require a provenance field for tests and traceability.

## Decision: Tree-sitter KindID/FieldID metadata attaches only after generation

**Rationale**: KindID and FieldID are generated artifact metadata. They can support future enum-backed serialization, but they must not become foundational compiler identity because they are unavailable at Evaluate and do not describe concrete rule occurrences.

**Alternatives considered**:

- Use tree-sitter IDs as foundational identity: rejected because they identify generated kind/field surfaces, not individual rule occurrences.
- Ignore generated IDs entirely: rejected because the spec intentionally leaves room for future wire-format optimization.
- Attach generated IDs before Evaluate: rejected because the artifacts do not exist yet.
