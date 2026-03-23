import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TemplateSubstitution } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TemplateSubstitutionBuilder extends BaseBuilder<TemplateSubstitution> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TemplateSubstitution {
    return {
      kind: 'template_substitution',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TemplateSubstitution;
  }

  override get nodeKind(): string { return 'template_substitution'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function template_substitution(children: Child): TemplateSubstitutionBuilder {
  return new TemplateSubstitutionBuilder(children);
}
