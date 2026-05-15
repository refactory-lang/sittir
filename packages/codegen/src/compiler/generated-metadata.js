/**
 * compiler/generated-metadata.ts — late tree-sitter artifact metadata.
 *
 * Rule identity and classification are built earlier from Evaluate's rule
 * tree; generated IDs are a secondary layer and never participate in that
 * foundational catalog construction.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { loadWebTreeSitter } from '../validate/common.js';
import { KindPresenceFlag } from './types.js';
export async function loadGeneratedIdTables(grammar) {
    const parserCPath = join(process.cwd(), 'packages', grammar, '.sittir', 'src', 'parser.c');
    if (existsSync(parserCPath)) {
        return deriveGeneratedIdTablesFromParserCSource(readFileSync(parserCPath, 'utf8'), `packages/${grammar}/.sittir/src/parser.c`);
    }
    const wasmPath = join(process.cwd(), 'packages', grammar, '.sittir', 'parser.wasm');
    if (!existsSync(wasmPath))
        return undefined;
    const { Language } = await loadWebTreeSitter();
    const language = (await Language.load(wasmPath));
    return deriveGeneratedIdTablesFromLanguage(language, `packages/${grammar}/.sittir/parser.wasm`);
}
export function deriveGeneratedIdTablesFromLanguage(language, sourceArtifact) {
    return {
        kindIds: collectKindIds(language),
        fieldIds: collectFieldIds(language),
        sourceArtifact
    };
}
export async function deriveGeneratedIdTablesFromParserCSource(source, sourceArtifact) {
    const parser = await loadCParser();
    const symbolIds = collectEnumIds(parser, source, 'enum ts_symbol_identifiers');
    const fieldIds = collectEnumIds(parser, source, 'enum ts_field_identifiers');
    const symbolNames = collectNameTable(parser, source, 'static const char * const ts_symbol_names[]');
    const fieldNames = collectNameTable(parser, source, 'static const char * const ts_field_names[]');
    return {
        kindIds: joinIdNames(symbolIds, symbolNames, deriveSymbolRuntimeName),
        fieldIds: joinIdNames(fieldIds, fieldNames, deriveFieldRuntimeName),
        sourceArtifact
    };
}
export function deriveGeneratedMetadata(ruleCatalog, tables) {
    const kindByName = new Map();
    const fieldByName = new Map();
    const kindIds = toEntries(tables.kindIds);
    const fieldIds = toEntries(tables.fieldIds);
    const kindIdLookup = new Map(kindIds);
    // Every kind in the rule catalog gets a catalog row, even when
    // tree-sitter inlined it (no parser symbol). This is the DRY source:
    // one entry per codegen rule. `presence` carries the file/runtime
    // existence flags (TSGrammar / TSNodeTypes / TSInternals); `parser`
    // carries the parser-origin metadata when applicable. `uses` is
    // populated by downstream NodeMap classification (Readable /
    // Buildable / Renderable). Per KindID runtime migration design
    // (2026-04-30).
    for (const kind of ruleCatalog.rootsByKind.keys()) {
        const parserEntry = kindIdLookup.get(kind);
        const basePresence = KindPresenceFlag.TSGrammar;
        if (parserEntry) {
            kindByName.set(kind, {
                kindId: parserEntry.id,
                parser: parserEntry.parser,
                presence: basePresence | KindPresenceFlag.TSInternals,
                sourceArtifact: tables.sourceArtifact
            });
        }
        else {
            kindByName.set(kind, {
                presence: basePresence,
                sourceArtifact: tables.sourceArtifact
            });
        }
    }
    const knownEdgeNames = collectEdgeNames(ruleCatalog);
    for (const [field, entry] of fieldIds) {
        if (!knownEdgeNames.has(field))
            continue;
        fieldByName.set(field, {
            fieldId: entry.id,
            parser: entry.parser,
            presence: KindPresenceFlag.TSGrammar | KindPresenceFlag.TSInternals,
            sourceArtifact: tables.sourceArtifact
        });
    }
    return { kindByName, fieldByName };
}
export function collectGeneratedKindEntries(tables) {
    if (!tables?.kindIds)
        return [];
    return toEntries(tables.kindIds)
        .filter(([, entry]) => entry.id !== undefined)
        .map(([kind, entry]) => ({
        kind,
        id: entry.id,
        symbolName: entry.parser?.symbolName !== undefined && entry.parser.symbolName !== kind
            ? entry.parser.symbolName
            : undefined,
        anon: entry.parser?.anon || undefined
    }));
}
export function findGeneratedKindEntry(entries, kind) {
    return (entries.find((entry) => entry.kind === kind) ??
        entries.find((entry) => entry.kind === `_${kind}`) ??
        entries.find((entry) => entry.anon === true && entry.symbolName === kind) ??
        undefined);
}
function collectKindIds(language) {
    const result = new Map();
    const namedness = new Map();
    for (let id = 0; id < language.nodeTypeCount; id += 1) {
        if (!language.nodeTypeIsVisible(id))
            continue;
        const name = language.nodeTypeForId(id);
        if (!name)
            continue;
        const isNamed = language.nodeTypeIsNamed(id);
        const existingIsNamed = namedness.get(name);
        if (existingIsNamed === true)
            continue;
        if (existingIsNamed === undefined || isNamed) {
            result.set(name, id);
            namedness.set(name, isNamed);
        }
    }
    return result;
}
function collectFieldIds(language) {
    const result = new Map();
    for (let id = 1; id <= language.fieldCount; id += 1) {
        const name = language.fieldNameForId(id);
        if (name)
            result.set(name, id);
    }
    return result;
}
function collectEdgeNames(ruleCatalog) {
    const names = new Set();
    for (const classification of ruleCatalog.classificationById.values()) {
        if (classification.edgeName)
            names.add(classification.edgeName);
    }
    return names;
}
function toEntries(input) {
    if (!input)
        return [];
    const entries = input instanceof Map ? [...input.entries()] : Object.entries(input);
    return entries.map(([name, entry]) => [name, typeof entry === 'number' ? { id: entry } : entry]);
}
async function loadCParser() {
    const { Parser, Language } = await loadWebTreeSitter();
    const parser = new Parser();
    const language = (await Language.load(resolveTreeSitterCWasmPath()));
    parser.setLanguage(language);
    return parser;
}
function resolveTreeSitterCWasmPath() {
    const require = createRequire(import.meta.url);
    try {
        return require.resolve('tree-sitter-c/tree-sitter-c.wasm');
    }
    catch {
        const packageJsonPath = findPnpmPackageFile('tree-sitter-c', 'package.json');
        return join(dirname(packageJsonPath), 'tree-sitter-c.wasm');
    }
}
function findPnpmPackageFile(packageName, fileName) {
    const pnpmDir = join(process.cwd(), 'node_modules', '.pnpm');
    for (const entry of readdirSync(pnpmDir)) {
        if (!entry.startsWith(`${packageName}@`))
            continue;
        const candidate = join(pnpmDir, entry, 'node_modules', packageName, fileName);
        if (existsSync(candidate))
            return candidate;
    }
    throw new Error(`Could not locate ${packageName}/${fileName}`);
}
function collectEnumIds(parser, source, marker) {
    const block = sliceCBlock(source, marker);
    if (!block)
        return new Map();
    const tree = parser.parse(block);
    if (!tree)
        return new Map();
    const result = new Map();
    walkCNodes(tree.rootNode, (node) => {
        if (node.type !== 'enumerator')
            return;
        const cName = node.childForFieldName('name')?.text;
        const value = node.childForFieldName('value')?.text;
        if (!cName || !value)
            return;
        const id = Number.parseInt(value, 10);
        if (Number.isNaN(id))
            return;
        result.set(cName, { cName, id });
    });
    return result;
}
function collectNameTable(parser, source, marker) {
    const block = sliceCBlock(source, marker);
    if (!block)
        return new Map();
    const tree = parser.parse(block);
    if (!tree)
        return new Map();
    const result = new Map();
    walkCNodes(tree.rootNode, (node) => {
        if (node.type !== 'initializer_pair')
            return;
        const designator = node.childForFieldName('designator');
        const value = node.childForFieldName('value');
        const cName = designator ? firstChildText(designator, 'identifier') : undefined;
        if (!cName || !value || value.type !== 'string_literal')
            return;
        result.set(cName, decodeCStringLiteral(value.text));
    });
    return result;
}
function joinIdNames(ids, names, fallbackName) {
    // The join key is the **prefix-stripped C symbol name** (per the KindID
    // runtime migration design, 2026-04-30): `sym__array_expression_list`
    // becomes `_array_expression_list`, distinct from the visible
    // `sym_array_expression_list` (would-be `array_expression_list`). The
    // lookup table `ts_symbol_names[]` is intentionally lossy — it
    // canonicalizes display labels and collapses `sym__as_pattern` and
    // `sym_as_pattern` to the same `"as_pattern"` string — so it can NOT be
    // used as the identity key. The symbol name survives as a diagnostic
    // label on the catalog row.
    const result = new Map();
    for (const entry of ids.values()) {
        const key = fallbackName(entry.cName);
        const parser = createParserMetadata(entry, key, names);
        const existing = result.get(key);
        if (!existing || !existing.parser) {
            result.set(key, { id: entry.id, parser });
            continue;
        }
        if (existing.parser.cSymbol === entry.cName) {
            result.set(key, { id: entry.id, parser });
            continue;
        }
        if (existing.parser.anon !== parser.anon) {
            if (existing.parser.anon) {
                const anonKey = disambiguateAnonKey(key, result, existing.id ?? entry.id);
                result.set(anonKey, {
                    id: existing.id,
                    parser: {
                        ...existing.parser,
                        parserName: anonKey,
                        hidden: anonKey.startsWith('_')
                    }
                });
                result.set(key, { id: entry.id, parser });
            }
            else {
                const anonKey = disambiguateAnonKey(key, result, entry.id);
                result.set(anonKey, {
                    id: entry.id,
                    parser: {
                        ...parser,
                        parserName: anonKey,
                        hidden: anonKey.startsWith('_')
                    }
                });
            }
            continue;
        }
        if (!shouldReplaceSymbol(existing.parser.cSymbol, entry.cName)) {
            continue;
        }
        result.set(key, { id: entry.id, parser });
    }
    return result;
}
function createParserMetadata(entry, parserName, names) {
    return {
        cSymbol: entry.cName,
        parserName,
        symbolName: names.get(entry.cName),
        anon: entry.cName.startsWith('anon_sym_'),
        aux: entry.cName.startsWith('aux_sym_'),
        alias: entry.cName.startsWith('alias_sym_'),
        hidden: parserName.startsWith('_')
    };
}
function disambiguateAnonKey(baseKey, existing, id) {
    const preferred = `anon_${baseKey}`;
    if (!existing.has(preferred))
        return preferred;
    return `${preferred}_${id}`;
}
function shouldReplaceSymbol(existingCName, nextCName) {
    if (!existingCName)
        return true;
    return existingCName.startsWith('anon_sym_') && !nextCName.startsWith('anon_sym_');
}
function deriveSymbolRuntimeName(cName) {
    if (cName.startsWith('sym_'))
        return cName.slice('sym_'.length);
    // Anonymous tokens (`anon_sym_LPAREN`, `anon_sym_PLUS`, `anon_sym_RBRACE`)
    // arrive in parser.c with all-caps tail names. Lowercase them so the
    // catalog `key` is consistently snake-case across all kinds (aligns with
    // `call_expression`, `_array_expression_list`, etc.) and the downstream
    // PascalCase / SCREAMING_SNAKE_CASE conversions produce sane
    // identifiers. Without this, `LPAREN` stays uppercase, the
    // `toScreamingSnakeCase` regex inserts `_` before every letter, and the
    // emitted Rust constant becomes `L_P_A_R_E_N` instead of `LPAREN`.
    // The original C-side name is preserved in `parser.cSymbol`; the literal
    // punctuation text is preserved in `parser.symbolName`.
    if (cName.startsWith('anon_sym_')) {
        return cName.slice('anon_sym_'.length).toLowerCase();
    }
    if (cName.startsWith('aux_sym_'))
        return cName.slice('aux_sym_'.length);
    // `alias_sym_<target>` is the parser symbol for an aliased kind. The
    // codegen rule that produces it is the hidden source (leading
    // underscore) — e.g. tree-sitter-rust aliases `_field_identifier` →
    // `field_identifier`, which appears in parser.c as
    // `alias_sym_field_identifier`. Map back to the hidden source name so
    // the join hits the codegen-side rule key.
    if (cName.startsWith('alias_sym_'))
        return `_${cName.slice('alias_sym_'.length)}`;
    return cName;
}
function deriveFieldRuntimeName(cName) {
    return cName.startsWith('field_') ? cName.slice('field_'.length) : cName;
}
function walkCNodes(node, visit) {
    visit(node);
    for (let i = 0; i < node.childCount; i += 1) {
        const child = node.child(i);
        if (child)
            walkCNodes(child, visit);
    }
}
function firstChildText(node, type) {
    if (node.type === type)
        return node.text;
    for (let i = 0; i < node.childCount; i += 1) {
        const child = node.child(i);
        if (!child)
            continue;
        const found = firstChildText(child, type);
        if (found)
            return found;
    }
    return undefined;
}
function sliceCBlock(source, marker) {
    const start = source.indexOf(marker);
    if (start < 0)
        return undefined;
    const open = source.indexOf('{', start);
    if (open < 0)
        return undefined;
    let depth = 0;
    let stringQuote;
    let inLineComment = false;
    let inBlockComment = false;
    for (let i = open; i < source.length; i += 1) {
        const ch = source[i];
        const next = source[i + 1];
        if (inLineComment) {
            if (ch === '\n')
                inLineComment = false;
            continue;
        }
        if (inBlockComment) {
            if (ch === '*' && next === '/') {
                inBlockComment = false;
                i += 1;
            }
            continue;
        }
        if (stringQuote) {
            if (ch === '\\') {
                i += 1;
                continue;
            }
            if (ch === stringQuote)
                stringQuote = undefined;
            continue;
        }
        if (ch === '/' && next === '/') {
            inLineComment = true;
            i += 1;
            continue;
        }
        if (ch === '/' && next === '*') {
            inBlockComment = true;
            i += 1;
            continue;
        }
        if (ch === '"' || ch === "'") {
            stringQuote = ch;
            continue;
        }
        if (ch === '{') {
            depth += 1;
            continue;
        }
        if (ch !== '}')
            continue;
        depth -= 1;
        if (depth === 0) {
            return source.slice(start, i + 2);
        }
    }
    return undefined;
}
function decodeCStringLiteral(literal) {
    let body = literal.trim();
    if (body.startsWith('"') && body.endsWith('"'))
        body = body.slice(1, -1);
    let result = '';
    for (let i = 0; i < body.length; i += 1) {
        const ch = body[i];
        if (ch !== '\\') {
            result += ch;
            continue;
        }
        i += 1;
        const escaped = body[i];
        switch (escaped) {
            case undefined:
                result += '\\';
                break;
            case 'n':
                result += '\n';
                break;
            case 'r':
                result += '\r';
                break;
            case 't':
                result += '\t';
                break;
            case '0':
                result += '\0';
                break;
            case '\\':
            case '"':
            case "'":
            case '?':
                result += escaped;
                break;
            default:
                result += escaped;
                break;
        }
    }
    return result;
}
//# sourceMappingURL=generated-metadata.js.map