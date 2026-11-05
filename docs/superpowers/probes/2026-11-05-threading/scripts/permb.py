import json
import sys

r = json.load(sys.stdin)
x = r['rounds'][-1]
mb = x['bytes'] / 1e6
cells = ' '.join(f'{k}={v:.0f}({v / mb:.0f}/MB)' for k, v in x['milliseconds'].items())
print(sys.argv[1], r['storage'], f'{mb:.1f} MB', 'nodes', x['visited'], cells)
