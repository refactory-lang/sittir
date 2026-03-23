import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SelfParameter } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class SelfParameterBuilder extends BaseBuilder<SelfParameter> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SelfParameter {
    return {
      kind: 'self_parameter',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as SelfParameter;
  }

  override get nodeKind(): string { return 'self_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function self_parameter(children: Child[]): SelfParameterBuilder {
  return new SelfParameterBuilder(children);
}
