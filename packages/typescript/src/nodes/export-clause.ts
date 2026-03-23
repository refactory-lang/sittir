import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExportClause } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ExportClauseBuilder extends BaseBuilder<ExportClause> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('export');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExportClause {
    return {
      kind: 'export_clause',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ExportClause;
  }

  override get nodeKind(): string { return 'export_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'export' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function export_clause(): ExportClauseBuilder {
  return new ExportClauseBuilder();
}
