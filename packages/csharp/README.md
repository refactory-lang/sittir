# @sittir/csharp

Typed Csharp IR builders generated from the `tree-sitter-csharp` grammar by `@sittir/codegen`.

Regenerate:

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar csharp --all --output packages/csharp/src
```

This grammar is not yet part of the default validation gates. Once it matures, add
`"sittir": { "stable": true }` to `package.json`.
