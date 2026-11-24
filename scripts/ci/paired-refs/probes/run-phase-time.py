# Usage: PHASE=<parse|render|edit|built|worker> python3 run-phase-time.py <out-dir> <grammar,...> <name>=<tree>[@<storage>]...
# One phase's milliseconds per tree, with no profiler attached, so each tree's
# addon is the build a paired run measures (no frame pointers, its own build
# store entry). For each grammar, ROUNDS rounds; each round runs every tree's
# phase-profile.mjs driver once, in a fresh process and an order that rotates
# by round, and keeps the process's median batch time. Writes
# <phase>-time.md: per tree the median of its process medians, and each tree
# against the first by the median of the per-round ratios with every round's
# ratio. A tree is measured once, under the first name given for it, in
# STORAGE (default arena).
import json, os, statistics, subprocess, sys
from pathlib import Path

here = Path(__file__).resolve().parent
out = Path(sys.argv[1]).resolve()
grammars = sys.argv[2].split(',')
trees = {}
for arg in sys.argv[3:]:
    name, spec = arg.split('=', 1)
    tree = Path(spec.split('@', 1)[0]).resolve()
    if tree not in trees.values():
        trees[name] = tree
names = list(trees)
out.mkdir(parents=True, exist_ok=True)
PHASE = os.environ.get('PHASE') or 'render'
STORAGE = os.environ.get('STORAGE') or 'arena'
ROUNDS = 7
WARMUP, BATCHES = {'worker': (1, 5), 'built': (50, 300)}.get(PHASE, (20, 200))
PER_ENGINE = int(os.environ.get('PER_ENGINE') or 0) or WARMUP + BATCHES

lines = [f'{STORAGE.capitalize()} {PHASE} time with no profiler: {ROUNDS} rounds, each tree once a round in a fresh process, the order rotating by round; '
         f'a process runs {WARMUP} untimed batches then {BATCHES} timed, {"one engine for the whole run" if PER_ENGINE >= WARMUP + BATCHES else f"a fresh engine every {PER_ENGINE}"}, '
         'and gives its median batch time.', '']
for grammar in grammars:
    medians = {name: [] for name in names}
    facts = {}
    for round in range(ROUNDS):
        order = names[round % len(names):] + names[:round % len(names)]
        for name in order:
            receipt = out / f'{grammar}-{name}-{round}.json'
            argv = ['node', str(here / 'phase-profile.mjs'), str(trees[name]), grammar, PHASE, str(receipt), str(WARMUP), str(BATCHES), str(PER_ENGINE)]
            done = subprocess.run(argv, cwd=trees[name], env=dict(os.environ, NODE_ENV='production', STORAGE=STORAGE), capture_output=True, text=True)
            print(f'{grammar}-{name}-{round}', done.returncode, done.stdout.strip()[-300:], flush=True)
            if done.returncode:
                sys.stderr.write(done.stderr[-6000:])
                raise SystemExit(done.returncode)
            receipt_facts = json.loads(receipt.read_text())
            medians[name].append(receipt_facts['phaseMsMedian'])
            facts[name] = receipt_facts
    first = names[0]
    lines += [f'### {grammar} ({facts[first]["cpu"]}, {facts[first]["entries"]} roots per batch)', '',
              f'| tree | {PHASE} ms per batch, median of process medians | × {first}, median of round ratios | round ratios | {PHASE} text |', '|---|---|---|---|---|']
    for name in names:
        ratios = [b / a for a, b in zip(medians[first], medians[name])]
        lines.append(f'| {name} | {statistics.median(medians[name]):.3f} | ×{statistics.median(ratios):.3f} | {", ".join(f"{r:.3f}" for r in ratios)} | '
                     f'{"same as " + first if facts[name]["texts"] == facts[first]["texts"] else "differs from " + first} |')
    lines.append('')
markdown = '\n'.join(lines) + '\n'
(out / f'{PHASE}-time.md').write_text(markdown)
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
        summary.write(markdown)
print(markdown, flush=True)
