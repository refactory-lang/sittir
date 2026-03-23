import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ExpressionStatement, SequenceExpression } from '../types.js';


class ExpressionStatementBuilder extends Builder<ExpressionStatement> {
  private _children: Builder<Expression | SequenceExpression>[] = [];

  constructor(...children: Builder<Expression | SequenceExpression>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExpressionStatement {
    return {
      kind: 'expression_statement',
      children: this._children.map(c => c.build(ctx)),
    } as ExpressionStatement;
  }

  override get nodeKind(): string { return 'expression_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ExpressionStatementBuilder };

export function expression_statement(...children: Builder<Expression | SequenceExpression>[]): ExpressionStatementBuilder {
  return new ExpressionStatementBuilder(...children);
}

export interface ExpressionStatementOptions {
  children?: Builder<Expression | SequenceExpression> | (Builder<Expression | SequenceExpression>)[];
}

export namespace expression_statement {
  export function from(options: ExpressionStatementOptions): ExpressionStatementBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ExpressionStatementBuilder(..._arr);
    return b;
  }
}
