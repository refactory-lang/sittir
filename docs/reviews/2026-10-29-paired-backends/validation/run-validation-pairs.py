import subprocess, json, datetime, shutil, os
from pathlib import Path
here = Path(__file__).resolve().parent
feature = Path('/Users/pmouli/GitHub.nosync/refactory-lang/sittir/scratchpad/wt-2c-census')
master = here / 'master-7471447a24fe'
rows = []
def run(name, root, args, expect=0):
    command = ['node', '--import', 'tsx', str(root / 'packages/cli/dist/cli.js'), *args]
    start = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with (here / (name + '.txt')).open('w') as out:
        environment = dict(os.environ, NODE_ENV='production', SITTIR_HISTORY_PATH=str(here / (name + '-history.jsonl')))
        if root == master:
            environment.update(GIT_DIR='/Users/pmouli/Documents/Codex/2026-10-13/task/paired-modes-2026-10-29/master-git-object-view', GIT_WORK_TREE=str(master), GIT_INDEX_FILE=str(here / 'master-pinned.index'))
        p = subprocess.run(command, cwd=root, stdout=out, stderr=subprocess.STDOUT, env=environment)
    rows.append({'name': name, 'start': start, 'end': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'command': command, 'exitCode': p.returncode, 'expectedExitCode': expect})
    (here / 'validation-receipts.json').write_text(json.dumps(rows, indent=2) + '\n')
    print(name, p.returncode, flush=True)
    if p.returncode != expect: raise SystemExit(1)
for name, args in [
    ('refuse-arena-object-cli', ['validate','counts','regex','--node-storage','arena','--construction','object']),
    ('refuse-object-record-cli', ['validate','counts','regex','--node-storage','object','--construction','record']),
    ('refuse-hybrid-benchmark-cli', ['tool','bench-storage','regex','--validation','--construction','object'])
]: run(name, feature, args, expect=1)
report = feature / 'packages/tools/validation-report.json'
if report.exists(): shutil.copy2(report, here / 'validation-feature-before.json')
for name, root, storage in [('validation-master-object', master, 'object'), ('validation-feature-object', feature, 'object'), ('validation-feature-arena', feature, 'arena')]:
    run(name, root, ['validate','counts','python','rust','typescript','regex','scm'] + ([] if name == 'validation-master-object' else ['--node-storage',storage]))
    shutil.copy2(root / 'packages/tools/validation-report.json', here / (name + '.json'))
run('validation-master-object-diff', feature, ['validate','history','--diff',str(here / 'validation-master-object.json'),str(here / 'validation-feature-object.json')])
run('validation-paired-diff', feature, ['validate','history','--diff',str(here / 'validation-feature-object.json'),str(here / 'validation-feature-arena.json')])
run('validation-isolated-arena-regex', feature, ['validate','counts','regex','--node-storage','arena','--isolate'])
shutil.copy2(feature / 'packages/tools/validation-report.json', here / 'validation-isolated-arena-regex.json')
run('paired-profiler-complete-corpus', feature, ['tool','bench-storage','python','rust','typescript','regex','scm','--validation','--rounds','1','--warmup','0','--iterations','1','--output',str(here / 'paired-profiler-complete-corpus.json')])
