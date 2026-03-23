import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MappedTypeClause, TypeIdentifier } from '../types.js';


class MappedTypeClauseBuilder extends Builder<MappedTypeClause> {
  private _alias?: Builder;
  private _name: Builder;
  private _type!: Builder;

  constructor(name: Builder) {
    super();
    this._name = name;
  }

  alias(value: Builder): this {
    this._alias = value;
    return this;
  }

  type(value: Builder): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    parts.push('in');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._alias) {
      parts.push('as');
      if (this._alias) parts.push(this.renderChild(this._alias, ctx));
    }
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
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    parts.push({ kind: 'token', text: 'in', type: 'in' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._alias) {
      parts.push({ kind: 'token', text: 'as', type: 'as' });
      if (this._alias) parts.push({ kind: 'builder', builder: this._alias, fieldName: 'alias' });
    }
    return parts;
  }
}

export type { MappedTypeClauseBuilder };

export function mapped_type_clause(name: Builder): MappedTypeClauseBuilder {
  return new MappedTypeClauseBuilder(name);
}

export interface MappedTypeClauseOptions {
  alias?: Builder;
  name: Builder<TypeIdentifier> | string;
  type: Builder;
}

export namespace mapped_type_clause {
  export function from(options: MappedTypeClauseOptions): MappedTypeClauseBuilder {
    const _ctor = options.name;
    const b = new MappedTypeClauseBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.alias !== undefined) b.alias(options.alias);
    if (options.type !== undefined) b.type(options.type);
    return b;
  }
}
