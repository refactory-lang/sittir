# Usage: python3 profile.py <tree> <admitted.json> <out-dir> <seconds> <path>...
# Diagnosis on macOS: where the arena deep read's time goes on the named files
# of one admitted corpus. Runs reference-worker.mjs deep-read over just those
# files twice from <tree>: once timed (10 batches, <out-dir>/timing.json) and
# once under `sample` for <seconds> after a three-second warmup. The call
# graph, demangled with c++filt, is folded under every frame whose symbol
# matches ROOTS (the deep read's native call):
# each frame's self samples (its count less its callees'), summed by symbol,
# and by phase: the first PHASES pattern the frame's name matches, or, for a
# frame CALLERS names (memset, a stub), its nearest other caller's; and
# tree-sitter's own samples by the nearest sittir frame above them. Writes
# <out-dir>/profile.json and profile.md. Set NAPI_RS_NATIVE_LIBRARY_PATH to the
# build's unstripped copy so the addon's symbols are named.
import json, os, re, signal, subprocess, sys, time
from pathlib import Path

here = Path(__file__).resolve().parent
tree, admitted, out = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve(), Path(sys.argv[3]).resolve()
seconds, wanted = int(sys.argv[4]), sys.argv[5:]
ROOTS = {'deep read': r'::parse_records_c_callback$'}
PHASES = [
    ('allocation', r'^_*(malloc|calloc|realloc|free)\b|_xzm_|^xzm_|nanov2_|szone_|_malloc_zone|__rust_(alloc|dealloc|realloc)|raw_vec|RawVec|drop_slow|^ts_(malloc|calloc|realloc|free)'),
    ('caches: lock, hash, Arc', r'hashbrown|HashMap|HashSet|CountedMap|SipHash|Hasher|BuildHasher|RandomState|Mutex|RwLock|parking_lot|lock_contended|unlock_slow|Arc<|pthread_mutex|os_unfair_lock'),
    ('memory accounting', r'heap_bytes|HeapBytes|native_bytes'),
    ('cursor moves', r'^ts_(tree_cursor|node|subtree|language)_|tree_sitter::|goto|descendant|::row_of|::index_of'),
    ('side records: row, span, layout facts', r'trivia|layout|::side::|SideRecord|SideSlot|baseline'),
    ('record and cell writes, patches', r'Hydration>::(draft|embed|cell|list|flag|finish|walk|new)|::place|Draft|Embed|ReadWriter|BuiltChunks|::cell::|Arena>::'),
    ('routing children to slots', r'route|NodeSlots|HydrateSlot|take_held|finish_held|separator_held|SlotValue|read::survey|read::Child|::items|::slot::|try_process'),
    ('dispatch: variant, stamp', r'__variant|variant_of_kind|read::stamp|hydrate_whole|hydrate_into|AnyNode as'),
    ('generated per-kind hydrate bodies (inlined)', r'HydrateNode>::hydrate|hydrate_value'),
]
CALLERS = r'^_platform_mem|^DYLD-STUB|bzero|<deduplicated_symbol>|^_?mem(set|cpy|move|cmp)'
TREE_SITTER = r'^ts_|^<?tree_sitter::'
LINE = re.compile(r'^(?P<lead>[ +!:|]*)(?P<count>\d+) (?P<sym>.*?)(?:  \(in (?P<lib>[^)]*)\))?(?: \+ [\d,.]+)?  \[0x[^\]]*\]\s*$')


def worker(manifest, result, batches):
    return ['node', '--expose-gc', str(here / 'reference-worker.mjs'), str(tree), str(manifest), str(out / result), 'deep-read', str(batches)]


def callGraph(text):
    frames, stack, inside = [], [], False
    for line in text.splitlines():
        if line.startswith('Call graph:'):
            inside = True
            continue
        if inside and (line.startswith('Total number in stack') or line.startswith('Sort by top of stack')):
            break
        match = LINE.match(line) if inside else None
        if not match:
            continue
        depth = len(match['lead'])
        while stack and stack[-1]['depth'] >= depth:
            stack.pop()
        frame = {'depth': depth, 'count': int(match['count']), 'symbol': match['sym'].strip(), 'children': []}
        (stack[-1]['children'] if stack else frames).append(frame)
        stack.append(frame)
    return frames


def phaseOf(symbol):
    return next((name for name, pattern in PHASES if re.search(pattern, symbol)), 'other')


def fold(frames, pattern):
    total, selfBySymbol, phases, treeSitterBySite = 0, {}, {}, {}

    def under(frame, owner, site):
        if not re.search(CALLERS, frame['symbol']):
            owner = frame['symbol']
        if not re.search(TREE_SITTER, frame['symbol']) and not re.search(CALLERS, frame['symbol']):
            site = frame['symbol']
        own = frame['count'] - sum(child['count'] for child in frame['children'])
        selfBySymbol[frame['symbol']] = selfBySymbol.get(frame['symbol'], 0) + own
        phases[phaseOf(owner)] = phases.get(phaseOf(owner), 0) + own
        if re.search(TREE_SITTER, owner):
            treeSitterBySite[site] = treeSitterBySite.get(site, 0) + own
        for child in frame['children']:
            under(child, owner, site)

    def find(frame):
        nonlocal total
        if re.search(pattern, frame['symbol']):
            total += frame['count']
            under(frame, frame['symbol'], frame['symbol'])
            return
        for child in frame['children']:
            find(child)

    for frame in frames:
        find(frame)
    return total, selfBySymbol, phases, treeSitterBySite


short = lambda symbol: re.sub(r'\b(sittir_typescript::render::node|sittir_core::arena::hydrate|sittir_core::arena|sittir_core|alloc::vec|alloc::boxed|core::option)::', '', symbol)
manifest = json.loads(admitted.read_text())
files = [f for f in manifest['files'] if f['path'] in wanted]
assert len(files) == len(wanted), f"not admitted: {sorted(set(wanted) - {f['path'] for f in files})}"
out.mkdir(parents=True, exist_ok=True)
link = out / manifest['name']
if not link.exists():
    link.symlink_to(admitted.parent / manifest['name'])
subset = out / 'files.json'
subset.write_text(json.dumps({**manifest, 'files': files}) + '\n')
env = dict(os.environ, NODE_ENV='production')
subprocess.run(worker(subset, 'timing.json', 10), cwd=tree, env=env, check=True, capture_output=True)
timing = json.loads((out / 'timing.json').read_text())
process = subprocess.Popen(worker(subset, 'sampled.json', 10 ** 9), cwd=tree, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    time.sleep(3)
    subprocess.run(['sample', str(process.pid), str(seconds), '-file', str(out / 'sample.txt')], check=True, capture_output=True)
finally:
    process.send_signal(signal.SIGTERM)
    process.wait()
demangled = subprocess.run(['/usr/bin/c++filt'], input=(out / 'sample.txt').read_text(), capture_output=True, text=True, check=True).stdout
(out / 'sample.demangled.txt').write_text(demangled)
frames = callGraph(demangled)
median = lambda xs: sorted(xs)[len(xs) // 2]
nodes = timing['signature']['visibleNodes']
report = {'files': [f['path'] for f in files], 'bytes': timing['bytes'], 'visibleNodes': nodes, 'buildProfile': timing['buildProfile'], 'cpu': timing['cpu'], 'loadAverage': timing['loadAverage'],
          'nsPerNode': {ph: median([s[ph] for s in timing['samples']]) * 1e6 / nodes for ph in ('wholeReadMs', 'releaseMs')},
          'readBytesPerNode': timing['signature']['readBytes'] / nodes, 'seconds': seconds, 'roots': {}}
for name, pattern in ROOTS.items():
    total, selfBySymbol, phases, treeSitterBySite = fold(frames, pattern)
    top = sorted(selfBySymbol.items(), key=lambda kv: -kv[1])
    report['roots'][name] = {'samples': total, 'phases': dict(sorted(phases.items(), key=lambda kv: -kv[1])),
                             'top': [{'symbol': s, 'samples': c, 'phase': "caller's" if re.search(CALLERS, s) else phaseOf(s)} for s, c in top[:40]],
                             'treeSitterBySite': dict(sorted(treeSitterBySite.items(), key=lambda kv: -kv[1])[:20])}
(out / 'profile.json').write_text(json.dumps(report, indent=1) + '\n')
read = report['roots']['deep read']
lines = [f"## Deep read profile: {', '.join(report['files'])}", '',
         f"{report['visibleNodes']} visible nodes, {report['bytes']} bytes; {report['buildProfile']} build; {report['cpu']}; load {report['loadAverage'][0]:.1f}. Diagnosis only.",
         f"ns per visible node: whole read {report['nsPerNode']['wholeReadMs']:.1f}, release {report['nsPerNode']['releaseMs']:.1f}; the engine's arena holds {report['readBytesPerNode']:.1f} bytes per node.",
         f"Samples in {seconds} s: deep read {read['samples']}.", '',
         '| phase | self samples | share of the deep read |', '|---|---|---|']
lines += [f"| {phase} | {count} | {count / read['samples']:.1%} |" for phase, count in read['phases'].items()]
lines += ['', '| # | symbol (self) | samples | share | phase |', '|---|---|---|---|---|']
lines += [f"| {i} | `{short(t['symbol'])[:140]}` | {t['samples']} | {t['samples'] / read['samples']:.1%} | {t['phase']} |" for i, t in enumerate(read['top'][:20], 1)]
lines += ['', "tree-sitter's own samples in the deep read, by the nearest sittir frame above them:", '', '| sittir frame | samples | share of the deep read |', '|---|---|---|']
lines += [f"| `{short(site)[:140]}` | {count} | {count / read['samples']:.1%} |" for site, count in list(read['treeSitterBySite'].items())[:12]]
markdown = '\n'.join(lines) + '\n'
(out / 'profile.md').write_text(markdown)
sys.stdout.write(markdown)
