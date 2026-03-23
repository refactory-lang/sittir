import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CallExpression, Decorator, Identifier, MemberExpression, ParenthesizedExpression } from '../types.js';


class DecoratorBuilder extends Builder<Decorator> {
  private _children: Builder<Identifier | MemberExpression | CallExpression | ParenthesizedExpression>[] = [];

  constructor(...children: Builder<Identifier | MemberExpression | CallExpression | ParenthesizedExpression>[]) {
    super();
    this._children = children;
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
      children: this._children.map(c => c.build(ctx)),
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

export function decorator(...children: Builder<Identifier | MemberExpression | CallExpression | ParenthesizedExpression>[]): DecoratorBuilder {
  return new DecoratorBuilder(...children);
}

export interface DecoratorOptions {
  children?: Builder<Identifier | MemberExpression | CallExpression | ParenthesizedExpression> | (Builder<Identifier | MemberExpression | CallExpression | ParenthesizedExpression>)[];
}

export namespace decorator {
  export function from(options: DecoratorOptions): DecoratorBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new DecoratorBuilder(..._arr);
    return b;
  }
}
