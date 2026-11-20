# @sittir/go

Typed Go IR builders generated from the `tree-sitter-go` grammar by `@sittir/codegen`.

Regenerate:

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar go --all --output packages/go/src
```

This grammar is not yet part of the default validation gates. Once it matures, add
`"sittir": { "stable": true }` to `package.json`.
