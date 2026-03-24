import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, NonNullExpression } from '../types.js';


class NonNullExpressionBuilder extends Builder<NonNullExpression> {
  private _children: Builder<Expression>[] = [];

  constructor(children: Builder<Expression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('!');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NonNullExpression {
    return {
      kind: 'non_null_expression',
      children: this._children[0]!.build(ctx),
    } as NonNullExpression;
  }

  override get nodeKind(): 'non_null_expression' { return 'non_null_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '!', type: '!' });
    return parts;
  }
}

export type { NonNullExpressionBuilder };

export function non_null_expression(children: Builder<Expression>): NonNullExpressionBuilder {
  return new NonNullExpressionBuilder(children);
}

export interface NonNullExpressionOptions {
  nodeKind: 'non_null_expression';
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace non_null_expression {
  export function from(input: Omit<NonNullExpressionOptions, 'nodeKind'> | Builder<Expression> | (Builder<Expression>)[]): NonNullExpressionBuilder {
    const options: Omit<NonNullExpressionOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<NonNullExpressionOptions, 'nodeKind'>
      : { children: input } as Omit<NonNullExpressionOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new NonNullExpressionBuilder(_ctor);
    return b;
  }
}
