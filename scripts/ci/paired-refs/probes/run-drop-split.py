# Usage: python3 run-drop-split.py <out-dir> <grammar,...> <name>=<tree>[@<storage>]...
# Where an arena release's time and frees go, and what a timed parse
# allocates, from the probe build's split (a tree whose addon has no dropSplit
# is skipped). alloc-count.c is compiled and preloaded (LD_PRELOAD) so the
# split counts this thread's malloc-family calls; without a compiler the
# counts read zero and are named so. Each arena version runs drop-split.mjs
# with the build's unstripped addon (NAPI_RS_NATIVE_LIBRARY_PATH). Writes
# drop-split.md: per grammar, each release part's ms, allocations, frees and
# bytes freed per batch, its owner and its share of the native release, and
# the timed parse's allocations and frees.
import glob, json, os, shutil, subprocess, sys
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
    ('rows', 'node data', "NodeRows (its last Arc may be the arena's)"),
    ('arena', 'node data', 'TreeArena: the record chunks'),
    ('records', 'node data', 'the records map'),
    ('slotsItems', 'node data', 'the list slots and routed items maps'),
    ('placementShapes', 'node data', 'placement state: shapes'),
    ('placementHeapMaps', 'node data', 'placement state: sims, stretches, gaps'),
    ('placementBtrees', 'node data', 'placement state: the two ordered maps'),
    ('placementStateRest', 'node data', 'placement state: every other map'),
    ('placementPublished', 'node data', 'placement: published slots, tables and runs'),
    ('lines', 'node data', 'the line table'),
    ('depthMembers', 'node data', 'depth members'),
    ('tree', 'tree', 'tree_sitter::Tree (ts_tree_delete)'),
    ('rest', 'other', 'the rest of ParsedTree: source, options, store handle'),
    ('settle', 'node data', 'settle: built-arena counts the release freed'),
    ('releaseRoot', 'held table', 'release_root: the slot count'),
]


def build_counter():
    compiler = shutil.which('cc') or shutil.which('gcc')
    if not compiler:
        return None, 'no C compiler'
    so = out / 'alloc-count.so'
    done = subprocess.run([compiler, '-O2', '-shared', '-fPIC', '-o', str(so), str(here / 'alloc-count.c')], capture_output=True, text=True)
    return (so, f'{compiler} -O2') if done.returncode == 0 else (None, done.stderr.strip()[-400:])


COUNTER, built = build_counter()
print(f'allocation counter: {COUNTER or "not built"} ({built})', flush=True)


def env_for(tree, grammar):
    env = dict(os.environ, NODE_ENV='production')
    if COUNTER:
        env['LD_PRELOAD'] = str(COUNTER)
    addons = sorted(glob.glob(str(tree / 'node_modules/.cache/sittir/native-build' / grammar / '*.node')))
    if addons:
        env['NAPI_RS_NATIVE_LIBRARY_PATH'] = addons[0]
    return env, addons[0] if addons else None


def per(total, n):
    return total / n if n else 0


lines = [(out.parent / 'build-path.md').read_text().strip(), '', f'allocation counter: {"preloaded alloc-count.so" if COUNTER else "not built: " + built}', '']
for grammar in grammars:
    for name, (tree, storage) in versions.items():
        label = f'{grammar}-{name}'
        env, addon = env_for(tree, grammar)
        result = out / f'drop-split-{label}.json'
        argv = ['node', '--expose-gc', str(here / 'drop-split.mjs'), str(tree), grammar, storage, str(SECONDS), str(result)]
        done = subprocess.run(argv, cwd=tree, env=env, capture_output=True, text=True)
        if done.returncode and 'LD_PRELOAD' in env:
            sys.stderr.write(f'{label} under the counter: exit {done.returncode}\n' + done.stderr[-2000:])
            env.pop('LD_PRELOAD')
            done = subprocess.run(argv, cwd=tree, env=env, capture_output=True, text=True)
        print(label, done.returncode, done.stdout.strip()[-300:], flush=True)
        if done.returncode:
            sys.stderr.write(done.stderr[-4000:])
            lines += [f'### {grammar}, {name} ({storage})', '', f'failed: exit {done.returncode}', '']
            continue
        r = json.loads(result.read_text())
        if r.get('skipped'):
            continue
        rel = r['release']
        trees = rel['trees']['ms'] or 1
        native = rel['releaseParse']['ms'] or 1
        lines += [f'### {grammar}, {name} ({storage})', '', f'addon: {addon or "shipped (no unstripped copy found)"}; allocations counted: {r["counted"]}', '']
        lines += [f'cpu {r["cpu"]}, {r["batches"]} batches; per batch {r["parses"]:.0f} timed parses, {r["releases"]:.0f} releases, {trees:.0f} trees dropped; parse {r["parseMs"]:.3f} ms (median), native release {native:.3f} ms, JS release loop {r["releaseMs"]:.3f} ms (means)', '']
        lines += ['release, mean per batch', '', '| part | owner | ms | share | allocs | frees | KiB freed | frees per tree | ns per free | what |', '|---|---|---|---|---|---|---|---|---|---|']
        owners = {}
        for part, owner, what in PARTS:
            p = rel[part]
            owners.setdefault(owner, [0, 0])
            owners[owner][0] += p['ms']
            owners[owner][1] += p['frees']
            lines.append(f'| {part} | {owner} | {p["ms"]:.3f} | {100 * p["ms"] / native:.1f}% | {p["allocs"]:.0f} | {p["frees"]:.0f} | {p["freedBytes"] / 1024:.0f} | {per(p["frees"], trees):.1f} | {per(1e6 * p["ms"], p["frees"]):.0f} | {what} |')
        lines += ['', '| total | ms | share | frees | frees per tree |', '|---|---|---|---|---|']
        lines += [f'| {owner} | {ms:.3f} | {100 * ms / native:.1f}% | {frees:.0f} | {per(frees, trees):.1f} |' for owner, (ms, frees) in sorted(owners.items(), key=lambda item: -item[1][0])]
        whole = rel['releaseParse']
        lines += [f'| release_parse, whole | {whole["ms"]:.3f} | 100.0% | {whole["frees"]:.0f} | {per(whole["frees"], trees):.1f} |', '']
        w, n = r['parseWindow'], r['nativeParse']
        parses = r['parses'] or 1
        lines += ['timed parse, mean per batch', '', '| scope | ms | allocs | frees | KiB allocated | KiB freed | allocs per parse | frees per parse |', '|---|---|---|---|---|---|---|---|']
        lines.append(f'| the whole timed window (JS thread) | {r["parseMs"]:.3f} | {w["allocs"]:.0f} | {w["frees"]:.0f} | {w["allocBytes"] / 1024:.0f} | {w["freedBytes"] / 1024:.0f} | {per(w["allocs"], parses):.0f} | {per(w["frees"], parses):.0f} |')
        lines.append(f'| inside the native parse calls | {n["ms"]:.3f} | {n["allocs"]:.0f} | {n["frees"]:.0f} | {n["allocBytes"] / 1024:.0f} | {n["freedBytes"] / 1024:.0f} | {per(n["allocs"], parses):.0f} | {per(n["frees"], parses):.0f} |')
        lines.append('')
(out / 'drop-split.md').write_text('\n'.join(lines) + '\n')
print('\n'.join(lines))
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
        summary.write('\n'.join(lines) + '\n')
