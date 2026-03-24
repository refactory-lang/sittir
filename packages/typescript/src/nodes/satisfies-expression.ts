import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, SatisfiesExpression, Type } from '../types.js';


class SatisfiesExpressionBuilder extends Builder<SatisfiesExpression> {
  private _children: Builder<Expression | Type>[] = [];

  constructor(...children: Builder<Expression | Type>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('satisfies');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SatisfiesExpression {
    return {
      kind: 'satisfies_expression',
      children: this._children.map(c => c.build(ctx)),
    } as SatisfiesExpression;
  }

  override get nodeKind(): 'satisfies_expression' { return 'satisfies_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: 'satisfies', type: 'satisfies' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { SatisfiesExpressionBuilder };

export function satisfies_expression(...children: Builder<Expression | Type>[]): SatisfiesExpressionBuilder {
  return new SatisfiesExpressionBuilder(...children);
}

export interface SatisfiesExpressionOptions {
  nodeKind: 'satisfies_expression';
  children?: Builder<Expression | Type> | (Builder<Expression | Type>)[];
}

export namespace satisfies_expression {
  export function from(input: Omit<SatisfiesExpressionOptions, 'nodeKind'> | Builder<Expression | Type> | (Builder<Expression | Type>)[]): SatisfiesExpressionBuilder {
    const options: Omit<SatisfiesExpressionOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<SatisfiesExpressionOptions, 'nodeKind'>
      : { children: input } as Omit<SatisfiesExpressionOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new SatisfiesExpressionBuilder(..._arr);
    return b;
  }
}
