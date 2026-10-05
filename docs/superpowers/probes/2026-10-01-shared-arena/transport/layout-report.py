"""Report layout-rounds.sh output, per grammar and checkout tag, medians over rounds:

- measure-rebuilt.mts's two stages, JS projection + native call per slot value, with the
  population each checkout measured (a checkout older than the layout wire has its own fixtures);
- measure-layout.mts's stages (ns per slot value) and what decoding an empty layout costs per
  node (`emptyLayout` against the stripped passes timed in alternation with it);
- for each tag but `base`, the per-round paired difference from `base` in the native call: over
  the fixtures' own wire, over the stripped inputs (no layout), and the cost per layout-bearing
  node that the two leave, ((own - stripped) * slot values / layout-bearing nodes).

usage: python3 layout-report.py <out-dir>
"""
import json
import re
import statistics
import sys
from pathlib import Path

out = Path(sys.argv[1])
NAME = re.compile(r"(layout|rebuilt)-(\d+)-(\w+)-(\w+)\.(json|txt)")
REBUILT = {
    "rebuiltProject": re.compile(r"JS projection .*\((\d+) ns per slot value\)"),
    "rebuiltNative": re.compile(r"native render call: .*\((\d+) ns per slot value\)"),
}
POPULATION = re.compile(r"# \w+: (\d+) parity render fixtures, (\d+) slot values")
GRAMMARS = ["rust", "typescript", "python"]

runs = {}
for f in sorted(out.iterdir()):
    m = NAME.fullmatch(f.name)
    if not m:
        continue
    lines = f.read_text().strip().splitlines()
    if not lines:
        continue
    kind, key = m.group(1), (int(m.group(2)), m.group(3), m.group(4))
    rec = runs.setdefault(key, {"ns": {}})
    if kind == "layout":
        layout = json.loads(lines[-1])
        rec["ns"].update(layout.pop("ns"))
        rec.update(layout)
    else:
        text = "\n".join(lines)
        rec["ns"].update({k: float(m2.group(1)) for k, rx in REBUILT.items() if (m2 := rx.search(text))})
        if population := POPULATION.search(text):
            rec["rebuiltFixtures"], rec["rebuiltSlotValues"] = map(int, population.groups())


def fmt(xs):
    return f"{statistics.median(xs):+.0f} ({min(xs):+.0f}..{max(xs):+.0f})"


def tags_of(g):
    tags = {t for (_, gg, t) in runs if gg == g}
    return sorted(tags, key=lambda t: (t != "base", t))


for g in [g for g in GRAMMARS if any(gg == g for (_, gg, _) in runs)]:
    print(f"## {g}")
    for t in tags_of(g):
        recs = [rec for (_, gg, tt), rec in sorted(runs.items()) if gg == g and tt == t]
        stages = {k: statistics.median(rec["ns"][k] for rec in recs if k in rec["ns"]) for k in recs[0]["ns"]}
        first = recs[0]
        if "rebuiltNative" in stages:
            print(f"  {t:6s} {len(recs)} rounds, measure-rebuilt over {first.get('rebuiltFixtures')} fixtures / "
                  f"{first.get('rebuiltSlotValues')} slot values: JS projection + native call "
                  f"{stages['rebuiltProject']:.0f} + {stages['rebuiltNative']:.0f} ns per slot value")
        if "nativeOwn" in stages:
            checks = f"mismatches {max(rec['mismatches'] for rec in recs)}, stripped sha {'/'.join(sorted({rec['strippedSha'] for rec in recs}))}"
            print(f"  {t:6s} measure-layout over {first['fixtures']} fixtures, {first['slotValues']} slot values, "
                  f"{first['layoutNodes']} with layout ({checks}): "
                  + ", ".join(f"{k} {v:.0f}" for k, v in stages.items() if not k.startswith("rebuilt")))
        empty = [
            (rec["ns"]["nativeEmptyLayout"] - rec["ns"]["nativeStrippedPaired"]) * rec["strippedSlotValues"] / rec["objectNodes"]
            for rec in recs
            if "nativeEmptyLayout" in rec["ns"]
        ]
        if empty:
            print(f"         an empty layout on each of {first['objectNodes']} nodes: {fmt(empty)} ns per node to decode "
                  f"(renders differing from stripped: {max(rec['emptyLayoutDiffers'] for rec in recs)})")
    for t in tags_of(g)[1:]:
        own, absent, present = [], [], []
        for (r, gg, tt), h in sorted(runs.items()):
            b = runs.get((r, g, "base"))
            if gg != g or tt != t or b is None or "nativeOwn" not in h["ns"] or "nativeOwn" not in b["ns"]:
                continue
            d_own = h["ns"]["nativeOwn"] - b["ns"]["nativeOwn"]
            d_abs = h["ns"]["nativeStripped"] - b["ns"]["nativeStripped"]
            own.append(d_own)
            absent.append(d_abs)
            present.append((d_own - d_abs) * h["slotValues"] / h["layoutNodes"])
        if own:
            print(f"  {t} - base, native call, paired per round: own {fmt(own)} ns/slot value, "
                  f"stripped {fmt(absent)} ns/slot value, per layout-bearing node {fmt(present)} ns")
