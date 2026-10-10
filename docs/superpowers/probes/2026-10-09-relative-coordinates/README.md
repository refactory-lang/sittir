# Relative coordinates: probes

Run every script from a checkout root.

## The list census

Whether a list slot's storage ever leaves its key absent, before an empty list becomes `[]` in the transport (`Vec`, or `NonEmptyVec` for a `repeat1` list), the types and the codec.

- `list-census.py <python|rust|typescript>`: the list storage keys a grammar's types mark optional (`readonly _x?: readonly …[]` or `NonEmptyArray`), and how the grammar's `test-fixtures.json` holds them.
- `list-census-corpus.mts`: the same keys on every node a full-depth read of every corpus entry returns.
- `list-required-agree.py <python|rust|typescript>`: whether a transport's required list (a non-`Option` `Vec`, whose read refuses an empty list) is exactly a list the types mark `NonEmptyArray`.

Measured before the change (optional lists were `Option<Vec<…>>` and `_x?:`):

| grammar | optional list keys | fixtures: items / empty / absent | corpus reads: entries, items / empty / absent | transport lists / types lists | required (transport / types) | disagree |
| --- | --- | --- | --- | --- | --- | --- |
| python | 8 | 791 / 18 / 0 | 116 entries, 436 / 15 / 0 | 42 / 42 | 34 / 34 | none |
| rust | 31 | 803 / 996 / 0 | 148 entries, 338 / 329 / 0 | 51 / 51 | 20 / 20 | none |
| typescript | 23 | 818 / 978 / 0 | 115 entries, 281 / 239 / 0 | 37 / 37 | 14 / 14 | none |

No fixture and no read leaves a list key absent, and the two derivations of "this list holds at least one item" agree on every list. One producer did leave keys absent: the dummy stubs the generated `nodes.test.ts` builds (`test.ts::buildDummyStub`) filled required slots only, so an optional list was missing, and every list was missing below the stub depth limit. The stubs now give every list they do not populate `[]`.

`hydrateSlotsWith`'s callers: the wraps call it for a slot whose storage holds nodes (`storesNodes`) and is many; a slot whose storage collapses its multiplicity (`collapsesMultiplicity`) is a `boolean` or `bitflag` slot, which holds no node and is read as stored. Every call names a list storage key, so its `stored == null` arm went, and with it `NO_CHILDREN`; the same arm went from the builders' `hydrateStoredSlots`.
