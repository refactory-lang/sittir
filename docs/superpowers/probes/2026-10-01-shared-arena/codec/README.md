# Codec census

What the hand-printed napi decoders of each grammar's `transport.rs` accept, compared with the read facts the same declarations state. The transport derive's codec replaces those decoders and decodes from the declarations alone, so every place the two disagree is a decision: an id a variant claims beyond its decoder, an id an envelope decodes beyond its claims, and the decode trials.

Measured at master `40b211bce` (2026-10-06), and again at `992c9b4c6` with the same output: no generated file changed between them.

## Tool

`codec-census.py` reads `rust/crates/sittir-<grammar>/src/render/transport.rs` and `kind_ids.rs` for the five grammars. For each derived enum (choices and enum kinds), it compares each variant's decode ids with the ids its `#[kind(…)]` claims. The decode ids are the kind ids its `FromNapiValue` arms send to that variant. The claims are its kinds, `display(…)` and `folded(…)` ids, and id 0 for a blank arm.

It also lists:

- the decode arms that try several variants in turn (decode trials);
- the leaf structs whose decoder's text for a bare kind id differs from their `text = "…"`;
- the decoders of enums the derive does not cover (`TriviaTransport`).

It needs the hand-printed decoders, so it runs only on a commit before the derive's codec replaced them.

```bash
python3 docs/superpowers/probes/2026-10-01-shared-arena/codec/codec-census.py [repo-root]
```

It exits 1 when any compared fact differs, which it does at the commits above: the differences are the finding.

## Results

| grammar | derived enums | claiming variants | agree | differ | decode trials | enums decoding verbatim | text leaves agreeing |
| --- | --- | --- | --- | --- | --- | --- | --- |
| rust | 250 | 1 971 | 1 969 | 2 | 25 | 32 | 15 / 15 |
| typescript | 301 | 2 152 | 2 144 | 8 | 21 | 40 | 11 / 11 |
| python | 167 | 1 179 | 1 176 | 3 | 9 | 28 | 14 / 14 |
| scm | 41 | 130 | 130 | 0 | 4 | 5 | 3 / 3 |
| regex | 49 | 170 | 167 | 3 | 0 | 6 | 16 / 16 |

**15 variants claim one id their decoder does not accept.** In each case the claimed id is an alternate that today's wrap folds before the wire. The reader reads it as the parser gives it, and the derive's codec decodes it too, so one id list per variant serves both directions:

- rust: `StructPatternElementsItemTransportSlot::RemainingFieldPattern` and `RangePatternWithLeftContentTransportSlot::RangePatternWithLeftBare`, id 100;
- typescript:
  - the two `For…TransportSlot::EmptyStatement`, id 20;
  - `MemberExpressionSeparatorTransportSlot::OptionalChain`, id 64;
  - four `…::Import` variants, id 9;
- python:
  - `ImportFromStatementContentTransportSlot::WildcardImport`, id 8;
  - `SimplePatternContentTransportSlot::WildcardPattern`, id 48;
  - `StringContentContentTransportSlot::NotEscapeSequence`, id 65;
- regex:
  - `AnyTransport::IdentityEscape` and `CharacterClassClassAtomsTransportSlot::IdentityEscape`, id 19;
  - `TermGroupContentTransportSlot::StartAssertion`, id 3.

**One variant decodes 22 ids it does not claim.** typescript's `MemberExpressionPropertyTransportSlot::PropertyIdentifier` takes ids 7 and 30–50: keywords aliased to `property_identifier` cross with their grammar ids, while the reader admits them by display. The derive's codec decodes them through the ids the variant states in `decodes(…)`, which the reader ignores.

**59 decode trials** (rust 25, typescript 21, python 9, scm 4). A trial arm takes a polymorph's own id, or a reserved supertype's, and tries its forms in turn. For example, rust's `StatementTransport` id 177 tries 22 variants. No generated factory and no read stamps those ids, so the derive's codec refuses them, naming the type and the id. The command prints each arm with the variants it tries.

**`TriviaTransport`**, not derived at these commits. Each grammar's decoder takes its comment kinds by id, verbatim text from a string or an `ERROR` object, and `$text` objects for the extras that are compounds: rust ids 337 and 340, typescript 152 and 153, python 73, scm 11, and none in regex.
