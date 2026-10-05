"""Census of each grammar's generated tables, for the shared-arena spec's appendix on what the typed
transport retires, folds into an attribute, or leaves. Counts lines and rows per grammar in a
checkout's generated outputs and prints one row per table.
Usage: python3 generated-tables-census.py [checkout]   (default: the current directory)"""
import importlib.util, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('transport_census', os.path.join(HERE, 'transport-census.py'))
transport_census = importlib.util.module_from_spec(spec)
spec.loader.exec_module(transport_census)

ROOT = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
GRAMMARS = ['rust', 'typescript', 'python', 'scm', 'regex']
WRAP_HELPERS = ['modelSlots', 'normalizeSingularWrapSlot', 'normalizeRepeatedWrapSlot', 'projectKindEnumStorage',
                'projectMixedEnumStorage', 'coerceBooleanKeywordStorage', 'coerceBitflagStorage', 'readTerminalFromOther',
                '_projectLexed', '_aliasEnvelope', '_wrapTrivia', 'dropWireDelimiters', 'storeExpanded', 'seatWith',
                '_spellingTokens', '_spelledText', '_tiledSpelling', '_filterWrapChildrenByKind', '_isReadTextLeaf']
WRAP_TABLES = ['_LIST_OWNER_KINDS', 'SUPERTYPE_MEMBERS', '_ALIAS_ENVELOPES', '_HIDDEN_KINDS', '_RECLAIMS_ANONYMOUS']
JS_ONLY = ['types.ts', 'types-internal.ts', 'is.ts', 'ir.ts', 'factories', 'backend.ts', 'api.ts', 'render-engine.ts',
           'index.ts', 'options.ts', 'hash.ts']


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def count_lines(path):
    if os.path.isdir(path):
        return sum(count_lines(os.path.join(path, f)) for f in os.listdir(path))
    return read(path).count('\n')


def span(lines, start):
    """Lines a declaration spans from `start` until its brackets close."""
    depth = 0
    for i in range(start, len(lines)):
        depth += lines[i].count('{') + lines[i].count('[') + lines[i].count('(')
        depth -= lines[i].count('}') + lines[i].count(']') + lines[i].count(')')
        if depth <= 0 and i > start or (depth == 0 and lines[i].rstrip().endswith(';')):
            return i - start + 1
    return len(lines) - start


def decl(lines, pattern):
    """(lines spanned, rows) of every declaration matching `pattern`; a row is a line holding a key."""
    total_lines = rows = count = 0
    for i, line in enumerate(lines):
        if re.match(pattern, line):
            n = span(lines, i)
            count += 1
            total_lines += n
            rows += sum(1 for l in lines[i + 1:i + n] if re.match(r'\s+(\[|[\w$\'"]+\s*:)', l))
    return count, total_lines, rows


def fn_arms(lines, name):
    for i, line in enumerate(lines):
        if re.match(rf'pub fn {name}\(', line):
            n = span(lines, i)
            return n, sum(1 for l in lines[i:i + n] if '=>' in l and not l.strip().startswith('_ =>'))
    return 0, 0


rows = {}
for g in GRAMMARS:
    src = os.path.join(ROOT, 'packages', g, 'src')
    crate = os.path.join(ROOT, 'rust', 'crates', f'sittir-{g}')
    r = rows.setdefault(g, {})
    wrap = read(os.path.join(src, 'wrap.ts'))
    wl = wrap.split('\n')
    r['wrap.ts lines'] = len(wl)
    r['wrap functions'] = sum(1 for l in wl if re.match(r'export function wrap\w+\(', l))
    projection = members = 0
    for i, l in enumerate(wl):
        if re.match(r'export function wrap\w+\(', l):
            n = span(wl, i)
            body = wl[i + 1:i + n - 1]
            first_member = next((j for j, b in enumerate(body) if re.match(r'\t\t(\w+\(\) \{|\$with: \{)', b)), len(body))
            projection += first_member
            members += len(body) - first_member
    r['wrap function lines: projection / members'] = f'{projection} / {members}'
    c, n, k = decl(wl, r'const _ROUTES_\w+')
    r['_ROUTES_<Kind> tables'] = f'{c} tables, {k} rows, {n} lines'
    for t in WRAP_TABLES:
        c, n, k = decl(wl, rf'const {t}\b')
        r[t] = f'{n} lines'
    r['projection helper calls'] = sum(len(re.findall(rf'\b{h}\(', wrap)) for h in WRAP_HELPERS)
    consts = read(os.path.join(src, 'consts.ts')).split('\n')
    for t in ['TOKEN_INTERIORS', 'INNER_GAPS']:
        c, n, k = decl(consts, rf'export const {t}\b')
        entries = 0
        for i, l in enumerate(consts):
            if re.match(rf'export const {t}\b', l):
                entries = sum(1 for x in consts[i + 1:i + span(consts, i)] if re.match(r'\t[\w$\'"]+: ', x))
        r[t] = f'{entries} kinds, {n} lines'
    other = sum(1 for l in consts if re.match(r'export (const|enum) ', l) and not re.match(r'export const (TOKEN_INTERIORS|INNER_GAPS)\b', l))
    r['consts.ts other exports (bitflag enums)'] = other
    utils = read(os.path.join(src, 'utils.ts')).split('\n')
    for t in ['querySlots', 'triviaFacts']:
        c, n, k = decl(utils, rf'export const {t}\b')
        kinds = 0
        for i, l in enumerate(utils):
            if re.match(rf'export const {t}\b', l):
                kinds = sum(1 for x in utils[i + 1:i + span(utils, i)] if re.match(r'\t\d+: ', x))
        r[t] = f'{kinds} kinds, {n} lines' if t == 'querySlots' else f'{n} lines'
    r['node-model.json5 lines'] = count_lines(os.path.join(src, 'node-model.json5'))
    kid = read(os.path.join(crate, 'src', 'render', 'kind_ids.rs')).split('\n')
    r['kind_ids.rs kind constants'] = sum(1 for l in kid if re.match(r'pub const \w+: KindId', l))
    r['kind_name_from_id arms'] = fn_arms(kid, 'kind_name_from_id')[1]
    n, a = fn_arms(kid, 'inner_gap_key')
    r['inner_gap_key'] = f'{a} arms, {n} lines'
    n, a = fn_arms(kid, 'stores_scalar')
    r['stores_scalar'] = f'{a} arms, {n} lines'
    lib = read(os.path.join(crate, 'src', 'lib.rs')).split('\n')
    r['ReadModel impl lines'] = sum(span(lib, i) for i, l in enumerate(lib) if re.match(r'impl\b.*\bReadModel for ', l))
    opts = read(os.path.join(crate, 'src', 'render', 'options.rs')).split('\n')
    r['options.rs'] = f'{sum(1 for l in opts if re.match(r"pub (const|static) SITE_", l))} SITE_* constants, {len(opts)} lines'
    tc = transport_census.census(os.path.join(crate, 'src', 'render', 'transport.rs'))
    r['transport.rs'] = (f"{tc['lines']} lines: {tc['structs']} structs, {tc['slots']} slots; napi impls {tc['napi_lines']} "
                         f"({100 * tc['napi_lines'] / tc['lines']:.1f} %), render fns {tc['render_lines']}")
    fixtures = os.path.join(crate, 'test-fixtures.json')
    r['test-fixtures.json'] = f'{len(json.loads(read(fixtures)))} fixtures, {count_lines(fixtures)} lines'
    sittir = os.path.join(ROOT, 'packages', g, '.sittir')
    r['render-bodies.json / resolutions.json lines'] = f"{count_lines(os.path.join(sittir, 'render-bodies.json'))} / {count_lines(os.path.join(sittir, 'resolutions.json'))}"
    r['JS-only surface lines (types, is, ir, factories, glue)'] = sum(count_lines(os.path.join(src, f)) for f in JS_ONLY if os.path.exists(os.path.join(src, f)))

keys = list(rows[GRAMMARS[0]])
print('| table | ' + ' | '.join(GRAMMARS) + ' |')
print('| --- |' + ' --- |' * len(GRAMMARS))
for k in keys:
    print(f'| {k} | ' + ' | '.join(str(rows[g].get(k, '')) for g in GRAMMARS) + ' |')
