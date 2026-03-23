import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LabeledStatement, Statement, StatementIdentifier } from '../types.js';


class LabeledBuilder extends Builder<LabeledStatement> {
  private _body: Builder<Statement>;
  private _label!: Builder<StatementIdentifier>;

  constructor(body: Builder<Statement>) {
    super();
    this._body = body;
  }

  label(value: Builder<StatementIdentifier>): this {
    this._label = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    if (this._label) parts.push(this.renderChild(this._label, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LabeledStatement {
    return {
      kind: 'labeled_statement',
      body: this._body.build(ctx),
      label: this._label?.build(ctx),
    } as LabeledStatement;
  }

  override get nodeKind(): string { return 'labeled_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    if (this._label) parts.push({ kind: 'builder', builder: this._label, fieldName: 'label' });
    return parts;
  }
}

export type { LabeledBuilder };

export function labeled(body: Builder<Statement>): LabeledBuilder {
  return new LabeledBuilder(body);
}

export interface LabeledStatementOptions {
  body: Builder<Statement>;
  label: Builder<StatementIdentifier> | string;
}

export namespace labeled {
  export function from(options: LabeledStatementOptions): LabeledBuilder {
    const b = new LabeledBuilder(options.body);
    if (options.label !== undefined) {
      const _v = options.label;
      b.label(typeof _v === 'string' ? new LeafBuilder('statement_identifier', _v) : _v);
    }
    return b;
  }
}
