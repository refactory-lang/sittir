import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Lifetime, MutableSpecifier, ReferenceType, Type } from '../types.js';


class ReferenceTypeBuilder extends Builder<ReferenceType> {
  private _type: Builder<Type>;
  private _children: Builder<Lifetime | MutableSpecifier>[] = [];

  constructor(type_: Builder<Type>) {
    super();
    this._type = type_;
  }

  children(...value: Builder<Lifetime | MutableSpecifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('&');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ReferenceType {
    return {
      kind: 'reference_type',
      type: this._type.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as ReferenceType;
  }

  override get nodeKind(): string { return 'reference_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '&', type: '&' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { ReferenceTypeBuilder };

export function reference_type(type_: Builder<Type>): ReferenceTypeBuilder {
  return new ReferenceTypeBuilder(type_);
}

export interface ReferenceTypeOptions {
  type: Builder<Type>;
  children?: Builder<Lifetime | MutableSpecifier> | (Builder<Lifetime | MutableSpecifier>)[];
}

export namespace reference_type {
  export function from(options: ReferenceTypeOptions): ReferenceTypeBuilder {
    const b = new ReferenceTypeBuilder(options.type);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
