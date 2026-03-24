import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EmptyStatement, Expression, ForStatement, LexicalDeclaration, SequenceExpression, Statement, VariableDeclaration } from '../types.js';
import { sequence_expression } from './sequence-expression.js';
import type { SequenceExpressionOptions } from './sequence-expression.js';
import { lexical_declaration } from './lexical-declaration.js';
import type { LexicalDeclarationOptions } from './lexical-declaration.js';
import { variable_declaration } from './variable-declaration.js';
import type { VariableDeclarationOptions } from './variable-declaration.js';


class ForStatementBuilder extends Builder<ForStatement> {
  private _initializer: Builder<Expression | SequenceExpression | LexicalDeclaration | VariableDeclaration | EmptyStatement>;
  private _condition: Builder<Expression | SequenceExpression | EmptyStatement>[] = [];
  private _increment?: Builder<Expression | SequenceExpression>;
  private _body!: Builder<Statement>;

  constructor(initializer: Builder<Expression | SequenceExpression | LexicalDeclaration | VariableDeclaration | EmptyStatement>) {
    super();
    this._initializer = initializer;
  }

  condition(...value: Builder<Expression | SequenceExpression | EmptyStatement>[]): this {
    this._condition = value;
    return this;
  }

  increment(value: Builder<Expression | SequenceExpression>): this {
    this._increment = value;
    return this;
  }

  body(value: Builder<Statement>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('for');
    parts.push('(');
    if (this._initializer) parts.push(this.renderChild(this._initializer, ctx));
    if (this._condition.length > 0) parts.push(this.renderChildren(this._condition, ', ', ctx));
    if (this._increment) parts.push(this.renderChild(this._increment, ctx));
    parts.push(')');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForStatement {
    return {
      kind: 'for_statement',
      initializer: this._initializer.build(ctx),
      condition: this._condition.map(c => c.build(ctx)),
      increment: this._increment ? this._increment.build(ctx) : undefined,
      body: this._body ? this._body.build(ctx) : undefined,
    } as ForStatement;
  }

  override get nodeKind(): 'for_statement' { return 'for_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'for', type: 'for' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._initializer) parts.push({ kind: 'builder', builder: this._initializer, fieldName: 'initializer' });
    for (const child of this._condition) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'condition' });
    }
    if (this._increment) parts.push({ kind: 'builder', builder: this._increment, fieldName: 'increment' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ForStatementBuilder };

export function for_statement(initializer: Builder<Expression | SequenceExpression | LexicalDeclaration | VariableDeclaration | EmptyStatement>): ForStatementBuilder {
  return new ForStatementBuilder(initializer);
}

export interface ForStatementOptions {
  nodeKind: 'for_statement';
  initializer: Builder<Expression | SequenceExpression | LexicalDeclaration | VariableDeclaration | EmptyStatement> | SequenceExpressionOptions | LexicalDeclarationOptions | VariableDeclarationOptions;
  condition: Builder<Expression | SequenceExpression | EmptyStatement> | string | Omit<SequenceExpressionOptions, 'nodeKind'> | (Builder<Expression | SequenceExpression | EmptyStatement> | string | Omit<SequenceExpressionOptions, 'nodeKind'>)[];
  increment?: Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'>;
  body: Builder<Statement>;
}

export namespace for_statement {
  export function from(options: Omit<ForStatementOptions, 'nodeKind'>): ForStatementBuilder {
    const _raw = options.initializer;
    let _ctor: Builder<Expression | SequenceExpression | LexicalDeclaration | VariableDeclaration | EmptyStatement>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'sequence_expression': _ctor = sequence_expression.from(_raw); break;
        case 'lexical_declaration': _ctor = lexical_declaration.from(_raw); break;
        case 'variable_declaration': _ctor = variable_declaration.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new ForStatementBuilder(_ctor);
    if (options.condition !== undefined) {
      const _v = options.condition;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.condition(..._arr.map(_v => typeof _v === 'string' ? new LeafBuilder('empty_statement', _v) : _v instanceof Builder ? _v : sequence_expression.from(_v)));
    }
    if (options.increment !== undefined) {
      const _v = options.increment;
      b.increment(_v instanceof Builder ? _v : sequence_expression.from(_v));
    }
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
