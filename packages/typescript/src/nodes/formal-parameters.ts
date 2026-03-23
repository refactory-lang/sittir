import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FormalParameters } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class FormalParametersBuilder extends BaseBuilder<FormalParameters> {
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

  build(ctx?: RenderContext): FormalParameters {
    return {
      kind: 'formal_parameters',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as FormalParameters;
  }

  override get nodeKind(): string { return 'formal_parameters'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function formal_parameters(): FormalParametersBuilder {
  return new FormalParametersBuilder();
}
