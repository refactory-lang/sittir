# Usage: python3 -I fetch-corpora.py <out-dir>
# Fetches each repository corpora.json pins, at its pinned commit, into a bare
# repository under <out-dir> and writes the corpus out of its objects: every
# tracked regular .ts, .mts and .cts file outside node_modules, except
# declaration files. Nothing is checked out, installed, built or run from a
# repository; a path that is absolute, climbs out of the corpus or is not a
# regular file is never written. Writes <out-dir>/<name>/<path> for each file
# and <out-dir>/<name>.json (the pin and every file's path, bytes and sha256),
# then removes the bare repository.
import hashlib, json, shutil, subprocess, sys
from pathlib import Path, PurePosixPath

here = Path(__file__).resolve().parent
out = Path(sys.argv[1]).resolve()
out.mkdir(parents=True, exist_ok=True)
SOURCE = ('.ts', '.mts', '.cts')
DECLARATION = ('.d.ts', '.d.mts', '.d.cts')


def git(repo, *args, **kw):
    return subprocess.run(['git', '-C', str(repo), '-c', 'core.hooksPath=/dev/null', *args], check=True, capture_output=True, **kw).stdout


def admitted(path):
    parts = PurePosixPath(path).parts
    return path.endswith(SOURCE) and not path.endswith(DECLARATION) and 'node_modules' not in parts and '..' not in parts and not path.startswith('/')


for pin in json.loads((here / 'corpora.json').read_text()):
    name, commit = pin['name'], pin['commit']
    bare = out / f'{name}.git'
    corpus = out / name
    shutil.rmtree(bare, ignore_errors=True)
    shutil.rmtree(corpus, ignore_errors=True)
    subprocess.run(['git', 'init', '-q', '--bare', str(bare)], check=True)
    git(bare, 'fetch', '-q', '--depth', '1', '--no-tags', pin['url'], commit)
    fetched = git(bare, 'rev-parse', 'FETCH_HEAD').decode().strip()
    assert fetched == commit, f'{name}: fetched {fetched}, pinned {commit}'
    entries = []
    for entry in git(bare, 'ls-tree', '-r', '-z', '--full-tree', commit).split(b'\0'):
        if not entry:
            continue
        meta, path = entry.decode().split('\t', 1)
        mode, kind, sha = meta.split()
        if kind == 'blob' and mode in ('100644', '100755') and admitted(path):
            entries.append((path, sha))
    entries.sort()
    batch = subprocess.run(['git', '-C', str(bare), 'cat-file', '--batch'], input=''.join(f'{sha}\n' for _, sha in entries).encode(), check=True, capture_output=True).stdout
    files = []
    at = 0
    for path, sha in entries:
        header_end = batch.index(b'\n', at)
        got, kind, size = batch[at:header_end].decode().split()
        assert got == sha and kind == 'blob', f'{name} {path}: read {got} {kind}'
        size = int(size)
        data = batch[header_end + 1:header_end + 1 + size]
        at = header_end + 1 + size + 1
        target = corpus.joinpath(*PurePosixPath(path).parts)
        assert target.resolve().is_relative_to(corpus), f'{name} {path}: outside the corpus'
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        files.append({'path': path, 'bytes': size, 'sha256': hashlib.sha256(data).hexdigest()})
    shutil.rmtree(bare)
    manifest = {**pin, 'rule': 'tracked regular .ts, .mts and .cts files outside node_modules, except declaration files', 'files': files}
    (out / f'{name}.json').write_text(json.dumps(manifest, indent=1) + '\n')
    print(f"{name} {commit[:12]}: {len(files)} files, {sum(f['bytes'] for f in files) / 2**20:.2f} MiB", flush=True)
