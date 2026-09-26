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

// packages/typescript/grammar.sittir.ts
var grammar_sittir_exports = {};
__export(grammar_sittir_exports, {
  default: () => grammar_sittir_default
});
module.exports = __toCommonJS(grammar_sittir_exports);
var import_grammar = __toESM(require("tree-sitter-typescript/typescript/grammar.js"), 1);

// packages/codegen/src/types/rule-types.ts
var SEQ = "SEQ";
var OPTIONAL = "OPTIONAL";
var CHOICE = "CHOICE";
var REPEAT = "REPEAT";
var REPEAT1 = "REPEAT1";
var FIELD = "FIELD";
var STRING = "STRING";
var PATTERN = "PATTERN";
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
var isBlankType = (t) => typeEq(t, "BLANK");
function compileAnchoredPattern(source) {
  const anchored = `^(?:${source})$`;
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
function matchesEmpty(rule2) {
  const t = rule2.type;
  if (isBlankType(t) || isOptionalType(t) || isPlainRepeatType(t)) return true;
  if (t === "STRING") return rule2.value === "";
  if (t === "PATTERN") return patternAcceptsEmpty(String(rule2.value));
  const members = rule2.members ?? [];
  if (isChoiceType(t)) return members.some(matchesEmpty);
  if (isSeqType(t)) return members.every(matchesEmpty);
  if (isPrecWrapper(rule2)) return matchesEmpty(rule2.content);
  return false;
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
var membersOf = (r) => r.members;
var contentOf = (r) => r.content;
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
  const newContent = applyPath(contentOf(rule2), segments, patch, newStack);
  return reconstructPrec(rule2, newContent);
}
function isEnrichGroupLiftSymbol(rule2) {
  const t = rule2.type;
  if (t !== "SYMBOL") return false;
  const meta = readRuleMetadata(rule2.metadata);
  return meta?.symbolSource === "group-lift";
}
var groupLiftRuleMap;
function setGroupLiftRuleMap(map) {
  groupLiftRuleMap = map;
}
function getGroupLiftRuleBody(name) {
  return groupLiftRuleMap?.get(name);
}
function setGroupLiftRuleBody(name, body) {
  groupLiftRuleMap?.set(name, body);
}
function descendThroughGroupLiftSymbol(rule2, segments, patch, precStack) {
  const name = rule2.name;
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
  return rule2;
}
function isEnrichContentAlias(rule2) {
  const t = rule2.type;
  if (t !== "ALIAS") return false;
  return readRuleMetadata(rule2.metadata)?.aliasSource === "visible-group";
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
      const newContent = applyPath(contentOf(rule2), rest, patch, precStack);
      return reconstructWrapper(rule2, newContent);
    }
    case "index": {
      if (head.value === 0 || head.value === -1) {
        const newContent = applyPath(contentOf(rule2), rest, patch, precStack);
        return reconstructWrapper(rule2, newContent);
      }
      throw new ApplyPathSkip(
        `applyPath: index ${head.value} out of bounds \u2014 '${rule2.type}' wraps a single content rule (only index 0 / -1 is valid)`
      );
    }
    case "literal": {
      if (literalTextOfMember(contentOf(rule2)) !== head.text) {
        throw new ApplyPathSkip(
          `applyPath: '${rule2.type}' does not wrap the literal ${JSON.stringify(head.text)}`
        );
      }
      const newContent = applyPath(contentOf(rule2), rest, patch, precStack);
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
      const newContent = applyPath(contentOf(rule2), rest, patch, precStack);
      return reconstructAlias(rule2, newContent);
    }
    case "index": {
      if (head.value === 0 || head.value === -1) {
        const newContent = applyPath(contentOf(rule2), rest, patch, precStack);
        return reconstructAlias(rule2, newContent);
      }
      throw new ApplyPathSkip(
        `applyPath: index ${head.value} out of bounds \u2014 '${rule2.type}' wraps a single content rule (only index 0 / -1 is valid)`
      );
    }
    case "literal": {
      if (literalTextOfMember(contentOf(rule2)) !== head.text) {
        throw new ApplyPathSkip(
          `applyPath: '${rule2.type}' does not wrap the literal ${JSON.stringify(head.text)}`
        );
      }
      const newContent = applyPath(contentOf(rule2), rest, patch, precStack);
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
  const newContent = applyPath(contentOf(rule2), rest, patch, precStack);
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
    const inner = walkKindMatch(contentOf(rule2), targetKind, rest, patch, stack, insideNamedField);
    return {
      rule: inner.matched ? reconstructPrec(rule2, inner.rule) : rule2,
      matched: inner.matched
    };
  }
  if (t === "SYMBOL") {
    return applyKindMatchToSymbol(rule2, targetKind, rest, patch, precStack, insideNamedField);
  }
  if (t === "FIELD") {
    const inner = walkKindMatch(contentOf(rule2), targetKind, rest, patch, precStack, true);
    return {
      rule: inner.matched ? reconstructWrapper(rule2, inner.rule) : rule2,
      matched: inner.matched
    };
  }
  if (isWrapperType(t)) {
    const inner = walkKindMatch(contentOf(rule2), targetKind, rest, patch, precStack, insideNamedField);
    return {
      rule: inner.matched ? reconstructWrapper(rule2, inner.rule) : rule2,
      matched: inner.matched
    };
  }
  if (isContainerType(t)) {
    const members = [...membersOf(rule2)];
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
function applyToMembers(rule2, head, rest, patch, precStack) {
  const members = [...membersOf(rule2)];
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
var RuleWalker = class {
  #rules;
  diagnostics;
  constructor(rules, diagnostics) {
    this.#rules = rules;
    this.diagnostics = diagnostics;
  }
  childEdgesOf(rule2) {
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

// packages/codegen/src/dsl/primitives/preference.ts
function isPreference(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "preference";
}
function preference(arm2) {
  return { __sittirPlaceholder: "preference", default: arm2 };
}

// packages/codegen/src/dsl/primitives/spacing.ts
var EMPTY_SEPARATOR_TOKEN = "empty";
var SPACING_LABEL = /^([a-z][a-z0-9_]*?)_separator_space(?:_(before|after))?$/;
function parseSpacingLabel(name) {
  const m = SPACING_LABEL.exec(name);
  if (!m) return void 0;
  const token2 = m[1];
  const side = m[2];
  if (token2 === EMPTY_SEPARATOR_TOKEN) return side === void 0 ? { token: token2 } : void 0;
  return side === void 0 ? void 0 : { token: token2, side };
}
var SEAM_LABEL = /^([a-z][a-z0-9_]*?)_(before|after)$/;
function parseSeamLabel(name) {
  if (parseSpacingLabel(name) !== void 0) return void 0;
  const m = SEAM_LABEL.exec(name);
  return m ? { token: m[1], side: m[2] } : void 0;
}
var FLANK_ADDRESS = /^(_*[a-z][a-z0-9_]*?)_(start|end)$/;
function parseFlankAddress(key) {
  const m = FLANK_ADDRESS.exec(key);
  return m ? { kind: m[1], side: m[2] } : void 0;
}

// packages/codegen/src/dsl/primitives/alias.ts
function isAliasPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "alias";
}
function alias(rule2, value) {
  if (typeof rule2 === "string" && value === void 0) {
    return {
      __sittirPlaceholder: "alias",
      name: rule2
    };
  }
  const native = globalThis.alias;
  if (typeof native !== "function") {
    throw new Error(
      "alias(): no global alias() found \u2014 must be called inside a runtime that injects alias() (sittir evaluate.ts or tree-sitter CLI)"
    );
  }
  if (value !== void 0) {
    return native(rule2, value);
  }
  return native(rule2, rule2);
}

// packages/codegen/src/dsl/primitives/rule.ts
function isRulePlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "rule";
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
  if (Object.keys(changes).length === 0) return value;
  const copy = Object.create(Object.getPrototypeOf(value), Object.getOwnPropertyDescriptors(value));
  for (const [key, entry] of Object.entries(changes)) copy[key] = entry;
  return copy;
}
function renameNameList(value, renames) {
  if (renames.size === 0) return value;
  if (Array.isArray(value)) return value.map((entry) => renameNameList(entry, renames));
  if (typeof value === "string") return resolveName(value, renames);
  return renameRule(value, renames);
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

// packages/codegen/src/dsl/shared.ts
function ruleKey(rule2) {
  return JSON.stringify(canonicalize(rule2));
}
function canonicalize(rule2) {
  if (typeof rule2 !== "object" || rule2 === null) return rule2;
  const r = rule2;
  const type = r.type ?? null;
  const name = typeof r.name === "string" ? r.name : null;
  const value = typeof r.value === "string" || typeof r.value === "number" ? r.value : null;
  const named = typeof r.named === "boolean" ? r.named : null;
  const separator = "separator" in r ? canonicalizeSeparator(r.separator) : null;
  const members = r.members;
  if (members !== void 0) return [type, name, value, named, separator, members.map(canonicalize)];
  const content = r.content;
  if (content !== void 0) return [type, name, value, named, separator, [canonicalize(content)]];
  return [type, name, value, named, separator, null];
}
function canonicalizeSeparator(separator) {
  if (typeof separator !== "object" || separator === null) return separator;
  const sep = separator;
  return [
    "fact",
    typeof sep.trailing === "string" ? sep.trailing : null,
    typeof sep.leading === "string" ? sep.leading : null,
    canonicalize(sep.value)
  ];
}

// packages/codegen/src/dsl/rule-patterns.ts
function isEnumChoiceRule(rule2) {
  return rule2.type === CHOICE && rule2.members.length >= 2 && rule2.members.every((m) => m.type === STRING || m.type === SYMBOL && m.literal !== void 0);
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
  const isToken = (r) => typeEq(r.type, "CHOICE") && terminalContentOf(r, symbols.isTerminal);
  if (isToken(first) && !secondIsStr) return { content: second, separator: first };
  if (isToken(second) && !firstIsStr) return { content: first, separator: second, trailing: true };
  return null;
}
function ruleMatchesEmpty(rule2) {
  if (!rule2 || typeof rule2 !== "object") return false;
  const r = rule2;
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
function collectSlots(members, rulesBag) {
  const slots = [];
  for (const m of members) {
    if (!m || typeof m !== "object") continue;
    const r = m;
    const t = typeof r.type === "string" ? r.type : "";
    if (isStringType(t) || typeEq(t, "TOKEN") || isBlankType(t)) continue;
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
  if (separatorOf(core, symbols) !== null) return false;
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
  const r = member;
  const t = typeof r.type === "string" ? r.type : "";
  if (isOptionalType(t)) {
    const content = r.content;
    if (!content || typeof content !== "object") return false;
    const cr = content;
    return isStringType(typeof cr.type === "string" ? cr.type : "") && cr.value === sepValue;
  }
  if (isChoiceType(t)) {
    const members = r.members;
    if (!Array.isArray(members) || members.length !== 2) return false;
    const hasBlank = members.some(
      (m) => m && typeof m === "object" && isBlankType(m.type)
    );
    const hasMatchingLiteral = members.some(
      (m) => m && typeof m === "object" && isStringType(
        typeof m.type === "string" ? m.type : ""
      ) && m.value === sepValue
    );
    return hasBlank && hasMatchingLiteral;
  }
  return false;
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
    (m) => m && typeof m === "object" && !isBlankType(m.type ?? "")
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
    if (isOptionalType(t2)) {
      core = unwrapPrec(r2.content);
      continue;
    }
    if (isChoiceType(t2)) {
      const ms = r2.members;
      if (Array.isArray(ms) && ms.length === 2) {
        const blankIdx = ms.findIndex(
          (m) => m && typeof m === "object" && isBlankType(m.type ?? "")
        );
        if (blankIdx !== -1) {
          core = unwrapPrec(ms[1 - blankIdx]);
          continue;
        }
      }
      return null;
    }
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
function extractedToken(rule2) {
  const params = [];
  let tokenized = false;
  let current = rule2;
  for (; ; ) {
    if (isTokenWrapperType(current.type)) {
      tokenized = true;
      if (current.type === IMMEDIATE_TOKEN) params.push("immediate");
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
function tokenUseCounts(rules) {
  const counts = /* @__PURE__ */ new Map();
  const visit = (rule2) => {
    if (rule2 === void 0 || rule2 === null || typeof rule2 !== "object") return;
    if (isTokenWrapperType(rule2.type) || rule2.type === STRING || rule2.type === PATTERN) {
      const token2 = extractedToken(rule2);
      if (token2 !== void 0) counts.set(token2.key, (counts.get(token2.key) ?? 0) + 1);
      return;
    }
    if (rule2.content !== void 0) visit(rule2.content);
    for (const member of rule2.members ?? []) visit(member);
  };
  for (const rule2 of Object.values(rules)) visit(rule2);
  return counts;
}
function predictedSymbolSource(rules, externals, inline) {
  const ctx = { rules, externals: new Set(externals), inline: new Set(inline), tokenUses: tokenUseCounts(rules) };
  return {
    rules,
    externals: ctx.externals,
    isTerminal: (name) => terminalSymbolOf(name, ctx),
    isInlined: (name) => parserSymbolClassOf(name, ctx) === "inlined"
  };
}
function choiceArmsOf(content) {
  if (content.type !== CHOICE) return void 0;
  return content.members.flatMap((m) => choiceArmsOf(m) ?? [m]);
}
function terminalContentOf(content, isTerminalSymbol) {
  if (content.type === SYMBOL) return isTerminalSymbol(content.name);
  if (content.type === STRING || content.type === PATTERN || content.type === TOKEN) return true;
  const arms = choiceArmsOf(content);
  return arms !== void 0 && arms.every((arm2) => terminalContentOf(arm2, isTerminalSymbol));
}
function terminalSymbolOf(name, ctx) {
  const cls = parserSymbolClassOf(name, ctx);
  if (cls !== "inlined") return cls === "terminal";
  const body = ctx.rules[name];
  return body !== void 0 && terminalContentOf(body, (member) => terminalSymbolOf(member, ctx));
}
function lexesAsOneToken(rule2) {
  return extractedToken(rule2) !== void 0;
}
function parserSymbolClassOf(name, ctx) {
  if (ctx.externals.has(name)) return "terminal";
  if (ctx.inline.has(name)) return "inlined";
  const rule2 = ctx.rules[name];
  if (rule2 === void 0) return "nonterminal";
  const token2 = extractedToken(rule2);
  if (token2 === void 0 || ctx.tokenUses.get(token2.key) !== 1) return "nonterminal";
  return token2.anonymous && isParserHiddenName(name) ? "nonterminal" : "terminal";
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
function peelOptional(rule2) {
  if (isOptionalType(rule2.type)) {
    return {
      inner: rule2.content,
      isOptional: true
    };
  }
  if (isChoiceType(rule2.type)) {
    const members = rule2.members;
    if (members.length === 2) {
      const blankIdx = members.findIndex((m) => m.type === "BLANK");
      if (blankIdx !== -1) {
        const inner = members[1 - blankIdx];
        return { inner, isOptional: true };
      }
    }
  }
  return { inner: rule2, isOptional: false };
}
function peelOptionalSeq(rule2) {
  if (isOptionalType(rule2.type)) {
    const content = rule2.content;
    if (content && isSeqType(content.type)) {
      return { seqBody: content, form: "optional", seqIdx: -1 };
    }
    return null;
  }
  if (isChoiceType(rule2.type)) {
    const members = rule2.members;
    if (!Array.isArray(members) || members.length !== 2) return null;
    const blankIdx = members.findIndex((m) => isBlankType(m?.type));
    const seqIdx = members.findIndex((m) => isSeqType(m.type));
    if (blankIdx === -1 || seqIdx === -1 || blankIdx === seqIdx) return null;
    return { seqBody: members[seqIdx], form: "choice", seqIdx };
  }
  return null;
}
function listSeparatorOfOptionalSeq(rule2, symbols) {
  const peeled = peelOptionalSeq(rule2);
  if (peeled === null) return null;
  const seqMembers = peeled.seqBody.members;
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
  const peeled = peelOptional(rule2);
  if (!peeled.isOptional) return null;
  const innerN = normalizeMember(peeled.inner);
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
function peelOptionalEitherSpelling(rule2) {
  const peeled = peelOptional(rule2);
  return peeled.isOptional ? peeled.inner : null;
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
      const flank = peelOptionalEitherSpelling(members[1]);
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
      const inner = peelOptionalEitherSpelling(m);
      const innerLit = inner && isStringType(inner.type) ? inner.value : null;
      const innerMatchesChoiceSep = inner !== null && separatorIsChoice && isChoiceType(inner.type ?? "");
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
  const tail = peelOptionalEitherSpelling(members[1]);
  if (tail === null) return null;
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

// packages/codegen/src/dsl/enrich-ctx.ts
var EnrichCtx = class _EnrichCtx {
  rulesBag;
  supertypeNames;
  externals;
  inline;
  wordMatcher;
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
    this.wordMatcher = fields.wordMatcher;
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
      sourceSymbols: predictedSymbolSource(init.rulesBag, init.externals, init.inline),
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
  const walker = new RuleWalker();
  const distributed = /* @__PURE__ */ new WeakSet();
  const inlineChoiceOf = (content) => {
    if (content.type !== SYMBOL) return void 0;
    const body = ctx.inlineBodyOf(content.name);
    return body !== void 0 && choiceArmsOf(body) !== void 0 ? body : void 0;
  };
  const armsOf = (content) => choiceArmsOf(inlineChoiceOf(content) ?? content)?.flatMap((arm2) => armsOf(arm2) ?? [arm2]);
  const visit = (r) => {
    const choice2 = r;
    if (choice2.type === CHOICE && choice2.members?.some((m) => distributed.has(m))) {
      const members = choice2.members.flatMap(
        (m) => distributed.has(m) ? m.members : [m]
      );
      return { ...choice2, members };
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
  const walker = new RuleWalker();
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
  const walker = new RuleWalker();
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
  const walker = new RuleWalker();
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

// packages/codegen/src/dsl/transform/token-forms.ts
var typeOf2 = (rule2) => rule2.type ?? "";
var membersOf2 = (rule2) => rule2.members ?? [];
var contentOf2 = (rule2) => rule2.content;
var rebuilt = (rule2, patch) => ({ ...rule2, ...patch });
var isBlank = (rule2) => typeOf2(rule2) === "BLANK";
var isString = (rule2) => typeOf2(rule2) === "STRING";
function isTokenWrapper(rule2) {
  return isTokenWrapperType(typeOf2(rule2));
}
function classifyTokenChoice(choice2) {
  const arms = membersOf2(choice2);
  if (arms.some(isBlank)) return "presence";
  if (arms.every(isString)) return "spelling";
  return "forms";
}
function flattenFormArms(arms) {
  return arms.flatMap(
    (arm2) => isChoiceType(typeOf2(arm2)) && classifyTokenChoice(arm2) === "forms" ? flattenFormArms(membersOf2(arm2)) : [arm2]
  );
}
function findOutermostForms(rule2, path) {
  const t = typeOf2(rule2);
  if (isChoiceType(t)) {
    const cls = classifyTokenChoice(rule2);
    if (cls === "forms") return { path, arms: flattenFormArms(membersOf2(rule2)) };
    if (cls === "spelling") return void 0;
    const live = membersOf2(rule2).filter((m) => !isBlank(m));
    const only = live.length === 1 ? live[0] : void 0;
    if (only !== void 0 && isChoiceType(typeOf2(only)) && classifyTokenChoice(only) === "forms") {
      return { path, arms: [...flattenFormArms(membersOf2(only)), membersOf2(rule2).find(isBlank)] };
    }
    return void 0;
  }
  if (t === "OPTIONAL") {
    const inner = contentOf2(rule2);
    if (isChoiceType(typeOf2(inner)) && classifyTokenChoice(inner) === "forms") {
      return { path, arms: [...flattenFormArms(membersOf2(inner)), BLANK] };
    }
    return void 0;
  }
  if (isSeqType(t)) {
    const members = membersOf2(rule2);
    for (let i = 0; i < members.length; i++) {
      const found = findOutermostForms(members[i], [...path, i]);
      if (found) return found;
    }
    return void 0;
  }
  if (contentOf2(rule2) !== void 0) return findOutermostForms(contentOf2(rule2), [...path, 0]);
  return void 0;
}
function replaceAt(rule2, path, arm2) {
  if (path.length === 0) return arm2;
  const [head, ...rest] = path;
  if (Array.isArray(rule2.members)) {
    const members = membersOf2(rule2).map((m, i) => i === head ? replaceAt(m, rest, arm2) : m);
    return rebuilt(rule2, { members });
  }
  return rebuilt(rule2, { content: replaceAt(contentOf2(rule2), rest, arm2) });
}
var BLANK = { type: "BLANK" };
var EMPTY_SEQ = { type: "SEQ", members: [] };
function dropAt(rule2, path) {
  if (path.length === 0) return EMPTY_SEQ;
  const [head, ...rest] = path;
  if (Array.isArray(rule2.members)) {
    if (rest.length === 0) return rebuilt(rule2, { members: membersOf2(rule2).filter((_, i) => i !== head) });
    return rebuilt(rule2, { members: membersOf2(rule2).map((m, i) => i === head ? dropAt(m, rest) : m) });
  }
  return rebuilt(rule2, { content: dropAt(contentOf2(rule2), rest) });
}
var canonicalRuleText = (rule2) => JSON.stringify(rule2, (key, value) => key === "id" || key === "metadata" ? void 0 : value);
function distributeTokenForms(rule2, kind) {
  const precStack = [];
  let core = rule2;
  while (isPrecWrapper(core)) {
    precStack.push(core);
    core = contentOf2(core);
  }
  if (!isTokenWrapper(core)) return rule2;
  const body = contentOf2(core);
  const site = findOutermostForms(body, []);
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
function normalizeGroupToken(token2) {
  return GROUP_TOKEN_SYNONYMS[token2] ?? token2;
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

// packages/codegen/src/dsl/automatic-variants.ts
var ENRICH_AUTOMATIC_VARIANTS_KEY = "__enrichedAutomaticVariants__";
var SLOT_BOUNDARIES = /* @__PURE__ */ new Set(["FIELD", "TOKEN", "IMMEDIATE_TOKEN", "ALIAS", "PATTERN", "STRING", "SYMBOL", "BLANK"]);
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
  if (node.type === "CHOICE") return (node.members ?? []).filter((m) => m.type !== "BLANK").length >= 2 || (node.members ?? []).some(holdsChoice);
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
      const choosable = node.members.filter((m) => m.type !== "BLANK").length >= 2;
      const members = node.members.map((member) => choosable && member.type !== "BLANK" ? stamp(member) : visit(member));
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
function getEnrichAutomaticVariants(grammar2) {
  if (!grammar2 || typeof grammar2 !== "object" || !(ENRICH_AUTOMATIC_VARIANTS_KEY in grammar2)) return void 0;
  const value = grammar2[ENRICH_AUTOMATIC_VARIANTS_KEY];
  if (!isAutomaticVariants(value)) throw new Error("enrich: the automatic-variant sidecar is malformed; expected { keys: Set, supertypeOwners: Set }");
  return value;
}
function seedAutomaticVariants(grammar2) {
  const enriched = getEnrichAutomaticVariants(grammar2);
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
function enrich(baseInput) {
  const base2 = baseInput;
  if (!base2 || typeof base2 !== "object") {
    throw new Error("enrich(): expected a grammar object, got " + typeof base2);
  }
  const hasWrapper = "grammar" in base2;
  const rulesBag = hasWrapper ? base2.grammar?.rules : base2.rules;
  if (!rulesBag) return base2;
  const grammarMeta = hasWrapper ? base2.grammar : base2;
  const supertypeNames = extractGrammarSymbolNames(base2, hasWrapper, "supertypes");
  const inlineNames = extractGrammarSymbolNames(base2, hasWrapper, "inline");
  const ctx = EnrichCtx.create({
    rulesBag,
    supertypeNames,
    externals: extractGrammarSymbolNames(base2, hasWrapper, "externals"),
    inline: inlineNames,
    wordMatcher: compileWordMatcher(extractWordName(grammarMeta?.word), rulesBag)
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
  const enrichedSymbols = predictedSymbolSource(enrichedRules, ctx.externals, ctx.inline);
  Object.assign(enrichedRules, unaliasOverloadedDisplays(enrichedRules, { symbols: enrichedSymbols }));
  for (const name of Object.keys(enrichedRules)) {
    const rule2 = enrichedRules[name];
    if (!rule2) continue;
    enrichedRules[name] = distributeExclusiveFieldChoices(rule2, enrichedRules);
  }
  const wordName = extractWordName(grammarMeta?.word);
  const unhoistableNames = /* @__PURE__ */ new Set([...ctx.externals, ...wordName === null ? [] : [wordName]]);
  const tokenFormParents = [];
  for (const name of Object.keys(enrichedRules)) {
    const rule2 = enrichedRules[name];
    if (!rule2) continue;
    const counter = { opt: 0, grp: 0, arm: 0, supertypeNames };
    const hoisted = hoistTokenForms(name, rule2, ctx, counter, unhoistableNames);
    if (hoisted === rule2) continue;
    enrichedRules[name] = hoisted;
    tokenFormParents.push(name);
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
    if (groupBody) clauseGroupRules[groupName] = withHoistedAnnotation(groupBody);
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
  setGroupLiftRuleMap({
    get: (n) => mergedRules[n],
    set: (n, b) => {
      mergedRules[n] = b;
    }
  });
  const clauseGroupNames = new Set(Object.keys(clauseGroupRules).filter((n) => !visibleGroupSources.has(n)));
  const result = hasWrapper ? { ...base2, grammar: { ...base2.grammar, rules: mergedRules } } : { ...base2, rules: mergedRules };
  addSupertypes(hasWrapper ? result.grammar : result, tokenFormParents);
  replaceExtras(hasWrapper ? result.grammar : result, tokenFormArms(mergedRules, tokenFormParents));
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
function getEnrichClauseGroups(grammar2) {
  if (!grammar2 || typeof grammar2 !== "object") return /* @__PURE__ */ new Set();
  const names = grammar2[ENRICH_CLAUSE_GROUPS_KEY];
  if (names instanceof Set) return names;
  return /* @__PURE__ */ new Set();
}
var ENRICH_CLAUSE_GROUP_OWNERS_KEY = "__enrichedClauseGroupOwners__";
function getEnrichClauseGroupOwners(grammar2) {
  if (!grammar2 || typeof grammar2 !== "object") return /* @__PURE__ */ new Map();
  const owners = grammar2[ENRICH_CLAUSE_GROUP_OWNERS_KEY];
  if (owners instanceof Map) return owners;
  return /* @__PURE__ */ new Map();
}
var ENRICH_VISIBLE_GROUP_SOURCES_KEY = "__enrichedVisibleGroupSources__";
function getEnrichVisibleGroupSources(grammar2) {
  if (!grammar2 || typeof grammar2 !== "object") return /* @__PURE__ */ new Set();
  const names = grammar2[ENRICH_VISIBLE_GROUP_SOURCES_KEY];
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
function hoistTokenForms(parentKind, rule2, ctx, counter, unhoistableNames) {
  if (unhoistableNames.has(parentKind)) return rule2;
  const distributed = distributeTokenForms(rule2, parentKind);
  if (distributed === rule2) return rule2;
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
    const members = core.members;
    if (members === void 0) return core;
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
function addSupertypes(result, names) {
  if (names.length === 0) return;
  const current = result.supertypes;
  if (typeof current === "function") {
    const fn = current;
    result.supertypes = (dollar, previous) => {
      const base3 = fn(dollar, previous);
      const listed2 = harvestSupertypeNames(base3);
      return [...base3, ...names.filter((n) => !listed2.has(n)).map((n) => dollar[n])];
    };
    return;
  }
  const base2 = Array.isArray(current) ? current : [];
  const listed = harvestSupertypeNames(base2);
  result.supertypes = [...base2, ...names.filter((n) => !listed.has(n))];
}
function extractGrammarSymbolNames(base2, hasWrapper, key) {
  const root = hasWrapper ? base2.grammar : base2;
  const list = root?.[key];
  if (Array.isArray(list)) return harvestSupertypeNames(list);
  if (typeof list !== "function") return /* @__PURE__ */ new Set();
  const dollar = new Proxy(
    {},
    {
      get(_t, prop) {
        return typeof prop === "string" ? { type: "SYMBOL", name: prop } : void 0;
      }
    }
  );
  return harvestSupertypeNames(list(dollar));
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
    const newSeqMembers = seqMembers.map((m) => {
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
function collectAllFieldNamesDeep(rule2, into) {
  if (isFieldType(rule2.type) && typeof rule2.name === "string") {
    into.add(rule2.name);
  }
  const bag = rule2;
  if (Array.isArray(bag.members)) {
    for (const m of bag.members) collectAllFieldNamesDeep(m, into);
  } else if (bag.content && typeof bag.content === "object") {
    collectAllFieldNamesDeep(bag.content, into);
  }
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
  return isChoiceType(cursor.type) && Array.isArray(members) && members.some((m) => isFieldType(m.type));
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
function fieldSeparatedListElements(seqRule, reserve, symbols) {
  const members = seqRule.members;
  if (!Array.isArray(members)) return null;
  for (let i = 0; i < members.length - 1; i++) {
    const leading = members[i];
    if (isFieldType(leading.type)) continue;
    let repeatCursor = members[i + 1];
    const outerPrecStack = [];
    while (isPrecWrapper(repeatCursor)) {
      outerPrecStack.push(repeatCursor);
      repeatCursor = repeatCursor.content;
    }
    if (!isRepeatType(repeatCursor.type)) continue;
    let inner = repeatCursor.content;
    const innerPrecStack = [];
    while (isPrecWrapper(inner)) {
      innerPrecStack.push(inner);
      inner = inner.content;
    }
    const detected = separatorOf(inner, symbols);
    if (!detected || detected.trailing) continue;
    const innerElement = detected.content;
    if (!sameElementShape(leading, innerElement)) continue;
    if (hasFieldedArm(leading)) continue;
    if (matchesEmpty(leading)) continue;
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
    if (isFieldType(r.type)) return;
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
    if (isFieldType(r.type)) return r;
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
    if (!node || typeof node !== "object") return [node];
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
  const preExistingFieldNames = /* @__PURE__ */ new Set();
  const collectNames = (node) => {
    const n = node;
    if (isFieldType(n.type) && typeof n.name === "string" && n.metadata?.fieldSource !== "enriched") {
      preExistingFieldNames.add(n.name);
    }
    if (n.members) for (const m of n.members) collectNames(m);
    else if (n.content) collectNames(n.content);
  };
  collectNames(rule2);
  const mintedBySymbol = /* @__PURE__ */ new Map();
  const mintedNames = /* @__PURE__ */ new Set();
  const rebuild = (node) => {
    const n = node;
    if (isFieldType(n.type)) return node;
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
function applySymbolToField(ruleName, rule2, ctx) {
  const { supertypeNames } = ctx;
  if (ruleName.startsWith("_")) return rule2;
  const precStack = [];
  let cursor = rule2;
  while (isPrecWrapper(cursor)) {
    precStack.push(cursor);
    cursor = cursor.content;
  }
  if (!isSeqType(cursor.type)) {
    return tryPromoteInRepeatSeq(ruleName, rule2, cursor, precStack, supertypeNames);
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
  if (finalMembers === newMembers && !changed) return rule2;
  let result = { ...cursor, members: finalMembers };
  for (let i = precStack.length - 1; i >= 0; i--) {
    result = withContent(precStack[i], result);
  }
  return result;
}
function promoteInsideRepeatMembers(ruleName, members, supertypeNames, existing, outerKindCounts) {
  let anyRepeatChanged = false;
  const result = members.map((m) => {
    const rebuilt2 = tryPromoteInRepeatMember(ruleName, m, supertypeNames, existing, outerKindCounts);
    if (rebuilt2 === null) return m;
    anyRepeatChanged = true;
    return rebuilt2;
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
function tryPromoteInRepeatSeq(ruleName, rule2, cursor, outerPrecStack, supertypeNames) {
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
  const peeled = peelOptional(rule2);
  if (!peeled.isOptional) return { matched: false, result: null };
  const replacement = tryPromoteInnerKeyword(ruleName, rule2, peeled.inner, claimedAtSeqLevel, ctx);
  if (replacement !== null) return { matched: true, result: replacement };
  const innerRewritten = walkOptionalKeyword(ruleName, peeled.inner, claimedAtSeqLevel, ctx);
  if (innerRewritten !== null) {
    return { matched: true, result: rebuildOptional(rule2, innerRewritten) };
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
  return rebuildOptional(optionalRule, fieldNode);
}
function rebuildOptional(optionalRule, newInner) {
  if (isOptionalType(optionalRule.type)) {
    return withContent(optionalRule, newInner);
  }
  const members = optionalRule.members;
  const newMembers = members.map((m) => {
    const t = m.type;
    return t === "BLANK" ? m : newInner;
  });
  return { ...optionalRule, members: newMembers };
}
function appendTrailingMemberToOptionalSeq(optSeqRule, trailingOptional) {
  const peeled = peelOptionalSeq(optSeqRule);
  const seqBody = peeled.seqBody;
  const seqMembers = seqBody.members;
  const newSeqBody = { ...seqBody, members: [...seqMembers, trailingOptional] };
  return rebuildOptional(optSeqRule, newSeqBody);
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
  const peeled = peelOptionalSeq(rule2);
  if (peeled !== null) {
    const recursedSeqBody = applyClauseHoist(parentKind, peeled.seqBody, ctx, counter, ambientPrec, enclosingFieldName);
    if (ruleMatchesEmpty(recursedSeqBody)) {
      counter.opt += 1;
      if (recursedSeqBody === peeled.seqBody) return rule2;
      if (peeled.form === "optional") {
        return rebuildOptional(rule2, recursedSeqBody);
      } else {
        const members = rule2.members;
        const newMembers = members.slice();
        newMembers[peeled.seqIdx] = recursedSeqBody;
        return { ...rule2, members: newMembers };
      }
    } else if (isInlineSafe(recursedSeqBody, ctx.sourceSymbols)) {
      const name = clauseHoistSynthName(recursedSeqBody, parentKind, ctx, counter);
      if (name !== null) {
        if (!clauseGroupOwners.has(name)) clauseGroupOwners.set(name, parentKind);
        const symbolRef2 = makeGroupLiftSymbol(rule2, name);
        if (peeled.form === "optional") {
          return rebuildOptional(rule2, symbolRef2);
        } else {
          const members = rule2.members;
          const newMembers = members.slice();
          newMembers[peeled.seqIdx] = symbolRef2;
          return { ...rule2, members: newMembers };
        }
      }
      return rule2;
    } else {
      counter.opt += 1;
      const name = visibleGroupSynthName(recursedSeqBody, parentKind, ctx, counter, ambientPrec, enclosingFieldName);
      if (name !== null) {
        visibleGroupSources.add(name);
        if (!clauseGroupOwners.has(name)) clauseGroupOwners.set(name, parentKind);
        const groupRef = makeGroupLiftSymbol(rule2, name);
        if (peeled.form === "optional") {
          return rebuildOptional(rule2, groupRef);
        } else {
          const members = rule2.members;
          const newMembers = members.slice();
          newMembers[peeled.seqIdx] = groupRef;
          return { ...rule2, members: newMembers };
        }
      }
      if (recursedSeqBody === peeled.seqBody) return rule2;
      if (peeled.form === "optional") {
        return rebuildOptional(rule2, recursedSeqBody);
      } else {
        const members = rule2.members;
        const newMembers = members.slice();
        newMembers[peeled.seqIdx] = recursedSeqBody;
        return { ...rule2, members: newMembers };
      }
    }
  }
  {
    const opt = peelOptional(rule2);
    if (opt.isOptional) {
      const recursed = applyClauseHoist(parentKind, opt.inner, ctx, counter, ambientPrec, enclosingFieldName);
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
      if (final === opt.inner) return rule2;
      if (isOptionalType(rule2.type)) {
        return withContent(rule2, final);
      }
      const members = rule2.members;
      const idx = members.findIndex((m) => m.type !== "BLANK");
      const newMembers = members.slice();
      newMembers[idx] = final;
      return { ...rule2, members: newMembers };
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
    if (!body || ruleMatchesEmpty(body) || isInlineSafe(body, ctx.sourceSymbols)) return null;
    if (isSupertypeLike(body)) return null;
    const promoted = promoteExistingHiddenRuleName(name, parentKind, ctx, counter, "arm");
    if (!promoted) return null;
    rulesBag[name] = withHoistedAnnotation(body);
    visibleGroupSources.add(name);
    if (!clauseGroupOwners.has(name)) clauseGroupOwners.set(name, parentKind);
    return makeVisibleGroupAlias(arm2, promoted.visibleName);
  }
  if (isSeqType(t) || isChoiceType(t)) {
    if (ruleMatchesEmpty(arm2) || isInlineSafe(arm2, ctx.sourceSymbols)) return null;
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
    case "TOKEN":
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
    case "REPEAT1":
    case "TOKEN": {
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
function wireHasAuthoredRule(name) {
  return currentContext?.authoredRuleNames.has(name) ?? false;
}
function wireRegisterRefineForms(kind, forms) {
  if (!currentContext) return false;
  currentContext.refineForms.set(kind, forms);
  return true;
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
function wire(config, base2) {
  const cfg = config;
  const baseArg = base2;
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
    visibleExternals: cfg.visibleExternals,
    expectDiagnostics: cfg.expectDiagnostics,
    expectTestFailures: cfg.expectTestFailures,
    options: cfg.options,
    currentRuleKind: null,
    authoredRuleNames: new Set(Object.keys(cfg.rules ?? {})),
    extraRuleNames: extraRuleNames(cfg, baseArg),
    precedenceRankedNames: precedenceRankedNames(cfg, baseArg),
    flattenedParents: /* @__PURE__ */ new Set(),
    aliasTargets: /* @__PURE__ */ new Set(),
    automaticVariants: seedAutomaticVariants(base2),
    adoptedGroups: baseArg ? adoptMintedGroups(baseArg, base2, cfg.groups) : /* @__PURE__ */ new Map()
  };
  const patches = cfg.patches ?? {};
  const outRules = { ...cfg.rules };
  composeOrSynthesizePatchedParents(outRules, patches, context);
  injectPlaceholderHiddenRules(outRules, patches, context, baseExternalNames(baseArg), knownRuleNames(cfg, baseArg));
  if (baseArg && (cfg.groups && hasBodyPatternGroups(cfg.groups) || cfg.injects || cfg.visibleExternals)) {
    const baseRules = baseArg.grammar?.rules ?? baseArg.rules ?? {};
    for (const baseName of Object.keys(baseRules)) {
      if (baseName in outRules) continue;
      outRules[baseName] = passthroughBaseRuleFn;
    }
  }
  wrapAllRuleFns(outRules, context);
  applyWirePatternReplacement(outRules, context.authoredRuleNames, cfg.groups, context, cfg.injects);
  applyWireVisibleExternalsRewrite(outRules, cfg.visibleExternals);
  if (baseArg) {
    for (const name of getEnrichClauseGroups(base2)) {
      context.syntheticInline.add(name);
    }
    for (const name of getEnrichVisibleGroupSources(base2)) {
      if (context.adoptedGroups.has(name)) continue;
      context.inlineRemovals.add(name);
    }
    const inlineSafeNames = getEnrichClauseGroups(base2);
    for (const [syntheticName, ownerKind] of getEnrichClauseGroupOwners(base2)) {
      if (context.adoptedGroups.has(syntheticName)) continue;
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
  const grammar2 = base2?.grammar ?? base2;
  return grammar2?.[key] !== void 0;
}
function renamingCallback(user, rename, context) {
  return function renamed($, previous) {
    const value = user === void 0 ? previous : user.call(this, $, previous);
    return rename(value, context.symbolRenames);
  };
}
function knownRuleNames(cfg, base2) {
  const baseRules = base2?.grammar?.rules ?? base2?.rules ?? {};
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
function precedenceRankedNames(cfg, base2) {
  const basePrecedences = base2?.grammar?.precedences ?? base2?.precedences;
  const previous = withStringGlobalShim(
    () => typeof basePrecedences === "function" ? basePrecedences(makeSimpleDollarProxy(), []) : basePrecedences
  );
  const own = cfg.precedences;
  const groups = typeof own === "function" ? withStringGlobalShim(() => own(makeSimpleDollarProxy(), previous ?? [])) : own ?? previous;
  const names = /* @__PURE__ */ new Set();
  for (const group2 of Array.isArray(groups) ? groups : []) for (const name of symbolNamesOf(group2)) names.add(name);
  return names;
}
function extraRuleNames(cfg, base2) {
  const baseExtras = base2?.grammar?.extras ?? base2?.extras;
  const previous = withStringGlobalShim(
    () => typeof baseExtras === "function" ? baseExtras(makeSimpleDollarProxy()) : baseExtras
  );
  const own = cfg.extras;
  const entries = typeof own === "function" ? withStringGlobalShim(() => own(makeSimpleDollarProxy(), previous)) : own ?? previous;
  return symbolNamesOf(entries);
}
function baseExternalNames(base2) {
  const externals = base2?.grammar?.externals ?? base2?.externals;
  const entries = typeof externals === "function" ? withStringGlobalShim(() => externals(makeSimpleDollarProxy())) : externals;
  const names = /* @__PURE__ */ new Set();
  for (const external of Array.isArray(entries) ? entries : []) {
    if (typeof external === "string") {
      names.add(external);
      continue;
    }
    const symbol = external;
    if (symbol && typeof symbol === "object" && symbol.type === "SYMBOL" && typeof symbol.name === "string") {
      names.add(symbol.name);
    }
  }
  return names;
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
  return previous;
};
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
function adoptMintedGroups(baseArg, base2, groups) {
  const adopted = /* @__PURE__ */ new Map();
  const authored = declaredPatterns(groups, void 0);
  if (authored.length === 0) return adopted;
  const baseRules = baseArg.grammar?.rules ?? baseArg.rules ?? {};
  for (const minted of getEnrichVisibleGroupSources(base2)) {
    const body = baseRules[minted];
    if (body === void 0) continue;
    const owner = authored.find((pattern) => patternBodyEqual(unwrapPrec(body), pattern.body));
    if (owner === void 0) continue;
    adopted.set(minted, owner.key);
    delete baseRules[minted];
  }
  return adopted;
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
function replaceInBodyRt(rule2, candidates, automatic) {
  if (!rule2 || typeof rule2 !== "object") return rule2;
  const r = rule2;
  for (const c of candidates) {
    if (patternBodyEqual(rule2, c.body) || r.type === "SYMBOL" && c.adopts?.has(r.name ?? "") === true) {
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
    const adopts = new Set([...context.adoptedGroups].filter(([, owner]) => owner === key).map(([minted]) => minted));
    candidates.push(hidden ? { name: hiddenName, body } : { name: hiddenName, body, aliasAs: key, adopts });
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
function regex(pattern) {
  return { __sittirPlaceholder: "regex", source: pattern.source };
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
function requiresPathMode(patches) {
  return Object.keys(patches).some((k) => !/^\d+$/.test(k));
}
function applyPathPatches(original, patches) {
  const { variantEntries, otherEntries } = partitionPatchesByVariant(patches);
  let rule2 = original;
  for (const [key, value] of otherEntries) {
    const segments = parsePath(String(key));
    if (isArmDefault(value)) assertChoiceArmPath(rule2, String(key), segments);
    rule2 = applyPath(rule2, segments, (member, precStack) => resolvePatch(value, member, String(key), precStack));
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
  const hoisted = tryHoistSiblingVariants(rule2, ordered);
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
      result = applyPath(result, segments, (member, precStack) => resolvePatch(value, member, key, precStack));
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
  const { choice: choice2, choiceMembers, absentIdx } = hoistChoice;
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
    (arm2) => (isBlank2(arm2) || matchesEmpty(arm2)) && scaffolding.every((m) => matchesEmpty(m))
  );
  if (emptyArm >= 0) return bail(`arm ${emptyArm} would hoist to a variant that matches the empty string`);
  const bareArm = choiceMembers.findIndex(
    (arm2) => variantBranchIsUnmaterializable({ type: "SEQ", members: [...scaffolding, ...isBlank2(arm2) ? [] : [arm2]] })
  );
  if (bareArm >= 0) return bail(`arm ${bareArm} would hoist to a variant with no token of its own and at most one named child`);
  return { core, precStack, seqMembers, resolvedPos, choice: choice2, choiceMembers, parsed, lifted };
}
function isBlank2(rule2) {
  return rule2.type === "BLANK";
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
function optionalContentOf(rule2) {
  if (rule2.type === "OPTIONAL") return contentOf3(rule2);
  if (!isChoiceType(rule2.type)) return void 0;
  const members = membersOf3(rule2);
  return members.length === 2 && isBlank2(members[1]) && !isBlank2(members[0]) ? members[0] : void 0;
}
function tryHoistSiblingVariants(rule2, variantEntries) {
  const { bail } = peelPrecWrappersFromRule(rule2);
  const parentKind = wireGetCurrentRuleKind();
  if (!parentKind) return bail("no current rule kind (variant()/transform() called outside rule callback?)");
  const plan = planSiblingVariantHoist(rule2, variantEntries, (reason) => bail(reason));
  if (plan === null) return null;
  const { core, precStack, seqMembers, resolvedPos, choice: choice2, choiceMembers, parsed, lifted } = plan;
  if (wireIsExtraRule(parentKind)) return bail(`'${parentKind}' is an extra; a non-token rule may not appear inside an extra`);
  if (wireIsPrecedenceRankedRule(parentKind))
    return bail(`'${parentKind}' is ranked by name in the grammar's precedences; its variants would reduce unranked`);
  const authored = parsed.map((p) => polymorphVisibleName(parentKind, variantMintName(p.v))).find((name) => wireHasAuthoredRule(name));
  if (authored !== void 0) return bail(`'${authored}' is an authored rule and would not carry the hoisted scaffolding`);
  return buildHoistedVariants(core, seqMembers, choiceMembers, resolvedPos, choice2, parsed, lifted, parentKind, precStack);
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
function buildHoistedVariants(core, seqMembers, choiceMembers, resolvedPos, choice2, parsed, lifted, parentKind, precStack) {
  const hoist = (altContent) => {
    const hoistedMembers = seqMembers.flatMap((m, i) => i !== resolvedPos ? [m] : isBlank2(altContent) ? [] : [altContent]);
    return wrapVariantBodyInParentPrec(withHoistedAnnotation(reconstructContainer(core, hoistedMembers)), precStack);
  };
  const refs = [];
  for (const p of parsed) {
    const resolvedAlt = p.altIdx < 0 ? choiceMembers.length + p.altIdx : p.altIdx;
    const altMember = choiceMembers[resolvedAlt];
    const name = polymorphVisibleName(parentKind, variantMintName(p.v));
    const lift = enrichLiftArmOf(altMember);
    if (lift !== null) wireRegisterSymbolRename(lift.liftName, name);
    if (!wireRegisterSyntheticRule(name, hoist(lift === null ? altMember : lift.body))) {
      throw new Error(`registerSyntheticRule('${name}'): no active wire() context`);
    }
    refs.push({ altIdx: resolvedAlt, ref: withVariantAnnotation(symbolRef(name), p.v.name, parentKind, altMember), name });
  }
  for (const { altIdx, lift } of lifted) {
    setGroupLiftRuleBody(lift.liftName, hoist(lift.body));
    refs.push({ altIdx, ref: choiceMembers[altIdx], name: lift.liftName });
  }
  refs.sort((a, b) => a.altIdx - b.altIdx);
  registerHoistedVariantConflicts(refs.map((r) => r.name));
  const newChoice = reconstructContainer(
    choice2,
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
  if (t === "BLANK") return { tokens: 0, named: 0 };
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
  const body = getGroupLiftRuleBody(symbol.name);
  return body === void 0 ? null : { body, liftName: symbol.name, symbol };
}
function renameEnrichLift(member, lift, ruleName, nodeName) {
  if (!wireHasAuthoredRule(ruleName)) wireRegisterSyntheticRule(ruleName, withHoistedAnnotation(lift.body));
  wireRegisterSymbolRename(lift.liftName, ruleName);
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
    members[index] = resolvePatch(patch, members[index], key);
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
    const annotated = (rule2) => withVariantAnnotation(rule2, patch.name, parentKind, patch.default === true ? { annotations: { default: true } } : void 0);
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
function unifyChoiceArmFieldNames(content, unifiedName) {
  const r = content;
  if (!r || typeof r !== "object" || !isChoiceType(r.type)) return content;
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
      const body = liftName === void 0 ? void 0 : getGroupLiftRuleBody(liftName);
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
    setGroupLiftRuleBody(liftName, rewrite(body));
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
    return labelled({ ...originalMember, named: true, value: patch.name });
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
  if (isOptionalType(t)) {
    const inner = contentOf3(rule2);
    return matchesEmpty(inner) ? extractNonEmpty(inner) : { nonEmpty: inner };
  }
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

// packages/typescript/grammar.sittir.ts
function immediateClosingDelimiter(original) {
  const seqMembers = original.members;
  const last = seqMembers[seqMembers.length - 1];
  return { ...original, members: [...seqMembers.slice(0, -1), token.immediate(last.value)] };
}
var enrichedBase = enrich(import_grammar.default);
var grammar_sittir_default = grammar(
  enrichedBase,
  wire(
    {
      name: "typescript",
      conflicts: ($, previous) => [
        ...previous ?? [],
        [$.sequence_expression, $.parenthesized_expression_typed],
        [$.sequence_expression, $.parenthesized_expression_arm],
        [$.primary_expression, $.arrow_function],
        [$.readonly_type, $._kw_readonly_marker],
        [$.abstract_method_signature, $._kw_abstract_marker],
        [$.index_signature, $._kw_readonly_marker],
        // The fielded `readonly` in index_signature's modifier group makes
        // `'class' '{' 'readonly' • '['` ambiguous with the sibling
        // class-member rules that also start with a readonly modifier.
        [$.method_definition, $.method_signature, $.index_signature, $.public_field_definition],
        [$.primary_expression, $._kw_async_marker],
        [$.primary_expression, $._property_name, $._kw_async_marker],
        [$.primary_expression, $._kw_static_marker],
        [$.primary_expression, $._kw_readonly_marker],
        [$.primary_expression, $._kw_abstract_marker],
        [$.primary_expression, $._kw_const_marker],
        [$.primary_expression, $._kw_using_marker],
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
        [$.primary_expression, $.rest_pattern, $.primary_type],
        [$.primary_expression, $.rest_pattern, $.literal_type],
        [$.primary_expression, $.rest_pattern, $.predefined_type],
        [$.nested_identifier, $.nested_type_identifier],
        [$._initializer, $.binary_expression],
        [$.primary_expression, $.export_statement_namespace_export],
        [$.binary_expression, $.unary_expression, $.instantiation_expression, $.call_expression_call],
        [$.await_expression, $.binary_expression, $.instantiation_expression, $.call_expression_call],
        [$.binary_expression, $.update_expression, $.instantiation_expression, $.call_expression_call],
        [$.binary_expression, $.instantiation_expression, $.call_expression_call],
        [$._type_query_call_expression_in_type_annotation, $.call_expression_call],
        [$._type_query_call_expression, $.call_expression_call],
        [$.primary_expression, $.export_statement_default],
        [$.string],
        [$.await_expression, $.update_expression_postfix],
        [$.await_expression, $.update_expression_arm1],
        [$.arrow_function, $.update_expression_arm1],
        [$.await_expression, $.call_expression_call],
        [$.instantiation_expression, $.call_expression_call],
        [$.await_expression, $.binary_expression_arm],
        [$.as_expression, $.binary_expression_arm],
        [$.call_expression_call, $.binary_expression_arm],
        // binary_expression_arm (the `in`-operator arm, freshly extracted —
        // same PREC-descent mechanism as call_expression's arms above) mirrors
        // binary_expression's own conflict set: every continuation that used to
        // share LR state with the whole (unsplit) binary_expression choice needs
        // the same explicit GLR declaration now that this one arm has its own
        // symbol boundary.
        [$.call_expression, $.binary_expression_arm, $.unary_expression, $.instantiation_expression],
        [$.call_expression, $.await_expression, $.binary_expression_arm, $.instantiation_expression],
        [$.call_expression, $.binary_expression_arm, $.update_expression, $.instantiation_expression],
        [$.call_expression, $.binary_expression_arm, $.instantiation_expression],
        [$._initializer, $.binary_expression_arm],
        [$.binary_expression_arm, $.unary_expression, $.instantiation_expression, $.call_expression_call],
        [$.await_expression, $.binary_expression_arm, $.instantiation_expression, $.call_expression_call],
        [$.binary_expression_arm, $.update_expression, $.instantiation_expression, $.call_expression_call],
        [$.binary_expression_arm, $.instantiation_expression, $.call_expression_call],
        [$.subscript_expression, $.binary_expression_arm],
        [$.member_expression, $.binary_expression_arm],
        [$.member_expression, $.subscript_expression, $.binary_expression_arm],
        [$.binary_expression, $.instantiation_expression, $.call_expression_call, $.binary_expression_arm],
        [$.non_null_expression, $.binary_expression_arm],
        [$.satisfies_expression, $.binary_expression_arm],
        [$.binary_expression_arm, $.update_expression_postfix],
        [$.binary_expression_arm, $.update_expression_prefix],
        [$.binary_expression_arm, $.update_expression_arm1],
        [$.ternary_expression, $.binary_expression_arm],
        [$.arrow_function, $.call_expression_call],
        [$.arrow_function, $.binary_expression_arm],
        [$.expression, $.call_expression_template_call],
        [$.variable_declarator_arm1, $.for_header_arm2],
        [$.primary_expression, $.for_header_arm2],
        [$.variable_declarator_arm1, $.for_header_let_const_kind],
        [$.class_body_arm1, $.class_body_arm2],
        [$.import, $.meta_property_arm2],
        [$.primary_expression, $.meta_property_arm1],
        [$._lhs_expression, $.export_statement_equals_export],
        [$.object_assignment_pattern, $._lhs_expression],
        [$.object_assignment_pattern, $._lhs_expression, $.export_statement_equals_export],
        [$.primary_expression, $._lhs_expression],
        [$._lhs_expression, $.primary_type],
        [$._lhs_expression, $.literal_type],
        [$._lhs_expression, $.readonly_type],
        [$._lhs_expression, $.predefined_type],
        [$.function_type, $._call_signature],
        [$.primary_expression, $._lhs_expression, $.primary_type],
        [$.primary_expression, $._lhs_expression, $.literal_type],
        [$.primary_expression, $._lhs_expression, $.predefined_type],
        [$.constructor_type, $._call_signature],
        [$._lhs_expression],
        [$.await_expression, $.update_expression_prefix],
        [$.arrow_function, $.update_expression_postfix],
        [$.arrow_function, $.update_expression_prefix],
        [$.primary_expression, $.export_statement_default_from],
        [$.primary_expression, $.export_statement_default_declaration],
        [$.primary_expression, $._parameter_name, $.readonly_type],
        [$.class_body_method],
        [$.class_body_method_sig, $.class_body_member],
        [$.public_field_definition],
        [$.method_definition, $.public_field_definition],
        [$.method_definition, $.method_signature, $.public_field_definition],
        [$.abstract_method_signature, $.public_field_definition],
        [$.primary_expression, $.for_header_lhs],
        [$.primary_expression, $.for_header_var_kind],
        [$.primary_expression, $.for_header_let_const_kind],
        [$.variable_declarator, $.for_header_var_kind],
        [$.variable_declarator, $.for_header_let_const_kind]
      ],
      groups: {
        jsx_opening_element_content: ($) => seq(
          choice(
            field("name", choice($._jsx_identifier, $.jsx_namespace_name)),
            $.jsx_start_opening_element_arm
          ),
          repeat(field("attribute", $._jsx_attribute))
        )
      },
      options: {
        body: { before: preference("indent"), after: preference("dedent") },
        case_body: { start: preference("indent"), end: preference("dedent") },
        gap: { separator: preference("newline") },
        number_hex: { "prefix:": preference("0x") },
        number_octal: { "prefix:": preference("0o") },
        number_binary: { "prefix:": preference("0b") },
        number_float_point: { "marker:": preference("e") },
        number_float_leading_point: { "marker:": preference("e") },
        number_float_scientific: { "marker:": preference("e") },
        statements: { terminator: preference(";") },
        quotes: { style: preference("double") },
        enum_body_elements: { 'content:/separator/","/after': preference("newline"), "content:/delimiter": preference("Delimiter.Trailing") },
        program: { "statements:/separator": preference("tight"), "statements:/(_)/after": preference("blankline") },
        _: {
          "decorator:/separator": preference("tight"),
          "decorator:/(_)/after": preference("newline"),
          "decorator:/end": preference("newline"),
          '"("/before': preference("tight"),
          '"("/after': preference("tight"),
          '")"/before': preference("tight"),
          '"["/before': preference("tight"),
          '"["/after': preference("tight"),
          '"]"/before': preference("tight"),
          '"{"/after': preference("tight"),
          '"}"/before': preference("tight"),
          '"${"/after': preference("tight"),
          '"<"/before': preference("tight"),
          '"<"/after': preference("tight"),
          '">"/before': preference("tight"),
          '"."/before': preference("tight"),
          '"."/after': preference("tight"),
          '","/before': preference("tight"),
          '";"/before': preference("tight"),
          '"++"/before': preference("tight"),
          '"++"/after': preference("tight"),
          '"--"/before': preference("tight"),
          '"--"/after': preference("tight"),
          '"?."/before': preference("tight"),
          '"?."/after': preference("tight"),
          '"..."/after': preference("tight"),
          '":"/before': preference("tight"),
          '":"/after': preference("space"),
          '"="/before': preference("space"),
          '"="/after': preference("space"),
          '"=>"/before': preference("space"),
          '"=>"/after': preference("space"),
          '"|"/before': preference("space"),
          '"|"/after': preference("space"),
          '"&"/before': preference("space"),
          '"&"/after': preference("space"),
          "operator:/before": preference("space"),
          "operator:/after": preference("space"),
          '_/separator/","/before': preference("tight")
        },
        // A space after the substitution's `}` changes the template text. The edge
        // sits in every string-interior context, so no neighbour immediacy reaches it.
        template_substitution: { after: preference("tight") },
        template_type: { after: preference("tight") },
        // Unary `!` is a normal token seam (`! x` compiles fine), and
        // the undeclared default is space — confirmed via a factory
        // construction probe (`ir.unaryExpression({operator:'!',...})`
        // renders "! y", not "!y"; read-render of parsed `!y` masks
        // this because unedited content slices verbatim source bytes
        // rather than consulting this site at all).
        unary_expression_operator: { '"!"/after': preference("tight") },
        number_operator: { '"-"/after': preference("tight"), '"+"/after': preference("tight") },
        object_type_content: {
          "members:/separator/before": preference("tight"),
          "members:/separator/after": preference("newline"),
          "members:/separator/kind": preference("semi"),
          "members:/delimiter": preference("Delimiter.Trailing")
        },
        statement_block: { before: preference("space") },
        class_body: { before: preference("space") },
        switch_body: { before: preference("space") },
        named_imports: {
          before: preference("space"),
          after: preference("space"),
          '"{"/after': preference("space"),
          '"}"/before': preference("space")
        },
        export_clause: {
          before: preference("space"),
          after: preference("space"),
          '"{"/after': preference("space"),
          '"}"/before': preference("space")
        },
        object: { '"{"/after': preference("space"), '"}"/before': preference("space") },
        object_pattern: { '"{"/after': preference("space"), '"}"/before': preference("space") },
        ternary_expression: { '":"/before': preference("space") },
        for_statement: { '"("/before': preference("space"), '";"/after': preference("space") },
        lexical_declaration: { after: preference("space") },
        variable_declaration: { after: preference("space") },
        required_parameter: { "decorator:/(_)/after": preference("space"), "decorator:/end": preference("space") },
        optional_parameter: { "decorator:/(_)/after": preference("space"), "decorator:/end": preference("space") },
        _bindings: {
          "_/terminator:": "statements/terminator",
          "_/automatic_semicolon:": "statements/terminator",
          "string/variant": "quotes/style",
          'class_body/"{"/after': "body/before",
          'class_body/"}"/before': "body/after",
          'statement_block/"{"/after': "body/before",
          'statement_block/"}"/before': "body/after",
          'switch_body/"{"/after': "body/before",
          'switch_body/"}"/before': "body/after",
          'enum_body/"{"/after': "body/before",
          'enum_body/"}"/before': "body/after",
          "object_type/opening:/after": "body/before",
          "object_type/closing:/before": "body/after",
          "switch_case/body:/start": "case_body/start",
          "switch_case/body:/end": "case_body/end",
          "switch_default/body:/start": "case_body/start",
          "switch_default/body:/end": "case_body/end",
          "class_body/content:/separator": "gap/separator",
          "statement_block/statements:/separator": "gap/separator",
          "switch_body/cases:/separator": "gap/separator",
          "switch_case/body:/separator": "gap/separator",
          "switch_default/body:/separator": "gap/separator"
        }
      },
      patches: {
        decorator: { 1: field("expression") },
        decorator_parenthesized_expression: { 1: field("expression") },
        asserts: { 1: field("value") },
        type_query: { 1: field("expression") },
        comment: {
          "1/0/1": regex(/([^*]|\*+[^*\/])*\**/),
          "1/0/2": { type: "STRING", value: "*/" },
          0: variant("line"),
          1: variant("block")
        },
        literal_type: { 0: variant("negative_number") },
        number: {
          "1/0/0": field("integer"),
          "1/0/2": field("fraction"),
          "1/0/3/0/0": field("marker"),
          "1/0/3/0/1/0": field("sign"),
          "1/0/3/0/1/1": field("exponent"),
          "2/0/1": field("fraction"),
          "2/0/2/0/0": field("marker"),
          "2/0/2/0/1/0": field("sign"),
          "2/0/2/0/1/1": field("exponent"),
          "3/0/0": field("integer"),
          "3/0/1/0": field("marker"),
          "3/0/1/1/0": field("sign"),
          "3/0/1/1/1": field("exponent"),
          0: variant("hex"),
          1: variant("float_point"),
          2: variant("float_leading_point"),
          3: variant("float_scientific"),
          4: variant("decimal", { default: true }),
          5: variant("binary"),
          6: variant("octal"),
          7: variant("bigint")
        },
        hash_bang_line: { ".": regex(/#!(?<content>.*)/) },
        binary_expression: {
          24: variant("in")
        },
        arguments: {
          1: field("elements")
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
        object_type: {},
        enum_body: {},
        jsx_expression: {
          1: field("expression")
        },
        // Patch sets apply in order. The second fields the member repeat
        // AFTER the arm-level paths of the first resolve against the
        // un-fielded shape: with the stray `';'` arm minted as its own kind
        // `empty_member`, every element — members and stray semicolons
        // alike — keys into one ordered `_content` array. The third's
        // variant paths then traverse the `content` field the second added.
        class_body: [
          {
            "1/0/4": alias("empty_member"),
            "1/0/0/2": field("terminator"),
            "1/0/1/1": field("terminator"),
            "1/0/3/0": field("member"),
            "1/0/3/1": field("terminator")
          },
          { 1: field("content") },
          {
            "1/content:/0/0": variant("method"),
            "1/content:/0/1": variant("method_sig"),
            "1/content:/0/3": variant("member")
          }
        ],
        abstract_method_signature: {
          "3/0": field("accessor_kind"),
          "5/0": field("optional_marker")
        },
        ambient_declaration: {
          "1/0": variant("declaration"),
          "1/1": variant("global"),
          "1/2": variant("module")
        },
        jsx_namespace_name: { 0: field("namespace"), 2: field("name") },
        as_expression: {
          2: field("type_annotation")
        },
        class_declaration: {
          "4/0": field("heritage"),
          6: field("automatic_semicolon")
        },
        import_alias: {
          1: field("name"),
          3: field("value"),
          4: field("terminator")
        },
        import_attribute: {
          0: field("attribute_kind")
        },
        index_signature: [
          {
            // Presence carrier for the bare `readonly` modifier: the
            // enclosing optional group's only other slot (`sign`) is
            // itself optional, so without this field a sign-less
            // `readonly [k: string]: T` has nothing recording the
            // group's occurrence and render drops the keyword.
            "0/0/1": field("readonly_marker")
          },
          { "2/0": variant("colon"), "2/1": variant("mapped_type_clause") }
        ],
        import_statement: [
          { "2/0": variant("clause_from") },
          {
            1: field("import_clause"),
            2: field("from_clause"),
            4: field("terminator")
          }
        ],
        infer_type: {
          // No field on position 2 (the optional `extends` clause group):
          // an outer field on an inlined hidden group makes tree-sitter tag
          // every spliced child with the OUTER name, while the slot model
          // names the slot from the inner field — the wire and the model
          // then disagree and the clause never renders. The enrich-supplied
          // inner field('type') is the single naming source.
          1: field("name")
        },
        intersection_type: {
          0: field("left"),
          2: field("right")
        },
        lexical_declaration: {
          1: field("declarators"),
          2: field("terminator")
        },
        lookup_type: {
          0: field("type"),
          2: field("index_type")
        },
        member_expression: {
          1: field("separator")
        },
        method_definition: {
          1: field("static_marker"),
          "3/0": field("readonly_marker"),
          "4/0": field("async_marker"),
          "5/0": field("accessor_kind"),
          "7/0": field("optional_marker")
        },
        method_signature: {
          1: field("static_marker"),
          "5/0": field("accessor_kind"),
          "7/0": field("optional_marker")
        },
        program: {
          0: field("hash_bang_line"),
          1: field("statements")
        },
        property_signature: {
          1: field("static_marker"),
          "5/0": field("optional_marker")
        },
        satisfies_expression: {
          2: field("type_annotation")
        },
        statement_block: {
          1: field("statements"),
          3: field("automatic_semicolon")
        },
        union_type: {
          0: field("left"),
          2: field("right")
        },
        variable_declaration: {
          1: field("declarators"),
          2: field("terminator")
        },
        yield_expression: {
          1: field("expression")
        },
        expression_statement: {
          0: field("expression"),
          1: field("terminator")
        },
        type_alias_declaration: {
          5: field("terminator")
        },
        // `_expressions` is one expression or a sequence_expression; the
        // slot holds one value, so it is named for that, not for the
        // hidden rule's plural.
        return_statement: {
          1: field("expression"),
          2: field("terminator")
        },
        throw_statement: {
          1: field("expression"),
          2: field("terminator")
        },
        function_expression: {
          "0/0": field("async_marker")
        },
        function_declaration: {
          "0/0": field("async_marker")
        },
        generator_function: {
          "0/0": field("async_marker")
        },
        generator_function_declaration: {
          "0/0": field("async_marker")
        },
        break_statement: {
          2: field("terminator")
        },
        continue_statement: {
          2: field("terminator")
        },
        debugger_statement: {
          1: field("terminator")
        },
        do_statement: {
          4: field("terminator")
        },
        constructor_type: {
          "0/0": field("abstract_marker")
        },
        enum_declaration: {
          "0/0": field("const_marker")
        },
        function_signature: {
          4: field("terminator")
        },
        assignment_expression: {
          "0/0": field("using_marker")
        },
        export_specifier: {
          "0/0": field("export_kind")
        },
        import_specifier: [{ "0/0": field("import_kind") }, { "1/0": variant("name"), "1/1": variant("as") }],
        public_field_definition: {
          // Both spellings of the accessibility position (declare-first
          // and access-first modifier orders) carry ONE shared field so
          // the exclusive occurrences merge into a single slot, same as
          // the enrich-promoted `*_marker` fields merge across the
          // permutation arms.
          "1/0/0/1/0": field("accessibility_modifier"),
          "1/0/1/0": field("accessibility_modifier"),
          "4/0": field("optionality_marker")
        },
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
        // `export_statement_default`'s body is a top-level choice of
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
        call_expression: {
          0: variant("call"),
          1: variant("template_call"),
          2: variant("member")
        },
        string: { 0: variant("double"), 1: variant("single") },
        update_expression: {
          0: variant("postfix"),
          1: variant("prefix")
        },
        arrow_function: { "1/0": variant("parameter") },
        class_heritage: { "0": variant("extends_clause"), "1": variant("implements_clause") },
        extends_clause: { "1/0": alias("extends_clause_single"), "1/1/0/1": alias("extends_clause_single") },
        import_clause: {
          "0": variant("namespace_import"),
          "1": variant("named_imports"),
          "2": variant("default_import")
        },
        export_statement_default: {
          0: variant("from"),
          "0/1/0": variant("star_from"),
          "0/1/1": variant("ns_from"),
          "0/1/2": variant("clause_from"),
          1: variant("declaration"),
          "1/2/1": variant("default_kw"),
          "1/2/1/1/1": variant("value")
        },
        variable_declarator: { 0: variant("plain"), 1: variant("definite") },
        meta_property: { 0: variant("new_target"), 1: variant("import_meta") },
        namespace_import: { 2: field("name") },
        else_clause: { 1: field("body") },
        jsx_element: { 1: field("children") },
        class: { "4/0": field("heritage") },
        abstract_class_declaration: { "5/0": field("heritage") },
        import_require_clause: { 0: field("name") },
        index_type_query: { 1: field("type") },
        flow_maybe_type: { 1: field("type") },
        array_type: { 0: field("type") },
        export_statement_namespace_export: { 3: field("name"), 4: field("terminator") },
        export_statement_type_export: { 4: field("terminator") },
        export_statement_equals_export: { 3: field("terminator") },
        _for_header: {
          "1/0": variant("lhs"),
          "1/1": variant("var_kind"),
          "1/2": variant("let_const_kind")
        }
      },
      externals: ($, previous) => [...previous ?? [], $._tight, $._space, $._newline, $._blankline, $._indent, $._dedent],
      supertypes: ($, previous) => [...previous ?? [], $._whitespace],
      extras: ($, previous) => [...previous ?? []],
      visibleExternals: (_$) => ({
        _automatic_semicolon: string("\n"),
        _function_signature_automatic_semicolon: string("\n"),
        _tight: string(""),
        _space: string(" "),
        _newline: string("\n"),
        _blankline: string("\n\n"),
        _indent: indent(),
        _dedent: dedent()
      }),
      expectTestFailures: {
        debugger_statement: "#170 \u2014 _resolveOneLeaf cannot resolve the _semicolon stub",
        import_require_clause: "#170 \u2014 Missing field _content on ImportRequireClauseTransport._source",
        object_type_content: "#170 (#172-adjacent) \u2014 Missing field _content through export-arm transport",
        string: "#170 \u2014 StringContentTransportSlot rejects stub ($type property missing)"
      },
      rules: {
        _whitespace: ($) => choice($._tight, $._space, $._newline, $._blankline, $._indent, $._dedent),
        string: ($, original) => ({
          ...original,
          members: original.members.map((arm2) => {
            const seqMembers = arm2.members;
            const last = seqMembers[seqMembers.length - 1];
            if (last.type !== "STRING") return arm2;
            return {
              ...arm2,
              members: [...seqMembers.slice(0, -1), token.immediate(last.value)]
            };
          })
        }),
        template_string: ($, original) => immediateClosingDelimiter(original),
        template_literal_type: ($, original) => immediateClosingDelimiter(original),
        template_type: ($) => seq(token.immediate("${"), field("type", choice($.primary_type, $.infer_type)), "}"),
        // `template_substitution` sits only in string-interior contexts
        // (template_string / template_literal_type elements), where any
        // preceding characters are absorbed into a fragment token — no
        // whitespace can ever precede its `${`, but upstream writes a
        // plain string. Declaring `token.immediate` matters for
        // RENDERING: `$` is word-class in typescript, so without the
        // declared fact the seam check injects a hazard space after a
        // word-ending fragment or escape (`mid\n ${`), which reparses
        // as a spurious one-space string_fragment. The stamp makes the
        // kind left-immediate (its leftmost terminal), so structural
        // references render seam-free. Parser-neutral by the absorption
        // argument above.
        template_substitution: ($) => seq(token.immediate("${"), field("expression", $._expressions), "}"),
        // The signature arm of an arrow function is upstream's hidden
        // `_call_signature`, whose fields inline into the parent. Upstream
        // typescript already declares that body as the visible kind
        // `call_signature`, so the arm references that kind directly:
        // storage and parse are one symbol, the arm seats through the
        // existing factory, and no per-parent form kind is minted for a
        // body that has a name of its own. Positions are unchanged, so the
        // `parameter` polymorph path above stays valid.
        arrow_function: ($, original) => ({
          ...original,
          members: original.members.map(
            (m, i) => i === 1 ? {
              ...m,
              members: m.members.map((arm2, j) => j === 1 ? $.call_signature : arm2)
            } : m
          )
        }),
        _reserved_identifier: ($, original) => {
          const members = original.members;
          const last = members[members.length - 1];
          const flatMembers = last && last.type === "CHOICE" && Array.isArray(last.members) ? [...members.slice(0, -1), ...last.members] : members;
          return {
            ...original,
            members: flatMembers
          };
        },
        ambient_declaration_global: ($) => seq("global", field("body", $.statement_block)),
        ambient_declaration_module: ($) => prec.right(
          seq(
            "module",
            ".",
            field("name", alias($.identifier, $.property_identifier)),
            ":",
            field("type", $.type),
            optional(field("terminator", $._semicolon))
          )
        ),
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
        object_type_content: ($) => {
          const SEP = () => choice(",", ";");
          const member = choice(
            $.export_statement,
            $.property_signature,
            $.call_signature,
            $.construct_signature,
            $.index_signature,
            $.method_signature
          );
          return seq(optional(SEP()), seq(field("members", member), repeat(seq(SEP(), field("members", member)))), optional(SEP()));
        }
      },
      renderAs: (_$) => ({
        html_comment: /<!--[\s\S]*?-->/,
        jsx_text: /[^{}<>]+/,
        _template_chars: token.immediate(/[^`\\$]+/)
      })
    },
    enrichedBase
  )
);
if (module.exports && module.exports.default) module.exports = module.exports.default;
