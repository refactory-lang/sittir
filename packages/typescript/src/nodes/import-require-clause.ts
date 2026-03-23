import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImportRequireClause } from '../types.js';


class ImportRequireClauseBuilder extends BaseBuilder<ImportRequireClause> {
  private _source: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(source: BaseBuilder) {
    super();
    this._source = source;
  }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('=');
    parts.push('require');
    parts.push('(');
    if (this._source) parts.push(this.renderChild(this._source, ctx));
    parts.push(')');
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '=', type: '=' });
    parts.push({ kind: 'token', text: 'require', type: 'require' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._source) parts.push({ kind: 'builder', builder: this._source, fieldName: 'source' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export function import_require_clause(source: BaseBuilder): ImportRequireClauseBuilder {
  return new ImportRequireClauseBuilder(source);
}
