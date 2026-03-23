import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConstItem } from '../types.js';


class ConstBuilder extends BaseBuilder<ConstItem> {
  private _name: BaseBuilder;
  private _type!: BaseBuilder;
  private _value?: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(name: BaseBuilder) {
    super();
    this._name = name;
  }

  type(value: BaseBuilder): this {
    this._type = value;
    return this;
  }

  value(value: BaseBuilder): this {
    this._value = value;
    return this;
  }

  children(value: BaseBuilder[]): this {
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
      name: this.renderChild(this._name, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ConstItem;
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

export function const_(name: BaseBuilder): ConstBuilder {
  return new ConstBuilder(name);
}
