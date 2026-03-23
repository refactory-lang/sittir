import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { VariableDeclaration } from '../types.js';


class VariableBuilder extends BaseBuilder<VariableDeclaration> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('var');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): VariableDeclaration {
    return {
      kind: 'variable_declaration',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as VariableDeclaration;
  }

  override get nodeKind(): string { return 'variable_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'var', type: 'var' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function variable(children: BaseBuilder[]): VariableBuilder {
  return new VariableBuilder(children);
}
