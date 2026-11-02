# Usage: python3 run-parse-profile.py <out-dir> <grammar,...> <name>=<tree>[@<storage>]...
# Runs parse-profile.mjs for every grammar and version in three rounds of
# fresh processes, the version order rotating by round and reversing on odd
# rounds. Writes each run's CPU profile under prof/ and parse-profile.md: per
# grammar and version, the median over rounds of the batch's parse, render and
# pipeline milliseconds, and each against the first version's.
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
(out / 'prof').mkdir(parents=True, exist_ok=True)
ROUNDS = 3
BATCHES = 2000


def orderOf(index):
    k = index % len(names)
    order = names[k:] + names[:k]
    return order[::-1] if index % 2 else order


results = {}
for index in range(ROUNDS):
    for grammar in grammars:
        for name in orderOf(index):
            tree, storage = versions[name]
            label = f'{grammar}-{name}-{index}'
            prefix = out / 'prof' / label
            run = subprocess.run(['node', '--expose-gc', str(here / 'parse-profile.mjs'), str(tree), grammar, storage, str(prefix), str(BATCHES)],
                                 cwd=tree, env=dict(os.environ, NODE_ENV='production'), capture_output=True, text=True)
            print(label, run.returncode, run.stdout.strip(), flush=True)
            if run.returncode:
                sys.stderr.write(run.stderr)
                raise SystemExit(run.returncode)
            results.setdefault((grammar, name), []).append(json.loads(Path(f'{prefix}.json').read_text()))
lines = []
for grammar in grammars:
    cpu = results[(grammar, names[0])][0]['cpu']
    lines += [f'### {grammar} ({cpu})', '', '| version | parse | render | pipeline |', '|---|---|---|---|']
    first = {k: statistics.median(r[k] for r in results[(grammar, names[0])]) for k in ('parseMs', 'renderMs', 'pipelineMs')}
    for name in names:
        meds = {k: statistics.median(r[k] for r in results[(grammar, name)]) for k in ('parseMs', 'renderMs', 'pipelineMs')}
        lines.append(f'| {name} | ' + ' | '.join(f'{meds[k]:.3f} ×{meds[k] / first[k]:.3f}' for k in ('parseMs', 'renderMs', 'pipelineMs')) + ' |')
    lines.append('')
(out / 'parse-profile.md').write_text('\n'.join(lines) + '\n')
print('\n'.join(lines))
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
        summary.write('\n'.join(lines) + '\n')
