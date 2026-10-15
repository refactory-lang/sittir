# Design principles

DRY is the primary correctness principle: every program fact has one source and one derivation. The principles below describe how that constraint shapes the compiler, generated APIs, and runtime boundaries.

## P-005 — Single source of truth

Store a fact once and define its derivation once. A second walker collecting a partial projection, a parallel lookup table, or a consumer resolving the same identity again can drift even if each implementation looks locally reasonable.

Resolve the fact at its owner, carry it on the canonical representation, and expose projections from there. Generated output is a derivation, not another authoring surface.

## P-001 — External contract first

Tree-sitter, TypeScript, Rust, and N-API own contracts Sittir must satisfy. Establish their actual accepted shape at the boundary; an internal model is useful only if the external consumer can represent it correctly.

## P-002 — Mechanical versus heuristic

Automate deterministic structural facts. A frequency threshold, naming guess, or guess about grammar intent needs explicit authoring or a diagnostic rather than a silent rewrite. A heuristic that works on one grammar is not a grammar-independent contract.

## P-003 — Reuse existing structure

Prefer a shape the existing pipeline can consume. Introducing a separate representation also introduces readers, validators, serialization, and opportunities for disagreement; require a concrete need for that cost.

## P-004 — Effects over sentinels

When an external API owns a return shape, preserve that shape. If a DSL operation must also retain metadata, record it through the established metadata channel rather than returning a sentinel that the external tool cannot interpret.

## P-006 — Consumer alignment

Put translation at the boundary that owns it. A producer should not make every downstream consumer repeat name conversion, shape inference, or optionality handling.

## P-007 — Cut speculative scope

Implement demonstrated requirements. An extension point without a real consumer, or a restriction protecting a situation no grammar exercises, needs a stronger justification than hypothetical future convenience.

## P-008 — Composition over configuration

Prefer composable existing operations over flags that create another behavior matrix. Keep unavoidable configuration typed by the grammar and derive its consequences in one place.

## Applying the principles

State the concrete invariant a change preserves, the boundary that owns its facts, and the evidence used to verify it. A design label or historical decision number is not a substitute for that explanation.
