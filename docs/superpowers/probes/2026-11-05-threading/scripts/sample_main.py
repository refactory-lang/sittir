"""Split the main thread of a macOS `sample` report by napi entry and by image.

Usage: python3 -I sample_main.py <sample.txt> [entries to list by frame]
       python3 -I sample_main.py <sample.txt> --inclusive <entry> <frame> [frame ...]

Builds the main thread's call tree, takes each node's self samples (its
count less its children's) and charges them to the nearest napi entry above
it (a `c_callback` frame, the addon function JS called) and to the image the
frame belongs to: the addon (sittir and tree-sitter code, movable off the JS
thread), libnode (V8, Node and napi, bound to the JS thread), malloc, kernel,
or `???` (JIT-compiled JS).

With --inclusive, it prints instead the samples of each frame whose symbol contains <frame>, children included,
under the napi entry whose name contains <entry>, as a share of that entry's: a frame counts once on a path,
at its top-most match.
"""
import re
import sys
from collections import defaultdict

LINE = re.compile(r'^(?P<lead>[ +!:|]*)(?P<count>\d+) (?P<rest>.*)$')
lines = open(sys.argv[1]).read().split('\n')
start = next(i for i, l in enumerate(lines) if 'com.apple.main-thread' in l)
base = LINE.match(lines[start])
base_col = len(base.group('lead'))
nodes = []
stack = []
for line in lines[start + 1:]:
    m = LINE.match(line)
    if m is None:
        break
    col = len(m.group('lead'))
    if col <= base_col:
        break
    rest = m.group('rest')
    image = re.search(r'\(in ([^)]+)\)', rest)
    node = {'col': col, 'count': int(m.group('count')), 'symbol': rest.split('  (in ')[0].split(' (in ')[0].strip(),
            'image': image.group(1) if image else '???', 'children': 0, 'entry': None, 'parent': None}
    while stack and stack[-1]['col'] >= col:
        stack.pop()
    if stack:
        stack[-1]['children'] += node['count']
        node['entry'] = stack[-1]['entry']
        node['parent'] = stack[-1]
    if 'c_callback' in node['symbol'] or '__napi__' in node['symbol']:
        name = re.sub(r'.*?(?:SittirEngine_\d+|__napi__)', '', node['symbol'])
        name = re.sub(r'^\d+', '', name)
        node['entry'] = name[:60]
    nodes.append(node)
    stack.append(node)


def bucket(node):
    image = node['image']
    if image in ('???', '<unknown binary>'):
        return 'jit'
    if image.startswith(('libnode', 'libabsl', 'libuv', 'libicu', 'libsimdjson', 'libada')):
        return 'v8'
    if image.endswith('.node'):
        return 'addon'
    if 'malloc' in image:
        return 'malloc'
    if 'kernel' in image or 'pthread' in image:
        return 'kernel'
    return 'other'


if len(sys.argv) > 3 and sys.argv[2] == '--inclusive':
    entry, watched = sys.argv[3], sys.argv[4:]

    def within(node, frame):
        up = node['parent']
        while up is not None and up['entry'] is not None and entry in up['entry']:
            if frame in up['symbol']:
                return True
            up = up['parent']
        return False

    roots = [n for n in nodes if n['entry'] and entry in n['entry'] and not (n['parent'] and n['parent']['entry'] and entry in n['parent']['entry'])]
    total = sum(n['count'] for n in roots)
    print(f'{entry}: {total} samples, children included')
    for frame in watched:
        held = sum(n['count'] for n in nodes if n['entry'] and entry in n['entry'] and frame in n['symbol'] and not within(n, frame))
        print(f'  {frame:30} {held:7d}  {100 * held / max(total, 1):5.1f}%')
    sys.exit()

table = defaultdict(lambda: defaultdict(int))
total = 0
for node in nodes:
    own = node['count'] - node['children']
    if own <= 0:
        continue
    total += own
    table[node['entry'] or '(outside napi)'][bucket(node)] += own
cols = ['addon', 'v8', 'malloc', 'jit', 'kernel', 'other']
print(f'main thread self samples: {total}')
print('entry'.ljust(42) + ''.join(c.rjust(8) for c in cols) + 'total'.rjust(8) + '   share')
for entry, row in sorted(table.items(), key=lambda kv: -sum(kv[1].values())):
    n = sum(row.values())
    print(entry[:42].ljust(42) + ''.join(str(row[c]).rjust(8) for c in cols) + str(n).rjust(8) + f'  {100 * n / total:5.1f}%')
sums = {c: sum(row[c] for row in table.values()) for c in cols}
print('all'.ljust(42) + ''.join(str(sums[c]).rjust(8) for c in cols) + str(total).rjust(8))

if len(sys.argv) > 2:
    frames = defaultdict(lambda: defaultdict(int))
    for node in nodes:
        own = node['count'] - node['children']
        if own > 0:
            symbol = re.sub(r'Cs[0-9A-Za-z_]{11}_', '', node['symbol'])
            frames[node['entry'] or '(outside napi)'][(bucket(node), symbol[:110])] += own
    for entry, row in sorted(frames.items(), key=lambda kv: -sum(kv[1].values()))[: int(sys.argv[2])]:
        print(f'\n{entry[:70]}')
        for (b, symbol), n in sorted(row.items(), key=lambda kv: -kv[1])[:9]:
            print(f'  {n:6d} {b:7} {symbol}')
