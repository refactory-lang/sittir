import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TemplateSubstitution } from '../types.js';


class TemplateSubstitutionBuilder extends BaseBuilder<TemplateSubstitution> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('${');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
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
    parts.push({ kind: 'token', text: '${', type: '${' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export function template_substitution(children: BaseBuilder): TemplateSubstitutionBuilder {
  return new TemplateSubstitutionBuilder(children);
}
