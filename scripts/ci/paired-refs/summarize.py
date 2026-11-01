# Usage: python3 summarize.py <out-dir> <earlier-summary.json>
# Reads <out-dir>/refs.json ({"base", "master", "feature", "profile"}), the
# workers' results under <out-dir>/runs and each tree's fingerprint
# (<out-dir>/before-<tree>.json). Every ratio is the median of the per-round
# ratios of process medians, with a seeded bootstrap 95% range of that median,
# for feature/base, master/base and feature/master, beside the earlier
# summary's feature/master. Writes summary.json and summary.md into <out-dir>
# and appends the Markdown to $GITHUB_STEP_SUMMARY when it is set.
import json, os, random, statistics, sys
from pathlib import Path

out = Path(sys.argv[1]).resolve()
runs = out / 'runs'
earlier = json.loads(Path(sys.argv[2]).read_text())
refs = json.loads((out / 'refs.json').read_text())
VERSIONS = ['base', 'master', 'feature']
PAIRS = [('feature', 'base'), ('master', 'base'), ('feature', 'master')]
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
corpus = []
for g in GRAMMARS:
    results = {v: [read(f'corpus-{g}-{v}-{r}.json') for r in range(5)] for v in VERSIONS}
    signature = results['base'][0]['signature']
    assert all(x['signature'] == signature for xs in results.values() for x in xs), f'{g}: renders or edits differ'
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
        assert len({s['renderSha256'] for xs in data.values() for x in xs for s in x}) == 1
        assert len({s['editedSha256'] for xs in data.values() for x in xs for s in x}) == 1
        med = {v: {ph: [median(s[ph] for s in x) for x in data[v]] for ph in ['pipelineMs', 'buildMs', 'renderMs', 'editMs']} for v in VERSIONS}
        construction.append({'functionRoots': n, 'reusedName': reuse, 'ms': {v: {ph: median(xs) for ph, xs in med[v].items()} for v in VERSIONS}, 'pairs': pairs(med)})
memory = {}
for v in VERSIONS:
    ds = [read(f'memory-rust-{v}-{r}.json') for r in range(3)]
    profiles.update(d['buildProfile'] for d in ds)
    memory[v] = {'medianDeltaHeapPlusExternalBytes': median(d['samples'][0]['delta']['heapUsed'] + d['samples'][0]['delta']['external'] for d in ds),
                 'medianDeltaBytes': {k: median(d['samples'][0]['delta'][k] for d in ds) for k in ['heapUsed', 'external', 'arrayBuffers', 'rss']},
                 'builtMemory': [d.get('builtMemory') for d in ds]}
trees = {v: json.loads((out / f'before-{v}.json').read_text()) for v in VERSIONS}
for v in VERSIONS:
    assert trees[v]['commit'] == refs[v], f'{v}: measured {trees[v]["commit"]}, expected {refs[v]}'
load = [r['load1'] for r in receipts]
machine, runner = trees['feature']['machine'], trees['feature']['runner']
result = {'refs': refs, 'buildProfiles': sorted(profiles), 'processes': len(receipts), 'meanLoad1': statistics.mean(load), 'maxLoad1': max(load),
          'machine': machine, 'runner': runner, 'trees': {v: {'commit': t['commit'], 'workingTreeDiffSha256': t['workingTreeDiffSha256'], 'sections': {k: {'files': s['files'], 'sha256': s['sha256']} for k, s in t['sections'].items()}} for v, t in trees.items()},
          'corpus': corpus, 'construction': construction, 'memory': memory}
(out / 'summary.json').write_text(json.dumps(result, indent=2) + '\n')

old = {r['grammar']: r['timings'] for r in earlier['corpus']}
oldConstruction = {(r['functionRoots'], r['reusedName']): r['timings'] for r in earlier['construction']}
cell = lambda p, ph, row: f"{row['pairs'][p][ph]['ratio']:.3f} [{row['pairs'][p][ph]['range95'][0]:.3f}, {row['pairs'][p][ph]['range95'][1]:.3f}]"
ratios = lambda ph, row: ' | '.join(cell(f'{a}/{b}', ph, row) for a, b in PAIRS)
EMPTY_DIFF = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
lines = [
    '## Paired refs: feature/base, master/base, feature/master', '',
    f"Trees: base `{refs['base'][:9]}` (merge base), master `{refs['master'][:9]}`, feature `{refs['feature'][:9]}`; build profile {', '.join(sorted(profiles))}.",
    f"Runner: {runner['os']} {runner['arch']} image {runner['image']} {runner['imageVersion']}, {machine['cpu']}, {machine['cores']} cores, {machine['memory'] / 2**30:.1f} GiB.",
    f"{len(receipts)} fresh processes, no idle gate; load1 mean {statistics.mean(load):.2f}, max {max(load):.2f}.", '',
    'Each ratio is the median over five rounds of the ratio of process medians, with a bootstrap 95% range. The 10-29 column is feature/master from docs/reviews/2026-10-29-paired-backends.md (a local macOS run against master 7471447a2).', '',
    '### Corpus, object storage', '',
    '| grammar | phase | 10-29 f/m | feature/base | master/base | feature/master | ms base | ms master | ms feature |',
    '|---|---|---|---|---|---|---|---|---|',
]
for row in corpus:
    for ph in ['pipelineMs', 'parseMs', 'renderMs', 'editMs']:
        lines.append(f"| {row['grammar']} | {ph[:-2]} | {old[row['grammar']][ph]['featureOverMaster']:.3f} | {ratios(ph, row)} | " + ' | '.join(f"{row['ms'][v][ph]:.3f}" for v in VERSIONS) + ' |')
lines += ['', '### Rust construction (function items)', '',
          '| roots | name | phase | 10-29 f/m | feature/base | master/base | feature/master | ms base | ms master | ms feature |',
          '|---|---|---|---|---|---|---|---|---|---|']
for row in construction:
    o = oldConstruction[(row['functionRoots'], row['reusedName'])]
    for ph in ['pipelineMs', 'buildMs', 'renderMs', 'editMs']:
        lines.append(f"| {row['functionRoots']} | {'reused' if row['reusedName'] else 'distinct'} | {ph[:-2]} | {o[ph]['featureOverMaster']:.3f} | {ratios(ph, row)} | " + ' | '.join(f"{row['ms'][v][ph]:.3f}" for v in VERSIONS) + ' |')
lines += ['', '### Retained memory (32,000 function roots, forced GC)', '', '| tree | heap + external MiB | 10-29 MiB |', '|---|---|---|']
for v in VERSIONS:
    before = earlier['memory'].get(v)
    lines.append(f"| {v} | {memory[v]['medianDeltaHeapPlusExternalBytes'] / 2**20:.3f} | " + (f"{before['medianDeltaHeapPlusExternalBytes'] / 2**20:.3f}" if before else '-') + ' |')
lines += ['', '### Tree fingerprints (sha256, first 12)', '', '| tree | commit | runtime source | compiled runtime | native and wasm | working-tree diff |', '|---|---|---|---|---|---|']
for v in VERSIONS:
    s = trees[v]['sections']
    lines.append(f"| {v} | `{trees[v]['commit'][:9]}` | {s['runtimeSource']['sha256'][:12]} ({s['runtimeSource']['files']}) | {s['compiledRuntime']['sha256'][:12]} ({s['compiledRuntime']['files']}) | {s['nativeAndWasm']['sha256'][:12]} ({s['nativeAndWasm']['files']}) | {'clean' if trees[v]['workingTreeDiffSha256'] == EMPTY_DIFF else trees[v]['workingTreeDiffSha256'][:12]} |")
markdown = '\n'.join(lines) + '\n'
(out / 'summary.md').write_text(markdown)
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as f:
        f.write(markdown)
sys.stdout.write(markdown)
