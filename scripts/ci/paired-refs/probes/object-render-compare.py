# Usage: python3 object-render-compare.py <out-dir>
# Reads object-render.mjs's render-<tree>-<round>.json for base and head:
# each round's total render ms, the change, and the files whose median render
# moved most, with their sizes. Every round's renders must hash alike.
import json, statistics, sys
from pathlib import Path

out = Path(sys.argv[1])
runs = {t: sorted(out.glob(f'render-{t}-*.json')) for t in ('base', 'head')}
loaded = {t: [json.loads(p.read_text()) for p in ps] for t, ps in runs.items()}
hashes = {r['hash'] for rs in loaded.values() for r in rs}
lines = [f"renders hash alike: {len(hashes) == 1}", '', '| round | base ms | head ms | change |', '|---|---|---|---|']
for i, (b, h) in enumerate(zip(loaded['base'], loaded['head'])):
    lines.append(f"| {i} | {b['totalMs']:.1f} | {h['totalMs']:.1f} | {(h['totalMs'] / b['totalMs'] - 1) * 100:+.1f}% |")
median = lambda t, i: statistics.median(r['rows'][i]['ms'] for r in loaded[t])
rows = [(row['path'], row['bytes'], median('base', i), median('head', i)) for i, row in enumerate(loaded['base'][0]['rows'])]
lines += ['', f"total of medians: base {sum(r[2] for r in rows):.1f} ms, head {sum(r[3] for r in rows):.1f} ms", '', '| file | bytes | base ms | head ms | change |', '|---|---|---|---|---|']
for path, size, b, h in sorted(rows, key=lambda r: r[3] - r[2], reverse=True)[:30]:
    lines.append(f"| {path} | {size} | {b:.3f} | {h:.3f} | {h - b:+.3f} |")
print('\n'.join(lines))
