# Usage: python3 run-release-profile.py <out-dir> <grammar,...> <name>=<tree>[@<storage>]...
# Where a release's time goes, per grammar and arena version (a version given
# in object storage is profiled as `<name>-arena` in arena storage). Each runs
# release-profile.mjs (every batch released, then a full GC and finalizer
# drain) with the build's unstripped addon (NAPI_RS_NATIVE_LIBRARY_PATH):
#   timing:   no profiler, SECONDS seconds;
#   perf:     `perf record --call-graph dwarf`; each sample is filed under the
#             first root its stack holds (ROOTS: release, parse, gc, other),
#             and a release sample's self symbol is summed by symbol and by
#             CLASSES (first match), by owner (OWNERS: the nearest
#             tree-sitter or sittir frame above the leaf), and every frame
#             under the release callback inclusively; the `perf script`
#             text is kept as perf-script-<grammar>-<version>.txt.gz;
#   strace:   `strace -f -c`, the syscalls by time;
#   cpu-prof: node --cpu-prof, JavaScript self time by function.
# A tool that cannot be installed is skipped and named. Writes
# release-profile.md.
import glob, gzip, json, os, re, shutil, subprocess, sys
from collections import Counter
from pathlib import Path

here = Path(__file__).resolve().parent
out = Path(sys.argv[1]).resolve()
grammars = sys.argv[2].split(',')
given = {}
for arg in sys.argv[3:]:
    name, spec = arg.split('=', 1)
    tree, _, storage = spec.partition('@')
    given[name] = (Path(tree).resolve(), storage or 'object')
versions = {}
for name, (tree, storage) in given.items():
    if storage == 'arena':
        versions[name] = (tree, storage)
    elif f'{name}-arena' not in given:
        versions[f'{name}-arena'] = (tree, 'arena')
out.mkdir(parents=True, exist_ok=True)
SECONDS = 15
ROOTS = [
    ('release', r'(release_parse|release_built|dispose_tree)\w*c_callback'),
    ('parse', r'parse\w*c_callback'),
    ('gc', r'v8::internal::(Heap|Scavenger|MarkCompactCollector|ConcurrentMarking|Sweeper|GCTracer|MinorMarkSweep)'),
]
CLASSES = [
    ('kernel', r'\[kernel\.kallsyms\]|^\[unknown\]$'),
    ('allocator', r'^(_int_free|free|cfree|_int_malloc|malloc|realloc|calloc|malloc_consolidate|systrim|unlink_chunk|munmap|madvise|__munmap|__madvise|tcache)|__rust_(dealloc|alloc|realloc)'),
    ('tree-sitter', r'^ts_'),
    ('drops', r'drop_in_place|<.* as core::ops::drop::Drop>::drop'),
    ('hash', r'hashbrown|HashMap|HashSet|Hasher'),
    ('sittir', r'sittir'),
]


def sh(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True)


def find_perf():
    found = shutil.which('perf')
    if found and sh(f'{found} --version').returncode == 0:
        return found
    sh('sudo apt-get update -qq && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq linux-tools-common linux-tools-generic "linux-tools-$(uname -r)"')
    for candidate in [shutil.which('perf')] + sorted(glob.glob('/usr/lib/linux-tools*/*/perf'), reverse=True):
        if candidate and sh(f'{candidate} --version').returncode == 0:
            return candidate
    return None


def find_strace():
    if not shutil.which('strace'):
        sh('sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq strace')
    return shutil.which('strace')


perf = find_perf()
strace = find_strace()
if perf:
    sh('sudo sysctl -w kernel.perf_event_paranoid=-1 kernel.kptr_restrict=0')
tools = f'perf: {perf or "not available"}; strace: {strace or "not available"}'
print(tools, flush=True)


def env_for(tree, grammar):
    env = dict(os.environ, NODE_ENV='production')
    addons = sorted(glob.glob(str(tree / 'node_modules/.cache/sittir/native-build' / grammar / '*.node')))
    if addons:
        env['NAPI_RS_NATIVE_LIBRARY_PATH'] = addons[0]
    return env, addons[0] if addons else None


def worker(tree, grammar, storage, seconds, result):
    return ['node', '--expose-gc', str(here / 'release-profile.mjs'), str(tree), grammar, storage, str(seconds), str(result)]


def run(label, argv, tree, env):
    done = subprocess.run(argv, cwd=tree, env=env, capture_output=True, text=True)
    print(label, done.returncode, done.stdout.strip()[-300:], flush=True)
    if done.returncode:
        sys.stderr.write(done.stderr[-4000:])
    return done.returncode == 0


OWNERS = [
    ('tree (tree-sitter)', r'^ts_|tree_sitter'),
    ('node data (sittir)', r'sittir'),
]


def fold(script):
    roots, release, classes, owners, inclusive = Counter(), Counter(), Counter(), Counter(), Counter()
    for sample in script.split('\n\n'):
        frames = []
        for line in sample.splitlines()[1:]:
            m = re.match(r'\s+[0-9a-f]+\s+(.*?)\s+\((.*)\)\s*$', line)
            if m:
                sym = re.sub(r'\+0x[0-9a-f]+$', '', m.group(1))
                frames.append((sym, m.group(2)))
        if not frames:
            continue
        root = next((name for name, pattern in ROOTS if any(re.search(pattern, sym) for sym, _ in frames)), 'other')
        roots[root] += 1
        if root != 'release':
            continue
        sym, dso = frames[0]
        label = sym if sym != '[unknown]' else f'[unknown] ({Path(dso).name})'
        release[label] += 1
        kind = next((name for name, pattern in CLASSES if re.search(pattern, sym) or (name == 'kernel' and re.search(pattern, dso))), 'other')
        classes[kind] += 1
        callback = next(i for i, (frame, _) in enumerate(frames) if re.search(ROOTS[0][1], frame))
        below = frames[:callback]
        owner = next((name for frame, _ in below for name, pattern in OWNERS if re.search(pattern, frame)), 'the callback itself')
        owners[(owner, kind)] += 1
        for frame in {frame for frame, _ in below}:
            inclusive[frame] += 1
    return roots, release, classes, owners, inclusive

lines = [(out.parent / 'build-path.md').read_text().strip(), '', tools, '']
for grammar in grammars:
    for name, (tree, storage) in versions.items():
        label = f'{grammar}-{name}'
        env, addon = env_for(tree, grammar)
        lines += [f'### {grammar}, {name} ({storage})', '', f'addon: {addon or "shipped (no unstripped copy found)"}', '']
        timing = out / f'timing-{label}.json'
        if run(f'timing {label}', worker(tree, grammar, storage, SECONDS, timing), tree, env):
            t = json.loads(timing.read_text())
            lines += [f'cpu {t["cpu"]}, {t["batches"]} batches of {t["parsedPerBatch"]} parses: parse {t["parseMs"]:.3f} ms, release {t["releaseMs"]:.3f} ms, full GC + finalizer drain {t["gcMs"]:.3f} ms (medians)', '']
        if perf:
            data = out / f'perf-{label}.data'
            if run(f'perf {label}', [perf, 'record', '-F', '499', '--call-graph', 'dwarf,32768', '-o', str(data), '--'] + worker(tree, grammar, storage, SECONDS, out / f'perf-timing-{label}.json'), tree, env):
                script = subprocess.run([perf, 'script', '-i', str(data), '-F', 'comm,tid,ip,sym,dso', '--no-inline'], capture_output=True, text=True).stdout
                with gzip.open(out / f'perf-script-{label}.txt.gz', 'wt') as kept:
                    kept.write(script)
                roots, release, classes, owners, inclusive = fold(script)
                total = sum(roots.values()) or 1
                lines += ['perf samples by root: ' + ', '.join(f'{k} {v} ({100 * v / total:.1f}%)' for k, v in roots.most_common()), '']
                rtotal = sum(release.values()) or 1
                lines += ['release self samples by class: ' + ', '.join(f'{k} {v} ({100 * v / rtotal:.1f}%)' for k, v in classes.most_common()), '']
                lines += ['release samples by owner (the nearest tree-sitter or sittir frame above the leaf) and leaf class', '', '| owner | leaf class | samples | share |', '|---|---|---|---|']
                lines += [f'| {owner} | {kind} | {count} | {100 * count / rtotal:.1f}% |' for (owner, kind), count in owners.most_common()]
                lines += ['', '| frame under the release callback (inclusive) | samples | share |', '|---|---|---|']
                lines += [f'| `{sym[:140]}` | {count} | {100 * count / rtotal:.1f}% |' for sym, count in inclusive.most_common(30)]
                lines += ['', '| release self symbol | samples | share |', '|---|---|---|']
                lines += [f'| `{sym[:140]}` | {count} | {100 * count / rtotal:.1f}% |' for sym, count in release.most_common(20)]
                lines.append('')
                data.unlink(missing_ok=True)
        if strace:
            trace = out / f'strace-{label}.txt'
            if run(f'strace {label}', [strace, '-f', '-c', '-o', str(trace)] + worker(tree, grammar, storage, 5, out / f'strace-timing-{label}.json'), tree, env):
                text = trace.read_text().splitlines()
                lines += ['strace -f -c (5 s):', '', '```'] + text[:22] + ['```', '']
        prof = out / 'cpu-prof' / label
        prof.mkdir(parents=True, exist_ok=True)
        if run(f'cpu-prof {label}', ['node', '--expose-gc', '--cpu-prof', f'--cpu-prof-dir={prof}'] + worker(tree, grammar, storage, SECONDS, out / f'cpu-timing-{label}.json')[2:], tree, env):
            for file in prof.glob('*.cpuprofile'):
                profile = json.loads(file.read_text())
                interval = (profile['endTime'] - profile['startTime']) / max(len(profile['samples']), 1) / 1000
                selfs = Counter()
                for node in profile['nodes']:
                    frame = node['callFrame']
                    selfs[f'{frame["functionName"] or "(anonymous)"} {Path(frame["url"]).name}:{frame["lineNumber"] + 1}'] += node.get('hitCount', 0)
                lines += ['JavaScript self time (cpu-prof), top 15:', '', '| function | ms |', '|---|---|']
                lines += [f'| `{fn[:120]}` | {count * interval:.0f} |' for fn, count in selfs.most_common(15)]
                lines.append('')
(out / 'release-profile.md').write_text('\n'.join(lines) + '\n')
print('\n'.join(lines))
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
        summary.write('\n'.join(lines) + '\n')
