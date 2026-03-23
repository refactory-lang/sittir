import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { VisibilityModifier } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class VisibilityModifierBuilder extends BaseBuilder<VisibilityModifier> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): VisibilityModifier {
    return {
      kind: 'visibility_modifier',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as VisibilityModifier;
  }

  override get nodeKind(): string { return 'visibility_modifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function visibility_modifier(): VisibilityModifierBuilder {
  return new VisibilityModifierBuilder();
}
