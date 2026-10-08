#!/usr/bin/env python3
"""Lists: the spacing sites the seam oracle saw at an inline gap in a root
  render that reparses cleanly. These are the sites a forced line break can
  be tried at (forced-run.sh).
Run:    python3 forced-sites.py <records.jsonl> > <sites-file>
Prints: one site id per line, ascending.
"""
import sys
from oracle_lib import inline_observations

print('\n'.join(str(site) for site in sorted(inline_observations(sys.argv[1], []))))
