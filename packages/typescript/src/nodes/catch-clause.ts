import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, CatchClause, Identifier, ObjectPattern, StatementBlock, TypeAnnotation } from '../types.js';
import { object_pattern } from './object-pattern.js';
import type { ObjectPatternOptions } from './object-pattern.js';
import { array_pattern } from './array-pattern.js';
import type { ArrayPatternOptions } from './array-pattern.js';
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
      parameter: this._parameter ? this._parameter.build(ctx) : undefined,
      type: this._type ? this._type.build(ctx) : undefined,
      body: this._body.build(ctx),
    } as CatchClause;
  }

  override get nodeKind(): 'catch_clause' { return 'catch_clause'; }

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
  nodeKind: 'catch_clause';
  parameter?: Builder<ObjectPattern | ArrayPattern | Identifier> | string | ObjectPatternOptions | ArrayPatternOptions;
  type?: Builder<TypeAnnotation> | Omit<TypeAnnotationOptions, 'nodeKind'>;
  body: Builder<StatementBlock> | Omit<StatementBlockOptions, 'nodeKind'>;
}

export namespace catch_clause {
  export function from(options: Omit<CatchClauseOptions, 'nodeKind'>): CatchClauseBuilder {
    const _ctor = options.body;
    const b = new CatchClauseBuilder(_ctor instanceof Builder ? _ctor : statement_block.from(_ctor));
    if (options.parameter !== undefined) {
      const _v = options.parameter;
      if (typeof _v === 'string') {
        b.parameter(new LeafBuilder('identifier', _v));
      } else if (_v instanceof Builder) {
        b.parameter(_v);
      } else {
        switch (_v.nodeKind) {
          case 'object_pattern': b.parameter(object_pattern.from(_v)); break;
          case 'array_pattern': b.parameter(array_pattern.from(_v)); break;
        }
      }
    }
    if (options.type !== undefined) {
      const _v = options.type;
      b.type(_v instanceof Builder ? _v : type_annotation.from(_v));
    }
    return b;
  }
}
