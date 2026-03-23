import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BoundedType, Lifetime, Type, UseBounds } from '../types.js';


class BoundedTypeBuilder extends Builder<BoundedType> {
  private _children: Builder<Type | Lifetime | UseBounds>[] = [];

  constructor(...children: Builder<Type | Lifetime | UseBounds>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('+');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): BoundedType {
    return {
      kind: 'bounded_type',
      children: this._children.map(c => c.build(ctx)),
    } as BoundedType;
  }

  override get nodeKind(): string { return 'bounded_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '+', type: '+' });
    return parts;
  }
}

export type { BoundedTypeBuilder };

export function bounded_type(...children: Builder<Type | Lifetime | UseBounds>[]): BoundedTypeBuilder {
  return new BoundedTypeBuilder(...children);
}

export interface BoundedTypeOptions {
  children: Builder<Type | Lifetime | UseBounds> | (Builder<Type | Lifetime | UseBounds>)[];
}

export namespace bounded_type {
  export function from(options: BoundedTypeOptions): BoundedTypeBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new BoundedTypeBuilder(..._arr);
    return b;
  }
}
