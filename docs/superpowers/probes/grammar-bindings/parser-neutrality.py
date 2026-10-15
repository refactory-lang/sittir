"""Compares a bound parser.c with its base: maps every bound name back to its base name (symbol enum names,
symbol-name strings, metadata comments) and diffs what is left. Prints the define counts side by side and the
number of differing lines after the mapping.

    python3 parser-neutrality.py <base parser.c> <bound parser.c> <grammar.bindings.ts>
"""
import re, sys, json, difflib
base_path, bound_path, bindings_path = sys.argv[1:4]
text = open(bindings_path).read()
renames = json.loads(re.search(r'renames: (\{.*?\n\t\})', text, re.S).group(1))
aliases = json.loads(re.search(r'aliases: (\{.*?\})', text, re.S).group(1))
back = {to: frm for frm, to in renames.items()}
base = open(base_path).read(); bound = open(bound_path).read()
defs = lambda t: dict(re.findall(r'#define (\w+_COUNT|MAX_ALIAS_SEQUENCE_LENGTH) (\d+)', t))
db, dn = defs(base), defs(bound)
for k in sorted(db): print(f'{k:28} base {db[k]:>6}  bound {dn.get(k, "-"):>6}')
print(f'{"bytes":28} base {len(base):>8}  bound {len(bound):>8}')
def unbind(t):
    def ident(m):
        prefix, name = m.group(1), m.group(2)
        return prefix + back.get(name, name)
    t = re.sub(r'\b(sym_|alias_sym_|aux_sym_)([A-Za-z_][A-Za-z0-9_]*?)(?=\b|_token\d|_repeat\d)', ident, t)
    t = re.sub(r'"([A-Za-z_][A-Za-z0-9_]*)"', lambda m: '"' + back.get(m.group(1), m.group(1)) + '"', t)
    return t
a = base.splitlines(); b = unbind(bound).splitlines()
diff = [l for l in difflib.unified_diff(a, b, lineterm='', n=0) if l[:1] in '+-' and not l.startswith(('+++', '---'))]
print(f'lines differing after mapping bound names back: {len(diff)}')
for l in diff[:20]: print('  ' + l[:160])
