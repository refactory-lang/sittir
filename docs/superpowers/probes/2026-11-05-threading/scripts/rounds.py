"""Interleaved rounds of the threading cells, one process per cell, each row with the load average when its
round began and the loader that ran it.
   python3 -I rounds.py <checkout> <files.txt> <out.jsonl> <reps> <cell,...>

A cell is serial-<storage>, batch-<threads> (the native pool, arena only) or pool-<storage>-<workers>
(worker_threads, each running the serial per-file pipeline); a serial or pool cell ending in -release disposes each
file's tree once its render is done, where without it trees go when a collection finalizes them; a pool cell
ending in -path hands out files in path order, 8 to a chunk, where by default the largest go first, in chunks of
at most 8 files or 128 KiB. Any cell ending in -chunkpool runs with SITTIR_CHUNK_POOL=1, which keeps the record
chunks a thread frees for its next trees; its row ends with the chunks reused out of all allocated. Runs packages/tools/dist/profile/threading/pipeline.js
with plain node (NODE_ENV=production, --expose-gc): first an object-storage batch, which must refuse by name, then
every cell once per rep, in order. Each row prints its sha against the rep's first, its refusals, and its peak live
trees (a batch's against its thread count, a pool's per worker) and peak isolate heap per worker."""
import json, os, subprocess, sys

checkout, files, out, reps = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
cells = sys.argv[5].split(',')
script = os.path.join(checkout, 'packages/tools/dist/profile/threading/pipeline.js')
env = dict(os.environ, NODE_ENV='production')


def run(options, extra=None):
    r = subprocess.run(['node', '--expose-gc', script, json.dumps(options)], cwd=checkout, env={**env, **(extra or {})}, capture_output=True, text=True)
    if r.returncode != 0:
        lines = [l for l in r.stderr.strip().splitlines() if l.strip()]
        return {'error': next((l for l in lines if l.lstrip().startswith('Error')), lines[-1] if lines else f'exit {r.returncode}')[:300]}
    return json.loads(r.stdout)


def options_of(cell):
    kind, *rest = cell.split('-')
    base = {'files': files, 'warmup': 1, 'rounds': 1}
    while rest and rest[-1] in ('release', 'path', 'chunkpool'):
        flag = rest.pop()
        if flag == 'release':
            base['release'] = True
        elif flag == 'path':
            base['schedule'] = 'path'
    if kind == 'serial':
        return {**base, 'storage': rest[0]}
    if kind == 'batch':
        return {**base, 'storage': 'arena', 'batchThreads': int(rest[0])}
    if kind == 'pool':
        return {**base, 'storage': rest[0], 'workers': int(rest[1])}
    raise SystemExit(f'unknown cell {cell}')


def row(cell, rep, result, reference):
    r = result['rounds'][0]
    sha = r['renderedSha256']
    same = 'same' if sha == reference else f'DIFFERS {sha[:12]}'
    heap = ''
    if 'threads' in result:
        wall = r['milliseconds']['batch']
        thread = r['native']['parseMs'] + r['native']['readMs'] + r['native']['renderMs']
        bound = r['peakLiveTrees'] <= result['threads'] and r['liveTreesAfter'] == r['liveTreesBefore']
        peak = f"{r['peakLiveTrees']}{'' if bound else '!'}"
    elif 'workers' in result:
        wall = r['wallMs']
        thread = sum(r['milliseconds'].values())
        peak = str(max(w['liveTrees'] for w in r['perWorker']))
        heap = f"{max(w['heapBytes'] for w in r['perWorker']) / 2 ** 20:.0f}"
    else:
        wall = thread = sum(r['milliseconds'].values())
        peak = str(r['peaks']['liveTrees'])
        heap = f"{r['peaks']['heapBytes'] / 2 ** 20:.0f}"
    pool = result.get('chunkPool', {})
    reuse = f"  reuse {pool['reused']:.0f}/{pool['reused'] + pool['fresh']:.0f}" if pool.get('on') and 'reused' in pool else ''
    print(f"{cell:27}{rep:>4}{r['load'][0]:>7.1f}{wall:>9.0f}{thread:>10.0f}{r['files']:>7}{len(r['refused']):>8}{peak:>6}{heap:>6}  {sha[:12]} {same}  [{result['loader']}]{reuse}", flush=True)
    return sha


refusal = run({'storage': 'object', 'files': files, 'warmup': 0, 'rounds': 1, 'limit': 1, 'batchThreads': 2})
print('object storage batch:', refusal.get('error', 'NOT REFUSED'))
print(f"{'cell':27}{'rep':>4}{'load1':>7}{'wall ms':>9}{'thread ms':>10}{'files':>7}{'refused':>8}{'peak':>6}{'MiB':>6}  sha")
with open(out, 'a') as sink:
    for rep in range(1, reps + 1):
        reference = None
        for cell in cells:
            result = run(options_of(cell), {'SITTIR_CHUNK_POOL': '1'} if cell.endswith('-chunkpool') else None)
            result.update(rep=rep, cell=cell)
            sink.write(json.dumps(result) + '\n')
            sink.flush()
            if 'error' in result:
                print(f'{cell:27}{rep:>4}  failed: {result["error"]}', flush=True)
                continue
            reference = reference or result['rounds'][0]['renderedSha256']
            row(cell, rep, result, reference)
