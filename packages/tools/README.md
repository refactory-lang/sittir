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

Every indirect call or tail call on those paths must resolve: through a slot the addon's relocations fill, along the control flow that keeps a slot or a function's address in a register (x86-64 and arm64), through memory at such an address, or through a jump table read from the image. An indirect jump is a tail call unless it dispatches through a jump table. A table ends where the next table in the same function begins: the next address the function loads into a register that one of its dispatches reads a table from. It also ends at its first entry that lands on no instruction of the function. Every other indirect call the encode reaches must fall in a named class (`DYNAMIC_CLASSES`), which the output prints with its reason. A fragment the machine outliner split off (`OUTLINED_FUNCTION_<n>`) falls in a class only when every function that enters it does. A call through a register that a `cmov` or `csel` set to one of two functions is a call to both, and the output lists it with their names. A call in no class fails the guard until it is reviewed.

A Windows build is read from what the MSVC linker leaves. `build-native` has it write a map (`/MAP`) beside the unstripped copy, and the guard names the copy's functions from that map. Each frame comes from the image's unwind codes, an import slot holds the function it imports, and any other relocated slot holds the pointer its base relocation sets. On Windows napi-rs reaches Node-API through a table it fills from the host at load time; a call through that table is a call to the host function its stub is named after, so it runs past the budget like every napi call.

The budget covers sittir's own frames. The calls below the deepest level whose stack doesn't grow with depth run past it: napi into V8 (a garbage collection included), the allocator, `memcpy`, std's panic and formatting code, a custom `io::Error`'s payload drop, and the unwinder. Node's default V8 stack limit on the main thread is 984 KiB, which leaves them about 888 KiB.
