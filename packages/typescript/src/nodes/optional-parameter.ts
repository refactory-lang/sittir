import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { AccessibilityModifier, Decorator, Expression, Identifier, OptionalParameter, OverrideModifier, Pattern, This, TypeAnnotation } from '../types.js';
import { decorator } from './decorator.js';
import type { DecoratorOptions } from './decorator.js';
import { type_annotation } from './type-annotation.js';
import type { TypeAnnotationOptions } from './type-annotation.js';


class OptionalParameterBuilder extends Builder<OptionalParameter> {
  private _decorator: Builder<Decorator>[] = [];
  private _pattern?: Builder<Pattern | This>;
  private _type?: Builder<TypeAnnotation>;
  private _value?: Builder<Expression>;
  private _name?: Builder<Identifier>;
  private _children: Builder<AccessibilityModifier | OverrideModifier>[] = [];

  constructor() { super(); }

  decorator(...value: Builder<Decorator>[]): this {
    this._decorator = value;
    return this;
  }

  pattern(value: Builder<Pattern | This>): this {
    this._pattern = value;
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

  name(value: Builder<Identifier>): this {
    this._name = value;
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
      decorator: this._decorator.map(c => c.build(ctx)),
      pattern: this._pattern ? this._pattern.build(ctx) : undefined,
      type: this._type ? this._type.build(ctx) : undefined,
      value: this._value ? this._value.build(ctx) : undefined,
      name: this._name ? this._name.build(ctx) : undefined,
      children: this._children.map(c => c.build(ctx)),
    } as OptionalParameter;
  }

  override get nodeKind(): 'optional_parameter' { return 'optional_parameter'; }

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
  nodeKind: 'optional_parameter';
  decorator?: Builder<Decorator> | Omit<DecoratorOptions, 'nodeKind'> | (Builder<Decorator> | Omit<DecoratorOptions, 'nodeKind'>)[];
  pattern?: Builder<Pattern | This> | string;
  type?: Builder<TypeAnnotation> | Omit<TypeAnnotationOptions, 'nodeKind'>;
  value?: Builder<Expression>;
  name?: Builder<Identifier> | string;
  children?: Builder<AccessibilityModifier | OverrideModifier> | LeafOptions<'accessibility_modifier'> | LeafOptions<'override_modifier'> | (Builder<AccessibilityModifier | OverrideModifier> | LeafOptions<'accessibility_modifier'> | LeafOptions<'override_modifier'>)[];
}

export namespace optional_parameter {
  export function from(options: Omit<OptionalParameterOptions, 'nodeKind'>): OptionalParameterBuilder {
    const b = new OptionalParameterBuilder();
    if (options.decorator !== undefined) {
      const _v = options.decorator;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.decorator(..._arr.map(_v => _v instanceof Builder ? _v : decorator.from(_v)));
    }
    if (options.pattern !== undefined) {
      const _v = options.pattern;
      b.pattern(typeof _v === 'string' ? new LeafBuilder('this', _v) : _v);
    }
    if (options.type !== undefined) {
      const _v = options.type;
      b.type(_v instanceof Builder ? _v : type_annotation.from(_v));
    }
    if (options.value !== undefined) b.value(options.value);
    if (options.name !== undefined) {
      const _v = options.name;
      b.name(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'accessibility_modifier': return new LeafBuilder('accessibility_modifier', (_v as LeafOptions).text!);   case 'override_modifier': return new LeafBuilder('override_modifier', (_v as LeafOptions).text ?? 'override'); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
