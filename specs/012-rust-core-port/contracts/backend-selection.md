# Contract — Backend selection

**Artifact**: `packages/{lang}/src/backend.ts` (new; one per grammar package)
**Governed by**: Spec FR-009, FR-017, FR-020, FR-021

The JS-side runtime-selection shim. Picks between the shared native backend (`@sittir/{lang}`) and the JS fallback (existing Nunjucks engine). Exposes inspection API and optional diagnostic.

---

## Selection algorithm

Runs **once per module load** (effectively once per Node process under normal ESM semantics). Result is cached as a module-local singleton; subsequent `getActiveBackend()` calls return the cached result.

```text
1. Attempt to require('@sittir/{lang}')
   - On ImportError / platform-not-supported → set status = { name: 'js', reason: 'native binary not available for this platform' }
   - On other load error → set status = { name: 'js', reason: 'native load failed: <error message>' }

2. If loaded:
   a. Construct `new SittirEngine('{lang}')`, then call `engine.templateBundleHash` (string)
   b. Import TEMPLATE_BUNDLE_HASH from packages/{lang}/src/hash.ts
   c. Compare (case-insensitive hex compare)
      - Match → status = { name: 'native', hashMatch: true }
      - Mismatch → status = { name: 'js', reason: 'template-bundle hash mismatch', hashMatch: false }

3. If SITTIR_BACKEND_DEBUG env var is set to a non-empty string:
   - Write one line to stderr: `sittir/{lang}: backend = <name>[, reason = <reason>]`

4. Store status as module-local singleton.
```

### Error recovery

- Any exception during the above (e.g. `engine.templateBundleHash` throws) → status becomes `js` with `reason: 'native-engine error at init: <message>'`. Never crashes the consumer import.

---

## Public API

```ts
// packages/{lang}/src/backend.ts
export type BackendName = 'native' | 'js';

export interface BackendStatus {
	name: BackendName;
	/** Populated on fallback. Absent when name === 'native'. */
	reason?: string;
	/** Hash-comparison outcome when native was considered. Absent when native didn't load at all. */
	hashMatch?: boolean;
}

export function getActiveBackend(): BackendStatus;
```

Exported from `packages/{lang}/src/index.ts`:

```ts
export { getActiveBackend } from './backend.ts';
export type { BackendName, BackendStatus } from './backend.ts';
```

---

## Contract

### `getActiveBackend(): BackendStatus`

- **Pre**: none. Can be called at any time from consumer code.
- **Post**: returns the cached selection made at module load. The returned object is frozen (`Object.freeze`); consumers cannot mutate it.
- **Stability**: within a single Node process, the return value is reference-stable (same object every call).
- **Errors**: never throws.

### Environment variable: `SITTIR_BACKEND_DEBUG`

- **Unset / empty**: no diagnostic output. Default.
- **Any non-empty value** (`"1"`, `"true"`, `"yes"`, etc.): writes exactly one line to `process.stderr` at first backend selection, formatted as:

  ```
  sittir/{lang}: backend = <name>
  ```

  or, on fallback:

  ```
  sittir/{lang}: backend = typescript, reason = <reason>
  ```

- **Never** writes to stdout. **Never** throws on stderr write failure.

### Environment variable: `SITTIR_BACKEND` (consumer-forced selection — non-normative)

Not required by the spec but documented here as a planned debug aid. When set to `"js"`, skip the native load attempt entirely; when set to `"native"`, fail loudly on any native-load failure instead of falling back. Useful for CI and benchmark diffing.

---

## Invariants

1. The module-load-time selection is **never retried**. A failed native load does not self-heal later in the same process.
2. `getActiveBackend()` is **pure** in the observational sense — it performs no I/O, never writes to stderr. Side effects (diagnostic line) happen only at module load.
3. The JS fallback path **never** calls `@sittir/{lang}-native`. Once the singleton says `name: "js"`, all render/read/splice goes through the existing JS Nunjucks engine.
4. A freshly-installed package with mismatched native + TS template versions **MUST** fall through silently per FR-009 + FR-020 — not throw, not log to stderr unless `SITTIR_BACKEND_DEBUG` is set.

---

## Usage examples

```ts
// Consumer inspecting the selection
import { getActiveBackend } from '@sittir/rust';

const status = getActiveBackend();
if (status.name === 'typescript') {
	console.warn('[perf] running on TS backend:', status.reason ?? 'default');
}
```

```bash
# Developer diagnosing a native-load failure
SITTIR_BACKEND_DEBUG=1 node my-codemod.js
# stderr: sittir/rust: backend = typescript, reason = native binary not available for this platform
```

```bash
# CI matrix job forcing TS to verify fallback parity
SITTIR_BACKEND=typescript node test-parity.js
```

---

## Non-goals

- No per-call backend override API. The selection is process-level.
- No telemetry callback on selection. Consumers that need this can call `getActiveBackend()` explicitly.
- No hot-swap mid-process. If the native `.node` file is replaced on disk mid-process, the running process continues with its cached selection.
