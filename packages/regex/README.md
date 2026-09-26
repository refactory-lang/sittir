# @sittir/regex

Typed Regex IR builders generated from the `tree-sitter-regex` grammar by `@sittir/codegen`.

Regenerate:

```bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar regex --all --output packages/regex/src
```

This grammar is not yet part of the default validation gates. Once it matures, add
`"sittir": { "stable": true }` to `package.json`.
