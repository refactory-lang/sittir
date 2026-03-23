import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AmbientDeclaration } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class AmbientBuilder extends BaseBuilder<AmbientDeclaration> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('declare');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AmbientDeclaration {
    return {
      kind: 'ambient_declaration',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as AmbientDeclaration;
  }

  override get nodeKind(): string { return 'ambient_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'declare', type: 'declare' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function ambient(children: Child[]): AmbientBuilder {
  return new AmbientBuilder(children);
}
