import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MutableSpecifier, PointerType, Type } from '../types.js';


class PointerTypeBuilder extends Builder<PointerType> {
  private _type: Builder<Type>;
  private _children: Builder<MutableSpecifier>[] = [];

  constructor(type_: Builder<Type>) {
    super();
    this._type = type_;
  }

  children(...value: Builder<MutableSpecifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('*');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): PointerType {
    return {
      kind: 'pointer_type',
      type: this._type.build(ctx),
      children: this._children[0]?.build(ctx),
    } as PointerType;
  }

  override get nodeKind(): string { return 'pointer_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '*', type: '*' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { PointerTypeBuilder };

export function pointer_type(type_: Builder<Type>): PointerTypeBuilder {
  return new PointerTypeBuilder(type_);
}

export interface PointerTypeOptions {
  type: Builder<Type>;
  children?: Builder<MutableSpecifier> | string | (Builder<MutableSpecifier> | string)[];
}

export namespace pointer_type {
  export function from(options: PointerTypeOptions): PointerTypeBuilder {
    const b = new PointerTypeBuilder(options.type);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => typeof _x === 'string' ? new LeafBuilder('mutable_specifier', _x) : _x));
    }
    return b;
  }
}
