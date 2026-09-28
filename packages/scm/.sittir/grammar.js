"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/scm/grammar.sittir.ts
var grammar_sittir_exports = {};
__export(grammar_sittir_exports, {
  default: () => grammar_sittir_default
});
module.exports = __toCommonJS(grammar_sittir_exports);
var import_grammar = __toESM(require("tree-sitter-scm/grammar.js"), 1);

// packages/codegen/src/types/rule-types.ts
var SEQ = "SEQ";
var OPTIONAL = "OPTIONAL";
var CHOICE = "CHOICE";
var REPEAT = "REPEAT";
var REPEAT1 = "REPEAT1";
var FIELD = "FIELD";
var SUPERTYPE = "SUPERTYPE";
var STRING = "STRING";
var PATTERN = "PATTERN";
var INDENT = "INDENT";
var DEDENT = "DEDENT";
var NEWLINE = "NEWLINE";
var SYMBOL = "SYMBOL";
var ALIAS = "ALIAS";
var TOKEN = "TOKEN";
var IMMEDIATE_TOKEN = "IMMEDIATE_TOKEN";

// packages/codegen/src/types/runtime-shapes.ts
function extractSymbolName(v) {
  if (!v || typeof v !== "object") return void 0;
  const r = v;
  const t = r.type;
  if (isSymbolType(t)) return typeof r.name === "string" ? r.name : void 0;
  if (r.symbol && typeof r.symbol === "object") {
    return extractSymbolName(r.symbol);
  }
  return void 0;
}
function isFieldLike(v) {
  if (!v || typeof v !== "object") return false;
  const t = v.type;
  return t === "FIELD" && typeof v.name === "string";
}
function isEnrichShapedFieldWrapper(v) {
  if (!isFieldLike(v)) return false;
  const symName = extractSymbolName(v.content);
  if (symName === void 0) return false;
  if (symName.startsWith("_kw_")) return true;
  const strippedSym = symName.replace(/^_/, "");
  if (v.name === symName || v.name === strippedSym) return true;
  const baseName = v.name.replace(/[0-9]+$/, "");
  return baseName !== v.name && (baseName === symName || baseName === strippedSym);
}
function isContainerType(t) {
  return t === "SEQ" || t === "CHOICE";
}
function isTokenWrapperType(t) {
  return t === TOKEN || t === IMMEDIATE_TOKEN;
}
function isWrapperType(t) {
  return t === "OPTIONAL" || t === "REPEAT" || t === "REPEAT1" || t === "FIELD" || isTokenWrapperType(t) || t === "BLANK";
}
function isPrecWrapper(rule2) {
  const t = rule2.type;
  return t === "PREC" || t === "PREC_LEFT" || t === "PREC_RIGHT" || t === "PREC_DYNAMIC";
}
function typeEq(t, upper) {
  return t === upper;
}
var isSeqType = (t) => typeEq(t, "SEQ");
var isChoiceType = (t) => typeEq(t, "CHOICE");
var isOptionalType = (t) => typeEq(t, "OPTIONAL");
var isFieldType = (t) => typeEq(t, "FIELD");
var isSymbolType = (t) => typeEq(t, "SYMBOL");
var isStringType = (t) => typeEq(t, "STRING");
var isPlainRepeatType = (t) => typeEq(t, "REPEAT");
var isRepeatType = (t) => typeEq(t, "REPEAT") || typeEq(t, "REPEAT1");
function compileAnchoredPattern(source, anchor = "whole") {
  const anchored = anchor === "whole" ? `^(?:${source})$` : `^(?:${source})`;
  try {
    return { regex: new RegExp(anchored, "u") };
  } catch {
    try {
      return { regex: new RegExp(anchored) };
    } catch (error) {
      return { error };
    }
  }
}
function patternAcceptsEmpty(source) {
  const compiled = compileAnchoredPattern(source);
  return "regex" in compiled && compiled.regex.test("");
}
function realizesEmpty(rule2, ctx) {
  const settled = ctx.settled(rule2);
  if (settled !== void 0) return settled;
  const children = ctx.children(rule2);
  return ctx.isChoice(rule2) ? children.some((child) => realizesEmpty(child, ctx)) : children.every((child) => realizesEmpty(child, ctx));
}

// packages/codegen/src/dsl/rule-metadata.ts
function makeRuleMetadata(shape) {
  return shape;
}
function readRuleMetadata(meta) {
  return meta;
}
function normalizeEnumMembers(members) {
  if (members.length === 1) return members[0];
  return { type: CHOICE, members };
}

// packages/codegen/src/dsl/annotations.ts
function withAnnotations(rule2, extra) {
  const node = rule2;
  if (node?.type === "ALIAS" && node.content !== null && typeof node.content === "object") {
    const content = node.content;
    return {
      ...node,
      content: { ...content, annotations: { ...content.annotations, ...extra } }
    };
  }
  return { ...node, annotations: { ...node.annotations, ...extra } };
}
function withHoistedAnnotation(rule2) {
  return withAnnotations(rule2, { hoisted: true });
}

// packages/codegen/src/dsl/rule-walker.ts
function isLexedBoundary(rule2) {
  return isTokenWrapperType(rule2.type);
}
var RuleWalker = class {
  #rules;
  diagnostics;
  constructor(rules, diagnostics) {
    this.#rules = rules;
    this.diagnostics = diagnostics;
  }
  descends(_rule) {
    return true;
  }
  childEdgesOf(rule2) {
    if (!this.descends(rule2)) return [];
    const out = [];
    const bag = rule2;
    if (Array.isArray(bag.members)) {
      bag.members.forEach((child, i) => out.push({ segment: ["members", i], child }));
    } else if (bag.content && typeof bag.content === "object") {
      out.push({ segment: ["content"], child: bag.content });
    }
    if (bag.separator && typeof bag.separator === "object" && "value" in bag.separator)
      out.push({ segment: ["separator", "value"], child: bag.separator.value });
    return out;
  }
  childrenOf(rule2) {
    return this.childEdgesOf(rule2).map((e) => e.child);
  }
  map(rule2, visit) {
    if (!this.descends(rule2)) return rule2;
    const bag = rule2;
    const patch = {};
    if (Array.isArray(bag.members)) {
      let membersChanged = false;
      const next = bag.members.map((m) => {
        const out = visit(this.map(m, visit));
        if (out !== m) membersChanged = true;
        return out;
      });
      if (membersChanged) patch.members = next;
    } else if (bag.content && typeof bag.content === "object") {
      const out = visit(this.map(bag.content, visit));
      if (out !== bag.content) patch.content = out;
    }
    const sep = bag.separator;
    if (sep && typeof sep === "object" && "value" in sep) {
      const out = visit(this.map(sep.value, visit));
      if (out !== sep.value) patch.separator = { ...sep, value: out };
    }
    return Object.keys(patch).length > 0 ? { ...rule2, ...patch } : rule2;
  }
  fold(rule2, init, f) {
    let acc = f(init, rule2);
    for (const child of this.childrenOf(rule2)) acc = this.fold(child, acc, f);
    return acc;
  }
  find(rule2, pred) {
    if (pred(rule2)) return rule2;
    for (const child of this.childrenOf(rule2)) {
      const hit = this.find(child, pred);
      if (hit !== void 0) return hit;
    }
    return void 0;
  }
  deref(ref) {
    if (this.#rules === void 0) {
      throw new Error("RuleWalker.deref: walker was constructed without a rules map");
    }
    if (ref.type !== SYMBOL) return void 0;
    return this.#rules[ref.name];
  }
  foldDeep(rule2, init, f) {
    const seen = /* @__PURE__ */ new Set();
    const go = (r, acc) => {
      if (seen.has(r)) return acc;
      seen.add(r);
      acc = f(acc, r);
      if (r.type === SYMBOL) {
        const target = this.deref(r);
        return target === void 0 ? acc : go(target, acc);
      }
      for (const child of this.childrenOf(r)) acc = go(child, acc);
      return acc;
    };
    return go(rule2, init);
  }
  findDeep(rule2, pred) {
    const seen = /* @__PURE__ */ new Set();
    const go = (r) => {
      if (seen.has(r)) return void 0;
      seen.add(r);
      if (pred(r)) return r;
      if (r.type === SYMBOL) {
        const target = this.deref(r);
        return target === void 0 ? void 0 : go(target);
      }
      for (const child of this.childrenOf(r)) {
        const hit = go(child);
        if (hit !== void 0) return hit;
      }
      return void 0;
    };
    return go(rule2);
  }
};
var SyntacticRuleWalker = class extends RuleWalker {
  descends(rule2) {
    return !isLexedBoundary(rule2);
  }
};

// packages/codegen/src/dsl/primitives/preference.ts
function isPreference(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "preference";
}

// packages/codegen/src/dsl/primitives/spacing.ts
var WHITESPACE_SUPERTYPE = "_whitespace";
var INDENT_TEXT = "\uFDD0\n";
var DEDENT_TEXT = "\uFDD1\n";
function isDepthText(text) {
  return text === INDENT_TEXT || text === DEDENT_TEXT;
}
var EMPTY_SEPARATOR_TOKEN = "empty";
var LABEL_TOKEN = "[A-Za-z][A-Za-z0-9_]*?";
var SPACING_LABEL = new RegExp(`^(${LABEL_TOKEN})_separator_space(?:_(before|after))?$`);
function parseSpacingLabel(name) {
  const m = SPACING_LABEL.exec(name);
  if (!m) return void 0;
  const token = m[1];
  const side = m[2];
  if (token === EMPTY_SEPARATOR_TOKEN) return side === void 0 ? { token } : void 0;
  return side === void 0 ? void 0 : { token, side };
}
var SEAM_LABEL = new RegExp(`^(${LABEL_TOKEN})_(before|after)$`);
function parseSeamLabel(name) {
  if (parseSpacingLabel(name) !== void 0) return void 0;
  const m = SEAM_LABEL.exec(name);
  return m ? { token: m[1], side: m[2] } : void 0;
}
var FLANK_ADDRESS = new RegExp(`^(_*${LABEL_TOKEN})_(start|end)$`);
function parseFlankAddress(key) {
  const m = FLANK_ADDRESS.exec(key);
  return m ? { kind: m[1], side: m[2] } : void 0;
}

// packages/codegen/src/util/word-matcher.ts
function compileWordMatcher(word, rules) {
  if (!word) return void 0;
  const wordRule = rules[word];
  if (!wordRule) return void 0;
  const src = ruleToRegexSource(wordRule);
  if (src === null) return void 0;
  const full = `^(?:${src})$`;
  try {
    return new RegExp(full, "u");
  } catch {
    try {
      return new RegExp(full);
    } catch {
      return void 0;
    }
  }
}
function matchesWordShape(value, wordMatcher) {
  return wordMatcher ? wordMatcher.test(value) : /^\w+$/.test(value);
}
function ruleToRegexSource(rule2) {
  const shaped = rule2;
  switch (rule2.type) {
    case PATTERN:
      return shaped.value ?? null;
    case STRING:
      return shaped.value === void 0 ? null : escapeRegexLiteral(shaped.value);
    case TOKEN:
      return shaped.content ? ruleToRegexSource(shaped.content) : null;
    case SEQ: {
      const parts = [];
      for (const m of shaped.members ?? []) {
        const p = ruleToRegexSource(m);
        if (p === null) return null;
        parts.push(`(?:${p})`);
      }
      return parts.join("");
    }
    case CHOICE: {
      const parts = [];
      for (const m of shaped.members ?? []) {
        const p = ruleToRegexSource(m);
        if (p === null) return null;
        parts.push(p);
      }
      return `(?:${parts.join("|")})`;
    }
    case OPTIONAL: {
      const p = shaped.content ? ruleToRegexSource(shaped.content) : null;
      if (p === null) return null;
      return `(?:${p})?`;
    }
    case REPEAT: {
      const p = shaped.content ? ruleToRegexSource(shaped.content) : null;
      if (p === null) return null;
      return `(?:${p})*`;
    }
    case REPEAT1: {
      const p = shaped.content ? ruleToRegexSource(shaped.content) : null;
      if (p === null) return null;
      return `(?:${p})+`;
    }
    default:
      return null;
  }
}
function escapeRegexLiteral(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// packages/codegen/src/polymorph-variant.ts
function assertNever(x) {
  throw new Error(`assertNever: unexpected variant ${JSON.stringify(x)}`);
}

// packages/codegen/src/dsl/rule-patterns.ts
function isEnumChoiceRule(rule2) {
  return rule2.type === CHOICE && rule2.members.length >= 2 && rule2.members.every((m) => m.type === STRING || m.type === SYMBOL && m.literal !== void 0);
}
function isBlank(rule2) {
  if (!rule2 || typeof rule2 !== "object") return false;
  const r = rule2;
  if (r.type === "BLANK") return true;
  return (r.type === CHOICE || r.type === SEQ) && Array.isArray(r.members) && r.members.length === 0;
}
function optionalContentOf(rule2) {
  if (rule2.type === OPTIONAL) return rule2.content;
  if (rule2.type !== CHOICE) return void 0;
  const members = rule2.members;
  if (!Array.isArray(members) || members.length !== 2) return void 0;
  const [first, second] = members;
  if (isBlank(first) === isBlank(second)) return void 0;
  return isBlank(second) ? first : second;
}
function isArmChoice(rule2) {
  return rule2.type === CHOICE && optionalContentOf(rule2) === void 0;
}
function isImmediateToken(rule2) {
  return rule2.type === IMMEDIATE_TOKEN || rule2.type === TOKEN && rule2.immediate === true;
}
function ruleKey(rule2) {
  return JSON.stringify(canonicalRuleForm(rule2));
}
function canonicalRuleForm(rule2) {
  if (typeof rule2 !== "object" || rule2 === null) return rule2;
  const r = rule2;
  const separator = "separator" in r ? canonicalSeparatorForm(r.separator) : null;
  if (isBlank(r)) return ["BLANK", null, null, null, separator, null];
  const optional = optionalContentOf(r);
  if (optional !== void 0) return [OPTIONAL, null, null, null, separator, [canonicalRuleForm(optional)]];
  const type = isImmediateToken(r) ? IMMEDIATE_TOKEN : r.type ?? null;
  const name = typeof r.name === "string" ? r.name : null;
  const value = typeof r.value === "string" || typeof r.value === "number" ? r.value : null;
  const named = typeof r.named === "boolean" ? r.named : null;
  const members = r.members;
  if (members !== void 0) return [type, name, value, named, separator, members.map(canonicalRuleForm)];
  const content = r.content;
  if (content !== void 0) return [type, name, value, named, separator, [canonicalRuleForm(content)]];
  return [type, name, value, named, separator, null];
}
function canonicalSeparatorForm(separator) {
  if (typeof separator !== "object" || separator === null) return separator;
  const sep = separator;
  return [
    "fact",
    typeof sep.trailing === "string" ? sep.trailing : null,
    typeof sep.leading === "string" ? sep.leading : null,
    canonicalRuleForm(sep.value)
  ];
}
function rulesEqual(a, b) {
  return ruleKey(a) === ruleKey(b);
}
function leadingLiteralOf(r) {
  if (!typeEq(r.type, "CHOICE")) return null;
  const members = r.members ?? [];
  const lit = members.find((m) => typeEq(m.type, "STRING"));
  return lit ? lit.value : null;
}
function separatorOf(resolved, symbols) {
  if (!typeEq(resolved.type, "SEQ")) return null;
  const members = resolved.members;
  if (!members || members.length !== 2) return null;
  const [first, second] = members;
  const firstIsStr = typeEq(first.type, "STRING");
  const secondIsStr = typeEq(second.type, "STRING");
  if (firstIsStr && !secondIsStr) return { content: second, separator: first };
  if (secondIsStr && !firstIsStr) return { content: first, separator: second, trailing: true };
  const isToken = (r) => isArmChoice(r) && terminalContentOf(r, symbols.isTerminal);
  if (isToken(first) && !secondIsStr) return { content: second, separator: first };
  if (isToken(second) && !firstIsStr) return { content: first, separator: second, trailing: true };
  return null;
}
var ruleEmptiness = {
  settled(rule2) {
    if (!rule2 || typeof rule2 !== "object") return false;
    const r = rule2;
    const t = r.type;
    if (isBlank(r) || t === OPTIONAL || t === REPEAT) return true;
    if (t === STRING) return r.value === "";
    if (t === PATTERN) return patternAcceptsEmpty(String(r.value));
    if (t === SEQ || t === CHOICE || t === REPEAT1 || t === FIELD || isPrecWrapper(r)) return void 0;
    return false;
  },
  children(rule2) {
    const r = rule2;
    if (r.type === SEQ || r.type === CHOICE) return Array.isArray(r.members) ? r.members : [];
    return [r.content];
  },
  isChoice: (rule2) => rule2.type === CHOICE
};
function matchesEmpty(rule2) {
  return realizesEmpty(rule2, ruleEmptiness);
}
function collectSlots(members, rulesBag) {
  const slots = [];
  for (const m of members) {
    if (!m || typeof m !== "object") continue;
    const r = m;
    const t = typeof r.type === "string" ? r.type : "";
    if (isStringType(t) || typeEq(t, "TOKEN") || isBlank(r)) continue;
    if (rulesBag && isSymbolType(t)) {
      const name = typeof r.name === "string" ? r.name : void 0;
      if (name !== void 0 && !(name in rulesBag)) continue;
    }
    slots.push(m);
  }
  return slots;
}
function isMultiSlotRepeatElement(content, symbols) {
  const core = unwrapPrec(content);
  if (!core || typeof core !== "object" || !isSeqType(core.type)) return false;
  if (separatorOf(core, symbols) !== null || !("members" in core) || !Array.isArray(core.members)) return false;
  return collectSlots(core.members, symbols.rules).length >= 2;
}
function unwrapPrec(rule2) {
  let cur = rule2;
  while (cur && typeof cur === "object") {
    const r = cur;
    if (isPrecWrapper(r)) {
      cur = r.content;
    } else {
      break;
    }
  }
  return cur;
}
function isRepeatLike(t) {
  return isRepeatType(t) || typeEq(t, "REPEAT1");
}
function flattenSeqMembers(members) {
  const out = [];
  for (const m of members) {
    const core = unwrapPrec(m);
    if (core && typeof core === "object") {
      const ct = core.type;
      const inner = core.members;
      if (typeof ct === "string" && isSeqType(ct) && Array.isArray(inner)) {
        out.push(...flattenSeqMembers(inner));
        continue;
      }
    }
    out.push(m);
  }
  return out;
}
function seqHasTopLevelRepeat(members) {
  for (const m of flattenSeqMembers(members)) {
    const core = unwrapPrec(m);
    if (!core || typeof core !== "object") continue;
    const ct = core.type;
    if (typeof ct === "string" && isRepeatLike(ct)) return true;
  }
  return false;
}
function isNonterminalSeparatorType(t) {
  return isChoiceType(t) || isSymbolType(t) || typeEq(t, "PATTERN");
}
function repeatHasNonterminalSeparator(repeatRule, symbols) {
  const content = repeatRule.content;
  if (!content || typeof content !== "object") return false;
  const detected = separatorOf(content, symbols);
  if (!detected) return false;
  return isNonterminalSeparatorType(detected.separator.type);
}
function isOptionalSeparatorFlank(member, sepValue) {
  if (!member || typeof member !== "object") return false;
  const content = optionalContentOf(member);
  return content !== void 0 && isStringType(content.type) && content.value === sepValue;
}
function repeatMemberHasGenuineSeparatorVariability(repeatRule, siblings, symbols) {
  if (repeatHasNonterminalSeparator(repeatRule, symbols)) return true;
  const content = repeatRule.content;
  if (!content || typeof content !== "object") return false;
  const detected = separatorOf(content, symbols);
  if (!detected || !isStringType(detected.separator.type)) return false;
  const sepValue = detected.separator.value;
  if (typeof sepValue !== "string") return false;
  return siblings.some((m) => m !== repeatRule && isOptionalSeparatorFlank(m, sepValue));
}
function repeatHasGenuineSeparatorVariability(repeatRule, symbols) {
  return repeatHasNonterminalSeparator(repeatRule, symbols);
}
function seqHasGenuineSeparatorVariability(members, symbols) {
  const flat = flattenSeqMembers(members);
  const repeatMembers = [];
  for (const m of flat) {
    const core = unwrapPrec(m);
    if (!core || typeof core !== "object") continue;
    const ct = core.type;
    if (typeof ct !== "string" || !isRepeatLike(ct)) continue;
    const content = core.content;
    if (content && typeof content === "object" && separatorOf(content, symbols) !== null) {
      repeatMembers.push(core);
    }
  }
  if (repeatMembers.length !== 1) return false;
  return repeatMemberHasGenuineSeparatorVariability(repeatMembers[0], flat, symbols);
}
function isInlineSafe(seqBody, symbols) {
  if (!seqBody || typeof seqBody !== "object") return false;
  const r = seqBody;
  const t = typeof r.type === "string" ? r.type : "";
  if (isRepeatLike(t)) return !repeatHasGenuineSeparatorVariability(seqBody, symbols);
  if (typeEq(t, "ALIAS")) return true;
  if (!isSeqType(t)) return false;
  const members = r.members;
  if (!Array.isArray(members)) return false;
  if (seqHasTopLevelRepeat(members)) return !seqHasGenuineSeparatorVariability(members, symbols);
  const slots = collectSlots(members, symbols.rules);
  if (slots.length !== 1) return false;
  const core = unwrapPrec(slots[0]);
  if (!core || typeof core !== "object") return false;
  const coreType = core.type;
  if (typeof coreType !== "string") return false;
  return isFieldType(coreType) || isSymbolType(coreType);
}
function typeOf(rule2) {
  return typeof rule2?.type === "string" ? rule2.type : void 0;
}
function isNamedAlias(rule2) {
  return typeEq(typeOf(rule2) ?? "", "ALIAS") && rule2.named === true;
}
function isNamedArmChoice(body) {
  const b = body;
  if (!isChoiceType(typeOf(b) ?? "") || !Array.isArray(b.members) || b.members.length === 0) return false;
  return b.members.every((m) => isNamedAlias(m) && isSymbolType(typeOf(m.content) ?? ""));
}
function isEnumMember(member, storageBodyOf) {
  const t = typeOf(member) ?? "";
  if (isStringType(t)) return true;
  if (isSymbolType(t)) return member.literal !== void 0;
  if (!isNamedAlias(member)) return false;
  const content = member.content;
  if (isStringType(typeOf(content) ?? "")) return true;
  return isSymbolType(typeOf(content) ?? "") && typeof content.name === "string" && isStringType(typeOf(storageBodyOf(content.name)) ?? "");
}
function aliasesSymbol(content) {
  const t = typeOf(content) ?? "";
  if (isSymbolType(t)) return true;
  return typeEq(t, "TOKEN") && aliasesSymbol(content.content);
}
function isSupertypeMember(member) {
  const t = typeOf(member) ?? "";
  if (isSymbolType(t) || isStringType(t)) return true;
  return isNamedAlias(member) && (isStringType(typeOf(member.content) ?? "") || aliasesSymbol(member.content));
}
function flattenChoiceMembers(members) {
  return members.flatMap((m) => isChoiceType(typeOf(m) ?? "") ? flattenChoiceMembers(m.members ?? []) : [m]);
}
function hiddenChoiceClass(body, storageBodyOf, namedArms) {
  const b = body;
  if (b?.annotations?.hoisted === true || !isChoiceType(typeOf(b) ?? "") || !Array.isArray(b.members)) return void 0;
  if (b.members.every((m) => isEnumMember(m, storageBodyOf))) return "enum";
  if (namedArms) return "named-arms";
  return flattenChoiceMembers(b.members).every(isSupertypeMember) ? "supertype" : void 0;
}
function throughPrec(rule2, fn) {
  const r = rule2;
  if (typeof r?.type !== "string" || !isPrecWrapper(r) || r.content === void 0) return fn(rule2);
  const content = throughPrec(r.content, fn);
  return content === r.content ? rule2 : { ...rule2, content };
}
function isSupertypeLike(body) {
  const b = unwrapPrec(body);
  if (!b || typeof b !== "object") return false;
  const t = b.type;
  if (typeof t !== "string" || !isChoiceType(t)) return false;
  const members = b.members;
  if (!Array.isArray(members) || members.length === 0) return false;
  return members.every((m) => {
    const core = unwrapPrec(m);
    if (!core || typeof core !== "object") return false;
    const c = core;
    const coreType = c.type;
    if (typeof coreType !== "string") return false;
    if (isSymbolType(coreType) || isStringType(coreType)) return true;
    if (typeEq(coreType, "ALIAS")) return c.named === true;
    return false;
  });
}
function isPermutationChoice(body, rulesBag, kwRules, wordMatcher) {
  const b = unwrapPrec(body);
  if (!b || typeof b !== "object") return false;
  const t = b.type;
  if (typeof t !== "string" || !isChoiceType(t)) return false;
  const members = b.members;
  if (!Array.isArray(members)) return false;
  const arms = members.filter(
    (m) => m && typeof m === "object" && !isBlank(m)
  );
  if (arms.length < 2) return false;
  const keySets = [];
  for (const arm2 of arms) {
    const keys = permutationArmSlotKeys(arm2, rulesBag, kwRules, wordMatcher);
    if (keys === null) return false;
    keySets.push(keys);
  }
  const first = keySets[0];
  if (!keySets.every((s) => s.size === first.size && [...s].every((k) => first.has(k)))) return false;
  return new Set(arms.map((a) => JSON.stringify(a))).size >= 2;
}
function permutationArmSlotKeys(arm2, rulesBag, kwRules, wordMatcher) {
  const core = unwrapPrec(arm2);
  if (!core || typeof core !== "object") return null;
  const t = core.type;
  if (typeof t !== "string" || !isSeqType(t)) return null;
  const members = core.members;
  if (!Array.isArray(members) || members.length < 2) return null;
  const keys = /* @__PURE__ */ new Set();
  for (const member of members) {
    const key = permutationAtomKey(member, rulesBag, kwRules, wordMatcher);
    if (key === null || keys.has(key)) return null;
    keys.add(key);
  }
  return keys;
}
function permutationAtomKey(member, rulesBag, kwRules, wordMatcher) {
  let core = unwrapPrec(member);
  let fieldName;
  for (; ; ) {
    if (!core || typeof core !== "object") return null;
    const r2 = core;
    const t2 = typeof r2.type === "string" ? r2.type : "";
    if (isFieldType(t2)) {
      if (fieldName === void 0 && typeof r2.name === "string") fieldName = r2.name;
      core = unwrapPrec(r2.content);
      continue;
    }
    const optional = optionalContentOf(r2);
    if (optional !== void 0) {
      core = unwrapPrec(optional);
      continue;
    }
    if (isChoiceType(t2)) return null;
    break;
  }
  const r = core;
  const t = typeof r.type === "string" ? r.type : "";
  const keyed = (lit, fallback) => {
    if (lit !== null && (fieldName === void 0 || fieldName === `${lit}_marker`)) return `lit:${lit}`;
    const bare = lit !== null ? `lit:${lit}` : fallback;
    return fieldName === void 0 ? bare : `field:${fieldName}=${bare}`;
  };
  if (isStringType(t)) {
    const v = r.value;
    if (typeof v !== "string" || !matchesWordShape(v, wordMatcher)) return null;
    return keyed(v, "");
  }
  if (isSymbolType(t)) {
    const name = typeof r.name === "string" ? r.name : void 0;
    if (name === void 0) return null;
    const resolved = resolveRuleLiteral(kwRules?.[name] ?? rulesBag?.[name]);
    return keyed(resolved, `sym:${name}`);
  }
  return null;
}
function resolveRuleLiteral(body) {
  const core = unwrapPrec(body);
  if (!core || typeof core !== "object") return null;
  const r = core;
  const t = typeof r.type === "string" ? r.type : "";
  if (typeEq(t, "TOKEN")) return resolveRuleLiteral(r.content);
  if (isStringType(t)) return typeof r.value === "string" ? r.value : null;
  return null;
}
function isParserHiddenName(name) {
  return name.startsWith("_");
}
function ruleListEntryOf(value) {
  if (typeof value === "string") return { type: STRING, value };
  if (value instanceof RegExp) return { type: PATTERN, value: value.source };
  if (value === null || typeof value !== "object") return void 0;
  const rule2 = value;
  if (rule2.type === SYMBOL && typeof rule2.name === "string") return { type: SYMBOL, name: rule2.name };
  if (rule2.type === STRING && typeof rule2.value === "string") return { type: STRING, value: rule2.value };
  if (rule2.type === PATTERN && typeof rule2.value === "string") return { type: PATTERN, value: rule2.value };
  return void 0;
}
function ruleListParts(rules) {
  const parts = { names: [], literals: [], patterns: [] };
  for (const rule2 of rules) {
    switch (rule2.type) {
      case SYMBOL:
        parts.names.push(rule2.name);
        break;
      case STRING:
        parts.literals.push(rule2.value);
        break;
      case PATTERN:
        parts.patterns.push(rule2.value);
        break;
      default:
        assertNever(rule2);
    }
  }
  return parts;
}
function nodelessExtrasRun(extras, rules) {
  const { names, literals, patterns } = ruleListParts(extras);
  const symbolSources = names.filter(isParserHiddenName).flatMap((name) => {
    const rule2 = rules[name];
    const source = rule2 === void 0 ? null : ruleToRegexSource(rule2);
    return source === null ? [] : [source];
  });
  const sources = [...patterns, ...literals.map(escapeRegexLiteral), ...symbolSources];
  if (sources.length === 0) return void 0;
  const compiled = compileAnchoredPattern(`(?:${sources.map((source) => `(?:${source})`).join("|")})+`);
  if ("error" in compiled) throw new Error(`extras: the lexical extras do not compile as a JavaScript RegExp: ${compiled.error.message}`);
  return compiled.regex;
}
function symbolFactsOf(grammar) {
  return {
    rules: grammar.rules,
    externals: new Set(ruleListParts(grammar.externals).names),
    inline: new Set(grammar.inline),
    supertypes: new Set(grammar.supertypes),
    extras: new Set(ruleListParts(grammar.extras).names),
    visibleExternals: new Set(Object.keys(grammar.visibleExternals ?? {}))
  };
}
var selfReferenceWalker = new RuleWalker({});
function extractedToken(rule2) {
  const params = [];
  let tokenized = false;
  let current = rule2;
  for (; ; ) {
    if (isTokenWrapperType(current.type)) {
      tokenized = true;
      if (isImmediateToken(current)) params.push("immediate");
    } else if (isPrecWrapper(current)) {
      params.push(`${current.type}:${String(current.value)}`);
    } else break;
    current = current.content;
  }
  if (!tokenized && params.length > 0) return void 0;
  if (!tokenized && current.type !== STRING && current.type !== PATTERN) return void 0;
  const inner = current.type === STRING || current.type === PATTERN ? `${current.type}:${String(current.value)}` : JSON.stringify(stripRuleAnnotations(current));
  return { key: [...params.sort(), inner].join("|"), anonymous: current.type === STRING };
}
function stripRuleAnnotations(rule2) {
  if (Array.isArray(rule2)) return rule2.map(stripRuleAnnotations);
  if (rule2 === null || typeof rule2 !== "object") return rule2;
  const out = {};
  for (const [key, value] of Object.entries(rule2)) {
    if (key === "annotations" || key === "metadata" || key === "id") continue;
    out[key] = stripRuleAnnotations(value);
  }
  return out;
}
function choiceArmsOf(content) {
  const rule2 = content;
  if (rule2.type !== CHOICE) return void 0;
  return rule2.members.flatMap((m) => choiceArmsOf(m) ?? [m]);
}
function terminalContentOf(content, isTerminalSymbol) {
  if (content.type === SYMBOL) return isTerminalSymbol(content.name);
  if (content.type === STRING || content.type === PATTERN || content.type === TOKEN) return true;
  const arms = choiceArmsOf(content);
  return arms !== void 0 && arms.every((arm2) => terminalContentOf(arm2, isTerminalSymbol));
}
function lexesAsOneToken(rule2) {
  return extractedToken(rule2) !== void 0;
}
function selfReferentialFoldOf(name, rule2) {
  if (rule2.type !== CHOICE) return void 0;
  const fieldOf = (member) => member.type === FIELD ? member.name : void 0;
  const operandOf = (member) => member.type === FIELD ? member.content : member;
  const isSelfRef = (member) => {
    const content = operandOf(member);
    return content.type === SYMBOL && content.name === name && isParserHiddenName(content.name) && content.aliasedTo === void 0;
  };
  let fields;
  let separator;
  let sawSelfRef = false;
  for (const arm2 of rule2.members) {
    if (arm2.type !== SEQ || arm2.members.length !== 3) return void 0;
    const [m0, sep, m2] = arm2.members;
    if (m0 === void 0 || sep === void 0 || m2 === void 0 || sep.type !== STRING) return void 0;
    if (fields === void 0) fields = [fieldOf(m0), fieldOf(m2)];
    else if (fieldOf(m0) !== fields[0] || fieldOf(m2) !== fields[1]) return void 0;
    if (separator === void 0) separator = sep;
    else if (separator.type !== STRING || separator.value !== sep.value) return void 0;
    if (isSelfRef(m0)) sawSelfRef = true;
    else if (isSelfRef(m2)) return void 0;
  }
  if (!sawSelfRef || separator === void 0) return void 0;
  return { separator };
}
function exclusiveFieldChoiceBranches(member, rulesBag) {
  let target = member;
  if (isSymbolType(member.type)) {
    const name = member.name;
    if (typeof name !== "string" || !name.startsWith("_")) return void 0;
    target = rulesBag[name];
  }
  if (!target || !isChoiceType(target.type)) return void 0;
  const branches = target.members;
  if (!Array.isArray(branches) || branches.length < 2) return void 0;
  const names = /* @__PURE__ */ new Set();
  for (const branch of branches) {
    if (!isFieldType(branch.type)) return void 0;
    const name = branch.name;
    if (typeof name !== "string") return void 0;
    names.add(name);
  }
  return names.size === branches.length ? branches : void 0;
}
function normalizeMember(m) {
  if (typeof m === "string") return { type: "STRING", value: m };
  if (m instanceof RegExp) return { type: "PATTERN", value: m.source };
  return m ?? { type: "UNKNOWN" };
}
function withOptionalContent(rule2, content) {
  if (rule2.type === OPTIONAL) return { ...rule2, content };
  const members = rule2.members;
  return { ...rule2, members: members.map((m) => isBlank(m) ? m : content) };
}
function optionalSeqBodyOf(rule2) {
  const content = optionalContentOf(rule2);
  return content !== void 0 && content.type === SEQ ? content : void 0;
}
function listSeparatorOfOptionalSeq(rule2, symbols) {
  const seqBody = optionalSeqBodyOf(rule2);
  if (seqBody === void 0) return null;
  const seqMembers = seqBody.members;
  if (!Array.isArray(seqMembers)) return null;
  for (const m of seqMembers) {
    if (!isRepeatType(m.type)) continue;
    const sepAttr = m.separator;
    if (typeof sepAttr === "string") return sepAttr;
    const content = m.content;
    if (content) {
      const detected = separatorOf(content, symbols);
      if (detected) {
        const sep = detected.separator;
        if (typeEq(sep.type, "STRING")) return sep.value;
        if (typeEq(sep.type, "CHOICE")) {
          const lit = leadingLiteralOf(sep);
          if (lit !== null) return lit;
        }
      }
    }
  }
  return null;
}
function optionalStringLiteral(rule2) {
  const inner = optionalContentOf(rule2);
  if (inner === void 0) return null;
  const innerN = normalizeMember(inner);
  if (isStringType(innerN.type) && typeof innerN.value === "string") return innerN.value;
  return null;
}
function separatedListElementName(rule2) {
  const t = rule2.type;
  if (typeof t !== "string") return null;
  if (isFieldType(t)) {
    const name = rule2.name;
    return typeof name === "string" ? name : null;
  }
  if (isSymbolType(t)) {
    const name = rule2.name;
    return typeof name === "string" ? name.replace(/^_+/, "") : null;
  }
  if (isChoiceType(t)) {
    const members = rule2.members;
    if (Array.isArray(members) && members.length === 1) return separatedListElementName(members[0]);
    return null;
  }
  if (isPrecWrapper(rule2) || typeEq(t, "ALIAS")) {
    const content = rule2.content;
    return content ? separatedListElementName(content) : null;
  }
  return null;
}
function separatedListBodyInfo(body, symbols) {
  if (!isSeqType(body.type)) return null;
  const members = body.members;
  if (!Array.isArray(members) || members.length === 0) return null;
  const separatorRepeatOf = (m) => {
    if (!isRepeatType(m.type)) return null;
    const content = m.content;
    return content ? separatorOf(content, symbols) : null;
  };
  if (members.length >= 2 && !members.some((m) => separatorRepeatOf(m) !== null)) {
    const nestedIdx = members.findIndex((m) => {
      if (!isSeqType(m.type)) return false;
      const inner = m.members;
      return Array.isArray(inner) && inner.some((im) => separatorRepeatOf(im) !== null);
    });
    if (nestedIdx !== -1) {
      const headMembers = members[nestedIdx].members;
      return separatedListBodyInfo({
        ...body,
        members: [...members.slice(0, nestedIdx), ...headMembers, ...members.slice(nestedIdx + 1)]
      }, symbols);
    }
  }
  const repeatIdx = members.findIndex((m) => separatorRepeatOf(m) !== null);
  if (repeatIdx === -1) return null;
  const detected = separatorRepeatOf(members[repeatIdx]);
  const separatorIsChoice = typeEq(detected.separator.type, "CHOICE");
  const separatorLiteral = typeEq(detected.separator.type, "STRING") ? detected.separator.value : null;
  const elementName = separatedListElementName(detected.content);
  if (detected.trailing !== true) {
    if (repeatIdx === 0) {
      if (!typeEq(members[0].type, "REPEAT1")) return null;
      if (members.length !== 2) return null;
      const flank = optionalContentOf(members[1]);
      const flankLit = flank && isStringType(flank.type) ? flank.value : null;
      if (flankLit === null || separatorLiteral !== null && flankLit !== separatorLiteral) return null;
      return {
        elementName,
        flankCarrying: true,
        form: "leading",
        element: detected.content,
        separatorRule: detected.separator,
        flatMembers: members
      };
    }
    const head = members[repeatIdx - 1];
    if (separatedListElementName(head) !== elementName || elementName === null) {
      if (ruleKey(head) !== ruleKey(detected.content)) return null;
    }
    let flankCarrying = separatorIsChoice;
    for (const [i, m] of members.entries()) {
      if (i === repeatIdx || i === repeatIdx - 1) continue;
      if (isStringType(m.type) && m.value === separatorLiteral) {
        continue;
      }
      const inner = optionalContentOf(m);
      const innerLit = inner && isStringType(inner.type) ? inner.value : null;
      const innerMatchesChoiceSep = inner !== void 0 && separatorIsChoice && isChoiceType(inner.type ?? "");
      if (innerLit !== null && (separatorLiteral === null || innerLit === separatorLiteral) || innerMatchesChoiceSep) {
        flankCarrying = true;
        continue;
      }
      return null;
    }
    return {
      elementName,
      flankCarrying,
      form: "head",
      element: detected.content,
      separatorRule: detected.separator,
      flatMembers: members
    };
  }
  if (repeatIdx !== 0 || members.length !== 2) return null;
  const tail = optionalContentOf(members[1]);
  if (tail === void 0) return null;
  if (elementName !== null && separatedListElementName(tail) !== elementName) return null;
  if (elementName === null && ruleKey(tail) !== ruleKey(detected.content)) return null;
  return {
    elementName,
    flankCarrying: true,
    form: "tail",
    element: detected.content,
    separatorRule: detected.separator,
    flatMembers: members
  };
}
function armLeadingSymbolName(rule2, rulesBag, seen = /* @__PURE__ */ new Set()) {
  if (seen.has(rule2)) return void 0;
  seen.add(rule2);
  const t = rule2.type;
  if (typeof t !== "string") return void 0;
  const optional = optionalContentOf(rule2);
  if (optional !== void 0) return armLeadingSymbolName(optional, rulesBag, seen);
  if (isSymbolType(t)) {
    const name = rule2.name;
    if (typeof name !== "string") return void 0;
    const body = rulesBag[name];
    if (body?.hidden !== true) return name;
    return body ? armLeadingSymbolName(body, rulesBag, seen) ?? name : name;
  }
  if (isSeqType(t)) {
    const members = rule2.members;
    const first = Array.isArray(members) ? members[0] : void 0;
    return first ? armLeadingSymbolName(first, rulesBag, seen) : void 0;
  }
  if (isChoiceType(t)) {
    return void 0;
  }
  const content = rule2.content;
  return content ? armLeadingSymbolName(content, rulesBag, seen) : void 0;
}
function armStartsWithSymbol(rule2, collidingLeadingNames, rulesBag) {
  if (collidingLeadingNames.size === 0) return false;
  const name = armLeadingSymbolName(rule2, rulesBag);
  return name !== void 0 && collidingLeadingNames.has(name);
}
function isLiteralChoiceContent(rule2) {
  if (isStringType(rule2.type)) return true;
  if (isChoiceType(rule2.type)) {
    const members = rule2.members;
    return Array.isArray(members) && members.every((m) => isLiteralChoiceContent(m));
  }
  return false;
}
function isHiddenKind(name, inlineList) {
  if (name.startsWith("_")) return true;
  if (inlineList && inlineList.includes(name)) return true;
  return false;
}
function armsDifferOnlyByLiteralChoice(a, b) {
  let literalDeltas = 0;
  const peel = (r) => {
    while (isPrecWrapper(r) && r.content) {
      r = r.content;
    }
    return r;
  };
  const same = (x, y) => {
    x = peel(x);
    y = peel(y);
    if (isLiteralChoiceContent(x) && isLiteralChoiceContent(y)) {
      if (JSON.stringify(x) !== JSON.stringify(y)) literalDeltas++;
      return true;
    }
    const tx = x.type;
    const ty = y.type;
    if (tx !== ty || typeof tx !== "string") return false;
    if (isSymbolType(tx)) return x.name === y.name;
    if (isFieldType(tx)) {
      return x.name === y.name && same(x.content, y.content);
    }
    const mx = x.members;
    const my = y.members;
    if (Array.isArray(mx) || Array.isArray(my)) {
      if (!Array.isArray(mx) || !Array.isArray(my) || mx.length !== my.length) return false;
      return mx.every((m, i) => same(m, my[i]));
    }
    const cx = x.content;
    const cy = y.content;
    if (cx !== void 0 || cy !== void 0) {
      return cx !== void 0 && cy !== void 0 && same(cx, cy);
    }
    return JSON.stringify(x) === JSON.stringify(y);
  };
  return same(a, b) && literalDeltas === 1;
}

// packages/codegen/src/dsl/primitives/field.ts
function maybeKeywordSymbol(fieldName, content, wrapSyntheticBody) {
  const c = content;
  if (!c || typeof c.type !== "string") return content;
  if (isStringType(c.type)) {
    return synthesizeKwSymbol(fieldName, content, wrapSyntheticBody);
  }
  const optional = optionalContentOf(c);
  if (optional !== void 0) {
    const rewritten = maybeKeywordSymbol(fieldName, optional, wrapSyntheticBody);
    return rewritten === optional ? content : withOptionalContent(c, rewritten);
  }
  return content;
}
function synthesizeKwSymbol(fieldName, content, wrapSyntheticBody) {
  const hiddenName = `_kw_${fieldName}`;
  let body = content;
  if (wrapSyntheticBody) body = wrapSyntheticBody(body);
  if (!wireRegisterSyntheticRule(hiddenName, body)) {
    throw new Error(
      `field('${fieldName}', <STRING>): no active wire() context \u2014 call must occur inside a rule callback wrapped by wire()`
    );
  }
  wireRegisterSyntheticInline(hiddenName);
  return {
    type: "SYMBOL",
    name: hiddenName
  };
}
function isFieldPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "field";
}
function field(name, content) {
  if (content === void 0) {
    return {
      __sittirPlaceholder: "field",
      name
    };
  }
  const native = globalThis.field;
  if (typeof native !== "function") {
    throw new Error(
      "field(): no global field() found \u2014 must be called inside a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)"
    );
  }
  return buildTwoArgFieldResult(native, name, content);
}
function buildTwoArgFieldResult(native, name, content) {
  const initial = native(name, content);
  const inner = initial.content;
  const symbolized = maybeKeywordSymbol(name, inner);
  const metadata = makeRuleMetadata({ fieldSource: "override" });
  if (symbolized !== inner) {
    const reconstructed = native(name, symbolized);
    return {
      ...reconstructed,
      metadata
    };
  }
  return { ...initial, metadata };
}

// packages/codegen/src/dsl/primitives/alias.ts
function isAliasPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "alias";
}

// packages/codegen/src/dsl/primitives/rule.ts
function isRulePlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "rule";
}

// packages/codegen/src/dsl/arm-names.ts
function polymorphVisibleName(parentKind, suffix) {
  return `${undisplayedKindAddress(parentKind)}_${suffix}`;
}
function undisplayedKindAddress(symbol) {
  return symbol.replace(/^_+/, "");
}
function prefixNamedSuffix(parentKind, targetName) {
  const bareTarget = undisplayedKindAddress(targetName);
  const prefix = `${polymorphVisibleName(parentKind, "")}`;
  if (!bareTarget.startsWith(prefix)) return null;
  const suffix = bareTarget.slice(prefix.length);
  return suffix.length > 0 ? suffix : null;
}
var GROUP_TOKEN_SYNONYMS = {
  item: "statement",
  stmt: "statement",
  expr: "expression",
  decl: "declaration",
  impl: "implementation"
};
var CATEGORY_TOKENS = /* @__PURE__ */ new Set([
  "expression",
  "statement",
  "literal",
  "declaration",
  "definition",
  "operator",
  "pattern",
  "type"
]);
function normalizeGroupToken(token) {
  return GROUP_TOKEN_SYNONYMS[token] ?? token;
}
function tokensOf(name) {
  return name.split("_").filter((t) => t.length > 0);
}
function supertypeMemberName(memberKind, supertypeKind) {
  const parts = tokensOf(memberKind);
  const bareMember = parts.join("_");
  const groupTokens = new Set(tokensOf(supertypeKind).map(normalizeGroupToken));
  let kept = parts.filter((t) => !groupTokens.has(normalizeGroupToken(t)));
  if (kept.length === parts.length && parts.length >= 2) {
    const tail = normalizeGroupToken(parts[parts.length - 1]);
    if (CATEGORY_TOKENS.has(tail)) kept = parts.slice(0, -1);
  }
  if (kept.length === 0 || kept.join("_") === tokensOf(supertypeKind).join("_")) return bareMember;
  return kept.join("_");
}
function armNameOf(owner, display, ownerIsSupertype) {
  return ownerIsSupertype ? supertypeMemberName(display, owner) : prefixNamedSuffix(owner, display) ?? display;
}

// packages/codegen/src/dsl/primitives/variant.ts
var ABSENT_VARIANT_NAME = "bare";
function isVariantPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "variant";
}
function variant(name, options) {
  return { __sittirPlaceholder: "variant", name, ...options?.absent === true ? { absent: true } : {}, ...options?.default === true ? { default: true } : {} };
}
function variantMintName(v) {
  return [...v.nestedUnder ?? [], v.name].join("_");
}
function variantOwnerKind(parentKind, v) {
  return v.nestedUnder === void 0 || v.nestedUnder.length === 0 ? parentKind : polymorphVisibleName(parentKind, v.nestedUnder.join("_"));
}
function nestVariant(v, nestedUnder) {
  return nestedUnder.length === 0 ? v : { ...v, nestedUnder };
}

// packages/codegen/src/dsl/wire/symbol-renames.ts
function resolveName(name, renames) {
  let current = name;
  for (let hops = 0; hops < renames.size; hops++) {
    const next = renames.get(current);
    if (next === void 0 || next === current) return current;
    current = next;
  }
  return current;
}
function renameRule(value, renames) {
  if (renames.size === 0) return value;
  if (Array.isArray(value)) {
    const mapped = value.map((entry) => renameRule(entry, renames));
    return mapped.every((entry, index) => entry === value[index]) ? value : mapped;
  }
  if (value === null || typeof value !== "object") return value;
  const record = value;
  const changes = {};
  for (const [key, entry] of Object.entries(record)) {
    const next = renameRule(entry, renames);
    if (next !== entry) changes[key] = next;
  }
  if (record.type === "SYMBOL" && typeof record.name === "string") {
    const name = resolveName(record.name, renames);
    if (name !== record.name) changes.name = name;
  }
  if (typeof record.variantOf === "string") {
    const owner = resolveName(record.variantOf, renames);
    if (owner !== record.variantOf) changes.variantOf = owner;
  }
  if (Object.keys(changes).length === 0) return value;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const [key, entry] of Object.entries(changes)) descriptors[key] = { ...descriptors[key], value: entry };
  return Object.create(Object.getPrototypeOf(value), descriptors);
}
function renameNameList(value, renames) {
  if (renames.size === 0) return value;
  if (Array.isArray(value)) return value.map((entry) => renameNameList(entry, renames));
  if (typeof value === "string") return resolveName(value, renames);
  return renameRule(value, renames);
}

// packages/codegen/src/util/reachable-rules.ts
function rootRuleName(rules) {
  return Object.keys(rules)[0];
}
function grammarRootNames(grammar) {
  const start = rootRuleName(grammar.rules);
  return [...start === void 0 ? [] : [start], ...ruleListParts(grammar.extras).names.filter((name) => name in grammar.rules)];
}

// packages/codegen/src/dsl/symbol-table.ts
function kindTableOfSymbolTable(table, grammarJson) {
  const symbolTextFacts = resolveSymbolTextFacts(table.names, collectGrammarFacts(grammarJson));
  return joinIdNames(
    table.symbols,
    table.names,
    deriveSymbolRuntimeName(symbolTextFacts),
    symbolTextFacts,
    table.facts,
    collectLexicalRanks(grammarJson)
  );
}
function collectGrammarFacts(grammarJson) {
  const aliasTargets = /* @__PURE__ */ new Map();
  const literalRules = /* @__PURE__ */ new Map();
  const rules = grammarJson?.rules;
  if (rules) {
    for (const [name, rule2] of Object.entries(rules)) {
      const literalValue = literalRuleValue(rule2);
      if (literalValue !== void 0) literalRules.set(name, literalValue);
    }
    for (const rule2 of Object.values(rules)) {
      walkGrammarNode(rule2, aliasTargets, literalRules);
    }
  }
  return { aliasTargets, literalRules };
}
function literalRuleValue(rule2) {
  if (rule2 === null || typeof rule2 !== "object") return void 0;
  const record = rule2;
  if (record.type === "STRING" && typeof record.value === "string") return record.value;
  if (record.type === "ALIAS" && record.named === false && typeof record.value === "string") return record.value;
  return void 0;
}
function walkGrammarNode(node, aliasTargets, literalRules) {
  if (Array.isArray(node)) {
    for (const child of node) walkGrammarNode(child, aliasTargets, literalRules);
    return;
  }
  if (node === null || typeof node !== "object") return;
  const record = node;
  if (record.type === "ALIAS" && record.named === true && typeof record.value === "string") {
    const literals = aliasTargets.get(record.value) ?? /* @__PURE__ */ new Set();
    for (const literal of aliasedLiterals(record.content)) literals.add(literal);
    aliasTargets.set(record.value, literals);
  }
  if (record.type === "ALIAS" && record.named === false && typeof record.value === "string") {
    const content = record.content;
    if (content?.type === "SYMBOL" && typeof content.name === "string")
      literalRules.set(content.name, record.value);
  }
  for (const value of Object.values(record)) walkGrammarNode(value, aliasTargets, literalRules);
}
var LITERAL_WRAPPERS = /* @__PURE__ */ new Set([
  "TOKEN",
  "IMMEDIATE_TOKEN",
  "PREC",
  "PREC_LEFT",
  "PREC_RIGHT",
  "PREC_DYNAMIC",
  "OPTIONAL",
  "REPEAT",
  "REPEAT1",
  "FIELD"
]);
function aliasedLiterals(content) {
  if (content === null || typeof content !== "object") return [];
  const record = content;
  if (record.type === "STRING" && typeof record.value === "string") return [record.value];
  if ((record.type === "CHOICE" || record.type === "SEQ") && Array.isArray(record.members)) {
    return record.members.flatMap(aliasedLiterals);
  }
  if (typeof record.type === "string" && LITERAL_WRAPPERS.has(record.type)) return aliasedLiterals(record.content);
  return [];
}
function resolveAliasedTokenLiterals(names, aliasTargets) {
  const byDisplay = /* @__PURE__ */ new Map();
  for (const [cName, displayName] of names) {
    if (!cName.startsWith("anon_sym_") || !aliasTargets.has(displayName)) continue;
    if (cName.slice("anon_sym_".length) === displayName) continue;
    byDisplay.set(displayName, [...byDisplay.get(displayName) ?? [], cName]);
  }
  const resolved = /* @__PURE__ */ new Map();
  for (const [displayName, cNames] of byDisplay) {
    const literals = aliasTargets.get(displayName);
    const literalOfCName = new Map([...literals].map((literal) => [sanitizeCIdentifier(literal), literal]));
    const unresolved = [];
    for (const cName of cNames) {
      const literal = literalOfCName.get(cName.slice("anon_sym_".length));
      if (literal !== void 0) resolved.set(cName, literal);
      else unresolved.push(cName);
    }
    const claimed = new Set(cNames.map((c) => resolved.get(c)).filter((l) => l !== void 0));
    const candidates = [...literals].filter((l) => !claimed.has(l));
    for (const cName of unresolved) {
      if (candidates.length !== 1 || unresolved.length !== 1) {
        throw new Error(
          `generated-metadata: aliased token ${cName} (display ${JSON.stringify(displayName)}) has no verbatim literal \u2014 unclaimed literals aliased to it: ${JSON.stringify(candidates)}`
        );
      }
      resolved.set(cName, candidates[0]);
    }
  }
  return resolved;
}
function resolveSymbolTextFacts(names, grammar) {
  const result = /* @__PURE__ */ new Map();
  const aliasedLiterals2 = resolveAliasedTokenLiterals(names, grammar.aliasTargets);
  for (const [cName, displayName] of names) {
    if (cName.startsWith("anon_sym_")) {
      const aliasedLiteralText = aliasedLiterals2.get(cName);
      if (aliasedLiteralText !== void 0) {
        result.set(cName, { literalText: aliasedLiteralText });
        continue;
      }
      result.set(cName, { literalText: displayName });
      continue;
    }
    if (cName.startsWith("sym_")) {
      const ruleName = cName.slice("sym_".length);
      const literalValue = grammar.literalRules.get(ruleName);
      if (literalValue === void 0) continue;
      const isNamedAliasTarget = grammar.aliasTargets.has(displayName);
      if (isNamedAliasTarget) continue;
      result.set(cName, { literalText: literalValue, literalRule: true });
    }
  }
  return result;
}
var KEYWORD_KEY_SUFFIX = "_keyword";
var PUNCTUATION_KEY_SUFFIX = "_punctuation";
function joinIdNames(ids, names, fallbackName2, symbolTextFacts, symbolFacts, lexicalRanks) {
  const result = /* @__PURE__ */ new Map();
  const collisions = [];
  const place = (key, row) => {
    const existing = result.get(key);
    const existingParser = existing?.parser;
    if (existing === void 0 || existingParser === void 0 || existingParser.cSymbol === row.parser.cSymbol) {
      result.set(key, row);
      return;
    }
    if (existingParser.anon !== row.parser.anon) {
      const existingRow = { ...existing, parser: existingParser };
      const [named, anonymous] = existingParser.anon ? [row, existingRow] : [existingRow, row];
      result.set(key, named);
      if (anonymous.parser.keyword === true) {
        collisions.push({ key, symbols: [named.parser.cSymbol, anonymous.parser.cSymbol] });
        return;
      }
      place(`${key}${PUNCTUATION_KEY_SUFFIX}`, anonymous);
      return;
    }
    if (!shouldReplaceSymbol(existingParser.cSymbol, row.parser.cSymbol)) {
      if (row.parser.alias) {
        if (row.parser.symbolName !== void 0 && row.parser.symbolName !== existingParser.symbolName) {
          result.set(key, { id: existing.id, parseId: row.id, parseName: row.parser.symbolName, parser: existingParser });
        }
        return;
      }
      collisions.push({ key, symbols: [existingParser.cSymbol, row.parser.cSymbol] });
      return;
    }
    result.set(key, row);
  };
  for (const entry of ids.values()) {
    const key = fallbackName2(entry.cName);
    place(key, { id: entry.id, parser: createParserMetadata(entry, key, names, symbolTextFacts, symbolFacts, lexicalRanks) });
  }
  return { ids: result, collisions };
}
function createParserMetadata(entry, parserName, names, symbolTextFacts, symbolFacts, lexicalRanks) {
  const facts = symbolTextFacts?.get(entry.cName);
  const lexicalRank = lexicalRanks?.get(grammarNameOfSymbol(entry.cName));
  return {
    cSymbol: entry.cName,
    parserName,
    symbolName: names.get(entry.cName),
    literalText: facts?.literalText,
    literalRule: facts?.literalRule,
    anon: symbolFacts?.named.get(entry.cName) === false,
    aux: entry.cName.startsWith("aux_sym_"),
    alias: entry.cName.startsWith("alias_sym_"),
    hidden: symbolFacts?.visible.get(entry.cName) === false,
    ...symbolFacts?.supertypes.has(entry.cName) ? { supertype: true } : {},
    ...symbolFacts?.tokenCount !== void 0 && entry.id < symbolFacts.tokenCount ? { terminal: true } : {},
    ...keywordTextOf(entry.cName, symbolTextFacts) === void 0 ? {} : { keyword: true },
    ...symbolFacts?.aliasedNonTerminals.has(entry.cName) ? { aliasedNonTerminal: true } : {},
    ...lexicalRank === void 0 ? {} : { lexicalRank }
  };
}
function grammarNameOfSymbol(cName) {
  return cName.replace(/^(?:alias_sym|aux_sym|anon_sym|sym)_/, "");
}
function shouldReplaceSymbol(existingCName, nextCName) {
  if (!existingCName) return true;
  return existingCName.startsWith("anon_sym_") && !nextCName.startsWith("anon_sym_");
}
function keywordTextOf(cName, symbolTextFacts) {
  const text = symbolTextFacts?.get(cName)?.literalText;
  return text !== void 0 && cName === `anon_sym_${text}` && /[^_]/.test(text) ? text : void 0;
}
function deriveSymbolRuntimeName(symbolTextFacts) {
  return (cName) => {
    if (cName.startsWith("sym_")) return cName.slice("sym_".length);
    if (cName.startsWith("anon_sym_")) {
      const spelled = cName.slice("anon_sym_".length);
      if (keywordTextOf(cName, symbolTextFacts) !== void 0) return `${spelled}${KEYWORD_KEY_SUFFIX}`;
      const text = symbolTextFacts.get(cName)?.literalText;
      if (text !== void 0 && cName === `anon_sym_${text}`) return text.length <= 1 ? "underscore" : `underscore${text.length}`;
      if (text !== void 0 && spelled === sanitizeCIdentifier(text)) return sanitizeCIdentifier(text, (word) => word.toLowerCase());
      return spelled.toLowerCase();
    }
    if (cName.startsWith("aux_sym_")) return cName.slice("aux_sym_".length);
    if (cName.startsWith("alias_sym_")) return `_${cName.slice("alias_sym_".length)}`;
    return cName;
  };
}
function compareLexicalKeys(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}
function tokenLexicalPrec(rule2) {
  if (rule2?.type !== "TOKEN" && rule2?.type !== "IMMEDIATE_TOKEN") return 0;
  return rule2.content?.type === "PREC" && typeof rule2.content.value === "number" ? rule2.content.value : 0;
}
function isFixedTextRule(rule2) {
  let current = rule2;
  while (current?.type === "TOKEN" || current?.type === "IMMEDIATE_TOKEN" || current?.type === "PREC")
    current = current.content;
  return current?.type === "STRING";
}
function collectLexicalRanks(grammarJson) {
  const grammar = grammarJson;
  const rules = grammar?.rules ?? {};
  const ruleNames = Object.keys(rules);
  const externals = (grammar?.externals ?? []).flatMap(
    (external) => typeof external.name === "string" ? [external.name] : []
  );
  const mintSources = /* @__PURE__ */ new Map();
  const aliasStorage = /* @__PURE__ */ new Map();
  for (const owner of ruleNames) {
    let arm2 = 0;
    const walk = (node) => {
      if (node === void 0) return;
      if (node.type === "SYMBOL" && typeof node.name === "string" && node.metadata?.symbolSource === "group-lift" && !mintSources.has(node.name)) {
        mintSources.set(node.name, { owner, arm: ++arm2 });
      }
      if (node.type === "ALIAS" && node.named === true && typeof node.value === "string" && node.content?.type === "SYMBOL" && typeof node.content.name === "string" && !aliasStorage.has(node.value)) {
        aliasStorage.set(node.value, node.content.name);
      }
      walk(node.content);
      for (const member of node.members ?? []) walk(member);
    };
    walk(rules[owner]);
  }
  const positions = /* @__PURE__ */ new Map();
  const positionOf = (name, seen) => {
    const known = positions.get(name);
    if (known !== void 0) return known;
    const source = mintSources.get(name);
    const position = source !== void 0 && !seen.has(source.owner) ? [...positionOf(source.owner, /* @__PURE__ */ new Set([...seen, name])), source.arm] : [externals.includes(name) ? externals.indexOf(name) : ruleNames.indexOf(name)];
    positions.set(name, position);
    return position;
  };
  const keyOf = (name) => {
    const rule2 = rules[name];
    return [
      externals.includes(name) ? 0 : 1,
      -tokenLexicalPrec(rule2),
      isFixedTextRule(rule2) ? 0 : 1,
      ...positionOf(name, /* @__PURE__ */ new Set())
    ];
  };
  const keys = /* @__PURE__ */ new Map();
  for (const name of [...externals, ...ruleNames]) keys.set(name, keyOf(name));
  for (const [display, storage] of aliasStorage) {
    const storageKey = keys.get(storage);
    if (!(display in rules) && storageKey !== void 0) keys.set(display, storageKey);
  }
  const ordered = [...keys].sort(([a, ka], [b, kb]) => compareLexicalKeys(ka, kb) || (a < b ? -1 : a > b ? 1 : 0));
  return new Map(ordered.map(([name], rank) => [name, rank]));
}
function stampVisibleExternals(tables, grammar) {
  const declared = Object.keys(grammar.visibleExternals ?? {});
  if (tables?.kindIds === void 0 || declared.length === 0) return tables;
  const stamped = new Map(toEntries(tables.kindIds));
  for (const name of declared) {
    const row = stamped.get(name);
    if (row?.parser === void 0 || row.parser.visibleExternal === true) continue;
    stamped.set(name, { ...row, parser: { ...row.parser, visibleExternal: true } });
  }
  return { ...tables, kindIds: stamped };
}
function symbolNameIsNotable(symbolName, kind, literalRule) {
  return symbolName !== void 0 && (symbolName !== kind || literalRule === true);
}
function collectGeneratedKindEntries(tables) {
  if (!tables?.kindIds) return [];
  return toEntries(tables.kindIds).filter(([, entry]) => entry.id !== void 0).map(([kind, entry]) => ({
    kind,
    id: entry.id,
    parseId: entry.parseId,
    parseName: entry.parseName,
    symbolName: symbolNameIsNotable(entry.parser?.symbolName, kind, entry.parser?.literalRule) ? entry.parser?.symbolName : void 0,
    literalText: entry.parser?.literalText,
    anon: entry.parser?.anon || void 0,
    literalRule: entry.parser?.literalRule || void 0,
    alias: entry.parser?.alias || void 0,
    hidden: entry.parser?.hidden || void 0,
    keyword: entry.parser?.keyword || void 0,
    aliasedNonTerminal: entry.parser?.aliasedNonTerminal || void 0,
    supertype: entry.parser?.supertype || void 0,
    terminal: entry.parser?.terminal || void 0,
    visibleExternal: entry.parser?.visibleExternal || void 0,
    lexicalRank: entry.parser?.lexicalRank
  }));
}
function findEntryForKindName(entries, name) {
  return entries.find((entry) => entry.kind === name && entry.alias !== true) ?? entries.find((entry) => entry.kind === `_${name}`) ?? entries.find((entry) => entry.anon === true && entry.symbolName === name) ?? entries.find((entry) => entry.anon !== true && (entry.symbolName === name || entry.parseName === name)) ?? void 0;
}
var visibleTreeNameCounts = /* @__PURE__ */ new WeakMap();
function visibleTreeNameCount(entries, name) {
  let counts = visibleTreeNameCounts.get(entries);
  if (counts === void 0) {
    const tally = /* @__PURE__ */ new Map();
    for (const entry of entries) {
      if (entry.anon === true || entry.hidden === true) continue;
      const treeName = entry.symbolName ?? entry.kind;
      tally.set(treeName, (tally.get(treeName) ?? 0) + 1);
    }
    counts = tally;
    visibleTreeNameCounts.set(entries, counts);
  }
  return counts.get(name) ?? 0;
}
function isRenamedEntry(entry, entries) {
  return entry.alias !== true && entry.anon !== true && entry.literalRule !== true && entry.visibleExternal !== true && entry.hidden !== true && entry.parseId === void 0 && entry.symbolName !== void 0 && entry.symbolName !== entry.kind && visibleTreeNameCount(entries, entry.symbolName) === 1;
}
function modelKindOfEntry(entry, entries) {
  return entry.symbolName !== void 0 && (entry.alias === true || isRenamedEntry(entry, entries)) ? entry.symbolName : entry.kind;
}
function parserHiddenOf(entry, kind) {
  return entry === void 0 ? isParserHiddenName(kind) : entry.alias !== true && entry.hidden === true;
}
function parserSupertypeOf(entry, kind, declaredSupertypes) {
  return entry === void 0 ? declaredSupertypes.has(kind) : entry.supertype === true;
}
var modelKindOwners = /* @__PURE__ */ new WeakMap();
function modelKindOwner(entries, kind) {
  let owners = modelKindOwners.get(entries);
  if (owners === void 0) {
    const index = /* @__PURE__ */ new Map();
    for (const entry of entries) {
      const modelKind = modelKindOfEntry(entry, entries);
      if (!index.has(modelKind)) index.set(modelKind, entry);
    }
    owners = index;
    modelKindOwners.set(entries, owners);
  }
  return owners.get(kind);
}
function findOwnKindEntry(entries, kind) {
  const owner = modelKindOwner(entries, kind);
  if (owner === void 0) return void 0;
  const entry = findEntryForKindName(entries, kind);
  if (entry !== void 0 && modelKindOfEntry(entry, entries) === kind) return entry;
  throw new Error(
    `generated-metadata: kind '${kind}' has catalog row '${owner.kind}' but resolves to ${entry === void 0 ? "no row" : `'${entry.kind}'`}`
  );
}
function toEntries(input) {
  if (!input) return [];
  const entries = input instanceof Map ? [...input.entries()] : Object.entries(input);
  return entries.map(([name, entry]) => [name, typeof entry === "number" ? { id: entry } : entry]);
}
function catalogSymbolSource(facts) {
  const entryOf = (name) => findOwnKindEntry(facts.kindEntries, name);
  const isInlined = (name) => facts.inline.has(name) && entryOf(name) === void 0;
  const isTerminal = (name) => {
    if (!isInlined(name)) return entryOf(name)?.terminal === true;
    const body = facts.rules[name];
    return body !== void 0 && terminalContentOf(body, isTerminal);
  };
  return {
    rules: facts.rules,
    externals: facts.externals,
    hasSymbol: (name) => entryOf(name) !== void 0,
    isTerminal,
    isInlined,
    isHidden: (name) => parserHiddenOf(entryOf(name), name),
    isSupertype: (name) => parserSupertypeOf(entryOf(name), name, facts.supertypes),
    isVisibleExternal: (name) => entryOf(name)?.visibleExternal === true
  };
}
var BLANK_RULE = { type: "BLANK" };
function sameShape(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function withMeta(content, set) {
  if (content.type === "META" && content.params.token !== true) {
    const params2 = { ...content.params };
    set(params2);
    return { type: "META", params: params2, rule: content.rule };
  }
  const params = {};
  set(params);
  return { type: "META", params, rule: content };
}
function internRule(rule2, resolve) {
  switch (rule2.type) {
    case "BLANK":
      return BLANK_RULE;
    case OPTIONAL:
      return { type: "CHOICE", members: [internRule(rule2.content, resolve), BLANK_RULE] };
    case STRING:
      return { type: "STRING", value: rule2.value };
    case PATTERN:
      return { type: "PATTERN", value: rule2.value };
    case SYMBOL:
      return { type: "SYM", key: resolve(rule2.name) };
    case SEQ:
    case CHOICE:
      return rule2.members.length === 0 ? BLANK_RULE : { type: rule2.type, members: rule2.members.map((member) => internRule(member, resolve)) };
    case REPEAT:
      return { type: "CHOICE", members: [{ type: "REPEAT", content: internRule(rule2.content, resolve) }, BLANK_RULE] };
    case REPEAT1:
      return { type: "REPEAT", content: internRule(rule2.content, resolve) };
    case TOKEN:
      return withMeta(internRule(rule2.content, resolve), (params) => {
        params.token = true;
        if ("immediate" in rule2 && rule2.immediate === true) params.immediate = true;
      });
    case IMMEDIATE_TOKEN:
      return withMeta(internRule(rule2.content, resolve), (params) => {
        params.token = true;
        params.immediate = true;
      });
    case ALIAS:
      return withMeta(internRule(rule2.content, resolve), (params) => {
        params.alias = { value: rule2.value, named: rule2.named };
      });
    case FIELD:
      return withMeta(internRule(rule2.content, resolve), (params) => {
        params.field = rule2.name;
      });
    case "PREC":
    case "PREC_LEFT":
    case "PREC_RIGHT":
    case "PREC_DYNAMIC":
      return withMeta(internRule(rule2.content, resolve), (params) => {
        params.prec = { ...params.prec, [rule2.type]: rule2.value };
      });
    case SUPERTYPE:
    case INDENT:
    case DEDENT:
    case NEWLINE:
      throw new Error(`symbol-table: a ${rule2.type} rule has no parser symbol to predict`);
    default:
      return assertNever(rule2);
  }
}
var TokenExtractor = class {
  lexical = [];
  usage = [];
  #owner = "";
  #count = 0;
  extractFrom(owner, rule2) {
    this.#owner = owner;
    this.#count = 0;
    return this.#extractIn(rule2);
  }
  #extractIn(rule2) {
    switch (rule2.type) {
      case "STRING":
        return this.#extract(rule2, rule2.value);
      case "PATTERN":
        return this.#extract(rule2, void 0);
      case "META": {
        if (rule2.params.token !== true) return { type: "META", params: rule2.params, rule: this.#extractIn(rule2.rule) };
        const { token: _token, ...params } = rule2.params;
        const text = rule2.rule.type === "STRING" ? rule2.rule.value : void 0;
        return this.#extract(Object.keys(params).length === 0 ? rule2.rule : rule2, text);
      }
      case "REPEAT":
        return { type: "REPEAT", content: this.#extractIn(rule2.content) };
      case "SEQ":
      case "CHOICE":
        return { type: rule2.type, members: rule2.members.map((member) => this.#extractIn(member)) };
      default:
        return rule2;
    }
  }
  #extract(rule2, text) {
    const existing = this.lexical.findIndex((variable) => sameShape(variable.rule, rule2));
    if (existing >= 0) {
      this.usage[existing]++;
      return { type: "SYM", key: `t:${existing}` };
    }
    this.lexical.push(
      text === void 0 ? { name: `${this.#owner}_token${++this.#count}`, kind: "auxiliary", rule: rule2 } : { name: text, kind: "anonymous", rule: rule2 }
    );
    this.usage.push(1);
    return { type: "SYM", key: `t:${this.lexical.length - 1}` };
  }
};
function mapSymbolKeys(rule2, map) {
  switch (rule2.type) {
    case "SYM":
      return { type: "SYM", key: map(rule2.key) };
    case "META":
      return { ...rule2, rule: mapSymbolKeys(rule2.rule, map) };
    case "REPEAT":
      return { ...rule2, content: mapSymbolKeys(rule2.content, map) };
    case "SEQ":
    case "CHOICE":
      return { ...rule2, members: rule2.members.map((member) => mapSymbolKeys(member, map)) };
    default:
      return rule2;
  }
}
function productionsOf(rule2, alias2) {
  switch (rule2.type) {
    case "BLANK":
      return [[]];
    case "SYM":
      return [[alias2 === void 0 ? { key: rule2.key } : { key: rule2.key, alias: alias2 }]];
    case "META":
      return productionsOf(rule2.rule, rule2.params.alias ?? alias2);
    case "CHOICE": {
      const productions = [];
      for (const member of rule2.members) {
        for (const production of productionsOf(member, alias2)) {
          if (!productions.some((known) => sameShape(known, production))) productions.push(production);
        }
      }
      return productions;
    }
    case "SEQ": {
      let productions = [[]];
      for (const member of rule2.members) {
        const tails = productionsOf(member, alias2);
        productions = productions.flatMap((head) => tails.map((tail) => [...head, ...tail]));
      }
      return productions;
    }
    default:
      throw new Error(`symbol-table: a ${rule2.type} survived token extraction`);
  }
}
var C_SYMBOL_CHARACTER_NAMES = {
  "~": "TILDE",
  "`": "BQUOTE",
  "!": "BANG",
  "@": "AT",
  "#": "POUND",
  $: "DOLLAR",
  "%": "PERCENT",
  "^": "CARET",
  "&": "AMP",
  "*": "STAR",
  "(": "LPAREN",
  ")": "RPAREN",
  "-": "DASH",
  "+": "PLUS",
  "=": "EQ",
  "{": "LBRACE",
  "}": "RBRACE",
  "[": "LBRACK",
  "]": "RBRACK",
  "\\": "BSLASH",
  "|": "PIPE",
  ":": "COLON",
  ";": "SEMI",
  '"': "DQUOTE",
  "'": "SQUOTE",
  "<": "LT",
  ">": "GT",
  ",": "COMMA",
  ".": "DOT",
  "?": "QMARK",
  "/": "SLASH",
  "\n": "LF",
  "\r": "CR",
  "	": "TAB",
  "\0": "NULL"
};
var C_CONTROL_CHARACTER_NAMES = [
  "NULL",
  "SOH",
  "STX",
  "ETX",
  "EOT",
  "ENQ",
  "ACK",
  "BEL",
  "BS",
  "TAB",
  "LF",
  "VTAB",
  "FF",
  "CR",
  "SO",
  "SI",
  "DLE",
  "DC1",
  "DC2",
  "DC3",
  "DC4",
  "NAK",
  "SYN",
  "ETB",
  "CAN",
  "EM",
  "SUB",
  "ESC",
  "FS",
  "GS",
  "RS",
  "US"
];
function sanitizeCIdentifier(name, spellReplacement = (word) => word) {
  let identifier = "";
  for (const character of name) {
    if (/[A-Za-z0-9_]/.test(character)) {
      identifier += character;
      continue;
    }
    const codePoint = character.codePointAt(0);
    const replacement = character === " " && name.length === 1 ? "SPACE" : C_SYMBOL_CHARACTER_NAMES[character] ?? C_CONTROL_CHARACTER_NAMES[codePoint];
    if (replacement !== void 0) {
      if (identifier.length > 0 && !identifier.endsWith("_")) identifier += "_";
      identifier += spellReplacement(replacement);
      continue;
    }
    for (let unit = 0; unit < character.length; unit++) {
      identifier += `u${character.charCodeAt(unit).toString(16).padStart(4, "0")}`;
    }
  }
  return identifier;
}
function referencedNames(rule2, into) {
  if (rule2.type === SYMBOL) into.push(rule2.name);
  if ("members" in rule2) for (const member of rule2.members) referencedNames(member, into);
  if ("content" in rule2) referencedNames(rule2.content, into);
}
function liveRuleNames(grammar) {
  const live = /* @__PURE__ */ new Set();
  const pending = grammarRootNames(grammar);
  while (pending.length > 0) {
    const name = pending.pop();
    if (live.has(name) || !(name in grammar.rules)) continue;
    live.add(name);
    referencedNames(grammar.rules[name], pending);
  }
  return live;
}
function expandRepeats(variables) {
  const auxiliaries = [];
  const expansions = /* @__PURE__ */ new Map();
  for (const variable of variables) {
    let count = 0;
    const repeatOf = (key, inner) => ({
      type: "CHOICE",
      members: [{ type: "SEQ", members: [{ type: "SYM", key }, { type: "SYM", key }] }, inner]
    });
    const expand = (rule2) => {
      switch (rule2.type) {
        case "REPEAT": {
          const inner = expand(rule2.content);
          const known = expansions.get(JSON.stringify(inner));
          if (known !== void 0) return { type: "SYM", key: known };
          const name = `${variable.name}_repeat${++count}`;
          const key = `nt:${name}`;
          expansions.set(JSON.stringify(inner), key);
          auxiliaries.push({ name, kind: "auxiliary", rule: repeatOf(key, inner) });
          return { type: "SYM", key };
        }
        case "META":
          return { ...rule2, rule: expand(rule2.rule) };
        case "SEQ":
        case "CHOICE":
          return { ...rule2, members: rule2.members.map(expand) };
        default:
          return rule2;
      }
    };
    if (variable.kind === "hidden" && variable.rule.type === "REPEAT") {
      variable.rule = repeatOf(`nt:${variable.name}`, expand(variable.rule.content));
      variable.kind = "auxiliary";
    } else variable.rule = expand(variable.rule);
  }
  return [...variables, ...auxiliaries];
}
function defaultAliasesOf(productions, reachable, inline) {
  const uses = /* @__PURE__ */ new Map();
  for (const [owner, ownerProductions] of productions) {
    if (!reachable.has(owner)) continue;
    for (const step of ownerProductions.flat()) {
      if (inline.has(step.key)) continue;
      const use = uses.get(step.key) ?? { unaliased: false, counts: [] };
      uses.set(step.key, use);
      if (step.alias === void 0) {
        use.unaliased = true;
        continue;
      }
      const counted = use.counts.find(([alias2]) => sameShape(alias2, step.alias));
      if (counted !== void 0) counted[1]++;
      else use.counts.push([step.alias, 1]);
    }
  }
  const defaults = /* @__PURE__ */ new Map();
  for (const [key, use] of uses) {
    if (use.unaliased || use.counts.length === 0) continue;
    let best = use.counts[0];
    for (const counted of use.counts) if (counted[1] > best[1]) best = counted;
    defaults.set(key, best[0]);
  }
  return defaults;
}
function clearDefaultAliases(productions, defaults) {
  for (const ownerProductions of productions.values()) {
    const cleared = [];
    ownerProductions.forEach(
      (production, index) => production.forEach((step, position) => {
        if (step.alias === void 0 || !sameShape(step.alias, defaults.get(step.key))) return;
        const conflicts = ownerProductions.some(
          (other, otherIndex) => otherIndex !== index && other.length > position && other[position].alias !== void 0 && !sameShape(other[position].alias, step.alias)
        );
        if (!conflicts) cleared.push(step);
      })
    );
    for (const step of cleared) delete step.alias;
  }
}
function predictSymbolTable(grammar) {
  const live = liveRuleNames(grammar);
  const supertypes = new Set(grammar.supertypes);
  const undefinedNames = /* @__PURE__ */ new Set();
  const resolve = (name) => {
    if (live.has(name)) return `nt:${name}`;
    const index = grammar.externals.findIndex((entry) => entry.type === SYMBOL && entry.name === name);
    if (index >= 0) return `ext:${index}`;
    undefinedNames.add(name);
    return `undef:${name}`;
  };
  let variables = Object.keys(grammar.rules).filter((name) => live.has(name)).map((name) => ({
    name,
    kind: supertypes.has(name) || name.startsWith("_") ? "hidden" : "named",
    rule: internRule(grammar.rules[name], resolve)
  }));
  const externals = grammar.externals.map(
    (entry, index) => entry.type === SYMBOL ? {
      name: entry.name,
      kind: entry.name.startsWith("_") ? "hidden" : "named",
      rule: { type: "SYM", key: entry.name in grammar.rules ? `nt:${entry.name}` : `ext:${index}` }
    } : { name: entry.value, kind: "anonymous", rule: { type: entry.type, value: entry.value } }
  );
  const tokens = new TokenExtractor();
  const wordFirst = [...variables].sort((a, b) => Number(b.name === grammar.word) - Number(a.name === grammar.word));
  for (const variable of wordFirst) variable.rule = tokens.extractFrom(variable.name, variable.rule);
  for (const external of externals) external.rule = tokens.extractFrom(external.name, external.rule);
  const replaced = /* @__PURE__ */ new Map();
  variables = variables.filter((variable, index) => {
    if (index === 0 || variable.rule.type !== "SYM" || !variable.rule.key.startsWith("t:")) return true;
    const tokenIndex = Number(variable.rule.key.slice(2));
    const token = tokens.lexical[tokenIndex];
    if (tokens.usage[tokenIndex] !== 1 || token.kind !== "auxiliary" && variable.kind === "hidden") return true;
    token.kind = variable.kind;
    token.name = variable.name;
    replaced.set(`nt:${variable.name}`, variable.rule.key);
    return false;
  });
  const replace = (key) => replaced.get(key) ?? key;
  for (const variable of [...variables, ...externals]) variable.rule = mapSymbolKeys(variable.rule, replace);
  const extraKeys = grammar.extras.flatMap((entry) => {
    if (entry.type === SYMBOL) return [replace(resolve(entry.name))];
    const lexical = internRule(entry, resolve);
    const index = tokens.lexical.findIndex((token) => sameShape(token.rule, lexical));
    return index < 0 ? [] : [`t:${index}`];
  });
  const externalKey = (index) => {
    const rule2 = externals[index].rule;
    return rule2.type === "SYM" && rule2.key.startsWith("t:") ? rule2.key : `ext:${index}`;
  };
  const canonical = (key) => key.startsWith("ext:") ? externalKey(Number(key.slice(4))) : key;
  for (const variable of variables) variable.rule = mapSymbolKeys(variable.rule, canonical);
  const syntax = expandRepeats(variables);
  const byKey = new Map(syntax.map((variable) => [`nt:${variable.name}`, variable]));
  const productions = new Map(syntax.map((variable) => [`nt:${variable.name}`, productionsOf(variable.rule)]));
  const inline = new Set(grammar.inline.filter((name) => live.has(name)).map((name) => replace(resolve(name))));
  const reachable = /* @__PURE__ */ new Set();
  const queue = [`nt:${variables[0].name}`, ...extraKeys];
  while (queue.length > 0) {
    const key = queue.shift();
    if (reachable.has(key)) continue;
    reachable.add(key);
    for (const step of (productions.get(key) ?? []).flat()) queue.push(step.key);
  }
  externals.forEach((_, index) => reachable.add(externalKey(index)));
  const defaults = defaultAliasesOf(productions, reachable, inline);
  clearDefaultAliases(productions, defaults);
  const variableOf = (key) => key.startsWith("nt:") ? byKey.get(key) : key.startsWith("t:") ? tokens.lexical[Number(key.slice(2))] : externals[Number(key.slice(4))];
  const displayOf = (key) => {
    const alias2 = defaults.get(key);
    if (alias2 !== void 0) return { name: alias2.value, named: alias2.named, visible: true };
    const { name, kind } = variableOf(key);
    return { name, named: kind === "named" || kind === "hidden", visible: kind === "named" || kind === "anonymous" };
  };
  const order = [
    ...tokens.lexical.map((_, index) => `t:${index}`).filter((key) => reachable.has(key)),
    ...externals.map((_, index) => externalKey(index)).filter((key) => key.startsWith("ext:") && reachable.has(key)),
    ...syntax.map((variable) => `nt:${variable.name}`).filter((key) => reachable.has(key) && !inline.has(key))
  ];
  const tokenCount = 1 + order.filter((key) => !key.startsWith("nt:")).length;
  const usedCNames = /* @__PURE__ */ new Set();
  const uniqueCName = (base2) => {
    let cName = base2;
    for (let suffix = 2; usedCNames.has(cName); suffix++) cName = `${base2}${suffix}`;
    usedCNames.add(cName);
    return cName;
  };
  const cNameOf = new Map(
    order.map((key) => {
      const { name, kind } = variableOf(key);
      const prefix = kind === "anonymous" ? "anon_sym_" : kind === "auxiliary" ? "aux_sym_" : "sym_";
      return [key, uniqueCName(prefix + sanitizeCIdentifier(name))];
    })
  );
  const aliasedNonTerminals = /* @__PURE__ */ new Set();
  const aliasSymbols = [];
  for (const [owner, ownerProductions] of productions) {
    if (!reachable.has(owner)) continue;
    for (const step of ownerProductions.flat()) {
      if (step.alias === void 0) continue;
      if (step.key.startsWith("nt:") && !sameShape(step.alias, defaults.get(step.key))) aliasedNonTerminals.add(step.key);
      const alias2 = step.alias;
      const named = order.some((key) => {
        const display = displayOf(key);
        return display.name === alias2.value && display.named === alias2.named;
      });
      if (!named && !aliasSymbols.some((known) => sameShape(known, alias2))) aliasSymbols.push(alias2);
    }
  }
  const symbols = /* @__PURE__ */ new Map();
  const names = /* @__PURE__ */ new Map();
  const visible = /* @__PURE__ */ new Map();
  const namedFlags = /* @__PURE__ */ new Map();
  const supertypeCNames = /* @__PURE__ */ new Set();
  const aliasedNonTerminalCNames = /* @__PURE__ */ new Set();
  for (const key of order) {
    const cName = cNameOf.get(key);
    const display = displayOf(key);
    symbols.set(cName, { cName, id: symbols.size + 1 });
    names.set(cName, display.name);
    visible.set(cName, display.visible);
    namedFlags.set(cName, display.named);
    if (key.startsWith("nt:") && supertypes.has(variableOf(key).name)) supertypeCNames.add(cName);
    if (aliasedNonTerminals.has(key)) aliasedNonTerminalCNames.add(cName);
  }
  aliasSymbols.sort((a, b) => a.value < b.value ? -1 : a.value > b.value ? 1 : Number(a.named) - Number(b.named));
  for (const alias2 of aliasSymbols) {
    const cName = uniqueCName(`alias_sym_${sanitizeCIdentifier(alias2.value)}`);
    symbols.set(cName, { cName, id: symbols.size + 1 });
    names.set(cName, alias2.value);
    visible.set(cName, true);
    namedFlags.set(cName, alias2.named);
  }
  return {
    symbols,
    names,
    facts: {
      aliasedNonTerminals: aliasedNonTerminalCNames,
      visible,
      named: namedFlags,
      supertypes: supertypeCNames,
      tokenCount
    },
    undefinedNames: [...undefinedNames]
  };
}
function predictKindCatalog(grammar) {
  const table = predictSymbolTable(grammar);
  const { ids: kindIds, collisions } = kindTableOfSymbolTable(table, grammar);
  const entries = collectGeneratedKindEntries(stampVisibleExternals({ kindIds, sourceArtifact: "predicted" }, grammar)).map(
    ({ lexicalRank: _lexicalRank, ...entry }) => entry
  );
  return { entries, undefinedNames: table.undefinedNames, keyCollisions: collisions };
}
function catalogRenames(names, entries) {
  const renames = /* @__PURE__ */ new Map();
  for (const name of names) {
    const entry = findEntryForKindName(entries, name);
    if (entry === void 0 || entry.kind !== name || entry.symbolName === void 0 || !isRenamedEntry(entry, entries)) {
      continue;
    }
    renames.set(name, entry.symbolName);
  }
  return renames;
}
function renameAwareSymbolSource(facts) {
  const renames = catalogRenames([...Object.keys(facts.rules), ...facts.externals], facts.kindEntries);
  const catalog = catalogSymbolSource(facts);
  const asked = (name) => renames.get(name) ?? name;
  return {
    rules: catalog.rules,
    externals: catalog.externals,
    hasSymbol: (name) => catalog.hasSymbol(asked(name)),
    isTerminal: (name) => catalog.isTerminal(asked(name)),
    isInlined: (name) => catalog.isInlined(asked(name)),
    isHidden: (name) => catalog.isHidden(asked(name)),
    isSupertype: (name) => catalog.isSupertype(asked(name)),
    isVisibleExternal: (name) => catalog.isVisibleExternal(asked(name))
  };
}
function predictedSymbolSourceOf(grammar) {
  return renameAwareSymbolSource({ ...symbolFactsOf(grammar), kindEntries: predictKindCatalog(grammar).entries });
}

// packages/codegen/src/dsl/enrich-ctx.ts
function enrichSymbolSource(init, rules) {
  const bodilessVisibleExternals = ruleListParts(init.externals).names.filter(
    (name) => !isParserHiddenName(name) && !(name in rules)
  );
  return predictedSymbolSourceOf({
    rules,
    externals: init.externals,
    extras: init.extras,
    supertypes: [...init.supertypeNames],
    inline: [...init.inline],
    word: init.word,
    visibleExternals: Object.fromEntries(bodilessVisibleExternals.map((name) => [name, true]))
  });
}
var EnrichCtx = class _EnrichCtx {
  rulesBag;
  supertypeNames;
  externals;
  inline;
  extras;
  word;
  wordMatcher;
  authoredGroupBodies;
  sourceSymbols;
  kwRules;
  clauseGroupRules;
  clauseDedupeMap;
  groupDedupeMap;
  visibleGroupSources;
  clauseGroupOwners;
  hoist;
  constructor(fields) {
    this.rulesBag = fields.rulesBag;
    this.supertypeNames = fields.supertypeNames;
    this.externals = fields.externals;
    this.inline = fields.inline;
    this.extras = fields.extras;
    this.word = fields.word;
    this.wordMatcher = fields.wordMatcher;
    this.authoredGroupBodies = fields.authoredGroupBodies;
    this.sourceSymbols = fields.sourceSymbols;
    this.kwRules = fields.kwRules;
    this.clauseGroupRules = fields.clauseGroupRules;
    this.clauseDedupeMap = fields.clauseDedupeMap;
    this.groupDedupeMap = fields.groupDedupeMap;
    this.visibleGroupSources = fields.visibleGroupSources;
    this.clauseGroupOwners = fields.clauseGroupOwners;
    this.hoist = fields.hoist;
  }
  static create(init) {
    return new _EnrichCtx({
      ...init,
      sourceSymbols: enrichSymbolSource(init, init.rulesBag),
      kwRules: {},
      clauseGroupRules: {},
      clauseDedupeMap: {},
      groupDedupeMap: {},
      visibleGroupSources: /* @__PURE__ */ new Set(),
      clauseGroupOwners: /* @__PURE__ */ new Map(),
      hoist: void 0
    });
  }
  withHoist(hoist) {
    return new _EnrichCtx({ ...this, hoist });
  }
};

// packages/codegen/src/dsl/rule-transforms.ts
function innermostNamedAliasContent(rule2) {
  let current = rule2;
  for (let alias2 = current; alias2.type === ALIAS && alias2.named === true && alias2.value; alias2 = current) {
    current = alias2.content;
  }
  return current;
}
function distributeInlineAliasChoices(rule2, ctx) {
  const walker = new SyntacticRuleWalker();
  const distributed = /* @__PURE__ */ new WeakSet();
  const inlineChoiceOf = (content) => {
    if (content.type !== SYMBOL) return void 0;
    const body = ctx.inlineBodyOf(content.name);
    return body !== void 0 && choiceArmsOf(body) !== void 0 ? body : void 0;
  };
  const armsOf = (content) => choiceArmsOf(inlineChoiceOf(content) ?? content)?.flatMap((arm2) => armsOf(arm2) ?? [arm2]);
  const visit = (r) => {
    const choice = r;
    if (choice.type === CHOICE && choice.members?.some((m) => distributed.has(m))) {
      const members = choice.members.flatMap(
        (m) => distributed.has(m) ? m.members : [m]
      );
      return { ...choice, members };
    }
    const alias2 = r;
    if (alias2.type !== ALIAS || alias2.named !== true || !alias2.value) return r;
    const arms = armsOf(innermostNamedAliasContent(alias2.content));
    if (arms === void 0) return r;
    const split = {
      type: CHOICE,
      members: arms.map((arm2) => ({ ...alias2, content: innermostNamedAliasContent(arm2) }))
    };
    distributed.add(split);
    return split;
  };
  return visit(walker.map(rule2, visit));
}
function mintInlineLiteralAliasStorage(rules) {
  const walker = new SyntacticRuleWalker();
  const literalAliasOf = (r) => {
    const alias2 = r;
    if (alias2.type !== ALIAS || alias2.named !== true || !alias2.value || Object.hasOwn(rules, alias2.value)) return void 0;
    const arms = choiceArmsOf(innermostNamedAliasContent(alias2.content));
    if (arms === void 0 || !arms.every((arm2) => arm2.type === STRING)) return void 0;
    const body = { type: CHOICE, members: arms };
    const literals = JSON.stringify(arms.map((arm2) => arm2.value));
    return { display: alias2.value, body, literals };
  };
  const byDisplay = /* @__PURE__ */ new Map();
  for (const rule2 of Object.values(rules)) {
    walker.fold(rule2, byDisplay, (acc, r) => {
      const site = literalAliasOf(r);
      if (site === void 0) return acc;
      const entry = acc.get(site.display);
      if (entry === void 0) {
        acc.set(site.display, { literals: /* @__PURE__ */ new Set([site.literals]), body: site.body });
      } else entry.literals.add(site.literals);
      return acc;
    });
  }
  const storage = /* @__PURE__ */ new Map();
  for (const [display, { literals, body }] of byDisplay) {
    const name = `_${display}`;
    if (literals.size === 1 && !Object.hasOwn(rules, name)) storage.set(display, { name, body });
  }
  if (storage.size === 0) return rules;
  const visit = (r) => {
    const site = literalAliasOf(r);
    const minted = site === void 0 ? void 0 : storage.get(site.display);
    if (site === void 0 || minted === void 0) return r;
    return { type: ALIAS, named: true, value: site.display, content: { type: SYMBOL, name: minted.name } };
  };
  const out = {};
  for (const [name, rule2] of Object.entries(rules)) out[name] = visit(walker.map(rule2, visit));
  for (const { name, body } of storage.values()) out[name] = body;
  return out;
}
function liftAliasedHiddenRuleBodies(rules) {
  const displayByRule = /* @__PURE__ */ new Map();
  for (const [name, rule2] of Object.entries(rules)) {
    const alias2 = rule2;
    if (!name.startsWith("_") || alias2.type !== ALIAS || alias2.named !== true || !alias2.value) continue;
    if (alias2.content.type === SYMBOL) continue;
    displayByRule.set(name, alias2);
  }
  if (displayByRule.size === 0) return rules;
  const lifted = (r) => {
    const name = r.type === SYMBOL ? r.name : void 0;
    return name !== void 0 && displayByRule.has(name) ? name : void 0;
  };
  const walker = new SyntacticRuleWalker();
  const visit = (r) => {
    const name = lifted(r);
    if (name !== void 0) return { ...displayByRule.get(name), content: r };
    const alias2 = r;
    if (alias2.type !== ALIAS) return r;
    const inner = alias2.content;
    if (inner.type === ALIAS && lifted(inner.content) !== void 0) return { ...alias2, content: inner.content };
    return r;
  };
  const out = {};
  for (const [name, rule2] of Object.entries(rules)) {
    const body = displayByRule.get(name)?.content ?? rule2;
    out[name] = visit(walker.map(body, visit));
  }
  return out;
}
function unaliasOverloadedDisplays(rules, ctx) {
  const walker = new SyntacticRuleWalker();
  const siteOf = (r) => {
    const alias2 = r;
    return alias2.type === ALIAS && alias2.named === true && alias2.value ? alias2 : void 0;
  };
  const terminalContent = (content) => terminalContentOf(content, ctx.symbols.isTerminal);
  const storageOf = (content) => {
    const symbol = content.type === SYMBOL ? content.name : void 0;
    return { key: symbol ?? JSON.stringify(content), symbol, terminal: terminalContent(content) };
  };
  const storagesByDisplay = /* @__PURE__ */ new Map();
  for (const rule2 of Object.values(rules)) {
    walker.fold(rule2, storagesByDisplay, (acc, r) => {
      const site = siteOf(r);
      if (site === void 0) return acc;
      const storage = storageOf(site.content);
      const storages = acc.get(site.value) ?? /* @__PURE__ */ new Map();
      storages.set(storage.key, storage);
      acc.set(site.value, storages);
      return acc;
    });
  }
  const taken = /* @__PURE__ */ new Set([...Object.keys(rules), ...storagesByDisplay.keys()]);
  const minted = /* @__PURE__ */ new Map();
  const mintFor = ({ storage, display }) => {
    const known = minted.get(`${storage} ${display}`);
    if (known !== void 0) return known;
    const stripped = storage.replace(/^_+/, "");
    const sameStorage = storagesByDisplay.get(stripped);
    const reusable = sameStorage !== void 0 && sameStorage.size === 1 && sameStorage.has(storage) && !Object.hasOwn(rules, stripped);
    if (reusable) return stripped;
    const name = !taken.has(stripped) ? stripped : `${display}_${stripped}`;
    if (taken.has(name)) throw new Error(`enrich: no free display name for ${storage} under ${display} (${stripped} and ${name} are taken)`);
    taken.add(name);
    minted.set(`${storage} ${display}`, name);
    return name;
  };
  const actions = /* @__PURE__ */ new Map();
  const split = ({ display, storage }) => {
    if (storage.symbol === void 0) {
      if (!storage.terminal) throw new Error(`enrich: ${display} displays an inline nonterminal; give it a rule of its own`);
      actions.set(`${display} ${storage.key}`, { kind: "drop" });
    } else if (!isParserHiddenName(storage.symbol)) actions.set(`${display} ${storage.key}`, { kind: "drop" });
    else actions.set(`${display} ${storage.key}`, { kind: "rename", display: mintFor({ storage: storage.symbol, display }) });
  };
  for (const display of [...storagesByDisplay.keys()].sort()) {
    const members = [...storagesByDisplay.get(display).values()];
    if (Object.hasOwn(rules, display)) {
      const terminalDisplay = ctx.symbols.isTerminal(display);
      for (const storage of members) {
        if (storage.symbol === display || terminalDisplay && storage.terminal) continue;
        split({ display, storage });
      }
      continue;
    }
    const nonterminals = members.filter((storage) => !storage.terminal);
    if (nonterminals.length >= 2) {
      for (const storage of nonterminals) split({ display, storage });
    } else if (nonterminals.length === 1 && nonterminals.length < members.length) {
      const [only] = nonterminals;
      if (only.symbol !== void 0 && only.symbol.replace(/^_+/, "") === display) {
        for (const storage of members) if (storage.terminal) actions.set(`${display} ${storage.key}`, { kind: "drop" });
      } else split({ display, storage: only });
    }
  }
  if (actions.size === 0) return rules;
  const visit = (r) => {
    const site = siteOf(r);
    if (site === void 0) return r;
    const action = actions.get(`${site.value} ${storageOf(site.content).key}`);
    if (action === void 0) return r;
    return action.kind === "drop" ? site.content : { ...site, value: action.display };
  };
  const out = {};
  for (const [name, rule2] of Object.entries(rules)) out[name] = visit(walker.map(rule2, visit));
  return out;
}
var flagWalker = new RuleWalker();
var fuseHeadRepeatListsWalker = new RuleWalker();

// packages/codegen/src/dsl/shared.ts
function baseRulesOf(base2) {
  if (!base2 || typeof base2 !== "object") return void 0;
  const grammar = "grammar" in base2 ? base2.grammar : base2;
  if (!grammar || typeof grammar !== "object") return void 0;
  return grammar.rules;
}

// packages/codegen/src/dsl/whitespace.ts
var TIGHT_MEMBER = "_tight";
var SPACE_MEMBER = "_space";
var TAB_MEMBER = "_tab";
var NEWLINE_MEMBER = "_newline";
var HORIZONTAL_SPACE = " ";
var WHITESPACE_MEMBERS = [
  { name: TIGHT_MEMBER, body: { type: STRING, value: "" }, alwaysAdmitted: true },
  { name: SPACE_MEMBER, body: { type: STRING, value: " " } },
  { name: TAB_MEMBER, body: { type: STRING, value: "	" } },
  { name: NEWLINE_MEMBER, body: { type: STRING, value: "\n" } },
  { name: "_blankline", body: { type: STRING, value: "\n\n" } },
  { name: "_double_blankline", body: { type: STRING, value: "\n\n\n" } },
  { name: "_indent", body: { type: STRING, value: INDENT_TEXT } },
  { name: "_dedent", body: { type: STRING, value: DEDENT_TEXT } }
];
function admittedTextOf(text) {
  return isDepthText(text) ? HORIZONTAL_SPACE : text;
}
function admitsWhitespaceMember(run, name, text) {
  const alwaysAdmitted = WHITESPACE_MEMBERS.find((member) => member.name === name)?.alwaysAdmitted === true;
  return alwaysAdmitted || (run?.test(admittedTextOf(text)) ?? false);
}
function enrichWhitespace(externals, extras, rules) {
  const run = nodelessExtrasRun(extras, rules);
  const upstream = new Set(ruleListParts(externals).names);
  const members = WHITESPACE_MEMBERS.filter(
    (member) => admitsWhitespaceMember(run, member.name, member.body.value) && !(isDepthText(member.body.value) && upstream.has(member.name))
  );
  const rule2 = { type: CHOICE, members: members.map((member) => ({ type: SYMBOL, name: member.name })) };
  const minted = [
    [WHITESPACE_SUPERTYPE, rule2],
    ...members.filter((member) => !upstream.has(member.name)).map((member) => [member.name, member.body])
  ];
  return {
    members: members.map((member) => member.name),
    addedExternals: members.filter((member) => !upstream.has(member.name)).map((member) => member.name),
    bodies: Object.fromEntries(members.map((member) => [member.name, member.body])),
    rule: rule2,
    collisions: minted.filter(([name, body]) => rules[name] !== void 0 && !rulesEqual(rules[name], body)).map(([name]) => ({ name, site: "upstream" }))
  };
}

// packages/codegen/src/dsl/transform/token-forms.ts
var typeOf2 = (rule2) => rule2.type ?? "";
var membersOf = (rule2) => rule2.members ?? [];
var contentOf = (rule2) => rule2.content;
var rebuilt = (rule2, patch) => ({ ...rule2, ...patch });
var isString = (rule2) => typeOf2(rule2) === "STRING";
function isTokenWrapper(rule2) {
  return isTokenWrapperType(typeOf2(rule2));
}
function classifyTokenChoice(choice) {
  const arms = membersOf(choice);
  if (arms.some(isBlank)) return "presence";
  if (arms.every(isString)) return "spelling";
  return "forms";
}
function flattenFormArms(arms) {
  return arms.flatMap(
    (arm2) => isChoiceType(typeOf2(arm2)) && classifyTokenChoice(arm2) === "forms" ? flattenFormArms(membersOf(arm2)) : [arm2]
  );
}
var isFieldedAt = (fielded, path) => fielded.some((site) => site.length === path.length && site.every((index, i) => index === path[i]));
function findOutermostForms(rule2, path, fielded) {
  const t = typeOf2(rule2);
  if (t === "FIELD" || isChoiceType(t) && isFieldedAt(fielded, path)) return void 0;
  const optional = optionalContentOf(rule2);
  if (optional !== void 0) {
    const forms = isChoiceType(typeOf2(optional)) && classifyTokenChoice(optional) === "forms";
    return forms ? { path, arms: [...flattenFormArms(membersOf(optional)), BLANK] } : void 0;
  }
  if (isChoiceType(t)) {
    return classifyTokenChoice(rule2) === "forms" ? { path, arms: flattenFormArms(membersOf(rule2)) } : void 0;
  }
  if (isSeqType(t)) {
    const members = membersOf(rule2);
    for (let i = 0; i < members.length; i++) {
      const found = findOutermostForms(members[i], [...path, i], fielded);
      if (found) return found;
    }
    return void 0;
  }
  if (contentOf(rule2) !== void 0) return findOutermostForms(contentOf(rule2), [...path, 0], fielded);
  return void 0;
}
function replaceAt(rule2, path, arm2) {
  if (path.length === 0) return arm2;
  const [head, ...rest] = path;
  if (Array.isArray(rule2.members)) {
    const members = membersOf(rule2).map((m, i) => i === head ? replaceAt(m, rest, arm2) : m);
    return rebuilt(rule2, { members });
  }
  return rebuilt(rule2, { content: replaceAt(contentOf(rule2), rest, arm2) });
}
var BLANK = { type: "BLANK" };
var EMPTY_SEQ = { type: "SEQ", members: [] };
function dropAt(rule2, path) {
  if (path.length === 0) return EMPTY_SEQ;
  const [head, ...rest] = path;
  if (Array.isArray(rule2.members)) {
    if (rest.length === 0) return rebuilt(rule2, { members: membersOf(rule2).filter((_, i) => i !== head) });
    return rebuilt(rule2, { members: membersOf(rule2).map((m, i) => i === head ? dropAt(m, rest) : m) });
  }
  return rebuilt(rule2, { content: dropAt(contentOf(rule2), rest) });
}
function factorSharedOptional(rule2) {
  const typed = rule2;
  let out = rule2;
  if (Array.isArray(typed.members)) {
    const members2 = typed.members.map(factorSharedOptional);
    if (members2.some((member, i) => member !== typed.members[i])) out = rebuilt(rule2, { members: members2 });
  } else if (typed.content !== void 0) {
    const content = factorSharedOptional(typed.content);
    if (content !== typed.content) out = rebuilt(rule2, { content });
  }
  if (!isChoiceType(typeOf2(out))) return out;
  const members = membersOf(out);
  const contents = members.map((member) => optionalContentOf(member));
  if (members.length < 2 || contents.some((content) => content === void 0)) return out;
  const shared = { type: "CHOICE", members: contents };
  return rebuilt(out, { members: [shared, BLANK] });
}
var canonicalRuleText = (rule2) => JSON.stringify(rule2, (key, value) => key === "id" || key === "metadata" ? void 0 : value);
var underWrapper = (fielded) => fielded.flatMap((site) => site[0] === 0 ? [site.slice(1)] : []);
function distributeTokenForms(rule2, kind, fielded = []) {
  const precStack = [];
  let core = rule2;
  let sites = fielded;
  while (isPrecWrapper(core)) {
    precStack.push(core);
    core = contentOf(core);
    sites = underWrapper(sites);
  }
  if (!isTokenWrapper(core)) return rule2;
  const body = contentOf(core);
  const site = findOutermostForms(body, [], underWrapper(sites));
  if (site === void 0) return rule2;
  const arms = site.arms.map((arm2) => isBlank(arm2) ? dropAt(body, site.path) : replaceAt(body, site.path, arm2));
  const empty = arms.findIndex(matchesEmpty);
  if (empty >= 0) throw new Error(`token forms: arm ${empty} of '${kind}' matches the empty string`);
  const seen = /* @__PURE__ */ new Map();
  arms.forEach((arm2, i) => {
    const key = canonicalRuleText(arm2);
    const prior = seen.get(key);
    if (prior !== void 0) throw new Error(`token forms: arms ${prior} and ${i} of '${kind}' are identical`);
    seen.set(key, i);
  });
  let out = {
    type: "CHOICE",
    members: arms.map((arm2) => ({ ...core, content: arm2 }))
  };
  for (let i = precStack.length - 1; i >= 0; i--) out = { ...precStack[i], content: out };
  return out;
}

// packages/codegen/src/dsl/automatic-variants.ts
var ENRICH_AUTOMATIC_VARIANTS_KEY = "__enrichedAutomaticVariants__";
var SLOT_BOUNDARIES = /* @__PURE__ */ new Set(["FIELD", "TOKEN", "IMMEDIATE_TOKEN", "ALIAS", "PATTERN", "STRING", "SYMBOL"]);
function coreOf(arm2) {
  return unwrapPrec(arm2);
}
function armDisplayOf(arm2) {
  const core = coreOf(arm2);
  if (core.type === "SYMBOL" && typeof core.name === "string") return undisplayedKindAddress(core.name);
  if (core.type === "ALIAS" && core.named === true && typeof core.value === "string" && core.content?.type === "SYMBOL") return core.value;
  return void 0;
}
function isDisplayedLiteral(arm2) {
  return arm2.type === "ALIAS" && arm2.named === true && arm2.content?.type === "STRING";
}
function annotationsOf(arm2) {
  return arm2.type === "ALIAS" ? arm2.content?.annotations : arm2.annotations;
}
function refOf(arm2) {
  if (arm2.type === "ALIAS") return `${String(arm2.value)}\0${arm2.content?.name ?? ""}`;
  if (arm2.type === "SYMBOL") return String(arm2.name);
  return JSON.stringify(arm2.value);
}
function automaticVariantKey(arm2) {
  const shape = arm2;
  const annotations = annotationsOf(shape);
  if (annotations?.variantOf === void 0) return void 0;
  return `${annotations.variantOf}\0${annotations.variant ?? ""}\0${refOf(shape)}`;
}
function labelOf(owner, display, ownerIsSupertype) {
  return display === void 0 ? { variantOf: owner } : { variant: armNameOf(owner, display, ownerIsSupertype), variantOf: owner };
}
function withAutomaticLabel(core, label, automatic) {
  const out = withAnnotations(core, label);
  automatic.keys.add(automaticVariantKey(out));
  return out;
}
function holdsChoice(node) {
  if (node === void 0) return false;
  if (node.type === "CHOICE") return (node.members ?? []).filter((m) => !isBlank(m)).length >= 2 || (node.members ?? []).some(holdsChoice);
  if (node.type !== void 0 && SLOT_BOUNDARIES.has(node.type)) return false;
  return (node.members ?? []).some(holdsChoice) || node.content !== void 0 && holdsChoice(node.content);
}
function isHoistedChoiceGroup(rule2) {
  return rule2?.annotations?.hoisted === true && holdsChoice(rule2);
}
function isSupertypeOwner(owner, rules, supertypeNames, inlineNames) {
  if (supertypeNames.has(owner)) return true;
  if (!isParserHiddenName(owner) || inlineNames.has(owner)) return false;
  const rule2 = rules[owner];
  return hiddenChoiceClass(rule2, (name) => rules[name], isNamedArmChoice(rule2)) === "supertype";
}
function stampRuleVariants(owner, rule2, ruleOf, automatic) {
  const ownerIsSupertype = automatic.supertypeOwners.has(owner);
  const label = (core) => withAutomaticLabel(core, labelOf(owner, armDisplayOf(core), ownerIsSupertype), automatic);
  const stamp = (member) => {
    const core = coreOf(member);
    if (annotationsOf(core)?.variantOf !== void 0 || isDisplayedLiteral(core)) return member;
    return core.type === "CHOICE" ? visit(member) : throughPrec(member, label);
  };
  const visit = (node) => {
    if (node.type === "CHOICE" && node.members !== void 0) {
      const choosable = node.members.filter((m) => !isBlank(m)).length >= 2;
      const members = node.members.map((member) => choosable && !isBlank(member) ? stamp(member) : visit(member));
      return members.some((m, i) => m !== node.members[i]) ? { ...node, members } : node;
    }
    if (node.type === "SYMBOL" && typeof node.name === "string" && annotationsOf(node)?.variantOf === void 0) {
      return isHoistedChoiceGroup(ruleOf(node.name)) ? label(node) : node;
    }
    if (node.type !== void 0 && SLOT_BOUNDARIES.has(node.type)) return node;
    if (node.members !== void 0) {
      const members = node.members.map(visit);
      return members.some((m, i) => m !== node.members[i]) ? { ...node, members } : node;
    }
    if (node.content !== void 0 && typeof node.content === "object") {
      const content = visit(node.content);
      return content === node.content ? node : { ...node, content };
    }
    return node;
  };
  return visit(rule2);
}
function stampAutomaticVariants(rules, supertypeNames, inlineNames) {
  const supertypeOwners = new Set(Object.keys(rules).filter((owner) => isSupertypeOwner(owner, rules, supertypeNames, inlineNames)));
  const automatic = { keys: /* @__PURE__ */ new Set(), supertypeOwners };
  for (const owner of Object.keys(rules)) {
    const rule2 = rules[owner];
    if (rule2 === void 0) continue;
    rules[owner] = stampRuleVariants(owner, rule2, (name) => rules[name], automatic);
  }
  return automatic;
}
function isAutomaticVariants(value) {
  const record = value;
  return record?.keys instanceof Set && record.supertypeOwners instanceof Set;
}
function getEnrichAutomaticVariants(grammar) {
  if (!grammar || typeof grammar !== "object" || !(ENRICH_AUTOMATIC_VARIANTS_KEY in grammar)) return void 0;
  const value = grammar[ENRICH_AUTOMATIC_VARIANTS_KEY];
  if (!isAutomaticVariants(value)) throw new Error("enrich: the automatic-variant sidecar is malformed; expected { keys: Set, supertypeOwners: Set }");
  return value;
}
function seedAutomaticVariants(grammar) {
  const enriched = getEnrichAutomaticVariants(grammar);
  return enriched === void 0 ? { keys: /* @__PURE__ */ new Set(), supertypeOwners: /* @__PURE__ */ new Set() } : { keys: new Set(enriched.keys), supertypeOwners: enriched.supertypeOwners };
}
function withoutAutomaticVariants(rule2, automatic) {
  if (automatic.keys.size === 0) return rule2;
  const strip = (node) => {
    const key = automaticVariantKey(node);
    const own = key !== void 0 && automatic.keys.has(key) ? withoutLabel(node) : node;
    if (own.type !== void 0 && SLOT_BOUNDARIES.has(own.type)) return own;
    if (own.members !== void 0) {
      const members = own.members.map(strip);
      return members.some((m, i) => m !== own.members[i]) ? { ...own, members } : own;
    }
    if (own.content !== void 0 && typeof own.content === "object") {
      const content = strip(own.content);
      return content === own.content ? own : { ...own, content };
    }
    return own;
  };
  return strip(rule2);
}
function withoutLabel(rule2) {
  const arm2 = rule2;
  const drop = (annotations) => {
    if (annotations === void 0) return void 0;
    const { variant: _variant, variantOf: _variantOf, ...rest } = annotations;
    return Object.keys(rest).length === 0 ? void 0 : rest;
  };
  const rebuild = (node) => {
    const annotations = drop(node.annotations);
    const { annotations: _annotations, ...bare } = node;
    return annotations === void 0 ? bare : { ...bare, annotations };
  };
  return arm2.type === "ALIAS" && arm2.content !== void 0 ? { ...arm2, content: rebuild(arm2.content) } : rebuild(arm2);
}
function withAuthoredLabel(site, label, automatic) {
  const out = withAnnotations(site, label);
  const key = automaticVariantKey(out);
  if (key !== void 0) automatic.keys.delete(key);
  return out;
}
function relabelledArm(site, original, automatic) {
  const core = coreOf(original);
  const annotations = annotationsOf(core);
  const owner = annotations?.variantOf;
  if (owner === void 0) return site;
  const key = automaticVariantKey(core);
  if (key === void 0 || !automatic.keys.has(key)) {
    const { variant: variant2, default: isDefault } = annotations;
    return withAuthoredLabel(site, { variantOf: owner, ...variant2 === void 0 ? {} : { variant: variant2 }, ...isDefault === true ? { default: true } : {} }, automatic);
  }
  const ownerIsSupertype = automatic.supertypeOwners.has(owner);
  return throughPrec(site, (siteCore) => withAutomaticLabel(siteCore, labelOf(owner, armDisplayOf(siteCore), ownerIsSupertype), automatic));
}

// packages/codegen/src/dsl/enrich.ts
function withContent(node, content) {
  return { ...node, content };
}
function enrich(baseInput, authored = {}) {
  const base2 = baseInput;
  if (!base2 || typeof base2 !== "object") {
    throw new Error("enrich(): expected a grammar object, got " + typeof base2);
  }
  const hasWrapper = "grammar" in base2;
  const baseRules = baseRulesOf(base2);
  if (!baseRules) return base2;
  const rulesBag = { ...baseRules };
  const grammarMeta = hasWrapper ? base2.grammar : base2;
  const supertypeNames = extractGrammarSymbolNames(base2, hasWrapper, "supertypes");
  const inlineNames = extractGrammarSymbolNames(base2, hasWrapper, "inline");
  const ctx = EnrichCtx.create({
    rulesBag,
    supertypeNames,
    externals: extractGrammarRuleList(base2, hasWrapper, "externals"),
    inline: inlineNames,
    extras: effectiveExtras(base2, hasWrapper, authored.extras),
    word: extractWordName(grammarMeta?.word),
    wordMatcher: compileWordMatcher(extractWordName(grammarMeta?.word), rulesBag),
    authoredGroupBodies: authored.groupBodies ?? []
  });
  const { kwRules, clauseGroupRules, visibleGroupSources, clauseGroupOwners } = ctx;
  const enrichedRules = {};
  for (const name of Object.keys(rulesBag)) {
    const rule2 = rulesBag[name];
    enrichedRules[name] = rule2 ? applyFieldWrapPasses(name, rule2, ctx) : rule2;
  }
  for (const name of Object.keys(enrichedRules)) {
    const rule2 = enrichedRules[name];
    if (!rule2) continue;
    if (!isSeqType(rule2.type)) continue;
    const info = separatedListBodyInfo(rule2, ctx.sourceSymbols);
    if (!info?.flankCarrying || info.form !== "head") continue;
    const members = rule2.members;
    if (info.flatMembers === members) continue;
    enrichedRules[name] = { ...rule2, members: info.flatMembers };
  }
  Object.assign(enrichedRules, mintInlineLiteralAliasStorage(enrichedRules));
  Object.assign(enrichedRules, liftAliasedHiddenRuleBodies(enrichedRules));
  for (const name of Object.keys(enrichedRules)) {
    const rule2 = enrichedRules[name];
    if (!rule2) continue;
    enrichedRules[name] = distributeInlineAliasChoices(rule2, {
      inlineBodyOf: (target) => inlineNames.has(target) ? enrichedRules[target] ?? rulesBag[target] : void 0
    });
  }
  const enrichedSymbols = enrichSymbolSource(ctx, { ...enrichedRules, ...ctx.kwRules, ...ctx.clauseGroupRules });
  Object.assign(enrichedRules, unaliasOverloadedDisplays(enrichedRules, { symbols: enrichedSymbols }));
  for (const name of Object.keys(enrichedRules)) {
    const rule2 = enrichedRules[name];
    if (!rule2) continue;
    enrichedRules[name] = distributeExclusiveFieldChoices(rule2, enrichedRules);
  }
  const wordName = extractWordName(grammarMeta?.word);
  const unhoistableNames = /* @__PURE__ */ new Set([...ruleListParts(ctx.externals).names, ...wordName === null ? [] : [wordName]]);
  for (const name of Object.keys(enrichedRules)) {
    const rule2 = enrichedRules[name];
    if (!rule2) continue;
    const factored = factorSharedOptional(rule2);
    if (factored !== rule2) enrichedRules[name] = factored;
  }
  const tokenFormParents = [];
  for (const name of Object.keys(enrichedRules)) {
    const rule2 = enrichedRules[name];
    if (!rule2) continue;
    const counter = { opt: 0, grp: 0, arm: 0, supertypeNames };
    const hoisted = hoistTokenForms(name, rule2, ctx, counter, unhoistableNames, tokenFormParents, authored.fieldSites?.get(name) ?? []);
    if (hoisted !== rule2) enrichedRules[name] = hoisted;
  }
  const hoistCtx = ctx.withHoist({
    separatedListNameCounts: collectSeparatedListNameProposals(enrichedRules, ctx.sourceSymbols),
    hiddenListPromotionNames: /* @__PURE__ */ new Map()
  });
  for (const name of Object.keys(enrichedRules)) {
    const rule2 = enrichedRules[name];
    if (!rule2) continue;
    enrichedRules[name] = applyClauseHoist(name, rule2, hoistCtx, { opt: 0, grp: 0, arm: 0, supertypeNames });
  }
  for (const groupName of Object.keys(clauseGroupRules)) {
    const groupBody = clauseGroupRules[groupName];
    if (groupBody && !tokenFormParents.includes(groupName)) clauseGroupRules[groupName] = withHoistedAnnotation(groupBody);
  }
  const mergedRules = { ...enrichedRules, ...kwRules, ...clauseGroupRules };
  collapseSingletonMintOrdinals(mergedRules, clauseGroupRules, visibleGroupSources, clauseGroupOwners);
  for (const parent of tokenFormParents) annotateTokenFormArms(parent, mergedRules, isSupertypeOwner(parent, mergedRules, supertypeNames, inlineNames));
  for (const name of Object.keys(mergedRules)) {
    const rule2 = mergedRules[name];
    if (rule2) mergedRules[name] = applyNodeChoiceFieldWrap(name, rule2, mergedRules, ctx);
  }
  synthesizeFieldEnumRules(mergedRules);
  const automaticVariants = stampAutomaticVariants(mergedRules, supertypeNames, inlineNames);
  const whitespace = enrichWhitespace(ctx.externals, ctx.extras, mergedRules);
  for (const { name } of whitespace.collisions) delete mergedRules[name];
  mergedRules[WHITESPACE_SUPERTYPE] = whitespace.rule;
  const clauseGroupNames = new Set(Object.keys(clauseGroupRules).filter((n) => !visibleGroupSources.has(n)));
  const result = hasWrapper ? { ...base2, grammar: { ...base2.grammar, rules: mergedRules } } : { ...base2, rules: mergedRules };
  const resultGrammar = hasWrapper ? result.grammar : result;
  appendGrammarNames(resultGrammar, "supertypes", [...tokenFormParents, WHITESPACE_SUPERTYPE], (name) => name);
  appendGrammarNames(resultGrammar, "externals", whitespace.addedExternals, (name) => ({ type: SYMBOL, name }));
  replaceExtras(resultGrammar, tokenFormArms(mergedRules, tokenFormParents));
  Object.defineProperty(result, ENRICH_WHITESPACE_KEY, {
    value: { bodies: whitespace.bodies, collisions: whitespace.collisions },
    enumerable: false,
    writable: false,
    configurable: true
  });
  if (clauseGroupNames.size > 0) {
    Object.defineProperty(result, ENRICH_CLAUSE_GROUPS_KEY, {
      value: clauseGroupNames,
      enumerable: false,
      writable: false,
      configurable: true
    });
  }
  if (clauseGroupOwners.size > 0) {
    Object.defineProperty(result, ENRICH_CLAUSE_GROUP_OWNERS_KEY, {
      value: clauseGroupOwners,
      enumerable: false,
      writable: false,
      configurable: true
    });
  }
  Object.defineProperty(result, ENRICH_AUTOMATIC_VARIANTS_KEY, {
    value: automaticVariants,
    enumerable: false,
    writable: false,
    configurable: true
  });
  if (visibleGroupSources.size > 0) {
    Object.defineProperty(result, ENRICH_VISIBLE_GROUP_SOURCES_KEY, {
      value: visibleGroupSources,
      enumerable: false,
      writable: false,
      configurable: true
    });
  }
  return result;
}
var ENRICH_CLAUSE_GROUPS_KEY = "__enrichedClauseGroups__";
var ENRICH_WHITESPACE_KEY = "__enrichedWhitespace__";
function getEnrichWhitespace(grammar) {
  return grammar?.[ENRICH_WHITESPACE_KEY] ?? { bodies: {}, collisions: [] };
}
function getEnrichClauseGroups(grammar) {
  if (!grammar || typeof grammar !== "object") return /* @__PURE__ */ new Set();
  const names = grammar[ENRICH_CLAUSE_GROUPS_KEY];
  if (names instanceof Set) return names;
  return /* @__PURE__ */ new Set();
}
var ENRICH_CLAUSE_GROUP_OWNERS_KEY = "__enrichedClauseGroupOwners__";
function getEnrichClauseGroupOwners(grammar) {
  if (!grammar || typeof grammar !== "object") return /* @__PURE__ */ new Map();
  const owners = grammar[ENRICH_CLAUSE_GROUP_OWNERS_KEY];
  if (owners instanceof Map) return owners;
  return /* @__PURE__ */ new Map();
}
var ENRICH_VISIBLE_GROUP_SOURCES_KEY = "__enrichedVisibleGroupSources__";
function getEnrichVisibleGroupSources(grammar) {
  if (!grammar || typeof grammar !== "object") return /* @__PURE__ */ new Set();
  const names = grammar[ENRICH_VISIBLE_GROUP_SOURCES_KEY];
  if (names instanceof Set) return names;
  return /* @__PURE__ */ new Set();
}
function applyFieldWrapPasses(ruleName, rule2, ctx) {
  const MAX_ITERATIONS = 8;
  let r = rule2;
  let converged = false;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const before = r;
    r = applySymbolToField(ruleName, r, ctx);
    r = applyChoiceArmFieldWrap(ruleName, r, ctx);
    r = applyRepeatUnionFieldPromotion(ruleName, r, ctx);
    r = applyOptionalKeyword(ruleName, r, ctx);
    if (r === before) {
      converged = true;
      break;
    }
  }
  if (!converged && !process.env.SITTIR_QUIET) {
    process.stderr.write(`enrich: fixed-point did not converge for '${ruleName}' after ${MAX_ITERATIONS} iterations
`);
  }
  return r;
}
function hoistTokenForms(parentKind, rule2, ctx, counter, unhoistableNames, parents, fielded) {
  if (unhoistableNames.has(parentKind)) return rule2;
  const distributed = distributeTokenForms(rule2, parentKind, fielded);
  if (distributed === rule2) return rule2;
  parents.push(parentKind);
  const precStack = [];
  let core = distributed;
  while (isPrecWrapper(core)) {
    precStack.push(core);
    core = core.content;
  }
  const arms = core.members;
  const members = arms.map((arm2, i) => {
    const minted = visibleGroupSynthName(
      withAnnotations(arm2, { tokenForm: true }),
      parentKind,
      ctx,
      counter,
      void 0,
      void 0,
      "arm"
    );
    if (minted === null) throw new Error(`token forms: '${parentKind}' could not mint form ${i}`);
    ctx.visibleGroupSources.add(minted);
    if (!ctx.clauseGroupOwners.has(minted)) ctx.clauseGroupOwners.set(minted, parentKind);
    const armBody = ctx.clauseGroupRules[minted];
    const armFielded = fielded.flatMap((site) => site[0] === i ? [site.slice(1)] : []);
    const nested = hoistTokenForms(minted, armBody, ctx, { ...counter, opt: 0, grp: 0, arm: 0 }, unhoistableNames, parents, armFielded);
    if (nested !== armBody) ctx.clauseGroupRules[minted] = withAnnotations(nested, { tokenForm: true });
    return makeGroupLiftSymbol(arm2, minted);
  });
  let out = { ...core, members };
  for (let i = precStack.length - 1; i >= 0; i--) out = { ...precStack[i], content: out };
  return out;
}
function tokenFormArms(rules, parents) {
  const arms = /* @__PURE__ */ new Map();
  for (const parent of parents) {
    let core = rules[parent];
    while (core !== void 0 && isPrecWrapper(core)) core = core.content;
    const members = core?.members ?? [];
    arms.set(parent, members.flatMap((m) => m.name === void 0 ? [] : [m.name]));
  }
  return arms;
}
function replaceExtras(result, replacements) {
  if (replacements.size === 0) return;
  const current = result.extras;
  const replaced = (entries, dollar) => entries.flatMap((entry) => {
    const isSymbol = entry?.type === "SYMBOL";
    const named = typeof entry === "string" ? entry : isSymbol ? entry.name : void 0;
    const arms = named === void 0 ? void 0 : replacements.get(named);
    if (arms === void 0) return [entry];
    return arms.map((arm2) => typeof entry === "string" ? arm2 : dollar === void 0 ? { type: "SYMBOL", name: arm2 } : dollar[arm2]);
  });
  if (typeof current === "function") {
    const fn = current;
    result.extras = (dollar, previous) => replaced(fn(dollar, previous), dollar);
    return;
  }
  if (Array.isArray(current)) result.extras = replaced(current, void 0);
}
function annotateTokenFormArms(parent, rules, parentIsSupertype) {
  const rule2 = rules[parent];
  if (rule2 === void 0) return;
  rules[parent] = throughPrec(rule2, (core) => {
    if (!("members" in core)) return core;
    const members = core.members;
    const preferred = defaultTokenFormArm(members, rules);
    const annotated = members.map((member, i) => {
      const variant2 = armNameOf(parent, undisplayedKindAddress(member.name ?? ""), parentIsSupertype);
      return withAnnotations(member, { variant: variant2, variantOf: parent, ...i === preferred ? { default: true } : {} });
    });
    return { ...core, members: annotated };
  });
}
function defaultTokenFormArm(members, rules) {
  const measure = (rule2) => {
    if (rule2 === void 0) return { leaves: 0, patterns: 0, enums: 0 };
    const t = rule2.type ?? "";
    if (t === "PATTERN") return { leaves: 1, patterns: 1, enums: 0 };
    if (t === "STRING") return { leaves: 1, patterns: 0, enums: 0 };
    const kids = rule2.members ?? [rule2.content];
    const own = t === "CHOICE" && kids.every((kid) => kid?.type === "STRING") ? 1 : 0;
    return kids.reduce(
      (acc, kid) => {
        const m = measure(kid);
        return { leaves: acc.leaves + m.leaves, patterns: acc.patterns + m.patterns, enums: acc.enums + m.enums };
      },
      { leaves: 0, patterns: 0, enums: own }
    );
  };
  let best = -1;
  let bestScore = [Infinity, Infinity];
  members.forEach((member, i) => {
    const m = measure(rules[member.name ?? ""]);
    if (m.patterns === 0) return;
    if (m.enums < bestScore[0] || m.enums === bestScore[0] && m.leaves < bestScore[1]) {
      best = i;
      bestScore = [m.enums, m.leaves];
    }
  });
  return best < 0 ? 0 : best;
}
function appendGrammarNames(result, key, names, entryOf) {
  if (names.length === 0) return;
  const current = result[key];
  if (typeof current === "function") {
    const fn = current;
    result[key] = (dollar, previous) => {
      const base3 = fn(dollar, previous);
      const listed2 = harvestSupertypeNames(base3);
      return [...base3, ...names.filter((n) => !listed2.has(n)).map((n) => dollar[n])];
    };
    return;
  }
  const base2 = Array.isArray(current) ? current : [];
  const listed = harvestSupertypeNames(base2);
  result[key] = [...base2, ...names.filter((n) => !listed.has(n)).map(entryOf)];
}
function grammarListOf(base2, hasWrapper, key) {
  const root = hasWrapper ? base2.grammar : base2;
  const list = root?.[key];
  if (Array.isArray(list)) return list;
  if (typeof list !== "function") return [];
  const result = list(symbolDollar());
  return Array.isArray(result) ? result : [];
}
function symbolDollar() {
  return new Proxy(
    {},
    {
      get(_t, prop) {
        return typeof prop === "string" ? { type: "SYMBOL", name: prop } : void 0;
      }
    }
  );
}
function effectiveExtras(base2, hasWrapper, authored) {
  const upstream = extractGrammarRuleList(base2, hasWrapper, "extras");
  if (authored === void 0) return upstream;
  const result = authored(symbolDollar(), upstream);
  return ruleListEntries(Array.isArray(result) ? result : [], "extras");
}
function extractGrammarSymbolNames(base2, hasWrapper, key) {
  return harvestSupertypeNames(grammarListOf(base2, hasWrapper, key));
}
function extractGrammarRuleList(base2, hasWrapper, key) {
  return ruleListEntries(grammarListOf(base2, hasWrapper, key), key);
}
function ruleListEntries(values, key) {
  return values.map((value) => {
    const entry = ruleListEntryOf(value);
    if (entry === void 0) throw new Error(`enrich: an entry of ${key} is not a SYMBOL, STRING or PATTERN rule`);
    return entry;
  });
}
function isAnonymousLiteralShapedRule(name, rulesBag, seen) {
  if (seen.has(name)) return false;
  seen.add(name);
  const rule2 = rulesBag[name];
  if (!rule2) return true;
  return isAnonymousLiteralShapedContent(rule2, rulesBag, seen);
}
function isAnonymousLiteralShapedContent(rule2, rulesBag, seen) {
  if (isStringType(rule2.type) || rule2.type === "PATTERN") return true;
  if (isChoiceType(rule2.type)) {
    const members = rule2.members;
    return members.every((m) => isAnonymousLiteralShapedContent(m, rulesBag, seen));
  }
  if (isSymbolType(rule2.type) && typeof rule2.name === "string") {
    return isAnonymousLiteralShapedRule(rule2.name, rulesBag, seen);
  }
  return false;
}
function applyChoiceArmFieldWrap(ruleName, rule2, ctx) {
  const { supertypeNames, rulesBag } = ctx;
  if (ruleName.startsWith("_")) return rule2;
  let cursor = rule2;
  const precStack = [];
  while (isPrecWrapper(cursor)) {
    precStack.push(cursor);
    cursor = cursor.content;
  }
  if (!isChoiceType(cursor.type)) return rule2;
  const armMembers = cursor.members;
  let anyArmChanged = false;
  const newArms = armMembers.map((arm2) => {
    let armCursor = arm2;
    const armPrecStack = [];
    while (isPrecWrapper(armCursor)) {
      armPrecStack.push(armCursor);
      armCursor = armCursor.content;
    }
    if (!isSeqType(armCursor.type)) return arm2;
    const seqMembers = armCursor.members;
    const existing = collectFieldNamesRuntime(armCursor);
    let armChanged = false;
    const newSeqMembers = seqMembers.map((m, i) => {
      if (separatedListTail(seqMembers, i, ctx.sourceSymbols)) return m;
      const t = detectSymbolTarget(m);
      if (!t) return m;
      if (!isBareShapeTarget(m, t)) return m;
      let fieldName = t.name;
      if (t.name.startsWith("_")) {
        const eligible = supertypeNames.has(t.name) || isAnonymousLiteralShapedRule(t.name, rulesBag, /* @__PURE__ */ new Set());
        if (!eligible) return m;
        fieldName = t.name.slice(1);
      }
      if (existing.has(fieldName)) {
        reportSkip("choice-arm-field", ruleName, `field '${fieldName}' already exists`);
        return m;
      }
      existing.add(fieldName);
      armChanged = true;
      const fieldNode = makeField(fieldName, t.symbolRule);
      return t.wrap(fieldNode);
    });
    if (!armChanged) return arm2;
    anyArmChanged = true;
    let rebuiltArm = { ...armCursor, members: newSeqMembers };
    for (let i = armPrecStack.length - 1; i >= 0; i--) {
      rebuiltArm = withContent(armPrecStack[i], rebuiltArm);
    }
    return rebuiltArm;
  });
  if (!anyArmChanged) return rule2;
  let result = { ...cursor, members: newArms };
  for (let i = precStack.length - 1; i >= 0; i--) {
    result = withContent(precStack[i], result);
  }
  return result;
}
var syntacticWalker = new SyntacticRuleWalker();
function collectAllFieldNamesDeep(rule2, into) {
  syntacticWalker.fold(rule2, into, (names, r) => {
    const name = r.name;
    if (isFieldType(r.type) && typeof name === "string") names.add(name);
    return names;
  });
}
function isAllArmsNodeShaped(choiceRule) {
  const members = choiceRule.members;
  return members.every((arm2) => {
    let cursor = arm2;
    while (isPrecWrapper(cursor)) {
      cursor = cursor.content;
    }
    const t = cursor.type;
    return t === "SYMBOL" || t === "ALIAS";
  });
}
function isAllArmsNodeOrLiteralShaped(choiceRule) {
  const members = choiceRule.members;
  return members.every((arm2) => {
    let cursor = arm2;
    while (isPrecWrapper(cursor)) {
      cursor = cursor.content;
    }
    const t = cursor.type;
    return t === "SYMBOL" || t === "ALIAS" || isStringType(t) || t === "PATTERN";
  });
}
var LITERAL_ARM_NAMES = {
  ";": "semi"
};
function literalArmNameHint(text) {
  return LITERAL_ARM_NAMES[text] ?? text.replace(/[^\w]+/g, "");
}
function promoteLiteralChoiceArms(choiceRule, mergedRules) {
  const members = choiceRule.members;
  let changed = false;
  let declined = false;
  const newMembers = members.map((arm2) => {
    let cursor = arm2;
    const precStack = [];
    while (isPrecWrapper(cursor)) {
      precStack.push(cursor);
      cursor = cursor.content;
    }
    const t = cursor.type;
    if (!isStringType(t) && t !== "PATTERN") return arm2;
    const text = cursor.value;
    const nameHint = literalArmNameHint(text);
    const symbol = nameHint ? registerKwRule(cursor, nameHint, mergedRules, mergedRules) : null;
    if (!symbol) {
      declined = true;
      return arm2;
    }
    changed = true;
    let rebuilt2 = symbol;
    for (let i = precStack.length - 1; i >= 0; i--) {
      rebuilt2 = withContent(precStack[i], rebuilt2);
    }
    return rebuilt2;
  });
  if (!changed || declined) return null;
  return { ...choiceRule, members: newMembers };
}
function pluralizeFieldName(name) {
  if (name.endsWith("s")) return name;
  if (name.endsWith("y") && !/[aeiou]y$/.test(name)) return name.slice(0, -1) + "ies";
  return name + "s";
}
function isHiddenPureUnionRule(name, mergedRules) {
  if (!name.startsWith("_")) return false;
  const target = mergedRules[name];
  if (!target) return false;
  let core = target;
  while (isPrecWrapper(core)) {
    core = core.content;
  }
  return isChoiceType(core.type) && isAllArmsNodeShaped(core);
}
function isEligibleFieldReferent(name, mergedRules, supertypeNames) {
  return supertypeNames.has(name) || isHiddenPureUnionRule(name, mergedRules);
}
function sameElementShape(a, b) {
  return ruleKey(a) === ruleKey(b);
}
function hasFieldedArm(rule2) {
  const cursor = peelTransparentElementWrappers(rule2);
  const members = cursor.members;
  return isArmChoice(cursor) && Array.isArray(members) && members.some((m) => isFieldType(m.type));
}
function peelTransparentElementWrappers(rule2) {
  if (isPrecWrapper(rule2)) {
    return peelTransparentElementWrappers(rule2.content);
  }
  const members = rule2.members;
  if (isChoiceType(rule2.type) && members?.length === 1) {
    return peelTransparentElementWrappers(members[0]);
  }
  return rule2;
}
function deriveElementFieldName(elementRule) {
  const cursor = peelTransparentElementWrappers(elementRule);
  const t = cursor.type;
  if (t === "SYMBOL") {
    return cursor.name.replace(/^_/, "");
  }
  if (t === "ALIAS") {
    const value = cursor.value;
    if (typeof value === "string") return value;
  }
  return "element";
}
function separatedListTail(members, i, symbols) {
  const leading = members[i];
  let repeatCursor = members[i + 1];
  if (leading === void 0 || repeatCursor === void 0) return null;
  const outerPrecStack = [];
  while (isPrecWrapper(repeatCursor)) {
    outerPrecStack.push(repeatCursor);
    repeatCursor = repeatCursor.content;
  }
  if (!isRepeatType(repeatCursor.type)) return null;
  let inner = repeatCursor.content;
  const innerPrecStack = [];
  while (isPrecWrapper(inner)) {
    innerPrecStack.push(inner);
    inner = inner.content;
  }
  const detected = separatorOf(inner, symbols);
  if (!detected || detected.trailing) return null;
  const innerElement = detected.content;
  if (!sameElementShape(leading, innerElement)) return null;
  if (hasFieldedArm(leading)) return null;
  if (matchesEmpty(leading)) return null;
  return { repeatCursor, inner, innerElement, outerPrecStack, innerPrecStack };
}
function fieldSeparatedListElements(seqRule, reserve, symbols) {
  const members = seqRule.members;
  if (!Array.isArray(members)) return null;
  for (let i = 0; i < members.length - 1; i++) {
    const leading = members[i];
    if (isFieldType(leading.type)) continue;
    const tail = separatedListTail(members, i, symbols);
    if (!tail) continue;
    const { repeatCursor, inner, innerElement, outerPrecStack, innerPrecStack } = tail;
    const fieldName = reserve(deriveElementFieldName(leading));
    const innerMembers = inner.members;
    const newInnerMembers = innerMembers.slice();
    const elementIdx = innerMembers.indexOf(innerElement);
    newInnerMembers[elementIdx] = makeField(fieldName, innerElement);
    let rebuiltInner = { ...inner, members: newInnerMembers };
    for (let j = innerPrecStack.length - 1; j >= 0; j--) {
      rebuiltInner = withContent(innerPrecStack[j], rebuiltInner);
    }
    let rebuiltRepeat = withContent(repeatCursor, rebuiltInner);
    for (let j = outerPrecStack.length - 1; j >= 0; j--) {
      rebuiltRepeat = withContent(outerPrecStack[j], rebuiltRepeat);
    }
    const newMembers = members.slice();
    newMembers[i] = makeField(fieldName, leading);
    newMembers[i + 1] = rebuiltRepeat;
    return { ...seqRule, members: newMembers };
  }
  return null;
}
function applyNodeChoiceFieldWrap(ruleName, rule2, mergedRules, ctx) {
  const { supertypeNames } = ctx;
  let changed = false;
  const namesDeepIn = (r) => {
    const names = /* @__PURE__ */ new Set();
    collectAllFieldNamesDeep(r, names);
    return names;
  };
  const reserve = (base2, scope) => {
    if (!scope.has(base2)) {
      scope.add(base2);
      return base2;
    }
    let n = 2;
    while (scope.has(`${base2}_${n}`)) n++;
    const name = `${base2}_${n}`;
    scope.add(name);
    return name;
  };
  const refCounts = /* @__PURE__ */ new Map();
  const countEligibleRefs = (r) => {
    if (isFieldType(r.type) || isLexedBoundary(r)) return;
    if (isSymbolType(r.type)) {
      const name = r.name;
      if (isEligibleFieldReferent(name, mergedRules, supertypeNames)) {
        refCounts.set(name, (refCounts.get(name) ?? 0) + 1);
      }
      return;
    }
    const bag = r;
    if (Array.isArray(bag.members)) {
      for (const m of bag.members) countEligibleRefs(m);
    } else if (bag.content && typeof bag.content === "object") {
      countEligibleRefs(bag.content);
    }
  };
  countEligibleRefs(rule2);
  const visit = (r, suppressed, scope) => {
    if (isFieldType(r.type) || isLexedBoundary(r)) return r;
    if (!suppressed && isRepeatType(r.type)) {
      const content = r.content;
      const precStack = [];
      let inner = content;
      while (isPrecWrapper(inner)) {
        precStack.push(inner);
        inner = inner.content;
      }
      const rebuildRepeat = (newInner) => {
        let rebuiltInner = newInner;
        for (let i = precStack.length - 1; i >= 0; i--) {
          rebuiltInner = withContent(precStack[i], rebuiltInner);
        }
        return withContent(r, rebuiltInner);
      };
      if (isSymbolType(inner.type)) {
        const refName = inner.name;
        if (isEligibleFieldReferent(refName, mergedRules, supertypeNames) && refCounts.get(refName) === 1) {
          changed = true;
          const fieldName = pluralizeFieldName(refName.replace(/^_/, ""));
          return makeField(reserve(fieldName, scope), rebuildRepeat(inner));
        }
      }
      let visitedInner = visit(inner, true, scope);
      if (isChoiceType(visitedInner.type) && !isAllArmsNodeShaped(visitedInner) && isAllArmsNodeOrLiteralShaped(visitedInner)) {
        const promoted = promoteLiteralChoiceArms(visitedInner, mergedRules);
        if (promoted) visitedInner = promoted;
      }
      if (isChoiceType(visitedInner.type) && isAllArmsNodeShaped(visitedInner)) {
        changed = true;
        return makeField(reserve("elements", scope), rebuildRepeat(visitedInner));
      }
      if (visitedInner === inner) return r;
      return rebuildRepeat(visitedInner);
    }
    if (isSeqType(r.type)) {
      const sepListRewrite = fieldSeparatedListElements(r, (base2) => reserve(base2, scope), ctx.sourceSymbols);
      if (sepListRewrite) {
        changed = true;
        r = sepListRewrite;
      }
    }
    const bag = r;
    if (Array.isArray(bag.members)) {
      const isChoice = isChoiceType(r.type);
      let memberChanged = false;
      if (!isChoice) {
        const newMembers2 = bag.members.map((m) => {
          const nm = visit(m, false, scope);
          if (nm !== m) memberChanged = true;
          return nm;
        });
        return memberChanged ? { ...r, members: newMembers2 } : r;
      }
      const insideChoice = namesDeepIn(r);
      const outside = new Set([...scope].filter((n) => !insideChoice.has(n)));
      const minted = /* @__PURE__ */ new Set();
      const newMembers = bag.members.map((m) => {
        const armScope = /* @__PURE__ */ new Set([...outside, ...namesDeepIn(m)]);
        const before = new Set(armScope);
        const nm = visit(m, true, armScope);
        if (nm !== m) memberChanged = true;
        for (const n of armScope) if (!before.has(n)) minted.add(n);
        return nm;
      });
      for (const n of minted) scope.add(n);
      return memberChanged ? { ...r, members: newMembers } : r;
    }
    if (bag.content && typeof bag.content === "object") {
      const nc = visit(bag.content, suppressed, scope);
      return nc !== bag.content ? withContent(r, nc) : r;
    }
    return r;
  };
  const result = visit(rule2, false, namesDeepIn(rule2));
  return changed ? result : rule2;
}
function extractWordName(word) {
  if (typeof word === "string") return word;
  if (typeof word !== "function") return null;
  const dollar = new Proxy(
    {},
    {
      get(_t, prop) {
        if (typeof prop === "string") return { type: "SYMBOL", name: prop };
        return void 0;
      }
    }
  );
  try {
    const result = word(dollar);
    const name = result?.name;
    return typeof name === "string" ? name : null;
  } catch {
    return null;
  }
}
function harvestSupertypeNames(result) {
  const names = /* @__PURE__ */ new Set();
  if (!Array.isArray(result)) return names;
  for (const r of result) {
    if (typeof r === "string") {
      names.add(r);
      continue;
    }
    const n = r?.name;
    if (typeof n === "string") names.add(n);
  }
  return names;
}
function nativeRuleFn(...names) {
  const g = globalThis;
  for (const name of names) {
    if (typeof g[name] === "function") return g[name];
  }
  throw new Error(
    `enrich: no global ${names.join("()/")}() \u2014 enrich must run inside a DSL runtime (sittir evaluate.ts or tree-sitter CLI; tests inject via _test-helpers.ts)`
  );
}
function makeField(name, content) {
  const field2 = nativeRuleFn("field");
  return { ...field2(name, content), metadata: makeRuleMetadata({ fieldSource: "enriched" }) };
}
function distributeExclusiveFieldChoices(rule2, rulesBag) {
  const seqFn = nativeRuleFn("seq");
  const choiceFn = nativeRuleFn("choice");
  const collapse = (alts) => alts.length === 1 ? alts[0] : choiceFn(...alts);
  const expand = (node) => {
    if (!node || typeof node !== "object" || isLexedBoundary(node)) return [node];
    let out = node;
    const members = node.members;
    const content = node.content;
    if (Array.isArray(members)) {
      const next = isChoiceType(node.type) ? members.flatMap((m) => expand(m)) : members.map((m) => collapse(expand(m)));
      if (next.length !== members.length || next.some((m, i) => m !== members[i]))
        out = { ...node, members: next };
    } else if (content && typeof content === "object") {
      const next = collapse(expand(content));
      if (next !== content) out = withContent(node, next);
    }
    if (!isSeqType(out.type)) return [out];
    const seqMembers = out.members;
    if (!Array.isArray(seqMembers)) return [out];
    for (let i = 0; i < seqMembers.length; i += 1) {
      const branches = exclusiveFieldChoiceBranches(seqMembers[i], rulesBag);
      if (!branches) continue;
      return branches.flatMap((branch) => {
        const swapped = [...seqMembers];
        swapped[i] = branch;
        return expand(seqFn(...swapped));
      });
    }
    return [out];
  };
  return collapse(expand(rule2));
}
function applyRepeatUnionFieldPromotion(ruleName, rule2, ctx) {
  const { rulesBag } = ctx;
  const preExistingFieldNames = syntacticWalker.fold(rule2, /* @__PURE__ */ new Set(), (names, node) => {
    const n = node;
    if (isFieldType(n.type) && typeof n.name === "string" && n.metadata?.fieldSource !== "enriched") names.add(n.name);
    return names;
  });
  const mintedBySymbol = /* @__PURE__ */ new Map();
  const mintedNames = /* @__PURE__ */ new Set();
  const rebuild = (node) => {
    const n = node;
    if (isFieldType(n.type) || isLexedBoundary(n)) return node;
    if (isRepeatType(n.type) && n.content) {
      let inner = n.content;
      while (isPrecWrapper(inner)) inner = inner.content;
      const sym = inner;
      if (sym.type === "SYMBOL" && typeof sym.name === "string" && sym.name.startsWith("_")) {
        const target = rulesBag[sym.name];
        if (target !== void 0 && isChoiceType(target.type)) {
          const fieldName = mintedBySymbol.get(sym.name) ?? pluralizeFieldName(sym.name.replace(/^_+/, ""));
          const mintedForOther = mintedNames.has(fieldName) && mintedBySymbol.get(sym.name) !== fieldName;
          if (preExistingFieldNames.has(fieldName) || mintedForOther) {
            reportSkip("repeat-union-field", ruleName, `field '${fieldName}' already exists`);
            return node;
          }
          mintedBySymbol.set(sym.name, fieldName);
          mintedNames.add(fieldName);
          return makeField(fieldName, node);
        }
      }
      const content = rebuild(n.content);
      return content === n.content ? node : withContent(node, content);
    }
    if (n.members) {
      let changed = false;
      const members = n.members.map((m) => {
        const r = rebuild(m);
        if (r !== m) changed = true;
        return r;
      });
      return changed ? { ...node, members } : node;
    }
    if (n.content) {
      const content = rebuild(n.content);
      return content === n.content ? node : withContent(node, content);
    }
    return node;
  };
  return rebuild(rule2);
}
function makeSymbol(name) {
  const symFn = nativeRuleFn("sym");
  return symFn(name);
}
function registerKwRule(stringLiteral, keyword, kwRules, rulesBag) {
  const hiddenName = `_kw_${keyword}`;
  if (hiddenName in kwRules) return makeSymbol(hiddenName);
  const existing = rulesBag[hiddenName];
  if (existing === void 0) {
    kwRules[hiddenName] = stringLiteral;
    return makeSymbol(hiddenName);
  }
  if (ruleKey(existing) === ruleKey(stringLiteral)) {
    return makeSymbol(hiddenName);
  }
  return null;
}
function collectFieldNamesRuntime(rule2) {
  const names = /* @__PURE__ */ new Set();
  if (!isSeqType(rule2.type)) return names;
  const members = rule2.members;
  for (const raw of members) {
    const m = normalizeMember(raw);
    if (isFieldType(m.type) && typeof m.name === "string") {
      names.add(m.name);
      continue;
    }
    const inner = optionalContentOf(m);
    if (inner !== void 0) {
      const innerN = normalizeMember(inner);
      if (isFieldType(innerN.type) && typeof innerN.name === "string") {
        names.add(innerN.name);
      }
    }
  }
  return names;
}
function reportSkip(pass, ruleName, reason) {
  if (process.env.SITTIR_QUIET) return;
  process.stderr.write(`enrich: skipped ${pass} on ${ruleName} (${reason})
`);
}
function isBareShapeTarget(member, target) {
  return target.symbolRule === member;
}
function detectSymbolTarget(member) {
  if (isSymbolType(member.type) && typeof member.name === "string") {
    const name = member.name;
    return {
      name,
      symbolRule: member,
      wrap: (fieldNode) => fieldNode
    };
  }
  const inner = optionalContentOf(member);
  if (inner === void 0) return null;
  const innerN = normalizeMember(inner);
  if (isSymbolType(innerN.type) && typeof innerN.name === "string") {
    return {
      name: innerN.name,
      symbolRule: inner,
      wrap: (fieldNode) => withOptionalContent(member, fieldNode)
    };
  }
  if (!isSeqType(innerN.type)) return null;
  const seqMembers = inner.members;
  let symIdx = -1;
  for (let i = 0; i < seqMembers.length; i++) {
    const sn2 = normalizeMember(seqMembers[i]);
    if (isSymbolType(sn2.type) && typeof sn2.name === "string") {
      if (symIdx !== -1) return null;
      symIdx = i;
    } else if (!isStringType(sn2.type) && sn2.type !== "PATTERN") {
      return null;
    }
  }
  if (symIdx === -1) return null;
  const symMember = seqMembers[symIdx];
  const sn = normalizeMember(symMember);
  if (!isSymbolType(sn.type) || typeof sn.name !== "string") return null;
  const seqRule = inner;
  return {
    name: sn.name,
    symbolRule: symMember,
    wrap: (fieldNode) => {
      const newSeqMembers = seqMembers.map((mm, i) => i === symIdx ? fieldNode : mm);
      const newSeq = { ...seqRule, members: newSeqMembers };
      return withOptionalContent(member, newSeq);
    }
  };
}
function countSymbolsInRepeat(node, kindCounts, inRepeat = false) {
  if (!node) return;
  const t = node.type;
  if (!t) return;
  if (isFieldType(t)) return;
  if (t === "ALIAS") return;
  if (isSymbolType(t)) {
    if (!inRepeat) return;
    const name = node.name;
    if (typeof name === "string") {
      kindCounts.set(name, (kindCounts.get(name) ?? 0) + 1);
    }
    return;
  }
  if (isRepeatType(t)) {
    const content = node.content;
    countSymbolsInRepeat(content, kindCounts, true);
    return;
  }
  if (isSeqType(t) || isChoiceType(t)) {
    const members = node.members;
    if (Array.isArray(members)) {
      for (const m of members) countSymbolsInRepeat(m, kindCounts, inRepeat);
    }
    return;
  }
  if (isOptionalType(t) || isPrecWrapper(node)) {
    const content = node.content;
    countSymbolsInRepeat(content, kindCounts, inRepeat);
    return;
  }
}
function applySymbolToField(ruleName, rule2, ctx) {
  const { supertypeNames, sourceSymbols: symbols } = ctx;
  if (ruleName.startsWith("_")) return rule2;
  const precStack = [];
  let cursor = rule2;
  while (isPrecWrapper(cursor)) {
    precStack.push(cursor);
    cursor = cursor.content;
  }
  if (!isSeqType(cursor.type)) {
    return tryPromoteInRepeatSeq(ruleName, rule2, cursor, precStack, supertypeNames, symbols);
  }
  const members = cursor.members;
  const directKindCounts = /* @__PURE__ */ new Map();
  const targetByIdx = members.map((m) => {
    const t = detectSymbolTarget(m);
    if (!t) return null;
    if (t.name.startsWith("_") && !isBareShapeTarget(m, t)) return null;
    return t;
  });
  for (const t of targetByIdx) {
    if (t) directKindCounts.set(t.name, (directKindCounts.get(t.name) ?? 0) + 1);
  }
  const nestedRepeatCounts = /* @__PURE__ */ new Map();
  for (const m of members) {
    countSymbolsInRepeat(m, nestedRepeatCounts);
  }
  const existing = collectFieldNamesRuntime(cursor);
  const sequenceCounters = /* @__PURE__ */ new Map();
  let changed = false;
  const newMembers = members.map((m, i) => {
    const t = targetByIdx[i];
    if (!t) return m;
    if (separatedListTail(members, i, symbols)) return m;
    let baseFieldName = t.name;
    if (t.name.startsWith("_")) {
      if (!supertypeNames.has(t.name)) return m;
      baseFieldName = t.name.slice(1);
    }
    if ((nestedRepeatCounts.get(t.name) ?? 0) > 0) return m;
    const directCount = directKindCounts.get(t.name) ?? 0;
    let fieldName = baseFieldName;
    if (directCount > 1) {
      const seqIdx = (sequenceCounters.get(t.name) ?? 0) + 1;
      sequenceCounters.set(t.name, seqIdx);
      fieldName = `${baseFieldName}${seqIdx}`;
    }
    if (existing.has(fieldName)) {
      reportSkip("symbol-to-field", ruleName, `field '${fieldName}' already exists`);
      return m;
    }
    existing.add(fieldName);
    changed = true;
    const fieldNode = makeField(fieldName, t.symbolRule);
    return t.wrap(fieldNode);
  });
  const combinedKindCounts = new Map(directKindCounts);
  for (const [k, v] of nestedRepeatCounts) {
    combinedKindCounts.set(k, (combinedKindCounts.get(k) ?? 0) + v);
  }
  const finalMembers = promoteInsideRepeatMembers(ruleName, newMembers, supertypeNames, symbols, existing, combinedKindCounts);
  if (finalMembers === newMembers && !changed) return rule2;
  let result = { ...cursor, members: finalMembers };
  for (let i = precStack.length - 1; i >= 0; i--) {
    result = withContent(precStack[i], result);
  }
  return result;
}
function promoteInsideRepeatMembers(ruleName, members, supertypeNames, symbols, existing, outerKindCounts) {
  let anyRepeatChanged = false;
  const result = members.map((m) => {
    const rebuilt2 = tryPromoteInRepeatMember(ruleName, m, supertypeNames, symbols, existing, outerKindCounts);
    if (rebuilt2 === null) return m;
    anyRepeatChanged = true;
    return rebuilt2;
  });
  if (!anyRepeatChanged) return members;
  return result;
}
function tryPromoteInRepeatMember(ruleName, member, supertypeNames, symbols, existing, outerKindCounts) {
  let cursor = member;
  const memberPrecStack = [];
  while (isPrecWrapper(cursor)) {
    memberPrecStack.push(cursor);
    cursor = cursor.content;
  }
  if (!isRepeatType(cursor.type)) return null;
  let inner = cursor.content;
  const innerPrecStack = [];
  while (isPrecWrapper(inner)) {
    innerPrecStack.push(inner);
    inner = inner.content;
  }
  if (!isSeqType(inner.type)) return null;
  const innerMembers = inner.members;
  const innerTargets = innerMembers.map((m) => {
    const t = detectSymbolTarget(m);
    if (!t) return null;
    if (t.name.startsWith("_") && !isBareShapeTarget(m, t)) return null;
    return t;
  });
  const directKindCounts = /* @__PURE__ */ new Map();
  for (const t of innerTargets) {
    if (t) directKindCounts.set(t.name, (directKindCounts.get(t.name) ?? 0) + 1);
  }
  const nestedRepeatCounts = /* @__PURE__ */ new Map();
  for (const im of innerMembers) {
    countSymbolsInRepeat(im, nestedRepeatCounts);
  }
  const innerExisting = collectFieldNamesRuntime(inner);
  const sequenceCounters = /* @__PURE__ */ new Map();
  let innerChanged = false;
  const newInnerMembers = innerMembers.map((im, i) => {
    const t = innerTargets[i];
    if (!t) return im;
    if (separatedListTail(innerMembers, i, symbols)) return im;
    let baseFieldName = t.name;
    if (t.name.startsWith("_")) {
      if (!supertypeNames.has(t.name)) return im;
      baseFieldName = t.name.slice(1);
    }
    if ((nestedRepeatCounts.get(t.name) ?? 0) > 0) return im;
    if ((outerKindCounts.get(t.name) ?? 0) > 0) return im;
    const directCount = directKindCounts.get(t.name) ?? 0;
    let fieldName = baseFieldName;
    if (directCount > 1) {
      const seqIdx = (sequenceCounters.get(t.name) ?? 0) + 1;
      sequenceCounters.set(t.name, seqIdx);
      fieldName = `${baseFieldName}${seqIdx}`;
    }
    if (innerExisting.has(fieldName)) return im;
    if (existing.has(fieldName)) {
      reportSkip("symbol-to-field", ruleName, `field '${fieldName}' already exists (outer seq)`);
      return im;
    }
    innerExisting.add(fieldName);
    innerChanged = true;
    const fieldNode = makeField(fieldName, t.symbolRule);
    return t.wrap(fieldNode);
  });
  if (!innerChanged) return null;
  let rebuilt2 = { ...inner, members: newInnerMembers };
  for (let i = innerPrecStack.length - 1; i >= 0; i--) {
    rebuilt2 = withContent(innerPrecStack[i], rebuilt2);
  }
  rebuilt2 = withContent(cursor, rebuilt2);
  for (let i = memberPrecStack.length - 1; i >= 0; i--) {
    rebuilt2 = withContent(memberPrecStack[i], rebuilt2);
  }
  return rebuilt2;
}
function tryPromoteInRepeatSeq(ruleName, rule2, cursor, outerPrecStack, supertypeNames, symbols) {
  if (!isRepeatType(cursor.type)) return rule2;
  let inner = cursor.content;
  const innerPrecStack = [];
  while (isPrecWrapper(inner)) {
    innerPrecStack.push(inner);
    inner = inner.content;
  }
  if (!isSeqType(inner.type)) return rule2;
  const members = inner.members;
  const directKindCounts = /* @__PURE__ */ new Map();
  const targetByIdx = members.map((m) => {
    const t = detectSymbolTarget(m);
    if (!t) return null;
    if (t.name.startsWith("_") && !isBareShapeTarget(m, t)) return null;
    return t;
  });
  for (const t of targetByIdx) {
    if (t) directKindCounts.set(t.name, (directKindCounts.get(t.name) ?? 0) + 1);
  }
  const nestedRepeatCounts = /* @__PURE__ */ new Map();
  for (const m of members) {
    countSymbolsInRepeat(m, nestedRepeatCounts);
  }
  const existing = collectFieldNamesRuntime(inner);
  const sequenceCounters = /* @__PURE__ */ new Map();
  let changed = false;
  const newMembers = members.map((m, i) => {
    const t = targetByIdx[i];
    if (!t) return m;
    if (separatedListTail(members, i, symbols)) return m;
    let baseFieldName = t.name;
    if (t.name.startsWith("_")) {
      if (!supertypeNames.has(t.name)) return m;
      baseFieldName = t.name.slice(1);
    }
    if ((nestedRepeatCounts.get(t.name) ?? 0) > 0) return m;
    const directCount = directKindCounts.get(t.name) ?? 0;
    let fieldName = baseFieldName;
    if (directCount > 1) {
      const seqIdx = (sequenceCounters.get(t.name) ?? 0) + 1;
      sequenceCounters.set(t.name, seqIdx);
      fieldName = `${baseFieldName}${seqIdx}`;
    }
    if (existing.has(fieldName)) {
      reportSkip("symbol-to-field", ruleName, `field '${fieldName}' already exists`);
      return m;
    }
    existing.add(fieldName);
    changed = true;
    const fieldNode = makeField(fieldName, t.symbolRule);
    return t.wrap(fieldNode);
  });
  if (!changed) return rule2;
  let result = { ...inner, members: newMembers };
  for (let i = innerPrecStack.length - 1; i >= 0; i--) {
    result = withContent(innerPrecStack[i], result);
  }
  result = withContent(cursor, result);
  for (let i = outerPrecStack.length - 1; i >= 0; i--) {
    result = withContent(outerPrecStack[i], result);
  }
  return result;
}
function applyOptionalKeyword(ruleName, rule2, ctx) {
  const inner = peelPrec(rule2);
  const claimed = isSeqType(inner.type) ? collectFieldNamesRuntime(inner) : /* @__PURE__ */ new Set();
  return walkOptionalKeyword(ruleName, rule2, claimed, ctx) ?? rule2;
}
function peelPrec(rule2) {
  let cursor = rule2;
  while (isPrecWrapper(cursor)) {
    cursor = cursor.content;
  }
  return cursor;
}
function tryPromoteOptionalNode(ruleName, rule2, claimedAtSeqLevel, ctx) {
  const inner = optionalContentOf(rule2);
  if (inner === void 0) return { matched: false, result: null };
  const replacement = tryPromoteInnerKeyword(ruleName, rule2, inner, claimedAtSeqLevel, ctx);
  if (replacement !== null) return { matched: true, result: replacement };
  const innerRewritten = walkOptionalKeyword(ruleName, inner, claimedAtSeqLevel, ctx);
  if (innerRewritten !== null) {
    return { matched: true, result: withOptionalContent(rule2, innerRewritten) };
  }
  return { matched: true, result: null };
}
function walkOptionalKeyword(ruleName, rule2, claimedAtSeqLevel, ctx) {
  if (isSeqType(rule2.type)) {
    const members = rule2.members;
    let changed = false;
    const newMembers = members.map((m) => {
      const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, ctx);
      if (out === null) return m;
      changed = true;
      return out;
    });
    return changed ? { ...rule2, members: newMembers } : null;
  }
  if (isChoiceType(rule2.type)) {
    const promoted2 = tryPromoteOptionalNode(ruleName, rule2, claimedAtSeqLevel, ctx);
    if (promoted2.matched) return promoted2.result;
    const members = rule2.members;
    let changed = false;
    const newMembers = members.map((m) => {
      const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, ctx);
      if (out === null) return m;
      changed = true;
      return out;
    });
    return changed ? { ...rule2, members: newMembers } : null;
  }
  const promoted = tryPromoteOptionalNode(ruleName, rule2, claimedAtSeqLevel, ctx);
  if (promoted.matched) return promoted.result;
  if (isRepeatType(rule2.type) || isFieldType(rule2.type)) {
    const content = rule2.content;
    const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, ctx);
    if (out === null) return null;
    return withContent(rule2, out);
  }
  if (isPrecWrapper(rule2)) {
    const content = rule2.content;
    const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, ctx);
    if (out === null) return null;
    return withContent(rule2, out);
  }
  return null;
}
function tryPromoteInnerKeyword(ruleName, optionalRule, inner, claimed, ctx) {
  const innerNorm = normalizeMember(inner);
  if (!isStringType(innerNorm.type)) return null;
  const kw = innerNorm.value;
  if (typeof kw !== "string" || !matchesWordShape(kw, ctx.wordMatcher)) return null;
  const fieldName = `${kw}_marker`;
  if (claimed.has(fieldName)) {
    reportSkip("optional-keyword-prefix", ruleName, `field '${fieldName}' already exists`);
    return null;
  }
  claimed.add(fieldName);
  const symbolRef2 = registerKwRule(inner, fieldName, ctx.kwRules, ctx.rulesBag);
  if (symbolRef2 === null) {
    reportSkip(
      "optional-keyword-prefix",
      ruleName,
      `rule '_kw_${fieldName}' already exists in base.grammar.rules with different content`
    );
    return null;
  }
  const fieldNode = makeField(fieldName, symbolRef2);
  return withOptionalContent(optionalRule, fieldNode);
}
function appendTrailingMemberToOptionalSeq(optSeqRule, trailingOptional) {
  const seqBody = optionalSeqBodyOf(optSeqRule);
  const seqMembers = seqBody.members;
  const newSeqBody = { ...seqBody, members: [...seqMembers, trailingOptional] };
  return withOptionalContent(optSeqRule, newSeqBody);
}
function detectInlineSeparatedListRuns(members, symbols) {
  const carriesRepeat = (m) => {
    if (isRepeatType(m.type)) return true;
    if (!isSeqType(m.type)) return false;
    const inner = m.members;
    return Array.isArray(inner) && inner.some((im) => isRepeatType(im.type));
  };
  const runs = [];
  let i = 0;
  while (i < members.length) {
    let consumed = 0;
    for (const size of [3, 2, 1]) {
      if (i + size > members.length || size === members.length) continue;
      const window = members.slice(i, i + size);
      if (!window.some(carriesRepeat)) continue;
      const synthetic = size === 1 && isSeqType(window[0].type) ? window[0] : { type: "SEQ", members: window };
      const info = separatedListBodyInfo(synthetic, symbols);
      if (info?.flankCarrying) {
        if (info.form === "tail") {
          const repeatMember = window[0];
          const prev = i > 0 ? members[i - 1] : void 0;
          const prevIsPair = prev !== void 0 && ruleKey(prev) === ruleKey(repeatMember.content);
          if (typeEq(repeatMember.type, "REPEAT1") || prevIsPair) continue;
        }
        runs.push({ info, key: ruleKey(synthetic), body: synthetic, start: i, size });
        consumed = size;
        break;
      }
    }
    i += consumed || 1;
  }
  return runs;
}
function collectSeparatedListNameProposals(rules, symbols) {
  const keysByName = /* @__PURE__ */ new Map();
  const record = (info, key) => {
    if (info.elementName === null) return;
    const plural = pluralizeFieldName(info.elementName);
    let keys = keysByName.get(plural);
    if (!keys) keysByName.set(plural, keys = /* @__PURE__ */ new Set());
    keys.add(key);
  };
  const visit = (rule2) => {
    if (!rule2 || typeof rule2 !== "object") return;
    const t = rule2.type;
    if (typeof t !== "string") return;
    if (isSeqType(t)) {
      const rawMembers = rule2.members;
      if (Array.isArray(rawMembers)) {
        const members2 = absorbTrailingListSeparators(rawMembers, symbols) ?? rawMembers;
        const folded = members2 === rawMembers ? rule2 : { ...rule2, members: members2 };
        const whole = separatedListBodyInfo(folded, symbols);
        if (whole?.flankCarrying) {
          record(whole, ruleKey(folded));
        } else {
          for (const run of detectInlineSeparatedListRuns(members2, symbols)) record(run.info, run.key);
        }
        for (const m of members2) visit(m);
        return;
      }
    }
    const content = rule2.content;
    if (content) visit(content);
    const members = rule2.members;
    if (Array.isArray(members)) for (const m of members) visit(m);
  };
  for (const name of Object.keys(rules)) visit(rules[name]);
  return new Map([...keysByName].map(([name, keys]) => [name, keys.size]));
}
function promoteHiddenListRef(member, ctx) {
  if (ctx.hoist === void 0) return member;
  const { rulesBag } = ctx;
  const { separatedListNameCounts, hiddenListPromotionNames } = ctx.hoist;
  if (!isSymbolType(member.type)) return member;
  const name = member.name;
  if (typeof name !== "string" || !name.startsWith("_")) return member;
  let visibleName = hiddenListPromotionNames.get(name);
  if (visibleName === void 0) {
    const body = rulesBag[name];
    if (!body || !isSeqType(body.type)) return member;
    const info = separatedListBodyInfo(body, ctx.sourceSymbols);
    if (!info?.flankCarrying || info.form !== "head") return member;
    const base2 = name.replace(/^_+/, "");
    const bare = info.elementName !== null ? pluralizeFieldName(info.elementName) : null;
    const candidates = [];
    if (bare !== null && separatedListNameCounts.get(bare) === 1) candidates.push(bare);
    if (bare !== null && base2 !== bare && !base2.endsWith(`_${bare}`)) candidates.push(`${base2}_${bare}`);
    candidates.push(base2.endsWith("_elements") ? base2 : `${base2}_elements`);
    visibleName = candidates.find((c) => !(c in rulesBag) && !(`_${c}` in rulesBag));
    if (visibleName === void 0) return member;
    hiddenListPromotionNames.set(name, visibleName);
  }
  return makeVisibleGroupAlias(member, visibleName);
}
function absorbTrailingListSeparators(members, symbols) {
  let changed = false;
  const out = [];
  for (let i = 0; i < members.length; i++) {
    const cur = members[i];
    const next = members[i + 1];
    const sep = next ? listSeparatorOfOptionalSeq(cur, symbols) : null;
    if (sep !== null && optionalStringLiteral(next) === sep) {
      out.push(appendTrailingMemberToOptionalSeq(cur, next));
      i++;
      changed = true;
      continue;
    }
    out.push(cur);
  }
  return changed ? out : null;
}
function applyClauseHoist(parentKind, rule2, ctx, counter, ambientPrec, enclosingFieldName) {
  const { rulesBag, visibleGroupSources, clauseGroupOwners } = ctx;
  const seqBody = optionalSeqBodyOf(rule2);
  if (seqBody !== void 0) {
    const recursedSeqBody = applyClauseHoist(parentKind, seqBody, ctx, counter, ambientPrec, enclosingFieldName);
    if (matchesEmpty(recursedSeqBody)) {
      counter.opt += 1;
      if (recursedSeqBody === seqBody) return rule2;
      return withOptionalContent(rule2, recursedSeqBody);
    } else if (isInlineSafe(recursedSeqBody, ctx.sourceSymbols)) {
      const name = clauseHoistSynthName(recursedSeqBody, parentKind, ctx, counter);
      if (name !== null) {
        if (!clauseGroupOwners.has(name)) clauseGroupOwners.set(name, parentKind);
        const symbolRef2 = makeGroupLiftSymbol(rule2, name);
        return withOptionalContent(rule2, symbolRef2);
      }
      return rule2;
    } else {
      counter.opt += 1;
      const name = visibleGroupSynthName(recursedSeqBody, parentKind, ctx, counter, ambientPrec, enclosingFieldName);
      if (name !== null) {
        visibleGroupSources.add(name);
        if (!clauseGroupOwners.has(name)) clauseGroupOwners.set(name, parentKind);
        const groupRef = makeGroupLiftSymbol(rule2, name);
        return withOptionalContent(rule2, groupRef);
      }
      if (recursedSeqBody === seqBody) return rule2;
      return withOptionalContent(rule2, recursedSeqBody);
    }
  }
  {
    const inner = optionalContentOf(rule2);
    if (inner !== void 0) {
      const recursed = applyClauseHoist(parentKind, inner, ctx, counter, ambientPrec, enclosingFieldName);
      const promoted = mintStructuredChoiceArm(
        recursed,
        parentKind,
        ctx,
        counter,
        /* @__PURE__ */ new Set(),
        ambientPrec,
        enclosingFieldName
      );
      const final = promoted ?? recursed;
      if (final === inner) return rule2;
      return withOptionalContent(rule2, final);
    }
  }
  if (isSeqType(rule2.type)) {
    const rawMembers = rule2.members;
    if (!Array.isArray(rawMembers)) return rule2;
    const absorbed = absorbTrailingListSeparators(rawMembers, ctx.sourceSymbols);
    const members = absorbed ?? rawMembers;
    let changed = absorbed !== null;
    const newMembers = members.map((m) => {
      let out = applyClauseHoist(parentKind, m, ctx, counter, ambientPrec);
      out = promoteHiddenListRef(out, ctx);
      if (out !== m) changed = true;
      return out;
    });
    if (ctx.hoist !== void 0 && separatedListBodyInfo({ ...rule2, members: newMembers }, ctx.sourceSymbols) === null) {
      const runs = detectInlineSeparatedListRuns(newMembers, ctx.sourceSymbols);
      for (let r = runs.length - 1; r >= 0; r--) {
        const run = runs[r];
        const isTail = run.info.form === "tail";
        const seqFn = nativeRuleFn("seq");
        const repeatFn = nativeRuleFn("repeat");
        const optionalFn = nativeRuleFn("optional", "opt");
        const body = isTail ? seqFn(
          run.info.element,
          repeatFn(seqFn(run.info.separatorRule, run.info.element)),
          optionalFn(run.info.separatorRule)
        ) : seqFn(...run.info.flatMembers);
        const name = visibleGroupSynthName(body, parentKind, ctx, counter, ambientPrec);
        if (name === null) continue;
        visibleGroupSources.add(name);
        if (!clauseGroupOwners.has(name)) clauseGroupOwners.set(name, parentKind);
        const groupRef = makeGroupLiftSymbol(body, name);
        const replacement = isTail ? optionalFn(groupRef) : groupRef;
        newMembers.splice(run.start, run.size, replacement);
        changed = true;
      }
    }
    return changed ? { ...rule2, members: newMembers } : rule2;
  }
  if (isChoiceType(rule2.type)) {
    let choiceRule = rule2;
    const permutationChoice = isPermutationChoice(rule2, rulesBag, ctx.kwRules, ctx.wordMatcher);
    const selfFold = selfReferentialFoldOf(parentKind, rule2) !== void 0;
    if (permutationChoice) {
      choiceRule = promotePermutationArmKeywords(rule2, ctx);
    }
    const members = choiceRule.members;
    if (!Array.isArray(members)) return rule2;
    const leadingNameCounts = /* @__PURE__ */ new Map();
    for (const m of members) {
      const name = armLeadingSymbolName(m, rulesBag);
      if (name !== void 0) leadingNameCounts.set(name, (leadingNameCounts.get(name) ?? 0) + 1);
    }
    const collidingLeadingNames = /* @__PURE__ */ new Set();
    for (const [name, count] of leadingNameCounts) {
      if (count >= 2) collidingLeadingNames.add(name);
    }
    let changed = false;
    const newMembers = members.map((m) => {
      const out = applyClauseHoist(parentKind, m, ctx, counter, ambientPrec);
      const literalOnlySplit = members.some((sib) => sib !== m && armsDifferOnlyByLiteralChoice(out, sib));
      const promoted = permutationChoice || literalOnlySplit || selfFold ? null : mintStructuredChoiceArm(out, parentKind, ctx, counter, collidingLeadingNames, ambientPrec);
      const final = promoteHiddenListRef(promoted ?? out, ctx);
      if (final !== m) changed = true;
      return final;
    });
    return changed || choiceRule !== rule2 ? { ...choiceRule, members: newMembers } : rule2;
  }
  if (isRepeatType(rule2.type) || isPrecWrapper(rule2)) {
    const content = rule2.content;
    if (!content) return rule2;
    const innerAmbientPrec = isPrecWrapper(rule2) ? rule2 : ambientPrec;
    const newContent = applyClauseHoist(parentKind, content, ctx, counter, innerAmbientPrec, enclosingFieldName);
    if (isRepeatType(rule2.type) && isMultiSlotRepeatElement(newContent, ctx.sourceSymbols)) {
      const name = visibleGroupSynthName(newContent, parentKind, ctx, counter, ambientPrec, enclosingFieldName);
      if (name !== null) {
        visibleGroupSources.add(name);
        if (!clauseGroupOwners.has(name)) clauseGroupOwners.set(name, parentKind);
        return withContent(rule2, makeGroupLiftSymbol(newContent, name));
      }
    }
    if (newContent === content) return rule2;
    return withContent(rule2, newContent);
  }
  if (isFieldType(rule2.type)) {
    const content = rule2.content;
    if (!content) return rule2;
    const newContent = applyClauseHoist(
      parentKind,
      content,
      ctx,
      counter,
      ambientPrec,
      rule2.name
    );
    if (newContent === content) return rule2;
    return withContent(rule2, newContent);
  }
  return rule2;
}
function clauseHoistSynthName(seqBody, parentKind, ctx, counter) {
  const { clauseDedupeMap: dedupeMap, rulesBag, clauseGroupRules } = ctx;
  const key = ruleKey(seqBody);
  const existing = dedupeMap[key];
  if (existing !== void 0) {
    if (!(existing in clauseGroupRules)) {
      clauseGroupRules[existing] = seqBody;
    }
    return existing;
  }
  counter.opt += 1;
  const name = `_${parentKind}_optional${counter.opt}`;
  if (name in rulesBag) {
    process.stderr.write(
      `enrich: clause-hoist skipped for '${parentKind}' \u2014 rule '${name}' already exists in base.grammar.rules
`
    );
    return null;
  }
  dedupeMap[key] = name;
  clauseGroupRules[name] = seqBody;
  return name;
}
function collapseSingletonMintOrdinals(mergedRules, mintedRules, visibleGroupSources, clauseGroupOwners) {
  const byParentFlavor = /* @__PURE__ */ new Map();
  for (const hidden of Object.keys(mintedRules)) {
    const m = /^_?(.+)_(arm|group)(\d+)$/.exec(hidden);
    if (!m) continue;
    const key = `${m[1]}_${m[2]}`;
    const bucket = byParentFlavor.get(key);
    if (bucket) bucket.push(hidden);
    else byParentFlavor.set(key, [hidden]);
  }
  const renames = /* @__PURE__ */ new Map();
  for (const [bare, hiddens] of byParentFlavor) {
    if (hiddens.length !== 1) continue;
    const oldHidden = hiddens[0];
    const visible = !oldHidden.startsWith("_");
    const newHidden = visible ? bare : `_${bare}`;
    if (`_${bare}` in mergedRules || bare in mergedRules) continue;
    renames.set(oldHidden, newHidden);
    if (!visible) renames.set(oldHidden.replace(/^_/, ""), bare);
  }
  if (renames.size === 0) return;
  for (const [oldName, newName] of renames) {
    if (oldName in mergedRules && (oldName.startsWith("_") || oldName in mintedRules)) {
      mergedRules[newName] = mergedRules[oldName];
      delete mergedRules[oldName];
    }
    if (oldName in mintedRules) {
      mintedRules[newName] = mintedRules[oldName];
      delete mintedRules[oldName];
    }
    if (visibleGroupSources.delete(oldName)) visibleGroupSources.add(newName);
    const owner = clauseGroupOwners.get(oldName);
    if (owner !== void 0) {
      clauseGroupOwners.delete(oldName);
      clauseGroupOwners.set(newName, owner);
    }
  }
  const rewrite = (node) => {
    if (Array.isArray(node)) {
      for (const m of node) rewrite(m);
      return;
    }
    if (node === null || typeof node !== "object") return;
    const r = node;
    if (typeof r.name === "string" && renames.has(r.name)) r.name = renames.get(r.name);
    if (r.type === "ALIAS" && typeof r.value === "string" && renames.has(r.value)) r.value = renames.get(r.value);
    for (const v of Object.values(r)) rewrite(v);
  };
  for (const name of Object.keys(mergedRules)) rewrite(mergedRules[name]);
}
function visibleGroupSynthName(content, parentKind, ctx, counter, ambientPrec, enclosingFieldName, flavor = "group") {
  const { groupDedupeMap, rulesBag, clauseGroupRules } = ctx;
  const separatedListNameCounts = ctx.hoist?.separatedListNameCounts;
  if (process.env.SITTIR_DEBUG_LISTNAME) {
    const info = separatedListBodyInfo(content, ctx.sourceSymbols);
    process.stderr.write(
      `[listname] mint for parent='${parentKind}' list=${JSON.stringify(info)} counts=${info?.elementName ? separatedListNameCounts?.get(pluralizeFieldName(info.elementName)) : "-"}
`
    );
  }
  const registeredBody = ambientPrec ? withContent(ambientPrec, content) : content;
  if (coveredByAuthoredGroup(registeredBody, ctx)) return null;
  const key = ruleKey(registeredBody);
  const existing = groupDedupeMap[key];
  if (existing !== void 0) {
    if (!(existing in clauseGroupRules)) clauseGroupRules[existing] = registeredBody;
    return existing;
  }
  const base2 = parentKind.replace(/^_+/, "");
  const register = (name, body = registeredBody) => {
    groupDedupeMap[key] = name;
    clauseGroupRules[name] = body;
    return name;
  };
  const listInfo = separatedListNameCounts !== void 0 ? separatedListBodyInfo(content, ctx.sourceSymbols) : null;
  if (listInfo?.flankCarrying) {
    const nameFree = (n) => !(n in rulesBag) && !(`_${n}` in rulesBag) && !(n in clauseGroupRules) && !(`_${n}` in clauseGroupRules);
    const bare = listInfo.elementName !== null ? pluralizeFieldName(listInfo.elementName) : null;
    const candidates = [];
    if (bare !== null && separatedListNameCounts.get(bare) === 1) candidates.push(bare);
    if (bare !== null && base2 !== bare && !base2.endsWith(`_${bare}`)) candidates.push(`${base2}_${bare}`);
    if (bare !== `${base2}_elements`) candidates.push(base2.endsWith("_elements") ? base2 : `${base2}_elements`);
    const flatBody = { ...content, members: listInfo.flatMembers };
    const registeredFlat = ambientPrec ? withContent(ambientPrec, flatBody) : flatBody;
    for (const candidate of candidates) {
      if (!nameFree(candidate)) continue;
      return register(candidate, registeredFlat);
    }
  }
  if (enclosingFieldName !== void 0) {
    const visibleName2 = `${base2}_${enclosingFieldName}`;
    if (!(visibleName2 in rulesBag) && !(`_${visibleName2}` in rulesBag) && !(visibleName2 in clauseGroupRules)) {
      return register(visibleName2);
    }
  }
  const ordinal = flavor === "arm" ? ++counter.arm : ++counter.grp;
  const visibleName = `${base2}_${flavor}${ordinal}`;
  const hiddenName = `_${visibleName}`;
  if (visibleName in rulesBag || hiddenName in rulesBag || visibleName in clauseGroupRules) {
    process.stderr.write(
      `enrich: visible-group skipped for '${parentKind}' \u2014 rule '${visibleName}'/'${hiddenName}' already exists in base.grammar.rules
`
    );
    return null;
  }
  return register(visibleName);
}
function promoteExistingHiddenRuleName(existingHiddenName, parentKind, ctx, counter, flavor = "group") {
  const { groupDedupeMap, rulesBag } = ctx;
  const existing = groupDedupeMap[existingHiddenName];
  if (existing !== void 0) return { visibleName: existing };
  const natural = existingHiddenName.replace(/^_+/, "");
  if (natural.length > 0 && !(natural in rulesBag)) {
    groupDedupeMap[existingHiddenName] = natural;
    return { visibleName: natural };
  }
  const ordinal = flavor === "arm" ? ++counter.arm : ++counter.grp;
  const visibleName = `${parentKind.replace(/^_+/, "")}_${flavor}${ordinal}`;
  if (visibleName in rulesBag) {
    process.stderr.write(
      `enrich: visible-group promotion skipped for '${parentKind}' \u2014 rule '${visibleName}' already exists in base.grammar.rules
`
    );
    return null;
  }
  groupDedupeMap[existingHiddenName] = visibleName;
  return { visibleName };
}
function promotePermutationArmKeywords(choiceRule, ctx) {
  const members = choiceRule.members;
  let changed = false;
  const newMembers = members.map((arm2) => {
    if (!isSeqType(arm2.type)) return arm2;
    const seqMembers = arm2.members;
    let armChanged = false;
    const newSeq = seqMembers.map((m) => {
      const norm = normalizeMember(m);
      if (!isStringType(norm.type) || typeof norm.value !== "string") return m;
      if (!matchesWordShape(norm.value, ctx.wordMatcher)) return m;
      const fieldName = `${norm.value}_marker`;
      const symbolRef2 = registerKwRule(m, fieldName, ctx.kwRules, ctx.rulesBag);
      if (symbolRef2 === null) return m;
      armChanged = true;
      return makeField(fieldName, symbolRef2);
    });
    if (!armChanged) return arm2;
    changed = true;
    return { ...arm2, members: newSeq };
  });
  return changed ? { ...choiceRule, members: newMembers } : choiceRule;
}
function mintStructuredChoiceArm(arm2, parentKind, ctx, counter, collidingLeadingNames, ambientPrec, enclosingFieldName) {
  const { rulesBag, clauseGroupRules, visibleGroupSources, clauseGroupOwners } = ctx;
  const t = arm2.type;
  if (typeof t !== "string") return null;
  if (armStartsWithSymbol(arm2, collidingLeadingNames, rulesBag)) return null;
  if (isPrecWrapper(arm2)) {
    const content = arm2.content;
    if (!content) return null;
    const minted = mintStructuredChoiceArm(
      content,
      parentKind,
      ctx,
      counter,
      collidingLeadingNames,
      arm2,
      enclosingFieldName
    );
    if (!minted) return null;
    return withContent(arm2, minted);
  }
  if (isSymbolType(t)) {
    const name = arm2.name;
    if (typeof name !== "string" || !name.startsWith("_")) return null;
    if (counter.supertypeNames?.has(name)) return null;
    if (Object.hasOwn(clauseGroupRules, name)) return null;
    const body = rulesBag[name];
    if (!body || matchesEmpty(body) || isInlineSafe(body, ctx.sourceSymbols)) return null;
    if (isSupertypeLike(body) || coveredByAuthoredGroup(body, ctx)) return null;
    const promoted = promoteExistingHiddenRuleName(name, parentKind, ctx, counter, "arm");
    if (!promoted) return null;
    rulesBag[name] = withHoistedAnnotation(body);
    visibleGroupSources.add(name);
    if (!clauseGroupOwners.has(name)) clauseGroupOwners.set(name, parentKind);
    return makeVisibleGroupAlias(arm2, promoted.visibleName);
  }
  if (isSeqType(t) || isChoiceType(t)) {
    if (matchesEmpty(arm2) || isInlineSafe(arm2, ctx.sourceSymbols)) return null;
    if (isSupertypeLike(arm2)) return null;
    if (isPermutationChoice(arm2, rulesBag, ctx.kwRules, ctx.wordMatcher)) return null;
    const minted = visibleGroupSynthName(arm2, parentKind, ctx, counter, ambientPrec, enclosingFieldName, "arm");
    if (minted === null) return null;
    visibleGroupSources.add(minted);
    if (!clauseGroupOwners.has(minted)) clauseGroupOwners.set(minted, parentKind);
    return makeGroupLiftSymbol(arm2, minted);
  }
  return null;
}
function coveredByAuthoredGroup(body, ctx) {
  return ctx.authoredGroupBodies.some((pattern) => rulesEqual(unwrapPrec(body), pattern));
}
function makeGroupLiftSymbol(_referenceRule, name) {
  const symbol = nativeRuleFn("symbol", "sym");
  const base2 = symbol(name);
  return {
    ...base2,
    metadata: makeRuleMetadata({ symbolSource: "group-lift" })
  };
}
function makeVisibleGroupAlias(symbolRef2, name) {
  const aliasFn = nativeRuleFn("alias");
  const symbol = nativeRuleFn("symbol", "sym");
  return { ...aliasFn(symbolRef2, symbol(name)), metadata: makeRuleMetadata({ aliasSource: "visible-group" }) };
}
function synthesizeFieldEnumRules(rules) {
  const fieldOccurrences = collectFieldEnumOccurrences(rules);
  const conflictingSites = collectConflictingFieldEnumSites(fieldOccurrences);
  const memberKeyToCanonicalName = buildCanonicalEnumNames(fieldOccurrences, rules);
  const rewrites = /* @__PURE__ */ new Map();
  const newRules = /* @__PURE__ */ new Map();
  const sweep = { rules, newRules, memberKeyToCanonicalName, conflictingSites };
  for (const [parentKind, rule2] of Object.entries(rules)) {
    const rewritten = rewriteFieldEnums(rule2, parentKind, sweep);
    if (rewritten !== rule2) rewrites.set(parentKind, rewritten);
  }
  for (const [kind, newRule] of rewrites) {
    rules[kind] = newRule;
  }
  for (const [kindName, enumRule] of newRules) {
    if (!rules[kindName]) {
      rules[kindName] = enumRule;
    }
  }
}
function collectFieldEnumOccurrences(rules) {
  const occurrences = [];
  for (const [parentKind, rule2] of Object.entries(rules)) {
    walkFieldEnums(rule2, rules, parentKind, occurrences);
  }
  return occurrences;
}
function walkFieldEnums(rule2, rules, parentKind, out) {
  switch (rule2.type) {
    case "FIELD": {
      const fieldRule = rule2;
      const enumContent = peelRepeatWrapper(fieldRule.content);
      const members = resolveToEnumMembers(enumContent, rules);
      if (members !== null && members.length > 0) {
        const memberKey = buildEnumMemberKey(members);
        out.push({ parentKind, fieldName: fieldRule.name, memberKey, members });
      }
      walkFieldEnums(fieldRule.content, rules, parentKind, out);
      return;
    }
    case "SEQ":
    case "CHOICE":
      for (const m of rule2.members) walkFieldEnums(m, rules, parentKind, out);
      return;
    case "OPTIONAL":
    case "REPEAT":
    case "REPEAT1":
      walkFieldEnums(rule2.content, rules, parentKind, out);
      return;
    default:
      return;
  }
}
function buildCanonicalEnumNames(occurrences, rules) {
  const byKey = /* @__PURE__ */ new Map();
  for (const occ of occurrences) {
    let group2 = byKey.get(occ.memberKey);
    if (!group2) {
      group2 = [];
      byKey.set(occ.memberKey, group2);
    }
    group2.push(occ);
  }
  const existingNameCandidatesByMemberKey = /* @__PURE__ */ new Map();
  for (const [name, rule2] of Object.entries(rules)) {
    const resolved = resolveToEnumMembersOneLevelDeep(rule2);
    if (resolved === null) continue;
    const key = buildEnumMemberKey(resolved);
    let candidates = existingNameCandidatesByMemberKey.get(key);
    if (!candidates) {
      candidates = [];
      existingNameCandidatesByMemberKey.set(key, candidates);
    }
    candidates.push(name);
  }
  const existingRuleNameByMemberKey = /* @__PURE__ */ new Map();
  for (const [key, candidates] of existingNameCandidatesByMemberKey) {
    existingRuleNameByMemberKey.set(key, candidates.sort()[0]);
  }
  const result = /* @__PURE__ */ new Map();
  const groups = Array.from(byKey.entries()).map(([memberKey, group2], index) => {
    const first = group2[0];
    const candidate = deriveCandidateName(group2, existingRuleNameByMemberKey, first);
    return { memberKey, group: group2, first, index, ...candidate };
  });
  groups.sort((a, b) => a.priority - b.priority || a.index - b.index);
  const claimedNames = /* @__PURE__ */ new Set();
  for (const group2 of groups) {
    const chosenName = claimUniqueEnumName(group2.name, rules, group2.memberKey, claimedNames);
    claimedNames.add(chosenName);
    result.set(group2.memberKey, chosenName);
  }
  return result;
}
function fallbackName(occ) {
  return `_${occ.parentKind}_${occ.fieldName}`;
}
function fieldEnumSiteKey(parentKind, fieldName) {
  return `${parentKind}\0${fieldName}`;
}
function collectConflictingFieldEnumSites(occurrences) {
  const memberKeysBySite = /* @__PURE__ */ new Map();
  for (const occ of occurrences) {
    const siteKey = fieldEnumSiteKey(occ.parentKind, occ.fieldName);
    let keys = memberKeysBySite.get(siteKey);
    if (!keys) {
      keys = /* @__PURE__ */ new Set();
      memberKeysBySite.set(siteKey, keys);
    }
    keys.add(occ.memberKey);
  }
  const conflicting = /* @__PURE__ */ new Set();
  for (const [siteKey, keys] of memberKeysBySite) {
    if (keys.size > 1) conflicting.add(siteKey);
  }
  return conflicting;
}
function claimUniqueEnumName(baseName, rules, memberKey, claimedNames) {
  if (!claimedNames.has(baseName) && canReuseExistingEnumName(baseName, rules, memberKey)) {
    return baseName;
  }
  const slug = enumMemberKeySlug(memberKey);
  let candidate = `${baseName}__${slug}`;
  let attempt = 2;
  while (claimedNames.has(candidate) || !canReuseExistingEnumName(candidate, rules, memberKey) && Object.prototype.hasOwnProperty.call(rules, candidate)) {
    candidate = `${baseName}__${slug}_${attempt}`;
    attempt++;
  }
  return candidate;
}
function canReuseExistingEnumName(name, rules, memberKey) {
  const existing = rules[name];
  if (existing === void 0) return true;
  const members = resolveToEnumMembersOneLevelDeep(existing);
  if (members === null) return false;
  return buildEnumMemberKey(members) === memberKey;
}
function buildEnumMemberKey(members) {
  return [...members].map((m) => m.value).sort().join(",");
}
function enumMemberKeySlug(memberKey) {
  return memberKey.split(",").map((member) => {
    const encoded = Array.from(member).map((ch) => /[A-Za-z0-9]/.test(ch) ? ch.toLowerCase() : `x${ch.codePointAt(0).toString(16)}`).join("");
    return encoded.length > 0 ? encoded : "empty";
  }).join("__");
}
function deriveCandidateName(group2, existingRuleNameByMemberKey, first) {
  const existingName = existingRuleNameByMemberKey.get(first.memberKey);
  if (existingName !== void 0) {
    if (existingName !== first.fieldName && !process.env.SITTIR_QUIET) {
      process.stderr.write(
        `enrich: field '${first.fieldName}' on '${first.parentKind}' reuses existing rule '${existingName}' (identical member set) instead of minting a new one
`
      );
    }
    return { name: existingName, priority: 0 };
  }
  const allSameFieldName = group2.every((o) => o.fieldName === first.fieldName);
  if (allSameFieldName) {
    const distinctParents = new Set(group2.map((o) => o.parentKind)).size;
    if (distinctParents >= 2) {
      return { name: `_${first.fieldName}`, priority: 2 };
    }
  }
  return { name: fallbackName(first), priority: 3 };
}
function rewriteFieldEnums(rule2, parentKind, sweep) {
  const { rules, newRules, memberKeyToCanonicalName, conflictingSites } = sweep;
  const recurse = (r) => rewriteFieldEnums(r, parentKind, sweep);
  switch (rule2.type) {
    case "FIELD": {
      const fieldRule = rule2;
      const synthesized = conflictingSites.has(fieldEnumSiteKey(parentKind, fieldRule.name)) ? null : tryExtractFieldEnum(fieldRule.content, rules, memberKeyToCanonicalName);
      if (synthesized !== null) {
        const { enumKindName, synthesizedRule, replacementContent } = synthesized;
        if (!newRules.has(enumKindName)) {
          newRules.set(enumKindName, synthesizedRule);
        }
        return {
          type: "FIELD",
          name: fieldRule.name,
          content: replacementContent,
          metadata: fieldRule.metadata
        };
      }
      const newContent = recurse(fieldRule.content);
      if (newContent === fieldRule.content) return rule2;
      return { ...rule2, content: newContent };
    }
    case "SEQ":
    case "CHOICE": {
      const members = rule2.members;
      const newMembers = members.map(recurse);
      if (newMembers.every((m, i) => m === members[i])) return rule2;
      return { ...rule2, members: newMembers };
    }
    case "OPTIONAL":
    case "REPEAT":
    case "REPEAT1": {
      const content = rule2.content;
      const newContent = recurse(content);
      if (newContent === content) return rule2;
      return { ...rule2, content: newContent };
    }
    default:
      return rule2;
  }
}
function tryExtractFieldEnum(content, rules, memberKeyToCanonicalName) {
  const contentType = content.type;
  const repeatWrapperType = contentType === "REPEAT" || contentType === "REPEAT1" ? contentType : null;
  const innerContent = repeatWrapperType !== null ? content.content : content;
  const members = resolveToEnumMembers(innerContent, rules);
  if (members === null || members.length === 0) return null;
  const memberKey = buildEnumMemberKey(members);
  const enumKindName = memberKeyToCanonicalName.get(memberKey);
  if (enumKindName === void 0) return null;
  const synthesizedRule = {
    type: "PREC",
    content: normalizeEnumMembers(members),
    value: -1
  };
  if (innerContent.type === "SYMBOL" && innerContent.name === enumKindName) {
    return null;
  }
  const symRule = makeSymbol(enumKindName);
  const replacementContent = repeatWrapperType === null ? symRule : { ...content, content: symRule };
  return { enumKindName, synthesizedRule, replacementContent };
}
function peelRepeatWrapper(rule2) {
  const ruleType = rule2.type;
  if (ruleType === "REPEAT" || ruleType === "REPEAT1") return rule2.content;
  return rule2;
}
function resolveToEnumMembers(rule2, rules) {
  switch (rule2.type) {
    case "CHOICE": {
      return isEnumChoiceRule(rule2) ? rule2.members : null;
    }
    case "SYMBOL": {
      const name = rule2.name;
      const target = rules[name];
      if (target === void 0) return null;
      return resolveToEnumMembersOneLevelDeep(target);
    }
    default:
      return null;
  }
}
function resolveToEnumMembersOneLevelDeep(target) {
  const unwrapped = isPrecWrapper(target) ? target.content : target;
  switch (unwrapped.type) {
    case "CHOICE":
      return isEnumChoiceRule(unwrapped) ? unwrapped.members : null;
    default:
      return null;
  }
}

// packages/codegen/src/dsl/extras.ts
function extrasClosure(extras, supertypes, subtypesOf) {
  const names = /* @__PURE__ */ new Set();
  const add = (name) => {
    if (names.has(name)) return;
    names.add(name);
    for (const subtype of subtypesOf(name) ?? []) add(subtype);
  };
  for (const name of extras) add(name);
  const pending = new Set([...supertypes].filter((name) => !names.has(name)));
  for (let grew = true; grew; ) {
    grew = false;
    for (const name of pending) {
      const members = [...subtypesOf(name) ?? []];
      if (members.length === 0 || !members.every((member) => names.has(member))) continue;
      pending.delete(name);
      add(name);
      grew = true;
    }
  }
  return names;
}

// packages/codegen/src/dsl/primitives/rule-cause.ts
var RULE_CAUSE = /* @__PURE__ */ Symbol.for("sittir.ruleCause");
function ruleCauseOf(fn) {
  if (typeof fn !== "function") return void 0;
  return fn[RULE_CAUSE];
}

// packages/codegen/src/dsl/wire/wire.ts
var currentContext = null;
function wireRegisterSyntheticRule(name, content) {
  if (!currentContext) return false;
  currentContext.deposits.set(name, withoutLabel(content));
  return true;
}
function wireDeclareRuleBody(name, text, site) {
  if (!currentContext) throw new Error(`rule('${name}'): no active wire() context`);
  const prior = currentContext.ruleBodies.get(name);
  if (prior === void 0) {
    currentContext.ruleBodies.set(name, { text, site });
    return void 0;
  }
  return prior.text === text ? void 0 : prior.site;
}
function wireHasDeposit(name) {
  return currentContext?.deposits.has(name) ?? false;
}
function wireRegisterSyntheticInline(name) {
  if (!currentContext) return false;
  if (currentContext.authoredRuleNames.has(name)) return false;
  currentContext.syntheticInline.add(name);
  return true;
}
function wireRegisterConflict(names) {
  if (!currentContext) return false;
  if (names.length === 0) return true;
  const key = names.join("\0");
  const exists = currentContext.conflictGroups.some((g) => g.join("\0") === key);
  if (!exists) {
    currentContext.conflictGroups.push([...names]);
  }
  return true;
}
function wireRegisterFlattenedParent(name) {
  if (!currentContext) return false;
  currentContext.flattenedParents.add(name);
  return true;
}
function wireIsPrecedenceRankedRule(name) {
  return currentContext?.precedenceRankedNames.has(name) ?? false;
}
function wireRegisterSymbolRename(oldName, newName) {
  if (!currentContext) return false;
  currentContext.symbolRenames.set(oldName, newName);
  return true;
}
function wireRenameLift(liftName, newName) {
  recordLiftClaim(liftName);
  wireRegisterSymbolRename(liftName, newName);
}
function wireHasAuthoredRule(name) {
  return currentContext?.authoredRuleNames.has(name) ?? false;
}
function patchSiteKey(site) {
  return `${site.ownerKind}|${site.path}|${site.form}`;
}
function wireRecordPatchSite(site) {
  currentContext?.patchSites.set(patchSiteKey(site), site);
}
function wireWithPatchSites(sites, fn) {
  const context = currentContext;
  if (!context) return fn();
  const prior = context.activePatchSites;
  context.activePatchSites = sites.map(patchSiteKey);
  try {
    return fn();
  } finally {
    context.activePatchSites = prior;
  }
}
function recordLiftClaim(liftName) {
  if (!currentContext) return;
  for (const key of currentContext.activePatchSites) {
    const claims = currentContext.liftClaims.get(key) ?? /* @__PURE__ */ new Set();
    currentContext.liftClaims.set(key, claims.add(liftName));
  }
}
function wireGetCurrentRuleKind() {
  return currentContext?.currentRuleKind ?? null;
}
function wireAutomaticVariants() {
  return automaticVariantsOf(currentContext);
}
function automaticVariantsOf(context) {
  if (!context) throw new Error("wire: an arm label was read outside a wire context");
  return context.automaticVariants;
}
function wireIsExtraRule(name) {
  return currentContext?.extraRuleNames.has(name) ?? false;
}
function wireGetLiftBody(name) {
  return currentContext?.liftBodies.get(name) ?? currentContext?.baseRuleBodies[name];
}
function wireSetLiftBody(name, body) {
  recordLiftClaim(name);
  currentContext?.liftBodies.set(name, body);
}
function baseRuleBodiesOf(base2) {
  return baseRulesOf(base2) ?? {};
}
function baseSupertypeNamesOf(base2) {
  return symbolNamesOf(overriddenList(base2?.grammar?.supertypes ?? base2?.supertypes, void 0));
}
function wireIsBaseSupertype(name) {
  return currentContext?.baseSupertypeNames.has(name) ?? false;
}
function wire(config, base2, source = base2) {
  return wireImpl(config, base2, source);
}
function wireImpl(cfg, base2, source) {
  const baseArg = base2;
  const { visibleExternals, whitespaceCollisions } = withEnrichedWhitespace(cfg.visibleExternals, base2);
  assertNoSpacingAddressPatches(cfg.patches ?? {}, knownRuleNames(cfg, baseArg));
  assertNoDeclaredGroupPatches(cfg.patches ?? {}, cfg.groups, cfg.injects);
  const context = {
    deposits: /* @__PURE__ */ new Map(),
    ruleBodies: /* @__PURE__ */ new Map(),
    syntheticInline: /* @__PURE__ */ new Set(),
    inlineRemovals: /* @__PURE__ */ new Set(),
    orphanedSyntheticGroups: /* @__PURE__ */ new Set(),
    conflictGroups: [],
    symbolRenames: /* @__PURE__ */ new Map(),
    refineForms: /* @__PURE__ */ new Map(),
    groups: cfg.groups,
    renderAs: cfg.renderAs,
    visibleExternals,
    whitespaceCollisions,
    expectDiagnostics: cfg.expectDiagnostics,
    expectTestFailures: cfg.expectTestFailures,
    options: cfg.options,
    currentRuleKind: null,
    authoredRuleNames: new Set(Object.keys(cfg.rules ?? {})),
    ...declaredRuleCauses(cfg.rules ?? {}),
    patchSites: /* @__PURE__ */ new Map(),
    extraRuleNames: extraRuleNames(cfg, baseArg),
    precedenceRankedNames: precedenceRankedNames(cfg, baseArg),
    flattenedParents: /* @__PURE__ */ new Set(),
    aliasTargets: /* @__PURE__ */ new Set(),
    automaticVariants: seedAutomaticVariants(base2),
    baseRuleBodies: baseRuleBodiesOf(baseArg),
    baseSupertypeNames: baseSupertypeNamesOf(baseArg),
    liftBodies: /* @__PURE__ */ new Map(),
    liftClaims: /* @__PURE__ */ new Map(),
    activePatchSites: [],
    source
  };
  const patches = cfg.patches ?? {};
  const outRules = { ...cfg.rules };
  composeOrSynthesizePatchedParents(outRules, patches, context);
  injectPlaceholderHiddenRules(outRules, patches, context, baseExternalNames(baseArg), knownRuleNames(cfg, baseArg));
  if (baseArg && (cfg.groups && hasBodyPatternGroups(cfg.groups) || cfg.injects || visibleExternals)) {
    const baseRules = baseRulesOf(baseArg) ?? {};
    for (const baseName of Object.keys(baseRules)) {
      if (baseName in outRules) continue;
      outRules[baseName] = passthroughBaseRuleFn;
    }
  }
  for (const liftName of enrichLiftNames(base2)) {
    if (liftName in outRules || !(liftName in context.baseRuleBodies)) continue;
    outRules[liftName] = passthroughBaseRuleFn;
  }
  wrapAllRuleFns(outRules, context);
  applyWirePatternReplacement(outRules, context.authoredRuleNames, cfg.groups, context, cfg.injects);
  applyWireVisibleExternalsRewrite(outRules, visibleExternals);
  if (baseArg) {
    for (const name of getEnrichClauseGroups(base2)) {
      context.syntheticInline.add(name);
    }
    for (const name of getEnrichVisibleGroupSources(base2)) {
      context.inlineRemovals.add(name);
    }
    const inlineSafeNames = getEnrichClauseGroups(base2);
    for (const [syntheticName, ownerKind] of getEnrichClauseGroupOwners(base2)) {
      if (context.authoredRuleNames.has(ownerKind)) {
        context.orphanedSyntheticGroups.add(syntheticName);
      }
      if (!inlineSafeNames.has(syntheticName) && ownerKind !== syntheticName) {
        const pairKey = [ownerKind, syntheticName].join("\0");
        if (!context.conflictGroups.some((g) => g.join("\0") === pairKey)) {
          context.conflictGroups.push([ownerKind, syntheticName]);
        }
        const selfKey = [syntheticName].join("\0");
        if (!context.conflictGroups.some((g) => g.join("\0") === selfKey)) {
          context.conflictGroups.push([syntheticName]);
        }
      }
    }
    applyWirePatternReplacement(outRules, context.authoredRuleNames, cfg.groups, context, cfg.injects);
  }
  recordAliasTargets(outRules, context);
  const conflicts = wrapConflictsCallback(cfg.conflicts, context);
  const inline = wrapInlineCallback(cfg.inline, context);
  const supertypes = wrapSupertypesCallback(cfg.supertypes, context);
  const renamedCallbacks = Object.fromEntries(
    ["extras", "externals", "precedences"].filter((key) => key in cfg || baseDeclares(baseArg, key)).map((key) => [key, renamingCallback(cfg[key], renameNameList, context)])
  );
  const wired = {
    ...cfg,
    rules: outRules,
    ...renamedCallbacks,
    ...cfg.reserved === void 0 ? {} : { reserved: renamingReserved(cfg.reserved, context) },
    conflicts: renamingCallback(conflicts, renameNameList, context),
    inline: renamingCallback(inline, renameNameList, context),
    supertypes: renamingCallback(supertypes, renameNameList, context)
  };
  Object.defineProperty(wired, "__wireContext__", {
    value: context,
    enumerable: false,
    configurable: true
  });
  return wired;
}
function declaredRuleCauses(rules) {
  const ruleCauses = /* @__PURE__ */ new Map();
  const undeclaredRules = /* @__PURE__ */ new Set();
  for (const [name, fn] of Object.entries(rules)) {
    const declaration = ruleCauseOf(fn);
    if (declaration === void 0) undeclaredRules.add(name);
    else ruleCauses.set(name, declaration);
  }
  return { ruleCauses, undeclaredRules };
}
function renamingReserved(reserved, context) {
  if (reserved === null || typeof reserved !== "object" || Array.isArray(reserved)) return reserved;
  return Object.fromEntries(
    Object.entries(reserved).map(([contextName, list]) => [
      contextName,
      typeof list === "function" ? renamingCallback(list, renameRule, context) : renameRule(list, context.symbolRenames)
    ])
  );
}
function baseDeclares(base2, key) {
  const grammar = base2?.grammar ?? base2;
  return grammar?.[key] !== void 0;
}
function renamingCallback(user, rename, context) {
  return function renamed($, previous) {
    const value = user === void 0 ? previous : user.call(this, $, previous);
    return rename(value, context.symbolRenames);
  };
}
function knownRuleNames(cfg, base2) {
  const baseRules = baseRulesOf(base2) ?? {};
  return /* @__PURE__ */ new Set([...Object.keys(cfg.rules ?? {}), ...Object.keys(cfg.groups ?? {}), ...Object.keys(baseRules)]);
}
function isRetiredAddressKey(key, rules) {
  if (rules.has(key) || rules.has(`_${key}`)) return false;
  return parseSpacingLabel(key) !== void 0 || parseSeamLabel(key) !== void 0 || parseFlankAddress(key) !== void 0;
}
function assertNoSpacingAddressPatches(patches, rules) {
  for (const key of Object.keys(patches)) {
    if (!patches[key]) continue;
    if (isRetiredAddressKey(key, rules)) {
      throw new Error(`patches: '${key}' is a spacing address; declare it under options: against the site it names`);
    }
  }
}
function declaredGroupMintName(key) {
  return key.startsWith("_") ? key : `_${key}`;
}
function assertNoDeclaredGroupPatches(patches, groups, injects) {
  for (const [section, declared] of [["groups", groups], ["injects", injects]]) {
    for (const key of Object.keys(declared ?? {})) {
      for (const patchKey of /* @__PURE__ */ new Set([key, declaredGroupMintName(key)])) {
        if (!patches[patchKey]) continue;
        throw new Error(
          `patches: '${patchKey}' names the ${section}: declaration '${key}' \u2014 its body is declared under ${section}:; write the field()/variant() in that body`
        );
      }
    }
  }
}
function authoredFieldSites(patches) {
  const sites = /* @__PURE__ */ new Map();
  for (const [kind, entry] of Object.entries(patches ?? {})) {
    if (!entry) continue;
    for (const set of patchSetsOf(entry)) {
      for (const [key, value] of Object.entries(set)) {
        if (!isFieldPlaceholder(value)) continue;
        const path = parsePath(key);
        const indices = path.flatMap((segment) => segment.kind === "index" ? [segment.value] : []);
        if (indices.length === path.length) sites.set(kind, [...sites.get(kind) ?? [], indices]);
      }
    }
  }
  return sites;
}
function patchSetsOf(entry) {
  const items = Array.isArray(entry) ? entry : [entry];
  return nestVariantsByPath(items.filter((item) => !isPreference(item)));
}
function nestVariantsByPath(sets) {
  const variantAt = /* @__PURE__ */ new Map();
  for (const set of sets) {
    for (const [key, value] of Object.entries(set)) {
      if (isVariantPlaceholder(value)) variantAt.set(key, value);
    }
  }
  if (variantAt.size < 2) return sets;
  const ancestorsOf = (key) => {
    const segments = key.split("/");
    const names = [];
    for (let i = 1; i < segments.length; i++) {
      const prefix = segments.slice(0, i).join("/");
      const outer = variantAt.get(prefix);
      if (outer !== void 0) names.push(outer.name);
    }
    return names;
  };
  return sets.map((set) => {
    let changed = false;
    const out = {};
    for (const [key, value] of Object.entries(set)) {
      if (!isVariantPlaceholder(value)) {
        out[key] = value;
        continue;
      }
      const nested = nestVariant(value, ancestorsOf(key));
      changed ||= nested !== value;
      out[key] = nested;
    }
    return changed ? out : set;
  });
}
function composeOrSynthesizePatchedParents(rules, patches, context) {
  for (const [kind, entry] of Object.entries(patches)) {
    if (!entry) continue;
    rules[kind] = buildPatchedParentFn(kind, patchSetsOf(entry), rules[kind], context);
  }
}
function buildPatchedParentFn(kind, patchSets, userFn, context) {
  return function wiredPatchedParent($, original) {
    const base2 = userFn ? userFn($, original) : context.deposits.get(kind) ?? original;
    if (patchSets.length === 0) return base2;
    return transform(base2, ...patchSets);
  };
}
function placeholderHiddenName(value, parentKind) {
  if (isFieldPlaceholder(value)) return `_kw_${value.name}`;
  if (isVariantPlaceholder(value)) return polymorphVisibleName(parentKind, variantMintName(value));
  if (isAliasPlaceholder(value)) return `_${value.name}`;
  if (isRulePlaceholder(value)) return value.name;
  return void 0;
}
function symbolNamesOf(entries) {
  const names = /* @__PURE__ */ new Set();
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (typeof entry === "string") {
      names.add(entry);
      continue;
    }
    const symbol = entry;
    if (symbol && typeof symbol === "object" && symbol.type === "SYMBOL" && typeof symbol.name === "string") {
      names.add(symbol.name);
    }
  }
  return names;
}
function overriddenList(baseValue, own) {
  const previous = withStringGlobalShim(
    () => typeof baseValue === "function" ? baseValue(makeSimpleDollarProxy(), []) : baseValue
  );
  return typeof own === "function" ? withStringGlobalShim(
    () => own(makeSimpleDollarProxy(), previous ?? [])
  ) : own ?? previous;
}
function precedenceRankedNames(cfg, base2) {
  const groups = overriddenList(
    base2?.grammar?.precedences ?? base2?.precedences,
    cfg.precedences
  );
  const names = /* @__PURE__ */ new Set();
  for (const group2 of Array.isArray(groups) ? groups : []) for (const name of symbolNamesOf(group2)) names.add(name);
  return names;
}
function extraRuleNames(cfg, base2) {
  const extras = symbolNamesOf(
    overriddenList(base2?.grammar?.extras ?? base2?.extras, cfg.extras)
  );
  const supertypes = symbolNamesOf(
    overriddenList(base2?.grammar?.supertypes ?? base2?.supertypes, cfg.supertypes)
  );
  return extrasClosure(extras, supertypes, (name) => {
    if (!supertypes.has(name)) return void 0;
    const baseRule = base2?.grammar?.rules?.[name] ?? base2?.rules?.[name];
    const own = cfg.rules?.[name];
    const body = own ?? baseRule;
    const rule2 = typeof body === "function" ? withStringGlobalShim(
      () => body(makeSimpleDollarProxy(), baseRule)
    ) : body;
    return rule2?.type === "CHOICE" ? symbolNamesOf(rule2.members) : void 0;
  });
}
function baseExternalNames(base2) {
  const externals = base2?.grammar?.externals ?? base2?.externals;
  return symbolNamesOf(
    typeof externals === "function" ? withStringGlobalShim(() => externals(makeSimpleDollarProxy())) : externals
  );
}
function injectPlaceholderHiddenRules(rules, patches, context, externals, known) {
  const declared = /* @__PURE__ */ new Set();
  for (const [kind, entry] of Object.entries(patches)) {
    if (!entry) continue;
    for (const patchMap of patchSetsOf(entry)) {
      for (const value of Object.values(patchMap)) {
        if (!isRulePlaceholder(value) || declared.has(value.name)) continue;
        if (known.has(value.name) || value.name in rules || externals.has(value.name)) {
          throw new Error(`rule('${value.name}'): '${value.name}' is already a rule of this grammar`);
        }
        declared.add(value.name);
      }
      const mints = Object.values(patchMap).map((value) => ({ value, hiddenName: placeholderHiddenName(value, kind) }));
      const defaultAbsent = defaultAbsentVariantName(kind, patchMap);
      if (defaultAbsent !== void 0) mints.push({ value: void 0, hiddenName: defaultAbsent });
      for (const { value, hiddenName } of mints) {
        if (hiddenName === void 0 || hiddenName in rules || externals.has(hiddenName)) continue;
        rules[hiddenName] = isRulePlaceholder(value) ? declaredRuleFn(value) : makeDeferredContentFn(context, hiddenName);
      }
    }
  }
}
function defaultAbsentVariantName(kind, patchMap) {
  const variants = Object.entries(patchMap).filter((entry) => isVariantPlaceholder(entry[1]));
  if (variants.some(([, v]) => v.absent === true)) return void 0;
  const throughOptional = variants.some(([key]) => {
    const segs = parsePath(key);
    return segs.length === 3 && segs.every((s) => s.kind === "index") && segs[1].value === 0;
  });
  return throughOptional ? polymorphVisibleName(kind, ABSENT_VARIANT_NAME) : void 0;
}
function declaredRuleFn(placeholder) {
  return function declaredRule($) {
    return placeholder.body($);
  };
}
function makeDeferredContentFn(context, hiddenName) {
  return function deferredHiddenRule(_$, previous) {
    const body = context.deposits.get(hiddenName);
    if (body) return body;
    if (previous !== void 0) return previous;
    const blankFn = globalThis.blank;
    return blankFn ? blankFn() : { type: "BLANK" };
  };
}
function wrapAllRuleFns(rules, context) {
  for (const [name, fn] of Object.entries(rules)) {
    rules[name] = wrapOneRuleFn(name, fn, context);
  }
}
function wrapOneRuleFn(name, fn, context) {
  return function wiredRuleFn($, previous) {
    const prevContext = currentContext;
    const prevKind = context.currentRuleKind;
    currentContext = context;
    context.currentRuleKind = name;
    try {
      return fn($, previous);
    } finally {
      context.currentRuleKind = prevKind;
      currentContext = prevContext;
    }
  };
}
function wrapSupertypesCallback(userSupertypes, context) {
  return function wiredSupertypes($, previous) {
    const base2 = userSupertypes ? userSupertypes.call(this, $, previous) : previous ?? [];
    const listed = new Set(symbolNamesOf(base2));
    const flattened = [...context.flattenedParents].filter((name) => !listed.has(name) && !context.aliasTargets.has(name)).map((name) => symbolizeRef($, name));
    return [...base2, ...flattened];
  };
}
function recordAliasTargets(rules, context) {
  const walker = new RuleWalker();
  for (const [name, fn] of Object.entries(rules)) {
    rules[name] = function aliasRecordingRuleFn($, previous) {
      const rule2 = fn.call(this, $, previous);
      walker.fold(rule2, context.aliasTargets, (targets, node) => {
        const alias2 = node;
        if (alias2.type === "ALIAS" && alias2.named !== false && typeof alias2.value === "string") targets.add(alias2.value);
        return targets;
      });
      return rule2;
    };
  }
}
function wrapConflictsCallback(userConflicts, context) {
  return buildWiredConflictsFn(userConflicts, context);
}
function wrapInlineCallback(userInline, context) {
  return buildWiredInlineFn(userInline, context);
}
function buildWiredConflictsFn(userConflicts, context) {
  return function wiredConflicts($, previous) {
    const base2 = userConflicts ? userConflicts.call(this, $, previous) : previous ?? [];
    const renamed = context.symbolRenames.size === 0 ? base2 : base2.map(
      (group2) => group2.map((entry) => {
        const symbol = entry;
        const next = symbol && typeof symbol === "object" && symbol.type === "SYMBOL" && typeof symbol.name === "string" ? context.symbolRenames.get(symbol.name) : void 0;
        return next === void 0 ? entry : symbolizeRef($, next);
      })
    );
    if (context.conflictGroups.length === 0) return renamed;
    const symbolized = context.conflictGroups.map(
      (group2) => group2.map((name) => symbolizeRef($, context.symbolRenames.get(name) ?? name))
    );
    return [...renamed, ...symbolized];
  };
}
function buildWiredInlineFn(userInline, context) {
  return function wiredInline($, previous) {
    let base2 = userInline ? userInline.call(this, $, previous) : previous ?? [];
    if (context.inlineRemovals.size > 0) {
      base2 = base2.filter((entry) => {
        const symbol = entry;
        return !(symbol && typeof symbol === "object" && symbol.type === "SYMBOL" && typeof symbol.name === "string" && context.inlineRemovals.has(symbol.name));
      });
    }
    if (context.syntheticInline.size === 0) return base2;
    const existingNames = collectInlineNames(base2);
    const appended = [];
    for (const name of context.syntheticInline) {
      if (existingNames.has(name)) continue;
      if (context.inlineRemovals.has(name)) continue;
      if (context.orphanedSyntheticGroups.has(name)) continue;
      appended.push(nativeInlineRef($, name));
    }
    return appended.length === 0 ? base2 : [...base2, ...appended];
  };
}
function collectInlineNames(entries) {
  const names = /* @__PURE__ */ new Set();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const symbol = entry;
    if (symbol.type === "SYMBOL" && typeof symbol.name === "string") {
      names.add(symbol.name);
    }
  }
  return names;
}
function nativeInlineRef($, name) {
  const nativeSym = globalThis.sym;
  if (typeof nativeSym === "function") return nativeSym(name);
  return $[name];
}
function symbolizeRef(_$, name) {
  return { type: "SYMBOL", name };
}
function hasBodyPatternGroups(groups) {
  for (const value of Object.values(groups)) {
    if (typeof value === "function") return true;
  }
  return false;
}
var passthroughBaseRuleFn = function passthroughBaseRuleFn2(_$, previous) {
  const name = currentContext?.currentRuleKind;
  return (name === null || name === void 0 ? void 0 : currentContext?.liftBodies.get(name)) ?? previous;
};
function enrichLiftNames(base2) {
  return /* @__PURE__ */ new Set([...getEnrichClauseGroups(base2), ...getEnrichVisibleGroupSources(base2)]);
}
function declaredPatterns(groups, injects) {
  const $ = makeSimpleDollarProxy();
  const declared = [];
  for (const [key, value] of Object.entries(groups ?? {})) {
    if (typeof value !== "function") continue;
    if (key.startsWith("_")) {
      throw new Error(
        `groups['${key}']: body-pattern keys must be visible kind names (no leading underscore); declare a hidden pattern under injects: instead`
      );
    }
    declared.push(["groups", key, value]);
  }
  for (const [key, value] of Object.entries(injects ?? {})) {
    if (typeof value === "function") declared.push(["injects", key, value]);
  }
  return declared.map(([section, key, value]) => {
    let body;
    try {
      const result = value.call(void 0, $, void 0);
      if (!result || typeof result !== "object" || typeof result.type !== "string") {
        throw new Error(`${section}['${key}']: body fn did not return a rule object`);
      }
      body = result;
    } catch (e) {
      throw new Error(`${section}['${key}']: failed to evaluate body fn: ${e.message}`);
    }
    if (!isComplexBodyRt(body)) {
      throw new Error(
        `${section}['${key}']: body is not a complex structural pattern (need SEQ \u22652, CHOICE \u22652, or REPEAT with non-trivial content)`
      );
    }
    return { section, key, value, body };
  });
}
function authoredGroupBodies(groups) {
  return declaredPatterns(groups, void 0).map((pattern) => pattern.body);
}
function makeSimpleDollarProxy() {
  return new Proxy({}, {
    get(_target, name) {
      const symbol = { type: "SYMBOL", name };
      return symbol;
    }
  });
}
function isComplexBodyRt(rule2) {
  const r = rule2;
  const t = r.type;
  if (typeEq(t, "SEQ") || typeEq(t, "CHOICE")) {
    return Array.isArray(r.members) && r.members.length >= 2;
  }
  if (typeEq(t, "REPEAT") || typeEq(t, "REPEAT1")) {
    const c = r.content;
    if (!c || typeof c.type !== "string") return false;
    return !typeEq(c.type, "STRING") && !typeEq(c.type, "SYMBOL") && !typeEq(c.type, "PATTERN");
  }
  return false;
}
function replaceInBodyRt(rule2, candidates, automatic) {
  if (!rule2 || typeof rule2 !== "object") return rule2;
  const r = rule2;
  for (const c of candidates) {
    if (rulesEqual(rule2, c.body)) {
      const site = c.aliasAs === void 0 ? { type: "SYMBOL", name: c.name } : { type: "ALIAS", content: { type: "SYMBOL", name: c.name }, named: true, value: c.aliasAs };
      return relabelledArm(site, rule2, automatic());
    }
  }
  const t = r.type;
  if (t === "SEQ" || t === "CHOICE") {
    const members = r.members;
    if (!Array.isArray(members)) return rule2;
    let changed = false;
    const newMembers = members.map((m) => {
      const replaced = replaceInBodyRt(m, candidates, automatic);
      if (replaced !== m) changed = true;
      return replaced;
    });
    return changed ? { ...r, members: newMembers } : rule2;
  }
  if (t === "OPTIONAL" || t === "REPEAT" || t === "REPEAT1" || t === "FIELD" || t === "PREC" || t === "PREC_LEFT" || t === "PREC_RIGHT" || t === "PREC_DYNAMIC" || t === "TOKEN") {
    const newContent = replaceInBodyRt(r.content, candidates, automatic);
    return newContent !== r.content ? { ...r, content: newContent } : rule2;
  }
  return rule2;
}
function buildPatternReplacingFn(fn, candidates, automatic) {
  return function patternReplacingRuleFn($, previous) {
    const result = fn($, previous);
    return replaceInBodyRt(result, candidates, automatic);
  };
}
function withStringGlobalShim(fn) {
  const g = globalThis;
  const shims = {
    string: (value) => ({ type: "STRING", value }),
    indent: () => ({ type: "INDENT" }),
    dedent: () => ({ type: "DEDENT" })
  };
  const added = [];
  for (const [name, shim] of Object.entries(shims)) {
    if (name in g) continue;
    g[name] = shim;
    added.push(name);
  }
  try {
    return fn();
  } finally {
    for (const name of added) delete g[name];
  }
}
function rewriteVisibleExternalRefsRt(rule2, hiddenToVisible) {
  if (!rule2 || typeof rule2 !== "object") return rule2;
  const r = rule2;
  const t = r.type;
  if (t === "SYMBOL") {
    const visibleName = hiddenToVisible.get(r.name ?? "");
    if (visibleName === void 0) return rule2;
    return { type: "ALIAS", content: rule2, named: true, value: visibleName };
  }
  if (t === "SEQ" || t === "CHOICE") {
    const members = r.members;
    if (!Array.isArray(members)) return rule2;
    let changed = false;
    const newMembers = members.map((m) => {
      const replaced = rewriteVisibleExternalRefsRt(m, hiddenToVisible);
      if (replaced !== m) changed = true;
      return replaced;
    });
    return changed ? { ...r, members: newMembers } : rule2;
  }
  if (t === "OPTIONAL" || t === "REPEAT" || t === "REPEAT1" || t === "FIELD" || t === "PREC" || t === "PREC_LEFT" || t === "PREC_RIGHT" || t === "PREC_DYNAMIC" || t === "TOKEN" || t === "ALIAS") {
    const newContent = rewriteVisibleExternalRefsRt(r.content, hiddenToVisible);
    return newContent !== r.content ? { ...r, content: newContent } : rule2;
  }
  return rule2;
}
function stampHoistedFn(fn) {
  return function hoistedRuleFn($, previous) {
    return withHoistedAnnotation(fn($, previous));
  };
}
function buildVisibleExternalsRewritingFn(fn, hiddenToVisible) {
  return function visibleExternalsRewritingRuleFn($, previous) {
    const result = fn($, previous);
    return rewriteVisibleExternalRefsRt(result, hiddenToVisible);
  };
}
function withEnrichedWhitespace(config, base2) {
  const { bodies, collisions } = getEnrichWhitespace(base2);
  const declared = config === void 0 ? [] : Object.keys(withStringGlobalShim(() => config(makeSimpleDollarProxy())) ?? {});
  const whitespaceCollisions = [
    ...collisions,
    ...declared.filter((name) => Object.hasOwn(bodies, name)).map((name) => ({ name, site: "visibleExternals" }))
  ];
  if (Object.keys(bodies).length === 0) return { visibleExternals: config, whitespaceCollisions };
  return { visibleExternals: ($) => ({ ...config?.($), ...bodies }), whitespaceCollisions };
}
function applyWireVisibleExternalsRewrite(rules, config) {
  if (!config) return;
  const $ = makeSimpleDollarProxy();
  const entries = withStringGlobalShim(() => config($));
  if (!entries) return;
  const hiddenToVisible = /* @__PURE__ */ new Map();
  for (const hiddenName of Object.keys(entries)) {
    hiddenToVisible.set(hiddenName, hiddenName.replace(/^_+/, ""));
  }
  if (hiddenToVisible.size === 0) return;
  for (const [name, fn] of Object.entries(rules)) {
    rules[name] = buildVisibleExternalsRewritingFn(fn, hiddenToVisible);
  }
}
function applyWirePatternReplacement(rules, authoredRuleNames, groups, context, injects) {
  const candidates = [];
  const $ = makeSimpleDollarProxy();
  for (const name of authoredRuleNames) {
    if (!name.startsWith("_")) continue;
    const fn = rules[name];
    if (!fn) continue;
    let body;
    try {
      const result = fn.call(void 0, $, void 0);
      if (!result || typeof result !== "object" || typeof result.type !== "string") continue;
      body = result;
    } catch {
      continue;
    }
    if (!isComplexBodyRt(body)) continue;
    candidates.push({ name, body });
  }
  for (const { section, key, value, body } of declaredPatterns(groups, injects)) {
    const hiddenName = declaredGroupMintName(key);
    const hidden = hiddenName === key;
    candidates.push(hidden ? { name: hiddenName, body } : { name: hiddenName, body, aliasAs: key });
    const registered = wrapOneRuleFn(hiddenName, value, context);
    rules[hiddenName] = section === "groups" ? stampHoistedFn(registered) : registered;
  }
  if (candidates.length === 0) return;
  const candidateNames = new Set(candidates.map((c) => c.name));
  for (const [name, fn] of Object.entries(rules)) {
    if (candidateNames.has(name)) continue;
    rules[name] = buildPatternReplacingFn(fn, candidates, () => context.automaticVariants);
  }
}

// packages/codegen/src/dsl/transform/transform-path.ts
function dsl() {
  return globalThis;
}
function nativeRequired(name) {
  const fn = dsl()[name];
  if (typeof fn !== "function") {
    throw new Error(
      `transform: no global ${String(name)}() found \u2014 must be called inside a runtime that injects ${String(name)}() (sittir evaluate.ts or tree-sitter CLI)`
    );
  }
  return fn;
}
var ApplyPathSkip = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ApplyPathSkip";
  }
};
function splitSegments(pathStr) {
  const parts = [];
  let current = "";
  let inLiteral = false;
  for (const c of pathStr) {
    if (c === '"') {
      inLiteral = !inLiteral;
      current += c;
    } else if (c === "/" && !inLiteral) {
      parts.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  if (inLiteral) throw new Error(`parsePath: unterminated literal in path '${pathStr}'`);
  parts.push(current);
  return parts;
}
function parsePath(pathStr) {
  if (pathStr === ".") return [];
  if (typeof pathStr !== "string" || pathStr.length === 0) {
    throw new Error(`parsePath: path must be a non-empty string, got ${JSON.stringify(pathStr)}`);
  }
  if (pathStr.startsWith("/") || pathStr.endsWith("/")) {
    throw new Error(`parsePath: leading/trailing slash not allowed in path '${pathStr}'`);
  }
  const parts = splitSegments(pathStr);
  const segments = [];
  for (const part of parts) {
    if (part.length >= 2 && part.startsWith('"') && part.endsWith('"')) {
      segments.push({ kind: "literal", text: part.slice(1, -1) });
    } else if (part === "_") {
      segments.push({ kind: "wildcard" });
    } else if (/^-?\d+$/.test(part)) {
      segments.push({ kind: "index", value: Number(part) });
    } else if (/^\([A-Za-z_][A-Za-z0-9_]*\)$/.test(part)) {
      segments.push({ kind: "kind-match", name: part.slice(1, -1) });
    } else if (/^[A-Za-z_][A-Za-z0-9_]*:$/.test(part)) {
      segments.push({ kind: "fieldName", name: part.slice(0, -1) });
    } else if (part === "*") {
      throw new Error(`parsePath: path segment '*' is no longer valid \u2014 use '_' for wildcard`);
    } else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(part)) {
      throw new Error(
        `parsePath: bare kind name '${part}' is no longer valid as a path segment \u2014 use '(${part})' instead`
      );
    } else {
      throw new Error(
        `parsePath: invalid segment '${part}' in path '${pathStr}' \u2014 must be a numeric index, '_' (wildcard), '(name)' (kind-match), or 'name:' (field traversal)`
      );
    }
  }
  return segments;
}
var membersOf2 = (r) => r.members;
var contentOf2 = (r) => r.content;
function applyPath(rule2, segments, patch, precStack) {
  if (isPrecWrapper(rule2)) {
    return descendThroughPrecWrapper(rule2, segments, patch, precStack);
  }
  if (segments.length === 0) {
    return typeof patch === "function" ? patch(rule2, precStack) : patch;
  }
  if (isEnrichGroupLiftSymbol(rule2)) {
    return descendThroughGroupLiftSymbol(rule2, segments, patch, precStack);
  }
  if (isEnrichContentAlias(rule2)) {
    return descendThroughEnrichContentAlias(rule2, segments, patch, precStack);
  }
  const [head, ...rest] = segments;
  const t = rule2.type;
  switch (head.kind) {
    case "kind-match":
      return dispatchKindMatch(rule2, head.name, rest, patch, precStack);
    case "fieldName":
      return descendThroughNamedField(rule2, head.name, rest, patch, precStack);
    case "index":
    case "literal":
    case "wildcard": {
      if (isContainerType(t)) {
        return applyToMembers(rule2, head, rest, patch, precStack);
      }
      if (isWrapperType(t)) {
        return descendThroughSingleWrapper(rule2, head, rest, patch, precStack);
      }
      if (t === "ALIAS") {
        return descendThroughAlias(rule2, head, rest, patch, precStack);
      }
      throw new ApplyPathSkip(
        `applyPath: cannot descend into '${rule2.type}' rule (path has ${segments.length} segments left)`
      );
    }
    default: {
      const _exhaustive = head;
      throw new Error(`applyPath: unknown segment kind '${_exhaustive.kind}'`);
    }
  }
}
function descendThroughPrecWrapper(rule2, segments, patch, precStack) {
  const newStack = precStack ? [...precStack, rule2] : [rule2];
  const newContent = applyPath(contentOf2(rule2), segments, patch, newStack);
  return reconstructPrec(rule2, newContent);
}
function isEnrichGroupLiftSymbol(rule2) {
  const t = rule2.type;
  if (t !== "SYMBOL") return false;
  const meta = readRuleMetadata("metadata" in rule2 ? rule2.metadata : void 0);
  return meta?.symbolSource === "group-lift";
}
function descendThroughGroupLiftSymbol(rule2, segments, patch, precStack) {
  const name = rule2.name;
  if (!name) {
    throw new ApplyPathSkip("applyPath: enrich group-lift symbol has no name to resolve its body");
  }
  const body = wireGetLiftBody(name);
  if (body === void 0) {
    throw new ApplyPathSkip(
      `applyPath: enrich group-lift symbol '${name}' \u2014 no body in the active wire() context (no wire() context, or the name was pruned)`
    );
  }
  wireSetLiftBody(name, applyPath(body, segments, patch, precStack));
  return rule2;
}
function isEnrichContentAlias(rule2) {
  const t = rule2.type;
  if (t !== "ALIAS") return false;
  return readRuleMetadata("metadata" in rule2 ? rule2.metadata : void 0)?.aliasSource === "visible-group";
}
function descendThroughEnrichContentAlias(rule2, segments, patch, precStack) {
  const body = rule2.content;
  if (body === void 0) {
    throw new ApplyPathSkip("applyPath: enrich content-alias has no content to travel through");
  }
  const newBody = applyPath(body, segments, patch, precStack);
  return { ...rule2, content: newBody };
}
function descendThroughSingleWrapper(rule2, head, rest, patch, precStack) {
  switch (head.kind) {
    case "wildcard": {
      const newContent = applyPath(contentOf2(rule2), rest, patch, precStack);
      return reconstructWrapper(rule2, newContent);
    }
    case "index": {
      if (head.value === 0 || head.value === -1) {
        const newContent = applyPath(contentOf2(rule2), rest, patch, precStack);
        return reconstructWrapper(rule2, newContent);
      }
      throw new ApplyPathSkip(
        `applyPath: index ${head.value} out of bounds \u2014 '${rule2.type}' wraps a single content rule (only index 0 / -1 is valid)`
      );
    }
    case "literal": {
      if (literalTextOfMember(contentOf2(rule2)) !== head.text) {
        throw new ApplyPathSkip(
          `applyPath: '${rule2.type}' does not wrap the literal ${JSON.stringify(head.text)}`
        );
      }
      const newContent = applyPath(contentOf2(rule2), rest, patch, precStack);
      return reconstructWrapper(rule2, newContent);
    }
    case "kind-match":
    case "fieldName": {
      throw new Error(
        `descendThroughSingleWrapper: unexpected segment kind '${head.kind}' \u2014 this is a bug in applyPath dispatch`
      );
    }
    default: {
      const _exhaustive = head;
      throw new Error(
        `descendThroughSingleWrapper: unexpected segment ${JSON.stringify(_exhaustive)} \u2014 this is a bug in applyPath dispatch`
      );
    }
  }
}
function descendThroughAlias(rule2, head, rest, patch, precStack) {
  switch (head.kind) {
    case "wildcard": {
      const newContent = applyPath(contentOf2(rule2), rest, patch, precStack);
      return reconstructAlias(rule2, newContent);
    }
    case "index": {
      if (head.value === 0 || head.value === -1) {
        const newContent = applyPath(contentOf2(rule2), rest, patch, precStack);
        return reconstructAlias(rule2, newContent);
      }
      throw new ApplyPathSkip(
        `applyPath: index ${head.value} out of bounds \u2014 '${rule2.type}' wraps a single content rule (only index 0 / -1 is valid)`
      );
    }
    case "literal": {
      if (literalTextOfMember(contentOf2(rule2)) !== head.text) {
        throw new ApplyPathSkip(
          `applyPath: '${rule2.type}' does not wrap the literal ${JSON.stringify(head.text)}`
        );
      }
      const newContent = applyPath(contentOf2(rule2), rest, patch, precStack);
      return reconstructWrapper(rule2, newContent);
    }
    case "kind-match":
    case "fieldName": {
      throw new Error(
        `descendThroughAlias: unexpected segment kind '${head.kind}' \u2014 this is a bug in applyPath dispatch`
      );
    }
    default: {
      const _exhaustive = head;
      throw new Error(
        `descendThroughAlias: unexpected segment ${JSON.stringify(_exhaustive)} \u2014 this is a bug in applyPath dispatch`
      );
    }
  }
}
function reconstructAlias(rule2, newContent) {
  return {
    ...rule2,
    content: newContent
  };
}
function descendThroughNamedField(rule2, fieldName, rest, patch, precStack) {
  if (!isFieldType(rule2.type)) {
    throw new Error(
      `applyPath: path segment '${fieldName}:' at this level expects a field('${fieldName}', ...) wrapper; got type '${rule2.type}'`
    );
  }
  const actualName = rule2.name;
  if (actualName !== fieldName) {
    throw new Error(
      `applyPath: path segment '${fieldName}:' doesn't match field name '${actualName}' at this position`
    );
  }
  const newContent = applyPath(contentOf2(rule2), rest, patch, precStack);
  return reconstructWrapper(rule2, newContent);
}
function dispatchKindMatch(rule2, kindName, rest, patch, precStack) {
  return applyKindMatch(rule2, kindName, rest, patch, precStack, false);
}
function applyKindMatch(rule2, targetKind, rest, patch, precStack, insideNamedField) {
  const result = walkKindMatch(rule2, targetKind, rest, patch, precStack, insideNamedField);
  if (!result.matched) {
    throw new ApplyPathSkip(`applyPath: kind '${targetKind}' matched zero occurrences in this subtree`);
  }
  return result.rule;
}
function applyKindMatchToSymbol(rule2, targetKind, rest, patch, precStack, insideNamedField) {
  const name = rule2.name;
  if (name !== targetKind) return { rule: rule2, matched: false };
  if (insideNamedField) return { rule: rule2, matched: false };
  const patched = rest.length === 0 ? typeof patch === "function" ? patch(rule2, precStack) : patch : applyPath(rule2, rest, patch, precStack);
  return { rule: patched, matched: true };
}
function walkKindMatch(rule2, targetKind, rest, patch, precStack, insideNamedField) {
  if (!isWalkableNode(rule2)) {
    return { rule: rule2, matched: false };
  }
  const t = rule2.type;
  if (isPrecWrapper(rule2)) {
    const stack = precStack ? [...precStack, rule2] : [rule2];
    const inner = walkKindMatch(contentOf2(rule2), targetKind, rest, patch, stack, insideNamedField);
    return {
      rule: inner.matched ? reconstructPrec(rule2, inner.rule) : rule2,
      matched: inner.matched
    };
  }
  if (t === "SYMBOL") {
    return applyKindMatchToSymbol(rule2, targetKind, rest, patch, precStack, insideNamedField);
  }
  if (t === "FIELD") {
    const inner = walkKindMatch(contentOf2(rule2), targetKind, rest, patch, precStack, true);
    return {
      rule: inner.matched ? reconstructWrapper(rule2, inner.rule) : rule2,
      matched: inner.matched
    };
  }
  if (isWrapperType(t)) {
    const inner = walkKindMatch(contentOf2(rule2), targetKind, rest, patch, precStack, insideNamedField);
    return {
      rule: inner.matched ? reconstructWrapper(rule2, inner.rule) : rule2,
      matched: inner.matched
    };
  }
  if (isContainerType(t)) {
    const members = [...membersOf2(rule2)];
    let anyMatched = false;
    for (let i = 0; i < members.length; i++) {
      const inner = walkKindMatch(members[i], targetKind, rest, patch, precStack, insideNamedField);
      if (inner.matched) {
        members[i] = inner.rule;
        anyMatched = true;
      }
    }
    return {
      rule: anyMatched ? reconstructContainer(rule2, members) : rule2,
      matched: anyMatched
    };
  }
  return { rule: rule2, matched: false };
}
function isWalkableNode(rule2) {
  return rule2 !== null && rule2 !== void 0 && typeof rule2 === "object" && typeof rule2.type === "string";
}
function reconstructContainer(rule2, members) {
  const t = rule2.type;
  if (isSeqType(t)) return carryOverProperties(withoutHoisted(rule2), nativeRequired("seq")(...members));
  if (isChoiceType(t)) return carryOverProperties(withoutHoisted(rule2), nativeRequired("choice")(...members));
  throw new Error(`reconstructContainer: unknown container type '${t}'`);
}
function reconstructWrapper(rule2, newContent) {
  const t = rule2.type;
  if (t === "OPTIONAL") return carryOverProperties(rule2, nativeRequired("optional")(newContent));
  if (t === "REPEAT" || t === "REPEAT1") {
    return carryOverProperties(rule2, nativeRequired(t === "REPEAT" ? "repeat" : "repeat1")(newContent));
  }
  if (t === "TOKEN") return carryOverProperties(rule2, nativeRequired("token")(newContent));
  if (t === IMMEDIATE_TOKEN) {
    const immediate = nativeRequired("token").immediate;
    if (typeof immediate !== "function") throw new Error("transform: native token.immediate not available");
    return carryOverProperties(rule2, immediate(newContent));
  }
  if (isFieldType(t)) {
    if (isFieldType(newContent.type)) return newContent;
    const name = rule2.name;
    return carryOverProperties(rule2, nativeRequired("field")(name, newContent));
  }
  throw new Error(
    `reconstructWrapper: no native dsl reconstruction for wrapper type '${rule2.type}' \u2014 this is a bug in the path-descent logic.`
  );
}
function withoutHoisted(rule2) {
  const { annotations, ...rest } = rule2;
  if (annotations?.hoisted !== true) return rule2;
  const { hoisted: _hoisted, ...kept } = annotations;
  return Object.keys(kept).length === 0 ? rest : { ...rest, annotations: kept };
}
function carryOverProperties(rule2, rebuilt2) {
  if (rebuilt2.type !== rule2.type) return rebuilt2;
  const original = rule2;
  const out = rebuilt2;
  for (const key of Object.keys(original)) {
    if (key in out) continue;
    const value = original[key];
    if (value === void 0) continue;
    out[key] = value;
  }
  return rebuilt2;
}
var PREC_VARIANT_MAP = {
  PREC_LEFT: "left",
  PREC_RIGHT: "right",
  PREC_DYNAMIC: "dynamic"
};
function reconstructPrec(rule2, newContent) {
  const t = rule2.type;
  const value = rule2.value ?? 0;
  const prec = nativeRequired("prec");
  const variant2 = PREC_VARIANT_MAP[t];
  if (variant2) {
    const fn = prec[variant2];
    if (typeof fn !== "function") throw new Error(`transform: native prec.${variant2} not available`);
    return fn(value, newContent);
  }
  return prec(value, newContent);
}
function wrapInPrecStack(content, precStack, reconstructPrec2) {
  if (!precStack?.length) return content;
  let result = content;
  for (let i = precStack.length - 1; i >= 0; i--) {
    result = reconstructPrec2(precStack[i], result);
  }
  return result;
}
function applyToMembers(rule2, head, rest, patch, precStack) {
  const members = [...membersOf2(rule2)];
  switch (head.kind) {
    case "index":
      return applyToIndexedMember(rule2, members, head.value, rest, patch, precStack);
    case "literal": {
      const at = members.findIndex((m) => literalTextOfMember(m) === head.text);
      if (at < 0) throw new ApplyPathSkip(`applyPath: no literal ${JSON.stringify(head.text)} in ${rule2.type}`);
      members[at] = applyPath(members[at], rest, patch, precStack);
      return reconstructContainer(rule2, members);
    }
    case "wildcard":
      return applyWildcardToMembers(rule2, members, rest, patch, precStack);
    case "kind-match":
    case "fieldName": {
      throw new Error(`applyToMembers: unexpected segment kind '${head.kind}' \u2014 this is a bug in applyPath dispatch`);
    }
    default: {
      const _exhaustive = head;
      throw new Error(
        `applyToMembers: unexpected segment ${JSON.stringify(_exhaustive)} \u2014 this is a bug in applyPath dispatch`
      );
    }
  }
}
function literalTextOfMember(rule2) {
  const r = rule2;
  return r.type === "STRING" && typeof r.value === "string" ? r.value : void 0;
}
function applyToIndexedMember(rule2, members, indexValue, rest, patch, precStack) {
  const idx = indexValue < 0 ? members.length + indexValue : indexValue;
  if (idx < 0 || idx >= members.length) {
    throw new ApplyPathSkip(`applyPath: index ${indexValue} out of bounds in ${rule2.type} of length ${members.length}`);
  }
  members[idx] = applyPath(members[idx], rest, patch, precStack);
  return reconstructContainer(rule2, members);
}
function applyWildcardToMembers(rule2, members, rest, patch, precStack) {
  if (members.length === 0) {
    throw new ApplyPathSkip(`applyPath: wildcard matched zero members in empty ${rule2.type}`);
  }
  let anyApplied = false;
  for (let i = 0; i < members.length; i++) {
    try {
      members[i] = applyPath(members[i], rest, patch, precStack);
      anyApplied = true;
    } catch (e) {
      if (e instanceof ApplyPathSkip) continue;
      throw e;
    }
  }
  if (!anyApplied) {
    throw new ApplyPathSkip(
      `applyPath: wildcard matched zero members successfully in ${rule2.type} of length ${members.length}`
    );
  }
  return reconstructContainer(rule2, members);
}

// packages/codegen/src/dsl/primitives/arm.ts
function isArmDefault(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "default";
}

// packages/codegen/src/dsl/primitives/group.ts
function isGroupPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "group";
}

// packages/codegen/src/dsl/primitives/flatten.ts
function isFlattenPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "flatten";
}

// packages/codegen/src/dsl/primitives/regex.ts
function isRegexPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "regex";
}

// packages/codegen/src/dsl/transform/transform.ts
function withVariantAnnotation(rule2, variantName, parentKind, arm2) {
  return withAuthoredLabel(rule2, { variant: variantName, variantOf: parentKind, ...isDefaultArm(arm2) ? { default: true } : {} }, wireAutomaticVariants());
}
function isDefaultArm(arm2) {
  const node = arm2;
  const annotations = node?.type === "ALIAS" ? node.content?.annotations : node?.annotations;
  return annotations?.default === true;
}
function symbolRef(name) {
  return nativeRuleFn("sym", "symbol")(name);
}
function ruleRef(ruleName, nodeName) {
  if (ruleName === nodeName) return symbolRef(nodeName);
  const alias2 = nativeRuleFn("alias");
  return alias2(symbolRef(ruleName), symbolRef(nodeName));
}
function transform(original, ...patchSets) {
  let rule2 = original;
  for (const patches of patchSets) {
    recordPatchSites(patches);
    const hasPathKeys = requiresPathMode(patches);
    const hasPlaceholderAlias = Object.values(patches).some(
      (v) => isAliasPlaceholder(v) || isRulePlaceholder(v) || isVariantPlaceholder(v) || isArmDefault(v) || isGroupPlaceholder(v) || isFlattenPlaceholder(v) || isRegexPlaceholder(v)
    );
    if (hasPathKeys || hasPlaceholderAlias) {
      rule2 = applyPathPatches(rule2, patches);
    } else {
      rule2 = applyFlatPatches(rule2, patches);
    }
  }
  return rule2;
}
function recordPatchSites(patches) {
  for (const site of patchSitesOf(Object.entries(patches))) wireRecordPatchSite(site);
}
function patchSitesOf(entries) {
  const ownerKind = wireGetCurrentRuleKind();
  return ownerKind === null ? [] : entries.map(([path, value]) => ({ ownerKind, path, ...patchFormOf(value) }));
}
function patchFormOf(value) {
  if (isRulePlaceholder(value)) return { form: "rule", name: value.name };
  if (isFieldPlaceholder(value)) return { form: "field", name: value.name };
  if (isAliasPlaceholder(value)) return { form: "alias", name: value.name };
  if (isVariantPlaceholder(value)) return { form: "variant", name: value.name };
  if (isArmDefault(value)) return { form: "default" };
  if (isGroupPlaceholder(value)) return { form: "group" };
  if (isFlattenPlaceholder(value)) return { form: "flatten" };
  if (isRegexPlaceholder(value)) return { form: "regex" };
  if (isPreference(value)) return { form: "preference" };
  if (isFieldLike(value)) return { form: "field", name: value.name };
  return { form: "literal" };
}
function requiresPathMode(patches) {
  return Object.keys(patches).some((k) => !/^\d+$/.test(k));
}
function applyPathPatches(original, patches) {
  const { variantEntries, otherEntries } = partitionPatchesByVariant(patches);
  let rule2 = original;
  for (const [key, value] of otherEntries) {
    const segments = parsePath(key);
    if (isArmDefault(value)) assertChoiceArmPath(rule2, key, segments);
    rule2 = wireWithPatchSites(
      patchSitesOf([[key, value]]),
      () => applyPath(rule2, segments, (member, precStack) => resolvePatch(value, member, key, precStack))
    );
    if (isArmDefault(value)) rule2 = clearSiblingDefaults(rule2, segments);
  }
  if (variantEntries.length > 0) rule2 = applyVariantPatches(rule2, variantEntries);
  for (const [key, value] of variantEntries) {
    if (value.default === true) rule2 = clearSiblingDefaults(rule2, parsePath(key));
  }
  return rule2;
}
function clearSiblingDefaults(rule2, segments) {
  const last = segments[segments.length - 1];
  if (last?.kind !== "index") return rule2;
  return applyPath(rule2, segments.slice(0, -1), (parent) => {
    const members = parent.members;
    if (members === void 0) return parent;
    return {
      ...parent,
      members: members.map((m, i) => i === last.value || !isDefaultArm(m) ? m : dropDefault(m))
    };
  });
}
function dropDefault(rule2) {
  const strip = (node2) => {
    const { default: _drop, ...rest } = node2.annotations ?? {};
    return { ...node2, annotations: rest };
  };
  const node = rule2;
  return node.type === "ALIAS" && node.content !== void 0 ? { ...rule2, content: strip(node.content) } : strip(rule2);
}
function assertChoiceArmPath(rule2, key, segments) {
  applyPath(rule2, segments.slice(0, -1), (parent) => {
    if (!isChoiceType(parent.type)) {
      throw new Error(`arm.default: path '${key}' is not a choice arm \u2014 its parent is '${parent.type}'`);
    }
    return parent;
  });
}
function partitionPatchesByVariant(patches) {
  const variantEntries = [];
  const otherEntries = [];
  for (const entry of Object.entries(patches)) {
    const v = entry[1];
    if (isVariantPlaceholder(v)) variantEntries.push([entry[0], v]);
    else otherEntries.push(entry);
  }
  return { variantEntries, otherEntries };
}
function applyVariantPatches(rule2, variantEntries) {
  const ordered = [...variantEntries].sort(([a], [b]) => parsePath(b).length - parsePath(a).length);
  const hoisted = wireWithPatchSites(patchSitesOf(ordered), () => tryHoistSiblingVariants(rule2, ordered));
  if (hoisted === null) {
    const absent = ordered.find(([, v]) => v.absent === true);
    if (absent !== void 0) {
      throw new Error(
        `variant('${absent[1].name}', { absent: true }) at '${absent[0]}' on '${wireGetCurrentRuleKind()}': the absent case only exists when the sibling variants hoist whole-arm (run with SITTIR_DEBUG=1 for the reason they did not)`
      );
    }
  }
  let result = hoisted ? hoisted.rule : rule2;
  for (const [key, value] of ordered) {
    if (hoisted?.consumed.has(key)) continue;
    const segments = parsePath(key);
    try {
      result = wireWithPatchSites(
        patchSitesOf([[key, value]]),
        () => applyPath(result, segments, (member, precStack) => resolvePatch(value, member, key, precStack))
      );
    } catch (error) {
      if (error instanceof Error) error.message = `${wireGetCurrentRuleKind()} patch ${key}: ${error.message}`;
      throw error;
    }
  }
  registerIfPureVariantChoice(result);
  return result;
}
function registerIfPureVariantChoice(rule2) {
  const parentKind = wireGetCurrentRuleKind();
  if (!parentKind || wireIsExtraRule(parentKind)) return;
  let core = rule2;
  while (isPrecWrapper(core)) core = contentOf3(core);
  if (!isChoiceType(core.type)) return;
  const arms = membersOf3(core);
  if (arms.length < 2 || !arms.every((arm2) => isMintedVariantArm(arm2, parentKind))) return;
  wireRegisterFlattenedParent(parentKind);
}
function isMintedVariantArm(arm2, parentKind) {
  let node = arm2;
  while (isPrecWrapper(node)) node = contentOf3(node);
  const symbol = node;
  if (symbol.type !== "SYMBOL" || typeof symbol.name !== "string" || symbol.annotations?.variantOf !== parentKind) return false;
  return wireHasDeposit(symbol.name) || wireHasAuthoredRule(symbol.name);
}
function planSiblingVariantHoist(rule2, variantEntries, onBail = () => {
}) {
  const bail = (reason) => {
    onBail(reason);
    return null;
  };
  const { precStack, core } = peelPrecWrappersFromRule(rule2);
  const t = core.type;
  if (!t) return bail("core rule has no type after prec peeling");
  if (!isSeqType(t)) return bail(`core rule type '${t}' is not seq/SEQ`);
  const absentEntries = variantEntries.filter(([, v]) => v.absent === true);
  const parsed = parseVariantPathsForHoist(
    variantEntries.filter(([, v]) => v.absent !== true),
    bail
  );
  if (parsed === null) return null;
  if (parsed.length === 0) return bail("no variant arms to hoist");
  const { choicePos, throughOptional } = parsed[0];
  if (parsed.some((p) => p.choicePos !== choicePos))
    return bail(
      `variant patches target mixed choice positions (${parsed.map((p) => p.choicePos).join(",")}) \u2014 hoist needs all siblings at one choice`
    );
  if (parsed.some((p) => p.throughOptional !== throughOptional))
    return bail("variant patches mix N/M and N/0/M paths \u2014 hoist needs all siblings addressed the same way");
  const seqMembers = [...membersOf3(core)];
  const resolvedPos = choicePos < 0 ? seqMembers.length + choicePos : choicePos;
  const hoistChoice = hoistChoiceOf(seqMembers[resolvedPos], throughOptional);
  if (!hoistChoice) return bail(`position ${resolvedPos} is '${seqMembers[resolvedPos]?.type}', not a hoistable choice`);
  const { choice, choiceMembers, absentIdx } = hoistChoice;
  const armCount = throughOptional ? choiceMembers.length - 1 : choiceMembers.length;
  for (const p of parsed) if (p.altIdx < 0) p.altIdx += armCount;
  if (absentEntries.length > 1) return bail(`more than one absent variant declared (${absentEntries.map(([k]) => k).join(", ")})`);
  for (const [key, v] of absentEntries) {
    const segs = parsePath(key);
    const head = segs[0];
    const at = head?.kind === "index" ? head.value < 0 ? seqMembers.length + head.value : head.value : void 0;
    if (segs.length !== 1 || at !== resolvedPos) return bail(`absent variant '${v.name}' at '${key}' does not address the optional at ${resolvedPos}`);
    if (absentIdx === void 0) return bail(`absent variant '${v.name}' at '${key}' addresses a choice that is not optional`);
  }
  const declared = absentEntries[0];
  if (absentIdx !== void 0 && (throughOptional || declared !== void 0) && !parsed.some((p) => p.altIdx === absentIdx)) {
    parsed.push({
      key: declared?.[0] ?? String(choicePos),
      v: declared?.[1] ?? variant(ABSENT_VARIANT_NAME),
      choicePos,
      altIdx: absentIdx,
      throughOptional
    });
  }
  const targeted = new Set(parsed.map((p) => p.altIdx));
  const lifted = [];
  for (const altIdx of choiceMembers.map((_, i) => i).filter((i) => !targeted.has(i))) {
    const lift = enrichLiftArmOf(choiceMembers[altIdx]);
    if (lift === null) return bail(`arm ${altIdx} has no variant() and no enrich lift to carry it`);
    lifted.push({ altIdx, lift });
  }
  const scaffolding = seqMembers.filter((_, i) => i !== resolvedPos);
  const emptyArm = choiceMembers.findIndex(
    (arm2) => matchesEmpty(arm2) && scaffolding.every((m) => matchesEmpty(m))
  );
  if (emptyArm >= 0) return bail(`arm ${emptyArm} would hoist to a variant that matches the empty string`);
  const bareArm = choiceMembers.findIndex(
    (arm2) => variantBranchIsUnmaterializable({ type: "SEQ", members: [...scaffolding, ...isBlank(arm2) ? [] : [arm2]] })
  );
  if (bareArm >= 0) return bail(`arm ${bareArm} would hoist to a variant with no token of its own and at most one named child`);
  return { core, precStack, seqMembers, resolvedPos, choice, choiceMembers, parsed, lifted };
}
function hoistChoiceOf(rule2, throughOptional) {
  if (!rule2) return null;
  const blank = { type: "BLANK" };
  const content = optionalContentOf(rule2);
  if (content !== void 0) {
    const members = throughOptional ? isChoiceType(content.type) ? [...membersOf3(content), blank] : null : [content, blank];
    if (members === null) return null;
    return { choice: { type: "CHOICE", members }, choiceMembers: members, absentIdx: members.length - 1 };
  }
  if (throughOptional || !isChoiceType(rule2.type)) return null;
  return { choice: rule2, choiceMembers: [...membersOf3(rule2)], absentIdx: void 0 };
}
function tryHoistSiblingVariants(rule2, variantEntries) {
  const { bail } = peelPrecWrappersFromRule(rule2);
  const parentKind = wireGetCurrentRuleKind();
  if (!parentKind) return bail("no current rule kind (variant()/transform() called outside rule callback?)");
  const plan = planSiblingVariantHoist(rule2, variantEntries, (reason) => bail(reason));
  if (plan === null) return null;
  const { core, precStack, seqMembers, resolvedPos, choice, choiceMembers, parsed, lifted } = plan;
  if (wireIsExtraRule(parentKind)) return bail(`'${parentKind}' is an extra; a non-token rule may not appear inside an extra`);
  if (wireIsPrecedenceRankedRule(parentKind))
    return bail(`'${parentKind}' is ranked by name in the grammar's precedences; its variants would reduce unranked`);
  const authored = parsed.map((p) => polymorphVisibleName(parentKind, variantMintName(p.v))).find((name) => wireHasAuthoredRule(name));
  if (authored !== void 0) return bail(`'${authored}' is an authored rule and would not carry the hoisted scaffolding`);
  return buildHoistedVariants(core, seqMembers, choiceMembers, resolvedPos, choice, parsed, lifted, parentKind, precStack);
}
function peelPrecWrappersFromRule(rule2) {
  const dbg = typeof process !== "undefined" ? process?.env?.SITTIR_DEBUG : void 0;
  const kindFor = wireGetCurrentRuleKind() ?? "(unknown)";
  const bail = (reason) => {
    if (dbg) console.error(`[sittir] hoist skipped on '${kindFor}': ${reason}`);
    return null;
  };
  const precStack = [];
  let core = rule2;
  while (core && isPrecWrapper(core)) {
    precStack.push(core);
    core = contentOf3(core);
  }
  return { bail, precStack, core };
}
function parseVariantPathsForHoist(variantEntries, bail) {
  const parsed = [];
  for (const [key, v] of variantEntries) {
    const segs = parsePath(key);
    if (segs.some((s) => s.kind !== "index"))
      return bail(`variant patch '${key}' uses non-index segments (kind-match / wildcard not supported for hoist)`);
    const values = segs.map((s) => s.value);
    if (values.length === 2) {
      parsed.push({ key, v, choicePos: values[0], altIdx: values[1], throughOptional: false });
    } else if (values.length === 3 && values[1] === 0) {
      parsed.push({ key, v, choicePos: values[0], altIdx: values[2], throughOptional: true });
    } else {
      return bail(`variant patch '${key}' has ${segs.length} segments (expected N/M, or N/0/M through an optional)`);
    }
  }
  return parsed;
}
function buildHoistedVariants(core, seqMembers, choiceMembers, resolvedPos, choice, parsed, lifted, parentKind, precStack) {
  const hoist = (altContent) => {
    const hoistedMembers = seqMembers.flatMap((m, i) => i !== resolvedPos ? [m] : isBlank(altContent) ? [] : [altContent]);
    return wrapVariantBodyInParentPrec(withHoistedAnnotation(reconstructContainer(core, hoistedMembers)), precStack);
  };
  const refs = [];
  for (const p of parsed) {
    const resolvedAlt = p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx;
    const altMember = choiceMembers[resolvedAlt];
    const name = polymorphVisibleName(parentKind, variantMintName(p.v));
    const lift = enrichLiftArmOf(altMember);
    if (lift !== null) wireRenameLift(lift.liftName, name);
    if (!wireRegisterSyntheticRule(name, hoist(lift === null ? altMember : lift.body))) {
      throw new Error(`registerSyntheticRule('${name}'): no active wire() context`);
    }
    refs.push({ altIdx: resolvedAlt, ref: withVariantAnnotation(symbolRef(name), p.v.name, variantOwnerKind(parentKind, p.v), altMember), name });
  }
  for (const { altIdx, lift } of lifted) {
    wireSetLiftBody(lift.liftName, hoist(lift.body));
    refs.push({ altIdx, ref: choiceMembers[altIdx], name: lift.liftName });
  }
  refs.sort((a, b) => a.altIdx - b.altIdx);
  registerHoistedVariantConflicts(refs.map((r) => r.name));
  const newChoice = reconstructContainer(
    choice,
    refs.map((r) => r.ref)
  );
  return { rule: newChoice, consumed: new Set(parsed.map((p) => p.key)) };
}
function registerHoistedVariantConflicts(variantNames) {
  if (variantNames.length > 0 && !wireRegisterConflict(variantNames)) {
    throw new Error(`registerConflict: no active wire() context`);
  }
  for (const n of variantNames) {
    if (!wireRegisterConflict([n])) {
      throw new Error(`registerConflict: no active wire() context`);
    }
  }
}
var membersOf3 = (r) => r.members;
var contentOf3 = (r) => r.content;
function countBodyAnchors(rule2) {
  const t = rule2.type;
  if (t === "STRING" || t === "PATTERN" || t === "TOKEN") return { tokens: 1, named: 0 };
  if (t === "SYMBOL") return { tokens: 0, named: 1 };
  if (isBlank(rule2)) return { tokens: 0, named: 0 };
  if (isSeqType(rule2.type) || isChoiceType(rule2.type)) {
    return membersOf3(rule2).reduce(
      (acc, m) => {
        const c = countBodyAnchors(m);
        return { tokens: acc.tokens + c.tokens, named: acc.named + c.named };
      },
      { tokens: 0, named: 0 }
    );
  }
  const content = rule2.content;
  if (content && typeof content === "object") return countBodyAnchors(content);
  return { tokens: 0, named: 0 };
}
function enrichLiftArmOf(member) {
  const t = member.type;
  if (t !== "ALIAS" && t !== "SYMBOL") return null;
  const symbol = t === "SYMBOL" ? member : member.content;
  if (symbol?.type !== "SYMBOL" || typeof symbol.name !== "string" || !isEnrichGroupLiftSymbol(symbol)) {
    return null;
  }
  const body = wireGetLiftBody(symbol.name);
  return body === void 0 ? null : { body, liftName: symbol.name, symbol };
}
function renameEnrichLift(member, lift, ruleName, nodeName) {
  if (!wireHasAuthoredRule(ruleName)) {
    const body = renameRule(lift.body, /* @__PURE__ */ new Map([[lift.liftName, ruleName]]));
    wireRegisterSyntheticRule(ruleName, wireIsBaseSupertype(lift.liftName) ? body : withHoistedAnnotation(body));
  }
  wireRenameLift(lift.liftName, ruleName);
  if (ruleName === nodeName) return { ...lift.symbol, name: nodeName };
  if (member.type !== "ALIAS") return ruleRef(ruleName, nodeName);
  return {
    ...member,
    content: { ...lift.symbol, name: ruleName },
    value: nodeName
  };
}
function variantBranchIsUnmaterializable(rule2) {
  const { tokens, named } = countBodyAnchors(rule2);
  return tokens === 0 && named <= 1;
}
function deField(rule2) {
  const inner = isFieldLike(rule2) ? contentOf3(rule2) : rule2;
  const stripPropagated = (r) => {
    const { fieldName: _drop, ...rest } = r;
    const optional = optionalContentOf(rest);
    if (optional !== void 0) return withOptionalContent(rest, stripPropagated(optional));
    const content = rest.content;
    if (content && typeof content === "object" && !isSeqType(rest.type) && !isChoiceType(rest.type)) {
      return { ...rest, content: stripPropagated(content) };
    }
    return rest;
  };
  return stripPropagated(inner);
}
function applyFlatPatches(original, patches) {
  const t = original.type;
  if (isSeqType(t)) {
    return applyFlatPatchesToSeq(original, patches);
  }
  if (isChoiceType(t)) {
    const members = membersOf3(original);
    let anyApplied = false;
    const newMembers = members.map((m) => {
      try {
        const patched = applyFlatPatches(m, patches);
        anyApplied = true;
        return patched;
      } catch (e) {
        if (e instanceof ApplyPathSkip) return m;
        throw e;
      }
    });
    if (!anyApplied) {
      throw new Error(
        `transform: flat-positional key(s) [${Object.keys(patches).join(", ")}] matched no choice arm out of ${members.length} \u2014 each arm was tried independently and none had all the target positions. Flat keys patch a position uniformly across every arm; they can't select ONE specific arm (a plain digit key on a choice does not mean "arm N"). To replace one specific arm, use path syntax instead (e.g. '${Object.keys(patches)[0]}' as a path segment, or '-1' for the last arm).`
      );
    }
    return reconstructContainer(original, newMembers);
  }
  if (isPrecWrapper(original)) {
    return applyFlatPatchesThroughPrec(original, patches);
  }
  if (isWrapperType(t)) {
    const newContent = applyFlatPatches(contentOf3(original), patches);
    return reconstructWrapper(original, newContent);
  }
  return original;
}
function applyFlatPatchesThroughPrec(original, patches) {
  const newContent = applyFlatPatches(contentOf3(original), patches);
  return reconstructPrec(original, newContent);
}
function applyFlatPatchesToSeq(original, patches) {
  const members = [...membersOf3(original)];
  for (const [key, patch] of Object.entries(patches)) {
    if (!/^\d+$/.test(key)) {
      throw new Error(
        `transform: invalid flat-positional key '${key}' \u2014 keys must be non-negative integers. Use path syntax ('0/1', '*') for nested addressing.`
      );
    }
    const index = Number(key);
    if (index >= members.length) {
      throw new ApplyPathSkip(
        `transform: index ${index} out of bounds in ${original.type} of length ${members.length}`
      );
    }
    members[index] = wireWithPatchSites(patchSitesOf([[key, patch]]), () => resolvePatch(patch, members[index], key));
  }
  return reconstructContainer(original, members);
}
function resolveRulePlaceholder(patch, key) {
  const parentKind = wireGetCurrentRuleKind();
  if (!parentKind) throw new Error(`rule('${patch.name}'): no current rule kind \u2014 rule() must be used inside a rule callback`);
  const site = `${parentKind}/${key}`;
  const text = canonicalRuleText(patch.body(makeSimpleDollarProxy()));
  const prior = wireDeclareRuleBody(patch.name, text, site);
  if (prior !== void 0) throw new Error(`rule('${patch.name}'): bodies differ at ${prior} and ${site}`);
  return symbolRef(patch.name);
}
var wrapInPrec = (content, precStack) => wrapInPrecStack(content, precStack, reconstructPrec);
function wrapVariantBodyInParentPrec(hoistedSeq, precStack) {
  return wrapInPrec(hoistedSeq, precStack);
}
function resolvePatch(patch, originalMember, key, precStack) {
  if (isRulePlaceholder(patch)) {
    return resolveRulePlaceholder(patch, key);
  }
  if (isFieldPlaceholder(patch)) {
    return resolveFieldPlaceholder(patch, originalMember, precStack);
  }
  if (isFieldLike(patch)) {
    return { ...patch, metadata: makeRuleMetadata({ fieldSource: "override" }) };
  }
  if (isArmDefault(patch)) {
    return withAnnotations(originalMember, { default: true });
  }
  if (isGroupPlaceholder(patch)) {
    return withAnnotations(originalMember, { hoisted: true });
  }
  if (isFlattenPlaceholder(patch)) {
    return withAnnotations(originalMember, { flattened: true });
  }
  if (isRegexPlaceholder(patch)) {
    if (originalMember.type !== "PATTERN") {
      throw new Error(`regex(): the patched member is a '${originalMember.type}', not a pattern`);
    }
    return { ...originalMember, value: patch.source };
  }
  if (isVariantPlaceholder(patch)) {
    const parentKind = wireGetCurrentRuleKind();
    if (!parentKind) {
      throw new Error(`variant('${patch.name}'): no current rule kind \u2014 variant() must be used inside a rule callback`);
    }
    const name = polymorphVisibleName(parentKind, variantMintName(patch));
    const annotated = (rule2) => withVariantAnnotation(rule2, patch.name, variantOwnerKind(parentKind, patch), patch.default === true ? { annotations: { default: true } } : void 0);
    const lift = enrichLiftArmOf(originalMember);
    if (lift !== null) return annotated(renameEnrichLift(originalMember, lift, name, name));
    if (originalMember.type === "ALIAS") {
      const content = originalMember.content;
      if (content?.type === "SYMBOL" && content.name?.startsWith("_")) {
        if (!wireRegisterSyntheticRule(name, withHoistedAnnotation(content))) {
          throw new Error(`registerSyntheticRule('${name}'): no active wire() context`);
        }
        return annotated(symbolRef(name));
      }
      return annotated({ ...originalMember, value: name });
    }
    if (variantBranchIsUnmaterializable(originalMember)) {
      return annotated({
        ...deField(originalMember),
        metadata: makeRuleMetadata({ fieldSource: "override" })
      });
    }
    return annotated(registerAliasedVariant(name, name, originalMember, (body) => wrapInPrec(body, precStack)));
  }
  if (isAliasPlaceholder(patch)) {
    return resolveAliasPlaceholder(patch, originalMember, precStack);
  }
  return patch;
}
function findEnrichShapedFieldThroughTransparentWrappers(node) {
  const r = node;
  if (!r || typeof r !== "object" || typeof r.type !== "string") return null;
  const optional = optionalContentOf(r);
  const inner = optional ?? (isPrecWrapper(r) ? r.content : void 0);
  if (!inner || typeof inner !== "object") return null;
  const rebuild = (newInner) => optional !== void 0 ? withOptionalContent(r, newInner) : { ...r, content: newInner };
  if (isEnrichShapedFieldWrapper(inner)) return { found: inner, reconstruct: rebuild };
  const deeper = findEnrichShapedFieldThroughTransparentWrappers(inner);
  return deeper ? { found: deeper.found, reconstruct: (newInner) => rebuild(deeper.reconstruct(newInner)) } : null;
}
function unifyChoiceArmFieldNames(content, unifiedName) {
  const r = content;
  if (!r || typeof r !== "object" || !isArmChoice(r)) return content;
  const members = r.members;
  if (!Array.isArray(members)) return content;
  let anyChanged = false;
  const newMembers = members.map((m) => {
    if (isFieldLike(m) && m.name !== unifiedName) {
      anyChanged = true;
      return { ...m, name: unifiedName, metadata: makeRuleMetadata({ fieldSource: "override" }) };
    }
    return m;
  });
  if (!anyChanged) return content;
  return { ...r, members: newMembers };
}
function relabelUniformFieldSet(content, newName) {
  const names = /* @__PURE__ */ new Set();
  let anyRepeatedOccurrence = false;
  let sawUnfieldedSymbol = false;
  const liftBodies = /* @__PURE__ */ new Map();
  const collect = (n, inRepeat) => {
    if (!n || typeof n !== "object") return;
    if (isFieldLike(n)) {
      names.add(n.name);
      if (inRepeat) anyRepeatedOccurrence = true;
      return;
    }
    if (isEnrichGroupLiftSymbol(n) && isHiddenKind(n.name ?? "")) {
      const liftName = n.name;
      const body = liftName === void 0 ? void 0 : wireGetLiftBody(liftName);
      if (liftName !== void 0 && body !== void 0 && !liftBodies.has(liftName)) {
        liftBodies.set(liftName, body);
        collect(body, inRepeat);
      }
      return;
    }
    const t = n.type;
    if (t === "SYMBOL" || t === "ALIAS") {
      sawUnfieldedSymbol = true;
      return;
    }
    const entersRepeat = inRepeat || t === "REPEAT" || t === "REPEAT1";
    const r = n;
    if (Array.isArray(r.members)) {
      for (const m of r.members) collect(m, entersRepeat);
    } else if (r.content && typeof r.content === "object") {
      collect(r.content, entersRepeat);
    }
  };
  collect(content, false);
  if (names.size !== 1 || names.has(newName) || !anyRepeatedOccurrence || sawUnfieldedSymbol) return null;
  const rewrite = (n) => {
    if (!n || typeof n !== "object") return n;
    if (isFieldLike(n)) {
      return { ...n, name: newName, metadata: makeRuleMetadata({ fieldSource: "override" }) };
    }
    if (isEnrichGroupLiftSymbol(n)) return n;
    const r = n;
    if (Array.isArray(r.members)) return { ...n, members: r.members.map(rewrite) };
    if (r.content && typeof r.content === "object") return { ...n, content: rewrite(r.content) };
    return n;
  };
  for (const [liftName, body] of liftBodies) {
    wireSetLiftBody(liftName, rewrite(body));
  }
  return rewrite(content);
}
function resolveFieldPlaceholder(patch, originalMember, precStack) {
  let content = originalMember;
  if (isFieldLike(content)) {
    const overrideName = patch.name;
    const existingName = content.name ?? "(unknown)";
    const isEnrichShaped = isEnrichShapedFieldWrapper(content);
    if (overrideName === existingName && !process.env.SITTIR_QUIET) {
      const parentKind = wireGetCurrentRuleKind() ?? "(unknown)";
      const label = isEnrichShaped ? "an enrich-labeled FIELD" : "an existing FIELD";
      const advice = isEnrichShaped ? "enrich will cover it automatically." : "it already has this name.";
      process.stderr.write(
        `transform: override field('${overrideName}') on '${parentKind}' wraps ${label} \u2014 duplicate name ('${overrideName}'). Drop the override entry; ${advice}
`
      );
    }
    content = content.content;
  } else {
    const nested = findEnrichShapedFieldThroughTransparentWrappers(originalMember);
    if (nested !== null) {
      const overrideName = patch.name;
      const renamedField = {
        ...nested.found,
        name: overrideName,
        metadata: makeRuleMetadata({ fieldSource: "override" })
      };
      const reconstructed = nested.reconstruct(renamedField);
      return reconstructed;
    }
    const relabeled = relabelUniformFieldSet(content, patch.name);
    if (relabeled !== null) {
      return relabeled;
    }
    const unified = unifyChoiceArmFieldNames(content, patch.name);
    if (unified !== content) {
      content = unified;
    }
  }
  const maybeSymbolized = maybeKeywordSymbol(patch.name, content, (body) => wrapInPrec(body, precStack));
  if (maybeSymbolized !== content) {
    content = maybeSymbolized;
  }
  content = withoutAutomaticVariants(content, wireAutomaticVariants());
  const native = globalThis.field;
  if (typeof native !== "function") {
    throw new Error(
      "transform: no global field() found \u2014 patches that use the one-arg field() form require a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)"
    );
  }
  const result = native(patch.name, content);
  return { ...result, metadata: makeRuleMetadata({ fieldSource: "override" }) };
}
function resolveAliasPlaceholder(patch, site, precStack) {
  const originalMember = isEnrichShapedFieldWrapper(site) ? site.content : site;
  const labelled = (resolved) => relabelledArm(resolved, originalMember, wireAutomaticVariants());
  const ruleName = "_" + patch.name;
  const lift = enrichLiftArmOf(originalMember);
  if (lift !== null) return labelled(renameEnrichLift(originalMember, lift, ruleName, patch.name));
  const mint = (body) => registerAliasedVariant(ruleName, patch.name, body, (b) => wrapInPrec(b, precStack));
  if (originalMember.type === "ALIAS") {
    const content = contentOf3(originalMember);
    if (!isSymbolType(content.type)) return labelled(mint(content));
    const renamed = { ...originalMember, named: true, value: patch.name };
    return labelled(renamed);
  }
  return labelled(mint(originalMember));
}
function registerAliasedVariant(ruleName, nodeName, originalMember, bodyWrapper) {
  const single = originalMember;
  if (single.type === "SYMBOL" && typeof single.name === "string") {
    if (ruleName === nodeName && single.name.startsWith("_")) {
      if (!wireRegisterSyntheticRule(ruleName, withHoistedAnnotation(originalMember))) {
        throw new Error(`registerSyntheticRule('${ruleName}'): no active wire() context`);
      }
      return symbolRef(nodeName);
    }
    const alias2 = nativeRuleFn("alias");
    return alias2(originalMember, symbolRef(nodeName));
  }
  const wasEmpty = matchesEmpty(originalMember);
  const factored = factorOutEmptiness(originalMember);
  if (wasEmpty && !factored) {
    throw new Error(
      `variant()/alias(): can't extract '${ruleName}' \u2014 its content matches the empty string and no non-empty core could be factored out. Tree-sitter rejects syntactic rules that match empty. Restructure the parent rule (e.g. lift the empty case outside the choice) before splitting.`
    );
  }
  const body = factored ? factored.nonEmpty : originalMember;
  if (!wireRegisterSyntheticRule(ruleName, bodyWrapper(hoistedUnlessToken(body)))) {
    throw new Error(`registerSyntheticRule('${ruleName}'): no active wire() context`);
  }
  const aliasNode = ruleRef(ruleName, nodeName);
  if (factored) {
    const optional = globalThis.optional;
    if (typeof optional !== "function") {
      throw new Error(
        "transform: no global optional() found \u2014 variant()/alias() on empty-matching content needs runtime optional()"
      );
    }
    return optional(aliasNode);
  }
  return aliasNode;
}
function hoistedUnlessToken(body) {
  return lexesAsOneToken(body) ? body : withHoistedAnnotation(body);
}
function factorOutEmptiness(rule2) {
  if (!matchesEmpty(rule2)) return null;
  return extractNonEmpty(rule2);
}
function extractNonEmpty(rule2) {
  const t = rule2.type;
  if (isPlainRepeatType(t)) {
    const r = rule2;
    const nonEmpty = {
      ...r,
      type: "REPEAT1"
    };
    return { nonEmpty };
  }
  const optional = optionalContentOf(rule2);
  if (optional !== void 0) return matchesEmpty(optional) ? extractNonEmpty(optional) : { nonEmpty: optional };
  if (isChoiceType(t)) {
    const members = membersOf3(rule2);
    const nonEmpty = members.filter((m) => !matchesEmpty(m));
    if (nonEmpty.length === 0) return null;
    if (nonEmpty.length === 1) return { nonEmpty: nonEmpty[0] };
    return { nonEmpty: { type: t, members: nonEmpty } };
  }
  if (isSeqType(t)) {
    const members = [...membersOf3(rule2)];
    for (let i = 0; i < members.length; i++) {
      const factored = extractNonEmpty(members[i]);
      if (factored) {
        members[i] = factored.nonEmpty;
        return { nonEmpty: { type: t, members } };
      }
    }
    return null;
  }
  return null;
}

// packages/codegen/src/dsl/sittir-grammar.ts
function sittirGrammar(base2, config) {
  const enriched = enrich(base2, { groupBodies: authoredGroupBodies(config.groups), extras: config.extras, fieldSites: authoredFieldSites(config.patches) });
  const grammar = globalThis.grammar;
  return grammar(enriched, wire(config, enriched, base2));
}

// packages/scm/grammar.sittir.ts
var grammar_sittir_default = sittirGrammar(import_grammar.default, {
  name: "scm",
  patches: {
    _group_expression: { "1/0": field("left"), "1/2": field("right") },
    _named_node_expression: { "2/0": field("left"), "2/2": field("right") },
    named_node: { "1/0": variant("plain"), "1/1": variant("supertyped") },
    named_node_group: {
      "1/0": variant("children"),
      "1/1": variant("anchored_last"),
      "1/1/1/0": field("last")
    }
  },
  expectDiagnostics: {
    "unclassifiable-shape": ["predicate"]
  }
});
if (module.exports && module.exports.default) module.exports = module.exports.default;
