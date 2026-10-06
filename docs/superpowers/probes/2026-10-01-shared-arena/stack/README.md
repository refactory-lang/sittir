# Size census

The sizes of every transport type of each grammar, for the typed reader's stack gate. As first merged (`ea0e95e07`), the typed read's root costs 375 KiB of stack in the dev profile against today's read's 39 KiB on macOS arm64 (391 against 63 KiB on linux x86_64).

A choice is as large as its largest payload, and in the dev profile every frame that holds a choice by value pays that size once per temporary. Boxing two dominant kinds was the first route considered. This census shows it cannot shrink the choices, since too many payload types are large. Every payload over a byte ceiling is boxed instead, by a pinned list the build checks both ways, with the ceiling lowered only while the dev-profile root cost exceeds today's.

Measured at master `40b211bce` (2026-10-06) and re-run at `992c9b4c6` with the same output, before any payload was boxed.

## Tool

`size-census.py` writes a temporary integration test into each grammar crate (`rust/crates/sittir-<grammar>/tests/zz_size_census.rs`). The test prints `size_of` for every struct and enum the grammar's `transport.rs` declares. The script runs it with `--no-default-features` and deletes it.

It reads each choice the reader reads (`#[transport(choice)]`, not `codec_only`) for its variants' payloads. A payload written `Box<T>` counts as boxed.

```bash
python3 docs/superpowers/probes/2026-10-01-shared-arena/stack/size-census.py [--pins N] [grammar ...]
```

With `--pins N`, it prints per grammar every payload type over N bytes, boxed or not, as a TypeScript array: the list a pin at ceiling N holds once settled. A pin list starts from it, and a re-run confirms the settled list. When `packages/codegen/src/emitters/boxed-payloads.ts` exists, the census also says whether the grammar's list there is that list.

## Results

| grammar | types | choices | largest choices (bytes) | unboxed payload types over 1 024 / 512 / 256 / 128 B |
| --- | --- | --- | --- | --- |
| rust | 493 | 245 | `StatementTransport` 4 256, `DeclarationStatementTransport` 4 248, `AnyTransport` 4 248 | 48 / 90 / 161 / 258 |
| typescript | 536 | 299 | `StatementTransport` 9 432, `AnyTransport` 9 432, `ClassBodyMemberTransport` 8 576 | 90 / 128 / 177 / 244 |
| python | 345 | 167 | `SubscriptsSubscriptTransportSlot`, `StatementTransport` and `AnyTransport`, each 2 048 | 24 / 61 / 106 / 181 |
| scm | 69 | 39 | `AnyTransport` 944, `NamedNodeTransport` 776 | 0 / 6 / 14 / 27 |
| regex | 95 | 49 | `CharacterClassClassAtomsTransportSlot` 2 864, `AnyTransport` 2 864 | 4 / 16 / 23 / 44 |
