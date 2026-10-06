#!/usr/bin/env python3
"""Codec census: what the hand-printed napi decoders accept, against the
read facts the transport declarations already state.

For every enum a grammar's `transport.rs` declares with `#[derive(Transport)]`
(choices and enum kinds), each variant's decode ids (the kind ids its
`FromNapiValue` arms send to that variant) are compared with the ids its
`#[kind(...)]` attribute claims (`kinds`, `display(..)`, `folded(..)`). A
blank variant is compared with id 0. Decode arms that try several variants in
turn ("decode trials") are listed with the variants they try. For every leaf
struct, the text its decoder gives a bare kind id is compared with the
struct's `text = "..."` attribute.

Usage: python3 codec-census.py [repo-root]   (default: the current directory)
Exit status: 0 when every compared fact agrees, 1 otherwise.
"""
import re
import sys
from pathlib import Path

GRAMMARS = ["rust", "typescript", "python", "scm", "regex"]

CONST_RE = re.compile(r"^pub const ([A-Z0-9_]+): KindId = KindId\((\d+)\);", re.M)
ITEM_RE = re.compile(r"^#\[transport\(([^\n]*)\)\]\npub (enum|struct) (\w+) \{\n(.*?)^\}", re.M | re.S)
UNDERIVED_ENUM_RE = re.compile(r"^#\[derive\(Debug, Clone, PartialEq\)\]\npub enum (\w+) \{\n(.*?)^\}", re.M | re.S)
VARIANT_RE = re.compile(r"^\s+(\w+)(\((.*)\))?,\s*$")
IMPL_RE = "impl ::napi::bindgen_prelude::FromNapiValue for {name} {{\n"


def split_top(args):
    out, depth, cur = [], 0, ""
    for ch in args:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            out.append(cur.strip())
            cur = ""
        else:
            cur += ch
    if cur.strip():
        out.append(cur.strip())
    return out


def resolve(path, consts):
    name = path.strip().split("::")[-1]
    if path.strip().startswith("kind::") and name in consts:
        return consts[name]
    raise KeyError(f"unresolved kind path {path!r}")


def kind_claims(args, consts):
    ids = set()
    for item in split_top(args):
        if item == "display":
            continue
        m = re.fullmatch(r"(display|folded)\((.*)\)", item)
        ids.add(resolve(m.group(2) if m else item, consts))
    return ids


def variants_of(body, consts):
    out, pending = [], []
    for line in body.splitlines():
        s = line.strip()
        if s.startswith("#["):
            pending.append(s)
            continue
        m = VARIANT_RE.match(line)
        if not m:
            continue
        claims, blank = None, False
        for attr in pending:
            if attr.startswith("#[kind("):
                claims = kind_claims(attr[len("#[kind("):-2], consts)
            elif attr == "#[transport(blank)]":
                blank = True
        out.append({"name": m.group(1), "payload": m.group(3), "claims": claims, "blank": blank})
        pending = []
    return out


def decoder_of(text, name):
    start = text.find(IMPL_RE.format(name=name))
    if start < 0:
        return None
    end = text.find("\n}\n", start)
    return text[start:end]


ARM_RE = re.compile(r"^\s+([\d |]+?) => (\{|Ok\((?:Self|AnyTransport)::(\w+))", re.M)
TRIED_RE = re.compile(r"return Ok\(Self::(\w+)\(")


def decode_arms(decoder):
    """variant -> decode ids, plus trial arms (id -> variants tried) and the
    verbatim forms the decoder accepts."""
    by_variant, trials = {}, {}
    lines = decoder.splitlines()
    i = 0
    while i < len(lines):
        m = ARM_RE.match(lines[i])
        if m:
            ids = [int(x) for x in m.group(1).split("|")]
            if m.group(2) == "{":
                tried = []
                i += 1
                while i < len(lines) and not lines[i].strip().startswith("},"):
                    t = TRIED_RE.search(lines[i])
                    if t:
                        tried.append(t.group(1))
                    i += 1
                for id_ in ids:
                    trials[id_] = tried
            else:
                for id_ in ids:
                    by_variant.setdefault(m.group(3), set()).add(id_)
        i += 1
    verbatim = []
    if "::napi::ValueType::String => Ok(Self::Verbatim" in decoder:
        verbatim.append("string")
    if "KindId::ERROR.0 => Ok(Self::Verbatim" in decoder:
        verbatim.append("ERROR object")
    text_arms = sorted(int(x) for x in re.findall(r"^\s+(\d+) if text\.is_some\(\)", decoder, re.M))
    return by_variant, trials, verbatim, text_arms


def leaf_text_of(decoder):
    m = re.search(r"::napi::ValueType::Number => (\".*?\")\.to_string\(\),", decoder)
    return m.group(1) if m else None


def census(root, grammar):
    crate = root / "rust" / "crates" / f"sittir-{grammar}" / "src" / "render"
    consts = dict(CONST_RE.findall((crate / "kind_ids.rs").read_text()))
    consts = {k: int(v) for k, v in consts.items()}
    text = (crate / "transport.rs").read_text()
    report = {"enums": 0, "variants": 0, "agree": 0, "differ": [], "trials": [], "no_decoder": [],
              "verbatim": 0, "leaves": 0, "leaf_agree": 0, "leaf_differ": [], "underived": []}
    for attrs, item, name, body in ITEM_RE.findall(text):
        decoder = decoder_of(text, name)
        if item == "struct":
            m = re.search(r"\btext(?: = (\".*?\"))?(?:,|$)", attrs)
            if not m or decoder is None:
                continue
            report["leaves"] += 1
            stated, decoded = m.group(1), leaf_text_of(decoder)
            if stated == decoded:
                report["leaf_agree"] += 1
            else:
                report["leaf_differ"].append(f"{name}: text attribute {stated} / decoder {decoded}")
            continue
        report["enums"] += 1
        if decoder is None:
            report["no_decoder"].append(name)
            continue
        by_variant, trials, verbatim, _ = decode_arms(decoder)
        if verbatim:
            report["verbatim"] += 1
        for id_, tried in sorted(trials.items()):
            report["trials"].append(f"{name} id {id_} tries {', '.join(tried) or '(none)'}")
        for v in variants_of(body, consts):
            if v["claims"] is None and not v["blank"]:
                continue
            report["variants"] += 1
            stated = {0} if v["blank"] else v["claims"]
            decoded = by_variant.get(v["name"], set())
            if stated == decoded:
                report["agree"] += 1
            else:
                only_decoded, only_stated = sorted(decoded - stated), sorted(stated - decoded)
                report["differ"].append(f"{name}::{v['name']}: decoded only {only_decoded}, stated only {only_stated}")
    for name, body in UNDERIVED_ENUM_RE.findall(text):
        decoder = decoder_of(text, name)
        if decoder is None:
            continue
        by_variant, trials, verbatim, text_arms = decode_arms(decoder)
        report["underived"].append(
            f"{name}: {len(by_variant)} variants by id, verbatim from {verbatim or 'nothing'}, text arms {text_arms}")
    return report


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    failed = False
    for grammar in GRAMMARS:
        r = census(root, grammar)
        print(f"{grammar}: {r['enums']} derived enums, {r['variants']} claiming variants, "
              f"{r['agree']} agree, {len(r['differ'])} differ; {len(r['trials'])} decode trials; "
              f"{r['verbatim']} enums decode verbatim; leaves {r['leaf_agree']}/{r['leaves']} agree; "
              f"no decoder: {len(r['no_decoder'])}")
        for line in r["differ"] + r["leaf_differ"]:
            print(f"  differ  {line}")
        for line in r["trials"]:
            print(f"  trial   {line}")
        for line in r["no_decoder"]:
            print(f"  nodec   {line}")
        for line in r["underived"]:
            print(f"  underived {line}")
        failed = failed or bool(r["differ"] or r["leaf_differ"] or r["no_decoder"])
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
