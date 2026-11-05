"""Top self-time frames of a .cpuprofile, with one stack per top frame.

Usage: python3 -I cpuprof_top.py <profile.cpuprofile> [n]
"""
import json
import sys
from collections import defaultdict

p = json.load(open(sys.argv[1]))
n = int(sys.argv[2]) if len(sys.argv) > 2 else 25
nodes = {x['id']: x for x in p['nodes']}
parent = {}
for x in p['nodes']:
    for c in x.get('children', []):
        parent[c] = x['id']
self_ms = defaultdict(float)
for sid, dt in zip(p['samples'], p['timeDeltas']):
    self_ms[sid] += dt / 1000


def label(node_id):
    cf = nodes[node_id]['callFrame']
    return f"{cf['functionName'] or '(anon)'}@{cf['url'].split('/')[-1]}:{cf['lineNumber']}"


agg = defaultdict(float)
example = {}
for sid, ms in self_ms.items():
    key = label(sid)
    agg[key] += ms
    if key not in example or self_ms[example[key]] < ms:
        example[key] = sid
for key, ms in sorted(agg.items(), key=lambda kv: -kv[1])[:n]:
    chain = []
    at = parent.get(example[key])
    while at in nodes and len(chain) < 6:
        chain.append(label(at))
        at = parent.get(at)
    print(f'{ms:8.0f}  {key}\n          <- ' + ' <- '.join(chain))
