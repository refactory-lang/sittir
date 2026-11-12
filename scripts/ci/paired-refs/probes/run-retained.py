# Usage: python3 run-retained.py <out-dir> <grammar,...> <name>=<tree>[@<storage>]...
# What each arena version keeps of a parsed tree's data when its roots are
# dropped without a release (only the garbage collector can free them)
# against when they are released: retained.mjs per grammar, version and
# variant, in a fresh process. Writes retained.md: per grammar, RSS and V8
# external memory after batch 1, 100 and 200 (each batch parses the corpus
# once, then a full GC and finalizer drain), and the growth per 100 batches.
import json, os, subprocess, sys
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
variants = ['dropped', 'released']
out.mkdir(parents=True, exist_ok=True)

lines = [(out.parent / 'build-path.md').read_text().strip(), '']
for grammar in grammars:
    lines += [f'### {grammar}', '', 'MiB after a full GC and finalizer drain; each batch parses the corpus once', '',
              '| version | roots | RSS @1 | RSS @100 | RSS @200 | RSS per 100 batches | external @1 | external @200 | external per 100 batches |',
              '|---|---|---|---|---|---|---|---|---|']
    for name, (tree, storage) in versions.items():
        for variant in variants:
            result = out / f'retained-{grammar}-{name}-{variant}.json'
            env = dict(os.environ, NODE_ENV='production')
            done = subprocess.run(['node', '--expose-gc', str(here / 'retained.mjs'), str(tree), grammar, storage, variant, str(result)], cwd=tree, env=env, capture_output=True, text=True)
            print(grammar, name, variant, done.returncode, done.stdout.strip()[-300:], flush=True)
            if done.returncode:
                sys.stderr.write(done.stderr[-4000:])
                lines.append(f'| {name} | {variant} | failed: exit {done.returncode} | | | | | | |')
                continue
            r = json.loads(result.read_text())
            first, middle, last = r['first'], r['middle'], r['last']
            rss_slope = (last['rss'] - first['rss']) / ((r['batches'] - 1) / 100)
            ext_slope = (last['external'] - first['external']) / ((r['batches'] - 1) / 100)
            lines.append(f'| {name} | {variant} | {first["rss"]:.1f} | {middle["rss"]:.1f} | {last["rss"]:.1f} | {rss_slope:+.1f} | {first["external"]:.1f} | {last["external"]:.1f} | {ext_slope:+.1f} |')
    lines.append('')
(out / 'retained.md').write_text('\n'.join(lines) + '\n')
print('\n'.join(lines))
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
        summary.write('\n'.join(lines) + '\n')
