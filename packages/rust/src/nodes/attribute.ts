import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Attribute } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class AttributeBuilder extends BaseBuilder<Attribute> {
  private _arguments?: Child;
  private _value?: Child;
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  arguments(value: Child): this {
    this._arguments = value;
    return this;
  }

  value(value: Child): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    if (this._arguments) parts.push(this.renderChild(this._arguments, ctx));
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Attribute {
    return {
      kind: 'attribute',
      arguments: this._arguments ? this.renderChild(this._arguments, ctx) : undefined,
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as Attribute;
  }

  override get nodeKind(): string { return 'attribute'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    if (this._arguments) parts.push({ kind: 'builder', builder: this._arguments, fieldName: 'arguments' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function attribute(children: Child): AttributeBuilder {
  return new AttributeBuilder(children);
}
