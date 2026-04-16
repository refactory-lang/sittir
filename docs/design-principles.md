# Design Principles

Stable principle IDs that ADRs and reviews can link to. Each principle has a one-line rule, the failure mode it prevents, and a prompt shape an LLM agent can apply during design work.

These emerged from concrete decisions in `docs/adr/`. When an ADR says "we did X because of P-003," read P-003 here — don't guess from the name.

---

## P-001 — External contract first

**Rule**: When a design interacts with a tool or schema we don't own, that tool's contract is a hard boundary we conform to. We don't defer compatibility concerns to "later."

**Failure mode**: Designing a clean internal model that the external tool can't consume, then discovering it at integration time.

**Prompt shape**: "What external tool or consumer will also read this artifact? What shape does it require? Does my design produce that shape, or am I assuming a translation layer I haven't built yet?"

**Seen in**: ADR-0001 (tree-sitter must read overrides.ts), ADR-0004 (post-transform grammar is tree-sitter input), ADR-0005 (transpile to grammar.js because tree-sitter expects JS).

---

## P-002 — Mechanical vs heuristic

**Rule**: Automation runs on determinism, not cleverness. Any transformation that requires a threshold, a frequency count, or a judgment call stays out of the automated path and remains hand-authored.

**Failure mode**: A heuristic produces a "helpful" rewrite 95% of the time, and the remaining 5% are unexplainable without reading the tool's source.

**Prompt shape**: "Would this transformation ask 'is this common enough?' or 'does this look like a Y?' If yes, it's heuristic — don't automate it, surface it as a suggestion or leave it to the author."

**Seen in**: ADR-0002 (enrich only does mechanical passes), ADR-0005 (transpile is mechanical, not a second authoring layer).

---

## P-003 — Reuse existing structure

**Rule**: When introducing a new capability, prefer producing values in shapes the rest of the system already understands, so composition comes for free.

**Failure mode**: Inventing a new intermediate representation that needs its own consumers, its own serialization, and its own debugger.

**Prompt shape**: "Can I return a value in a shape the downstream already consumes? If I can't, is that because of an essential difference or because I haven't thought about composition yet?"

**Seen in**: ADR-0002 (enrich returns a tree-sitter grammar, not a sittir IR, so it composes with hand-authored rules in the same `grammar(...)` call).

---

## P-004 — Effects over sentinels

**Rule**: When a call needs to carry metadata out-of-band but must also return a value the external contract expects, record the metadata as a side-effect and return a neutral value. Sentinel returns fight the contract.

**Failure mode**: A "clever" sentinel return value that works in the controlled environment and crashes or silently corrupts the external consumer.

**Prompt shape**: "Does this call live in a position where someone else decides what the return value must look like? If yes, the metadata needs a side channel — don't overload the return."

**Seen in**: ADR-0003 (role() pushes into an accumulator and returns blank()).

---

## P-005 — Single source of truth

**Rule**: A piece of information lives in exactly one place. If two files must agree, you have drift waiting to happen.

**Failure mode**: Sidecar config blocks that restate what's already declared in the main file, kept in sync by discipline until someone forgets.

**Prompt shape**: "Is this information already expressed somewhere else? If yes, can I read it from there instead of restating it? If I must restate, what enforces the agreement?"

**Seen in**: ADR-0001 (overrides.ts is the only grammar-extension file), ADR-0003 (role declarations live next to their symbols, not in a sidecar).

---

## P-006 — Consumer alignment

**Rule**: Design the call site for the consumer that reads it most. The producer pays the cost of translation so every reader doesn't.

**Failure mode**: An API that's convenient for the one function that writes it and awkward for the ten functions that read it.

**Prompt shape**: "Who reads this more: the author or the consumers? If consumers, what shape would they prefer? Is that shape expensive to produce? If not, produce it."

**Seen in**: ADR-0003 (both tools see return values they expect because role() adapts, not the consumers).

---

## P-007 — Cut speculative scope

**Rule**: Don't design for hypothetical future requirements. Three similar cases are better than a premature abstraction. If nobody has asked for the general version, don't build it.

**Failure mode**: A configuration system for a problem nobody has; an extension point nobody uses; abstraction layers that exist to support a second implementation that never arrives.

**Prompt shape**: "Is there a real second case that needs this generality right now, or am I imagining one? If imagined, cut it and revisit when the second case shows up."

**Seen in**: ADR-0002 (deferred heuristic inference system instead of designing configurable thresholds for passes nobody needs yet).

---

## P-008 — Composition over configuration

**Rule**: Prefer designs where adding behavior means calling a function, not setting a flag. Function calls compose; flags accumulate into combinatorial matrices.

**Failure mode**: A `{ enableFoo: true, strictBar: false, compatMode: 'v2' }` options object that needs a truth table to reason about.

**Prompt shape**: "Am I reaching for a flag to turn behavior on? Can I express the same intent as calling or not calling a function? If yes, do that."

**Seen in**: ADR-0002 (enrich is opt-in by wrapping, not by a flag), ADR-0004 (pre-evaluate phase runs based on whether transform calls exist, not a setting).

---

## How to use these in ADRs

In the "Principles Applied" section of a new ADR, cite the ID and one phrase:

```markdown
## Principles Applied

- **P-001 (External contract first)** — tree-sitter's schema is a hard boundary we conform to.
- **P-004 (Effects over sentinels)** — role() records as a side-effect and returns blank().
```

When adding a new principle, give it the next sequential ID, write it in the same shape (Rule / Failure mode / Prompt shape / Seen in), and backfill at least one existing ADR under "Seen in" — a principle with no real uses is speculative (P-007).
