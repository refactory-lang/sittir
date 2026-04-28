# Quickstart: Format Inference (017)

## Overview

Feature 017 adds byte-equal parse-render roundtrip to sittir. After 017 lands,
`render(readNode(parse(source), source), rules)` equals `source` byte-for-byte.

## Using format extraction

```ts
import { readNode } from '@sittir/core';
import { createRendererFromConfig } from '@sittir/core';
import { rules } from '@sittir/rust';

const source = `fn greet(	name: &str) { println!("{}", name); }`;
const tree = parser.parse(source);

// Pass source text as third argument — enables $format population
const nodeData = readNode(tree.handle, undefined, source);

// render applies $format automatically — output equals source
const output = createRendererFromConfig(rules)(nodeData);
assert(output === source); // ✓ byte-equal
```

## Opt-out (canonical render)

```ts
const renderer = createRendererFromConfig(rules, { ignoreFormat: true });
const canonical = renderer(nodeData); // uses template defaults, ignores $format
```

## Inspecting `$format`

```ts
import type { FormatRecord } from '@sittir/types';

const fmt: FormatRecord | undefined = nodeData.$format;

if (fmt?.boundary?.leading) {
  console.log('leading whitespace:', JSON.stringify(fmt.boundary.leading));
}
if (fmt?.slots) {
  for (const [key, slot] of Object.entries(fmt.slots)) {
    console.log(`slot ${key}:`, slot);
  }
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
