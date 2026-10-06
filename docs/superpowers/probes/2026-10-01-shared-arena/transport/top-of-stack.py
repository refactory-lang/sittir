"""Summarize the "Sort by top of stack" section of a macOS `sample` file by library.

Idle waits (condition variables, kevent, semaphores, mach messages) are left out, so the
shares are of the busy samples. Usage: python3 top-of-stack.py <sample file> [addon name]
"""
import re, sys
from collections import Counter

path = sys.argv[1]
addon = sys.argv[2] if len(sys.argv) > 2 else '.node'
idle = ('__psynch_cvwait', 'kevent', 'semaphore_wait_trap', 'mach_msg', '__workq_kernreturn', '__semwait_signal', 'poll', '__select')
with open(path) as f:
    text = f.read()
section = text.split('Sort by top of stack', 1)[1]
by_lib, by_sym = Counter(), Counter()
for line in section.splitlines()[1:]:
    m = re.match(r'\s+(.*)\s+\(in ([^)]+)\).*?(\d+)\s*$', line)
    if not m:
        continue
    sym, lib, n = m.group(1).strip(), m.group(2), int(m.group(3))
    if sym.startswith(idle):
        continue
    if lib.startswith('libnode'):
        group = 'node: napi_* calls' if sym.startswith(('napi_', 'node_napi_env', 'v8impl')) else 'node: V8'
    elif addon in lib:
        group = 'addon (sittir + napi-rs)'
    elif 'malloc' in lib:
        group = 'malloc/free'
    elif 'platform' in lib:
        group = 'memmove/strlen (libsystem_platform)'
    else:
        group = lib
    by_lib[group] += n
    by_sym[sym[:90]] += n
total = sum(by_lib.values())
print(f'busy samples: {total}')
for group, n in by_lib.most_common():
    print(f'{100 * n / total:5.1f}%  {group}')
