# Usage: python3 run.py <out-dir> <tree> <corpora-dir> [<batches>] [<rounds>]
# Rounds of the speed reference over every corpus admit.mjs admitted in
# <corpora-dir>. Each round runs, for each corpus, four fresh processes: sittir
# (built at <tree>) in object and in arena storage, and oxfmt's format(), each
# timing <batches> batches (reference-worker.mjs), and oxlint. The order
# rotates by round and reverses on odd rounds. oxlint runs as its command from
# <tree>'s node_modules, single-threaded, from the corpus directory over the
# admitted files' paths, <batches> times; each run is paired with a run of the
# same command over one empty file from an empty directory, its startup. Each
# oxlint run records its wall time, peak RSS (wait4) and the time oxlint
# reports for itself. When TS_WALK names a built ts-walk binary, each round
# also runs its timing mode (tree-sitter's parse, a TreeCursor walk into flat
# rows and the tree's drop, <batches> passes) as a fifth process, and after
# the rounds its memory mode once per corpus (<corpus>-ts-memory.json). Each
# receipt records the one-minute load beside the process. Defaults: 10
# batches, 5 rounds.
import datetime, json, os, re, subprocess, sys, time
from pathlib import Path

here = Path(__file__).resolve().parent
out = Path(sys.argv[1]).resolve()
tree = Path(sys.argv[2]).resolve()
corpora = Path(sys.argv[3]).resolve()
BATCHES = int(sys.argv[4]) if len(sys.argv) > 4 else 10
ROUNDS = int(sys.argv[5]) if len(sys.argv) > 5 else 5
TS_WALK = os.environ.get('TS_WALK')
TREE_SITTER = re.search(r'^tree-sitter = "=([^"]+)"', (here / 'ts-walk' / 'Cargo.toml').read_text(), re.M).group(1)
TOOLS = ['object', 'arena', 'oxfmt', 'oxlint'] + (['ts-walk'] if TS_WALK else [])
OXLINT_FLAGS = ['--threads=1', '--silent', '--disable-nested-config', '--no-ignore']
out.mkdir(parents=True, exist_ok=True)
empty = out / 'oxlint-empty'
empty.mkdir(exist_ok=True)
(empty / 'empty.ts').write_text('')
env = dict(os.environ, NODE_ENV='production')
node = lambda *args: subprocess.run(['node', *args], check=True, capture_output=True, text=True, cwd=tree, env=env).stdout.strip()
cpu = node('-p', "require('node:os').cpus()[0].model")
nodeVersion = node('--version')
oxlintPackage = json.loads(node('-e', "const r=require('node:module').createRequire(process.cwd()+'/package.json');const p=r.resolve('oxlint/package.json');console.log(JSON.stringify({dir:require('node:path').dirname(p),version:require(p).version}))"))
oxlint = [str(Path(oxlintPackage['dir']) / 'bin' / 'oxlint')]
admitted = sorted(corpora.glob('*.admitted.json'))
assert admitted, f'no admitted corpus in {corpora}'
receipts = []
start = datetime.datetime.now(datetime.timezone.utc).isoformat()
now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
MAXRSS_UNIT = 1 if sys.platform == 'darwin' else 1024
REPORT = re.compile(r'Found (\d+) warnings? and (\d+) errors?\.\s*Finished in ([\d.]+)(ms|s) on (\d+) files? with (\d+) rules')


def orderOf(index):
    k = index % len(TOOLS)
    order = TOOLS[k:] + TOOLS[:k]
    return order[::-1] if index % 2 else order


def timed(command, cwd, label):
    with (out / (label + '.stdout.txt')).open('w') as so, (out / (label + '.stderr.txt')).open('w') as se:
        began = time.perf_counter()
        process = subprocess.Popen(command, cwd=cwd, env=env, stdout=so, stderr=se)
        _, status, usage = os.wait4(process.pid, 0)
        wallMs = (time.perf_counter() - began) * 1000
    text = (out / (label + '.stdout.txt')).read_text() + (out / (label + '.stderr.txt')).read_text()
    report = REPORT.search(text)
    assert report, f'{label}: no oxlint report in {text[-400:]!r}'
    warnings, errors, took, unit, files, rules = report.groups()
    return {'wallMs': wallMs, 'peakRssMB': usage.ru_maxrss * MAXRSS_UNIT / 2**20, 'reportedMs': float(took) * (1000 if unit == 's' else 1), 'files': int(files), 'rules': int(rules), 'warnings': int(warnings), 'errors': int(errors), 'exit': os.waitstatus_to_exitcode(status)}


def runOxlint(manifest, result):
    paths = [f['path'] for f in manifest['files']]
    samples = []
    signature = None
    for i in range(BATCHES):
        lint = timed(['node', *oxlint, *OXLINT_FLAGS, *paths], corpora / manifest['name'], f'{result}-lint-{i}')
        startup = timed(['node', *oxlint, *OXLINT_FLAGS, 'empty.ts'], empty, f'{result}-startup-{i}')
        assert lint['files'] == len(paths), f"oxlint linted {lint['files']} of {len(paths)} files"
        current = {k: lint[k] for k in ('files', 'rules', 'warnings', 'errors', 'exit')}
        assert signature is None or current == signature, f'oxlint changed its report: {current} after {signature}'
        signature = current
        samples.append({'lintMs': lint['wallMs'], 'startupMs': startup['wallMs'], 'reportedMs': lint['reportedMs'], 'peakRssMB': lint['peakRssMB'], 'startupPeakRssMB': startup['peakRssMB']})
    (out / (result + '.json')).write_text(json.dumps({
        'at': now(), 'tree': str(tree), 'tool': 'oxlint', 'version': oxlintPackage['version'], 'corpus': manifest['name'], 'commit': manifest['commit'],
        'files': len(paths), 'bytes': sum(f['bytes'] for f in manifest['files']), 'node': nodeVersion, 'cpu': cpu, 'loadAverage': list(os.getloadavg()),
        'protocol': f"oxlint {' '.join(OXLINT_FLAGS)} over the admitted paths from the corpus directory, each run paired with the same command over one empty file from an empty directory (startup); wall time, peak RSS and oxlint's own reported time per run.",
        'signature': signature, 'samples': samples}, indent=1) + '\n')


def filesOf(manifest):
    listed = out / f"{manifest['name']}.files.txt"
    listed.write_text(''.join(f"{f['path']}\n" for f in manifest['files']))
    return listed


def runTsWalk(mode, manifest, result, *passes):
    command = [TS_WALK, mode, str(corpora / manifest['name']), str(filesOf(manifest)), *passes, str(out / (result + '.json'))]
    with (out / (result + '.stdout.txt')).open('w') as so, (out / (result + '.stderr.txt')).open('w') as se:
        code = subprocess.run(command, env=env, stdout=so, stderr=se).returncode
    if code == 0:
        measured = json.loads((out / (result + '.json')).read_text())
        assert measured['files'] == len(manifest['files']), f"ts-walk read {measured['files']} of {len(manifest['files'])} files"
        (out / (result + '.json')).write_text(json.dumps({
            'at': now(), 'tree': str(tree), 'tool': 'ts-walk', 'version': TREE_SITTER, 'corpus': manifest['name'], 'commit': manifest['commit'],
            'node': nodeVersion, 'cpu': cpu, 'loadAverage': list(os.getloadavg()), **measured}, indent=1) + '\n')
    return command, code


def worker(tool, manifestPath, manifest, index):
    label = f"{manifest['name']}-{tool}-{index}"
    load1 = os.getloadavg()[0]
    began = now()
    if tool == 'oxlint':
        command = ['oxlint', *OXLINT_FLAGS]
        runOxlint(manifest, label)
        code = 0
    elif tool == 'ts-walk':
        command, code = runTsWalk('timing', manifest, label, str(BATCHES))
    else:
        command = ['node', '--expose-gc', str(here / 'reference-worker.mjs'), str(tree), str(manifestPath), str(out / (label + '.json')), tool, str(BATCHES)]
        with (out / (label + '.stdout.txt')).open('w') as so, (out / (label + '.stderr.txt')).open('w') as se:
            code = subprocess.run(command, cwd=tree, env=env, stdout=so, stderr=se).returncode
    receipts.append({'tool': tool, 'corpus': manifest['name'], 'round': index, 'load1': load1, 'start': began, 'end': now(), 'command': command[:6], 'exitCode': code, 'result': label + '.json'})
    (out / 'receipts.json').write_text(json.dumps(receipts, indent=2) + '\n')
    print(label, code, f'load1={load1:.2f}', flush=True)
    if code:
        sys.stderr.write((out / (label + '.stderr.txt')).read_text())
        raise SystemExit(code)


manifests = [(path, json.loads(path.read_text())) for path in admitted]
for index in range(ROUNDS):
    for path, manifest in manifests:
        for tool in orderOf(index):
            worker(tool, path, manifest, index)
if TS_WALK:
    for _, manifest in manifests:
        command, code = runTsWalk('memory', manifest, f"{manifest['name']}-ts-memory")
        print(f"{manifest['name']}-ts-memory", code, flush=True)
        if code:
            sys.stderr.write((out / f"{manifest['name']}-ts-memory.stderr.txt").read_text())
            raise SystemExit(code)
(out / 'complete.json').write_text(json.dumps({'start': start, 'end': now(), 'cpu': cpu, 'node': nodeVersion, 'tree': str(tree), 'batches': BATCHES, 'rounds': ROUNDS, 'workers': len(receipts),
                                               'corpora': [{k: m[k] for k in ('name', 'url', 'commit', 'license')} | {'files': len(m['files']), 'bytes': sum(f['bytes'] for f in m['files']), 'refused': len(m['refused'])} for _, m in manifests]}, indent=2) + '\n')
