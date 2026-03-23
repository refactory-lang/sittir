import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CallExpression, Decorator, Identifier, MemberExpression, ParenthesizedExpression } from '../types.js';


class DecoratorBuilder extends Builder<Decorator> {
  private _children: Builder<CallExpression | Identifier | MemberExpression | ParenthesizedExpression>[] = [];

  constructor(children: Builder<CallExpression | Identifier | MemberExpression | ParenthesizedExpression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('@');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Decorator {
    return {
      kind: 'decorator',
      children: this._children[0]?.build(ctx),
    } as Decorator;
  }

  override get nodeKind(): string { return 'decorator'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '@', type: '@' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { DecoratorBuilder };

export function decorator(children: Builder<CallExpression | Identifier | MemberExpression | ParenthesizedExpression>): DecoratorBuilder {
  return new DecoratorBuilder(children);
}

export interface DecoratorOptions {
  children: Builder<CallExpression | Identifier | MemberExpression | ParenthesizedExpression> | (Builder<CallExpression | Identifier | MemberExpression | ParenthesizedExpression>)[];
}

export namespace decorator {
  export function from(options: DecoratorOptions): DecoratorBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new DecoratorBuilder(_ctor);
    return b;
  }
}
