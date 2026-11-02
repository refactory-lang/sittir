# Usage: python3 run-profile.py <out-dir> <grammar,...> <name>=<tree>[@<storage>] <name>=<tree>[@<storage>]...
# For every grammar and version, in three rounds of fresh processes (the
# version order rotating by round and reversing on odd rounds), runs
# trajectory.mjs (the corpus worker's batch, with each batch's memory, live
# native trees and garbage collections), then the corpus worker itself under
# --cpu-prof. Writes the trajectories as JSON and the profiles under prof/.
import os, subprocess, sys
from pathlib import Path

here = Path(__file__).resolve().parent
out = Path(sys.argv[1]).resolve()
grammars = sys.argv[2].split(',')
versions = {}
for arg in sys.argv[3:]:
    name, spec = arg.split('=', 1)
    tree, _, storage = spec.partition('@')
    versions[name] = (Path(tree).resolve(), storage or 'object')
names = list(versions)
out.mkdir(parents=True, exist_ok=True)
ROUNDS = 3


def orderOf(index):
    k = index % len(names)
    order = names[k:] + names[:k]
    return order[::-1] if index % 2 else order


def run(label, argv, tree):
    done = subprocess.run(argv, cwd=tree, env=dict(os.environ, NODE_ENV='production'), capture_output=True, text=True)
    print(label, done.returncode, done.stdout.strip()[-200:], flush=True)
    if done.returncode:
        sys.stderr.write(done.stderr)
        raise SystemExit(done.returncode)


for index in range(ROUNDS):
    for grammar in grammars:
        for name in orderOf(index):
            tree, storage = versions[name]
            label = f'{grammar}-{name}-{index}'
            run(f'trajectory {label}', ['node', '--expose-gc', str(here / 'trajectory.mjs'), str(tree), grammar, storage, str(out / f'trajectory-{label}.json')], tree)
            prof = out / 'prof' / label
            prof.mkdir(parents=True, exist_ok=True)
            run(f'profile {label}', ['node', '--cpu-prof', f'--cpu-prof-dir={prof}', str(here.parent / 'corpus-worker.mjs'), str(tree), grammar, str(out / f'worker-{label}.json'), storage], tree)
