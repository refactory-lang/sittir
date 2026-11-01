# Usage: python3 run.py <out-dir> <name>=<tree> <name>=<tree> [<name>=<tree>...]
# The protocol of docs/reviews/2026-10-29-paired-backends.md over any number of built trees: five
# rounds of every grammar's corpus worker and of the Rust construction timing
# worker, then three rounds of the retained-memory worker. Each round runs every
# tree once in a fresh process; the order rotates by round and reverses on odd
# rounds. Each receipt records the one-minute load beside the process.
import datetime, json, os, subprocess, sys
from pathlib import Path

here = Path(__file__).resolve().parent
out = Path(sys.argv[1]).resolve()
trees = {k: Path(v).resolve() for k, v in (a.split('=', 1) for a in sys.argv[2:])}
names = list(trees)
GRAMMARS = ['python', 'rust', 'typescript', 'regex', 'scm']
out.mkdir(parents=True, exist_ok=True)
receipts = []
start = datetime.datetime.now(datetime.timezone.utc).isoformat()


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def orderOf(index):
    k = index % len(names)
    order = names[k:] + names[:k]
    return order[::-1] if index % 2 else order


def worker(version, phase, index, grammar=None):
    label = f'{phase}-{grammar or "rust"}-{version}-{index}'
    script = here / ('object-corpus-worker.mjs' if grammar else 'object-public-worker.mjs')
    cmd = ['node', '--expose-gc', str(script), str(trees[version]), grammar or phase, str(out / (label + '.json'))]
    load1 = os.getloadavg()[0]
    began = now()
    with (out / (label + '.stdout.txt')).open('w') as so, (out / (label + '.stderr.txt')).open('w') as se:
        run = subprocess.run(cmd, cwd=trees[version], env=dict(os.environ, NODE_ENV='production'), stdout=so, stderr=se)
    receipts.append({'version': version, 'phase': phase, 'round': index, 'grammar': grammar, 'load1': load1, 'start': began, 'end': now(), 'command': cmd, 'exitCode': run.returncode, 'result': label + '.json'})
    (out / 'receipts.json').write_text(json.dumps(receipts, indent=2) + '\n')
    print(label, run.returncode, f'load1={load1:.2f}', flush=True)
    if run.returncode:
        sys.stderr.write((out / (label + '.stderr.txt')).read_text())
        raise SystemExit(run.returncode)


for index in range(5):
    order = orderOf(index)
    for grammar in GRAMMARS:
        for version in order:
            worker(version, 'corpus', index, grammar)
    for version in order:
        worker(version, 'timing', index)
for index in range(3):
    for version in orderOf(index):
        worker(version, 'memory', index)
(out / 'complete.json').write_text(json.dumps({'start': start, 'end': now(), 'workers': len(receipts), 'trees': {k: str(v) for k, v in trees.items()}}, indent=2) + '\n')
