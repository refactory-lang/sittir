# Glossary key ratchet: every entry names exactly one declaration, every exported declaration has one

## The rule

A glossary heading `### \`<file>::<qualified name>\`` is a key. A key is valid when it
names exactly one declaration in its file:

- the bare name, when that name is declared once in the file (a top-level declaration,
  or a member of exactly one class or interface);
- `Owner::name`, when the bare name is declared by more than one owner in the file.

The ratchet counts the keys that are not valid, by class, and counts the exported
declarations that have no key. Each count has a ceiling. A count may only fall; a run
never raises one.

The rule is checkable with the TypeScript compiler alone, so the check does not depend on
how the graph spells a symbol. Graph spelling differences are Infigraph's to fix, not the
key's to follow.

## Where it runs

The check runs on pushes to master, after merge. It does not run as a PR gate. Authors
no longer write glossary entries, so a PR that adds or renames a declaration must not
fail on an undocumented or broken key. When a count rises above its ceiling, the master
job fails and the docs peer brings it back down.

It reads the TypeScript sources through the TypeScript compiler API, so declarations and
owners are exact. Infigraph's doctor stays a manual cross-check, not a gate.

## Scope

- Glossary trees: `packages/codegen/src/`, `packages/common/src/`,
  `packages/tools/src/`, `packages/types/src/`, the four trees the glossary README's
  layout table covers.
- Glossary documents: `docs/glossary/*.md`, excluding `README.md`.
- Source files: `*.ts` under those trees, excluding generated files and test files.
- A heading inside a code fence is not a key.

## Declaration enumeration

A named thing the compiler resolves inside an owner is a declaration. `::` separates
every level of nesting. The enumerator reports, for each file in scope:

1. top-level declarations: `function`, `class`, `interface`, `type`, `enum`, `const`,
   `let`, `var`, exported or not;
2. members of a class or interface: a method, accessor, property, or parameter
   property, at any depth, keyed `Owner::member`;
3. members of an enum: keyed `Enum::Member`;
4. named properties of a named const object literal, at any depth, keyed
   `Const::prop` and `Const::prop::nested`;
5. members of a type literal (`type T = { … }`, including generic aliases), at any
   depth, keyed `Alias::member` and `Alias::member::nested`.

Undocumented declarations are depth two only: exported top-level declarations, plus their
direct members, meaning members of exported classes, interfaces, enums, const objects, type
literals and namespaces. Deeper nested properties (`A::prop::inner`) are not counted as
undocumented, though an entry for one is a valid key. Non-exported declarations and members of
non-exported owners are not counted.

Undocumented = enumerated exported declarations minus keys that resolve to them under the
rule above.

## Classes

For each heading key, `file` and `qual` split on the first `::`. `name` is the last
segment of `qual` after splitting on `::`. The first matching row is the class.

| Class | Valid? | Rule |
|---|---|---|
| `ok-bare-unique` | yes | one segment; `name` is declared once in `file` |
| `ok-owner-qualified` | yes | `Owner::name`; `name` is a member of `Owner` in `file` |
| `ambiguous` | no | one segment; `name` is declared by two or more owners or top-level and a member |
| `no-declaration` | no | `name` is not declared in `file` under the owner the key gives |
| `wrong-owner` | no | `Owner::name`; `name` is declared, but not by `Owner` |
| `dot-separated` | no | the qualifier uses `.` as a separator; the key must use `::` |
| `placeholder` | no | the name is `<unknown>`, a relocation artifact; no declaration has that name |
| `out-of-scope-file` | no | the file is outside the four glossary trees |
| `file-missing` | no | the file does not exist |

A key with `Owner.member` (dot separator) is broken even when the member exists: it is
written in the form the graph does not use, and the rule says the key names a declaration
in the source's own `::` form.

`ambiguous` keys need the owner decision from the entry's author. The check reports
them; it does not rewrite them. `dot-separated`, `wrong-owner`, `no-declaration`, and
`file-missing` keys are repaired by the docs peer.

Abstract-class getters need no exception under this rule: a getter declared once in its
file is a bare unique name, and its key is valid as written.

Enum members, named object-literal properties, and type-literal members follow the same
rule at any depth. `RuleBase::separator::terminated` is a nested type-literal member, and
`REPARSE_WRAPPERS::rust::mut_pattern` is a nested property of a named const object.

## Today's counts (2026-10-23)

Enumerated with a text scanner over the four trees, not the compiler API, so counts shift
a little when the classifier moves to the compiler API. Taken on master at `e256f4f84`
plus the emitters rekeys (`d5fdd1134`).

| Class | Count | Valid? |
|---|---|---|
| ok-bare-unique | 3798 | yes |
| ok-owner-qualified | 98 | yes |
| ambiguous | 93 | no |
| no-declaration | 228 | no |
| wrong-owner | 0 | no |
| dot-separated | 229 | no |
| file-missing | 19 | no |
| undocumented exported declarations | 5534 (of 7566 exported) | — |

Headings total 4465. The `dot-separated` count includes the 171 `Owner.member` keys and the
11 wrong-owner-looking dot keys that the earlier scope counted as valid. `ambiguous` is
93, not 70: 70 are multi-owner members, and 23 are names declared both top-level and as a
member.

Doctor's counts on the same day, for the cross-check: no-symbol 576, `name#N` 7, `.` keys
10, multi-entry 58, fenced 4, malformed 3. Doctor follows the graph's spelling, which
differs from this rule for interface and type-literal properties and for some abstract
class members. Those differences are Infigraph's to fix.

## Resolved enumeration questions

These settle the cases the rule above leaves open. Implement builds to them.

- `constructor` is a class member. It is enumerated, keyed `Owner::constructor`, and on an
  exported class it counts as undocumented.
- TypeScript `private` and `#private` members are not enumerated as undocumented, for the same
  reason as members of non-exported owners. `protected` members count.
- Namespace members (`namespace N { export … }`) are enumerated as `N::member`, and exported
  when the namespace is.
- Type literals are followed through unions, intersections and parentheses. A property whose
  own type is a type literal nests: `A::prop::inner`.
- An object-literal const is followed through `as const`, `satisfies` and parentheses only.
  `Object.freeze(...)` is not followed.
- A key names exactly one declaration in its file, as the rule above states: the bare name when
  that name is declared once in the file (a top-level declaration, or a member of exactly one
  owner), otherwise the full path (`Namespace::Owner::member`). A bare name that is a unique
  member is valid, so a heading `file::tilt` where `tilt` is only `Box::tilt` is
  `ok-bare-unique`. Suffix matching (`Owner::member` matching `Outer::Owner::member`) is not
  used: one owner name can occur under several namespaces in one file, and a suffix would make
  such a key ambiguous.

## Ceilings file

One checked-in JSON file holds the ceiling for each broken class and for undocumented
exported declarations. `--update` lowers a ceiling to the current count when the count
falls; it never raises one. A master run fails when any count exceeds its ceiling.

## Out of scope

- Writing or repairing entries. The check reports; authors and the docs peer edit.
- Doctor as a gate. It stays a manual cross-check.
- PR gating. The check runs after merge only.
- Graph spelling. Infigraph's resolver is not part of this rule.
