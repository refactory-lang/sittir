# Usage: python3 run-perf.py <out-dir> <grammar,...> <name>=<tree>[@<storage>] <name>=<tree>[@<storage>]...
# For every grammar and version, in three rounds of fresh processes (the
# version order rotating by round and reversing on odd rounds), runs a fixed
# number of whole-tree reads of the grammar's corpus (whole-read.mjs) under
# perf stat. Round 0 also runs them under perf record with DWARF call graphs
# and, when the runner exposes the counter, under branch-miss sampling. Then
# each version runs a short read once under cachegrind with cache and branch
# simulation: exact instruction, cache-miss and mispredict counts per function. Writes the counters
# (stat-*.csv), the timings (run-*.json), perf and cachegrind report text under
# reports/ and summary.md; the recordings themselves are deleted.
import glob, json, os, shutil, statistics, subprocess, sys
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
(out / 'reports').mkdir(parents=True, exist_ok=True)
ROUNDS = 3
BATCHES = {'regex': 1500, 'scm': 1500}
CG_BATCHES = {'regex': 200, 'scm': 200}
EVENTS = ['task-clock', 'cycles', 'instructions', 'branches', 'branch-misses', 'L1-dcache-loads', 'L1-dcache-load-misses', 'cache-references', 'cache-misses']


def sh(argv, **kw):
    argv = [str(a) for a in argv]
    print('+', ' '.join(argv), flush=True)
    return subprocess.run(argv, **kw)


kernel = os.uname().release
sh(['sudo', 'apt-get', 'update', '-qq'])
if sh(['sudo', 'apt-get', 'install', '-y', '-qq', 'linux-tools-common', f'linux-tools-{kernel}']).returncode:
    sh(['sudo', 'apt-get', 'install', '-y', '-qq', 'linux-tools-common', 'linux-tools-azure', 'linux-tools-generic'], check=True)
perf = (sorted(glob.glob('/usr/lib/linux-tools*/*/perf')) or [shutil.which('perf')])[-1]
sh(['sudo', 'apt-get', 'install', '-y', '-qq', 'valgrind'], check=True)
sh(['sudo', 'sysctl', '-w', 'kernel.perf_event_paranoid=-1', 'kernel.kptr_restrict=0'], check=True)
probe = sh([perf, 'stat', '-x,', '-e', 'branch-misses', 'true'], capture_output=True, text=True)
counters = probe.returncode == 0 and 'not supported' not in probe.stderr and 'not counted' not in probe.stderr
(out / 'perf-env.json').write_text(json.dumps({'kernel': kernel, 'perf': perf, 'counters': counters, 'probe': probe.stderr}, indent=2) + '\n')


def orderOf(index):
    k = index % len(names)
    order = names[k:] + names[:k]
    return order[::-1] if index % 2 else order


def reads(tree, grammar, storage, label, batches=None):
    return ['node', '--perf-basic-prof', here / 'whole-read.mjs', tree, grammar, storage, batches or BATCHES.get(grammar, 300), out / f'run-{label}.json']


def report(data, name, *flags, sort='dso,symbol', limit='0.01'):
    with open(out / 'reports' / name, 'w') as f:
        sh([perf, 'report', '-i', data, '--stdio', '--sort', sort, '--percent-limit', limit, *flags], stdout=f, stderr=subprocess.DEVNULL, check=True)


for index in range(ROUNDS):
    for grammar in grammars:
        for name in orderOf(index):
            tree, storage = versions[name]
            label = f'{grammar}-{name}-{index}'
            sh([perf, 'stat', '-x,', '-o', out / f'stat-{label}.csv', '-e', ','.join(EVENTS), *reads(tree, grammar, storage, label)], cwd=tree, check=True)
            if index:
                continue
            data = out / f'record-{label}.data'
            sh([perf, 'record', '-q', '-F', '499', '--call-graph', 'dwarf,16384', '-o', data, *reads(tree, grammar, storage, f'{label}-record')], cwd=tree, check=True)
            report(data, f'{label}-objects.txt', '--no-children', '-g', 'none', sort='dso', limit='0')
            report(data, f'{label}-self.txt', '--no-children', '-g', 'none')
            report(data, f'{label}-children.txt', '--children', '-g', 'none', limit='0.05')
            report(data, f'{label}-callers.txt', '--no-children', '-g', 'caller,0.5,callee,function,percent', limit='1')
            data.unlink()
            if counters:
                data = out / f'misses-{label}.data'
                sh([perf, 'record', '-q', '-e', 'branch-misses', '-c', '2000', '-o', data, *reads(tree, grammar, storage, f'{label}-misses')], cwd=tree, check=True)
                report(data, f'{label}-branch-misses.txt', '--no-children', '-g', 'none')
                data.unlink()


def annotate(*args, name):
    with open(out / 'reports' / name, 'w') as f:
        for flags in (['--no-annotate', '--threshold=0.01'], ['--threshold=0.01'], []):
            f.seek(0)
            f.truncate()
            if sh(['cg_annotate', '--show=Ir,I1mr,D1mr,D1mw,DLmr,DLmw,Bcm,Bim', '--sort=Ir', *flags, *args], stdout=f, stderr=subprocess.STDOUT).returncode == 0:
                return


def cg_totals(path):
    events = summary = None
    for line in path.read_text().splitlines():
        if line.startswith('events:'):
            events = line.split()[1:]
        elif line.startswith('summary:'):
            summary = [int(x) for x in line.split()[1:]]
    return dict(zip(events or [], summary or []))


cg = {}
for grammar in grammars:
    for name in names:
        tree, storage = versions[name]
        label = f'{grammar}-{name}'
        data = out / f'cg-{label}.out'
        sh(['valgrind', '--tool=cachegrind', '--cache-sim=yes', '--branch-sim=yes', f'--cachegrind-out-file={data}', *reads(tree, grammar, storage, f'{label}-cg', CG_BATCHES.get(grammar, 24))[0:1], *reads(tree, grammar, storage, f'{label}-cg', CG_BATCHES.get(grammar, 24))[2:]], cwd=tree, check=True)
        cg[label] = cg_totals(data)
        annotate(data, name=f'{label}-cg.txt')
    annotate('--diff', out / f'cg-{grammar}-{names[0]}.out', out / f'cg-{grammar}-{names[1]}.out', name=f'{grammar}-cg-diff.txt')
    for name in names:
        subprocess.run(['gzip', '-f', out / f'cg-{grammar}-{name}.out'])
        shutil.move(str(out / f'cg-{grammar}-{name}.out.gz'), out / 'reports' / f'cg-{grammar}-{name}.out.gz')


def counted(label):
    values = {}
    for line in (out / f'stat-{label}.csv').read_text().splitlines():
        parts = line.split(',')
        if len(parts) < 3 or line.startswith('#'):
            continue
        event = parts[2].split(':')[0]
        try:
            values[event] = float(parts[0])
        except ValueError:
            values[event] = None
    return values


base = names[0]
lines = ['## perf: whole-tree reads against base', '', (out.parent / 'build-path.md').read_text().strip(), '', f"perf `{perf}`, kernel {kernel}; hardware counters {'available' if counters else 'not available on this runner'}. Each cell is the median over {ROUNDS} processes of the whole process's count.", '',
         '| grammar | event | ' + ' | '.join(names) + ' | ' + ' | '.join(f'{n}/{base}' for n in names[1:]) + ' |', '|' + '---|' * (1 + 2 * len(names))]
for grammar in grammars:
    for event in EVENTS + ['batch ms']:
        med = {}
        for name in names:
            if event == 'batch ms':
                xs = [json.loads((out / f'run-{grammar}-{name}-{r}.json').read_text())['medianMs'] for r in range(ROUNDS)]
            else:
                xs = [x for x in (counted(f'{grammar}-{name}-{r}').get(event) for r in range(ROUNDS)) if x is not None]
            med[name] = statistics.median(xs) if xs else None
        cells = [f'{med[n]:.5g}' if med[n] is not None else '-' for n in names]
        ratios = [f'{med[n] / med[base]:.3f}' if med[n] and med[base] else '-' for n in names[1:]]
        lines.append(f'| {grammar} | {event} | ' + ' | '.join(cells + ratios) + ' |')
lines += ['', f'### cachegrind: one short read per version ({CG_BATCHES.get("rust", 24)} batches, {CG_BATCHES["regex"]} on regex and scm, a quarter more as warmup)', '',
          '| grammar | event | ' + ' | '.join(names) + ' | ' + ' | '.join(f'{n}/{base}' for n in names[1:]) + ' |', '|' + '---|' * (1 + 2 * len(names))]
for grammar in grammars:
    for event in ['Ir', 'I1mr', 'D1mr', 'D1mw', 'DLmr', 'DLmw', 'Bc', 'Bcm', 'Bi', 'Bim']:
        vals = {n: cg.get(f'{grammar}-{n}', {}).get(event) for n in names}
        cells = [f'{vals[n]:,}' if vals[n] is not None else '-' for n in names]
        ratios = [f'{vals[n] / vals[base]:.3f}' if vals[n] and vals[base] else '-' for n in names[1:]]
        lines.append(f'| {grammar} | {event} | ' + ' | '.join(cells + ratios) + ' |')
markdown = '\n'.join(lines) + '\n'
(out / 'summary.md').write_text(markdown)
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as f:
        f.write(markdown)
sys.stdout.write(markdown)
