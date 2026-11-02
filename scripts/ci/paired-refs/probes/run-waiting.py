# Usage: python3 run-waiting.py <out-dir> <grammar,...> <name>=<tree>[@<storage>]...
# Runs waiting-trees.mjs for every grammar and version, holding 0 to 16,000
# live trees of the grammar itself and of python (another addon, so another
# live-tree table), in two rounds of fresh processes, the version order
# reversing on the second. Writes waiting.md: per grammar, version and held
# grammar, the median over rounds of the batch's pipeline, parse and render
# milliseconds at each held count, and the ratio to holding none.
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
HELD = [0, 2000, 4000, 8000, 16000]
ROUNDS = 2
results = {}
for index in range(ROUNDS):
    for grammar in grammars:
        for hold in dict.fromkeys([grammar, 'python']):
            for name in (names if index % 2 == 0 else names[::-1]):
                for held in HELD:
                    tree, storage = versions[name]
                    label = f'{grammar}-{hold}-{name}-{held}-{index}'
                    run = subprocess.run(['node', '--expose-gc', str(here / 'waiting-trees.mjs'), str(tree), grammar, storage, str(out / f'{label}.json'), hold, str(held)],
                                         cwd=tree, env=dict(os.environ, NODE_ENV='production'), capture_output=True, text=True)
                    print(label, run.returncode, run.stdout.strip(), flush=True)
                    if run.returncode:
                        sys.stderr.write(run.stderr)
                        raise SystemExit(run.returncode)
                    results.setdefault((grammar, hold, name, held), []).append(json.loads((out / f'{label}.json').read_text()))
lines = []
for grammar in grammars:
    cpu = next(iter(results.values()))[0]['cpu']
    lines += [f'### {grammar} ({cpu})', '', '| held grammar | version | ' + ' | '.join(f'{h:,} held' for h in HELD) + ' |', '|---|---|' + '---|' * len(HELD)]
    for hold in dict.fromkeys([grammar, 'python']):
        for name in names:
            meds = [statistics.median(r['pipelineMs'] for r in results[(grammar, hold, name, h)]) for h in HELD]
            lines.append(f'| {hold} | {name} | ' + ' | '.join(f'{m:.3f} ×{m / meds[0]:.3f}' for m in meds) + ' |')
    lines.append('')
(out / 'waiting.md').write_text('\n'.join(lines) + '\n')
print('\n'.join(lines))
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
        summary.write('\n'.join(lines) + '\n')
