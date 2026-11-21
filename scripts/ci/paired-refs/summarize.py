# Usage: python3 summarize.py <out-dir> <earlier-summary.json> [<bar>] [--identity <tree>]
# Reads <out-dir>/refs.json (resolve-refs.sh), the workers' results under
# <out-dir>/runs, each tree's fingerprint (<out-dir>/before-<tree>.json) and
# the build path every tree was built on (build-path.mjs place and check).
# The versions are base, master, feature and each candidate in object storage
# and, when they ran, <tree>-arena (that tree in arena storage). A candidate
# is compared with base and with feature in the same storage, and the headline
# pairs compare arena with arena; a cross-storage pair is labelled. Every
# ratio is the median of the per-round ratios of process medians, with a
# seeded bootstrap 95% range of that median, beside the earlier summary's
# feature/master. Pipeline ratios against base above <bar> (default 1.10) are
# listed. Every version's render of each corpus entry, its edit of each member
# key and each construction case's hashes must equal the identity tree's
# (default base), or base's for an entry where the identity tree differs from
# base. Those entries are listed by grammar, entry and key without failing,
# with how many of them each version holds at the identity tree and at base.
# A tree read in arena storage must equal the same tree in object storage on
# every entry, and every round of a version must hold its round 0's hashes,
# so round 0's counts stand for every round.
# Writes summary.json and summary.md into <out-dir>, appends the Markdown to
# $GITHUB_STEP_SUMMARY when it is set, and exits 1 when any version holds
# another value, naming its entries and keys.
import argparse, json, os, random, statistics, sys
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('out')
parser.add_argument('earlier')
parser.add_argument('bar', nargs='?', type=float, default=1.10)
parser.add_argument('--identity', default='base')
args = parser.parse_args()
out = Path(args.out).resolve()
runs = out / 'runs'
earlier = json.loads(Path(args.earlier).read_text())
BAR = args.bar
IDENTITY = args.identity
refs = json.loads((out / 'refs.json').read_text())
median = statistics.median
read = lambda name: json.loads((runs / name).read_text())
receipts = read('receipts.json')
def caches_line(machine):
    caches = machine.get('caches')
    if not caches:
        return ''
    return f", caches L1d {caches['l1d']}, L1i {caches['l1i']}, L2 {caches['l2']}, L3 {caches['l3']}"
CANDIDATES = list(refs.get('candidates', {}))
TREES = ['base', 'master', 'feature'] + CANDIDATES
VERSIONS = [v for t in TREES for v in [t, t + '-arena'] if any(r['version'] == v for r in receipts)]
treeOf = lambda v: v.removesuffix('-arena')
storageOf = lambda v: 'arena' if v.endswith('-arena') else 'object'
LIKE_FOR_LIKE = [('feature', 'base'), ('feature-arena', 'base-arena'), ('master', 'base'), ('feature', 'master')] + [p for c in CANDIDATES for p in [(c, 'base'), (c + '-arena', 'base-arena'), (c, 'feature'), (c + '-arena', 'feature-arena')]]
CROSS_STORAGE = [('feature-arena', 'base'), ('feature-arena', 'master')] + [(c + '-arena', 'base') for c in CANDIDATES]
PAIRS = [(a, b) for a, b in LIKE_FOR_LIKE + CROSS_STORAGE if a in VERSIONS and b in VERSIONS]
AGAINST_BASE = [(a, b) for a, b in PAIRS if b in ('base', 'base-arena') and a != 'master' and storageOf(a) == storageOf(b)]
GRAMMARS = ['python', 'rust', 'typescript', 'regex', 'scm']
ROUNDS = 5
assert IDENTITY in TREES, f"identity {IDENTITY} is none of {', '.join(TREES)}"


def interval(values, seed=20261029):
    rng = random.Random(seed)
    draws = sorted(median(rng.choices(values, k=len(values))) for _ in range(5000))
    return [draws[int(.025 * len(draws))], draws[int(.975 * len(draws))]]


def ratio(num, den):
    paired = [n / d for n, d in zip(num, den)]
    return {'ratio': median(paired), 'range95': interval(paired), 'paired': paired}


def pairs(med):
    return {f'{a}/{b}': {ph: ratio(med[a][ph], med[b][ph]) for ph in med[a] if ph != 'releaseMs'} for a, b in PAIRS}


def phase(sample, ph):
    if ph == 'matchedPipelineMs':
        return sample['pipelineMs']
    if ph == 'releaseMs':
        return sample.get('releaseMs', 0)
    if ph == 'editReleaseMs':
        return sample['editMs'] + sample.get('releaseMs', 0)
    return sample[ph]


CORPUS_PHASES = ['pipelineMs', 'matchedPipelineMs', 'parseMs', 'renderMs', 'editMs', 'releaseMs', 'editReleaseMs', 'wholeReadMs']
samplesOf = lambda x, ph: x['samplesMatched'] if ph == 'matchedPipelineMs' else x['samples']
CONSTRUCTION_PHASES = ['pipelineMs', 'buildMs', 'renderMs', 'editMs', 'releaseMs', 'editReleaseMs']


def entryHashes(g, x):
    for at, entry in enumerate(x['byEntry']):
        yield (g, at, entry['name'], 'render'), entry['rendered']
        for key, sha in entry['edits'].items():
            yield (g, at, entry['name'], f'edit {key}'), sha


def entryOf(key):
    g, at, name, what = key
    return f'{at} function roots, {name}' if g == 'construction' else f'#{at} {name}'


def described(key):
    g, at, name, what = key
    return f'construction, {entryOf(key)}' if g == 'construction' else f'{g} {entryOf(key)}: {what}'


def roundsOf(rounds):
    return f'round {rounds[0]}' if len(rounds) == 1 else f"rounds {', '.join(map(str, rounds))}"


def apartLines(found, reference):
    grouped = {}
    for v, r, apart in found:
        grouped.setdefault((v, tuple(apart)), []).append(r)
    for (v, apart), rounds in grouped.items():
        shown = ', '.join(described(k) for k in apart[:10])
        yield f"{v} {roundsOf(rounds)}: {len(apart)} apart from {reference(v)}: {shown}{f', and {len(apart) - 10} more' if len(apart) > 10 else ''}"


profiles = set()
mismatches = []
hashes = {v: [{} for _ in range(ROUNDS)] for v in VERSIONS}
corpus = []
for g in GRAMMARS:
    results = {v: [read(f'corpus-{g}-{v}-{r}.json') for r in range(ROUNDS)] for v in VERSIONS}
    signature = results[IDENTITY][0]['signature']
    for v, xs in results.items():
        for r, x in enumerate(xs):
            hashes[v][r].update(entryHashes(g, x))
    profiles.update(x['buildProfile'] for xs in results.values() for x in xs)
    med = {v: {ph: [median(phase(s, ph) for s in samplesOf(x, ph)) for x in results[v]] for ph in CORPUS_PHASES} for v in VERSIONS}
    peakRss = {v: median(x['peakRssMB'] for x in results[v]) for v in VERSIONS}
    corpus.append({'grammar': g, 'signature': signature, 'ms': {v: {ph: median(xs) for ph, xs in med[v].items()} for v in VERSIONS}, 'peakRssMB': peakRss, 'pairs': pairs(med)})
construction = []
NAMING = {(False, False): 'distinct name', (True, False): 'reused name', (False, True): 'many names'}
for n in [2000, 8000]:
    for reuse, many in NAMING:
        data = {}
        for v in VERSIONS:
            data[v] = []
            for r in range(ROUNDS):
                d = read(f'timing-rust-{v}-{r}.json')
                profiles.add(d['buildProfile'])
                data[v].append([s for s in d['samples'] if s['n'] == n and s['reuse'] == reuse and s['many'] == many])
        assert all(len(x) == 7 for xs in data.values() for x in xs)
        name = NAMING[reuse, many]
        for v, xs in data.items():
            for r, x in enumerate(xs):
                held = sorted({(s['renderSha256'], s['editedSha256']) for s in x})
                if len(held) != 1:
                    mismatches.append(f'construction {n} {name} {v} round {r}: its samples render or edit apart')
                hashes[v][r][('construction', n, name, '')] = held
        med = {v: {ph: [median(phase(s, ph) for s in x) for x in data[v]] for ph in CONSTRUCTION_PHASES} for v in VERSIONS}
        construction.append({'functionRoots': n, 'reusedName': reuse, 'manyNames': many, 'ms': {v: {ph: median(xs) for ph, xs in med[v].items()} for v in VERSIONS}, 'pairs': pairs(med)})
memory = {}
for v in VERSIONS:
    ds = [read(f'memory-rust-{v}-{r}.json') for r in range(3)]
    profiles.update(d['buildProfile'] for d in ds)
    memory[v] = {'medianDeltaHeapPlusExternalBytes': median(d['samples'][0]['delta']['heapUsed'] + d['samples'][0]['delta']['external'] for d in ds),
                 'medianDeltaBytes': {k: median(d['samples'][0]['delta'][k] for d in ds) for k in ['heapUsed', 'external', 'arrayBuffers', 'rss']},
                 'builtMemory': [d.get('builtMemory') for d in ds]}
apartFromRoundZero = [(v, r, sorted(k for k in held.keys() | hashes[v][0].keys() if held.get(k) != hashes[v][0].get(k))) for v in VERSIONS for r, held in enumerate(hashes[v]) if r > 0]
mismatches += apartLines([x for x in apartFromRoundZero if x[2]], lambda v: 'its round 0')
identity, base = hashes[IDENTITY][0], hashes['base'][0]
everyKey = identity.keys() | base.keys()
fromBase = sorted(k for k in everyKey if identity.get(k) != base.get(k))
inFromBase = set(fromBase)
apartFromIdentity = [(v, r, sorted(k for k in everyKey | held.keys() if held.get(k) != identity.get(k) and not (k in inFromBase and held.get(k) == base.get(k)))) for v in VERSIONS for r, held in enumerate(hashes[v])]
mismatches += apartLines([x for x in apartFromIdentity if x[2]], lambda v: IDENTITY)
apartFromObject = [(v, r, sorted(k for k in held.keys() | hashes[treeOf(v)][r].keys() if held.get(k) != hashes[treeOf(v)][r].get(k))) for v in VERSIONS if storageOf(v) == 'arena' for r, held in enumerate(hashes[v])]
mismatches += apartLines([x for x in apartFromObject if x[2]], treeOf)
heldOnFromBase = {v: {'atIdentity': sum(hashes[v][0].get(k) == identity.get(k) for k in fromBase), 'atBase': sum(hashes[v][0].get(k) == base.get(k) for k in fromBase)} for v in VERSIONS}
trees = {t: json.loads((out / f'before-{t}.json').read_text()) for t in TREES}
commitOf = lambda t: refs['candidates'][t]['commit'] if t in CANDIDATES else refs[t]
for t in TREES:
    assert trees[t]['commit'] == commitOf(t), f'{t}: measured {trees[t]["commit"]}, expected {commitOf(t)}'
load = [r['load1'] for r in receipts]
machine, runner = trees['feature']['machine'], trees['feature']['runner']
over = [f"{row['grammar']} {a} ×{row['pairs'][f'{a}/{b}']['pipelineMs']['ratio']:.3f}" for row in corpus for a, b in AGAINST_BASE if row['pairs'][f'{a}/{b}']['pipelineMs']['ratio'] > BAR]
result = {'refs': refs, 'versions': {v: {'tree': treeOf(v), 'nodeStorage': storageOf(v)} for v in VERSIONS}, 'bar': BAR, 'overBar': over, 'identity': IDENTITY, 'mismatches': mismatches,
          'differFromBase': [{'grammar': key[0], 'entry': entryOf(key), 'key': key[3] or 'render and edit'} for key in fromBase], 'heldOnDifferencesFromBase': heldOnFromBase,
          'buildProfiles': sorted(profiles), 'processes': len(receipts), 'meanLoad1': statistics.mean(load), 'maxLoad1': max(load), 'machine': machine, 'runner': runner,
          'trees': {t: {'commit': x['commit'], 'workingTreeDiffSha256': x['workingTreeDiffSha256'], 'sections': {k: {'files': s['files'], 'sha256': s['sha256']} for k, s in x['sections'].items()}} for t, x in trees.items()},
          'buildPath': {'path': refs.get('buildPath'), 'trees': {t: json.loads((out / f'build-path-{t}.json').read_text()) for t in TREES}},
          'corpus': corpus, 'construction': construction, 'memory': memory}
(out / 'summary.json').write_text(json.dumps(result, indent=2) + '\n')

old = {r['grammar']: r['timings'] for r in earlier['corpus']}
oldConstruction = {(r['functionRoots'], r['reusedName']): r['timings'] for r in earlier['construction']}
cell = lambda p, ph, row: f"{row['pairs'][p][ph]['ratio']:.3f} [{row['pairs'][p][ph]['range95'][0]:.3f}, {row['pairs'][p][ph]['range95'][1]:.3f}]" if ph in row['pairs'][p] else '-'
ratios = lambda ph, row: ' | '.join(cell(f'{a}/{b}', ph, row) for a, b in PAIRS)
heads = ' | '.join(f'{a}/{b}' + (' (cross-storage)' if storageOf(a) != storageOf(b) else '') for a, b in PAIRS)
ms = lambda ph, row: ' | '.join(f"{row['ms'][v][ph]:.3f}" for v in VERSIONS)
msHeads = ' | '.join(f'ms {v}' for v in VERSIONS)
EMPTY_DIFF = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
lines = [
    '## Paired refs: feature and master against their merge base', '',
    f"Trees: base `{refs['base'][:9]}` (merge base), master `{refs['master'][:9]}`, feature `{refs['feature'][:9]}`"
    + ''.join(f", {c} `{refs['candidates'][c]['commit'][:9]}` ({refs['candidates'][c]['ref']})" for c in CANDIDATES) + f"; build profile {', '.join(sorted(profiles))}. "
    + ("A version ending in -arena is its tree read with `nodeStorage: 'arena'`; the others use object storage." if any(v.endswith('-arena') for v in VERSIONS) else 'Every version uses object storage.'),
    (out / 'build-path.md').read_text().strip(),
    f"Runner: {runner['os']} {runner['arch']} image {runner['image']} {runner['imageVersion']}, {machine['cpu']}, {machine['cores']} cores, {machine['memory'] / 2**30:.1f} GiB{caches_line(machine)}.",
    f"{len(receipts)} fresh processes, no idle gate; load1 mean {statistics.mean(load):.2f}, max {max(load):.2f}.", '',
    'Each ratio is the median over five rounds of the ratio of process medians, with a bootstrap 95% range. Every edit result and built root is released after its timed edit; release is its own time (ms only, since a version without counted release releases nothing) and edit+release is what a caller pays under explicit release. The 10-29 column is feature/master in object storage from docs/reviews/2026-10-29-paired-backends.md (a local macOS run against master 7471447a2).', '',
    f"Pipeline (parse + render) against base above ×{BAR:.2f}: {', '.join(over) if over else 'none'}.",
    f"Renders and edits that differ from the identity tree, {IDENTITY}: {'; '.join(mismatches) if mismatches else 'none'}.",
    *([f"Entries where {IDENTITY} differs from base: {len(fromBase)}" + (f" ({', '.join(f'{g} {sum(k[0] == g for k in fromBase)}' for g in GRAMMARS + ['construction'] if any(k[0] == g for k in fromBase))})." if fromBase else '.')] if IDENTITY != 'base' else []), '',
    '### Corpus', '',
    f'| grammar | phase | 10-29 f/m | {heads} | {msHeads} |',
    '|' + '---|' * (3 + len(PAIRS) + len(VERSIONS)),
]
NAMES = {'editReleaseMs': 'edit+release', 'matchedPipelineMs': 'pipeline after GC', 'wholeReadMs': 'whole-tree read'}
earlierCell = lambda timings, ph: f"{timings[ph]['featureOverMaster']:.3f}" if ph in timings else '-'
for row in corpus:
    for ph in CORPUS_PHASES:
        lines.append(f"| {row['grammar']} | {NAMES.get(ph, ph[:-2])} | {earlierCell(old[row['grammar']], ph)} | {ratios(ph, row)} | {ms(ph, row)} |")
lines += ['', '### Peak RSS per corpus worker (MiB, median over rounds)', '', '| grammar | ' + ' | '.join(VERSIONS) + ' |', '|' + '---|' * (1 + len(VERSIONS))]
for row in corpus:
    lines.append(f"| {row['grammar']} | " + ' | '.join(f"{row['peakRssMB'][v]:.0f}" for v in VERSIONS) + ' |')
lines += ['', '### Rust construction (function items)', '',
          f'| roots | naming | phase | 10-29 f/m | {heads} | {msHeads} |',
          '|' + '---|' * (4 + len(PAIRS) + len(VERSIONS))]
for row in construction:
    o = {} if row['manyNames'] else oldConstruction[(row['functionRoots'], row['reusedName'])]
    for ph in CONSTRUCTION_PHASES:
        lines.append(f"| {row['functionRoots']} | {NAMING[row['reusedName'], row['manyNames']]} | {NAMES.get(ph, ph[:-2])} | {earlierCell(o, ph)} | {ratios(ph, row)} | {ms(ph, row)} |")
lines += ['', '### Retained memory (32,000 function roots, forced GC)', '', '| version | heap + external MiB | rss MiB | 10-29 heap + external MiB |', '|---|---|---|---|']
for v in VERSIONS:
    before = earlier['memory'].get(v)
    lines.append(f"| {v} | {memory[v]['medianDeltaHeapPlusExternalBytes'] / 2**20:.3f} | {memory[v]['medianDeltaBytes']['rss'] / 2**20:.3f} | " + (f"{before['medianDeltaHeapPlusExternalBytes'] / 2**20:.3f}" if before else '-') + ' |')
if fromBase:
    lines += ['', f'### Entries where {IDENTITY} differs from base', '', '| version | at ' + IDENTITY + ' | at base |', '|---|---|---|']
    for v in VERSIONS:
        lines.append(f"| {v} | {heldOnFromBase[v]['atIdentity']} / {len(fromBase)} | {heldOnFromBase[v]['atBase']} / {len(fromBase)} |")
    lines += ['', '| grammar | entry | key |', '|---|---|---|']
    for key in fromBase:
        lines.append(f'| {key[0]} | {entryOf(key)} | {key[3] or "render and edit"} |')
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
