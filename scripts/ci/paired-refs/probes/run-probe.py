# Usage: python3 run-probe.py <out-dir> <grammar,...> <name>=<tree>[@<storage>] <name>=<tree>[@<storage>]...
# Runs native-calls.mjs for every grammar and version, in each edit mode
# (joint: each member read just before its setter; split: every read, then
# every setter; noedit: no edits), in three rounds of fresh processes, the version order rotating
# by round and reversing on odd rounds. Then writes probe.md: per grammar, the
# median over rounds of each version's microseconds per tree for every phase
# (release: the edit results' explicit release),
# native call and garbage-collection kind, beside the first version's. Parse,
# render, edit and the garbage collections come from the joint runs; read and
# set from the split runs.
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
MODES = ['joint', 'split', 'noedit']


def orderOf(index):
    k = index % len(names)
    order = names[k:] + names[:k]
    return order[::-1] if index % 2 else order


for index in range(ROUNDS):
    for grammar in grammars:
        for name in orderOf(index):
          for mode in MODES:
            tree, storage = versions[name]
            label = f'{grammar}-{name}-{mode}-{index}'
            run = subprocess.run(['node', '--expose-gc', str(here / 'native-calls.mjs'), str(tree), grammar, storage, str(out / f'{label}.json'), mode],
                                 cwd=tree, env=dict(os.environ, NODE_ENV='production'), capture_output=True, text=True)
            print(label, run.returncode, run.stdout.strip(), flush=True)
            if run.returncode:
                sys.stderr.write(run.stderr)
                raise SystemExit(run.returncode)

lines = []
first = names[0]
for grammar in grammars:
    runs = {mode: {n: [json.loads((out / f'{grammar}-{n}-{mode}-{i}.json').read_text()) for i in range(ROUNDS)] for n in names} for mode in MODES}
    results = runs['joint']
    lines += [f'### {grammar} ({results[first][0]["cpu"]}, {results[first][0]["trees"]} trees per process)', '',
              '| µs per tree | ' + ' | '.join(names) + ' | ' + ' | '.join(f'{n} − {first}' for n in names[1:]) + ' |',
              '|---|' + '---|' * (2 * len(names) - 1)]

    def row(label, value, mode='joint'):
        meds = {n: statistics.median(value(r) for r in runs[mode][n]) for n in names}
        lines.append(f'| {label} | ' + ' | '.join(f'{meds[n]:.2f}' for n in names) + ' | ' + ' | '.join(f'{meds[n] - meds[first]:+.2f}' for n in names[1:]) + ' |')

    for phase, mode in [('parse', 'joint'), ('render', 'joint'), ('edit', 'joint'), ('release', 'joint'), ('read', 'split'), ('set', 'split')]:
        row(f'**{phase}**', lambda r, phase=phase: r['usPerTree'][phase], mode)
    for phase in ['parse', 'render']:
        row(f'**{phase} without edits**', lambda r, phase=phase: r['usPerTree'][phase], 'noedit')
    row('gc, all kinds, without edits', lambda r: sum(g['usPerTree'] for g in r['gc'].values()), 'noedit')
    for phase, mode in [('parse', 'joint'), ('render', 'joint'), ('edit', 'joint'), ('release', 'joint'), ('read', 'split'), ('set', 'split')]:
        for call in sorted({c for n in names for r in runs[mode][n] for c in r['calls'] if c.startswith(phase + ' ')}):
            row(f'call {call} (calls/tree {max(statistics.median(r["calls"].get(call, {"perTree": 0})["perTree"] for r in runs[mode][n]) for n in names):.2f})',
                lambda r, call=call: r['calls'].get(call, {'usPerTree': 0})['usPerTree'], mode)
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
