import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ParenthesizedExpression, Yield } from '../types.js';
import { yield_ } from './yield.js';
import type { YieldOptions } from './yield.js';


class ParenthesizedExpressionBuilder extends Builder<ParenthesizedExpression> {
  private _children: Builder<Expression | Yield>[] = [];

  constructor(children: Builder<Expression | Yield>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ParenthesizedExpression {
    return {
      kind: 'parenthesized_expression',
      children: this._children[0]!.build(ctx),
    } as ParenthesizedExpression;
  }

  override get nodeKind(): 'parenthesized_expression' { return 'parenthesized_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { ParenthesizedExpressionBuilder };

export function parenthesized_expression(children: Builder<Expression | Yield>): ParenthesizedExpressionBuilder {
  return new ParenthesizedExpressionBuilder(children);
}

export interface ParenthesizedExpressionOptions {
  nodeKind: 'parenthesized_expression';
  children: Builder<Expression | Yield> | Omit<YieldOptions, 'nodeKind'> | (Builder<Expression | Yield> | Omit<YieldOptions, 'nodeKind'>)[];
}

export namespace parenthesized_expression {
  export function from(input: Omit<ParenthesizedExpressionOptions, 'nodeKind'> | Builder<Expression | Yield> | Omit<YieldOptions, 'nodeKind'> | (Builder<Expression | Yield> | Omit<YieldOptions, 'nodeKind'>)[]): ParenthesizedExpressionBuilder {
    const options: Omit<ParenthesizedExpressionOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ParenthesizedExpressionOptions, 'nodeKind'>
      : { children: input } as Omit<ParenthesizedExpressionOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ParenthesizedExpressionBuilder(_ctor instanceof Builder ? _ctor : yield_.from(_ctor));
    return b;
  }
}
