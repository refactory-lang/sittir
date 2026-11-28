# Go Overrides Glossary

Per-rule reference for `packages/go/grammar.sittir.ts`: each patch the layer
makes to the upstream grammar, the language production it follows, and what
would break without it.

---

### `source_file` — the terminator (`packages/go/grammar.sittir.ts`, `edits:`)

Upstream's `source_file` repeats a statement or a top-level declaration, each
followed by a line break, `;` or `\0`. Enrich lifts the two forms into the
hoisted arms `source_file_arm1` (`statement`) and `source_file_arm2`
(`topLevelDeclaration`), and names the trailing slot after the kind it holds,
`source_file_text`. The edits at `0/0/0/0/1` and `0/0/0/1/1` name that slot
`terminator`, its role: the word the code already uses for a statement's `;`
or automatic semicolon. A source file's config takes each arm's config among
its `elements`, the arm told apart by its keys (`elementsSeatOf`):

```ts
go.build.sourceFile({
	elements: [
		{ topLevelDeclaration: go.build.packageClause({ packageIdentifier: 'main' }), terminator: go.build.sourceFileText('\n') },
		{ statement: go.build.breakStatement(), terminator: go.build.sourceFileText('\n') }
	]
});
```
