import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AsExpression, Expression, Type } from '../types.js';


class AsExpressionBuilder extends Builder<AsExpression> {
  private _children: Builder<Expression | Type>[] = [];

  constructor(...children: Builder<Expression | Type>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('as');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AsExpression {
    return {
      kind: 'as_expression',
      children: this._children.map(c => c.build(ctx)),
    } as AsExpression;
  }

  override get nodeKind(): 'as_expression' { return 'as_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: 'as', type: 'as' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { AsExpressionBuilder };

export function as_expression(...children: Builder<Expression | Type>[]): AsExpressionBuilder {
  return new AsExpressionBuilder(...children);
}

export interface AsExpressionOptions {
  nodeKind: 'as_expression';
  children?: Builder<Expression | Type> | (Builder<Expression | Type>)[];
}

export namespace as_expression {
  export function from(input: Omit<AsExpressionOptions, 'nodeKind'> | Builder<Expression | Type> | (Builder<Expression | Type>)[]): AsExpressionBuilder {
    const options: Omit<AsExpressionOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<AsExpressionOptions, 'nodeKind'>
      : { children: input } as Omit<AsExpressionOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new AsExpressionBuilder(..._arr);
    return b;
  }
}
