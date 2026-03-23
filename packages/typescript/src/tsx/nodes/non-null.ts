import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, NonNullExpression } from '../types.js';


class NonNullBuilder extends Builder<NonNullExpression> {
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
      children: this._children[0]?.build(ctx),
    } as NonNullExpression;
  }

  override get nodeKind(): string { return 'non_null_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '!', type: '!' });
    return parts;
  }
}

export type { NonNullBuilder };

export function non_null(children: Builder<Expression>): NonNullBuilder {
  return new NonNullBuilder(children);
}

export interface NonNullExpressionOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace non_null {
  export function from(options: NonNullExpressionOptions): NonNullBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new NonNullBuilder(_ctor);
    return b;
  }
}
