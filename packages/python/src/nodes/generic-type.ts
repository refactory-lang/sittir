import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenericType, Identifier, TypeParameter } from '../types.js';


class GenericTypeBuilder extends Builder<GenericType> {
  private _children: Builder<Identifier | TypeParameter>[] = [];

  constructor(...children: Builder<Identifier | TypeParameter>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GenericType {
    return {
      kind: 'generic_type',
      children: this._children.map(c => c.build(ctx)),
    } as GenericType;
  }

  override get nodeKind(): string { return 'generic_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { GenericTypeBuilder };

export function generic_type(...children: Builder<Identifier | TypeParameter>[]): GenericTypeBuilder {
  return new GenericTypeBuilder(...children);
}

export interface GenericTypeOptions {
  children: Builder<Identifier | TypeParameter> | (Builder<Identifier | TypeParameter>)[];
}

export namespace generic_type {
  export function from(options: GenericTypeOptions): GenericTypeBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new GenericTypeBuilder(..._arr);
    return b;
  }
}
