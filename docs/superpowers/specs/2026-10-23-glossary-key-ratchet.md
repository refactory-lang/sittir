# Glossary key ratchet: every entry names a live symbol, every declaration has one

## The rule

A glossary heading `### \`<file>::<qualified name>\`` is a key. A key is valid when
it names exactly one declaration the graph spells that way. The ratchet counts the
keys that are not valid, by class, and counts the declarations that have no key at
all. Each count has a ceiling. A count may only fall; a run never raises one.

The check runs in CI with no Infigraph dependency. It reads the TypeScript sources
through the TypeScript compiler API, so declarations and owners are exact, not
text-matched. Infigraph's doctor stays a manual cross-check.

## Scope

- Glossary trees: `packages/codegen/src/`, `packages/common/src/`,
  `packages/tools/src/`, `packages/types/src/`, the four trees the glossary
  README's layout table covers.
- Glossary documents: `docs/glossary/*.md`, excluding `README.md`.
- Source files: `*.ts` under those trees, excluding generated files and test files.
- A heading inside a code fence is not a key. It is its own class (below).

## Declaration enumeration

Enumerated declarations, for the undocumented count:
1. a top-level declaration: `function`, `class`, `interface`, `type`, `enum`,
   `const`, `let`, `var`, exported or not;
2. a class or interface member: a method, accessor, property, or parameter
   property, keyed by its owner (`Owner::member`).

Undocumented = enumerated declarations minus keys that resolve to them.
**Open:** whether non-exported top-level declarations count. Today's text count
includes them (9840 undocumented of 13518 enumerated), which is far larger than an
exported-only count would be. Settle the scope before the ceiling is set.

## Classifier rules

For each heading key, `file` and `qual` split on the first `::`. `parts` is `qual`
split on `::` and `.`; `name` is its last part. Rules are checked in order; the
first match is the class.

| Class | Rule |
|---|---|
| `file-missing` | the file does not exist |
| `ok-top` | one part and `name` is a top-level declaration in `file` |
| `ok-member-with-owner` | two or more parts and `parts[-2]` owns a member `name` in `file` |
| `qualified-but-top-level` | two or more parts and `name` is top-level, not a member |
| `owner-missing-single` | one part and `name` is a member of exactly one owner |
| `owner-missing-multi` | one part and `name` is a member of two or more owners |
| `wrong-owner` | two or more parts and `name` is a member, but not of `parts[-2]` |
| `dot-separated` | the qualifier uses `.` and no `::` |
| `no-declaration` | none of the above: the name is not declared in `file` |
| `fenced` | the heading sits inside a code fence (the doctor class `4 fenced`) |

`owner-missing-single` resolves by rekey to `Owner::name`. A rekey dry run on
`node-map.ts::isUnnamed` → `node-map.ts::AssembledNonterminal::isUnnamed` resolved
in the graph, so the graph spells members with their owner.

Multi-owner, wrong-owner, no-declaration, and dot-separated keys need a decision
by the entry's author; the check reports them, it does not rewrite them.

## Today's counts (2026-10-23)

Taken after the compiler-model rekeys (`95530bcdd`). Enumerated with a text
scanner over the four trees, not the compiler API, so counts shift a little when
the classifier moves to the compiler API.

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
| undocumented declarations | 9840 (scope open, see above) |

Headings total 4407. Doctor's own counts on the same day, for the cross-check:
no-symbol 576, `name#N` 7, `.` keys 10, multi-entry 58, fenced 4, malformed 3.
The two methods differ by the owner-missing class; the rekey dry run shows the
graph agrees with the compiler-API classifier's `Owner::name` reading.

## Ceilings file

One checked-in JSON file holds the ceiling for each class and for undocumented.
`--update` lowers a ceiling to the current count when the count falls; it never
raises one. A run fails when any count exceeds its ceiling.

## Out of scope

- Writing or repairing entries. The check reports; authors and the docs peer edit.
- Doctor as a gate. It stays a manual cross-check.
