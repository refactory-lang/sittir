# Deep node nesting: where the native stack runs out

A census of the recursive steps that a deeply nested node tree runs through, for the fix that keeps a deep tree from ending the process. Each site is marked as master core (both storages run it) or records only, and by whether it can run on a grown stack segment. Measured at `c551239cf` (master) and `8dd31a83b` (the records stack; `5501e5697` has the same tree). `probe.mts` renders one depth per process.

## 1. Limits

`n` nested `binaryExpression`s, left-nested, in an `expressionStatement`, rendered with `$render()`, rust grammar, macOS arm64, release addon, main thread (8 MB).

| storage | renders | fails at |
| --- | --- | --- |
| objects | 2,000 | 2,500: `RangeError` in `toNodeValue` (JavaScript) |
| objects, JavaScript stack raised to 3.5 MB (`--stack-size=3500`) | 5,000 | 6,000: SIGSEGV (exit 139) |
| records | 4,000 | 5,000: SIGSEGV (exit 139) |

Objects fails first in JavaScript, with a catchable error. Past that, both storages end the process in native code. So an iterative `toNodeValue` alone would turn objects' refusal into a crash from about 5,500 levels. The JavaScript and native halves have to land together.

The frame that overflows first was not isolated: lldb could not attach in this environment, and Node left no crash report. Isolating it, per storage and on a Worker's smaller stack, is the fix's first step.

## 2. Sites

Every recursion cycle through node data passes through a slot (`SlotValue`), a `Box` or a list, because a recursive type needs an indirection. Each generated node's render also goes through `NodeLayout::render`.

### Master core: both storages, or objects

| step | site | grows? |
| --- | --- | --- |
| render | `NodeLayout::render` (`rust/crates/sittir-core/src/layout.rs:325`), which every generated node's `Render` impl wraps its body in; children through `Render for Box` (`render.rs:463`) and the slot | yes |
| prepare | `Prepare for SlotValue` (`prepare.rs:417`), `Prepare for Box` (`prepare.rs:533`), and each generated node's prepare | yes |
| typed read | `ReadNode for Box` (`read.rs:783`) and the generated readers: a snapshot (`ParsedTree::snapshot`, `engine.rs:587`) and an edited coordinate read during prepare (`read_edited`) | yes |
| drop | owned node data's default `Drop`: recursive through each `Box`, with no `Drop` impl of ours | yes, if the drop runs inside the grown segment; otherwise an iterative drop |
| decode (objects) | the derive's `FromNapiValue` (`rust/crates/sittir-node-macros/src/codec.rs:66, 146, 215`), which turns an objects render's data into owned node data | **no**: it calls napi on every node |
| encode | the derive's `ToNapiValue` (`codec.rs:71, 125`), which returns a snapshot's owned data to JavaScript | **no**: napi on every node |
| JavaScript (objects) | `toNodeValue` (`packages/common/src/node-data.ts`), `snapshotIn`/`copyOf` (`snapshot.ts`), and `entryData` over a side entry's own nodes | n/a: made iterative |

### Records only (the stack)

| step | site | grows? |
| --- | --- | --- |
| render | `RecordLayout::render` (`arena/view.rs:359`) and the record views' `Render` impls (`arena/view.rs:505, 579, 698`), over the views `sittir-node-macros/src/views.rs` generates | yes |
| prepare | `PrepareRecord::prepare_record` (`arena/prep.rs:148`, impls at 174 and 214), generated through `sittir-node-macros/src/prepare_record.rs`; roots at `prepare_root` and `prepare_entry_root` | yes |
| record render roots | `render_record` (`arena/parsed.rs:29, 234`) | yes |
| JavaScript | the record views' slot reads (`storedSlotValues`, `packages/common/src/record-view.ts:349`) when a caller walks a deep view | n/a: iterative where it recurses |

A record crosses JavaScript by reference, so records have no deep decode. A records snapshot still runs the shared typed read and encode.

## 3. The napi constraint

Growing the stack switches to a new segment, and no napi or V8 call may run on one, since V8 checks its stack limit against the thread's own stack. The decode and the encode call napi on every node, so they cannot grow. They need explicit work stacks. One way to get there: decode by borrowing the JavaScript values into a flat structure first (iterative, on the thread's stack), then build the owned tree from it on a grown segment. Encode would do the reverse.

## 4. Proposed split

1. **Master: the shared core.** Grow at `NodeLayout::render`, the slot and box prepare, and the typed read. Keep each owned tree's drop inside the grown segment, or drop it iteratively. Give the derive's decode and encode explicit work stacks. Make `toNodeValue` and the objects snapshot walk iterative. All of this goes in one change, so no depth turns a refusal into a crash. Tests: render or refuse by name at a depth past each current limit, per storage, on the main thread and in a Worker, with the process running on after each.
2. **The records stack: the record-only sites.** Grow at `RecordLayout::render`, the record views and `prepare_record`, carried up after the master change.
