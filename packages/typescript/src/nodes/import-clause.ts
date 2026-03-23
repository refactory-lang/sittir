import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImportClause } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ImportClauseBuilder extends BaseBuilder<ImportClause> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('import');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
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
    parts.push({ kind: 'token', text: 'import' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function import_clause(children: Child[]): ImportClauseBuilder {
  return new ImportClauseBuilder(children);
}
