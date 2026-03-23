import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MutableSpecifier, Pattern, VariadicParameter } from '../types.js';


class VariadicParameterBuilder extends Builder<VariadicParameter> {
  private _pattern?: Builder<Pattern>;
  private _children: Builder<MutableSpecifier>[] = [];

  constructor() { super(); }

  pattern(value: Builder<Pattern>): this {
    this._pattern = value;
    return this;
  }

  children(...value: Builder<MutableSpecifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._pattern) {
      if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
      parts.push(':');
    }
    parts.push('...');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): VariadicParameter {
    return {
      kind: 'variadic_parameter',
      pattern: this._pattern?.build(ctx),
      children: this._children[0]?.build(ctx),
    } as VariadicParameter;
  }

  override get nodeKind(): string { return 'variadic_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._pattern) {
      if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
      parts.push({ kind: 'token', text: ':', type: ':' });
    }
    parts.push({ kind: 'token', text: '...', type: '...' });
    return parts;
  }
}

export type { VariadicParameterBuilder };

export function variadic_parameter(): VariadicParameterBuilder {
  return new VariadicParameterBuilder();
}

export interface VariadicParameterOptions {
  pattern?: Builder<Pattern>;
  children?: Builder<MutableSpecifier> | string | (Builder<MutableSpecifier> | string)[];
}

export namespace variadic_parameter {
  export function from(options: VariadicParameterOptions): VariadicParameterBuilder {
    const b = new VariadicParameterBuilder();
    if (options.pattern !== undefined) b.pattern(options.pattern);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => typeof _x === 'string' ? new LeafBuilder('mutable_specifier', _x) : _x));
    }
    return b;
  }
}
