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
  if ((t === "symbol" || t === "SYMBOL") && typeof r.name === "string") return r.name;
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
  return t === "prec" || t === "PREC" || t === "PREC_LEFT" || t === "PREC_RIGHT" || t === "PREC_DYNAMIC";
}

// packages/codegen/src/dsl/transform-path.ts
function dsl() {
  return globalThis;
}
function nativeRequired(name) {
  const fn = dsl()[name];
  if (typeof fn !== "function") {
    throw new Error(`transform: no global ${String(name)}() found \u2014 must be called inside a runtime that injects ${String(name)}() (sittir evaluate.ts or tree-sitter CLI)`);
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
    if (part === "*") {
      segments.push({ kind: "wildcard" });
    } else if (/^\d+$/.test(part)) {
      segments.push({ kind: "index", value: Number(part) });
    } else {
      throw new Error(`parsePath: invalid segment '${part}' in path '${pathStr}' \u2014 must be a numeric index or '*'`);
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
    const newStack = precStack ? [...precStack, rule] : [rule];
    const newContent = applyPath(contentOf(rule), segments, patch, newStack);
    return reconstructPrec(rule, newContent);
  }
  const [head, ...rest] = segments;
  const t = rule.type;
  if (isContainerType(t)) {
    return applyToMembers(rule, head, rest, patch, precStack);
  }
  if (isWrapperType(t)) {
    if (head.kind === "wildcard" || head.kind === "index" && head.value === 0) {
      const newContent = applyPath(contentOf(rule), rest, patch, precStack);
      return reconstructWrapper(rule, newContent);
    }
    throw new ApplyPathSkip(
      `applyPath: index ${head.kind === "index" ? head.value : "*"} out of bounds \u2014 '${rule.type}' wraps a single content rule (only index 0 is valid)`
    );
  }
  throw new ApplyPathSkip(`applyPath: cannot descend into '${rule.type}' rule (path has ${segments.length} segments left)`);
}
function reconstructContainer(rule, members) {
  const t = rule.type;
  if (t === "seq" || t === "SEQ") return nativeRequired("seq")(...members);
  if (t === "choice" || t === "CHOICE") return nativeRequired("choice")(...members);
  throw new Error(`reconstructContainer: unknown container type '${t}'`);
}
function reconstructWrapper(rule, newContent) {
  const t = rule.type;
  if (t === "optional") return nativeRequired("optional")(newContent);
  if (t === "repeat" || t === "REPEAT" || t === "repeat1" || t === "REPEAT1") {
    const r = rule;
    if (r.separator !== void 0 || r.leading !== void 0 || r.trailing !== void 0) {
      throw new Error(
        `reconstructWrapper: cannot path-address under a '${rule.type}' rule with separator/leading/trailing metadata \u2014 native repeat() can't round-trip those fields. Use flat positional transform or restructure the override.`
      );
    }
    return nativeRequired(t === "repeat" || t === "REPEAT" ? "repeat" : "repeat1")(newContent);
  }
  if (t === "field" || t === "FIELD") {
    const name = rule.name;
    return nativeRequired("field")(name, newContent);
  }
  throw new Error(
    `reconstructWrapper: no native dsl reconstruction for wrapper type '${rule.type}' \u2014 this is a bug in the path-descent logic.`
  );
}
var PREC_VARIANT_MAP = {
  prec_left: "left",
  prec_right: "right",
  prec_dynamic: "dynamic"
};
function reconstructPrec(rule, newContent) {
  const t = rule.type.toLowerCase();
  const value = rule.value ?? 0;
  const prec = nativeRequired("prec");
  const variant2 = PREC_VARIANT_MAP[t];
  if (variant2) {
    const fn = prec[variant2];
    if (typeof fn !== "function") throw new Error(`transform: native prec.${variant2} not available`);
    return fn(value, newContent);
  }
  return prec(value, newContent);
}
function applyToMembers(rule, head, rest, patch, precStack) {
  const members = [...membersOf(rule)];
  if (head.kind === "index") {
    if (head.value < 0 || head.value >= members.length) {
      throw new ApplyPathSkip(
        `applyPath: index ${head.value} out of bounds in ${rule.type} of length ${members.length}`
      );
    }
    members[head.value] = applyPath(members[head.value], rest, patch, precStack);
    return reconstructContainer(rule, members);
  }
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
    throw new ApplyPathSkip(`applyPath: wildcard matched zero members successfully in ${rule.type} of length ${members.length}`);
  }
  return reconstructContainer(rule, members);
}

// packages/codegen/src/dsl/field.ts
function isFieldPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "field";
}
function field(name, content) {
  if (content === void 0) {
    return { __sittirPlaceholder: "field", name };
  }
  const native = globalThis.field;
  if (typeof native !== "function") {
    throw new Error("field(): no global field() found \u2014 must be called inside a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)");
  }
  return native(name, content);
}

// packages/codegen/src/dsl/alias.ts
function isAliasPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "alias";
}

// packages/codegen/src/dsl/variant.ts
function isVariantPlaceholder(v) {
  return !!v && typeof v === "object" && v.__sittirPlaceholder === "variant";
}
function variant(name) {
  return { __sittirPlaceholder: "variant", name };
}

// packages/codegen/src/dsl/synthetic-rules.ts
var currentSyntheticRules = null;
var currentRuleKind = null;
var currentPolymorphVariants = [];
function getCurrentRuleKind() {
  return currentRuleKind;
}
function registerSyntheticRule(name, content) {
  if (!currentSyntheticRules) {
    currentSyntheticRules = /* @__PURE__ */ new Map();
  }
  currentSyntheticRules.set(name, content);
}
function registerPolymorphVariant(parentKind, childSuffix) {
  const dup = currentPolymorphVariants.find((v) => v.parent === parentKind && v.child === childSuffix);
  if (dup) {
    throw new Error(
      `variant('${childSuffix}'): duplicate variant name on rule '${parentKind}'. Each variant() within a rule must have a unique name \u2014 change one or merge the patches.`
    );
  }
  currentPolymorphVariants.push({ parent: parentKind, child: childSuffix });
}
function drainSyntheticRules() {
  const rules = currentSyntheticRules ?? /* @__PURE__ */ new Map();
  currentSyntheticRules = null;
  return rules;
}
function installGrammarWrapper() {
  const g = globalThis;
  const nativeGrammar = g.grammar;
  if (typeof nativeGrammar !== "function") return;
  g.grammar = function wrappedGrammar(...args) {
    currentSyntheticRules = /* @__PURE__ */ new Map();
    const base2 = args.length > 1 ? args[0] : void 0;
    const opts = args.length > 1 ? args[1] : args[0];
    if (opts) {
      const userNames = Object.keys(opts.rules ?? {});
      Object.defineProperty(opts, "__userOverrideRuleNames__", {
        value: userNames,
        enumerable: false,
        configurable: true,
        writable: false
      });
    }
    if (base2?.__enrichOverrides__ && opts) {
      if (!opts.rules) opts.rules = {};
      for (const [name, fn] of Object.entries(base2.__enrichOverrides__)) {
        if (!(name in opts.rules)) opts.rules[name] = fn;
      }
    }
    if (opts?.rules) {
      const permissive = new Proxy({}, {
        get(_, name) {
          return { type: "SYMBOL", name };
        }
      });
      for (const [name, ruleFn] of Object.entries(opts.rules)) {
        if (typeof ruleFn === "function") {
          currentRuleKind = name;
          let baseOriginal = void 0;
          const baseFn = base2?.rules?.[name];
          if (typeof baseFn === "function") {
            try {
              baseOriginal = baseFn.call(permissive, permissive, void 0);
            } catch {
            }
          }
          try {
            ruleFn.call(permissive, permissive, baseOriginal);
          } catch {
          } finally {
            currentRuleKind = null;
          }
        }
      }
    }
    const discoveredNames = new Map(currentSyntheticRules);
    currentSyntheticRules = /* @__PURE__ */ new Map();
    if (opts?.rules) {
      for (const [name, ruleFn] of Object.entries(opts.rules)) {
        if (typeof ruleFn !== "function") continue;
        opts.rules[name] = function(...a) {
          currentRuleKind = name;
          try {
            return ruleFn.apply(this, a);
          } finally {
            currentRuleKind = null;
          }
        };
      }
    }
    if (opts?.rules && discoveredNames.size > 0) {
      const blank = g.blank;
      for (const [name] of discoveredNames) {
        if (!(name in opts.rules)) {
          opts.rules[name] = () => blank ? blank() : { type: "BLANK" };
        }
      }
    }
    const result = nativeGrammar.apply(this, args);
    const synthetic = drainSyntheticRules();
    if (result && synthetic.size > 0 && typeof result === "object") {
      const grammar2 = result.grammar ?? result;
      if ("rules" in grammar2) {
        const rules = grammar2.rules;
        for (const [name, content] of synthetic) {
          rules[name] = content;
        }
      }
    }
    return result;
  };
}

// packages/codegen/src/dsl/transform.ts
function transform(original, ...patchSets) {
  let rule = original;
  for (const patches of patchSets) {
    const hasPathKeys = Object.keys(patches).some((k) => k.includes("/") || k.includes("*"));
    const hasPlaceholderAlias = Object.values(patches).some((v) => isAliasPlaceholder(v) || isVariantPlaceholder(v));
    if (hasPathKeys || hasPlaceholderAlias) {
      rule = applyPathPatches(rule, patches);
    } else {
      rule = applyFlatPatches(rule, patches);
    }
  }
  return rule;
}
function applyPathPatches(original, patches) {
  let rule = original;
  for (const [key, value] of Object.entries(patches)) {
    const segments = parsePath(String(key));
    rule = applyPath(rule, segments, (member, precStack) => resolvePatch(value, member, precStack));
  }
  return rule;
}
var membersOf2 = (r) => r.members;
var contentOf2 = (r) => r.content;
function applyFlatPatches(original, patches) {
  const t = original.type;
  if (t === "seq" || t === "SEQ") {
    const members = [...membersOf2(original)];
    for (const [key, patch] of Object.entries(patches)) {
      if (!/^\d+$/.test(key)) {
        throw new Error(
          `transform: invalid flat-positional key '${key}' \u2014 keys must be non-negative integers. Use path syntax ('0/1', '*') for nested addressing.`
        );
      }
      const index = Number(key);
      if (index >= members.length) {
        throw new Error(
          `transform: index ${index} out of bounds in ${original.type} of length ${members.length}`
        );
      }
      members[index] = resolvePatch(patch, members[index]);
    }
    return reconstructContainer(original, members);
  }
  if (t === "choice" || t === "CHOICE") {
    const newMembers = membersOf2(original).map((m) => applyFlatPatches(m, patches));
    return reconstructContainer(original, newMembers);
  }
  if (isPrecWrapper(original)) {
    const newContent = applyFlatPatches(contentOf2(original), patches);
    return reconstructPrec(original, newContent);
  }
  if (isWrapperType(t)) {
    const newContent = applyFlatPatches(contentOf2(original), patches);
    return reconstructWrapper(original, newContent);
  }
  return original;
}
function wrapInPrec(content, precStack) {
  if (!precStack?.length) return content;
  let result = content;
  for (let i = precStack.length - 1; i >= 0; i--) {
    result = reconstructPrec(precStack[i], result);
  }
  return result;
}
function resolvePatch(patch, originalMember, precStack) {
  if (isFieldPlaceholder(patch)) {
    let content = originalMember;
    if (isFieldLike(content) && content.source === "inferred") {
      content = content.content;
    }
    const c = content;
    if (c && (c.type === "STRING" || c.type === "string")) {
      const isUpperCase = c.type === "STRING";
      const hiddenName = `_kw_${patch.name}`;
      const nativePrec = globalThis.prec;
      const precBody = typeof nativePrec?.left === "function" ? nativePrec.left(1, content) : content;
      registerSyntheticRule(hiddenName, wrapInPrec(precBody, precStack));
      content = {
        type: isUpperCase ? "SYMBOL" : "symbol",
        name: hiddenName
      };
    }
    const native = globalThis.field;
    if (typeof native !== "function") {
      throw new Error("transform: no global field() found \u2014 patches that use the one-arg field() form require a runtime that injects field() (sittir evaluate.ts or tree-sitter CLI)");
    }
    const reconstructed = native(patch.name, content);
    return { ...reconstructed, source: "override" };
  }
  if (isFieldLike(patch)) {
    return { ...patch, source: "override" };
  }
  if (isVariantPlaceholder(patch)) {
    const parentKind = getCurrentRuleKind();
    if (!parentKind) {
      throw new Error(`variant('${patch.name}'): no current rule kind \u2014 variant() must be used inside a rule callback`);
    }
    const fullName = `${parentKind}_${patch.name}`;
    const hiddenName = "_" + fullName;
    registerSyntheticRule(hiddenName, wrapInPrec(originalMember, precStack));
    registerPolymorphVariant(parentKind, patch.name);
    const isUpperCase = originalMember.type === originalMember.type.toUpperCase();
    return {
      type: isUpperCase ? "ALIAS" : "alias",
      content: { type: isUpperCase ? "SYMBOL" : "symbol", name: hiddenName },
      named: true,
      value: fullName
    };
  }
  if (isAliasPlaceholder(patch)) {
    const hiddenName = "_" + patch.name;
    registerSyntheticRule(hiddenName, wrapInPrec(originalMember, precStack));
    const isUpperCase = originalMember.type === originalMember.type.toUpperCase();
    return {
      type: isUpperCase ? "ALIAS" : "alias",
      content: { type: isUpperCase ? "SYMBOL" : "symbol", name: hiddenName },
      named: true,
      value: patch.name
    };
  }
  return patch;
}

// packages/codegen/src/dsl/role.ts
var currentRoles = null;
var VALID_ROLE_NAMES = /* @__PURE__ */ new Set(["indent", "dedent", "newline"]);
function role(symbol, roleName) {
  if (!isSymbolLike(symbol)) {
    throw new Error(
      `role(): first argument must be a symbol reference (e.g. $._indent), got ${JSON.stringify(symbol)}`
    );
  }
  if (!VALID_ROLE_NAMES.has(roleName)) {
    throw new Error(
      `role(): second argument must be one of 'indent' | 'dedent' | 'newline', got ${JSON.stringify(roleName)}`
    );
  }
  if (currentRoles !== null) {
    currentRoles.set(symbol.name, { role: roleName });
  }
  return symbol;
}

// packages/codegen/src/dsl/enrich.ts
function enrich(base2) {
  if (!base2 || typeof base2 !== "object") {
    throw new Error("enrich(): expected a grammar object, got " + typeof base2);
  }
  const rulesBag = ("grammar" in base2 ? base2.grammar?.rules : base2.rules) ?? {};
  const enrichOverrides = {};
  for (const name of Object.keys(rulesBag)) {
    enrichOverrides[name] = function(_$, original) {
      return applyEnrichPasses(name, original);
    };
  }
  Object.defineProperty(base2, "__enrichOverrides__", {
    value: enrichOverrides,
    enumerable: false,
    configurable: true,
    writable: false
  });
  return base2;
}
function applyEnrichPasses(ruleName, rule) {
  let r = rule;
  r = applyKindToNameViaTransform(ruleName, r);
  r = applyBareKeywordViaTransform(ruleName, r);
  r = applyOptionalKeywordViaTransform(ruleName, r);
  return r;
}
function typeEq(t, lower) {
  return typeof t === "string" && (t === lower || t === lower.toUpperCase());
}
function isSeqType(t) {
  return typeEq(t, "seq");
}
function isStringType(t) {
  return typeEq(t, "string");
}
function isSymbolType(t) {
  return typeEq(t, "symbol");
}
function isFieldType(t) {
  return typeEq(t, "field");
}
function isOptionalType(t) {
  return typeEq(t, "optional");
}
function isChoiceType(t) {
  return typeEq(t, "choice");
}
function isRepeatType(t) {
  return typeEq(t, "repeat") || typeEq(t, "repeat1");
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
function applyKindToNameViaTransform(ruleName, rule) {
  if (!isSeqType(rule.type)) return rule;
  const raw = rule.members;
  const members = raw.map(normalizeMember);
  const kindCounts = /* @__PURE__ */ new Map();
  for (const m of members) {
    if (isSymbolType(m.type) && typeof m.name === "string") {
      kindCounts.set(m.name, (kindCounts.get(m.name) ?? 0) + 1);
    }
  }
  const existing = collectFieldNamesRuntime(rule);
  const patches = {};
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    if (!isSymbolType(m.type) || typeof m.name !== "string") continue;
    const k = m.name;
    if (k.startsWith("_")) continue;
    if ((kindCounts.get(k) ?? 0) > 1) continue;
    if (existing.has(k)) {
      reportSkip("kind-to-name", ruleName, `field '${k}' already exists`);
      continue;
    }
    existing.add(k);
    patches[String(i)] = field(k);
  }
  if (Object.keys(patches).length === 0) return rule;
  return transform(rule, patches);
}
function applyOptionalKeywordViaTransform(ruleName, rule) {
  const patches = {};
  collectOptionalKeywordPatches(ruleName, rule, "", patches);
  if (Object.keys(patches).length === 0) return rule;
  return transform(rule, patches);
}
function peelOptional(rule) {
  if (isOptionalType(rule.type)) {
    return { inner: rule.content, isOptional: true };
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
function collectOptionalKeywordPatches(ruleName, rule, prefix, patches) {
  if (isSeqType(rule.type)) {
    const raw = rule.members;
    const claimed = collectFieldNamesRuntime(rule);
    for (let i = 0; i < raw.length; i++) {
      const m = normalizeMember(raw[i]);
      const peeled = peelOptional(m);
      if (peeled.isOptional) {
        const innerN = normalizeMember(peeled.inner);
        if (isStringType(innerN.type)) {
          const kw = innerN.value;
          if (typeof kw === "string" && isIdentifierShaped(kw)) {
            if (claimed.has(kw)) {
              reportSkip("optional-keyword-prefix", ruleName, `field '${kw}' already exists`);
              continue;
            }
            claimed.add(kw);
            let innerPath;
            if (isOptionalType(m.type)) {
              innerPath = "0";
            } else {
              const cm = m.members;
              const strIdx = cm.findIndex((x) => {
                const n = normalizeMember(x);
                return n.type !== "BLANK" && n.type !== "blank";
              });
              innerPath = String(strIdx);
            }
            const fullPath = prefix ? `${prefix}/${i}/${innerPath}` : `${i}/${innerPath}`;
            patches[fullPath] = field(kw);
            continue;
          }
        }
      }
      const childPrefix = prefix ? `${prefix}/${i}` : `${i}`;
      collectOptionalKeywordPatches(ruleName, m, childPrefix, patches);
    }
    return;
  }
  if (isChoiceType(rule.type)) {
    const raw = rule.members;
    for (let i = 0; i < raw.length; i++) {
      const childPrefix = prefix ? `${prefix}/${i}` : `${i}`;
      const m = normalizeMember(raw[i]);
      collectOptionalKeywordPatches(ruleName, m, childPrefix, patches);
    }
    return;
  }
  if (isOptionalType(rule.type) || isRepeatType(rule.type) || isFieldType(rule.type)) {
    const inner = normalizeMember(rule.content);
    const childPrefix = prefix ? `${prefix}/0` : `0`;
    collectOptionalKeywordPatches(ruleName, inner, childPrefix, patches);
  }
}
function applyBareKeywordViaTransform(ruleName, rule) {
  if (!isSeqType(rule.type)) return rule;
  const raw = rule.members;
  const first = raw[0];
  if (first === void 0) return rule;
  const normFirst = normalizeMember(first);
  if (!isStringType(normFirst.type)) return rule;
  const kw = normFirst.value;
  if (typeof kw !== "string" || !isIdentifierShaped(kw)) return rule;
  const existing = collectFieldNamesRuntime(rule);
  if (existing.has(kw)) {
    reportSkip("bare-keyword-prefix", ruleName, `field '${kw}' already exists`);
    return rule;
  }
  return transform(
    rule,
    { 0: field(kw) }
  );
}
function isIdentifierShaped(value) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}
function reportSkip(pass, ruleName, reason) {
  if (process.env.SITTIR_QUIET) return;
  process.stderr.write(`enrich: skipped ${pass} on ${ruleName} (${reason})
`);
}

// packages/codegen/src/dsl/index.ts
installGrammarWrapper();

// packages/python/overrides.ts
var overrides_default = grammar(enrich(import_grammar.default), {
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
  rules: {
    // assignment: nested-alias polymorph.
    // alias('name') captures the choice branch content into a
    // hidden rule _name and replaces with alias($._name, $.name).
    assignment: ($, original) => transform(original, {
      "1/0": variant("eq"),
      "1/1": variant("type"),
      "1/2": variant("typed")
    }),
    // as_pattern: 1 field(s)
    as_pattern: ($, original) => transform(original, {
      0: field("expression")
      // expression | case_pattern | identifier [struct=0]
    }),
    // await: 1 field(s)
    await: ($, original) => transform(original, {
      1: field("primary_expression")
      // primary_expression [struct=0]
    }),
    // chevron: 1 field(s)
    chevron: ($, original) => transform(original, {
      1: field("expression")
      // expression [struct=0]
    }),
    // class_pattern: 2 field(s)
    class_pattern: ($, original) => transform(original, {
      0: field("dotted_name"),
      // dotted_name [struct=0]
      2: field("arguments")
      // case_pattern [struct=1]
    }),
    // comparison_operator: 2 field(s)
    comparison_operator: ($, original) => transform(original, {
      0: field("left"),
      // primary_expression [struct=0]
      1: field("comparators")
      // primary_expression [struct=1]
    }),
    // complex_pattern: 2 field(s)
    complex_pattern: ($, original) => transform(original, {
      0: field("real"),
      // integer | float [struct=0]
      1: field("imaginary")
      // integer | float [struct=1]
    }),
    // conditional_expression: 3 field(s)
    conditional_expression: ($, original) => transform(original, {
      0: field("body"),
      // expression [struct=0]
      2: field("condition"),
      // expression [struct=1]
      4: field("alternative")
      // expression [struct=2]
    }),
    // constrained_type: 2 field(s)
    constrained_type: ($, original) => transform(original, {
      0: field("base_type"),
      // type [struct=0]
      2: field("constraint")
      // type [struct=1]
    }),
    // decorator: 2 field(s)
    decorator: ($, original) => transform(original, {
      1: field("expression"),
      // expression [struct=0]
      2: field("newline")
      //  [struct=1]
    }),
    // dictionary_splat: 1 field(s)
    dictionary_splat: ($, original) => transform(original, {
      1: field("expression")
      // expression [struct=0]
    }),
    // finally_clause: 1 field(s)
    finally_clause: ($, original) => transform(original, {
      2: field("block")
      // block [struct=0]
    }),
    // generic_type: 2 field(s)
    generic_type: ($, original) => transform(original, {
      0: field("identifier"),
      // identifier [struct=0]
      1: field("type_parameter")
      // type_parameter [struct=1]
    }),
    // if_clause: 1 field(s)
    if_clause: ($, original) => transform(original, {
      1: field("expression")
      // expression [struct=0]
    }),
    // import_from_statement: 1 field(s)
    import_from_statement: ($, original) => transform(original, {
      3: field("wildcard_import")
      // wildcard_import [struct=0]
    }),
    // keyword_pattern: 2 field(s)
    keyword_pattern: ($, original) => transform(original, {
      0: field("identifier"),
      // identifier | class_pattern | complex_pattern | concatenated_string | dict_pattern | dotted_name | false | float | integer | list_pattern | none | splat_pattern | string | true | tuple_pattern | union_pattern [struct=0]
      2: field("simple_pattern")
      // _simple_pattern | class_pattern | complex_pattern | concatenated_string | dict_pattern | dotted_name | false | float | integer | list_pattern | none | splat_pattern | string | true | tuple_pattern | union_pattern [struct=1]
    }),
    // list_splat: 1 field(s)
    list_splat: ($, original) => transform(original, {
      1: field("expression")
      // expression | attribute | identifier | subscript [struct=0]
    }),
    // member_type: 2 field(s)
    member_type: ($, original) => transform(original, {
      0: field("base_type"),
      // type [struct=0]
      2: field("identifier")
      // identifier [struct=1]
    }),
    // relative_import: 2 field(s)
    relative_import: ($, original) => transform(original, {
      0: field("import_prefix"),
      // import_prefix [struct=0]
      1: field("dotted_name")
      // dotted_name [struct=1]
    }),
    // slice: 3 field(s)
    slice: ($, original) => transform(original, {
      0: field("start"),
      // expression [struct=0]
      2: field("stop"),
      // expression [struct=1]
      3: field("step")
      // expression [struct=2]
    }),
    // splat_pattern: 1 field(s)
    splat_pattern: ($, original) => transform(original, {
      0: field("identifier")
      // identifier [struct=0]
    }),
    // splat_type: 1 field(s)
    splat_type: ($, original) => transform(original, {
      0: field("identifier")
      // identifier [struct=0]
    }),
    // string: 3 field(s)
    string: ($, original) => transform(original, {
      0: field("string_start"),
      // string_start [struct=0]
      1: field("content"),
      // interpolation | string_content [struct=1]
      2: field("string_end")
      // string_end [struct=2]
    }),
    // try_statement: 3 field(s)
    try_statement: ($, original) => transform(original, {
      3: field("except_clauses"),
      // except_clause [struct=0]
      4: field("else_clause"),
      // else_clause [struct=1]
      5: field("finally_clause")
      // finally_clause [struct=2]
    }),
    // union_type: 2 field(s)
    union_type: ($, original) => transform(original, {
      0: field("left"),
      // type [struct=0]
      2: field("right")
      // type [struct=1]
    })
  }
});
if (module.exports && module.exports.default) module.exports = module.exports.default;
