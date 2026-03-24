import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, SequenceExpression, TemplateSubstitution } from '../types.js';
import { sequence_expression } from './sequence-expression.js';
import type { SequenceExpressionOptions } from './sequence-expression.js';


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
      children: this._children[0]!.build(ctx),
    } as TemplateSubstitution;
  }

  override get nodeKind(): 'template_substitution' { return 'template_substitution'; }

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
  nodeKind: 'template_substitution';
  children: Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'> | (Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'>)[];
}

export namespace template_substitution {
  export function from(input: Omit<TemplateSubstitutionOptions, 'nodeKind'> | Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'> | (Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'>)[]): TemplateSubstitutionBuilder {
    const options: Omit<TemplateSubstitutionOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TemplateSubstitutionOptions, 'nodeKind'>
      : { children: input } as Omit<TemplateSubstitutionOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new TemplateSubstitutionBuilder(_ctor instanceof Builder ? _ctor : sequence_expression.from(_ctor));
    return b;
  }
}
