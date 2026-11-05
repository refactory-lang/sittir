"""Time oxfmt and oxlint over the probe's file list at several thread counts.

Usage: python3 -I ox.py <bin-dir> <files.txt> <out.json> [reps]
Runs from an empty working directory so no project config is picked up.
"""
import json
import os
import re
import subprocess
import sys
import time

bin_dir, files_path, out_path = sys.argv[1:4]
reps = int(sys.argv[4]) if len(sys.argv) > 4 else 3
files = [line for line in open(files_path).read().split('\n') if line]
cwd = os.path.join(os.path.dirname(out_path), 'oxcwd')
os.makedirs(cwd, exist_ok=True)
threads = [1, 2, 4, 8, os.cpu_count()]
tools = {
    'oxfmt-check': lambda t: [f'{bin_dir}/oxfmt', '--check', f'--threads={t}', *files],
    'oxlint-default': lambda t: [f'{bin_dir}/oxlint', '--silent', f'--threads={t}', *files],
    'oxlint-one-rule': lambda t: [f'{bin_dir}/oxlint', '--silent', f'--threads={t}', '-A', 'all', '-D', 'no-debugger', *files],
}
rows = []
for rep in range(reps):
    for name, command in tools.items():
        for t in threads:
            start = time.perf_counter()
            done = subprocess.run(['/usr/bin/time', '-l', *command(t)], cwd=cwd, capture_output=True, text=True)
            wall = time.perf_counter() - start
            rss = re.search(r'(\d+)\s+maximum resident set size', done.stderr)
            user = re.search(r'([\d.]+) user', done.stderr)
            system = re.search(r'([\d.]+) sys', done.stderr)
            tail = (done.stdout + done.stderr).strip().split('\n')
            rows.append({
                'tool': name,
                'threads': t,
                'rep': rep,
                'wallSeconds': wall,
                'userSeconds': float(user.group(1)) if user else None,
                'sysSeconds': float(system.group(1)) if system else None,
                'peakRssBytes': int(rss.group(1)) if rss else None,
                'exit': done.returncode,
                'summary': [line for line in tail if 'file' in line.lower() or 'finished' in line.lower()][:3],
            })
            print(name, t, rep, f'{wall:.3f}s', done.returncode, flush=True)
json.dump({'files': len(files), 'cpuCount': os.cpu_count(), 'rows': rows}, open(out_path, 'w'), indent=1)
