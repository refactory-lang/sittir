# Usage: python3 run-probe.py <out-dir> <grammar,...> <name>=<tree>[@<storage>] <name>=<tree>[@<storage>]...
# Runs native-calls.mjs for every grammar and version in three rounds of fresh
# processes, the version order rotating by round and reversing on odd rounds.
# Then writes probe.md: per grammar, the median over rounds of each version's
# microseconds per tree for every phase, native call and garbage-collection
# kind, beside the first version's.
import json, os, statistics, subprocess, sys
from pathlib import Path

here = Path(__file__).resolve().parent
out = Path(sys.argv[1]).resolve()
grammars = sys.argv[2].split(',')
versions = {}
for arg in sys.argv[3:]:
    name, spec = arg.split('=', 1)
    tree, _, storage = spec.partition('@')
    versions[name] = (Path(tree).resolve(), storage or 'object')
names = list(versions)
out.mkdir(parents=True, exist_ok=True)
ROUNDS = 3


def orderOf(index):
    k = index % len(names)
    order = names[k:] + names[:k]
    return order[::-1] if index % 2 else order


for index in range(ROUNDS):
    for grammar in grammars:
        for name in orderOf(index):
            tree, storage = versions[name]
            label = f'{grammar}-{name}-{index}'
            run = subprocess.run(['node', '--expose-gc', str(here / 'native-calls.mjs'), str(tree), grammar, storage, str(out / f'{label}.json')],
                                 cwd=tree, env=dict(os.environ, NODE_ENV='production'), capture_output=True, text=True)
            print(label, run.returncode, run.stdout.strip(), flush=True)
            if run.returncode:
                sys.stderr.write(run.stderr)
                raise SystemExit(run.returncode)

lines = []
first = names[0]
for grammar in grammars:
    results = {n: [json.loads((out / f'{grammar}-{n}-{i}.json').read_text()) for i in range(ROUNDS)] for n in names}
    lines += [f'### {grammar} ({results[first][0]["cpu"]}, {results[first][0]["trees"]} trees per process)', '',
              '| µs per tree | ' + ' | '.join(names) + ' | ' + ' | '.join(f'{n} − {first}' for n in names[1:]) + ' |',
              '|---|' + '---|' * (2 * len(names) - 1)]

    def row(label, value):
        meds = {n: statistics.median(value(r) for r in results[n]) for n in names}
        lines.append(f'| {label} | ' + ' | '.join(f'{meds[n]:.2f}' for n in names) + ' | ' + ' | '.join(f'{meds[n] - meds[first]:+.2f}' for n in names[1:]) + ' |')

    for phase in ['parse', 'render', 'edit']:
        row(f'**{phase}**', lambda r, phase=phase: r['usPerTree'][phase])
    for call in sorted({c for n in names for r in results[n] for c in r['calls']}):
        row(f'call {call} (calls/tree {max(statistics.median(r["calls"].get(call, {"perTree": 0})["perTree"] for r in results[n]) for n in names):.2f})',
            lambda r, call=call: r['calls'].get(call, {'usPerTree': 0})['usPerTree'])
    for kind in sorted({k for n in names for r in results[n] for k in r['gc']}):
        row(f'gc {kind} (per batch {max(statistics.median(r["gc"].get(kind, {"perBatch": 0})["perBatch"] for r in results[n]) for n in names):.2f})',
            lambda r, kind=kind: r['gc'].get(kind, {'usPerTree': 0})['usPerTree'])
    lines.append('')
markdown = '\n'.join(lines) + '\n'
(out / 'probe.md').write_text(markdown)
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as f:
        f.write(markdown)
sys.stdout.write(markdown)
