# Usage: python3 render-bisect-compare.py <out-dir> <tree>...
# Reads object-render.mjs's render-arena-<tree>-<round>.json for each tree, in
# commit order: each round's total render ms per tree, each consecutive
# pair's change per round, and, for each pair, the files whose median moved
# most. Every render must hash alike.
import json, statistics, sys
from pathlib import Path

out, names = Path(sys.argv[1]), sys.argv[2:]
loaded = {t: [json.loads(p.read_text()) for p in sorted(out.glob(f'render-arena-{t}-*.json'))] for t in names}
hashes = {r['hash'] for rs in loaded.values() for r in rs}
rounds = min(len(rs) for rs in loaded.values())
lines = ['## arena render by commit', '', f'renders hash alike: {len(hashes) == 1}', '']
lines += ['| round | ' + ' | '.join(names) + ' |', '|---|' + '---|' * len(names)]
for i in range(rounds):
    lines.append(f'| {i} | ' + ' | '.join(f"{loaded[t][i]['totalMs']:.1f}" for t in names) + ' |')
lines += ['', '| step | change per round | median change |', '|---|---|---|']
for a, b in zip(names, names[1:]):
    changes = [(loaded[b][i]['totalMs'] / loaded[a][i]['totalMs'] - 1) * 100 for i in range(rounds)]
    lines.append(f"| {a} -> {b} | {', '.join(f'{c:+.1f}%' for c in changes)} | {statistics.median(changes):+.1f}% |")
median = lambda t, i: statistics.median(r['rows'][i]['ms'] for r in loaded[t])
for a, b in zip(names, names[1:]):
    rows = [(row['path'], row['bytes'], median(a, i), median(b, i)) for i, row in enumerate(loaded[a][0]['rows'])]
    lines += ['', f'### {a} -> {b}: total of medians {sum(r[2] for r in rows):.1f} -> {sum(r[3] for r in rows):.1f} ms', '', '| file | bytes | before ms | after ms | change |', '|---|---|---|---|---|']
    for path, size, x, y in sorted(rows, key=lambda r: r[3] - r[2], reverse=True)[:12]:
        lines.append(f'| {path} | {size} | {x:.3f} | {y:.3f} | {y - x:+.3f} |')
print('\n'.join(lines))
