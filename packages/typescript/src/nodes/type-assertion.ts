import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeAssertion } from '../types.js';


class TypeAssertionBuilder extends BaseBuilder<TypeAssertion> {
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

  build(ctx?: RenderContext): TypeAssertion {
    return {
      kind: 'type_assertion',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TypeAssertion;
  }

  override get nodeKind(): string { return 'type_assertion'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function type_assertion(children: BaseBuilder[]): TypeAssertionBuilder {
  return new TypeAssertionBuilder(children);
}
