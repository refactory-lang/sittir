import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DoStatement, ParenthesizedExpression, Statement } from '../types.js';
import { parenthesized_expression } from './parenthesized-expression.js';
import type { ParenthesizedExpressionOptions } from './parenthesized-expression.js';


class DoStatementBuilder extends Builder<DoStatement> {
  private _body: Builder<Statement>;
  private _condition!: Builder<ParenthesizedExpression>;

  constructor(body: Builder<Statement>) {
    super();
    this._body = body;
  }

  condition(value: Builder<ParenthesizedExpression>): this {
    this._condition = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('do');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    parts.push('while');
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DoStatement {
    return {
      kind: 'do_statement',
      body: this._body.build(ctx),
      condition: this._condition ? this._condition.build(ctx) : undefined,
    } as DoStatement;
  }

  override get nodeKind(): 'do_statement' { return 'do_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'do', type: 'do' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    parts.push({ kind: 'token', text: 'while', type: 'while' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    return parts;
  }
}

export type { DoStatementBuilder };

export function do_statement(body: Builder<Statement>): DoStatementBuilder {
  return new DoStatementBuilder(body);
}

export interface DoStatementOptions {
  nodeKind: 'do_statement';
  body: Builder<Statement>;
  condition: Builder<ParenthesizedExpression> | Omit<ParenthesizedExpressionOptions, 'nodeKind'>;
}

export namespace do_statement {
  export function from(options: Omit<DoStatementOptions, 'nodeKind'>): DoStatementBuilder {
    const b = new DoStatementBuilder(options.body);
    if (options.condition !== undefined) {
      const _v = options.condition;
      b.condition(_v instanceof Builder ? _v : parenthesized_expression.from(_v));
    }
    return b;
  }
}
