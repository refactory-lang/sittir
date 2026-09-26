# @sittir/scm

Typed Scm IR builders generated from the `tree-sitter-scm` grammar by `@sittir/codegen`.

Regenerate:

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar scm --all --output packages/scm/src
```

This grammar is not yet part of the default validation gates. Once it matures, add
`"sittir": { "stable": true }` to `package.json`.
