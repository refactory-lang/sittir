"""Find the conflict sets a mode's split needs: python3 conflicts.py <worktree> <grammar> <out.json>.

Run once configure.py has set the mode and a gen has transpiled the grammar (.sittir/grammar.js).
Runs the worktree's `tree-sitter generate` in packages/<grammar>/.sittir with
SITTIR_SCRATCH_LEAD_CONFLICTS naming out.json, whose sets the prototype's leadGrammar appends to the
grammar's conflicts. Each time generate reports a conflict, the set it suggests is added to out.json
and generate runs again, until it generates, suggests a set a second time, or fails without a
suggestion. Prints each step, then tree-sitter's warnings, which name the declared sets the split
made unnecessary.
"""
import json, os, re, subprocess, sys

wt, grammar, out = sys.argv[1], sys.argv[2], os.path.abspath(sys.argv[3])
sets = json.load(open(out)) if os.path.exists(out) else []
env = dict(os.environ, SITTIR_SCRATCH_LEAD_CONFLICTS=out)
text = ''
for i in range(12):
    json.dump(sets, open(out, 'w'))
    run = subprocess.run([f'{wt}/node_modules/.bin/tree-sitter', 'generate'], cwd=f'{wt}/packages/{grammar}/.sittir', env=env, capture_output=True, text=True)
    text = run.stdout + run.stderr
    if run.returncode == 0:
        print(f'iteration {i}: generates with {len(sets)} added sets')
        print(json.dumps(sets))
        break
    suggestion = re.search(r'Add a conflict for these rules: (.*)', text)
    if not suggestion:
        print(f'iteration {i}: fails without a conflict suggestion:\n{text[-1500:]}')
        break
    new = sorted(re.findall(r'`([^`]+)`', suggestion.group(1)))
    sequence = re.search(r'symbol sequence:\s*\n\s*\n(.*?)\n', text)
    print(f'iteration {i}: add {new} at {sequence.group(1).strip() if sequence else "?"}')
    if new in sets:
        print('suggested twice; stopping')
        break
    sets.append(new)
lines = text.splitlines()
for i, line in enumerate(lines):
    if 'Warning' in line:
        print('\n'.join([line] + [l for l in lines[i + 1:i + 20] if l.startswith('  ')]))
