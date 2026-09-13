# Base vocabulary — derived draft

**Status:** review draft, derived. Companion to the bindings spec
(`sittir-role-interfaces-scm-spec.md`, to become the bindings spec).
**Derived from:** `packages/<grammar>/bindings.scm` and each grammar package's
generated `types.ts`, by `packages/tools/scripts/derive-vocabulary.py`, which
also emits the base interface files under `packages/types/src/vocabulary/`
(one file per top-level namespace, an interface merged with a namespace at
every level, an interface alone at a leaf, and `context.ts` holding the
`GrammarContext` typemap keyed by top-level namespace). Regenerated, never
hand-edited; the script is the seed of `sittir tool bindings-inventory`.
Review happens on the emitted files and this draft; every correction is made
in a bindings file, not here.

## How to read it

- `BaseContext` is the typemap: one key per vocabulary kind, keyed by its
  dotted path. A prefix is a kind-set (the union of its leaves) and is marked.
  The trailing letters name the grammars that claim the kind (`p`, `t`, `r`).
- Each namespace holds one type per kind, generic over the grammar context
  `G`. Members come from the slot models of the claiming grammars, unioned:
  a member is optional when any grammar leaves it optional, a list when any
  grammar holds a list; a member only some claimers carry is marked
  (`// t only`). Member types are `G['<kind>']` where the admitted grammar
  kind is claimed, `'text'` where the slot holds a token, `boolean` where it
  holds a presence marker.
- A refinement is written as its parent with the literal the binding fixes:
  `Binary<G> & { operator: '+' }`. Content-derived kinds (predicate claims)
  are marked and carry no members of their own yet.
- `<grammar:kind>` marks an admitted grammar kind **no binding claims**. The
  per-namespace list below ranks them by how many members reference them;
  that list is the work list for expanding the bindings. Grammar supertypes
  named as a namespace (`expression`, `statement`, `pattern`, `type`,
  `identifier`) are mapped to the prefix provisionally, pending the
  convention that a single-segment capture on a pattern's top node is a
  kind-set claim.
- Nothing here is normalized yet: member names are the upstream field names
  camel-cased, so the same member appears under different names where the
  grammars disagree (`consequence` / `body`, `alternative` / `else_clause`).
  Convergence is a bindings decision, made per member during review.

## Grammar unions, derived

| grammar | union | maps to |
| --- | --- | --- |
| python | `compound_statement` | `declaration | statement` |
| python | `expression` | `expression | identifier | literal` |
| python | `primary_expression` | `expression | identifier | literal` |
| rust | `declaration_statement` | `attribute | declaration | expression.macro_invocation | statement.import` |
| rust | `expression` | `expression | identifier | literal | statement` |
| typescript | `__lhs_expression` | `expression | identifier | literal.null.undefined` |
| typescript | `expression` | `expression | identifier | literal` |
| typescript | `primary_expression` | `expression | identifier | literal` |
| typescript | `statement` | `statement` |

## Work list (unmapped references per namespace)

- `[attribute] unmapped refs 5: rust:attribute×2 typescript:decorator_call_expression×1 typescript:decorator_member_expression×1 typescript:decorator_parenthesized_expression×1`
- `[comment] unmapped refs 18: rust:line_comment_doc_inner×3 rust:line_comment_doc_outer×3 rust:line_comment_content×3 rust:line_comment_regular_dslash×3 rust:block_comment_content×2 rust:block_comment_doc_outer×2 rust:block_comment_doc_inner×2`
- `[declaration] unmapped refs 108: rust:type×11 rust:type_parameters×9 rust:where_clause×9 typescript:type_annotation×6 typescript:type_parameters×5 rust:parameters×4 python:type×4 python:type_parameter×3 python:simple_statements×3 python:suite_block×3 typescript:computed_property_name×3 typescript:private_property_identifier×3`
- `[expression] unmapped refs 94: rust:scoped_identifier×4 rust:unsafe_block×3 rust:gen_block×3 rust:try_block×3 rust:literal×3 rust:async_block×3 rust:array_expression×3 rust:tuple_expression×3 rust:yield_expression×3 rust:struct_expression×3 rust:generic_function×3 rust:parenthesized_expression×3`
- `[literal] unmapped refs 16: python:string_start×2 python:string_content×2 python:string_end×2 typescript:string_single×1 typescript:string_double×1 rust:string_literal_open×1 rust:string_content×1 typescript:template_chars×1 typescript:regex_pattern×1 typescript:regex_flags×1 rust:raw_string_literal_start×1 rust:raw_string_literal_content×1`
- `[modifier] unmapped refs 1: rust:visibility_modifier_group×1`
- `[statement] unmapped refs 70: typescript:sequence_expression×6 python:simple_statements×5 rust:label×4 python:suite_block×4 python:else_clause×4 typescript:parenthesized_expression×3 python:expression_list×3 rust:let_condition×2 rust:let_chain×2 python:import_list×2 rust:expression_statement×1 rust:else_clause×1`
- `[type] unmapped refs 7: typescript:type×2 typescript:nested_type_identifier×1 rust:type_arguments×1 typescript:type_arguments×1 rust:scoped_type_identifier×1 rust:type×1`

## Member name convergence (proposal)

Names converge before kinds: until the same member has one name in every
grammar, the kinds cannot be compared. Five rules, then the table of every
member that two or more claiming grammars spell differently. Where a rule
decides, the table names it; where none does, the row is a choice and says
so. A converged name is realized in each grammar's bindings file by the
delta principle: a grammar whose field already carries the name says
nothing; a grammar whose field differs binds it.

1. **Marker booleans take the keyword.** A `*_marker` presence flag is a
   member named by the keyword it marks: `async`, `static`, `readonly`,
   `abstract`, `declare`, `override`, `const`, `unsafe`, `move`, `mutable`
   (Rust `mut`), `accessor`, `optional`. Rust's `function_modifiers` set
   projects to the same per-keyword booleans (§4.3 of the bindings spec).
2. **Modifier enums take the noun.** `accessibility_modifier` is
   `accessibility`, `visibility_modifier` is `visibility`; the value is the
   keyword text.
3. **Layout is not a member.** `automatic_semicolon`, `terminator`, string
   quote tokens (`string_start`/`string_end`/`string_open`), and a member
   separator that is punctuation (`.` against `?.`) are render options or
   refinements, never members. `?.` becomes the boolean `optionalChain`,
   which TypeScript's subscript already spells.
4. **Containers keep the shared name.** `parameters`, `arguments`, `body`,
   `statements`, `typeParameters`, `typeArguments` are spelled the same in
   every grammar that has them and stay.
5. **Otherwise the majority upstream name wins**, counted over the grammars
   that claim the kind; a two-way tie is a choice, listed as such.

| kind | member | python | typescript | rust | converged | by |
| --- | --- | --- | --- | --- | --- | --- |
| attribute | payload | `expression` | `content` | `attribute` | `content` | choice: neutral over a path + token tree that is no expression |
| comment.* | text | (leaf) | (leaf) | `content` | `content` | only name; leaves derive it from text |
| declaration.class | bases | `superclasses` | `heritage` | — | `heritage` | choice: TS's covers implements as well |
| declaration.field | default | — | `value` | — | `value` | rule 4 (matches variable) |
| declaration.parameter | binding | `name` (claim) | `pattern` | `name` | `name` | rule 5 |
| declaration.parameter | default | `value` | `value` | — | `default` | choice: `value` is the initializer of a variable, a parameter has a default |
| declaration.parameter | mutability | — | — | `mutable_specifier` | `mutable` | rule 1 |
| declaration.parameter.type | bound | — | `constraint` | `bounds` | `constraint` | choice: singular, TS's word |
| declaration.parameter.type | default | — | `value` | `default_type` | `default` | as parameter |
| declaration.type_alias | aliased type | — | `value` | `type` | `value` | choice: the right-hand side is `value` everywhere; `type` stays the annotation |
| declaration.variable | binding | `left` | `name` | `pattern` | `name` | rule 5 (TS + python's bindings capture) |
| declaration.variable | initializer | `right` | `value` | `value` | `value` | rule 5 |
| declaration.variable | let-else | — | — | `alternative` | `alternative` | delta, r only |
| expression.conditional | then | `body` | `consequence` | — | `consequence` | rule 5 with `statement.if`, where all three already say it |
| expression.lambda | body | `body` | `body` | `content` | `body` | rule 5 |
| expression.lambda | params | `parameters` | (formal) | `parameters` | `parameters` | rule 4 |
| expression.member | object | `object` | `object` | `value` | `object` | rule 5 |
| expression.member | member | `attribute` | `property` | `field` | `property` | choice: three-way; TS's is the SCIP word |
| expression.member | `?.` | — | `separator` | — | `optionalChain` | rule 3 |
| expression.subscript | object | `value` | `object` | `object` | `object` | rule 5 |
| expression.subscript | index | `subscripts` | `index` | `index` | `index` | rule 5; python's list is a kinds question |
| expression.unary | operand | `argument` | `argument` | `operand` | `argument` | rule 5 |
| literal.string | text | `content` | `content` | `elements` | `content` | rule 5 |
| literal.string | quotes | `string_start`/`_end` | — | `string_open` | — | rule 3: the quote is a preference |
| statement.for | see note | `left`/`right` | `initializer`/`condition`/`increment` | `pattern`/`value` | — | not one kind: python and rust loops are `statement.for.in`; `statement.for` is the C-style loop |
| statement.for.in | binding | `left` | `left` | `pattern` | `left` | rule 5 |
| statement.for.in | iterated | `right` | `right` | `value` | `right` | rule 5 |
| statement.match | scrutinee | `subjects` | — | `value` | `subject` | choice: singular; python's list is a kinds question |
| statement.return | value | `expressions` | — | `expression` | `expression` | rule 5 |
| statement.throw | value | `expressions` | `expression` | — | `expression` | rule 5 |
| statement.throw | cause | `cause` | — | — | `cause` | delta, p only |
| statement.try | handlers | `except_clauses` | `handler` | — | `handlers` | choice: plural, it is a list in python |
| statement.try | finally | `finally_clause` | `finalizer` | — | `finalizer` | choice: TS's word |
| statement.try | else | `else_clause` | — | — | `alternative` | as `if`/`while`/`for` already spell the else branch |
| type.generic | head | — | `name` | `type` | `name` | choice: TS's word |

Members carried by one claimer only and not listed (`where_clause`,
`label`, `trailing_expression`, `decorator`, `lifetime`, `reference`,
`import_*`) are deltas: they keep their upstream name, camel-cased, and
appear in that grammar's context alone.

**Bindings defects the table exposed**, to fix before kinds are compared:

- python's `declaration.parameter` claim sits on the `parameters` container
  (`(parameters (identifier) @name) @declaration.parameter`), so the kind
  carries the container's members; the claim belongs on the element.
- python's and rust's `for` loops are claimed as `statement.for` beside
  TypeScript's C-style loop; they are `statement.for.in`.
- python's `comparison_operator` is claimed as one binary kind while its
  comparators are an unclaimed group; the leaves want `left`, `operator`,
  `right`, which is a kinds question once the names are settled.
- python's `assignment` member captures (`@name`, `@value`) are positional;
  the derivation does not yet apply positional member captures, so the
  table shows the upstream `left`/`right` for it.

## Member kind convergence (proposal)

With names converged, each member's admitted kinds are compared across the
claiming grammars. Six rules cover every shared kind in the table; the
member's converged kind is what remains after they apply.

1. **Containers unwrap.** A member whose grammar kind is a container is
   typed by the container's element kind-set, as a list: `parameters:
   declaration.parameter[]`, `typeParameters: declaration.parameter.type[]`,
   `heritage: (type | expression)[]`, a class `body: declaration[]`. The
   container node exists on the read side and is never a kind.
2. **Wrapper clauses are transparent.** A clause that carries exactly one
   member value around punctuation is typed by what it wraps: TypeScript's
   `type_annotation` (`: T`) makes `returnType: type` and `type: type`, the
   same as Python's `-> T` and Rust's `-> T`. The clause kind stays for the
   read side; the structure carries the type, and the builder restores the
   clause. Python's suite forms are the same case for statements: an
   indented suite wraps a block, an inline suite is a line of statements,
   and a function `body` is `statement.block` in all three grammars, the
   encoding chosen at build time.
3. **Kind-set unions.** A member's kind is the smallest kind-set covering
   every grammar's admitted set. Values (`value`, `default`, `left`,
   `right`, `argument`) are `expression`, whose set includes identifiers
   and literals per the grouping ruling. Property names are `identifier |
   literal.string | literal.number`. Type positions are `type`, whose set
   includes `identifier.type`. Bodies and branches are `statement`, whose
   set includes blocks, declarations, and in Rust the `if` that follows an
   `else`. Bindings (`name` on a variable or parameter) are `identifier |
   pattern`.
4. **Text leaves are strings.** A member whose admitted kinds are all text
   leaves is `string`: comment `content`, string `content` and fragments,
   regex `pattern` and `flags`. No vocabulary kind is minted for a leaf that
   carries only text.
5. **Exclusive markers decompose.** TypeScript's `?` and `!` on a field are
   `optional` and `definite`; `*` on a method is `generator`; the accessor
   keyword is `accessor: 'get' | 'set'`. These join rule 1 of the names
   pass and are now bound in the file.
6. **Inclusion is a DAG, and sets never name sets.** A per-context set
   admits another set only when every claimed kind of that set is admitted;
   otherwise it lists the leaves. Rust's expression set therefore names
   `statement.block`, `statement.if`, `statement.match`, `statement.loop`
   and `statement.while` individually, never `statement`, which would point
   back through `statement.expression`. Every emitted set type is a flattened
   union of leaf types, so no type alias is self-referential. The base set is
   the union of the contexts' leaves, which is how `expression` comes to
   include `identifier` and `literal` without either naming the other.
7. **Refinements narrow, never widen.** A leaf's members are its parent's
   with the fixed literal; a leaf that admits a kind its parent does not is
   a bindings error the inventory reports.

Where a grammar's set is narrower than the base (Rust `body` required and
a block only; Python `name` never a pattern in a parameter), the
per-grammar context carries the narrowing through `G` and `Require`, as
the bindings spec already states; nothing is re-authored.

**Remaining bindings items the kinds table exposed:**

- Python `clause.case` and TypeScript `clause.case` are not one shape: a
  match case holds `patterns` and a `guard`, a switch case holds a `value`.
  Both keep `body`; the matched side stays a delta per grammar.
- Python's decorator and Rust's index expression bind their members
  positionally; the derivation reads positional captures as unnamed, so the
  table still shows the upstream names there. The files are right.
- Rust's else clause admits `statement.if` for the else-if chain; the
  `statement` kind-set covers it, and the structure keeps the chain as
  nested conditionals rather than flattening it.

## The typemap and the interfaces

```ts
// BaseContext — the typemap: every vocabulary kind, keyed by its dotted path; prefixes are kind-sets.
export interface BaseContext {
  'attribute': Attribute;   // prt
  'attribute.inner': Attribute.Inner;   // r
  'comment': Comment;   // t
  'comment.block': Comment.Block;   // rt
  'comment.block.doc': Comment.Block.Doc;   // rt
  'comment.line': Comment.Line;   // prt
  'comment.line.doc': Comment.Line.Doc;   // r
  'comment.line.doc.inner': Comment.Line.Doc.Inner;   // r
  'declaration': Declaration;   // prefix
  'declaration.class': Declaration.Class;   // pt
  'declaration.constant': Declaration.Constant;   // r
  'declaration.constructor': Declaration.Constructor;   // pt
  'declaration.decorated': Declaration.Decorated;   // p
  'declaration.enum': Declaration.Enum;   // rt
  'declaration.enum.member': Declaration.Enum.Member;   // r
  'declaration.field': Declaration.Field;   // rt
  'declaration.function': Declaration.Function;   // prt
  'declaration.getter': Declaration.Getter;   // t
  'declaration.interface': Declaration.Interface;   // t
  'declaration.macro': Declaration.Macro;   // r
  'declaration.method': Declaration.Method;   // prt
  'declaration.method.class': Declaration.Method.Class;   // p
  'declaration.method.dunder': Declaration.Method.Dunder;   // p
  'declaration.method.static': Declaration.Method.Static;   // pr
  'declaration.method.trait': Declaration.Method.Trait;   // r
  'declaration.module': Declaration.Module;   // r
  'declaration.parameter': Declaration.Parameter;   // prt
  'declaration.parameter.default': Declaration.Parameter.Default;   // p
  'declaration.parameter.optional': Declaration.Parameter.Optional;   // t
  'declaration.parameter.self': Declaration.Parameter.Self;   // pr
  'declaration.parameter.type': Declaration.Parameter.Type;   // rt
  'declaration.parameter.typed': Declaration.Parameter.Typed;   // p
  'declaration.parameter.typed_default': Declaration.Parameter.TypedDefault;   // p
  'declaration.property': Declaration.Property;   // t
  'declaration.setter': Declaration.Setter;   // t
  'declaration.struct': Declaration.Struct;   // r
  'declaration.trait': Declaration.Trait;   // r
  'declaration.type_alias': Declaration.TypeAlias;   // rt
  'declaration.union': Declaration.Union;   // r
  'declaration.variable': Declaration.Variable;   // prt
  'declaration.variable.pattern': Declaration.Variable.Pattern;   // t
  'declaration.variable.static': Declaration.Variable.Static;   // r
  'expression': Expression;   // prefix
  'expression.assignment': Expression.Assignment;   // rt
  'expression.assignment.compound': Expression.Assignment.Compound;   // prt
  'expression.assignment.compound.add': Expression.Assignment.Compound.Add;   // prt
  'expression.assignment.compound.and': Expression.Assignment.Compound.And;   // t
  'expression.assignment.compound.divide': Expression.Assignment.Compound.Divide;   // r
  'expression.assignment.compound.floor_divide': Expression.Assignment.Compound.FloorDivide;   // p
  'expression.assignment.compound.multiply': Expression.Assignment.Compound.Multiply;   // pr
  'expression.assignment.compound.nullish': Expression.Assignment.Compound.Nullish;   // t
  'expression.assignment.compound.or': Expression.Assignment.Compound.Or;   // t
  'expression.assignment.compound.subtract': Expression.Assignment.Compound.Subtract;   // prt
  'expression.await': Expression.Await;   // prt
  'expression.binary': Expression.Binary;   // prt
  'expression.binary.arithmetic': Expression.Binary.Arithmetic;   // prefix
  'expression.binary.arithmetic.add': Expression.Binary.Arithmetic.Add;   // prt
  'expression.binary.arithmetic.divide': Expression.Binary.Arithmetic.Divide;   // prt
  'expression.binary.arithmetic.exponent': Expression.Binary.Arithmetic.Exponent;   // pt
  'expression.binary.arithmetic.floor_divide': Expression.Binary.Arithmetic.FloorDivide;   // p
  'expression.binary.arithmetic.modulo': Expression.Binary.Arithmetic.Modulo;   // prt
  'expression.binary.arithmetic.multiply': Expression.Binary.Arithmetic.Multiply;   // prt
  'expression.binary.arithmetic.subtract': Expression.Binary.Arithmetic.Subtract;   // prt
  'expression.binary.bitwise': Expression.Binary.Bitwise;   // prefix
  'expression.binary.bitwise.and': Expression.Binary.Bitwise.And;   // prt
  'expression.binary.bitwise.or': Expression.Binary.Bitwise.Or;   // prt
  'expression.binary.bitwise.xor': Expression.Binary.Bitwise.Xor;   // prt
  'expression.binary.comparison': Expression.Binary.Comparison;   // p
  'expression.binary.comparison.equal': Expression.Binary.Comparison.Equal;   // prt
  'expression.binary.comparison.greater': Expression.Binary.Comparison.Greater;   // prt
  'expression.binary.comparison.greater_equal': Expression.Binary.Comparison.GreaterEqual;   // prt
  'expression.binary.comparison.less': Expression.Binary.Comparison.Less;   // prt
  'expression.binary.comparison.less_equal': Expression.Binary.Comparison.LessEqual;   // prt
  'expression.binary.comparison.not_equal': Expression.Binary.Comparison.NotEqual;   // prt
  'expression.binary.comparison.strict_equal': Expression.Binary.Comparison.StrictEqual;   // t
  'expression.binary.comparison.strict_not_equal': Expression.Binary.Comparison.StrictNotEqual;   // t
  'expression.binary.identity': Expression.Binary.Identity;   // prefix
  'expression.binary.identity.is': Expression.Binary.Identity.Is;   // p
  'expression.binary.identity.is_not': Expression.Binary.Identity.IsNot;   // p
  'expression.binary.logical': Expression.Binary.Logical;   // p
  'expression.binary.logical.and': Expression.Binary.Logical.And;   // prt
  'expression.binary.logical.or': Expression.Binary.Logical.Or;   // prt
  'expression.binary.matmul': Expression.Binary.Matmul;   // p
  'expression.binary.membership': Expression.Binary.Membership;   // prefix
  'expression.binary.membership.in': Expression.Binary.Membership.In;   // pt
  'expression.binary.membership.instanceof': Expression.Binary.Membership.Instanceof;   // t
  'expression.binary.membership.not_in': Expression.Binary.Membership.NotIn;   // p
  'expression.binary.nullish': Expression.Binary.Nullish;   // t
  'expression.binary.shift': Expression.Binary.Shift;   // prefix
  'expression.binary.shift.left': Expression.Binary.Shift.Left;   // prt
  'expression.binary.shift.right': Expression.Binary.Shift.Right;   // prt
  'expression.binary.shift.right_unsigned': Expression.Binary.Shift.RightUnsigned;   // t
  'expression.call': Expression.Call;   // prt
  'expression.call.member': Expression.Call.Member;   // prt
  'expression.call.new': Expression.Call.New;   // t
  'expression.call.path': Expression.Call.Path;   // r
  'expression.call.template': Expression.Call.Template;   // t
  'expression.conditional': Expression.Conditional;   // pt
  'expression.interpolation': Expression.Interpolation;   // pt
  'expression.keyword_argument': Expression.KeywordArgument;   // p
  'expression.lambda': Expression.Lambda;   // prt
  'expression.macro_invocation': Expression.MacroInvocation;   // r
  'expression.member': Expression.Member;   // prt
  'expression.range': Expression.Range;   // r
  'expression.reference': Expression.Reference;   // r
  'expression.subscript': Expression.Subscript;   // prt
  'expression.try': Expression.Try;   // r
  'expression.unary': Expression.Unary;   // prt
  'expression.unary.bitwise_not': Expression.Unary.BitwiseNot;   // pt
  'expression.unary.delete': Expression.Unary.Delete;   // t
  'expression.unary.deref': Expression.Unary.Deref;   // r
  'expression.unary.negation': Expression.Unary.Negation;   // prt
  'expression.unary.not': Expression.Unary.Not;   // prt
  'expression.unary.plus': Expression.Unary.Plus;   // pt
  'expression.unary.typeof': Expression.Unary.Typeof;   // t
  'expression.unary.void': Expression.Unary.Void;   // t
  'expression.update': Expression.Update;   // t
  'expression.update.decrement': Expression.Update.Decrement;   // t
  'expression.update.increment': Expression.Update.Increment;   // t
  'identifier': Identifier;   // prt
  'identifier.field': Identifier.Field;   // r
  'identifier.lifetime': Identifier.Lifetime;   // r
  'identifier.metavariable': Identifier.Metavariable;   // r
  'identifier.property': Identifier.Property;   // t
  'identifier.self': Identifier.Self;   // rt
  'identifier.super': Identifier.Super;   // t
  'identifier.type': Identifier.Type;   // prt
  'literal': Literal;   // prefix
  'literal.boolean': Literal.Boolean;   // r
  'literal.boolean.false': Literal.Boolean.False;   // prt
  'literal.boolean.true': Literal.Boolean.True;   // prt
  'literal.char': Literal.Char;   // r
  'literal.null': Literal.Null;   // pt
  'literal.null.undefined': Literal.Null.Undefined;   // t
  'literal.number': Literal.Number;   // t
  'literal.number.float': Literal.Number.Float;   // pr
  'literal.number.integer': Literal.Number.Integer;   // pr
  'literal.number.integer.hex': Literal.Number.Integer.Hex;   // p
  'literal.regex': Literal.Regex;   // t
  'literal.string': Literal.String;   // prt
  'literal.string.bytes': Literal.String.Bytes;   // p
  'literal.string.docstring': Literal.String.Docstring;   // p
  'literal.string.escape': Literal.String.Escape;   // prt
  'literal.string.f': Literal.String.F;   // p
  'literal.string.raw': Literal.String.Raw;   // pr
  'literal.string.triple': Literal.String.Triple;   // p
  'literal.template': Literal.Template;   // t
  'modifier': Modifier;   // prefix
  'modifier.accessibility': Modifier.Accessibility;   // t
  'modifier.accessibility.private': Modifier.Accessibility.Private;   // t
  'modifier.accessibility.protected': Modifier.Accessibility.Protected;   // t
  'modifier.accessibility.public': Modifier.Accessibility.Public;   // t
  'modifier.extern': Modifier.Extern;   // r
  'modifier.function': Modifier.Function;   // r
  'modifier.mutable': Modifier.Mutable;   // r
  'modifier.override': Modifier.Override;   // t
  'modifier.visibility': Modifier.Visibility;   // r
  'modifier.visibility.pub': Modifier.Visibility.Pub;   // r
  'statement': Statement;   // prefix
  'statement.block': Statement.Block;   // prt
  'statement.export': Statement.Export;   // t
  'statement.for': Statement.For;   // prt
  'statement.for.in': Statement.For.In;   // t
  'statement.if': Statement.If;   // prt
  'statement.import': Statement.Import;   // prt
  'statement.import.from': Statement.Import.From;   // p
  'statement.loop': Statement.Loop;   // r
  'statement.match': Statement.Match;   // pr
  'statement.return': Statement.Return;   // prt
  'statement.switch': Statement.Switch;   // t
  'statement.throw': Statement.Throw;   // pt
  'statement.try': Statement.Try;   // pt
  'statement.while': Statement.While;   // prt
  'type': Type;   // prefix
  'type.generic': Type.Generic;   // rt
  'type.primitive': Type.Primitive;   // rt
  'type.reference': Type.Reference;   // r
  'type.union': Type.Union;   // t
}

export namespace Attribute {
  export type Attribute<G extends GrammarContext> = {   // prt
    attribute: <rust:attribute>;   // r only
    content: <typescript:decorator_call_expression> | <typescript:decorator_member_expression> | <typescript:decorator_parenthesized_expression> | G['identifier'];   // t only
    expression: G['expression'] | G['identifier'] | G['literal'];   // p only
  }
  export type Inner<G extends GrammarContext> = {   // r
    attribute: <rust:attribute>;
  }
}

export namespace Comment {
  export type Comment<G extends GrammarContext> = {   // t }
  export type Block<G extends GrammarContext> = {   // rt content-derived
    content?: <rust:block_comment_content> | <rust:block_comment_doc_inner> | <rust:block_comment_doc_outer>;   // r only
  }
  export type Block_Doc<G extends GrammarContext> = {   // rt content-derived
    content?: <rust:block_comment_content> | <rust:block_comment_doc_inner> | <rust:block_comment_doc_outer>;   // r only
  }
  export type Line<G extends GrammarContext> = {   // prt content-derived
    content: <rust:line_comment_content> | <rust:line_comment_doc_inner> | <rust:line_comment_doc_outer> | <rust:line_comment_regular_dslash>;   // r only
  }
  export type Line_Doc<G extends GrammarContext> = {   // r
    content: <rust:line_comment_content> | <rust:line_comment_doc_inner> | <rust:line_comment_doc_outer> | <rust:line_comment_regular_dslash>;
  }
  export type Line_Doc_Inner<G extends GrammarContext> = {   // r
    content: <rust:line_comment_content> | <rust:line_comment_doc_inner> | <rust:line_comment_doc_outer> | <rust:line_comment_regular_dslash>;
  }
}

export namespace Declaration {
  export type Class<G extends GrammarContext> = {   // pt
    automaticSemicolon?: boolean;   // t only
    body: <python:simple_statements> | <python:suite_block> | <typescript:class_body> | '_SuiteEmpty';
    decorator?: G['attribute'][];   // t only
    heritage?: <typescript:class_heritage>;   // t only
    name: G['identifier'];
    superclasses?: <python:argument_list>;   // p only
    typeParameters?: <python:type_parameter> | <typescript:type_parameters>;
  }
  export type Constant<G extends GrammarContext> = {   // r
    name: G['identifier'];
    type: <rust:type>;
    value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
    visibilityModifier?: G['modifier.visibility'];
  }
  export type Constructor<G extends GrammarContext> = {   // pt content-derived }
  export type Decorated<G extends GrammarContext> = {   // p
    decorator: G['attribute'][];
    definition: G['declaration.class'] | G['declaration.function'];
  }
  export type Enum<G extends GrammarContext> = {   // rt
    body: <rust:enum_variant_list> | <typescript:enum_body>;
    constMarker?: boolean;   // t only
    name: G['identifier'];
    typeParameters?: <rust:type_parameters>;   // r only
    visibilityModifier?: G['modifier.visibility'];   // r only
    whereClause?: <rust:where_clause>;   // r only
  }
  export type Enum_Member<G extends GrammarContext> = {   // r
    body?: <rust:field_declaration_list> | <rust:ordered_field_declaration_list>;
    name: G['identifier'];
    value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
    visibilityModifier?: G['modifier.visibility'];
  }
  export type Field<G extends GrammarContext> = {   // rt
    abstractMarker?: boolean;   // t only
    accessibilityModifier?: 'private' | 'protected' | 'public';   // t only
    accessorMarker?: boolean;   // t only
    declareMarker?: boolean;   // t only
    decorator?: G['attribute'][];   // t only
    name: <typescript:__property_identifier> | <typescript:computed_property_name> | <typescript:private_property_identifier> | G['identifier'] | G['literal.number'] | G['literal.string'];
    optionalityMarker?: '!' | '?';   // t only
    overrideModifier?: boolean;   // t only
    readonlyMarker?: boolean;   // t only
    staticMarker?: boolean;   // t only
    type?: <rust:type> | <typescript:type_annotation>;
    value?: G['expression'] | G['identifier'] | G['literal'];   // t only
    visibilityModifier?: G['modifier.visibility'];   // r only
  }
  export type Function<G extends GrammarContext> = {   // prt
    asyncMarker?: boolean;   // pt only
    automaticSemicolon?: boolean;   // t only
    body: <python:simple_statements> | <python:suite_block> | '_SuiteEmpty' | G['statement.block'];
    functionModifiers?: G['modifier.function'];   // r only
    name: G['identifier'] | G['identifier.metavariable'];
    parameters: <rust:parameters> | <typescript:formal_parameters> | G['declaration.parameter'];
    returnType?: <python:type> | <rust:type> | <typescript:asserts_annotation> | <typescript:type_annotation> | <typescript:type_predicate_annotation>;
    typeParameters?: <python:type_parameter> | <rust:type_parameters> | <typescript:type_parameters>;
    visibilityModifier?: G['modifier.visibility'];   // r only
    whereClause?: <rust:where_clause>;   // r only
  }
  export type Getter<G extends GrammarContext> = {   // t content-derived }
  export type Interface<G extends GrammarContext> = {   // t
    body: <typescript:object_type>;
    extendsTypeClause?: <typescript:extends_type_clause>;
    name: G['identifier'];
    typeParameters?: <typescript:type_parameters>;
  }
  export type Macro<G extends GrammarContext> = {   // r
    content: <rust:macro_definition_brace> | <rust:macro_definition_bracket> | <rust:macro_definition_paren>;
    name: G['identifier'];
  }
  export type Method<G extends GrammarContext> = {   // prt
    accessibilityModifier?: 'private' | 'protected' | 'public';   // t only
    accessorKind?: '*' | 'get' | 'set';   // t only
    asyncMarker?: boolean;   // pt only
    body: <python:simple_statements> | <python:suite_block> | '_SuiteEmpty' | G['statement.block'];
    functionModifiers?: G['modifier.function'];   // r only
    name: <typescript:__property_identifier> | <typescript:computed_property_name> | <typescript:private_property_identifier> | G['identifier'] | G['identifier.metavariable'] | G['literal.number'] | G['literal.string'];
    optionalMarker?: boolean;   // t only
    overrideModifier?: boolean;   // t only
    parameters: <rust:parameters> | <typescript:formal_parameters> | G['declaration.parameter'];
    readonlyMarker?: boolean;   // t only
    returnType?: <python:type> | <rust:type> | <typescript:asserts_annotation> | <typescript:type_annotation> | <typescript:type_predicate_annotation>;
    staticMarker?: boolean;   // t only
    typeParameters?: <python:type_parameter> | <rust:type_parameters> | <typescript:type_parameters>;
    visibilityModifier?: G['modifier.visibility'];   // r only
    whereClause?: <rust:where_clause>;   // r only
  }
  export type Method_Class<G extends GrammarContext> = {   // p content-derived }
  export type Method_Dunder<G extends GrammarContext> = {   // p content-derived }
  export type Method_Static<G extends GrammarContext> = {   // pr content-derived
    body: G['statement.block'];   // r only
    functionModifiers?: G['modifier.function'];   // r only
    name: G['identifier'] | G['identifier.metavariable'];   // r only
    parameters: <rust:parameters>;   // r only
    returnType?: <rust:type>;   // r only
    typeParameters?: <rust:type_parameters>;   // r only
    visibilityModifier?: G['modifier.visibility'];   // r only
    whereClause?: <rust:where_clause>;   // r only
  }
  export type Method_Trait<G extends GrammarContext> = {   // r
    body: G['statement.block'];
    functionModifiers?: G['modifier.function'];
    name: G['identifier'] | G['identifier.metavariable'];
    parameters: <rust:parameters>;
    returnType?: <rust:type>;
    typeParameters?: <rust:type_parameters>;
    visibilityModifier?: G['modifier.visibility'];
    whereClause?: <rust:where_clause>;
  }
  export type Module<G extends GrammarContext> = {   // r
    content: <rust:declaration_list> | 'ModItemExternal';
    name: G['identifier'];
    visibilityModifier?: G['modifier.visibility'];
  }
  export type Parameter<G extends GrammarContext> = {   // prt
    accessibilityModifier?: 'private' | 'protected' | 'public';   // t only
    decorator?: G['attribute'][];   // t only
    mutableSpecifier?: boolean;   // r only
    name: <rust:pattern> | 'Self';   // r only
    overrideModifier?: boolean;   // t only
    parameters?: <python:__parameters>;   // p only
    pattern: <typescript:pattern> | 'This';   // t only
    readonlyMarker?: boolean;   // t only
    type?: <rust:type> | <typescript:type_annotation>;   // rt only
    value?: G['expression'] | G['identifier'] | G['literal'];   // t only
  }
  export type Parameter_Default<G extends GrammarContext> = {   // p
    name: <python:tuple_pattern> | G['identifier'];
    value: G['expression'] | G['identifier'] | G['literal'];
  }
  export type Parameter_Optional<G extends GrammarContext> = {   // t
    accessibilityModifier?: 'private' | 'protected' | 'public';
    decorator?: G['attribute'][];
    overrideModifier?: boolean;
    pattern: <typescript:pattern> | 'This';
    readonlyMarker?: boolean;
    type?: <typescript:type_annotation>;
    value?: G['expression'] | G['identifier'] | G['literal'];
  }
  export type Parameter_Self<G extends GrammarContext> = {   // pr
    lifetime?: G['identifier.lifetime'];   // r only
    mutableSpecifier?: boolean;   // r only
    parameters?: <python:__parameters>;   // p only
    reference?: boolean;   // r only
  }
  export type Parameter_Type<G extends GrammarContext> = {   // rt
    bounds?: <rust:trait_bounds>;   // r only
    constMarker?: boolean;   // t only
    constraint?: <typescript:constraint>;   // t only
    defaultType?: <rust:type>;   // r only
    name: G['identifier'];
    value?: <typescript:default_type>;   // t only
  }
  export type Parameter_Typed<G extends GrammarContext> = {   // p
    content: <python:dictionary_splat_pattern> | <python:list_splat_pattern> | G['identifier'];
    type: <python:type>;
  }
  export type Parameter_TypedDefault<G extends GrammarContext> = {   // p
    name: G['identifier'];
    type: <python:type>;
    value: G['expression'] | G['identifier'] | G['literal'];
  }
  export type Property<G extends GrammarContext> = {   // t
    accessibilityModifier?: 'private' | 'protected' | 'public';
    name: <typescript:__property_identifier> | <typescript:computed_property_name> | <typescript:private_property_identifier> | G['literal.number'] | G['literal.string'];
    optionalMarker?: boolean;
    overrideModifier?: boolean;
    readonlyMarker?: boolean;
    staticMarker?: boolean;
    type?: <typescript:type_annotation>;
  }
  export type Setter<G extends GrammarContext> = {   // t content-derived }
  export type Struct<G extends GrammarContext> = {   // r
    content: <rust:struct_item_brace> | <rust:struct_item_tuple> | 'StructItemUnit';
    name: G['identifier'];
    typeParameters?: <rust:type_parameters>;
    visibilityModifier?: G['modifier.visibility'];
  }
  export type Trait<G extends GrammarContext> = {   // r
    body: <rust:declaration_list>;
    bounds?: <rust:trait_bounds>;
    name: G['identifier'];
    typeParameters?: <rust:type_parameters>;
    unsafeMarker?: boolean;
    visibilityModifier?: G['modifier.visibility'];
    whereClause?: <rust:where_clause>;
  }
  export type TypeAlias<G extends GrammarContext> = {   // rt
    name: G['identifier'];
    terminator: ';' | '\\n';   // t only
    trailingWhereClause?: <rust:where_clause>;   // r only
    type: <rust:type>;   // r only
    typeParameters?: <rust:type_parameters> | <typescript:type_parameters>;
    value: <typescript:type>;   // t only
    visibilityModifier?: G['modifier.visibility'];   // r only
    whereClause?: <rust:where_clause>;   // r only
  }
  export type Union<G extends GrammarContext> = {   // r
    body: <rust:field_declaration_list>;
    name: G['identifier'];
    typeParameters?: <rust:type_parameters>;
    visibilityModifier?: G['modifier.visibility'];
    whereClause?: <rust:where_clause>;
  }
  export type Variable<G extends GrammarContext> = {   // prt
    alternative?: G['statement.block'];   // r only
    content: <python:assignment_eq> | <python:assignment_type> | <python:assignment_typed>;   // p only
    left: <python:pattern> | <python:pattern_list>;   // p only
    mutableSpecifier?: boolean;   // r only
    pattern: <rust:pattern>;   // r only
    type?: <rust:type>;   // r only
    value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];   // r only
  }
  export type Variable_Pattern<G extends GrammarContext> = {   // t }
  export type Variable_Static<G extends GrammarContext> = {   // r
    mutableSpecifier?: boolean;
    name: G['identifier'];
    refMarker?: boolean;
    type: <rust:type>;
    value?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
    visibilityModifier?: G['modifier.visibility'];
  }
}

export namespace Expression {
  export type Assignment<G extends GrammarContext> = {   // rt
    left: <typescript:parenthesized_expression> | G['expression'] | G['identifier'] | G['literal'] | G['literal.null.undefined'] | G['statement'];
    right: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
    usingMarker?: boolean;   // t only
  }
  export type Assignment_Compound<G extends GrammarContext> = {   // prt
    left: <python:pattern> | <python:pattern_list> | <typescript:non_null_expression> | <typescript:parenthesized_expression> | G['expression'] | G['identifier'] | G['literal'] | G['statement'];
    operator: '%=' | '&&=' | '&=' | '**=' | '*=' | '+=' | '-=' | '//=' | '/=' | '<<=' | '>>=' | '>>>=' | '??=' | '@=' | '^=' | '|=' | '||=';
    right: <python:expression_list> | <python:pattern_list> | <python:yield> | G['declaration.variable'] | G['expression'] | G['identifier'] | G['literal'] | G['statement'];
  }
  export type Assignment_Compound_Add<G extends GrammarContext> = Assignment_Compound<G> & { operator: '+=' };   // prt
  export type Assignment_Compound_And<G extends GrammarContext> = Assignment_Compound<G> & { operator: '&&=' };   // t
  export type Assignment_Compound_Divide<G extends GrammarContext> = Assignment_Compound<G> & { operator: '/=' };   // r
  export type Assignment_Compound_FloorDivide<G extends GrammarContext> = Assignment_Compound<G> & { operator: '//=' };   // p
  export type Assignment_Compound_Multiply<G extends GrammarContext> = Assignment_Compound<G> & { operator: '*=' };   // pr
  export type Assignment_Compound_Nullish<G extends GrammarContext> = Assignment_Compound<G> & { operator: '??=' };   // t
  export type Assignment_Compound_Or<G extends GrammarContext> = Assignment_Compound<G> & { operator: '||=' };   // t
  export type Assignment_Compound_Subtract<G extends GrammarContext> = Assignment_Compound<G> & { operator: '-=' };   // prt
  export type Await<G extends GrammarContext> = {   // prt
    expression: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
  }
  export type Binary<G extends GrammarContext> = {   // prt
    binaryExpressionIn?: <typescript:binary_expression_in>;   // t only
    left?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
    operator?: '!=' | '%' | '&' | '&&' | '*' | '**' | '+' | '-' | '/' | '//' | '<' | '<<' | '<=' | '==' | '>' | '>=' | '>>' | '@' | '^' | '|' | '||';
    right?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
  }
  export type Binary_Arithmetic_Add<G extends GrammarContext> = Binary<G> & { operator: '+' };   // prt
  export type Binary_Arithmetic_Divide<G extends GrammarContext> = Binary<G> & { operator: '/' };   // prt
  export type Binary_Arithmetic_Exponent<G extends GrammarContext> = Binary<G> & { operator: '**' };   // pt
  export type Binary_Arithmetic_FloorDivide<G extends GrammarContext> = Binary<G> & { operator: '//' };   // p
  export type Binary_Arithmetic_Modulo<G extends GrammarContext> = Binary<G> & { operator: '%' };   // prt
  export type Binary_Arithmetic_Multiply<G extends GrammarContext> = Binary<G> & { operator: '*' };   // prt
  export type Binary_Arithmetic_Subtract<G extends GrammarContext> = Binary<G> & { operator: '-' };   // prt
  export type Binary_Bitwise_And<G extends GrammarContext> = Binary<G> & { operator: '&' };   // prt
  export type Binary_Bitwise_Or<G extends GrammarContext> = Binary<G> & { operator: '|' };   // prt
  export type Binary_Bitwise_Xor<G extends GrammarContext> = Binary<G> & { operator: '^' };   // prt
  export type Binary_Comparison<G extends GrammarContext> = {   // p
    comparators: <python:comparison_operator_comparator>[];
    left: G['expression'] | G['identifier'] | G['literal'];
  }
  export type Binary_Comparison_Equal<G extends GrammarContext> = Binary<G> & { operator: '==' };   // prt
  export type Binary_Comparison_Greater<G extends GrammarContext> = Binary<G> & { operator: '>' };   // prt
  export type Binary_Comparison_GreaterEqual<G extends GrammarContext> = Binary<G> & { operator: '>=' };   // prt
  export type Binary_Comparison_Less<G extends GrammarContext> = Binary<G> & { operator: '<' };   // prt
  export type Binary_Comparison_LessEqual<G extends GrammarContext> = Binary<G> & { operator: '<=' };   // prt
  export type Binary_Comparison_NotEqual<G extends GrammarContext> = Binary<G> & { operator: '!=' };   // prt
  export type Binary_Comparison_StrictEqual<G extends GrammarContext> = Binary<G> & { operator: '===' };   // t
  export type Binary_Comparison_StrictNotEqual<G extends GrammarContext> = Binary<G> & { operator: '!==' };   // t
  export type Binary_Identity_Is<G extends GrammarContext> = Binary_Comparison<G> & { operators: 'is' };   // p
  export type Binary_Identity_IsNot<G extends GrammarContext> = Binary_Comparison<G> & { operators: 'is not' };   // p
  export type Binary_Logical<G extends GrammarContext> = {   // p
    left: G['expression'] | G['identifier'] | G['literal'];
    operator: 'and' | 'or';
    right: G['expression'] | G['identifier'] | G['literal'];
  }
  export type Binary_Logical_And<G extends GrammarContext> = Binary<G> & { operator: '&&' };   // prt
  export type Binary_Logical_Or<G extends GrammarContext> = Binary<G> & { operator: '||' };   // prt
  export type Binary_Matmul<G extends GrammarContext> = Binary<G> & { operator: '@' };   // p
  export type Binary_Membership_In<G extends GrammarContext> = Binary<G> & { operator: 'in' };   // pt
  export type Binary_Membership_Instanceof<G extends GrammarContext> = Binary<G> & { operator: 'instanceof' };   // t
  export type Binary_Membership_NotIn<G extends GrammarContext> = Binary_Comparison<G> & { operators: 'not in' };   // p
  export type Binary_Nullish<G extends GrammarContext> = Binary<G> & { operator: '??' };   // t
  export type Binary_Shift_Left<G extends GrammarContext> = Binary<G> & { operator: '<<' };   // prt
  export type Binary_Shift_Right<G extends GrammarContext> = Binary<G> & { operator: '>>' };   // prt
  export type Binary_Shift_RightUnsigned<G extends GrammarContext> = Binary<G> & { operator: '>>>' };   // t
  export type Call<G extends GrammarContext> = {   // prt
    arguments: <python:argument_list> | <python:generator_expression> | <rust:arguments> | <typescript:arguments>;
    function: <rust:array_expression> | <rust:async_block> | <rust:break_expression> | <rust:const_block> | <rust:continue_expression> | <rust:gen_block> | <rust:generic_function> | <rust:literal> | <rust:parenthesized_expression> | <rust:scoped_identifier> | <rust:struct_expression> | <rust:try_block> | <rust:tuple_expression> | <rust:type_cast_expression> | <rust:unsafe_block> | <rust:yield_expression> | G['expression'] | G['identifier'] | G['identifier.metavariable'] | G['literal'] | 'Import' | 'Self' | 'UnitExpression' | G['statement'];
    typeArguments?: <typescript:type_arguments>;   // t only
  }
  export type Call_Member<G extends GrammarContext> = {   // prt
    arguments: <python:argument_list> | <python:generator_expression> | <rust:arguments> | <typescript:arguments>;
    function: <rust:array_expression> | <rust:async_block> | <rust:break_expression> | <rust:const_block> | <rust:continue_expression> | <rust:gen_block> | <rust:generic_function> | <rust:literal> | <rust:parenthesized_expression> | <rust:scoped_identifier> | <rust:struct_expression> | <rust:try_block> | <rust:tuple_expression> | <rust:type_cast_expression> | <rust:unsafe_block> | <rust:yield_expression> | G['expression'] | G['identifier'] | G['identifier.metavariable'] | G['literal'] | 'Self' | 'UnitExpression' | G['statement'];
    typeArguments?: <typescript:type_arguments>;   // t only
  }
  export type Call_New<G extends GrammarContext> = {   // t
    arguments?: <typescript:arguments>;
    constructor: G['expression'] | G['identifier'] | G['literal'];
    typeArguments?: <typescript:type_arguments>;
  }
  export type Call_Path<G extends GrammarContext> = {   // r
    arguments: <rust:arguments>;
    function: <rust:array_expression> | <rust:async_block> | <rust:break_expression> | <rust:const_block> | <rust:continue_expression> | <rust:gen_block> | <rust:generic_function> | <rust:literal> | <rust:parenthesized_expression> | <rust:scoped_identifier> | <rust:struct_expression> | <rust:try_block> | <rust:tuple_expression> | <rust:type_cast_expression> | <rust:unsafe_block> | <rust:yield_expression> | G['expression'] | G['identifier'] | G['identifier.metavariable'] | 'Self' | 'UnitExpression' | G['statement'];
  }
  export type Call_Template<G extends GrammarContext> = {   // t
    arguments: G['literal.template'];
    function: G['expression'] | G['identifier'] | G['literal'];
  }
  export type Conditional<G extends GrammarContext> = {   // pt
    alternative: G['expression'] | G['identifier'] | G['literal'];
    body: G['expression'] | G['identifier'] | G['literal'];   // p only
    condition: G['expression'] | G['identifier'] | G['literal'];
    consequence: G['expression'] | G['identifier'] | G['literal'];   // t only
  }
  export type Interpolation<G extends GrammarContext> = {   // pt
    eqMarker?: boolean;   // p only
    expression: <python:expression_list> | <python:pattern_list> | <python:yield> | <typescript:sequence_expression> | G['expression'] | G['identifier'] | G['literal'];
    formatSpecifier?: <python:format_specifier>;   // p only
    typeConversion?: <python:type_conversion>;   // p only
  }
  export type KeywordArgument<G extends GrammarContext> = {   // p
    name: G['identifier'];
    value: G['expression'] | G['identifier'] | G['literal'];
  }
  export type Lambda<G extends GrammarContext> = {   // prt
    asyncMarker?: boolean;   // rt only
    body: G['expression'] | G['identifier'] | G['literal'] | G['statement.block'];   // pt only
    content: <rust:closure_expression_block> | <rust:closure_expression_expr> | <typescript:arrow_function_parameter> | <typescript:call_signature>;   // rt only
    moveMarker?: boolean;   // r only
    parameters?: <python:lambda_parameters> | <rust:closure_parameters>;   // pr only
    staticMarker?: boolean;   // r only
  }
  export type MacroInvocation<G extends GrammarContext> = {   // r
    arguments: <rust:delim_token_tree>;
    macro: <rust:scoped_identifier> | G['identifier'];
  }
  export type Member<G extends GrammarContext> = {   // prt
    attribute: G['identifier'];   // p only
    field: G['identifier'] | G['literal.number.integer'];   // r only
    object: G['expression'] | G['identifier'] | G['literal'] | 'Import';   // pt only
    property: <typescript:private_property_identifier> | G['identifier'];   // t only
    separator: '.' | '?.';   // t only
    value: G['expression'] | G['identifier'] | G['literal'] | G['statement'];   // r only
  }
  export type Range<G extends GrammarContext> = {   // r
    content: <rust:range_expression_binary> | <rust:range_expression_postfix> | <rust:range_expression_prefix> | 'RangeExpressionBare';
  }
  export type Reference<G extends GrammarContext> = {   // r
    content?: <rust:reference_expression_raw_mut> | 'MutableSpecifier' | 'ReferenceExpressionRawConst';
    value: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
  }
  export type Subscript<G extends GrammarContext> = {   // prt
    index: <typescript:sequence_expression> | G['expression'] | G['identifier'] | G['literal'] | G['statement'];   // rt only
    object: G['expression'] | G['identifier'] | G['literal'] | G['statement'];   // rt only
    optionalChain?: boolean;   // t only
    subscripts: <python:subscripts>;   // p only
    value: G['expression'] | G['identifier'] | G['literal'];   // p only
  }
  export type Try<G extends GrammarContext> = {   // r
    value: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
  }
  export type Unary<G extends GrammarContext> = {   // prt
    argument: G['expression'] | G['identifier'] | G['literal'];   // pt only
    operand: G['expression'] | G['identifier'] | G['literal'] | G['statement'];   // r only
    operator: '!' | '*' | '+' | '-' | 'delete' | 'typeof' | 'void' | '~';
  }
  export type Unary_BitwiseNot<G extends GrammarContext> = Unary<G> & { operator: '~' };   // pt
  export type Unary_Delete<G extends GrammarContext> = Unary<G> & { operator: 'delete' };   // t
  export type Unary_Deref<G extends GrammarContext> = {   // r
    operand: G['expression'] | G['identifier'] | G['literal'] | G['statement'];
    operator: '!' | '*' | '-';
  }
  export type Unary_Negation<G extends GrammarContext> = Unary<G> & { operator: '-' };   // prt
  export type Unary_Not<G extends GrammarContext> = Unary<G> & { operator: '!' };   // prt
  export type Unary_Plus<G extends GrammarContext> = Unary<G> & { operator: '+' };   // pt
  export type Unary_Typeof<G extends GrammarContext> = Unary<G> & { operator: 'typeof' };   // t
  export type Unary_Void<G extends GrammarContext> = Unary<G> & { operator: 'void' };   // t
  export type Update<G extends GrammarContext> = {   // t
    content: <typescript:update_expression_postfix> | <typescript:update_expression_prefix>;
  }
  export type Update_Decrement<G extends GrammarContext> = Update<G> & { operator: '--' };   // t
  export type Update_Increment<G extends GrammarContext> = Update<G> & { operator: '++' };   // t
}

export namespace Identifier {
  export type Identifier<G extends GrammarContext> = {   // prt }
  export type Field<G extends GrammarContext> = {   // r }
  export type Lifetime<G extends GrammarContext> = {   // r
    name: G['identifier'];
  }
  export type Metavariable<G extends GrammarContext> = {   // r }
  export type Property<G extends GrammarContext> = {   // t }
  export type Self<G extends GrammarContext> = {   // rt }
  export type Super<G extends GrammarContext> = {   // t }
  export type Type<G extends GrammarContext> = {   // prt }
}

export namespace Literal {
  export type Boolean<G extends GrammarContext> = {   // r }
  export type Boolean_False<G extends GrammarContext> = {   // prt content-derived }
  export type Boolean_True<G extends GrammarContext> = {   // prt content-derived }
  export type Char<G extends GrammarContext> = {   // r }
  export type Null<G extends GrammarContext> = {   // pt }
  export type Null_Undefined<G extends GrammarContext> = {   // t }
  export type Number<G extends GrammarContext> = {   // t }
  export type Number_Float<G extends GrammarContext> = {   // pr }
  export type Number_Integer<G extends GrammarContext> = {   // pr }
  export type Number_Integer_Hex<G extends GrammarContext> = {   // p content-derived }
  export type Regex<G extends GrammarContext> = {   // t
    flags?: <typescript:regex_flags>;
    pattern: <typescript:regex_pattern>;
  }
  export type String<G extends GrammarContext> = {   // prt
    content?: (<python:string_content> | <typescript:string_double> | <typescript:string_single> | G['expression.interpolation'])[];   // pt only
    elements?: (<rust:string_content> | G['literal.string.escape'])[];   // r only
    stringEnd: <python:string_end>;   // p only
    stringOpen: <rust:string_literal_open>;   // r only
    stringStart: <python:string_start>;   // p only
  }
  export type String_Bytes<G extends GrammarContext> = {   // p content-derived }
  export type String_Docstring<G extends GrammarContext> = {   // p
    content?: (<python:string_content> | G['expression.interpolation'])[];
    stringEnd: <python:string_end>;
    stringStart: <python:string_start>;
  }
  export type String_Escape<G extends GrammarContext> = {   // prt }
  export type String_F<G extends GrammarContext> = {   // p content-derived }
  export type String_Raw<G extends GrammarContext> = {   // pr content-derived
    rawStringLiteralEnd: <rust:raw_string_literal_end>;   // r only
    rawStringLiteralStart: <rust:raw_string_literal_start>;   // r only
    stringContent: <rust:raw_string_literal_content>;   // r only
  }
  export type String_Triple<G extends GrammarContext> = {   // p content-derived }
  export type Template<G extends GrammarContext> = {   // t
    elements?: (<typescript:template_chars> | G['expression.interpolation'] | G['literal.string.escape'])[];
  }
}

export namespace Modifier {
  export type Accessibility<G extends GrammarContext> = {   // t }
  export type Accessibility_Private<G extends GrammarContext> = {   // t }
  export type Accessibility_Protected<G extends GrammarContext> = {   // t }
  export type Accessibility_Public<G extends GrammarContext> = {   // t }
  export type Extern<G extends GrammarContext> = {   // r
    abi?: G['literal.string'];
  }
  export type Function<G extends GrammarContext> = {   // r }
  export type Mutable<G extends GrammarContext> = {   // r }
  export type Override<G extends GrammarContext> = {   // t }
  export type Visibility<G extends GrammarContext> = {   // r
    content: 'Crate' | G['modifier.visibility.pub'];
  }
  export type Visibility_Pub<G extends GrammarContext> = {   // r
    visibilityModifierGroup?: <rust:visibility_modifier_group>;
  }
}

export namespace Statement {
  export type Block<G extends GrammarContext> = {   // prt
    automaticSemicolon?: boolean;   // t only
    label?: <rust:label>;   // r only
    statements?: (<python:simple_statements> | <rust:expression_statement> | G['attribute'] | G['declaration'] | G['expression.macro_invocation'] | G['statement'])[];
    trailingExpression?: G['expression'] | G['identifier'] | G['literal'] | G['statement'];   // r only
  }
  export type Export<G extends GrammarContext> = {   // t
    content: <typescript:export_statement_default> | <typescript:export_statement_equals_export> | <typescript:export_statement_namespace_export> | <typescript:export_statement_type_export>;
  }
  export type For<G extends GrammarContext> = {   // prt
    alternative?: <python:else_clause>;   // p only
    asyncMarker?: boolean;   // p only
    body: <python:simple_statements> | <python:suite_block> | '_SuiteEmpty' | G['statement'];
    condition: <typescript:sequence_expression> | G['expression'] | G['identifier'] | G['literal'] | 'EmptyStatement';   // t only
    increment?: <typescript:sequence_expression> | G['expression'] | G['identifier'] | G['literal'];   // t only
    initializer: <typescript:lexical_declaration> | <typescript:sequence_expression> | <typescript:variable_declaration> | G['expression'] | G['identifier'] | G['literal'] | 'EmptyStatement';   // t only
    label?: <rust:label>;   // r only
    left: <python:pattern> | <python:pattern_list>;   // p only
    pattern: <rust:pattern>;   // r only
    right: <python:expression_list> | G['expression'] | G['identifier'] | G['literal'];   // p only
    value: G['expression'] | G['identifier'] | G['literal'] | G['statement'];   // r only
  }
  export type For_In<G extends GrammarContext> = {   // t
    awaitMarker?: boolean;
    body: G['statement'];
    content: <typescript:for_header_let_const_kind> | <typescript:for_header_lhs> | <typescript:for_header_var_kind>;
    operator: 'in' | 'of';
    right: <typescript:sequence_expression> | G['expression'] | G['identifier'] | G['literal'];
  }
  export type If<G extends GrammarContext> = {   // prt
    alternative?: (<python:elif_clause> | <python:else_clause> | <rust:else_clause> | <typescript:else_clause>)[];
    condition: <rust:let_chain> | <rust:let_condition> | <typescript:parenthesized_expression> | G['expression'] | G['identifier'] | G['literal'] | G['statement'];
    consequence: <python:simple_statements> | <python:suite_block> | '_SuiteEmpty' | G['statement'];
  }
  export type Import<G extends GrammarContext> = {   // prt
    argument: <rust:scoped_identifier> | <rust:scoped_use_list> | <rust:use_as_clause> | <rust:use_list> | <rust:use_wildcard> | G['identifier'] | G['identifier.metavariable'] | 'Crate' | 'Self' | 'Super';   // r only
    fromClause: <typescript:import_require_clause> | <typescript:import_statement_clause_from> | G['literal.string'];   // t only
    importAttribute?: <typescript:import_attribute>;   // t only
    importClause?: 'type' | 'typeof';   // t only
    importList: <python:import_list>;   // p only
    terminator: ';' | '\\n';   // t only
    visibilityModifier?: G['modifier.visibility'];   // r only
  }
  export type Import_From<G extends GrammarContext> = {   // p
    content: <python:import_list> | <python:parenthesized_import_list> | 'WildcardImport';
    moduleName: <python:dotted_name> | <python:relative_import>;
  }
  export type Loop<G extends GrammarContext> = {   // r
    body: G['statement.block'];
    label?: <rust:label>;
  }
  export type Match<G extends GrammarContext> = {   // pr
    body: <python:match_block> | <rust:match_block>;
    subjects: <python:subjects>;   // p only
    value: G['expression'] | G['identifier'] | G['literal'] | G['statement'];   // r only
  }
  export type Return<G extends GrammarContext> = {   // prt
    expression?: <typescript:sequence_expression> | G['expression'] | G['identifier'] | G['literal'] | G['statement'];   // rt only
    expressions?: <python:expression_list> | G['expression'] | G['identifier'] | G['literal'];   // p only
    terminator: ';' | '\\n';   // t only
  }
  export type Switch<G extends GrammarContext> = {   // t
    body: <typescript:switch_body>;
    value: <typescript:parenthesized_expression>;
  }
  export type Throw<G extends GrammarContext> = {   // pt
    cause?: G['expression'] | G['identifier'] | G['literal'];   // p only
    expression: <typescript:sequence_expression> | G['expression'] | G['identifier'] | G['literal'];   // t only
    expressions?: <python:expression_list> | G['expression'] | G['identifier'] | G['literal'];   // p only
    terminator: ';' | '\\n';   // t only
  }
  export type Try<G extends GrammarContext> = {   // pt
    body: <python:simple_statements> | <python:suite_block> | '_SuiteEmpty' | G['statement.block'];
    elseClause?: <python:else_clause>;   // p only
    exceptClauses?: <python:except_clause>[];   // p only
    finalizer?: <typescript:finally_clause>;   // t only
    finallyClause?: <python:finally_clause>;   // p only
    handler?: <typescript:catch_clause>;   // t only
  }
  export type While<G extends GrammarContext> = {   // prt
    alternative?: <python:else_clause>;   // p only
    body: <python:simple_statements> | <python:suite_block> | '_SuiteEmpty' | G['statement'];
    condition: <rust:let_chain> | <rust:let_condition> | <typescript:parenthesized_expression> | G['expression'] | G['identifier'] | G['literal'] | G['statement'];
    label?: <rust:label>;   // r only
  }
}

export namespace Type {
  export type Generic<G extends GrammarContext> = {   // rt
    name: <typescript:nested_type_identifier> | G['identifier'];   // t only
    type: <rust:scoped_type_identifier> | G['identifier'];   // r only
    typeArguments: <rust:type_arguments> | <typescript:type_arguments>;
  }
  export type Primitive<G extends GrammarContext> = {   // rt }
  export type Reference<G extends GrammarContext> = {   // r
    lifetime?: G['identifier.lifetime'];
    mutableSpecifier?: boolean;
    type: <rust:type>;
  }
  export type Union<G extends GrammarContext> = {   // t
    left?: <typescript:type>;
    right: <typescript:type>;
  }
}

```
