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

// packages/python/overrides.ts
var overrides_exports = {};
__export(overrides_exports, {
  default: () => overrides_default
});
module.exports = __toCommonJS(overrides_exports);
var import_grammar = __toESM(require("tree-sitter-python/grammar.js"), 1);

// packages/codegen/src/dsl/runtime-shapes.ts
function isSymbolLike(v) {
  if (!v || typeof v !== "object") return false;
  const t = v.type;
  if ((t === "symbol" || t === "SYMBOL") && typeof v.name === "string") return true;
  return extractSymbolName(v) !== void 0;
}
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
  return (t === "field" || t === "FIELD") && typeof v.name === "string";
}
function isContainerType(t) {
  return t === "seq" || t === "SEQ" || t === "choice" || t === "CHOICE";
}
function isWrapperType(t) {
  return t === "optional" || t === "repeat" || t === "REPEAT" || t === "repeat1" || t === "REPEAT1" || t === "field" || t === "FIELD" || t === "TOKEN" || t === "IMMEDIATE_TOKEN" || t === "BLANK";
}
function isPrecWrapper(rule) {
  const t = rule.type;
  return t === "prec" || t === "PREC" || t === "prec_left" || t === "PREC_LEFT" || t === "prec_right" || t === "PREC_RIGHT" || t === "prec_dynamic" || t === "PREC_DYNAMIC";
}
function typeEq(t, lower) {
  return typeof t === "string" && (t === lower || t === lower.toUpperCase());
}
var isSeqType = (t) => typeEq(t, "seq");
var isChoiceType = (t) => typeEq(t, "choice");
var isOptionalType = (t) => typeEq(t, "optional");
var isFieldType = (t) => typeEq(t, "field");
var isSymbolType = (t) => typeEq(t, "symbol");
var isStringType = (t) => typeEq(t, "string");
var isPlainRepeatType = (t) => typeEq(t, "repeat");
var isRepeatType = (t) => typeEq(t, "repeat") || typeEq(t, "repeat1");
var isBlankType = (t) => typeEq(t, "blank");

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
      if (t === "alias" || t === "ALIAS") {
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
  if (t !== "symbol" && t !== "SYMBOL") return false;
  const meta = rule.metadata;
  return meta?.source === "enrich";
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
  if (t !== "alias" && t !== "ALIAS") return false;
  const meta = rule.metadata;
  return meta?.source === "enrich";
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
  if (t === "symbol" || t === "SYMBOL") {
    return applyKindMatchToSymbol(rule, targetKind, rest, patch, precStack, insideNamedField);
  }
  if (t === "field" || t === "FIELD") {
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
  if (t === "optional") return nativeRequired("optional")(newContent);
  if (t === "repeat" || t === "REPEAT" || t === "repeat1" || t === "REPEAT1") {
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
  const baseNode = nativeRequired(t === "repeat" || t === "REPEAT" ? "repeat" : "repeat1")(newContent);
  if (r.separator !== void 0) baseNode.separator = r.separator;
  if (r.leading !== void 0) baseNode.leading = r.leading;
  if (r.trailing !== void 0) baseNode.trailing = r.trailing;
  return baseNode;
}
var PREC_VARIANT_MAP = {
  prec_left: "left",
  prec_right: "right",
  prec_dynamic: "dynamic"
};
function reconstructPrec(rule, newContent) {
  const t = rule.type.toLowerCase();
  const value = rule.value ?? 0;
  const prec3 = nativeRequired("prec");
  const variant2 = PREC_VARIANT_MAP[t];
  if (variant2) {
    const fn = prec3[variant2];
    if (typeof fn !== "function") throw new Error(`transform: native prec.${variant2} not available`);
    return fn(value, newContent);
  }
  return prec3(value, newContent);
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

// packages/codegen/src/compiler/rule-types.ts
var STRING = "string";
var PATTERN = "pattern";
var SYMBOL = "symbol";
var TOKEN = "token";

// packages/codegen/src/dsl/primitives/role.ts
var currentRoles = null;
var VALID_ROLE_NAMES = /* @__PURE__ */ new Set(["indent", "dedent", "newline"]);
function role(symbol2, roleName) {
  if (!isSymbolLike(symbol2)) {
    throw new Error(
      `role(): first argument must be a symbol reference (e.g. $._indent), got ${JSON.stringify(symbol2)}`
    );
  }
  if (!VALID_ROLE_NAMES.has(roleName)) {
    throw new Error(
      `role(): second argument must be one of 'indent' | 'dedent' | 'newline', got ${JSON.stringify(roleName)}`
    );
  }
  if (currentRoles !== null) {
    currentRoles.set(symbol2.name, { role: roleName });
  }
  return symbol2;
}

// packages/codegen/src/compiler/evaluate.ts
function normalize(input) {
  if (input === void 0 || input === null) {
    throw new Error("Undefined symbol");
  }
  if (typeof input === "string") {
    return { type: STRING, value: input };
  }
  if (input instanceof RegExp) {
    return { type: PATTERN, value: input.source };
  }
  if (typeof input === "object" && "type" in input) {
    return input;
  }
  throw new TypeError(`Invalid rule: ${input}`);
}
function symbol(name) {
  return { type: SYMBOL, name, hidden: name.startsWith("_"), inline: name.startsWith("_") };
}
var token = Object.assign(
  function token2(content) {
    return { type: TOKEN, content: normalize(content), immediate: false };
  },
  {
    immediate(content) {
      return { type: TOKEN, content: normalize(content), immediate: true };
    }
  }
);
var prec = Object.assign(
  function prec2(precedenceOrContent, content) {
    if (content === void 0) return normalize(precedenceOrContent);
    return normalize(content);
  },
  {
    left(precedenceOrContent, content) {
      if (content == null) return normalize(precedenceOrContent);
      return normalize(content);
    },
    right(precedenceOrContent, content) {
      if (content == null) return normalize(precedenceOrContent);
      return normalize(content);
    },
    dynamic(precedenceOrContent, content) {
      if (content == null) return normalize(precedenceOrContent);
      return normalize(content);
    }
  }
);

// packages/codegen/src/dsl/list-patterns.ts
function firstStringOfChoice(r) {
  if (!typeEq(r.type, "choice")) return null;
  const members = r.members ?? [];
  const lit = members.find((m) => typeEq(m.type, "string"));
  return lit ? lit.value : null;
}
function detectRepeatSeparator(resolved) {
  if (!typeEq(resolved.type, "seq")) return null;
  const members = resolved.members;
  if (!members || members.length !== 2) return null;
  const [first, second] = members;
  const firstStr = typeEq(first.type, "string") ? first.value : null;
  const secondStr = typeEq(second.type, "string") ? second.value : null;
  if (firstStr !== null && secondStr === null) return { content: second, separator: firstStr };
  if (secondStr !== null && firstStr === null) return { content: first, separator: secondStr, trailing: true };
  const firstSepChoice = typeEq(first.type, "choice") ? firstStringOfChoice(first) : null;
  const secondSepChoice = typeEq(second.type, "choice") ? firstStringOfChoice(second) : null;
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
  if (typeEq(t, "repeat1")) {
    return ruleMatchesEmpty(r.content);
  }
  if (isSeqType(t)) {
    const members = r.members;
    if (!Array.isArray(members) || members.length === 0) return true;
    return members.every((m) => ruleMatchesEmpty(m));
  }
  if (typeEq(t, "choice")) {
    const members = r.members;
    if (!Array.isArray(members)) return false;
    return members.some((m) => ruleMatchesEmpty(m));
  }
  if (isFieldType(t) || isPrecWrapper(r)) {
    return ruleMatchesEmpty(r.content);
  }
  if (isStringType(t) || isSymbolType(t) || typeEq(t, "token") || typeEq(t, "pattern")) return false;
  return false;
}
function isPlainRepeatType2(t) {
  return t === "repeat" || t === "REPEAT";
}
function collectSlots(members) {
  const slots = [];
  for (const m of members) {
    if (!m || typeof m !== "object") continue;
    const r = m;
    const t = typeof r.type === "string" ? r.type : "";
    if (isStringType(t) || typeEq(t, "token") || isBlankType(t)) continue;
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
  return isRepeatType(t) || typeEq(t, "repeat1");
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

// packages/codegen/src/dsl/enrich.ts
function enrich(baseInput) {
  const base2 = baseInput;
  if (!base2 || typeof base2 !== "object") {
    throw new Error("enrich(): expected a grammar object, got " + typeof base2);
  }
  const hasWrapper = "grammar" in base2;
  const rulesBag = hasWrapper ? base2.grammar?.rules : base2.rules;
  if (!rulesBag) return base2;
  const supertypeNames = extractSupertypeNames(base2, hasWrapper);
  const kwRules = {};
  const clauseGroupRules = {};
  const clauseDedupeMap = {};
  const groupDedupeMap = {};
  const visibleGroupHiddenNames = /* @__PURE__ */ new Set();
  const enrichedRules = {};
  for (const name of Object.keys(rulesBag)) {
    const rule = rulesBag[name];
    enrichedRules[name] = rule ? applyEnrichPasses(name, rule, kwRules, supertypeNames, rulesBag, clauseGroupRules, clauseDedupeMap, groupDedupeMap, visibleGroupHiddenNames) : rule;
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
function applyEnrichPasses(ruleName, rule, kwRules, supertypeNames, rulesBag, clauseGroupRules, clauseDedupeMap, groupDedupeMap, visibleGroupHiddenNames) {
  const MAX_ITERATIONS = 8;
  let r = rule;
  let converged = false;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const before = r;
    r = applySymbolToField(ruleName, r, supertypeNames);
    r = applyOptionalKeyword(ruleName, r, kwRules);
    r = enrichFieldWrappers(r);
    r = enrichMultiplicityWrappers(r);
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
  const node = field2(name, content);
  node.source = "enriched";
  return node;
}
function makeSymbol(name) {
  const symbol2 = nativeRuleFn("symbol", "sym");
  return symbol2(name);
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
      const blankIdx = members.findIndex((m) => m.type === "BLANK" || m.type === "blank");
      if (blankIdx !== -1) {
        const inner = members[1 - blankIdx];
        return { inner, isOptional: true };
      }
    }
  }
  return { inner: rule, isOptional: false };
}
function isIdentifierShaped(value) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
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
    } else if (!isStringType(sn2.type) && sn2.type !== "PATTERN" && sn2.type !== "pattern") {
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
  if (t === "ALIAS" || t === "alias") return;
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
function enrichFieldWrappers(rule) {
  const recursed = recurseChildren(rule, enrichFieldWrappers);
  if (!isFieldType(recursed.type)) return recursed;
  const name = recursed.name;
  const content = recursed.content;
  if (typeof name !== "string" || !content || typeof content !== "object") return recursed;
  const existing = content;
  if (existing.fieldName === name && existing.nonterminal === true) return recursed;
  const newContent = { ...content, fieldName: name, nonterminal: true };
  return { ...recursed, content: newContent };
}
function recurseChildren(rule, visit) {
  if (!rule || typeof rule !== "object") return rule;
  const t = rule.type;
  if (!t) return rule;
  if (isSeqType(t) || isChoiceType(t)) {
    const members = rule.members;
    if (!Array.isArray(members)) return rule;
    let changed = false;
    const newMembers = members.map((m) => {
      const out = visit(m);
      if (out !== m) changed = true;
      return out;
    });
    return changed ? { ...rule, members: newMembers } : rule;
  }
  if (isOptionalType(t) || isRepeatType(t) || isFieldType(t) || isPrecWrapper(rule) || t === "alias" || t === "ALIAS" || t === "token" || t === "TOKEN" || t === "immediate_token" || t === "IMMEDIATE_TOKEN" || t === "group" || t === "variant") {
    const content = rule.content;
    if (content === void 0) return rule;
    const out = visit(content);
    if (out === content) return rule;
    return { ...rule, content: out };
  }
  if (t === "polymorph") {
    const forms = rule.forms;
    if (!Array.isArray(forms)) return rule;
    let changed = false;
    const newForms = forms.map((f) => {
      const out = visit(f.content);
      if (out !== f.content) changed = true;
      return changed ? { ...f, content: out } : f;
    });
    return changed ? { ...rule, forms: newForms } : rule;
  }
  return rule;
}
var MULTIPLICITY_BY_TYPE = {
  optional: "optional",
  OPTIONAL: "optional",
  repeat: "array",
  REPEAT: "array",
  repeat1: "nonEmptyArray",
  REPEAT1: "nonEmptyArray"
};
function enrichMultiplicityWrappers(rule) {
  const recursed = recurseChildren(rule, enrichMultiplicityWrappers);
  const t = recursed.type;
  const multiplicity = t ? MULTIPLICITY_BY_TYPE[t] : void 0;
  if (!multiplicity) return recursed;
  const self = recursed;
  const selfNeedsStamp = self.multiplicity !== multiplicity || self.nonterminal !== true;
  const content = recursed.content;
  const stampedContent = content && typeof content === "object" ? stampMultiplicityThroughWrappers(content, multiplicity) : content;
  if (!selfNeedsStamp && stampedContent === content) return recursed;
  const next = { ...recursed };
  if (selfNeedsStamp) {
    next.multiplicity = multiplicity;
    next.nonterminal = true;
  }
  if (stampedContent !== content) {
    next.content = stampedContent;
  }
  return next;
}
function stampMultiplicityThroughWrappers(node, multiplicity) {
  const existing = node;
  const selfNeedsStamp = existing.multiplicity !== multiplicity || existing.nonterminal !== true;
  const t = node.type;
  const isTransparent = !!t && (isFieldType(t) || isPrecWrapper(node) || t === "alias" || t === "ALIAS" || t === "token" || t === "TOKEN" || t === "immediate_token" || t === "IMMEDIATE_TOKEN");
  let newContent;
  let contentChanged = false;
  if (isTransparent) {
    const content = node.content;
    if (content && typeof content === "object") {
      newContent = stampMultiplicityThroughWrappers(content, multiplicity);
      contentChanged = newContent !== content;
    }
  }
  if (!selfNeedsStamp && !contentChanged) return node;
  const next = { ...node };
  if (selfNeedsStamp) {
    next.multiplicity = multiplicity;
    next.nonterminal = true;
  }
  if (contentChanged) {
    next.content = newContent;
  }
  return next;
}
function applyOptionalKeyword(ruleName, rule, kwRules) {
  const inner = peelPrec(rule);
  const claimed = isSeqType(inner.type) ? collectFieldNamesRuntime(inner) : /* @__PURE__ */ new Set();
  return walkOptionalKeyword(ruleName, rule, claimed, kwRules) ?? rule;
}
function peelPrec(rule) {
  let cursor = rule;
  while (isPrecWrapper(cursor)) {
    cursor = cursor.content;
  }
  return cursor;
}
function walkOptionalKeyword(ruleName, rule, claimedAtSeqLevel, kwRules) {
  if (isSeqType(rule.type)) {
    const members = rule.members;
    let changed = false;
    const newMembers = members.map((m) => {
      const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules);
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
      const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules);
      if (out === null) return m;
      changed = true;
      return out;
    });
    return changed ? { ...rule, members: newMembers } : null;
  }
  const peeled = peelOptional(rule);
  if (peeled.isOptional) {
    const replacement = tryPromoteInnerKeyword(ruleName, rule, peeled.inner, claimedAtSeqLevel, kwRules);
    if (replacement !== null) return replacement;
    const innerRewritten = walkOptionalKeyword(ruleName, peeled.inner, claimedAtSeqLevel, kwRules);
    if (innerRewritten !== null) {
      return rebuildOptional(rule, innerRewritten);
    }
    return null;
  }
  if (isRepeatType(rule.type) || isFieldType(rule.type)) {
    const content = rule.content;
    const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules);
    if (out === null) return null;
    return { ...rule, content: out };
  }
  if (isPrecWrapper(rule)) {
    const content = rule.content;
    const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules);
    if (out === null) return null;
    return { ...rule, content: out };
  }
  return null;
}
function tryPromoteInnerKeyword(ruleName, optionalRule, inner, claimed, kwRules) {
  const innerNorm = normalizeMember(inner);
  if (!isStringType(innerNorm.type)) return null;
  const kw = innerNorm.value;
  if (typeof kw !== "string" || !isIdentifierShaped(kw)) return null;
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
    return t === "BLANK" || t === "blank" ? m : newInner;
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
function makeGroupLiftSymbol(referenceRule, name) {
  const t = referenceRule.type ?? "";
  const isUpper = t.length > 0 && t === t.toUpperCase();
  const base2 = isUpper ? { type: "SYMBOL", name } : symbol(name);
  return {
    ...base2,
    source: "group-lift",
    metadata: { source: "enrich" }
  };
}
function makeVisibleGroupAlias(symbolRef, name) {
  const aliasFn = nativeRuleFn("alias");
  const symbol2 = nativeRuleFn("symbol", "sym");
  const node = aliasFn(symbolRef, symbol2(name));
  node.metadata = { source: "enrich" };
  return node;
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
function wireRegisterPolymorphVariant(parent, child) {
  if (!currentContext) return false;
  const exists = currentContext.polymorphVariants.some((v) => v.parent === parent && v.child === child);
  if (!exists) {
    currentContext.polymorphVariants.push({ parent, child });
  }
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
function wireGetCurrentRuleKind() {
  return currentContext?.currentRuleKind ?? null;
}
function wire(config, base2) {
  const cfg = config;
  const baseArg = base2;
  const context = {
    deposits: /* @__PURE__ */ new Map(),
    syntheticInline: /* @__PURE__ */ new Set(),
    polymorphVariants: [],
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
    const symbol2 = entry;
    if ((symbol2.type === "symbol" || symbol2.type === "SYMBOL") && typeof symbol2.name === "string") {
      names.add(symbol2.name);
    }
  }
  return names;
}
function nativeInlineRef($, name) {
  const nativeSymbol = globalThis.symbol;
  if (typeof nativeSymbol === "function") return nativeSymbol(name);
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
  if (typeEq(t, "seq") || typeEq(t, "choice")) {
    return Array.isArray(r.members) && r.members.length >= 2;
  }
  if (typeEq(t, "repeat") || typeEq(t, "repeat1")) {
    const c = r.content;
    if (!c || typeof c.type !== "string") return false;
    return !typeEq(c.type, "string") && !typeEq(c.type, "symbol") && !typeEq(c.type, "pattern");
  }
  return false;
}
function unwrapOptionalChoiceRt(node) {
  if (!node || typeof node !== "object") return node;
  const r = node;
  if (isChoiceType(r.type) && Array.isArray(r.members) && r.members.length === 2) {
    const blankIdx = r.members.findIndex((m) => isBlankType(m?.type));
    if (blankIdx !== -1) return { type: "optional", content: r.members[1 - blankIdx] };
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
  if (!typeEq(ra.type, rb.type.toLowerCase())) return false;
  const t = ra.type.toLowerCase();
  if (t === "string" || t === "pattern") return ra.value === rb.value;
  if (t === "symbol") return ra.name === rb.name;
  if (t === "blank") return true;
  if (t === "seq" || t === "choice") {
    const ma = ra.members;
    const mb = rb.members;
    if (!Array.isArray(ma) || !Array.isArray(mb)) return false;
    if (ma.length !== mb.length) return false;
    return ma.every((m, i) => patternBodyEqual(m, mb[i]));
  }
  if (t === "optional" || t === "repeat" || t === "repeat1") {
    return patternBodyEqual(ra.content, rb.content);
  }
  if (t === "field") {
    return ra.name === rb.name && patternBodyEqual(ra.content, rb.content);
  }
  if (t === "alias") {
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
        return c.uppercase ? {
          type: "ALIAS",
          content: { type: "SYMBOL", name: c.name },
          named: true,
          value: c.aliasAs
        } : {
          type: "alias",
          content: { type: "symbol", name: c.name, hidden: true },
          named: true,
          value: c.aliasAs
        };
      }
      return c.uppercase ? { type: "SYMBOL", name: c.name } : { type: "symbol", name: c.name, hidden: true };
    }
  }
  const t = r.type.toLowerCase();
  if (t === "seq" || t === "choice") {
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
  if (t === "optional" || t === "repeat" || t === "repeat1" || t === "field" || t === "prec" || t === "prec_left" || t === "prec_right" || t === "prec_dynamic" || t === "token") {
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
    const uppercase = body.type === body.type.toUpperCase();
    candidates.push({ name, body, uppercase });
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
      const uppercase = body.type === body.type.toUpperCase();
      candidates.push({ name: hiddenName, body, uppercase, aliasAs: key });
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
      const blankIdx = members.findIndex((m) => m?.type === "BLANK" || m?.type === "blank");
      if (blankIdx !== -1) {
        return descendOptional(fieldName, content, wrapSyntheticBody, "choice-blank");
      }
    }
    return content;
  }
  return content;
}
function synthesizeKwSymbol(fieldName, content, wrapSyntheticBody) {
  const c = content;
  const isUpperCase = c.type === "STRING";
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
    type: isUpperCase ? "SYMBOL" : "symbol",
    name: hiddenName
  };
}
function descendOptional(fieldName, content, wrapSyntheticBody, wrapperKind) {
  let inner;
  if (wrapperKind === "optional") {
    inner = content.content;
  } else {
    const members = content.members;
    const nonBlank = members.find((m) => m.type !== "BLANK" && m.type !== "blank");
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
  const newMembers = c.members.map((m) => m.type === "BLANK" || m.type === "blank" ? m : rewritten);
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
  if (symbolized !== inner) {
    const reconstructed = native(name, symbolized);
    return {
      ...reconstructed,
      source: "override"
    };
  }
  return { ...initial, source: "override" };
}

// packages/codegen/src/dsl/transform/transform.ts
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
  const isUpperCase = core.type === core.type.toUpperCase();
  for (const p of parsed) {
    const resolvedAlt = p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx;
    const altContent = choiceMembers[resolvedAlt];
    const hoistedMembers = seqMembers.map((m, i) => i === resolvedPos ? altContent : m);
    const hoistedSeq = reconstructContainer(core, hoistedMembers);
    const hoistedBody = wrapVariantBodyInParentPrec(hoistedSeq, precStack);
    const visibleName = polymorphVisibleName(parentKind, p.v.name);
    const hiddenName = polymorphHiddenName(parentKind, p.v.name);
    if (!wireRegisterPolymorphVariant(parentKind, p.v.name)) {
      throw new Error(
        `variant('${p.v.name}'): no active wire() context \u2014 variant() must run inside a rule callback under wire()`
      );
    }
    if (!wireRegisterSyntheticRule(hiddenName, hoistedBody)) {
      throw new Error(`registerSyntheticRule('${hiddenName}'): no active wire() context`);
    }
    refs.push({
      type: isUpperCase ? "ALIAS" : "alias",
      content: { type: isUpperCase ? "SYMBOL" : "symbol", name: hiddenName },
      named: true,
      value: visibleName
    });
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
    return { ...patch, source: "override" };
  }
  if (isVariantPlaceholder(patch)) {
    const parentKind = wireGetCurrentRuleKind();
    if (!parentKind) {
      throw new Error(`variant('${patch.name}'): no current rule kind \u2014 variant() must be used inside a rule callback`);
    }
    if (!wireRegisterPolymorphVariant(parentKind, patch.name)) {
      throw new Error(
        `variant('${patch.name}'): no active wire() context \u2014 variant() must run inside a rule callback under wire()`
      );
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
function findInferredFieldThroughTransparentWrappers(node) {
  const r = node;
  if (!r || typeof r !== "object") return null;
  const t = r.type;
  if (!t) return null;
  const isSittirOptional = t === "optional" || t === "OPTIONAL";
  if (isSittirOptional) {
    const inner = r.content;
    if (!inner || typeof inner !== "object") return null;
    if (isFieldLike(inner) && (inner.source === "inferred" || inner.source === "enriched")) {
      return {
        found: inner,
        reconstruct: (newInner) => ({ ...r, content: newInner })
      };
    }
    const deeper = findInferredFieldThroughTransparentWrappers(inner);
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
      return mt === "BLANK" || mt === "blank";
    });
    if (blankIdx === -1) return null;
    const contentIdx = 1 - blankIdx;
    const inner = members[contentIdx];
    if (!inner || typeof inner !== "object") return null;
    if (isFieldLike(inner) && (inner.source === "inferred" || inner.source === "enriched")) {
      return {
        found: inner,
        reconstruct: (newInner) => {
          const newMembers = [...members];
          newMembers[contentIdx] = newInner;
          return { ...r, members: newMembers };
        }
      };
    }
    const deeper = findInferredFieldThroughTransparentWrappers(inner);
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
  const isPrecWrapper2 = t === "prec" || t === "PREC" || t === "prec_left" || t === "PREC_LEFT" || t === "prec_right" || t === "PREC_RIGHT" || t === "prec_dynamic" || t === "PREC_DYNAMIC";
  if (isPrecWrapper2) {
    const inner = r.content;
    if (!inner || typeof inner !== "object") return null;
    if (isFieldLike(inner) && (inner.source === "inferred" || inner.source === "enriched")) {
      return {
        found: inner,
        reconstruct: (newInner) => ({ ...r, content: newInner })
      };
    }
    const deeper = findInferredFieldThroughTransparentWrappers(inner);
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
  if (isFieldLike(content) && (content.source === "enriched" || content.source === "inferred")) {
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
    const nested = findInferredFieldThroughTransparentWrappers(originalMember);
    if (nested !== null) {
      const overrideName = patch.name;
      const renamedField = { ...nested.found, name: overrideName, source: "override" };
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
  return { ...result, source: "override" };
}
function resolveAliasPlaceholder(patch, originalMember, precStack) {
  const hiddenName = "_" + patch.name;
  return registerAliasedVariant(hiddenName, patch.name, originalMember, (body) => wrapInPrec(body, precStack));
}
function registerAliasedVariant(hiddenName, aliasValue, originalMember, bodyWrapper) {
  const isUpperCase = originalMember.type === originalMember.type.toUpperCase();
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
  const aliasNode = {
    type: isUpperCase ? "ALIAS" : "alias",
    content: { type: isUpperCase ? "SYMBOL" : "symbol", name: hiddenName },
    named: true,
    value: aliasValue
  };
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
      type: t === "REPEAT" ? "REPEAT1" : "repeat1"
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

// packages/python/overrides.ts
var enrichedBase = enrich(import_grammar.default);
var overrides_default = grammar(
  enrichedBase,
  wire({
    name: "python",
    // Structural-whitespace role bindings — declared inline in the
    // externals callback. `role(symbolRef, name)` returns the symbol
    // unchanged (so externals still receives a valid token reference)
    // and records the binding on a per-grammar accumulator that Link
    // reads to drive symbol resolution. No more dummy `_indent` rules.
    externals: ($, prev) => {
      role($._indent, "indent");
      role($._dedent, "dedent");
      role($._newline, "newline");
      return prev;
    },
    conflicts: ($, previous) => [
      ...previous ?? [],
      // expression_statement tuple-variant extraction: the bare
      // `expression` arm and the hoisted `_expression_statement_tuple`
      // both start with `expression • …`. In the base grammar
      // tree-sitter's LR(1) table merged the common prefix into a
      // single state; with the tuple form lifted into its own hidden
      // rule, tree-sitter needs an explicit GLR fork group to decide
      // between the bare expression and the tuple form on the `,`
      // suffix that only the tuple accepts.
      [$.expression_statement, $._expression_statement_tuple],
      // except_clause variant split: the `as` form (`except E as e:`)
      // and the comma-list form (`except E1, E2:`) both begin with
      // `field('value', expression) • …` and only diverge on the `as` /
      // `,` continuation. Lifting each arm into its own hidden rule
      // (`_except_clause_as` / `_except_clause_list`) requires an explicit
      // GLR fork to decide between them after the shared prefix.
      [$._except_clause_as, $._except_clause_list],
      // The `as` form (`except E as e:`) overlaps with `as_pattern`
      // (`E as e`) after the shared `expression 'as'` prefix — fork.
      [$.as_pattern, $._except_clause_as]
    ],
    // EXPERIMENT (see `_except_clause_as` in `rules`). The real fix is enrich
    // auto-hoisting inline-safe groups nested inside variant arms — FOLLOWUP.
    // Inline the hoisted group into tree-sitter so the `as_pattern` LR overlap
    // dissolves exactly as the base grammar resolves it (no extra conflict
    // needed — the `as` is inline in `_except_clause_as` at parse time).
    inline: ($, previous) => [
      ...previous ?? [],
      $._except_clause_as_optional1
    ],
    polymorphs: {
      assignment: { "1/0": "eq", "1/1": "type", "1/2": "typed" },
      // expression_statement: bare expression / comma-separated tuple
      // form / assignment / augmented_assignment / yield. Arms 0, 2,
      // 3, 4 are bare symbol refs to existing visible kinds — the
      // classifier treats the all-symbol shape as canonical, so they
      // need no adoption. Arm 1 is the structural seq (tuple form);
      // adopting it wraps the seq in an alias so the rule becomes an
      // all-symbol choice from the walker's perspective. The
      // `conflicts` entry above tells tree-sitter to fork between
      // `expression` and `_expression_statement_tuple` when the LR
      // table sees `expression • …` and needs to decide on the `,`
      // continuation only the tuple form accepts.
      expression_statement: {
        1: "tuple"
      },
      // with_clause: bare (`a, b, c`) vs parenthesized (`(a, b, c)`).
      // Same with_item content on both arms; paren form wraps with
      // '(' ... ')'. Split per variant so each owns its template.
      with_clause: {
        0: "bare",
        1: "paren"
      },
      // _match_block: base rule is
      //   choice(
      //     seq($._indent, repeat(field('alternative', $.case_clause)),
      //         $._dedent),                         // arm 0 — block form
      //     $._newline,                             // arm 1 — empty form
      //   )
      // Heterogeneous: one seq + one bare symbol. Splitting the seq arm
      // into `_match_block_block` leaves the remaining choice as all
      // symbol-like (alias + symbol) — canonical.
      _match_block: { 0: "block" },
      // dict_pattern: base rule is
      //   seq('{', optional(seq(
      //     commaSep1(choice($._key_value_pattern, $.splat_pattern)),
      //     optional(','),
      //   )), '}')
      // liftCommaSep converts the commaSep1 into a repeat1 with
      // separator, so after simplify the path to the heterogeneous
      // choice is 1/0/0 (optional → seq → repeat1 → choice). One arm is
      // the inlined `_key_value_pattern` seq (tree-sitter wraps the
      // hidden rule in an alias); the other is `splat_pattern`.
      // Splitting the key-value arm into `dict_pattern_kv` leaves the
      // remaining choice all symbol-like. Requires infra (B)'s alias
      // descent in applyPath.
      dict_pattern: { "1/0/0/0": "kv" },
      // _simple_pattern: base rule is
      //   prec(1, choice(
      //     class_pattern,               ← 0
      //     splat_pattern,               ← 1
      //     union_pattern,               ← 2
      //     alias(_list_pattern, …),     ← 3
      //     alias(_tuple_pattern, …),    ← 4
      //     dict_pattern,                ← 5
      //     string,                      ← 6
      //     concatenated_string,         ← 7
      //     true,                        ← 8
      //     false,                       ← 9
      //     none,                        ← 10
      //     seq(optional('-'),           ← 11 — negative literal arm
      //         choice(integer, float)),
      //     complex_pattern,             ← 12
      //     dotted_name,                 ← 13
      //     '_',                         ← 14
      //   ))
      // Arm 11 is a SEQ containing an optional anonymous '-' token.
      // The anonymous token is not a named child, so the parent template
      // `{{ children | join(" ") }}` renders only the integer/float,
      // silently dropping '-' for negative patterns like `-1` or `-1.0`.
      // Adopting arm 11 as `simple_pattern_negative` (visible kind,
      // leading '_' stripped per polymorphVisibleName convention) gives it
      // its own template that includes the '-' prefix literal.
      //
      // Note: `_simple_pattern` is a hidden rule, so no conflicts entry
      // is needed — tree-sitter inlines it into parent rules directly.
      // The visible variant kind is `simple_pattern_negative`.
      _simple_pattern: { "11": "negative" },
      // except_clause: base rule is
      //   seq('except', optional('*'), optional(choice(
      //     seq(field('value', expr), optional(seq('as', field('alias', expr)))),  ← arm 0 "as" form
      //     commaSep1(field('value', expr)),                                        ← arm 1 comma-list form
      //   )), ':', _suite)
      // The two arms have DIFFERENT field sets (arm 0: value + optional
      // alias; arm 1: repeated value), so the cross-branch field merge
      // (hoistSharedFieldAcrossChoiceBranches) can't fuse them — the
      // choice reaches derivation as the non-canonical
      // `seq-member-choice-needs-variant-or-merge` shape (hard error).
      // Split per variant so each form owns its template. Path: seq pos 2
      // = the optional, `/0` = its choice content, `/0`,`/1` = the arms.
      // `except_clause` is visible, but the arms share the `expression`
      // prefix; if tree-sitter reports an unresolved conflict between the
      // aliased forms, add `[$.except_clause_as, $.except_clause_list]` to
      // `conflicts`.
      except_clause: { "2/0/0": "as", "2/0/1": "list" }
    },
    groups: {
      // comparison_operator: each comparator pair is
      // seq(field('operators', choice(...)), primary_expression).
      // Without this lift the parent's $children flattens to alternating
      // operator / primary_expression entries joined in sequence, losing
      // the per-pair grouping needed to render `a < b <= c` correctly.
      // `comparison_operator` is: prec.left(seq(primary_expression,
      //   repeat1(seq(field('operators', choice(...)), primary_expression)))).
      // The inner seq of the repeat1 is the multi-slot repeated unit —
      // a multi-slot repeated unit must be a visible node so the flat
      // parse can be reconstructed. This is step 1 of making multiplicity
      // intrinsic; the first groups: registration in python overrides.
      comparison_operator_comparator: ($) => seq(
        field(
          "operators",
          choice(
            "<",
            "<=",
            "==",
            "!=",
            ">=",
            ">",
            "<>",
            "in",
            alias($._not_in, "not in"),
            "is",
            alias($._is_not, "is not")
          )
        ),
        $.primary_expression
      )
    },
    transforms: {
      // argument_list: name the naked args choice (was an unresolvable
      // `content` slot). expression | list_splat | dictionary_splat |
      // parenthesized_expression | keyword_argument
      argument_list: {
        1: field("arguments")
      },
      // class_pattern: 2 field(s)
      class_pattern: {
        2: field("arguments")
        // case_pattern [struct=1]
      },
      // comparison_operator: 2 field(s)
      comparison_operator: {
        0: field("left"),
        // primary_expression [struct=0]
        1: field("comparators")
        // primary_expression [struct=1]
      },
      // complex_pattern: real/imaginary (0,1) + the `+`/`-` operator enum (2)
      // and a trailing number choice (3). Positions 2 and 3 are both unnamed
      // → 2 `content` slots; name the operator so the number stays the single
      // sanctioned `content` (base-rule field, complex_pattern is not a polymorph).
      complex_pattern: {
        0: field("real"),
        // integer | float [struct=0]
        1: field("imaginary"),
        // integer | float [struct=1]
        2: field("operator")
        // '+' | '-'
      },
      // conditional_expression: 3 field(s)
      conditional_expression: {
        0: field("body"),
        // expression [struct=0]
        2: field("condition"),
        // expression [struct=1]
        4: field("alternative")
        // expression [struct=2]
      },
      // constrained_type: 2 field(s)
      constrained_type: {
        0: field("base_type"),
        // type [struct=0]
        2: field("constraint")
        // type [struct=1]
      },
      // decorator: 2 field(s)
      decorator: {
        2: field("newline")
        //  [struct=1]
      },
      // dictionary: name the naked entries choice (pair | dictionary_splat)
      dictionary: {
        1: field("entries")
      },
      // exec_statement: grammar is seq('exec', code, optional(seq('in', exprs)))
      // Template walker emits the `in` keyword as a literal at top level,
      // which surfaces in rendering even when the optional(seq(...))
      // didn't match. Wrap the optional as field('in_clause') so the
      // whole clause (`in` + exprs) renders only when present.
      exec_statement: {
        2: field("in_clause")
      },
      // for_statement / function_definition / with_statement: each
      // starts with `optional('async')` at pos 0. Auto-promoted by
      // enrich (016 task #30) as `field('async_marker', SYMBOL(_kw_async_marker))`.
      // Wave 2's manual entries are now redundant.
      // for_in_clause: prec.left(seq(optional('async'), 'for', ...)).
      // The prec.left wrapper hides the seq from enrich's auto-promotion
      // walker, so the position is still hand-promoted (016 task #30
      // naming convention).
      for_in_clause: {
        "0/0": field("async_marker")
      },
      // finally_clause: 1 field(s)
      finally_clause: {
        2: field("block")
        // block [struct=0]
      },
      // generic_type: 2 field(s)
      generic_type: {
        0: field("identifier")
        // identifier [struct=0]
      },
      // import_from_statement: 1 field(s)
      import_from_statement: {
        3: field("wildcard_import")
        // wildcard_import [struct=0]
      },
      // keyword_pattern: 2 field(s)
      keyword_pattern: {
        2: field("simple_pattern")
        // _simple_pattern | class_pattern | complex_pattern | concatenated_string | dict_pattern | dotted_name | false | float | integer | list_pattern | none | splat_pattern | string | true | tuple_pattern | union_pattern [struct=1]
      },
      // member_type: 2 field(s)
      member_type: {
        0: field("base_type")
        // type [struct=0]
      },
      // slice: 3 field(s)
      slice: {
        0: field("start"),
        // expression [struct=0]
        2: field("stop"),
        // expression [struct=1]
        3: field("step")
        // expression [struct=2]
      },
      // splat_pattern: 1 field(s)
      splat_pattern: {
        "0": field("operator"),
        // '*' | '**'
        "1/1": field("identifier")
        // identifier [struct=0]
      },
      // splat_type: 1 field(s)
      splat_type: {
        0: field("identifier")
        // identifier [struct=0]
      },
      // string: 3 field(s)
      string: {
        1: field("content")
        // interpolation | string_content [struct=1]
      },
      // type_alias_statement: wrap base position 0 (bare 'type' literal)
      // as field('type') so $fields.type carries the keyword. Without
      // this override, enrich's bare-leading-keyword pass (globally off
      // — rust corpus regresses with it on) leaves the literal
      // unwrapped, and $fields only has left/right. The spec-008-US7
      // regression test (python type_alias_statement collision)
      // assumes the wrapped form.
      type_alias_statement: {
        0: field("type")
      },
      // try_statement: 3 field(s)
      try_statement: {
        3: field("except_clauses")
        // except_clause [struct=0]
      },
      // union_type: 2 field(s)
      union_type: {
        0: field("left"),
        // type [struct=0]
        2: field("right")
        // type [struct=1]
      }
    },
    rules: {
      primary_expression: ($, original) => {
        let base2 = original.members;
        return choice(
          ...base2.slice(0, -1),
          $.list_splat_pattern
        );
      },
      // EXPERIMENT (manual; real fix = enrich should auto-hoist an inline-safe
      // group nested inside a variant arm). The `except_clause` polymorph split
      // auto-creates `_except_clause_as` = seq(value, optional(seq('as', alias)));
      // enrich does NOT recurse into the variant arm to hoist the inner
      // inline-safe group, so the emitter leaks `as` ungated
      // (`except E:` -> `except E as:`). Redefine it with the inner group
      // explicitly hoisted to `_except_clause_as_optional1` so the emitter
      // inline+gates the `as`.
      _except_clause_as: ($) => seq(field("value", $.expression), optional($._except_clause_as_optional1)),
      _except_clause_as_optional1: ($) => seq("as", field("alias", $.expression))
    }
  }, enrichedBase)
);
if (module.exports && module.exports.default) module.exports = module.exports.default;
