import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, Identifier, MutableSpecifier, StaticItem, Type, VisibilityModifier } from '../types.js';


class StaticBuilder extends Builder<StaticItem> {
  private _name: Builder<Identifier>;
  private _type!: Builder<Type>;
  private _value?: Builder<Expression>;
  private _children: Builder<MutableSpecifier | VisibilityModifier>[] = [];

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

  children(...value: Builder<MutableSpecifier | VisibilityModifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('static');
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

  build(ctx?: RenderContext): StaticItem {
    return {
      kind: 'static_item',
      name: this._name.build(ctx),
      type: this._type?.build(ctx),
      value: this._value?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as StaticItem;
  }

  override get nodeKind(): string { return 'static_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'static', type: 'static' });
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

export type { StaticBuilder };

export function static_(name: Builder<Identifier>): StaticBuilder {
  return new StaticBuilder(name);
}

export interface StaticItemOptions {
  name: Builder<Identifier> | string;
  type: Builder<Type>;
  value?: Builder<Expression>;
  children?: Builder<MutableSpecifier | VisibilityModifier> | (Builder<MutableSpecifier | VisibilityModifier>)[];
}

export namespace static_ {
  export function from(options: StaticItemOptions): StaticBuilder {
    const _ctor = options.name;
    const b = new StaticBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
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
