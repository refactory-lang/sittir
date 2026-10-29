import subprocess, json, datetime, os, time
from pathlib import Path
here = Path(__file__).resolve().parent
roots = {'master': here / 'master-7471447a24fe', 'feature': Path('/Users/pmouli/GitHub.nosync/refactory-lang/sittir/scratchpad/wt-2c-census')}
receipts = []
start = datetime.datetime.now(datetime.timezone.utc).isoformat()
def worker(version, phase, round, grammar=None):
    label = f'{phase}-{grammar or "rust"}-{version}-{round}'
    args = [str(roots[version]), grammar, str(here / (label + '.json'))] if grammar else [str(roots[version]), phase, str(here / (label + '.json'))]
    script = here / ('object-corpus-worker.mjs' if grammar else 'object-public-worker.mjs')
    cmd = ['node', '--expose-gc', str(script), *args]
    began = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with (here / (label + '.stdout.txt')).open('w') as out, (here / (label + '.stderr.txt')).open('w') as err:
        run = subprocess.run(cmd, cwd=roots[version], env=dict(os.environ, NODE_ENV='production'), stdout=out, stderr=err)
    receipts.append({'version': version, 'phase': phase, 'round': round, 'grammar': grammar, 'start': began, 'end': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'command': cmd, 'exitCode': run.returncode, 'result': label + '.json'})
    (here / 'object-benchmark-progress.json').write_text(json.dumps({'start': start, 'last': receipts[-1], 'completedWorkers': len(receipts)}, indent=2) + '\n')
    (here / 'object-benchmark-receipts.json').write_text(json.dumps(receipts, indent=2) + '\n')
    print(label, run.returncode, flush=True)
    if run.returncode:
        raise SystemExit(run.returncode)
for round in range(5):
    order = ['master', 'feature'] if round % 2 == 0 else ['feature', 'master']
    for grammar in ['python', 'rust', 'typescript', 'regex', 'scm']:
        for version in order:
            worker(version, 'corpus', round, grammar)
    for version in order:
        worker(version, 'timing', round)
for round in range(3):
    order = ['master', 'feature'] if round % 2 == 0 else ['feature', 'master']
    for version in order:
        worker(version, 'memory', round)
(here / 'object-benchmark-complete.json').write_text(json.dumps({'start': start, 'end': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'workers': len(receipts), 'success': True, 'master': '7471447a24febcdae6f37b025cdb80a12a929209', 'featureBase': '8143ccafaad9a76dc39b37d688b07dfd4cf95b7b', 'featureUncommitted': True}, indent=2) + '\n')
