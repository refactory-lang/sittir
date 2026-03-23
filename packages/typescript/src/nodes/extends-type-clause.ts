import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExtendsTypeClause } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ExtendsTypeClauseBuilder extends BaseBuilder<ExtendsTypeClause> {
  private _type: Child[] = [];

  constructor(type_: Child[]) {
    super();
    this._type = type_;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('extends type');
    if (this._type.length > 0) parts.push(this.renderChildren(this._type, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExtendsTypeClause {
    return {
      kind: 'extends_type_clause',
      type: this._type.map(c => this.renderChild(c, ctx)),
    } as unknown as ExtendsTypeClause;
  }

  override get nodeKind(): string { return 'extends_type_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'extends type' });
    for (const child of this._type) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'type' });
    }
    return parts;
  }
}

export function extends_type_clause(type_: Child[]): ExtendsTypeClauseBuilder {
  return new ExtendsTypeClauseBuilder(type_);
}
