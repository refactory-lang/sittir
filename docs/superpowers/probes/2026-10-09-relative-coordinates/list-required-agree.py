"""Whether a transport's required list (a non-Option Vec, whose read refuses an empty list) is exactly a list the types mark NonEmptyArray."""
import re, sys

lang = sys.argv[1]
transport = open(f'rust/crates/sittir-{lang}/src/render/transport.rs').read()
types = open(f'packages/{lang}/src/types.ts').read()
rust_lists = {}
for name, body in re.findall(r'pub struct (\w+)Transport \{([\s\S]*?)\n\}', transport):
    for key, ty in re.findall(r'#\[wire\(key = "(_\w+)"\)\]\s*(?:#\[.*\]\s*)*pub \w+: ((?:Option<)?Vec<)', body):
        rust_lists[(name, key)] = ty == 'Vec<'
ts_lists = {}
for name, body in re.findall(r'export interface (\w+) \{\n\s+readonly \$type: [^\n]*([\s\S]*?)\n\}', types):
    for key, optional, ty in re.findall(r'readonly (_\w+)(\??): (NonEmptyArray|readonly)', body):
        ts_lists[(name, key)] = ty == 'NonEmptyArray'
shared = rust_lists.keys() & ts_lists.keys()
disagree = sorted(k for k in shared if rust_lists[k] != ts_lists[k])
print(lang, 'transport lists:', len(rust_lists), 'types lists:', len(ts_lists), 'matched:', len(shared),
      'required (rust/ts):', sum(rust_lists[k] for k in shared), sum(ts_lists[k] for k in shared),
      'disagree:', disagree, 'unmatched rust:', sorted(rust_lists.keys() - ts_lists.keys())[:10], 'unmatched ts:', sorted(ts_lists.keys() - rust_lists.keys())[:10])
