# Flag eligibility census

**Question.** A yes/no fact is a flag only if it changes neither what the node admits (its slots
and children) nor the slots that admit the node. A fact that changes either is a refinement kind,
since a flag reads as freely toggleable. Which of the vocabulary's yes/no facts change
eligibility? The census covers rust's block modifiers, the refinement kinds that state a yes/no
fact, and the vocabulary's 87 boolean members.

**Answer.** These change eligibility, so they are refinement kinds:
- rust's `try`, `async`, `gen`, `const` and `unsafe` blocks;
- rust's const generic parameter;
- raw strings;
- typescript's class `static` block, abstract method signature, definite variable and optional
  tuple member;
- `yield*` and `yield from`;
- `asserts`.

Everything else is a flag. That includes rust's block `move`, a field's `definite`, an abstract
class, a generator function, an optional parameter, a big integer, and python's long and
imaginary integers. The census compares slots, so it misses two facts of one node that the grammar
refuses together. Typescript has three such groups, and rust and python have none.

## Setup

- master at `7b79ffcff`, read from each bound grammar's `.sittir/src/node-types.json` and
  `.sittir/src/grammar.json`. Run both tools from the repository root.
- `elig.py <grammar> <plain> <flagged> [...]` compares each pair of grammar kinds on two things:
  what each admits (its fields and children, by kind, with supertypes expanded) and which
  `parent.field` slots admit it.
- `exclusive.py <grammar> <kind> [...]` lists the flag tokens of each kind that its rule never
  spells together. It walks the rule, inlining hidden rules except those that spell names.
- The boolean members come from the vocabulary on `feat/vocabulary-features` at `5a36b0785`.

## Results

### Facts two grammar kinds realize

| grammar | plain → flagged | what differs | form |
| --- | --- | --- | --- |
| rust | `block` → `async_block`, `gen_block`, `const_block`, `unsafe_block`, `try_block` | each holds `body: block` in place of statements, a label and a trailing expression; 15 slots admit only a plain block; `const_block` is also admitted in 17 pattern slots | kind |
| rust | `type_parameter` → `const_parameter` | a type (required) and a value, with no bounds and no default type; an `identifier` name | kind |
| rust | `string_literal` → `raw_string_literal` | no escape sequences; `extern_modifier.abi` admits only a plain string | kind |
| typescript | `class_declaration` → `abstract_class_declaration` | only a layout terminator | flag |
| typescript | `function_declaration` → `generator_function_declaration`, `function_expression` → `generator_function` | nothing | flag |
| typescript | `required_parameter` → `optional_parameter` | nothing | flag |
| typescript | `method_signature` → `abstract_method_signature` | no `async`, `readonly` or `static`; not admitted in an object type | kind |
| typescript | `statement_block` → `class_static_block` | holds a body; only `class_body.members` admits it, and 25 slots admit only a statement block | kind |
| typescript | `yield_expression` → `yield_expression_delegate` | the operand is required | kind |
| typescript | `type_predicate` → `asserts` | holds a predicate where a type predicate holds a name and a type | kind |
| typescript | `variable_declarator_plain` → `variable_declarator_definite` | an identifier name only, a required type, no initializer | kind |
| typescript | `tuple_parameter` → `optional_tuple_parameter` | the name admits no rest pattern | kind |
| typescript | `number_decimal` → `number_bigint_decimal` | nothing | flag |
| python | `integer` → `integer_decimal_long`, `integer_decimal_imaginary` | nothing | flag |

Python spells a raw string as `string`. Its scanner turns escapes off for a raw delimiter
(`is_raw`), so a raw string is a kind there as it is in rust.

### The 87 boolean members

There are 26 names: abstract 5, accessor 1, async 12, await 1, comma 2, computed 4, const 5,
debug 1, declare 1, default 3, definite 2, generator 3, group 1, move 2, mutable 7, optional 6,
optionalChain 1, override 7, private 3, readonly 6, ref 1, reference 1, sign 1, static 4, unsafe 6,
using 1.

Most are a token on the kind that holds them. That kind keeps its slots and its admitters, so the
fact is a flag. Three are decided by a child's kind or presence, and they keep eligibility as well:
`private` (now `privateName`), `computed`, and rust's `static` (no receiver). The members that
flip are the abstract method signature, the definite variable, rust's const parameter and the
optional tuple member, all in the table above. Python's `except*` is a token on `except_clause`,
so `group` is a flag. The spelling members (`comma`, `sign`) and the binding members (`mutable`,
`ref`, `reference`, `using`) follow the spelling and binding rules (bindings spec §3.3).

### Flags one node never spells together

| grammar | kind | never together |
| --- | --- | --- |
| typescript | `public_field_definition` | `?` and `!`; `abstract` with `static`, `override` or `accessor`; `accessor` with `static`, `override` or `readonly` |
| typescript | `method_definition`, `method_signature`, `abstract_method_signature` | the generator `*` with `get` or `set` (and `get` with `set`, one axis) |

Rust's `function_modifiers`, `self_parameter`, `parameter`, `let_declaration`, `static_item`,
async and gen blocks, `reference_type` and `trait_item` have no such pair, nor do python's
function, `for`, `with`, comprehension `for` and `except` clauses.

### `&mut` and `exclusive`

- `&mut T` (`reference_type`'s `mutable`), `&mut pat` (`reference_pattern`'s `mutable`) and
  `&mut x` (`reference_expression_mut`) say the referent is exclusive. The vocabulary has the
  first two as `mutable` members and no fact for the third.
- `*mut T` (`pointer_type_mut`) and `&raw mut x` (`reference_expression_raw_mut`) say a raw pointer
  may write. Raw pointers alias, so "exclusive" would misstate them.
- `self_parameter`'s `mutable` means `exclusive` with a `&` (`&mut self`), and the binding's
  `mutable` without one (`mut self`).
- `ref mut x` parses as a `ref_pattern` over a `mut_pattern`, so its `mut` reads as a binding's
  `mutable`, though it makes the reference exclusive.
- `static_item` has `ref` (lazy_static's `static ref`) and `mutable` fields.
- `fn f(self: Box<Self>)` has a receiver with no `self_parameter`: a `parameter` whose pattern is
  `self`.

### Spellings against the options blocks

- **typescript:** `number_hex`, `number_octal` and `number_binary` list their `prefix`;
  `number_float_point`, `number_float_leading_point` and `number_float_scientific` list their
  exponent `marker`; `quotes` lists the quote style.
- **python:** `integer_hex`, `integer_octal` and `integer_binary` list their `prefix`.
- **rust:** no spelling option.

So a radix prefix is an option in typescript and python, and the exponent marker in typescript
only. A float's `leading_point` and `scientific`, python's triple-quoted string, the bare tuples
and the turbofish are no option's, and stay kinds. The trailing `comma` of rust's last match arm
and of python's comprehension `for` clause is no option's either. A float exponent's `sign` and a
python complex pattern's `sign` change the value, so they are data.
