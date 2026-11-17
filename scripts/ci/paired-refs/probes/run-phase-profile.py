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
# STORAGE=object runs the phase in object storage, where the typed nodes are.
# MEASURE=allocs counts allocations instead of sampling time, for either phase:
# perf record (under sudo, which uprobes need) with uprobes on libc's malloc,
# calloc, realloc, posix_memalign, aligned_alloc and memalign (the arguments by
# register, so the size asked for is recorded), enabled only while a timed
# batch runs the phase, with frame-pointer call chains (none for free, which
# is only counted), and 20 batches: an allocation count needs no more, and
# every event's call chain is recorded and folded. A stack at a function's entry lacks the frame that
# called it, so the frame that called libc is absent. Folding and naming are
# the render profile's. `free` is probed too but only counted: allocations less
# frees in the window is a net, not a pairing (a free of memory from before the
# window counts, and a block still live at its end does not). Each allocation is put in the first bucket of
# alloc-buckets.json (rules in order, each a pattern on a function's name) that
# a frame matches, looking from the allocation outward; the site is the nearest
# sittir function. Writes <phase>-allocs.md: per tree the allocations and bytes
# per batch, per root, and by bucket, native callback, site and function, each
# tree beside the first, and, per tree, <grammar>-<name>.bytes.collapsed.gz
# (the bytes asked for, folded the same way) and the head of perf's output.
# With ALLOC_COUNTER=interposer, a tree's counts are kept folded with its
# commit (<grammar>-<name>.kept.json); REUSE=1 reads a tree's kept counts
# instead of counting it again, so one checkout can hold each tree in turn.
# The interposer sees libc only, so a second run of the same batches samples
# the JavaScript engine's heap (V8_HEAP_INTERVAL bytes between samples,
# default 256): V8 scales each sample to the bytes it stands for, so the
# samples under the phase's own function estimate the phase's heap bytes, with
# a standard error from their count, and attribute them by function and
# package. V8's total_allocated_bytes cannot stand in for them: on node 26 two
# back-to-back reads differ by a median of 112 KB, more than a render batch
# allocates in the heap.
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
# editPhase (edit), or no heap sample's stack reaches the phase's function.
import atexit, gzip, json, math, os, platform, re, shutil, subprocess, sys, tempfile
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
    if tree not in trees.values() or os.environ.get('REUSE') == '1':
        trees[name] = tree
names = list(trees)
out.mkdir(parents=True, exist_ok=True)
PHASE = os.environ.get('PHASE') or 'render'
assert PHASE in ('render', 'edit'), f'PHASE {PHASE} is not render or edit'
STORAGE = os.environ.get('STORAGE') or 'arena'
assert STORAGE in ('arena', 'object'), f'STORAGE {STORAGE} is not arena or object'
MEASURE = os.environ.get('MEASURE') or 'samples'
assert MEASURE in ('samples', 'allocs'), f'MEASURE {MEASURE} is not samples or allocs'
ALLOCS = MEASURE == 'allocs'
ALLOC_COUNTER = os.environ.get('ALLOC_COUNTER') or 'uprobes'
assert ALLOC_COUNTER in ('uprobes', 'interposer'), f'ALLOC_COUNTER {ALLOC_COUNTER} is not uprobes or interposer'
INTERPOSER = ALLOCS and ALLOC_COUNTER == 'interposer'
REUSE = INTERPOSER and os.environ.get('REUSE') == '1'
V8_INTERVAL = int(os.environ.get('V8_HEAP_INTERVAL') or 256)
NATIVE = ALLOCS or PHASE == 'render'
PERF = os.environ.get('PERF', 'perf')
PERF_RECORD = NATIVE and not INTERPOSER
for llvm in (os.environ.get('LLVM_BIN'), '/opt/homebrew/opt/llvm/bin', '/usr/local/opt/llvm/bin'):
    if shutil.which('llvm-symbolizer') is None and llvm and Path(llvm, 'llvm-symbolizer').exists():
        os.environ['PATH'] = f'{llvm}{os.pathsep}{os.environ["PATH"]}'
WARMUP, BATCHES, PER_ENGINE = (10, 20, 50) if ALLOCS else (100, 2000, 50)
PERIOD_NS = 100_000
JS_INTERVAL_US = 50
FRESHNESS = 'packages/codegen/src/scripts/native-binary-freshness.ts'
OUTSIDE = 'outside the addon'
CALLBACK = re.compile(r'_c_callback$')
FRAME = re.compile(r'^\s*[0-9a-f]+ (.+) \(([^()]*)\)$')
OFFSET = re.compile(r'^(.*)\+0x([0-9a-f]+)$')
LEGACY_ESCAPE = re.compile(r'\$(?:SP|BP|RF|LT|GT|LP|RP|C|u[0-9a-f]+)\$')
LEGACY = {'$SP$': '@', '$BP$': '*', '$RF$': '&', '$LT$': '<', '$GT$': '>', '$LP$': '(', '$RP$': ')', '$C$': ','}
ALLOC_FUNCTIONS = ['malloc', 'calloc', 'realloc', 'posix_memalign', 'aligned_alloc', 'memalign']
PROBED = [*ALLOC_FUNCTIONS, 'free']
DECODED = re.compile(r'^<(.+?) as (?:[\w:]*::)?FromNapiValue>::')
EVENT = re.compile(r'^\s*(.+?)\s+(?:\S+:(\w+):\s+)?\([0-9a-f]+\)\s*(.*)$')
INLINE_FRAME = re.compile(r'\s+([0-9a-f]+) (\S+) \(([^()]*)\)$')
SITTIR = re.compile(r'^<?sittir')
BUCKETS = [(rule['bucket'], re.compile(rule['match'])) for rule in json.loads((here / 'alloc-buckets.json').read_text())]
UNMATCHED = 'no bucket matches'
TABLE_FULL = 'not placed: the table was full'
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


def addonCopy(tree, grammar):
    if not INTERPOSER:
        return unstrippedCopy(tree, grammar)
    try:
        return unstrippedCopy(tree, grammar)
    except subprocess.CalledProcessError:
        return None


def unstrippedCopy(tree, grammar):
    script = ('const [root, grammar] = process.argv.slice(1); '
              f'const stamps = await import(`${{root}}/{FRESHNESS}`); '
              'console.log(stamps.unstrippedReleaseBinary(root, grammar, stamps.hostBinaryName(grammar)));')
    found = subprocess.run(['node', '--input-type=module', '-e', script, str(tree), grammar], check=True, stdout=subprocess.PIPE, text=True)
    return Path(found.stdout.strip()).resolve()


def buildCounter():
    node = Path(shutil.which('node')).resolve()
    include = node.parent.parent / 'include' / 'node'
    built = Path(tempfile.mkdtemp(prefix='alloc-count-')) / 'alloc-count.node'
    flags = ['-undefined', 'dynamic_lookup'] if sys.platform == 'darwin' else []
    run(['cc', '-std=c11', '-O2', '-Wall', '-Wextra', '-Werror', '-fPIC', '-shared', *flags, f'-I{include}', '-o', str(built), str(here / 'alloc-count.c')])
    return built


def driverArgv(tree, grammar, receipt):
    return [str(here / 'phase-profile.mjs'), str(tree), grammar, PHASE, str(receipt), str(WARMUP), str(BATCHES), str(PER_ENGINE)]


def heapPass(grammar, name, tree, copy):
    label = f'{grammar}-{name}'
    profile, receipt = out / f'{label}.v8-heap.json', out / f'{label}.v8-heap-receipt.json'
    env = dict(os.environ, NODE_ENV='production', STORAGE=STORAGE, V8_HEAP_PROFILE=str(profile), V8_HEAP_INTERVAL=str(V8_INTERVAL))
    if copy is not None:
        env['NAPI_RS_NATIVE_LIBRARY_PATH'] = str(copy)
    done = subprocess.run(['node', *driverArgv(tree, grammar, receipt)], cwd=tree, env=env, capture_output=True, text=True)
    print(f'{label} (V8 heap)', done.returncode, done.stdout.strip()[-300:], flush=True)
    if done.returncode or not profile.exists():
        sys.stderr.write(done.stderr[-6000:])
        raise SystemExit(done.returncode or 1)
    return json.loads(profile.read_text())


def packageOf(url):
    if not url or url.startswith('node:'):
        return 'node and V8 built-ins'
    if '/scripts/ci/' in url:
        return "the benchmark's own code"
    if '/packages/common/' in url:
        return '@sittir/common: wrap layer and runtime'
    if re.search(r'/packages/[^/]+/(dist|src)/factories/', url):
        return 'generated factories'
    if re.search(r'/packages/[^/]+/(dist|src)/', url):
        return 'generated grammar package'
    if '/node_modules/' in url:
        return 'dependencies'
    return 'other'


def heapAnalysis(heap, tree):
    result = {'phase': heap['phase'], 'bytes': 0, 'samples': 0, 'outside': [0, 0], 'packages': defaultdict(lambda: [0, 0]), 'functions': defaultdict(lambda: [0, 0])}
    for entry in heap['functions']:
        if not entry['inPhase']:
            result['outside'][0] += entry['bytes']
            result['outside'][1] += entry['samples']
            continue
        url = entry['url']
        for root in (f'file://{tree}/', f'file://{checkout}/'):
            url = url.removeprefix(root)
        name = f"{entry['functionName'] or '(anonymous)'} ({url})" if url else (entry['functionName'] or '(anonymous)')
        for table, key in ((result['packages'], packageOf(entry['url'])), (result['functions'], name)):
            table[key][0] += entry['bytes']
            table[key][1] += entry['samples']
        result['bytes'] += entry['bytes']
        result['samples'] += entry['samples']
    return result


def record(grammar, name, tree, copy):
    label = f'{grammar}-{name}'
    receipt = out / f'{label}.json'
    driver = driverArgv(tree, grammar, receipt)
    env = dict(os.environ, NODE_ENV='production', STORAGE=STORAGE)
    with tempfile.TemporaryDirectory() as fifos:
        if INTERPOSER:
            profile = out / f'{label}.allocs.json'
            argv = ['node', *driver]
            preload = 'DYLD_INSERT_LIBRARIES' if sys.platform == 'darwin' else 'LD_PRELOAD'
            env.update({preload: str(COUNTER), 'ALLOC_COUNT': str(COUNTER), 'ALLOC_COUNT_OUT': str(profile)})
            if copy is not None:
                env['NAPI_RS_NATIVE_LIBRARY_PATH'] = str(copy)
        elif NATIVE:
            profile = out / f'{label}.perf.data'
            ctl, ack = Path(fifos) / 'ctl', Path(fifos) / 'ack'
            os.mkfifo(ctl)
            os.mkfifo(ack)
            events = [arg for fn in PROBED for arg in ('-e', f'probe_libc:{fn}' + ('/call-graph=no/' if fn == 'free' else ''))] if ALLOCS else ['-e', 'cpu-clock', '-c', str(PERIOD_NS)]
            argv = [PERF, 'record', *events, '--call-graph', 'fp', '--delay=-1', '--control', f'fifo:{ctl},{ack}', '-o', str(profile), '--',
                    shutil.which('node') if ALLOCS else 'node', '--perf-basic-prof', *driver]
            if ALLOCS:
                argv = ['sudo', '-n', '-E', *argv]
            env.update(NAPI_RS_NATIVE_LIBRARY_PATH=str(copy), PERF_CTL=str(ctl), PERF_ACK=str(ack))
        else:
            profile = out / f'{label}.cpuprofile'
            argv = ['node', *driver]
            env.update(JS_PROFILE=str(profile), JS_PROFILE_INTERVAL_US=str(JS_INTERVAL_US))
        done = subprocess.run(argv, cwd=tree, env=env, capture_output=True, text=True)
    if ALLOCS and not INTERPOSER:
        run(['sudo', '-n', 'chown', '-R', f'{os.getuid()}:{os.getgid()}', str(out)])
    print(label, done.returncode, done.stdout.strip()[-600:], flush=True)
    if done.returncode or not receipt.exists():
        sys.stderr.write(done.stderr[-6000:])
        raise SystemExit(done.returncode or 1)
    facts = json.loads(receipt.read_text())
    if copy is not None and sys.platform == 'linux' and str(copy) not in facts['mapped']:
        failures.append(f'{label}: the process mapped {facts["mapped"]}, not the unstripped copy {copy}')
    return profile, facts


def libcPath():
    for line in Path('/proc/self/maps').read_text().splitlines():
        parts = line.split(maxsplit=5)
        path = parts[5].strip() if len(parts) == 6 else ''
        if re.search(r'/libc(\.so\.6|-[\d.]+\.so)$', path):
            return str(Path(path).resolve())
    raise SystemExit('no libc is mapped into this process')


def installProbes():
    registers = {'aarch64': ('x0', 'x1', 'x2'), 'x86_64': ('di', 'si', 'dx')}[platform.machine()]
    first, second, third = (f'%{r}' for r in registers)
    arguments = {'malloc': f'size={first}', 'calloc': f'nmemb={first} size={second}', 'realloc': f'size={second}',
                 'posix_memalign': f'size={third}', 'aligned_alloc': f'size={second}', 'memalign': f'size={second}', 'free': f'ptr={first}'}
    assert set(arguments) == set(PROBED)
    libc = libcPath()
    subprocess.run(['sudo', '-n', PERF, 'probe', '-x', libc, '-d', 'probe_libc:*'], capture_output=True)
    for function, args in arguments.items():
        run(['sudo', '-n', PERF, 'probe', '-x', libc, '--add', f'{function} {args}'])
    atexit.register(lambda: subprocess.run(['sudo', '-n', PERF, 'probe', '-x', libc, '-d', 'probe_libc:*'], capture_output=True))
    print(f'uprobes on {libc}: {", ".join(arguments)}', flush=True)


def allocKind(symbol):
    name = symbolOffset(symbol)[0].removeprefix('__libc_')
    return 'free' if name == 'cfree' else name


def header(line):
    text = line.rstrip('\n')
    if not ALLOCS:
        return text.strip(), 0, None, []
    event = EVENT.match(text)
    if not event:
        return text.strip(), 0, None, []
    comm, kind, args = event.groups()
    inline = INLINE_FRAME.search(args)
    frames = [(inline[2], inline[3])] if inline else []
    values = {key: int(value, 0) for key, value in re.findall(r'(\w+)=(0x[0-9a-f]+|\d+)', args[:inline.start()] if inline else args)}
    return comm, values.get('nmemb', 1) * values.get('size', 0), kind, frames


def stacks(data, label):
    fields = 'comm,ip,sym,symoff,dso' + (',event,trace' if ALLOCS else '')
    with open(out / f'{label}.perf-script.err', 'w') as errors, open(out / f'{label}.perf-script.head', 'w') as head:
        script = subprocess.Popen([PERF, 'script', '-i', str(data), '-F', fields, '--no-demangle', '--no-inline', '--max-stack', '512'],
                                  stdout=subprocess.PIPE, stderr=errors, text=True, errors='replace')
        counts, weights, kinds, comm, frames, size, kind = Counter(), Counter(), Counter(), None, [], 0, None

        def finish():
            nonlocal kind
            kind = kind or (allocKind(frames[0][0]) if frames else None)
            kinds[kind] += 1
            if kind == 'free':
                return
            counts[(comm, tuple(frames))] += 1
            weights[(comm, tuple(frames))] += size

        for number, line in enumerate(script.stdout):
            if ALLOCS and number < 60:
                head.write(line)
            if not line.strip():
                if comm is not None:
                    finish()
                comm, frames = None, []
            elif not line.startswith('\t'):
                if comm is not None:
                    finish()
                comm, size, kind, frames = header(line)
            elif match := FRAME.match(line.rstrip('\n')):
                frames.append((match[1], match[2]))
        if comm is not None:
            finish()
        if script.wait():
            raise SystemExit(f'perf script exited {script.returncode} on {data}')
    return counts, weights, kinds


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


def interposed(path):
    taken = json.loads(path.read_text())
    frames = {int(ip): frame for ip, frame in taken['frames'].items()}
    counts, weights = Counter(), Counter()
    for stack in taken['stacks']:
        resolved = [frames.get(int(ip), {}) for ip in stack['ips']]
        while resolved and resolved[0].get('image') == str(COUNTER):
            resolved.pop(0)
        key = ('node', tuple((f"{frame['symbol']}+0x{int(frame['symbolOffset']):x}" if 'symbol' in frame else '[unknown]', frame.get('image', '[unknown]'), int(frame['offset']) if 'offset' in frame else None)
                             for frame in resolved))
        counts[key] += int(stack['count'])
        weights[key] += int(stack['bytes'])
    return counts, weights, Counter({kind: int(n) for kind, n in taken['kinds'].items()}), taken['dropped']


def symbolOffset(symoff):
    match = OFFSET.match(symoff)
    return (match[1], int(match[2], 16)) if match else (symoff, 0)


def fold(counts, tree, images, weights=None):
    tables = {}
    for image in images:
        table = {}
        for line in run(['llvm-nm', '--defined-only', '--no-demangle', image]).splitlines():
            parts = line.split(maxsplit=2)
            if len(parts) == 3 and re.fullmatch(r'[0-9a-f]+', parts[0]):
                table.setdefault(parts[2], int(parts[0], 16))
        tables[image] = table

    def address(frame, depth):
        if len(frame) == 3:
            return None if frame[2] is None or frame[1] not in tables else frame[2] - 1
        symbol, offset = symbolOffset(frame[0])
        start = tables.get(frame[1], {}).get(symbol)
        return None if start is None else start + offset - (1 if depth else 0)

    wanted, mangled = defaultdict(set), set()
    for (_, frames) in counts:
        for depth, frame in enumerate(frames):
            symbol = symbolOffset(frame[0])[0]
            if symbol.startswith(('_Z', '_R')):
                mangled.add(symbol)
            if (at := address(frame, depth)) is not None:
                wanted[frame[1]].add(at)
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

    expanded, plain, coverage, expandedWeights = Counter(), Counter(), Counter(), Counter()
    for (comm, frames), count in counts.items():
        leafFirst, perfLeafFirst = [], []
        for depth, frame in enumerate(frames):
            dso = frame[1]
            perfLeafFirst.append(perfName(frame[0], dso))
            names = inlined.get((dso, address(frame, depth)), [])
            leafFirst += [clean(n, tree) for n in names] if names else [perfLeafFirst[-1]]
            if dso in tables:
                coverage['frames'] += count
                coverage['expanded'] += count if names else 0
        expanded[(comm, *reversed(leafFirst))] += count
        expandedWeights[(comm, *reversed(leafFirst))] += (weights or {}).get((comm, frames), 0)
        plain[(comm, *reversed(perfLeafFirst))] += count
    return expanded, plain, coverage, expandedWeights


def readFolded(path):
    folded = Counter()
    with gzip.open(path, 'rt') as f:
        for line in f:
            stack, _, count = line.rstrip('\n').rpartition(' ')
            folded[tuple(stack.split(';'))] += int(count)
    return folded


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


def bucketOf(frames):
    for frame in reversed(frames):
        for bucket, rule in BUCKETS:
            if rule.search(frame):
                return bucket
    return UNMATCHED


def allocAnalysis(folded, weights, kinds):
    result = {'events': 0, 'bytes': 0, 'kinds': kinds, 'buckets': defaultdict(lambda: [0, 0]), 'sites': defaultdict(lambda: [0, 0]),
              'callbacks': defaultdict(lambda: [0, 0]), 'inclusive': defaultdict(lambda: [0, 0]), 'decoded': defaultdict(lambda: [0, 0])}
    for stack, count in folded.items():
        size, frames = weights.get(stack, 0), stack[1:]
        result['events'] += count
        result['bytes'] += size
        at = next((i for i, frame in enumerate(frames) if CALLBACK.search(frame)), None)
        site = next((frame for frame in reversed(frames) if SITTIR.match(frame)), frames[at] if at is not None else OUTSIDE)
        for table, key in ((result['buckets'], bucketOf(frames)), (result['sites'], site), (result['callbacks'], frames[at] if at is not None else OUTSIDE)):
            table[key][0] += count
            table[key][1] += size
        for frame in set(frames):
            result['inclusive'][frame][0] += count
            result['inclusive'][frame][1] += size
        decoded = next((match[1] for frame in reversed(frames) if (match := DECODED.match(frame))), None)
        if decoded:
            result['decoded'][decoded][0] += count
            result['decoded'][decoded][1] += size
    return result


def allocReport(grammar, names, results):
    first = names[0]
    firstFacts, firstAnalysis = results[first][0], results[first][1]
    perRoot = lambda n, facts: f'{n / BATCHES / facts["entries"]:.2f}'
    lines = [f'### {grammar} ({firstFacts["cpu"]}, {firstFacts["entries"]} roots per batch)', '',
             f'| tree | commit | allocations per batch | per root | × {first} | bytes per batch | × {first} | {PHASE} text | reallocs | callocs | aligned | frees per batch (counted, not by site) | allocations less frees, a net per batch |',
             '|---|---|---|---|---|---|---|---|---|---|---|---|---|']
    for name in names:
        facts, analysis, commit = results[name][:3]
        kinds = analysis['kinds']
        lines.append(f'| {name} | `{commit}` | {perBatch(analysis["events"])} | {perRoot(analysis["events"], facts)} | ×{analysis["events"] / max(firstAnalysis["events"], 1):.3f} | '
                     f'{analysis["bytes"] / BATCHES:.0f} | ×{analysis["bytes"] / max(firstAnalysis["bytes"], 1):.3f} | '
                     f'{"same as " + first if facts["texts"] == firstFacts["texts"] else "differs from " + first} | {perBatch(kinds["realloc"])} | {perBatch(kinds["calloc"])} | '
                     f'{perBatch(kinds["posix_memalign"] + kinds["aligned_alloc"] + kinds["memalign"])} | {perBatch(kinds["free"])} | {perBatch(analysis["events"] - kinds["free"])} |')
    lines.append('')
    for name in names:
        if 'names' in results[name][0]:
            lines.append(f'- {name}: native names from {results[name][0]["names"]}.')
        dropped = results[name][1].get('dropped')
        if dropped is not None:
            lines.append(f'- {name}: ' + (f'{perBatch(dropped["count"])} allocations per batch ({dropped["bytes"] / BATCHES:.0f} bytes) found no free slot in the table: they are in the totals and the bucket `{TABLE_FULL}`.'
                                         if dropped['count'] else 'every allocation found a slot in the table.'))
    lines.append('')

    def comparison(heading, key, limit, floor=0):
        tables = {name: results[name][1][key] for name in names}
        keys = sorted({k for table in tables.values() for k in table}, key=lambda k: -max(table[k][0] for table in tables.values() if k in table))
        shown = [k for k in keys if max(table[k][0] for table in tables.values() if k in table) >= floor * max(results[n][1]['events'] for n in names)][:limit]
        header = ' | '.join(f'{name} allocs | {name} share | {name} bytes' for name in names)
        rows = [f'#### {grammar}: {heading}', '', f'Per batch; share is of the tree\'s {PHASE} allocations.', '', f'| | {header} |', '|---|' + '---|---|---|' * len(names)]
        for k in shown:
            cells = []
            for name in names:
                count, size = tables[name].get(k, (0, 0))
                total = max(results[name][1]['events'], 1)
                cells.append(f'{perBatch(count)} | {count / total:.1%} | {size / BATCHES:.0f}' if count else '— | — | —')
            rows.append(f'| {code(k)} | ' + ' | '.join(cells) + ' |')
        return rows + ['']

    lines += comparison('allocations by bucket (the nearest frame to the allocation that a rule of `alloc-buckets.json` names)', 'buckets', 20)
    lines += comparison('allocations by native callback (the stack\'s outermost `*_c_callback` frame)', 'callbacks', 20)
    lines += comparison('allocations under a decode from JavaScript, by the type decoded (the nearest `FromNapiValue` implementor on the stack)', 'decoded', 40)
    lines += comparison('allocations by site (the nearest sittir function to the allocation)', 'sites', 60, 0.002)
    lines += comparison('allocations by function, inclusive (every function on the stack)', 'inclusive', 60, 0.01)
    if INTERPOSER and all('heap' in results[name][1] for name in names):
        lines += heapReport(grammar, names, results)
    return lines


def heapReport(grammar, names, results):
    first = names[0]
    base = results[first][1]['heap']
    phaseName = base['phase']
    lines = [f'#### {grammar}: the JavaScript engine\'s heap', '',
             (f'The inspector\'s sampling heap profiler, in a second run of the same batches: a sample every {V8_INTERVAL} bytes on average, '
              f'objects collected before the window ended kept. V8 scales each sample to the bytes it stands for, so the samples\' sum estimates the bytes allocated; '
              f'± is one standard error of the ratio, from the sample counts (1/√samples per tree). '
              f'Only samples whose stack passes through `{phaseName}` are the phase\'s; the rest are the driver\'s own (the inspector\'s replies, its frames) '
              f'or a sample whose node the profile no longer holds, and are shown apart.'), '',
             f'| tree | bytes per batch | × {first} | samples per batch | not under `{phaseName}`, bytes per batch |', '|---|---|---|---|---|']
    for name in names:
        heap = results[name][1]['heap']
        ratio = heap['bytes'] / base['bytes'] if base['bytes'] else None
        error = f' ±{ratio * math.sqrt(1 / heap["samples"] + 1 / base["samples"]):.3f}' if name != first and ratio and heap['samples'] else ''
        lines.append(f'| {name} | {heap["bytes"] / BATCHES:.0f} | ' + (f'×{ratio:.3f}{error}' if ratio is not None else '—')
                     + f' | {heap["samples"] / BATCHES:.1f} | {heap["outside"][0] / BATCHES:.0f} |')
    lines.append('')

    def table(heading, key, limit):
        tables = {name: results[name][1]['heap'][key] for name in names}
        keys = sorted({k for t in tables.values() for k in t}, key=lambda k: -max(t[k][0] for t in tables.values() if k in t))[:limit]
        rows = [f'#### {grammar}: V8 heap by {heading}', '', 'Sampled bytes and samples per batch.', '',
                '| | ' + ' | '.join(f'{name} bytes | {name} samples' for name in names) + ' |', '|---|' + '---|---|' * len(names)]
        for k in keys:
            rows.append(f'| {code(k)} | ' + ' | '.join(f'{tables[n][k][0] / BATCHES:.0f} | {tables[n][k][1] / BATCHES:.1f}' if k in tables[n] else '— | —' for n in names) + ' |')
        return rows + ['']

    return lines + table('package', 'packages', 10) + table('function', 'functions', 40)


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
if INTERPOSER:
    COUNTER = buildCounter()
    lines += [(f'{STORAGE.capitalize()} {PHASE} allocations ({platform.system()} {platform.machine()}, node {run(["node", "--version"]).strip()}): '
               f'alloc-count.c stands in for libc\'s {", ".join(ALLOC_FUNCTIONS)} and free in the benchmark\'s node process alone, '
               f'counting only on the JavaScript thread between a timed batch\'s start and stop, each allocation placed by its frame-pointer call chain in a fixed table; '
               f'{BATCHES} timed batches after {WARMUP} untimed, a fresh engine every {PER_ENGINE}.'), '',
              ('It sees every libc allocation on that thread, with or without an addon frame, including the native memory JavaScript objects hold: '
               'array buffer backing stores and the addon\'s external chunks are allocated by malloc, so they are in this table, not in the JavaScript engine\'s heap. '
               'It misses the JavaScript engine\'s own heap (objects V8 allocates in its pages) and any private malloc zone. '
               'Bytes are the sizes requested. A free is counted, not placed. Names come from the addon\'s unstripped copy when its build kept one, '
               'with inlined functions expanded where the image carries line tables, else from its symbol table.'), '']
elif ALLOCS:
    installProbes()
    lines += [(f'{STORAGE.capitalize()} {PHASE} allocations: uprobes on libc\'s {", ".join(ALLOC_FUNCTIONS)} ({run([PERF, "--version"]).strip()}), enabled only while a timed batch runs the phase, with frame-pointer call chains '
               f'(the frame that called libc is not in a call chain taken at a function\'s entry); {BATCHES} timed batches after {WARMUP} untimed, a fresh engine every {PER_ENGINE}. '
               f'Inlined functions are expanded from the line tables; generic arguments are dropped. Bytes are the size asked for, not malloc\'s usable size.'), '']
elif NATIVE:
    lines += [(f'Arena render profile ({run([PERF, "--version"]).strip()}): cpu-clock every {PERIOD_NS / 1000:g} µs with frame-pointer call chains, enabled only while a timed batch renders; '
               f'{BATCHES} timed batches after {WARMUP} untimed, a fresh engine every {PER_ENGINE}. Inlined functions are expanded from the line tables; generic arguments are dropped.'), '']
for grammar in grammars:
    results = {}
    for name in names:
        tree = trees[name]
        label = f'{grammar}-{name}'
        kept = out / f'{label}.kept.json'
        dropped = None
        reused = REUSE and kept.exists()
        if reused:
            saved = json.loads(kept.read_text())
            facts, kinds, dropped, commit, heap = saved['facts'], Counter(saved['kinds']), saved['dropped'], saved['commit'], saved.get('heap')
            expanded, expandedWeights = readFolded(out / f'{label}.collapsed.gz'), readFolded(out / f'{label}.bytes.collapsed.gz')
            print(f'{label}: the counts kept from {commit}', flush=True)
            if heap is not None and 'phase' not in heap:
                heap = None
                print(f'{label}: its kept heap samples do not say which are under the phase, so the heap section is left out', flush=True)
        else:
            commit = run(['git', '-C', str(tree), 'rev-parse', '--short=9', 'HEAD']).strip()
            copy = addonCopy(tree, grammar) if NATIVE else None
            facts_names = 'its unstripped copy' if copy is not None else 'the shipped binary, its build stamp naming no current unstripped copy'
            profile, facts = record(grammar, name, tree, copy)
        if INTERPOSER and not reused:
            counts, weights, kinds, dropped = interposed(profile)
            root = str(copy.parent) if copy is not None else str(tree)
            images = sorted({frame[1] for (_, frames) in counts for frame in frames if frame[1].startswith(root)})
            expanded, plain, coverage, expandedWeights = fold(counts, tree, images, weights)
            writeFolded(out / f'{label}.bytes.collapsed.gz', expandedWeights)
            heap = heapPass(grammar, name, tree, copy)
            facts['names'] = facts_names
            kept.write_text(json.dumps({'facts': facts, 'kinds': kinds, 'dropped': dropped, 'commit': commit, 'heap': heap}))
        elif NATIVE and not INTERPOSER:
            images = sorted(str(p.resolve()) for p in copy.parent.iterdir() if p.is_file() and re.search(r'\.node$|\.so(\.|$)', p.name))
            counts, weights, kinds = stacks(profile, label)
            expanded, plain, coverage, expandedWeights = fold(counts, tree, images, weights)
            profile.unlink()
            writeFolded(out / f'{label}.perf.collapsed.gz', plain)
            if ALLOCS:
                writeFolded(out / f'{label}.bytes.collapsed.gz', expandedWeights)
        elif not NATIVE:
            expanded, coverage = jsStacks(profile, tree), None
        writeFolded(out / f'{label}.collapsed.gz', expanded)
        if ALLOCS:
            allocs = allocAnalysis(expanded, expandedWeights, kinds)
            allocs['dropped'] = dropped
            if INTERPOSER and heap is not None:
                allocs['heap'] = heapAnalysis(heap, tree)
                if not allocs['heap']['samples']:
                    failures.append(f"{label}: no heap sample's stack passes through {heap['phase']}; read {label}.v8-heap.json")
            if dropped and dropped['count']:
                allocs['events'] += int(dropped['count'])
                allocs['bytes'] += int(dropped['bytes'])
                allocs['buckets'][TABLE_FULL] = [int(dropped['count']), int(dropped['bytes'])]
            if not allocs['events']:
                failures.append(f'{label}: no allocation was recorded; read {label}.perf-script.head and {label}.perf-script.err')
            elif PHASE == 'render' and not any(CALLBACK.search(frame) for frame in allocs['inclusive']):
                failures.append(f'{label}: no allocation stack reaches a `*_c_callback` frame; read {label}.collapsed.gz')
            results[name] = (facts, allocs, commit)
            continue
        analysis = analyse(expanded)
        compared = analysis if NATIVE else analyse(withoutLines(expanded))
        if NATIVE and not analysis['under']:
            failures.append(f'{label}: no stack reaches a `*_c_callback` frame; read {label}.collapsed.gz')
        if not NATIVE and not any(f.startswith(f'{PHASE}Phase ') for f in analysis['inclusive']):
            failures.append(f'{label}: no stack reaches {PHASE}Phase; read {label}.collapsed.gz')
        results[name] = (facts, analysis, commit, coverage, compared)
    first = names[0]
    firstFacts = results[first][0]
    if ALLOCS:
        lines += allocReport(grammar, names, results)
        continue
    if not NATIVE:
        dropped = ', '.join(f'{n} {results[n][0]["sampling"]["controlSamples"]}' for n in names)
        lines += [(f'Arena {PHASE} profile (node {firstFacts["node"]}, the inspector\'s Profiler): a sample every {JS_INTERVAL_US} µs, the profiler running only while a timed batch runs the phase; '
                   f'{BATCHES} timed batches after {WARMUP} untimed, a fresh engine every {PER_ENGINE}; samples inside the profiler\'s own start and stop are dropped '
                   f'({dropped}). A frame names its function and script; the comparison between trees drops the line.'), '']
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
(out / (f'{PHASE}-allocs.md' if ALLOCS else f'{PHASE}-profile.md')).write_text(markdown)
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
        summary.write(markdown)
print('\n'.join(failures) if failures else f'{PHASE} {"allocation count" if ALLOCS else "profile"} written', flush=True)
if failures:
    raise SystemExit(1)
