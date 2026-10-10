# Placed claims and parser aliases

**Question.** A placed claim is decided by an ancestor: python's docstring is a `string` that is
the first statement of a body. If every placed claim can become a parser alias at a context-unique
grammar site, `$type` decides it alone, and the read view needs no `$subType` stamped from the
parent chain. How many placed claims have such a site, and which are facts no grammar site
captures?

**Answer.** 16 of the three grammars' 633 claims are placed.
- 6 have a grammar site an alias can sit at: rust's 4, which the three ruled aliases carry, rust's
  `crate` visibility, and python's method in a class body.
- 5 are bare identifiers in role slots. §2.1 of the bindings spec already rules that these are not
  claims.
- Typescript's 1 is ruled onto kinds the grammar has.
- The residue is 4 python claims. The two docstrings are decided by position. The static and class
  methods are decided by a decorator's text.

The reader also drops anchors, so today it cannot test the docstrings' position at all.

## Setup

- `feat/bindings` at `68a5b8ba2`, in a worktree. Its `bindings.scm` files and codegen's bindings
  reader are those of that commit.
- A placed claim is one the bindings reader marks `toplevel: false`: its node is not its pattern's
  top. The reader is `@sittir/codegen/bindings`, the pinned reader in its child process.
  `placed-claims.mts` reads each pattern on its own, so each claim keeps its line and source.
- Sites are read from each grammar's committed `.sittir/src/grammar.json`. On `68a5b8ba2` that is
  the base grammar: the overlay is not yet wired into `grammar.sittir.ts`, and `bindings.scm`
  names base kinds.
- `sites.py` reads each claim's chain from its pattern, top to the claimed node, with fields and
  anchors, and checks the chain against the reader's `within`.
  - It finds where the claimed kind is a direct child of its pattern parent, through hidden rules.
  - The site is context-unique when nothing outside the pattern reaches a rule on the chain.
  - Otherwise an alias needs clones: the first shared rule, and every rule below it down to the
    site. Rust's splits are the model: they clone `declaration_list`, then `_declaration_statement`
    inside it.
- `anchors.mts` reads python's function docstring claim with and without its anchors.
- `WT=<worktree> run.sh` runs all three. `results/` holds the output.

## Results

| | python | rust | typescript | total |
| --- | --- | --- | --- | --- |
| claims | 186 | 205 | 242 | 633 |
| placed | 9 | 6 | 1 | 16 |
| alias, at a site the grammar has | | 1 | | 1 |
| alias, with clones | 1 | 4 | | 5 |
| kinds the grammar has (ruled) | | | 1 | 1 |
| identifier in a role slot (§2.1) | 4 | 1 | | 5 |
| residue: position | 2 | | | 2 |
| residue: an ancestor's text | 2 | | | 2 |

The claims, by `bindings.scm` line. A `.` before a kind is an anchor: the node is its parent's
first child.

| claim | chain | class |
| --- | --- | --- |
| python 10 `literal.string.docstring` | `function_definition > body: suite_block > block > .simple_statements > simple_statements_elements > .item: expression_statement > string` | position |
| python 12 `literal.string.docstring` | the same, in `class_definition` | position |
| python 13 `declaration.method` | `class_definition > body: suite_block > block > function_definition` | alias at `_compound_statement`, cloning `_suite`, `suite_block`, `block`, `_statement`, `_compound_statement` |
| python 16 `declaration.method.static` | `decorated_definition > function_definition`, with `#eq? @_d "staticmethod"` on the decorator | text |
| python 17 `declaration.method.class` | the same, with `"classmethod"` | text |
| python 19 `declaration.parameter` | `parameters > parameters_elements > identifier` | identifier |
| python 20 `declaration.parameter.self` | `parameters > parameters_elements > .identifier` | identifier, and position |
| python 21 `declaration.parameter` | `lambda_parameters > parameters_elements > identifier` | identifier |
| python 209 `identifier.type` | `type > identifier` | identifier |
| rust 16 `declaration.method.signature` | `trait_item > declaration_list > function_signature_item` | alias at `_declaration_statement`, cloning `declaration_list`, `_declaration_statement` (ruled) |
| rust 17 `declaration.method` | `impl_item_body > declaration_list > function_item` | the same |
| rust 18 `declaration.method.static` | the same | the same; the missing receiver is tested inside the node |
| rust 22 `declaration.method` | `trait_item > declaration_list > function_item` | the same |
| rust 46 `declaration.parameter` | `closure_parameters > _` | identifier: the wildcard admits `identifier` and 34 other kinds, none of them only here |
| rust 235 `modifier.visibility.public.internal` | `visibility_modifier > crate` | alias at `visibility_modifier`'s own `crate` arm, no clones |
| typescript 22 `declaration.enum_member` | `enum_body > enum_body_elements > _` | kinds the grammar has: `enum_body_element_name` and `enum_assignment`, each only here |

## Findings

1. **Every placed claim whose context is structure has a site.** There are six.
   - Rust's four are the three ruled aliases, each cloning `declaration_list` and
     `_declaration_statement`.
   - Rust's `crate` visibility needs no clone: the alias sits on `visibility_modifier`'s own
     `crate` arm.
   - Python's method in a class body clones five rules, from the body's `_suite` down to
     `_compound_statement`, so a class body becomes a block kind of its own. That cost is
     unmeasured; rust's three aliases cost 23 states.
2. **Five are bare identifiers in role slots:** python's parameters (`self` among them), python's
   `type > identifier` and rust's closure parameters. §2.1 rules that such an identifier stays an
   identifier and its slot names its role, and that neither a claim nor an overlay pretends
   otherwise. So these need neither an alias nor `$subType`. `bindings.scm` still has them.
3. **Typescript's one is ruled.** In place of the wildcard, §2.3 claims `enum_body_element_name`
   and `enum_assignment`, which the grammar has only in an enum body.
4. **The residue is python's four.**
   - **Position:** the two docstrings, each a string that is the first statement of a body.
     `block` is `repeat(_statement)`, so its first statement is no site. Making it one would
     restructure `block` around its first statement. The parser would then have to tell a
     docstring from a string that starts a longer expression; this probe did not try it.
   - **An ancestor's text:** the static and class methods, decided by the decorator's name.
     `decorated_definition`'s `definition` is a site, but no site separates `@staticmethod` from
     any other decorator.
5. **The reader drops anchors.** It has no case for `.`, and `anchors.mts` gets equal facts for
   the docstring claim with and without its two anchors.
   - So today's read tests the docstrings by their enclosing kinds only. It claims every string
     statement in a body as its docstring, not only the first.
   - Python's `self` claim reads as the same pattern as its plain parameter claim.
   - This holds whichever way the residue goes.
6. **Python 13 covers undecorated methods only.** `@property def x(self)` in a class body sits
   under `decorated_definition`, so the claim misses it. An alias at `_compound_statement` would
   miss it too.

## Recommendation

The residue decides whether the read view stamps `$subType` from the parent chain. Neither of its
facts needs a chain:

- **The docstrings become a member.** Their parents already capture the string as `@doc`.
  Dropping the kind claim leaves the string a `literal.string`, and a member reads down from its
  parent, never up.
- **The decorated methods are decided by their envelope.** `decorated_definition` is a container
  that already hands its captures (`decorators`) to the element it unwraps. Its own decorator text
  can stamp the element's refinement at the same step, one level down.

Then nothing is stamped from a parent chain:
- `$type` decides every placed claim that has a site, once each has its alias. Rust's three
  aliases are ruled; rust's `crate` visibility and python's method in a class body are not.
- The read dispatch stamps the refinements a node's own text decides, as today.
- The `decorated_definition` envelope stamps the two decorated-method refinements.
