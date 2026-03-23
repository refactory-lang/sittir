import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { VariadicParameter } from '../types.js';


class VariadicParameterBuilder extends BaseBuilder<VariadicParameter> {
  private _pattern?: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor() { super(); }

  pattern(value: BaseBuilder): this {
    this._pattern = value;
    return this;
  }

  children(value: BaseBuilder[]): this {
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
      pattern: this._pattern ? this.renderChild(this._pattern, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as VariadicParameter;
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

export function variadic_parameter(): VariadicParameterBuilder {
  return new VariadicParameterBuilder();
}
