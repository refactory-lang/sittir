import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeParameters } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TypeParametersBuilder extends BaseBuilder<TypeParameters> {
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

  build(ctx?: RenderContext): TypeParameters {
    return {
      kind: 'type_parameters',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TypeParameters;
  }

  override get nodeKind(): string { return 'type_parameters'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function type_parameters(children: Child[]): TypeParametersBuilder {
  return new TypeParametersBuilder(children);
}
