# Quickstart: Format Inference (017)

## Overview

Feature 017 adds byte-equal parse-render roundtrip to sittir. After 017 lands,
`render(readNode(parse(source)), rules, { format: treeHandle.format })` equals
`source` byte-for-byte on the native read path.

**Key architecture point**: Format extraction is Rust-only. The native reader
(`SittirEngine.parse_and_read`) populates `treeHandle.format` with a single
`FormatRecord` for the whole file. The JS `readNode` signature is unchanged and
never emits `$format`. Both the JS and native render engines can _apply_ a
`FormatRecord` received via `RenderContext.format`.

## Using format extraction (native read path)

```ts
import { createRendererFromConfig } from '@sittir/core';
import { rules } from '@sittir/rust';

const source = `fn greet(\tname: &str) { println!("{}", name); }`;

// Native engine parses, reads, and infers format in one call.
// Returns NodeData (root) and populates treeHandle.format.
const engine = new SittirEngine();         // from @sittir/rust-native
const nodeData = engine.parseAndRead(source); // treeHandle.format is set

// Pass the inferred format record to the renderer via RenderContext.
const renderer = createRendererFromConfig(rules);
const output = renderer(nodeData, { format: treeHandle.format });
assert(output === source); // ✓ byte-equal
```

## Opt-out (canonical render)

```ts
const renderer = createRendererFromConfig(rules);
// ignoreFormat: true skips $format even when ctx.format is set
const canonical = renderer(nodeData, { ignoreFormat: true });
```

## Inspecting `treeHandle.format`

```ts
import type { FormatRecord } from '@sittir/types';

const fmt: FormatRecord | undefined = treeHandle.format;

if (fmt?.boundary?.leading) {
  console.log('leading whitespace:', JSON.stringify(fmt.boundary.leading));
}
if (fmt?.slots) {
  for (const [key, slot] of Object.entries(fmt.slots)) {
    console.log(`slot ${key}:`, slot);
  }
}
// Per-kind override: e.g. function_item uses different indent style
if (fmt?.kinds?.['function_item']) {
  console.log('function_item format:', fmt.kinds['function_item']);
}
```

## Acceptance corpus

The committed fixture manifest lives at `specs/017-format-inference/format-corpus.json`.
Acceptance tests live at `tests/format-roundtrip/{rust,typescript,python}.test.ts`.

Run them with:
```bash
pnpm test tests/format-roundtrip
```

## Adding a new format fixture

1. Create a source fixture file under `tests/format-roundtrip/fixtures/<name>.<ext>`.
2. Add an entry to `format-corpus.json` with the appropriate `category` and `seedSource`.
3. Run `pnpm test tests/format-roundtrip` to verify the fixture passes.

## Development commands

```bash
pnpm test                         # full suite
pnpm test tests/format-roundtrip  # format acceptance corpus only
pnpm -r run type-check            # workspace type-check
```
