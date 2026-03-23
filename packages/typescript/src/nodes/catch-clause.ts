import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, CatchClause, Identifier, ObjectPattern, StatementBlock, TypeAnnotation } from '../types.js';
import { type_annotation } from './type-annotation.js';
import type { TypeAnnotationOptions } from './type-annotation.js';
import { statement_block } from './statement-block.js';
import type { StatementBlockOptions } from './statement-block.js';


class CatchClauseBuilder extends Builder<CatchClause> {
  private _parameter?: Builder<ObjectPattern | ArrayPattern | Identifier>;
  private _type?: Builder<TypeAnnotation>;
  private _body: Builder<StatementBlock>;

  constructor(body: Builder<StatementBlock>) {
    super();
    this._body = body;
  }

  parameter(value: Builder<ObjectPattern | ArrayPattern | Identifier>): this {
    this._parameter = value;
    return this;
  }

  type(value: Builder<TypeAnnotation>): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('catch');
    if (this._parameter) {
      parts.push('(');
      if (this._parameter) parts.push(this.renderChild(this._parameter, ctx));
      if (this._type) parts.push(this.renderChild(this._type, ctx));
      parts.push(')');
    }
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): CatchClause {
    return {
      kind: 'catch_clause',
      parameter: this._parameter?.build(ctx),
      type: this._type?.build(ctx),
      body: this._body.build(ctx),
    } as CatchClause;
  }

  override get nodeKind(): string { return 'catch_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'catch', type: 'catch' });
    if (this._parameter) {
      parts.push({ kind: 'token', text: '(', type: '(' });
      if (this._parameter) parts.push({ kind: 'builder', builder: this._parameter, fieldName: 'parameter' });
      if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
      parts.push({ kind: 'token', text: ')', type: ')' });
    }
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { CatchClauseBuilder };

export function catch_clause(body: Builder<StatementBlock>): CatchClauseBuilder {
  return new CatchClauseBuilder(body);
}

export interface CatchClauseOptions {
  parameter?: Builder<ObjectPattern | ArrayPattern | Identifier> | string;
  type?: Builder<TypeAnnotation> | TypeAnnotationOptions;
  body: Builder<StatementBlock> | StatementBlockOptions;
}

export namespace catch_clause {
  export function from(options: CatchClauseOptions): CatchClauseBuilder {
    const _ctor = options.body;
    const b = new CatchClauseBuilder(_ctor instanceof Builder ? _ctor : statement_block.from(_ctor as StatementBlockOptions));
    if (options.parameter !== undefined) {
      const _v = options.parameter;
      b.parameter(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    if (options.type !== undefined) {
      const _v = options.type;
      b.type(_v instanceof Builder ? _v : type_annotation.from(_v as TypeAnnotationOptions));
    }
    return b;
  }
}
