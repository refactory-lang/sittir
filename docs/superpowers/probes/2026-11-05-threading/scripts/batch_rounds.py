"""Interleaved rounds of the native batch beside serial reference rounds, one process per cell, each row with
the load average when its round began.
   python3 -I batch_rounds.py <checkout> <files.txt> <out.jsonl> [reps=3] [threads=1,2,4,8]

Runs packages/tools/dist/profile/threading/pipeline.js with plain node (NODE_ENV=production, --expose-gc):
first an object-storage batch, which must refuse by name, then per rep serial arena, serial object and the batch
at each thread count. Every row prints its sha against serial arena's of the same rep, its refusals, and the
batch's peak live trees against its thread count."""
import json, os, subprocess, sys

checkout, files, out = sys.argv[1:4]
reps = int(sys.argv[4]) if len(sys.argv) > 4 else 3
threads = [int(t) for t in (sys.argv[5] if len(sys.argv) > 5 else '1,2,4,8').split(',')]
script = os.path.join(checkout, 'packages/tools/dist/profile/threading/pipeline.js')
env = dict(os.environ, NODE_ENV='production')


def run(options):
    r = subprocess.run(['node', '--expose-gc', script, json.dumps(options)], cwd=checkout, env=env, capture_output=True, text=True)
    if r.returncode != 0:
        lines = [l for l in r.stderr.strip().splitlines() if l.strip()]
        return {'error': next((l for l in lines if l.lstrip().startswith('Error')), lines[-1] if lines else f'exit {r.returncode}')[:300]}
    return json.loads(r.stdout)


refusal = run({'storage': 'object', 'files': files, 'warmup': 0, 'rounds': 1, 'limit': 1, 'batchThreads': 2})
print('object storage batch:', refusal.get('error', 'NOT REFUSED'))

cells = [('serial-arena', 'arena', None), ('serial-object', 'object', None)] + [(f'batch-{t}', 'arena', t) for t in threads]
print(f"{'cell':15}{'rep':>4}{'load1':>7}{'ms':>9}{'native ms':>11}{'files':>7}{'refused':>8}{'peak':>6}  sha")
with open(out, 'a') as sink:
    for rep in range(1, reps + 1):
        reference = None
        for cell, storage, t in cells:
            options = {'storage': storage, 'files': files, 'warmup': 1, 'rounds': 1}
            if t is not None:
                options['batchThreads'] = t
            result = run(options)
            result.update(rep=rep, cell=cell)
            sink.write(json.dumps(result) + '\n')
            sink.flush()
            if 'error' in result:
                print(f'{cell:15}{rep:>4}  failed: {result["error"]}')
                continue
            r = result['rounds'][0]
            sha = r['renderedSha256']
            reference = reference or sha
            same = 'same' if sha == reference else f'DIFFERS {sha[:12]}'
            if t is None:
                ms = sum(r['milliseconds'].values())
                native = sum(r['milliseconds'][s] for s in ('parse', 'read', 'render'))
                peak = ''
            else:
                ms = r['milliseconds']['batch']
                native = r['native']['parseMs'] + r['native']['readMs'] + r['native']['renderMs']
                bound = r['peakLiveTrees'] <= t and r['liveTreesAfter'] == r['liveTreesBefore']
                peak = f"{r['peakLiveTrees']}{'' if bound else '!'}"
            print(f"{cell:15}{rep:>4}{r['load'][0]:>7.1f}{ms:>9.0f}{native:>11.0f}{r['files']:>7}{len(r['refused']):>8}{peak:>6}  {sha[:12]} {same}  [{result['loader']}]")
