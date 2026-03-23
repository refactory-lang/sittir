import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AccessibilityModifier, Decorator, Expression, OverrideModifier, Pattern, RequiredParameter, This, TypeAnnotation } from '../types.js';
import { decorator } from './decorator.js';
import type { DecoratorOptions } from './decorator.js';
import { type_annotation } from './type-annotation.js';
import type { TypeAnnotationOptions } from './type-annotation.js';


class RequiredParameterBuilder extends Builder<RequiredParameter> {
  private _decorator: Builder<Decorator>[] = [];
  private _pattern: Builder<Pattern | This>;
  private _type?: Builder<TypeAnnotation>;
  private _value?: Builder<Expression>;
  private _children: Builder<AccessibilityModifier | OverrideModifier>[] = [];

  constructor(pattern: Builder<Pattern | This>) {
    super();
    this._pattern = pattern;
  }

  decorator(...value: Builder<Decorator>[]): this {
    this._decorator = value;
    return this;
  }

  type(value: Builder<TypeAnnotation>): this {
    this._type = value;
    return this;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  children(...value: Builder<AccessibilityModifier | OverrideModifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._decorator.length > 0) parts.push(this.renderChildren(this._decorator, ', ', ctx));
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
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
      decorator: this._decorator.map(c => c.build(ctx)),
      pattern: this._pattern.build(ctx),
      type: this._type?.build(ctx),
      value: this._value?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as RequiredParameter;
  }

  override get nodeKind(): string { return 'required_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._decorator) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'decorator' });
    }
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._value) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    }
    return parts;
  }
}

export type { RequiredParameterBuilder };

export function required_parameter(pattern: Builder<Pattern | This>): RequiredParameterBuilder {
  return new RequiredParameterBuilder(pattern);
}

export interface RequiredParameterOptions {
  decorator?: Builder<Decorator> | DecoratorOptions | (Builder<Decorator> | DecoratorOptions)[];
  pattern: Builder<Pattern | This> | string;
  type?: Builder<TypeAnnotation> | TypeAnnotationOptions;
  value?: Builder<Expression>;
  children?: Builder<AccessibilityModifier | OverrideModifier> | (Builder<AccessibilityModifier | OverrideModifier>)[];
}

export namespace required_parameter {
  export function from(options: RequiredParameterOptions): RequiredParameterBuilder {
    const _ctor = options.pattern;
    const b = new RequiredParameterBuilder(typeof _ctor === 'string' ? new LeafBuilder('this', _ctor) : _ctor);
    if (options.decorator !== undefined) {
      const _v = options.decorator;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.decorator(..._arr.map(_v => _v instanceof Builder ? _v : decorator.from(_v as DecoratorOptions)));
    }
    if (options.type !== undefined) {
      const _v = options.type;
      b.type(_v instanceof Builder ? _v : type_annotation.from(_v as TypeAnnotationOptions));
    }
    if (options.value !== undefined) b.value(options.value);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
