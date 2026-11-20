import json, sys, os
base = sys.argv[1]
out = {}
for lang in sorted(os.listdir(base)):
    p = os.path.join(base, lang, 'node-types.json')
    if not os.path.isfile(p): continue
    data = json.load(open(p))
    named = sorted({e['type'] for e in data if e.get('named')})
    anon = sorted({e['type'] for e in data if not e.get('named')})
    fields = sorted({f'{e["type"]}.{f}' for e in data for f in (e.get('fields') or {})})
    out[lang] = {'named': named, 'anon': anon, 'fields': fields}
    print(lang, 'named', len(named), 'anon', len(anon), 'fields', len(fields))
json.dump(out, open(sys.argv[2], 'w'))
