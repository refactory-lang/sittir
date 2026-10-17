# @sittir/cli

The `sittir` command interface for grammar generation, diagnostics, and validation. Diagnostic implementations live in `@sittir/tools`; generation lives in `@sittir/codegen`.

From a source checkout:

```sh
pnpm exec tsx packages/cli/src/cli.ts --help
pnpm exec tsx packages/cli/src/cli.ts gen --help
pnpm exec tsx packages/cli/src/cli.ts tool --help
pnpm exec tsx packages/cli/src/cli.ts validate --help
```

Use each subcommand's help for its flags. The [CLI reference](../../docs/cli-command-glossary.md) is generated from the same command tree. See [Development](../../DEVELOPMENT.md) for setup and verification.
