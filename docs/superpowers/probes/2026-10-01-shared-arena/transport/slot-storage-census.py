"""Joins each slot's stamped storage facts (slot-storage-dump.mts's JSON lines) with the Rust type its
field has in a generated transport.rs, and counts the slots per (storage class, value storages, Rust
type class): how many encodings each storage class gets.
Usage: python3 slot-storage-census.py <slots.jsonl> <transport.rs>"""
import json
import re
import sys
from collections import Counter, defaultdict

RUST_KEYWORDS = {'as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in',
                 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct', 'super',
                 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while', 'async', 'await', 'dyn', 'abstract', 'become', 'box',
                 'do', 'final', 'macro', 'override', 'priv', 'typeof', 'unsized', 'virtual', 'yield', 'try', 'union'}


def type_ident(name):
    ident = re.sub(r'[^A-Za-z0-9_]', '_', name)
    ident = ident if re.match(r'^[A-Za-z_]', ident) else 'Transport' + ident
    return ident + '_' if ident in RUST_KEYWORDS else ident


def field_ident(name):
    return name + '_' if name in RUST_KEYWORDS else name


def type_class(rust_type):
    if re.search(r'\bbool\b', rust_type):
        return 'bool'
    if re.search(r'\bString\b', rust_type):
        return 'String'
    if 'AnyTransport' in rust_type:
        return 'AnyTransport'
    if 'TransportSlot' in rust_type:
        return 'slot choice'
    if re.search(r'\w+Enum\b', rust_type):
        return 'enum kind'
    return 'struct or supertype'


slots_path, transport_path = sys.argv[1], sys.argv[2]
text = open(transport_path).read()
structs = {m.group(1): dict(re.findall(r'^\s+pub (\w+): (.+),$', m.group(2), re.M))
           for m in re.finditer(r'^pub struct (\w+) \{\n(.*?)^\}', text, re.S | re.M)}
table = Counter()
examples = defaultdict(list)
joined = 0
rows = [json.loads(line) for line in open(slots_path)]
for row in rows:
    struct = structs.get(type_ident(row['typeName']) + 'Transport') or structs.get(type_ident(row['typeName']) + 'KindTransport')
    rust_type = struct.get(field_ident(row['storageName'])) if struct else None
    if rust_type is None:
        continue
    joined += 1
    vias = '+'.join(sorted({v['via'] for v in row['values'] if v})) or '(pattern)'
    key = (row['storageKind'], vias, type_class(rust_type))
    table[key] += 1
    if len(examples[key]) < 1:
        examples[key].append(f"{row['kind']}.{row['slot']}: {rust_type}")
print(f'{len(rows)} slots, {joined} joined to a struct field')
print('| storage class | value storage | Rust type | slots | e.g. |')
print('| --- | --- | --- | --- | --- |')
for (storage, vias, cls), count in sorted(table.items(), key=lambda kv: (kv[0][0], -kv[1])):
    print(f'| {storage} | {vias} | {cls} | {count} | `{examples[(storage, vias, cls)][0][:90]}` |')
