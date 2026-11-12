# Usage: python3 run-parse-release.py <out-dir> <grammar,...> <name>=<tree>[@<storage>]...
# Runs parse-release.mjs for every grammar, version and release point in three
# rounds of fresh processes, the version and release-point orders rotating by
# round and reversing on odd rounds. A version given in object storage whose
# `<name>-arena` is not given is also run in arena storage. Writes
# parse-release.md: per grammar, the median over rounds of the batch's parse
# milliseconds, in the timed window and the window after a full GC, for each
# version and release point, each against the first version of its storage at
# the same release point, and the untimed release itself.
import json, os, statistics, subprocess, sys
from pathlib import Path

here = Path(__file__).resolve().parent
out = Path(sys.argv[1]).resolve()
grammars = sys.argv[2].split(',')
given = {}
for arg in sys.argv[3:]:
    name, spec = arg.split('=', 1)
    tree, _, storage = spec.partition('@')
    given[name] = (Path(tree).resolve(), storage or 'object')
versions = {}
for name, (tree, storage) in given.items():
    versions[name] = (tree, storage)
    if storage == 'object' and f'{name}-arena' not in given:
        versions[f'{name}-arena'] = (tree, 'arena')
names = list(versions)
variants = ['before', 'after', 'none']
(out / 'runs').mkdir(parents=True, exist_ok=True)
ROUNDS = 3


def rotated(items, index):
    k = index % len(items)
    order = items[k:] + items[:k]
    return order[::-1] if index % 2 else order


results = {}
for index in range(ROUNDS):
    for grammar in grammars:
        for name in rotated(names, index):
            for variant in rotated(variants, index):
                tree, storage = versions[name]
                label = f'{grammar}-{name}-{variant}-{index}'
                path = out / 'runs' / f'{label}.json'
                run = subprocess.run(['node', '--expose-gc', str(here / 'parse-release.mjs'), str(tree), grammar, storage, variant, str(path)],
                                     cwd=tree, env=dict(os.environ, NODE_ENV='production'), capture_output=True, text=True)
                print(label, run.returncode, run.stdout.strip(), flush=True)
                if run.returncode:
                    sys.stderr.write(run.stderr)
                    raise SystemExit(run.returncode)
                results.setdefault((grammar, name, variant), []).append(json.loads(path.read_text()))


def med(grammar, name, variant, window, key):
    return statistics.median(r[window][key] for r in results[(grammar, name, variant)])


firsts = {}
for name in names:
    firsts.setdefault(versions[name][1], name)
lines = [(out.parent / 'build-path.md').read_text().strip(), '']
for grammar in grammars:
    cpu = results[(grammar, names[0], variants[0])][0]['cpu']
    lines += [f'### {grammar} ({cpu})', '']
    for window, title in (('samples', 'parse ms'), ('samplesMatched', 'parse ms after a full GC')):
        lines += [f'{title}, each against the first version of its storage at the same release point', '', '| version | ' + ' | '.join(variants) + ' |', '|---|' + '---|' * len(variants)]
        for name in names:
            first = firsts[versions[name][1]]
            cells = [f'{med(grammar, name, v, window, "parseMs"):.3f} ×{med(grammar, name, v, window, "parseMs") / med(grammar, first, v, window, "parseMs"):.3f}' for v in variants]
            lines.append(f'| {name} | ' + ' | '.join(cells) + ' |')
        lines.append('')
    lines += ['untimed release ms (before: the batch it follows; after: the batch before)', '', '| version | before | after |', '|---|---|---|']
    for name in names:
        lines.append(f'| {name} | ' + ' | '.join(f'{med(grammar, name, v, "samples", "heldReleaseMs"):.3f}' for v in ('before', 'after')) + ' |')
    lines.append('')
(out / 'parse-release.md').write_text('\n'.join(lines) + '\n')
print('\n'.join(lines))
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
        summary.write('\n'.join(lines) + '\n')
