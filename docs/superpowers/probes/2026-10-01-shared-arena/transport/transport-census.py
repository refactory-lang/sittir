"""Census of a generated transport.rs: transport structs and their slot fields, slot enums, and the
share of lines in napi FromNapiValue / ToNapiValue impls and in render functions.
Usage: python3 transport-census.py <transport.rs>..."""
import re, sys

for path in sys.argv[1:]:
    lines = open(path).read().split('\n')
    structs = slots = enums = 0
    napi_lines = render_lines = 0
    i = 0
    while i < len(lines):
        line = lines[i]
        m_struct = re.match(r'pub struct (\w+)Transport \{', line)
        is_napi_impl = re.match(r'(unsafe )?impl\b.*\b(FromNapiValue|ToNapiValue) for ', line)
        is_render_fn = re.match(r'(pub )?fn render_\w+\(', line)
        if m_struct:
            structs += 1
            j = i + 1
            while not lines[j].startswith('}'):
                if re.match(r'\s+pub \w+: ', lines[j]) and not re.match(r'\s+pub (transport_trivia_data|edges|source_gap|source_flank):', lines[j]):
                    slots += 1
                j += 1
            i = j
        elif re.match(r'pub enum \w+', line):
            enums += 1
        elif is_napi_impl or is_render_fn:
            j = i
            while not lines[j].startswith('}'):
                j += 1
            n = j - i + 1
            if is_napi_impl:
                napi_lines += n
            else:
                render_lines += n
            i = j
        i += 1
    total = len(lines)
    name = path.split('/')[-4]
    print(f'{name}: {total} lines, {structs} transport structs, {slots} slot fields, {enums} enums; '
          f'napi From/To impls {napi_lines} lines ({100*napi_lines/total:.1f}%), render fns {render_lines} lines ({100*render_lines/total:.1f}%)')
