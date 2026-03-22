/**
 * Emits `validate.ts` (tree-sitter based) and `validate-fast.ts` (regex heuristics).
 */

import { toGrammarTypeName } from '../naming.ts';

export interface EmitValidateConfig {
  grammar: string;
}

/**
 * Emit a `validate.ts` file that uses tree-sitter via `codemod:ast-grep`
 * to parse and validate generated source code.
 */
export function emitValidate(config: EmitValidateConfig): string {
  const { grammar } = config;
  const grammarTypeName = toGrammarTypeName(grammar);
  const grammarPrefix = grammarTypeName.slice(0, -5);

  const lines: string[] = [];

  lines.push(`import type { ValidationResult } from './types.js';`);
  lines.push(`import { parse } from 'codemod:ast-grep/${grammar}';`);
  lines.push('');

  lines.push('/**');
  lines.push(` * Validate ${grammarPrefix} source code using tree-sitter parsing.`);
  lines.push(' * Returns a ValidationResult indicating whether the source is syntactically valid.');
  lines.push(' */');
  lines.push(`export function validate(source: string): ValidationResult {`);
  lines.push('  try {');
  lines.push('    const root = parse(source).root();');
  lines.push('    const errors = root.findAll({ rule: { kind: "ERROR" } });');
  lines.push('    if (errors.length > 0) {');
  lines.push('      return {');
  lines.push('        ok: false,');
  lines.push('        errors: errors.map((e) => ({');
  lines.push('          message: `Parse error at ${e.range().start.line}:${e.range().start.column}`,');
  lines.push('          range: e.range(),');
  lines.push('        })),');
  lines.push('      };');
  lines.push('    }');
  lines.push('    return { ok: true, errors: [] };');
  lines.push('  } catch (err) {');
  lines.push('    return {');
  lines.push('      ok: false,');
  lines.push('      errors: [{ message: (err as Error).message }],');
  lines.push('    };');
  lines.push('  }');
  lines.push('}');
  lines.push('');

  lines.push('/**');
  lines.push(' * Validate source and throw if invalid.');
  lines.push(' */');
  lines.push('export function assertValid(source: string): string {');
  lines.push('  const result = validate(source);');
  lines.push('  if (!result.ok) {');
  lines.push("    throw new Error(`Invalid ${grammar} source:\\n${result.errors.map((e) => e.message).join('\\n')}\\n\\nSource:\\n${source}`);");
  lines.push('  }');
  lines.push('  return source;');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

/**
 * Emit a `validate-fast.ts` scaffold with regex-based heuristics
 * for quick validation without tree-sitter.
 */
export function emitValidateFast(config: EmitValidateConfig): string {
  const { grammar } = config;
  const grammarTypeName = toGrammarTypeName(grammar);
  const grammarPrefix = grammarTypeName.slice(0, -5);

  const lines: string[] = [];

  lines.push(`import type { ValidationResult } from './types.js';`);
  lines.push('');

  lines.push('/**');
  lines.push(` * Fast validation of ${grammarPrefix} source using regex heuristics.`);
  lines.push(' * Checks brace/bracket/paren matching and basic structural validity.');
  lines.push(' * Does NOT replace full tree-sitter validation — use validate.ts for that.');
  lines.push(' */');
  lines.push(`export function validate(source: string): ValidationResult {`);
  lines.push('  const errors: Array<{ message: string }> = [];');
  lines.push('');
  lines.push('  // Brace matching');
  lines.push("  const opens = (source.match(/\\{/g) || []).length;");
  lines.push("  const closes = (source.match(/\\}/g) || []).length;");
  lines.push('  if (opens !== closes) {');
  lines.push('    errors.push({ message: `Mismatched braces: ${opens} open, ${closes} close` });');
  lines.push('  }');
  lines.push('');
  lines.push('  // Paren matching');
  lines.push("  const parenOpens = (source.match(/\\(/g) || []).length;");
  lines.push("  const parenCloses = (source.match(/\\)/g) || []).length;");
  lines.push('  if (parenOpens !== parenCloses) {');
  lines.push('    errors.push({ message: `Mismatched parens: ${parenOpens} open, ${parenCloses} close` });');
  lines.push('  }');
  lines.push('');
  lines.push('  // Bracket matching');
  lines.push("  const bracketOpens = (source.match(/\\[/g) || []).length;");
  lines.push("  const bracketCloses = (source.match(/\\]/g) || []).length;");
  lines.push('  if (bracketOpens !== bracketCloses) {');
  lines.push('    errors.push({ message: `Mismatched brackets: ${bracketOpens} open, ${bracketCloses} close` });');
  lines.push('  }');
  lines.push('');
  lines.push(`  // TODO: add ${grammar}-specific keyword checks`);
  lines.push('');
  lines.push('  return { ok: errors.length === 0, errors };');
  lines.push('}');
  lines.push('');

  lines.push('/**');
  lines.push(' * Validate source and throw if invalid (fast heuristic check).');
  lines.push(' */');
  lines.push('export function assertValid(source: string): string {');
  lines.push('  const result = validate(source);');
  lines.push('  if (!result.ok) {');
  lines.push(`    throw new Error(\`Invalid ${grammar} source:\\n\${result.errors.map((e) => e.message).join('\\n')}\\n\\nSource:\\n\${source}\`);`);
  lines.push('  }');
  lines.push('  return source;');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}
