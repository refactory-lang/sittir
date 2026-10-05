"""Attribute `sample` busy samples inside a stripped addon to functions, using the unstripped
cargo dylib's symbol table (`nm -n`) and the addon's load address from the sample file.
Usage: python3 symbolize.py <sample file> <nm -n output> <addon name>  (demangle with rustfilt/c++filt if wanted)"""
import bisect, re, sys
from collections import Counter
sample, symfile, addon = sys.argv[1:4]
syms = []
for line in open(symfile):
    parts = line.split()
    if len(parts) >= 3 and parts[1] in 'tT':
        syms.append((int(parts[0], 16), parts[2]))
syms.sort()
addrs = [a for a, _ in syms]
text = open(sample).read().split('Sort by top of stack', 1)[1]
hits, total = Counter(), 0
for line in text.splitlines():
    if addon not in line:
        continue
    m = re.search(r'load address (0x[0-9a-f]+) \+ (0x[0-9a-f]+)\s+\[[^\]]+\]\s+(\d+)', line)
    if not m:
        continue
    off, n = int(m.group(2), 16), int(m.group(3))
    i = bisect.bisect_right(addrs, off) - 1
    name = syms[i][1] if i >= 0 else '?'
    hits[name] += n
    total += n
print(f'addon samples: {total}')
for name, n in hits.most_common(15):
    print(f'{100 * n / total:5.1f}%  {name[:140]}')
