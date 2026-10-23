# Glossary key ratchet: every entry names a live symbol, every exported declaration has one

## The rule

A glossary heading `### \`<file>::<qualified name>\`` is a key. A key is valid when
it names exactly one symbol the graph spells that way. The ratchet counts the keys
that are not valid, by class, and counts the exported declarations that have no key.
Each count has a ceiling. A count may only fall; a run never raises one.

Key spelling follows the graph. Lookups go through Infigraph (`search`, `doc_entry`),
so a key the graph refuses is broken whatever the source says. When the compiler API
and the graph disagree, the graph wins. One named exception: getters declared on an
abstract class are keyed by bare name in the graph (Infigraph report, abstract-class
getters). The classifier encodes that exception by name. If Infigraph changes that
spelling, the exception and those keys change together.

## Where it runs

The check runs on pushes to master, after merge. It does not run as a PR gate.
Authors no longer write glossary entries, so a PR that adds or renames a declaration
must not fail on an undocumented or broken key. When a count rises above its ceiling,
the master job fails and the docs peer brings it back down.

It reads the TypeScript sources through the TypeScript compiler API, so declarations and
owners are exact, with no graph dependency. Infigraph's doctor stays a manual
cross-check, not a gate.

## Scope

- Glossary trees: `packages/codegen/src/`, `packages/common/src/`,
  `packages/tools/src/`, `packages/types/src/`, the four trees the glossary README's
  layout table covers.
- Glossary documents: `docs/glossary/*.md`, excluding `README.md`.
- Source files: `*.ts` under those trees, excluding generated files and test files.
- A heading inside a code fence is not a key.

## Declaration enumeration

Undocumented declarations are the exported set:
1. an exported top-level declaration: `function`, `class`, `interface`, `type`, `enum`,
   `const`, `let`, `var`;
2. a member of an exported class or interface: a method, accessor, property, or
   parameter property, keyed by its owner (`Owner::member`).

Undocumented = enumerated declarations minus keys that resolve to them. Non-exported
declarations and members of non-exported classes are not counted. Those are the
declarations a reader of the code needs least, and the ratchet does not gate them.

## Classifier rules

For each heading key, `file` and `qual` split on the first `::`. `parts` is `qual`
split on `::` and `.`; `name` is its last part. Rules are checked in order; the first
match is the class.

| Class | Rule |
|---|---|
| `file-missing` | the file does not exist |
| `ok-top` | one part and `name` is a top-level declaration in `file` |
| `ok-member-with-owner` | two or more parts and `parts[-2]` owns a member `name` in `file` |
| `ok-abstract-getter` | one part and `name` is a getter of an abstract class in `file` (the named exception: graph keys these bare) |
| `qualified-but-top-level` | two or more parts and `name` is top-level, not a member |
| `owner-missing-single` | one part and `name` is a member of exactly one owner |
| `owner-missing-multi` | one part and `name` is a member of two or more owners |
| `wrong-owner` | two or more parts and `name` is a member, but not of `parts[-2]` |
| `dot-separated` | the qualifier uses `.` and no `::` |
| `no-declaration` | none of the above: the name is not declared in `file` |

`owner-missing-single` resolves by rekey to `Owner::name` for concrete classes. A rekey
dry run on `node-map.ts::isUnnamed` → `node-map.ts::AssembledNonterminal::isUnnamed`
resolved in the graph. The abstract-class getter exception is the one place bare keys
are correct.

Multi-owner, wrong-owner, no-declaration, and dot-separated keys need a decision by the
entry's author. The check reports them; it does not rewrite them.

## Today's counts (2026-10-23)

Enumerated with a text scanner over the four trees, not the compiler API, so counts shift
a little when the classifier moves to the compiler API.

| Class | Count |
|---|---|
| ok-top | 3693 |
| ok-member-with-owner | 235 |
| owner-missing-single | 162 |
| owner-missing-multi | 70 |
| wrong-owner | 11 |
| dot-separated | 47 |
| no-declaration | 228 |
| file-missing | 19 |
| undocumented exported declarations | 5534 (of 7566 exported) |

The 9840 count from the earlier scope (every top-level and member declaration) is
superseded by the exported-only count above. Headings total 4407. Doctor's own counts
on the same day, for the cross-check: no-symbol 576, `name#N` 7, `.` keys 10,
multi-entry 58, fenced 4, malformed 3. The two methods differ by the owner-missing class
and by the abstract-class getters, which the graph spells bare.

## Ceilings file

One checked-in JSON file holds the ceiling for each class and for undocumented exported
declarations. `--update` lowers a ceiling to the current count when the count falls; it
never raises one. A master run fails when any count exceeds its ceiling.

## Out of scope

- Writing or repairing entries. The check reports; authors and the docs peer edit.
- Doctor as a gate. It stays a manual cross-check.
- PR gating. The check runs after merge only.
