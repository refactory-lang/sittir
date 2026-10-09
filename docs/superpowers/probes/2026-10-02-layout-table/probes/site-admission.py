#!/usr/bin/env python3
"""Measures: which whitespace arms each spacing site admits today, and which arm
  each site holds by default, per grammar. It reads the generated options
  modules, so it describes the checkout it is pointed at.
Run:    python3 site-admission.py [checkout-root] [grammar...]
        (default: the current directory, all five grammars)
Prints: per grammar, the arm vocabulary with its kind ids; one line per
  distinct allowed-arm set with the number of sites that have it; one line per
  (default arm, strength) with the number of sites.
"""
import collections, sys
from oracle_lib import Sites

root = sys.argv[1] if len(sys.argv) > 1 else '.'
grammars = sys.argv[2:] or ['rust', 'typescript', 'python', 'scm', 'regex']

for g in grammars:
    sites = Sites(root, g)
    print(f'== {g}: {len(sites)} spacing sites; arms ' + ', '.join(f'{a}={sites.arm_name(a)}' for a in sorted(sites.texts)) + f'; indent={sites.indent} dedent={sites.dedent}')
    sets = collections.Counter(tuple(arms) for _, _, _, arms in sites.rows)
    for arms, n in sets.most_common():
        print(f'   {n:5d} sites admit [{", ".join(sites.arm_name(a) for a in arms)}]')
    defaults = collections.Counter((sites.arm_name(arm), strength) for arm, strength in sites.specs)
    for (arm, strength), n in sorted(defaults.items(), key=lambda kv: -kv[1]):
        print(f'   default {arm:8s} strength {strength}: {n}')
