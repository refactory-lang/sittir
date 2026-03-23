import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SelfParameter } from '../types.js';


class SelfParameterBuilder extends BaseBuilder<SelfParameter> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
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

export function self_parameter(children: BaseBuilder[]): SelfParameterBuilder {
  return new SelfParameterBuilder(children);
}
