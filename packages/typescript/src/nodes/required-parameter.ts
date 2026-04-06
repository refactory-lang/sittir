import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { RequiredParameter } from '../types.js';


class RequiredParameterBuilder extends BaseBuilder<RequiredParameter> {
  private _decorator: BaseBuilder[] = [];
  private _name?: BaseBuilder;
  private _pattern?: BaseBuilder;
  private _type?: BaseBuilder;
  private _value?: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor() { super(); }

  decorator(value: BaseBuilder[]): this {
    this._decorator = value;
    return this;
  }

  name(value: BaseBuilder): this {
    this._name = value;
    return this;
  }

  pattern(value: BaseBuilder): this {
    this._pattern = value;
    return this;
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
    if (this._decorator.length > 0) parts.push(this.renderChildren(this._decorator, ', ', ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._value) {
      parts.push('=');
      if (this._value) parts.push(this.renderChild(this._value, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RequiredParameter {
    return {
      kind: 'required_parameter',
      decorator: this._decorator.map(c => this.renderChild(c, ctx)),
      name: this._name ? this.renderChild(this._name, ctx) : undefined,
      pattern: this._pattern ? this.renderChild(this._pattern, ctx) : undefined,
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as RequiredParameter;
  }

  override get nodeKind(): string { return 'required_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._decorator) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'decorator' });
    }
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._value) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    }
    return parts;
  }
}

export function required_parameter(): RequiredParameterBuilder {
  return new RequiredParameterBuilder();
}
