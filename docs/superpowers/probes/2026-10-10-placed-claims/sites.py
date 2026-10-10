"""Where a placed claim could become a parser alias: python3 sites.py <placed.jsonl> <grammar-dir>.

placed.jsonl comes from placed-claims.mts: one line per claim the bindings reader marks as not its
pattern's top (`toplevel: false`), with the pattern's source. grammar-dir holds <grammar>.grammar.json,
each grammar's base grammar as tree-sitter compiles it (the overlay is not applied).

For each placed claim it reads the pattern's chain, top to the claimed node, with each node's field
and whether an anchor (`.`) sits beside it, then finds the grammar sites where the claimed kind is a
direct child of its pattern parent. A site is context-unique when no rule on the chain is reached
from outside it; otherwise the shared rules are the clones an alias needs, as the rust splits'
containers are.
"""
import json
import sys
from collections import defaultdict

placed_path, grammar_dir = sys.argv[1], sys.argv[2]


# ── the pattern's chain ─────────────────────────────────────────────────────────────────────────


def tokens(src):
    i, out = 0, []
    while i < len(src):
        c = src[i]
        if c.isspace():
            i += 1
        elif c == ';':
            while i < len(src) and src[i] != '\n':
                i += 1
        elif c in '()[].!':
            out.append(c)
            i += 1
        elif c in '?*+':
            out.append(('quant', c))
            i += 1
        elif c == '"':
            j = i + 1
            while src[j] != '"':
                j += 2 if src[j] == '\\' else 1
            out.append(('str', src[i + 1 : j]))
            i = j + 1
        elif c == '@':
            j = i + 1
            while j < len(src) and (src[j].isalnum() or src[j] in '._-'):
                j += 1
            out.append(('cap', src[i + 1 : j]))
            i = j
        elif c == '#':
            j = i + 1
            while j < len(src) and not src[j].isspace() and src[j] not in '()':
                j += 1
            out.append(('pred', src[i:j]))
            i = j
        else:
            j = i
            while j < len(src) and (src[j].isalnum() or src[j] in '_-/'):
                j += 1
            word = src[i:j]
            if j < len(src) and src[j] == ':':
                out.append(('field', word))
                j += 1
            else:
                out.append(('word', word))
            i = j
    return out


class Node:
    def __init__(self, kind, field):
        self.kind, self.field, self.children, self.captures = kind, field, [], []
        self.anchored = False


def parse(toks):
    pos = 0

    def peek():
        return toks[pos] if pos < len(toks) else None

    def take():
        nonlocal pos
        t = toks[pos]
        pos += 1
        return t

    def suffix(node):
        while peek() is not None and isinstance(peek(), tuple) and peek()[0] in ('quant', 'cap'):
            t = take()
            if t[0] == 'cap':
                node.captures.append(t[1])

    def pattern(field):
        t = take()
        if t == '(':
            nxt = peek()
            if isinstance(nxt, tuple) and nxt[0] == 'pred':
                depth = 1
                while depth:
                    t = take()
                    depth += t == '('
                    depth -= t == ')'
                return None
            if isinstance(nxt, tuple) and nxt[0] == 'word':
                node = Node(take()[1], field)
            else:
                node = Node(None, field)
            body(node, ')')
            suffix(node)
            return node
        if t == '[':
            node = Node(None, field)
            body(node, ']')
            suffix(node)
            return node
        if isinstance(t, tuple) and t[0] == 'str':
            node = Node('"' + t[1] + '"', field)
            suffix(node)
            return node
        if isinstance(t, tuple) and t[0] == 'word':
            node = Node(t[1], field)
            suffix(node)
            return node
        raise ValueError(f'unexpected {t}')

    def body(node, close):
        anchor = False
        while peek() != close:
            t = peek()
            if t == '.':
                take()
                anchor = True
                if node.children:
                    node.children[-1].anchored = True
                continue
            if t == '!':
                take()
                take()
                continue
            field = None
            if isinstance(t, tuple) and t[0] == 'field':
                field = take()[1]
            child = pattern(field)
            if child is not None:
                child.anchored = child.anchored or anchor
                node.children.append(child)
            anchor = False
        take()

    roots = []
    while pos < len(toks):
        n = pattern(None)
        if n is not None:
            roots.append(n)
    return roots


def chain_to(node, capture):
    if capture in node.captures:
        return [node]
    for child in node.children:
        found = chain_to(child, capture)
        if found:
            return [node] + found
    return None


def named_chain(src, capture):
    for root in parse(tokens(src)):
        chain = chain_to(root, capture)
        if chain:
            return [n for n in chain if n.kind is not None and not n.kind.startswith('"')]
    raise ValueError(f'no @{capture} in {src}')


# ── the grammar's sites ─────────────────────────────────────────────────────────────────────────


class Grammar:
    def __init__(self, path):
        g = json.load(open(path))
        self.rules = g['rules']
        self.word = g.get('word')
        self.hidden_set = set(g.get('supertypes', [])) | set(g.get('inline', []))
        self.alias_bodies = defaultdict(list)
        self.refs = defaultdict(list)
        self.users = defaultdict(set)
        visible = [n for n in self.rules if not self.hidden(n)]
        for name in visible:
            self.walk(name, self.rules[name], None, (), set())
        walked = set()
        while True:
            pending = [(name, body) for name, bodies in sorted(self.alias_bodies.items()) for body in bodies if (name, id(body)) not in walked]
            if not pending:
                break
            for name, body in pending:
                walked.add((name, id(body)))
                self.walk(name, body, None, (), set())

    def hidden(self, name):
        return name.startswith('_') or name in self.hidden_set

    def walk(self, owner, rule, field, path, seen):
        t = rule['type']
        if t == 'SYMBOL':
            name = rule['name']
            if self.hidden(name):
                if name in seen or name not in self.rules:
                    return
                self.users[name].add(owner)
                self.walk(owner, self.rules[name], field, path + (name,), seen | {name})
            else:
                self.refs[name].append((owner, field, path))
        elif t == 'ALIAS':
            if rule.get('named'):
                content = rule['content']
                target = self.rules.get(content['name'], content) if content['type'] == 'SYMBOL' else content
                if all(body is not target for body in self.alias_bodies[rule['value']]):
                    self.alias_bodies[rule['value']].append(target)
                self.refs[rule['value']].append((owner, field, path))
        elif t == 'FIELD':
            self.walk(owner, rule['content'], rule['name'], path, seen)
        elif t in ('SEQ', 'CHOICE'):
            for m in rule['members']:
                self.walk(owner, m, field, path, seen)
        elif t in ('REPEAT', 'REPEAT1', 'PREC', 'PREC_LEFT', 'PREC_RIGHT', 'PREC_DYNAMIC', 'RESERVED'):
            self.walk(owner, rule['content'], field, path, seen)

    def kinds_under(self, parent):
        return {k for k, refs in self.refs.items() for (owner, _, _) in refs if owner == parent}


def sites(grammar, chain):
    """The claimed kind's sites under its pattern parent, and the rules an alias there must clone.

    A rule on the chain is cloned when something outside the pattern reaches it, and once one is
    cloned, every rule below it down to the site is cloned with it, as the rust splits clone
    `declaration_list` and then `_declaration_statement` inside it."""
    clones, in_context, cloning = [], [], False
    for parent, child in zip(chain, chain[1:]):
        refs = grammar.refs.get(child.kind, [])
        inside = [r for r in refs if r[0] == parent.kind and (child.field is None or r[1] == child.field)]
        if not inside:
            return {'sites': [], 'clones': [], 'note': f'{child.kind} is never a child of {parent.kind}'}
        for _, _, path in inside:
            for h in path:
                if cloning or grammar.users[h] - {parent.kind}:
                    cloning = True
                    if h not in clones:
                        clones.append(h)
        if child is not chain[-1] and (cloning or len(inside) < len(refs)):
            cloning = True
            clones.append(child.kind)
        in_context = inside
    return {
        'sites': sorted({(path[-1] if path else chain[-2].kind) for _, _, path in in_context}),
        'clones': clones,
    }


def own_kinds(grammar, parent):
    """For a wildcard claim: each kind its parent holds, and whether that kind occurs only there."""
    return {k: all(owner == parent for owner, _, _ in grammar.refs[k]) for k in sorted(grammar.kinds_under(parent))}


def classify(row):
    if row['identifier']:
        return 'identifier'
    if row['textual']:
        return 'text'
    if row['positional']:
        return 'position'
    if row['own_kinds'] is not None:
        return 'own-kinds' if all(row['own_kinds'].values()) else 'wildcard'
    if not row['site']['sites']:
        return 'no-site'
    return 'alias' if not row['site']['clones'] else 'alias-with-clones'


# ── the census ─────────────────────────────────────────────────────────────────────────────────

grammars = {}
rows = []
for line in open(placed_path):
    claim = json.loads(line)
    if 'claims' in claim:
        continue
    g = claim['g']
    grammar = grammars.setdefault(g, Grammar(f'{grammar_dir}/{g}.grammar.json'))
    chain = named_chain(claim['src'], claim['vocab'])
    kinds = [n.kind for n in chain]
    assert kinds[-1] == (claim['kind'] or '_'), (kinds, claim)
    assert list(reversed(kinds[:-1])) == claim['within'], (kinds, claim['within'])
    positional = [n.kind for n in chain[1:] if n.anchored]
    textual = [p['cap'] for p in claim['preds'] if (p['up'] or 0) > 0]
    claimed = chain[-1].kind
    wildcard = claimed == '_'
    identifier = claimed == grammar.word or (wildcard and grammar.word in grammar.kinds_under(chain[-2].kind))
    row = {
        'grammar': g,
        'line': claim['line'],
        'claim': claim['vocab'],
        'chain': ' > '.join(f"{n.field + ': ' if n.field else ''}{n.kind}" for n in chain),
        'positional': positional,
        'textual': textual,
        'identifier': identifier,
        'own_kinds': own_kinds(grammar, chain[-2].kind) if wildcard else None,
        'site': None if wildcard else sites(grammar, chain),
    }
    row['class'] = classify(row)
    rows.append(row)

totals = {}
for line in open(placed_path):
    claim = json.loads(line)
    if 'claims' in claim:
        totals[claim['g']] = {'claims': claim['claims'], 'placed': claim['placed']}
by_class = defaultdict(lambda: defaultdict(int))
for row in rows:
    by_class[row['class']][row['grammar']] += 1
print(json.dumps({'totals': totals, 'by_class': by_class, 'rows': rows}, indent=1))
