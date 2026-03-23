import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MutableSpecifier, Parameter, Pattern, Self, Type } from '../types.js';


class ParameterBuilder extends Builder<Parameter> {
  private _pattern: Builder;
  private _type!: Builder;
  private _children: Builder[] = [];

  constructor(pattern: Builder) {
    super();
    this._pattern = pattern;
  }

  type(value: Builder): this {
    this._type = value;
    return this;
  }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
    parts.push(':');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Parameter {
    return {
      kind: 'parameter',
      pattern: this.renderChild(this._pattern, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as Parameter;
  }

  override get nodeKind(): string { return 'parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { ParameterBuilder };

export function parameter(pattern: Builder): ParameterBuilder {
  return new ParameterBuilder(pattern);
}

export interface ParameterOptions {
  pattern: Builder<Pattern | Self>;
  type: Builder<Type>;
  children?: Builder<MutableSpecifier> | string | (Builder<MutableSpecifier> | string)[];
}

export namespace parameter {
  export function from(options: ParameterOptions): ParameterBuilder {
    const b = new ParameterBuilder(options.pattern);
    if (options.type !== undefined) b.type(options.type);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => typeof _x === 'string' ? new LeafBuilder('mutable_specifier', _x) : _x));
    }
    return b;
  }
}
