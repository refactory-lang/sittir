# @sittir/tools

Diagnostics, corpus validation, example emission, and regression tooling for the Sittir workspace. Use these through the unified CLI rather than adding independent command parsers.

```sh
pnpm exec tsx packages/cli/src/cli.ts tool --help
pnpm exec tsx packages/cli/src/cli.ts validate --help
```

This package is contributor tooling, not the public syntax-construction API. See [Development](../../DEVELOPMENT.md), the [project workflow](../../.claude/project-workflow.md), and the [CLI reference](../../docs/cli-command-glossary.md).

## The encode stack guard

`tool encode-stack` holds each release addon to `ENCODE_STACK_BUDGET` (`rust/crates/sittir-core/src/codec.rs`). It reads the disassembly of the unstripped copy that `build-native` keeps, and requires

    RECURSION_LIMIT × level + one-time ≤ ENCODE_STACK_BUDGET

A level is the costliest path between successive whole encodes. The one-time cost is the frames from the napi callback to the first whole encode, through the encode loop or not, plus the trip into a node's trivia.

Every indirect call on those paths must resolve: through a GOT slot named by the addon's dynamic relocations, along the control flow that keeps a slot in a register, or through a jump table read from the image. Every other indirect call the encode reaches must fall in a named class (`DYNAMIC_CLASSES`), which the output prints with its reason. A call in no class fails the guard until it is reviewed.

The budget covers sittir's own frames. The calls below the deepest level whose stack doesn't grow with depth run past it: napi into V8 (a garbage collection included), the allocator, `memcpy`, and std's panic and formatting code. Node's default V8 stack limit on the main thread is 984 KiB, which leaves them about 920 KiB.
