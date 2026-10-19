# Builder exclusions: what one node may not hold, enforced by the builders

## The rule

Some of a node's own facts exclude each other. Examples:
- `static abstract` on a class field;
- an accessibility modifier on a private name (`private #x`);
- an optional parameter with an initializer (`a? = 1`);
- `const async fn`.

Mostly the parser accepts such a combination, and the language rejects it in a later check: TypeScript's checker grammar rules, rustc's AST validation, CPython's compiler. Sometimes the parser refuses it, but the kind's model still holds every fact, so a builder renders text the parser then refuses (a hole, §3). Both are enforced by declarative, builder-only data, never by the grammar.

The user's rulings:

- **The grammar stays context-free.**
  - Each modifier is its own optional flag field, the same in every arm of a kind, so a read finds one flag per modifier.
  - The grammar never adds an exclusion.
  - Where upstream already encodes one through separate arms, it stays as upstream. TypeScript's plain field arm refuses `static abstract`; removing that would need a rule cause, and none fits.
- **Exclusions are builder-only.** They live in an `exclusions:` block in `grammar.sittir.ts`, in the same family as `contexts:` ([builder contexts](2026-10-15-builder-contexts-design.md)). The block never reaches enrich, wire or the parser.
- **Exclusions are node-local.** Every atom is a fact of one node's own record.
- **An entry is (kinds, atom groups, reason).** A group refuses two of its atoms together. A group of one atom is a ban.
- **The types refuse it.** A builder call that sets two atoms of a group does not type-check, and the message names the group.
- **`$with` sets explicitly.** A patch that sets an atom must clear the group's other atoms in the same patch. Nothing is cleared silently.
- **A parsed node carries a violation bit** in the contexts mask's word.
- **The writer checks once**, from one table keyed by kind id.

Contexts are rules about where a node may sit; exclusions are rules about what one node may hold. They share:
- the declaration style;
- the kinds-only rule;
- the per-kind structure table;
- the mask word;
- the `verifyStructure` split.

The [exclusions probe](../probes/2026-10-19-modifier-exclusions/README.md) holds the census of every combination at each modifier-bearing site of the three grammars, judged by sittir's parser and each language's compiler (§3), and the type encoding with the messages tsc prints (§5).

## 1. Atoms

An atom is one fact of a node's own record:

| atom | DSL | true when | examples |
| --- | --- | --- | --- |
| flag | `'static'` | the flag slot is set | `static`, `abstract`, `readonly`, `async` |
| value | `is('accessibility_modifier', 'private')` | an enum slot holds this arm, or a list slot holds an element of it | `private`; `?` and `!`; rust's `const` in `function_modifiers` |
| kind | `is('name', $.private_property_identifier)` | a node slot holds a node of this kind | a private name; a `this` or rest pattern |
| present | `present('value')` | an optional slot is filled | an initializer |
| absent | `absent('exception')` | an optional slot is empty | python's `except*` with no exception type |

- **Kinds only.**
  - A value names an arm of the slot, by the arm's text, and resolves once, at compile time, to the arm's kind id.
  - A kind names a kind the slot admits.
  - No atom compares text the builder was given, and no atom reads another node.
  - A distinction with no kind is a gap, filled with a real kind, as in the contexts spec. For example, a method named `constructor` waits on the constructor kind.
- **`absent` states a requirement as an exclusion.** "A needs B" is the group `[A, absent(B)]`. So python's `except*` needs an exception type: `['group', absent('exception')]`.

## 2. Declaration

`exclusions` is a top-level key of `sittirGrammar`, beside `rules`, `options` and `contexts`. It is a function of `$` and returns a list of entries, as in this excerpt of TypeScript's:

```ts
exclusions: ($) => {
	const fields = [$.public_field_definition_plain, $.public_field_definition_accessor];
	const privateName = is('name', $.private_property_identifier);
	return [
		exclude(fields, [['static', 'abstract'], [is('accessibility_modifier', 'private'), 'abstract']], 'TS1243'),
		exclude([...fields, $.method_definition_plain, $.method_definition_getter, $.method_definition_setter], [[present('accessibility_modifier'), privateName]], 'TS18010'),
		exclude(fields, [['abstract', present('value')]], 'TS1267'),
		exclude([$.method_definition_plain, $.method_signature_plain], [['readonly']], 'TS1024'),
		exclude([$.optional_parameter], [[present('value')]], 'TS1015'),
		exclude([$.setter_parameter], [[present('accessibility_modifier')], ['override'], ['readonly']], 'TS2369')
	];
}
```

- **`exclude(kinds, groups, reason)`** applies each group to each kind.
  - A bare string in a group is a flag slot's name.
  - `reason` is the language's own code for the rule: a TypeScript diagnostic code, or rustc's or CPython's message. The census row that witnesses the entry carries the same code.
- **A group's label** is its atoms joined by "with", then the reason: `static with abstract (TS1243)`. A one-atom group's label is the atom and the reason.
  - The compiler derives the label once and stamps it.
  - The types and the runtime refusal print the same label.
- **`is`, `present` and `absent`** are DSL helpers beside `slot`, with erasable syntax only. Under tree-sitter's CLI run, `sittirGrammar` drops `exclusions`, as it drops `contexts`.

**Validation.** Each of these is a blocking diagnostic when the grammar compiles:

| code | condition |
| --- | --- |
| `exclusion-unknown-kind` | a kind that is not a visible kind with a parser-issued kind id |
| `exclusion-unknown-slot` | a slot the kind does not have |
| `exclusion-not-a-flag` | a bare string naming a slot that is not a flag |
| `exclusion-unknown-value` | a value no arm of the slot spells, or a kind the slot does not admit |
| `exclusion-not-optional` | `present` or `absent` on a required slot |
| `exclusion-one-slot` | two atoms of one single-valued slot in a group: the slot holds one value, so the pair never occurs |
| `exclusion-duplicate` | the same group twice on one kind |

## 3. The census

The probe built every combination of up to three atoms at 32 modifier-bearing sites: 19 TypeScript, 10 Rust, 3 Python. It parsed each with sittir's parser, built from the authoring-DSL branch, where the method and field kinds are split into their forms. It judged each clean parse with the language's compiler. `results/` holds every row.

| grammar | combinations | valid | refused by the grammar | rejected (minimal) |
| --- | --- | --- | --- | --- |
| TypeScript | 1809 | 457 | 520 | 832 (80) |
| Rust | 199 | 49 | 76 | 74 (15) |
| Python | 10 | 9 | 0 | 1 (1) |

Each minimal combination falls in one class (the probe's README defines them). A group is a distinct pair of kind and atoms, so a group found at two sites counts once:

| class | TypeScript | Rust | Python |
| --- | --- | --- | --- |
| exclusion | 54 groups on 12 kinds | 2 groups | 1 group |
| hole | 4 | 0 | 0 |
| context | 20 | 4 | 0 |
| unstable | 0 | 2 | 0 |

**What the blocks declare.** TypeScript, by rule:
- TS18010, an accessibility modifier with a private name: the plain field, the plain method and the plain method signature.
- TS18019, `abstract` or `declare` with a private name: the plain field and the plain abstract method signature.
- TS1243, modifiers that exclude each other:
  - `private` with `abstract` (the plain field, and the abstract method signature, where it is a ban since the kind is abstract);
  - `declare` with `override`;
  - `static` with `abstract` (the accessor field here, and the plain field from the holes below).
- TS1255, TS1263, TS1267 and TS1039, a field's `!` or initializer:
  - `!` with `abstract`, `declare`, `static` or an initializer;
  - an initializer with `abstract` or `declare`.
- TS1024, `readonly` on the plain method and the plain method signature (bans).
- TS1222 and TS1131, `*` on the plain method signature and the plain abstract method signature (bans).
- TS1070, a modifier on a type member: `public`, `private`, `protected`, `static` and `override` on `property_signature`, and `abstract` on `construct_signature` (bans).
- Parameters:
  - TS1015 `?` with an initializer, and TS1005 `this` with `?` (`optional_parameter`);
  - TS1047 `...` with `?`, and TS1048 `...` with an initializer;
  - TS1317 and TS1187, a parameter property (an accessibility modifier, `override` or `readonly`) with a rest or a binding pattern (`required_parameter`);
  - TS2369, each parameter-property modifier on `setter_parameter` (bans).
- TS1131, a sign on `index_signature_colon` (a ban). TS1005, `await` with `in` on `for_in_statement`.

Rust: `const` with `async` on `function_modifiers`, and `ref` on `static_item`. Python: `except*` needs an exception type, `['group', absent('exception')]`.

**Groups on sibling forms.** Minimality is over atoms. `get`, `set` and `accessor` are atoms that pick a form, so a group the census finds minimal on one form is also the group on each sibling form that holds the same slots. The rows show it: `public + get + #m` rejects with TS18010, and `private + get` on the abstract signature with TS1243. The block declares such a group on every form of the kind.

**Holes.** The parser refuses four combinations that a kind's model can still hold:
- `static` with `abstract` on the plain field: TS1243, declared with the accessor field's group.
- `-` or `+` with no `readonly`, on both index-signature forms: TS1131. Both forms take `seq(optional(sign), 'readonly')`, but the model keeps `sign` and `readonly` as separate slots, so a builder can set the sign alone. `[present('sign'), absent('readonly')]` on the mapped form closes it; on the colon form the sign ban already does.
- `abstract` with `override` on the field: `abstract override x` is valid TypeScript, and both sittir's parser and upstream's refuse it. That is a grammar defect, not an exclusion (§9), and is [filed as an issue](https://github.com/refactory-lang/sittir/issues/904) for the acceptance plan's valid-syntax-rejected stage.

## 4. Model stamps

The compiler resolves the block once, after link, into stamps on each kind that has entries:

- **`exclusionAtoms`**: the kind's atoms, in declaration order. Each is a slot number and a test:
  - a flag;
  - a set of arm kind ids;
  - a set of node kind ids;
  - present;
  - absent.
- **`exclusionGroups`**: each group as a bit mask over the kind's atoms, with its label.

The emitters read only the stamps. Nothing downstream re-reads the block or matches names. A kind has at most 32 atoms, which the census leaves far from the bound, and a test holds it.

## 5. Types

A builder of a kind with groups takes its config as a `const` type parameter, so a literal `true` stays `true`, and intersects it with the groups' check:

```ts
declare function buildPublicFieldDefinitionAccessor<const C extends T.PublicFieldDefinitionAccessor.Config>(
	config: C & Excluding<C, T.PublicFieldDefinitionAccessor.Exclusions>
): T.PublicFieldDefinitionAccessor.Bound;
```

- **The check.**
  - `Excluding<C, Groups>` is `unknown` when no group is violated.
  - Otherwise it is `{ readonly $excluded: <labels> }`, a member the call cannot have, so the refusal names each violated group:
    `Property '$excluded' is missing in type '{ name: PropertyIdentifier; static: true; abstract: true; }' but required in type '{ readonly $excluded: "static with abstract (TS1243)"; }'.`
- **What the types prove.**
  - An atom holds in the type only when its member's type is exactly the atom: `true`, the arm's literal, the kind's node type, or a present member.
  - A member typed wide (`static: boolean`, a `Statement`) proves nothing. The call type-checks, and the runtime check decides (§6), as an `Unproven` context does.
- **`Exclusions`** is emitted per kind beside `Config`, as a tuple of groups. Its atoms test config members by property name.
- **`$with`**: `$with<const P>(patch: P & WithExcluding<P, Groups>)`.
  - The node's own values are not in the patch's type. So a patch that sets an atom must clear every other atom of its groups:
    - a flag with `false`;
    - an enum or node member with another arm or kind;
    - a present member with `undefined`.
  - Setting a private name therefore means clearing the accessibility modifier in the same patch.
- **The probe** (`types.ts`) holds the encoding on a stand-in for the accessor field's config.
  - Under tsc 7.0.2, all 11 refusals it expects report, and each names its labels (`types-messages.txt`).
  - The seven accepted calls pass, including a wide `boolean` and a patch that clears.

## 6. The runtime check

- **One table.** The atoms and groups live in `hooks.structure[kindId].exclusions`: `{ atoms, groups }`. That is the per-kind structure table the contexts spec's masks share, keyed by kind id alone.
- **One helper.** `excludedBy(kindId, node, table)` in `packages/common`:
  1. reads the node's atom mask from its slots;
  2. tests each group;
  3. returns the first violated group's index, or -1.
  The emitter writes no per-kind logic.
- **The writer checks, once, always.** Every builder calls `excludedBy` at construction, in both `verifyStructure` modes. A call whose types proved the groups pays a few bit operations, and a call they could not prove (a wide flag, `.from()`, a coerced config) is refused. The types cannot tell the two apart at run time, so this follows the always-run half of the runtime-checks ruling, as the leaf guards do.
- **The refusal** names the kind, the label and the atoms' slots:
  `PublicFieldDefinitionAccessor: static with abstract (TS1243): static and abstract are both set`.
- **Native.** When the arena writer moves to native, the check moves with the write. The table is emitted into the Rust crate's generated tables, beside the contexts masks.

## 7. Parsed nodes: the `Excluded` bit

- The reader computes the same atom mask for each parsed node of a kind with groups, in the pass that writes the row. A violation sets bit 30 of the node's `$needs` word, `Excluded`. Reading never refuses: the parser accepted the source, and the bit records what the language will reject.
- `Excluded` behaves as a context need that no slot provides.
  - It is carried upward and never dropped.
  - Every bounding slot and the root bound it.
  - A parsed tree whose root mask is not zero holds such a node, and the mask makes that queryable.
  - A violating parsed node placed into a built tree is refused at its nearest bound, with the label.
- **The bit is the contexts mask's bit 30** ([builder contexts](2026-10-15-builder-contexts-design.md) §6), so the context tuple holds 30 terms at most, and its test says so.
- **Rebuilding clears it.** `$with` and list edits rebuild through the builder, so the result is checked as a fresh build and carries no `Excluded` bit. A patch that fixes the violation is the way to keep the node.

## 8. The portable surface

- **At run time**, the portable builders build through the grammar's builders, so they check the same groups.
- **For types**, a portable config maps onto one grammar kind's config at a concrete call, and the groups apply there. A portable call that stays generic over `G` cannot show a group, which is the limit any `G`-generic argument has.

## 9. Outside this primitive

The census's other classes, and why each is someone else's:

- **Context: the place decides, not the node.** The kind is valid at another site, so a node-local group would refuse valid code. These belong to the builder contexts, or wait on a kind that tells the places apart:
  - TypeScript, 20 groups:
    - modifiers and `?` on an object-literal method (TS1042, TS1162);
    - modifiers on an interface method (TS1070);
    - a getter or setter signature among a class's overloads (TS1005);
    - a parameter property outside a constructor (TS2369 on `required_parameter`), which waits on the constructor kind;
    - `const` on an interface's type parameter (TS1277).
  - Rust, 4 groups: `const`, `async`, `unsafe` and `extern` on a function in a trait, a trait impl or an extern block.
- **Unstable: nightly syntax.** Rust's `default` (specialization) and `static` closures (coroutines) are refused with a feature gate (E0658) somewhere in the kind. They are no exclusion.
- **Grammar defects.** `abstract override` on a class field is valid TypeScript, and both sittir's parser and upstream's refuse it. The fix is a re-authored field that accepts it, under `rejects-valid-syntax`. Excluding it would make the builder agree with a wrong parser.
- **Order.** The builder renders modifiers in the grammar's order, so an order rule (TS1029, rustc's "expected one of") never reaches a built node. The census found no combination refused by order alone.
- **Rules that read another node.** An abstract member of a class that is not abstract reads the class: the class is the place, so it is the contexts'. `override` with no base member needs types, which no grammar-level check has.
