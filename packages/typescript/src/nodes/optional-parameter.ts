import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AccessibilityModifier, Decorator, Expression, Identifier, OptionalParameter, OverrideModifier, Pattern, This, TypeAnnotation } from '../types.js';


class OptionalParameterBuilder extends Builder<OptionalParameter> {
  private _decorator: Builder[] = [];
  private _name?: Builder;
  private _pattern?: Builder;
  private _type?: Builder;
  private _value?: Builder;
  private _children: Builder[] = [];

  constructor() { super(); }

  decorator(...value: Builder[]): this {
    this._decorator = value;
    return this;
  }

  name(value: Builder): this {
    this._name = value;
    return this;
  }

  pattern(value: Builder): this {
    this._pattern = value;
    return this;
  }

  type(value: Builder): this {
    this._type = value;
    return this;
  }

  value(value: Builder): this {
    this._value = value;
    return this;
  }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._decorator.length > 0) parts.push(this.renderChildren(this._decorator, ', ', ctx));
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
    parts.push('?');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._value) {
      parts.push('=');
      if (this._value) parts.push(this.renderChild(this._value, ctx));
    }
    if (this._name) parts.push(this.renderChild(this._name, ctx));
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
    for (const child of this._decorator) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'decorator' });
    }
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    parts.push({ kind: 'token', text: '?', type: '?' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._value) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    }
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    return parts;
  }
}

export type { OptionalParameterBuilder };

export function optional_parameter(): OptionalParameterBuilder {
  return new OptionalParameterBuilder();
}

export interface OptionalParameterOptions {
  decorator?: Builder<Decorator> | (Builder<Decorator>)[];
  name?: Builder<Identifier> | string;
  pattern?: Builder<Pattern | This>;
  type?: Builder<TypeAnnotation>;
  value?: Builder<Expression>;
  children?: Builder<AccessibilityModifier | OverrideModifier> | (Builder<AccessibilityModifier | OverrideModifier>)[];
}

export namespace optional_parameter {
  export function from(options: OptionalParameterOptions): OptionalParameterBuilder {
    const b = new OptionalParameterBuilder();
    if (options.decorator !== undefined) {
      const _v = options.decorator;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.decorator(..._arr);
    }
    if (options.name !== undefined) {
      const _v = options.name;
      b.name(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    if (options.pattern !== undefined) b.pattern(options.pattern);
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
