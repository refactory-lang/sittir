# Usage: PHASE=<render|edit> python3 run-phase-profile.py <out-dir> <grammar,...> <name>=<tree>[@<storage>]...
# Where one corpus phase's time goes in arena storage, by function, per tree.
# Each tree is profiled once per grammar, under the first name given for it and
# in arena storage whatever its storage suffix: phase-profile.mjs (WARMUP
# untimed batches, then BATCHES timed, a fresh engine every PER_ENGINE), with a
# profiler sampling only while a timed batch runs the phase.
# PHASE=render (the default) samples native frames: perf record ($PERF,
# default perf), cpu-clock every PERIOD_NS, frame-pointer call chains. The addon
# loads from its build's unstripped copy (NAPI_RS_NATIVE_LIBRARY_PATH; the
# tree's own unstrippedReleaseBinary, which holds the copy to its release
# build's stamp), which finds the unstripped engine and std beside it, so their
# frames are named. Each frame in those images is expanded into its inlined
# functions from the line tables (llvm-symbolizer); every name is demangled,
# with Rust hashes, crate disambiguators and generic arguments dropped. Other
# frames keep perf's name (node's demangled by llvm-cxxfilt; JS from
# --perf-basic-prof).
# PHASE=edit samples JavaScript frames: the inspector's Profiler, a sample every
# JS_INTERVAL_US. A frame is its function and its script, relative to the tree
# or this checkout, with the line; the comparison between trees drops the line.
# Writes, per grammar and tree:
#   <grammar>-<name>.json               the driver's receipt
#   <grammar>-<name>.collapsed.gz       folded stacks (render: the thread's name at the root, inlined frames expanded)
#   <grammar>-<name>.perf.collapsed.gz  render: the same with perf's own names, no inlined frames
#   <grammar>-<name>.cpuprofile         edit: the profile, the windows' timelines concatenated
# and <phase>-profile.md: per grammar, each tree's phase milliseconds and
# samples per batch; for render, the samples by native callback (a stack's
# outermost `*_c_callback` frame, else outside the addon) and, per tree and
# callback holding at least 2% of its samples, each function's inclusive and
# self samples under the callback, as a share of it and per batch; for edit,
# each function's inclusive and self samples per tree; and, by function over
# all the phase's samples, every tree's samples per batch against the first's.
# Fails once everything is written if a tree's process did not map its
# unstripped copy or no stack reaches a callback (render), or no stack reaches
# editPhase (edit).
import gzip, json, os, re, subprocess, sys, tempfile
from collections import Counter, defaultdict
from pathlib import Path

here = Path(__file__).resolve().parent
checkout = here.parents[3]
out = Path(sys.argv[1]).resolve()
grammars = sys.argv[2].split(',')
trees = {}
for arg in sys.argv[3:]:
    name, spec = arg.split('=', 1)
    tree = Path(spec.partition('@')[0]).resolve()
    if tree not in trees.values():
        trees[name] = tree
names = list(trees)
out.mkdir(parents=True, exist_ok=True)
PHASE = os.environ.get('PHASE') or 'render'
assert PHASE in ('render', 'edit'), f'PHASE {PHASE} is not render or edit'
NATIVE = PHASE == 'render'
PERF = os.environ.get('PERF', 'perf')
WARMUP, BATCHES, PER_ENGINE = 100, 2000, 50
PERIOD_NS = 100_000
JS_INTERVAL_US = 50
FRESHNESS = 'packages/codegen/src/scripts/native-binary-freshness.ts'
OUTSIDE = 'outside the addon'
CALLBACK = re.compile(r'_c_callback$')
FRAME = re.compile(r'^\s*[0-9a-f]+ (.+) \(([^()]*)\)$')
OFFSET = re.compile(r'^(.*)\+0x([0-9a-f]+)$')
LEGACY_ESCAPE = re.compile(r'\$(?:SP|BP|RF|LT|GT|LP|RP|C|u[0-9a-f]+)\$')
LEGACY = {'$SP$': '@', '$BP$': '*', '$RF$': '&', '$LT$': '<', '$GT$': '>', '$LP$': '(', '$RP$': ')', '$C$': ','}
JS_LINE = re.compile(r':\d+\)$')
failures = []


def run(argv, **kwargs):
    return subprocess.run(argv, check=True, capture_output=True, text=True, **kwargs).stdout


def jsonValues(text):
    decoder, at, values = json.JSONDecoder(), 0, []
    while True:
        while at < len(text) and text[at].isspace():
            at += 1
        if at == len(text):
            return values
        value, at = decoder.raw_decode(text, at)
        values.extend(value if isinstance(value, list) else [value])


def withoutGenerics(name):
    kept, at = [], 0
    while at < len(name):
        if name[at] == '<' and kept and (kept[-1].isalnum() or kept[-1] == '_'):
            depth, at = 1, at + 1
            while at < len(name) and depth:
                if name[at] == '<':
                    depth += 1
                elif name[at] == '>' and name[at - 1] != '-':
                    depth -= 1
                at += 1
            continue
        kept.append(name[at])
        at += 1
    return ''.join(kept)


def clean(name, tree):
    name = name.replace(str(tree), '<tree>')
    if LEGACY_ESCAPE.search(name) or re.search(r'\w\.\.\w', name):
        name = re.sub(r'(^|::)_\$', r'\1$', name)
        for escape, char in LEGACY.items():
            name = name.replace(escape, char)
        name = re.sub(r'\$u([0-9a-f]+)\$', lambda m: chr(int(m[1], 16)), name).replace('..', '::')
    name = re.sub(r'::h[0-9a-f]{16}\b', '', name)
    name = re.sub(r'\[[0-9a-f]+\]', '', name)
    name = re.sub(r'\.llvm\.\d+$', '', name)
    return withoutGenerics(name).replace(';', ':')


def unstrippedCopy(tree, grammar):
    script = ('const [root, grammar] = process.argv.slice(1); '
              f'const stamps = await import(`${{root}}/{FRESHNESS}`); '
              'console.log(stamps.unstrippedReleaseBinary(root, grammar, stamps.hostBinaryName(grammar)));')
    found = subprocess.run(['node', '--input-type=module', '-e', script, str(tree), grammar], check=True, stdout=subprocess.PIPE, text=True)
    return Path(found.stdout.strip()).resolve()


def record(grammar, name, tree, copy):
    label = f'{grammar}-{name}'
    receipt = out / f'{label}.json'
    driver = [str(here / 'phase-profile.mjs'), str(tree), grammar, PHASE, str(receipt), str(WARMUP), str(BATCHES), str(PER_ENGINE)]
    env = dict(os.environ, NODE_ENV='production')
    with tempfile.TemporaryDirectory() as fifos:
        if NATIVE:
            profile = out / f'{label}.perf.data'
            ctl, ack = Path(fifos) / 'ctl', Path(fifos) / 'ack'
            os.mkfifo(ctl)
            os.mkfifo(ack)
            argv = [PERF, 'record', '-e', 'cpu-clock', '-c', str(PERIOD_NS), '--call-graph', 'fp', '--delay=-1', '--control', f'fifo:{ctl},{ack}', '-o', str(profile), '--',
                    'node', '--perf-basic-prof', *driver]
            env.update(NAPI_RS_NATIVE_LIBRARY_PATH=str(copy), PERF_CTL=str(ctl), PERF_ACK=str(ack))
        else:
            profile = out / f'{label}.cpuprofile'
            argv = ['node', *driver]
            env.update(JS_PROFILE=str(profile), JS_PROFILE_INTERVAL_US=str(JS_INTERVAL_US))
        done = subprocess.run(argv, cwd=tree, env=env, capture_output=True, text=True)
    print(label, done.returncode, done.stdout.strip()[-600:], flush=True)
    if done.returncode or not receipt.exists():
        sys.stderr.write(done.stderr[-6000:])
        raise SystemExit(done.returncode or 1)
    facts = json.loads(receipt.read_text())
    if NATIVE and str(copy) not in facts['mapped']:
        failures.append(f'{label}: the process mapped {facts["mapped"]}, not the unstripped copy {copy}')
    return profile, facts


def stacks(data, label):
    with open(out / f'{label}.perf-script.err', 'w') as errors:
        script = subprocess.Popen([PERF, 'script', '-i', str(data), '-F', 'comm,ip,sym,symoff,dso', '--no-demangle', '--no-inline', '--max-stack', '512'],
                                  stdout=subprocess.PIPE, stderr=errors, text=True, errors='replace')
        counts, comm, frames = Counter(), None, []
        for line in script.stdout:
            if not line.strip():
                if comm is not None:
                    counts[(comm, tuple(frames))] += 1
                comm, frames = None, []
            elif comm is None:
                comm = line.strip()
            elif match := FRAME.match(line.rstrip('\n')):
                frames.append((match[1], match[2]))
        if comm is not None:
            counts[(comm, tuple(frames))] += 1
        if script.wait():
            raise SystemExit(f'perf script exited {script.returncode} on {data}')
    return counts


def jsStacks(path, tree):
    profile = json.loads(path.read_text())
    nodes = {node['id']: node for node in profile['nodes']}
    parentOf = {child: node['id'] for node in profile['nodes'] for child in node.get('children', [])}
    roots = [f'file://{tree}/', f'file://{checkout}/']

    def frame(callFrame):
        name, url = callFrame['functionName'] or '(anonymous)', callFrame['url']
        for root in roots:
            url = url.removeprefix(root)
        return (f'{name} ({url}:{callFrame["lineNumber"] + 1})' if url else name).replace(';', ':')

    folded, hits = Counter(), Counter(profile['samples'])
    for node in profile['nodes']:
        stack, at = [], node['id']
        while at in parentOf:
            stack.append(frame(nodes[at]['callFrame']))
            at = parentOf[at]
        if hits[node['id']] and stack:
            folded[tuple(reversed(stack))] += hits[node['id']]
    return folded


def symbolOffset(symoff):
    match = OFFSET.match(symoff)
    return (match[1], int(match[2], 16)) if match else (symoff, 0)


def fold(counts, tree, images):
    tables = {}
    for image in images:
        table = {}
        for line in run(['llvm-nm', '--defined-only', '--no-demangle', image]).splitlines():
            parts = line.split(maxsplit=2)
            if len(parts) == 3 and re.fullmatch(r'[0-9a-f]+', parts[0]):
                table.setdefault(parts[2], int(parts[0], 16))
        tables[image] = table

    def address(symoff, dso, depth):
        symbol, offset = symbolOffset(symoff)
        start = tables.get(dso, {}).get(symbol)
        return None if start is None else start + offset - (1 if depth else 0)

    wanted, mangled = defaultdict(set), set()
    for (_, frames) in counts:
        for depth, (symoff, dso) in enumerate(frames):
            symbol = symbolOffset(symoff)[0]
            if symbol.startswith(('_Z', '_R')):
                mangled.add(symbol)
            if (at := address(symoff, dso, depth)) is not None:
                wanted[dso].add(at)
    order = sorted(mangled)
    demangled = dict(zip(order, run(['llvm-cxxfilt'], input=''.join(f'{s}\n' for s in order)).splitlines())) if order else {}
    inlined = {}
    for dso, addresses in wanted.items():
        addresses = sorted(addresses)
        results = jsonValues(run(['llvm-symbolizer', f'--obj={dso}', '--output-style=JSON', '--inlining', '--demangle', '--functions=linkage'],
                                 input=''.join(f'0x{at:x}\n' for at in addresses)))
        assert len(results) == len(addresses), f'llvm-symbolizer answered {len(results)} of {len(addresses)} addresses in {dso}'
        for at, result in zip(addresses, results):
            inlined[(dso, at)] = [s['FunctionName'] for s in result.get('Symbol', []) if s.get('FunctionName') not in (None, '', '??')]

    def perfName(symoff, dso):
        symbol = symbolOffset(symoff)[0]
        return f'[unknown] {Path(dso).name}' if symbol == '[unknown]' else clean(demangled.get(symbol, symbol), tree)

    expanded, plain, coverage = Counter(), Counter(), Counter()
    for (comm, frames), count in counts.items():
        leafFirst, perfLeafFirst = [], []
        for depth, (symoff, dso) in enumerate(frames):
            perfLeafFirst.append(perfName(symoff, dso))
            names = inlined.get((dso, address(symoff, dso, depth)), [])
            leafFirst += [clean(n, tree) for n in names] if names else [perfLeafFirst[-1]]
            if dso in tables:
                coverage['frames'] += count
                coverage['expanded'] += count if names else 0
        expanded[(comm, *reversed(leafFirst))] += count
        plain[(comm, *reversed(perfLeafFirst))] += count
    return expanded, plain, coverage


def writeFolded(path, folded):
    with gzip.open(path, 'wt') as f:
        for stack, count in sorted(folded.items(), key=lambda kv: -kv[1]):
            f.write(';'.join(stack) + f' {count}\n')


def analyse(folded):
    result = {'total': 0, 'callbacks': Counter(), 'under': {}, 'inclusive': Counter(), 'self': Counter()}
    for stack, count in folded.items():
        result['total'] += count
        for frame in set(stack):
            result['inclusive'][frame] += count
        result['self'][stack[-1]] += count
        at = next((i for i, frame in enumerate(stack) if CALLBACK.search(frame)), None)
        result['callbacks'][stack[at] if at is not None else OUTSIDE] += count
        if at is not None:
            under = result['under'].setdefault(stack[at], {'samples': 0, 'inclusive': Counter(), 'self': Counter()})
            under['samples'] += count
            for frame in set(stack[at:]):
                under['inclusive'][frame] += count
            under['self'][stack[-1]] += count
    return result


def withoutLines(folded):
    result = Counter()
    for stack, count in folded.items():
        result[tuple(JS_LINE.sub(')', frame) for frame in stack)] += count
    return result


def functionTables(heading, intro, inclusive, own, samples):
    rows = [f'#### {heading}', '', f'{intro} Functions by inclusive samples (at least 0.25% of them):', '',
            '| function | inclusive | share | per batch | self | share | per batch |', '|---|---|---|---|---|---|---|']
    for frame, count in [kv for kv in inclusive.most_common() if kv[1] >= 0.0025 * samples][:150]:
        rows.append(f'| {code(frame)} | {count} | {count / samples:.1%} | {perBatch(count)} | {own[frame]} | {own[frame] / samples:.1%} | {perBatch(own[frame])} |')
    rows += ['', 'By self samples:', '', '| function | self | share | per batch |', '|---|---|---|---|']
    rows += [f'| {code(frame)} | {count} | {count / samples:.1%} | {perBatch(count)} |' for frame, count in own.most_common(40)]
    return rows + ['']


code = lambda name: '`' + name.replace('|', '\\|') + '`'
perBatch = lambda n: f'{n / BATCHES:.2f}'
lines = [(out.parent / 'build-path.md').read_text().strip() if (out.parent / 'build-path.md').exists() else '', '']
if NATIVE:
    lines += [f'Arena render profile ({run([PERF, "--version"]).strip()}): cpu-clock every {PERIOD_NS / 1000:g} µs with frame-pointer call chains, enabled only while a timed batch renders; '
              f'{BATCHES} timed batches after {WARMUP} untimed, a fresh engine every {PER_ENGINE}. Inlined functions are expanded from the line tables; generic arguments are dropped.', '']
for grammar in grammars:
    results = {}
    for name in names:
        tree = trees[name]
        label = f'{grammar}-{name}'
        copy = unstrippedCopy(tree, grammar) if NATIVE else None
        profile, facts = record(grammar, name, tree, copy)
        if NATIVE:
            images = sorted(str(p.resolve()) for p in copy.parent.iterdir() if p.is_file() and re.search(r'\.node$|\.so(\.|$)', p.name))
            expanded, plain, coverage = fold(stacks(profile, label), tree, images)
            profile.unlink()
            writeFolded(out / f'{label}.perf.collapsed.gz', plain)
        else:
            expanded, coverage = jsStacks(profile, tree), None
        writeFolded(out / f'{label}.collapsed.gz', expanded)
        analysis = analyse(expanded)
        compared = analysis if NATIVE else analyse(withoutLines(expanded))
        if NATIVE and not analysis['under']:
            failures.append(f'{label}: no stack reaches a `*_c_callback` frame; read {label}.collapsed.gz')
        if not NATIVE and not any(f.startswith(f'{PHASE}Phase ') for f in analysis['inclusive']):
            failures.append(f'{label}: no stack reaches {PHASE}Phase; read {label}.collapsed.gz')
        results[name] = (facts, analysis, run(['git', '-C', str(tree), 'rev-parse', '--short=9', 'HEAD']).strip(), coverage, compared)
    first = names[0]
    firstFacts = results[first][0]
    if not NATIVE:
        dropped = ', '.join(f'{n} {results[n][0]["sampling"]["controlSamples"]}' for n in names)
        lines += [f'Arena {PHASE} profile (node {firstFacts["node"]}, the inspector\'s Profiler): a sample every {JS_INTERVAL_US} µs, the profiler running only while a timed batch runs the phase; '
                  f'{BATCHES} timed batches after {WARMUP} untimed, a fresh engine every {PER_ENGINE}; samples inside the profiler\'s own start and stop are dropped '
                  f'({dropped}). A frame names its function and script; the comparison between trees drops the line.', '']
    native = ' addon frames expanded from line tables | mapped from the tree |' if NATIVE else ''
    lines += [f'### {grammar} ({firstFacts["cpu"]}, {firstFacts["entries"]} roots per batch)', '',
              f'| tree | commit | {PHASE} ms per batch, median | × {first} | {PHASE} samples | per batch | {PHASE} text |{native}',
              '|---|---|---|---|---|---|---|' + ('---|---|' if NATIVE else '')]
    for name in names:
        facts, analysis, commit, coverage, _ = results[name]
        lines.append(f'| {name} | `{commit}` | {facts["phaseMsMedian"]:.3f} | ×{facts["phaseMsMedian"] / firstFacts["phaseMsMedian"]:.3f} | {analysis["total"]} | {perBatch(analysis["total"])} | '
                     f'{"same as " + first if facts["texts"] == firstFacts["texts"] else "differs from " + first} |'
                     + (f' {coverage["expanded"]} of {coverage["frames"]} | {", ".join(Path(p).name for p in facts["mapped"])} |' if NATIVE else ''))
    lines.append('')
    if NATIVE:
        callbacks = sorted({cb for name in names for cb in results[name][1]['callbacks']}, key=lambda cb: -max(results[n][1]['callbacks'][cb] / max(results[n][1]['total'], 1) for n in names))
        lines += ["Render samples by native callback (a stack's outermost `*_c_callback` frame), per batch and as a share of the tree's render samples:", '',
                  '| callback | ' + ' | '.join(names) + ' |', '|---|' + '---|' * len(names)]
        for cb in callbacks:
            cells = [f'{perBatch(results[n][1]["callbacks"][cb])} ({results[n][1]["callbacks"][cb] / max(results[n][1]["total"], 1):.1%})' if results[n][1]['callbacks'][cb] else '—' for n in names]
            lines.append(f'| {cb if cb == OUTSIDE else code(cb)} | ' + ' | '.join(cells) + ' |')
        lines.append('')
    for name in names:
        analysis = results[name][1]
        if not NATIVE:
            lines += functionTables(f'{grammar}, {name}', f'{analysis["total"]} samples, {perBatch(analysis["total"])} per batch.', analysis['inclusive'], analysis['self'], max(analysis['total'], 1))
            continue
        for cb, under in sorted(analysis['under'].items(), key=lambda kv: -kv[1]['samples']):
            if under['samples'] >= 0.02 * analysis['total']:
                samples = under['samples']
                lines += functionTables(f'{grammar}, {name}: {code(cb)}', f'{samples} samples, {perBatch(samples)} per batch, {samples / analysis["total"]:.1%} of the render samples.',
                                        under['inclusive'], under['self'], samples)
    for name in names[1:]:
        a, b = results[first][4], results[name][4]
        frames = set(a['inclusive']) | set(b['inclusive'])
        rows = sorted(frames, key=lambda f: -abs(b['inclusive'][f] - a['inclusive'][f]))[:60]
        lines += [f'#### {grammar}: {name} against {first}, by function over all {PHASE} samples', '',
                  f'Samples per batch; rows by the size of the inclusive difference. All {PHASE} samples: {perBatch(a["total"])} against {perBatch(b["total"])}.', '',
                  f'| function | inclusive {first} | inclusive {name} | difference | self {first} | self {name} | difference |', '|---|---|---|---|---|---|---|']
        for f in rows:
            lines.append(f'| {code(f)} | {perBatch(a["inclusive"][f])} | {perBatch(b["inclusive"][f])} | {(b["inclusive"][f] - a["inclusive"][f]) / BATCHES:+.2f} | '
                         f'{perBatch(a["self"][f])} | {perBatch(b["self"][f])} | {(b["self"][f] - a["self"][f]) / BATCHES:+.2f} |')
        lines.append('')
lines += [f'**Failed:** {failure}' for failure in failures]
markdown = '\n'.join(lines) + '\n'
(out / f'{PHASE}-profile.md').write_text(markdown)
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
        summary.write(markdown)
print('\n'.join(failures) if failures else f'{PHASE} profile written', flush=True)
if failures:
    raise SystemExit(1)
