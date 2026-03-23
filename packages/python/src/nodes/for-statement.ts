import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, ElseClause, Expression, ExpressionList, ForStatement, Pattern, PatternList } from '../types.js';


class ForStatementBuilder extends Builder<ForStatement> {
  private _alternative?: Builder<ElseClause>;
  private _body!: Builder<Block>;
  private _left: Builder<Pattern | PatternList>;
  private _right!: Builder<Expression | ExpressionList>;

  constructor(left: Builder<Pattern | PatternList>) {
    super();
    this._left = left;
  }

  alternative(value: Builder<ElseClause>): this {
    this._alternative = value;
    return this;
  }

  body(value: Builder<Block>): this {
    this._body = value;
    return this;
  }

  right(value: Builder<Expression | ExpressionList>): this {
    this._right = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('for');
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    parts.push('in');
    if (this._right) parts.push(this.renderChild(this._right, ctx));
    parts.push(':');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    if (this._alternative) parts.push(this.renderChild(this._alternative, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForStatement {
    return {
      kind: 'for_statement',
      alternative: this._alternative?.build(ctx),
      body: this._body?.build(ctx),
      left: this._left.build(ctx),
      right: this._right?.build(ctx),
    } as ForStatement;
  }

  override get nodeKind(): string { return 'for_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'for', type: 'for' });
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    parts.push({ kind: 'token', text: 'in', type: 'in' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    if (this._alternative) parts.push({ kind: 'builder', builder: this._alternative, fieldName: 'alternative' });
    return parts;
  }
}

export type { ForStatementBuilder };

export function for_statement(left: Builder<Pattern | PatternList>): ForStatementBuilder {
  return new ForStatementBuilder(left);
}

export interface ForStatementOptions {
  alternative?: Builder<ElseClause>;
  body: Builder<Block>;
  left: Builder<Pattern | PatternList>;
  right: Builder<Expression | ExpressionList>;
}

export namespace for_statement {
  export function from(options: ForStatementOptions): ForStatementBuilder {
    const b = new ForStatementBuilder(options.left);
    if (options.alternative !== undefined) b.alternative(options.alternative);
    if (options.body !== undefined) b.body(options.body);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
