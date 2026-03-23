import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { OptionalParameter } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class OptionalParameterBuilder extends BaseBuilder<OptionalParameter> {
  private _decorator: Child[] = [];
  private _name?: Child;
  private _pattern?: Child;
  private _type?: Child;
  private _value?: Child;
  private _children: Child[] = [];

  constructor() { super(); }

  decorator(value: Child[]): this {
    this._decorator = value;
    return this;
  }

  name(value: Child): this {
    this._name = value;
    return this;
  }

  pattern(value: Child): this {
    this._pattern = value;
    return this;
  }

  type(value: Child): this {
    this._type = value;
    return this;
  }

  value(value: Child): this {
    this._value = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) {
      parts.push(this.renderChildren(this._children, ' ', ctx));
    }
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    if (this._decorator.length > 0) parts.push(this.renderChildren(this._decorator, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): OptionalParameter {
    return {
      kind: 'optional_parameter',
      decorator: this._decorator.map(c => this.renderChild(c, ctx)),
      name: this._name ? this.renderChild(this._name, ctx) : undefined,
      pattern: this._pattern ? this.renderChild(this._pattern, ctx) : undefined,
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as OptionalParameter;
  }

  override get nodeKind(): string { return 'optional_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    for (const child of this._decorator) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'decorator' });
    }
    return parts;
  }
}

export function optional_parameter(): OptionalParameterBuilder {
  return new OptionalParameterBuilder();
}
