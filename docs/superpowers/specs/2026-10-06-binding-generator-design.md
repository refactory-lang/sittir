# The binding generator

**Status:** Design spec. It implements the map of the bindings spec (`2026-09-13-bindings-and-vocabulary-design.md`, §5) as the portable engine's read and build over a grammar's typed surface. The portable surface itself is the bindings spec's: the engine surface and `attach` (§1, §9), structures and `build` (§8), portable nodes, `$value`, role tests and identity (§9). This spec says what the generator emits to realize them, and how. Measurements and the probe they come from are in `docs/superpowers/probes/2026-10-06-binding-generator/`.

## 1. Scope

- **Inputs:** a grammar's `bindings.scm`, its slot model and the locked vocabulary under `packages/types/src/vocabulary/`.
- **Output:** per grammar package, the type maps in its types module and one generated runtime module. They are regenerated with the package and covered by the generated-output check, like the factories.
- **The generator writes no interface.** The vocabulary is authored. It grows by features: a construct a grammar has and the vocabulary lacks (an unclaimed kind, an unmapped kind, a member no interface declares) is covered by a feature that adds the kind or member (bindings spec §4.1), and the languages that have the construct compose it.
- **The generated code calls the grammar's typed surface:** the readers of `X.Parsed`, the loose `build.*`, `is.*` and the grammar's kind ids. It implements read and build. Edit (`$with` through the vocabulary) and find (bindings compiled to queries) are not part of it.

## 2. What the generator emits for one grammar

### 2.1 Type maps, beside the low-level ones

These go into the grammar package's types module, beside `ParsedByKindId` and `BoundByKindId`, so a low-level type names its portable node type where it is defined.

- **`Ctx extends GrammarContext`,** the language's context: per namespace, the union of the interfaces of the kinds the grammar claims (bindings spec §3.4, §5.1). Every portable node type and member type is instantiated over it.

  ```ts
  export interface Ctx extends GrammarContext {
  	readonly identifier: V.Identifier<Ctx> | V.Identifier.Crate<Ctx> | V.Identifier.Field<Ctx> | …;
  	…
  }
  ```

- **`ViewForm<I>`,** the one mapped type that turns a property-shaped interface into its portable node form: each member becomes a closure that is always present, its return type carrying the optionality (`body(): … | undefined`). Member types resolve through `VocabViews`, recursing only through arrays, as `Resolve` goes through `ParsedByKindId` by `$type`.
- **`VocabViews`,** a flat table from each vocabulary kind the grammar claims to its portable node type, `ViewForm` of its interface. Being flat keeps the mapped types out of deep comparisons.
- **`ViewByKind`,** for every grammar kind id, what reading a value of that kind gives:
  - a claimed kind: its claims' entries in `VocabViews`;
  - an unclaimed subtype: its nearest claimed supertype's claims;
  - a container (a list, an envelope, an alias or polymorph with one non-layout node slot, a declared `@element` pattern): its elements, as an array when the container is a list;
  - a fixed-literal token or leaf: its vocabulary const string (bindings spec §3.3, §9);
  - a leaf whose text varies: a node carrying the text as `$value`;
  - an unclaimed kind: `never`;
  - anything else: `V.Unmapped<'grammar:kind'>`.

  Each entry is one alias per kind (`type VK_FunctionItem = …`), so a container that contains itself, such as a token tree, resolves through its array rather than through a circular indexed access.
- **`ViewOf<N>`** maps a reader's result type through `ViewByKind`, distributing over the reader's union and keeping `undefined` where the slot is optional. **`EnumViewByKind`** and **`ViewEnumOf<N>`** do the same for a token that is a value of a claimed enum (§2.3).
- **`Backward`,** the grammar kinds a node crosses low→high on its own: those whose every claim the node itself decides, by its kind, its field literals and its own text (bindings spec §9). In rust it leaves out 2 of the 152 claimed kinds, `function_item` and `function_signature_item`, which hold the 5 contextual claims (methods, static methods and signatures inside impls and traits).
- **`attach` and `is` overloads** are typed from these maps: a portable engine's `attach` from `Backward` and `ViewByKind`, a grammar engine's from the vocabulary kinds the map builds; `is.<role path>` narrows a grammar node to the row's grammar types and a portable node to the vocabulary interface.

### 2.2 Portable node literals

There is one factory per read entry, meaning a grammar kind and one vocabulary kind it can be. It returns that kind's entry in `VocabViews`, an object literal whose one data member is `$type`:

```ts
const FunctionItemAsDeclarationFunction = (n: T.FunctionItem.Parsed): VocabViews['declaration.function'] => ({
	$type: n.$type,
	name: () => read(n.name()),
	parameters: () => read(n.parameters()),
	async: () => n.functionModifiers()?.modifiers().includes(TSKindId.AsyncKeyword) ?? false,
	…
});
```

- **Members** come from the route resolution (§3). Every non-layout slot of the claimed kind is a member, named by its capture or by the slot's property name, unless a deep member routes through it.
- **Every interface member has a closure,** inherited members included, read from the vocabulary itself. A member with no route returns `undefined`, so a required member with no route is a compile error.
- **Closures by member type:** a presence member tests the token along its route; a nested member reads along its route; a slot member returns the reader's result read as a portable value.
- **The return type is the conformance check.** A member the portable node form rejects, and a member the interface does not declare, are compile errors in the generated module; an object literal's excess properties are refused.
- **A refinement** (a claim with field literals beside the grammar kind's plain claim) reads like its parent and pins each literal (`operator: () => '+'`).
- **Leaf text:** a leaf whose text varies carries a `$value` closure; a fixed-literal leaf is its const string, with no `$value`.
- **The low-level node** `n` is captured by the closures and never exposed.
- **No `kind` member:** the vocabulary kind is the literal's type, and a role is tested with `is`.

### 2.3 The read dispatch

The portable engine's `parse` enters at the root, and its `attach` accepts a low-level node whose kind is in `Backward`. Behind both, the member closures share one internal dispatch that takes any value:

- **A node,** by its `$type`. A grammar kind with several entries tests them most specific first: placed claims, then predicate claims, then claims with more field literals. A literal is tested by comparing the slot's stored token with the literal's kind id. A predicate claim (`#eq?`, `#match?`) is tested on the node's text, and a template fills its holes from the regex's named groups (bindings spec §7). A contextual claim resolves from the enclosing kinds a parent's member passes down; nothing queries a node's ancestors. A container unwraps to its elements with its element slot's reader, and an absent optional list reads as `[]`.
- **A token kind id,** as the vocabulary's const string for it. Where a slot admits a claimed enum, the slot decides that the id is that enum's value, since the two readings are one number: `bool` as a `primitive_type` value and `bool` as a slot's terminal share a kind id.
- **`undefined`,** as `undefined`.

Nothing queries the tree at read time. A portable node costs one small object, and its members cost what the readers cost (§5).

### 2.4 Build entries

The portable engine's `build` is typed per kind from the vocabulary. A structure's kind, named by `kind` where its context does not decide it (bindings spec §3.4), selects the build entry, and each member is handed to its slot's loose-builder parameter:

- A presence or nested member routed through an intermediate kind builds that kind's input; through a forwarded envelope that is its spread form (`functionModifiers(TSKindId.AsyncKeyword, …)`). Loose builders never guess a keyword from text.
- A refinement fills in its pinned literals.
- An enum claim builds as its token's kind id, through the enum's text table where the structure spells the value.
- A leaf whose text varies builds from its text.
- **A kind with no bare factory:** polymorphs (`struct_item`, `closure_expression`, `range_expression`) build through a named form, and claimed supertypes (`integer_literal`, `escape_sequence`) through a subtype. The build entry picks the form or subtype by the routing the `ir` and loose builders already use (`buildFactoryNodeFromReference` over the `ir` surface). The generator reuses that rule and writes no second one.

The input is runtime data (a structure can arrive as JSON), so the build side calls the loose builders through one checked boundary, `call(factory, input)`. The per-kind types check what is written in code; the round-trip lane checks the rest. On the low-level surface the same generic build is keyed by `$type`.

### 2.5 Crossing and role tests

`attach` runs on the read and build entries and takes nothing else from the generator.

- **Low→high:** a node of a `Backward` kind is read through its read entries. A parsed node keeps its tree row and is re-wrapped with no reparse; a built node is rebuilt with the portable builders, its members read through the read entries and built through the build entries.
- **High→low:** a parsed portable node is re-wrapped as its low-level node from the same row; a built one is rebuilt through the build entries.
- **A node of the engine's own surface:** a node bound to this engine is returned as is; one bound to another engine of the same surface is re-wrapped from its row when parsed, or rebuilt when built, exactly as a crossing is. No identity is promised either way.

`is.<role path>` is compiled from the read entries under the path, a grammar kind set plus slot constraints (`operator === '+='`), into the query facet's plan form: one derivation, no separate kind table.

## 3. One route resolution, shared with the inventory

The inventory's derivation already decides, per grammar, which slots are members and under which names, which slots are layout, which kinds are containers and through which slot they unwrap, where deep members route, and which claims are refinements and what they pin. It keeps only the member types. The generator needs the same decisions as routes, so they are made once: a per-grammar route resolution produces read entries, member routes, container unwraps and their build inverses. The inventory folds the routes into member types and checks them; the generator prints them.

Two facts the bindings reader drops have to be kept:

- **A predicate claim's predicate** (operator, capture, argument). Without it a read entry cannot test the claim and a build entry cannot pin it.
- **A presence member's token text.** Without it a capture named otherwise than its token (`"async" @isAsync`) loses the token.

## 4. Conformance: what the locked vocabulary must admit

The generated module is type-checked against the vocabulary, and the target is zero rejected members. Measured against today's vocabulary (rust, 374 members over 190 read entries), the rejections fall into these causes, each with the side that owns the fix:

| cause | what has to change |
| --- | --- |
| a token read as text that the member type doesn't admit (`'_'`, `'gen'`, `'union'`) | The reader's type admits keyword tokens the grammar aliases to identifiers: either the low-level types narrow them, or the member admits them. |
| a text leaf read as a plain string where the member admits only kinds | A leaf whose text varies is a node carrying `$value`, and a fixed literal is its const string; the members admit both. |
| a content-derived claim the member type leaves out (`type.named.prelude`, `literal.boolean.true`) | A member that admits a kind admits every claim of that kind, predicate claims included. |
| an unmapped marker where the read gives a mapped kind | The unmapped ratchet: it falls as claims complete, onto an existing kind or one a feature adds. |
| a low-level reader typed `unknown` (`token_repetition.operator`) | Type those readers in the typed surface. |
| a refinement where its parent is admitted (`kind` is a single literal) | The bindings spec's §3.4 rule: a level's `kind` admits every path beneath it. |
| a member that can be absent where the interface requires it (an optional element inside a required container) | Requiredness carries through containers. |
| a member the bindings route that the interface does not declare | A feature adds the member, or the binding drops it. |

"Locked" therefore means more than authored: the locked interfaces admit what the readers return, and where the bindings reach a construct the vocabulary lacks, a feature extends the vocabulary to cover it.

## 5. Cost

The portable node is one object literal per read with a closure per member, so making a node costs an allocation per member, and reading a member costs the low-level read plus making the child's node. The type maps are flat, so type-checking the generated module stays linear in its size and reports no excessive depth. The probe's figures for rust, and the command that takes them, are in its README.

## 6. Verification

The bindings spec's §10 lists the surface's checks (round trip, crossing, role tests). The generator adds:

1. The generated module type-checks against the locked vocabulary with zero rejected members; until then the probe's `conformance.py` reports the rows of §4.
2. Generated-output drift is checked with the package's other generated files.
3. The portable node's overhead over the low-level read is measured with one command before and after any change to its shape.
4. The route resolution is shared: a slot the inventory reports as a member is a member of the generated read entry, under the same name.
