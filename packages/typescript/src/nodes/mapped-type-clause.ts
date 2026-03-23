import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MappedTypeClause } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class MappedTypeClauseBuilder extends BaseBuilder<MappedTypeClause> {
  private _alias?: Child;
  private _name: Child;
  private _type!: Child;

  constructor(name: Child) {
    super();
    this._name = name;
  }

  alias(value: Child): this {
    this._alias = value;
    return this;
  }

  type(value: Child): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('mapped type');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._alias) parts.push(this.renderChild(this._alias, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MappedTypeClause {
    return {
      kind: 'mapped_type_clause',
      alias: this._alias ? this.renderChild(this._alias, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
    } as unknown as MappedTypeClause;
  }

  override get nodeKind(): string { return 'mapped_type_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'mapped type' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._alias) parts.push({ kind: 'builder', builder: this._alias, fieldName: 'alias' });
    return parts;
  }
}

export function mapped_type_clause(name: Child): MappedTypeClauseBuilder {
  return new MappedTypeClauseBuilder(name);
}
