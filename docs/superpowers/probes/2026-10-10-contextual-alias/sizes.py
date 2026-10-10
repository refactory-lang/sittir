"""Sizes of the rust package's generated outputs: python3 sizes.py <worktree> <out.json>."""
import json, os, sys
wt, out = sys.argv[1], sys.argv[2]
roots = ['packages/rust/src', 'rust/crates/sittir-rust/src']
sizes = {}
for r in roots:
    for dp, _, fs in os.walk(os.path.join(wt, r)):
        for f in fs:
            p = os.path.join(dp, f)
            sizes[os.path.relpath(p, wt)] = os.path.getsize(p)
sizes['packages/rust/native/sittir-rust.darwin-arm64.node'] = os.path.getsize(os.path.join(wt, 'packages/rust/native/sittir-rust.darwin-arm64.node'))
json.dump(sizes, open(out, 'w'), indent=1, sort_keys=True)
print(len(sizes), 'files', sum(v for k, v in sizes.items() if not k.endswith('.node')), 'bytes (sources)')
