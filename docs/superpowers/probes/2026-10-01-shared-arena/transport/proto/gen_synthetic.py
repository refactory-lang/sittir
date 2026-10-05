"""Write synthetic/src/kinds.rs: 395 kinds with 696 slots between them (rust's transport.rs shape),
under one expansion: plain structs; napi = #[napi(object)] alone (what today's transport structs
carry); napi_serde = napi object + serde derives; transport_<wire> = the #[transport] attribute with
wire = words | napi | json | all (reader + arena words, plus the named wire derives).
Usage: python3 gen_synthetic.py <plain|napi|napi_serde|transport_words|transport_napi|transport_json|transport_all>"""
import pathlib, sys
variant = sys.argv[1]
KINDS, SLOTS = 395, 696
counts = [0] * KINDS
for i in range(SLOTS):
    counts[(i * 37) % KINDS] += 1          # spread 696 slots over 395 kinds, deterministically
shapes = ['Slot', 'Option<Slot>', 'Vec<Slot>']
out = []
for k, n in enumerate(counts):
    if variant.startswith('transport_'):
        out.append(f'#[transport(kind = "k{k}", wire = "{variant[len("transport_"):]}")]')
    elif variant == 'napi_serde':
        out.append('#[napi(object)]\n#[derive(Debug, Clone, Serialize, Deserialize)]')
    elif variant == 'napi':
        out.append('#[napi(object)]\n#[derive(Debug, Clone)]')
    else:
        out.append('#[derive(Debug, Clone)]')
    out.append(f'pub struct K{k} {{')
    for s in range(n):
        attrs = ''
        if variant.startswith('transport_'):
            attrs = f'#[slot(field = "f{s}")] '
        elif variant == 'napi_serde':
            attrs = f'#[napi(js_name = "_f{s}")] #[serde(rename = "_f{s}")] '
        elif variant == 'napi':
            attrs = f'#[napi(js_name = "_f{s}")] '
        out.append(f'    {attrs}pub f{s}: {shapes[(k + s) % 3]},')
    trivia = {'napi': '#[napi(js_name = "$trivia")] ', 'napi_serde': '#[napi(js_name = "$trivia")] #[serde(rename = "$trivia")] '}.get(variant, '#[trivia] ' if variant.startswith('transport_') else '')
    out.append(f'    {trivia}pub trivia: Vec<Coord>,')
    out.append('}\n')
pathlib.Path(__file__).with_name('synthetic').joinpath('src/kinds.rs').write_text('\n'.join(out))
print(f'{variant}: {KINDS} kinds, {sum(counts)} slots, {len(out)} lines')
