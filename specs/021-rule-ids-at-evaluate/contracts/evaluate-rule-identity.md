# Contract: Evaluate Rule Identity

This contract describes the internal compiler interface produced by Evaluate for spec 021. It is not a public generated package API.

## Evaluate Output

`RawGrammar` MUST include rule occurrence identity and classification metadata:

```ts
export interface RawGrammar {
	readonly name: string;
	readonly rules: Record<string, IdentifiedRule>;
	readonly references: SymbolRef[];
	readonly ruleCatalog: RuleCatalog;
	// existing RawGrammar fields remain present
}
```

If implementation preserves the existing `Record<string, Rule>` shape temporarily, the transition MUST still provide an equivalent typed accessor that guarantees every returned rule occurrence carries its inline `RuleId`.

## IdentifiedRule

```ts
export type RuleId = string;

export interface IdentifiedRule {
	readonly id: RuleId;
	readonly rule: Rule;
}
```

Contract requirements:

- Every concrete rule occurrence reachable from `RawGrammar.rules` MUST carry one inline `RuleId`.
- The inline ID MUST be sufficient for a downstream consumer to join to the catalog without deriving a path.
- The inline ID MUST NOT be treated as a replacement for catalog metadata.

## RuleCatalog

```ts
export interface RuleCatalog {
	readonly byId: ReadonlyMap<RuleId, RuleCatalogEntry>;
	readonly rootsByKind: ReadonlyMap<string, RuleId>;
	readonly classificationById: ReadonlyMap<RuleId, RuleClassification>;
}
```

Contract requirements:

- `byId.size` MUST equal the number of inline rule occurrences.
- `rootsByKind` MUST contain exactly one root ID for each top-level evaluated rule.
- `classificationById` MUST contain exactly one classification for every cataloged ID.
- Serialization order MUST be deterministic for unchanged evaluated grammar output.

## RuleCatalogEntry

```ts
export type RuleProvenance =
	| 'grammar-authored'
	| 'override-authored-or-replaced'
	| 'evaluate-synthesized';

export interface RuleCatalogEntry {
	readonly id: RuleId;
	readonly ownerKind: string;
	readonly ruleType: Rule['type'];
	readonly parentId?: RuleId;
	readonly path: readonly RulePathSegment[];
	readonly childIds: readonly RuleId[];
	readonly provenance: RuleProvenance;
}
```

Contract requirements:

- `ownerKind` MUST name the top-level rule that owns the occurrence.
- `parentId` MUST be absent only for root entries.
- `path` MUST be deterministic for unchanged evaluated grammar output.
- `childIds` MUST represent direct children only and preserve declaration order.
- `provenance` MUST record occurrence-root source only.

## RuleClassification

```ts
export interface RuleClassification {
	readonly ruleId: RuleId;
	readonly kind: 'terminal' | 'nonterminal';
	readonly forcedBy?: 'intrinsic' | 'field' | 'named-alias';
	readonly edgeName?: string;
	readonly cstSurface?: 'named' | 'anonymous';
}
```

Contract requirements:

- Every rule occurrence MUST have exactly one classification.
- `field(name, rule)` MUST set `edgeName` and force the immediately wrapped occurrence to `nonterminal`.
- `alias(rule, $.Name)` MUST force the immediately wrapped occurrence to `nonterminal` and record named CST surface metadata.
- `alias(rule, 'literal')` MUST record anonymous CST surface metadata without creating a nonterminal boundary by itself.
- Structural wrappers MUST classify by deterministic aggregation.

## Symbol References

Existing `SymbolRef` records MAY be retained during implementation, but any occurrence-aware successor MUST anchor outbound references to `RuleId` rather than only top-level kind strings.

Minimum compatible extension:

```ts
export interface SymbolRef {
	readonly refType: 'symbol' | 'alias' | 'token';
	readonly from: string;
	readonly to: string;
	readonly fromRuleId?: RuleId;
}
```

## Invariants

- No `node-types.json` data may be used to build rule identity or classification.
- Every child-bearing `Rule["type"]` switch used by identity/classification MUST be exhaustive and fail loudly on unhandled variants.
- Later KindID/FieldID metadata must attach as derived metadata only.

## Generated Metadata Layer

Generated metadata is represented as a separate late catalog derived from generated artifact ID tables after Evaluate has already produced `RuleId`, `RuleCatalog`, and `RuleClassification`.

Contract requirements:

- Kind IDs attach to top-level kind names that already have `RuleCatalog.rootsByKind` entries.
- Field IDs attach to parent-edge names observed in `RuleClassification.edgeName`.
- Generated metadata MUST NOT mutate `RuleId` values, catalog entries, or classification records.
- Generated metadata derivation MUST NOT read `node-types.json` to infer foundational rule identity or terminal/nonterminal classification.
- Generated package constants expose parser-scoped numeric `TreeSitterKindId` and `TreeSitterFieldId` const enums, plus forward/reverse maps, derived from the compiled `parser.wasm` language metadata.
- The enum values are scoped to the generated parser artifact version. They are suitable for backend serialization within a matched package/backend build, not for cross-version semantic identity.
