# Usage: python3 summarize.py <out-dir> <earlier-summary.json> [<bar>]
# Reads <out-dir>/refs.json ({"base", "master", "feature", "profile"}), the
# workers' results under <out-dir>/runs and each tree's fingerprint
# (<out-dir>/before-<tree>.json). The versions are base, master and feature in
# object storage and feature-arena (the feature tree in arena storage). Every
# ratio is the median of the per-round ratios of process medians, with a
# seeded bootstrap 95% range of that median, beside the earlier summary's
# feature/master. Pipeline ratios against base above <bar> (default 1.10) are
# listed. Writes summary.json and summary.md into <out-dir>, appends the
# Markdown to $GITHUB_STEP_SUMMARY when it is set, and exits 1 when any
# version's renders or edits differ from base's.
import json, os, random, statistics, sys
from pathlib import Path

out = Path(sys.argv[1]).resolve()
runs = out / 'runs'
earlier = json.loads(Path(sys.argv[2]).read_text())
BAR = float(sys.argv[3]) if len(sys.argv) > 3 else 1.10
refs = json.loads((out / 'refs.json').read_text())
TREES = ['base', 'master', 'feature']
VERSIONS = ['base', 'master', 'feature', 'feature-arena']
TREE_OF = {'feature-arena': 'feature'}
PAIRS = [('feature', 'base'), ('feature-arena', 'base'), ('master', 'base'), ('feature', 'master'), ('feature-arena', 'master')]
AGAINST_BASE = [a for a, b in PAIRS if b == 'base' and a != 'master']
GRAMMARS = ['python', 'rust', 'typescript', 'regex', 'scm']
median = statistics.median
read = lambda name: json.loads((runs / name).read_text())


def interval(values, seed=20261029):
    rng = random.Random(seed)
    draws = sorted(median(rng.choices(values, k=len(values))) for _ in range(5000))
    return [draws[int(.025 * len(draws))], draws[int(.975 * len(draws))]]


def ratio(num, den):
    paired = [n / d for n, d in zip(num, den)]
    return {'ratio': median(paired), 'range95': interval(paired), 'paired': paired}


def pairs(med):
    return {f'{a}/{b}': {ph: ratio(med[a][ph], med[b][ph]) for ph in med[a]} for a, b in PAIRS}


receipts = read('receipts.json')
profiles = set()
mismatches = []
corpus = []
for g in GRAMMARS:
    results = {v: [read(f'corpus-{g}-{v}-{r}.json') for r in range(5)] for v in VERSIONS}
    signature = results['base'][0]['signature']
    mismatches += [f'corpus {g} {v} round {r}' for v, xs in results.items() for r, x in enumerate(xs) if x['signature'] != signature]
    profiles.update(x['buildProfile'] for xs in results.values() for x in xs)
    med = {v: {ph: [median(s[ph] for s in x['samples']) for x in results[v]] for ph in ['pipelineMs', 'parseMs', 'renderMs', 'editMs']} for v in VERSIONS}
    corpus.append({'grammar': g, 'signature': signature, 'ms': {v: {ph: median(xs) for ph, xs in med[v].items()} for v in VERSIONS}, 'pairs': pairs(med)})
construction = []
for n in [2000, 8000]:
    for reuse in [False, True]:
        data = {}
        for v in VERSIONS:
            data[v] = []
            for r in range(5):
                d = read(f'timing-rust-{v}-{r}.json')
                profiles.add(d['buildProfile'])
                data[v].append([s for s in d['samples'] if s['n'] == n and s['reuse'] == reuse])
        assert all(len(x) == 7 for xs in data.values() for x in xs)
        hashes = {v: {(s['renderSha256'], s['editedSha256']) for x in xs for s in x} for v, xs in data.items()}
        mismatches += [f'construction {n} {"reused" if reuse else "distinct"} {v}' for v in VERSIONS if hashes[v] != hashes['base'] or len(hashes[v]) != 1]
        med = {v: {ph: [median(s[ph] for s in x) for x in data[v]] for ph in ['pipelineMs', 'buildMs', 'renderMs', 'editMs']} for v in VERSIONS}
        construction.append({'functionRoots': n, 'reusedName': reuse, 'ms': {v: {ph: median(xs) for ph, xs in med[v].items()} for v in VERSIONS}, 'pairs': pairs(med)})
memory = {}
for v in VERSIONS:
    ds = [read(f'memory-rust-{v}-{r}.json') for r in range(3)]
    profiles.update(d['buildProfile'] for d in ds)
    memory[v] = {'medianDeltaHeapPlusExternalBytes': median(d['samples'][0]['delta']['heapUsed'] + d['samples'][0]['delta']['external'] for d in ds),
                 'medianDeltaBytes': {k: median(d['samples'][0]['delta'][k] for d in ds) for k in ['heapUsed', 'external', 'arrayBuffers', 'rss']},
                 'builtMemory': [d.get('builtMemory') for d in ds]}
trees = {t: json.loads((out / f'before-{t}.json').read_text()) for t in TREES}
for t in TREES:
    assert trees[t]['commit'] == refs[t], f'{t}: measured {trees[t]["commit"]}, expected {refs[t]}'
load = [r['load1'] for r in receipts]
machine, runner = trees['feature']['machine'], trees['feature']['runner']
over = [f"{row['grammar']} {a} ×{row['pairs'][f'{a}/base']['pipelineMs']['ratio']:.3f}" for row in corpus for a in AGAINST_BASE if row['pairs'][f'{a}/base']['pipelineMs']['ratio'] > BAR]
result = {'refs': refs, 'versions': {v: {'tree': TREE_OF.get(v, v), 'nodeStorage': 'arena' if v == 'feature-arena' else 'object'} for v in VERSIONS}, 'bar': BAR, 'overBar': over, 'mismatches': mismatches,
          'buildProfiles': sorted(profiles), 'processes': len(receipts), 'meanLoad1': statistics.mean(load), 'maxLoad1': max(load), 'machine': machine, 'runner': runner,
          'trees': {t: {'commit': x['commit'], 'workingTreeDiffSha256': x['workingTreeDiffSha256'], 'sections': {k: {'files': s['files'], 'sha256': s['sha256']} for k, s in x['sections'].items()}} for t, x in trees.items()},
          'corpus': corpus, 'construction': construction, 'memory': memory}
(out / 'summary.json').write_text(json.dumps(result, indent=2) + '\n')

old = {r['grammar']: r['timings'] for r in earlier['corpus']}
oldConstruction = {(r['functionRoots'], r['reusedName']): r['timings'] for r in earlier['construction']}
cell = lambda p, ph, row: f"{row['pairs'][p][ph]['ratio']:.3f} [{row['pairs'][p][ph]['range95'][0]:.3f}, {row['pairs'][p][ph]['range95'][1]:.3f}]"
ratios = lambda ph, row: ' | '.join(cell(f'{a}/{b}', ph, row) for a, b in PAIRS)
heads = ' | '.join(f'{a}/{b}' for a, b in PAIRS)
ms = lambda ph, row: ' | '.join(f"{row['ms'][v][ph]:.3f}" for v in VERSIONS)
msHeads = ' | '.join(f'ms {v}' for v in VERSIONS)
EMPTY_DIFF = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
lines = [
    '## Paired refs: feature (object and arena) and master against their merge base', '',
    f"Trees: base `{refs['base'][:9]}` (merge base), master `{refs['master'][:9]}`, feature `{refs['feature'][:9]}`; build profile {', '.join(sorted(profiles))}. feature-arena is the feature tree read with `nodeStorage: 'arena'`; the others use object storage.",
    f"Runner: {runner['os']} {runner['arch']} image {runner['image']} {runner['imageVersion']}, {machine['cpu']}, {machine['cores']} cores, {machine['memory'] / 2**30:.1f} GiB.",
    f"{len(receipts)} fresh processes, no idle gate; load1 mean {statistics.mean(load):.2f}, max {max(load):.2f}.", '',
    'Each ratio is the median over five rounds of the ratio of process medians, with a bootstrap 95% range. The 10-29 column is feature/master in object storage from docs/reviews/2026-10-29-paired-backends.md (a local macOS run against master 7471447a2).', '',
    f"Pipeline (parse + render) against base above ×{BAR:.2f}: {', '.join(over) if over else 'none'}.",
    f"Renders and edits that differ from base: {', '.join(mismatches) if mismatches else 'none'}.", '',
    '### Corpus', '',
    f'| grammar | phase | 10-29 f/m | {heads} | {msHeads} |',
    '|' + '---|' * (3 + len(PAIRS) + len(VERSIONS)),
]
for row in corpus:
    for ph in ['pipelineMs', 'parseMs', 'renderMs', 'editMs']:
        lines.append(f"| {row['grammar']} | {ph[:-2]} | {old[row['grammar']][ph]['featureOverMaster']:.3f} | {ratios(ph, row)} | {ms(ph, row)} |")
lines += ['', '### Rust construction (function items)', '',
          f'| roots | name | phase | 10-29 f/m | {heads} | {msHeads} |',
          '|' + '---|' * (4 + len(PAIRS) + len(VERSIONS))]
for row in construction:
    o = oldConstruction[(row['functionRoots'], row['reusedName'])]
    for ph in ['pipelineMs', 'buildMs', 'renderMs', 'editMs']:
        lines.append(f"| {row['functionRoots']} | {'reused' if row['reusedName'] else 'distinct'} | {ph[:-2]} | {o[ph]['featureOverMaster']:.3f} | {ratios(ph, row)} | {ms(ph, row)} |")
lines += ['', '### Retained memory (32,000 function roots, forced GC)', '', '| version | heap + external MiB | rss MiB | 10-29 heap + external MiB |', '|---|---|---|---|']
for v in VERSIONS:
    before = earlier['memory'].get(v)
    lines.append(f"| {v} | {memory[v]['medianDeltaHeapPlusExternalBytes'] / 2**20:.3f} | {memory[v]['medianDeltaBytes']['rss'] / 2**20:.3f} | " + (f"{before['medianDeltaHeapPlusExternalBytes'] / 2**20:.3f}" if before else '-') + ' |')
lines += ['', '### Tree fingerprints (sha256, first 12)', '', '| tree | commit | runtime source | compiled runtime | native and wasm | working-tree diff |', '|---|---|---|---|---|---|']
for t in TREES:
    s = trees[t]['sections']
    lines.append(f"| {t} | `{trees[t]['commit'][:9]}` | {s['runtimeSource']['sha256'][:12]} ({s['runtimeSource']['files']}) | {s['compiledRuntime']['sha256'][:12]} ({s['compiledRuntime']['files']}) | {s['nativeAndWasm']['sha256'][:12]} ({s['nativeAndWasm']['files']}) | {'clean' if trees[t]['workingTreeDiffSha256'] == EMPTY_DIFF else trees[t]['workingTreeDiffSha256'][:12]} |")
markdown = '\n'.join(lines) + '\n'
(out / 'summary.md').write_text(markdown)
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as f:
        f.write(markdown)
sys.stdout.write(markdown)
if mismatches:
    raise SystemExit(1)
