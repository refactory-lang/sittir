"""Amdahl ceilings for rendering one tree in parallel, from render inventories (pipeline.js with inventoryDepth).
   python3 -I inventory.py <inventory.json> [more.json ...]

Each row is one file on a hydrated arena tree: the time its trivia table takes to build, its root's first render
after that and a second one, and, level by level down the chain of largest children by nodes, the unit's nodes and
its largest child's. A file's render cost is its trivia build plus its first render. Splitting it at level L leaves
the largest unit at L on its critical path, so on P threads it renders in at least cost * max(share_L, 1 / P),
share_L being the largest unit's nodes over the file's: a ceiling that charges nothing for the split or the join.
With files already spread over P workers, a corpus's renders take at least max(total / P, the largest file's
bound). Several inventories of the same files are averaged per file first. Rows that carry the trivia table's step
counts (triviaSteps, stretchSteps) also get those counts per node, by file size; they are counts, so load can't
move them."""
import json, statistics, sys

THREADS = (2, 4, 8)
runs = [json.load(open(path)) for path in sys.argv[1:]]
for run in runs:
    print(f"inventory: depth {run['depth']}, {len(run['rows'])} files, load {run['load'][0]:.1f}, loader {run['loader']}")
by_path = {}
for run in runs:
    for row in run['rows']:
        if 'error' not in row:
            by_path.setdefault(row['path'], []).append(row)
failed = sorted({row['path'] for run in runs for row in run['rows'] if 'error' in row})
depth = min(run['depth'] for run in runs)


def mean(rows, key):
    return statistics.fmean(row[key] for row in rows)


files = {}
for path, rows in by_path.items():
    files[path] = {
        'bytes': rows[0]['bytes'],
        'nodes': rows[0]['nodes'],
        'triviaMs': mean(rows, 'triviaMs'),
        'firstMs': mean(rows, 'firstMs'),
        'againMs': mean(rows, 'againMs'),
        'levels': rows[0]['levels'],
        'triviaSteps': rows[0].get('triviaSteps'),
        'stretchSteps': rows[0].get('stretchSteps'),
        'childrenFirstMs': [statistics.fmean(row['levels'][l]['childrenFirstMs'] for row in rows) for l in range(len(rows[0]['levels']))],
    }
    files[path]['costMs'] = files[path]['triviaMs'] + files[path]['firstMs']


def share(f, level):
    if not f['levels']:
        return 1.0
    x = f['levels'][min(level, len(f['levels']) - 1)]
    return x['largestNodes'] / f['nodes']


def bound(f, level, threads):
    return f['costMs'] * max(share(f, level), 1 / threads)


trivia = sum(f['triviaMs'] for f in files.values())
first = sum(f['firstMs'] for f in files.values())
again = sum(f['againMs'] for f in files.values())
total = trivia + first
print(f'\nfiles {len(files)}, refused {len(failed)}, children refused along the chains {sum(x["refused"] for f in files.values() for x in f["levels"])}')
print(f'render on hydrated trees, corpus total: trivia table {trivia:.0f} ms ({trivia / total:.0%}), first render {first:.0f} ms ({first / total:.0%}); a second render {again:.0f} ms')
if all(f['triviaSteps'] is not None for f in files.values()):
    print('trivia table step counts per node, by file size in nodes:')
    for low, high in ((0, None), (0, 2000), (2000, 20000), (20000, 100000), (100000, None)):
        band = [f for f in files.values() if f['nodes'] >= low and (high is None or f['nodes'] < high)]
        if band:
            nodes = sum(f['nodes'] for f in band)
            label = 'all' if (low, high) == (0, None) else f"{low}+" if high is None else f'{low}-{high}'
            print(f"  {label:>13}: {len(band):4} files, {nodes:8} nodes, {sum(f['triviaSteps'] for f in band) / nodes:.3f} steps, {sum(f['stretchSteps'] for f in band) / nodes:.3f} stretch steps")

print('\nlargest files by render cost: trivia + first render ms, share of the corpus, then per level the children and the largest child\'s share of the file\'s nodes')
for path, f in sorted(files.items(), key=lambda kv: -kv[1]['costMs'])[:8]:
    chain = '  '.join(f"[{x['children']}] {x['largestNodes'] / f['nodes']:.0%} {x['largestKind']}" for x in f['levels'])
    print(f"  {f['triviaMs']:6.1f} + {f['firstMs']:5.1f} ms {f['costMs'] / total:5.1%} {f['bytes'] / 2 ** 20:5.2f} MB  {path.split('/')[-1]}: {chain}")

largest = max(files.values(), key=lambda f: f['costMs'])
print('\none file on P threads, split at level L: speedup ceiling for the largest file / median file / files over 64 KiB')
big = [f for f in files.values() if f['bytes'] > 64 * 1024]
for level in range(depth):
    cells = []
    for threads in THREADS:
        top = largest['costMs'] / bound(largest, level, threads)
        median = statistics.median(f['costMs'] / bound(f, level, threads) for f in files.values())
        bigs = statistics.median(f['costMs'] / bound(f, level, threads) for f in big) if big else float('nan')
        cells.append(f'P={threads}: {top:4.2f}x / {median:4.2f}x / {bigs:4.2f}x')
    print(f'  L={level}: ' + '   '.join(cells))

print('\nthe corpus\'s renders on P file workers: floor without a split, then split at each level')
for threads in THREADS:
    whole = max(total / threads, max(f['costMs'] for f in files.values()))
    split = [max(total / threads, max(bound(f, level, threads) for f in files.values())) for level in range(depth)]
    print(f'  P={threads}: {whole:6.1f} ms  ' + '  '.join(f'L={level}: {ms:6.1f}' for level, ms in enumerate(split)))
