import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, SequenceExpression, TemplateSubstitution } from '../types.js';


class TemplateSubstitutionBuilder extends Builder<TemplateSubstitution> {
  private _children: Builder<Expression | SequenceExpression>[] = [];

  constructor(children: Builder<Expression | SequenceExpression>) {
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
      children: this._children[0]?.build(ctx),
    } as TemplateSubstitution;
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

export type { TemplateSubstitutionBuilder };

export function template_substitution(children: Builder<Expression | SequenceExpression>): TemplateSubstitutionBuilder {
  return new TemplateSubstitutionBuilder(children);
}

export interface TemplateSubstitutionOptions {
  children: Builder<Expression | SequenceExpression> | (Builder<Expression | SequenceExpression>)[];
}

export namespace template_substitution {
  export function from(options: TemplateSubstitutionOptions): TemplateSubstitutionBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new TemplateSubstitutionBuilder(_ctor);
    return b;
  }
}
