import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImportRequireClause } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ImportRequireClauseBuilder extends BaseBuilder<ImportRequireClause> {
  private _source: Child;
  private _children: Child[] = [];

  constructor(source: Child) {
    super();
    this._source = source;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('import require');
    if (this._source) parts.push(this.renderChild(this._source, ctx));
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImportRequireClause {
    return {
      kind: 'import_require_clause',
      source: this.renderChild(this._source, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ImportRequireClause;
  }

  override get nodeKind(): string { return 'import_require_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'import require' });
    if (this._source) parts.push({ kind: 'builder', builder: this._source, fieldName: 'source' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function import_require_clause(source: Child): ImportRequireClauseBuilder {
  return new ImportRequireClauseBuilder(source);
}
