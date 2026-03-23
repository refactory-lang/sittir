import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ContinueStatement, StatementIdentifier } from '../types.js';


class ContinueStatementBuilder extends Builder<ContinueStatement> {
  private _label?: Builder<StatementIdentifier>;

  constructor() { super(); }

  label(value: Builder<StatementIdentifier>): this {
    this._label = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('continue');
    if (this._label) parts.push(this.renderChild(this._label, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ContinueStatement {
    return {
      kind: 'continue_statement',
      label: this._label?.build(ctx),
    } as ContinueStatement;
  }

  override get nodeKind(): string { return 'continue_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'continue', type: 'continue' });
    if (this._label) parts.push({ kind: 'builder', builder: this._label, fieldName: 'label' });
    return parts;
  }
}

export type { ContinueStatementBuilder };

export function continue_statement(): ContinueStatementBuilder {
  return new ContinueStatementBuilder();
}

export interface ContinueStatementOptions {
  label?: Builder<StatementIdentifier> | string;
}

export namespace continue_statement {
  export function from(options: ContinueStatementOptions): ContinueStatementBuilder {
    const b = new ContinueStatementBuilder();
    if (options.label !== undefined) {
      const _v = options.label;
      b.label(typeof _v === 'string' ? new LeafBuilder('statement_identifier', _v) : _v);
    }
    return b;
  }
}
