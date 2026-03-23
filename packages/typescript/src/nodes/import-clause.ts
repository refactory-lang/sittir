import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImportClause } from '../types.js';


class ImportClauseBuilder extends BaseBuilder<ImportClause> {
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

  build(ctx?: RenderContext): ImportClause {
    return {
      kind: 'import_clause',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ImportClause;
  }

  override get nodeKind(): string { return 'import_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function import_clause(children: BaseBuilder[]): ImportClauseBuilder {
  return new ImportClauseBuilder(children);
}
