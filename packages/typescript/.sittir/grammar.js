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

// packages/typescript/overrides.ts
var overrides_exports = {};
__export(overrides_exports, {
  default: () => overrides_default
});
module.exports = __toCommonJS(overrides_exports);
var import_grammar = __toESM(require("tree-sitter-typescript/typescript/grammar.js"), 1);

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
function isWrapperType(t) {
  return t === "OPTIONAL" || t === "REPEAT" || t === "REPEAT1" || t === "FIELD" || t === "TOKEN" || t === "IMMEDIATE_TOKEN" || t === "BLANK";
}
function isPrecWrapper(rule) {
  const t = rule.type;
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
var isBlankType = (t) => typeEq(t, "BLANK");

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
function parsePath(pathStr) {
  if (typeof pathStr !== "string" || pathStr.length === 0) {
    throw new Error(`parsePath: path must be a non-empty string, got ${JSON.stringify(pathStr)}`);
  }
  if (pathStr.startsWith("/") || pathStr.endsWith("/")) {
    throw new Error(`parsePath: leading/trailing slash not allowed in path '${pathStr}'`);
  }
  const parts = pathStr.split("/");
  const segments = [];
  for (const part of parts) {
    if (part === "_") {
      segments.push({ kind: "wildcard" });
    } else if (/^-?\d+$/.test(part)) {
      segments.push({ kind: "index", value: Number(part) });
    } else if (/^\([A-Za-z_][A-Za-z0-9_]*\)$/.test(part)) {
      segments.push({ kind: "kind-match", name: part.slice(1, -1) });
    } else if (/^[A-Za-z_][A-Za-z0-9_]*:$/.test(part)) {
      segments.push({ kind: "fieldName", name: part.slice(0, -1) });
    } else if (part === "*") {
      throw new Error(`parsePath: path segment '*' is no longer valid \u2014 use '_' for wildcard; see ADR-0010`);
    } else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(part)) {
      throw new Error(
        `parsePath: bare kind name '${part}' is no longer valid as a path segment \u2014 use '(${part})' instead; see ADR-0010`
      );
    } else {
      throw new Error(
        `parsePath: invalid segment '${part}' in path '${pathStr}' \u2014 must be a numeric index, '_' (wildcard), '(name)' (kind-match), or 'name:' (field traversal)`
      );
    }
  }
  return segments;
}
var membersOf = (r) => r.members;
var contentOf = (r) => r.content;
function applyPath(rule, segments, patch, precStack) {
  if (segments.length === 0) {
    return typeof patch === "function" ? patch(rule, precStack) : patch;
  }
  if (isPrecWrapper(rule)) {
    return descendThroughPrecWrapper(rule, segments, patch, precStack);
  }
  if (isEnrichGroupLiftSymbol(rule)) {
    return descendThroughGroupLiftSymbol(rule, segments, patch, precStack);
  }
  if (isEnrichContentAlias(rule)) {
    return descendThroughEnrichContentAlias(rule, segments, patch, precStack);
  }
  const [head, ...rest] = segments;
  const t = rule.type;
  switch (head.kind) {
    case "kind-match":
      return dispatchKindMatch(rule, head.name, rest, patch, precStack);
    case "fieldName":
      return descendThroughNamedField(rule, head.name, rest, patch, precStack);
    case "index":
    case "wildcard": {
      if (isContainerType(t)) {
        return applyToMembers(rule, head, rest, patch, precStack);
      }
      if (isWrapperType(t)) {
        return descendThroughSingleWrapper(rule, head, rest, patch, precStack);
      }
      if (t === "ALIAS") {
        return descendThroughAlias(rule, head, rest, patch, precStack);
      }
      throw new ApplyPathSkip(
        `applyPath: cannot descend into '${rule.type}' rule (path has ${segments.length} segments left)`
      );
    }
    default: {
      const _exhaustive = head;
      throw new Error(`applyPath: unknown segment kind '${_exhaustive.kind}'`);
    }
  }
}
function descendThroughPrecWrapper(rule, segments, patch, precStack) {
  const newStack = precStack ? [...precStack, rule] : [rule];
  const newContent = applyPath(contentOf(rule), segments, patch, newStack);
  return reconstructPrec(rule, newContent);
}
function isEnrichGroupLiftSymbol(rule) {
  const t = rule.type;
  if (t !== "SYMBOL") return false;
  const meta = rule.metadata;
  return meta?.author === "enrich";
}
var groupLiftRuleMap;
function setGroupLiftRuleMap(map) {
  groupLiftRuleMap = map;
}
function descendThroughGroupLiftSymbol(rule, segments, patch, precStack) {
  const name = rule.name;
  if (!name) {
    throw new ApplyPathSkip("applyPath: enrich group-lift symbol has no name to resolve its body");
  }
  const body = groupLiftRuleMap?.get(name);
  if (body === void 0) {
    throw new ApplyPathSkip(
      `applyPath: enrich group-lift symbol '${name}' \u2014 referenced rule not found in the group-lift rule map (enrich resolver not registered, or the name was pruned)`
    );
  }
  const newBody = applyPath(body, segments, patch, precStack);
  groupLiftRuleMap?.set(name, newBody);
  return rule;
}
function isEnrichContentAlias(rule) {
  const t = rule.type;
  if (t !== "ALIAS") return false;
  const meta = rule.metadata;
  return meta?.author === "enrich";
}
function descendThroughEnrichContentAlias(rule, segments, patch, precStack) {
  const body = rule.content;
  if (body === void 0) {
    throw new ApplyPathSkip("applyPath: enrich content-alias has no content to travel through");
  }
  const newBody = applyPath(body, segments, patch, precStack);
  return { ...rule, content: newBody };
}
function descendThroughSingleWrapper(rule, head, rest, patch, precStack) {
  switch (head.kind) {
    case "wildcard": {
      const newContent = applyPath(contentOf(rule), rest, patch, precStack);
      return reconstructWrapper(rule, newContent);
    }
    case "index": {
      if (head.value === 0 || head.value === -1) {
        const newContent = applyPath(contentOf(rule), rest, patch, precStack);
        return reconstructWrapper(rule, newContent);
      }
      throw new ApplyPathSkip(
        `applyPath: index ${head.value} out of bounds \u2014 '${rule.type}' wraps a single content rule (only index 0 / -1 is valid)`
      );
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
function descendThroughAlias(rule, head, rest, patch, precStack) {
  switch (head.kind) {
    case "wildcard": {
      const newContent = applyPath(contentOf(rule), rest, patch, precStack);
      return reconstructAlias(rule, newContent);
    }
    case "index": {
      if (head.value === 0 || head.value === -1) {
        const newContent = applyPath(contentOf(rule), rest, patch, precStack);
        return reconstructAlias(rule, newContent);
      }
      throw new ApplyPathSkip(
        `applyPath: index ${head.value} out of bounds \u2014 '${rule.type}' wraps a single content rule (only index 0 / -1 is valid)`
      );
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
function reconstructAlias(rule, newContent) {
  return {
    ...rule,
    content: newContent
  };
}
function descendThroughNamedField(rule, fieldName, rest, patch, precStack) {
  if (!isFieldType(rule.type)) {
    throw new Error(
      `applyPath: path segment '${fieldName}:' at this level expects a field('${fieldName}', ...) wrapper; got type '${rule.type}'`
    );
  }
  const actualName = rule.name;
  if (actualName !== fieldName) {
    throw new Error(
      `applyPath: path segment '${fieldName}:' doesn't match field name '${actualName}' at this position`
    );
  }
  const newContent = applyPath(contentOf(rule), rest, patch, precStack);
  return reconstructWrapper(rule, newContent);
}
function dispatchKindMatch(rule, kindName, rest, patch, precStack) {
  return applyKindMatch(rule, kindName, rest, patch, precStack, false);
}
function applyKindMatch(rule, targetKind, rest, patch, precStack, insideNamedField) {
  const result = walkKindMatch(rule, targetKind, rest, patch, precStack, insideNamedField);
  if (!result.matched) {
    throw new ApplyPathSkip(`applyPath: kind '${targetKind}' matched zero occurrences in this subtree`);
  }
  return result.rule;
}
function applyKindMatchToSymbol(rule, targetKind, rest, patch, precStack, insideNamedField) {
  const name = rule.name;
  if (name !== targetKind) return { rule, matched: false };
  if (insideNamedField) return { rule, matched: false };
  const patched = rest.length === 0 ? typeof patch === "function" ? patch(rule, precStack) : patch : applyPath(rule, rest, patch, precStack);
  return { rule: patched, matched: true };
}
function walkKindMatch(rule, targetKind, rest, patch, precStack, insideNamedField) {
  if (!isWalkableNode(rule)) {
    return { rule, matched: false };
  }
  const t = rule.type;
  if (isPrecWrapper(rule)) {
    const stack = precStack ? [...precStack, rule] : [rule];
    const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, stack, insideNamedField);
    return {
      rule: inner.matched ? reconstructPrec(rule, inner.rule) : rule,
      matched: inner.matched
    };
  }
  if (t === "SYMBOL") {
    return applyKindMatchToSymbol(rule, targetKind, rest, patch, precStack, insideNamedField);
  }
  if (t === "FIELD") {
    const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, precStack, true);
    return {
      rule: inner.matched ? reconstructWrapper(rule, inner.rule) : rule,
      matched: inner.matched
    };
  }
  if (isWrapperType(t)) {
    const inner = walkKindMatch(contentOf(rule), targetKind, rest, patch, precStack, insideNamedField);
    return {
      rule: inner.matched ? reconstructWrapper(rule, inner.rule) : rule,
      matched: inner.matched
    };
  }
  if (isContainerType(t)) {
    const members = [...membersOf(rule)];
    let anyMatched = false;
    for (let i = 0; i < members.length; i++) {
      const inner = walkKindMatch(members[i], targetKind, rest, patch, precStack, insideNamedField);
      if (inner.matched) {
        members[i] = inner.rule;
        anyMatched = true;
      }
    }
    return {
      rule: anyMatched ? reconstructContainer(rule, members) : rule,
      matched: anyMatched
    };
  }
  return { rule, matched: false };
}
function isWalkableNode(rule) {
  return rule !== null && rule !== void 0 && typeof rule === "object" && typeof rule.type === "string";
}
function reconstructContainer(rule, members) {
  const t = rule.type;
  if (isSeqType(t)) return nativeRequired("seq")(...members);
  if (isChoiceType(t)) return nativeRequired("choice")(...members);
  throw new Error(`reconstructContainer: unknown container type '${t}'`);
}
function reconstructWrapper(rule, newContent) {
  const t = rule.type;
  if (t === "OPTIONAL") return nativeRequired("optional")(newContent);
  if (t === "REPEAT" || t === "REPEAT1") {
    return reconstructRepeatWithMetadata(rule, newContent);
  }
  if (isFieldType(t)) {
    const name = rule.name;
    return nativeRequired("field")(name, newContent);
  }
  throw new Error(
    `reconstructWrapper: no native dsl reconstruction for wrapper type '${rule.type}' \u2014 this is a bug in the path-descent logic.`
  );
}
function reconstructRepeatWithMetadata(rule, newContent) {
  const r = rule;
  const t = r.type;
  const baseNode = nativeRequired(t === "REPEAT" ? "repeat" : "repeat1")(newContent);
  if (r.separator !== void 0) baseNode.separator = r.separator;
  if (r.leading !== void 0) baseNode.leading = r.leading;
  if (r.trailing !== void 0) baseNode.trailing = r.trailing;
  return baseNode;
}
var PREC_VARIANT_MAP = {
  PREC_LEFT: "left",
  PREC_RIGHT: "right",
  PREC_DYNAMIC: "dynamic"
};
function reconstructPrec(rule, newContent) {
  const t = rule.type;
  const value = rule.value ?? 0;
  const prec2 = nativeRequired("prec");
  const variant2 = PREC_VARIANT_MAP[t];
  if (variant2) {
    const fn = prec2[variant2];
    if (typeof fn !== "function") throw new Error(`transform: native prec.${variant2} not available`);
    return fn(value, newContent);
  }
  return prec2(value, newContent);
}
function wrapInPrecStack(content, precStack, reconstructPrec2) {
  if (!precStack?.length) return content;
  let result = content;
  for (let i = precStack.length - 1; i >= 0; i--) {
    result = reconstructPrec2(precStack[i], result);
  }
  return result;
}
function applyToMembers(rule, head, rest, patch, precStack) {
  const members = [...membersOf(rule)];
  switch (head.kind) {
    case "index":
      return applyToIndexedMember(rule, members, head.value, rest, patch, precStack);
    case "wildcard":
      return applyWildcardToMembers(rule, members, rest, patch, precStack);
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
function applyToIndexedMember(rule, members, indexValue, rest, patch, precStack) {
  const idx = indexValue < 0 ? members.length + indexValue : indexValue;
  if (idx < 0 || idx >= members.length) {
    throw new ApplyPathSkip(`applyPath: index ${indexValue} out of bounds in ${rule.type} of length ${members.length}`);
  }
  members[idx] = applyPath(members[idx], rest, patch, precStack);
  return reconstructContainer(rule, members);
}
function applyWildcardToMembers(rule, members, rest, patch, precStack) {
  if (members.length === 0) {
    throw new ApplyPathSkip(`applyPath: wildcard matched zero members in empty ${rule.type}`);
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
      `applyPath: wildcard matched zero members successfully in ${rule.type} of length ${members.length}`
    );
  }
  return reconstructContainer(rule, members);
}

// packages/codegen/src/dsl/primitives/variant.ts
function isVariantPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "variant";
}
function variant(name) {
  return { __sittirPlaceholder: "variant", name };
}

// packages/codegen/src/dsl/primitives/alias.ts
function isAliasPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "alias";
}
function alias(rule, value) {
  if (typeof rule === "string" && value === void 0) {
    return {
      __sittirPlaceholder: "alias",
      name: rule
    };
  }
  const native = globalThis.alias;
  if (typeof native !== "function") {
    throw new Error(
      "alias(): no global alias() found \u2014 must be called inside a runtime that injects alias() (sittir evaluate.ts or tree-sitter CLI)"
    );
  }
  if (value !== void 0) {
    return native(rule, value);
  }
  return native(rule, rule);
}

// packages/codegen/src/types/rule-types.ts
var SEQ = "SEQ";
var OPTIONAL = "OPTIONAL";
var CHOICE = "CHOICE";
var REPEAT = "REPEAT";
var REPEAT1 = "REPEAT1";
var STRING = "STRING";
var PATTERN = "PATTERN";
var TOKEN = "TOKEN";

// packages/codegen/src/dsl/rule-metadata.ts
function makeRuleMetadata(shape) {
  return shape;
}

// packages/codegen/src/dsl/list-patterns.ts
function firstStringOfChoice(r) {
  if (!typeEq(r.type, "CHOICE")) return null;
  const members = r.members ?? [];
  const lit = members.find((m) => typeEq(m.type, "STRING"));
  return lit ? lit.value : null;
}
function detectRepeatSeparator(resolved) {
  if (!typeEq(resolved.type, "SEQ")) return null;
  const members = resolved.members;
  if (!members || members.length !== 2) return null;
  const [first, second] = members;
  const firstStr = typeEq(first.type, "STRING") ? first.value : null;
  const secondStr = typeEq(second.type, "STRING") ? second.value : null;
  if (firstStr !== null && secondStr === null) return { content: second, separator: firstStr };
  if (secondStr !== null && firstStr === null) return { content: first, separator: secondStr, trailing: true };
  const firstSepChoice = typeEq(first.type, "CHOICE") ? firstStringOfChoice(first) : null;
  const secondSepChoice = typeEq(second.type, "CHOICE") ? firstStringOfChoice(second) : null;
  if (firstSepChoice !== null && secondStr === null) return { content: second, separator: firstSepChoice };
  if (secondSepChoice !== null && firstStr === null) return { content: first, separator: secondSepChoice, trailing: true };
  return null;
}

// packages/codegen/src/dsl/group-classify.ts
function ruleMatchesEmpty(rule) {
  if (!rule || typeof rule !== "object") return false;
  const r = rule;
  const t = typeof r.type === "string" ? r.type : "";
  if (isOptionalType(t) || isPlainRepeatType2(t) || isBlankType(t)) return true;
  if (typeEq(t, "REPEAT1")) {
    return ruleMatchesEmpty(r.content);
  }
  if (isSeqType(t)) {
    const members = r.members;
    if (!Array.isArray(members) || members.length === 0) return true;
    return members.every((m) => ruleMatchesEmpty(m));
  }
  if (typeEq(t, "CHOICE")) {
    const members = r.members;
    if (!Array.isArray(members)) return false;
    return members.some((m) => ruleMatchesEmpty(m));
  }
  if (isFieldType(t) || isPrecWrapper(r)) {
    return ruleMatchesEmpty(r.content);
  }
  if (isStringType(t) || isSymbolType(t) || typeEq(t, "TOKEN") || typeEq(t, "PATTERN")) return false;
  return false;
}
function isPlainRepeatType2(t) {
  return t === "REPEAT";
}
function collectSlots(members) {
  const slots = [];
  for (const m of members) {
    if (!m || typeof m !== "object") continue;
    const r = m;
    const t = typeof r.type === "string" ? r.type : "";
    if (isStringType(t) || typeEq(t, "TOKEN") || isBlankType(t)) continue;
    slots.push(m);
  }
  return slots;
}
function unwrapPrec(rule) {
  let cur = rule;
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
function isInlineSafe(seqBody) {
  if (!seqBody || typeof seqBody !== "object") return false;
  const r = seqBody;
  const t = typeof r.type === "string" ? r.type : "";
  if (isRepeatLike(t)) return true;
  if (!isSeqType(t)) return false;
  const members = r.members;
  if (!Array.isArray(members)) return false;
  if (seqHasTopLevelRepeat(members)) return true;
  const slots = collectSlots(members);
  if (slots.length !== 1) return false;
  const core = unwrapPrec(slots[0]);
  if (!core || typeof core !== "object") return false;
  const coreType = core.type;
  if (typeof coreType !== "string") return false;
  return isFieldType(coreType) || isSymbolType(coreType);
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
function ruleToRegexSource(rule) {
  const shaped = rule;
  switch (rule.type) {
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

// packages/codegen/src/dsl/enrich.ts
function enrich(baseInput) {
  const base2 = baseInput;
  if (!base2 || typeof base2 !== "object") {
    throw new Error("enrich(): expected a grammar object, got " + typeof base2);
  }
  const hasWrapper = "grammar" in base2;
  const rulesBag = hasWrapper ? base2.grammar?.rules : base2.rules;
  if (!rulesBag) return base2;
  const grammarMeta = hasWrapper ? base2.grammar : base2;
  const wordMatcher = compileWordMatcher(extractWordName(grammarMeta?.word), rulesBag);
  const supertypeNames = extractSupertypeNames(base2, hasWrapper);
  const kwRules = {};
  const clauseGroupRules = {};
  const clauseDedupeMap = {};
  const groupDedupeMap = {};
  const visibleGroupHiddenNames = /* @__PURE__ */ new Set();
  const enrichedRules = {};
  for (const name of Object.keys(rulesBag)) {
    const rule = rulesBag[name];
    enrichedRules[name] = rule ? applyEnrichPasses(name, rule, kwRules, supertypeNames, rulesBag, clauseGroupRules, clauseDedupeMap, groupDedupeMap, visibleGroupHiddenNames, wordMatcher) : rule;
  }
  const mergedRules = { ...enrichedRules, ...kwRules, ...clauseGroupRules };
  setGroupLiftRuleMap({
    get: (n) => mergedRules[n],
    set: (n, b) => {
      mergedRules[n] = b;
    }
  });
  const clauseGroupNames = new Set(
    Object.keys(clauseGroupRules).filter((n) => !visibleGroupHiddenNames.has(n))
  );
  const result = hasWrapper ? { ...base2, grammar: { ...base2.grammar, rules: mergedRules } } : { ...base2, rules: mergedRules };
  if (clauseGroupNames.size > 0) {
    Object.defineProperty(result, ENRICH_CLAUSE_GROUPS_KEY, {
      value: clauseGroupNames,
      enumerable: false,
      writable: false,
      configurable: true
    });
  }
  return result;
}
var ENRICH_CLAUSE_GROUPS_KEY = "__enrichedClauseGroups__";
function getEnrichClauseGroups(grammar2) {
  if (!grammar2 || typeof grammar2 !== "object") return /* @__PURE__ */ new Set();
  const names = grammar2[ENRICH_CLAUSE_GROUPS_KEY];
  if (names instanceof Set) return names;
  return /* @__PURE__ */ new Set();
}
function applyEnrichPasses(ruleName, rule, kwRules, supertypeNames, rulesBag, clauseGroupRules, clauseDedupeMap, groupDedupeMap, visibleGroupHiddenNames, wordMatcher) {
  const MAX_ITERATIONS = 8;
  let r = rule;
  let converged = false;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const before = r;
    r = applySymbolToField(ruleName, r, supertypeNames);
    r = applyOptionalKeyword(ruleName, r, kwRules, wordMatcher);
    if (r === before) {
      converged = true;
      break;
    }
  }
  if (!converged && !process.env.SITTIR_QUIET) {
    process.stderr.write(`enrich: fixed-point did not converge for '${ruleName}' after ${MAX_ITERATIONS} iterations
`);
  }
  const clauseHoistCounter = { opt: 0, grp: 0 };
  r = applyClauseHoist(ruleName, r, rulesBag, clauseGroupRules, clauseDedupeMap, clauseHoistCounter, groupDedupeMap, visibleGroupHiddenNames);
  return r;
}
function extractSupertypeNames(base2, hasWrapper) {
  const root = hasWrapper ? base2.grammar : base2;
  const supertypes = root?.supertypes;
  if (typeof supertypes === "function") {
    const dollar = new Proxy(
      {},
      {
        get(_t, prop) {
          if (typeof prop === "string") return { type: "SYMBOL", name: prop };
          return void 0;
        }
      }
    );
    let result;
    try {
      result = supertypes(dollar);
    } catch {
      return /* @__PURE__ */ new Set();
    }
    return harvestSupertypeNames(result);
  }
  if (Array.isArray(supertypes)) return harvestSupertypeNames(supertypes);
  return /* @__PURE__ */ new Set();
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
function makeSymbol(name) {
  const symFn = nativeRuleFn("sym");
  return symFn(name);
}
function registerKwRule(stringLiteral, keyword, kwRules) {
  const hiddenName = `_kw_${keyword}`;
  if (!(hiddenName in kwRules)) {
    kwRules[hiddenName] = stringLiteral;
  }
  return makeSymbol(hiddenName);
}
function normalizeMember(m) {
  if (typeof m === "string") return { type: "STRING", value: m };
  if (m instanceof RegExp) return { type: "PATTERN", value: m.source };
  return m ?? { type: "UNKNOWN" };
}
function collectFieldNamesRuntime(rule) {
  const names = /* @__PURE__ */ new Set();
  if (!isSeqType(rule.type)) return names;
  const members = rule.members;
  for (const raw of members) {
    const m = normalizeMember(raw);
    if (isFieldType(m.type) && typeof m.name === "string") {
      names.add(m.name);
      continue;
    }
    const peeled = peelOptional(m);
    if (peeled.isOptional) {
      const innerN = normalizeMember(peeled.inner);
      if (isFieldType(innerN.type) && typeof innerN.name === "string") {
        names.add(innerN.name);
      }
    }
  }
  return names;
}
function peelOptional(rule) {
  if (isOptionalType(rule.type)) {
    return {
      inner: rule.content,
      isOptional: true
    };
  }
  if (isChoiceType(rule.type)) {
    const members = rule.members;
    if (members.length === 2) {
      const blankIdx = members.findIndex((m) => m.type === "BLANK");
      if (blankIdx !== -1) {
        const inner = members[1 - blankIdx];
        return { inner, isOptional: true };
      }
    }
  }
  return { inner: rule, isOptional: false };
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
  const peeled = peelOptional(member);
  if (!peeled.isOptional) return null;
  const innerN = normalizeMember(peeled.inner);
  if (isSymbolType(innerN.type) && typeof innerN.name === "string") {
    return {
      name: innerN.name,
      symbolRule: peeled.inner,
      wrap: (fieldNode) => rebuildOptional(member, fieldNode)
    };
  }
  if (!isSeqType(innerN.type)) return null;
  const seqMembers = peeled.inner.members;
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
  const seqRule = peeled.inner;
  return {
    name: sn.name,
    symbolRule: symMember,
    wrap: (fieldNode) => {
      const newSeqMembers = seqMembers.map((mm, i) => i === symIdx ? fieldNode : mm);
      const newSeq = { ...seqRule, members: newSeqMembers };
      return rebuildOptional(member, newSeq);
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
function applySymbolToField(ruleName, rule, supertypeNames) {
  if (ruleName.startsWith("_")) return rule;
  const precStack = [];
  let cursor = rule;
  while (isPrecWrapper(cursor)) {
    precStack.push(cursor);
    cursor = cursor.content;
  }
  if (!isSeqType(cursor.type)) {
    return tryPromoteInRepeatSeq(ruleName, rule, cursor, precStack, supertypeNames);
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
  const finalMembers = promoteInsideRepeatMembers(ruleName, newMembers, supertypeNames, existing, combinedKindCounts);
  if (finalMembers === newMembers && !changed) return rule;
  let result = { ...cursor, members: finalMembers };
  for (let i = precStack.length - 1; i >= 0; i--) {
    result = { ...precStack[i], content: result };
  }
  return result;
}
function promoteInsideRepeatMembers(ruleName, members, supertypeNames, existing, outerKindCounts) {
  let anyRepeatChanged = false;
  const result = members.map((m) => {
    const rebuilt = tryPromoteInRepeatMember(ruleName, m, supertypeNames, existing, outerKindCounts);
    if (rebuilt === null) return m;
    anyRepeatChanged = true;
    return rebuilt;
  });
  if (!anyRepeatChanged) return members;
  return result;
}
function tryPromoteInRepeatMember(ruleName, member, supertypeNames, existing, outerKindCounts) {
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
  let rebuilt = { ...inner, members: newInnerMembers };
  for (let i = innerPrecStack.length - 1; i >= 0; i--) {
    rebuilt = { ...innerPrecStack[i], content: rebuilt };
  }
  rebuilt = { ...cursor, content: rebuilt };
  for (let i = memberPrecStack.length - 1; i >= 0; i--) {
    rebuilt = { ...memberPrecStack[i], content: rebuilt };
  }
  return rebuilt;
}
function tryPromoteInRepeatSeq(ruleName, rule, cursor, outerPrecStack, supertypeNames) {
  if (!isRepeatType(cursor.type)) return rule;
  let inner = cursor.content;
  const innerPrecStack = [];
  while (isPrecWrapper(inner)) {
    innerPrecStack.push(inner);
    inner = inner.content;
  }
  if (!isSeqType(inner.type)) return rule;
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
  if (!changed) return rule;
  let result = { ...inner, members: newMembers };
  for (let i = innerPrecStack.length - 1; i >= 0; i--) {
    result = { ...innerPrecStack[i], content: result };
  }
  result = { ...cursor, content: result };
  for (let i = outerPrecStack.length - 1; i >= 0; i--) {
    result = { ...outerPrecStack[i], content: result };
  }
  return result;
}
function applyOptionalKeyword(ruleName, rule, kwRules, wordMatcher) {
  const inner = peelPrec(rule);
  const claimed = isSeqType(inner.type) ? collectFieldNamesRuntime(inner) : /* @__PURE__ */ new Set();
  return walkOptionalKeyword(ruleName, rule, claimed, kwRules, wordMatcher) ?? rule;
}
function peelPrec(rule) {
  let cursor = rule;
  while (isPrecWrapper(cursor)) {
    cursor = cursor.content;
  }
  return cursor;
}
function walkOptionalKeyword(ruleName, rule, claimedAtSeqLevel, kwRules, wordMatcher) {
  if (isSeqType(rule.type)) {
    const members = rule.members;
    let changed = false;
    const newMembers = members.map((m) => {
      const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules, wordMatcher);
      if (out === null) return m;
      changed = true;
      return out;
    });
    return changed ? { ...rule, members: newMembers } : null;
  }
  if (isChoiceType(rule.type)) {
    const members = rule.members;
    let changed = false;
    const newMembers = members.map((m) => {
      const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules, wordMatcher);
      if (out === null) return m;
      changed = true;
      return out;
    });
    return changed ? { ...rule, members: newMembers } : null;
  }
  const peeled = peelOptional(rule);
  if (peeled.isOptional) {
    const replacement = tryPromoteInnerKeyword(ruleName, rule, peeled.inner, claimedAtSeqLevel, kwRules, wordMatcher);
    if (replacement !== null) return replacement;
    const innerRewritten = walkOptionalKeyword(ruleName, peeled.inner, claimedAtSeqLevel, kwRules, wordMatcher);
    if (innerRewritten !== null) {
      return rebuildOptional(rule, innerRewritten);
    }
    return null;
  }
  if (isRepeatType(rule.type) || isFieldType(rule.type)) {
    const content = rule.content;
    const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules, wordMatcher);
    if (out === null) return null;
    return { ...rule, content: out };
  }
  if (isPrecWrapper(rule)) {
    const content = rule.content;
    const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules, wordMatcher);
    if (out === null) return null;
    return { ...rule, content: out };
  }
  return null;
}
function tryPromoteInnerKeyword(ruleName, optionalRule, inner, claimed, kwRules, wordMatcher) {
  const innerNorm = normalizeMember(inner);
  if (!isStringType(innerNorm.type)) return null;
  const kw = innerNorm.value;
  if (typeof kw !== "string" || !matchesWordShape(kw, wordMatcher)) return null;
  const fieldName = `${kw}_marker`;
  if (claimed.has(fieldName)) {
    reportSkip("optional-keyword-prefix", ruleName, `field '${fieldName}' already exists`);
    return null;
  }
  claimed.add(fieldName);
  const symbolRef = registerKwRule(inner, fieldName, kwRules);
  const fieldNode = makeField(fieldName, symbolRef);
  return rebuildOptional(optionalRule, fieldNode);
}
function rebuildOptional(optionalRule, newInner) {
  if (isOptionalType(optionalRule.type)) {
    return { ...optionalRule, content: newInner };
  }
  const members = optionalRule.members;
  const newMembers = members.map((m) => {
    const t = m.type;
    return t === "BLANK" ? m : newInner;
  });
  return { ...optionalRule, members: newMembers };
}
function canonicalStringifyClause(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map((v) => canonicalStringifyClause(v)).join(",") + "]";
  }
  const obj = value;
  const keys = Object.keys(obj).sort();
  const parts = [];
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "function" || typeof v === "undefined") continue;
    parts.push(JSON.stringify(k) + ":" + canonicalStringifyClause(v));
  }
  return "{" + parts.join(",") + "}";
}
function peelOptionalSeq(rule) {
  if (isOptionalType(rule.type)) {
    const content = rule.content;
    if (content && isSeqType(content.type)) {
      return { seqBody: content, form: "optional", seqIdx: -1 };
    }
    return null;
  }
  if (isChoiceType(rule.type)) {
    const members = rule.members;
    if (!Array.isArray(members) || members.length !== 2) return null;
    const blankIdx = members.findIndex((m) => isBlankType(m?.type));
    const seqIdx = members.findIndex((m) => isSeqType(m.type));
    if (blankIdx === -1 || seqIdx === -1 || blankIdx === seqIdx) return null;
    return { seqBody: members[seqIdx], form: "choice", seqIdx };
  }
  return null;
}
function listSeparatorOfOptionalSeq(rule) {
  const peeled = peelOptionalSeq(rule);
  if (peeled === null) return null;
  const seqMembers = peeled.seqBody.members;
  if (!Array.isArray(seqMembers)) return null;
  for (const m of seqMembers) {
    if (!isRepeatType(m.type)) continue;
    const sepAttr = m.separator;
    if (typeof sepAttr === "string") return sepAttr;
    const content = m.content;
    if (content) {
      const detected = detectRepeatSeparator(content);
      if (detected) return detected.separator;
    }
  }
  return null;
}
function optionalStringLiteral(rule) {
  const peeled = peelOptional(rule);
  if (!peeled.isOptional) return null;
  const innerN = normalizeMember(peeled.inner);
  if (isStringType(innerN.type) && typeof innerN.value === "string") return innerN.value;
  return null;
}
function appendTrailingMemberToOptionalSeq(optSeqRule, trailingOptional) {
  const peeled = peelOptionalSeq(optSeqRule);
  const seqBody = peeled.seqBody;
  const seqMembers = seqBody.members;
  const newSeqBody = { ...seqBody, members: [...seqMembers, trailingOptional] };
  return rebuildOptional(optSeqRule, newSeqBody);
}
function absorbTrailingListSeparators(members) {
  let changed = false;
  const out = [];
  for (let i = 0; i < members.length; i++) {
    const cur = members[i];
    const next = members[i + 1];
    const sep = next ? listSeparatorOfOptionalSeq(cur) : null;
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
function applyClauseHoist(parentKind, rule, rulesBag, clauseGroupRules, dedupeMap, counter, groupDedupeMap, visibleGroupHiddenNames) {
  const peeled = peelOptionalSeq(rule);
  if (peeled !== null) {
    const recursedSeqBody = applyClauseHoist(parentKind, peeled.seqBody, rulesBag, clauseGroupRules, dedupeMap, counter, groupDedupeMap, visibleGroupHiddenNames);
    if (ruleMatchesEmpty(recursedSeqBody)) {
      counter.opt += 1;
      if (recursedSeqBody === peeled.seqBody) return rule;
      if (peeled.form === "optional") {
        return rebuildOptional(rule, recursedSeqBody);
      } else {
        const members = rule.members;
        const newMembers = members.slice();
        newMembers[peeled.seqIdx] = recursedSeqBody;
        return { ...rule, members: newMembers };
      }
    } else if (isInlineSafe(recursedSeqBody)) {
      const name = clauseHoistSynthName(recursedSeqBody, parentKind, dedupeMap, counter, rulesBag, clauseGroupRules);
      if (name !== null) {
        const symbolRef = makeGroupLiftSymbol(rule, name);
        if (peeled.form === "optional") {
          return rebuildOptional(rule, symbolRef);
        } else {
          const members = rule.members;
          const newMembers = members.slice();
          newMembers[peeled.seqIdx] = symbolRef;
          return { ...rule, members: newMembers };
        }
      }
      return rule;
    } else {
      counter.opt += 1;
      const names = visibleGroupSynthName(recursedSeqBody, parentKind, groupDedupeMap, counter, rulesBag, clauseGroupRules);
      if (names !== null) {
        visibleGroupHiddenNames.add(names.hiddenName);
        const symbolRef = makeGroupLiftSymbol(rule, names.hiddenName);
        const aliasRule = makeVisibleGroupAlias(symbolRef, names.visibleName);
        if (peeled.form === "optional") {
          return rebuildOptional(rule, aliasRule);
        } else {
          const members = rule.members;
          const newMembers = members.slice();
          newMembers[peeled.seqIdx] = aliasRule;
          return { ...rule, members: newMembers };
        }
      }
      if (recursedSeqBody === peeled.seqBody) return rule;
      if (peeled.form === "optional") {
        return rebuildOptional(rule, recursedSeqBody);
      } else {
        const members = rule.members;
        const newMembers = members.slice();
        newMembers[peeled.seqIdx] = recursedSeqBody;
        return { ...rule, members: newMembers };
      }
    }
  }
  if (isSeqType(rule.type)) {
    const rawMembers = rule.members;
    if (!Array.isArray(rawMembers)) return rule;
    const absorbed = absorbTrailingListSeparators(rawMembers);
    const members = absorbed ?? rawMembers;
    let changed = absorbed !== null;
    const newMembers = members.map((m) => {
      const out = applyClauseHoist(parentKind, m, rulesBag, clauseGroupRules, dedupeMap, counter, groupDedupeMap, visibleGroupHiddenNames);
      if (out !== m) changed = true;
      return out;
    });
    return changed ? { ...rule, members: newMembers } : rule;
  }
  if (isChoiceType(rule.type)) {
    const members = rule.members;
    if (!Array.isArray(members)) return rule;
    let changed = false;
    const newMembers = members.map((m) => {
      const out = applyClauseHoist(parentKind, m, rulesBag, clauseGroupRules, dedupeMap, counter, groupDedupeMap, visibleGroupHiddenNames);
      if (out !== m) changed = true;
      return out;
    });
    return changed ? { ...rule, members: newMembers } : rule;
  }
  if (isRepeatType(rule.type) || isPrecWrapper(rule)) {
    const content = rule.content;
    if (!content) return rule;
    const newContent = applyClauseHoist(parentKind, content, rulesBag, clauseGroupRules, dedupeMap, counter, groupDedupeMap, visibleGroupHiddenNames);
    if (newContent === content) return rule;
    return { ...rule, content: newContent };
  }
  if (isFieldType(rule.type)) {
    const content = rule.content;
    if (!content) return rule;
    const newContent = applyClauseHoist(parentKind, content, rulesBag, clauseGroupRules, dedupeMap, counter, groupDedupeMap, visibleGroupHiddenNames);
    if (newContent === content) return rule;
    return { ...rule, content: newContent };
  }
  return rule;
}
function clauseHoistSynthName(seqBody, parentKind, dedupeMap, counter, rulesBag, clauseGroupRules) {
  const key = canonicalStringifyClause(seqBody);
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
function visibleGroupSynthName(content, parentKind, groupDedupeMap, counter, rulesBag, clauseGroupRules) {
  const key = canonicalStringifyClause(content);
  const existing = groupDedupeMap[key];
  if (existing !== void 0) {
    const hiddenName2 = `_${existing}`;
    if (!(hiddenName2 in clauseGroupRules)) clauseGroupRules[hiddenName2] = content;
    return { visibleName: existing, hiddenName: hiddenName2 };
  }
  counter.grp += 1;
  const visibleName = `${parentKind.replace(/^_+/, "")}_group${counter.grp}`;
  const hiddenName = `_${visibleName}`;
  if (visibleName in rulesBag || hiddenName in rulesBag) {
    process.stderr.write(
      `enrich: visible-group skipped for '${parentKind}' \u2014 rule '${visibleName}'/'${hiddenName}' already exists in base.grammar.rules
`
    );
    return null;
  }
  groupDedupeMap[key] = visibleName;
  clauseGroupRules[hiddenName] = content;
  return { visibleName, hiddenName };
}
function makeGroupLiftSymbol(_referenceRule, name) {
  const symbol = nativeRuleFn("symbol", "sym");
  const base2 = symbol(name);
  return {
    ...base2,
    metadata: makeRuleMetadata({ author: "enrich", symbolSource: "group-lift" })
  };
}
function makeVisibleGroupAlias(symbolRef, name) {
  const aliasFn = nativeRuleFn("alias");
  const symbol = nativeRuleFn("symbol", "sym");
  return { ...aliasFn(symbolRef, symbol(name)), metadata: makeRuleMetadata({ author: "enrich" }) };
}

// packages/codegen/src/dsl/wire/wire.ts
var currentContext = null;
function wireRegisterSyntheticRule(name, content) {
  if (!currentContext) return false;
  currentContext.deposits.set(name, content);
  return true;
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
function wireRegisterRefineForms(kind, forms) {
  if (!currentContext) return false;
  currentContext.refineForms.set(kind, forms);
  return true;
}
function wireGetCurrentRuleKind() {
  return currentContext?.currentRuleKind ?? null;
}
function wire(config, base2) {
  const cfg = config;
  const baseArg = base2;
  const context = {
    deposits: /* @__PURE__ */ new Map(),
    syntheticInline: /* @__PURE__ */ new Set(),
    conflictGroups: [],
    refineForms: /* @__PURE__ */ new Map(),
    groups: cfg.groups,
    polymorphsConfig: cfg.polymorphs,
    renderAs: cfg.renderAs,
    currentRuleKind: null,
    authoredRuleNames: new Set(Object.keys(cfg.rules ?? {}))
  };
  const polymorphs = cfg.polymorphs ?? {};
  const transforms = cfg.transforms ?? {};
  const outRules = { ...cfg.rules };
  composeOrSynthesizeTransformParents(outRules, transforms);
  composeOrSynthesizePolymorphParents(outRules, polymorphs, context);
  injectHiddenRulePlaceholders(outRules, polymorphs, context);
  injectTransformHiddenRulePlaceholders(outRules, transforms, context);
  if (baseArg && cfg.groups && hasBodyPatternGroups(cfg.groups)) {
    const baseRules = baseArg.grammar?.rules ?? baseArg.rules ?? {};
    for (const baseName of Object.keys(baseRules)) {
      if (baseName in outRules) continue;
      outRules[baseName] = passthroughBaseRuleFn;
    }
  }
  wrapAllRuleFns(outRules, context);
  applyWirePatternReplacement(outRules, context.authoredRuleNames, cfg.groups, context);
  if (baseArg) {
    for (const name of getEnrichClauseGroups(base2)) {
      context.syntheticInline.add(name);
    }
    applyWirePatternReplacement(outRules, context.authoredRuleNames, cfg.groups, context);
  }
  const conflicts = wrapConflictsCallback(cfg.conflicts, context);
  const inline = wrapInlineCallback(cfg.inline, context);
  const wired = {
    ...cfg,
    rules: outRules,
    ...conflicts === void 0 ? {} : { conflicts },
    ...inline === void 0 ? {} : { inline }
  };
  Object.defineProperty(wired, "__wireContext__", {
    value: context,
    enumerable: false,
    configurable: true
  });
  return wired;
}
function composeOrSynthesizePolymorphParents(rules, polymorphs, context) {
  for (const [parent, armMap] of Object.entries(polymorphs)) {
    if (!armMap) continue;
    const userFn = rules[parent];
    rules[parent] = buildPolymorphParentFn(parent, armMap, userFn, context);
  }
}
function buildPolymorphParentFn(parent, armMap, userFn, context) {
  const patches = {};
  for (const [path, suffix] of Object.entries(armMap)) {
    patches[path] = variant(suffix);
  }
  const isHidden = parent.startsWith("_");
  return function wiredPolymorphParent($, original) {
    let base2;
    if (userFn) {
      base2 = userFn($, original);
    } else if (isHidden && context.deposits.has(parent)) {
      base2 = context.deposits.get(parent);
    } else {
      base2 = original;
    }
    return transform(base2, patches);
  };
}
function injectHiddenRulePlaceholders(rules, polymorphs, context) {
  for (const [parent, armMap] of Object.entries(polymorphs)) {
    if (!armMap) continue;
    for (const suffix of Object.values(armMap)) {
      const hiddenName = polymorphHiddenName(parent, suffix);
      if (hiddenName in rules) continue;
      rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
    }
  }
}
function polymorphVisibleName(parentKind, suffix) {
  const visibleParent = parentKind.startsWith("_") ? parentKind.slice(1) : parentKind;
  return `${visibleParent}_${suffix}`;
}
function polymorphHiddenName(parentKind, suffix) {
  return `_${polymorphVisibleName(parentKind, suffix)}`;
}
function composeOrSynthesizeTransformParents(rules, transforms) {
  for (const [kind, entry] of Object.entries(transforms)) {
    if (!entry) continue;
    const patchSets = Array.isArray(entry) ? entry : [entry];
    const userFn = rules[kind];
    rules[kind] = buildTransformParentFn(patchSets, userFn);
  }
}
function buildTransformParentFn(patchSets, userFn) {
  return function wiredTransformParent($, original) {
    const base2 = userFn ? userFn($, original) : original;
    return transform(base2, ...patchSets);
  };
}
function injectTransformHiddenRulePlaceholders(rules, transforms, context) {
  for (const [kind, entry] of Object.entries(transforms)) {
    if (!entry) continue;
    const patchSets = Array.isArray(entry) ? entry : [entry];
    for (const patchMap of patchSets) {
      for (const value of Object.values(patchMap)) {
        registerHiddenRuleForPlaceholder(value, kind, rules, context);
      }
    }
  }
}
function registerHiddenRuleForPlaceholder(value, parentKind, rules, context) {
  if (isFieldPlaceholder(value)) {
    const hiddenName = `_kw_${value.name}`;
    if (!(hiddenName in rules)) rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
    return;
  }
  if (isVariantPlaceholder(value)) {
    const hiddenName = `_${parentKind}_${value.name}`;
    if (!(hiddenName in rules)) rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
    return;
  }
  if (isAliasPlaceholder(value)) {
    const hiddenName = `_${value.name}`;
    if (!(hiddenName in rules)) rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
    return;
  }
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
function wrapConflictsCallback(userConflicts, context) {
  return buildWiredConflictsFn(userConflicts, context);
}
function wrapInlineCallback(userInline, context) {
  return buildWiredInlineFn(userInline, context);
}
function buildWiredConflictsFn(userConflicts, context) {
  return function wiredConflicts($, previous) {
    const base2 = userConflicts ? userConflicts.call(this, $, previous) : previous ?? [];
    if (context.conflictGroups.length === 0) return base2;
    const symbolized = context.conflictGroups.map((group) => group.map((name) => symbolizeRef($, name)));
    return [...base2, ...symbolized];
  };
}
function buildWiredInlineFn(userInline, context) {
  return function wiredInline($, previous) {
    const base2 = userInline ? userInline.call(this, $, previous) : previous ?? [];
    if (context.syntheticInline.size === 0) return base2;
    const existingNames = collectInlineNames(base2);
    const appended = [];
    for (const name of context.syntheticInline) {
      if (existingNames.has(name)) continue;
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
  return previous;
};
function makeSimpleDollarProxy() {
  return new Proxy({}, {
    get(_target, name) {
      return { type: "SYMBOL", name };
    }
  });
}
function isComplexBodyRt(rule) {
  const r = rule;
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
function unwrapOptionalChoiceRt(node) {
  if (!node || typeof node !== "object") return node;
  const r = node;
  if (isChoiceType(r.type) && Array.isArray(r.members) && r.members.length === 2) {
    const blankIdx = r.members.findIndex((m) => isBlankType(m?.type));
    if (blankIdx !== -1) return { type: "OPTIONAL", content: r.members[1 - blankIdx] };
  }
  return node;
}
function patternBodyEqual(aIn, bIn) {
  const a = unwrapOptionalChoiceRt(aIn);
  const b = unwrapOptionalChoiceRt(bIn);
  if (!a || typeof a !== "object") return a === b;
  if (!b || typeof b !== "object") return false;
  const ra = a;
  const rb = b;
  if (ra.type !== rb.type) return false;
  const t = ra.type;
  if (t === "STRING" || t === "PATTERN") return ra.value === rb.value;
  if (t === "SYMBOL") return ra.name === rb.name;
  if (t === "BLANK") return true;
  if (t === "SEQ" || t === "CHOICE") {
    const ma = ra.members;
    const mb = rb.members;
    if (!Array.isArray(ma) || !Array.isArray(mb)) return false;
    if (ma.length !== mb.length) return false;
    return ma.every((m, i) => patternBodyEqual(m, mb[i]));
  }
  if (t === "OPTIONAL" || t === "REPEAT" || t === "REPEAT1") {
    return patternBodyEqual(ra.content, rb.content);
  }
  if (t === "FIELD") {
    return ra.name === rb.name && patternBodyEqual(ra.content, rb.content);
  }
  if (t === "ALIAS") {
    const raa = ra;
    const rba = rb;
    return raa.named === rba.named && raa.value === rba.value && patternBodyEqual(raa.content, rba.content);
  }
  return false;
}
function replaceInBodyRt(rule, candidates) {
  if (!rule || typeof rule !== "object") return rule;
  const r = rule;
  for (const c of candidates) {
    if (patternBodyEqual(rule, c.body)) {
      if (c.aliasAs !== void 0) {
        return {
          type: "ALIAS",
          content: { type: "SYMBOL", name: c.name },
          named: true,
          value: c.aliasAs
        };
      }
      return { type: "SYMBOL", name: c.name };
    }
  }
  const t = r.type;
  if (t === "SEQ" || t === "CHOICE") {
    const members = r.members;
    if (!Array.isArray(members)) return rule;
    let changed = false;
    const newMembers = members.map((m) => {
      const replaced = replaceInBodyRt(m, candidates);
      if (replaced !== m) changed = true;
      return replaced;
    });
    return changed ? { ...r, members: newMembers } : rule;
  }
  if (t === "OPTIONAL" || t === "REPEAT" || t === "REPEAT1" || t === "FIELD" || t === "PREC" || t === "PREC_LEFT" || t === "PREC_RIGHT" || t === "PREC_DYNAMIC" || t === "TOKEN") {
    const newContent = replaceInBodyRt(r.content, candidates);
    return newContent !== r.content ? { ...r, content: newContent } : rule;
  }
  return rule;
}
function buildPatternReplacingFn(fn, candidates) {
  return function patternReplacingRuleFn($, previous) {
    const result = fn($, previous);
    return replaceInBodyRt(result, candidates);
  };
}
function applyWirePatternReplacement(rules, authoredRuleNames, groups, context) {
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
  if (groups) {
    for (const [key, value] of Object.entries(groups)) {
      if (typeof value !== "function") continue;
      if (key.startsWith("_")) {
        throw new Error(
          `groups['${key}']: body-pattern keys must be visible kind names (no leading underscore); codegen will create '_${key}' internally`
        );
      }
      const hiddenName = `_${key}`;
      let body;
      try {
        const result = value.call(void 0, $, void 0);
        if (!result || typeof result !== "object" || typeof result.type !== "string") {
          throw new Error(`groups['${key}']: body fn did not return a rule object`);
        }
        body = result;
      } catch (e) {
        throw new Error(`groups['${key}']: failed to evaluate body fn: ${e.message}`);
      }
      if (!isComplexBodyRt(body)) {
        throw new Error(
          `groups['${key}']: body is not a complex structural pattern (need SEQ \u22652, CHOICE \u22652, or REPEAT with non-trivial content)`
        );
      }
      candidates.push({ name: hiddenName, body, aliasAs: key });
      rules[hiddenName] = context ? wrapOneRuleFn(hiddenName, value, context) : value;
    }
  }
  if (candidates.length === 0) return;
  const candidateNames = new Set(candidates.map((c) => c.name));
  for (const [name, fn] of Object.entries(rules)) {
    if (candidateNames.has(name)) continue;
    rules[name] = buildPatternReplacingFn(fn, candidates);
  }
}

// packages/codegen/src/dsl/primitives/field.ts
function maybeKeywordSymbol(fieldName, content, wrapSyntheticBody) {
  const c = content;
  if (!c || typeof c.type !== "string") return content;
  if (isStringType(c.type)) {
    return synthesizeKwSymbol(fieldName, content, wrapSyntheticBody);
  }
  if (isOptionalType(c.type)) {
    return descendOptional(fieldName, content, wrapSyntheticBody, "optional");
  }
  if (isChoiceType(c.type)) {
    const members = content.members;
    if (Array.isArray(members) && members.length === 2) {
      const blankIdx = members.findIndex((m) => m?.type === "BLANK");
      if (blankIdx !== -1) {
        return descendOptional(fieldName, content, wrapSyntheticBody, "choice-blank");
      }
    }
    return content;
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
function descendOptional(fieldName, content, wrapSyntheticBody, wrapperKind) {
  let inner;
  if (wrapperKind === "optional") {
    inner = content.content;
  } else {
    const members = content.members;
    const nonBlank = members.find((m) => m.type !== "BLANK");
    inner = nonBlank;
  }
  const rewritten = maybeKeywordSymbol(fieldName, inner, wrapSyntheticBody);
  if (rewritten === inner) return content;
  if (wrapperKind === "optional") {
    const nativeOptional = globalThis.optional;
    if (typeof nativeOptional !== "function") return content;
    return nativeOptional(rewritten);
  }
  const c = content;
  const newMembers = c.members.map((m) => m.type === "BLANK" ? m : rewritten);
  return { ...c, members: newMembers };
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

// packages/codegen/src/dsl/transform/transform.ts
function makePolymorphAliasNode(hiddenName, visibleName) {
  const alias2 = nativeRuleFn("alias");
  const sym = nativeRuleFn("sym", "symbol");
  return alias2(sym(hiddenName), sym(visibleName));
}
function transform(original, ...patchSets) {
  let rule = original;
  for (const patches of patchSets) {
    const hasPathKeys = requiresPathMode(patches);
    const hasPlaceholderAlias = Object.values(patches).some((v) => isAliasPlaceholder(v) || isVariantPlaceholder(v));
    if (hasPathKeys || hasPlaceholderAlias) {
      rule = applyPathPatches(rule, patches);
    } else {
      rule = applyFlatPatches(rule, patches);
    }
  }
  return rule;
}
function requiresPathMode(patches) {
  return Object.keys(patches).some((k) => !/^\d+$/.test(k));
}
function applyPathPatches(original, patches) {
  const { variantEntries, otherEntries } = partitionPatchesByVariant(patches);
  let rule = original;
  for (const [key, value] of otherEntries) {
    const segments = parsePath(String(key));
    rule = applyPath(rule, segments, (member, precStack) => resolvePatch(value, member, precStack));
  }
  if (variantEntries.length > 0) {
    rule = applyVariantPatches(rule, variantEntries);
  }
  return rule;
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
function applyVariantPatches(rule, variantEntries) {
  const ordered = [...variantEntries].sort(([a], [b]) => parsePath(b).length - parsePath(a).length);
  const hoisted = tryHoistSiblingVariants(rule, ordered);
  if (hoisted) {
    let result2 = hoisted.rule;
    for (const [key, value] of ordered) {
      if (hoisted.consumed.has(key)) continue;
      const segments = parsePath(key);
      result2 = applyPath(result2, segments, (member, precStack) => resolvePatch(value, member, precStack));
    }
    return result2;
  }
  let result = rule;
  for (const [key, value] of ordered) {
    const segments = parsePath(key);
    result = applyPath(result, segments, (member, precStack) => resolvePatch(value, member, precStack));
  }
  return result;
}
function tryHoistSiblingVariants(rule, variantEntries) {
  const { bail, precStack, core } = peelPrecWrappersFromRule(rule);
  const t = core.type;
  if (!t) return bail("core rule has no type after prec peeling");
  if (!isSeqType(t)) return bail(`core rule type '${t}' is not seq/SEQ`);
  const parsed = parseVariantPathsForHoist(variantEntries, bail);
  if (parsed === null) return null;
  const choicePos = parsed[0].choicePos;
  if (parsed.some((p) => p.choicePos !== choicePos))
    return bail(
      `variant patches target mixed choice positions (${parsed.map((p) => p.choicePos).join(",")}) \u2014 hoist needs all siblings at one choice`
    );
  const seqMembers = [...membersOf2(core)];
  const resolvedPos = choicePos < 0 ? seqMembers.length + choicePos : choicePos;
  const choice2 = seqMembers[resolvedPos];
  if (!choice2 || !isChoiceType(choice2.type))
    return bail(`position ${resolvedPos} is '${choice2?.type}', not choice/CHOICE`);
  const choiceMembers = membersOf2(choice2);
  const anyEmpty = parsed.some(
    (p) => matchesEmpty(choiceMembers[p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx])
  );
  if (!anyEmpty) return null;
  const parentKind = wireGetCurrentRuleKind();
  if (!parentKind) return bail("no current rule kind (variant()/transform() called outside rule callback?)");
  return buildHoistedVariants(core, seqMembers, choiceMembers, resolvedPos, choice2, parsed, parentKind, precStack);
}
function peelPrecWrappersFromRule(rule) {
  const dbg = typeof process !== "undefined" ? process?.env?.SITTIR_DEBUG : void 0;
  const kindFor = wireGetCurrentRuleKind() ?? "(unknown)";
  const bail = (reason) => {
    if (dbg) console.error(`[sittir] hoist skipped on '${kindFor}': ${reason}`);
    return null;
  };
  const precStack = [];
  let core = rule;
  while (core && isPrecWrapper(core)) {
    precStack.push(core);
    core = contentOf2(core);
  }
  return { bail, precStack, core };
}
function parseVariantPathsForHoist(variantEntries, bail) {
  const parsed = [];
  for (const [key, v] of variantEntries) {
    const segs = parsePath(key);
    if (segs.length !== 2) return bail(`variant patch '${key}' has ${segs.length} segments (expected 2: N/M)`);
    if (segs[0].kind !== "index" || segs[1].kind !== "index")
      return bail(`variant patch '${key}' uses non-index segments (kind-match / wildcard not supported for hoist)`);
    parsed.push({ key, v, choicePos: segs[0].value, altIdx: segs[1].value });
  }
  return parsed;
}
function buildHoistedVariants(core, seqMembers, choiceMembers, resolvedPos, choice2, parsed, parentKind, precStack) {
  const refs = [];
  for (const p of parsed) {
    const resolvedAlt = p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx;
    const altContent = choiceMembers[resolvedAlt];
    const hoistedMembers = seqMembers.map((m, i) => i === resolvedPos ? altContent : m);
    const hoistedSeq = reconstructContainer(core, hoistedMembers);
    const hoistedBody = wrapVariantBodyInParentPrec(hoistedSeq, precStack);
    const visibleName = polymorphVisibleName(parentKind, p.v.name);
    const hiddenName = polymorphHiddenName(parentKind, p.v.name);
    if (!wireRegisterSyntheticRule(hiddenName, hoistedBody)) {
      throw new Error(`registerSyntheticRule('${hiddenName}'): no active wire() context`);
    }
    refs.push(makePolymorphAliasNode(hiddenName, visibleName));
  }
  registerHoistedVariantConflicts(parsed.map((p) => polymorphHiddenName(parentKind, p.v.name)));
  const newChoice = reconstructContainer(choice2, refs);
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
var membersOf2 = (r) => r.members;
var contentOf2 = (r) => r.content;
function countBodyAnchors(rule) {
  const t = rule.type;
  if (t === "STRING" || t === "PATTERN" || t === "TOKEN") return { tokens: 1, named: 0 };
  if (t === "SYMBOL") return { tokens: 0, named: 1 };
  if (t === "BLANK") return { tokens: 0, named: 0 };
  if (isSeqType(rule.type) || isChoiceType(rule.type)) {
    return membersOf2(rule).reduce(
      (acc, m) => {
        const c = countBodyAnchors(m);
        return { tokens: acc.tokens + c.tokens, named: acc.named + c.named };
      },
      { tokens: 0, named: 0 }
    );
  }
  const content = rule.content;
  if (content && typeof content === "object") return countBodyAnchors(content);
  return { tokens: 0, named: 0 };
}
function variantBranchIsUnmaterializable(rule) {
  const { tokens, named } = countBodyAnchors(rule);
  return tokens === 0 && named <= 1;
}
function deField(rule) {
  const inner = isFieldLike(rule) ? contentOf2(rule) : rule;
  const stripPropagated = (r) => {
    const { fieldName: _drop, ...rest } = r;
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
    const newMembers = membersOf2(original).map((m) => applyFlatPatches(m, patches));
    return reconstructContainer(original, newMembers);
  }
  if (isPrecWrapper(original)) {
    return applyFlatPatchesThroughPrec(original, patches);
  }
  if (isWrapperType(t)) {
    const newContent = applyFlatPatches(contentOf2(original), patches);
    return reconstructWrapper(original, newContent);
  }
  return original;
}
function applyFlatPatchesThroughPrec(original, patches) {
  const newContent = applyFlatPatches(contentOf2(original), patches);
  return reconstructPrec(original, newContent);
}
function applyFlatPatchesToSeq(original, patches) {
  const members = [...membersOf2(original)];
  for (const [key, patch] of Object.entries(patches)) {
    if (!/^\d+$/.test(key)) {
      throw new Error(
        `transform: invalid flat-positional key '${key}' \u2014 keys must be non-negative integers. Use path syntax ('0/1', '*') for nested addressing.`
      );
    }
    const index = Number(key);
    if (index >= members.length) {
      throw new Error(`transform: index ${index} out of bounds in ${original.type} of length ${members.length}`);
    }
    members[index] = resolvePatch(patch, members[index]);
  }
  return reconstructContainer(original, members);
}
var wrapInPrec = (content, precStack) => wrapInPrecStack(content, precStack, reconstructPrec);
function wrapVariantBodyInParentPrec(hoistedSeq, precStack) {
  return wrapInPrec(hoistedSeq, precStack);
}
function resolvePatch(patch, originalMember, precStack) {
  if (isFieldPlaceholder(patch)) {
    return resolveFieldPlaceholder(patch, originalMember, precStack);
  }
  if (isFieldLike(patch)) {
    return { ...patch, metadata: makeRuleMetadata({ fieldSource: "override" }) };
  }
  if (isVariantPlaceholder(patch)) {
    const parentKind = wireGetCurrentRuleKind();
    if (!parentKind) {
      throw new Error(`variant('${patch.name}'): no current rule kind \u2014 variant() must be used inside a rule callback`);
    }
    if (variantBranchIsUnmaterializable(originalMember)) {
      return {
        ...deField(originalMember),
        metadata: makeRuleMetadata({ fieldSource: "override" })
      };
    }
    const visibleName = polymorphVisibleName(parentKind, patch.name);
    const hiddenName = polymorphHiddenName(parentKind, patch.name);
    return registerAliasedVariant(hiddenName, visibleName, originalMember, (body) => wrapInPrec(body, precStack));
  }
  if (isAliasPlaceholder(patch)) {
    return resolveAliasPlaceholder(patch, originalMember, precStack);
  }
  return patch;
}
function findEnrichShapedFieldThroughTransparentWrappers(node) {
  const r = node;
  if (!r || typeof r !== "object") return null;
  const t = r.type;
  if (!t) return null;
  const isSittirOptional = t === "OPTIONAL";
  if (isSittirOptional) {
    const inner = r.content;
    if (!inner || typeof inner !== "object") return null;
    if (isEnrichShapedFieldWrapper(inner)) {
      return {
        found: inner,
        reconstruct: (newInner) => ({ ...r, content: newInner })
      };
    }
    const deeper = findEnrichShapedFieldThroughTransparentWrappers(inner);
    if (deeper) {
      return {
        found: deeper.found,
        reconstruct: (newInner) => ({ ...r, content: deeper.reconstruct(newInner) })
      };
    }
    return null;
  }
  if (isChoiceType(t)) {
    const members = r.members;
    if (!Array.isArray(members) || members.length !== 2) return null;
    const blankIdx = members.findIndex((m) => {
      const mt = m.type;
      return mt === "BLANK";
    });
    if (blankIdx === -1) return null;
    const contentIdx = 1 - blankIdx;
    const inner = members[contentIdx];
    if (!inner || typeof inner !== "object") return null;
    if (isEnrichShapedFieldWrapper(inner)) {
      return {
        found: inner,
        reconstruct: (newInner) => {
          const newMembers = [...members];
          newMembers[contentIdx] = newInner;
          return { ...r, members: newMembers };
        }
      };
    }
    const deeper = findEnrichShapedFieldThroughTransparentWrappers(inner);
    if (deeper) {
      return {
        found: deeper.found,
        reconstruct: (newInner) => {
          const newMembers = [...members];
          newMembers[contentIdx] = deeper.reconstruct(newInner);
          return { ...r, members: newMembers };
        }
      };
    }
    return null;
  }
  if (isPrecWrapper(r)) {
    const inner = r.content;
    if (!inner || typeof inner !== "object") return null;
    if (isEnrichShapedFieldWrapper(inner)) {
      return {
        found: inner,
        reconstruct: (newInner) => ({ ...r, content: newInner })
      };
    }
    const deeper = findEnrichShapedFieldThroughTransparentWrappers(inner);
    if (deeper) {
      return {
        found: deeper.found,
        reconstruct: (newInner) => ({ ...r, content: deeper.reconstruct(newInner) })
      };
    }
    return null;
  }
  return null;
}
function resolveFieldPlaceholder(patch, originalMember, precStack) {
  let content = originalMember;
  if (isEnrichShapedFieldWrapper(content)) {
    const overrideName = patch.name;
    const enrichName = content.name ?? "(unknown)";
    if (overrideName === enrichName && !process.env.SITTIR_QUIET) {
      const parentKind = wireGetCurrentRuleKind() ?? "(unknown)";
      process.stderr.write(
        `transform: override field('${overrideName}') on '${parentKind}' wraps an enrich-labeled FIELD \u2014 duplicate name ('${overrideName}'). Drop the override entry; enrich will cover it automatically.
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
  }
  const maybeSymbolized = maybeKeywordSymbol(patch.name, content, (body) => wrapInPrec(body, precStack));
  if (maybeSymbolized !== content) {
    content = maybeSymbolized;
  }
  const native = globalThis.field;
  if (typeof native !== "function") {
    throw new Error(
      "transform: no global field() found \u2014 patches that use the one-arg field() form require a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)"
    );
  }
  const result = native(patch.name, content);
  return { ...result, metadata: makeRuleMetadata({ fieldSource: "override" }) };
}
function resolveAliasPlaceholder(patch, originalMember, precStack) {
  const hiddenName = "_" + patch.name;
  return registerAliasedVariant(hiddenName, patch.name, originalMember, (body) => wrapInPrec(body, precStack));
}
function registerAliasedVariant(hiddenName, aliasValue, originalMember, bodyWrapper) {
  const wasEmpty = matchesEmpty(originalMember);
  const factored = factorOutEmptiness(originalMember);
  if (wasEmpty && !factored) {
    throw new Error(
      `variant()/alias(): can't extract '${hiddenName}' \u2014 its content matches the empty string and no non-empty core could be factored out. Tree-sitter rejects syntactic rules that match empty. Restructure the parent rule (e.g. lift the empty case outside the choice) before splitting.`
    );
  }
  const body = factored ? factored.nonEmpty : originalMember;
  if (!wireRegisterSyntheticRule(hiddenName, bodyWrapper(body))) {
    throw new Error(`registerSyntheticRule('${hiddenName}'): no active wire() context`);
  }
  const aliasNode = makePolymorphAliasNode(hiddenName, aliasValue);
  if (factored) {
    const optional2 = globalThis.optional;
    if (typeof optional2 !== "function") {
      throw new Error(
        "transform: no global optional() found \u2014 variant()/alias() on empty-matching content needs runtime optional()"
      );
    }
    return optional2(aliasNode);
  }
  return aliasNode;
}
function matchesEmpty(rule) {
  const t = rule.type;
  if (isBlankType(t)) return true;
  if (isOptionalType(t)) return true;
  if (isPlainRepeatType(t)) return true;
  if (isChoiceType(t)) {
    const members = rule.members;
    return members.some((m) => matchesEmpty(m));
  }
  if (isSeqType(t)) {
    const members = rule.members;
    return members.every((m) => matchesEmpty(m));
  }
  return false;
}
function factorOutEmptiness(rule) {
  if (!matchesEmpty(rule)) return null;
  return extractNonEmpty(rule);
}
function extractNonEmpty(rule) {
  const t = rule.type;
  if (isPlainRepeatType(t)) {
    const r = rule;
    const nonEmpty = {
      ...r,
      type: "REPEAT1"
    };
    return { nonEmpty };
  }
  if (isOptionalType(t)) {
    const inner = rule.content;
    return matchesEmpty(inner) ? extractNonEmpty(inner) : { nonEmpty: inner };
  }
  if (isChoiceType(t)) {
    const members = rule.members;
    const nonEmpty = members.filter((m) => !matchesEmpty(m));
    if (nonEmpty.length === 0) return null;
    if (nonEmpty.length === 1) return { nonEmpty: nonEmpty[0] };
    return { nonEmpty: { type: t, members: nonEmpty } };
  }
  if (isSeqType(t)) {
    const members = [...rule.members];
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

// packages/codegen/src/dsl/primitives/refine.ts
function refine(original, forms) {
  const kind = wireGetCurrentRuleKind();
  if (!kind) {
    throw new Error("refine(): no active wire context \u2014 refine() must run inside a rule callback under wire()");
  }
  const formList = [];
  for (const [name, selections] of Object.entries(forms)) {
    if (formList.some((f) => f.name === name)) {
      throw new Error(`refine(): duplicate form name '${name}' on rule '${kind}'`);
    }
    formList.push({ name, selections: { ...selections } });
  }
  if (!wireRegisterRefineForms(kind, formList)) {
    throw new Error("refine(): wire context rejected registration \u2014 unexpected");
  }
  return original;
}

// packages/typescript/overrides.ts
var enrichedBase = enrich(import_grammar.default);
var overrides_default = grammar(
  enrichedBase,
  wire({
    name: "typescript",
    // Conflict markers for variant() adoption on kinds where splitting
    // exposes LR(1) ambiguities the unsplit grammar resolved via shared
    // state. Each entry names two or more rules tree-sitter should
    // treat as requiring a GLR state so it can defer the decision
    // until more input disambiguates. Hidden (`_foo`) and visible
    // (`$.foo`) names are both valid here.
    // `previous` is the TS grammar's own conflicts list (which
    // itself concats the JS base's conflicts). Concat so we don't
    // drop the base entries — we only ADD the new ones required by
    // variant() adoption.
    conflicts: ($, previous) => [
      ...previous ?? [],
      // parenthesized_expression split: `( expression )` vs
      // `( sequence_expression )` share the expression prefix. The
      // typed variant's hidden rule (`_parenthesized_expression_typed`)
      // competes with `sequence_expression` when the parser sees
      // `( expression •`. GLR resolves based on what follows.
      [$.sequence_expression, $._parenthesized_expression_typed],
      // Also exposes a latent `async` ambiguity — before the split,
      // tree-sitter resolved `async (` via state shared between the
      // typed parenthesized expression and arrow_function's call
      // signature. With the typed variant lifted to its own hidden
      // rule, the parser needs explicit GLR to decide whether `async
      // (` starts a call (primary_expression) or an arrow function.
      [$.primary_expression, $.arrow_function],
      // `export` as `primary_expression` vs as `_property_name`
      // surfaces once the typed-parenthesized variant brings more
      // expression contexts into the same state.
      [$.primary_expression, $._property_name],
      [$.labeled_statement, $._property_name],
      [$.object, $.object_pattern],
      [$.primary_expression, $.method_definition],
      [$.primary_expression, $.arrow_function, $._property_name],
      [$.call_expression, $.binary_expression, $.unary_expression, $.instantiation_expression],
      [$.assignment_expression, $.pattern],
      [$.primary_expression, $.pattern],
      [$.primary_expression, $._parameter_name],
      [$.call_expression, $.await_expression, $.binary_expression, $.instantiation_expression],
      [$.array, $.array_pattern],
      [$.primary_type, $.type_parameter],
      [$.call_expression, $.binary_expression, $.update_expression, $.instantiation_expression],
      [$.primary_expression, $.rest_pattern],
      [$._for_header, $.primary_expression],
      [$.class],
      [$.class_static_block, $._property_name],
      [$.primary_expression, $.literal_type],
      [$.pattern, $.primary_type],
      [$.primary_expression, $.primary_type],
      [$.primary_expression, $.nested_identifier, $.nested_type_identifier],
      [$.primary_expression, $.generic_type],
      [$._parameter_name, $.primary_type],
      [$.primary_expression, $.predefined_type],
      [$._call_signature, $.function_type],
      [$.optional_tuple_parameter, $.primary_type],
      [$.call_expression, $.binary_expression, $.instantiation_expression],
      [$.object_assignment_pattern, $.assignment_expression],
      [$.array, $.computed_property_name],
      [$.variable_declarator, $._for_header],
      [$.object, $.object_pattern, $._property_name],
      [$.object_pattern, $.object_type],
      [$.object, $.object_type],
      [$.primary_expression, $.pattern, $.primary_type],
      [$.primary_expression, $._parameter_name, $.primary_type],
      [$.array, $.array_pattern, $.tuple_type],
      [$.array_pattern, $.tuple_type],
      [$.array, $.tuple_type],
      [$._call_signature, $.constructor_type],
      [$.template_string, $.template_literal_type],
      [$.object, $.object_pattern, $.object_type],
      // object_type_content comma/semi split: a single-member body
      // (`{ a }`) has no delimiter yet, so it matches BOTH
      // object_type_content_comma and object_type_content_semi until a
      // `,`/`;` appears. Declare the GLR conflict so tree-sitter forks
      // and resolves once the delimiter (or `}`) disambiguates.
      [$.object_type_content_comma, $.object_type_content_semi],
      [$.primary_expression, $.rest_pattern, $.primary_type],
      [$.primary_expression, $.rest_pattern, $.literal_type],
      [$.primary_expression, $.rest_pattern, $.predefined_type],
      [$.nested_identifier, $.nested_type_identifier],
      [$._initializer, $.binary_expression],
      [$.primary_expression, $._export_statement_namespace_export],
      [$.binary_expression, $.unary_expression, $.instantiation_expression, $._call_expression_call],
      [$.await_expression, $.binary_expression, $.instantiation_expression, $._call_expression_call],
      [$.binary_expression, $.update_expression, $.instantiation_expression, $._call_expression_call],
      [$.binary_expression, $.instantiation_expression, $._call_expression_call],
      [$._type_query_call_expression_in_type_annotation, $._call_expression_call],
      [$._type_query_call_expression, $._call_expression_call],
      [$.primary_expression, $._export_statement_default],
      // string refine rewrite: one fielded `seq` with a correlated
      // `contents` choice replaces the old top-level variant split.
      // Both content arms accept `escape_sequence`, so after the
      // opening quote tree-sitter needs GLR to defer which repeat arm
      // owns the fragment stream until more input arrives.
      [$.string],
      // update_expression variant extraction: the hoisted
      // `_update_expression_postfix` / `_update_expression_prefix`
      // hidden rules inherit the outer `prec.left(0, ...)`, but after
      // extraction they compete with `await_expression` (prec
      // 'unary_void') on the `await expr • '++' …` / `'++' • expr`
      // sequences. Before the split, one `update_expression` rule
      // carried the whole choice under one prec declaration;
      // tree-sitter's LR table handled disambiguation internally.
      // After splitting, both hidden rules each have `prec 0` and
      // compete with `await_expression` individually — GLR is the
      // only resolver. Declare the conflict groups explicitly.
      [$.await_expression, $._update_expression_postfix],
      [$.await_expression, $._update_expression_prefix],
      [$.arrow_function, $._update_expression_postfix],
      [$.arrow_function, $._update_expression_prefix],
      // _export_statement_default outer split inherits the outer
      // `_export_statement_default` vs primary_expression conflict on
      // the `export` prefix, propagated to the two outer variants.
      [$.primary_expression, $._export_statement_default_from_arm],
      [$.primary_expression, $._export_statement_default_decl_arm],
      // Wave-3 follow-up (016 task #28): inlining `_kw_readonly_marker`
      // into `_parameter_name` makes the bare `'readonly'` token visible
      // in `_parameter_name`'s state machine. At `'<' '(' 'readonly' • '('`
      // (a generic-typed function-type parameter), the parser now sees three
      // possible interpretations: `_parameter_name 'readonly' • pattern`,
      // `primary_expression 'readonly'` (treating `readonly` as identifier),
      // and `readonly_type 'readonly' • type`. Tree-sitter cannot
      // disambiguate via static precedence; declare the conflict so it
      // forks via GLR.
      [$.primary_expression, $._parameter_name, $.readonly_type],
      // class_body repeat-choice split: the `method` arm ends with
      // `optional(_semicolon)` — tree-sitter can't decide whether to
      // consume the `;` as part of `_class_body_method` or as the
      // next iteration's start. Self-conflict tells it to fork.
      [$._class_body_method],
      // class_body repeat-choice: `method_signature` can appear both
      // in the `method_sig` arm (followed by `_function_signature_…`
      // or `,`) and in the `member` arm (wrapped in a choice-of-
      // member-kinds). Shared prefix requires a GLR fork.
      [$._class_body_method_sig, $._class_body_member],
      // _for_header variant splits: each sub-variant inherits the
      // for-header's identifier-prefix ambiguity.
      [$.primary_expression, $._for_header_lhs],
      [$.primary_expression, $._for_header_var_kind],
      [$.primary_expression, $._for_header_let_const_kind],
      [$.variable_declarator, $._for_header_var_kind],
      [$.variable_declarator, $._for_header_let_const_kind]
    ],
    // Inline `public_field_definition`'s polymorph-synthesized variant
    // bodies at the alias site. Why inline instead of `conflicts:` —
    // `access_first` reduces to "just accessibility_modifier" and
    // conflicts unrecoverably with method_definition / method_signature
    // / abstract_method_signature that share the prefix. Inlining
    // folds the body into public_field_definition's LR state machine
    // so the pre-split parser states are restored; the alias wrapper
    // survives inlining so the parse tree still surfaces the named
    // variant kind.
    //
    // Experimentally tried moving _for_header and _export_statement_default
    // variants here too — tree-sitter accepted the build, but 1 corpus
    // round-trip dropped to 92 and the typescript factory round-trip
    // started failing. The difference: those variants are referenced
    // through multi-level paths (cascaded polymorph adoption) where
    // inlining changes how tree-sitter resolves alias boundaries at
    // parse time, in ways that slightly alter tree output. Kept as
    // `conflicts:` entries which preserve the exact pre-inline shape.
    inline: ($, previous) => [
      ...previous ?? [],
      $._public_field_definition_declare_first,
      $._public_field_definition_access_first,
      $._public_field_definition_static_mods,
      $._public_field_definition_abstract_first,
      $._public_field_definition_readonly_first,
      $._public_field_definition_accessor_opt
      // `_kw_readonly_marker` / `_kw_async_marker` are now
      // auto-inlined by wire() whenever field promotion synthesizes
      // them, so only the polymorph helpers remain explicitly listed
      // here.
    ],
    polymorphs: {
      arrow_function: { "1/0": "parameter", "1/1": "_call_signature" },
      class_heritage: { "0": "extends_clause", "1": "implements_clause" },
      import_clause: {
        "0": "namespace_import",
        "1": "named_imports",
        "2": "default_import"
      },
      import_specifier: { "1/0": "name", "1/1": "as" },
      index_signature: { "2/0": "colon", "2/1": "mapped_type_clause" },
      ambient_declaration: {
        "1/0": "declaration",
        "1/1": "global",
        "1/2": "module"
      },
      // _export_statement_default — synthesized by
      // `export_statement: { 0: variant('default') }` transform. Body
      // is a two-arm heterogeneous choice:
      //   arm 0: `seq('export', choice(4 from-clause shapes), _semicolon)`
      //   arm 1: `seq(repeat(field('decorator',…)), 'export',
      //             choice(field('declaration',…), seq('default', …)))`
      // Top-level split.
      _export_statement_default: { 0: "from_arm", 1: "decl_arm" },
      // _export_statement_default_from_arm body:
      //   `seq('export', choice(4 from-clause shapes), _semicolon)`
      // Inner choice at path 1 has 3 seqs + 1 bare symbol — split the
      // 3 seqs so the remaining choice is all symbol-like.
      _export_statement_default_from_arm: {
        "1/0": "star_from",
        // seq('*', _from_clause)
        "1/1": "ns_from",
        // seq(namespace_export, _from_clause)
        "1/2": "clause_from"
        // seq(export_clause, _from_clause)
      },
      // _export_statement_default_decl_arm body:
      //   `seq(repeat(field('decorator',…)), 'export', choice(
      //       field('declaration', declaration),
      //       seq('default', choice(
      //           field('declaration', declaration),
      //           seq(field('value', expression), _semicolon),
      //       )),
      //   ))`
      // Split outer and nested default-arm choices at every unique
      // heterogeneous path — multi-level adoption hits the leaves
      // directly rather than cascading through intermediate kinds.
      _export_statement_default_decl_arm: {
        "2/1": "default_kw"
        // seq('default', …)
      },
      _export_statement_default_decl_arm_default_kw: {
        "1/1": "value"
        // seq(field('value', expression), _semicolon)
      },
      // class_body body: `seq('{', repeat(choice(5 arms)), '}')`.
      // Inner repeat-choice has 3 heterogeneous seqs, 1 bare symbol
      // (class_static_block), 1 bare literal (';'). Split the 3 seqs
      // so the choice becomes symbol-like across all arms.
      class_body: {
        "1/0/0": "method",
        // seq(repeat(field(decorator,…)), method_definition, optional(_semicolon))
        "1/0/1": "method_sig",
        // seq(method_signature, choice(…))
        "1/0/3": "member"
        // seq(choice(4 member kinds), choice(_semicolon, ','))
      },
      // _for_header body (base-grammar hidden):
      //   seq('(', choice(3 arms), field('operator', choice('in','of')),
      //       field('right', _expressions), ')')
      //   arm 0: field('left', choice(_lhs_expression, parenthesized_expression))
      //   arm 1: seq(field('kind','var'), field('left',…), optional(_initializer))
      //   arm 2: seq(field('kind', choice('let','const')), field('left',…),
      //              optional(_automatic_semicolon))
      // Split each arm so the outer choice becomes all symbol-like.
      _for_header: {
        "1/0": "lhs",
        "1/1": "var_kind",
        "1/2": "let_const_kind"
      },
      // public_field_definition body position 1:
      //   optional(choice(
      //     seq('declare', optional(accessibility_modifier)),
      //     seq(accessibility_modifier, optional(field('declare', _kw_declare))),
      //   ))
      // Split both arms and INLINE the synthesized hidden rules (see
      // `inline:` below). Inlining is critical here: the `access_first`
      // arm reduces to "just accessibility_modifier" which conflicts
      // with every class-member rule sharing that prefix
      // (`method_definition`, `method_signature`,
      // `abstract_method_signature`). Keeping them as standalone
      // hidden rules produces an unresolvable LR state that
      // tree-sitter can't disambiguate via conflict groups alone.
      // Inlining folds each arm's body back into `public_field_definition`'s
      // state machine — the LR table looks exactly like the pre-split
      // grammar at the conflict site, while sittir's derive-audit
      // still sees the post-polymorph shape (all-alias choice) as
      // canonical. Variant adoption stays a pure sittir-side concern;
      // tree-sitter parses the same tree as before.
      public_field_definition: {
        "1/0/0": "declare_first",
        "1/0/1": "access_first",
        // Position 2: a four-arm modifier choice (heterogeneous).
        "2/0": "static_mods",
        "2/1": "abstract_first",
        "2/2": "readonly_first",
        "2/3": "accessor_opt"
      }
    },
    groups: {
      // __jsx_start_opening_element_optional1 is the inline two-slot helper for
      // JSX element head content: choice(name / name+type_args) + repeat(attribute).
      // The two-slot seq causes the template to flatten both slots, losing the
      // name–attribute distinction. Registering as a visible group collapses the
      // parent's optional to a single `jsx_opening_element_content` slot so each
      // field renders from its own slot. Also fixes _jsx_start_opening_element's
      // multi-slot-nested-seq diagnostic (it inlines __jsx_start_opening_element_optional1).
      jsx_opening_element_content: ($) => seq(
        choice(
          field("name", choice($._jsx_identifier, $.jsx_namespace_name)),
          seq(
            field("name", choice($.identifier, alias($.nested_identifier, $.member_expression))),
            field("type_arguments", optional($.type_arguments))
          )
        ),
        repeat(field("attribute", $._jsx_attribute))
      )
    },
    transforms: {
      // Naked-choice field names (was unresolvable `content` slots).
      arguments: {
        1: field("arguments")
      },
      array: {
        1: field("elements")
      },
      array_pattern: {
        1: field("elements")
      },
      object: {
        1: field("properties")
      },
      object_pattern: {
        1: field("properties")
      },
      switch_body: {
        1: field("cases")
      },
      jsx_expression: {
        1: field("expression")
      },
      // class_body: repeat-choice arm 3 is the upstream inline
      // `seq(choice(4 sigs), choice(_semicolon | ','))` that sittir extracts
      // into the hidden `_class_body_member` — both positions unnamed → 2
      // `content` slots (content-collision). Name the terminator by its path
      // in the parent (fields are applied before the extraction): pos 0 (the
      // member) keeps `content`, pos 1 (the `;`/`,` choice) → `terminator`.
      // Path `1/0/3/1`: seq pos 1 (repeat) → `/0` repeat content (choice) →
      // arm 3 → arm-seq pos 1 (terminator choice).
      class_body: {
        "1/0/3/1": field("terminator")
      },
      // abstract_class_declaration: wrap pos 5 (class_heritage choice).
      // pos 0 is REPEAT(field('decorator')) — don't touch it, it's a real
      // base-grammar field and the original override clobbered it.
      abstract_class_declaration: {},
      // abstract_method_signature: seq(
      //   optional($.accessibility_modifier),    // pos 0
      //   'abstract',                             // pos 1 (literal, not optional)
      //   optional($.override_modifier),          // pos 2
      //   optional(choice('get','set','*')),     // pos 3  →  '3/0'  (accessor_kind, choice-of-strings)
      //   field('name', $._property_name),        // pos 4
      //   optional('?'),                          // pos 5  →  '5/0'  (optional_marker)
      //   $._call_signature)                      // pos 6
      // Field-promotion wave 3 (016 task #25): symmetric to
      // method_definition / method_signature for the trailing `?` plus
      // the accessor keyword. NOTE: no readonly_marker — `'abstract'` is
      // a required literal at pos 1, not optional.
      abstract_method_signature: {
        "3/0": field("accessor_kind"),
        "5/0": field("optional_marker")
      },
      // ambient_declaration: split the heterogeneous declaration choice
      // so each arm owns its own literal scaffold (`declare global …`,
      // `declare module.<name>: <type>;`, or direct declaration).
      ambient_declaration: ($, original) => transform(
        original,
        {
          "1/0": variant("declaration"),
          "1/1": variant("global"),
          "1/2": variant("module")
        }
      ),
      // array_type: 1 field(s)
      array_type: {},
      // as_expression: 2 field(s)
      as_expression: {
        2: field("type_annotation")
        // type [struct=1]
      },
      // asserts_annotation: 1 field(s)
      asserts_annotation: {
        0: field("asserts")
        // asserts [struct=0]
      },
      // await_expression: 1 field(s)
      await_expression: {},
      // class: wrap pos 4 (class_heritage choice). pos 0 is decorator repeat.
      class: {},
      // class_declaration: wrap pos 4 (class_heritage choice) and pos 6
      // (automatic_semicolon choice). pos 0 is decorator repeat — leave it
      // alone so the base 'decorator' field survives.
      class_declaration: {
        6: field("automatic_semicolon")
      },
      // computed_property_name: 1 field(s)
      computed_property_name: {},
      // else_clause: 1 field(s)
      else_clause: {},
      // enum_body — NO override field. Upstream each member is already
      // `choice(field('name', $._property_name), $.enum_assignment)`, so the
      // members carry their own fields. The auto-generated `field('opening')`
      // wrapped the list in a SPURIOUS outer field that nested over the inner
      // `name`; the reader keyed members under the innermost (`name`) while the
      // model only knew `opening`, dropping every member on render (`{ }`).
      // The fix is to add no field at all — pass the upstream rule through.
      // (Tried aliasing the bare-name arm to a node kind to force one union
      // slot; `carriesNamedField` sees through the alias to the inner field and
      // distributes anyway, and the alias-of-hidden-rule got stripped — no gain.
      // A separate visible `enum_property` rule would work but is a parser
      // change for the uncorpused mixed-enum case; left as a latent gap.)
      enum_body: {},
      // flow_maybe_type: 1 field(s)
      flow_maybe_type: {},
      // import_alias: 3 field(s)
      import_alias: {
        1: field("name"),
        // identifier [struct=0]
        3: field("value"),
        // identifier | nested_identifier [struct=1]
        4: field("semicolon")
        //  [struct=2]
      },
      // import_attribute: 1 field(s)
      import_attribute: {
        0: field("object")
        // object [struct=0]
      },
      // import_require_clause: 1 field(s)
      import_require_clause: {},
      // import_statement: 4 field(s)
      import_statement: {
        1: field("import_clause"),
        // import_clause | import_require_clause [struct=0]
        2: field("from_clause"),
        //  [struct=1]
        4: field("semicolon")
        //  [struct=3]
      },
      // index_type_query: 1 field(s)
      index_type_query: {},
      // infer_type: 2 field(s)
      infer_type: {
        1: field("type_identifier"),
        // _type_identifier | type_identifier [struct=0]
        2: field("constraint")
        // type | type_identifier [struct=1]
      },
      // instantiation_expression: 1 field(s)
      instantiation_expression: {},
      // interface_declaration: 1 field(s)
      interface_declaration: {},
      // intersection_type: 2 field(s)
      intersection_type: {
        0: field("left"),
        // type [struct=0]
        2: field("right")
        // type [struct=1]
      },
      // lexical_declaration: 2 field(s)
      lexical_declaration: {
        1: field("declarators"),
        // variable_declarator [struct=0]
        2: field("semicolon")
        //  [struct=1]
      },
      // lookup_type: 2 field(s)
      lookup_type: {
        2: field("index_type")
        // type [struct=1]
      },
      // method_definition: prec.left(seq(
      //   optional($.accessibility_modifier),    // pos 0  (auto-promoted: accessibility_modifier by enrich)
      //   optional('static'),                    // pos 1  →  'static_marker' (T048: was wrongly labeled
      //                                          //         override_modifier; _kw_static_marker synthesized
      //                                          //         here; add to inline: if parse drift emerges)
      //   optional($.override_modifier),         // pos 2  (auto-promoted: override_modifier by enrich)
      //   optional('readonly'),                  // pos 3  →  '3/0'  (readonly_marker)
      //   optional('async'),                     // pos 4  →  '4/0'  (async_marker)
      //   optional(choice('get','set','*')),    // pos 5  →  '5/0'  (accessor_kind, choice-of-strings)
      //   field('name', $._property_name),       // pos 6
      //   optional('?'),                         // pos 7  →  '7/0'  (optional_marker)
      //   $._call_signature,                     // pos 8
      //   field('body', $.statement_block)))    // pos 9
      // Field-promotion wave 3 (016 task #25): label `async`, the
      // accessor `get`/`set`/`*`, and trailing `?` so render preserves
      // `async get foo?(): T {}` shapes. Naming follows `<token>_marker`
      // (016 task #30); enrich's CHOICE-form-of-optional path doesn't
      // fire on tree-sitter-evaluated rules so these positions are
      // hand-promoted. Wave-3 follow-up (016 task #28): `readonly_marker`
      // was deferred in wave 3 because the synthesized
      // `_kw_readonly_marker` hidden symbol's parse precedence diverges
      // from the bare `'readonly'` token in sibling rules — `class Foo
      // { readonly bar?(): T {} }` regressed to ERROR (parser took
      // `readonly` as the property identifier instead of the marker).
      // Resolved by adding `_kw_readonly_marker` to the top-level
      // `inline:` array (see above), which folds the hidden rule's body
      // into every reference site at LR-table generation while preserving
      // the FIELD wrapper for the parse tree.
      method_definition: {
        1: field("static_marker"),
        // 'static' [pos=1] — T048: fixed from override_modifier
        "3/0": field("readonly_marker"),
        "4/0": field("async_marker"),
        "5/0": field("accessor_kind"),
        "7/0": field("optional_marker")
      },
      // method_signature: seq(
      //   optional($.accessibility_modifier),    // pos 0  (auto-promoted: accessibility_modifier by enrich)
      //   optional('static'),                    // pos 1  →  'static_marker' (T048: was wrongly labeled
      //                                          //         override_modifier; pos 2 override_modifier
      //                                          //         auto-promoted by enrich)
      //   optional($.override_modifier),         // pos 2  (auto-promoted: override_modifier by enrich)
      //   optional('readonly'),                  // pos 3  (auto-promoted: readonly_marker by enrich)
      //   optional('async'),                     // pos 4  (auto-promoted: async_marker by enrich)
      //   optional(choice('get','set','*')),    // pos 5  →  '5/0'  (accessor_kind, choice-of-strings)
      //   field('name', $._property_name),       // pos 6
      //   optional('?'),                         // pos 7  →  '7/0'  (optional_marker)
      //   $._call_signature)                     // pos 8
      // Standalone `optional('readonly')` / `optional('async')` are
      // auto-promoted by enrich. Kept entries: accessor_kind
      // (choice-of-strings, enrich skips), optional_marker
      // (`?` not identifier-shaped).
      method_signature: {
        1: field("static_marker"),
        // 'static' [pos=1] — T048: fixed from override_modifier
        "5/0": field("accessor_kind"),
        "7/0": field("optional_marker")
      },
      // namespace_import: 1 field(s)
      namespace_import: {},
      // non_null_expression: 1 field(s)
      non_null_expression: {},
      // object_type: handled by refine() in rules: — see below.
      // program: 2 field(s)
      program: {
        0: field("hash_bang_line"),
        // hash_bang_line [struct=0]
        1: field("statements")
        // statement [struct=1]
      },
      // property_signature: seq(
      //   optional($.accessibility_modifier),  // pos 0  (auto-promoted: accessibility_modifier by enrich)
      //   optional('static'),                   // pos 1  →  'static_marker' (T048: was wrongly labeled
      //                                         //         override_modifier; pos 2 override_modifier
      //                                         //         auto-promoted by enrich)
      //   optional($.override_modifier),         // pos 2  (auto-promoted: override_modifier by enrich)
      //   optional('readonly'),                  // pos 3  (auto-promoted: readonly_marker by enrich)
      //   field('name', $._property_name),       // pos 4
      //   optional('?'),                         // pos 5  →  '5/0'  (optional_marker)
      //   field('type', optional($.type_annotation)))  // pos 6
      // Standalone `optional('readonly')` is auto-promoted by enrich.
      // Kept entries: optional_marker (`?` non-identifier).
      property_signature: {
        1: field("static_marker"),
        // 'static' [pos=1] — T048: fixed from override_modifier
        "5/0": field("optional_marker")
      },
      // satisfies_expression: 2 field(s)
      satisfies_expression: {
        2: field("type_annotation")
        // type [struct=1]
      },
      // spread_element: 1 field(s)
      spread_element: {},
      // statement_block: 2 field(s)
      statement_block: {
        1: field("statements"),
        // statement [struct=0]
        3: field("automatic_semicolon")
        //  [struct=1]
      },
      // type_assertion: 2 field(s)
      type_assertion: {},
      // type_predicate_annotation: 1 field(s)
      type_predicate_annotation: {
        0: field("type_predicate")
        // type_predicate [struct=0]
      },
      // union_type: 2 field(s)
      union_type: {
        0: field("left"),
        // type [struct=0]
        2: field("right")
        // type [struct=1]
      },
      // variable_declaration: 2 field(s)
      variable_declaration: {
        1: field("declarators"),
        // variable_declarator [struct=0]
        2: field("semicolon")
        //  [struct=1]
      },
      // yield_expression: 1 field(s)
      yield_expression: {
        1: field("expression")
        // expression [struct=0]
      },
      // expression_statement: label the trailing `_semicolon` so the
      // template emits `{{ semicolon }}`. Without the label, readNode
      // captures the anon `;` child but the parent template's
      // `{{ children | join(" ") }}` filters to NAMED-only children
      // and the `;` drops. Grammar: `seq(_expressions, _semicolon)`.
      expression_statement: {
        1: field("semicolon")
      },
      // type_alias_declaration: same semicolon-drop pattern. Grammar:
      // `seq('type', field('name'), optional(type_parameters), '=',
      // field('value'), _semicolon)` — label pos 5.
      type_alias_declaration: {
        5: field("semicolon")
      },
      // return_statement: seq('return', optional(_expressions),
      // _semicolon). Label pos 2.
      return_statement: {
        2: field("semicolon")
      },
      // throw_statement: seq('throw', _expressions, _semicolon).
      throw_statement: {
        2: field("semicolon")
      },
      // function_signature: seq(
      //   optional('async'),
      //   'function',
      //   field('name'),
      //   _call_signature,
      //   choice(_semicolon, _function_signature_automatic_semicolon))
      // Keep the trailing semicolon field optional in the override
      // surface. The declarations corpus includes EOF-terminated
      // ambient exports like `export async function …` that parse as a
      // function_signature without surfacing either semicolon token.
      // Model the real read surface instead of forcing a missing slot.
      function_signature: ($) => choice(
        seq(
          optional(field("async_marker", "async")),
          "function",
          field("name", $.identifier),
          $._call_signature,
          choice(
            field("semicolon", $._semicolon),
            field("semicolon", $._function_signature_automatic_semicolon)
          )
        ),
        seq(
          optional(field("async_marker", "async")),
          "function",
          field("name", $.identifier),
          $._call_signature
        )
      ),
      // JS-inherited function family — all start with `optional('async')` at pos 0.
      //
      // Wave-3 follow-up (016 task #28): label pos 0/0 in each as
      // `async_marker` so render preserves `async function …` /
      // `async function* …` / `async () =>` shapes. Resolved via
      // inlining `_kw_async_marker` into every reference site (see
      // `inline:` above) — without inlining, the synthesized hidden
      // rule's prec(-1) body collides with `primary_expression` /
      // `_property_name` on `{ async (` (method-shorthand vs
      // async-function ambiguity) and with sibling function rules on
      // `'async' • 'function'`. Inlining folds the body into each
      // function rule's state machine — same shape as the
      // pre-promotion grammar — while the FIELD wrapper survives the
      // inlining so the parse tree still labels the marker.
      //
      // function_expression / function_declaration / generator_function /
      // generator_function_declaration are wrapped in `prec(...)`. Enrich's
      // optional-keyword pass doesn't descend through prec, so these
      // positions still need hand-promotion. arrow_function is bare-seq
      // → enrich auto-promotes it; the manual entry is now redundant.
      // function_expression: prec('literal', seq(
      //   optional('async'), 'function', field('name', optional($.identifier)),
      //   $._call_signature, field('body', $.statement_block)))
      function_expression: {
        "0/0": field("async_marker")
      },
      // function_declaration: prec.right('declaration', seq(
      //   optional('async'), 'function', field('name', $.identifier),
      //   $._call_signature, field('body', $.statement_block),
      //   optional($._automatic_semicolon)))
      function_declaration: {
        "0/0": field("async_marker")
      },
      // generator_function: prec('literal', seq(
      //   optional('async'), 'function', '*',
      //   field('name', optional($.identifier)),
      //   $._call_signature, field('body', $.statement_block)))
      generator_function: {
        "0/0": field("async_marker")
      },
      // generator_function_declaration: prec.right('declaration', seq(
      //   optional('async'), 'function', '*', field('name', $.identifier),
      //   $._call_signature, field('body', $.statement_block),
      //   optional($._automatic_semicolon)))
      generator_function_declaration: {
        "0/0": field("async_marker")
      },
      // arrow_function: seq(optional('async'), choice(field('parameter',…),
      //   $._call_signature), '=>', field('body', …)).
      // Auto-promoted by enrich (bare seq); manual entry now redundant.
      // break_statement: seq('break', field('label', optional(...)),
      // _semicolon). Label the trailing `;` at pos 2.
      break_statement: {
        2: field("semicolon")
      },
      // continue_statement: seq('continue', field('label', ...), _semicolon).
      continue_statement: {
        2: field("semicolon")
      },
      // debugger_statement: seq('debugger', _semicolon).
      debugger_statement: {
        1: field("semicolon")
      },
      // do_statement: seq('do', field('body'), 'while', field('condition'),
      // optional(_semicolon)). Optional wrapper at pos 4; labeling as
      // a semicolon field lets the template emit it when present.
      do_statement: {
        4: field("semicolon")
      },
      // -------------------------------------------------------------------
      // Field-promotion wave 3 (016 task #25) — standalone optional-punct
      // → semantic field markers. After enrich auto-promotion (016 task
      // #30), only the prec-wrapped sites need hand-promotion (enrich's
      // walker doesn't descend through `prec(...)`); bare-seq sites are
      // covered by enrich and the wave-3 entries become redundant.
      // -------------------------------------------------------------------
      // constructor_type: prec.left(seq(
      //   optional('abstract'),  // pos 0  →  '0/0'  (abstract_marker)
      //   'new', type_parameters?, parameters, '=>', type))
      // prec.left wrapper hides the seq from enrich; hand-promoted here.
      constructor_type: {
        "0/0": field("abstract_marker")
      },
      // construct_signature / type_parameter / for_in_statement /
      // _parameter_name are bare-seq rules — their standalone optional
      // markers (`abstract`, `const`, `await`, `readonly`) are
      // auto-promoted by enrich. Wave 3's manual entries are now
      // redundant.
      // enum_declaration: seq(
      //   optional('const'),  // pos 0  →  '0/0'  (const_marker)
      //   'enum', name, body)
      // Kept hand-promoted because the factoryRoundtrip AST match fails
      // when only enrich auto-promotes (synthesized `_kw_const_marker`
      // content shape diverges).
      enum_declaration: {
        "0/0": field("const_marker")
      },
      // assignment_expression: prec.right('assign', seq(
      //   optional('using'),  // pos 0  →  '0/0'  (using_marker)
      //   field('left', ...), '=', field('right', ...)))
      // prec.right wrapper hides the seq from enrich; hand-promoted here.
      assignment_expression: {
        "0/0": field("using_marker")
      },
      // export_specifier: seq(
      //   optional(choice('type', 'typeof')),  // pos 0  →  '0/0'  (export_kind)
      //   previous)
      // Choice-of-strings: tree-sitter strips FIELD wrappers around bare
      // STRING but retains FIELD around CHOICE. The synthesized
      // `_kw_<name>` indirection in maybeKeywordSymbol only targets bare
      // STRING / OPTIONAL(STRING) shapes — falls through here unchanged
      // (CHOICE without BLANK is not handled). Risk: tree-sitter may
      // strip the FIELD around the bare-STRING choice arms.
      export_specifier: {
        "0/0": field("export_kind")
      },
      // import_specifier: seq(
      //   optional(choice('type', 'typeof')),  // pos 0  →  '0/0'  (import_kind)
      //   choice(...))
      // Same caveat as export_specifier above re: choice-of-strings.
      import_specifier: {
        "0/0": field("import_kind")
      },
      // public_field_definition: seq(
      //   repeat(field('decorator', ...)),                // pos 0
      //   optional(choice(...)),                           // pos 1 (POLYMORPHED — declare_first / access_first)
      //   choice(...),                                     // pos 2 (POLYMORPHED — static_mods / abstract_first / readonly_first / accessor_opt)
      //   field('name', $._property_name),                 // pos 3
      //   optional(choice('?', '!')),                     // pos 4  →  '4/0'  (optionality_marker)
      //   field('type', optional($.type_annotation)),     // pos 5
      //   optional($._initializer))                        // pos 6
      // Field-promotion wave 3 (016 task #25): label the `?`/`!` choice
      // as `optionality_marker`. Different semantics in one slot
      // (`?` = optional field, `!` = definite-assignment) — keep as one
      // discriminator field; the literal value distinguishes.
      public_field_definition: {
        "4/0": field("optionality_marker")
      },
      // _type_query_subscript_expression: DEFERRED. Tree-sitter aliases
      // this hidden rule to the public `subscript_expression` kind via
      // `alias($._type_query_subscript_expression, $.subscript_expression)`.
      // The base JS `subscript_expression` already labels its `?.` with
      // `optional(field('optional_chain', $.optional_chain))`. Adding
      // `optional_chain_marker` on the hidden alias source extends the
      // merged kind's field set, but the merged template (emitted from
      // the canonical `subscript_expression` rule) only references
      // `optional_chain` — coverage validator flags the unreferenced
      // `optional_chain_marker` field. Promotion at the alias source
      // requires either coalescing both field names downstream or
      // overriding the canonical rule too. Tracked as a follow-up.
      // parenthesized_expression: variant() adoption. Shape is
      // `seq('(', choice(typed_expr, sequence_expression), ')')`.
      // The inner choice's alternatives become variant-child kinds
      // that own the surrounding `(` / `)` scaffold via Link's
      // push-down; the parent template collapses to $$$CHILDREN.
      // Path 1/N targets choice alt N inside the seq's member 1.
      parenthesized_expression: {
        "1/0": variant("typed"),
        "1/1": variant("sequence")
      },
      // export_statement: variant() adoption on all four branches.
      // Path 0 is the JS-inherited `previous` (export default,
      // export function, export from, …); paths 1/2/3 are
      // `export type`, `export =`, `export as namespace`. Without
      // labeling path 0, its base-JS branches render without the
      // `export` prefix (parent template is just `$$$CHILDREN`,
      // which filters to named children) — the wrapper becomes
      // invisible at render time.
      //
      // `_export_statement_default`'s body is a top-level choice of
      // TWO structurally distinct shapes:
      //   arm 0 — `seq('export', choice(4 from-clause forms), _semicolon)`
      //   arm 1 — `seq(decorator, 'export', choice(declaration | default value))`
      // Splitting it further (e.g. `0/0` / `0/1` for these sub-arms)
      // just moves the non-canonical flag one level deeper — each
      // split arm STILL has inner choice-with-fields shapes
      // (specifiers, from-clause forms, default value). Adoption on
      // kinds synthesized by a parent polymorph adoption isn't
      // supported end-to-end, so deferred for future work. The
      // walker handles the shape via its per-branch + downgrade
      // logic correctly; the audit flag surfaces real adoption
      // opportunity but not a blocking bug.
      export_statement: {
        0: variant("default"),
        1: variant("type_export"),
        2: variant("equals_export"),
        3: variant("namespace_export")
      },
      // call_expression: variant() adoption on three per-prec
      // branches. Each branch is wrapped in `prec('call' |
      // 'template_call' | 'member')` and Link's variant hoist
      // re-wraps each extracted hidden rule in the same prec so the
      // base grammar's conflict resolution carries through.
      call_expression: {
        0: variant("call"),
        1: variant("template_call"),
        2: variant("member")
      },
      // update_expression: postfix vs prefix `++` / `--`.
      update_expression: {
        0: variant("postfix"),
        1: variant("prefix")
      }
    },
    // Sittir-side rule bodies for external scanner symbols. The grammar's
    // external scanner triggers ASI (Automatic Semicolon Insertion) by
    // producing `_automatic_semicolon` and `_function_signature_automatic_semicolon`
    // as zero-width terminator tokens. Tree-sitter sees them as required
    // (they're SEQ-positional, not optional-wrapped) — but at runtime
    // they can match invisibly. Mapping them to `blank()` makes sittir's
    // IR resolve `_semicolon = choice(_automatic_semicolon, ';')` to
    // `choice(blank(), ';')`, which the stamp pass auto-collapses to
    // `optional(';')`. The slot-model look-through in node-map.ts then
    // propagates that optionality up to any SYMBOL ref pointing at
    // `_semicolon`, so wrapped fields like `field('semicolon', _semicolon)`
    // no longer assert required-singular at wrap time on ASI-terminated
    // corpus entries. The grammar that reaches tree-sitter still has
    // the externals intact; only sittir's slot/render/factory pipeline
    // sees the blank body.
    renderAs: (_$) => ({
      _automatic_semicolon: blank(),
      _function_signature_automatic_semicolon: blank()
    }),
    rules: {
      // parenthesized_expression: held. Base is plain `seq('(',
      // _expressions, ')')` with no outer prec — my hoist's prec
      // preservation captures OUTER wrappers, not per-alt prec. The
      // real conflict is that sequence_expression has its OWN
      // `prec.right(commaSep1(...))` that wins against a bare
      // expression alt; splitting exposes this as an unresolvable
      // tie. Fix would need the DSL to recognize per-alt prec inside
      // the choice and lift it to the variant rule — another
      // iteration.
      // export_statement: held. Base has no prec wrapper so prec-
      // preservation doesn't help. The conflict is deeper: `export`
      // as a keyword overlaps with its use as an identifier in
      // primary_expression, and tree-sitter resolves this via
      // internal state in the unsplit grammar. Splitting forces
      // the decision earlier, exposing the ambiguity.
      // call_expression: held. Each alt has its own per-branch prec
      // tag ('call'/'template_call'/'member') which prec-preservation
      // captures correctly, but the split exposes the base grammar's
      // call_expression vs binary_expression vs instantiation_
      // expression ambiguity on `typeof expr <` that the unsplit
      // rule resolves via LR state the base intentionally left
      // ambiguous. Fix would need explicit conflicts entries with
      // external rules — out of scope for variant() adoption.
      // optional_parameter: position 0 is the hidden `_parameter_name`
      // helper which tree-sitter inlines — its `decorator`, `pattern`, and
      // `name` fields promote onto the parent at parse time. The former
      // override wrapped pos 0 as a synthetic `parameter_name` slot that
      // doesn't exist at runtime, clobbering all five declared fields.
      // Positions 1/2/3 (the `?`, the type field, and the initializer)
      // are already correctly structured in the base rule.
      _ambient_declaration_global: ($) => seq("global", field("body", $.statement_block)),
      _ambient_declaration_module: ($) => prec.right(
        seq(
          "module",
          ".",
          field("name", alias($.identifier, $.property_identifier)),
          ":",
          field("type", $.type),
          optional(field("semicolon", $._semicolon))
        )
      ),
      optional_parameter: ($, original) => original,
      // public_field_definition: pos 0 is decorator repeat (real base
      // field). The original override labeled pos 0 as
      // accessibility_modifier, clobbering decorator. Dropped entirely —
      // the internal accessibility/override-modifier slots are deep inside
      // nested choices and don't have stable raw positions.
      public_field_definition: ($, original) => original,
      // required_parameter: same shape as optional_parameter modulo the
      // `?` — drop the synthetic `parameter_name` wrapper override and
      // let the walker inline the `_parameter_name` helper's fields.
      required_parameter: ($, original) => original,
      // string — model quote style as one fielded structural shape
      // instead of a top-level polymorph split. `opening` / `contents`
      // / `closing` are real field-wrapped choices in the override
      // grammar; refine correlates them so the double/single forms
      // share one NodeData shape with auto-stamped delimiters.
      string: ($) => refine(
        seq(
          field("opening", choice('"', "'")),
          field(
            "contents",
            choice(
              repeat(choice(alias($.unescaped_double_string_fragment, $.string_fragment), $.escape_sequence)),
              repeat(choice(alias($.unescaped_single_string_fragment, $.string_fragment), $.escape_sequence))
            )
          ),
          field("closing", choice('"', "'"))
        ),
        {
          double: { "opening:": '"', "contents:": 0, "closing:": '"' },
          single: { "opening:": "'", "contents:": 1, "closing:": "'" }
        }
      ),
      // object_type — full manual rewrite (deviates from author intent).
      // Upstream is
      //   seq(brace,
      //       optional(seq(
      //         optional(choice(',', ';')),                       // leading sep
      //         sepBy1(choice(',', $._semicolon), member),        // the list
      //         optional(choice(',', $._semicolon)))),            // trailing sep
      //       brace)
      // which folds the `,`-vs-`;` delimiter choice AND both flanking
      // separators into one opaque body. Under the value-bearing-slot
      // model the flanking `optional(choice(...))` survive as phantom
      // unnamed `content` slots (a choice is a nonterminal), so the
      // renderer emits stray separators (`{ , … , }`).
      //
      // Re-express the intent explicitly: a curly/flow brace pair around
      // an optional `object_type_content`, where the content is a
      // comma-delimited OR semicolon-delimited member list. Splitting the
      // two delimiter forms makes each form's flanking separators BARE
      // strings (`optional(',')` / `optional(';')`), which the
      // leading/trailing separator fold absorbs into the list repeat's
      // `leading`/`trailing` flags — no phantom content slot. A VISIBLE
      // `object_type_content` rule (not a hidden group) gives tree-sitter
      // real LR states to disambiguate `,` vs `;` at parse time.
      //
      // The brace pair is modeled with `refine` curly/flow forms (NOT a
      // bare `choice(seq(...), seq(...))` and NOT `variant()`): a bare
      // choice distributes to just the shared `content` slot and DROPS
      // the `{`/`{|`/`}`/`|}` differentiating literals from the render
      // template, and `variant()` does not transpile to grammar.js in a
      // full rule replacement (`Invalid rule: [object Object]`). `refine`
      // declares two correlated named forms so the opening/closing brace
      // pair agrees (`{ }` curly, `{| |}` flow) and both literals are
      // auto-stamped, restoring `ir.objectType.curly()` / `.flow()`.
      object_type: ($) => refine(
        seq(
          field("opening", choice("{", "{|")),
          field("members", optional($.object_type_content)),
          field("closing", choice("}", "|}"))
        ),
        {
          curly: { "opening:": "{", "closing:": "}" },
          flow: { "opening:": "{|", "closing:": "|}" }
        }
      ),
      // object_type_content — NEW visible rule: the member list is a
      // comma-delimited OR semicolon-delimited list. Each delimiter form
      // is its OWN visible rule (`object_type_content_comma` /
      // `_semi`) so each carries its own render template with its own
      // separator — a single shared template would render both forms with
      // one separator and DROP the `;` on round-trip (`{ a; }` → `{ a }`).
      // The visible per-delimiter rules also give tree-sitter explicit LR
      // states to keep the `,`-list and `;`-list parses distinct.
      object_type_content: ($) => choice($.object_type_content_comma, $.object_type_content_semi),
      // Comma-delimited member list. `sepBy1` is written out as
      // `seq(member, repeat(seq(',', member)))` so the DSL lifts it to
      // `repeat1(member, ',')` and absorbs the bare `optional(',')` flanks
      // into the repeat's leading/trailing flags (no phantom content slot).
      object_type_content_comma: ($) => {
        const member = choice(
          $.export_statement,
          $.property_signature,
          $.call_signature,
          $.construct_signature,
          $.index_signature,
          $.method_signature
        );
        return seq(optional(","), seq(member, repeat(seq(",", member))), optional(","));
      },
      // Semicolon-delimited member list (same shape, `;` separator).
      object_type_content_semi: ($) => {
        const member = choice(
          $.export_statement,
          $.property_signature,
          $.call_signature,
          $.construct_signature,
          $.index_signature,
          $.method_signature
        );
        return seq(optional(";"), seq(member, repeat(seq(";", member))), optional(";"));
      }
      // interface_body is a tree-sitter alias target of object_type —
      // it has no base rule of its own, so there's nothing to refine
      // via an override callback. It inherits the parse shape from
      // object_type. If per-form factory support for `interface_body`
      // is needed, a follow-up can add a codegen pass that mirrors
      // `object_type`'s refineForms onto the alias-target kind.
    }
  }, enrichedBase)
);
if (module.exports && module.exports.default) module.exports = module.exports.default;
