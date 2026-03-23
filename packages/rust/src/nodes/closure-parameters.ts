import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ClosureParameters } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ClosureParametersBuilder extends BaseBuilder<ClosureParameters> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ClosureParameters {
    return {
      kind: 'closure_parameters',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ClosureParameters;
  }

  override get nodeKind(): string { return 'closure_parameters'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function closure_parameters(): ClosureParametersBuilder {
  return new ClosureParametersBuilder();
}
