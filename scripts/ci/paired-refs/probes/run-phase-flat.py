# Usage: PHASE=<parse|render|edit|built|worker> python3 run-phase-flat.py <out-dir> <grammar,...> <name>=<tree>[@<storage>]...
# Where one phase's time goes on the builds a paired run measures, by shared
# object and symbol: a flat profile, with no call chains, so the addons need
# no frame pointers. Each tree runs phase-profile.mjs once under perf record
# ($PERF, default perf), cpu-clock every PERIOD_NS, the events enabled only
# while a timed batch runs the phase (perf's control fifo), the addon loaded
# from its build's unstripped copy (NAPI_RS_NATIVE_LIBRARY_PATH, the tree's
# unstrippedReleaseBinary) so its symbols are named. Writes <phase>-flat.md:
# per tree the phase's median batch time and its samples per batch; samples
# per batch by shared object; and the symbols holding the most samples, each
# tree beside the first, by the size of the difference. A tree is measured
# once, under the first name given for it, in STORAGE (default arena).
import json, os, re, subprocess, sys, tempfile
from collections import Counter
from pathlib import Path
from phase_trees import namedTrees, unstrippedCopy

here = Path(__file__).resolve().parent
out = Path(sys.argv[1]).resolve()
grammars = sys.argv[2].split(',')
trees = namedTrees(sys.argv[3:])
names = list(trees)
out.mkdir(parents=True, exist_ok=True)
PHASE = os.environ.get('PHASE') or 'render'
STORAGE = os.environ.get('STORAGE') or 'arena'
PERF = os.environ.get('PERF', 'perf')
PERIOD_NS = 100_000
WARMUP, BATCHES = {'worker': (1, 10), 'built': (100, 2000)}.get(PHASE, (100, 2000))
PER_ENGINE = int(os.environ.get('PER_ENGINE') or 50) or WARMUP + BATCHES


def record(grammar, name, tree):
    label = f'{grammar}-{name}'
    receipt, data = out / f'{label}.json', out / f'{label}.perf.data'
    driver = [str(here / 'phase-profile.mjs'), str(tree), grammar, PHASE, str(receipt), str(WARMUP), str(BATCHES), str(PER_ENGINE)]
    copy = unstrippedCopy(tree, grammar)
    with tempfile.TemporaryDirectory() as fifos:
        ctl, ack = Path(fifos) / 'ctl', Path(fifos) / 'ack'
        os.mkfifo(ctl)
        os.mkfifo(ack)
        argv = [PERF, 'record', '-e', 'cpu-clock', '-c', str(PERIOD_NS), '--delay=-1', '--control', f'fifo:{ctl},{ack}', '-o', str(data), '--', 'node', *driver]
        env = dict(os.environ, NODE_ENV='production', STORAGE=STORAGE, NAPI_RS_NATIVE_LIBRARY_PATH=str(copy), PERF_CTL=str(ctl), PERF_ACK=str(ack))
        done = subprocess.run(argv, cwd=tree, env=env, capture_output=True, text=True)
    print(label, done.returncode, done.stdout.strip()[-300:], flush=True)
    if done.returncode or not receipt.exists():
        sys.stderr.write(done.stderr[-6000:])
        raise SystemExit(done.returncode or 1)
    facts = json.loads(receipt.read_text())
    if str(copy) not in facts['mapped']:
        raise SystemExit(f'{label}: the process mapped {facts["mapped"]}, not the unstripped copy {copy}')
    script = subprocess.run([PERF, 'script', '-i', str(data), '-F', 'ip,sym,dso'], check=True, capture_output=True, text=True)
    symbols = selfSamples(script.stdout)
    if not symbols:
        sys.stderr.write(script.stderr[-6000:])
        raise SystemExit(f'{label}: perf script gave no samples from {data}')
    return facts, symbols


SAMPLE = re.compile(r'^\s*[0-9a-f]+\s+(.*) \(([^()]*)\)$')


def selfSamples(script):
    symbols = Counter()
    for line in script.splitlines():
        sample = SAMPLE.match(line)
        if not sample:
            continue
        sym = re.sub(r'::h[0-9a-f]{16}$', '', sample[1].strip())
        symbols[(Path(sample[2]).name or '[unknown]', sym or '[unknown]')] += 1
    return symbols


per = lambda n: f'{n / BATCHES:.2f}'
lines = [f'{STORAGE.capitalize()} {PHASE} flat profile on the builds a paired run measures: cpu-clock every {PERIOD_NS / 1000:g} µs with no call chains, enabled only while a timed batch runs the phase; '
         f'{BATCHES} timed batches after {WARMUP} untimed. Samples are self samples by shared object and symbol.', '']
for grammar in grammars:
    results = {name: record(grammar, name, trees[name]) for name in names}
    first = names[0]
    facts, base = results[first]
    lines += [f'### {grammar} ({facts["cpu"]}, {facts["entries"]} roots per batch)', '',
              f'| tree | {PHASE} ms per batch, median | × {first} | samples per batch | × {first} |', '|---|---|---|---|---|']
    for name in names:
        f, s = results[name]
        lines.append(f'| {name} | {f["phaseMsMedian"]:.3f} | ×{f["phaseMsMedian"] / facts["phaseMsMedian"]:.3f} | {per(sum(s.values()))} | ×{sum(s.values()) / max(sum(base.values()), 1):.3f} |')
    dsos = Counter()
    by = {name: Counter() for name in names}
    for name in names:
        for (dso, _), n in results[name][1].items():
            by[name][dso] += n
            dsos[dso] += n
    lines += ['', 'Samples per batch by shared object:', '', '| shared object | ' + ' | '.join(names) + ' |', '|---|' + '---|' * len(names)]
    lines += [f'| `{dso}` | ' + ' | '.join(per(by[n][dso]) for n in names) + ' |' for dso, _ in dsos.most_common(12)]
    for name in names[1:]:
        other = results[name][1]
        keys = set(base) | set(other)
        rows = sorted(keys, key=lambda k: -abs(other[k] - base[k]))[:60]
        lines += ['', f'#### {grammar}: {name} against {first}, by symbol', '', f'Self samples per batch; rows by the size of the difference.', '',
                  f'| shared object | symbol | {first} | {name} | difference |', '|---|---|---|---|---|']
        lines += [f'| `{dso}` | `{sym.replace("|", chr(92) + "|")}` | {per(base[(dso, sym)])} | {per(other[(dso, sym)])} | {(other[(dso, sym)] - base[(dso, sym)]) / BATCHES:+.2f} |' for dso, sym in rows]
    lines += ['', f'#### {grammar}: {first}, the symbols holding the most samples', '', '| shared object | symbol | per batch | share |', '|---|---|---|---|']
    total = max(sum(base.values()), 1)
    lines += [f'| `{dso}` | `{sym.replace("|", chr(92) + "|")}` | {per(n)} | {n / total:.1%} |' for (dso, sym), n in base.most_common(40)]
    lines.append('')
markdown = '\n'.join(lines) + '\n'
(out / f'{PHASE}-flat.md').write_text(markdown)
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
        summary.write(markdown)
print(markdown, flush=True)
