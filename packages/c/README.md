# @sittir/c

Typed C IR builders generated from the `tree-sitter-c` grammar by `@sittir/codegen`.

Regenerate:

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar c --all --output packages/c/src
```

This grammar is not yet part of the default validation gates. Once it matures, add
`"sittir": { "stable": true }` to `package.json`.
