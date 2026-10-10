"""Type-check cost of each variant real.py writes: tsc --extendedDiagnostics --singleThreaded, median of RUNS (7).

usage: python3 cost.py <out dir> <variant>...   (run from a checkout's root, so `pnpm exec tsc` is its TypeScript)
"""
import os, re, statistics, subprocess, sys

out = sys.argv[1]
flags = ['--ignoreConfig', '--noEmit', '--strict', '--target', 'es2022', '--module', 'nodenext', '--moduleResolution', 'nodenext',
         '--allowImportingTsExtensions', '--skipLibCheck', '--extendedDiagnostics', '--singleThreaded']
keys = ['Types', 'Instantiations', 'Memory used', 'Check time']
print('load before', [round(x, 1) for x in os.getloadavg()])
print('| variant | types | instantiations | memory (K) | check (s) |')
print('| --- | --- | --- | --- | --- |')
for variant in sys.argv[2:]:
    runs = []
    for _ in range(int(os.environ.get('RUNS', '7'))):
        text = subprocess.run(['pnpm', 'exec', 'tsc', *flags, f'{out}/{variant}.ts'], capture_output=True, text=True).stdout
        errors = [l for l in text.split('\n') if 'error TS' in l]
        if errors:
            sys.exit(f'{variant}: {errors[:3]}')
        runs.append({k: float(re.search(rf'^{k}:\s+([\d.]+)', text, re.M).group(1)) for k in keys})
    r = {k: statistics.median(x[k] for x in runs) for k in keys}
    print(f"| {variant} | {int(r['Types'])} | {int(r['Instantiations'])} | {int(r['Memory used'])} | {r['Check time']} |")
print('load after', [round(x, 1) for x in os.getloadavg()])
