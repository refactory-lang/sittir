import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BoundedType, Type, UseBounds } from '../types.js';


class BoundedTypeBuilder extends Builder<BoundedType> {
  private _children: Builder<Type | UseBounds>[] = [];

  constructor(...children: Builder<Type | UseBounds>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('+');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
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
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: '+', type: '+' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { BoundedTypeBuilder };

export function bounded_type(...children: Builder<Type | UseBounds>[]): BoundedTypeBuilder {
  return new BoundedTypeBuilder(...children);
}

export interface BoundedTypeOptions {
  children: Builder<Type | UseBounds> | (Builder<Type | UseBounds>)[];
}

export namespace bounded_type {
  export function from(options: BoundedTypeOptions): BoundedTypeBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new BoundedTypeBuilder(..._arr);
    return b;
  }
}
