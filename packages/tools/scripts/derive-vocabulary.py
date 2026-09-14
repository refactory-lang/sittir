"""Derive the base vocabulary from the grammars' bindings files.

Reads packages/<grammar>/bindings.scm and each grammar package's generated
types.ts, joins every claim to the claimed rule's slots, and prints the
union tree. Modes:

  derive-vocabulary.py <draft.ts>            the typemap and interfaces as one draft
  derive-vocabulary.py /dev/null --members   member names and kinds per shared kind
  derive-vocabulary.py /dev/null --emit DIR  one file per top-level namespace plus
                                             the context typemap, formatted

The tree under packages/types/src/vocabulary/ is authored and hand-maintained;
this script drafted its first cut and now emits into a scratch DIR for
comparison. It is the seed of the bindings-inventory tool.
"""
import re,collections,sys
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..','..'))
GRAMMARS=['python','typescript','rust']
def snake(pascal): return re.sub(r'(?<!^)(?=[A-Z])','_',pascal).lower()
def camel(s): return re.sub(r'_([a-z0-9])',lambda m:m.group(1).upper(),s.lstrip('_'))
def pascal_path(path): return '.'.join(''.join(w.capitalize() for w in seg.split('_')) for seg in path.split('.'))
TOK=re.compile(r'"(?:[^"\\]|\\.)*"|\(|\)|\[|\]|@[\w.]+|#[\w?!]+|[\w.]+:|[\w.]+|[*+?!.]')
class Node:
    def __init__(self,kind):
        self.kind=kind; self.children=[]; self.captures=[]; self.preds=[]; self.strings=[]; self.fieldlits={}; self._field=None; self.field=None; self.text=None
def parse(text):
    text=re.sub(r';[^\n]*','',text)
    toks=TOK.findall(text); i=0; top=[]
    def node():
        nonlocal i
        assert toks[i]=='('; i+=1
        n=Node(None); last=None
        while toks[i]!=')':
            t=toks[i]
            if t=='(':
                if n.kind is None: n.kind='<group>'
                f=n._field; n._field=None
                c=node(); c.field=f; n.children.append(c); last=c; continue
            if t.startswith('#'):
                j=i+1
                while toks[j]!=')': j+=1
                n.preds.append(toks[i:j]); i=j; continue
            if t.startswith('@'):
                (last if last is not None else n).captures.append(t[1:]); i+=1; continue
            if t.startswith('"'):
                n.strings.append(t)
                if n._field: n.fieldlits[n._field]=t[1:-1]
                tok=Node('<token>'); tok.field=n._field; tok.text=t[1:-1]; n.children.append(tok)
                n._field=None; last=tok; i+=1; continue
            if t=='[':
                i+=1
                while toks[i]!=']':
                    if toks[i]=='(': c=node(); n.children.append(c); continue
                    i+=1
                last=n; i+=1; continue
            if t.endswith(':'): n._field=t[:-1]; i+=1; continue
            if t in ('*','+','?','!','.'): i+=1; continue
            if n.kind is None: n.kind=t
            else:
                c=Node(t); c.field=n._field; n._field=None; n.children.append(c); last=c
            i+=1
        i+=1
        return n
    while i<len(toks):
        if toks[i]=='(':
            n=node(); top.append(n)
            while i<len(toks) and toks[i].startswith('@'): n.captures.append(toks[i][1:]); i+=1
        else: i+=1
    return top
def walk(n):
    yield n
    for c in n.children: yield from walk(c)
claims=collections.defaultdict(lambda:collections.defaultdict(list)); content=collections.defaultdict(set); allvocab=set(); members_declared=collections.defaultdict(set)
holes=collections.defaultdict(dict)   # vocab -> {member: template literal type}; hole names -> 'string'
renames=collections.defaultdict(dict)   # (g,gk) -> {field_or_childkind: member}
containers=[]   # (g, top): a wrapper pattern whose `@element` child takes the pattern's other captures as members
for g in GRAMMARS:
    with open(f'{ROOT}/packages/{g}/bindings.scm') as bindings_file:
        bindings_text=bindings_file.read()
    for top in parse(bindings_text):
        if top.kind not in (None,'<group>') and not any('.' in c for c in top.captures) and any('element' in n.captures for n in walk(top)):
            containers.append((g,top)); continue
        haspred=any(n.preds for n in walk(top))
        # a template regex: anchored, literal runs and named holes -> members of the claimed kind
        for n in walk(top):
            for pred in n.preds:
                if pred[0]=='#match?' and len(pred)>=3:
                    target=pred[1][1:]; rx=pred[2][1:-1]
                    groups=re.findall(r'\(\?<(\w+)>',rx)
                    if not groups or not (rx.startswith('^') and rx.endswith('$')): continue
                    tmpl=re.sub(r'\(\?<\w+>[^)]*\)','${string}',rx[1:-1])
                    vs=[c for m in walk(top) for c in m.captures if '.' in c]
                    for v in vs:
                        holes[v][camel(target)]=f'`{tmpl}`'
                        for grp in groups: holes[v][camel(grp)]='string'
        for n in walk(top):
            for cap in n.captures:
                if '.' in cap or (n is top and not cap.startswith('_')):
                    allvocab.add(cap)
                    k=n.kind if n.kind not in (None,'<group>') else (n.children[0].kind if n.children else None)
                    if haspred: content[cap].add(g)
                    toplevel = n is top or (top.kind=='<group>' and n in top.children)
                    if k and k!='<token>': claims[g][k].append((cap,haspred,dict(n.fieldlits) if n.kind not in (None,'<group>') else {},toplevel))
                elif not cap.startswith('_'):
                    members_declared[cap].add(g)
                    # find the parent node of n
                    for par in walk(top):
                        if n in par.children and par.kind not in (None,'<group>'):
                            key=n.field or n.kind
                            if key:
                                renames[(g,par.kind)][key]=cap
                                pass   # a rename is a fact about the kinds whose claims carry the capture, never grammar-wide
NODE=re.compile(r'^export interface (\w+) \{\n\treadonly \$type: TSKindId\.\w+;\n((?:\t[^\n]*\n)*?)\}',re.M)
HINT=re.compile(r'readonly (\w+)\??:\s*(?:\|\s*)?KindEnum<\s*((?:\'[^\']*\'\s*\|?\s*)+),',re.S)
MEM=re.compile(r'^\treadonly (_\w+)(\??):((?:[^;{\n]|\n\t\t\|)+);',re.M)
UNION=re.compile(r'^export type (\w+) =\n((?:\t\| \w+;?\n)+)',re.M)
unions={}
ifaces={}
for g in GRAMMARS:
    with open(f'{ROOT}/packages/{g}/src/types.ts') as types_file:
        t=types_file.read()
    d={}
    unions[g]={snake(m.group(1)):[snake(x) for x in re.findall(r'\| (\w+)',m.group(2))] for m in UNION.finditer(t)}
    for m in NODE.finditer(t):
        mems=[]
        for mm in MEM.finditer(m.group(2)):
            n,opt,ty=mm.group(1),mm.group(2)=='?',' '.join(mm.group(3).split())
            multiple=bool(re.match(r'readonly |NonEmptyArray<',ty))
            ty=re.sub(r'^readonly |\[\]$|^NonEmptyArray<|>$','',ty).strip()
            ty=ty[1:-1] if ty.startswith('(') and ty.endswith(')') else ty
            mems.append(dict(name=n,optional=opt,multiple=multiple,kinds=[k.strip() for k in ty.split('|') if k.strip()]))
        hints={h.group(1):sorted(set(re.findall(r"'([^']*)'",h.group(2)))) for h in HINT.finditer(m.group(2))}
        for mem in mems:
            key=mem['name'].lstrip('_')
            if key in hints and mem['kinds']==['number']: mem['kinds']=[f"text:{x}" for x in hints[key]]
        d[snake(m.group(1))]=mems
    ifaces[g]=d
# parent claim per grammar kind = a non-predicate claim if any, else the first
gk2v={}
for g in GRAMMARS:
    gk2v[g]={}
    for gk,vs in claims[g].items():
        plain=[v for v,p,lits,tl in vs if not p and not lits and tl]
        if plain: gk2v[g][gk]=plain[0]
        elif any(tl for *_,tl in vs): gk2v[g][gk]=[v for v,p,l,tl in vs if tl][0]
derived_super={}
incl={}
def common_prefix(paths):
    if not paths: return None
    parts=[p.split('.') for p in paths]; out=[]
    for i in range(min(map(len,parts))):
        if all(p[i]==parts[0][i] for p in parts): out.append(parts[0][i])
        else: break
    return '.'.join(out) or None
def supertype_kind(g,sk,seen=()):
    if (g,sk) in derived_super: return derived_super[(g,sk)]
    members=unions[g].get(sk)
    if not members or sk in seen: return None
    vs=[]
    for m in members:
        v=gk2v[g].get(m) or supertype_kind(g,m,seen+(sk,))
        if v: vs.append(v)
    flat=[]
    for v in vs: flat.extend(v.split(' | '))
    if not flat or len(vs)<max(2,len(members)//2): derived_super[(g,sk)]=None; return None
    byns=collections.defaultdict(list)
    for v in flat: byns[v.split('.')[0]].append(v)
    # a namespace is admitted as a set only when the union names every claimed kind of that namespace in this grammar
    parts=[]
    for ns,ps in byns.items():
        claimed_in_ns={x for x in gk2v[g].values() if x==ns or x.startswith(ns+'.')}
        cover=len(set(ps))/max(1,len(claimed_in_ns))
        parts.append(ns if cover>=1.0 else ' | '.join(sorted(set(ps))))
    res=' | '.join(sorted(parts))
    # a set may include another set only when that set does not include it back
    incl.setdefault((g,sk),set()).update(x for x in parts if '.' not in x and x!=sk)
    derived_super[(g,sk)]=res; return res
provisional_used=collections.Counter()
def kind_to_vocab(g,tname):
    if tname in ('number','boolean','string'): return tname
    if tname.startswith('text:'): return tname
    if tname.startswith('TSKindId.'):
        member=tname[9:]
        tok=snake(member.lstrip('_'))
        if tok in gk2v[g]: return gk2v[g][tok]
        if member.endswith('Keyword'): return gk2v[g].get('identifier','identifier')
        return f"literal:{member}"
    sk=snake(tname)
    if sk in gk2v[g]: return gk2v[g][sk]
    ds=supertype_kind(g,sk)
    if ds: provisional_used[(g,sk,ds)]+=1; return ds
    return f'<{g}:{sk}>'
refinements={}
vk=collections.defaultdict(lambda:collections.defaultdict(lambda:dict(kinds=set(),optional=False,multiple=False,scalar=False,grammars=set())))
claimers=collections.defaultdict(set)
for g in GRAMMARS:
    for gk,vs in claims[g].items():
        for v,p,lits,tl in vs:
            claimers[v].add(g)
            if p: continue
            if lits:
                parent=gk2v[g][gk]
                if parent!=v:
                    entry=refinements.setdefault(v,(parent,{}))
                    for f,t in lits.items(): entry[1].setdefault(f,set()).add(t)
                    continue
            for mem in ifaces[g].get(gk,[]):
                raw=mem['name'].lstrip('_'); rn=renames.get((g,gk),{})
                # a claim's capture renames the slot it names (by field or by node kind); otherwise the names rules apply:
                # a marker boolean takes the keyword it marks, a modifier enum takes the noun
                cm=camel(rn.get(raw) or next((m for k,m in rn.items() if k==raw or snake(k)==raw or k==snake(raw)), None) or re.sub(r'(?:_marker|Marker|_modifier|Modifier)$','',raw))
                slot=vk[v][cm]
                for k in mem['kinds']: slot['kinds'].update(kind_to_vocab(g,k).split(' | ')); slot['optional']|=mem['optional']; slot['multiple']|=mem['multiple']; slot['scalar']|=not mem['multiple']; slot['grammars'].add(g)
# a container's captures become optional members of every kind its element admits
for g,top in containers:
    slots=ifaces[g].get(top.kind,[])
    def slot_for(n):
        if n.field: return next((m for m in slots if m['name'].lstrip('_')==n.field or snake(m['name'].lstrip('_'))==n.field),None)
        if n.kind and n.kind not in ('<token>','_','<group>'):
            return next((m for m in slots if any(snake(k[9:] if k.startswith('TSKindId.') else k)==n.kind for k in m['kinds'])),None)
        return next((m for m in slots if not all(k in ('boolean','string','number') or k.startswith('text:') for k in m['kinds'])),None)
    elem=next(n for n in walk(top) if 'element' in n.captures)
    targets=set()
    for k in (slot_for(elem) or {'kinds':[]})['kinds']:
        for v in kind_to_vocab(g,k).split(' | '):
            if v.startswith('<') or v in ('boolean','string','number') or v.startswith('text:'): continue
            if '.' in v: targets.add(v)
            else: targets.update(pth for pth,gs in claimers.items() if g in gs and (pth==v or pth.startswith(v+'.')))
    for n in walk(top):
        for cap in n.captures:
            if cap=='element' or cap.startswith('_'): continue
            if n.kind=='<token>': kinds={'boolean'}; multiple=False
            else:
                sl=slot_for(n)
                if sl: kinds={x for k in sl['kinds'] for x in kind_to_vocab(g,k).split(' | ')}; multiple=sl['multiple']
                elif n.kind in gk2v[g]: kinds={gk2v[g][n.kind]}; multiple=False
                else: continue
            for t in targets:
                slot=vk[t][camel(cap)]; slot['kinds'].update(kinds); slot['optional']=True; slot['multiple']|=multiple; slot['scalar']|=not multiple; slot['grammars'].add(g)
def collapse(kinds):
    ks=set(kinds)
    if any(k.startswith('text:') for k in ks): ks.discard('number')
    # collapse to a set only when the set itself is admitted; a partial set stays as its leaves
    for ns in ('expression','statement','pattern','type','declaration'):
        subs={k for k in ks if k.startswith(ns+'.')}
        if ns in ks: ks-=subs
    return ks
for v,m in vk.items():
    for cm,slot in m.items(): slot['kinds']=collapse(slot['kinds'])
prefixes=set()
for v in allvocab:
    parts=v.split('.')
    for i in range(1,len(parts)): prefixes.add('.'.join(parts[:i]))
out=['// BaseContext — the typemap: every vocabulary kind, keyed by its dotted path; prefixes are kind-sets.','export interface BaseContext {']
for v in sorted(allvocab|prefixes):
    gs=''.join(sorted(x[0] for x in claimers.get(v,())))
    out.append(f"  '{v}': {pascal_path(v)};{'   // prefix' if v not in allvocab else ''}{'   // '+gs if gs else ''}")
out.append('}\n')
byns=collections.defaultdict(list)
for v in sorted(allvocab): byns[v.split('.')[0]].append(v)
def tyof(k):
    if k in ('number','boolean','string'): return k
    if k.startswith('text:'): return repr(k[5:])
    if k.startswith('literal:'): return f"'{k[8:]}'"
    if k.startswith('<'): return k
    return f"G['{k}']"
for ns,vs in byns.items():
    out.append(f'export namespace {pascal_path(ns)} {{')
    for v in vs:
        rest=v.split('.',1)[1] if '.' in v else v
        name=pascal_path(rest).replace('.','_')
        mems=vk.get(v,{}); gs=''.join(sorted(x[0] for x in claimers[v])); cd=' content-derived' if v in content else ''
        if v in refinements:
            parent,lits=refinements[v]
            rest_p=parent.split('.',1)[1] if '.' in parent else parent
            pname=pascal_path(rest_p).replace('.','_') if parent.split('.')[0]==ns else pascal_path(parent)
            lit=' & '.join(f"{{ {camel(f)}: {' | '.join(repr(t) for t in sorted(ts))} }}" for f,ts in lits.items())
            out.append(f"  export type {name}<G extends GrammarContext> = {pname}<G> & {lit};   // {gs}"); continue
        head=f"  export type {name}<G extends GrammarContext> = {{   // {gs}{cd}"
        if not mems: out.append(head+' }'); continue
        out.append(head)
        for cm,slot in sorted(mems.items()):
            ks=' | '.join(tyof(k) for k in sorted(slot['kinds']))
            if slot['multiple']: ks=f'({ks})[]' if '|' in ks else ks+'[]'
            gtag=''.join(sorted(x[0] for x in slot['grammars']))
            only='' if slot['grammars']==claimers[v] else f'   // {gtag} only'
            out.append(f"    {cm}{'?' if slot['optional'] else ''}: {ks};{only}")
        out.append('  }')
    out.append('}\n')
with open(sys.argv[1],'w') as draft_file:
    draft_file.write('\n'.join(out))
empties=[(g,gk,m['name'],m['kinds']) for g in GRAMMARS for gk,ms in ifaces[g].items() for m in ms if '' in m['kinds'] or any(k=='' for k in m['kinds'])]
print('empty-kind members:',empties[:4])
print('refinements folded:',len(refinements))
print('vocab kinds',len(allvocab),'prefixes',len(prefixes),'content-derived',len(content),'members total',sum(len(m) for m in vk.values()))
unmapped=collections.Counter()
for v,m in vk.items():
    for cm,slot in m.items():
        for k in slot['kinds']:
            if k.startswith('<'): unmapped[k]+=1
cyc=[(g,a,b) for (g,a),bs in incl.items() for b in bs if a in incl.get((g,b),())]
print('set-inclusion cycles:',cyc or 'none')
print('derived supertype → namespace:',sorted({(g,sk,ds) for (g,sk,ds) in provisional_used}))
byns_un=collections.defaultdict(collections.Counter)
for v,m in vk.items():
    for cm,slot in m.items():
        for k in slot['kinds']:
            if k.startswith('<'): byns_un[v.split('.')[0]][k]+=1
for ns,c in sorted(byns_un.items()): print(f'  [{ns}] unmapped refs {sum(c.values())}: '+' '.join(f'{k[1:-1]}×{n}' for k,n in c.most_common(12)))
print('unmapped member kinds:',len(unmapped)); print(' ', ' '.join(f'{k}×{c}' for k,c in unmapped.most_common(40)))

if len(sys.argv)>2 and sys.argv[2]=='--members':
    print('\n=== member names per shared kind (grammars carrying each name) ===')
    for v in sorted(vk):
        if len(claimers[v])<2 or v in refinements: continue
        rows=[]
        for cm,slot in sorted(vk[v].items()):
            gt=''.join(sorted(x[0] for x in slot['grammars']))
            mark='' if slot['grammars']==claimers[v] else '*'
            ks=' | '.join(sorted(k for k in slot['kinds']))
            rows.append(f'  {cm}({gt}){mark}: {ks}')
        print(f"{v} [{''.join(sorted(x[0] for x in claimers[v]))}]"); print('\n'.join(rows))

# ── emit: one file per top-level namespace, interface + namespace at every level, interface alone at a leaf ──
if len(sys.argv)>2 and sys.argv[2]=='--emit':
    import os
    outdir=sys.argv[3]; os.makedirs(outdir,exist_ok=True)
    tops=sorted({v.split('.')[0] for v in allvocab})
    def tsname(seg): return ''.join(w.capitalize() for w in seg.split('_'))
    def ref(path): return 'V.'+'.'.join(tsname(s) for s in path.split('.'))+'<G>'
    CONTAINER_ELEMENTS={'parameters':"V.Declaration.Parameter<G>[]",'formal_parameters':"V.Declaration.Parameter<G>[]",'lambda_parameters':"V.Declaration.Parameter<G>[]",'closure_parameters':"V.Declaration.Parameter<G>[]",
        'type_parameters':"V.Declaration.TypeParameter<G>[]",'type_arguments':"G['type'][]",'arguments':"(G['expression'] | G['element'])[]",'argument_list':"(G['expression'] | G['element'] | G['argument'])[]",
        'class_body':"G['declaration'][]",'declaration_list':"G['declaration'][]",'enum_body':"V.Declaration.EnumMember<G>[]",'enum_variant_list':"V.Declaration.EnumMember<G>[]",'field_declaration_list':"V.Declaration.Field<G>[]",'ordered_field_declaration_list':"V.Declaration.Field<G>[]",
        'suite_block':"V.Statement.Block<G>",'simple_statements':"V.Statement.Block<G>",'block':"V.Statement.Block<G>",'type_annotation':"G['type']",'type_predicate_annotation':"V.Type.Predicate<G>",'asserts_annotation':"V.Type.Predicate.Asserts<G>",'omitting_type_annotation':"G['type']",'adding_type_annotation':"G['type']",'opting_type_annotation':"G['type']",'decorated_definition':"G['declaration']",'ambient_declaration':"G['declaration']",'labeled_statement':"G['statement']",'class_heritage':"(G['type'] | G['expression'])[]",'object_type_content':"G['declaration'][]",'switch_body':"V.Clause.Case<G>[]",'named_imports':"V.Clause.Import.Specifier<G>[]",'field_initializer_list':"G['element'][]",'use_list':"G['clause'][]",'scoped_use_list':"G['clause'][]",'expression_list':"G['expression'][]",'pattern_list':"G['pattern'][]"}
    LAYOUT={'terminator','automaticSemicolon','separator','stringStart','stringEnd','stringOpen','stringClose','newline','hashBangLine','shebang'}
    def tyof_member(kinds):
        out=[]; drop=[]
        byns=collections.defaultdict(set)
        for k in kinds:
            if '.' in k and not k.startswith(('text:','literal:','<')): byns[k.split('.')[0]].add(k)
        kinds=set(kinds)
        for ns,ks in byns.items():
            if ns in kinds: kinds-=ks; continue
            if len(ks)<2: continue
            # the smallest kind-set covering the admitted leaves: the namespace itself when their common
            # prefix is its root, a sub-namespace's set otherwise
            prefix=common_prefix(sorted(ks)) or ns
            if prefix==ns: kinds-=ks; kinds.add(ns)
            elif any(o.startswith(prefix+'.') for o in allvocab|prefixes): kinds-=ks; kinds.add('set:'+prefix)
        for k in sorted(kinds):
            if k in ('boolean','string','number'): out.append(k)
            elif k.startswith('text:'): out.append(repr(k[5:]))
            elif k.startswith('literal:'): drop.append(k)
            elif k.startswith('<'):
                gk=k[1:-1].split(':',1)[1]
                if gk in CONTAINER_ELEMENTS: out.append(CONTAINER_ELEMENTS[gk])
                else: out.append(f"V.Unmapped<{repr(k[1:-1])}>"); drop.append(k)
            elif k.startswith('set:'): out.append('V.'+'.'.join(tsname(x) for x in k[4:].split('.'))+'.Kinds<G>')
            elif '.' not in k: out.append(f"G['{k}']")
            else: out.append(ref(k))
        return (' | '.join(dict.fromkeys(out)) or 'unknown'), drop
    def is_leaf(v): return not any(o!=v and o.startswith(v+'.') for o in allvocab|prefixes)
    def level_members(v):
        if v in refinements: return {}
        merged={}
        for o in allvocab:
            by_path = o==v or o.startswith(v+'.')
            by_claim = o in refinements and refinements[o][0]==v
            if not (by_path or by_claim): continue
            if o in refinements:
                parent,lits=refinements[o]
                for f,ts in lits.items():
                    cm=camel(f); m=merged.setdefault(cm,dict(kinds=set(),optional=False,multiple=False,scalar=True,grammars=set()))
                    m['kinds']|={'text:'+t for t in ts}; m['grammars']|=claimers.get(o,set())
                continue
            for cm,slot in vk.get(o,{}).items():
                m=merged.setdefault(cm,dict(kinds=set(),optional=False,multiple=False,scalar=False,grammars=set()))
                m['kinds']|=slot['kinds']; m['optional']|=slot['optional'] or o!=v; m['multiple']|=slot['multiple']; m['scalar']|=slot.get('scalar',not slot['multiple']); m['grammars']|=slot['grammars']
        own=set(vk.get(v,{}))
        for cm,m in merged.items():
            if cm in own: m['optional']=vk[v][cm]['optional'] or vk[v][cm]['grammars']!=claimers.get(v,set()) or any(cm not in vk.get(o,{}) for o in allvocab if o.startswith(v+'.') and o not in refinements)
        return merged
    def emit_level(v, depth, lines):
        seg=v.split('.')[-1]; name=tsname(seg); ind='  '*depth
        parent='.'.join(v.split('.')[:-1])
        ext=f" extends {ref(parent) if parent and parent.split('.')[0]==v.split('.')[0] else ''}" if parent and '.' in v else ''
        if parent and parent.split('.')[0]!=v.split('.')[0]: ext=''
        # refinement: parent & literal
        if v in holes and v not in refinements:
            parent='.'.join(v.split('.')[:-1])
            ext=f" extends {ref(parent)}" if parent in allvocab|prefixes else ''
            body=' '.join(f"readonly {m}: {t};" for m,t in sorted(holes[v].items()))
            gs=''.join(sorted(x[0] for x in claimers.get(v,())))
            lines.append(f"{ind}export interface {name}<G extends GrammarContext>{ext} {{ {body} }}   // claimed by {gs} content-derived")
            kids=sorted({o for o in allvocab|prefixes if o.startswith(v+'.') and o.count('.')==v.count('.')+1})
            if not kids: return
        if v in refinements:
            p_,lits=refinements[v]
            path_parent='.'.join(v.split('.')[:-1])
            base=path_parent if path_parent in allvocab else p_   # an unclaimed prefix carries no members of its own
            body=' '.join(f"readonly {camel(f)}: {' | '.join(repr(t) for t in sorted(ts))};" for f,ts in lits.items())
            lines.append(f"{ind}export interface {name}<G extends GrammarContext> extends {ref(base)} {{ {body} }}")
        else:
            mems=level_members(v)
            gs=''.join(sorted(x[0] for x in claimers.get(v,())))
            tag=f"   // claimed by {gs}" if gs else ''
            if not mems:
                lines.append(f"{ind}export interface {name}<G extends GrammarContext>{ext} {{}}{tag}")
            else:
                lines.append(f"{ind}export interface {name}<G extends GrammarContext>{ext} {{{tag}")
                for cm,slot in sorted(mems.items()):
                    if cm in LAYOUT: continue
                    ty,drop=tyof_member(slot['kinds'])
                    if slot['multiple'] and not ty.endswith('[]'):
                        arr=f"({ty})[]" if '|' in ty else ty+'[]'
                        ty=f"{ty} | {arr}" if slot.get('scalar') else arr
                    gt=''.join(sorted(x[0] for x in slot['grammars'])); only='' if slot['grammars']==claimers.get(v,set()) else f"   // {gt} only"
                    dropc=f"   // unmapped: {' '.join(drop)}" if drop else ''
                    lines.append(f"{ind}  readonly {cm}{'?' if slot['optional'] else ''}: {ty};{only}{dropc}")
                lines.append(f"{ind}}}")
        kids=sorted({o for o in allvocab|prefixes if o.startswith(v+'.') and o.count('.')==v.count('.')+1})
        if kids:
            lines.append(f"{ind}export namespace {name} {{")
            for k in kids: emit_level(k, depth+1, lines)
            claimed=[o for o in allvocab if o==v or o.startswith(v+'.')]
            lines.append(f"{ind}  export type Kinds<G extends GrammarContext> = "+(' | '.join(ref(o) for o in sorted(claimed)) if claimed else 'never')+';')
            lines.append(f"{ind}}}")
    for top in tops:
        lines=["// Generated from the grammars' bindings.scm and slot models. Do not edit.","import type { GrammarContext } from './context.ts';"]
        lines.append("import type * as V from './index.ts';")
        lines.append('')
        emit_level(top,0,lines)
        # top-level Kinds alias when the top itself has no namespace block (all leaves)
        if not any(o.startswith(top+'.') for o in allvocab|prefixes):
            lines.append(f"export namespace {tsname(top)} {{ export type Kinds<G extends GrammarContext> = {tsname(top)}<G>; }}")
        with open(f'{outdir}/{top}.ts','w') as out_file: out_file.write('\n'.join(lines)+'\n')
    ctx=["// Generated from the grammars' bindings.scm. Do not edit.","import type * as V from './index.ts';","",
         "/** The typemap: one key per top-level namespace, projecting to that namespace's kind-set for a grammar. */",
         "export interface GrammarContext {"]+[f"  readonly '{t}': unknown;" for t in tops]+["}","",
         "/** A grammar kind a member admits that no binding claims yet; the name says which. */",
         "export interface Unmapped<K extends string> { readonly $unmapped: K }","",
         "/** The permissive closure: every namespace's full kind-set. */","export interface BaseContext extends GrammarContext {"]+[f"  readonly '{t}': V.{tsname(t)}.Kinds<BaseContext>;" for t in tops]+["}"]
    with open(f'{outdir}/context.ts','w') as out_file: out_file.write('\n'.join(ctx)+'\n')
    idx=["// Generated from the grammars' bindings.scm. Do not edit."]+[f"export * from './{t}.ts';" for t in tops]+["export type { GrammarContext, BaseContext, Unmapped } from './context.ts';"]
    with open(f'{outdir}/index.ts','w') as out_file: out_file.write('\n'.join(idx)+'\n')
    import subprocess
    fmt=subprocess.run(['pnpm','exec','oxfmt',*[f'{outdir}/{t}.ts' for t in tops],f'{outdir}/context.ts',f'{outdir}/index.ts'],cwd=ROOT,capture_output=True,text=True)
    if fmt.returncode!=0:
        sys.stderr.write(fmt.stdout+fmt.stderr); sys.exit(fmt.returncode)
    print('emitted',len(tops),'namespace files into',outdir)
