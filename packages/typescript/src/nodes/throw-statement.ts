import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, SequenceExpression, ThrowStatement } from '../types.js';
import { sequence_expression } from './sequence-expression.js';
import type { SequenceExpressionOptions } from './sequence-expression.js';


class ThrowStatementBuilder extends Builder<ThrowStatement> {
  private _children: Builder<Expression | SequenceExpression>[] = [];

  constructor(children: Builder<Expression | SequenceExpression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('throw');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ThrowStatement {
    return {
      kind: 'throw_statement',
      children: this._children[0]!.build(ctx),
    } as ThrowStatement;
  }

  override get nodeKind(): 'throw_statement' { return 'throw_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'throw', type: 'throw' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ThrowStatementBuilder };

export function throw_statement(children: Builder<Expression | SequenceExpression>): ThrowStatementBuilder {
  return new ThrowStatementBuilder(children);
}

export interface ThrowStatementOptions {
  nodeKind: 'throw_statement';
  children: Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'> | (Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'>)[];
}

export namespace throw_statement {
  export function from(input: Omit<ThrowStatementOptions, 'nodeKind'> | Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'> | (Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'>)[]): ThrowStatementBuilder {
    const options: Omit<ThrowStatementOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ThrowStatementOptions, 'nodeKind'>
      : { children: input } as Omit<ThrowStatementOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ThrowStatementBuilder(_ctor instanceof Builder ? _ctor : sequence_expression.from(_ctor));
    return b;
  }
}
