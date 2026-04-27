# Data Model: Grammar Model Pipeline

**Date**: 2026-03-28

## Entity Overview

```
Grammar (raw) ─────────► EnrichedRule (classified DU)
                              │
NodeTypes (raw) ──► NodeModel (7 variants, mutable)
                              │ hydrate
                              ▼
                    HydratedNodeModel (frozen, resolved)
                              │
                           Emitters
```

## Layer 1: Grammar

```typescript
interface Grammar {
	name: string;
	rules: Record<string, GrammarRule>;
	extras: GrammarRule[];
	conflicts: string[][];
	precedences: PrecedenceEntry[];
	externals: GrammarRule[];
	inline: string[];
	supertypes: string[];
	word: string | null;
}
```

**Identity**: `name` (grammar name, e.g. "rust")
**Source**: `grammar.json`
**Relationships**: Grammar → GrammarRule (1:many via `rules`)

## Layer 2: EnrichedRule

```typescript
type EnrichedRule =
	| SupertypeRule // subtypes: string[]
	| BranchRule // fields, children?, separators
	| ContainerRule // children, separators
	| KeywordRule // text: string
	| EnumRule // values: string[]
	| LeafRule; // pattern: string | null
```

**Identity**: kind name (key in `Map<string, EnrichedRule>`)
**Source**: Derived from Grammar only (no NodeTypes)
**Discriminant**: `modelType` field on each variant

## Layer 3: NodeTypes

```typescript
interface NodeTypes {
	entries: Map<string, NodeTypeEntry>;
}

interface NodeTypeEntry {
	type: string;
	named: boolean;
	fields?: Record<string, NodeTypeField>;
	children?: NodeTypeField;
	subtypes?: { type: string; named: boolean }[];
}

interface NodeTypeField {
	multiple: boolean;
	required: boolean;
	types: { type: string; named: boolean }[];
}
```

**Identity**: `type` (kind name)
**Source**: `node-types.json`

## Layer 4: NodeModel (pre-hydration, mutable)

### NodeModel Union

```typescript
type NodeModel =
	| BranchModel
	| ContainerModel
	| LeafModel
	| EnumModel
	| KeywordModel
	| TokenModel
	| SupertypeModel;
```

**Identity**: `kind` (unique across all models, key in `Map<string, NodeModel>`)
**Discriminant**: `modelType` literal string
**Lifecycle**: initialized (step 4) → reconciled (step 5) → members applied (step 6) → refined (step 7) → aliased (steps 8-9) → named (step 10) → optimized (step 11) → hydrated (step 12)

### Model Variants

| Variant        | modelType     | Unique Fields                                                                                    | Relationships                                          |
| -------------- | ------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| BranchModel    | `'branch'`    | `fields: FieldModel[]`, `children?: ChildModel[]`, `members: NodeMember[]`, `rule: EnrichedRule` | fields → kinds (string[]), children → kinds (string[]) |
| ContainerModel | `'container'` | `children: ChildModel[]`, `members: NodeMember[]`, `rule: EnrichedRule`                          | children → kinds (string[])                            |
| LeafModel      | `'leaf'`      | `pattern: string \| null`, `rule: EnrichedRule \| null`                                          | —                                                      |
| EnumModel      | `'enum'`      | `values: string[]`, `rule: EnrichedRule \| null`                                                 | —                                                      |
| KeywordModel   | `'keyword'`   | `text: string`, `rule: EnrichedRule \| null`                                                     | —                                                      |
| TokenModel     | `'token'`     | `rule: EnrichedRule \| null`                                                                     | —                                                      |
| SupertypeModel | `'supertype'` | `subtypes: string[]`, `rule: EnrichedRule \| null`                                               | subtypes → kind names                                  |

### Common Base

```typescript
interface NodeModelBase {
	modelType: string;
	kind: string;
	typeName?: string; // added by naming step
	factoryName?: string; // added by naming step
}
```

### Sub-Models

#### FieldModel (discriminated by `multiple`)

| Variant          | multiple | Extra Fields                |
| ---------------- | -------- | --------------------------- |
| SingleFieldModel | `false`  | —                           |
| ListFieldModel   | `true`   | `separator: string \| null` |

Common: `name`, `required`, `kinds: string[]`, `propertyName?`, `fieldSignature?` (added by optimization)

#### ChildModel (discriminated by `multiple`)

| Variant          | multiple | Extra Fields                |
| ---------------- | -------- | --------------------------- |
| SingleChildModel | `false`  | —                           |
| ListChildModel   | `true`   | `separator: string \| null` |

Common: `required`, `kinds: string[]`, `childSignature?` (added by optimization)

#### NodeMember

```typescript
type NodeMember =
	| { member: "field"; field: FieldModel }
	| { member: "token"; value: string; optional: boolean }
	| { member: "child"; child: ChildModel }
	| { member: "choice"; branches: NodeMember[][] };
```

## Hydrated Types (post-hydration, frozen)

```typescript
type Hydrate<T> = T extends { kinds: string[] }
	? Readonly<Omit<T, "kinds"> & { kinds: HydratedNodeModel[] }>
	: T extends { fields: FieldModel[] }
		? Readonly<
				Omit<T, "fields" | "children"> & {
					fields: Hydrate<FieldModel>[];
					children?: Hydrate<ChildModel>[];
				}
			>
		: T extends { children: ChildModel[] }
			? Readonly<Omit<T, "children"> & { children: Hydrate<ChildModel>[] }>
			: Readonly<T>;

type HydratedNodeModel =
	| Hydrate<BranchModel>
	| Hydrate<ContainerModel>
	| Hydrate<LeafModel>
	| Hydrate<EnumModel>
	| Hydrate<KeywordModel>
	| Hydrate<TokenModel>
	| Hydrate<SupertypeModel>;
```

**Invariants**:

- All `kinds` arrays contain `HydratedNodeModel` references (not strings)
- All properties are `readonly`
- References form a DAG (no cycles — supertypes reference concrete types, fields reference any type)

## GrammarModel (pipeline output)

```typescript
interface GrammarModel {
	readonly name: string;
	readonly models: ReadonlyMap<string, HydratedNodeModel>;
	readonly signatures: SignaturePool;
}

interface SignaturePool {
	readonly field: Map<string, FieldSignature>;
	readonly child: Map<string, ChildSignature>;
}
```

**Identity**: `name` (grammar name)
**Consumers**: All emitters via `generate()`
**Signature pools**: Fields/children with identical kind sets share the same FieldSignature/ChildSignature → same TypeScript type expression in generated code

## State Transitions

```
NodeTypeEntry ──initializeModels──► NodeModel (shell)
                                        │
EnrichedRule ───reconcile──────────► NodeModel (enriched)
                                        │
                ──applyMembers─────► NodeModel (with members)
                                        │
                ──refineModelType───► NodeModel (final type)
                                        │
                ──applyTokenAliases─► NodeModel (aliased tokens)
                                        │
                ──applyNaming──────► NodeModel (with names)
                                        │
                ──optimize─────────► NodeModel (with signatures)
                                        │
                ──hydrate──────────► HydratedNodeModel (frozen)
```

Narrowing transitions (during reconcile):

- `LeafModel` → `KeywordModel` (grammar found constant text)
- `LeafModel` → `EnumModel` (grammar found CHOICE of STRINGs)

Reclassification (during refine):

- `BranchModel` → `ContainerModel` (no fields after member application, only children)
