# Size census

The sizes of every transport type of each grammar, for the typed reader's stack gate. As first merged (`ea0e95e07`), the typed read's root costs 375 KiB of stack in the dev profile against today's read's 39 KiB on macOS arm64 (391 against 63 KiB on linux x86_64).

A choice is as large as its largest payload, and in the dev profile every frame that holds a choice by value pays that size once per temporary. Boxing two dominant kinds was the first route considered. This census shows it cannot shrink the choices, since too many payload types are large. Every payload over a byte ceiling is boxed instead, by a pinned list the build checks both ways. The ceiling is the largest of 512, 256 and 128 bytes at which, in both profiles, the typed read needs no more stack than today's at 200 nested levels and per level.

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

## Ceiling rounds

Each round set the ceiling, took the pins from `--pins <ceiling>`, and settled them until `cargo check` passed and the census matched the file. Least stack on macOS arm64 from `typed_read_nesting.rs` (KiB unless marked; typed / today):

| ceiling | pins rust / ts / python / scm / regex | largest choice | root, dev | 200 levels, dev | per level, dev | root, release | 200 levels, release | per level, release | deepest corpus entry, dev / release |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| none | 0 | 9 432 B | 375 / 39 | | | | | | |
| 512 | 77 / 113 / 56 / 5 / 13 | 520 B | 199 / 39 | 1 206 / 1 206 | 5 216 / 6 035 B | 55 / 23 | 327 / 343 | 1 434 / 1 741 B | 295 / 103, 55 / 23 |
| 256 | 145 / 167 / 101 / 12 / 22 | 264 B | 167 / 39 | 1 190 / 1 206 | 5 216 / 6 035 B | 39 / 23 | 311 / 343 | 1 434 / 1 741 B | 199 / 103, 39 / 23 |
| 128 | 241 / 233 / 176 / 26 / 44 | 32 B | 151 / 39 | 1 062 / 1 206 | 4 602 / 6 035 B | 39 / 23 | 263 / 343 | 1 126 / 1 741 B | 183 / 103, 39 / 23 |

256 bytes is the largest ceiling that passes strictly (512 ties at 200 levels in dev). Shrinking the largest choice 290-fold moved the dev root only from 375 to 151 KiB, so choice payloads are not what the dev root pays for. The largest read frames are the struct readers' (see the frame ranking below).

## Frame ranking

`frame-sizes.py` ranks a Mach-O arm64 binary's functions by stack frame, summing each prologue's stack adjustments (a pre-indexed `stp`, `sub sp, sp, #imm`, and the size `__chkstk_darwin` takes in x9).

```bash
python3 docs/superpowers/probes/2026-10-01-shared-arena/stack/frame-sizes.py target/debug/deps/typed_read_nesting-<hash> [--top N] [--grep SUBSTRING ...]
```

In the dev test binary at 128 bytes, the largest read frames are struct readers: `FunctionItemTransport::read` 18 336 B, and the trait, type, function-signature, struct, enum and union item readers at 13 to 15 KiB. Next come `read_value::<T>` instances, up to 9 264 B (`AttributedFieldDeclarationTransport`), with 5 872 B for `BlockTransport`. No choice reader is among them.

## Deepest corpus entry

`corpus-depth.ts` ranks a grammar's corpus entries by parse-tree depth and, with `--write`, saves the deepest entry's source as `inputs/<grammar>-deepest.txt`, which `typed_read_nesting.rs` reads and reports beside the synthetic nesting.

```bash
pnpm exec tsx docs/superpowers/probes/2026-10-01-shared-arena/stack/corpus-depth.ts [grammar] [top] [--write]
```

The deepest rust entry is "Enums", depth 19 and 219 bytes. It is too shallow to repay the typed read's fixed root cost, so its least stack is above today's at every ceiling; it is reported, not gated.
