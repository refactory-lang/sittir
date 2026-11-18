# One read rule per fact for both storages

**Status:** accepted by the maintainer as an enhancement, 2026-11-18 ("Accepted - but should we draft the spec and leave it as an enhancement?"). Not scheduled. It blocks nothing and nothing waits on it.

## Why

Object storage and arena storage read the same parse and must give the same tree. The maintainer's rule for the read (2026-11-17): "they should share the logic - it should simply be a matter of which storage is being used", with object storage as the reference ("object storage for the most part is the 'mature' reader").

An audit of every fact the read derives, on the validation corpus of all five grammars (440 sources, 15,024 nodes), found the two storages equal everywhere it measured: 0 root snapshots differ, 0 untouched node renders differ, 0 of 13,880 layout runs are apart. Most facts are equal because one function decides them. Five are equal because two functions restate the same rule. Those five are this spec.

Two copies that agree today are held equal by nothing. This spec makes each one a single implementation.

## The five facts

| # | Fact | Object storage | Arena storage | What differs |
|---|---|---|---|---|
| 1 | Slot accumulation: one child or too many, a missing child, a list, a non-empty list, elided holes, and the blank arm of an optional slot | `ReadSlot::take`, `separator`, `finish` (`read.rs`); `T::blank()` | `HydrateSlot::take_held`, `separator_held`, `finish_held` (`arena/hydrate.rs`); `T::STORED & stored::BLANK` | two mirrored implementations; only `Elided::positions` is shared |
| 2 | A text leaf's text | `text_body`: the span's text if the leaf's children tile the span, else the kind's fixed text | `Hydrated::Leaf { span }`: always the span | the rules differ when a leaf's children do not tile its span |
| 3 | The first child of an envelope over a hidden rule that is not an entry | `survey(..).find(!entry)` | its own loop over `Kid::at` | the same predicate, generated twice |
| 4 | Whether a list item follows a blank line | the list-item lookup at render (`list_slots::sets_apart`) | `Hydration::set_apart` at parse | the predicate is shared; each storage gathers the extras between two items its own way |
| 5 | Whether a node holds an error | `TreeNodes::holds_error`: `has_error() \|\| shown_as_error(display_id)` | `facts_of`: `has_error() \|\| is_missing() \|\| kid.error()` | the same test written twice; arena's extra `is_missing()` is expected to be redundant, not proven on the corpus |

## What each becomes

1. **Slot accumulation.** One accumulator, generic over what the storage keeps for a child (a read node for object storage, a hydrated cell for arena). It holds the one-child rule, the missing-child rule and the list rules once. The blank arm is one stamped fact per slot type: `T::blank()` and the stored blank bit are generated from the same stamp, so neither is derived from the other at run time. A storage supplies only how a collected value is stored.
2. **A text leaf's text.** First a probe: does any grammar have a text leaf whose children do not tile its span (an extra inside the leaf)? If none does, the generator refuses such a leaf and both storages take the span. If some does, arena applies the tiling test at parse, by the function object storage uses.
3. **The first non-entry child.** One generated helper, called by the object read and by the arena hydration.
4. **Blank line before a list item.** One gatherer of the extras between two items, used by both storages, under the predicate they already share.
5. **Holds an error.** One `holds_error(node)` that both storages call, after a probe shows the two expressions agree on every corpus node.

## Goals

- Each of the five facts has one implementation that both storages call.
- No read result changes in either storage.

## Non-goals

- Changing what a read returns, or any public surface.
- The facts the arena trees-from-records plan already unifies by deleting the object placer: a list passing its edge extra to its edge item, layout runs, and depth.
- The two known write-back differences between the storages (an ERROR's in-line whitespace, and a root's inner side), which are intentional: a written-back side takes its gaps from the render options.
- Layout diagnostics for an arena tree. That belongs to the read layout's first stage, whose gate depends on it.

## Gates

- The audit's comparison, rerun after each fact: snapshots 0 differing, untouched node renders 0 differing, layout runs 0 apart, and list rebuilds differing only where object storage is already known to throw on hidden-group items.
- `validate history`: 0 rows moved in either storage, all grammars.
- The full unit suite and the cargo workspace, both storages.
- No timing regression on the paired-refs CI run for parse in either storage; fact 1 is on the parse path of every slot.

## Order

Facts 3, 4 and 5 first: they are small and independent. Then fact 2's probe, which decides whether it is an assert or a rule. Fact 1 last and on its own: it is the largest, and it touches every generated slot.

## Read after the first audit

The audit's second pass read the six facts its first left unread. One is fact 5 above. The others are already one rule:

- **A text slot's value** (a token interior's `verbatim`): both storages branch on the one generated `__INTERIOR`; each writes its own form of the same text. Not checked: whether `read.rs`'s `text_slot!` implementations are reached at all.
- **An enum member's resolution** and **units and their rows:** shared generated functions.
- **A list slot's separator kind:** one function over two navigations, which the backer parity check holds equal; the read layout's first stage moves it to a stamp.
- **MISSING:** one source, `Nodes::missing`; object storage asks live, arena stamps the same call at parse.
- **An ERROR as a side entry:** two representations of one entry (arena names the ERROR's record, object storage its coordinate) that read back as the same node.
