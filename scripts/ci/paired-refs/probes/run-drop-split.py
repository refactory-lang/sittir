# Usage: python3 run-drop-split.py <out-dir> <grammar,...> <name>=<tree>[@<storage>]...
# Where an arena release's time goes, timed in place by the probe build's
# drop split (a tree whose addon has no dropSplit is skipped). Each arena
# version runs drop-split.mjs (every batch released, its split read, then a
# full GC and finalizer drain) with the build's unstripped addon
# (NAPI_RS_NATIVE_LIBRARY_PATH). Writes drop-split.md: per grammar, each
# part's mean and median ms per batch, its owner, and its share of the
# native release.
import glob, json, os, subprocess, sys
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
    if storage == 'arena':
        versions[name] = (tree, storage)
    elif f'{name}-arena' not in given:
        versions[f'{name}-arena'] = (tree, 'arena')
out.mkdir(parents=True, exist_ok=True)
SECONDS = 20
PARTS = [
    ('detach', 'node data', 'Buffers::detach: the typed arrays over the tree arena chunks'),
    ('sides', 'node data', 'release_sides: the sides writes set'),
    ('rows', 'node data', 'NodeRows (its last Arc may be the arena\'s)'),
    ('arena', 'node data', 'TreeArena: the record chunks'),
    ('records', 'node data', 'the records map'),
    ('slotsItems', 'node data', 'the list slots and routed items maps'),
    ('placement', 'node data', 'trivia placement, depth members, line table'),
    ('tree', 'tree', 'tree_sitter::Tree (ts_tree_delete)'),
    ('rest', 'other', 'the rest of ParsedTree: source, options, store handle'),
    ('settle', 'node data', 'settle: built-arena counts the release freed'),
    ('releaseRoot', 'held table', 'release_root: the slot count'),
]


def env_for(tree, grammar):
    env = dict(os.environ, NODE_ENV='production')
    addons = sorted(glob.glob(str(tree / 'node_modules/.cache/sittir/native-build' / grammar / '*.node')))
    if addons:
        env['NAPI_RS_NATIVE_LIBRARY_PATH'] = addons[0]
    return env, addons[0] if addons else None


lines = [(out.parent / 'build-path.md').read_text().strip(), '']
for grammar in grammars:
    for name, (tree, storage) in versions.items():
        label = f'{grammar}-{name}'
        env, addon = env_for(tree, grammar)
        result = out / f'drop-split-{label}.json'
        done = subprocess.run(['node', '--expose-gc', str(here / 'drop-split.mjs'), str(tree), grammar, storage, str(SECONDS), str(result)], cwd=tree, env=env, capture_output=True, text=True)
        print(label, done.returncode, done.stdout.strip()[-300:], flush=True)
        if done.returncode:
            sys.stderr.write(done.stderr[-4000:])
            lines += [f'### {grammar}, {name} ({storage})', '', f'failed: exit {done.returncode}', '']
            continue
        r = json.loads(result.read_text())
        if r.get('skipped'):
            continue
        mean, median = r['mean'], r['median']
        parse = mean['releaseParse'] or 1
        trees = mean['trees'] or 1
        lines += [f'### {grammar}, {name} ({storage})', '', f'addon: {addon or "shipped (no unstripped copy found)"}', '']
        lines += [f'cpu {r["cpu"]}, {r["batches"]} batches; per batch {mean["released"]:.0f} releases, {mean["trees"]:.0f} trees dropped; parse {median["parseMs"]:.3f} ms (median)', '']
        lines += ['| part | owner | mean ms/batch | median ms/batch | share of release_parse | µs per tree | what |', '|---|---|---|---|---|---|---|']
        for part, owner, what in PARTS:
            lines.append(f'| {part} | {owner} | {mean[part]:.3f} | {median[part]:.3f} | {100 * mean[part] / parse:.1f}% | {1000 * mean[part] / trees:.1f} | {what} |')
        owners = {}
        for part, owner, _ in PARTS:
            owners[owner] = owners.get(owner, 0) + mean[part]
        timed = sum(owners.values())
        lines += ['', '| total | mean ms/batch | share of release_parse |', '|---|---|---|']
        lines += [f'| {owner} | {ms:.3f} | {100 * ms / parse:.1f}% |' for owner, ms in sorted(owners.items(), key=lambda item: -item[1])]
        lines += [
            f'| parts timed | {timed:.3f} | {100 * timed / parse:.1f}% |',
            f'| drop_live_tree, whole | {mean["dropLiveTree"]:.3f} | {100 * mean["dropLiveTree"] / parse:.1f}% |',
            f'| release_parse, whole (native) | {mean["releaseParse"]:.3f} | 100.0% |',
            f'| release_built, whole (native) | {mean["releaseBuilt"]:.3f} | |',
            f'| JS release loop (releaseMs) | {mean["releaseMs"]:.3f} | {100 * mean["releaseMs"] / parse:.1f}% |',
            '',
        ]
(out / 'drop-split.md').write_text('\n'.join(lines) + '\n')
print('\n'.join(lines))
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
        summary.write('\n'.join(lines) + '\n')
