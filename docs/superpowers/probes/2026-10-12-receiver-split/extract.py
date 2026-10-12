"""Keep a log's evidence in tracked files; the repository ignores *.log.

python3 extract.py gen <gen.log> <diagnostics.txt> <conflicts.txt>
  diagnostics.txt: codegen's blocking records (its [error] lines), then the error the run stopped on
  and the [scratch] warnings of the measurement hooks.
  conflicts.txt: the conflict driver's summary, and tree-sitter's warnings about declared conflicts,
  each with the sets it lists.
python3 extract.py validate <validate.log> <rows.txt>
  rows.txt: the validation rows, the first failures a row lists, and the ratchets that failed.

Paths under the worktree run.sh measured ($WT) print as <worktree>.
"""
import os, re, sys


def lines_of(log):
    text = re.sub(r'\x1b\[[0-9;]*m', '', open(log).read())
    worktree = os.environ.get('WT')
    if worktree:
        text = text.replace(os.path.realpath(worktree), '<worktree>').replace(worktree.rstrip('/'), '<worktree>')
    return text.splitlines()


def write(path, lines):
    open(path, 'w').write(''.join(f'{line}\n' for line in lines))


def gen(log, diagnostics, conflicts):
    lines = lines_of(log)
    records = sorted({line for line in lines if line.startswith('[error] ')})
    stops = list(dict.fromkeys(line for line in lines if re.match(r'\w*Error: ', line) or line.startswith('[scratch] ')))
    write(diagnostics, records + stops)
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
    write(conflicts, kept)


def validate(log, rows):
    write(rows, [line for line in lines_of(log) if 'Pass=' in line or 'first failures' in line or line.startswith('    "') or line.startswith('✗')])


{'gen': gen, 'validate': validate}[sys.argv[1]](*sys.argv[2:])
