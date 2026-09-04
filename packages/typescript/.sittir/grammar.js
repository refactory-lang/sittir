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
  if (isPrecWrapper(rule)) {
    return descendThroughPrecWrapper(rule, segments, patch, precStack);
  }
  if (segments.length === 0) {
    return typeof patch === "function" ? patch(rule, precStack) : patch;
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
function getGroupLiftRuleBody(name) {
  return groupLiftRuleMap?.get(name);
}
function setGroupLiftRuleBody(name, body) {
  groupLiftRuleMap?.set(name, body);
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
  if (t === "OPTIONAL") return carryOverProperties(rule, nativeRequired("optional")(newContent));
  if (t === "REPEAT" || t === "REPEAT1") {
    return carryOverProperties(rule, nativeRequired(t === "REPEAT" ? "repeat" : "repeat1")(newContent));
  }
  if (isFieldType(t)) {
    const name = rule.name;
    return carryOverProperties(rule, nativeRequired("field")(name, newContent));
  }
  throw new Error(
    `reconstructWrapper: no native dsl reconstruction for wrapper type '${rule.type}' \u2014 this is a bug in the path-descent logic.`
  );
}
function carryOverProperties(rule, rebuilt) {
  if (rebuilt.type !== rule.type) return rebuilt;
  const original = rule;
  const out = rebuilt;
  for (const key of Object.keys(original)) {
    if (key in out) continue;
    const value = original[key];
    if (value === void 0) continue;
    out[key] = value;
  }
  return rebuilt;
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

// packages/codegen/src/dsl/primitives/preference.ts
function isPreference(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "preference";
}
function preference(label, defaultArm) {
  return { __sittirPlaceholder: "preference", label, default: defaultArm };
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

// packages/codegen/src/dsl/primitives/variant.ts
function isVariantPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "variant";
}
function variant(name) {
  return { __sittirPlaceholder: "variant", name };
}

// packages/codegen/src/types/rule-types.ts
var SEQ = "SEQ";
var OPTIONAL = "OPTIONAL";
var CHOICE = "CHOICE";
var REPEAT = "REPEAT";
var REPEAT1 = "REPEAT1";
var STRING = "STRING";
var PATTERN = "PATTERN";
var SYMBOL = "SYMBOL";
var TOKEN = "TOKEN";

// packages/codegen/src/dsl/rule-walker.ts
var RuleWalker = class {
  #rules;
  diagnostics;
  constructor(rules, diagnostics) {
    this.#rules = rules;
    this.diagnostics = diagnostics;
  }
  childEdgesOf(rule) {
    const out = [];
    const bag = rule;
    if (Array.isArray(bag.members)) {
      bag.members.forEach((child, i) => out.push({ segment: ["members", i], child }));
    } else if (bag.content && typeof bag.content === "object") {
      out.push({ segment: ["content"], child: bag.content });
    }
    if (bag.separator && typeof bag.separator === "object" && "value" in bag.separator)
      out.push({ segment: ["separator", "value"], child: bag.separator.value });
    return out;
  }
  childrenOf(rule) {
    return this.childEdgesOf(rule).map((e) => e.child);
  }
  map(rule, visit) {
    const bag = rule;
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
    return Object.keys(patch).length > 0 ? { ...rule, ...patch } : rule;
  }
  fold(rule, init, f) {
    let acc = f(init, rule);
    for (const child of this.childrenOf(rule)) acc = this.fold(child, acc, f);
    return acc;
  }
  find(rule, pred) {
    if (pred(rule)) return rule;
    for (const child of this.childrenOf(rule)) {
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
  foldDeep(rule, init, f) {
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
    return go(rule, init);
  }
  findDeep(rule, pred) {
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
    return go(rule);
  }
};

// packages/codegen/src/dsl/rule-metadata.ts
function makeRuleMetadata(shape) {
  return shape;
}
function normalizeEnumMembers(members, provenance) {
  if (members.length === 1) return members[0];
  return {
    type: CHOICE,
    members,
    ...provenance !== void 0 ? { metadata: makeRuleMetadata(provenance) } : {}
  };
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

// packages/codegen/src/dsl/shared.ts
function ruleKey(rule) {
  return JSON.stringify(canonicalize(rule));
}
function canonicalize(rule) {
  if (typeof rule !== "object" || rule === null) return rule;
  const r = rule;
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
function isEnumChoiceRule(rule) {
  return rule.type === CHOICE && rule.members.length >= 2 && rule.members.every((m) => m.type === STRING || m.type === SYMBOL && m.literal !== void 0);
}
function leadingLiteralOf(r) {
  if (!typeEq(r.type, "CHOICE")) return null;
  const members = r.members ?? [];
  const lit = members.find((m) => typeEq(m.type, "STRING"));
  return lit ? lit.value : null;
}
function separatorOf(resolved) {
  if (!typeEq(resolved.type, "SEQ")) return null;
  const members = resolved.members;
  if (!members || members.length !== 2) return null;
  const [first, second] = members;
  const firstIsStr = typeEq(first.type, "STRING");
  const secondIsStr = typeEq(second.type, "STRING");
  if (firstIsStr && !secondIsStr) return { content: second, separator: first };
  if (secondIsStr && !firstIsStr) return { content: first, separator: second, trailing: true };
  const firstIsChoice = typeEq(first.type, "CHOICE");
  const secondIsChoice = typeEq(second.type, "CHOICE");
  if (firstIsChoice && !secondIsStr) return { content: second, separator: first };
  if (secondIsChoice && !firstIsStr) return { content: first, separator: second, trailing: true };
  return null;
}
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
function isNonterminalSeparatorType(t) {
  return isChoiceType(t) || isSymbolType(t) || typeEq(t, "PATTERN");
}
function repeatHasNonterminalSeparator(repeatRule) {
  const content = repeatRule.content;
  if (!content || typeof content !== "object") return false;
  const detected = separatorOf(content);
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
function repeatMemberHasGenuineSeparatorVariability(repeatRule, siblings) {
  if (repeatHasNonterminalSeparator(repeatRule)) return true;
  const content = repeatRule.content;
  if (!content || typeof content !== "object") return false;
  const detected = separatorOf(content);
  if (!detected || !isStringType(detected.separator.type)) return false;
  const sepValue = detected.separator.value;
  if (typeof sepValue !== "string") return false;
  return siblings.some((m) => m !== repeatRule && isOptionalSeparatorFlank(m, sepValue));
}
function repeatHasGenuineSeparatorVariability(repeatRule) {
  return repeatHasNonterminalSeparator(repeatRule);
}
function seqHasGenuineSeparatorVariability(members) {
  const flat = flattenSeqMembers(members);
  const repeatMembers = [];
  for (const m of flat) {
    const core = unwrapPrec(m);
    if (!core || typeof core !== "object") continue;
    const ct = core.type;
    if (typeof ct !== "string" || !isRepeatLike(ct)) continue;
    const content = core.content;
    if (content && typeof content === "object" && separatorOf(content) !== null) {
      repeatMembers.push(core);
    }
  }
  if (repeatMembers.length !== 1) return false;
  return repeatMemberHasGenuineSeparatorVariability(repeatMembers[0], flat);
}
function isInlineSafe(seqBody, rulesBag) {
  if (!seqBody || typeof seqBody !== "object") return false;
  const r = seqBody;
  const t = typeof r.type === "string" ? r.type : "";
  if (isRepeatLike(t)) return !repeatHasGenuineSeparatorVariability(seqBody);
  if (typeEq(t, "ALIAS")) return true;
  if (!isSeqType(t)) return false;
  const members = r.members;
  if (!Array.isArray(members)) return false;
  if (seqHasTopLevelRepeat(members)) return !seqHasGenuineSeparatorVariability(members);
  const slots = collectSlots(members, rulesBag);
  if (slots.length !== 1) return false;
  const core = unwrapPrec(slots[0]);
  if (!core || typeof core !== "object") return false;
  const coreType = core.type;
  if (typeof coreType !== "string") return false;
  return isFieldType(coreType) || isSymbolType(coreType);
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
      const detected = separatorOf(content);
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
function optionalStringLiteral(rule) {
  const peeled = peelOptional(rule);
  if (!peeled.isOptional) return null;
  const innerN = normalizeMember(peeled.inner);
  if (isStringType(innerN.type) && typeof innerN.value === "string") return innerN.value;
  return null;
}
function separatedListElementName(rule) {
  const t = rule.type;
  if (typeof t !== "string") return null;
  if (isFieldType(t)) {
    const name = rule.name;
    return typeof name === "string" ? name : null;
  }
  if (isSymbolType(t)) {
    const name = rule.name;
    return typeof name === "string" ? name.replace(/^_+/, "") : null;
  }
  if (isChoiceType(t)) {
    const members = rule.members;
    if (Array.isArray(members) && members.length === 1) return separatedListElementName(members[0]);
    return null;
  }
  if (isPrecWrapper(rule) || typeEq(t, "ALIAS")) {
    const content = rule.content;
    return content ? separatedListElementName(content) : null;
  }
  return null;
}
function peelOptionalEitherSpelling(rule) {
  const peeled = peelOptional(rule);
  return peeled.isOptional ? peeled.inner : null;
}
function separatedListBodyInfo(body) {
  if (!isSeqType(body.type)) return null;
  const members = body.members;
  if (!Array.isArray(members) || members.length === 0) return null;
  const separatorRepeatOf = (m) => {
    if (!isRepeatType(m.type)) return null;
    const content = m.content;
    return content ? separatorOf(content) : null;
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
      });
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
function armLeadingSymbolName(rule, rulesBag, seen = /* @__PURE__ */ new Set()) {
  if (seen.has(rule)) return void 0;
  seen.add(rule);
  const t = rule.type;
  if (typeof t !== "string") return void 0;
  if (isSymbolType(t)) {
    const name = rule.name;
    if (typeof name !== "string") return void 0;
    const body = rulesBag[name];
    if (body?.hidden !== true) return name;
    return body ? armLeadingSymbolName(body, rulesBag, seen) ?? name : name;
  }
  if (isSeqType(t)) {
    const members = rule.members;
    const first = Array.isArray(members) ? members[0] : void 0;
    return first ? armLeadingSymbolName(first, rulesBag, seen) : void 0;
  }
  if (isChoiceType(t)) {
    return void 0;
  }
  const content = rule.content;
  return content ? armLeadingSymbolName(content, rulesBag, seen) : void 0;
}
function armStartsWithSymbol(rule, collidingLeadingNames, rulesBag) {
  if (collidingLeadingNames.size === 0) return false;
  const name = armLeadingSymbolName(rule, rulesBag);
  return name !== void 0 && collidingLeadingNames.has(name);
}
function isLiteralChoiceContent(rule) {
  if (isStringType(rule.type)) return true;
  if (isChoiceType(rule.type)) {
    const members = rule.members;
    return Array.isArray(members) && members.every((m) => isLiteralChoiceContent(m));
  }
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

// packages/codegen/src/types/parsekind-collisions.ts
function kindKey(id, name) {
  return id !== void 0 ? `#${id}` : `n:${name}`;
}
function diagnoseParseKindCollisions(input) {
  const byParseKind = /* @__PURE__ */ new Map();
  for (const value of input.values) {
    if (value.parseKind === void 0 || value.storageKind === void 0) continue;
    const key = kindKey(value.parseKindId, value.parseKind);
    const bucket = byParseKind.get(key) ?? [];
    bucket.push(value);
    byParseKind.set(key, bucket);
  }
  const mergedByParseKind = /* @__PURE__ */ new Map();
  const diagnostics = [];
  for (const [parseKey, bucket] of byParseKind) {
    const parseKind = bucket[0].parseKind;
    const storageIdentities = distinct(bucket.map((value) => kindKey(value.storageKindId, value.storageKind)));
    if (storageIdentities.length <= 1) continue;
    const signatures = distinct(bucket.map((value) => value.structuralSignature));
    if (signatures.length === 1) {
      mergedByParseKind.set(parseKey, pickRepresentative(bucket, parseKind));
      continue;
    }
    const byWireIdentity = /* @__PURE__ */ new Map();
    for (const value of bucket) {
      const wireKey = value.storageKindId !== void 0 ? `#${value.storageKindId}` : `?${parseKey}`;
      const group = byWireIdentity.get(wireKey) ?? [];
      group.push(value);
      byWireIdentity.set(wireKey, group);
    }
    for (const group of byWireIdentity.values()) {
      const groupStorageIdentities = distinct(group.map((value) => kindKey(value.storageKindId, value.storageKind)));
      if (groupStorageIdentities.length <= 1) continue;
      if (distinct(group.map((value) => value.structuralSignature)).length === 1) continue;
      const storageKinds = distinct(group.map((value) => value.storageKind));
      diagnostics.push({
        code: "parsekind-noninjective",
        severity: "error",
        message: `Slot '${input.slotName}' of kind '${input.ownerKind}' collapses [${storageKinds.join(", ")}] onto parse kind '${parseKind}'.`,
        canProceed: true,
        ownerKind: input.ownerKind,
        slotName: input.slotName,
        shape: "propose-distinct-alias",
        parseKind,
        storageKinds,
        proposal: `Slot '${input.slotName}' of kind '${input.ownerKind}' collapses distinct storage kinds [${storageKinds.join(", ")}] onto parse kind '${parseKind}'. Give each colliding arm a distinct alias (for example via variant()/alias()) so read-time dispatch stays injective.`
      });
    }
  }
  if (mergedByParseKind.size === 0) {
    return { values: input.values.map((value) => value.original), diagnostics };
  }
  const emittedParseKeys = /* @__PURE__ */ new Set();
  const values = [];
  for (const value of input.values) {
    if (value.parseKind === void 0) {
      values.push(value.original);
      continue;
    }
    const parseKey = kindKey(value.parseKindId, value.parseKind);
    const merged = mergedByParseKind.get(parseKey);
    if (!merged) {
      values.push(value.original);
      continue;
    }
    if (emittedParseKeys.has(parseKey)) continue;
    values.push(merged.original);
    emittedParseKeys.add(parseKey);
  }
  return { values, diagnostics };
}
function pickRepresentative(bucket, parseKind) {
  const preferred = bucket.find((value) => value.preferRepresentative) ?? bucket.find((value) => value.storageKind === parseKind);
  return preferred ?? bucket[0];
}
function distinct(values) {
  return [...new Set(values)];
}

// packages/codegen/src/dsl/enrich.ts
function withContent(node, content) {
  return { ...node, content };
}
function enrich(baseInput, config) {
  const base2 = baseInput;
  const enrichSkip = new Set(config?.skip ?? []);
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
  const clauseGroupOwners = /* @__PURE__ */ new Map();
  const unaliasSink = { diagnostics: [], seen: /* @__PURE__ */ new Set() };
  const enrichedRules = {};
  for (const name of Object.keys(rulesBag)) {
    const rule = rulesBag[name];
    enrichedRules[name] = rule && !enrichSkip.has(name) ? applyFieldWrapPasses(name, rule, kwRules, supertypeNames, rulesBag, wordMatcher) : rule;
  }
  for (const name of Object.keys(enrichedRules)) {
    const rule = enrichedRules[name];
    if (!rule || enrichSkip.has(name)) continue;
    if (!isSeqType(rule.type)) continue;
    const info = separatedListBodyInfo(rule);
    if (!info?.flankCarrying || info.form !== "head") continue;
    const members = rule.members;
    if (info.flatMembers === members) continue;
    enrichedRules[name] = { ...rule, members: info.flatMembers };
  }
  for (const name of Object.keys(enrichedRules)) {
    const rule = enrichedRules[name];
    if (!rule || enrichSkip.has(name)) continue;
    enrichedRules[name] = distributeExclusiveFieldChoices(rule, enrichedRules);
  }
  separatedListNameCounts = collectSeparatedListNameProposals(enrichedRules);
  separatedListEnrichSkip = enrichSkip;
  hiddenListPromotionNames = /* @__PURE__ */ new Map();
  hoistKwRules = kwRules;
  hoistWordMatcher = wordMatcher;
  try {
    for (const name of Object.keys(enrichedRules)) {
      const rule = enrichedRules[name];
      if (!rule || enrichSkip.has(name)) continue;
      enrichedRules[name] = applyHoistAndUnalias(
        name,
        rule,
        kwRules,
        supertypeNames,
        rulesBag,
        clauseGroupRules,
        clauseDedupeMap,
        groupDedupeMap,
        visibleGroupHiddenNames,
        clauseGroupOwners,
        unaliasSink
      );
    }
  } finally {
    separatedListNameCounts = null;
    separatedListEnrichSkip = null;
    hiddenListPromotionNames = null;
    hoistKwRules = null;
    hoistWordMatcher = void 0;
  }
  for (const groupName of Object.keys(clauseGroupRules)) {
    const groupBody = clauseGroupRules[groupName];
    if (!groupBody) continue;
    const groupUnaliasResult = applyUnaliasDistinct(
      groupName,
      groupBody,
      rulesBag,
      kwRules,
      clauseGroupRules,
      supertypeNames
    );
    clauseGroupRules[groupName] = groupUnaliasResult.rule;
    for (const diagnostic of groupUnaliasResult.diagnostics) {
      recordUnaliasDiagnostic(unaliasSink, diagnostic);
    }
  }
  const mergedRules = { ...enrichedRules, ...kwRules, ...clauseGroupRules };
  collapseSingletonMintOrdinals(mergedRules, clauseGroupRules, visibleGroupHiddenNames, clauseGroupOwners);
  for (const name of Object.keys(mergedRules)) {
    if (enrichSkip.has(name)) continue;
    const rule = mergedRules[name];
    if (rule) mergedRules[name] = applyNodeChoiceFieldWrap(name, rule, mergedRules, supertypeNames);
  }
  synthesizeFieldEnumRules(mergedRules);
  setGroupLiftRuleMap({
    get: (n) => mergedRules[n],
    set: (n, b) => {
      mergedRules[n] = b;
    }
  });
  const clauseGroupNames = new Set(Object.keys(clauseGroupRules).filter((n) => !visibleGroupHiddenNames.has(n)));
  const result = hasWrapper ? { ...base2, grammar: { ...base2.grammar, rules: mergedRules } } : { ...base2, rules: mergedRules };
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
  if (unaliasSink.diagnostics.length > 0) {
    Object.defineProperty(result, ENRICH_UNALIAS_DIAGNOSTICS_KEY, {
      value: unaliasSink.diagnostics,
      enumerable: false,
      writable: false,
      configurable: true
    });
  }
  if (visibleGroupHiddenNames.size > 0) {
    Object.defineProperty(result, ENRICH_VISIBLE_GROUP_SOURCES_KEY, {
      value: visibleGroupHiddenNames,
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
function applyFieldWrapPasses(ruleName, rule, kwRules, supertypeNames, rulesBag, wordMatcher) {
  const MAX_ITERATIONS = 8;
  let r = rule;
  let converged = false;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const before = r;
    r = applySymbolToField(ruleName, r, supertypeNames);
    r = applyChoiceArmFieldWrap(ruleName, r, supertypeNames, rulesBag);
    r = applyRepeatUnionFieldPromotion(ruleName, r, rulesBag);
    r = applyOptionalKeyword(ruleName, r, kwRules, rulesBag, wordMatcher);
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
function applyHoistAndUnalias(ruleName, rule, kwRules, supertypeNames, rulesBag, clauseGroupRules, clauseDedupeMap, groupDedupeMap, visibleGroupHiddenNames, clauseGroupOwners, unaliasSink) {
  let r = rule;
  const clauseHoistCounter = { opt: 0, grp: 0, arm: 0, supertypeNames };
  r = applyClauseHoist(
    ruleName,
    r,
    rulesBag,
    clauseGroupRules,
    clauseDedupeMap,
    clauseHoistCounter,
    groupDedupeMap,
    visibleGroupHiddenNames,
    clauseGroupOwners
  );
  const unaliasResult = applyUnaliasDistinct(ruleName, r, rulesBag, kwRules, clauseGroupRules, supertypeNames);
  r = unaliasResult.rule;
  for (const diagnostic of unaliasResult.diagnostics) {
    recordUnaliasDiagnostic(unaliasSink, diagnostic);
  }
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
function isAnonymousLiteralShapedRule(name, rulesBag, seen) {
  if (seen.has(name)) return false;
  seen.add(name);
  const rule = rulesBag[name];
  if (!rule) return true;
  return isAnonymousLiteralShapedContent(rule, rulesBag, seen);
}
function isAnonymousLiteralShapedContent(rule, rulesBag, seen) {
  if (isStringType(rule.type) || rule.type === "PATTERN") return true;
  if (isChoiceType(rule.type)) {
    const members = rule.members;
    return members.every((m) => isAnonymousLiteralShapedContent(m, rulesBag, seen));
  }
  if (isSymbolType(rule.type) && typeof rule.name === "string") {
    return isAnonymousLiteralShapedRule(rule.name, rulesBag, seen);
  }
  return false;
}
function applyChoiceArmFieldWrap(ruleName, rule, supertypeNames, rulesBag) {
  if (ruleName.startsWith("_")) return rule;
  let cursor = rule;
  const precStack = [];
  while (isPrecWrapper(cursor)) {
    precStack.push(cursor);
    cursor = cursor.content;
  }
  if (!isChoiceType(cursor.type)) return rule;
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
  if (!anyArmChanged) return rule;
  let result = { ...cursor, members: newArms };
  for (let i = precStack.length - 1; i >= 0; i--) {
    result = withContent(precStack[i], result);
  }
  return result;
}
function collectAllFieldNamesDeep(rule, into) {
  if (isFieldType(rule.type) && typeof rule.name === "string") {
    into.add(rule.name);
  }
  const bag = rule;
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
    let rebuilt = symbol;
    for (let i = precStack.length - 1; i >= 0; i--) {
      rebuilt = withContent(precStack[i], rebuilt);
    }
    return rebuilt;
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
function peelTransparentElementWrappers(rule) {
  if (isPrecWrapper(rule)) {
    return peelTransparentElementWrappers(rule.content);
  }
  const members = rule.members;
  if (isChoiceType(rule.type) && members?.length === 1) {
    return peelTransparentElementWrappers(members[0]);
  }
  return rule;
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
function fieldSeparatedListElements(seqRule, reserve) {
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
    const detected = separatorOf(inner);
    if (!detected || detected.trailing) continue;
    const innerElement = detected.content;
    if (!sameElementShape(leading, innerElement)) continue;
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
function applyNodeChoiceFieldWrap(ruleName, rule, mergedRules, supertypeNames) {
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
  countEligibleRefs(rule);
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
      const sepListRewrite = fieldSeparatedListElements(r, (base2) => reserve(base2, scope));
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
  const result = visit(rule, false, namesDeepIn(rule));
  return changed ? result : rule;
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
function distributeExclusiveFieldChoices(rule, rulesBag) {
  const seqFn = nativeRuleFn("seq");
  const choiceFn = nativeRuleFn("choice");
  const collapse = (alts) => alts.length === 1 ? alts[0] : { ...choiceFn(...alts), metadata: makeRuleMetadata({ author: "enrich" }) };
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
  return collapse(expand(rule));
}
function applyRepeatUnionFieldPromotion(ruleName, rule, rulesBag) {
  const preExistingFieldNames = /* @__PURE__ */ new Set();
  const collectNames = (node) => {
    const n = node;
    if (isFieldType(n.type) && typeof n.name === "string" && n.metadata?.fieldSource !== "enriched") {
      preExistingFieldNames.add(n.name);
    }
    if (n.members) for (const m of n.members) collectNames(m);
    else if (n.content) collectNames(n.content);
  };
  collectNames(rule);
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
  return rebuild(rule);
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
    result = withContent(precStack[i], result);
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
    rebuilt = withContent(innerPrecStack[i], rebuilt);
  }
  rebuilt = withContent(cursor, rebuilt);
  for (let i = memberPrecStack.length - 1; i >= 0; i--) {
    rebuilt = withContent(memberPrecStack[i], rebuilt);
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
    result = withContent(innerPrecStack[i], result);
  }
  result = withContent(cursor, result);
  for (let i = outerPrecStack.length - 1; i >= 0; i--) {
    result = withContent(outerPrecStack[i], result);
  }
  return result;
}
function applyOptionalKeyword(ruleName, rule, kwRules, rulesBag, wordMatcher) {
  const inner = peelPrec(rule);
  const claimed = isSeqType(inner.type) ? collectFieldNamesRuntime(inner) : /* @__PURE__ */ new Set();
  return walkOptionalKeyword(ruleName, rule, claimed, kwRules, rulesBag, wordMatcher) ?? rule;
}
function peelPrec(rule) {
  let cursor = rule;
  while (isPrecWrapper(cursor)) {
    cursor = cursor.content;
  }
  return cursor;
}
function tryPromoteOptionalNode(ruleName, rule, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher) {
  const peeled = peelOptional(rule);
  if (!peeled.isOptional) return { matched: false, result: null };
  const replacement = tryPromoteInnerKeyword(
    ruleName,
    rule,
    peeled.inner,
    claimedAtSeqLevel,
    kwRules,
    rulesBag,
    wordMatcher
  );
  if (replacement !== null) return { matched: true, result: replacement };
  const innerRewritten = walkOptionalKeyword(ruleName, peeled.inner, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
  if (innerRewritten !== null) {
    return { matched: true, result: rebuildOptional(rule, innerRewritten) };
  }
  return { matched: true, result: null };
}
function walkOptionalKeyword(ruleName, rule, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher) {
  if (isSeqType(rule.type)) {
    const members = rule.members;
    let changed = false;
    const newMembers = members.map((m) => {
      const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
      if (out === null) return m;
      changed = true;
      return out;
    });
    return changed ? { ...rule, members: newMembers } : null;
  }
  if (isChoiceType(rule.type)) {
    const promoted2 = tryPromoteOptionalNode(ruleName, rule, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
    if (promoted2.matched) return promoted2.result;
    const members = rule.members;
    let changed = false;
    const newMembers = members.map((m) => {
      const out = walkOptionalKeyword(ruleName, m, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
      if (out === null) return m;
      changed = true;
      return out;
    });
    return changed ? { ...rule, members: newMembers } : null;
  }
  const promoted = tryPromoteOptionalNode(ruleName, rule, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
  if (promoted.matched) return promoted.result;
  if (isRepeatType(rule.type) || isFieldType(rule.type)) {
    const content = rule.content;
    const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
    if (out === null) return null;
    return withContent(rule, out);
  }
  if (isPrecWrapper(rule)) {
    const content = rule.content;
    const out = walkOptionalKeyword(ruleName, content, claimedAtSeqLevel, kwRules, rulesBag, wordMatcher);
    if (out === null) return null;
    return withContent(rule, out);
  }
  return null;
}
function tryPromoteInnerKeyword(ruleName, optionalRule, inner, claimed, kwRules, rulesBag, wordMatcher) {
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
  const symbolRef = registerKwRule(inner, fieldName, kwRules, rulesBag);
  if (symbolRef === null) {
    reportSkip(
      "optional-keyword-prefix",
      ruleName,
      `rule '_kw_${fieldName}' already exists in base.grammar.rules with different content`
    );
    return null;
  }
  const fieldNode = makeField(fieldName, symbolRef);
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
function detectInlineSeparatedListRuns(members) {
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
      const info = separatedListBodyInfo(synthetic);
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
function collectSeparatedListNameProposals(rules) {
  const keysByName = /* @__PURE__ */ new Map();
  const record = (info, key) => {
    if (info.elementName === null) return;
    const plural = pluralizeFieldName(info.elementName);
    let keys = keysByName.get(plural);
    if (!keys) keysByName.set(plural, keys = /* @__PURE__ */ new Set());
    keys.add(key);
  };
  const visit = (rule) => {
    if (!rule || typeof rule !== "object") return;
    const t = rule.type;
    if (typeof t !== "string") return;
    if (isSeqType(t)) {
      const rawMembers = rule.members;
      if (Array.isArray(rawMembers)) {
        const members2 = absorbTrailingListSeparators(rawMembers) ?? rawMembers;
        const folded = members2 === rawMembers ? rule : { ...rule, members: members2 };
        const whole = separatedListBodyInfo(folded);
        if (whole?.flankCarrying) {
          record(whole, ruleKey(folded));
        } else {
          for (const run of detectInlineSeparatedListRuns(members2)) record(run.info, run.key);
        }
        for (const m of members2) visit(m);
        return;
      }
    }
    const content = rule.content;
    if (content) visit(content);
    const members = rule.members;
    if (Array.isArray(members)) for (const m of members) visit(m);
  };
  for (const name of Object.keys(rules)) visit(rules[name]);
  return new Map([...keysByName].map(([name, keys]) => [name, keys.size]));
}
var separatedListNameCounts = null;
var separatedListEnrichSkip = null;
var hiddenListPromotionNames = null;
var hoistKwRules = null;
var hoistWordMatcher;
function promoteHiddenListRef(member, rulesBag) {
  if (separatedListNameCounts === null || hiddenListPromotionNames === null) return member;
  if (!isSymbolType(member.type)) return member;
  const name = member.name;
  if (typeof name !== "string" || !name.startsWith("_")) return member;
  if (separatedListEnrichSkip?.has(name)) return member;
  let visibleName = hiddenListPromotionNames.get(name);
  if (visibleName === void 0) {
    const body = rulesBag[name];
    if (!body || !isSeqType(body.type)) return member;
    const info = separatedListBodyInfo(body);
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
function applyClauseHoist(parentKind, rule, rulesBag, clauseGroupRules, dedupeMap, counter, groupDedupeMap, visibleGroupHiddenNames, clauseGroupOwners, ambientPrec, enclosingFieldName) {
  const peeled = peelOptionalSeq(rule);
  if (peeled !== null) {
    const recursedSeqBody = applyClauseHoist(
      parentKind,
      peeled.seqBody,
      rulesBag,
      clauseGroupRules,
      dedupeMap,
      counter,
      groupDedupeMap,
      visibleGroupHiddenNames,
      clauseGroupOwners,
      ambientPrec,
      enclosingFieldName
    );
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
    } else if (isInlineSafe(recursedSeqBody, rulesBag)) {
      const name = clauseHoistSynthName(recursedSeqBody, parentKind, dedupeMap, counter, rulesBag, clauseGroupRules);
      if (name !== null) {
        if (!clauseGroupOwners.has(name)) clauseGroupOwners.set(name, parentKind);
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
      const names = visibleGroupSynthName(
        recursedSeqBody,
        parentKind,
        groupDedupeMap,
        counter,
        rulesBag,
        clauseGroupRules,
        ambientPrec,
        enclosingFieldName
      );
      if (names !== null) {
        visibleGroupHiddenNames.add(names.hiddenName);
        if (!clauseGroupOwners.has(names.hiddenName)) clauseGroupOwners.set(names.hiddenName, parentKind);
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
  {
    const opt = peelOptional(rule);
    if (opt.isOptional) {
      const recursed = applyClauseHoist(
        parentKind,
        opt.inner,
        rulesBag,
        clauseGroupRules,
        dedupeMap,
        counter,
        groupDedupeMap,
        visibleGroupHiddenNames,
        clauseGroupOwners,
        ambientPrec,
        enclosingFieldName
      );
      const promoted = mintStructuredChoiceArm(
        recursed,
        parentKind,
        rulesBag,
        clauseGroupRules,
        counter,
        groupDedupeMap,
        visibleGroupHiddenNames,
        clauseGroupOwners,
        /* @__PURE__ */ new Set(),
        ambientPrec,
        enclosingFieldName
      );
      const final = promoted ?? recursed;
      if (final === opt.inner) return rule;
      if (isOptionalType(rule.type)) {
        return withContent(rule, final);
      }
      const members = rule.members;
      const idx = members.findIndex((m) => m.type !== "BLANK");
      const newMembers = members.slice();
      newMembers[idx] = final;
      return { ...rule, members: newMembers };
    }
  }
  if (isSeqType(rule.type)) {
    const rawMembers = rule.members;
    if (!Array.isArray(rawMembers)) return rule;
    const absorbed = absorbTrailingListSeparators(rawMembers);
    const members = absorbed ?? rawMembers;
    let changed = absorbed !== null;
    const newMembers = members.map((m) => {
      let out = applyClauseHoist(
        parentKind,
        m,
        rulesBag,
        clauseGroupRules,
        dedupeMap,
        counter,
        groupDedupeMap,
        visibleGroupHiddenNames,
        clauseGroupOwners,
        ambientPrec
      );
      out = promoteHiddenListRef(out, rulesBag);
      if (out !== m) changed = true;
      return out;
    });
    if (separatedListNameCounts !== null && separatedListBodyInfo({ ...rule, members: newMembers }) === null) {
      const runs = detectInlineSeparatedListRuns(newMembers);
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
        const names = visibleGroupSynthName(
          body,
          parentKind,
          groupDedupeMap,
          counter,
          rulesBag,
          clauseGroupRules,
          ambientPrec
        );
        if (names === null) continue;
        visibleGroupHiddenNames.add(names.hiddenName);
        if (!clauseGroupOwners.has(names.hiddenName)) clauseGroupOwners.set(names.hiddenName, parentKind);
        const symbolRef = makeGroupLiftSymbol(body, names.hiddenName);
        const aliasRule = makeVisibleGroupAlias(symbolRef, names.visibleName);
        const replacement = isTail ? optionalFn(aliasRule) : aliasRule;
        newMembers.splice(run.start, run.size, replacement);
        changed = true;
      }
    }
    return changed ? { ...rule, members: newMembers } : rule;
  }
  if (isChoiceType(rule.type)) {
    let choiceRule = rule;
    const permutationChoice = isPermutationChoice(rule, rulesBag, hoistKwRules ?? void 0, hoistWordMatcher);
    if (permutationChoice && hoistKwRules !== null) {
      choiceRule = promotePermutationArmKeywords(rule, hoistKwRules, rulesBag, hoistWordMatcher);
    }
    const members = choiceRule.members;
    if (!Array.isArray(members)) return rule;
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
      const out = applyClauseHoist(
        parentKind,
        m,
        rulesBag,
        clauseGroupRules,
        dedupeMap,
        counter,
        groupDedupeMap,
        visibleGroupHiddenNames,
        clauseGroupOwners,
        ambientPrec
      );
      const literalOnlySplit = members.some((sib) => sib !== m && armsDifferOnlyByLiteralChoice(out, sib));
      const promoted = permutationChoice || literalOnlySplit ? null : mintStructuredChoiceArm(
        out,
        parentKind,
        rulesBag,
        clauseGroupRules,
        counter,
        groupDedupeMap,
        visibleGroupHiddenNames,
        clauseGroupOwners,
        collidingLeadingNames,
        ambientPrec
      );
      const final = promoteHiddenListRef(promoted ?? out, rulesBag);
      if (final !== m) changed = true;
      return final;
    });
    return changed || choiceRule !== rule ? { ...choiceRule, members: newMembers } : rule;
  }
  if (isRepeatType(rule.type) || isPrecWrapper(rule)) {
    const content = rule.content;
    if (!content) return rule;
    const innerAmbientPrec = isPrecWrapper(rule) ? rule : ambientPrec;
    const newContent = applyClauseHoist(
      parentKind,
      content,
      rulesBag,
      clauseGroupRules,
      dedupeMap,
      counter,
      groupDedupeMap,
      visibleGroupHiddenNames,
      clauseGroupOwners,
      innerAmbientPrec,
      enclosingFieldName
    );
    if (newContent === content) return rule;
    return withContent(rule, newContent);
  }
  if (isFieldType(rule.type)) {
    const content = rule.content;
    if (!content) return rule;
    const newContent = applyClauseHoist(
      parentKind,
      content,
      rulesBag,
      clauseGroupRules,
      dedupeMap,
      counter,
      groupDedupeMap,
      visibleGroupHiddenNames,
      clauseGroupOwners,
      ambientPrec,
      rule.name
    );
    if (newContent === content) return rule;
    return withContent(rule, newContent);
  }
  return rule;
}
function clusterSignatures(values) {
  const indexByKey = /* @__PURE__ */ new Map();
  const clusterOf = [];
  for (const value of values) {
    const key = ruleKey(value);
    let idx = indexByKey.get(key);
    if (idx === void 0) {
      idx = indexByKey.size;
      indexByKey.set(key, idx);
    }
    clusterOf.push(String(idx));
  }
  return clusterOf;
}
var ENRICH_UNALIAS_DIAGNOSTICS_KEY = "__enrichUnaliasDiagnostics__";
function unaliasDiagnosticKey(diagnostic) {
  return [
    diagnostic.code,
    diagnostic.ownerKind,
    diagnostic.slotName,
    diagnostic.parseKind,
    diagnostic.storageKinds.join(",")
  ].join(" ");
}
function recordUnaliasDiagnostic(sink, diagnostic) {
  const key = unaliasDiagnosticKey(diagnostic);
  if (sink.seen.has(key)) return;
  sink.seen.add(key);
  sink.diagnostics.push(diagnostic);
}
function collectUnaliasCandidates(node, path, slotKey, rulesBag, out, walker, visited = /* @__PURE__ */ new Set(), supertypeNames = /* @__PURE__ */ new Set(), rewritable = true) {
  const t = node.type;
  if (!t) return;
  if (t === "ALIAS") {
    const aliasRule = node;
    const storageKind = isSymbolType(aliasRule.content.type) ? aliasRule.content.name : void 0;
    const resolvedBody = normalizeMember(
      (storageKind !== void 0 ? rulesBag[storageKind] : void 0) ?? aliasRule.content
    );
    out.push({
      targetName: aliasRule.value,
      slotKey,
      storageKind,
      resolvedBody,
      aliasSite: rewritable ? { path, content: aliasRule.content, named: aliasRule.named } : void 0
    });
    return;
  }
  if (isSymbolType(t)) {
    const name = node.name;
    if (typeof name === "string") {
      const target = rulesBag[name];
      const resolvedBody = normalizeMember(target ?? node);
      const erasesToArms = name.startsWith("_") || supertypeNames.has(name);
      if (target !== void 0 && erasesToArms && isChoiceType(resolvedBody.type) && !visited.has(name)) {
        visited.add(name);
        collectUnaliasCandidates(target, path, slotKey, rulesBag, out, walker, visited, supertypeNames, false);
        return;
      }
      out.push({ targetName: name, slotKey, storageKind: name, resolvedBody });
    }
    return;
  }
  const nextSlotKey = isFieldType(t) ? node.name ?? slotKey : slotKey;
  for (const { segment, child } of walker.childEdgesOf(node)) {
    collectUnaliasCandidates(
      child,
      [...path, ...segment],
      nextSlotKey,
      rulesBag,
      out,
      walker,
      visited,
      supertypeNames,
      rewritable
    );
  }
}
function rewriteUnaliasAt(node, path, replacement) {
  if (path.length === 0) return replacement;
  const [key, ...rest] = path;
  if (key === "members") {
    const idx = rest[0];
    const members = node.members.slice();
    members[idx] = rest.length > 1 ? rewriteUnaliasAt(members[idx], rest.slice(1), replacement) : replacement;
    return { ...node, members };
  }
  const k = key;
  const child = node[k];
  return { ...node, [k]: rest.length > 0 ? rewriteUnaliasAt(child, rest, replacement) : replacement };
}
function applyUnaliasDistinct(ruleName, rule, rulesBag, kwRules, clauseGroupRules, supertypeNames) {
  const candidates = [];
  collectUnaliasCandidates(rule, [], void 0, rulesBag, candidates, new RuleWalker(), /* @__PURE__ */ new Set(), supertypeNames);
  if (candidates.length === 0) return { rule, diagnostics: [] };
  const byBucket = /* @__PURE__ */ new Map();
  for (const candidate of candidates) {
    const slotName = candidate.slotKey ?? candidate.targetName;
    const key = `${slotName}\0${candidate.targetName}`;
    const entry = byBucket.get(key) ?? { slotName, targetName: candidate.targetName, bucket: [] };
    entry.bucket.push(candidate);
    byBucket.set(key, entry);
  }
  const toDrop = /* @__PURE__ */ new Set();
  const toRetarget = /* @__PURE__ */ new Map();
  const diagnostics = [];
  const claimedRetargetNames = /* @__PURE__ */ new Set();
  for (const { slotName, targetName, bucket } of byBucket.values()) {
    if (bucket.length < 2 || !bucket.some((c) => c.aliasSite)) continue;
    const signatures = clusterSignatures(bucket.map((c) => c.resolvedBody));
    const values = bucket.map((candidate, i) => ({
      original: candidate,
      parseKind: targetName,
      storageKind: candidate.storageKind,
      structuralSignature: signatures[i]
    }));
    let representativeSignature;
    const nativeIndex = bucket.findIndex((c) => c.storageKind !== void 0 && c.storageKind === targetName);
    if (nativeIndex !== -1) {
      representativeSignature = signatures[nativeIndex];
    } else {
      const signatureCounts = /* @__PURE__ */ new Map();
      for (const signature of signatures) signatureCounts.set(signature, (signatureCounts.get(signature) ?? 0) + 1);
      let representativeCount = 1;
      for (const [signature, count] of signatureCounts) {
        if (count > representativeCount) {
          representativeSignature = signature;
          representativeCount = count;
        }
      }
    }
    const resolution = diagnoseParseKindCollisions({ ownerKind: ruleName, slotName, values });
    for (const diagnostic of resolution.diagnostics) {
      let anyActed = false;
      for (const [index, candidate] of bucket.entries()) {
        if (!candidate.aliasSite || candidate.storageKind === void 0) continue;
        if (representativeSignature !== void 0 && signatures[index] === representativeSignature) continue;
        const isHidden = candidate.storageKind.startsWith("_");
        if (!isHidden) {
          toDrop.add(candidate);
          anyActed = true;
          continue;
        }
        const strippedName = candidate.storageKind.replace(/^_+/, "");
        const collides = strippedName === "" || claimedRetargetNames.has(strippedName) || Object.hasOwn(rulesBag, strippedName) || Object.hasOwn(kwRules, strippedName) || Object.hasOwn(clauseGroupRules, strippedName);
        if (collides) {
          continue;
        }
        claimedRetargetNames.add(strippedName);
        toRetarget.set(candidate, strippedName);
        anyActed = true;
      }
      if (anyActed) {
        diagnostics.push({
          ...diagnostic,
          severity: "info",
          message: `${diagnostic.message} Found in the base grammar; automatically resolved by giving each colliding arm its own distinct alias.`,
          proposal: "Already resolved by enrich() \u2014 no action needed."
        });
      }
    }
  }
  if (toDrop.size === 0 && toRetarget.size === 0) return { rule, diagnostics: [] };
  let result = rule;
  for (const candidate of toDrop) {
    result = rewriteUnaliasAt(result, candidate.aliasSite.path, candidate.aliasSite.content);
  }
  for (const [candidate, strippedName] of toRetarget) {
    const retargeted = {
      type: "ALIAS",
      content: candidate.aliasSite.content,
      named: candidate.aliasSite.named,
      value: strippedName
    };
    result = rewriteUnaliasAt(result, candidate.aliasSite.path, retargeted);
  }
  return { rule: result, diagnostics };
}
function clauseHoistSynthName(seqBody, parentKind, dedupeMap, counter, rulesBag, clauseGroupRules) {
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
function collapseSingletonMintOrdinals(mergedRules, mintedRules, visibleGroupHiddenNames, clauseGroupOwners) {
  const byParentFlavor = /* @__PURE__ */ new Map();
  for (const hidden of Object.keys(mintedRules)) {
    const m = /^_(.+)_(arm|group)(\d+)$/.exec(hidden);
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
    const newHidden = `_${bare}`;
    if (newHidden in mergedRules || bare in mergedRules) continue;
    renames.set(oldHidden, newHidden);
    renames.set(oldHidden.replace(/^_/, ""), bare);
  }
  if (renames.size === 0) return;
  for (const [oldName, newName] of renames) {
    if (oldName.startsWith("_") && oldName in mergedRules) {
      mergedRules[newName] = mergedRules[oldName];
      delete mergedRules[oldName];
    }
    if (oldName.startsWith("_") && oldName in mintedRules) {
      mintedRules[newName] = mintedRules[oldName];
      delete mintedRules[oldName];
    }
    if (visibleGroupHiddenNames.delete(oldName)) visibleGroupHiddenNames.add(newName);
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
function visibleGroupSynthName(content, parentKind, groupDedupeMap, counter, rulesBag, clauseGroupRules, ambientPrec, enclosingFieldName, flavor = "group") {
  if (process.env.SITTIR_DEBUG_LISTNAME) {
    const info = separatedListBodyInfo(content);
    process.stderr.write(
      `[listname] mint for parent='${parentKind}' list=${JSON.stringify(info)} counts=${info?.elementName ? separatedListNameCounts?.get(pluralizeFieldName(info.elementName)) : "-"}
`
    );
  }
  const registeredBody = ambientPrec ? withContent(ambientPrec, content) : content;
  const key = ruleKey(registeredBody);
  const existing = groupDedupeMap[key];
  if (existing !== void 0) {
    const hiddenName2 = `_${existing}`;
    if (!(hiddenName2 in clauseGroupRules)) clauseGroupRules[hiddenName2] = registeredBody;
    return { visibleName: existing, hiddenName: hiddenName2 };
  }
  const base2 = parentKind.replace(/^_+/, "");
  const register = (visibleName2, body = registeredBody) => {
    const hiddenName2 = `_${visibleName2}`;
    groupDedupeMap[key] = visibleName2;
    clauseGroupRules[hiddenName2] = body;
    return { visibleName: visibleName2, hiddenName: hiddenName2 };
  };
  const listInfo = separatedListNameCounts !== null ? separatedListBodyInfo(content) : null;
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
      const skipped = separatedListEnrichSkip !== null && (separatedListEnrichSkip.has(candidate) || separatedListEnrichSkip.has(`_${candidate}`));
      return register(candidate, skipped ? registeredBody : registeredFlat);
    }
  }
  if (enclosingFieldName !== void 0) {
    const visibleName2 = `${base2}_${enclosingFieldName}`;
    if (!(visibleName2 in rulesBag) && !(`_${visibleName2}` in rulesBag) && !(`_${visibleName2}` in clauseGroupRules)) {
      return register(visibleName2);
    }
  }
  const ordinal = flavor === "arm" ? ++counter.arm : ++counter.grp;
  const visibleName = `${base2}_${flavor}${ordinal}`;
  const hiddenName = `_${visibleName}`;
  if (visibleName in rulesBag || hiddenName in rulesBag) {
    process.stderr.write(
      `enrich: visible-group skipped for '${parentKind}' \u2014 rule '${visibleName}'/'${hiddenName}' already exists in base.grammar.rules
`
    );
    return null;
  }
  return register(visibleName);
}
function promoteExistingHiddenRuleName(existingHiddenName, parentKind, groupDedupeMap, counter, rulesBag, flavor = "group") {
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
function promotePermutationArmKeywords(choiceRule, kwRules, rulesBag, wordMatcher) {
  const members = choiceRule.members;
  let changed = false;
  const newMembers = members.map((arm2) => {
    if (!isSeqType(arm2.type)) return arm2;
    const seqMembers = arm2.members;
    let armChanged = false;
    const newSeq = seqMembers.map((m) => {
      const norm = normalizeMember(m);
      if (!isStringType(norm.type) || typeof norm.value !== "string") return m;
      if (!matchesWordShape(norm.value, wordMatcher)) return m;
      const fieldName = `${norm.value}_marker`;
      const symbolRef = registerKwRule(m, fieldName, kwRules, rulesBag);
      if (symbolRef === null) return m;
      armChanged = true;
      return makeField(fieldName, symbolRef);
    });
    if (!armChanged) return arm2;
    changed = true;
    return { ...arm2, members: newSeq };
  });
  return changed ? { ...choiceRule, members: newMembers } : choiceRule;
}
function mintStructuredChoiceArm(arm2, parentKind, rulesBag, clauseGroupRules, counter, groupDedupeMap, visibleGroupHiddenNames, clauseGroupOwners, collidingLeadingNames, ambientPrec, enclosingFieldName) {
  const t = arm2.type;
  if (typeof t !== "string") return null;
  if (armStartsWithSymbol(arm2, collidingLeadingNames, rulesBag)) return null;
  if (isPrecWrapper(arm2)) {
    const content = arm2.content;
    if (!content) return null;
    const minted = mintStructuredChoiceArm(
      content,
      parentKind,
      rulesBag,
      clauseGroupRules,
      counter,
      groupDedupeMap,
      visibleGroupHiddenNames,
      clauseGroupOwners,
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
    if (!body || ruleMatchesEmpty(body) || isInlineSafe(body, rulesBag)) return null;
    if (isSupertypeLike(body)) return null;
    const promoted = promoteExistingHiddenRuleName(name, parentKind, groupDedupeMap, counter, rulesBag, "arm");
    if (!promoted) return null;
    visibleGroupHiddenNames.add(name);
    if (!clauseGroupOwners.has(name)) clauseGroupOwners.set(name, parentKind);
    return makeVisibleGroupAlias(arm2, promoted.visibleName);
  }
  if (isSeqType(t) || isChoiceType(t)) {
    if (ruleMatchesEmpty(arm2) || isInlineSafe(arm2, rulesBag)) return null;
    if (isSupertypeLike(arm2)) return null;
    if (isPermutationChoice(arm2, rulesBag, hoistKwRules ?? void 0, hoistWordMatcher)) return null;
    const names = visibleGroupSynthName(
      arm2,
      parentKind,
      groupDedupeMap,
      counter,
      rulesBag,
      clauseGroupRules,
      ambientPrec,
      enclosingFieldName,
      "arm"
    );
    if (!names) return null;
    visibleGroupHiddenNames.add(names.hiddenName);
    if (!clauseGroupOwners.has(names.hiddenName)) clauseGroupOwners.set(names.hiddenName, parentKind);
    const symbolRef = makeGroupLiftSymbol(arm2, names.hiddenName);
    return makeVisibleGroupAlias(symbolRef, names.visibleName);
  }
  return null;
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
function synthesizeFieldEnumRules(rules) {
  const fieldOccurrences = collectFieldEnumOccurrences(rules);
  const conflictingSites = collectConflictingFieldEnumSites(fieldOccurrences);
  const memberKeyToCanonicalName = buildCanonicalEnumNames(fieldOccurrences, rules);
  const rewrites = /* @__PURE__ */ new Map();
  const newRules = /* @__PURE__ */ new Map();
  const sweep = { rules, newRules, memberKeyToCanonicalName, conflictingSites };
  for (const [parentKind, rule] of Object.entries(rules)) {
    const rewritten = rewriteFieldEnums(rule, parentKind, sweep);
    if (rewritten !== rule) rewrites.set(parentKind, rewritten);
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
  for (const [parentKind, rule] of Object.entries(rules)) {
    walkFieldEnums(rule, rules, parentKind, occurrences);
  }
  return occurrences;
}
function walkFieldEnums(rule, rules, parentKind, out) {
  switch (rule.type) {
    case "FIELD": {
      const fieldRule = rule;
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
      for (const m of rule.members) walkFieldEnums(m, rules, parentKind, out);
      return;
    case "OPTIONAL":
    case "REPEAT":
    case "REPEAT1":
    case "TOKEN":
      walkFieldEnums(rule.content, rules, parentKind, out);
      return;
    default:
      return;
  }
}
function buildCanonicalEnumNames(occurrences, rules) {
  const byKey = /* @__PURE__ */ new Map();
  for (const occ of occurrences) {
    let group = byKey.get(occ.memberKey);
    if (!group) {
      group = [];
      byKey.set(occ.memberKey, group);
    }
    group.push(occ);
  }
  const existingNameCandidatesByMemberKey = /* @__PURE__ */ new Map();
  for (const [name, rule] of Object.entries(rules)) {
    const resolved = resolveToEnumMembersOneLevelDeep(rule);
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
  const groups = Array.from(byKey.entries()).map(([memberKey, group], index) => {
    const first = group[0];
    const candidate = deriveCandidateName(group, existingRuleNameByMemberKey, first);
    return { memberKey, group, first, index, ...candidate };
  });
  groups.sort((a, b) => a.priority - b.priority || a.index - b.index);
  const claimedNames = /* @__PURE__ */ new Set();
  for (const group of groups) {
    const chosenName = claimUniqueEnumName(group.name, rules, group.memberKey, claimedNames);
    claimedNames.add(chosenName);
    result.set(group.memberKey, chosenName);
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
function deriveCandidateName(group, existingRuleNameByMemberKey, first) {
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
  const allSameFieldName = group.every((o) => o.fieldName === first.fieldName);
  if (allSameFieldName) {
    const distinctParents = new Set(group.map((o) => o.parentKind)).size;
    if (distinctParents >= 2) {
      return { name: `_${first.fieldName}`, priority: 2 };
    }
  }
  return { name: fallbackName(first), priority: 3 };
}
function rewriteFieldEnums(rule, parentKind, sweep) {
  const { rules, newRules, memberKeyToCanonicalName, conflictingSites } = sweep;
  const recurse = (r) => rewriteFieldEnums(r, parentKind, sweep);
  switch (rule.type) {
    case "FIELD": {
      const fieldRule = rule;
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
      if (newContent === fieldRule.content) return rule;
      return { ...rule, content: newContent };
    }
    case "SEQ":
    case "CHOICE": {
      const members = rule.members;
      const newMembers = members.map(recurse);
      if (newMembers.every((m, i) => m === members[i])) return rule;
      return { ...rule, members: newMembers };
    }
    case "OPTIONAL":
    case "REPEAT":
    case "REPEAT1":
    case "TOKEN": {
      const content = rule.content;
      const newContent = recurse(content);
      if (newContent === content) return rule;
      return { ...rule, content: newContent };
    }
    default:
      return rule;
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
    content: normalizeEnumMembers(members, { author: "enrich" }),
    value: -1
  };
  if (innerContent.type === "SYMBOL" && innerContent.name === enumKindName) {
    return null;
  }
  const symRule = makeSymbol(enumKindName);
  const replacementContent = repeatWrapperType === null ? symRule : { ...content, content: symRule };
  return { enumKindName, synthesizedRule, replacementContent };
}
function peelRepeatWrapper(rule) {
  const ruleType = rule.type;
  if (ruleType === "REPEAT" || ruleType === "REPEAT1") return rule.content;
  return rule;
}
function resolveToEnumMembers(rule, rules) {
  switch (rule.type) {
    case "CHOICE": {
      return isEnumChoiceRule(rule) ? rule.members : null;
    }
    case "SYMBOL": {
      const name = rule.name;
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
function wire(config, base2) {
  const cfg = config;
  const baseArg = base2;
  const context = {
    deposits: /* @__PURE__ */ new Map(),
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
    currentRuleKind: null,
    authoredRuleNames: new Set(Object.keys(cfg.rules ?? {}))
  };
  const patches = cfg.patches ?? {};
  const outRules = { ...cfg.rules };
  composeOrSynthesizePatchedParents(outRules, patches, context);
  injectPlaceholderHiddenRules(outRules, patches, context, baseExternalNames(baseArg));
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
function polymorphVisibleName(parentKind, suffix) {
  const visibleParent = parentKind.startsWith("_") ? parentKind.slice(1) : parentKind;
  return `${visibleParent}_${suffix}`;
}
function polymorphHiddenName(parentKind, suffix) {
  return `_${polymorphVisibleName(parentKind, suffix)}`;
}
function patchSetsOf(entry) {
  const items = Array.isArray(entry) ? entry : [entry];
  return items.filter((item) => !isPreference(item));
}
function kindPreferencesOf(entry) {
  const items = Array.isArray(entry) ? entry : [entry];
  return items.filter(isPreference);
}
function composeOrSynthesizePatchedParents(rules, patches, context) {
  for (const [kind, entry] of Object.entries(patches)) {
    if (!entry) continue;
    rules[kind] = buildPatchedParentFn(kind, patchSetsOf(entry), kindPreferencesOf(entry), rules[kind], context);
  }
}
function buildPatchedParentFn(kind, patchSets, preferences, userFn, context) {
  const isHidden = kind.startsWith("_");
  return function wiredPatchedParent($, original) {
    const base2 = userFn ? userFn($, original) : isHidden && context.deposits.has(kind) ? context.deposits.get(kind) : original;
    let result = patchSets.length === 0 ? base2 : transform(base2, ...patchSets);
    for (const pref of preferences) result = applyPreference(result, pref, kind);
    return result;
  };
}
function placeholderHiddenName(value, parentKind) {
  if (isFieldPlaceholder(value)) return `_kw_${value.name}`;
  if (isVariantPlaceholder(value)) return polymorphHiddenName(parentKind, value.name);
  if (isAliasPlaceholder(value)) return `_${value.name}`;
  return void 0;
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
function injectPlaceholderHiddenRules(rules, patches, context, externals) {
  for (const [kind, entry] of Object.entries(patches)) {
    if (!entry) continue;
    for (const patchMap of patchSetsOf(entry)) {
      for (const value of Object.values(patchMap)) {
        const hiddenName = placeholderHiddenName(value, kind);
        if (hiddenName === void 0 || hiddenName in rules || externals.has(hiddenName)) continue;
        rules[hiddenName] = makeDeferredContentFn(context, hiddenName);
      }
    }
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
    const renamed = context.symbolRenames.size === 0 ? base2 : base2.map(
      (group) => group.map((entry) => {
        const symbol = entry;
        const next = symbol && typeof symbol === "object" && symbol.type === "SYMBOL" && typeof symbol.name === "string" ? context.symbolRenames.get(symbol.name) : void 0;
        return next === void 0 ? entry : symbolizeRef($, next);
      })
    );
    if (context.conflictGroups.length === 0) return renamed;
    const symbolized = context.conflictGroups.map(
      (group) => group.map((name) => symbolizeRef($, context.symbolRenames.get(name) ?? name))
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
function withStringGlobalShim(fn) {
  const g = globalThis;
  const hadString = "string" in g;
  const previous = g.string;
  if (!hadString) {
    g.string = (value) => ({ type: "STRING", value });
  }
  try {
    return fn();
  } finally {
    if (!hadString) delete g.string;
    else g.string = previous;
  }
}
function rewriteVisibleExternalRefsRt(rule, hiddenToVisible) {
  if (!rule || typeof rule !== "object") return rule;
  const r = rule;
  const t = r.type;
  if (t === "SYMBOL") {
    const visibleName = hiddenToVisible.get(r.name ?? "");
    if (visibleName === void 0) return rule;
    return { type: "ALIAS", content: rule, named: true, value: visibleName };
  }
  if (t === "SEQ" || t === "CHOICE") {
    const members = r.members;
    if (!Array.isArray(members)) return rule;
    let changed = false;
    const newMembers = members.map((m) => {
      const replaced = rewriteVisibleExternalRefsRt(m, hiddenToVisible);
      if (replaced !== m) changed = true;
      return replaced;
    });
    return changed ? { ...r, members: newMembers } : rule;
  }
  if (t === "OPTIONAL" || t === "REPEAT" || t === "REPEAT1" || t === "FIELD" || t === "PREC" || t === "PREC_LEFT" || t === "PREC_RIGHT" || t === "PREC_DYNAMIC" || t === "TOKEN" || t === "ALIAS") {
    const newContent = rewriteVisibleExternalRefsRt(r.content, hiddenToVisible);
    return newContent !== r.content ? { ...r, content: newContent } : rule;
  }
  return rule;
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
  for (const [section, key, value] of declared) {
    const hidden = key.startsWith("_");
    const hiddenName = hidden ? key : `_${key}`;
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
    candidates.push(hidden ? { name: hiddenName, body } : { name: hiddenName, body, aliasAs: key });
    rules[hiddenName] = context ? wrapOneRuleFn(hiddenName, value, context) : value;
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

// packages/codegen/src/dsl/primitives/arm.ts
function isArmDefault(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "default";
}

// packages/codegen/src/dsl/transform/transform.ts
function armNamesOf(arm2) {
  const node = arm2;
  const names = [];
  if (node.annotations?.variant !== void 0) names.push(node.annotations.variant);
  if (node.type === "STRING" && typeof node.value === "string") names.push(node.value);
  if (node.type === "ALIAS") {
    const value = node.value;
    const target = typeof value === "string" ? value : value?.name;
    if (target !== void 0) names.push(target, target.replace(/^_+/, ""));
    names.push(...armNamesOf(node.content));
  }
  if (node.type === "SYMBOL" && typeof node.name === "string") names.push(node.name, node.name.replace(/^_+/, ""));
  if (isPrecWrapper(node)) names.push(...armNamesOf(node.content));
  return names;
}
function applyPreference(rule, patch, kind) {
  const node = rule;
  if (node.type === "CHOICE" && Array.isArray(node.members)) {
    let matched = false;
    const members = node.members.map((arm2) => {
      const isDefault = armNamesOf(arm2).includes(patch.default);
      matched ||= isDefault;
      return withAnnotations(arm2, { preference: patch.label, ...isDefault ? { default: true } : {} });
    });
    if (!matched) {
      throw new Error(
        `preference('${patch.label}', '${patch.default}') on '${kind}': no arm is spelled '${patch.default}' (arms: ${node.members.map((m) => armNamesOf(m)[0] ?? "?").join(", ")})`
      );
    }
    return { ...node, members };
  }
  if (node.content !== void 0 && node.content !== null && typeof node.content === "object") {
    return {
      ...node,
      content: applyPreference(node.content, patch, kind)
    };
  }
  throw new Error(`preference('${patch.label}', '${patch.default}') on '${kind}': the rule is not a choice`);
}
function withAnnotations(rule, extra) {
  const node = rule;
  if (node?.type === "ALIAS" && node.content !== null && typeof node.content === "object") {
    const content = node.content;
    return {
      ...node,
      content: { ...content, annotations: { ...content.annotations, ...extra } }
    };
  }
  return { ...node, annotations: { ...node.annotations, ...extra } };
}
function withVariantAnnotation(rule, variantName, parentKind) {
  return withAnnotations(rule, { variant: variantName, variantOf: parentKind });
}
function makePolymorphAliasNode(hiddenName, visibleName) {
  const alias2 = nativeRuleFn("alias");
  const sym = nativeRuleFn("sym", "symbol");
  return alias2(sym(hiddenName), sym(visibleName));
}
function transform(original, ...patchSets) {
  let rule = original;
  for (const patches of patchSets) {
    const hasPathKeys = requiresPathMode(patches);
    const hasPlaceholderAlias = Object.values(patches).some(
      (v) => isAliasPlaceholder(v) || isVariantPlaceholder(v) || isArmDefault(v)
    );
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
    if (isArmDefault(value)) assertChoiceArmPath(rule, String(key), segments);
    rule = applyPath(rule, segments, (member, precStack) => resolvePatch(value, member, precStack));
  }
  if (variantEntries.length > 0) {
    rule = applyVariantPatches(rule, variantEntries);
  }
  return rule;
}
function assertChoiceArmPath(rule, key, segments) {
  applyPath(rule, segments.slice(0, -1), (parent) => {
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
    const altMember = choiceMembers[resolvedAlt];
    const visibleName = polymorphVisibleName(parentKind, p.v.name);
    const hiddenName = polymorphHiddenName(parentKind, p.v.name);
    const lift = enrichLiftArmOf(altMember);
    if (lift !== null) wireRegisterSymbolRename(lift.liftName, hiddenName);
    const altContent = lift === null ? altMember : lift.body;
    const hoistedMembers = seqMembers.map((m, i) => i === resolvedPos ? altContent : m);
    const hoistedSeq = reconstructContainer(core, hoistedMembers);
    const hoistedBody = wrapVariantBodyInParentPrec(hoistedSeq, precStack);
    if (!wireRegisterSyntheticRule(hiddenName, hoistedBody)) {
      throw new Error(`registerSyntheticRule('${hiddenName}'): no active wire() context`);
    }
    refs.push(withVariantAnnotation(makePolymorphAliasNode(hiddenName, visibleName), p.v.name, parentKind));
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
function enrichLiftArmOf(member) {
  if (member.type !== "ALIAS") return null;
  const symbol = member.content;
  if (symbol?.type !== "SYMBOL" || typeof symbol.name !== "string" || !isEnrichGroupLiftSymbol(symbol)) {
    return null;
  }
  const body = getGroupLiftRuleBody(symbol.name);
  return body === void 0 ? null : { body, liftName: symbol.name, symbol };
}
function renameEnrichLift(aliasMember, lift, hiddenName, visibleName) {
  if (!wireHasAuthoredRule(hiddenName)) wireRegisterSyntheticRule(hiddenName, lift.body);
  wireRegisterSymbolRename(lift.liftName, hiddenName);
  return {
    ...aliasMember,
    content: { ...lift.symbol, name: hiddenName },
    value: visibleName
  };
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
    const members = membersOf2(original);
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
      throw new ApplyPathSkip(
        `transform: index ${index} out of bounds in ${original.type} of length ${members.length}`
      );
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
  if (isArmDefault(patch)) {
    return withAnnotations(originalMember, { default: true });
  }
  if (isPreference(patch)) {
    return applyPreference(originalMember, patch, wireGetCurrentRuleKind() ?? "(unknown)");
  }
  if (isVariantPlaceholder(patch)) {
    const parentKind = wireGetCurrentRuleKind();
    if (!parentKind) {
      throw new Error(`variant('${patch.name}'): no current rule kind \u2014 variant() must be used inside a rule callback`);
    }
    const visibleName = polymorphVisibleName(parentKind, patch.name);
    const annotated = (rule) => withVariantAnnotation(rule, patch.name, parentKind);
    if (originalMember.type === "ALIAS") {
      const lift = enrichLiftArmOf(originalMember);
      if (lift !== null) {
        return annotated(
          renameEnrichLift(originalMember, lift, polymorphHiddenName(parentKind, patch.name), visibleName)
        );
      }
      return annotated({ ...originalMember, value: visibleName });
    }
    if (variantBranchIsUnmaterializable(originalMember)) {
      return annotated({
        ...deField(originalMember),
        metadata: makeRuleMetadata({ fieldSource: "override" })
      });
    }
    const hiddenName = polymorphHiddenName(parentKind, patch.name);
    return annotated(
      registerAliasedVariant(hiddenName, visibleName, originalMember, (body) => wrapInPrec(body, precStack))
    );
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
    if (isEnrichGroupLiftSymbol(n)) {
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
  if (originalMember.type === "ALIAS") {
    const lift = enrichLiftArmOf(originalMember);
    if (lift !== null) return renameEnrichLift(originalMember, lift, hiddenName, patch.name);
    return { ...originalMember, value: patch.name };
  }
  return registerAliasedVariant(hiddenName, patch.name, originalMember, (body) => wrapInPrec(body, precStack));
}
function registerAliasedVariant(hiddenName, aliasValue, originalMember, bodyWrapper) {
  const single = originalMember;
  if (single.type === "SYMBOL" && typeof single.name === "string") {
    const alias2 = nativeRuleFn("alias");
    const sym = nativeRuleFn("sym", "symbol");
    return alias2(originalMember, sym(aliasValue));
  }
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
    return membersOf2(rule).some((m) => matchesEmpty(m));
  }
  if (isSeqType(t)) {
    return membersOf2(rule).every((m) => matchesEmpty(m));
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
    const inner = contentOf2(rule);
    return matchesEmpty(inner) ? extractNonEmpty(inner) : { nonEmpty: inner };
  }
  if (isChoiceType(t)) {
    const members = membersOf2(rule);
    const nonEmpty = members.filter((m) => !matchesEmpty(m));
    if (nonEmpty.length === 0) return null;
    if (nonEmpty.length === 1) return { nonEmpty: nonEmpty[0] };
    return { nonEmpty: { type: t, members: nonEmpty } };
  }
  if (isSeqType(t)) {
    const members = [...membersOf2(rule)];
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
var enrichedBase = enrich(import_grammar.default, {
  // `lexical_declaration` and `variable_declaration` already field their
  // separated declarator list's WHOLE span at positional index 1 as
  // 'declarators' below. applyNodeChoiceFieldWrap's separated-list target
  // fielding the leading/repeated element positions too nests a second,
  // inner field under that outer one — tree-sitter keeps only the
  // innermost field name, so 'declarators' ends up matching nothing
  // (`accessor-throw: repeated slot "declarators" requires at least one
  // value`).
  // `_enum_body_elements`'s element is a choice of a `name`-fielded arm
  // and a bare `enum_assignment` arm — a single uniform 'element' field
  // would erase that distinction (the fielded arm routes by its field
  // label at read time; the classifier merges the arms into one union
  // content slot as-is): `accessor-throw: repeated slot "element"
  // requires at least one value`.
  // `object`, `object_pattern`, `array`, `array_pattern`, and `arguments`
  // already field their separated list's WHOLE span at a positional
  // index below ('properties', 'elements', 'arguments' respectively) —
  // same outer/inner nested-field collision as
  // `lexical_declaration`/`variable_declaration`.
  skip: [
    "lexical_declaration",
    "variable_declaration",
    "_enum_body_elements",
    "object",
    "object_pattern",
    "array",
    "array_pattern",
    "arguments"
  ]
});
var grammar_sittir_default = grammar(
  enrichedBase,
  wire(
    {
      name: "typescript",
      conflicts: ($, previous) => [
        ...previous ?? [],
        [$.sequence_expression, $._parenthesized_expression_typed],
        [$.sequence_expression, $._parenthesized_expression_arm],
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
        [$.primary_expression, $._export_statement_namespace_export],
        [$.binary_expression, $.unary_expression, $.instantiation_expression, $._call_expression_call],
        [$.await_expression, $.binary_expression, $.instantiation_expression, $._call_expression_call],
        [$.binary_expression, $.update_expression, $.instantiation_expression, $._call_expression_call],
        [$.binary_expression, $.instantiation_expression, $._call_expression_call],
        [$._type_query_call_expression_in_type_annotation, $._call_expression_call],
        [$._type_query_call_expression, $._call_expression_call],
        [$.primary_expression, $._export_statement_default],
        [$.string],
        [$.await_expression, $._update_expression_postfix],
        [$.await_expression, $._update_expression_arm1],
        [$.arrow_function, $._update_expression_arm1],
        [$.await_expression, $._call_expression_call],
        [$.instantiation_expression, $._call_expression_call],
        [$.await_expression, $._binary_expression_arm],
        [$.as_expression, $._binary_expression_arm],
        [$._call_expression_call, $._binary_expression_arm],
        // _binary_expression_arm (the `in`-operator arm, freshly extracted —
        // same PREC-descent mechanism as call_expression's arms above) mirrors
        // binary_expression's own conflict set: every continuation that used to
        // share LR state with the whole (unsplit) binary_expression choice needs
        // the same explicit GLR declaration now that this one arm has its own
        // symbol boundary.
        [$.call_expression, $._binary_expression_arm, $.unary_expression, $.instantiation_expression],
        [$.call_expression, $.await_expression, $._binary_expression_arm, $.instantiation_expression],
        [$.call_expression, $._binary_expression_arm, $.update_expression, $.instantiation_expression],
        [$.call_expression, $._binary_expression_arm, $.instantiation_expression],
        [$._initializer, $._binary_expression_arm],
        [$._binary_expression_arm, $.unary_expression, $.instantiation_expression, $._call_expression_call],
        [$.await_expression, $._binary_expression_arm, $.instantiation_expression, $._call_expression_call],
        [$._binary_expression_arm, $.update_expression, $.instantiation_expression, $._call_expression_call],
        [$._binary_expression_arm, $.instantiation_expression, $._call_expression_call],
        [$.subscript_expression, $._binary_expression_arm],
        [$.member_expression, $._binary_expression_arm],
        [$.member_expression, $.subscript_expression, $._binary_expression_arm],
        [$.binary_expression, $.instantiation_expression, $._call_expression_call, $._binary_expression_arm],
        [$.non_null_expression, $._binary_expression_arm],
        [$.satisfies_expression, $._binary_expression_arm],
        [$._binary_expression_arm, $._update_expression_postfix],
        [$._binary_expression_arm, $._update_expression_prefix],
        [$._binary_expression_arm, $._update_expression_arm1],
        [$.ternary_expression, $._binary_expression_arm],
        [$.arrow_function, $._call_expression_call],
        [$.arrow_function, $._binary_expression_arm],
        [$.expression, $._call_expression_template_call],
        [$._variable_declarator_arm1, $._for_header_arm2],
        [$.primary_expression, $._for_header_arm2],
        [$._variable_declarator_arm1, $._for_header_let_const_kind],
        [$._class_body_arm1, $._class_body_arm2],
        [$.import, $._meta_property_arm2],
        [$.primary_expression, $._meta_property_arm1],
        [$._lhs_expression, $._export_statement_equals_export],
        [$.object_assignment_pattern, $._lhs_expression],
        [$.object_assignment_pattern, $._lhs_expression, $._export_statement_equals_export],
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
        [$.await_expression, $._update_expression_prefix],
        [$.arrow_function, $._update_expression_postfix],
        [$.arrow_function, $._update_expression_prefix],
        [$.primary_expression, $._export_statement_default_from],
        [$.primary_expression, $._export_statement_default_declaration],
        [$.primary_expression, $._parameter_name, $.readonly_type],
        [$._class_body_method],
        [$._class_body_method_sig, $._class_body_member],
        [$.public_field_definition],
        [$.method_definition, $.public_field_definition],
        [$.method_definition, $.method_signature, $.public_field_definition],
        [$.abstract_method_signature, $.public_field_definition],
        [$.primary_expression, $._for_header_lhs],
        [$.primary_expression, $._for_header_var_kind],
        [$.primary_expression, $._for_header_let_const_kind],
        [$.variable_declarator, $._for_header_var_kind],
        [$.variable_declarator, $._for_header_let_const_kind]
      ],
      groups: {
        jsx_opening_element_content: ($) => seq(
          choice(
            field("name", choice($._jsx_identifier, $.jsx_namespace_name)),
            alias($._jsx_start_opening_element_arm, $.jsx_start_opening_element_arm)
          ),
          repeat(field("attribute", $._jsx_attribute))
        )
      },
      patches: {
        binary_expression: {
          24: variant("in")
        },
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
        // Patch sets apply in order. The second fields the member repeat
        // AFTER the arm-level paths of the first resolve against the
        // un-fielded shape: with the `';'` arm alias-identified (see the
        // `class_body` rules: override), every element — members and stray
        // semicolons alike — keys into one ordered `_content` array,
        // retiring this kind's per-kind bucket merge. The third's variant
        // paths then traverse the `content` field the second added.
        class_body: [
          {
            "1/0/0/2": field("terminator"),
            "1/0/1/1": field("terminator"),
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
        call_expression: {
          0: variant("call"),
          1: variant("template_call"),
          2: variant("member")
        },
        string: [{ 0: variant("double"), 1: variant("single") }, preference("quote_style", "double")],
        _semicolon: preference("statement_terminator", ";"),
        update_expression: {
          0: variant("postfix"),
          1: variant("prefix")
        },
        arrow_function: { "1/0": variant("parameter") },
        class_heritage: { "0": variant("extends_clause"), "1": variant("implements_clause") },
        import_clause: {
          "0": variant("namespace_import"),
          "1": variant("named_imports"),
          "2": variant("default_import")
        },
        _export_statement_default: {
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
        _export_statement_namespace_export: { 3: field("name"), 4: field("terminator") },
        _export_statement_type_export: { 4: field("terminator") },
        _export_statement_equals_export: { 3: field("terminator") },
        _for_header: {
          "1/0": variant("lhs"),
          "1/1": variant("var_kind"),
          "1/2": variant("let_const_kind")
        }
      },
      externals: ($, previous) => [...previous ?? [], $._comma_space, $._comma_newline, $._space, $._newline],
      visibleExternals: (_$) => ({
        _automatic_semicolon: string("\n"),
        _function_signature_automatic_semicolon: string("\n"),
        _comma_space: string(", "),
        _comma_newline: string(",\n"),
        _space: string(" "),
        _newline: string("\n")
      }),
      expectTestFailures: {
        debugger_statement: "#170 \u2014 _resolveOneLeaf cannot resolve the _semicolon stub",
        import_require_clause: "#170 \u2014 Missing field _content on ImportRequireClauseTransport._source",
        object_type_content: "#170 (#172-adjacent) \u2014 Missing field _content through export-arm transport",
        string: "#170 \u2014 StringContentTransportSlot rejects stub ($type property missing)"
      },
      rules: {
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
        // The class-body repeat's bare `';'` arm (stray member-separator
        // semicolons) has no kind identity, so the read's array capture
        // cannot materialize it. Alias the STRING in place to the visible
        // `semicolon` kind — the existing `_semicolon` enum (values
        // `'\n'`/`';'`) already owns that name and member text, so the
        // canonical-hidden lookup and enum transport serve it with no new
        // machinery. An alias on a string renames the node only — no
        // lexing/LR change — and the arm keeps its position, so the
        // `class_body` path patches below stay valid. (NOT the one-arg
        // `alias('semicolon')` patch helper — that synthesizes/reuses a
        // `_semicolon` RULE for the arm, which would make class bodies
        // accept automatic semicolons.)
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
        class_body: ($, original) => ({
          ...original,
          members: original.members.map(
            (m) => m.type === "REPEAT" ? {
              ...m,
              content: {
                ...m.content,
                members: m.content.members.map(
                  (arm2) => arm2.type === "STRING" && arm2.value === ";" ? { type: "ALIAS", content: arm2, named: true, value: "semicolon" } : arm2
                )
              }
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
        jsx_namespace_name: ($) => seq(field("namespace", $._jsx_identifier), ":", field("name", $._jsx_identifier)),
        // Upstream's `_extends_clause_single` (base grammar.js) carries two
        // fields (value, type_arguments) but is never aliased visible, so it
        // falls to the render layer's single-slot inline path and silently
        // drops `type_arguments`. Alias both occurrences (head + repeat) to a
        // visible kind so it gets its own slot surface, per the
        // single-slot-vs-visible rule.
        extends_clause: ($) => seq(
          "extends",
          seq(
            alias($._extends_clause_single, $.extends_clause_single),
            repeat(seq(",", alias($._extends_clause_single, $.extends_clause_single)))
          )
        ),
        _ambient_declaration_global: ($) => seq("global", field("body", $.statement_block)),
        _ambient_declaration_module: ($) => prec.right(
          seq(
            "module",
            ".",
            field("name", alias($.identifier, $.property_identifier)),
            ":",
            field("type", $.type),
            optional(field("terminator", $._semicolon))
          )
        ),
        optional_parameter: ($, original) => original,
        public_field_definition: ($, original) => original,
        required_parameter: ($, original) => original,
        //TODO: remove?
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
          return seq(optional(SEP()), seq(member, repeat(seq(SEP(), member))), optional(SEP()));
        }
      }
    },
    enrichedBase
  )
);
if (module.exports && module.exports.default) module.exports = module.exports.default;
