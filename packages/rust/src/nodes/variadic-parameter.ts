import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { VariadicParameter } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class VariadicParameterBuilder extends BaseBuilder<VariadicParameter> {
  private _pattern?: Child;
  private _children: Child[] = [];

  constructor() { super(); }

  pattern(value: Child): this {
    this._pattern = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
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
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function variadic_parameter(): VariadicParameterBuilder {
  return new VariadicParameterBuilder();
}
