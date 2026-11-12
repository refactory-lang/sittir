# Usage: python3 summarize.py <out.md> <run-dir>...
# Reads each run directory run.py wrote (one per copy of the job, each on its
# own runner), groups every process by its CPU model and reports, per CPU and
# corpus:
# - sittir's parse, render, edit and whole-tree read in object and arena
#   storage, oxfmt's format() and oxlint net of its startup, each in MB/s:
#   the admitted source bytes (10^6 bytes) over the median of the process
#   medians;
# - sittir's time over each tool's on the same bytes (xN: sittir takes N
#   times as long), the median of the per-round ratios of process medians,
#   each round within one copy, with a seeded bootstrap 95% range;
# - oxlint's startup and its own reported time, and each tool's peak RSS;
# - the arena whole read's native calls alone (deep-read): the parse, the
#   deep read and the release per visible node, the native bytes the read
#   adds per node, and the read over tree-sitter's parse and over the arena
#   whole read, paired by round.
# Writes <out.md> and summary.json beside it, appends the Markdown to
# $GITHUB_STEP_SUMMARY when it is set, and exits 1 when a corpus renders or
# edits differently in object and arena storage or between copies, a tool's
# output changes between processes, or deep-read and ts-walk count different
# visible nodes.
import json, os, random, statistics, sys
from pathlib import Path

target = Path(sys.argv[1]).resolve()
dirs = [Path(d).resolve() for d in sys.argv[2:]]
median = statistics.median
PHASES = [('parseMs', 'parse'), ('renderMs', 'render'), ('editMs', 'edit'), ('wholeReadMs', 'whole read')]
STORAGES = ['object', 'arena']
TOOLS = ['oxfmt', 'oxlint']


def interval(values, seed=20261106):
    rng = random.Random(seed)
    draws = sorted(median(rng.choices(values, k=len(values))) for _ in range(5000))
    return [draws[int(.025 * len(draws))], draws[int(.975 * len(draws))]]


def processMs(result, phase=None):
    if result['tool'] == 'oxlint':
        return median(s['lintMs'] for s in result['samples']) - median(s['startupMs'] for s in result['samples'])
    return median(s['formatMs' if result['tool'] == 'oxfmt' else phase] for s in result['samples'])


toolOf = lambda result: result.get('nodeStorage') or result['tool']
rows = {}
mismatches = []
signatures = {}
versions = {}
for copy, d in enumerate(dirs):
    runs = d / 'runs'
    for receipt in json.loads((runs / 'receipts.json').read_text()):
        result = json.loads((runs / receipt['result']).read_text())
        tool = toolOf(result)
        key = (result['cpu'], result['corpus'])
        row = rows.setdefault(key, {'commit': result['commit'], 'files': result['files'], 'bytes': result['bytes'], 'processes': {}, 'copies': set()})
        assert (row['files'], row['bytes'], row['commit']) == (result['files'], result['bytes'], result['commit']), f'{key}: corpus differs between copies'
        row['copies'].add(copy)
        row['processes'].setdefault(tool, {})[(copy, receipt['round'])] = result
        sig = {k: v for k, v in result['signature'].items()}
        family = 'sittir' if tool in STORAGES else tool
        signatures.setdefault((result['corpus'], family), []).append((copy, receipt['round'], tool, sig))
        versions[tool] = result.get('version') or result.get('buildProfile')
        versions['node'] = result['node']
        if tool in STORAGES and result.get('rendersDifferingFromSource'):
            mismatches.append(f"{result['corpus']} {tool}: {result['rendersDifferingFromSource']} unedited renders differ from their source")
for (corpus, family), sigs in signatures.items():
    first = sigs[0][3]
    mismatches += [f'{corpus} {tool} copy {c} round {r}: output differs from copy {sigs[0][0]} round {sigs[0][1]}' for c, r, tool, sig in sigs if sig != first]


def column(row, tool, phase=None):
    return median(processMs(x, phase) for x in row['processes'][tool].values())


def pairedRatio(row, num, numPhase, den, denPhase=None):
    procs = row['processes']
    paired = [processMs(x, numPhase) / processMs(procs[den][k], denPhase) for k, x in procs[num].items() if k in procs.get(den, {})]
    return {'ratio': median(paired), 'range95': interval(paired), 'rounds': len(paired)}


def ratio(row, storage, phase, tool):
    return pairedRatio(row, storage, phase, tool)


mbps = lambda row, ms: row['bytes'] / 1e6 / (ms / 1000)
summary = []
for (cpu, corpus), row in sorted(rows.items()):
    entry = {'cpu': cpu, 'corpus': corpus, 'commit': row['commit'], 'files': row['files'], 'bytes': row['bytes'], 'copies': len(row['copies']),
             'ms': {}, 'mbps': {}, 'ratios': {}, 'peakRssMB': {}}
    for storage in STORAGES:
        for phase, _ in PHASES:
            ms = column(row, storage, phase)
            entry['ms'][f'{storage} {phase}'] = ms
            entry['mbps'][f'{storage} {phase}'] = mbps(row, ms)
            for tool in TOOLS:
                entry['ratios'][f'{storage} {phase} / {tool}'] = ratio(row, storage, phase, tool)
    for tool in TOOLS:
        ms = column(row, tool)
        entry['ms'][tool] = ms
        entry['mbps'][tool] = mbps(row, ms)
    for storage in STORAGES:
        entry['ms'][f'{storage} treeReleaseMs'] = column(row, storage, 'treeReleaseMs')
    lint = list(row['processes']['oxlint'].values())
    entry['oxlintStartupMs'] = median(median(s['startupMs'] for s in x['samples']) for x in lint)
    entry['oxlintReportedMs'] = median(median(s['reportedMs'] for s in x['samples']) for x in lint)
    for tool in STORAGES + TOOLS:
        xs = row['processes'][tool].values()
        entry['peakRssMB'][tool] = median(median(s['peakRssMB'] for s in x['samples']) if tool == 'oxlint' else x['peakRssMB'] for x in xs)
    if 'ts-walk' in row['processes']:
        walks = list(row['processes']['ts-walk'].values())
        nodes = walks[0]['visibleNodes']
        entry['treeSitter'] = {'visibleNodes': nodes, 'nsPerNode': {ph: column(row, 'ts-walk', ph) * 1e6 / nodes for ph in ('parseMs', 'walkMs', 'dropMs')},
                               'walk / parse': pairedRatio(row, 'ts-walk', 'walkMs', 'ts-walk', 'parseMs')}
        for storage in STORAGES:
            entry['treeSitter'][f'walk / {storage} whole read'] = pairedRatio(row, 'ts-walk', 'walkMs', storage, 'wholeReadMs')
            entry['treeSitter'][f'parse / {storage} parse'] = pairedRatio(row, 'ts-walk', 'parseMs', storage, 'parseMs')
    if 'deep-read' in row['processes']:
        reads = list(row['processes']['deep-read'].values())
        sig = reads[0]['signature']
        nodes = sig['visibleNodes']
        entry['deepRead'] = {'visibleNodes': nodes, 'readBytesPerNode': sig['readBytes'] / nodes,
                             'nsPerNode': {ph: column(row, 'deep-read', ph) * 1e6 / nodes for ph in ('parseMs', 'deepReadMs', 'treeReleaseMs')},
                             'read / arena whole read': pairedRatio(row, 'deep-read', 'deepReadMs', 'arena', 'wholeReadMs'),
                             'native parse + read / arena whole read': pairedRatio(row, 'deep-read', 'wholeReadMs', 'arena', 'wholeReadMs'),
                             'peakRssMB': median(x['peakRssMB'] for x in reads)}
        if 'treeSitter' in entry:
            entry['deepRead']['read / ts parse'] = pairedRatio(row, 'deep-read', 'deepReadMs', 'ts-walk', 'parseMs')
            if entry['treeSitter']['visibleNodes'] != nodes:
                mismatches.append(f"{corpus}: deep-read counts {nodes} visible nodes, ts-walk {entry['treeSitter']['visibleNodes']}")
    summary.append(entry)
treeMemory = {}
for d in dirs:
    for path in sorted((d / 'runs').glob('*-ts-memory.json')):
        measured = json.loads(path.read_text())
        kept = treeMemory.setdefault(measured['corpus'], measured)
        if (kept['treeBytes'], kept['treeAllocations'], kept['visibleNodes']) != (measured['treeBytes'], measured['treeAllocations'], measured['visibleNodes']):
            mismatches.append(f"{measured['corpus']} tree-sitter memory differs between copies")

commits = sorted({json.loads((d / 'refs.json').read_text())['feature'] for d in dirs if (d / 'refs.json').exists()})
cell = lambda r: f"{r['ratio']:.2f} [{r['range95'][0]:.2f}, {r['range95'][1]:.2f}]"
lines = ['## Speed reference: sittir against oxfmt and oxlint', '',
         f"sittir {', '.join(f'`{c[:12]}`' for c in commits) or '(commit not recorded)'}, {', '.join(sorted({str(versions.get(s)) for s in STORAGES}))} build; oxfmt {versions.get('oxfmt')}, oxlint {versions.get('oxlint')}, node {versions.get('node')}{f", tree-sitter {versions['ts-walk']}" if 'ts-walk' in versions else ''}; {len(dirs)} cop{'y' if len(dirs) == 1 else 'ies'}.",
         'MB/s is admitted source bytes (10^6) over the median process time. A ratio is sittir\'s time over the tool\'s on the same bytes (×N: sittir takes N times as long), the median over rounds with a bootstrap 95% range. oxfmt is format() in process, one awaited call per file; oxlint is its command at --threads=1, net of the median startup of the same command over an empty file. sittir\'s edit is a same-value edit of each root\'s settable members; whole read is a parse with depth: Infinity.',
         f"Output differences: {'; '.join(mismatches) if mismatches else 'none'}.", '']
for cpu in sorted({e['cpu'] for e in summary}):
    entries = [e for e in summary if e['cpu'] == cpu]
    lines += [f'### {cpu}', '',
              '| corpus | phase | object MB/s | arena MB/s | object ÷ oxfmt | arena ÷ oxfmt | object ÷ oxlint | arena ÷ oxlint |',
              '|---|---|---|---|---|---|---|---|']
    for e in entries:
        for phase, name in PHASES:
            lines.append(f"| {e['corpus']} | {name} | {e['mbps'][f'object {phase}']:.1f} | {e['mbps'][f'arena {phase}']:.1f} | "
                         + ' | '.join(cell(e['ratios'][f'{s} {phase} / {t}']) for t in TOOLS for s in STORAGES) + ' |')
    lines += ['', '| corpus | commit | files | MB | copies | oxfmt MB/s | oxlint MB/s | oxlint startup ms | oxlint own ms | tree release ms: object / arena | peak RSS MB: object / arena / oxfmt / oxlint |',
              '|---|---|---|---|---|---|---|---|---|---|---|']
    for e in entries:
        lines.append(f"| {e['corpus']} | `{e['commit'][:12]}` | {e['files']} | {e['bytes'] / 1e6:.2f} | {e['copies']} | {e['mbps']['oxfmt']:.1f} | {e['mbps']['oxlint']:.1f} | {e['oxlintStartupMs']:.0f} | {e['oxlintReportedMs']:.0f} | "
                     + ' / '.join(f"{e['ms'][f'{s} treeReleaseMs']:.1f}" for s in STORAGES) + ' | '
                     + ' / '.join(f"{e['peakRssMB'][t]:.0f}" for t in STORAGES + TOOLS) + ' |')
    walked = [e for e in entries if 'treeSitter' in e]
    if walked:
        lines += ['', 'tree-sitter alone (ts-walk): its parse, one TreeCursor walk copying every visible node into a flat row, and the tree\'s drop; ratios paired by round with sittir\'s processes on this runner.', '',
                  '| corpus | visible nodes | parse ns/node | walk ns/node | drop ns/node | walk ÷ parse | walk ÷ whole read, object | walk ÷ whole read, arena | ts parse ÷ sittir parse, object | ts parse ÷ sittir parse, arena |',
                  '|---|---|---|---|---|---|---|---|---|---|']
        for e in walked:
            ts = e['treeSitter']
            lines.append(f"| {e['corpus']} | {ts['visibleNodes']} | " + ' | '.join(f"{ts['nsPerNode'][ph]:.1f}" for ph in ('parseMs', 'walkMs', 'dropMs')) + ' | '
                         + ' | '.join(cell(ts[k]) for k in ['walk / parse', 'walk / object whole read', 'walk / arena whole read', 'parse / object parse', 'parse / arena parse']) + ' |')
    read = [e for e in entries if 'deepRead' in e]
    if read:
        lines += ['', 'The arena whole read\'s native calls alone (deep-read): per file the addon\'s parse, then readRecordStub(0, Infinity), timed apart, and the tree\'s release; read bytes are the native bytes the read adds (treeMemory). Ratios paired by round on this runner.', '',
                  '| corpus | visible nodes | parse ns/node | deep read ns/node | release ns/node | read bytes / node | read ÷ ts parse | read ÷ arena whole read | parse + read ÷ arena whole read | peak RSS MB |',
                  '|---|---|---|---|---|---|---|---|---|---|']
        for e in read:
            dr = e['deepRead']
            lines.append(f"| {e['corpus']} | {dr['visibleNodes']} | " + ' | '.join(f"{dr['nsPerNode'][ph]:.1f}" for ph in ('parseMs', 'deepReadMs', 'treeReleaseMs')) + f" | {dr['readBytesPerNode']:.1f} | "
                         + ' | '.join(cell(dr[k]) if k in dr else '–' for k in ['read / ts parse', 'read / arena whole read', 'native parse + read / arena whole read']) + f" | {dr['peakRssMB']:.0f} |")
    lines.append('')
if treeMemory:
    lines += ['### tree-sitter tree memory (any CPU)', '', 'Bytes tree-sitter asked for that a parsed tree holds until its drop (a counting allocator through set_allocator; the parser\'s own buffers and the allocator\'s overhead excluded), against one flat row per visible node.', '',
              '| corpus | visible nodes | tree MB | bytes / visible node | allocations held | allocations / visible node | flat rows MB | row bytes | tree ÷ flat | largest tree MB | largest parse peak MB |',
              '|---|---|---|---|---|---|---|---|---|---|---|']
    for corpus, m in sorted(treeMemory.items()):
        flat = m['visibleNodes'] * m['rowBytes']
        lines.append(f"| {corpus} | {m['visibleNodes']} | {m['treeBytes'] / 1e6:.1f} | {m['treeBytes'] / m['visibleNodes']:.1f} | {m['treeAllocations']} | {m['treeAllocations'] / m['visibleNodes']:.2f} | {flat / 1e6:.1f} | {m['rowBytes']} | {m['treeBytes'] / flat:.2f} | {m['largestTreeBytes'] / 1e6:.1f} | {m['largestParsePeakBytes'] / 1e6:.1f} |")
    lines.append('')
markdown = '\n'.join(lines) + '\n'
target.write_text(markdown)
(target.parent / 'summary.json').write_text(json.dumps({'sittir': commits, 'versions': versions, 'mismatches': mismatches, 'rows': summary, 'treeSitterMemory': treeMemory}, indent=2) + '\n')
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as f:
        f.write(markdown)
sys.stdout.write(markdown)
if mismatches:
    raise SystemExit(1)
