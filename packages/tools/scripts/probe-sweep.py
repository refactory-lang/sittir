#!/usr/bin/env python3
"""Cross-tree probe-kind sweep for regression diffing.

Runs identical `sittir tool probe-kind` invocations in two checkouts of this
repo (e.g. a current tree and a baseline worktree), saves both raw JSON
outputs per fixture, diffs the rendered text, and labels each fixture
mechanically. Used to attribute validator regressions to render vs
transport vs measurement changes between two commits.

Layout expected under --root (produced by a prior collection pass):
  <root>/<grammar>/probes/<slug>/source.txt   fixture source to probe
  <root>/<grammar>/probes/<slug>/INFO.txt     optional; "Kind: <kind>" line
Outputs written next to each source.txt: pr2.txt, pr3.txt (full probe JSON),
render.diff, plus a per-grammar manifest.tsv at <root>/<grammar>/.

Example:
  python3 packages/tools/scripts/probe-sweep.py \
    --root /tmp/regression-probes \
    --baseline ../sittir-worktrees/pr2-reconcile \
    rust typescript python
"""
import argparse
import difflib
import json
import os
import re
import subprocess
import sys

FALLBACK_KIND = {"rust": "source_file", "typescript": "program", "python": "module"}

env = {k: v for k, v in os.environ.items() if k != "SITTIR_NATIVE_DEBUG"}


def probe(tree, grammar, kind, srcfile):
    cmd = [
        "pnpm", "exec", "tsx", "packages/cli/src/cli.ts", "tool", "probe-kind",
        "-g", grammar, "--stdin", "-k", kind, "--reparse",
    ]
    try:
        with open(srcfile) as f:
            p = subprocess.run(cmd, cwd=tree, stdin=f, capture_output=True,
                               text=True, timeout=180, env=env)
        return p.stdout, p.stderr, p.returncode
    except subprocess.TimeoutExpired:
        return "", "TIMEOUT after 180s", -1


def rendered_of(stdout):
    try:
        d = json.loads(stdout)
    except (json.JSONDecodeError, ValueError):
        return None, None, "unparseable"
    return d.get("rendered"), d.get("renderError"), None


def tokens(s):
    return re.findall(r"\S+", s)


def label(baseline_out, current_out):
    r2, e2, bad2 = rendered_of(baseline_out)
    r3, e3, bad3 = rendered_of(current_out)
    if bad3:
        return "CURRENT-PROBE-ERROR", (current_out or "")[:120]
    if e3 is not None:
        return "CURRENT-RENDER-ERROR", str(e3).split("\n")[0][:160]
    if bad2:
        return "BASELINE-PROBE-ERROR", (baseline_out or "")[:120]
    if e2 is not None:
        return "BASELINE-RENDER-ERROR", str(e2).split("\n")[0][:160]
    if r2 is None or r3 is None:
        return "NO-RENDER-FIELD", ""
    if r2 == r3:
        return "IDENTICAL", ""
    if re.sub(r"\s+", "", r2) == re.sub(r"\s+", "", r3):
        return "WHITESPACE-ONLY", ""
    t2, t3 = tokens(r2), tokens(r3)
    if sorted(t2) == sorted(t3):
        return "REORDERED", ""
    s2, s3 = set(t2), set(t3)
    if s3 < s2:
        return "MISSING-TEXT", " ".join(sorted(s2 - s3))[:160]
    if s2 < s3:
        return "EXTRA-TEXT", " ".join(sorted(s3 - s2))[:160]
    return "MIXED", ""


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", required=True, help="collection root directory")
    ap.add_argument("--baseline", required=True,
                    help="baseline tree checkout (e.g. a worktree at the comparison commit)")
    ap.add_argument("--current", default=os.getcwd(),
                    help="current tree checkout (default: cwd)")
    ap.add_argument("grammars", nargs="*", default=["rust", "typescript", "python"])
    args = ap.parse_args()

    for g in args.grammars or ["rust", "typescript", "python"]:
        pdir = os.path.join(args.root, g, "probes")
        if not os.path.isdir(pdir):
            continue
        rows = []
        dirs = sorted(os.listdir(pdir))
        for i, name in enumerate(dirs):
            d = os.path.join(pdir, name)
            src = os.path.join(d, "source.txt")
            if not os.path.isfile(src):
                rows.append((name, "?", "NO-SOURCE", ""))
                continue
            kind = FALLBACK_KIND.get(g, "source_file")
            info = os.path.join(d, "INFO.txt")
            if os.path.isfile(info):
                m = re.search(r"^Kind:\s*(\S+)", open(info).read(), re.M)
                if m:
                    kind = m.group(1)
            cur_out, cur_err, _ = probe(args.current, g, kind, src)
            base_out, base_err, _ = probe(args.baseline, g, kind, src)
            open(os.path.join(d, "pr3.txt"), "w").write(cur_out or ("STDERR:\n" + cur_err))
            open(os.path.join(d, "pr2.txt"), "w").write(base_out or ("STDERR:\n" + base_err))
            lab, detail = label(base_out, cur_out)
            r2 = rendered_of(base_out)[0] or ""
            r3 = rendered_of(cur_out)[0] or ""
            diff = "\n".join(difflib.unified_diff(
                r2.splitlines(), r3.splitlines(), "baseline", "current", lineterm=""))
            open(os.path.join(d, "render.diff"), "w").write(diff)
            rows.append((name, kind, lab, detail))
            print(f"[{g} {i + 1}/{len(dirs)}] {name}: {lab}", flush=True)
        with open(os.path.join(args.root, g, "manifest.tsv"), "w") as mf:
            for row in rows:
                mf.write("\t".join(row) + "\n")
        print(f"== {g} done: {len(rows)} rows ==", flush=True)


if __name__ == "__main__":
    main()
