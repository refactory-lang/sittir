import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ExpressionStatement, SequenceExpression } from '../types.js';
import { sequence_expression } from './sequence-expression.js';
import type { SequenceExpressionOptions } from './sequence-expression.js';


class ExpressionStatementBuilder extends Builder<ExpressionStatement> {
  private _children: Builder<Expression | SequenceExpression>[] = [];

  constructor(children: Builder<Expression | SequenceExpression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExpressionStatement {
    return {
      kind: 'expression_statement',
      children: this._children[0]!.build(ctx),
    } as ExpressionStatement;
  }

  override get nodeKind(): 'expression_statement' { return 'expression_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ExpressionStatementBuilder };

export function expression_statement(children: Builder<Expression | SequenceExpression>): ExpressionStatementBuilder {
  return new ExpressionStatementBuilder(children);
}

export interface ExpressionStatementOptions {
  nodeKind: 'expression_statement';
  children: Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'> | (Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'>)[];
}

export namespace expression_statement {
  export function from(input: Omit<ExpressionStatementOptions, 'nodeKind'> | Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'> | (Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'>)[]): ExpressionStatementBuilder {
    const options: Omit<ExpressionStatementOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ExpressionStatementOptions, 'nodeKind'>
      : { children: input } as Omit<ExpressionStatementOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ExpressionStatementBuilder(_ctor instanceof Builder ? _ctor : sequence_expression.from(_ctor));
    return b;
  }
}
