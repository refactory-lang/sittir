import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, TryExpression } from '../types.js';


class TryBuilder extends Builder<TryExpression> {
  private _children: Builder<Expression>[] = [];

  constructor(children: Builder<Expression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('?');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TryExpression {
    return {
      kind: 'try_expression',
      children: this._children[0]?.build(ctx),
    } as TryExpression;
  }

  override get nodeKind(): string { return 'try_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '?', type: '?' });
    return parts;
  }
}

export type { TryBuilder };

export function try_(children: Builder<Expression>): TryBuilder {
  return new TryBuilder(children);
}

export interface TryExpressionOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace try_ {
  export function from(options: TryExpressionOptions): TryBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new TryBuilder(_ctor);
    return b;
  }
}
