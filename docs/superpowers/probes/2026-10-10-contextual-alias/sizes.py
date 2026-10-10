"""Sizes of a grammar package's generated outputs: python3 sizes.py <worktree> <out.json> [grammar]; rust unless named."""
import json, os, sys
wt, out = sys.argv[1], sys.argv[2]
g = sys.argv[3] if len(sys.argv) > 3 else 'rust'
roots = [f'packages/{g}/src', f'rust/crates/sittir-{g}/src']
sizes = {}
for r in roots:
    for dp, _, fs in os.walk(os.path.join(wt, r)):
        for f in fs:
            p = os.path.join(dp, f)
            sizes[os.path.relpath(p, wt)] = os.path.getsize(p)
node = f'packages/{g}/native/sittir-{g}.darwin-arm64.node'
sizes[node] = os.path.getsize(os.path.join(wt, node))
json.dump(sizes, open(out, 'w'), indent=1, sort_keys=True)
print(len(sizes), 'files', sum(v for k, v in sizes.items() if not k.endswith('.node')), 'bytes (sources)')
