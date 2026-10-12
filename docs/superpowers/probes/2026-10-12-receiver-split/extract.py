"""Keep a gen log's evidence: python3 extract.py <gen.log> <diagnostics.txt> <conflicts.txt>.

The repository ignores *.log, so these two files hold what the README cites from a log.
diagnostics.txt: codegen's blocking records (its [error] lines), then the error the run stopped on.
conflicts.txt: the conflict driver's summary, and tree-sitter's warnings about declared conflicts,
each with the sets it lists.
"""
import re, sys

log, diagnostics, conflicts = sys.argv[1:4]
lines = re.sub(r'\x1b\[[0-9;]*m', '', open(log).read()).splitlines()
records = sorted({line for line in lines if line.startswith('[error] ')})
stops = list(dict.fromkeys(line for line in lines if re.match(r'\w*Error: ', line)))
open(diagnostics, 'w').write(''.join(f'{line}\n' for line in records + stops))
kept = []
for i, line in enumerate(lines):
    if re.match(r'\s+conflicts: ', line):
        kept.append(line.strip())
    elif line.startswith('Warning:'):
        kept.append(line)
        for following in lines[i + 1:]:
            if not following.startswith('  `'):
                break
            kept.append(following)
open(conflicts, 'w').write(''.join(f'{line}\n' for line in kept))
