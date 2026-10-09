"""Shared by the admission probes: each grammar's line-sensitive tokens, the
generated site tables, the seam oracle's gap records, the validators' counts.

Not a measurement by itself. As a command it prints a grammar's token list:
  python3 oracle_lib.py <grammar> <runtime|external|watch>
"""
import collections, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def line_tokens(grammar, namespace, arg='-'):
    """A comma-separated list, `none`, or `-` for the grammar's row in line-tokens.json.

    `runtime` names are the symbol names the parser reports (the oracle's
    records hold these); `external` names are the grammar's external tokens as
    parser.c spells them; `watch` is `runtime` plus content tokens the oracle
    records without treating them as line-sensitive.
    """
    if arg != '-':
        return [name for name in arg.split(',') if name and name != 'none']
    with open(os.path.join(HERE, 'line-tokens.json')) as f:
        return json.load(f)[grammar][namespace]


ARM_NAMES = {'': 'tight', ' ': 'space', '\t': 'tab', '\n': 'newline', '\n\n': 'blank', '\n\n\n': 'blank2', '\r\n': 'crlf', '\r': 'cr'}


class Sites:
    """A grammar's spacing sites, as the generated options module of a checkout lists them."""

    def __init__(self, root, grammar):
        with open(os.path.join(root, f'rust/crates/sittir-{grammar}/src/render/options.rs')) as f:
            src = f.read()

        def block(header):
            i = src.index(header)
            return src[i:src.index('\n];', i)]

        def const(name):
            m = re.search(rf'pub const {name}: u16 = (\d+);', src)
            return int(m.group(1)) if m else None

        # (kind, address, label, allowed arms), indexed by site id
        self.rows = [
            (kind, addr, label, [int(a) for a in arms.split(',') if a.strip()])
            for kind, addr, label, arms in re.findall(
                r'^\s+\("([^"]*)", "([^"]*)", "([^"]*)", &\[([0-9, ]*)\]\),$', block('pub static SPACING_SITES'), re.M)
        ]
        # (default arm, strength), indexed by site id
        self.specs = [
            (int(arm), int(strength))
            for arm, strength in re.findall(r'SiteSpec \{ default_arm: (\d+), strength: (\d+) \}', block('pub static SITE_SPECS'))
        ]
        assert len(self.rows) == len(self.specs), (grammar, len(self.rows), len(self.specs))
        text_fn = src[src.index('pub fn spacing_text'):src.index('pub fn allowed')]
        # arm kind id -> the text it renders
        self.texts = {int(arm): json.loads(text) for arm, text in re.findall(r'^\s+(\d+) => ("(?:[^"\\]|\\.)*"),$', text_fn, re.M)}
        self.indent = const('INDENT_KIND')
        self.dedent = const('DEDENT_KIND')
        consts = {name: int(n) for name, n in re.findall(r'pub const (SITE_\w+): usize = (\d+);', src)}
        # site id -> every option path that addresses it, in table order
        self.paths = collections.defaultdict(list)
        for name, path in re.findall(r'SiteRef \{ site: (SITE_\w+), path: ("(?:[^"\\]|\\.)*") \}', src):
            self.paths[consts[name]].append(json.loads(path))

    def __len__(self):
        return len(self.rows)

    def name(self, site):
        kind, addr, _, _ = self.rows[site]
        return f'({kind})/{addr}'

    def path(self, site):
        """The first option path that addresses the site, else its id."""
        return self.paths[site][0] if site in self.paths else str(site)

    def arm_name(self, arm):
        if arm == self.indent:
            return 'indent'
        if arm == self.dedent:
            return 'dedent'
        text = self.texts.get(arm)
        return ARM_NAMES.get(text, json.dumps(text) if text is not None else '?')

    def is_line(self, arm):
        return '\n' in self.texts.get(arm, '')


def records(path, all_renders=False):
    """The oracle's gap records from renders that reparse cleanly: root renders only, unless `all_renders`."""
    with open(path) as f:
        for line in f:
            row = json.loads(line)
            if row['err'] or not (all_renders or row['root']):
                continue
            yield row


def inline_observations(path, tokens):
    """site id -> Counter{a line-sensitive token is valid at the gap: gap count}, over inline gaps."""
    wanted = set(tokens)
    seen = collections.defaultdict(collections.Counter)
    for row in records(path):
        if '\n' in row['ws']:
            continue
        valid = bool(wanted & set(row['any']))
        for site in set(row['sites']):
            seen[site][valid] += 1
    return seen


FREE, SOME, EVERY = 'no token valid in any occurrence', 'token valid in some occurrences', 'token valid in every occurrence'


def site_class(observed):
    """Class of a site from its inline observations (a Counter from `inline_observations`)."""
    if observed[True] and not observed[False]:
        return EVERY
    if observed[True]:
        return SOME
    return FREE


COUNT_KEYS = [
    'fromPass', 'covPass', 'read-render-parsePass', 'read-render-parseAstMatchPass', 'read-render-parse-shallowPass',
    'read-render-parse-shallowAstMatchPass', 'factory-render-parsePass', 'factory-render-parseAstMatchPass',
    'ir-render-parsePass', 'ir-render-parseAstMatchPass',
]


def counts(path):
    """The validators' pass counts from a saved `validate counts` output, or None when the run did not finish."""
    if not os.path.exists(path):
        return None
    with open(path, errors='replace') as f:
        text = f.read()
    out = {}
    for key in COUNT_KEYS:
        m = re.search(r'(?<![\w-])' + re.escape(key) + r'=(\d+)', text)
        if m is None:
            return None
        out[key] = int(m.group(1))
    return out


if __name__ == '__main__':
    print(','.join(line_tokens(sys.argv[1], sys.argv[2])))
