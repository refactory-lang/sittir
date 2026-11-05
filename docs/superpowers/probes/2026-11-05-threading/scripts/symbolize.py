"""Names a stripped addon's frames in a macOS `sample` report from its unstripped copy.
   python3 -I symbolize.py <sample.txt> <unstripped .node> <out.txt>

A release addon is stripped after its build, so `sample` prints its frames as `???  (in <image>)  load address L
+ OFF`. build-native keeps the unstripped copy beside its stamp (node_modules/.cache/sittir/native-build/<grammar>/);
the nearest function symbol at or below each offset in its `nm` table names the frame, and every such frame is rewritten as `<symbol>  (in <image>)`, so sample_main.py
splits the report as it does a symbolized one."""
import bisect, os, re, subprocess, sys

report, unstripped, out = sys.argv[1:4]
image = os.path.basename(unstripped)
FRAME = re.compile(r'\?\?\?  \(in ' + re.escape(image) + r'\)  load address 0x[0-9a-f]+ \+ (0x[0-9a-f]+)  \[0x[0-9a-f]+\]')
text = open(report).read()
offsets = sorted(set(FRAME.findall(text)), key=lambda o: int(o, 16))
table = subprocess.run(['nm', '-n', unstripped], capture_output=True, text=True, check=True).stdout.split('\n')
functions = [(int(parts[0], 16), parts[2]) for parts in (line.split() for line in table) if len(parts) == 3 and parts[1] in 'tT']
starts = [start for start, _ in functions]
names = {}
for offset in offsets:
    at = bisect.bisect_right(starts, int(offset, 16)) - 1
    names[offset] = functions[at][1].lstrip('_') if at >= 0 else '???'
open(out, 'w').write(FRAME.sub(lambda m: f'{names.get(m.group(1), "???")}  (in {image})', text))
print(f'{len(offsets)} offsets named into {out}')
