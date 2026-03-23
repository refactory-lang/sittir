import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConstItem, Expression, Identifier, Type, VisibilityModifier } from '../types.js';


class ConstBuilder extends Builder<ConstItem> {
  private _name: Builder<Identifier>;
  private _type!: Builder<Type>;
  private _value?: Builder<Expression>;
  private _children: Builder<VisibilityModifier>[] = [];

  constructor(name: Builder<Identifier>) {
    super();
    this._name = name;
  }

  type(value: Builder<Type>): this {
    this._type = value;
    return this;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  children(...value: Builder<VisibilityModifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('const');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push(':');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._value) {
      parts.push('=');
      if (this._value) parts.push(this.renderChild(this._value, ctx));
    }
    parts.push(';');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ConstItem {
    return {
      kind: 'const_item',
      name: this._name.build(ctx),
      type: this._type?.build(ctx),
      value: this._value?.build(ctx),
      children: this._children[0]?.build(ctx),
    } as ConstItem;
  }

  override get nodeKind(): string { return 'const_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'const', type: 'const' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._value) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    }
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export type { ConstBuilder };

export function const_(name: Builder<Identifier>): ConstBuilder {
  return new ConstBuilder(name);
}

export interface ConstItemOptions {
  name: Builder<Identifier> | string;
  type: Builder<Type>;
  value?: Builder<Expression>;
  children?: Builder<VisibilityModifier> | (Builder<VisibilityModifier>)[];
}

export namespace const_ {
  export function from(options: ConstItemOptions): ConstBuilder {
    const _ctor = options.name;
    const b = new ConstBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.type !== undefined) b.type(options.type);
    if (options.value !== undefined) b.value(options.value);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
